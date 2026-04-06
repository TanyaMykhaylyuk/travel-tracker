import type { CountryFeature } from "../../types/country";

export function migrateVisitedCountriesIsoToAdm0(
  features: CountryFeature[],
  stored: Set<string>
): Set<string> {
  const admSet = new Set(features.map((f) => f.properties.ADM0_A3));
  const isoToAdm = new Map<string, string>();
  for (const f of features) {
    const iso = f.properties.ISO_A2;
    const adm = f.properties.ADM0_A3;
    if (/^[A-Za-z]{2}$/.test(iso)) {
      isoToAdm.set(iso.toUpperCase(), adm);
    }
  }
  const next = new Set<string>();
  for (const key of stored) {
    if (admSet.has(key)) {
      next.add(key);
      continue;
    }
    if (/^[A-Za-z]{2}$/.test(key)) {
      const adm = isoToAdm.get(key.toUpperCase());
      if (adm) next.add(adm);
    }
  }
  return next;
}
