import type { Request, Response } from 'express'
import {
  getLandmarksByCountryName,
  getLandmarksByIsoA2,
} from '../services/landmarks.service'
import { sendError } from '../utils/respond'
import { paramCountryName, paramIsoA2 } from '../utils/validation'

export async function getLandmarksByIso(req: Request, res: Response): Promise<void> {
  const raw = paramIsoA2(req).toUpperCase()
  if (!/^[A-Z]{2}$/.test(raw)) {
    res.status(400).json({ error: 'Invalid country code' })
    return
  }
  try {
    const data = await getLandmarksByIsoA2(raw)
    res.json(data)
  } catch (e: unknown) {
    sendError(res, e, { status: 500, message: 'Failed to load landmarks' })
  }
}

export async function getLandmarksByName(req: Request, res: Response): Promise<void> {
  const raw = paramCountryName(req)
  const normalized = raw.trim()
  if (!normalized) {
    res.status(400).json({ error: 'Country name is required' })
    return
  }

  try {
    const data = await getLandmarksByCountryName(normalized)
    res.json(data)
  } catch (e: unknown) {
    sendError(res, e, { status: 500, message: 'Failed to load landmarks' })
  }
}
