import mongoose from 'mongoose'
import { UserModel } from '../models/User'
import { HttpError } from '../utils/httpError'
import { HANDLE_RE, isValidObjectId } from '../utils/validation'
import type {
  AddCountryPhotoBody,
  CountryPhotosResponse,
  CreateOrUpdateUserBody,
  PatchVisitsBody,
  UserPublicDto,
  UserVisitsDto,
} from '../types/api'

export function toPublicDto(doc: {
  _id: unknown
  handle: string
  displayName: string
  bio: string
  photoDataUrl: string
  visitedCountries: string[]
  visitedLandmarks: string[]
  passwordHash?: string
}): UserPublicDto {
  return {
    id: String(doc._id),
    handle: doc.handle,
    displayName: doc.displayName,
    bio: doc.bio,
    photoDataUrl: doc.photoDataUrl,
    visitedCountries: doc.visitedCountries,
    visitedLandmarks: doc.visitedLandmarks,
    hasPassword: Boolean(doc.passwordHash),
  }
}

function validateUserInput(body: CreateOrUpdateUserBody): void {
  const handleLower = body.handle.toLowerCase()
  if (!body.handle || !HANDLE_RE.test(handleLower)) {
    throw new HttpError(
      400,
      'Username must be 2–32 characters: letters, numbers, underscore only.'
    )
  }
  if (!body.displayName) {
    throw new HttpError(400, 'Name is required.')
  }
}

export async function bootstrapAnonymousUser(visits: {
  visitedCountries: string[]
  visitedLandmarks: string[]
}): Promise<UserPublicDto> {
  const handle = `u${new mongoose.Types.ObjectId().toString()}`
  try {
    const doc = await UserModel.create({
      handle,
      displayName: 'Traveler',
      bio: '',
      photoDataUrl: '',
      visitedCountries: visits.visitedCountries,
      visitedLandmarks: visits.visitedLandmarks,
    })
    return toPublicDto(doc.toObject())
  } catch (e: unknown) {
    if (e instanceof HttpError) throw e
    throw new HttpError(500, 'Failed to create user')
  }
}

export async function createOrUpdateUser(
  body: CreateOrUpdateUserBody
): Promise<UserPublicDto> {
  validateUserInput(body)

  const handle = body.handle.toLowerCase()
  const {
    id: idRaw,
    displayName,
    bio,
    photoDataUrl,
    visitedCountries,
    visitedLandmarks,
  } = body

  try {
    if (idRaw && isValidObjectId(idRaw)) {
      const existing = await UserModel.findById(idRaw)
      if (!existing) {
        throw new HttpError(404, 'User not found')
      }
      if (handle !== existing.handle) {
        const taken = await UserModel.findOne({ handle, _id: { $ne: idRaw } })
        if (taken) {
          throw new HttpError(409, 'This username is already taken.')
        }
      }
      const doc = await UserModel.findByIdAndUpdate(
        idRaw,
        {
          $set: {
            handle,
            displayName,
            bio,
            photoDataUrl,
            visitedCountries,
            visitedLandmarks,
          },
        },
        { new: true, runValidators: true }
      )
        .select('+passwordHash')
        .lean()

      if (!doc) {
        throw new HttpError(500, 'Failed to save user')
      }

      return toPublicDto(doc)
    }

    const doc = await UserModel.findOneAndUpdate(
      { handle },
      {
        $set: {
          handle,
          displayName,
          bio,
          photoDataUrl,
          visitedCountries,
          visitedLandmarks,
        },
      },
      { new: true, upsert: true, runValidators: true }
    )
      .select('+passwordHash')
      .lean()

    return toPublicDto(doc)
  } catch (e: unknown) {
    if (e instanceof HttpError) throw e
    const err = e as { code?: number }
    if (err.code === 11000) {
      throw new HttpError(409, 'This username is already taken.')
    }
    throw new HttpError(500, 'Failed to save user')
  }
}

export async function getUserById(id: string): Promise<UserPublicDto> {
  if (!isValidObjectId(id)) {
    throw new HttpError(400, 'Invalid user id')
  }
  try {
    const doc = await UserModel.findById(id).select('+passwordHash').lean()
    if (!doc) {
      throw new HttpError(404, 'Not found')
    }
    return toPublicDto(doc)
  } catch (e: unknown) {
    if (e instanceof HttpError) throw e
    throw new HttpError(500, 'Failed to load user')
  }
}

export async function patchUserVisits(
  id: string,
  body: PatchVisitsBody
): Promise<UserVisitsDto> {
  if (!isValidObjectId(id)) {
    throw new HttpError(400, 'Invalid user id')
  }

  const { visitedCountries, visitedLandmarks } = body
  if (visitedCountries === undefined && visitedLandmarks === undefined) {
    throw new HttpError(400, 'Nothing to update')
  }

  try {
    const doc = await UserModel.findByIdAndUpdate(
      id,
      {
        $set: {
          ...(visitedCountries !== undefined ? { visitedCountries } : {}),
          ...(visitedLandmarks !== undefined ? { visitedLandmarks } : {}),
        },
      },
      { new: true }
    ).lean()
    if (!doc) {
      throw new HttpError(404, 'Not found')
    }
    return {
      id: String(doc._id),
      visitedCountries: doc.visitedCountries,
      visitedLandmarks: doc.visitedLandmarks,
    }
  } catch (e: unknown) {
    if (e instanceof HttpError) throw e
    throw new HttpError(500, 'Failed to update visits')
  }
}

type StoredCountryPhoto = {
  id: string
  dataUrl: string
  createdAt: Date
}

