import { CountryCollectionModel } from '../models/Country'
import { HttpError } from '../utils/httpError'

export async function getDefaultCountriesFeatures(): Promise<unknown[]> {
  const doc = await CountryCollectionModel.findOne({ key: 'default' }).lean()
  if (!doc) {
    throw new HttpError(404, 'Countries dataset is not seeded')
  }
  return doc.features
}
