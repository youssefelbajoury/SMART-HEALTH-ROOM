"use client"

import { Suspense, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuthStore } from "@/store/authStore"
import { FloatingInput } from "@/components/ui/floating-input"
import { SuccessCheck } from "@/components/ui/success-check"
import { Mail, Lock, ArrowRight, Eye, EyeOff, AlertCircle, Clock, X } from "lucide-react"
import Link from "next/link"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [shake, setShake] = useState(false)
  const searchParams = useSearchParams()
  const [showExpired, setShowExpired] = useState(searchParams.get("expired") === "1")
  const router = useRouter()
  const login = useAuthStore((state) => state.login)

  const emailError = touched.email && !EMAIL_REGEX.test(email) ? "Enter a valid email address" : undefined
  const passwordError = touched.password && password.length === 0 ? "Password is required" : undefined
  const isValid = EMAIL_REGEX.test(email) && password.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!isValid) {
      setTouched({ email: true, password: true })
      setShake(true)
      setTimeout(() => setShake(false), 400)
      return
    }

    setLoading(true)
    try {
      await login(email, password)
      setSuccess(true)
      const role = useAuthStore.getState().user?.role
      const redirect = searchParams.get("redirect")
      const safeRedirect = redirect && redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : null
      setTimeout(() => router.push(safeRedirect ?? (role === "admin" ? "/admin" : "/dashboard")), 650)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please check your credentials.")
      setShake(true)
      setTimeout(() => setShake(false), 400)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
          <img src="/images/logo.png" alt="Smart Health Room logo" className="h-12 w-auto object-contain" />
          <span className="font-bold text-xl text-slate-900">Smart<span className="text-sky-500">Health</span></span>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome back</h1>
        <p className="text-slate-500">Sign in to access your dashboard</p>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/50 shadow-xl p-8 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-8 flex flex-col items-center"
            >
              <SuccessCheck label="Signed in — redirecting..." />
            </motion.div>
          ) : (
            <motion.form key="form" exit={{ opacity: 0 }} onSubmit={handleSubmit} className="space-y-5" noValidate>
              <AnimatePresence>
                {showExpired && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm"
                    role="alert"
                  >
                    <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="flex-1">Your session has expired. Please sign in again.</span>
                    <button
                      type="button"
                      onClick={() => setShowExpired(false)}
                      aria-label="Dismiss"
                      className="text-amber-500 hover:text-amber-700 transition-colors shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </motion.div>
              )}

              <FloatingInput
                label="Email address"
                type="email"
                icon={Mail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                error={emailError}
                valid={touched.email && !emailError}
                shake={shake}
                autoFocus
                autoComplete="email"
              />

              <FloatingInput
                label="Password"
                type={showPassword ? "text" : "password"}
                icon={Lock}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                error={passwordError}
                shake={shake}
                autoComplete="current-password"
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

              <button
                type="submit"
                disabled={loading || !isValid}
                className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
