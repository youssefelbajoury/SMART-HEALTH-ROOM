import mongoose from 'mongoose'
import { env } from './env.js'
import { logger } from '../utils/logger.js'

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI)
    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    logger.error('❌ MongoDB connection error:', error)
    process.exit(1)
  }
}

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect()
  logger.info('MongoDB Disconnected')
}