import { SensorData } from "../models/SensorData.js";
import { LogService } from "./log.service.js";
import { computeDeviceStatus, DeviceServiceStatus } from "./deviceStatus.service.js";
import { logger } from "../utils/logger.js";

const CHECK_INTERVAL_MS = 15 * 1000;

// In-memory only — a background watcher restart re-observes the current
// state on its next tick without firing a spurious transition (see the
// `previous === undefined` guard below), so nothing needs to be persisted.
const lastKnownStatus = new Map<string, DeviceServiceStatus>();

/**
 * Periodically re-evaluates every user's device liveness (reusing the exact
 * same threshold logic as the on-demand /status endpoint, see
 * deviceStatus.service.ts) and logs+broadcasts "ESP32 Connected" /
 * "ESP32 Disconnected" exactly once per transition, powering the Live Event
 * Center / Timeline without any user needing to have the dashboard open.
 */
export function startDeviceWatcher() {
  setInterval(async () => {
    try {
      const latestByUser = await SensorData.aggregate([
        { $sort: { timestamp: -1 } },
        { $group: { _id: "$userId", timestamp: { $first: "$timestamp" } } },
      ]);

      const now = new Date();
      for (const doc of latestByUser) {
        const userId = doc._id.toString();
        const status = computeDeviceStatus(doc.timestamp, now);
        const previous = lastKnownStatus.get(userId);

        if (previous !== undefined && previous !== status) {
          if (status === "online") {
            LogService.record(userId, "success", "esp32", "ESP32 Connected");
          } else if (previous === "online") {
            LogService.record(userId, "error", "esp32", "ESP32 Disconnected");
          }
        }

        lastKnownStatus.set(userId, status);
      }
    } catch (error) {
      logger.error("Device watcher failed:", error);
    }
  }, CHECK_INTERVAL_MS);
}
