import { Emergency, IEmergency } from '../models/Emergency.js'
import { User } from '../models/User.js'
import { THRESHOLDS, levelFor, ThresholdLevel } from '../config/thresholds.js'
import { broadcastToUser } from './websocket.service.js'
import { EmailService } from './email.service.js'
import { LogService } from './log.service.js'
import { logger } from '../utils/logger.js'

export interface TriggeredSensorInfo {
  sensor: string
  label: string
  value: number
  threshold: number
  level: ThresholdLevel
}

export interface EmergencyEvaluation {
  level: ThresholdLevel
  triggered: TriggeredSensorInfo[]
}

const MONITORED_KEYS = Object.keys(THRESHOLDS)

export class EmergencyService {
  /**
   * Compare les lectures aux seuils configurés (config/thresholds.ts).
   * Ne touche jamais la base de données — pure fonction de décision.
   */
  static evaluate(readings: Record<string, number>): EmergencyEvaluation {
    const triggered: TriggeredSensorInfo[] = []
    let worst: ThresholdLevel = 'fine'

    for (const key of MONITORED_KEYS) {
      const value = readings[key]
      if (value === undefined || value === null || Number.isNaN(value)) continue

      const level = levelFor(key, value)
      if (level === 'fine') continue

      const threshold = THRESHOLDS[key]
      triggered.push({
        sensor: threshold.sensor,
        label: threshold.label,
        value,
        threshold: level === 'danger' ? threshold.danger : threshold.warning,
        level,
      })

      if (level === 'danger') worst = 'danger'
      else if (level === 'warning' && worst !== 'danger') worst = 'warning'
    }

    return { level: worst, triggered }
  }

  /**
   * Point d'entrée appelé à chaque ingestion capteur. Active, met à jour ou
   * résout l'incident d'urgence actif de l'utilisateur. Ne lève jamais —
   * une erreur ici ne doit jamais faire échouer l'ingestion des données.
   */
  static async process(
    userId: string,
    deviceId: string,
    readings: Record<string, any>
  ): Promise<{ evaluation: EmergencyEvaluation; emergency: IEmergency | null }> {
    const numericReadings: Record<string, number> = {
      temperature: Number(readings.temperature) || 0,
      humidity: Number(readings.humidity) || 0,
      airQuality: Number(readings.airQuality ?? readings.gas) || 0,
      soundLevel: Number(readings.soundLevel) || 0,
    }

    const evaluation = this.evaluate(numericReadings)

    if (evaluation.level === 'warning') {
      for (const t of evaluation.triggered) {
        LogService.record(userId, 'warning', 'threshold', `High ${t.label} (${t.value}, threshold ${t.threshold})`)
      }
    }

    try {
      const active = await Emergency.findOne({ userId, status: 'active' })

      if (evaluation.level === 'danger') {
        const emergency = await this.activate(userId, deviceId, evaluation, !!readings.buzzer, active)
        return { evaluation, emergency }
      }

      if (evaluation.level === 'fine' && active) {
        const resolved = await this.resolve(userId, active)
        return { evaluation, emergency: resolved }
      }

      return { evaluation, emergency: active }
    } catch (error) {
      logger.error('EmergencyService.process failed:', error)
      return { evaluation, emergency: null }
    }
  }

  private static async activate(
    userId: string,
    deviceId: string,
    evaluation: EmergencyEvaluation,
    buzzerActive: boolean,
    active: IEmergency | null
  ): Promise<IEmergency> {
    const message = `Urgence détectée: ${evaluation.triggered.map((t) => t.label).join(', ')}`
    const triggeredSensors = evaluation.triggered.map((t) => ({
      sensor: t.sensor,
      value: t.value,
      threshold: t.threshold,
    }))

    let emergency: IEmergency
    let isNew = false

    if (active) {
      active.triggeredSensors = triggeredSensors
      active.message = message
      active.buzzerActive = buzzerActive
      emergency = await active.save()
    } else {
      isNew = true
      emergency = await Emergency.create({
        userId,
        deviceId,
        level: 'danger',
        status: 'active',
        triggeredSensors,
        message,
        buzzerActive,
      })
      logger.info(`🚨 Emergency activated for user ${userId}: ${message}`)
      LogService.record(userId, 'error', 'emergency', `Emergency Activated: ${message}`)

      broadcastToUser(userId, 'door-command', { deviceId, servo: 'ouvert' })
      LogService.record(userId, 'info', 'actuator', 'Command Sent: Door Unlocked (Automatic — Emergency)')
    }

    if (isNew) {
      const user = await User.findById(userId)
      if (user?.email) {
        const sent = await EmailService.sendEmergencyEmail({
          to: user.email,
          level: 'danger',
          message,
          triggeredSensors: evaluation.triggered,
          timestamp: emergency.createdAt,
        })
        if (sent) {
          emergency.emailSent = true
          emergency = await emergency.save()
          LogService.record(userId, 'success', 'email', 'Emergency Email Sent')
        } else {
          LogService.record(userId, 'error', 'email', 'Emergency Email Failed')
        }
      }
    }

    broadcastToUser(userId, 'emergency:activated', {
      id: emergency._id,
      level: emergency.level,
      status: emergency.status,
      message: emergency.message,
      triggeredSensors: emergency.triggeredSensors,
      buzzerActive: emergency.buzzerActive,
      emailSent: emergency.emailSent,
      createdAt: emergency.createdAt,
    })

    return emergency
  }

  private static async resolve(userId: string, active: IEmergency): Promise<IEmergency> {
    active.status = 'resolved'
    active.resolvedAt = new Date()
    const resolved = await active.save()

    logger.info(`✅ Emergency resolved for user ${userId}`)
    LogService.record(userId, 'success', 'emergency', 'Emergency Resolved')

    broadcastToUser(userId, 'emergency:resolved', {
      id: resolved._id,
      resolvedAt: resolved.resolvedAt,
    })

    return resolved
  }

  static async getActive(userId: string): Promise<IEmergency | null> {
    return Emergency.findOne({ userId, status: 'active' })
  }

  static async getHistory(userId: string, limit = 50): Promise<IEmergency[]> {
    return Emergency.find({ userId }).sort({ createdAt: -1 }).limit(limit)
  }

  static async resolveManually(id: string, userId: string): Promise<IEmergency | null> {
    const emergency = await Emergency.findOne({ _id: id, userId, status: 'active' })
    if (!emergency) return null
    return this.resolve(userId, emergency)
  }
}