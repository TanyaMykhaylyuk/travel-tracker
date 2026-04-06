export type UserPublicDto = {
  id: string
  handle: string
  displayName: string
  bio: string
  photoDataUrl: string
  visitedCountries: string[]
  visitedLandmarks: string[]
}

export type UserVisitsDto = {
  id: string
  visitedCountries: string[]
  visitedLandmarks: string[]
}

export type CountriesFeaturesResponse = {
  features: unknown
}

export type LandmarkItemDto = {
  id: string
  name: string
}

export type LandmarksResponse = {
  countryName: string
  landmarks: LandmarkItemDto[]
}

export type CreateOrUpdateUserBody = {
  id: string
  handle: string
  displayName: string
  bio: string
  photoDataUrl: string
  visitedCountries: string[]
  visitedLandmarks: string[]
}

export type PatchVisitsBody = {
  visitedCountries?: string[]
  visitedLandmarks?: string[]
}
