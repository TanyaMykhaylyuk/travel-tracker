import fs from 'node:fs/promises'
import path from 'node:path'
import { buildTravelProgressUniverseAdm0Codes } from '../lib/travelProgressUniverse'
import { CountryLandmarkModel } from '../models/CountryLandmark'
import { HttpError } from '../utils/httpError'

type GeoJsonLike = {
  features?: unknown[]
}

const GEOJSON_PATH = path.join(__dirname, '../../data/ne_110m_admin_0_countries.geojson')
const COUNTRIES_GEOJSON_URL = process.env.COUNTRIES_GEOJSON_URL?.trim()
const REMOTE_FETCH_TIMEOUT_MS = 8_000
let featuresCache: unknown[] | null = null

function parseFeaturesOrThrow(raw: string, sourceLabel: string): unknown[] {
  try {
    const parsed = JSON.parse(raw) as GeoJsonLike
    if (!Array.isArray(parsed.features)) {
      throw new Error('missing features array')
    }
    return parsed.features
  } catch {
    throw new HttpError(500, `Countries geojson is invalid (${sourceLabel})`)
  }
}

async function readLocalFeatures(): Promise<unknown[]> {
  let raw: string
  try {
    raw = await fs.readFile(GEOJSON_PATH, 'utf8')
  } catch {
    throw new HttpError(500, 'Countries geojson file is missing')
  }
  return parseFeaturesOrThrow(raw, 'local file')
}

async function readRemoteFeatures(url: string): Promise<unknown[]> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REMOTE_FETCH_TIMEOUT_MS)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) {
      throw new HttpError(
        500,
        `Countries geojson request failed (${response.status} from COUNTRIES_GEOJSON_URL)`
      )
    }
    const raw = await response.text()
    return parseFeaturesOrThrow(raw, 'COUNTRIES_GEOJSON_URL')
  } catch {
    throw new HttpError(500, 'Countries geojson URL is unreachable or invalid')
  } finally {
    clearTimeout(timeout)
  }
}

async function loadAndCacheFeatures(): Promise<unknown[]> {
  if (featuresCache) {
    return featuresCache
  }

  const features = COUNTRIES_GEOJSON_URL
    ? await readRemoteFeatures(COUNTRIES_GEOJSON_URL).catch(() => readLocalFeatures())
    : await readLocalFeatures()
  featuresCache = features
  return features
}

export async function getDefaultCountriesFeatures(): Promise<unknown[]> {
  return loadAndCacheFeatures()
}

export type CountriesListPayload = {
  features: unknown[]
  travelProgressUniverse: string[]
}

export async function getCountriesListPayload(): Promise<CountriesListPayload> {
  const features = await loadAndCacheFeatures()

  let landmarkIso2List: string[] | null = null
  try {
    const raw = await CountryLandmarkModel.distinct<string>('isoA2')
    const cleaned = raw
      .filter((x): x is string => typeof x === 'string')
      .map((s) => s.trim().toUpperCase())
      .filter((s) => /^[A-Z]{2}$/.test(s))
    if (cleaned.length > 0) {
      landmarkIso2List = [...new Set(cleaned)]
    }
  } catch {
    landmarkIso2List = null
  }

  const travelProgressUniverse = buildTravelProgressUniverseAdm0Codes(features, {
    landmarkIso2List,
  })

  return {
    features,
    travelProgressUniverse,
  }
}
