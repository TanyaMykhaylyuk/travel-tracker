import { Router } from 'express'
import {
  getCountryMetaByIso,
  getCountryMetaByName,
} from '../controllers/countryMeta.controller'

const router = Router()

router.get('/country-meta/country/:isoA2', getCountryMetaByIso)
router.get('/country-meta/country/name/:countryName', getCountryMetaByName)

export default router
