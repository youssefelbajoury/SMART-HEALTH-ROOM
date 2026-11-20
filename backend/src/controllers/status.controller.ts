import { Request, Response } from "express";
import mongoose from "mongoose";
import { SensorData } from "../models/SensorData.js";
import { User } from "../models/User.js";
import { isUserOnline } from "../services/websocket.service.js";
import { EmailService } from "../services/email.service.js";
import { computeDeviceStatus, DeviceServiceStatus } from "../services/deviceStatus.service.js";
import { logger } from "../utils/logger.js";

type ServiceStatus = DeviceServiceStatus;

interface ServiceState {
  status: ServiceStatus;
  lastUpdate: string | null;
}

// GET /api/v1/status - Live connection status for every backend-facing service
export const getStatus = async (req: Request, res: Response) => {
  const now = new Date();
  const userId = req.user!.userId;

  const backend: ServiceState = { status: "online", lastUpdate: now.toISOString() };

  const mongoState = mongoose.connection.readyState;
  const mongodb: ServiceState = {
    status: mongoState === 1 ? "online" : mongoState === 2 ? "connecting" : "offline",
    lastUpdate: now.toISOString(),
  };

  const websocket: ServiceState = {
    status: isUserOnline(userId) ? "online" : "offline",
    lastUpdate: now.toISOString(),
  };

  const api: ServiceState = { status: "online", lastUpdate: now.toISOString() };

  const emailService: ServiceState = {
    status: EmailService.isConfigured() ? "online" : "offline",
    lastUpdate: null,
  };

  let esp32: ServiceState = { status: "offline", lastUpdate: null };
  let arduino: ServiceState = { status: "offline", lastUpdate: null };

  try {
    const user = await User.findById(userId).select("deviceId");
    if (user?.deviceId) {
      const latest = await SensorData.findOne({ deviceId: user.deviceId }).sort({ timestamp: -1 });
      if (latest) {
        const status = computeDeviceStatus(latest.timestamp, now);
        esp32 = { status, lastUpdate: latest.timestamp.toISOString() };
        // The Arduino Mega reports through the ESP32 uplink — it shares the same last-seen signal.
        arduino = { status, lastUpdate: latest.timestamp.toISOString() };
      }
    }
  } catch (error) {
    logger.error("Get status error (device lookup):", error);
  }

  res.json({
    backend,
    mongodb,
    websocket,
    esp32,
    arduino,
    emailService,
    api,
  });
};