type StoredCountryPhotosBucket = {
  countryCode: string
  countryName: string
  photos: StoredCountryPhoto[]
}

function assertValidCountryCode(raw: string): string {
  const countryCode = raw.trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(countryCode) && !/^[A-Z]{3}$/.test(countryCode)) {
    throw new HttpError(400, 'Invalid country code')
  }
  return countryCode
}

function assertValidCountryPhotoPayload(body: AddCountryPhotoBody): void {
  if (!body.countryName || body.countryName.length > 120) {
    throw new HttpError(400, 'Country name is required')
  }
  const isImageDataUrl = /^data:image\/(png|jpe?g|webp|gif);base64,[a-zA-Z0-9+/=]+$/.test(
    body.dataUrl
  )
  if (!isImageDataUrl) {
    throw new HttpError(400, 'Photo must be a valid image data URL')
  }
  if (body.dataUrl.length > 2_000_000) {
    throw new HttpError(413, 'Photo is too large')
  }
}

function toCountryPhotosResponse(
  userId: string,
  countryCode: string,
  bucket?: StoredCountryPhotosBucket
): CountryPhotosResponse {
  return {
    userId,
    countryCode,
    countryName: bucket?.countryName ?? '',
    photos:
      bucket?.photos.map((photo) => ({
        id: photo.id,
        dataUrl: photo.dataUrl,
        createdAt: photo.createdAt.toISOString(),
      })) ?? [],
  }
}

export async function getUserCountryPhotos(
  userId: string,
  countryCodeRaw: string
): Promise<CountryPhotosResponse> {
  if (!isValidObjectId(userId)) {
    throw new HttpError(400, 'Invalid user id')
  }
  const countryCode = assertValidCountryCode(countryCodeRaw)
  const user = await UserModel.findById(userId).lean()
  if (!user) {
    throw new HttpError(404, 'User not found')
  }
  const bucket = (user.countryPhotos as StoredCountryPhotosBucket[] | undefined)?.find(
    (item) => item.countryCode === countryCode
  )
  return toCountryPhotosResponse(String(user._id), countryCode, bucket)
}

export async function addUserCountryPhoto(
  userId: string,
  countryCodeRaw: string,
  body: AddCountryPhotoBody
): Promise<CountryPhotosResponse> {
  if (!isValidObjectId(userId)) {
    throw new HttpError(400, 'Invalid user id')
  }
  const countryCode = assertValidCountryCode(countryCodeRaw)
  assertValidCountryPhotoPayload(body)

  const user = await UserModel.findById(userId).lean()
  if (!user) {
    throw new HttpError(404, 'User not found')
  }

  const allBuckets = Array.isArray(user.countryPhotos)
    ? ([...user.countryPhotos] as StoredCountryPhotosBucket[])
    : []

  let bucket = allBuckets.find(
    (item) => item.countryCode === countryCode
  )
  if (!bucket) {
    bucket = {
      countryCode,
      countryName: body.countryName,
      photos: [],
    }
    allBuckets.push(bucket)
  }

  bucket.countryName = body.countryName
  bucket.photos.push({
    id: new mongoose.Types.ObjectId().toString(),
    dataUrl: body.dataUrl,
    createdAt: new Date(),
  })
  if (bucket.photos.length > 20) {
    bucket.photos = bucket.photos.slice(-20)
  }

  await UserModel.findByIdAndUpdate(
    userId,
    { $set: { countryPhotos: allBuckets } },
    { runValidators: true }
  )
  return toCountryPhotosResponse(String(user._id), countryCode, bucket)
}

export async function patchUserCountryPhotos(
  userId: string,
  countryCodeRaw: string,
  photoIds: string[]
): Promise<CountryPhotosResponse> {
  if (!isValidObjectId(userId)) {
    throw new HttpError(400, 'Invalid user id')
  }
  const countryCode = assertValidCountryCode(countryCodeRaw)

  const seen = new Set<string>()
  for (const id of photoIds) {
    if (seen.has(id)) {
      throw new HttpError(400, 'Duplicate photo id')
    }
    seen.add(id)
  }

  const user = await UserModel.findById(userId).lean()
  if (!user) {
    throw new HttpError(404, 'User not found')
  }

  const allBuckets = Array.isArray(user.countryPhotos)
    ? ([...user.countryPhotos] as StoredCountryPhotosBucket[])
    : []

  const bucketIdx = allBuckets.findIndex((b) => b.countryCode === countryCode)
  const bucket = bucketIdx >= 0 ? allBuckets[bucketIdx] : undefined

  if (!bucket) {
    if (photoIds.length === 0) {
      return toCountryPhotosResponse(userId, countryCode, undefined)
    }
    throw new HttpError(404, 'No photos for this country')
  }

  const map = new Map(bucket.photos.map((p) => [p.id, p]))
  for (const id of photoIds) {
    if (!map.has(id)) {
      throw new HttpError(400, 'Unknown photo id')
    }
  }

  const newPhotos = photoIds.map((id) => map.get(id) as StoredCountryPhoto)
  bucket.photos = newPhotos

  if (bucket.photos.length === 0 && bucketIdx >= 0) {
    allBuckets.splice(bucketIdx, 1)
  }

  await UserModel.findByIdAndUpdate(
    userId,
    { $set: { countryPhotos: allBuckets } },
    { runValidators: true }
  )

  return toCountryPhotosResponse(
    String(user._id),
    countryCode,
    bucket.photos.length > 0 ? bucket : undefined
  )
}
