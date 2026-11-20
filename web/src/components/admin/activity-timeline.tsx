"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { useOrderAdminStore } from "@/store/order-admin-store"
import { EmptyState } from "@/components/ui/empty-state"
import type { OrderStatus } from "@/store/orderStore"
import { Inbox, CheckCircle, RefreshCw, PackageCheck, UserPlus, XCircle, AlertTriangle, type LucideIcon } from "lucide-react"

type ActivityKind = OrderStatus | "user-created"

const ACTIVITY_STYLE: Record<ActivityKind, { icon: LucideIcon; label: string; text: string; bg: string }> = {
  pending: { icon: Inbox, label: "Order Received", text: "text-orange-500", bg: "bg-orange-500/15" },
  accepted: { icon: CheckCircle, label: "Order Accepted", text: "text-blue-500", bg: "bg-blue-500/15" },
  processing: { icon: RefreshCw, label: "Processing Started", text: "text-purple-500", bg: "bg-purple-500/15" },
  delivered: { icon: PackageCheck, label: "Delivered", text: "text-emerald-500", bg: "bg-emerald-500/15" },
  rejected: { icon: XCircle, label: "Order Rejected", text: "text-red-500", bg: "bg-red-500/15" },
  "delivery-failed": { icon: AlertTriangle, label: "Delivery Failed", text: "text-rose-500", bg: "bg-rose-500/15" },
  "user-created": { icon: UserPlus, label: "User Created", text: "text-emerald-500", bg: "bg-emerald-500/15" },
}

interface ActivityEntry {
  id: string
  kind: ActivityKind
  name: string
  at: number
}

const MAX_ENTRIES = 25

export function ActivityTimeline() {
  const orders = useOrderAdminStore((state) => state.orders)

  const entries = useMemo<ActivityEntry[]>(() => {
    const list: ActivityEntry[] = []
    for (const order of orders) {
      const name = `${order.firstName} ${order.lastName}`
      for (const step of order.timeline) {
        const at = new Date(step.at).getTime()
        list.push({ id: `${order.id}-${step.status}`, kind: step.status, name, at })
        if (step.status === "delivered") {
          list.push({ id: `${order.id}-user-created`, kind: "user-created", name, at: at + 1 })
        }
      }
    }
    return list.sort((a, b) => b.at - a.at).slice(0, MAX_ENTRIES)
  }, [orders])

  return (
    <div id="activity" className="admin-glass rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 admin-dark:border-white/10">
        <h3 className="text-lg font-semibold text-slate-900 admin-dark:text-white">Activity Timeline</h3>
        <p className="text-sm text-slate-500 admin-dark:text-slate-400 mt-0.5">Newest order events first</p>
      </div>

      {entries.length === 0 ? (
        <div className="py-10">
          <EmptyState icon={Inbox} title="No activity yet" description="Order events will appear here in real time." />
        </div>
      ) : (
        <div className="relative max-h-96 overflow-y-auto p-4 space-y-1">
          <div className="absolute left-[1.9rem] top-6 bottom-6 w-px bg-slate-200 admin-dark:bg-white/10" />
          {entries.map((entry, index) => {
            const style = ACTIVITY_STYLE[entry.kind]
            const Icon = style.icon
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="relative flex items-start gap-3 py-2 pl-1"
              >
                <div className={`relative z-10 w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ring-4 ring-white admin-dark:ring-slate-800 ${style.bg}`}>
                  <Icon className={`w-4 h-4 ${style.text}`} />
                </div>
                <div className="min-w-0 flex-1 pt-1.5">
                  <p className="text-sm font-medium text-slate-900 admin-dark:text-white">
                    {style.label} <span className="font-normal text-slate-500 admin-dark:text-slate-400">— {entry.name}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{new Date(entry.at).toLocaleString()}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
