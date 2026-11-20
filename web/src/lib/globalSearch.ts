import type { Alert } from "@/store/alertStore"
import type { RecommendationHistoryEntry } from "@/store/recommendationHistoryStore"
import type { SystemLog } from "@/store/logStore"

export interface SearchRoute {
  label: string
  href: string
  keywords: string
}

export type SearchCategory = "Pages" | "Alerts" | "Recommendations" | "Sensors" | "Logs"

export interface SearchResult {
  id: string
  label: string
  sublabel?: string
  href: string
  category: SearchCategory
}

// Static sensor labels so "temperature"/"gas"/"humidity" etc. resolve to the
// dashboard even with no matching alert/log — these are always in memory
// (the live sensor grid), unlike alerts/logs which need real events to exist.
const SENSOR_ENTRIES: SearchRoute[] = [
  { label: "Temperature", href: "/dashboard", keywords: "temperature dht11 celsius heat" },
  { label: "Humidity", href: "/dashboard", keywords: "humidity moisture dht11" },
  { label: "Air Quality / Gas", href: "/dashboard", keywords: "air quality gas mq4 ppm" },
  { label: "Light Level", href: "/dashboard", keywords: "light lux ldr day night" },
  { label: "Sound Level", href: "/dashboard", keywords: "sound noise sy-m213" },
  { label: "Bed Occupancy", href: "/dashboard", keywords: "bed occupancy pressure sleep" },
]

function matches(query: string, ...fields: (string | undefined)[]): boolean {
  return fields.some((f) => f?.toLowerCase().includes(query))
}

export function buildSearchIndex(input: {
  query: string
  routes: SearchRoute[]
  alerts: Alert[]
  recommendationEntries: RecommendationHistoryEntry[]
  logs: SystemLog[]
}): SearchResult[] {
  const q = input.query.trim().toLowerCase()

  if (!q) {
    return input.routes.map((r) => ({ id: `page-${r.href}`, label: r.label, href: r.href, category: "Pages" as const }))
  }

  const results: SearchResult[] = []

  for (const route of input.routes) {
    if (matches(q, route.label, route.keywords)) {
      results.push({ id: `page-${route.href}`, label: route.label, href: route.href, category: "Pages" })
    }
  }

  for (const sensor of SENSOR_ENTRIES) {
    if (matches(q, sensor.label, sensor.keywords)) {
      results.push({ id: `sensor-${sensor.label}`, label: sensor.label, href: sensor.href, category: "Sensors" })
    }
  }

  for (const alert of input.alerts.slice(0, 30)) {
    if (matches(q, alert.message, alert.sensor, alert.type)) {
      results.push({
        id: `alert-${alert.id}`,
        label: alert.message,
        sublabel: new Date(alert.timestamp).toLocaleString("en-US"),
        href: "/dashboard/alerts",
        category: "Alerts",
      })
    }
  }

  for (const rec of input.recommendationEntries.slice(0, 20)) {
    if (matches(q, rec.message, rec.category, rec.severity)) {
      results.push({
        id: `recommendation-${rec.id}`,
        label: rec.message,
        sublabel: rec.category,
        href: "/dashboard",
        category: "Recommendations",
      })
    }
  }

  for (const log of input.logs.slice(0, 20)) {
    if (matches(q, log.message, log.source)) {
      results.push({
        id: `log-${log.id}`,
        label: log.message,
        sublabel: log.source,
        href: "/dashboard/history",
        category: "Logs",
      })
    }
  }

  return results.slice(0, 40)
}
