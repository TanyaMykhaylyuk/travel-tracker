import express, { type Request, type Response } from 'express'
import cors from 'cors'
import { CountryLandmarkModel } from './models/CountryLandmark'

const app = express()

app.use(cors())
app.use(express.json())

function paramIsoA2(req: Request): string {
  const p = req.params.isoA2
  const s = Array.isArray(p) ? p[0] : p
  return typeof s === 'string' ? s : ''
}

function paramCountryName(req: Request): string {
  const p = req.params.countryName
  const s = Array.isArray(p) ? p[0] : p
  return typeof s === 'string' ? s : ''
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

app.get('/api/landmarks/country/:isoA2', async (req: Request, res: Response) => {
  const raw = paramIsoA2(req).toUpperCase()
  if (!/^[A-Z]{2}$/.test(raw)) {
    res.status(400).json({ error: 'Invalid country code' })
    return
  }
  try {
    const doc = await CountryLandmarkModel.findOne({ isoA2: raw }).lean()
    if (!doc) {
      res.status(404).json({ error: 'Not found' })
      return
    }
    res.json({
      countryName: doc.countryName,
      landmarks: doc.landmarks,
    })
  } catch {
    res.status(500).json({ error: 'Failed to load landmarks' })
  }
})

app.get('/api/landmarks/country/name/:countryName', async (req: Request, res: Response) => {
  const raw = paramCountryName(req)
  const normalized = raw.trim()
  if (!normalized) {
    res.status(400).json({ error: 'Country name is required' })
    return
  }

  try {
    const doc = await CountryLandmarkModel.findOne({
      countryName: { $regex: `^${escapeRegExp(normalized)}$`, $options: 'i' },
    }).lean()

    if (!doc) {
      res.status(404).json({ error: 'Not found' })
      return
    }

    res.json({
      countryName: doc.countryName,
      landmarks: doc.landmarks,
    })
  } catch {
    res.status(500).json({ error: 'Failed to load landmarks' })
  }
})

export default app
