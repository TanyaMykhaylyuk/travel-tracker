import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Globe, { type GlobeProps } from "react-globe.gl";
import { Button } from "@/components/ui/button";
import CountryModal from "./CountryModal";
import { TripInterestingFacts } from "./CountryModal/TripInterestingFacts";
import { TripSuggestionModal } from "./CountryModal/TripSuggestionModal";
import UserProfilePanel from "./UserProfilePanel";
import type { CountryFeature, CountryWithGeometry } from "../types/country";
import { countryVisitKey } from "../lib/visitCountryKey";
import { buildGlobePolygonsData } from "../lib/geo/crimeaReassign";
import { getGlobeMetallicCapMaterial, tickGlobeMetallicCapMaterials } from "../lib/globeMetallicCapMaterial";
import { useCountriesData } from "../hooks/useCountriesData";
import { useGlobeVisitState } from "../hooks/useGlobeVisitState";
import {
  DEFAULT_VISITED_COUNTRY_COLOR,
  hasAnyVisitedLandmarkForCountry,
  isFancyShaderCountryFill,
  resolveGlobeCountryFill,
} from "../lib/visitStorage";

function isNorthBrazilCoastalFragment(feature: CountryFeature): boolean {
  const geometry = (feature as CountryWithGeometry).geometry;
  if (!geometry) return false;
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  for (const polygon of polygons) {
    const ring = polygon[0] ?? [];
    if (!ring.length) continue;
    let minLon = Infinity;
    let maxLon = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;
    for (const [lon, lat] of ring) {
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    }
    if (minLon >= -56 && maxLon <= -50 && minLat >= 1 && maxLat <= 7) {
      return true;
    }
  }
  return false;
}

