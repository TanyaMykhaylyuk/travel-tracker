import { CountryLandmarkModel } from '../models/CountryLandmark'
import { HttpError } from '../utils/httpError'
import { escapeRegExp } from '../utils/validation'
import type { LandmarksResponse } from '../types/api'

export async function getLandmarksByIsoA2(isoA2: string): Promise<LandmarksResponse> {
  const doc = await CountryLandmarkModel.findOne({ isoA2 }).lean()
  if (!doc) {
    throw new HttpError(404, 'Not found')
  }
  return {
    countryName: doc.countryName,
    landmarks: doc.landmarks.map((l) => ({ id: l.id, name: l.name })),
  }
}

export async function getLandmarksByCountryName(
  normalizedName: string
): Promise<LandmarksResponse> {
  const doc = await CountryLandmarkModel.findOne({
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
    landmarks: doc.landmarks.map((l) => ({ id: l.id, name: l.name })),
  }
}
