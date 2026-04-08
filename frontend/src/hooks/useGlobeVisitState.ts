import { useCallback, useEffect, useState } from "react";
import type { CountryFeature } from "../types/country";
import { migrateVisitedCountriesIsoToAdm0 } from "../lib/geo/migrateVisitedCountriesIsoToAdm0";
import {
  clearLandmarksForCountry,
  getVisitedCountriesSet,
  getVisitedLandmarksSet,
  hasAnyVisitedLandmarkForCountry,
  saveVisitedCountriesSet,
} from "../lib/visitStorage";
import { getStoredUserId, syncVisitsToServer } from "../lib/userApi";
import { useBootstrapUserVisits } from "./useBootstrapUserVisits";

export function useGlobeVisitState(features: CountryFeature[]) {
  const [visitedCountries, setVisitedCountries] = useState<Set<string>>(getVisitedCountriesSet);
  const [visitedLandmarks, setVisitedLandmarks] = useState<Set<string>>(getVisitedLandmarksSet);
  const [visitEpoch, setVisitEpoch] = useState(0);

  const handleSynced = useCallback((next: Set<string>) => {
    setVisitedCountries(next);
    setVisitedLandmarks(getVisitedLandmarksSet());
    setVisitEpoch((e) => e + 1);
  }, []);

  const refreshLandmarksFromStorage = useCallback(() => {
    setVisitedLandmarks(getVisitedLandmarksSet());
    setVisitEpoch((e) => e + 1);
  }, []);

  useBootstrapUserVisits(handleSynced);

  const handleCountryVisitToggle = useCallback((code: string) => {
    const countries = getVisitedCountriesSet();
    const landmarks = getVisitedLandmarksSet();
    const effective =
      countries.has(code) || hasAnyVisitedLandmarkForCountry(code, landmarks);

    if (effective) {
      const nextCountries = new Set(countries);
      nextCountries.delete(code);
      saveVisitedCountriesSet(nextCountries);
      clearLandmarksForCountry(code);
      setVisitedCountries(nextCountries);
      setVisitedLandmarks(getVisitedLandmarksSet());
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
  }, []);

  useEffect(() => {
    if (!features.length) return;
    queueMicrotask(() => {
      setVisitedCountries((prev) => {
        const migrated = migrateVisitedCountriesIsoToAdm0(features, prev);
        if (migrated.size === prev.size && [...migrated].every((k) => prev.has(k))) {
          return prev;
        }
        saveVisitedCountriesSet(migrated);
        return migrated;
      });
    });
  }, [features]);

  return {
    visitedCountries,
    visitedLandmarks,
    visitEpoch,
    handleCountryVisitToggle,
    refreshLandmarksFromStorage,
  };
}
