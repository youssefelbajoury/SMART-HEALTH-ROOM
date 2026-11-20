import { Router } from 'express'
import { getAlerts, markAlertRead, markAllRead, getUnreadCount, deleteAlert } from '../controllers/alert.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = Router()

router.use(authenticate)

router.get('/', getAlerts)
router.get('/unread-count', getUnreadCount)
router.patch('/:id/read', markAlertRead)
router.patch('/read-all', markAllRead)
router.delete('/:id', deleteAlert)

export default router
