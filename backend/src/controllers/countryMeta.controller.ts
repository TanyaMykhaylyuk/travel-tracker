import type { Request, Response } from 'express'
import { sendError } from '../utils/respond'
import { paramCountryName } from '../utils/validation'
import {
  getCountryMetaByCountryName,
  getCountryMetaByIsoA2,
} from '../services/countryMeta.service'

export async function getCountryMetaByIso(
  req: Request,
  res: Response
): Promise<void> {
  const rawIso = String(req.params.isoA2 ?? '').trim()
  if (!/^[A-Za-z]{2}$/.test(rawIso)) {
    res.status(400).json({ error: 'Valid ISO A2 code is required' })
    return
  }

  try {
    const data = await getCountryMetaByIsoA2(rawIso)
    res.json(data)
  } catch (e: unknown) {
    sendError(res, e, { status: 500, message: 'Failed to load country meta' })
  }
}

export async function getCountryMetaByName(
  req: Request,
  res: Response
): Promise<void> {
  const raw = paramCountryName(req)
  const normalized = raw.trim()
  if (!normalized) {
    res.status(400).json({ error: 'Country name is required' })
    return
  }

  try {
    const data = await getCountryMetaByCountryName(normalized)
    res.json(data)
  } catch (e: unknown) {
    sendError(res, e, { status: 500, message: 'Failed to load country meta' })
  }
}
