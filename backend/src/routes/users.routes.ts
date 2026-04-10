import { Router } from 'express'
import {
  bootstrapUser,
  getUser,
  patchVisits,
  upsertUser,
} from '../controllers/users.controller'

const router = Router()

router.post('/users/bootstrap', bootstrapUser)
router.post('/users', upsertUser)
router.get('/users/:id', getUser)
router.patch('/users/:id/visits', patchVisits)

export default router
