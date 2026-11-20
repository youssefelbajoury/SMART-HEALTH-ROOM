import { Request, Response } from "express";
import { SensorData } from "../models/SensorData.js";
import { User } from "../models/User.js";
import { SleepScoreService } from "../services/sleepScore.service.js";
import { broadcastToUser } from "../services/websocket.service.js";
import { AlertService } from "../services/alert.service.js";
import { EmergencyService, EmergencyEvaluation } from "../services/emergency.service.js";
import { LogService } from "../services/log.service.js";
import { detectActuatorChanges } from "../services/eventDetection.service.js";
import { logger } from "../utils/logger.js";

// POST /api/v1/sensors/data - Recevoir données de l'ESP32
export const ingestData = async (req: Request, res: Response) => {
  try {
    const { deviceId, readings } = req.body;

    if (!deviceId || !readings) {
      return res.status(400).json({
        error: "Missing required fields: deviceId, readings",
      });
    }

    const user = await User.findOne({ deviceId });
    if (!user) {
      return res.status(404).json({
        error: "Device not registered to any user",
      });
    }

    const sensorData = await SensorData.create({
      deviceId,
      userId: user._id,
      temperature: readings.temperature,
      humidity: readings.humidity,
      airQuality: readings.airQuality,
      pressure: readings.pressure,
      motion: readings.motion,
      soundLevel: readings.soundLevel,
      light: readings.light || 0, // ← NOUVEAU : LDR
      lamp: readings.lamp || false, // ← NOUVEAU : Lampe
      servo: readings.servo || "fermé", // ← NOUVEAU : Servo
      rgb: readings.rgb || { r: 0, g: 0, b: 0 }, // ← NOUVEAU : RGB
      rfid: readings.rfid || "", // ← NOUVEAU : RFID
      gas: readings.gas || 0, // ← NOUVEAU : Gaz
      buzzer: readings.buzzer || false, // ← NOUVEAU : Buzzer
      lightStatus: readings.lightStatus || "jour", // ← NOUVEAU : Statut de la lumière (enum schema: jour/nuit)
      rtc: readings.rtc ? new Date(readings.rtc) : new Date(), // ← NOUVEAU : RTC
      co2: readings.co2 || null,
      timestamp: new Date(),
    });

    let sleepScore = null;
    if (readings.pressure > 500) {
      const recentData = await SensorData.find({
        userId: user._id,
        timestamp: { $gte: new Date(Date.now() - 8 * 60 * 60 * 1000) },
      }).sort({ timestamp: 1 });

      const session = SleepScoreService.detectSleepSession(recentData);
      if (session) {
        sleepScore = session.score;
        sensorData.sleepScore = sleepScore;
        await sensorData.save();
      }
    }

    const userId = user._id.toString();

    // Alertes par capteur (persistées) + cycle de vie de l'urgence globale
    await AlertService.checkAndCreate(userId, readings);
    const { evaluation, emergency } = await EmergencyService.process(
      userId,
      deviceId,
      readings,
    );
    detectActuatorChanges(userId, deviceId, {
      servo: readings.servo,
      lamp: readings.lamp,
      buzzer: readings.buzzer,
      rgb: readings.rgb,
    });

    const alert = buildAlertSummary(evaluation);

    // WebSocket temps réel avec ALERTE
    broadcastToUser(userId, "sensor-update", {
      temperature: sensorData.temperature,
      humidity: sensorData.humidity,
      airQuality: sensorData.airQuality,
      pressure: sensorData.pressure,
      motion: sensorData.motion,
      soundLevel: sensorData.soundLevel,
      light: sensorData.light, // ← NOUVEAU
      lamp: sensorData.lamp, // ← NOUVEAU
      servo: sensorData.servo, // ← NOUVEAU
      rgb: sensorData.rgb, // ← NOUVEAU
      rfid: sensorData.rfid, // ← NOUVEAU
      gas: sensorData.gas, // ← NOUVEAU
      buzzer: sensorData.buzzer, // ← NOUVEAU
      lightStatus: sensorData.lightStatus, // ← NOUVEAU
      rtc: sensorData.rtc, // ← NOUVEAU
      co2: sensorData.co2,
      sleepScore: sensorData.sleepScore,
      timestamp: sensorData.timestamp,
      alert: alert,
      emergency: emergency && emergency.status === "active"
        ? { id: emergency._id, level: emergency.level, message: emergency.message }
        : null,
    });

    logger.info(
      `Data from ${deviceId} - User: ${user.email} - Alert: ${alert.level}`,
    );
    LogService.record(userId, "info", "sensor", "Sensor Data Received", { deviceId });

    res.status(201).json({
      message: "Data received",
      sleepScore,
      alert,
      emergencyActive: !!emergency && emergency.status === "active",
      timestamp: sensorData.timestamp,
    });
  } catch (error) {
    logger.error("Sensor ingest error:", error);
    res.status(500).json({ error: "Failed to process sensor data" });
  }
};

