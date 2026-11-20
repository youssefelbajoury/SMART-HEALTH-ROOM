"use client"

import { motion } from "framer-motion"

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  orange: { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/20" },
  blue: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/20" },
  emerald: { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/20" },
  amber: { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/20" },
  violet: { bg: "bg-violet-500/20", text: "text-violet-400", border: "border-violet-500/20" },
}

interface SensorCardProps {
  icon: React.ReactNode
  title: string
  value: string
  subtitle?: string
  status: "fine" | "warning" | "danger"
  color: string
  critical?: boolean
}

export function SensorCard({ icon, title, value, subtitle, status, color, critical }: SensorCardProps) {
  const c = colorMap[color] || colorMap.blue
  const statusConfig = {
    fine: { bg: c.bg, text: c.text, border: c.border, label: "Normal" },
    warning: { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/20", label: "Warning" },
    danger: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/20", label: "Critical" },
  }
  const s = statusConfig[status]

  return (
    <motion.div
      whileHover={{ y: -4 }}
      animate={critical ? { boxShadow: ["0 0 0 rgba(239,68,68,0)", "0 0 24px rgba(239,68,68,0.35)", "0 0 0 rgba(239,68,68,0)"] } : {}}
      transition={critical ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
      className={`dash-glass p-6 transition-colors hover:border-slate-700 day:hover:border-slate-300 ${
        critical ? "border-red-500/50 ring-1 ring-red-500/30" : c.border
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${c.bg} ${c.text}`}>{icon}</div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${s.bg} ${s.text} ${s.border}`}>
          {critical ? "Critical" : s.label}
        </span>
      </div>
      <h3 className="text-sm font-medium text-slate-400 day:text-slate-500 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-white day:text-slate-900">{value}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-2">{subtitle}</p>}
    </motion.div>
  )
}
