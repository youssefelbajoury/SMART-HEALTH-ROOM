"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { Radio, Inbox } from "lucide-react"
import { useUnifiedEvents, type EventSeverity } from "@/hooks/useUnifiedEvents"
import { useEscapeKey } from "@/hooks/useEscapeKey"
import { useAlertStore } from "@/store/alertStore"
import { formatRelativeTime } from "@/lib/format"
import { EmptyState } from "@/components/ui/empty-state"

const MAX_VISIBLE = 8

const FILTERS: { value: EventSeverity | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "success", label: "Success" },
  { value: "warning", label: "Warning" },
  { value: "emergency", label: "Emergency" },
  { value: "info", label: "Info" },
]

// The Live Event Center: a compact, always-available "what's happening right
// now" panel fed by the same useUnifiedEvents() feed as the full Timeline
// (dashboard/history) — this is the ambient/live view, the Timeline is the
// searchable/paginated history view. No business logic is duplicated between
// the two; only presentation differs.
export function EventCenterPanel() {
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<EventSeverity | "all">("all")
  const ref = useRef<HTMLDivElement>(null)
  const events = useUnifiedEvents()
  const unreadCount = useAlertStore((s) => s.unreadCount)
  const markAsRead = useAlertStore((s) => s.markAsRead)
  const markAllAsRead = useAlertStore((s) => s.markAllAsRead)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEscapeKey(() => setOpen(false), open)

  const filtered = useMemo(
    () => (filter === "all" ? events : events.filter((e) => e.severity === filter)),
    [events, filter]
  )
  const visible = filtered.slice(0, MAX_VISIBLE)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Live Event Center"
        className="relative p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors day:text-slate-500 day:hover:text-slate-900 day:hover:bg-slate-100"
      >
        <Radio className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden day:border-slate-100 day:bg-white day:shadow-xl"
          >
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between day:border-slate-100">
              <h4 className="text-sm font-semibold text-white day:text-slate-900">Live Event Center</h4>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button onClick={() => markAllAsRead()} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                    Mark all read
                  </button>
                )}
                <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-emerald-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-800 day:border-slate-100 overflow-x-auto">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    filter === f.value
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-white day:text-slate-500 day:hover:text-slate-900"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {visible.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <EmptyState icon={Inbox} title="No events" description={filter === "all" ? undefined : `Nothing in "${filter}" right now`} />
                </motion.div>
              ) : (
                <AnimatePresence initial={false}>
                  {visible.map((event) => {
                    const Icon = event.icon
                    const alertId = event.id.startsWith("alert-") ? event.id.slice("alert-".length) : null
                    return (
                      <motion.div
                        key={event.id}
                        layout
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        onClick={() => alertId && markAsRead(alertId)}
                        role={alertId ? "button" : undefined}
                        tabIndex={alertId ? 0 : undefined}
                        onKeyDown={(e) => {
                          if (alertId && (e.key === "Enter" || e.key === " ")) {
                            e.preventDefault()
                            markAsRead(alertId)
                          }
                        }}
                        className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-800/60 day:hover:bg-slate-50 transition-colors ${alertId ? "cursor-pointer" : ""}`}
                      >
                        <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${event.bg} ${event.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-slate-200 day:text-slate-700 truncate">{event.label}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{formatRelativeTime(event.time)}</p>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              )}
            </div>
            <Link
              href="/dashboard/history"
              onClick={() => setOpen(false)}
              className="block text-center py-2.5 text-sm text-indigo-400 hover:text-indigo-300 border-t border-slate-800 day:border-slate-100"
            >
              View Full Timeline
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
