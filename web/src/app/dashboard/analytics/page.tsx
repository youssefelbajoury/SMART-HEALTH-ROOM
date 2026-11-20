"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import { useSensorStore } from "@/store/sensor-store"
import { useAlertStore } from "@/store/alertStore"
import { useEmergencyStore } from "@/store/emergencyStore"
import { useLogStore } from "@/store/logStore"
import { useAuthStore } from "@/store/authStore"
import { useSettingsStore } from "@/store/settingsStore"
import { useToastStore } from "@/store/toastStore"
import { useDayNightTheme } from "@/hooks/useDayNightTheme"
import { useSmartAssistant } from "@/hooks/useSmartAssistant"
import { StatCard } from "@/components/ui/stat-card"
import { ChartCard, type ChartCardHandle } from "@/components/ui/chart-card"
import { computeAnalytics } from "@/lib/analytics"
import { generateHealthReportPdf } from "@/lib/healthReport"
import { downloadChartPng, exportAnalyticsPdf } from "@/lib/chartExport"
import {
  AlertTriangle,
  Siren,
  DoorOpen,
  KeyRound,
  ShieldX,
  BedDouble,
  HeartPulse,
  Gauge,
  Wifi,
  Router,
  FileDown,
  Loader2,
  Thermometer,
  Droplets,
  Wind,
  ImageDown,
} from "lucide-react"

const RANGE_OPTIONS: { value: number; label: string }[] = [
  { value: 24, label: "24h" },
  { value: 7 * 24, label: "7d" },
  { value: 15 * 24, label: "15d" },
  { value: 30 * 24, label: "30d" },
  { value: 365 * 24, label: "1y" },
]

