import { Request, Response } from "express";
import { User } from "../models/User.js";
import { LogService } from "../services/log.service.js";
import { logger } from "../utils/logger.js";

// POST /api/v1/access — Arduino Mega -> ESP32 -> here, on every RFID scan (granted/denied).
// Device-facing (no JWT), resolved by deviceId like the other IoT ingestion endpoints.
export const receiveAccessEvent = async (req: Request, res: Response) => {
  try {
    const { deviceId, status, uid, name } = req.body;

    if (!deviceId || !status) {
      return res.status(400).json({ error: "Missing required fields: deviceId, status" });
    }

    const user = await User.findOne({ deviceId });
    if (!user) {
      return res.status(404).json({ error: "Device not registered to any user" });
    }

    const accepted = status === "granted";
    const message = accepted
      ? `RFID Accepted${name ? `: ${name}` : ""}`
      : `RFID Denied${uid ? ` (card ${uid})` : ""}`;

    await LogService.record(user._id.toString(), accepted ? "success" : "warning", "rfid", message, {
      deviceId,
      uid,
      name,
    });

    logger.info(`Access event from ${deviceId}: ${status}`);
    res.status(200).json({ message: "Access event received", status });
  } catch (error) {
    logger.error("Access event error:", error);
    res.status(500).json({ error: "Failed to process access event" });
  }
};
