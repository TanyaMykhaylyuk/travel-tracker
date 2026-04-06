import type { Request, Response } from 'express'
import { getDefaultCountriesFeatures } from '../services/countries.service'
import { sendError } from '../utils/respond'

export async function listCountries(_req: Request, res: Response): Promise<void> {
  try {
    const features = await getDefaultCountriesFeatures()
    res.json({ features })
  } catch (e: unknown) {
    sendError(res, e, { status: 500, message: 'Failed to load countries' })
  }
}
