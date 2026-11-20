"use client"

import { motion } from "framer-motion"
import { Check, X } from "lucide-react"
import { getPasswordStrength } from "@/lib/password"

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null
  const { score, label, color, requirements } = getPasswordStrength(password)

  return (
    <div className="space-y-2 mt-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-slate-800 day:bg-slate-200 overflow-hidden flex gap-0.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="flex-1 rounded-full"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: i < score ? 1 : 0 }}
              style={{ transformOrigin: "left", backgroundColor: color }}
              transition={{ duration: 0.25, delay: i * 0.03 }}
            />
          ))}
        </div>
        <span className="text-xs font-medium w-16 text-right" style={{ color }}>
          {label}
        </span>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
        {requirements.map((r) => (
          <li
            key={r.label}
            className={`flex items-center gap-1.5 text-xs transition-colors ${
              r.met ? "text-emerald-400" : "text-slate-500"
            }`}
          >
            {r.met ? <Check className="w-3 h-3 shrink-0" /> : <X className="w-3 h-3 shrink-0 opacity-40" />}
            {r.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
