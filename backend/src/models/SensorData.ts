import mongoose, { Schema, Document } from "mongoose";

export interface ISensorData extends Document {
  deviceId: string;
  userId: mongoose.Types.ObjectId;
  timestamp: Date;
  temperature: number;
  humidity: number;
  airQuality: number;
  pressure: number;
  motion: boolean;
  soundLevel: number;
  co2?: number;
  sleepScore?: number;
  light?: number; // ← NOUVEAU : LDR
  lamp?: boolean; // ← NOUVEAU : Lampe
  rfid: string; // ← NOUVEAU : RFID
  gas: number; // ← NOUVEAU : Gaz
  buzzer: boolean; // ← NOUVEAU : Buzzer
  lightStatus: string; // ← NOUVEAU : Statut de la lumière
  servo: string; // ← NOUVEAU : Servo
  rgb: {
    r: number;
    g: number;
    b: number;
  };
  rtc: Date; // ← NOUVEAU : RTC
}

const SensorDataSchema = new Schema<ISensorData>(
  {
    deviceId: {
      type: String,
      required: [true, "Device ID is required"],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    temperature: {
      type: Number,
      required: true,
    },
    humidity: {
      type: Number,
      required: true,
    },
    airQuality: {
      type: Number,
      required: true,
    },
    pressure: {
      type: Number,
      required: true,
    },
    motion: {
      type: Boolean,
      required: true,
    },
    soundLevel: {
      type: Number,
      required: true,
    },
    co2: {
      type: Number,
    },
    light: {
      type: Number,
      default: 500,
    },
    lamp: {
      type: Boolean,
      default: false,
    },
    sleepScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    rfid: {
      type: String,
      default: "",
    },
    gas: {
      type: Number,
      default: 0,
    },
    buzzer: {
      type: Boolean,
      default: false,
    },
    lightStatus: {
      type: String,
      enum: ["jour", "nuit"],
      default: "jour",
    },
    servo: {
      type: String,
      enum: ["ouvert", "fermé"],
      default: "fermé",
    },
    rgb: {
      r: { type: Number, default: 0 },
      g: { type: Number, default: 255 },
      b: { type: Number, default: 0 },
    },
    rtc: {
      type: Date,
      default: Date.now,
    },
  },

  {
    timestamps: true,
  },
);

// Index composés pour les requêtes fréquentes
SensorDataSchema.index({ userId: 1, timestamp: -1 });
SensorDataSchema.index({ deviceId: 1, timestamp: -1 });

export const SensorData = mongoose.model<ISensorData>(
  "SensorData",
  SensorDataSchema,
);