// Résout le propriétaire d'un device et vérifie que l'utilisateur courant peut le piloter
// (les admins peuvent piloter n'importe quel device). Utilisé par toutes les commandes
// à distance (lampe, porte, buzzer, RGB) pour éviter de dupliquer cette vérification.
async function resolveOwnedDevice(req: Request, res: Response, deviceId: string) {
  if (!deviceId) {
    res.status(400).json({ error: "Missing deviceId" });
    return null;
  }

  const user = await User.findOne({ deviceId });
  if (!user) {
    res.status(404).json({ error: "Device not found" });
    return null;
  }

  if (req.user!.role !== "admin" && user._id.toString() !== req.user!.userId) {
    res.status(403).json({ error: "This device does not belong to you" });
    return null;
  }

  return user;
}

// ← NOUVEAU : POST /api/v1/lamp/toggle - Allumer/éteindre la lampe
export const toggleLamp = async (req: Request, res: Response) => {
  try {
    const { deviceId, on } = req.body;
    const user = await resolveOwnedDevice(req, res, deviceId);
    if (!user) return;

    // Envoyer la commande à l'ESP32 (via WebSocket ou autre mécanisme)
    // Pour l'instant, on stocke l'état et on le renvoie
    broadcastToUser(user._id.toString(), "lamp-command", {
      deviceId,
      on: !!on,
    });

    logger.info(`Lamp toggle command: ${deviceId} -> ${on ? "ON" : "OFF"}`);
    LogService.record(user._id.toString(), "info", "actuator", `Command Sent: Lamp ${on ? "On" : "Off"}`);

    res.json({
      message: "Lamp command sent",
      deviceId,
      on: !!on,
    });
  } catch (error) {
    logger.error("Lamp toggle error:", error);
    res.status(500).json({ error: "Failed to toggle lamp" });
  }
};

// POST /api/v1/sensors/door/toggle - Ouvrir/fermer la porte (servo)
export const toggleDoor = async (req: Request, res: Response) => {
  try {
    const { deviceId, open } = req.body;
    const user = await resolveOwnedDevice(req, res, deviceId);
    if (!user) return;

    const servo = open ? "ouvert" : "fermé";
    broadcastToUser(user._id.toString(), "door-command", { deviceId, servo });

    logger.info(`Door command: ${deviceId} -> ${servo}`);
    LogService.record(user._id.toString(), "info", "actuator", `Command Sent: Door ${open ? "Unlocked" : "Locked"}`);

    res.json({ message: "Door command sent", deviceId, servo });
  } catch (error) {
    logger.error("Door toggle error:", error);
    res.status(500).json({ error: "Failed to toggle door" });
  }
};

// POST /api/v1/sensors/buzzer/toggle - Activer/désactiver le buzzer
export const toggleBuzzer = async (req: Request, res: Response) => {
  try {
    const { deviceId, on } = req.body;
    const user = await resolveOwnedDevice(req, res, deviceId);
    if (!user) return;

    broadcastToUser(user._id.toString(), "buzzer-command", { deviceId, on: !!on });

    logger.info(`Buzzer command: ${deviceId} -> ${on ? "ON" : "OFF"}`);
    LogService.record(user._id.toString(), "info", "actuator", `Command Sent: Buzzer ${on ? "On" : "Off"}`);

    res.json({ message: "Buzzer command sent", deviceId, on: !!on });
  } catch (error) {
    logger.error("Buzzer toggle error:", error);
    res.status(500).json({ error: "Failed to toggle buzzer" });
  }
};