export default function AnalyticsPage() {
  const { history, isLoadingHistory, fetchHistory } = useSensorStore()
  const alerts = useAlertStore((s) => s.alerts)
  const fetchAlerts = useAlertStore((s) => s.fetchAlerts)
  const emergencyHistory = useEmergencyStore((s) => s.history)
  const fetchEmergencyHistory = useEmergencyStore((s) => s.fetchHistory)
  const logs = useLogStore((s) => s.logs)
  const fetchLogs = useLogStore((s) => s.fetchLogs)
  const user = useAuthStore((s) => s.user)
  const temperatureUnit = useSettingsStore((s) => s.temperatureUnit)
  const addToast = useToastStore((s) => s.addToast)
  const { isDay } = useDayNightTheme()
  const { context, recommendations } = useSmartAssistant()

  const [generating, setGenerating] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [rangeHours, setRangeHours] = useState(15 * 24)
  const rangeLabel = RANGE_OPTIONS.find((r) => r.value === rangeHours)?.label ?? `${rangeHours}h`

  const tempChartRef = useRef<ChartCardHandle>(null)
  const humidityChartRef = useRef<ChartCardHandle>(null)
  const gasChartRef = useRef<ChartCardHandle>(null)

  useEffect(() => {
    fetchHistory(rangeHours)
  }, [fetchHistory, rangeHours])

  useEffect(() => {
    fetchAlerts()
    fetchEmergencyHistory()
    fetchLogs({})
  }, [fetchAlerts, fetchEmergencyHistory, fetchLogs])

  const analytics = useMemo(
    () =>
      computeAnalytics({
        history,
        alerts,
        emergencies: emergencyHistory,
        logs,
        weather: context.weather,
        outdoorAqi: context.outdoorAqi,
      }),
    [history, alerts, emergencyHistory, logs, context.weather, context.outdoorAqi]
  )

  const chartLabels = useMemo(
    () =>
      history.map((h) =>
        rangeHours > 48
          ? new Date(h.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : new Date(h.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      ),
    [history, rangeHours]
  )

  const handleExportPng = (ref: React.RefObject<ChartCardHandle | null>, name: string) => {
    const png = ref.current?.toPng()
    if (!png) {
      addToast({ type: "warning", title: "Nothing to export", message: "The chart isn't ready yet." })
      return
    }
    downloadChartPng(png, `${name}-${rangeLabel}.png`)
  }

  const handleExportAnalyticsPdf = () => {
    if (!user) return
    setExportingPdf(true)
    try {
      exportAnalyticsPdf({
        rangeLabel,
        summary: analytics,
        user: { name: user.name, email: user.email },
        charts: [
          { title: "Temperature", unit: "°C", pngDataUrl: tempChartRef.current?.toPng() ?? null },
          { title: "Humidity", unit: "%", pngDataUrl: humidityChartRef.current?.toPng() ?? null },
          { title: "Air Quality", unit: "ppm", pngDataUrl: gasChartRef.current?.toPng() ?? null },
        ],
      })
      addToast({ type: "success", title: "PDF Exported", message: "Your analytics report has been downloaded." })
    } catch (error) {
      console.error("Analytics PDF export failed:", error)
      addToast({ type: "error", title: "Export Failed", message: "Could not generate the analytics PDF." })
    } finally {
      setExportingPdf(false)
    }
  }

  const handleDownloadReport = () => {
    if (!user) return
    setGenerating(true)
    try {
      generateHealthReportPdf({
        user: { name: user.name, email: user.email },
        deviceId: user.deviceId,
        data: context.data,
        healthScore: context.healthScore,
        roomQuality: context.roomQuality,
        predictiveWarning: context.predictiveWarning,
        recommendations,
        weather: context.weather,
        outdoorAqi: context.outdoorAqi,
        emergencyHistory,
        sensorHistory: history,
        temperatureUnit,
      })
      addToast({ type: "success", title: "Report Generated", message: "Your health report has been downloaded." })
    } catch (error) {
      console.error("Health report generation failed:", error)
      addToast({ type: "error", title: "Report Failed", message: "Could not generate the health report." })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-3xl font-bold text-white day:text-slate-900">Analytics</h1>
          <p className="text-slate-400 day:text-slate-500 mt-1">Room activity, safety and reliability at a glance</p>
        </motion.div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex gap-1 p-1 rounded-xl bg-slate-800/60 day:bg-slate-100">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRangeHours(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  rangeHours === opt.value
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-white day:text-slate-500 day:hover:text-slate-900"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <motion.button
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleExportAnalyticsPdf}
            disabled={exportingPdf}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 day:bg-slate-100 day:hover:bg-slate-200 disabled:opacity-60 text-white day:text-slate-900 text-sm font-semibold transition-colors"
          >
            {exportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            Export PDF
          </motion.button>
          <motion.button
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleDownloadReport}
            disabled={generating}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-colors"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            Download Health Report
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard icon={AlertTriangle} label="Warnings" value={analytics.warningsCount} color="amber" delay={0} />
        <StatCard icon={Siren} label="Emergencies" value={analytics.emergenciesCount} color="red" delay={0.03} />
        <StatCard icon={DoorOpen} label="Door Openings" value={analytics.doorOpenings} color="sky" delay={0.06} />
        <StatCard icon={KeyRound} label="RFID Accepted" value={analytics.rfidAccepted} color="emerald" delay={0.09} />
        <StatCard icon={ShieldX} label="RFID Denied" value={analytics.rfidDenied} color="red" delay={0.12} />
        <StatCard icon={BedDouble} label="Bed Occupancy" value={analytics.bedOccupancyPercent} suffix="%" color="violet" delay={0.15} />
        <StatCard icon={HeartPulse} label="Avg Health Score" value={analytics.avgHealthScore} suffix="/100" color="emerald" delay={0.18} />
        <StatCard icon={Gauge} label="Avg Room Quality" value={analytics.avgRoomQuality} suffix="/100" color="sky" delay={0.21} />
        <StatCard icon={Wifi} label="Sensor Reliability" value={analytics.sensorUptimePercent} suffix="%" color="emerald" delay={0.24} />
        <StatCard icon={Router} label="ESP32 Reliability" value={analytics.esp32UptimePercent} suffix="%" color="violet" delay={0.27} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white day:text-slate-900">Trends ({rangeLabel})</h2>
          <p className="text-xs text-slate-500 hidden sm:block">Scroll/pinch a chart to zoom, drag to pan</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <ChartCard
              ref={tempChartRef}
              icon={Thermometer}
              title="Temperature"
              subtitle="°C"
              labels={chartLabels}
              data={history.map((h) => h.temperature)}
              color="#fb923c"
              unit="°C"
              isLoading={isLoadingHistory}
              isDay={isDay}
              zoomable
            />
            <button
              onClick={() => handleExportPng(tempChartRef, "temperature")}
              className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 day:text-slate-500 day:hover:text-slate-900 day:hover:bg-slate-100 transition-colors"
            >
              <ImageDown className="w-3.5 h-3.5" /> Export PNG
            </button>
          </div>
          <div className="space-y-2">
            <ChartCard
              ref={humidityChartRef}
              icon={Droplets}
              title="Humidity"
              subtitle="%"
              labels={chartLabels}
              data={history.map((h) => h.humidity)}
              color="#38bdf8"
              unit="%"
              isLoading={isLoadingHistory}
              isDay={isDay}
              zoomable
            />
            <button
              onClick={() => handleExportPng(humidityChartRef, "humidity")}
              className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 day:text-slate-500 day:hover:text-slate-900 day:hover:bg-slate-100 transition-colors"
            >
              <ImageDown className="w-3.5 h-3.5" /> Export PNG
            </button>
          </div>
          <div className="space-y-2">
            <ChartCard
              ref={gasChartRef}
              icon={Wind}
              title="Air Quality"
              subtitle="ppm"
              labels={chartLabels}
              data={history.map((h) => h.airQuality)}
              color="#34d399"
              unit=" ppm"
              isLoading={isLoadingHistory}
              isDay={isDay}
              zoomable
            />
            <button
              onClick={() => handleExportPng(gasChartRef, "air-quality")}
              className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 day:text-slate-500 day:hover:text-slate-900 day:hover:bg-slate-100 transition-colors"
            >
              <ImageDown className="w-3.5 h-3.5" /> Export PNG
            </button>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-500 text-center">
        Based on the last {rangeLabel} of sensor history. Reliability measures reporting consistency while the room is
        actively occupied — the Arduino only transmits telemetry while someone is inside, so idle periods aren&apos;t
        counted as downtime.
      </p>
    </div>
  )
}
