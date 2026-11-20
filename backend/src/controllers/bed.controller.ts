import { Request, Response } from "express";
import { User } from "../models/User.js";
import { LogService } from "../services/log.service.js";
import { logger } from "../utils/logger.js";

// POST /api/v1/bed — Arduino Mega -> ESP32 -> here, on bed occupied/free transitions.
// Device-facing (no JWT), resolved by deviceId like the other IoT ingestion endpoints.
export const receiveBedEvent = async (req: Request, res: Response) => {
  try {
    const { deviceId, status } = req.body;

    if (!deviceId || !status) {
      return res.status(400).json({ error: "Missing required fields: deviceId, status" });
    }

    const user = await User.findOne({ deviceId });
    if (!user) {
      return res.status(404).json({ error: "Device not registered to any user" });
    }

    const occupied = status === "lying";
    await LogService.record(
      user._id.toString(),
      "info",
      "sensor",
      occupied ? "Bed Occupied" : "Bed Free",
      { deviceId }
    );

    logger.info(`Bed event from ${deviceId}: ${status}`);
    res.status(200).json({ message: "Bed event received", status });
  } catch (error) {
    logger.error("Bed event error:", error);
    res.status(500).json({ error: "Failed to process bed event" });
  }
};
