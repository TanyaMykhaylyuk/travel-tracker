import { useEffect, useState } from "react";
import {
  fetchLandmarksForCountry,
  type LandmarkDto,
} from "../lib/api/landmarks";

export function useLandmarksForCountry(isoA2: string, countryName: string) {
  const [landmarks, setLandmarks] = useState<LandmarkDto[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const list = await fetchLandmarksForCountry(isoA2, countryName);
        if (!cancelled) setLandmarks(list);
      } catch {
        if (!cancelled) setLandmarks([]);
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    setReady(false);
    void load();
    return () => {
      cancelled = true;
    };
  }, [isoA2, countryName]);

  return { landmarks, landmarksReady: ready };
}
