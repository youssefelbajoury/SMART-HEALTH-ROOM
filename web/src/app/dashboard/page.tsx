"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useSensorStore } from "@/store/sensor-store"
import { useEmergencyStore } from "@/store/emergencyStore"
import { useAlertStore } from "@/store/alertStore"
import { useAuthStore } from "@/store/authStore"
import { useToastStore } from "@/store/toastStore"
import { useDayNightTheme } from "@/hooks/useDayNightTheme"
import { useSettingsStore } from "@/store/settingsStore"
import { getGreeting } from "@/lib/smartAssistant"
import { EmergencyBanner } from "@/components/dashboard/EmergencyBanner"
import { SensorCard } from "@/components/dashboard/SensorCard"
import { StatCard } from "@/components/ui/stat-card"
import { ChartCard } from "@/components/ui/chart-card"
import { HealthScoreCard } from "@/components/dashboard/HealthScoreCard"
import { WeatherWidget } from "@/components/dashboard/WeatherWidget"
import { PredictiveWarningBanner } from "@/components/dashboard/PredictiveWarningBanner"
import { RecommendationsPanel } from "@/components/dashboard/RecommendationsPanel"
import { SmartSuggestionsPanel } from "@/components/dashboard/SmartSuggestionsPanel"
import { SmartAssistantSummaryCard } from "@/components/dashboard/SmartAssistantSummaryCard"
import { RoomQualityIndexCard } from "@/components/dashboard/RoomQualityIndexCard"
import { SmartRecommendationsPanel } from "@/components/dashboard/SmartRecommendationsPanel"
import { RecommendationHistoryPanel } from "@/components/dashboard/RecommendationHistoryPanel"
import { formatTemperature, formatPercent, formatPpm, formatLux } from "@/lib/format"
import {
  Thermometer,
  Droplets,
  Wind,
  Volume2,
  BedDouble,
  Lightbulb,
  Sun,
  Moon,
  AlertTriangle,
  Gauge,
  Bell,
  Siren,
  Clock,
  Sparkles,
  BarChart3,
  Gamepad2,
} from "lucide-react"

const QUICK_ACTIONS = [
  { href: "/dashboard/assistant", label: "Ask Assistant", icon: Sparkles },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/remote-control", label: "Remote Control", icon: Gamepad2 },
  { href: "/dashboard/emergency", label: "Emergencies", icon: Siren },
]

