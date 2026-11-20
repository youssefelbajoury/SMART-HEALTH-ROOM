import nodemailer, { Transporter } from 'nodemailer'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'

let transporter: Transporter | null = null
let warned = false
let initialized = false

function getTransporter(): Transporter | null {
  if (initialized) return transporter
  initialized = true

  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    return null
  }

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT),
    secure: Number(env.SMTP_PORT) === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  })

  return transporter
}

export interface EmergencyEmailPayload {
  to: string
  level: 'warning' | 'danger'
  message: string
  triggeredSensors: { sensor: string; value: number; threshold: number }[]
  timestamp: Date
}

export class EmailService {
  /**
   * True once the SMTP transporter has been resolved as configured. Used by the
   * status endpoint — does not itself trigger transporter initialization.
   */
  static isConfigured(): boolean {
    return !!getTransporter()
  }

  /**
   * Envoie un email d'urgence. Ne lève jamais — l'échec d'email ne doit
   * jamais faire échouer le traitement d'une donnée capteur.
   */
  static async sendEmergencyEmail(payload: EmergencyEmailPayload): Promise<boolean> {
    const client = getTransporter()

    if (!client) {
      if (!warned) {
        warned = true
        logger.warn(
          '📧 Email désactivé: SMTP_HOST/SMTP_USER/SMTP_PASS non configurés dans .env — les emails d\'urgence sont ignorés.'
        )
      }
      return false
    }

    const sensorLines = payload.triggeredSensors
      .map((s) => `- ${s.sensor}: ${s.value} (seuil: ${s.threshold})`)
      .join('\n')

    try {
      await client.sendMail({
        from: env.ALERT_EMAIL_FROM || env.SMTP_USER,
        to: payload.to,
        subject: payload.level === 'danger' ? '🚨 URGENCE Smart Health Room' : '⚠️ Alerte Smart Health Room',
        text: `${payload.message}\n\nCapteurs déclenchés:\n${sensorLines}\n\nHeure: ${payload.timestamp.toLocaleString('fr-FR')}`,
      })
      return true
    } catch (error) {
      logger.error('Failed to send emergency email:', error)
      return false
    }
  }
}