import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import mongoose from 'mongoose'
import countries from 'world-countries'
import { CountryMetaModel } from '../models/CountryMeta'
import { resolveCsvCountryToIso } from '../lib/resolveCountryIso'

type FeatureLike = {
  properties?: {
    ADMIN?: string
    ISO_A2?: string
  }
}

const countryByCca2 = new Map(
  countries.map((c) => [String(c.cca2 || '').toUpperCase(), c] as const)
)

const GEOJSON_PATH = path.join(__dirname, '../../data/ne_110m_admin_0_countries.geojson')

function resolveCurrencyCode(country: (typeof countries)[number]): string | null {
  const codes = Object.keys(country.currencies ?? {})
  return codes[0] ?? null
}

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('Set MONGODB_URI in backend/.env')
    process.exit(1)
  }

  await mongoose.connect(uri)

  const raw = fs.readFileSync(GEOJSON_PATH, 'utf8')
  const parsed = JSON.parse(raw) as { features?: unknown[] }
  const features = Array.isArray(parsed.features) ? (parsed.features as FeatureLike[]) : []
  let upserted = 0
  const unresolved: string[] = []

  for (const feature of features) {
    const countryName = String(feature.properties?.ADMIN ?? '').trim()
    if (!countryName) continue

    const isoFromFeature = String(feature.properties?.ISO_A2 ?? '').trim().toUpperCase()
    const isoA2 = /^[A-Z]{2}$/.test(isoFromFeature)
      ? isoFromFeature
      : resolveCsvCountryToIso(countryName)?.toUpperCase() ?? ''
    if (!/^[A-Z]{2}$/.test(isoA2)) {
      unresolved.push(countryName)
      continue
    }

    const wc = countryByCca2.get(isoA2)
    const capital = wc?.capital?.[0]?.trim()
    const currency = wc ? resolveCurrencyCode(wc) : null
    if (!capital || !currency) {
      unresolved.push(countryName)
      continue
    }

    await CountryMetaModel.findOneAndUpdate(
      { isoA2 },
      {
        isoA2,
        countryName,
        capital,
        currency,
      },
      { upsert: true }
    )
    upserted += 1
  }

  console.log(`Upserted ${upserted} country meta records.`)
  if (unresolved.length) {
    console.warn('Unresolved country meta:', unresolved)
  }

  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
