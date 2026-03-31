import {
  getVisitedCountriesSet,
  getVisitedLandmarksSet,
  saveVisitedCountriesSet,
  saveVisitedLandmarksSet,
} from "./visitStorage";

export const USER_ID_KEY = "travel-tracker-user-id";

export function getStoredUserId(): string | null {
  try {
    return localStorage.getItem(USER_ID_KEY);
  } catch {
    return null;
  }
}

export function setStoredUserId(id: string | null): void {
  try {
    if (id === null) localStorage.removeItem(USER_ID_KEY);
    else localStorage.setItem(USER_ID_KEY, id);
  } catch {}
}

export type ServerUser = {
  id: string;
  handle: string;
  displayName: string;
  bio: string;
  photoDataUrl: string;
  visitedCountries: string[];
  visitedLandmarks: string[];
};

export async function registerOrUpdateUser(body: {
  id?: string;
  handle: string;
  displayName: string;
  bio: string;
  photoDataUrl: string;
  visitedCountries: string[];
  visitedLandmarks: string[];
}): Promise<ServerUser> {
  const res = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as ServerUser & { error?: string };
  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Save failed");
  }
  return data;
}

export async function fetchUser(id: string): Promise<ServerUser> {
  const res = await fetch(`/api/users/${encodeURIComponent(id)}`);
  const data = (await res.json()) as ServerUser & { error?: string };
  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Load failed");
  }
  return data;
}

export function applyServerVisitsToStorage(user: ServerUser): void {
  saveVisitedCountriesSet(new Set(user.visitedCountries));
  saveVisitedLandmarksSet(new Set(user.visitedLandmarks));
}

export async function syncVisitsToServer(userId: string): Promise<void> {
  const visitedCountries = [...getVisitedCountriesSet()];
  const visitedLandmarks = [...getVisitedLandmarksSet()];
  const res = await fetch(`/api/users/${encodeURIComponent(userId)}/visits`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ visitedCountries, visitedLandmarks }),
  });
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(typeof data.error === "string" ? data.error : "Sync failed");
  }
}
