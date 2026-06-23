import type { CountryFeature } from "../../types/country";
import { countryVisitKey } from "../visitCountryKey";
import { hasAnyVisitedLandmarkForCountry } from "../visitStorage";
import { normalizeGlobeAdm0ToTravelCca3 } from "./adm0TravelNormalize";

export const OFFICIAL_RECOGNIZED_COUNTRY_COUNT = 195;

export type VisitProgress = { visited: number; total: number; percent: number };

export function isDisputedTerritory(
  visitKey: string,
  travelProgressUniverse: Set<string> | null | undefined
): boolean {
  if (!travelProgressUniverse || travelProgressUniverse.size === 0) return false;
  return !travelProgressUniverse.has(normalizeGlobeAdm0ToTravelCca3(visitKey));
}

export function formatCountryDisplayName(
  adminName: string,
  visitKey: string,
  travelProgressUniverse: Set<string> | null | undefined
): string {
  if (isDisputedTerritory(visitKey, travelProgressUniverse)) {
    return `${adminName} (disputed)`;
  }
  return adminName;
}

export function computeCountriesVisitProgress(
  travelProgressUniverse: Set<string> | null,
  polygonsData: CountryFeature[],
  visitedCountries: Set<string>,
  visitedLandmarks: Set<string>
): VisitProgress {
  const norm = normalizeGlobeAdm0ToTravelCca3;

  if (!travelProgressUniverse || travelProgressUniverse.size === 0) {
    const total = OFFICIAL_RECOGNIZED_COUNTRY_COUNT;
    return { visited: 0, total, percent: 0 };
  }

  const total = travelProgressUniverse.size;
  const visitedCanon = new Set<string>();

  const addIfRecognized = (code: string) => {
    const nk = norm(code);
    if (travelProgressUniverse.has(nk)) visitedCanon.add(nk);
  };

  for (const country of polygonsData) {
    const code = countryVisitKey(country.properties);
    if (
      !(visitedCountries.has(code) || hasAnyVisitedLandmarkForCountry(code, visitedLandmarks))
    ) {
      continue;
    }
    addIfRecognized(code);
  }

  for (const code of visitedCountries) {
    addIfRecognized(code);
  }

  for (const lk of visitedLandmarks) {
    const sep = lk.indexOf(":");
    if (sep <= 0) continue;
    addIfRecognized(lk.slice(0, sep));
  }

  const visited = visitedCanon.size;
  return {
    visited,
    total,
    percent: Math.min(100, Math.round((visited / total) * 100)),
  };
}

export function countRecognizedVisitedCountries(
  travelProgressUniverse: Set<string> | null | undefined,
  visitedCountries: Set<string>,
  visitedLandmarks: Set<string>
): number {
  return computeCountriesVisitProgress(
    travelProgressUniverse ?? null,
    [],
    visitedCountries,
    visitedLandmarks
  ).visited;
}
