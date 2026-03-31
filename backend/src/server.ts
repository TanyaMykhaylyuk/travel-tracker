import express, { type Request, type Response } from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import { CountryLandmarkModel } from './models/CountryLandmark'
import { CountryCollectionModel } from './models/Country'
import { UserModel } from './models/User'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/countries', async (_req: Request, res: Response) => {
  try {
    const doc = await CountryCollectionModel.findOne({ key: 'default' }).lean()
    if (!doc) {
      res.status(404).json({ error: 'Countries dataset is not seeded' })
      return
    }
    res.json({ features: doc.features })
  } catch {
    res.status(500).json({ error: 'Failed to load countries' })
  }
})

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

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id)
}

const HANDLE_RE = /^[a-z0-9_]{2,32}$/

app.post('/api/users', async (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown>
  const idRaw = typeof body.id === 'string' ? body.id.trim() : ''
  const handleRaw = typeof body.handle === 'string' ? body.handle.trim().replace(/^@+/, '') : ''
  const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : ''
  const bio = typeof body.bio === 'string' ? body.bio.trim() : ''
  const photoDataUrl = typeof body.photoDataUrl === 'string' ? body.photoDataUrl : ''
  const visitedCountries = Array.isArray(body.visitedCountries)
    ? body.visitedCountries.filter((x): x is string => typeof x === 'string')
    : []
  const visitedLandmarks = Array.isArray(body.visitedLandmarks)
    ? body.visitedLandmarks.filter((x): x is string => typeof x === 'string')
    : []

  if (!handleRaw || !HANDLE_RE.test(handleRaw.toLowerCase())) {
    res.status(400).json({
      error: 'Username must be 2–32 characters: letters, numbers, underscore only.',
    })
    return
  }
  if (!displayName) {
    res.status(400).json({ error: 'Name is required.' })
    return
  }

  const handle = handleRaw.toLowerCase()

  try {
    if (idRaw && isValidObjectId(idRaw)) {
      const existing = await UserModel.findById(idRaw)
      if (!existing) {
        res.status(404).json({ error: 'User not found' })
        return
      }
      if (handle !== existing.handle) {
        const taken = await UserModel.findOne({ handle, _id: { $ne: idRaw } })
        if (taken) {
          res.status(409).json({ error: 'This username is already taken.' })
          return
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
        res.status(500).json({ error: 'Failed to save user' })
        return
      }

      res.json({
        id: String(doc._id),
        handle: doc.handle,
        displayName: doc.displayName,
        bio: doc.bio,
        photoDataUrl: doc.photoDataUrl,
        visitedCountries: doc.visitedCountries,
        visitedLandmarks: doc.visitedLandmarks,
      })
      return
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

    res.json({
      id: String(doc._id),
      handle: doc.handle,
      displayName: doc.displayName,
      bio: doc.bio,
      photoDataUrl: doc.photoDataUrl,
      visitedCountries: doc.visitedCountries,
      visitedLandmarks: doc.visitedLandmarks,
    })
  } catch (e: unknown) {
    const err = e as { code?: number }
    if (err.code === 11000) {
      res.status(409).json({ error: 'This username is already taken.' })
      return
    }
    res.status(500).json({ error: 'Failed to save user' })
  }
})

app.get('/api/users/:id', async (req: Request, res: Response) => {
  const id = typeof req.params.id === 'string' ? req.params.id : ''
  if (!isValidObjectId(id)) {
    res.status(400).json({ error: 'Invalid user id' })
    return
  }
  try {
    const doc = await UserModel.findById(id).lean()
    if (!doc) {
      res.status(404).json({ error: 'Not found' })
      return
    }
    res.json({
      id: String(doc._id),
      handle: doc.handle,
      displayName: doc.displayName,
      bio: doc.bio,
      photoDataUrl: doc.photoDataUrl,
      visitedCountries: doc.visitedCountries,
      visitedLandmarks: doc.visitedLandmarks,
    })
  } catch {
    res.status(500).json({ error: 'Failed to load user' })
  }
})

app.patch('/api/users/:id/visits', async (req: Request, res: Response) => {
  const id = typeof req.params.id === 'string' ? req.params.id : ''
  if (!isValidObjectId(id)) {
    res.status(400).json({ error: 'Invalid user id' })
    return
  }
  const body = req.body as Record<string, unknown>
  const visitedCountries = Array.isArray(body.visitedCountries)
    ? body.visitedCountries.filter((x): x is string => typeof x === 'string')
    : undefined
  const visitedLandmarks = Array.isArray(body.visitedLandmarks)
    ? body.visitedLandmarks.filter((x): x is string => typeof x === 'string')
    : undefined

  if (visitedCountries === undefined && visitedLandmarks === undefined) {
    res.status(400).json({ error: 'Nothing to update' })
    return
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
      res.status(404).json({ error: 'Not found' })
      return
    }
    res.json({
      id: String(doc._id),
      visitedCountries: doc.visitedCountries,
      visitedLandmarks: doc.visitedLandmarks,
    })
  } catch {
    res.status(500).json({ error: 'Failed to update visits' })
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
