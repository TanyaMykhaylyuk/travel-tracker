import { useCallback, useEffect, useState } from "react";
import type { CountryFeature } from "../types/country";
import { migrateVisitedCountriesIsoToAdm0 } from "../lib/geo/migrateVisitedCountriesIsoToAdm0";
import {
  clearLandmarksForCountry,
  DEFAULT_VISITED_COUNTRY_COLOR,
  getCountryFillColors,
  getVisitedCountriesSet,
  getVisitedLandmarksSet,
  hasAnyVisitedLandmarkForCountry,
  isFancyShaderCountryFill,
  isHexCountryFill,
  isPlainMetalCountryFill,
  pruneCountryFillColors,
  removeCountryFillColor,
  saveCountryFillColors,
  saveVisitedCountriesSet,
} from "../lib/visitStorage";
import {
  getStoredUserId,
  syncVisitsToServer,
  VISITS_REFRESH_EVENT,
} from "../lib/userApi";
import { useBootstrapUserVisits } from "./useBootstrapUserVisits";

export function useGlobeVisitState(features: CountryFeature[]) {
  const [visitedCountries, setVisitedCountries] = useState<Set<string>>(getVisitedCountriesSet);
  const [visitedLandmarks, setVisitedLandmarks] = useState<Set<string>>(getVisitedLandmarksSet);
  const [countryFillColors, setCountryFillColors] = useState<Record<string, string>>(getCountryFillColors);
  const [visitEpoch, setVisitEpoch] = useState(0);

  const handleSynced = useCallback((next: Set<string>) => {
    setVisitedCountries(next);
    setVisitedLandmarks(getVisitedLandmarksSet());
    pruneCountryFillColors();
    setCountryFillColors(getCountryFillColors());
    setVisitEpoch((e) => e + 1);
  }, []);

  const refreshLandmarksFromStorage = useCallback(() => {
    setVisitedLandmarks(getVisitedLandmarksSet());
    pruneCountryFillColors();
    setCountryFillColors(getCountryFillColors());
    setVisitEpoch((e) => e + 1);
  }, []);

  const setVisitCountryFillColor = useCallback((key: string, color: string) => {
    let stored: string;
    if (isFancyShaderCountryFill(color) || isPlainMetalCountryFill(color)) {
      stored = color;
    } else if (isHexCountryFill(color)) {
      stored = `#${color.replace(/^#/, "").toLowerCase()}`;
    } else {
      stored = DEFAULT_VISITED_COUNTRY_COLOR;
    }
    const next = { ...getCountryFillColors(), [key]: stored };
    saveCountryFillColors(next);
    setCountryFillColors(next);
    setVisitEpoch((e) => e + 1);
    const uid = getStoredUserId();
    if (uid) {
      void syncVisitsToServer(uid).catch(() => {});
    }
  }, []);

  const resetVisitCountryFillColor = useCallback((key: string) => {
    removeCountryFillColor(key);
    setCountryFillColors(getCountryFillColors());
    setVisitEpoch((e) => e + 1);
    const uid = getStoredUserId();
    if (uid) {
      void syncVisitsToServer(uid).catch(() => {});
    }
  }, []);

  const visitsSyncReady = useBootstrapUserVisits(handleSynced);

  useEffect(() => {
    function onVisitsRefresh() {
      setVisitedCountries(new Set(getVisitedCountriesSet()));
      setVisitedLandmarks(new Set(getVisitedLandmarksSet()));
      pruneCountryFillColors();
      setCountryFillColors(getCountryFillColors());
      setVisitEpoch((e) => e + 1);
    }
    window.addEventListener(VISITS_REFRESH_EVENT, onVisitsRefresh);
    return () => window.removeEventListener(VISITS_REFRESH_EVENT, onVisitsRefresh);
  }, []);

  const handleCountryVisitToggle = useCallback(
    (code: string) => {
      if (!visitsSyncReady) return;
      const countries = getVisitedCountriesSet();
      const landmarks = getVisitedLandmarksSet();
      const effective =
        countries.has(code) || hasAnyVisitedLandmarkForCountry(code, landmarks);

      if (effective) {
        const nextCountries = new Set(countries);
        nextCountries.delete(code);
        saveVisitedCountriesSet(nextCountries);
        clearLandmarksForCountry(code);
        removeCountryFillColor(code);
        setVisitedCountries(nextCountries);
        setVisitedLandmarks(getVisitedLandmarksSet());
        setCountryFillColors(getCountryFillColors());
        setVisitEpoch((e) => e + 1);
        const uid = getStoredUserId();
        if (uid) {
          void syncVisitsToServer(uid).catch(() => {});
        }
        return;
      }

      const nextCountries = new Set(countries);
      nextCountries.add(code);
      saveVisitedCountriesSet(nextCountries);
      setVisitedCountries(nextCountries);
      setVisitEpoch((e) => e + 1);
      const uid = getStoredUserId();
      if (uid) {
        void syncVisitsToServer(uid).catch(() => {});
      }
    },
    [visitsSyncReady]
  );

  useEffect(() => {
    if (!features.length) return;
    queueMicrotask(() => {
      setVisitedCountries((prev) => {
        const migrated = migrateVisitedCountriesIsoToAdm0(features, prev);
        if (migrated.size === prev.size && [...migrated].every((k) => prev.has(k))) {
          return prev;
        }
        saveVisitedCountriesSet(migrated);
        const uid = getStoredUserId();
        if (uid) {
          void syncVisitsToServer(uid).catch(() => {});
        }
        return migrated;
      });
    });
  }, [features]);

  return {
    visitedCountries,
    visitedLandmarks,
    countryFillColors,
    visitEpoch,
    visitsSyncReady,
    handleCountryVisitToggle,
    refreshLandmarksFromStorage,
    setVisitCountryFillColor,
    resetVisitCountryFillColor,
  };
}
