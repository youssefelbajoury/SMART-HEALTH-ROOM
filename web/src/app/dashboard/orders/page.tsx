"use client"

import { useEffect } from "react"
import { motion } from "framer-motion"
import { useOrderStore, type OrderStatus } from "@/store/orderStore"
import { OrderTimeline } from "@/components/dashboard/OrderTimeline"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { ClipboardList, Clock, CheckCircle, RefreshCw, PackageCheck, XCircle, AlertTriangle, CalendarClock, Phone, type LucideIcon } from "lucide-react"

const STATUS_PILL: Record<OrderStatus, string> = {
  pending: "bg-orange-500/15 text-orange-300 border border-orange-500/30 day:bg-orange-50 day:text-orange-600 day:border-orange-200",
  accepted: "bg-blue-500/15 text-blue-300 border border-blue-500/30 day:bg-blue-50 day:text-blue-600 day:border-blue-200",
  processing: "bg-purple-500/15 text-purple-300 border border-purple-500/30 day:bg-purple-50 day:text-purple-600 day:border-purple-200",
  delivered: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 day:bg-emerald-50 day:text-emerald-600 day:border-emerald-200",
  rejected: "bg-red-500/15 text-red-300 border border-red-500/30 day:bg-red-50 day:text-red-600 day:border-red-200",
  "delivery-failed": "bg-rose-500/15 text-rose-300 border border-rose-500/30 day:bg-rose-50 day:text-rose-600 day:border-rose-200",
}

const STATUS_ICON: Record<OrderStatus, LucideIcon> = {
  pending: Clock,
  accepted: CheckCircle,
  processing: RefreshCw,
  delivered: PackageCheck,
  rejected: XCircle,
  "delivery-failed": AlertTriangle,
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  processing: "Processing",
  delivered: "Delivered",
  rejected: "Rejected",
  "delivery-failed": "Delivery Failed",
}

export default function OrdersPage() {
  const { myOrders, isLoading, fetchMyOrders } = useOrderStore()

  useEffect(() => {
    fetchMyOrders()
  }, [fetchMyOrders])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white day:text-slate-900">My Order</h1>
        <p className="text-slate-400 day:text-slate-500 mt-1">Track the status of your Smart Health Room order</p>
      </div>

      {isLoading && myOrders.length === 0 ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : myOrders.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No orders found"
          description="Once your order is placed and processed, its status will appear here."
        />
      ) : (
        <div className="space-y-4">
          {myOrders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="dash-glass p-6 space-y-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-400 day:text-slate-500">Order #{order.id.slice(-8)}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <CalendarClock className="w-3.5 h-3.5" />
                    Placed on {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                  {order.phone && (
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      <Phone className="w-3.5 h-3.5" />
                      {order.phone}
                    </div>
                  )}
                </div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${STATUS_PILL[order.status]}`}>
                  {(() => {
                    const StatusIcon = STATUS_ICON[order.status]
                    return <StatusIcon className="w-3.5 h-3.5" />
                  })()}
                  {STATUS_LABEL[order.status]}
                </span>
              </div>

              <div className="overflow-x-auto pb-2">
                <OrderTimeline timeline={order.timeline} />
              </div>

              {order.status === "delivery-failed" && (
                <div className="flex items-start gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 day:bg-rose-50 day:border-rose-200 px-4 py-3 text-sm text-rose-300 day:text-rose-600">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>We couldn&apos;t finish setting up your account automatically. Please contact support so we can resolve it.</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
