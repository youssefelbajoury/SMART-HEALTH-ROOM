"use client"

import { useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { RevealText } from "@/components/ui/reveal-text"
import { FloatingInput } from "@/components/ui/floating-input"
import { PasswordStrength } from "@/components/ui/password-strength"
import { SuccessCheck } from "@/components/ui/success-check"
import { getPasswordStrength } from "@/lib/password"
import { useEscapeKey } from "@/hooks/useEscapeKey"
import {
  Package,
  Shield,
  Zap,
  Wifi,
  Cpu,
  Battery,
  ArrowRight,
  X,
  Check,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Cake,
  Phone,
  AlertCircle,
} from "lucide-react"
import { Testimonials } from "@/components/testimonials"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const API_URL = "http://localhost:5000/api/v1"

const productFeatures = [
  { icon: Cpu, title: "Arduino Mega 2560", desc: "The system's core, with 12 built-in sensors." },
  { icon: Wifi, title: "ESP32 WiFi", desc: "Stable real-time wireless connectivity." },
  { icon: Shield, title: "Advanced Security", desc: "RFID authentication and encryption." },
  { icon: Zap, title: "Instant Alerts", desc: "Push notifications as soon as a critical threshold is reached." },
  { icon: Battery, title: "Reliability", desc: "24/7 operation with low power consumption." },
  { icon: Package, title: "Plug & Play", desc: "Simplified installation with a step-by-step guide." },
]

export default function ProductPage() {
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [orderFirstName, setOrderFirstName] = useState("")
  const [orderLastName, setOrderLastName] = useState("")
  const [orderDob, setOrderDob] = useState("")
  const [orderPhone, setOrderPhone] = useState("")
  const [orderEmail, setOrderEmail] = useState("")
  const [orderPassword, setOrderPassword] = useState("")
  const [showOrderPassword, setShowOrderPassword] = useState(false)
  const [orderTouched, setOrderTouched] = useState<{ firstName?: boolean; lastName?: boolean; dob?: boolean; email?: boolean; password?: boolean }>({})
  const [orderSubmitting, setOrderSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderShake, setOrderShake] = useState(false)
  const [orderError, setOrderError] = useState("")
  const reduceMotion = useReducedMotion()

  const orderFirstNameError = orderTouched.firstName && orderFirstName.length < 2 ? "First name must be at least 2 characters" : undefined
  const orderLastNameError = orderTouched.lastName && orderLastName.length < 2 ? "Last name must be at least 2 characters" : undefined
  const orderDobError = orderTouched.dob && Number.isNaN(new Date(orderDob).getTime()) ? "Enter a valid date of birth" : undefined
  const orderEmailError = orderTouched.email && !EMAIL_REGEX.test(orderEmail) ? "Enter a valid email address" : undefined
  const orderPasswordStrength = getPasswordStrength(orderPassword)
  const orderPasswordError =
    orderTouched.password && orderPasswordStrength.score < 3 ? "Password is too weak" : undefined
  const orderValid =
    orderFirstName.length >= 2 &&
    orderLastName.length >= 2 &&
    !Number.isNaN(new Date(orderDob).getTime()) &&
    EMAIL_REGEX.test(orderEmail) &&
    orderPasswordStrength.score >= 3

  const closeOrderForm = () => {
    setShowOrderForm(false)
    setOrderFirstName("")
    setOrderLastName("")
    setOrderDob("")
    setOrderPhone("")
    setOrderEmail("")
    setOrderPassword("")
    setOrderTouched({})
    setOrderError("")
    setOrderSuccess(false)
  }

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setOrderError("")
    if (!orderValid) {
      setOrderTouched({ firstName: true, lastName: true, dob: true, email: true, password: true })
      setOrderShake(true)
      setTimeout(() => setOrderShake(false), 400)
      return
    }
    setOrderSubmitting(true)
    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: orderFirstName,
          lastName: orderLastName,
          dateOfBirth: orderDob,
          phone: orderPhone,
          email: orderEmail,
          password: orderPassword,
        }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Failed to place order")
      }
      setOrderSuccess(true)
      setTimeout(closeOrderForm, 1400)
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : "Failed to place order")
      setOrderShake(true)
      setTimeout(() => setOrderShake(false), 400)
    } finally {
      setOrderSubmitting(false)
    }
  }

  useEscapeKey(closeOrderForm, showOrderForm)

  return (
    <div className="min-h-screen bg-white pt-24 pb-12">
      {/* Product Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <motion.div
              animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative aspect-square rounded-3xl bg-gradient-to-br from-slate-50 to-sky-50 transition-colors"
            >
              <Image
                src="/images/product-hero.webp"
                alt="Smart Health Room Kit Pro components including Arduino Mega, ESP32, sensors and connected dashboard mockups"
                fill
                priority
                sizes="(max-width: 1024px) 90vw, 45vw"
                className="object-contain"
              />
            </motion.div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 text-sky-600 text-sm font-medium mb-4">
              <Zap className="w-4 h-4" />
              In Stock
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              <RevealText text="Smart Health Room" as="span" delay={0.3} />{" "}
              <RevealText
                text="Kit Pro"
                as="span"
                wordClassName="bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-blue-600"
                delay={0.55}
              />
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.75, ease: "easeOut" }}
              className="text-lg text-slate-500 leading-relaxed mb-8"
            >
              The complete kit to turn any room into a connected health space.
              Includes Arduino Mega, ESP32, sensors and accessories.
            </motion.p>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.08, delayChildren: 0.9 } } }}
              className="grid sm:grid-cols-2 gap-4 mb-8"
            >
              {productFeatures.slice(0, 4).map((f) => {
                const Icon = f.icon
                return (
                  <motion.div
                    key={f.title}
                    variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
                    whileHover={{ y: -2 }}
                    className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 transition-shadow hover:shadow-sm"
                  >
                    <Icon className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{f.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{f.desc}</p>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>

            <button onClick={() => setShowOrderForm(true)} className="btn-primary flex items-center gap-2 text-lg px-8 py-4">
              Order Now
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Detailed Description */}
      <section className="bg-slate-50/50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30, scale: 0.97 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Detailed Description</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">A complete system designed for intelligent monitoring.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {productFeatures.map((feature, i) => {
              const Icon = feature.icon
              return (
                <motion.div key={feature.title} initial={{ opacity: 0, y: 20, scale: 0.96 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="card-premium">
                  <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-sky-500" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-500">{feature.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      <Testimonials />

      {/* Order Form Modal */}
      <AnimatePresence>
        {showOrderForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={closeOrderForm}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8">
              <button onClick={closeOrderForm} aria-label="Close" disabled={orderSubmitting}
                className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                <X className="w-4 h-4" />
              </button>

              {orderSuccess ? (
                <div className="py-8 flex flex-col items-center">
                  <SuccessCheck label="Order placed! We'll be in touch shortly." />
                </div>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-sky-50 flex items-center justify-center">
                      <Package className="w-7 h-7 text-sky-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">Place Your Order</h3>
                    <p className="text-sm text-slate-500 mt-1">Fill in the form below to get started</p>
                  </div>

                  <form className="space-y-4" onSubmit={handleOrderSubmit} noValidate>
                    {orderError && (
                      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm" role="alert">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {orderError}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FloatingInput
                        label="First name"
                        icon={User}
                        value={orderFirstName}
                        onChange={(e) => setOrderFirstName(e.target.value)}
                        onBlur={() => setOrderTouched((t) => ({ ...t, firstName: true }))}
                        error={orderFirstNameError}
                        valid={orderTouched.firstName && !orderFirstNameError}
                        shake={orderShake}
                        autoFocus
                      />
                      <FloatingInput
                        label="Last name"
                        icon={User}
                        value={orderLastName}
                        onChange={(e) => setOrderLastName(e.target.value)}
                        onBlur={() => setOrderTouched((t) => ({ ...t, lastName: true }))}
                        error={orderLastNameError}
                        valid={orderTouched.lastName && !orderLastNameError}
                        shake={orderShake}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FloatingInput
                        label="Date of birth"
                        type="date"
                        icon={Cake}
                        value={orderDob}
                        onChange={(e) => setOrderDob(e.target.value)}
                        onBlur={() => setOrderTouched((t) => ({ ...t, dob: true }))}
                        error={orderDobError}
                        valid={orderTouched.dob && !orderDobError}
                        shake={orderShake}
                      />
                      <FloatingInput
                        label="Phone"
                        type="tel"
                        icon={Phone}
                        value={orderPhone}
                        onChange={(e) => setOrderPhone(e.target.value)}
                        shake={orderShake}
                      />
                    </div>
                    <FloatingInput
                      label="Email address"
                      type="email"
                      icon={Mail}
                      value={orderEmail}
                      onChange={(e) => setOrderEmail(e.target.value)}
                      onBlur={() => setOrderTouched((t) => ({ ...t, email: true }))}
                      error={orderEmailError}
                      valid={orderTouched.email && !orderEmailError}
                      shake={orderShake}
                    />
                    <div>
                      <FloatingInput
                        label="Password"
                        type={showOrderPassword ? "text" : "password"}
                        icon={Lock}
                        value={orderPassword}
                        onChange={(e) => setOrderPassword(e.target.value)}
                        onBlur={() => setOrderTouched((t) => ({ ...t, password: true }))}
                        error={orderPasswordError}
                        shake={orderShake}
                        autoComplete="new-password"
                        rightElement={
                          <button
                            type="button"
                            onClick={() => setShowOrderPassword((v) => !v)}
                            aria-label={showOrderPassword ? "Hide password" : "Show password"}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {showOrderPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        }
                      />
                      <PasswordStrength password={orderPassword} />
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Check className="w-4 h-4 text-sky-500" />
                      <span>Secure SSL checkout</span>
                    </div>

                    <button type="submit" disabled={orderSubmitting} className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 disabled:opacity-50">
                      {orderSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          Confirm Order
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}