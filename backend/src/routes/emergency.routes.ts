import { Router } from 'express'
import { getHistory, getActive, resolveEmergency, triggerTest } from '../controllers/emergency.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = Router()

router.use(authenticate)

router.get('/', getHistory)
router.get('/active', getActive)
router.patch('/:id/resolve', resolveEmergency)
router.post('/test-trigger', triggerTest)

export default router
