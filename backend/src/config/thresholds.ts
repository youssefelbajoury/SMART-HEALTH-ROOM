// Seuils d'alerte et d'urgence — source unique de vérité pour tout le backend.
// Ne jamais dupliquer ces valeurs ailleurs (controllers, services).

export interface SensorThreshold {
  sensor: string
  label: string
  warning: number
  danger: number
  unit: string
}

export const THRESHOLDS: Record<string, SensorThreshold> = {
  temperature: { sensor: 'DHT11', label: 'Température', warning: 30, danger: 35, unit: '°C' },
  humidity: { sensor: 'DHT11', label: 'Humidité', warning: 70, danger: 85, unit: '%' },
  airQuality: { sensor: 'MQ4', label: 'Qualité de l\'air (Gaz)', warning: 400, danger: 600, unit: 'ppm' },
  soundLevel: { sensor: 'SY-M213', label: 'Niveau sonore', warning: 40, danger: 50, unit: 'dB' },
}

export type ThresholdLevel = 'fine' | 'warning' | 'danger'

export function levelFor(key: string, value: number): ThresholdLevel {
  const threshold = THRESHOLDS[key]
  if (!threshold) return 'fine'
  if (value >= threshold.danger) return 'danger'
  if (value >= threshold.warning) return 'warning'
  return 'fine'
}