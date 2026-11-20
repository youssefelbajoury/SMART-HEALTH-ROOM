"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAdminStore, User } from "@/store/admin-store"
import { useEscapeKey } from "@/hooks/useEscapeKey"
import { AlertTriangle } from "lucide-react"

interface DeleteModalProps {
  isOpen: boolean
  onClose: () => void
  user: User
}

export function DeleteModal({ isOpen, onClose, user }: DeleteModalProps) {
  const [loading, setLoading] = useState(false)
  const deleteUser = useAdminStore((state) => state.deleteUser)
  useEscapeKey(onClose, isOpen)

  const handleDelete = async () => {
    setLoading(true)
    try {
      await deleteUser(user.id)
      onClose()
    } catch {
      // toast already shown by the store
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[70] bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            className="admin-glass rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
          >
            <div className="p-6">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-50 admin-dark:bg-red-500/15 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-red-500" />
              </div>
              <h3 id="delete-modal-title" className="text-lg font-bold text-center text-slate-900 admin-dark:text-white mb-2">
                Permanently Delete User
              </h3>
              <p className="text-center text-slate-500 admin-dark:text-slate-400 text-sm mb-6">
                Are you sure you want to delete <strong>{user.name}</strong>?<br />
                This action is <strong>irreversible</strong>: the account and its data will be permanently removed from the database.
              </p>
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
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors shadow-md disabled:opacity-50"
                >
                  {loading ? "Deleting..." : "Delete Permanently"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
