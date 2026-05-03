import type { Request, Response } from 'express'
import { getCountriesListPayload } from '../services/countries.service'
import { sendError } from '../utils/respond'

export async function listCountries(_req: Request, res: Response): Promise<void> {
  try {
    const { features, travelProgressUniverse } = await getCountriesListPayload()
    res.json({ features, travelProgressUniverse })
  } catch (e: unknown) {
    sendError(res, e, { status: 500, message: 'Failed to load countries' })
  }
}
