import { useCallback, useEffect, useMemo, useState } from "react";
import Globe from "react-globe.gl";
import CountryModal from "./CountryModal";
import UserProfilePanel from "./UserProfilePanel";
import { scaleSequentialSqrt } from "d3-scale";
import { interpolateYlOrRd } from "d3-scale-chromatic";
import type {
  CountryFeature,
  CountriesData,
  CountryWithGeometry,
  PolygonCoords,
} from "../types/country";
import { countryVisitKey } from "../lib/visitCountryKey";
import {
  getVisitedCountriesSet,
  saveVisitedCountriesSet,
} from "../lib/visitStorage";
import {
  applyServerVisitsToStorage,
  fetchUser,
  getStoredUserId,
  setStoredUserId,
  syncVisitsToServer,
} from "../lib/userApi";

function migrateVisitedCountriesIsoToAdm0(
  features: CountryFeature[],
  stored: Set<string>
): Set<string> {
  const admSet = new Set(features.map((f) => f.properties.ADM0_A3));
  const isoToAdm = new Map<string, string>();
  for (const f of features) {
    const iso = f.properties.ISO_A2;
    const adm = f.properties.ADM0_A3;
    if (/^[A-Za-z]{2}$/.test(iso)) {
      isoToAdm.set(iso.toUpperCase(), adm);
    }
  }
  const next = new Set<string>();
  for (const key of stored) {
    if (admSet.has(key)) {
      next.add(key);
      continue;
    }
    if (/^[A-Za-z]{2}$/.test(key)) {
      const adm = isoToAdm.get(key.toUpperCase());
      if (adm) next.add(adm);
    }
  }
  return next;
}

const getPolygonBounds = (polygon: PolygonCoords) => {
  const ring = polygon[0] ?? [];
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;

  for (const [lon, lat] of ring) {
    minLon = Math.min(minLon, lon);
    minLat = Math.min(minLat, lat);
    maxLon = Math.max(maxLon, lon);
    maxLat = Math.max(maxLat, lat);
  }

  return { minLon, minLat, maxLon, maxLat };
};

const isCrimeaPolygon = (polygon: PolygonCoords) => {
  const { minLon, minLat, maxLon, maxLat } = getPolygonBounds(polygon);
  return minLon >= 32 && maxLon <= 38.5 && minLat >= 44 && maxLat <= 48.5;
};

