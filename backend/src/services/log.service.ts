import { Log, LogLevel } from '../models/Log.js'
import { logger } from '../utils/logger.js'
import { broadcastToUser } from './websocket.service.js'

export interface ListLogsOptions {
  level?: LogLevel
  search?: string
  page?: number
  limit?: number
}

export class LogService {
  /**
   * Persists a system event for a user and broadcasts it live over Socket.IO.
   * This is the single source of truth for every system event — the Live
   * Event Center, the Logs page and the Timeline are all just different
   * presentations of this same stream, so every call site here is what
   * powers all three at once.
   * Fire-and-forget — logging must never throw or block the caller's actual
   * work (sensor ingest, auth, sockets...).
   */
  static async record(
    userId: string,
    level: LogLevel,
    source: string,
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      const log = await Log.create({ userId, level, source, message, metadata })
      broadcastToUser(userId, 'new-log', {
        id: log._id,
        level: log.level,
        source: log.source,
        message: log.message,
        metadata: log.metadata,
        createdAt: log.createdAt,
      })
    } catch (error) {
      logger.error('LogService.record failed:', error)
    }
  }

  static async list(userId: string, options: ListLogsOptions = {}) {
    const { level, search, page = 1, limit = 50 } = options
    const query: Record<string, unknown> = { userId }
    if (level) query.level = level
    if (search) query.message = { $regex: search, $options: 'i' }

    const skip = (page - 1) * limit
    const [logs, total] = await Promise.all([
      Log.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Log.countDocuments(query),
    ])

    return {
      logs,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    }
  }
}
