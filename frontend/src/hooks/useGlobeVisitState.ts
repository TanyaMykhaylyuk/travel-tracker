import { useCallback, useEffect, useState } from "react";
import type { CountryFeature } from "../types/country";
import { migrateVisitedCountriesIsoToAdm0 } from "../lib/geo/migrateVisitedCountriesIsoToAdm0";
import {
  getVisitedCountriesSet,
  saveVisitedCountriesSet,
} from "../lib/visitStorage";
import { getStoredUserId, syncVisitsToServer } from "../lib/userApi";
import { useBootstrapUserVisits } from "./useBootstrapUserVisits";

export function useGlobeVisitState(features: CountryFeature[]) {
  const [visitedCountries, setVisitedCountries] = useState<Set<string>>(getVisitedCountriesSet);
  const [visitEpoch, setVisitEpoch] = useState(0);

  const handleSynced = useCallback((next: Set<string>) => {
    setVisitedCountries(next);
    setVisitEpoch((e) => e + 1);
  }, []);

  useBootstrapUserVisits(handleSynced);

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
    visitEpoch,
    toggleCountryVisited,
  };
}
