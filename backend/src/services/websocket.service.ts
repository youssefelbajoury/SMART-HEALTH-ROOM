import { Server as SocketIOServer } from 'socket.io'
import { logger } from '../utils/logger.js'
import { LogService } from './log.service.js'

let io: SocketIOServer | null = null
const userSockets = new Map<string, string>() // userId -> socketId

export function isUserOnline(userId: string): boolean {
  return userSockets.has(userId)
}

export function getOnlineUserCount(): number {
  return userSockets.size
}

export function initSocketIO(httpServer: any) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*', // À restreindre en production
      methods: ['GET', 'POST']
    }
  })

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`)

    socket.on('register', (userId: string) => {
      userSockets.set(userId, socket.id)
      socket.join(userId)
      logger.info(`User registered on socket: ${userId}`)
      LogService.record(userId, 'success', 'websocket', 'WebSocket connected')
    })

    socket.on('disconnect', () => {
      for (const [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          userSockets.delete(userId)
          logger.info(`User disconnected from socket: ${userId}`)
          LogService.record(userId, 'info', 'websocket', 'WebSocket disconnected')
          break
        }
      }
    })
  })

  return io
}

export function broadcastToUser(userId: string, event: string, data: any) {
  if (!io) {
    logger.warn('Socket.IO non initialisé')
    return
  }
  io.to(userId).emit(event, data)
  logger.info(`📡 Émission à ${userId}: ${event}`)
}