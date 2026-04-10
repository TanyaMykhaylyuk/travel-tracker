import {
  clearAllVisitData,
  getVisitedCountriesSet,
  getVisitedLandmarksSet,
  saveVisitedCountriesSet,
  saveVisitedLandmarksSet,
} from "./visitStorage";

export const USER_ID_KEY = "travel-tracker-user-id";

export const VISITS_REFRESH_EVENT = "travel-tracker-visits-refresh";

function dispatchVisitsRefresh(): void {
  window.dispatchEvent(new CustomEvent(VISITS_REFRESH_EVENT));
}

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
  } catch {
    void 0;
  }
}

export type ServerUser = {
  id: string;
  handle: string;
  displayName: string;
  bio: string;
  photoDataUrl: string;
  visitedCountries: string[];
  visitedLandmarks: string[];
  hasPassword?: boolean;
};

export async function bootstrapAnonymousUser(body: {
  visitedCountries: string[];
  visitedLandmarks: string[];
}): Promise<ServerUser> {
  const res = await fetch("/api/users/bootstrap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as ServerUser & { error?: string };
  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Bootstrap failed");
  }
  return data;
}

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

export function applyServerVisitsToStorage(user: ServerUser): boolean {
  const localCountries = getVisitedCountriesSet();
  const localLandmarks = getVisitedLandmarksSet();
  const serverCountries = new Set(user.visitedCountries);
  const serverLandmarks = new Set(user.visitedLandmarks);
  const mergedCountries = new Set([...user.visitedCountries, ...localCountries]);
  const mergedLandmarks = new Set([...user.visitedLandmarks, ...localLandmarks]);
  saveVisitedCountriesSet(mergedCountries);
  saveVisitedLandmarksSet(mergedLandmarks);
  return (
    [...localLandmarks].some((k) => !serverLandmarks.has(k)) ||
    [...localCountries].some((c) => !serverCountries.has(c))
  );
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

function applyAuthUser(user: ServerUser): void {
  setStoredUserId(user.id);
  const needsPush = applyServerVisitsToStorage(user);
  if (needsPush) {
    void syncVisitsToServer(user.id).catch(() => {});
  }
  dispatchVisitsRefresh();
}

export async function loginWithPassword(
  handle: string,
  password: string
): Promise<ServerUser> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      handle: handle.trim().replace(/^@/, ""),
      password,
    }),
  });
  const data = (await res.json()) as ServerUser & { error?: string };
  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Login failed");
  }
  applyAuthUser(data);
  return data;
}

export async function registerNewAccount(body: {
  handle: string;
  displayName: string;
  password: string;
  bio: string;
  photoDataUrl: string;
  visitedCountries: string[];
  visitedLandmarks: string[];
}): Promise<ServerUser> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as ServerUser & { error?: string };
  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Registration failed");
  }
  applyAuthUser(data);
  return data;
}

export async function claimAccountWithPassword(body: {
  userId: string;
  handle: string;
  displayName: string;
  password: string;
  bio: string;
  photoDataUrl: string;
  visitedCountries: string[];
  visitedLandmarks: string[];
}): Promise<ServerUser> {
  const res = await fetch("/api/auth/claim", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as ServerUser & { error?: string };
  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Could not secure account");
  }
  applyAuthUser(data);
  return data;
}

export function logoutTraveler(): void {
  setStoredUserId(null);
  clearAllVisitData();
  dispatchVisitsRefresh();
}