// POST /api/v1/sensors/rgb - Changer la couleur de la LED RGB
export const setRgb = async (req: Request, res: Response) => {
  try {
    const { deviceId, r, g, b } = req.body;
    const user = await resolveOwnedDevice(req, res, deviceId);
    if (!user) return;

    const isValidChannel = (v: unknown) => typeof v === "number" && v >= 0 && v <= 255;
    if (!isValidChannel(r) || !isValidChannel(g) || !isValidChannel(b)) {
      return res.status(400).json({ error: "r, g, b must be numbers between 0 and 255" });
    }

    broadcastToUser(user._id.toString(), "rgb-command", { deviceId, rgb: { r, g, b } });

    logger.info(`RGB command: ${deviceId} -> rgb(${r},${g},${b})`);
    LogService.record(user._id.toString(), "info", "actuator", `Command Sent: RGB LED rgb(${r}, ${g}, ${b})`);

    res.json({ message: "RGB command sent", deviceId, rgb: { r, g, b } });
  } catch (error) {
    logger.error("RGB set error:", error);
    res.status(500).json({ error: "Failed to set RGB" });
  }
};

// GET /api/v1/sensors/latest
export const getLatest = async (req: Request, res: Response) => {
  try {
    // Un utilisateur ne voit que ses propres données ; un admin peut consulter
    // celles d'un autre utilisateur en précisant ?userId=
    const isAdmin = req.user!.role === "admin";
    const requestedUserId = req.query.userId as string | undefined;
    const searchUserId = isAdmin && requestedUserId ? requestedUserId : req.user!.userId;

    const latest = await SensorData.findOne({ userId: searchUserId }).sort({
      timestamp: -1,
    });

    if (!latest) {
      return res.status(404).json({ error: "No data found" });
    }

    res.json({ data: latest });
  } catch (error) {
    logger.error("Get latest error:", error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
};

// GET /api/v1/sensors/history
export const getHistory = async (req: Request, res: Response) => {
  try {
    const { hours = 24 } = req.query;
    const isAdmin = req.user!.role === "admin";
    const requestedUserId = req.query.userId as string | undefined;
    const searchUserId = isAdmin && requestedUserId ? requestedUserId : req.user!.userId;

    const startDate = new Date(Date.now() - Number(hours) * 60 * 60 * 1000);

    const history = await SensorData.find({
      userId: searchUserId,
      timestamp: { $gte: startDate },
    }).sort({ timestamp: 1 });

    res.json({
      count: history.length,
      data: history,
    });
  } catch (error) {
    logger.error("Get history error:", error);
    res.status(500).json({ error: "Failed to fetch history" });
  }
};

// POST /api/v1/sensors/assign-device
export const assignDevice = async (req: Request, res: Response) => {
  try {
    const { userId, deviceId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const existing = await User.findOne({ deviceId });
    if (existing && existing._id.toString() !== userId) {
      return res
        .status(409)
        .json({ error: "Device already assigned to another user" });
    }

    user.deviceId = deviceId;
    await user.save();

    logger.info(`Device ${deviceId} assigned to user ${user.email}`);

    res.json({
      message: "Device assigned successfully",
      user: {
        id: user._id,
        email: user.email,
        deviceId: user.deviceId,
      },
    });
  } catch (error) {
    logger.error("Assign device error:", error);
    res.status(500).json({ error: "Failed to assign device" });
  }
};

// Résumé compact de l'évaluation EmergencyService, pour le WebSocket et la réponse HTTP.
// La décision (seuils, niveau) vient exclusivement de EmergencyService/config/thresholds.ts.
function buildAlertSummary(evaluation: EmergencyEvaluation) {
  if (evaluation.level === "danger") {
    return {
      level: "danger" as const,
      message: `DANGER: ${evaluation.triggered.map((t) => t.label).join(", ")}`,
      color: "red",
    };
  }

  if (evaluation.level === "warning") {
    return {
      level: "warning" as const,
      message: `Attention: ${evaluation.triggered.map((t) => t.label).join(", ")}`,
      color: "orange",
    };
  }

  return {
    level: "fine" as const,
    message: "Tout est normal",
    color: "green",
  };
}
