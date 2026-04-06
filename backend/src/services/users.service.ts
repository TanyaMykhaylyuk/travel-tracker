import { UserModel } from '../models/User'
import { HttpError } from '../utils/httpError'
import { HANDLE_RE, isValidObjectId } from '../utils/validation'
import type {
  CreateOrUpdateUserBody,
  PatchVisitsBody,
  UserPublicDto,
  UserVisitsDto,
} from '../types/api'

function toPublicDto(doc: {
  _id: unknown
  handle: string
  displayName: string
  bio: string
  photoDataUrl: string
  visitedCountries: string[]
  visitedLandmarks: string[]
}): UserPublicDto {
  return {
    id: String(doc._id),
    handle: doc.handle,
    displayName: doc.displayName,
    bio: doc.bio,
    photoDataUrl: doc.photoDataUrl,
    visitedCountries: doc.visitedCountries,
    visitedLandmarks: doc.visitedLandmarks,
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
      ).lean()

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
    ).lean()

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
    const doc = await UserModel.findById(id).lean()
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
