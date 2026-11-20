"use client"

import { motion } from "framer-motion"
import { Clock, CheckCircle, RefreshCw, PackageCheck, XCircle, AlertTriangle, type LucideIcon } from "lucide-react"
import type { OrderStatus, OrderTimelineEntry } from "@/store/orderStore"

const STEP_STYLE: Record<OrderStatus, { icon: LucideIcon; textDark: string; textLight: string; bg: string; ring: string; label: string }> = {
  pending: { icon: Clock, textDark: "text-orange-400", textLight: "text-orange-600", bg: "bg-orange-500/15", ring: "ring-orange-500/40", label: "Pending" },
  accepted: { icon: CheckCircle, textDark: "text-blue-400", textLight: "text-blue-600", bg: "bg-blue-500/15", ring: "ring-blue-500/40", label: "Accepted" },
  processing: { icon: RefreshCw, textDark: "text-purple-400", textLight: "text-purple-600", bg: "bg-purple-500/15", ring: "ring-purple-500/40", label: "Processing" },
  delivered: { icon: PackageCheck, textDark: "text-emerald-400", textLight: "text-emerald-600", bg: "bg-emerald-500/15", ring: "ring-emerald-500/40", label: "Delivered" },
  rejected: { icon: XCircle, textDark: "text-red-400", textLight: "text-red-600", bg: "bg-red-500/15", ring: "ring-red-500/40", label: "Rejected" },
  "delivery-failed": { icon: AlertTriangle, textDark: "text-rose-400", textLight: "text-rose-600", bg: "bg-rose-500/15", ring: "ring-rose-500/40", label: "Delivery Failed" },
}

interface OrderTimelineProps {
  timeline: OrderTimelineEntry[]
  /** true (default) = dark dashboard surface with day: overrides; false = always-light admin surface */
  dark?: boolean
}

export function OrderTimeline({ timeline, dark = true }: OrderTimelineProps) {
  if (timeline.length === 0) return null

  const nodeBorder = dark ? "border-slate-950 day:border-white" : "border-white"
  const connectorBg = dark ? "bg-slate-800 day:bg-slate-200" : "bg-slate-200"
  const dateText = dark ? "text-slate-500" : "text-slate-400"

  return (
    <div className="flex items-start">
      {timeline.map((entry, index) => {
        const style = STEP_STYLE[entry.status]
        const Icon = style.icon
        const textClass = dark ? style.textDark : style.textLight
        const isLast = index === timeline.length - 1
        const isCurrent = isLast
        const isSpinning = isCurrent && entry.status === "processing"
        const isDelivered = isCurrent && entry.status === "delivered"

        return (
          <div key={`${entry.status}-${entry.at}`} className={`flex items-center ${isLast ? "" : "flex-1"}`}>
            <div className="flex flex-col items-center gap-2 shrink-0">
              <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.12, type: "spring", stiffness: 260, damping: 20 }}
                className={`relative w-11 h-11 rounded-xl flex items-center justify-center ring-2 border-4 ${nodeBorder} ${style.bg} ${style.ring}`}
              >
                {isCurrent && (
                  <motion.span
                    className={`absolute inset-0 rounded-xl ${style.bg}`}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
                <motion.div
                  animate={isSpinning ? { rotate: 360 } : isDelivered ? { scale: [0.4, 1.3, 1] } : undefined}
                  transition={
                    isSpinning
                      ? { duration: 1.2, repeat: Infinity, ease: "linear" }
                      : isDelivered
                        ? { duration: 0.5, ease: "backOut" }
                        : undefined
                  }
                >
                  <Icon className={`w-5 h-5 relative ${textClass}`} />
                </motion.div>
              </motion.div>
              <div className="text-center">
                <p className={`text-xs font-semibold ${textClass}`}>{style.label}</p>
                <p className={`text-[10px] mt-0.5 whitespace-nowrap ${dateText}`}>
                  {new Date(entry.at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>
            </div>

            {!isLast && (
              <div className={`flex-1 h-px ${connectorBg} mx-2 -mt-6 overflow-hidden`}>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: index * 0.12 + 0.15, duration: 0.4, ease: "easeOut" }}
                  style={{ transformOrigin: "left" }}
                  className={`h-full ${STEP_STYLE[entry.status].bg.replace("/15", "")}`}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
