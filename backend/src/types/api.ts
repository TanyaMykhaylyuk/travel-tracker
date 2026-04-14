export type UserPublicDto = {
  id: string
  handle: string
  displayName: string
  bio: string
  photoDataUrl: string
  visitedCountries: string[]
  visitedLandmarks: string[]
  hasPassword?: boolean
}

export type UserVisitsDto = {
  id: string
  visitedCountries: string[]
  visitedLandmarks: string[]
}

export type CountryPhotoDto = {
  id: string
  dataUrl: string
  createdAt: string
}

export type CountryPhotosResponse = {
  userId: string
  countryCode: string
  countryName: string
  photos: CountryPhotoDto[]
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

export type AddCountryPhotoBody = {
  countryName: string
  dataUrl: string
}

export type PatchCountryPhotosBody = {
  photoIds: string[]
}

export type AuthLoginBody = {
  handle: string
  password: string
}

export type AuthRegisterBody = {
  handle: string
  displayName: string
  password: string
  bio: string
  photoDataUrl: string
  visitedCountries: string[]
  visitedLandmarks: string[]
}

export type AuthClaimBody = AuthRegisterBody & {
  userId: string
}
