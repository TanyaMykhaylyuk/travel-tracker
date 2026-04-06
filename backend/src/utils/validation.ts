import mongoose from 'mongoose'
import type { Request } from 'express'
import type { CreateOrUpdateUserBody, PatchVisitsBody } from '../types/api'

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

  return {
    id: idRaw,
    handle: handleRaw,
    displayName,
    bio,
    photoDataUrl,
    visitedCountries,
    visitedLandmarks,
  }
}

export function parsePatchVisitsBody(
  body: Record<string, unknown>
): PatchVisitsBody {
  const visitedCountries = stringArrayFromBody(body.visitedCountries)
  const visitedLandmarks = stringArrayFromBody(body.visitedLandmarks)
  const out: PatchVisitsBody = {}
  if (visitedCountries !== undefined) {
    out.visitedCountries = visitedCountries
  }
  if (visitedLandmarks !== undefined) {
    out.visitedLandmarks = visitedLandmarks
  }
  return out
}
