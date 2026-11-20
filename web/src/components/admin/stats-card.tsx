"use client"

import { motion } from "framer-motion"
import { Users, ShieldCheck, UserCheck, UserX } from "lucide-react"
import { useEffect, useState } from "react"
import { useAdminStore } from "@/store/admin-store"
import { Skeleton } from "@/components/ui/skeleton"

function AnimatedCounter({ target, duration = 1.2 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let start = 0
    const increment = target / (duration * 60)
    const timer = setInterval(() => {
      start += increment
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 1000 / 60)
    return () => clearInterval(timer)
  }, [target, duration])

  return <span>{count.toLocaleString()}</span>
}

export function StatsCards() {
  const stats = useAdminStore((state) => state.stats)
  const fetchStats = useAdminStore((state) => state.fetchStats)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetchStats().finally(() => setLoaded(true))
  }, [fetchStats])

  const cards = [
    { label: "Total Users", value: stats.total, icon: Users, color: "from-sky-400 to-blue-500", bg: "bg-sky-50 admin-dark:bg-white/5" },
    { label: "Admins", value: stats.admins, icon: ShieldCheck, color: "from-violet-400 to-purple-500", bg: "bg-violet-50 admin-dark:bg-violet-500/10" },
    { label: "Active Users", value: stats.active, icon: UserCheck, color: "from-emerald-400 to-teal-500", bg: "bg-emerald-50 admin-dark:bg-emerald-500/10" },
    { label: "Suspended", value: stats.suspended, icon: UserX, color: "from-amber-400 to-orange-500", bg: "bg-amber-50 admin-dark:bg-amber-500/10" },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((stat, i) => {
        const Icon = stat.icon
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={`${stat.bg} rounded-2xl border border-slate-100 admin-dark:border-white/10 p-6 shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-slate-900 admin-dark:text-white">
                {loaded ? <AnimatedCounter target={stat.value} /> : <Skeleton className="h-8 w-10 inline-block" />}
              </span>
            </div>
            <p className="text-sm text-slate-500 admin-dark:text-slate-400 font-medium">{stat.label}</p>
          </motion.div>
        )
      })}
    </div>
  )
}
