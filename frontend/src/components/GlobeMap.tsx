import { useCallback, useMemo, useState } from "react";
import Globe from "react-globe.gl";
import CountryModal from "./CountryModal";
import UserProfilePanel from "./UserProfilePanel";
import type { CountryFeature, CountryWithGeometry } from "../types/country";
import { countryVisitKey } from "../lib/visitCountryKey";
import { buildGlobePolygonsData } from "../lib/geo/crimeaReassign";
import { useCountriesData } from "../hooks/useCountriesData";
import { useChoroplethScale } from "../hooks/useChoroplethScale";
import { useGlobeVisitState } from "../hooks/useGlobeVisitState";

export default function GlobeMap() {
  const countries = useCountriesData();
  const [hoverD, setHoverD] = useState<CountryFeature | undefined>();
  const [isUserPlanet, setIsUserPlanet] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryWithGeometry | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const { visitedCountries, visitEpoch, toggleCountryVisited } = useGlobeVisitState(
    countries.features
  );

  const { getVal, colorScale } = useChoroplethScale(countries.features);

  const polygonsData = useMemo(
    () => buildGlobePolygonsData(countries.features),
    [countries.features]
  );

  const polygonCapColor = useCallback(
    (d: object) => {
      const feat = d as CountryFeature;
      const code = countryVisitKey(feat.properties);
      const isVisited = visitedCountries.has(code);
      if (isUserPlanet) {
        if (isVisited) return "#4a9eff";
        return d === hoverD ? "#94c5ff" : "#ffffff";
      }
      if (d === hoverD) return "steelblue";
      return colorScale(getVal(feat));
    },
    [visitedCountries, isUserPlanet, hoverD, colorScale, getVal]
  );

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
        polygonCapColor={polygonCapColor}
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
        onPolygonHover={(polygon: object | null) => {
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
        onClick={() => {
          setIsUserPlanet((prev) => {
            const next = !prev;
            if (!next) setProfileOpen(false);
            return next;
          });
        }}
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
