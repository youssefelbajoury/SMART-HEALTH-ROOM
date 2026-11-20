"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAdminStore, User } from "@/store/admin-store"
import { FloatingInput } from "@/components/ui/floating-input"
import { PasswordStrength } from "@/components/ui/password-strength"
import { SuccessCheck } from "@/components/ui/success-check"
import { getPasswordStrength } from "@/lib/password"
import { useEscapeKey } from "@/hooks/useEscapeKey"
import { X, KeyRound, Eye, EyeOff } from "lucide-react"

interface PasswordResetModalProps {
  isOpen: boolean
  onClose: () => void
  user: User
}

export function PasswordResetModal({ isOpen, onClose, user }: PasswordResetModalProps) {
  const [newPassword, setNewPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [touched, setTouched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [shake, setShake] = useState(false)
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
  const resetPassword = useAdminStore((state) => state.resetPassword)
  useEscapeKey(onClose, isOpen)

  // Reset the form each time the modal opens (React-recommended "adjust state
  // during render" pattern — avoids the extra render pass a useEffect would cost).
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)
    if (isOpen) {
      setNewPassword("")
      setTouched(false)
      setSuccess(false)
    }
  }

  const strength = getPasswordStrength(newPassword)
  const isValid = strength.score >= 3
  const error = touched && !isValid ? "Password is too weak" : undefined

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isValid) {
      setTouched(true)
      setShake(true)
      setTimeout(() => setShake(false), 400)
      return
    }

    setLoading(true)
    try {
      await resetPassword(user.id, newPassword)
      setSuccess(true)
      setTimeout(onClose, 900)
    } catch {
      // toast already shown by the store
      setShake(true)
      setTimeout(() => setShake(false), 400)
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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="password-reset-modal-title"
            className="admin-glass rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-100 admin-dark:border-white/10 flex items-center justify-between">
              <h3 id="password-reset-modal-title" className="text-lg font-bold text-slate-900 admin-dark:text-white">Reset Password</h3>
              <button onClick={onClose} aria-label="Close" className="p-2 hover:bg-slate-100 admin-dark:hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {success ? (
              <div className="p-10 flex flex-col items-center">
                <SuccessCheck label="Password reset" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
                <p className="text-sm text-slate-500 admin-dark:text-slate-400">
                  New password for <strong>{user.name}</strong> ({user.email})
                </p>
                <div>
                  <FloatingInput
                    label="New password"
                    type={showPassword ? "text" : "password"}
                    icon={KeyRound}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onBlur={() => setTouched(true)}
                    error={error}
                    shake={shake}
                    autoFocus
                    autoComplete="new-password"
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />
                  <PasswordStrength password={newPassword} />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-sky-500 text-white font-medium hover:bg-sky-600 hover:-translate-y-0.5 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Resetting...
                    </span>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
