import { CountryMetaModel } from '../models/CountryMeta'
import { HttpError } from '../utils/httpError'
import { escapeRegExp } from '../utils/validation'

export type CountryMetaResponse = {
  countryName: string
  capital: string
  currency: string
}

export async function getCountryMetaByIsoA2(isoA2: string): Promise<CountryMetaResponse> {
  const doc = await CountryMetaModel.findOne({ isoA2: isoA2.toUpperCase() }).lean()
  if (!doc) {
    throw new HttpError(404, 'Not found')
  }
  return {
    countryName: doc.countryName,
    capital: doc.capital,
    currency: doc.currency,
  }
}

export async function getCountryMetaByCountryName(
  normalizedName: string
): Promise<CountryMetaResponse> {
  const doc = await CountryMetaModel.findOne({
    countryName: {
      $regex: `^${escapeRegExp(normalizedName)}$`,
      $options: 'i',
    },
  }).lean()
  if (!doc) {
    throw new HttpError(404, 'Not found')
  }
  return {
    countryName: doc.countryName,
    capital: doc.capital,
    currency: doc.currency,
  }
}
