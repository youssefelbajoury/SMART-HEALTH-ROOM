import { Request, Response } from "express";
import { Alert } from "../models/Alert.js";
import { AlertService } from "../services/alert.service.js";
import { broadcastToUser } from "../services/websocket.service.js";
import { logger } from "../utils/logger.js";

// GET /api/v1/alerts - Récupérer les alertes
export const getAlerts = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { limit = "50", page = "1" } = req.query;

    const query = userId ? { userId } : {};
    const limitNum = parseInt(limit as string);
    const skip = (parseInt(page as string) - 1) * limitNum;

    const [alerts, total] = await Promise.all([
      Alert.find(query).sort({ timestamp: -1 }).skip(skip).limit(limitNum).lean(),
      Alert.countDocuments(query),
    ]);

    res.json({
      message: "Alerts retrieved",
      alerts: alerts.map((a: any) => ({
        id: a._id,
        type: a.type,
        message: a.message,
        sensor: a.sensor,
        value: a.value,
        threshold: a.threshold,
        timestamp: a.timestamp,
        read: a.read,
      })),
      pagination: {
        total,
        page: parseInt(page as string),
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    logger.error("Get alerts error:", error);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
};

// PUT /api/v1/alerts/:id/read - Marquer une alerte comme lue
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const success = await AlertService.markAsRead(id, userId);
    if (!success) {
      return res.status(404).json({ error: "Alert not found" });
    }

    const unreadCount = await AlertService.getUnreadCount(userId);
    // Real-time sync across every connected client (web + mobile) for this
    // account — mirrors the already-existing `new-alert` broadcast pattern.
    broadcastToUser(userId, "alert-read", { alertId: id, unreadCount });

    res.json({ message: "Alert marked as read", unreadCount });
  } catch (error) {
    logger.error("Mark alert as read error:", error);
    res.status(500).json({ error: "Failed to mark alert as read" });
  }
};

// PUT /api/v1/alerts/read-all - Marquer toutes comme lues
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    await AlertService.markAllAsRead(userId);
    broadcastToUser(userId, "all-alerts-read", { unreadCount: 0 });

    res.json({ message: "All alerts marked as read", unreadCount: 0 });
  } catch (error) {
    logger.error("Mark all alerts as read error:", error);
    res.status(500).json({ error: "Failed to mark all alerts as read" });
  }
};

// DELETE /api/v1/alerts/:id
export const deleteAlert = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === "admin";

    const query = isAdmin ? { _id: id } : { _id: id, userId };
    const deleted = await Alert.findOneAndDelete(query);
    if (!deleted) {
      return res.status(404).json({ error: "Alert not found" });
    }

    const ownerId = deleted.userId.toString();
    broadcastToUser(ownerId, "alert-deleted", { alertId: id, unreadCount: await AlertService.getUnreadCount(ownerId) });

    res.json({ message: "Alert deleted" });
  } catch (error) {
    logger.error("Delete alert error:", error);
    res.status(500).json({ error: "Failed to delete alert" });
  }
};

// Alias pour compatibilité avec alert.routes.ts
export { markAsRead as markAlertRead, markAllAsRead as markAllRead };

// GET /api/v1/alerts/unread-count
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const count = await AlertService.getUnreadCount(userId);

    res.json({
      count,
      unreadCount: count,
    });
  } catch (error) {
    logger.error("Get unread count error:", error);
    res.status(500).json({ error: "Failed to get unread count" });
  }
};