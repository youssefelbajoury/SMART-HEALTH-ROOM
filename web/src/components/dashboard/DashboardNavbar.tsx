"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/authStore"
import { useAlertStore } from "@/store/alertStore"
import { useSensorStore } from "@/store/sensor-store"
import { useLogStore } from "@/store/logStore"
import { useRecommendationHistoryStore } from "@/store/recommendationHistoryStore"
import { useDemoStore } from "@/store/demoStore"
import { useDayNightTheme } from "@/hooks/useDayNightTheme"
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut"
import { useEscapeKey } from "@/hooks/useEscapeKey"
import { formatRelativeTime, formatDayGroup } from "@/lib/format"
import { buildSearchIndex, type SearchRoute } from "@/lib/globalSearch"
import { Avatar } from "@/components/ui/avatar"
import { EmptyState } from "@/components/ui/empty-state"
import { EventCenterPanel } from "@/components/dashboard/EventCenterPanel"
import { Search, Bell, Menu, ChevronDown, Settings, LogOut, Clock, AlertTriangle, XCircle, Info, Wifi, WifiOff, Sun, Moon, Trash2, SearchX } from "lucide-react"

const searchTargets: SearchRoute[] = [
  { label: "Dashboard", href: "/dashboard", keywords: "dashboard home overview" },
  { label: "AI Assistant", href: "/dashboard/assistant", keywords: "assistant chat ai ask question health" },
  { label: "Emergencies", href: "/dashboard/emergency", keywords: "emergency danger critical" },
  { label: "Alerts", href: "/dashboard/alerts", keywords: "alert notification" },
  { label: "History", href: "/dashboard/history", keywords: "history timeline logs activity" },
  { label: "Room Map", href: "/dashboard/room-map", keywords: "room map floor plan sensors" },
  { label: "Occupancy", href: "/dashboard/occupancy", keywords: "occupancy bed presence" },
  { label: "Analytics", href: "/dashboard/analytics", keywords: "analytics stats counters health report pdf charts" },
  { label: "Remote Control", href: "/dashboard/remote-control", keywords: "remote control rgb buzzer door lamp" },
  { label: "My Order", href: "/dashboard/orders", keywords: "order status timeline delivery" },
  { href: "/dashboard/settings", label: "Settings", keywords: "settings profile password" },
]

function alertIcon(type: string) {
  if (type === "danger") return <XCircle className="w-4 h-4 text-red-400" />
  if (type === "warning") return <AlertTriangle className="w-4 h-4 text-amber-400" />
  return <Info className="w-4 h-4 text-blue-400" />
}

interface DashboardNavbarProps {
  onOpenMobileSidebar: () => void
}

