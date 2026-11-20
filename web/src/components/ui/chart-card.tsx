"use client"

import { forwardRef, useImperativeHandle, useRef } from "react"
import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  type ChartData,
  type ChartOptions,
  type Chart,
} from "chart.js"
import zoomPlugin from "chartjs-plugin-zoom"
import { Skeleton } from "./skeleton"
import { EmptyState } from "./empty-state"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, zoomPlugin)

interface ChartCardProps {
  icon: LucideIcon
  title: string
  subtitle?: string
  labels: string[]
  data: number[]
  color: string
  unit?: string
  isLoading?: boolean
  isDay?: boolean
  /** Disables wheel/pinch zoom — off by default so dashboard preview charts stay static; Analytics turns it on. */
  zoomable?: boolean
}

export interface ChartCardHandle {
  /** Returns a PNG data URL of the current chart, or null if no chart is rendered yet (loading/empty). */
  toPng: () => string | null
  resetZoom: () => void
}

export const ChartCard = forwardRef<ChartCardHandle, ChartCardProps>(function ChartCard(
  { icon: Icon, title, subtitle, labels, data, color, unit = "", isLoading, isDay = false, zoomable = false },
  ref
) {
  const chartRef = useRef<Chart<"line"> | null>(null)

  useImperativeHandle(ref, () => ({
    toPng: () => chartRef.current?.toBase64Image() ?? null,
    resetZoom: () => chartRef.current?.resetZoom?.(),
  }))
  const chartData: ChartData<"line"> = {
    labels,
    datasets: [
      {
        data,
        borderColor: color,
        backgroundColor: `${color}22`,
        fill: true,
        tension: 0.35,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: color,
        borderWidth: 2,
      },
    ],
  }

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: "index" },
    plugins: {
      tooltip: {
        backgroundColor: isDay ? "#ffffff" : "#0f172a",
        borderColor: isDay ? "#e2e8f0" : "#1e293b",
        borderWidth: 1,
        titleColor: isDay ? "#64748b" : "#94a3b8",
        bodyColor: isDay ? "#0f172a" : "#fff",
        padding: 10,
        cornerRadius: 10,
        displayColors: false,
        callbacks: {
          label: (ctx) => `${Number(ctx.parsed.y).toFixed(1)}${unit}`,
        },
      },
      zoom: zoomable
        ? {
            zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: "x" },
            pan: { enabled: true, mode: "x" },
            limits: { x: { minRange: 5 } },
          }
        : undefined,
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: isDay ? "#94a3b8" : "#64748b", maxRotation: 0, autoSkip: true, maxTicksLimit: 6, font: { size: 10 } },
        border: { display: false },
      },
      y: {
        grid: { color: isDay ? "rgba(100,116,139,0.1)" : "rgba(148,163,184,0.08)" },
        ticks: { color: isDay ? "#94a3b8" : "#64748b", font: { size: 10 } },
        border: { display: false },
      },
    },
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="dash-glass p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}1a`, color }}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-200 day:text-slate-800">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>

      <div className="h-40">
        {isLoading ? (
          <Skeleton className="w-full h-full" />
        ) : data.length === 0 ? (
          <EmptyState icon={Icon} title="No data yet" />
        ) : (
          <Line ref={chartRef} data={chartData} options={options} />
        )}
      </div>
    </motion.div>
  )
})
