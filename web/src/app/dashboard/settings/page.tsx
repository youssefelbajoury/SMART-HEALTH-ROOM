'use client'

import { useRef, useState, ChangeEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { authHeaders } from '@/lib/api'
import { FloatingInput } from '@/components/ui/floating-input'
import { PasswordStrength } from '@/components/ui/password-strength'
import { SuccessCheck } from '@/components/ui/success-check'
import { Avatar } from '@/components/ui/avatar'
import { ConnectionStatusPanel } from '@/components/dashboard/ConnectionStatusPanel'
import { Switch } from '@/components/ui/switch'
import { useDemoStore } from '@/store/demoStore'
import { useSettingsStore, type TemperatureUnit, type ThemeOverride } from '@/store/settingsStore'
import { getPasswordStrength } from '@/lib/password'
import {
  User,
  Mail,
  Lock,
  Camera,
  Save,
  AlertCircle,
  Check,
  Loader2,
  Eye,
  EyeOff,
  Trash2,
  FlaskConical,
  Compass,
  Cake,
  Phone,
  MapPin,
  Thermometer,
  SunMoon,
  Sparkles,
  Bell,
  Volume2,
  MonitorSmartphone,
} from 'lucide-react'

const THEME_OPTIONS: { value: ThemeOverride; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'day', label: 'Day' },
  { value: 'night', label: 'Night' },
]

