import { Router } from 'express'
import authRoutes from './auth.routes.js'
import sensorRoutes from './sensor.routes.js'
import alertRoutes from './alert.routes.js'
import emergencyRoutes from './emergency.routes.js'
import adminRoutes from './admin.routes.js'
import logRoutes from './log.routes.js'
import statusRoutes from './status.routes.js'
import orderRoutes from './order.routes.js'
import bedRoutes from './bed.routes.js'
import accessRoutes from './access.routes.js'


const router = Router()

router.use('/auth', authRoutes)
router.use('/sensors', sensorRoutes)
router.use('/alerts', alertRoutes)
router.use('/emergencies', emergencyRoutes)
router.use('/admin', adminRoutes)
router.use('/logs', logRoutes)
router.use('/status', statusRoutes)
router.use('/orders', orderRoutes)
// Top-level (not nested under /sensors) — must match the literal paths the
// ESP32 firmware posts to (iot/esp32/config.h: ENDPOINT_BED, ENDPOINT_ACCESS).
router.use('/bed', bedRoutes)
router.use('/access', accessRoutes)
export default router