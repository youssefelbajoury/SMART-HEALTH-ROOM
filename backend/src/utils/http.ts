import { Response } from "express";
import { logger } from "./logger.js";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function handleError(res: Response, error: any, fallbackMessage: string) {
  const statusCode = error?.statusCode || 500;
  logger.error(fallbackMessage, error);
  res.status(statusCode).json({ error: error?.message || fallbackMessage });
}
