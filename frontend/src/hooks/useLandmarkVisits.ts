import { useCallback, useEffect, useState } from "react";
import { landmarkVisitKey } from "../lib/landmarkVisitKey";
import {
  getVisitedLandmarksSet,
  saveVisitedLandmarksSet,
} from "../lib/visitStorage";
import { getStoredUserId, syncVisitsToServer } from "../lib/userApi";
import type { LandmarkDto } from "../lib/api/landmarks";

export function useLandmarkVisits(
  visitKey: string,
  visitEpoch: number,
  onLandmarksChanged?: () => void,
  visitsSyncReady = true
) {
  const [visited, setVisited] = useState<Set<string>>(() => getVisitedLandmarksSet());

  useEffect(() => {
    queueMicrotask(() => {
      setVisited(getVisitedLandmarksSet());
    });
  }, [visitEpoch, visitKey]);

  const toggleVisited = useCallback(
    (landmark: LandmarkDto) => {
      if (!visitsSyncReady) return;
      const key = landmarkVisitKey(visitKey, landmark.id);
      setVisited((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        saveVisitedLandmarksSet(next);
        const uid = getStoredUserId();
        if (uid) {
          void syncVisitsToServer(uid).catch(() => {});
        }
        queueMicrotask(() => onLandmarksChanged?.());
        return next;
      });
    },
    [visitKey, onLandmarksChanged, visitsSyncReady]
  );

  const isVisited = useCallback(
    (landmark: LandmarkDto) => visited.has(landmarkVisitKey(visitKey, landmark.id)),
    [visitKey, visited]
  );

  return { toggleVisited, isVisited };
}
