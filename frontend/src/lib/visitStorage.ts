export const VISITED_COUNTRIES_KEY = "travel-tracker-visited-countries";
export const VISITED_LANDMARKS_KEY = "travel-tracker-visited-landmarks-v2";

export function getVisitedCountriesSet(): Set<string> {
  try {
    const stored = localStorage.getItem(VISITED_COUNTRIES_KEY);
    return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

export function saveVisitedCountriesSet(visited: Set<string>): void {
  localStorage.setItem(VISITED_COUNTRIES_KEY, JSON.stringify([...visited]));
}

export function getVisitedLandmarksSet(): Set<string> {
  try {
    const stored = localStorage.getItem(VISITED_LANDMARKS_KEY);
    return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

export function saveVisitedLandmarksSet(visited: Set<string>): void {
  localStorage.setItem(VISITED_LANDMARKS_KEY, JSON.stringify([...visited]));
}
