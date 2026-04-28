import { CountryFactModel } from "../models/CountryFact";
import { HttpError } from "../utils/httpError";
import { escapeRegExp } from "../utils/validation";
import countries from "world-countries";
import { resolveCsvCountryToIso } from "../lib/resolveCountryIso";

export type CountryFactsResponse = {
  countryName: string;
  facts: string[];
};

const COUNTRY_NAME_ALIASES: Record<string, string[]> = {
  kosovo: ["Republic of Kosovo"],
  "republic of kosovo": ["Kosovo"],
};

const countriesByIsoA2 = new Map(
  countries.map((country) => [String(country.cca2 || "").toUpperCase(), country] as const)
);

function resolveIsoA2ByCountryName(name: string): string | null {
  const resolved = resolveCsvCountryToIso(name);
  if (resolved) return resolved.toUpperCase();

  const lower = name.toLowerCase();
  const matched = countries.find((country) => {
    if (country.name.common?.toLowerCase() === lower) return true;
    if (country.name.official?.toLowerCase() === lower) return true;
    return (country.altSpellings ?? []).some((alt) => alt.toLowerCase() === lower);
  });

  return matched?.cca2?.toUpperCase() ?? null;
}

function buildCountryNameCandidates(normalizedName: string): string[] {
  const trimmed = normalizedName.trim();
  const lower = trimmed.toLowerCase();
  const aliasList = COUNTRY_NAME_ALIASES[lower] ?? [];
  const candidates = [trimmed, ...aliasList];

  const isoA2 = resolveIsoA2ByCountryName(trimmed);
  if (isoA2) {
    const country = countriesByIsoA2.get(isoA2);
    if (country) {
      candidates.push(country.name.common, country.name.official, ...(country.altSpellings ?? []));
    }
  }

  const deduped = new Set(
    candidates.map((name) => name.trim()).filter((name) => name.length > 0)
  );
  return [...deduped];
}

export async function getCountryFactsByCountryName(
  normalizedName: string
): Promise<CountryFactsResponse> {
  const candidates = buildCountryNameCandidates(normalizedName);
  const doc = await CountryFactModel.findOne({
    $or: candidates.map((candidate) => ({
      countryName: {
        $regex: `^${escapeRegExp(candidate)}$`,
        $options: "i",
      },
    })),
  }).lean();

  if (!doc) {
    throw new HttpError(404, "Not found");
  }

  return {
    countryName: doc.countryName,
    facts: doc.facts ?? [],
  };
}
