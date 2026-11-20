import { Request, Response } from "express";
import { LogService } from "../services/log.service.js";
import { LogLevel } from "../models/Log.js";
import { logger } from "../utils/logger.js";

// GET /api/v1/logs - Fetch technical system logs (paginated, filterable)
export const getLogs = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { level, search, page = "1", limit = "50" } = req.query;

    const result = await LogService.list(userId, {
      level: level as LogLevel | undefined,
      search: search as string | undefined,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });

    res.json({
      message: "Logs retrieved",
      logs: result.logs.map((l: any) => ({
        id: l._id,
        level: l.level,
        source: l.source,
        message: l.message,
        metadata: l.metadata,
        createdAt: l.createdAt,
      })),
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error("Get logs error:", error);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
};
