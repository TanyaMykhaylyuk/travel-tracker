import { useEffect, useState } from "react";
import {
  fetchLandmarksForCountry,
  type LandmarkDto,
} from "../lib/api/landmarks";

export function useLandmarksForCountry(isoA2: string, countryName: string) {
  const [landmarks, setLandmarks] = useState<LandmarkDto[]>([]);
  const [ready, setReady] = useState(false);
  const [landmarksError, setLandmarksError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const list = await fetchLandmarksForCountry(isoA2, countryName);
        if (!cancelled) {
          setLandmarks(list);
          setLandmarksError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setLandmarks([]);
          setLandmarksError(
            e instanceof Error ? e.message : "Could not load landmarks for this country."
          );
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    setReady(false);
    setLandmarksError(null);
    void load();
    return () => {
      cancelled = true;
    };
  }, [isoA2, countryName]);

  return { landmarks, landmarksReady: ready, landmarksError };
}
