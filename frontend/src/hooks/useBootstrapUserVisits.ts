import { useEffect } from "react";
import {
  applyServerVisitsToStorage,
  fetchUser,
  getStoredUserId,
  setStoredUserId,
} from "../lib/userApi";

export function useBootstrapUserVisits(onSynced: (visited: Set<string>) => void): void {
  useEffect(() => {
    const id = getStoredUserId();
    if (!id) return;
    let cancelled = false;
    fetchUser(id)
      .then((user) => {
        if (cancelled) return;
        applyServerVisitsToStorage(user);
        onSynced(new Set(user.visitedCountries));
      })
      .catch(() => {
        setStoredUserId(null);
      });
    return () => {
      cancelled = true;
    };
  }, [onSynced]);
}
