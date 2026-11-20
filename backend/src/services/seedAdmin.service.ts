import { User } from "../models/User.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

// Crée le compte administrateur par défaut si aucun admin n'existe encore.
// Configurable via ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD (jamais en dur dans le code).
export const seedAdmin = async (): Promise<void> => {
  const existingAdmin = await User.findOne({ role: "admin" });
  if (existingAdmin) {
    return;
  }

  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    logger.warn(
      "No admin account exists and ADMIN_EMAIL/ADMIN_PASSWORD are not set — skipping admin seed. Set these env vars to auto-create one."
    );
    return;
  }

  await User.create({
    nom: env.ADMIN_NAME || "Administrator",
    email: env.ADMIN_EMAIL,
    password: env.ADMIN_PASSWORD,
    role: "admin",
  });

  logger.info(`✅ Default admin account created: ${env.ADMIN_EMAIL}`);
};
