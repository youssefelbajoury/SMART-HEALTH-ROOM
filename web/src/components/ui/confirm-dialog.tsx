"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useEscapeKey } from "@/hooks/useEscapeKey"
import { LucideIcon, AlertTriangle, X } from "lucide-react"

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description?: string
  icon?: LucideIcon
  confirmLabel?: string
  cancelLabel?: string
  variant?: "danger" | "default"
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  icon: Icon = AlertTriangle,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false)
  useEscapeKey(onClose, isOpen)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const accent = variant === "danger"
    ? { bg: "bg-red-500/10", text: "text-red-500", button: "bg-red-500 hover:bg-red-600" }
    : { bg: "bg-sky-500/10", text: "text-sky-500", button: "bg-sky-500 hover:bg-sky-600" }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[80] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            className="relative bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-sm overflow-hidden day:bg-white day:border-slate-100 day:shadow-xl"
          >
            <div className="p-6 text-center">
              <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl ${accent.bg} flex items-center justify-center`}>
                <Icon className={`w-7 h-7 ${accent.text}`} />
              </div>
              <h3 id="confirm-dialog-title" className="text-lg font-bold text-white day:text-slate-900 mb-2">{title}</h3>
              {description && <p className="text-sm text-slate-400 day:text-slate-500 mb-2">{description}</p>}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={onClose}
                  disabled={loading}
                  autoFocus
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 day:bg-slate-100 day:text-slate-600 day:hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className={`flex-1 py-2.5 rounded-xl text-white font-medium transition-colors shadow-md disabled:opacity-50 ${accent.button}`}
                >
                  {loading ? "..." : confirmLabel}
                </button>
              </div>
            </div>
            <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 day:hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
