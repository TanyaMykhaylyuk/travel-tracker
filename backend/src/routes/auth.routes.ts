import { Router } from 'express'
import { claim, login, register } from '../controllers/auth.controller'

const router = Router()

router.post('/auth/login', login)
router.post('/auth/register', register)
router.post('/auth/claim', claim)

export default router
