import { Router } from 'express'
import { getLogs } from '../controllers/log.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = Router()

router.use(authenticate)

router.get('/', getLogs)

export default router
