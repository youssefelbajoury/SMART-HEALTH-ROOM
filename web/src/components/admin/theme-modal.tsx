"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useAdminStore } from "@/store/admin-store"
import { useEscapeKey } from "@/hooks/useEscapeKey"
import { Sun, Moon, X } from "lucide-react"

interface ThemeModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ThemeModal({ isOpen, onClose }: ThemeModalProps) {
  const theme = useAdminStore((state) => state.theme)
  const setTheme = useAdminStore((state) => state.setTheme)
  useEscapeKey(onClose, isOpen)

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[60] bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="theme-modal-title"
            className="admin-glass rounded-2xl shadow-xl p-6 w-full max-w-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 id="theme-modal-title" className="text-lg font-bold text-slate-900 admin-dark:text-white">Appearance</h3>
              <button
                onClick={onClose}
                aria-label="Close"
                autoFocus
                className="p-2 hover:bg-slate-100 admin-dark:hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setTheme("light")
                  onClose()
                }}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  theme === "light"
                    ? "border-sky-500 bg-sky-50 admin-dark:bg-sky-500/10"
                    : "border-slate-200 admin-dark:border-white/10 hover:border-slate-300 hover:bg-slate-50 admin-dark:hover:bg-white/5"
                }`}
              >
                <Sun className="w-6 h-6 text-amber-500" />
                <span className="text-sm font-medium text-slate-700 admin-dark:text-slate-200">Light</span>
              </button>

              <button
                onClick={() => {
                  setTheme("dark")
                  onClose()
                }}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  theme === "dark"
                    ? "border-sky-500 bg-slate-900"
                    : "border-slate-200 admin-dark:border-white/10 hover:border-slate-300 hover:bg-slate-50 admin-dark:hover:bg-white/5"
                }`}
              >
                <Moon className="w-6 h-6 text-indigo-400" />
                <span className="text-sm font-medium text-slate-700 admin-dark:text-slate-200">Dark</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}