export function DashboardNavbar({ onOpenMobileSidebar }: DashboardNavbarProps) {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const { alerts, unreadCount, fetchAlerts, fetchUnreadCount, markAsRead, markAllAsRead, deleteAlert } = useAlertStore()
  const socketConnected = useSensorStore((state) => state.socketConnected)
  const logs = useLogStore((state) => state.logs)
  const fetchLogs = useLogStore((state) => state.fetchLogs)
  const recommendationEntries = useRecommendationHistoryStore((state) => state.entries)
  const demoEnabled = useDemoStore((state) => state.enabled)
  const toggleDemo = useDemoStore((state) => state.toggle)
  const { isDay } = useDayNightTheme()

  const [now, setNow] = useState<Date | null>(() => new Date())
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  useKeyboardShortcut("k", () => {
    setSearchOpen(true)
    searchInputRef.current?.focus()
  }, { meta: true })

  // Reuses logStore's own server-side search filter (already built for the
  // History page) rather than adding a second fetch path — debounced so
  // typing doesn't fire a request per keystroke.
  useEffect(() => {
    if (!query.trim()) return
    const timer = setTimeout(() => fetchLogs({ search: query, page: 1 }), 300)
    return () => clearTimeout(timer)
  }, [query, fetchLogs])

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8)
    handleScroll()
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEscapeKey(() => {
    setSearchOpen(false)
    setNotifOpen(false)
    setProfileOpen(false)
  }, searchOpen || notifOpen || profileOpen)

  const searchResults = useMemo(
    () => buildSearchIndex({ query, routes: searchTargets, alerts, recommendationEntries, logs }),
    [query, alerts, recommendationEntries, logs]
  )

  const groupedSearchResults = useMemo(() => {
    const groups = new Map<string, typeof searchResults>()
    for (const result of searchResults) {
      const list = groups.get(result.category) ?? []
      list.push(result)
      groups.set(result.category, list)
    }
    return Array.from(groups.entries())
  }, [searchResults])

  const handleOpenNotifications = () => {
    setNotifOpen((v) => !v)
    if (!notifOpen) fetchAlerts()
  }

  const groupedAlerts = useMemo(() => {
    const groups: { label: string; items: typeof alerts }[] = [
      { label: "Today", items: [] },
      { label: "Yesterday", items: [] },
      { label: "Earlier", items: [] },
    ]
    for (const alert of alerts.slice(0, 8)) {
      const group = groups.find((g) => g.label === formatDayGroup(alert.timestamp))!
      group.items.push(alert)
    }
    return groups.filter((g) => g.items.length > 0)
  }, [alerts])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <header className={`sticky top-0 z-20 glass-dark border-b border-slate-800/80 day:bg-white/90 day:backdrop-blur-xl day:border-slate-100 transition-all duration-300 ${
      scrolled ? "shadow-lg shadow-slate-950/20 day:shadow-slate-200/60" : "day:shadow-sm"
    }`}>
      <div className="h-16 px-4 lg:px-6 flex items-center gap-3">
        <button onClick={onOpenMobileSidebar} aria-label="Open menu" className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white day:text-slate-500 day:hover:text-slate-900">
          <Menu className="w-5 h-5" />
        </button>

        {/* Search */}
        <div ref={searchRef} className="relative flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              ref={searchInputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search anything..."
              aria-label="Search"
              className="w-full pl-9 pr-14 py-2 rounded-xl bg-slate-800/50 border border-slate-800 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all day:bg-slate-50 day:border-slate-200 day:text-slate-700 day:placeholder:text-slate-400 day:focus:ring-sky-400/40"
            />
            <kbd className="hidden sm:inline-flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[10px] font-medium text-slate-500 day:bg-slate-100 day:border-slate-200">
              Ctrl K
            </kbd>
          </div>
          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute top-full left-0 right-0 mt-2 max-h-96 overflow-y-auto rounded-xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden day:border-slate-100 day:bg-white day:shadow-xl"
              >
                {searchResults.length === 0 ? (
                  <EmptyState icon={SearchX} title="No results" description={`Nothing matches "${query}"`} />
                ) : (
                  groupedSearchResults.map(([category, results]) => (
                    <div key={category}>
                      <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{category}</p>
                      {results.map((r) => (
                        <Link
                          key={r.id}
                          href={r.href}
                          onClick={() => {
                            setSearchOpen(false)
                            setQuery("")
                          }}
                          className="flex flex-col px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors day:text-slate-600 day:hover:bg-slate-50 day:hover:text-slate-900"
                        >
                          <span className="truncate">{r.label}</span>
                          {r.sublabel && <span className="text-xs text-slate-500 truncate">{r.sublabel}</span>}
                        </Link>
                      ))}
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1" />

        {/* Quick-access Demo Mode toggle — for presentations, without digging into Settings */}
        <button
          onClick={toggleDemo}
          aria-pressed={demoEnabled}
          className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all duration-200 ${
            demoEnabled
              ? "bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-lg shadow-amber-500/10"
              : "bg-slate-800/40 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60 day:bg-slate-50 day:border-slate-200 day:text-slate-500 day:hover:text-slate-900"
          }`}
        >
          <span aria-hidden="true">🎓</span>
          Demo Mode
        </button>

        {/* Day / Night indicator (automatic, driven by the LDR sensor) */}
        <div className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium ${
          isDay
            ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
            : "bg-indigo-500/10 border-indigo-500/20 text-indigo-300"
        }`}>
          {isDay ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          {isDay ? "Day" : "Night"}
        </div>

        {/* Connection status */}
        <div className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium ${
          socketConnected
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            : "bg-red-500/10 border-red-500/20 text-red-400"
        }`}>
          {socketConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          {socketConnected ? "Connected" : "Disconnected"}
        </div>

        {/* Clock */}
        <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/40 border border-slate-800 text-slate-300 day:bg-slate-50 day:border-slate-200 day:text-slate-600">
          <Clock className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-mono tabular-nums">
            {now ? now.toLocaleTimeString("en-US") : "--:--:--"}
          </span>
        </div>

        {/* Live Event Center */}
        <EventCenterPanel />

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={handleOpenNotifications}
            aria-label="Notifications"
            className="relative p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors day:text-slate-500 day:hover:text-slate-900 day:hover:bg-slate-100"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden day:border-slate-100 day:bg-white day:shadow-xl"
              >
                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between day:border-slate-100">
                  <h4 className="text-sm font-semibold text-white day:text-slate-900">Notifications</h4>
                  {unreadCount > 0 && (
                    <button onClick={() => markAllAsRead()} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                      Mark all read ({unreadCount})
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {alerts.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-slate-500">You&apos;re all caught up</p>
                  ) : (
                    groupedAlerts.map((group) => (
                      <div key={group.label}>
                        <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{group.label}</p>
                        <AnimatePresence initial={false}>
                          {group.items.map((alert) => (
                            <motion.div
                              key={alert.id}
                              layout
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0, height: 0 }}
                              className={`group relative flex items-start gap-3 px-4 py-3 hover:bg-slate-800/60 day:hover:bg-slate-50 transition-colors ${!alert.read ? "bg-slate-800/30 day:bg-sky-50/60" : ""}`}
                            >
                              <button
                                onClick={() => {
                                  if (!alert.read) markAsRead(alert.id)
                                  setNotifOpen(false)
                                  router.push("/dashboard/alerts")
                                }}
                                className="flex-1 min-w-0 flex items-start gap-3 text-left"
                              >
                                {alertIcon(alert.type)}
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm text-slate-200 day:text-slate-700 truncate">{alert.message}</p>
                                  <p className="text-xs text-slate-500 mt-0.5">{formatRelativeTime(alert.timestamp)}</p>
                                </div>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteAlert(alert.id)
                                }}
                                aria-label="Delete notification"
                                className="shrink-0 p-1 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    ))
                  )}
                </div>
                <Link
                  href="/dashboard/alerts"
                  onClick={() => setNotifOpen(false)}
                  className="block text-center py-2.5 text-sm text-indigo-400 hover:text-indigo-300 border-t border-slate-800 day:border-slate-100"
                >
                  View all alerts
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile dropdown */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl hover:bg-slate-800/60 day:hover:bg-slate-100 transition-colors"
          >
            <Avatar src={user?.profileImage} name={user?.name} size="sm" />
            <ChevronDown className={`w-4 h-4 text-slate-400 day:text-slate-500 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden day:border-slate-100 day:bg-white day:shadow-xl"
              >
                <div className="px-4 py-3 border-b border-slate-800 day:border-slate-100">
                  <p className="text-sm font-medium text-white day:text-slate-900 truncate">{user?.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
                <Link
                  href="/dashboard/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors day:text-slate-600 day:hover:bg-slate-50 day:hover:text-slate-900"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
