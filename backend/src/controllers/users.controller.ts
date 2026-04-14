import type { Request, Response } from 'express'
import {
  addUserCountryPhoto,
  bootstrapAnonymousUser,
  createOrUpdateUser,
  getUserCountryPhotos,
  getUserById,
  patchUserCountryPhotos,
  patchUserVisits,
} from '../services/users.service'
import { sendError } from '../utils/respond'
import {
  parseBootstrapUserBody,
  parseAddCountryPhotoBody,
  parsePatchCountryPhotosBody,
  parseCreateOrUpdateUserBody,
  parsePatchVisitsBody,
  paramCountryCode,
  paramUserId,
} from '../utils/validation'

export async function bootstrapUser(req: Request, res: Response): Promise<void> {
  const body = req.body as Record<string, unknown>
  try {
    const visits = parseBootstrapUserBody(body)
    const user = await bootstrapAnonymousUser(visits)
    res.json(user)
  } catch (e: unknown) {
    sendError(res, e, { status: 500, message: 'Failed to create user' })
  }
}

export async function upsertUser(req: Request, res: Response): Promise<void> {
  const body = req.body as Record<string, unknown>
  try {
    const parsed = parseCreateOrUpdateUserBody(body)
    const user = await createOrUpdateUser(parsed)
    res.json(user)
  } catch (e: unknown) {
    sendError(res, e, { status: 500, message: 'Failed to save user' })
  }
}

export async function getUser(req: Request, res: Response): Promise<void> {
  const id = paramUserId(req)
  try {
    const user = await getUserById(id)
    res.json(user)
  } catch (e: unknown) {
    sendError(res, e, { status: 500, message: 'Failed to load user' })
  }
}

export async function patchVisits(req: Request, res: Response): Promise<void> {
  const id = paramUserId(req)
  const body = req.body as Record<string, unknown>
  try {
    const parsed = parsePatchVisitsBody(body)
    const data = await patchUserVisits(id, parsed)
    res.json(data)
  } catch (e: unknown) {
    sendError(res, e, { status: 500, message: 'Failed to update visits' })
  }
}

export async function getCountryPhotos(req: Request, res: Response): Promise<void> {
  const id = paramUserId(req)
  const countryCode = paramCountryCode(req)
  try {
    const data = await getUserCountryPhotos(id, countryCode)
    res.json(data)
  } catch (e: unknown) {
    sendError(res, e, { status: 500, message: 'Failed to load country photos' })
  }
}

export async function postCountryPhoto(req: Request, res: Response): Promise<void> {
  const id = paramUserId(req)
  const countryCode = paramCountryCode(req)
  const body = req.body as Record<string, unknown>
  try {
    const parsed = parseAddCountryPhotoBody(body)
    const data = await addUserCountryPhoto(id, countryCode, parsed)
    res.status(201).json(data)
  } catch (e: unknown) {
    sendError(res, e, { status: 500, message: 'Failed to save country photo' })
  }
}

export async function patchCountryPhotos(req: Request, res: Response): Promise<void> {
  const id = paramUserId(req)
  const countryCode = paramCountryCode(req)
  const body = req.body as Record<string, unknown>
  try {
    const { photoIds } = parsePatchCountryPhotosBody(body)
    const data = await patchUserCountryPhotos(id, countryCode, photoIds)
    res.json(data)
  } catch (e: unknown) {
    sendError(res, e, { status: 500, message: 'Failed to update country photos' })
  }
}