export default function GlobeMap() {
  const countries = useCountriesData();
  const globeRef = useRef<any>(null);
  const [hoverD, setHoverD] = useState<CountryFeature | undefined>();
  const [isUserPlanet, setIsUserPlanet] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryWithGeometry | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isFindingTrip, setIsFindingTrip] = useState(false);
  const [tripResultCountry, setTripResultCountry] = useState<CountryFeature | null>(null);
  const [isTripBlinkOn, setIsTripBlinkOn] = useState(false);
  const [isTripSuggestionOpen, setIsTripSuggestionOpen] = useState(false);
  const [tripRevealNonce, setTripRevealNonce] = useState(0);

  const {
    visitedCountries,
    visitedLandmarks,
    countryFillColors,
    visitEpoch,
    visitsSyncReady,
    handleCountryVisitToggle,
    refreshLandmarksFromStorage,
    setVisitCountryFillColor,
    resetVisitCountryFillColor,
  } = useGlobeVisitState(countries.features);

  const polygonsData = useMemo(
    () => buildGlobePolygonsData(countries.features),
    [countries.features]
  );

  const hasMetallicOnGlobe = useMemo(() => {
    if (!isUserPlanet) return false;
    return Object.values(countryFillColors).some((c) => isFancyShaderCountryFill(c));
  }, [isUserPlanet, countryFillColors]);

  const availableTripCountries = useMemo(
    () =>
      polygonsData.filter((country) => {
        const code = countryVisitKey(country.properties);
        return !(
          visitedCountries.has(code) || hasAnyVisitedLandmarkForCountry(code, visitedLandmarks)
        );
      }),
    [polygonsData, visitedCountries, visitedLandmarks]
  );

  useEffect(() => {
    if (!hasMetallicOnGlobe) return;
    let frame = 0;
    const loop = () => {
      tickGlobeMetallicCapMaterials(performance.now() / 1000);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [hasMetallicOnGlobe]);

  const polygonCapMaterial = useCallback(
    (d: object) => {
      if (!isUserPlanet) return undefined;
      const feat = d as CountryFeature;
      if (isNorthBrazilCoastalFragment(feat)) return undefined;
      const code = countryVisitKey(feat.properties);
      const isVisited =
        visitedCountries.has(code) || hasAnyVisitedLandmarkForCountry(code, visitedLandmarks);
      if (!isVisited) return undefined;
      const stored = countryFillColors[code];
      if (stored && isFancyShaderCountryFill(stored)) {
        return getGlobeMetallicCapMaterial(stored);
      }
      return undefined;
    },
    [isUserPlanet, visitedCountries, visitedLandmarks, countryFillColors],
  );

  const polygonCapColor = useCallback(
    (d: object) => {
      const feat = d as CountryFeature;
      const isTripCountry = tripResultCountry === feat;
      const code = countryVisitKey(feat.properties);
      const isVisited =
        visitedCountries.has(code) || hasAnyVisitedLandmarkForCountry(code, visitedLandmarks);
      if (isUserPlanet && isTripCountry && isTripBlinkOn) {
        return "#67e8f9";
      }
      if (isUserPlanet && isTripCountry) {
        return "#94c5ff";
      }
      if (isUserPlanet) {
        if (isNorthBrazilCoastalFragment(feat)) {
          return "#ffffff";
        }
        if (isVisited) {
          const stored = countryFillColors[code];
          return stored ? resolveGlobeCountryFill(stored) : DEFAULT_VISITED_COUNTRY_COLOR;
        }
        return d === hoverD ? "#94c5ff" : "#ffffff";
      }
      if (d === hoverD) return "rgba(200, 220, 255, 0.22)";
      return "rgba(0, 0, 0, 0)";
    },
    [visitedCountries, visitedLandmarks, countryFillColors, isUserPlanet, hoverD, tripResultCountry, isTripBlinkOn]
  );

  const polygonSideColor = useCallback(
    (d: object) => {
      if (!isUserPlanet) return "rgba(0, 0, 0, 0)";
      if (tripResultCountry === (d as CountryFeature) && isTripBlinkOn) {
        return "rgba(103, 232, 249, 0.95)";
      }
      if (tripResultCountry === (d as CountryFeature)) {
        return "rgba(148, 197, 255, 0.72)";
      }
      return "rgba(255, 255, 255, 0.3)";
    },
    [isUserPlanet, tripResultCountry, isTripBlinkOn]
  );

  const polygonStrokeColor = useCallback(
    (d: object) => {
      if (isUserPlanet) {
        if (tripResultCountry === (d as CountryFeature)) {
          return isTripBlinkOn ? "rgba(224, 242, 254, 0.95)" : "rgba(186, 230, 253, 0.55)";
        }
        if (d === hoverD) {
          return "rgba(15, 23, 42, 0.95)";
        }
        return "rgba(15, 23, 42, 0.78)";
      }
      if (d === hoverD) return "rgba(255, 255, 255, 0.5)";
      return "rgba(0, 0, 0, 0)";
    },
    [isUserPlanet, hoverD, tripResultCountry, isTripBlinkOn]
  );

  useEffect(() => {
    if (!tripResultCountry) {
      setIsTripBlinkOn(false);
      return;
    }
    setIsTripBlinkOn(true);
    const blinkTimer = window.setInterval(() => {
      setIsTripBlinkOn((prev) => !prev);
    }, 230);
    const openModalTimer = window.setTimeout(() => {
      setIsTripSuggestionOpen(true);
    }, 500);
    return () => {
      window.clearInterval(blinkTimer);
      window.clearTimeout(openModalTimer);
    };
  }, [tripResultCountry]);

  const closeTripSuggestion = useCallback(() => {
    setIsTripSuggestionOpen(false);
    setTripResultCountry(null);
    setHoverD(undefined);
    setIsTripBlinkOn(false);
  }, []);

  const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

  const getReadyGlobe = async (attempts = 14, delayMs = 90): Promise<any | null> => {
    for (let i = 0; i < attempts; i += 1) {
      const globe = globeRef.current;
      if (globe?.pointOfView) return globe;
      await wait(delayMs);
    }
    return null;
  };

  const collectLngLatPairs = (coords: unknown, out: Array<[number, number]>) => {
    if (!Array.isArray(coords) || coords.length === 0) return;
    const first = coords[0];
    const second = coords[1];
    if (typeof first === "number" && typeof second === "number") {
      out.push([first, second]);
      return;
    }
    for (const part of coords) {
      collectLngLatPairs(part, out);
    }
  };

  const getCountryFocusPoint = (country: CountryFeature): { lat: number; lng: number } => {
    const points: Array<[number, number]> = [];
    collectLngLatPairs((country as any)?.geometry?.coordinates, points);
    if (points.length === 0) return { lat: 0, lng: 0 };

    let minLng = Number.POSITIVE_INFINITY;
    let maxLng = Number.NEGATIVE_INFINITY;
    let minLat = Number.POSITIVE_INFINITY;
    let maxLat = Number.NEGATIVE_INFINITY;

    for (const [lng, lat] of points) {
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    }

    if (
      !Number.isFinite(minLng) ||
      !Number.isFinite(maxLng) ||
      !Number.isFinite(minLat) ||
      !Number.isFinite(maxLat)
    ) {
      return { lat: 0, lng: 0 };
    }

    return {
      lat: Math.max(-82, Math.min(82, (minLat + maxLat) / 2)),
      lng: (minLng + maxLng) / 2,
    };
  };

  const handleFindNextTrip = useCallback(async () => {
    if (isFindingTrip) return;
    if (availableTripCountries.length === 0) return;

    setIsFindingTrip(true);
    try {
      if (!isUserPlanet) {
        setIsUserPlanet(true);
        await wait(260);
      }

      const globe = await getReadyGlobe();
      if (!globe) return;

      const controls = globe.controls?.();
      const spinDurationMs = 1400;
      const focusDurationMs = 1100;

      if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 5.2;
      }
      await wait(spinDurationMs);
      if (controls) {
        controls.autoRotate = false;
      }

      const randomIndex = Math.floor(Math.random() * availableTripCountries.length);
      const randomCountry = availableTripCountries[randomIndex] as CountryFeature | undefined;
      if (randomCountry) {
        const focusPoint = getCountryFocusPoint(randomCountry);
        const modalOffsetLng = 22;

        globe.pointOfView(
          {
            lat: focusPoint.lat,
            lng: focusPoint.lng + modalOffsetLng,
            alt: 1.75,
          },
          focusDurationMs
        );
        await wait(focusDurationMs + 40);
        setTripRevealNonce((n) => n + 1);
        setTripResultCountry(randomCountry);
        setHoverD(randomCountry);
      }
    } finally {
      setIsFindingTrip(false);
    }
  }, [isFindingTrip, isUserPlanet, availableTripCountries]);

  return (
    <div
      className="dark"
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        backgroundColor: "#000",
      }}
    >
      <Globe
        ref={globeRef}
        globeImageUrl="https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png"
        backgroundColor="#000"
        animateIn={false}
        waitForGlobeReady
        globeCurvatureResolution={3}
        showGlobe
        showAtmosphere
        atmosphereColor="rgba(135, 206, 250, 0.85)"
        atmosphereAltitude={0.12}
        showGraticules={false}
        lineHoverPrecision={0}
        polygonsData={polygonsData}
        polygonAltitude={(d: object) =>
          isUserPlanet
            ? d === tripResultCountry
              ? 0.085
              : d === hoverD
                ? 0.06
                : 0.01
            : d === hoverD
              ? 0.02
              : 0.004
        }
        polygonCapColor={polygonCapColor}
        polygonCapMaterial={
          polygonCapMaterial as unknown as NonNullable<GlobeProps["polygonCapMaterial"]>
        }
        polygonSideColor={polygonSideColor}
        polygonStrokeColor={polygonStrokeColor}
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
        onPolygonHover={(polygon: object | null) => {
          if (isFindingTrip) return;
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
        polygonsTransitionDuration={500}
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
      {isUserPlanet && (
        <Button
          type="button"
          className="absolute bottom-20 right-6 z-20 rounded-full border border-cyan-300/70 bg-slate-950/80 px-5 py-2 text-cyan-100 shadow-[0_0_8px_rgba(34,211,238,0.8),0_0_20px_rgba(56,189,248,0.45),inset_0_0_12px_rgba(34,211,238,0.35)] transition hover:border-cyan-200 hover:text-white hover:shadow-[0_0_12px_rgba(34,211,238,0.95),0_0_28px_rgba(56,189,248,0.6),inset_0_0_14px_rgba(125,211,252,0.5)] disabled:cursor-wait disabled:opacity-80"
          onClick={() => void handleFindNextTrip()}
          disabled={isFindingTrip || availableTripCountries.length === 0}
          aria-label="Find my next trip"
        >
          {isFindingTrip
            ? "Finding…"
            : availableTripCountries.length === 0
              ? "All countries visited"
              : "Find My Next Trip"}
        </Button>
      )}
      <Button
        type="button"
        variant="outline"
        className="absolute bottom-6 right-6 z-20 shadow-lg text-foreground"
        onClick={() => {
          setIsUserPlanet((prev) => {
            const next = !prev;
            if (!next) setProfileOpen(false);
            return next;
          });
        }}
        aria-label={isUserPlanet ? "Show default globe" : "Show my globe"}
      >
        {isUserPlanet ? "Globe" : "My Travel Globe"}
      </Button>
      {selectedCountry && (
        <CountryModal
          country={selectedCountry}
          visitEpoch={visitEpoch}
          visitsSyncReady={visitsSyncReady}
          onClose={() => setSelectedCountry(null)}
          isCountryVisited={
            visitedCountries.has(countryVisitKey(selectedCountry.properties)) ||
            hasAnyVisitedLandmarkForCountry(
              countryVisitKey(selectedCountry.properties),
              visitedLandmarks
            )
          }
          onToggleCountryVisited={() =>
            handleCountryVisitToggle(countryVisitKey(selectedCountry.properties))
          }
          onLandmarksChanged={refreshLandmarksFromStorage}
          countryFillColor={countryFillColors[countryVisitKey(selectedCountry.properties)]}
          onCountryFillColorChange={(hex) =>
            setVisitCountryFillColor(countryVisitKey(selectedCountry.properties), hex)
          }
          onCountryFillColorReset={() =>
            resetVisitCountryFillColor(countryVisitKey(selectedCountry.properties))
          }
        />
      )}
      {tripResultCountry && (
        <TripInterestingFacts
          tripResetKey={`${countryVisitKey(tripResultCountry.properties)}-${tripRevealNonce}`}
          countryName={tripResultCountry.properties.ADMIN}
        />
      )}
      {isTripSuggestionOpen && tripResultCountry && (
        <TripSuggestionModal
          country={tripResultCountry}
          onClose={closeTripSuggestion}
        />
      )}
    </div>
  );
}
