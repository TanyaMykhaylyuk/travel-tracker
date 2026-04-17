import mongoose from 'mongoose'
import type { Request } from 'express'
import type {
  AddCountryPhotoBody,
  PatchCountryPhotosBody,
  AuthClaimBody,
  AuthLoginBody,
  AuthRegisterBody,
  CreateOrUpdateUserBody,
  PatchVisitsBody,
} from '../types/api'

export const HANDLE_RE = /^[a-z0-9_]{2,32}$/

export function paramString(req: Request, key: string): string {
  const p = req.params[key]
  const s = Array.isArray(p) ? p[0] : p
  return typeof s === 'string' ? s : ''
}

export function paramIsoA2(req: Request): string {
  return paramString(req, 'isoA2')
}

export function paramCountryName(req: Request): string {
  return paramString(req, 'countryName')
}

export function paramUserId(req: Request): string {
  return paramString(req, 'id')
}

export function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id)
}

function stringArrayFromBody(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  return value.filter((x): x is string => typeof x === 'string')
}

function stringRecordFromBody(value: unknown): Record<string, string> | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(value)) {
    if (typeof v === 'string') out[k] = v
  }
  return out
}

export function parseCreateOrUpdateUserBody(
  body: Record<string, unknown>
): CreateOrUpdateUserBody {
  const idRaw = typeof body.id === 'string' ? body.id.trim() : ''
  const handleRaw =
    typeof body.handle === 'string' ? body.handle.trim().replace(/^@+/, '') : ''
  const displayName =
    typeof body.displayName === 'string' ? body.displayName.trim() : ''
  const bio = typeof body.bio === 'string' ? body.bio.trim() : ''
  const photoDataUrl =
    typeof body.photoDataUrl === 'string' ? body.photoDataUrl : ''
  const visitedCountries = Array.isArray(body.visitedCountries)
    ? body.visitedCountries.filter((x): x is string => typeof x === 'string')
    : []
  const visitedLandmarks = Array.isArray(body.visitedLandmarks)
    ? body.visitedLandmarks.filter((x): x is string => typeof x === 'string')
    : []
  const countryFillColors = stringRecordFromBody(body.countryFillColors) ?? {}

  return {
    id: idRaw,
    handle: handleRaw,
    displayName,
    bio,
    photoDataUrl,
    visitedCountries,
    visitedLandmarks,
    countryFillColors,
  }
}

export function parseBootstrapUserBody(body: Record<string, unknown>): {
  visitedCountries: string[]
  visitedLandmarks: string[]
  countryFillColors: Record<string, string>
} {
  const visitedCountries = Array.isArray(body.visitedCountries)
    ? body.visitedCountries.filter((x): x is string => typeof x === 'string')
    : []
  const visitedLandmarks = Array.isArray(body.visitedLandmarks)
    ? body.visitedLandmarks.filter((x): x is string => typeof x === 'string')
    : []
  const countryFillColors = stringRecordFromBody(body.countryFillColors) ?? {}
  return { visitedCountries, visitedLandmarks, countryFillColors }
}

function authProfilePayload(body: Record<string, unknown>): AuthRegisterBody {
  const handle =
    typeof body.handle === 'string' ? body.handle.trim().replace(/^@+/, '') : ''
  const displayName =
    typeof body.displayName === 'string' ? body.displayName.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const bio = typeof body.bio === 'string' ? body.bio.trim() : ''
  const photoDataUrl =
    typeof body.photoDataUrl === 'string' ? body.photoDataUrl : ''
  const visitedCountries = Array.isArray(body.visitedCountries)
    ? body.visitedCountries.filter((x): x is string => typeof x === 'string')
    : []
  const visitedLandmarks = Array.isArray(body.visitedLandmarks)
    ? body.visitedLandmarks.filter((x): x is string => typeof x === 'string')
    : []
  const countryFillColors = stringRecordFromBody(body.countryFillColors) ?? {}
  return {
    handle,
    displayName,
    password,
    bio,
    photoDataUrl,
    visitedCountries,
    visitedLandmarks,
    countryFillColors,
  }
}

export function parseAuthLoginBody(body: Record<string, unknown>): AuthLoginBody {
  const handle =
    typeof body.handle === 'string' ? body.handle.trim().replace(/^@+/, '') : ''
  const password = typeof body.password === 'string' ? body.password : ''
  return { handle, password }
}

export function parseAuthRegisterBody(body: Record<string, unknown>): AuthRegisterBody {
  return authProfilePayload(body)
}

export function parseAuthClaimBody(body: Record<string, unknown>): AuthClaimBody {
  const userId = typeof body.userId === 'string' ? body.userId.trim() : ''
  return { userId, ...authProfilePayload(body) }
}

export function parsePatchVisitsBody(
  body: Record<string, unknown>
): PatchVisitsBody {
  const visitedCountries = stringArrayFromBody(body.visitedCountries)
  const visitedLandmarks = stringArrayFromBody(body.visitedLandmarks)
  const countryFillColors = stringRecordFromBody(body.countryFillColors)
  const out: PatchVisitsBody = {}
  if (visitedCountries !== undefined) {
    out.visitedCountries = visitedCountries
  }
  if (visitedLandmarks !== undefined) {
    out.visitedLandmarks = visitedLandmarks
  }
  if (countryFillColors !== undefined) {
    out.countryFillColors = countryFillColors
  }
  return out
}

export function paramCountryCode(req: Request): string {
  return paramString(req, 'countryCode')
}

export function parseAddCountryPhotoBody(
  body: Record<string, unknown>
): AddCountryPhotoBody {
  const countryName =
    typeof body.countryName === 'string' ? body.countryName.trim() : ''
  const dataUrl = typeof body.dataUrl === 'string' ? body.dataUrl.trim() : ''
  return { countryName, dataUrl }
}

export function parsePatchCountryPhotosBody(
  body: Record<string, unknown>
): PatchCountryPhotosBody {
  const raw = body.photoIds
  if (!Array.isArray(raw)) {
    return { photoIds: [] }
  }
  const photoIds = raw
    .filter((x): x is string => typeof x === 'string')
    .map((x) => x.trim())
    .filter((x) => x.length > 0)
  return { photoIds }
}
