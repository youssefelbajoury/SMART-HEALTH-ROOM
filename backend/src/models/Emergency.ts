import mongoose, { Schema, Document } from 'mongoose'

export interface ITriggeredSensor {
  sensor: string
  value: number
  threshold: number
}

export interface IEmergency extends Document {
  userId: mongoose.Types.ObjectId
  deviceId: string
  level: 'warning' | 'danger'
  status: 'active' | 'resolved'
  triggeredSensors: ITriggeredSensor[]
  message: string
  buzzerActive: boolean
  emailSent: boolean
  createdAt: Date
  resolvedAt?: Date
}

const TriggeredSensorSchema = new Schema<ITriggeredSensor>(
  {
    sensor: { type: String, required: true },
    value: { type: Number, required: true },
    threshold: { type: Number, required: true },
  },
  { _id: false }
)

const EmergencySchema = new Schema<IEmergency>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  deviceId: { type: String, required: true },
  level: { type: String, enum: ['warning', 'danger'], required: true },
  status: { type: String, enum: ['active', 'resolved'], default: 'active', index: true },
  triggeredSensors: { type: [TriggeredSensorSchema], required: true },
  message: { type: String, required: true },
  buzzerActive: { type: Boolean, default: false },
  emailSent: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date },
})

// Une seule urgence "active" par utilisateur à la fois — recherche rapide pour l'upsert
EmergencySchema.index({ userId: 1, status: 1 })
EmergencySchema.index({ userId: 1, createdAt: -1 })

export const Emergency = mongoose.model<IEmergency>('Emergency', EmergencySchema)