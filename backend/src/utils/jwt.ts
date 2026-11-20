import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export interface TokenPayload {
  userId: string
  email: string
}

export const generateTokens = (payload: TokenPayload) => {
  // env values are validated strings (zod) but come in as a plain `string`,
  // narrower than jsonwebtoken's `expiresIn` template-literal type — the
  // runtime value ("15m", "7d", ...) is valid, so this cast is safe.
  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  })

  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  })

  return { accessToken, refreshToken }
}

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload
}

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload
}