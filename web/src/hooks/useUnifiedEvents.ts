import { useMemo } from "react"
import {
  AlertTriangle,
  Siren,
  ShieldCheck,
  LogIn,
  Lightbulb,
  Wifi,
  WifiOff,
  KeyRound,
  Package,
  Sparkles,
  CloudSun,
  BedDouble,
  type LucideIcon,
} from "lucide-react"
import { useAlertStore } from "@/store/alertStore"
import { useEmergencyStore } from "@/store/emergencyStore"
import { useLogStore } from "@/store/logStore"
import { useRecommendationHistoryStore } from "@/store/recommendationHistoryStore"
import { useWeatherStore } from "@/store/weatherStore"

export type EventSeverity = "success" | "warning" | "emergency" | "info"

export interface UnifiedEvent {
  id: string
  time: Date
  icon: LucideIcon
  color: string
  bg: string
  label: string
  category: string
  severity: EventSeverity
}

// Maps the fine-grained `category` values produced below into the 4 buckets
// the Notification Center filters by. Kept as one lookup so both the filter
// UI and the unread-style badge agree on what counts as "success" vs "info".
const SUCCESS_CATEGORIES = new Set(["admin", "order", "rfid"])
function severityFor(category: string, label: string): EventSeverity {
  if (category === "emergency") return "emergency"
  if (category === "warning") return "warning"
  if (SUCCESS_CATEGORIES.has(category)) return "success"
  if (category === "esp32" || category === "websocket" || category === "bed") {
    const isUp = label.toLowerCase().includes("connect") && !label.toLowerCase().includes("disconnect")
    return isUp || category === "bed" ? "success" : "info"
  }
  return "info"
}

interface SourceStyle {
  icon: LucideIcon
  color: string
  bg: string
  category: string
}

// Single source of truth for how a backend Log `source` renders in any
// timeline/event feed — extend here, not per-component, when a new
// LogService.record() source is introduced.
const LOG_SOURCE_STYLE: Record<string, SourceStyle> = {
  auth: { icon: LogIn, color: "text-sky-400", bg: "bg-sky-500/15", category: "auth" },
  actuator: { icon: Lightbulb, color: "text-violet-400", bg: "bg-violet-500/15", category: "actuator" },
  rfid: { icon: KeyRound, color: "text-cyan-400", bg: "bg-cyan-500/15", category: "rfid" },
  order: { icon: Package, color: "text-orange-400", bg: "bg-orange-500/15", category: "order" },
  admin: { icon: ShieldCheck, color: "text-fuchsia-400", bg: "bg-fuchsia-500/15", category: "admin" },
  threshold: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/15", category: "warning" },
}

// 'sensor' and 'esp32'/'websocket' sources flip icon/color based on message
// wording (Bed Occupied vs Free, Connected vs Disconnected) rather than a
// single static style — handled inline below instead of in the static table.
const CONNECTIVITY_SOURCES = new Set(["esp32", "websocket"])

function styleForLog(source: string, message: string): SourceStyle | null {
  if (source === "sensor" && message.startsWith("Bed")) {
    const occupied = message.includes("Occupied")
    return {
      icon: BedDouble,
      color: occupied ? "text-indigo-400" : "text-slate-400",
      bg: occupied ? "bg-indigo-500/15" : "bg-slate-500/15",
      category: "bed",
    }
  }
  if (CONNECTIVITY_SOURCES.has(source)) {
    const isUp = message.toLowerCase().includes("connect") && !message.toLowerCase().includes("disconnect")
    return {
      icon: isUp ? Wifi : WifiOff,
      color: isUp ? "text-emerald-400" : "text-slate-500",
      bg: isUp ? "bg-emerald-500/15" : "bg-slate-500/15",
      category: source,
    }
  }
  return LOG_SOURCE_STYLE[source] ?? null
}

/**
 * The one merged, timestamped event feed for the whole app — the Live Event
 * Center, the dashboard Timeline and (filtered) the Logs page all read from
 * this same hook so the merge logic (which stores, which log sources, how
 * they're styled) exists in exactly one place.
 */
export function useUnifiedEvents(): UnifiedEvent[] {
  const alerts = useAlertStore((s) => s.alerts)
  const emergencies = useEmergencyStore((s) => s.history)
  const logs = useLogStore((s) => s.logs)
  const recommendationEntries = useRecommendationHistoryStore((s) => s.entries)
  const lastWeatherFetchedAt = useWeatherStore((s) => s.lastFetchedAt)

  return useMemo(() => {
    const entries: UnifiedEvent[] = []

    for (const alert of alerts) {
      const danger = alert.type === "danger"
      const category = danger ? "emergency" : alert.type === "warning" ? "warning" : "info"
      entries.push({
        id: `alert-${alert.id}`,
        time: alert.timestamp,
        icon: AlertTriangle,
        color: danger ? "text-red-400" : "text-amber-400",
        bg: danger ? "bg-red-500/15" : "bg-amber-500/15",
        label: alert.message,
        category,
        severity: severityFor(category, alert.message),
      })
    }

    for (const emergency of emergencies) {
      entries.push({
        id: `emergency-${emergency.id}`,
        time: emergency.createdAt,
        icon: Siren,
        color: "text-red-400",
        bg: "bg-red-500/15",
        label: `Emergency Activated: ${emergency.message}`,
        category: "emergency",
        severity: "emergency",
      })
      if (emergency.resolvedAt) {
        entries.push({
          id: `emergency-resolved-${emergency.id}`,
          time: emergency.resolvedAt,
          icon: ShieldCheck,
          color: "text-emerald-400",
          bg: "bg-emerald-500/15",
          label: "Emergency Resolved",
          category: "emergency",
          severity: "success",
        })
      }
    }

    for (const log of logs) {
      // 'emergency' log entries duplicate the dedicated emergencyStore
      // entries above; 'email'/generic 'sensor' telemetry ("Sensor Data
      // Received") is too noisy to surface as a discrete event.
      if (log.source === "emergency" || log.source === "email") continue
      if (log.source === "sensor" && !log.message.startsWith("Bed")) continue

      const style = styleForLog(log.source, log.message)
      if (!style) continue

      entries.push({
        id: `log-${log.id}`,
        time: log.createdAt,
        icon: style.icon,
        color: style.color,
        bg: style.bg,
        label: log.message,
        category: style.category,
        severity: severityFor(style.category, log.message),
      })
    }

    for (const rec of recommendationEntries) {
      entries.push({
        id: `recommendation-${rec.id}`,
        time: new Date(rec.timestamp),
        icon: Sparkles,
        color: "text-pink-400",
        bg: "bg-pink-500/15",
        label: `Recommendation Updated: ${rec.message}`,
        category: "recommendation",
        severity: "info",
      })
    }

    if (lastWeatherFetchedAt) {
      entries.push({
        id: `weather-${lastWeatherFetchedAt}`,
        time: new Date(lastWeatherFetchedAt),
        icon: CloudSun,
        color: "text-blue-300",
        bg: "bg-blue-400/15",
        label: "Weather Updated",
        category: "weather",
        severity: "info",
      })
    }

    entries.sort((a, b) => b.time.getTime() - a.time.getTime())
    return entries
  }, [alerts, emergencies, logs, recommendationEntries, lastWeatherFetchedAt])
}
