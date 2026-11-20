"use client"

import { useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAdminStore, User } from "@/store/admin-store"
import { FloatingInput } from "@/components/ui/floating-input"
import { PasswordStrength } from "@/components/ui/password-strength"
import { SuccessCheck } from "@/components/ui/success-check"
import { Avatar } from "@/components/ui/avatar"
import { getPasswordStrength } from "@/lib/password"
import { useEscapeKey } from "@/hooks/useEscapeKey"
import { X, User as UserIcon, Mail, Lock, Shield, Eye, EyeOff, Cake, Phone, MapPin, Cpu, Camera } from "lucide-react"

interface UserModalProps {
  isOpen: boolean
  onClose: () => void
  mode: "create" | "edit"
  user?: User
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function UserModal({ isOpen, onClose, mode, user }: UserModalProps) {
  const emptyForm = {
    name: user?.name || "",
    firstName: user?.firstName || "",
    email: user?.email || "",
    password: "",
    role: user?.role || "user",
    dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.slice(0, 10) : "",
    phone: user?.phone || "",
    address: user?.address || "",
    deviceId: user?.deviceId || "",
    profileImage: user?.avatar || "",
  }
  const [formData, setFormData] = useState(emptyForm)
  const [showPassword, setShowPassword] = useState(false)
  const [touched, setTouched] = useState<{ name?: boolean; firstName?: boolean; email?: boolean; password?: boolean }>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [shake, setShake] = useState(false)
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addUser = useAdminStore((state) => state.addUser)
  const updateUser = useAdminStore((state) => state.updateUser)
  useEscapeKey(onClose, isOpen)

  // Reset the form each time the modal opens (React-recommended "adjust state
  // during render" pattern — avoids the extra render pass a useEffect would cost).
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)
    if (isOpen) {
      setFormData(emptyForm)
      setTouched({})
      setError("")
      setSuccess(false)
    }
  }

  const nameError = touched.name && formData.name.length < 2 ? "Last name must be at least 2 characters" : undefined
  const firstNameError =
    touched.firstName && formData.firstName.length < 2 ? "First name must be at least 2 characters" : undefined
  const emailError = touched.email && !EMAIL_REGEX.test(formData.email) ? "Enter a valid email address" : undefined
  const passwordStrength = getPasswordStrength(formData.password)
  const passwordError =
    mode === "create" && touched.password && passwordStrength.score < 3 ? "Password is too weak" : undefined

  const isValid =
    formData.name.length >= 2 &&
    formData.firstName.length >= 2 &&
    EMAIL_REGEX.test(formData.email) &&
    (mode === "edit" || passwordStrength.score >= 3)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setError("Image too large (max 2MB)")
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => setFormData((f) => ({ ...f, profileImage: reader.result as string }))
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!isValid) {
      setTouched({ name: true, firstName: true, email: true, password: true })
      setShake(true)
      setTimeout(() => setShake(false), 400)
      return
    }

    const shared = {
      name: formData.name,
      email: formData.email,
      role: formData.role as "user" | "admin",
      firstName: formData.firstName,
      dateOfBirth: formData.dateOfBirth || undefined,
      phone: formData.phone,
      address: formData.address,
      deviceId: formData.deviceId,
      profileImage: formData.profileImage,
    }

    setLoading(true)
    try {
      if (mode === "create") {
        await addUser({ ...shared, password: formData.password })
      } else if (user) {
        await updateUser(user.id, shared)
      }
      setSuccess(true)
      setTimeout(onClose, 900)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
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
            aria-labelledby="user-modal-title"
            className="admin-glass rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 admin-dark:border-white/10 flex items-center justify-between">
              <h3 id="user-modal-title" className="text-lg font-bold text-slate-900 admin-dark:text-white">
                {mode === "create" ? "Add User" : "Edit User"}
              </h3>
              <button onClick={onClose} aria-label="Close" className="p-2 hover:bg-slate-100 admin-dark:hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {success ? (
              <div className="p-10 flex flex-col items-center">
                <SuccessCheck label={mode === "create" ? "User created" : "Changes saved"} />
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto" noValidate>
                {error && (
                  <div className="px-4 py-3 rounded-xl bg-red-50 admin-dark:bg-red-500/15 border border-red-200 admin-dark:border-red-500/30 text-red-600 admin-dark:text-red-300 text-sm" role="alert">
                    {error}
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <Avatar src={formData.profileImage || undefined} name={formData.name} size="lg" />
                  <div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-600 hover:text-sky-700 transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      {formData.profileImage ? "Change photo" : "Upload photo"}
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FloatingInput
                    label="First name"
                    icon={UserIcon}
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    onBlur={() => setTouched((t) => ({ ...t, firstName: true }))}
                    error={firstNameError}
                    valid={touched.firstName && !firstNameError}
                    shake={shake}
                    autoFocus
                  />
                  <FloatingInput
                    label="Last name"
                    icon={UserIcon}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                    error={nameError}
                    valid={touched.name && !nameError}
                    shake={shake}
                  />
                </div>

                <FloatingInput
                  label="Email address"
                  type="email"
                  icon={Mail}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                  error={emailError}
                  valid={touched.email && !emailError}
                  shake={shake}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FloatingInput
                    label="Date of birth"
                    type="date"
                    icon={Cake}
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    shake={shake}
                  />
                  <FloatingInput
                    label="Phone"
                    type="tel"
                    icon={Phone}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    shake={shake}
                  />
                </div>

                <FloatingInput
                  label="Address"
                  icon={MapPin}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  shake={shake}
                />

                <FloatingInput
                  label="Device ID"
                  icon={Cpu}
                  value={formData.deviceId}
                  onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
                  shake={shake}
                />

                {mode === "create" && (
                  <div>
                    <FloatingInput
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      icon={Lock}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                    <PasswordStrength password={formData.password} />
                  </div>
                )}

                <div>
                  <label htmlFor="user-role-select" className="block text-sm font-medium text-slate-700 admin-dark:text-slate-300 mb-1.5">Role</label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      id="user-role-select"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as "user" | "admin" })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 admin-dark:bg-white/5 border border-slate-200 admin-dark:border-white/10 text-sm text-slate-900 admin-dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-shadow"
                    >
                      <option value="user">User</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-sky-500 text-white font-medium hover:bg-sky-600 hover:-translate-y-0.5 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </span>
                  ) : mode === "create" ? (
                    "Create User"
                  ) : (
                    "Save Changes"
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
