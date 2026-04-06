import { Router } from 'express'
import {
  getLandmarksByIso,
  getLandmarksByName,
} from '../controllers/landmarks.controller'

const router = Router()

router.get('/landmarks/country/:isoA2', getLandmarksByIso)
router.get('/landmarks/country/name/:countryName', getLandmarksByName)

export default router
