import mongoose, { Schema, Document } from 'mongoose'

export interface IAlert extends Document {
  userId: mongoose.Types.ObjectId
  type: 'danger' | 'warning' | 'info'
  message: string
  sensor: string
  value: number
  threshold: number
  timestamp: Date
  read: boolean
}
// Schéma pour les alertes
const AlertSchema = new Schema<IAlert>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['danger', 'warning', 'info'], required: true },
  message: { type: String, required: true },
  sensor: { type: String, required: true },
  value: { type: Number, required: true },
  threshold: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }
})

// Index pour queries rapides
AlertSchema.index({ userId: 1, read: 1, timestamp: -1 })

export const Alert = mongoose.model<IAlert>('Alert', AlertSchema)