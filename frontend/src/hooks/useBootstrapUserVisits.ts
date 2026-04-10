import { useEffect, useRef, useState } from "react";
import {
  applyServerVisitsToStorage,
  bootstrapAnonymousUser,
  fetchUser,
  getStoredUserId,
  setStoredUserId,
  syncVisitsToServer,
} from "../lib/userApi";
import {
  getVisitedCountriesSet,
  getVisitedLandmarksSet,
} from "../lib/visitStorage";

export function useBootstrapUserVisits(
  onSynced: (visited: Set<string>) => void
): boolean {
  const [ready, setReady] = useState(false);
  const onSyncedRef = useRef(onSynced);
  onSyncedRef.current = onSynced;

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const migrationCountries = [...getVisitedCountriesSet()];
      const migrationLandmarks = [...getVisitedLandmarksSet()];

      let id = getStoredUserId();
      if (id) {
        try {
          const user = await fetchUser(id);
          if (cancelled) return;
          const needsPush = applyServerVisitsToStorage(user);
          if (needsPush) {
            void syncVisitsToServer(user.id).catch(() => {});
          }
          onSyncedRef.current(new Set(getVisitedCountriesSet()));
          setReady(true);
          return;
        } catch {
          setStoredUserId(null);
        }
      }

      try {
        const user = await bootstrapAnonymousUser({
          visitedCountries: migrationCountries,
          visitedLandmarks: migrationLandmarks,
        });
        if (cancelled) return;
        setStoredUserId(user.id);
        const needsPushAfterBootstrap = applyServerVisitsToStorage(user);
        if (needsPushAfterBootstrap) {
          void syncVisitsToServer(user.id).catch(() => {});
        }
        onSyncedRef.current(new Set(getVisitedCountriesSet()));
      } catch {
        if (!cancelled) {
          onSyncedRef.current(new Set(migrationCountries));
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return ready;
}
