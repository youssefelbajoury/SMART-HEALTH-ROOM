// Shared DHT11 fallback logic — used by both the live simulator
// (BaselineSensorSimulator) and historical-chart synthesis (sensor-store's
// fetchHistory), so "what counts as a broken reading" and "what a
// simulated reading looks like" only need to be defined once.

// Target range for synthetic readings, per spec.
export const SIM_TEMP_RANGE: [number, number] = [20, 28]
export const SIM_HUMIDITY_RANGE: [number, number] = [40, 60]

// Real-world plausibility bounds for an indoor bedroom — anything outside
// this (or exactly 0, the classic stuck/disconnected DHT11 symptom) is
// treated as a broken reading even if the socket itself is connected.
const PLAUSIBLE_TEMP_RANGE: [number, number] = [5, 45]
const PLAUSIBLE_HUMIDITY_RANGE: [number, number] = [15, 95]

export function clamp(value: number, [min, max]: [number, number]) {
  return Math.min(max, Math.max(min, value))
}

export function isInvalidTemperature(value: number | undefined): boolean {
  return (
    value === undefined ||
    Number.isNaN(value) ||
    value === 0 ||
    value < PLAUSIBLE_TEMP_RANGE[0] ||
    value > PLAUSIBLE_TEMP_RANGE[1]
  )
}

export function isInvalidHumidity(value: number | undefined): boolean {
  return (
    value === undefined ||
    Number.isNaN(value) ||
    value === 0 ||
    value < PLAUSIBLE_HUMIDITY_RANGE[0] ||
    value > PLAUSIBLE_HUMIDITY_RANGE[1]
  )
}

function step(current: number, range: [number, number], magnitude: number) {
  return clamp(current + (Math.random() * 2 - 1) * magnitude, range)
}

/**
 * Replaces invalid temperature/humidity points in a history series with a
 * smooth random-walk within the DHT11 spec range, while leaving every valid
 * point (and every other sensor field) untouched. The walk carries over from
 * the last real reading when one exists, so a partial outage still reads as
 * one continuous line instead of jumping.
 */
export function synthesizeDht11History<T extends { temperature: number; humidity: number }>(
  history: T[]
): T[] {
  let simTemp = 24
  let simHumidity = 50

  return history.map((point) => {
    const tempInvalid = isInvalidTemperature(point.temperature)
    const humidityInvalid = isInvalidHumidity(point.humidity)

    if (!tempInvalid) simTemp = clamp(point.temperature, SIM_TEMP_RANGE)
    if (!humidityInvalid) simHumidity = clamp(point.humidity, SIM_HUMIDITY_RANGE)

    if (!tempInvalid && !humidityInvalid) return point

    if (tempInvalid) simTemp = step(simTemp, SIM_TEMP_RANGE, 0.3)
    if (humidityInvalid) simHumidity = step(simHumidity, SIM_HUMIDITY_RANGE, 0.6)

    return {
      ...point,
      temperature: tempInvalid ? Number(simTemp.toFixed(1)) : point.temperature,
      humidity: humidityInvalid ? Math.round(simHumidity) : point.humidity,
    }
  })
}
