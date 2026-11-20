import { Request, Response } from "express";
import { EmergencyService } from "../services/emergency.service.js";
import { User } from "../models/User.js";
import { logger } from "../utils/logger.js";

// Un utilisateur ne voit que ses propres urgences ; un admin peut consulter
// celles d'un autre utilisateur en précisant ?userId=
function resolveUserId(req: Request): string | undefined {
  const isAdmin = req.user?.role === "admin";
  const requestedUserId = req.query.userId as string | undefined;
  if (isAdmin && requestedUserId) return requestedUserId;
  return req.user?.userId;
}

// GET /api/v1/emergencies - Historique des urgences
export const getHistory = async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const { limit = "50" } = req.query;
    const history = await EmergencyService.getHistory(userId, parseInt(limit as string));

    res.json({ emergencies: history });
  } catch (error) {
    logger.error("Get emergency history error:", error);
    res.status(500).json({ error: "Failed to fetch emergency history" });
  }
};

// GET /api/v1/emergencies/active - Urgence en cours (ou null)
export const getActive = async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const active = await EmergencyService.getActive(userId);
    res.json({ emergency: active });
  } catch (error) {
    logger.error("Get active emergency error:", error);
    res.status(500).json({ error: "Failed to fetch active emergency" });
  }
};

// POST /api/v1/emergencies/test-trigger - Déclenche une urgence de démonstration
// en faisant passer des lectures synthétiques (au-delà des seuils de danger réels)
// à travers le pipeline d'évaluation normal — même chemin de code qu'une vraie
// remontée ESP32, pas un simple flag théâtral.
export const triggerTest = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const user = await User.findById(userId);
    const deviceId = user?.deviceId || "manual-trigger";

    const { evaluation, emergency } = await EmergencyService.process(userId, deviceId, {
      temperature: 40,
      humidity: 92,
      airQuality: 700,
      soundLevel: 60,
      buzzer: true,
    });

    res.json({ message: "Test emergency triggered", evaluation, emergency });
  } catch (error) {
    logger.error("Trigger test emergency error:", error);
    res.status(500).json({ error: "Failed to trigger test emergency" });
  }
};

// PATCH /api/v1/emergencies/:id/resolve - Acquitter/résoudre manuellement
export const resolveEmergency = async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const { id } = req.params;
    const resolved = await EmergencyService.resolveManually(id, userId);

    if (!resolved) {
      return res.status(404).json({ error: "Active emergency not found" });
    }

    res.json({ message: "Emergency resolved", emergency: resolved });
  } catch (error) {
    logger.error("Resolve emergency error:", error);
    res.status(500).json({ error: "Failed to resolve emergency" });
  }
};
