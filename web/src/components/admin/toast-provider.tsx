"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useToastStore } from "@/store/toastStore"
import { CheckCircle, AlertTriangle, XCircle, Info, X } from "lucide-react"

const toastConfig = {
  success: { icon: CheckCircle, text: "text-emerald-400", progress: "bg-emerald-500", ring: "border-emerald-500/25" },
  warning: { icon: AlertTriangle, text: "text-amber-400", progress: "bg-amber-500", ring: "border-amber-500/25" },
  error: { icon: XCircle, text: "text-red-400", progress: "bg-red-500", ring: "border-red-500/25" },
  info: { icon: Info, text: "text-sky-400", progress: "bg-sky-500", ring: "border-sky-500/25" },
}

export function ToastProvider() {
  const toasts = useToastStore((state) => state.toasts)
  const removeToast = useToastStore((state) => state.removeToast)

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 w-80">
      <AnimatePresence>
        {toasts.map((toast) => {
          const config = toastConfig[toast.type]
          const Icon = config.icon
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              className={`relative overflow-hidden rounded-xl border bg-slate-900/95 backdrop-blur-xl shadow-2xl ${config.ring} p-4`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 ${config.text} flex-shrink-0 mt-0.5`} />
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-white">{toast.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{toast.message}</p>
                </div>
                <button onClick={() => removeToast(toast.id)} className="text-slate-500 hover:text-slate-300">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 3, ease: "linear" }}
                className={`absolute bottom-0 left-0 right-0 h-0.5 ${config.progress} origin-left`}
              />
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
