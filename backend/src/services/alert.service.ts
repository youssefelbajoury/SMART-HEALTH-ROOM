import { Alert } from '../models/Alert.js'
import { broadcastToUser } from './websocket.service.js'
import { logger } from '../utils/logger.js'
import { THRESHOLDS } from '../config/thresholds.js'

export class AlertService {
  static async checkAndCreate(
    userId: string,
    readings: Record<string, number>
  ): Promise<void> {
    for (const [key, value] of Object.entries(readings)) {
      const threshold = THRESHOLDS[key]
      if (!threshold) continue

      let type: 'danger' | 'warning' | 'info' = 'info'
      let message = 'Tout est normal'

      if (value >= threshold.danger) {
        type = 'danger'
        message = `${key} CRITIQUE: ${value} (seuil: ${threshold.danger})`
      } else if (value >= threshold.warning) {
        type = 'warning'
        message = `${key} élevé: ${value} (seuil: ${threshold.warning})`
      } else {
        // Pas d'alerte pour "info", on skip
        continue
      }

      // Crée l'alerte
      const alert = await Alert.create({
        userId,
        type,
        message,
        sensor: threshold.sensor,
        value,
        threshold: type === 'danger' ? threshold.danger : threshold.warning,
        timestamp: new Date(),
        read: false
      })

      // Envoie en temps réel via WebSocket
      broadcastToUser(userId, 'new-alert', {
        alert: {
          id: alert._id,
          type: alert.type,
          message: alert.message,
          sensor: alert.sensor,
          value: alert.value,
          timestamp: alert.timestamp,
          read: alert.read
        },
        unreadCount: await this.getUnreadCount(userId)
      })

      logger.info(`🚨 Alert ${type} created for user ${userId}: ${message}`)
    }
  }

  static async getUnreadCount(userId: string): Promise<number> {
    return Alert.countDocuments({ userId, read: false })
  }

  static async getAlerts(userId: string, limit: number = 50): Promise<any[]> {
    return Alert.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean()
  }

  static async markAsRead(alertId: string, userId: string): Promise<boolean> {
    const result = await Alert.updateOne(
      { _id: alertId, userId },
      { $set: { read: true } }
    )
    return result.modifiedCount > 0
  }

  static async markAllAsRead(userId: string): Promise<number> {
    const result = await Alert.updateMany(
      { userId, read: false },
      { $set: { read: true } }
    )
    return result.modifiedCount
  }

  static async deleteOldAlerts(userId: string, days: number = 30): Promise<void> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    await Alert.deleteMany({ userId, timestamp: { $lt: cutoff } })
  }
}