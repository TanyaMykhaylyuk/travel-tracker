import countries from 'world-countries'
import type { Country } from 'world-countries'

const countryByCca2 = new Map(
  countries.map((c) => [String(c.cca2 || '').toUpperCase(), c] as const)
)

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

type GeoProps = { ISO_A2?: string; ADM0_A3?: string }

function geoProps(f: unknown): GeoProps | null {
  if (typeof f !== 'object' || f === null) return null
  const p = (f as { properties?: unknown }).properties
  if (typeof p !== 'object' || p === null) return null
  return p as GeoProps
}

export type BuildTravelUniverseOptions = {
  landmarkIso2List?: string[] | null
}

export function buildTravelProgressUniverseAdm0Codes(
  features: unknown[],
  options?: BuildTravelUniverseOptions
): string[] {
  const out = new Set<string>()
  const isoList = options?.landmarkIso2List

  if (isoList && isoList.length > 0) {
    for (const raw of isoList) {
      const u = raw.trim().toUpperCase()
      if (!/^[A-Z]{2}$/.test(u)) continue
      const wc = countryByCca2.get(u)
      if (wc) out.add(wc.cca3)
    }
  } else {
    for (const c of getWorldTravelIsoCountries()) {
      out.add(c.cca3)
    }
  }

  for (const f of features) {
    const p = geoProps(f)
    if (!p || p.ISO_A2 === 'AQ') continue
    const adm = p.ADM0_A3
    if (typeof adm === 'string' && adm.length > 0) {
      out.add(normalizeGlobeAdm0ToTravelCca3(adm))
    }
  }
  return [...out].sort()
}
