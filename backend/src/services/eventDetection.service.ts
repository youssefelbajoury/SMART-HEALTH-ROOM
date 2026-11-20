import { LogService } from "./log.service.js";

interface ActuatorState {
  door?: string;
  lamp?: boolean;
  buzzer?: boolean;
  rgb?: string;
}

interface ActuatorReadings {
  servo?: string;
  lamp?: boolean;
  buzzer?: boolean;
  rgb?: { r: number; g: number; b: number };
}

// In-memory only, keyed by deviceId — a restart simply re-observes the
// current state on the next ingest without firing a spurious "changed"
// event, which is the correct behavior (nothing actually changed).
const lastActuatorState = new Map<string, ActuatorState>();

/**
 * Edge-detects actuator state changes from the continuous sensor telemetry
 * stream and logs+broadcasts a discrete event only when something actually
 * changed — turning the "sensors" flood (pushed every couple of seconds
 * regardless of change) into the Door Open/Closed, Lamp On/Off, Buzzer
 * Activated and RGB Changed events the Live Event Center needs.
 */
export function detectActuatorChanges(userId: string, deviceId: string, readings: ActuatorReadings) {
  const previous = lastActuatorState.get(deviceId) ?? {};
  const rgbLabel = readings.rgb ? `rgb(${readings.rgb.r}, ${readings.rgb.g}, ${readings.rgb.b})` : undefined;

  if (readings.servo !== undefined && readings.servo !== previous.door) {
    LogService.record(userId, "info", "actuator", readings.servo === "ouvert" ? "Door Open" : "Door Closed");
  }
  if (readings.lamp !== undefined && readings.lamp !== previous.lamp) {
    LogService.record(userId, "info", "actuator", readings.lamp ? "Lamp On" : "Lamp Off");
  }
  if (readings.buzzer !== undefined && readings.buzzer !== previous.buzzer && readings.buzzer) {
    LogService.record(userId, "warning", "actuator", "Buzzer Activated");
  }
  if (rgbLabel !== undefined && rgbLabel !== previous.rgb) {
    LogService.record(userId, "info", "actuator", `RGB Changed: ${rgbLabel}`);
  }

  lastActuatorState.set(deviceId, {
    door: readings.servo ?? previous.door,
    lamp: readings.lamp ?? previous.lamp,
    buzzer: readings.buzzer ?? previous.buzzer,
    rgb: rgbLabel ?? previous.rgb,
  });
}
