import { Router } from 'express'
import { getStatus } from '../controllers/status.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = Router()

router.get('/', authenticate, getStatus)

export default router
