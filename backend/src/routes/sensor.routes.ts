import { Router } from 'express'
import {
  ingestData,
  getLatest,
  getHistory,
  assignDevice,
  toggleLamp,
  toggleDoor,
  toggleBuzzer,
  setRgb
} from '../controllers/sensor.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { requireRole } from '../middleware/rbac.middleware.js'


const router = Router()

// ESP32 envoie les données ici — pas de JWT utilisateur possible côté device
router.post('/data', ingestData)

// Actions déclenchées depuis le dashboard par l'utilisateur connecté (page Contrôle à distance)
router.post('/lamp/toggle', authenticate, toggleLamp)
router.post('/door/toggle', authenticate, toggleDoor)
router.post('/buzzer/toggle', authenticate, toggleBuzzer)
router.post('/rgb', authenticate, setRgb)

// Dashboard récupère les données
router.get('/latest', authenticate, getLatest)
router.get('/history', authenticate, getHistory)

// Assigner un device à un user — réservé aux admins (gestion des appareils IoT)
router.post('/assign-device', authenticate, requireRole('admin'), assignDevice)

export default router
