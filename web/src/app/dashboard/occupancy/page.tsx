"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useSensorStore } from "@/store/sensor-store"
import { useDayNightTheme } from "@/hooks/useDayNightTheme"
import { StatCard } from "@/components/ui/stat-card"
import { ChartCard } from "@/components/ui/chart-card"
import { TabButton } from "@/components/ui/tab-button"
import { computeOccupancyStats, formatDuration } from "@/lib/occupancy"
import { BedDouble, Clock, Percent, Calendar, CalendarDays, CalendarRange } from "lucide-react"

const RANGE_TABS = [
  { key: "daily", label: "Daily", hours: 24, icon: Calendar },
  { key: "weekly", label: "Weekly", hours: 24 * 7, icon: CalendarDays },
  { key: "monthly", label: "Monthly", hours: 24 * 30, icon: CalendarRange },
] as const

type RangeKey = (typeof RANGE_TABS)[number]["key"]

export default function OccupancyPage() {
  const [range, setRange] = useState<RangeKey>("daily")
  const { history, isLoadingHistory, fetchHistory } = useSensorStore()
  const { isDay } = useDayNightTheme()

  useEffect(() => {
    const tab = RANGE_TABS.find((t) => t.key === range)!
    fetchHistory(tab.hours)
  }, [range, fetchHistory])

  const stats = useMemo(() => computeOccupancyStats(history), [history])

  const activeSeries = range === "daily" ? stats.dailySeries : range === "weekly" ? stats.weeklySeries : stats.monthlySeries
  const seriesLabel = range === "daily" ? "Minutes occupied" : "% occupied"

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-white day:text-slate-900">Occupancy</h1>
        <p className="text-slate-400 day:text-slate-500 mt-1">Room presence analytics derived from the bed pressure sensor</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={BedDouble} label="Occupied Today" value={Math.round(stats.todayOccupiedMs / 60000)} suffix=" min" color="violet" delay={0} />
        <StatCard icon={Clock} label="Free Today" value={Math.round(stats.todayFreeMs / 60000)} suffix=" min" color="sky" delay={0.05} />
        <StatCard icon={Percent} label="Occupancy Rate" value={stats.occupancyPct} suffix="%" color="emerald" delay={0.1} />
      </div>

      <div className="inline-flex gap-1 p-1 dash-glass">
        {RANGE_TABS.map((tab) => (
          <TabButton
            key={tab.key}
            layoutId="occupancy-tab-pill"
            active={range === tab.key}
            onClick={() => setRange(tab.key)}
            icon={tab.icon}
            label={tab.label}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={range} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          <ChartCard
            icon={BedDouble}
            title={`Occupancy — ${RANGE_TABS.find((t) => t.key === range)!.label}`}
            subtitle={seriesLabel}
            labels={activeSeries.map((p) => p.label)}
            data={activeSeries.map((p) => p.value)}
            color="#a78bfa"
            unit={range === "daily" ? " min" : "%"}
            isLoading={isLoadingHistory}
            isDay={isDay}
          />
        </motion.div>
      </AnimatePresence>

      <p className="text-xs text-slate-500 text-center">
        Today: {formatDuration(stats.todayOccupiedMs)} occupied, {formatDuration(stats.todayFreeMs)} free
      </p>
    </div>
  )
}
