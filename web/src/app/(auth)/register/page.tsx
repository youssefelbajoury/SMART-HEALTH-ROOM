"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/store/authStore"
import { FloatingInput } from "@/components/ui/floating-input"
import { PasswordStrength } from "@/components/ui/password-strength"
import { SuccessCheck } from "@/components/ui/success-check"
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, AlertCircle } from "lucide-react"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [touched, setTouched] = useState<{ firstName?: boolean; name?: boolean; email?: boolean; password?: boolean; confirmPassword?: boolean }>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [shake, setShake] = useState(false)
  const router = useRouter()
  const register = useAuthStore((state) => state.register)

  const firstNameError = touched.firstName && firstName.trim().length < 2 ? "At least 2 characters" : undefined
  const nameError = touched.name && name.trim().length < 2 ? "At least 2 characters" : undefined
  const emailError = touched.email && !EMAIL_REGEX.test(email) ? "Enter a valid email address" : undefined
  const passwordError = touched.password && password.length < 6 ? "At least 6 characters" : undefined
  const confirmPasswordError = touched.confirmPassword && confirmPassword !== password ? "Passwords don't match" : undefined

  const isValid =
    firstName.trim().length >= 2 &&
    name.trim().length >= 2 &&
    EMAIL_REGEX.test(email) &&
    password.length >= 6 &&
    confirmPassword === password

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!isValid) {
      setTouched({ firstName: true, name: true, email: true, password: true, confirmPassword: true })
      setShake(true)
      setTimeout(() => setShake(false), 400)
      return
    }

    setLoading(true)
    try {
      await register({ email, password, name, firstName })
      setSuccess(true)
      setTimeout(() => router.push("/dashboard"), 650)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.")
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
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Create your account</h1>
        <p className="text-slate-500">Start monitoring your room in minutes</p>
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
              <SuccessCheck label="Account created — redirecting..." />
            </motion.div>
          ) : (
            <motion.form key="form" exit={{ opacity: 0 }} onSubmit={handleSubmit} className="space-y-5" noValidate>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FloatingInput
                  label="First name"
                  icon={User}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, firstName: true }))}
                  error={firstNameError}
                  valid={touched.firstName && !firstNameError}
                  shake={shake}
                  autoFocus
                  autoComplete="given-name"
                />
                <FloatingInput
                  label="Last name"
                  icon={User}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                  error={nameError}
                  valid={touched.name && !nameError}
                  shake={shake}
                  autoComplete="family-name"
                />
              </div>

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
                autoComplete="email"
              />

              <div>
                <FloatingInput
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  icon={Lock}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  error={passwordError}
                  shake={shake}
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
                <PasswordStrength password={password} />
              </div>

              <FloatingInput
                label="Confirm password"
                type={showPassword ? "text" : "password"}
                icon={Lock}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
                error={confirmPasswordError}
                valid={touched.confirmPassword && !confirmPasswordError}
                shake={shake}
                autoComplete="new-password"
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
                    Create account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-center text-sm text-slate-500">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-sky-600 hover:text-sky-700 transition-colors">
                  Sign in
                </Link>
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
