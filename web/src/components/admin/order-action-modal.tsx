"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useEscapeKey } from "@/hooks/useEscapeKey"
import { AlertTriangle, Check, type LucideIcon } from "lucide-react"

interface OrderActionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  title: string
  description: string
  confirmLabel: string
  variant: "danger" | "default"
}

export function OrderActionModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  variant,
}: OrderActionModalProps) {
  const [loading, setLoading] = useState(false)
  useEscapeKey(onClose, isOpen)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
      onClose()
    } catch {
      // toast already shown by the store
    } finally {
      setLoading(false)
    }
  }

  const Icon: LucideIcon = variant === "danger" ? AlertTriangle : Check
  const iconBg = variant === "danger" ? "bg-red-50 admin-dark:bg-red-500/15" : "bg-emerald-50 admin-dark:bg-emerald-500/15"
  const iconColor = variant === "danger" ? "text-red-500" : "text-emerald-500"
  const confirmButton =
    variant === "danger"
      ? "bg-red-500 hover:bg-red-600"
      : "bg-emerald-500 hover:bg-emerald-600"

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[80] bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-action-modal-title"
            className="admin-glass rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
          >
            <div className="p-6">
              <div className={`w-14 h-14 mx-auto mb-4 rounded-full ${iconBg} flex items-center justify-center`}>
                <Icon className={`w-7 h-7 ${iconColor}`} />
              </div>
              <h3 id="order-action-modal-title" className="text-lg font-bold text-center text-slate-900 admin-dark:text-white mb-2">{title}</h3>
              <p className="text-center text-slate-500 admin-dark:text-slate-400 text-sm mb-6">{description}</p>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={loading}
                  autoFocus
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 admin-dark:bg-white/10 text-slate-700 admin-dark:text-slate-200 font-medium hover:bg-slate-200 admin-dark:hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className={`flex-1 py-2.5 rounded-xl text-white font-medium transition-colors shadow-md disabled:opacity-50 ${confirmButton}`}
                >
                  {loading ? "..." : confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
