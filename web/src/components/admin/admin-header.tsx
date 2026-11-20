"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useAuthStore } from "@/store/authStore"
import { useOrderAdminStore } from "@/store/order-admin-store"
import { useAdminStore } from "@/store/admin-store"
import { authHeaders } from "@/lib/api"
import { Sun, Sunset, Moon, Clock3, ClipboardList, Users, Activity } from "lucide-react"

const API_URL = "http://localhost:5000/api/v1"

function getGreeting(hour: number) {
  if (hour < 12) return { label: "Good Morning", icon: Sun }
  if (hour < 18) return { label: "Good Afternoon", icon: Sunset }
  return { label: "Good Evening", icon: Moon }
}

export function AdminHeader() {
  const user = useAuthStore((state) => state.user)
  const pendingOrders = useOrderAdminStore((state) => state.stats.pending)
  const totalUsers = useAdminStore((state) => state.stats.total)
  const [now] = useState<Date | null>(() => new Date())
  const [systemOnline, setSystemOnline] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    async function poll() {
      try {
        const res = await fetch(`${API_URL}/status`, { headers: authHeaders() })
        if (!res.ok) throw new Error("status fetch failed")
        const data = await res.json()
        if (!cancelled) setSystemOnline(data.backend?.status === "online" && data.mongodb?.status === "online")
      } catch {
        if (!cancelled) setSystemOnline(false)
      }
    }
    poll()
    const timer = setInterval(poll, 20000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  const greeting = getGreeting(now ? now.getHours() : 12)
  const GreetingIcon = greeting.icon

  const stats = [
    { label: "Pending Orders", value: pendingOrders, icon: ClipboardList, color: "text-orange-500", bg: "bg-orange-50 admin-dark:bg-orange-500/15" },
    { label: "Total Users", value: totalUsers, icon: Users, color: "text-sky-500", bg: "bg-sky-50 admin-dark:bg-sky-500/15" },
    {
      label: "System Status",
      value: systemOnline === null ? "..." : systemOnline ? "Operational" : "Degraded",
      icon: Activity,
      color: systemOnline ? "text-emerald-500" : "text-red-500",
      bg: systemOnline ? "bg-emerald-50 admin-dark:bg-emerald-500/15" : "bg-red-50 admin-dark:bg-red-500/15",
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="admin-glass rounded-2xl p-6 mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
    >
      <div>
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500 admin-dark:text-slate-400">
          <GreetingIcon className="w-4 h-4" />
          {greeting.label}
        </div>
        <h1 className="text-2xl font-bold text-slate-900 admin-dark:text-white mt-1">
          {user?.name || "Admin"}
        </h1>
        <div className="flex items-center gap-1.5 text-sm text-slate-400 admin-dark:text-slate-500 mt-1">
          <Clock3 className="w-3.5 h-3.5" />
          {now
            ? now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
            : "—"}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:min-w-md">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className={`rounded-xl p-3.5 ${stat.bg}`}>
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${stat.color}`} />
                <span className={`text-lg font-bold ${stat.color}`}>{stat.value}</span>
              </div>
              <p className="text-xs text-slate-500 admin-dark:text-slate-400 mt-1">{stat.label}</p>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
