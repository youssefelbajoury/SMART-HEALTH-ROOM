import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../utils/jwt.js'
import { User } from '../models/User.js'

export interface AuthenticatedUser {
  userId: string
  email: string
  role: string
  isActive: boolean
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' })
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)

    // Role/active status are re-read from the DB on every request (not trusted from the
    // JWT payload) so a suspension or role change takes effect immediately, not only
    // once the current access token expires.
    const user = await User.findById(decoded.userId).select('email role isActive')
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }
    if (!user.isActive) {
      return res.status(403).json({ error: 'Account suspended' })
    }

    req.user = {
      userId: decoded.userId,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    }
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}