const UNIT_OPTIONS: { value: TemperatureUnit; label: string }[] = [
  { value: 'C', label: '°C' },
  { value: 'F', label: '°F' },
]

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function SettingsPage() {
  const { user, updateUser, updateProfileImage, removeProfileImage, changePassword } = useAuthStore()
  const demoEnabled = useDemoStore((state) => state.enabled)
  const toggleDemo = useDemoStore((state) => state.toggle)
  const startDemoSequence = useDemoStore((state) => state.startSequence)

  const temperatureUnit = useSettingsStore((state) => state.temperatureUnit)
  const setTemperatureUnit = useSettingsStore((state) => state.setTemperatureUnit)
  const themeOverride = useSettingsStore((state) => state.themeOverride)
  const setThemeOverride = useSettingsStore((state) => state.setThemeOverride)
  const reduceMotion = useSettingsStore((state) => state.reduceMotion)
  const setReduceMotion = useSettingsStore((state) => state.setReduceMotion)
  const notificationPrefs = useSettingsStore((state) => state.notifications)
  const setNotificationPreference = useSettingsStore((state) => state.setNotificationPreference)

  const [firstName, setFirstName] = useState(user?.firstName || '')
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth ? user.dateOfBirth.slice(0, 10) : '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [address, setAddress] = useState(user?.address || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [profileTouched, setProfileTouched] = useState<{ firstName?: boolean; name?: boolean; email?: boolean }>({})
  const [passwordTouched, setPasswordTouched] = useState<{ current?: boolean; next?: boolean; confirm?: boolean }>({})

  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileShake, setProfileShake] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordShake, setPasswordShake] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const firstNameError = profileTouched.firstName && firstName.length < 2 ? 'First name must be at least 2 characters' : undefined
  const nameError = profileTouched.name && name.length < 2 ? 'Last name must be at least 2 characters' : undefined
  const emailError = profileTouched.email && !EMAIL_REGEX.test(email) ? 'Enter a valid email address' : undefined
  const profileValid = firstName.length >= 2 && name.length >= 2 && EMAIL_REGEX.test(email)

  const newPasswordStrength = getPasswordStrength(newPassword)
  const confirmError =
    passwordTouched.confirm && confirmPassword && newPassword !== confirmPassword
      ? "Passwords don't match"
      : undefined
  const newPasswordError =
    passwordTouched.next && newPassword.length > 0 && newPasswordStrength.score < 3 ? 'Password is too weak' : undefined
  const passwordFormValid =
    currentPassword.length > 0 && newPasswordStrength.score >= 3 && newPassword === confirmPassword

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!profileValid) {
      setProfileTouched({ firstName: true, name: true, email: true })
      setProfileShake(true)
      setTimeout(() => setProfileShake(false), 400)
      return
    }

    setProfileLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/v1/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ nom: name, prenom: firstName, email, dateNaissance: dateOfBirth || undefined, phone, address }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Update failed')
      }

      const data = await response.json()
      updateUser({
        name: data.user.nom,
        firstName: data.user.prenom,
        email: data.user.email,
        dateOfBirth: data.user.dateNaissance,
        phone: data.user.phone,
        address: data.user.address,
      })
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 1600)
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Something went wrong' })
      setProfileShake(true)
      setTimeout(() => setProfileShake(false), 400)
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!passwordFormValid) {
      setPasswordTouched({ current: true, next: true, confirm: true })
      setPasswordShake(true)
      setTimeout(() => setPasswordShake(false), 400)
      return
    }

    setPasswordLoading(true)
    try {
      await changePassword(currentPassword, newPassword)
      setPasswordSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordTouched({})
      setTimeout(() => setPasswordSuccess(false), 1600)
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Something went wrong' })
      setPasswordShake(true)
      setTimeout(() => setPasswordShake(false), 400)
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image too large (max 2MB)' })
      return
    }

    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64 = reader.result as string
      try {
        setImageLoading(true)
        await updateProfileImage(base64)
        setMessage({ type: 'success', text: 'Profile photo updated' })
      } catch {
        setMessage({ type: 'error', text: 'Upload failed' })
      } finally {
        setImageLoading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleImageRemove = async () => {
    try {
      setImageLoading(true)
      await removeProfileImage()
      setMessage({ type: 'success', text: 'Profile photo removed' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to remove photo' })
    } finally {
      setImageLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white day:text-slate-900">Settings</h1>
        <p className="text-slate-400 day:text-slate-500 mt-1">Manage your profile and security</p>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl flex items-center gap-2 border ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}
          role="status"
        >
          {message.type === 'success' ? <Check className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          {message.text}
        </motion.div>
      )}

      {/* Profile photo */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="dash-glass p-6">
        <h2 className="text-lg font-semibold text-white day:text-slate-900 mb-4">Profile Photo</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar src={user?.profileImage} name={user?.name} size="xl" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={imageLoading}
              aria-label="Upload new photo"
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {imageLoading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
            </button>
          </div>
          <div>
            <p className="text-white day:text-slate-900 font-medium">{[user?.firstName, user?.name].filter(Boolean).join(' ') || user?.name}</p>
            <p className="text-slate-400 day:text-slate-500 text-sm">{user?.email}</p>
            <div className="flex items-center gap-3 mt-1.5">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={imageLoading}
                className="text-xs font-medium text-sky-400 hover:text-sky-300 transition-colors disabled:opacity-50"
              >
                Change photo
              </button>
              {user?.profileImage && (
                <button
                  onClick={handleImageRemove}
                  disabled={imageLoading}
                  className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Remove
                </button>
              )}
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        </div>
      </motion.div>

      {/* Personal information */}
      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        onSubmit={handleProfileUpdate}
        className="dash-glass p-6 space-y-4"
        noValidate
      >
        <h2 className="text-lg font-semibold text-white day:text-slate-900 mb-4">Personal Information</h2>

        <AnimatePresence mode="wait">
          {profileSuccess ? (
            <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-4 flex justify-center">
              <SuccessCheck size={44} label="Profile saved" />
            </motion.div>
          ) : (
            <motion.div key="fields" exit={{ opacity: 0 }} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FloatingInput
                  label="First name"
                  icon={User}
                  dark
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  onBlur={() => setProfileTouched((t) => ({ ...t, firstName: true }))}
                  error={firstNameError}
                  valid={profileTouched.firstName && !firstNameError}
                  shake={profileShake}
                />
                <FloatingInput
                  label="Last name"
                  icon={User}
                  dark
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setProfileTouched((t) => ({ ...t, name: true }))}
                  error={nameError}
                  valid={profileTouched.name && !nameError}
                  shake={profileShake}
                />
              </div>
              <FloatingInput
                label="Email address"
                type="email"
                icon={Mail}
                dark
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setProfileTouched((t) => ({ ...t, email: true }))}
                error={emailError}
                valid={profileTouched.email && !emailError}
                shake={profileShake}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FloatingInput
                  label="Date of birth"
                  type="date"
                  icon={Cake}
                  dark
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  shake={profileShake}
                />
                <FloatingInput
                  label="Phone"
                  type="tel"
                  icon={Phone}
                  dark
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  shake={profileShake}
                />
              </div>
              <FloatingInput
                label="Address"
                icon={MapPin}
                dark
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                shake={profileShake}
              />
              <button
                type="submit"
                disabled={profileLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {profileLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Changes
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.form>

      {/* Password */}
      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handlePasswordChange}
        className="dash-glass p-6 space-y-4"
        noValidate
      >
        <h2 className="text-lg font-semibold text-white day:text-slate-900 mb-4">Change Password</h2>

        <AnimatePresence mode="wait">
          {passwordSuccess ? (
            <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-4 flex justify-center">
              <SuccessCheck size={44} label="Password changed" />
            </motion.div>
          ) : (
            <motion.div key="fields" exit={{ opacity: 0 }} className="space-y-4">
              <FloatingInput
                label="Current password"
                type={showCurrent ? 'text' : 'password'}
                icon={Lock}
                dark
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                onBlur={() => setPasswordTouched((t) => ({ ...t, current: true }))}
                error={passwordTouched.current && !currentPassword ? 'Current password is required' : undefined}
                shake={passwordShake}
                autoComplete="current-password"
                rightElement={
                  <button type="button" onClick={() => setShowCurrent((v) => !v)} aria-label={showCurrent ? 'Hide password' : 'Show password'} className="text-slate-500 hover:text-slate-300 day:hover:text-slate-700">
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              <div>
                <FloatingInput
                  label="New password"
                  type={showNew ? 'text' : 'password'}
                  icon={Lock}
                  dark
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onBlur={() => setPasswordTouched((t) => ({ ...t, next: true }))}
                  error={newPasswordError}
                  shake={passwordShake}
                  autoComplete="new-password"
                  rightElement={
                    <button type="button" onClick={() => setShowNew((v) => !v)} aria-label={showNew ? 'Hide password' : 'Show password'} className="text-slate-500 hover:text-slate-300 day:hover:text-slate-700">
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
                <PasswordStrength password={newPassword} />
              </div>

              <FloatingInput
                label="Confirm new password"
                type={showConfirm ? 'text' : 'password'}
                icon={Lock}
                dark
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => setPasswordTouched((t) => ({ ...t, confirm: true }))}
                error={confirmError}
                valid={passwordTouched.confirm && !confirmError && confirmPassword.length > 0}
                shake={passwordShake}
                autoComplete="new-password"
                rightElement={
                  <button type="button" onClick={() => setShowConfirm((v) => !v)} aria-label={showConfirm ? 'Hide password' : 'Show password'} className="text-slate-500 hover:text-slate-300 day:hover:text-slate-700">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/50 text-white day:bg-slate-100 day:text-slate-700 day:hover:bg-slate-200 font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {passwordLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                Change Password
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.form>

      {/* Preferences */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="dash-glass p-6 space-y-4"
      >
        <h2 className="text-lg font-semibold text-white day:text-slate-900 mb-1">Preferences</h2>

        <div className="flex items-center justify-between gap-4 py-2">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-white day:text-slate-900">Demo Mode</p>
              <p className="text-xs text-slate-500 max-w-sm">
                Simulate live sensor data, alerts and emergencies without any hardware connected — ideal for presentations.
              </p>
            </div>
          </div>
          <Switch checked={demoEnabled} onChange={toggleDemo} activeColor="#f59e0b" />
        </div>

        <div className="flex items-center justify-between gap-4 py-2 border-t border-slate-800 day:border-slate-100 pt-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-white day:text-slate-900">Guided Demo</p>
              <p className="text-xs text-slate-500 max-w-sm">
                A fully automatic, scripted walkthrough — normal room, sensor updates, warning, emergency, recovery and finish.
              </p>
            </div>
          </div>
          <button
            onClick={() => startDemoSequence()}
            className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-400 transition-colors"
          >
            Start Demo
          </button>
        </div>

        <div className="flex items-center justify-between gap-4 py-2 border-t border-slate-800 day:border-slate-100 pt-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-white day:text-slate-900">Guided Tour</p>
              <p className="text-xs text-slate-500 max-w-sm">Replay the introduction to the dashboard&apos;s main features.</p>
            </div>
          </div>
          <button
            onClick={() => window.dispatchEvent(new Event("guided-tour:restart"))}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-200 text-sm font-medium hover:bg-slate-700 day:bg-slate-100 day:text-slate-700 day:hover:bg-slate-200 transition-colors"
          >
            Replay Tour
          </button>
        </div>
      </motion.div>

      {/* App Settings — units, theme override, animation, notifications */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="dash-glass p-6 space-y-5"
      >
        <h2 className="text-lg font-semibold text-white day:text-slate-900 mb-1">App Settings</h2>

        <div className="flex items-center justify-between gap-4 py-2">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0">
              <Thermometer className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-white day:text-slate-900">Temperature Unit</p>
              <p className="text-xs text-slate-500 max-w-sm">Applies to every temperature reading across the dashboard.</p>
            </div>
          </div>
          <div className="inline-flex gap-1 p-1 rounded-xl bg-slate-800/60 day:bg-slate-100">
            {UNIT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTemperatureUnit(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  temperatureUnit === opt.value
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 day:text-slate-500 day:hover:text-slate-800'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 py-2 border-t border-slate-800 day:border-slate-100 pt-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
              <SunMoon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-white day:text-slate-900">Dashboard Theme</p>
              <p className="text-xs text-slate-500 max-w-sm">
                Auto follows the room&apos;s light sensor (LDR). Override it to force Day or Night mode manually.
              </p>
            </div>
          </div>
          <div className="inline-flex gap-1 p-1 rounded-xl bg-slate-800/60 day:bg-slate-100">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setThemeOverride(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  themeOverride === opt.value
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 day:text-slate-500 day:hover:text-slate-800'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 py-2 border-t border-slate-800 day:border-slate-100 pt-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 text-fuchsia-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-white day:text-slate-900">Reduce Motion</p>
              <p className="text-xs text-slate-500 max-w-sm">Minimize animations across the dashboard.</p>
            </div>
          </div>
          <Switch checked={reduceMotion} onChange={() => setReduceMotion(!reduceMotion)} activeColor="#d946ef" />
        </div>

        <div className="flex items-center justify-between gap-4 py-2 border-t border-slate-800 day:border-slate-100 pt-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-white day:text-slate-900">Toast Notifications</p>
              <p className="text-xs text-slate-500 max-w-sm">Show in-app toasts for events (critical alerts always show).</p>
            </div>
          </div>
          <Switch
            checked={notificationPrefs.toastsEnabled}
            onChange={() => setNotificationPreference('toastsEnabled', !notificationPrefs.toastsEnabled)}
            activeColor="#38bdf8"
          />
        </div>

        <div className="flex items-center justify-between gap-4 py-2 border-t border-slate-800 day:border-slate-100 pt-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-white day:text-slate-900">Notification Sound</p>
              <p className="text-xs text-slate-500 max-w-sm">Play a sound for important events.</p>
            </div>
          </div>
          <Switch
            checked={notificationPrefs.soundEnabled}
            onChange={() => setNotificationPreference('soundEnabled', !notificationPrefs.soundEnabled)}
            activeColor="#34d399"
          />
        </div>

        <div className="flex items-center justify-between gap-4 py-2 border-t border-slate-800 day:border-slate-100 pt-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center shrink-0">
              <MonitorSmartphone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-white day:text-slate-900">Browser Notifications</p>
              <p className="text-xs text-slate-500 max-w-sm">Show OS-level notifications, even when this tab isn&apos;t focused.</p>
            </div>
          </div>
          <Switch
            checked={notificationPrefs.browserNotificationsEnabled}
            onChange={() => setNotificationPreference('browserNotificationsEnabled', !notificationPrefs.browserNotificationsEnabled)}
            activeColor="#a78bfa"
          />
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <ConnectionStatusPanel />
      </motion.div>
    </div>
  )
}
