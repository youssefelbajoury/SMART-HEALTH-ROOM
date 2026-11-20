import { ISensorData } from '../models/SensorData.js'

interface SleepMetrics {
  duration: number      // minutes
  interruptions: number // nombre de mouvements
  environment: number   // 0-100
}

export class SleepScoreService {
  /**
   * Calcule le score de sommeil (0-100)
   */
  static calculateScore(data: ISensorData[], metrics: SleepMetrics): number {
    const durationScore = this.calculateDurationScore(metrics.duration)
    const continuityScore = this.calculateContinuityScore(metrics.interruptions)
    const envScore = metrics.environment

    const score = Math.round(
      durationScore * 0.35 + 
      continuityScore * 0.35 + 
      envScore * 0.30
    )

    return Math.min(100, Math.max(0, score))
  }

  private static calculateDurationScore(minutes: number): number {
    const hours = minutes / 60
    if (hours >= 7 && hours <= 9) return 100
    if (hours < 4) return 40
    if (hours > 10) return 80
    return hours < 7 
      ? 40 + ((hours - 4) / 3) * 60
      : 100 - ((hours - 9) * 20)
  }

  private static calculateContinuityScore(interruptions: number): number {
    if (interruptions === 0) return 100
    if (interruptions <= 2) return 85
    if (interruptions <= 5) return 70
    return Math.max(40, 100 - (interruptions * 10))
  }

  /**
   * Calcule le score environnemental basé sur les données
   */
  static calculateEnvironmentScore(data: ISensorData[]): number {
    if (data.length === 0) return 50

    const avgTemp = data.reduce((sum, d) => sum + d.temperature, 0) / data.length
    const avgHumidity = data.reduce((sum, d) => sum + d.humidity, 0) / data.length
    const avgNoise = data.reduce((sum, d) => sum + d.soundLevel, 0) / data.length
    const avgAir = data.reduce((sum, d) => sum + d.airQuality, 0) / data.length

    // Idéal: 18-22°C, 40-60% humidité, <30dB bruit, bonne qualité air
    const tempScore = avgTemp >= 18 && avgTemp <= 22 ? 100 : 70
    const humidityScore = avgHumidity >= 40 && avgHumidity <= 60 ? 100 : 75
    const noiseScore = avgNoise < 30 ? 100 : avgNoise < 50 ? 80 : 60
    const airScore = avgAir < 300 ? 100 : avgAir < 500 ? 80 : 60

    return Math.round((tempScore + humidityScore + noiseScore + airScore) / 4)
  }

  /**
   * Détecte une session de sommeil
   * Lit occupé (pressure > 500) + pas de mouvement pendant > 30 min
   */
  static detectSleepSession(data: ISensorData[], pressureThreshold = 500): {
    start: Date
    end: Date
    score: number
  } | null {
    // Filtre les périodes où le lit est occupé
    const occupied = data.filter(d => d.pressure > pressureThreshold)
    if (occupied.length < 6) return null // Min 30 min (6 lectures à 5min interval)

    const start = occupied[0].timestamp
    const end = occupied[occupied.length - 1].timestamp
    const duration = (end.getTime() - start.getTime()) / 1000 / 60 // minutes

    // Compte les interruptions (mouvements)
    const interruptions = occupied.filter(d => d.motion).length

    const metrics: SleepMetrics = {
      duration,
      interruptions,
      environment: this.calculateEnvironmentScore(occupied)
    }

    const score = this.calculateScore(occupied, metrics)

    return { start, end, score }
  }
}