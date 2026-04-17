import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import { UserModel } from '../models/User'
import { HttpError } from '../utils/httpError'
import { HANDLE_RE, isValidObjectId } from '../utils/validation'
import type { UserPublicDto } from '../types/api'
import { toPublicDto } from './users.service'

const SALT_ROUNDS = 10

function toStringRecord(value: unknown): Record<string, string> {
  if (value instanceof Map) {
    return Object.fromEntries(
      [...value.entries()].filter(
        (entry): entry is [string, string] =>
          typeof entry[0] === 'string' && typeof entry[1] === 'string'
      )
    )
  }
  if (typeof value !== 'object' || value === null) return {}
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] =>
        typeof entry[0] === 'string' && typeof entry[1] === 'string'
    )
  )
}

function assertPassword(plain: string): void {
  if (typeof plain !== 'string' || plain.length < 8 || plain.length > 128) {
    throw new HttpError(400, 'Password must be 8–128 characters.')
  }
}

export async function loginWithPassword(
  handleRaw: string,
  password: string
): Promise<UserPublicDto> {
  const handle = handleRaw.toLowerCase().trim().replace(/^@+/, '')
  if (!handle || !HANDLE_RE.test(handle)) {
    throw new HttpError(401, 'Invalid username or password.')
  }
  const doc = await UserModel.findOne({ handle }).select('+passwordHash').lean()
  if (!doc?.passwordHash) {
    throw new HttpError(401, 'Invalid username or password.')
  }
  const match = await bcrypt.compare(password, doc.passwordHash)
  if (!match) {
    throw new HttpError(401, 'Invalid username or password.')
  }
  return toPublicDto(doc)
}

export async function registerWithPassword(input: {
  handle: string
  displayName: string
  password: string
  bio: string
  photoDataUrl: string
  visitedCountries: string[]
  visitedLandmarks: string[]
  countryFillColors: Record<string, string>
}): Promise<UserPublicDto> {
  assertPassword(input.password)
  const handle = input.handle.toLowerCase().trim().replace(/^@+/, '')
  if (!handle || !HANDLE_RE.test(handle)) {
    throw new HttpError(400, 'Invalid username.')
  }
  const displayName = input.displayName.trim()
  if (!displayName) {
    throw new HttpError(400, 'Name is required.')
  }
  const existing = await UserModel.findOne({ handle }).lean()
  if (existing) {
    throw new HttpError(409, 'Username already taken.')
  }
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS)
  try {
    const doc = await UserModel.create({
      handle,
      displayName,
      bio: input.bio.trim(),
      photoDataUrl: input.photoDataUrl,
      visitedCountries: input.visitedCountries,
      visitedLandmarks: input.visitedLandmarks,
      countryFillColors: input.countryFillColors,
      passwordHash,
    })
    const plain = doc.toObject()
    return toPublicDto({ ...plain, passwordHash })
  } catch (e: unknown) {
    const err = e as { code?: number }
    if (err.code === 11000) {
      throw new HttpError(409, 'Username already taken.')
    }
    throw new HttpError(500, 'Registration failed')
  }
}

export async function claimAccountWithPassword(input: {
  userId: string
  handle: string
  displayName: string
  password: string
  bio: string
  photoDataUrl: string
  visitedCountries: string[]
  visitedLandmarks: string[]
  countryFillColors: Record<string, string>
}): Promise<UserPublicDto> {
  assertPassword(input.password)
  if (!isValidObjectId(input.userId)) {
    throw new HttpError(400, 'Invalid user id')
  }
  const handle = input.handle.toLowerCase().trim().replace(/^@+/, '')
  if (!handle || !HANDLE_RE.test(handle)) {
    throw new HttpError(400, 'Invalid username.')
  }
  const displayName = input.displayName.trim()
  if (!displayName) {
    throw new HttpError(400, 'Name is required.')
  }

  const prev = await UserModel.findById(input.userId).select('+passwordHash').lean()
  if (!prev) {
    throw new HttpError(404, 'User not found')
  }
  if (prev.passwordHash) {
    throw new HttpError(400, 'This account already has a password — use Log in.')
  }

  const taken = await UserModel.findOne({
    handle,
    _id: { $ne: new mongoose.Types.ObjectId(input.userId) },
  }).lean()
  if (taken) {
    throw new HttpError(409, 'Username already taken.')
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS)
  const visitedCountries = [
    ...new Set([...prev.visitedCountries, ...input.visitedCountries]),
  ]
  const visitedLandmarks = [
    ...new Set([...prev.visitedLandmarks, ...input.visitedLandmarks]),
  ]
  const countryFillColors = {
    ...toStringRecord(prev.countryFillColors),
    ...input.countryFillColors,
  }

  const doc = await UserModel.findByIdAndUpdate(
    input.userId,
    {
      $set: {
        handle,
        displayName,
        bio: input.bio.trim(),
        photoDataUrl: input.photoDataUrl,
        visitedCountries,
        visitedLandmarks,
        countryFillColors,
        passwordHash,
      },
    },
    { new: true, runValidators: true }
  )
    .select('+passwordHash')
    .lean()

  if (!doc) {
    throw new HttpError(500, 'Failed to secure account')
  }

  return toPublicDto(doc)
}
