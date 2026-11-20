"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useOrderAdminStore, type OrderProgress, type ProgressStage } from "@/store/order-admin-store"
import { useToastStore } from "@/store/toastStore"
import { CheckCircle, RefreshCw, PackageCheck, AlertTriangle, X } from "lucide-react"

const STAGE_CONFIG: Record<
  ProgressStage,
  { icon: typeof CheckCircle; title: string; subtitle: string; text: string; progress: string; ring: string; percent: number; spin?: boolean }
> = {
  accepted: {
    icon: CheckCircle,
    title: "Order Accepted",
    subtitle: "Starting automatic processing...",
    text: "text-blue-400",
    progress: "bg-blue-500",
    ring: "border-blue-500/25",
    percent: 20,
  },
  processing: {
    icon: RefreshCw,
    title: "Processing...",
    subtitle: "Preparing the new account",
    text: "text-purple-400",
    progress: "bg-purple-500",
    ring: "border-purple-500/25",
    percent: 65,
    spin: true,
  },
  delivered: {
    icon: PackageCheck,
    title: "Delivered",
    subtitle: "User Account Created Successfully",
    text: "text-emerald-400",
    progress: "bg-emerald-500",
    ring: "border-emerald-500/25",
    percent: 100,
  },
  "delivery-failed": {
    icon: AlertTriangle,
    title: "Delivery Failed",
    subtitle: "Could not create the user account",
    text: "text-red-400",
    progress: "bg-red-500",
    ring: "border-red-500/25",
    percent: 100,
  },
}

function ProgressCard({ item }: { item: OrderProgress }) {
  const dismissProgress = useOrderAdminStore((state) => state.dismissProgress)
  const config = STAGE_CONFIG[item.stage]
  const Icon = config.icon
  const isTerminal = item.stage === "delivered" || item.stage === "delivery-failed"

  useEffect(() => {
    if (!isTerminal) return
    const timer = setTimeout(() => dismissProgress(item.orderId), 2800)
    return () => clearTimeout(timer)
  }, [isTerminal, item.orderId, dismissProgress])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      className={`relative overflow-hidden rounded-xl border bg-slate-900/95 backdrop-blur-xl shadow-2xl ${config.ring} p-4`}
    >
      <div className="flex items-start gap-3">
        <motion.div
          animate={
            config.spin
              ? { rotate: 360 }
              : item.stage === "delivered"
                ? { scale: [0.4, 1.25, 1] }
                : undefined
          }
          transition={
            config.spin
              ? { duration: 1.2, repeat: Infinity, ease: "linear" }
              : item.stage === "delivered"
                ? { duration: 0.5, ease: "backOut" }
                : undefined
          }
        >
          <Icon className={`w-5 h-5 ${config.text} flex-shrink-0 mt-0.5`} />
        </motion.div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-white">{config.title}</h4>
          <p className="text-xs text-slate-400 mt-0.5">{item.stage === "delivery-failed" && item.error ? item.error : config.subtitle}</p>
          <p className="text-xs text-slate-500 mt-1 truncate">{item.name}</p>
        </div>
        <button onClick={() => dismissProgress(item.orderId)} className="text-slate-500 hover:text-slate-300">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="mt-3 h-1 rounded-full bg-slate-800 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${config.percent}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`h-full rounded-full ${config.progress}`}
        />
      </div>
    </motion.div>
  )
}

export function OrderProgressToast() {
  const progressToasts = useOrderAdminStore((state) => state.progressToasts)
  const toastCount = useToastStore((state) => state.toasts.length)

  return (
    <div
      className="fixed right-4 z-[100] flex flex-col gap-3 w-80"
      style={{ top: `${16 + toastCount * 92}px` }}
    >
      <AnimatePresence>
        {progressToasts.map((item) => (
          <ProgressCard key={item.orderId} item={item} />
        ))}
      </AnimatePresence>
    </div>
  )
}
