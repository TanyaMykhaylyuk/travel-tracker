import countries from 'world-countries'
import type { Country } from 'world-countries'

export const OFFICIAL_RECOGNIZED_COUNTRY_COUNT = 195

export function isWorldTravelIsoCountry(c: Country): boolean {
  return c.unMember || c.cca3 === 'PSE'
}

export function getWorldTravelIsoCountries(): Country[] {
  return countries.filter(isWorldTravelIsoCountry)
}

const GLOBE_ADM0_TO_TRAVEL_CCA3: Readonly<Record<string, string>> = {
  PSX: 'PSE',
  SDS: 'SSD',
}

export function normalizeGlobeAdm0ToTravelCca3(adm0: string): string {
  return GLOBE_ADM0_TO_TRAVEL_CCA3[adm0] ?? adm0
}

export function buildTravelProgressUniverseAdm0Codes(): string[] {
  return getWorldTravelIsoCountries()
    .map((c) => c.cca3)
    .sort()
}
