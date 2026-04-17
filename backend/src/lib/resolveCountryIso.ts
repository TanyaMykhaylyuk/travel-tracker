import type { Country } from "world-countries";
import countries from "world-countries";

export const CSV_COUNTRY_TO_CCA2: Record<string, string> = {
  "Congo (Republic of the)": "CG",
  "Congo (Democratic Republic of the)": "CD",
  "Czech Republic": "CZ",
  "United States": "US",
  "Puerto Rico": "PR",
  "Côte d'Ivoire": "CI",
  "Côte d’Ivoire": "CI",
  "North Macedonia": "MK",
  "Vatican City": "VA",
  Tanzania: "TZ",
  Eswatini: "SZ",
  "Cabo Verde": "CV",
  "São Tomé and Príncipe": "ST",
  "Timor-Leste": "TL",
  Palestine: "PS",
  Micronesia: "FM",
  Turkey: "TR",
};

const byCommon = new Map<string, Country>(
  countries.map((c) => [c.name.common, c])
);
const byOfficial = new Map<string, Country>(
  countries.map((c) => [c.name.official, c])
);

export function resolveCsvCountryToIso(csvCountry: string): string | null {
  const direct = CSV_COUNTRY_TO_CCA2[csvCountry];
  if (direct) return direct;
  const c =
    byCommon.get(csvCountry) ||
    byOfficial.get(csvCountry) ||
    countries.find((x) => x.altSpellings?.includes(csvCountry));
  return c?.cca2 ?? null;
}
