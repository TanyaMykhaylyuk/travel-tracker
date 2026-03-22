import { useCallback, useEffect, useMemo, useState } from "react";
import Globe from "react-globe.gl";
import CountryModal from "./CountryModal";
import { scaleSequentialSqrt } from "d3-scale";
import { interpolateYlOrRd } from "d3-scale-chromatic";
import type {
  CountryFeature,
  CountriesData,
  CountryWithGeometry,
  PolygonCoords,
} from "../types/country";

const VISITED_COUNTRIES_KEY = "travel-tracker-visited-countries";

function getVisitedCountries(): Set<string> {
  try {
    const stored = localStorage.getItem(VISITED_COUNTRIES_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function saveVisitedCountries(visited: Set<string>) {
  localStorage.setItem(VISITED_COUNTRIES_KEY, JSON.stringify([...visited]));
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
  const [visitedCountries, setVisitedCountries] = useState<Set<string>>(getVisitedCountries);

  const toggleCountryVisited = useCallback((code: string) => {
    setVisitedCountries((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      saveVisitedCountries(next);
      return next;
    });
  }, []);

  useEffect(() => {
    fetch("/datasets/ne_110m_admin_0_countries.geojson")
      .then((res) => res.json())
      .then((data: CountriesData) => setCountries(data))
      .catch(() => setCountries({ features: [] }));
  }, []);

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
          const code = feat.properties.ISO_A2;
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
          onClose={() => setSelectedCountry(null)}
          isCountryVisited={visitedCountries.has(selectedCountry.properties.ISO_A2)}
          onToggleCountryVisited={() =>
            toggleCountryVisited(selectedCountry.properties.ISO_A2)
          }
        />
      )}
    </div>
  );
}