export type DeviceServiceStatus = "online" | "offline" | "connecting";

export const DEVICE_ONLINE_MS = 30 * 1000;
export const DEVICE_CONNECTING_MS = 2 * 60 * 1000;

// Single source of truth for "is this device online" — used by both the
// on-demand /status endpoint and the background device watcher so the two
// never drift apart.
export function computeDeviceStatus(
  lastSeenAt: Date | string | null | undefined,
  now: Date = new Date()
): DeviceServiceStatus {
  if (!lastSeenAt) return "offline";
  const ageMs = now.getTime() - new Date(lastSeenAt).getTime();
  if (ageMs < DEVICE_ONLINE_MS) return "online";
  if (ageMs < DEVICE_CONNECTING_MS) return "connecting";
  return "offline";
}
