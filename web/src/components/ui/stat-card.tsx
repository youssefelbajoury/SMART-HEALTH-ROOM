"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { LucideIcon } from "lucide-react"

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: number
  suffix?: string
  color?: "sky" | "emerald" | "amber" | "violet" | "red"
  delay?: number
}

const colorMap = {
  sky: "from-sky-400 to-blue-500",
  emerald: "from-emerald-400 to-teal-500",
  amber: "from-amber-400 to-orange-500",
  violet: "from-violet-400 to-purple-500",
  red: "from-red-400 to-rose-500",
}

function AnimatedNumber({ target, duration = 1.2 }: { target: number; duration?: number }) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    let start = 0
    const increment = target / (duration * 60)
    const timer = setInterval(() => {
      start += increment
      if (start >= target) {
        setValue(Math.round(target))
        clearInterval(timer)
      } else {
        setValue(Math.floor(start))
      }
    }, 1000 / 60)
    return () => clearInterval(timer)
  }, [target, duration])

  return <span>{value.toLocaleString()}</span>
}

export function StatCard({ icon: Icon, label, value, suffix, color = "sky", delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -3 }}
      className="dash-glass p-5 shadow-sm hover:shadow-lg transition-shadow"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-white day:text-slate-900">
        <AnimatedNumber target={value} />
        {suffix}
      </p>
      <p className="text-sm text-slate-400 day:text-slate-500 mt-1">{label}</p>
    </motion.div>
  )
}
