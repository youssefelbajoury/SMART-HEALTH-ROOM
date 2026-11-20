"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAlertStore } from "@/store/alertStore"
import { useEmergencyStore } from "@/store/emergencyStore"
import { useLogStore, type LogLevel } from "@/store/logStore"
import { useUnifiedEvents } from "@/hooks/useUnifiedEvents"
import { formatRelativeTime } from "@/lib/format"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { TabButton } from "@/components/ui/tab-button"
import {
  Search,
  Clock,
  Info,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  Check,
  History as HistoryIcon,
  ListTree,
  type LucideIcon,
} from "lucide-react"

const LEVEL_CONFIG: Record<LogLevel, { label: string; color: string; bg: string; border: string; icon: LucideIcon }> = {
  info: { label: "INFO", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", icon: Info },
  warning: { label: "WARNING", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: AlertTriangle },
  error: { label: "ERROR", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", icon: XCircle },
  success: { label: "SUCCESS", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: CheckCircle2 },
}

const PAGE_SIZE = 12

export default function HistoryPage() {
  const [tab, setTab] = useState<"timeline" | "logs">("timeline")

  const fetchAlerts = useAlertStore((s) => s.fetchAlerts)
  const fetchEmergencyHistory = useEmergencyStore((s) => s.fetchHistory)
  const { logs, isLoading: logsLoading, fetchLogs, pagination: logPagination } = useLogStore()

  const [timelineSearch, setTimelineSearch] = useState("")
  const [timelinePage, setTimelinePage] = useState(1)

  const [logSearch, setLogSearch] = useState("")
  const [logLevel, setLogLevel] = useState<LogLevel | "all">("all")
  const [logPage, setLogPage] = useState(1)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetchAlerts()
    fetchEmergencyHistory()
  }, [fetchAlerts, fetchEmergencyHistory])

  useEffect(() => {
    if (tab === "logs") {
      fetchLogs({ level: logLevel === "all" ? undefined : logLevel, search: logSearch || undefined, page: logPage })
    } else {
      fetchLogs({}) // pull unfiltered logs once so useUnifiedEvents can fold every source into the timeline
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, logLevel, logSearch, logPage])

  const timelineEntries = useUnifiedEvents()

  const filteredTimeline = timelineEntries.filter((e) => e.label.toLowerCase().includes(timelineSearch.toLowerCase()))
  const timelinePages = Math.max(1, Math.ceil(filteredTimeline.length / PAGE_SIZE))
  const pagedTimeline = filteredTimeline.slice((timelinePage - 1) * PAGE_SIZE, timelinePage * PAGE_SIZE)

  const handleCopy = (log: (typeof logs)[number]) => {
    const text = `[${log.level.toUpperCase()}] ${log.source} — ${log.message} (${log.createdAt.toISOString()})`
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(log.id)
      setTimeout(() => setCopiedId(null), 1500)
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white day:text-slate-900">History</h1>
        <p className="text-slate-400 day:text-slate-500 mt-1">Activity timeline and technical system logs</p>
      </div>

      <div className="inline-flex gap-1 p-1 dash-glass">
        <TabButton layoutId="history-tab-pill" active={tab === "timeline"} onClick={() => setTab("timeline")} icon={HistoryIcon} label="Activity Timeline" />
        <TabButton layoutId="history-tab-pill" active={tab === "logs"} onClick={() => setTab("logs")} icon={ListTree} label="System Logs" />
      </div>

      <AnimatePresence mode="wait">
        {tab === "timeline" ? (
          <motion.div key="timeline" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                value={timelineSearch}
                onChange={(e) => {
                  setTimelineSearch(e.target.value)
                  setTimelinePage(1)
                }}
                placeholder="Search activity..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800/50 border border-slate-800 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400/40 day:bg-slate-50 day:border-slate-200 day:text-slate-700 transition-all"
              />
            </div>

            {pagedTimeline.length === 0 ? (
              <EmptyState
                icon={HistoryIcon}
                title="No activity yet"
                description="Logins, emergencies, alerts and remote-control commands will appear here as they happen."
              />
            ) : (
              <div className="relative space-y-3 pl-2">
                <div className="absolute left-5.5 top-2 bottom-2 w-px bg-slate-800 day:bg-slate-200" />
                {pagedTimeline.map((entry, i) => {
                  const Icon = entry.icon
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="relative pl-10"
                    >
                      <div className={`absolute left-0 top-1 w-11 h-11 rounded-xl flex items-center justify-center border-4 border-slate-950 day:border-white ${entry.bg} ${entry.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="p-3.5 dash-glass rounded-xl">
                        <p className="text-sm text-white day:text-slate-900">{entry.label}</p>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(entry.time)} · {entry.time.toLocaleTimeString("en-US")}
                        </p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}

            {timelinePages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                {Array.from({ length: timelinePages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setTimelinePage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                      p === timelinePage
                        ? "bg-sky-500 text-white"
                        : "bg-slate-800/60 text-slate-400 hover:bg-slate-800 day:bg-slate-100 day:text-slate-500 day:hover:bg-slate-200"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="logs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  value={logSearch}
                  onChange={(e) => {
                    setLogSearch(e.target.value)
                    setLogPage(1)
                  }}
                  placeholder="Search logs..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800/50 border border-slate-800 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400/40 day:bg-slate-50 day:border-slate-200 day:text-slate-700 transition-all"
                />
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => {
                    setLogLevel("all")
                    setLogPage(1)
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    logLevel === "all"
                      ? "bg-slate-700 border-slate-600 text-white day:bg-slate-800 day:border-slate-800"
                      : "border-slate-800 text-slate-400 hover:bg-slate-800/50 day:border-slate-200 day:text-slate-500 day:hover:bg-slate-100"
                  }`}
                >
                  All
                </button>
                {(Object.keys(LEVEL_CONFIG) as LogLevel[]).map((level) => {
                  const cfg = LEVEL_CONFIG[level]
                  return (
                    <button
                      key={level}
                      onClick={() => {
                        setLogLevel(level)
                        setLogPage(1)
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        logLevel === level ? `${cfg.bg} ${cfg.border} ${cfg.color}` : "border-slate-800 text-slate-500 hover:bg-slate-800/50 day:border-slate-200 day:hover:bg-slate-100"
                      }`}
                    >
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {logsLoading && logs.length === 0 ? (
              <div className="space-y-2">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <EmptyState icon={ListTree} title="No logs recorded" description="Technical system events (connections, sensor activity, emergencies) will appear here." />
            ) : (
              <div className="dash-glass divide-y divide-slate-800 day:divide-slate-100 overflow-hidden">
                <AnimatePresence initial={false}>
                  {logs.map((log, i) => {
                    const cfg = LEVEL_CONFIG[log.level]
                    const LevelIcon = cfg.icon
                    return (
                      <motion.div
                        key={log.id}
                        layout
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ delay: Math.min(i, 10) * 0.02 }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800/30 day:hover:bg-slate-50 transition-colors group"
                      >
                        <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold tracking-wide border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                          <LevelIcon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                        <span className="shrink-0 text-xs font-mono text-slate-500 uppercase">{log.source}</span>
                        <span className="flex-1 min-w-0 truncate text-sm text-slate-200 day:text-slate-700">{log.message}</span>
                        <span className="shrink-0 text-xs text-slate-500">{formatRelativeTime(log.createdAt)}</span>
                        <button
                          onClick={() => handleCopy(log)}
                          aria-label="Copy log entry"
                          className="shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 day:hover:bg-slate-100 day:hover:text-slate-700 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          {copiedId === log.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}

            {logPagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                {Array.from({ length: logPagination.pages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setLogPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                      p === logPage
                        ? "bg-sky-500 text-white"
                        : "bg-slate-800/60 text-slate-400 hover:bg-slate-800 day:bg-slate-100 day:text-slate-500 day:hover:bg-slate-200"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
