import { Router } from 'express'
import { login, register, getProfile, updateProfile, changePassword, updateProfileImage, deleteProfileImage } from '../controllers/auth.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = Router()

router.post('/login', login)
router.post('/register', register)
router.get('/me', authenticate, getProfile)
router.patch('/profile', authenticate, updateProfile)
router.patch('/password', authenticate, changePassword)
router.patch('/profile-image', authenticate, updateProfileImage)
router.delete('/profile-image', authenticate, deleteProfileImage)

export default router
