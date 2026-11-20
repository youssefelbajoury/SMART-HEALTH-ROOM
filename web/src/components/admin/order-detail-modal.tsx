"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEscapeKey } from "@/hooks/useEscapeKey"
import { OrderTimeline } from "@/components/dashboard/OrderTimeline"
import { Avatar } from "@/components/ui/avatar"
import type { Order } from "@/store/orderStore"
import { ORDER_STATUS_PILL as STATUS_PILL, ORDER_STATUS_LABEL as STATUS_LABEL } from "@/lib/orderStatus"
import { X, User, Mail, Cake, Hash, CalendarClock, Phone } from "lucide-react"

interface OrderDetailModalProps {
  isOpen: boolean
  onClose: () => void
  order: Order | null
}

function Field({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 admin-dark:bg-white/5 border border-slate-100 admin-dark:border-white/10">
      <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-slate-500 admin-dark:text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-900 admin-dark:text-white truncate">{value}</p>
      </div>
    </div>
  )
}

export function OrderDetailModal({ isOpen, onClose, order }: OrderDetailModalProps) {
  useEscapeKey(onClose, isOpen)

  return (
    <AnimatePresence>
      {isOpen && order && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[70] bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-detail-modal-title"
            className="admin-glass rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-100 admin-dark:border-white/10 flex items-center justify-between">
              <h3 id="order-detail-modal-title" className="text-lg font-bold text-slate-900 admin-dark:text-white">Order Details</h3>
              <button onClick={onClose} aria-label="Close" autoFocus className="p-2 hover:bg-slate-100 admin-dark:hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              <div className="flex items-center gap-4">
                <Avatar name={`${order.firstName} ${order.lastName}`} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900 admin-dark:text-white truncate">
                    {order.firstName} {order.lastName}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_PILL[order.status]}`}>
                      {STATUS_LABEL[order.status]}
                    </span>
                    <span className="text-xs text-slate-400">#{order.id.slice(-8)}</span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto pb-2">
                <OrderTimeline timeline={order.timeline} dark={false} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field icon={User} label="First name" value={order.firstName} />
                <Field icon={User} label="Last name" value={order.lastName} />
                <Field icon={Mail} label="Email" value={order.email} />
                <Field icon={Phone} label="Phone" value={order.phone || "—"} />
                <Field icon={Cake} label="Date of birth" value={new Date(order.dateOfBirth).toLocaleDateString()} />
                <Field icon={CalendarClock} label="Placed on" value={new Date(order.createdAt).toLocaleString()} />
                <Field icon={Hash} label="Order ID" value={order.id} />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
