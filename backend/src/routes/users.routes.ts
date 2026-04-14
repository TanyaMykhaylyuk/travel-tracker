import { Router } from 'express'
import {
  bootstrapUser,
  getCountryPhotos,
  getUser,
  patchCountryPhotos,
  patchVisits,
  postCountryPhoto,
  upsertUser,
} from '../controllers/users.controller'

const router = Router()

router.post('/users/bootstrap', bootstrapUser)
router.post('/users', upsertUser)
router.get('/users/:id', getUser)
router.patch('/users/:id/visits', patchVisits)
router.get('/users/:id/countries/:countryCode/photos', getCountryPhotos)
router.post('/users/:id/countries/:countryCode/photos', postCountryPhoto)
router.patch('/users/:id/countries/:countryCode/photos', patchCountryPhotos)

export default router
