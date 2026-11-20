"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { authHeaders } from "@/lib/api"
import { formatRelativeTime } from "@/lib/format"
import { useSensorStore } from "@/store/sensor-store"
import { Server, Database, Wifi, Cpu, CircuitBoard, Mail, Globe, Radio, RefreshCw, HeartPulse, type LucideIcon } from "lucide-react"

type ServiceStatus = "online" | "offline" | "connecting"

interface ServiceState {
  status: ServiceStatus
  lastUpdate: string | null
}

interface StatusResponse {
  backend: ServiceState
  mongodb: ServiceState
  websocket: ServiceState
  esp32: ServiceState
  arduino: ServiceState
  emailService: ServiceState
  api: ServiceState
}

const SERVICES: { key: keyof StatusResponse; label: string; icon: LucideIcon }[] = [
  { key: "backend", label: "Backend", icon: Server },
  { key: "mongodb", label: "MongoDB", icon: Database },
  { key: "websocket", label: "WebSocket", icon: Wifi },
  { key: "esp32", label: "ESP32", icon: Cpu },
  { key: "arduino", label: "Arduino", icon: CircuitBoard },
  { key: "emailService", label: "Email Service", icon: Mail },
  { key: "api", label: "API", icon: Globe },
]

const STATUS_STYLE: Record<ServiceStatus, { dot: string; text: string; label: string }> = {
  online: { dot: "bg-emerald-400", text: "text-emerald-400", label: "Online" },
  connecting: { dot: "bg-amber-400", text: "text-amber-400", label: "Connecting" },
  offline: { dot: "bg-red-400", text: "text-red-400", label: "Offline" },
}

const API_URL = "http://localhost:5000/api/v1"
const POLL_MS = 15000

export function ConnectionStatusPanel() {
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const sensorTimestamp = useSensorStore((s) => s.data.timestamp)

  useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        const res = await fetch(`${API_URL}/status`, { headers: authHeaders() })
        if (!res.ok) throw new Error("status fetch failed")
        const data = await res.json()
        if (!cancelled) setStatus(data)
      } catch {
        // Backend unreachable — everything reads as offline until the next successful poll.
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    poll()
    const timer = setInterval(poll, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  // Derived, frontend-only extras — no new backend fields. "Sensors" mirrors
  // whichever hardware leg (ESP32/Arduino) is reporting; "Last Sync" and
  // "Overall Health %" are computed straight from the same /status payload
  // already polled above, plus the live sensor timestamp already in sensor-store.
  const sensorsStatus: ServiceStatus = loading
    ? "connecting"
    : status?.esp32.status === "online" || status?.arduino.status === "online"
      ? "online"
      : status?.esp32.status === "connecting" || status?.arduino.status === "connecting"
        ? "connecting"
        : "offline"

  const lastSync = useMemo(() => {
    if (!status) return null
    const timestamps = [
      ...SERVICES.map((s) => status[s.key].lastUpdate),
      sensorTimestamp ? sensorTimestamp.toISOString() : null,
    ].filter((t): t is string => Boolean(t))
    if (timestamps.length === 0) return null
    return timestamps.reduce((latest, t) => (new Date(t) > new Date(latest) ? t : latest))
  }, [status, sensorTimestamp])

  const overallHealthPercent = useMemo(() => {
    if (!status) return 0
    const onlineCount = SERVICES.filter((s) => status[s.key].status === "online").length
    return Math.round((onlineCount / SERVICES.length) * 100)
  }, [status])

  const healthColor =
    overallHealthPercent >= 80 ? "text-emerald-400" : overallHealthPercent >= 50 ? "text-amber-400" : "text-red-400"

  return (
    <div className="dash-glass p-6">
      <h2 className="text-lg font-semibold text-white day:text-slate-900 mb-1">Live Connection Status</h2>
      <p className="text-sm text-slate-400 day:text-slate-500 mb-4">Real-time health of every connected service</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SERVICES.map((service, i) => {
          const state = status?.[service.key]
          const s: ServiceStatus = loading ? "connecting" : state?.status ?? "offline"
          const style = STATUS_STYLE[s]
          const Icon = service.icon

          return (
            <motion.div
              key={service.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-800 day:bg-slate-50 day:border-slate-200"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-800 day:bg-white flex items-center justify-center text-slate-400 shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white day:text-slate-900">{service.label}</p>
                <p className="text-xs text-slate-500">
                  {state?.lastUpdate ? formatRelativeTime(state.lastUpdate) : "No data yet"}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="relative flex h-2 w-2">
                  {s === "online" && (
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${style.dot} opacity-60`} />
                  )}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${style.dot}`} />
                </span>
                <span className={`text-xs font-medium ${style.text}`}>{style.label}</span>
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-800 day:border-slate-200">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-800 day:bg-slate-50 day:border-slate-200">
          <div className="w-9 h-9 rounded-lg bg-slate-800 day:bg-white flex items-center justify-center text-slate-400 shrink-0">
            <Radio className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white day:text-slate-900">Sensors</p>
            <p className={`text-xs font-medium ${STATUS_STYLE[sensorsStatus].text}`}>{STATUS_STYLE[sensorsStatus].label}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-800 day:bg-slate-50 day:border-slate-200">
          <div className="w-9 h-9 rounded-lg bg-slate-800 day:bg-white flex items-center justify-center text-slate-400 shrink-0">
            <RefreshCw className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white day:text-slate-900">Last Synchronization</p>
            <p className="text-xs text-slate-500">{lastSync ? formatRelativeTime(lastSync) : "No data yet"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-800 day:bg-slate-50 day:border-slate-200">
          <div className="w-9 h-9 rounded-lg bg-slate-800 day:bg-white flex items-center justify-center text-slate-400 shrink-0">
            <HeartPulse className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white day:text-slate-900">Overall System Health</p>
            <p className={`text-xs font-medium ${healthColor}`}>{overallHealthPercent}%</p>
          </div>
        </div>
      </div>
    </div>
  )
}