export default function GlobeMap() {
  const [countries, setCountries] = useState<CountriesData>({ features: [] });
  const [hoverD, setHoverD] = useState<CountryFeature | undefined>();
  const [isUserPlanet, setIsUserPlanet] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryWithGeometry | null>(null);
  const [visitedCountries, setVisitedCountries] = useState<Set<string>>(getVisitedCountriesSet);
  const [visitEpoch, setVisitEpoch] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (!isUserPlanet) setProfileOpen(false);
  }, [isUserPlanet]);

  useEffect(() => {
    const id = getStoredUserId();
    if (!id) return;
    let cancelled = false;
    fetchUser(id)
      .then((user) => {
        if (cancelled) return;
        applyServerVisitsToStorage(user);
        setVisitedCountries(new Set(user.visitedCountries));
        setVisitEpoch((e) => e + 1);
      })
      .catch(() => {
        setStoredUserId(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleCountryVisited = useCallback((code: string) => {
    setVisitedCountries((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      saveVisitedCountriesSet(next);
      const uid = getStoredUserId();
      if (uid) {
        void syncVisitsToServer(uid).catch(() => {});
      }
      return next;
    });
  }, []);

  useEffect(() => {
    async function loadCountries() {
      try {
        const res = await fetch("/api/countries");
        if (res.ok) {
          const data = (await res.json()) as Partial<CountriesData>;
          if (Array.isArray(data.features)) {
            setCountries({ features: data.features });
            return;
          }
        }
      } catch {}

      try {
        const local = await fetch("/datasets/ne_110m_admin_0_countries.geojson");
        const data = (await local.json()) as Partial<CountriesData>;
        setCountries({ features: Array.isArray(data.features) ? data.features : [] });
      } catch {
        setCountries({ features: [] });
      }
    }

    void loadCountries();
  }, []);

  useEffect(() => {
    if (!countries.features.length) return;
    setVisitedCountries((prev) => {
      const migrated = migrateVisitedCountriesIsoToAdm0(countries.features, prev);
      if (migrated.size === prev.size && [...migrated].every((k) => prev.has(k))) {
        return prev;
      }
      saveVisitedCountriesSet(migrated);
      return migrated;
    });
  }, [countries.features]);

  const getVal = (feat: CountryFeature) =>
    feat.properties.GDP_MD_EST / Math.max(1e5, feat.properties.POP_EST);

  const maxVal = useMemo(() => {
    const values = countries.features.map(getVal).filter(Number.isFinite);
    return values.length ? Math.max(...values) : 1;
  }, [countries]);

  const colorScale = scaleSequentialSqrt(interpolateYlOrRd).domain([0, maxVal]);
  const polygonsData = useMemo(() => {
    const base = countries.features.filter((feature) => feature.properties.ISO_A2 !== "AQ");
    const features = base.map((feature) => ({ ...(feature as CountryWithGeometry) }));

    const russia = features.find((feature) => feature.properties.ISO_A2 === "RU");
    const ukraine = features.find((feature) => feature.properties.ISO_A2 === "UA");

    if (!russia || !ukraine || russia.geometry.type !== "MultiPolygon") {
      return base;
    }

    const crimeaIndex = russia.geometry.coordinates.findIndex(isCrimeaPolygon);
    if (crimeaIndex === -1) {
      return base;
    }

    const crimeaPolygon = russia.geometry.coordinates[crimeaIndex];
    const updatedRussiaCoords = russia.geometry.coordinates.filter((_, idx) => idx !== crimeaIndex);

    russia.geometry = {
      type: "MultiPolygon",
      coordinates: updatedRussiaCoords,
    };

    if (ukraine.geometry.type === "Polygon") {
      ukraine.geometry = {
        type: "MultiPolygon",
        coordinates: [ukraine.geometry.coordinates, crimeaPolygon],
      };
    } else {
      ukraine.geometry = {
        type: "MultiPolygon",
        coordinates: [...ukraine.geometry.coordinates, crimeaPolygon],
      };
    }

    return features;
  }, [countries.features]);

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        backgroundColor: "#000",
      }}
    >
      <Globe
        globeImageUrl="https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png"
        backgroundColor="#000"
        showGlobe
        showAtmosphere
        atmosphereColor="lightskyblue"
        atmosphereAltitude={0.15}
        showGraticules
        lineHoverPrecision={0}
        polygonsData={polygonsData}
        polygonAltitude={(d: object) => (d === hoverD ? 0.06 : 0.01)}
        polygonCapColor={(d: object) => {
          const feat = d as CountryFeature;
          const code = countryVisitKey(feat.properties);
          const isVisited = visitedCountries.has(code);
          if (isUserPlanet) {
            if (isVisited) return "#4a9eff";
            return d === hoverD ? "#94c5ff" : "#ffffff";
          }
          if (d === hoverD) return "steelblue";
          return colorScale(getVal(feat));
        }}
        polygonSideColor={() =>
          isUserPlanet ? "rgba(255, 255, 255, 0.3)" : "rgba(30, 30, 30, 0.15)"
        }
        polygonStrokeColor={() =>
          isUserPlanet ? "rgba(200, 220, 255, 0.5)" : "rgba(0, 0, 0, 0.4)"
        }
        polygonLabel={(d: object) => {
          const feat = d as CountryFeature;
          const props = feat.properties;
          return `
          <div>
            <div><b>${props.ADMIN} (${props.ISO_A2}):</b></div>
            <div>GDP: <i>${props.GDP_MD_EST}</i> M$</div>
            <div>Population: <i>${props.POP_EST}</i></div>
          </div>
        `;
        }}
        onPolygonHover={(polygon: object | null, _prevPolygon: object | null) => {
          if (!polygon) {
            setHoverD(undefined);
            return;
          }
          setHoverD(polygon as CountryFeature);
        }}
        onPolygonClick={(polygon: object) => {
          if (isUserPlanet) {
            setSelectedCountry(polygon as CountryWithGeometry);
          }
        }}
        polygonsTransitionDuration={300}
      />
      {isUserPlanet && (
        <>
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            className="absolute right-6 top-6 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-slate-700 bg-slate-900/90 text-slate-200 shadow-lg backdrop-blur-sm transition hover:bg-slate-800 hover:text-white"
            aria-label="Open profile"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
          <UserProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} />
        </>
      )}
      <button
        type="button"
        onClick={() => setIsUserPlanet((prev) => !prev)}
        style={{
          position: "absolute",
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: "50%",
          backgroundColor: "#0ea5e9",
          boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
          border: "none",
          cursor: "pointer",
        }}
        aria-label={isUserPlanet ? "Show default globe" : "Show my globe"}
      />
      {selectedCountry && (
        <CountryModal
          country={selectedCountry}
          visitEpoch={visitEpoch}
          onClose={() => setSelectedCountry(null)}
          isCountryVisited={visitedCountries.has(
            countryVisitKey(selectedCountry.properties)
          )}
          onToggleCountryVisited={() =>
            toggleCountryVisited(countryVisitKey(selectedCountry.properties))
          }
        />
      )}
    </div>
  );
}