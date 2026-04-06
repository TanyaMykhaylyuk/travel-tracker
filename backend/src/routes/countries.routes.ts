import { Router } from 'express'
import { listCountries } from '../controllers/countries.controller'

const router = Router()

router.get('/countries', listCountries)

export default router
