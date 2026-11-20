import type { SensorHistoryPoint } from "@/store/sensor-store"
import { OCCUPANCY_PRESSURE_THRESHOLD } from "./thresholds"

const MAX_GAP_MS = 15 * 60 * 1000 // cap a single reading gap so data outages don't skew totals

export interface OccupancySeriesPoint {
  label: string
  value: number
}

export interface OccupancyStats {
  todayOccupiedMs: number
  todayFreeMs: number
  occupancyPct: number
  dailySeries: OccupancySeriesPoint[] // today, by hour — minutes occupied
  weeklySeries: OccupancySeriesPoint[] // last 7 days — % occupied
  monthlySeries: OccupancySeriesPoint[] // last 30 days — % occupied
}

function isOccupied(point: SensorHistoryPoint): boolean {
  return point.pressure > OCCUPANCY_PRESSURE_THRESHOLD
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

// Buckets pressure-derived occupancy by hour (today) and by day (week/month),
// attributing each gap between consecutive readings to the earlier reading's
// day/hour and capping it so a long data outage can't inflate the total.
export function computeOccupancyStats(history: SensorHistoryPoint[]): OccupancyStats {
  const sorted = [...history].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  const now = new Date()
  const todayKey = dayKey(now)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()

  const hourlyMs = new Array(24).fill(0)
  let todayOccupiedMs = 0
  const dayTotals = new Map<string, { occupiedMs: number; spanMs: number }>()

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]
    const curr = sorted[i]
    const prevDate = new Date(prev.timestamp)
    const key = dayKey(prevDate)
    const span = Math.min(new Date(curr.timestamp).getTime() - prevDate.getTime(), MAX_GAP_MS)
    const occupied = isOccupied(prev) ? span : 0

    const entry = dayTotals.get(key) ?? { occupiedMs: 0, spanMs: 0 }
    entry.occupiedMs += occupied
    entry.spanMs += span
    dayTotals.set(key, entry)

    if (key === todayKey) {
      todayOccupiedMs += occupied
      hourlyMs[prevDate.getHours()] += occupied
    }
  }

  const elapsedToday = Math.max(now.getTime() - startOfToday, 1)
  const todayFreeMs = Math.max(elapsedToday - todayOccupiedMs, 0)
  const occupancyPct = Math.round((todayOccupiedMs / elapsedToday) * 100)

  const dailySeries: OccupancySeriesPoint[] = hourlyMs.map((ms, hour) => ({
    label: `${hour.toString().padStart(2, "0")}:00`,
    value: Math.round(ms / 60000),
  }))

  const buildDaySeries = (days: number): OccupancySeriesPoint[] => {
    const points: OccupancySeriesPoint[] = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const entry = dayTotals.get(dayKey(d))
      const pct = entry && entry.spanMs > 0 ? Math.round((entry.occupiedMs / entry.spanMs) * 100) : 0
      points.push({ label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), value: pct })
    }
    return points
  }

  return {
    todayOccupiedMs,
    todayFreeMs,
    occupancyPct,
    dailySeries,
    weeklySeries: buildDaySeries(7),
    monthlySeries: buildDaySeries(30),
  }
}

export function formatDuration(ms: number): string {
  const totalMinutes = Math.round(ms / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes}m`
  return `${hours}h ${minutes}m`
}