export default function DashboardPage() {
  const { data, history, isLoadingHistory, fetchHistory } = useSensorStore()
  const activeEmergency = useEmergencyStore((state) => state.active)
  const unreadCount = useAlertStore((state) => state.unreadCount)
  const fetchUnreadCount = useAlertStore((state) => state.fetchUnreadCount)
  const user = useAuthStore((state) => state.user)
  const { isDay } = useDayNightTheme()
  const temperatureUnit = useSettingsStore((state) => state.temperatureUnit)

  // Lazy initial state (not an effect-driven setState) is safe here: this
  // whole page is gated behind DashboardLayout's client-only isAuthenticated
  // check, so it is never part of the pre-hydration server-rendered output.
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchHistory(24)
  }, [fetchHistory])

  useEffect(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount])

  const isLyingDown = (data.pressure ?? 0) > 500
  const isDark = (data.light ?? 500) < 500
  const lampOn = data.lamp ?? false

  const triggeredHardware = new Set((activeEmergency?.triggeredSensors || []).map((t) => t.sensor))
  const isCritical = (hardware: string) => triggeredHardware.has(hardware)

  const chartLabels = history.map((h) =>
    new Date(h.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  )

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white day:text-slate-900">
            {getGreeting(now)}{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-slate-400 day:text-slate-500 mt-1">Real-time monitoring of your environment</p>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/40 border border-slate-800 day:bg-slate-50 day:border-slate-200 text-slate-300 day:text-slate-600">
          <Clock className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-mono tabular-nums">{now.toLocaleTimeString("en-US")}</span>
        </div>
      </motion.div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-wrap gap-2"
      >
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.href}
              href={action.href}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl dash-glass text-sm font-medium text-slate-300 day:text-slate-700 hover:-translate-y-0.5 hover:text-white day:hover:text-slate-900 transition-all duration-200"
            >
              <Icon className="w-4 h-4 text-indigo-400" />
              {action.label}
            </Link>
          )
        })}
      </motion.div>

      <SmartAssistantSummaryCard />

      <EmergencyBanner />
      <PredictiveWarningBanner />

      {/* Health Score + Weather + Room Quality */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <HealthScoreCard />
        <WeatherWidget />
        <RoomQualityIndexCard />
      </div>

      {/* Alert */}
      {data.alert && data.alert.level !== "fine" && !activeEmergency && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-4 rounded-2xl border backdrop-blur-md shadow-sm ${
            data.alert.level === "danger"
              ? "bg-red-500/10 border-red-500/20"
              : "bg-amber-500/10 border-amber-500/20"
          }`}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className={`w-6 h-6 ${data.alert.level === "danger" ? "text-red-400" : "text-amber-400"}`} />
            <div>
              <h3 className={`font-semibold ${data.alert.level === "danger" ? "text-red-300" : "text-amber-300"}`}>
                {data.alert.level === "danger" ? "Critical Alert" : "Warning"}
              </h3>
              <p className={`text-sm ${data.alert.level === "danger" ? "text-red-400" : "text-amber-400"}`}>
                {data.alert.message}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Moon} label="Sleep Score" value={data.sleepScore ?? 0} suffix={data.sleepScore ? "/100" : ""} color="violet" delay={0} />
        <StatCard icon={Bell} label="Unread Alerts" value={unreadCount} color="amber" delay={0.05} />
        <StatCard icon={Siren} label="Active Emergencies" value={activeEmergency ? 1 : 0} color={activeEmergency ? "red" : "emerald"} delay={0.1} />
        <StatCard icon={isDark ? Moon : Sun} label={isDark ? "Night" : "Day"} value={data.light ?? 0} color="sky" delay={0.15} />
      </div>

      {/* Sensor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <SensorCard
          icon={<Thermometer className="w-6 h-6" />}
          title="Temperature"
          value={formatTemperature(data.temperature, temperatureUnit)}
          status={data.temperature > 35 ? "danger" : data.temperature > 30 ? "warning" : "fine"}
          color="orange"
          critical={isCritical("DHT11") && data.temperature > 30}
        />

        <SensorCard
          icon={<Droplets className="w-6 h-6" />}
          title="Humidity"
          value={formatPercent(data.humidity)}
          status={data.humidity > 70 || data.humidity < 30 ? "warning" : "fine"}
          color="blue"
          critical={isCritical("DHT11") && data.humidity > 70}
        />

        <SensorCard
          icon={<Wind className="w-6 h-6" />}
          title="Air Quality"
          value={formatPpm(data.airQuality)}
          status={data.airQuality > 600 ? "danger" : data.airQuality > 400 ? "warning" : "fine"}
          color="emerald"
          critical={isCritical("MQ4")}
        />

        <SensorCard
          icon={isDark ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
          title="Light Level"
          value={formatLux(data.light ?? 500)}
          subtitle={isDark ? "Night" : "Day"}
          status="fine"
          color="amber"
        />

        <SensorCard
          icon={<Volume2 className="w-6 h-6" />}
          title="Sound Level"
          value={data.soundLevel === 1 ? "Detected" : "Silent"}
          status={data.soundLevel === 1 ? "warning" : "fine"}
          color="violet"
          critical={isCritical("SY-M213")}
        />

        {/* Bed */}
        <div className={`p-6 transition-colors hover:-translate-y-0.5 duration-300 ${
          isLyingDown ? "rounded-2xl border bg-violet-500/10 border-violet-500/20" : "dash-glass"
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${isLyingDown ? "bg-violet-500/20 text-violet-400 day:bg-violet-100 day:text-violet-600" : "bg-slate-800 text-slate-500 day:bg-slate-100 day:text-slate-400"}`}>
              <BedDouble className="w-6 h-6" />
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              isLyingDown ? "bg-violet-500/20 text-violet-300 day:bg-violet-100 day:text-violet-600" : "bg-slate-800 text-slate-400 day:bg-slate-100 day:text-slate-500"
            }`}>
              {isLyingDown ? "Occupied" : "Empty"}
            </span>
          </div>
          <h3 className="text-sm font-medium text-slate-400 day:text-slate-500 mb-1">Bed</h3>
          <p className="text-2xl font-bold text-white day:text-slate-900">{isLyingDown ? "Lying Down" : "Free"}</p>
          {data.sleepScore !== null && (
            <div className="mt-3 p-2 bg-slate-800/50 day:bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500">Sleep Score</p>
              <p className="text-lg font-bold text-violet-400 day:text-violet-600">{data.sleepScore}/100</p>
            </div>
          )}
        </div>

        {/* Lamp */}
        <div className={`p-6 transition-all duration-300 hover:-translate-y-0.5 ${
          lampOn ? "rounded-2xl border bg-yellow-500/10 border-yellow-500/30 shadow-lg shadow-yellow-500/10" : "dash-glass"
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl transition-all duration-300 ${
              lampOn ? "bg-yellow-500 text-white shadow-lg" : "bg-slate-800 text-slate-500 day:bg-slate-100 day:text-slate-400"
            }`}>
              <Lightbulb className="w-6 h-6" />
            </div>
            <button
              onClick={() =>
                useSensorStore
                  .getState()
                  .toggleLamp()
                  .catch((err) =>
                    useToastStore.getState().addToast({
                      type: "error",
                      title: "Lamp",
                      message: err instanceof Error ? err.message : "Command failed",
                    })
                  )
              }
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                lampOn ? "bg-yellow-500 text-white hover:bg-yellow-400 shadow-lg" : "bg-slate-800 text-slate-400 hover:bg-slate-700 day:bg-slate-100 day:text-slate-500 day:hover:bg-slate-200"
              }`}
            >
              {lampOn ? "Turn Off" : "Turn On"}
            </button>
          </div>
          <h3 className="text-sm font-medium text-slate-400 day:text-slate-500 mb-1">Lamp</h3>
          <p className={`text-2xl font-bold ${lampOn ? "text-yellow-400 day:text-yellow-600" : "text-slate-500 day:text-slate-400"}`}>
            {lampOn ? "On" : "Off"}
          </p>
        </div>
      </div>

      {/* Recommendations + Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecommendationsPanel />
        <SmartSuggestionsPanel />
      </div>

      {/* Smart Assistant Recommendations + History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SmartRecommendationsPanel />
        <RecommendationHistoryPanel />
      </div>

      {/* Charts */}
      <div>
        <h2 className="text-lg font-semibold text-white day:text-slate-900 mb-4">History (24h)</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartCard
            icon={Thermometer}
            title="Temperature"
            subtitle="°C"
            labels={chartLabels}
            data={history.map((h) => h.temperature)}
            color="#fb923c"
            unit="°C"
            isLoading={isLoadingHistory}
            isDay={isDay}
          />
          <ChartCard
            icon={Droplets}
            title="Humidity"
            subtitle="%"
            labels={chartLabels}
            data={history.map((h) => h.humidity)}
            color="#38bdf8"
            unit="%"
            isLoading={isLoadingHistory}
            isDay={isDay}
          />
          <ChartCard
            icon={Gauge}
            title="Air Quality"
            subtitle="ppm"
            labels={chartLabels}
            data={history.map((h) => h.airQuality)}
            color="#34d399"
            unit=" ppm"
            isLoading={isLoadingHistory}
            isDay={isDay}
          />
        </div>
      </div>
    </div>
  )
}
