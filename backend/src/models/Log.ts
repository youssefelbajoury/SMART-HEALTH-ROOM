import mongoose, { Schema, Document } from 'mongoose'

export type LogLevel = 'info' | 'warning' | 'error' | 'success'

export interface ILog extends Document {
  userId: mongoose.Types.ObjectId
  level: LogLevel
  source: string
  message: string
  metadata?: Record<string, unknown>
  createdAt: Date
}

const LogSchema = new Schema<ILog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  level: { type: String, enum: ['info', 'warning', 'error', 'success'], required: true },
  source: { type: String, required: true },
  message: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
})

LogSchema.index({ userId: 1, createdAt: -1 })
LogSchema.index({ userId: 1, level: 1 })

export const Log = mongoose.model<ILog>('Log', LogSchema)
