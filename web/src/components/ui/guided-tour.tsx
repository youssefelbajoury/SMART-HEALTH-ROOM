"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useRouter, usePathname } from "next/navigation"
import { useEscapeKey } from "@/hooks/useEscapeKey"
import {
  X,
  ArrowRight,
  ArrowLeft,
  Compass,
  Activity,
  Bell,
  Siren,
  Gamepad2,
  History as HistoryIcon,
  Map,
} from "lucide-react"

const TOUR_STORAGE_KEY = "smarthealth_tour_completed"

interface TourStep {
  path: string
  title: string
  description: string
  icon: typeof Activity
}

const STEPS: TourStep[] = [
  {
    path: "/dashboard",
    title: "Dashboard",
    description: "Your environment at a glance — live sensor readings, room status and quick stats update here in real time.",
    icon: Activity,
  },
  {
    path: "/dashboard",
    title: "Sensors & Charts",
    description: "Temperature, humidity, air quality and more, with 24-hour history charts right below the sensor cards.",
    icon: Activity,
  },
  {
    path: "/dashboard/alerts",
    title: "Alerts",
    description: "Every threshold crossing is recorded here. Mark them read, delete them, or review what triggered each one.",
    icon: Bell,
  },
  {
    path: "/dashboard/emergency",
    title: "Emergency",
    description: "Active and past emergencies live here, with the sensors that triggered them and one-click resolution.",
    icon: Siren,
  },
  {
    path: "/dashboard/remote-control",
    title: "Remote Control",
    description: "Control the lamp, door, buzzer and RGB status LED remotely — every command is sent to the real backend.",
    icon: Gamepad2,
  },
  {
    path: "/dashboard/history",
    title: "History",
    description: "An Activity Timeline of everything that happened, plus a System Logs feed for technical event details.",
    icon: HistoryIcon,
  },
  {
    path: "/dashboard/room-map",
    title: "Room Map",
    description: "A live floor-plan view of every sensor's position and current status — click any node for details.",
    icon: Map,
  },
]

export function GuidedTour() {
  const router = useRouter()
  const pathname = usePathname()
  const [active, setActive] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const completed = typeof window !== "undefined" && localStorage.getItem(TOUR_STORAGE_KEY)
    if (!completed) {
      const timer = setTimeout(() => {
        setStep(0)
        setActive(true)
      }, 1200)
      return () => clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    const restart = () => {
      setStep(0)
      setActive(true)
      router.push(STEPS[0].path)
    }
    window.addEventListener("guided-tour:restart", restart)
    return () => window.removeEventListener("guided-tour:restart", restart)
  }, [router])

  useEffect(() => {
    if (!active) return
    const target = STEPS[step].path
    if (pathname !== target) {
      router.push(target)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, step])

  const finish = () => {
    setActive(false)
    localStorage.setItem(TOUR_STORAGE_KEY, "1")
  }

  const next = () => {
    if (step >= STEPS.length - 1) {
      finish()
    } else {
      setStep((s) => s + 1)
    }
  }

  const prev = () => setStep((s) => Math.max(0, s - 1))

  useEscapeKey(finish, active)

  if (!active) return null

  const current = STEPS[step]
  const Icon = current.icon

  return (
    <AnimatePresence>
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        role="dialog"
        aria-label="Guided tour"
        className="fixed bottom-6 right-6 z-[100] w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/95 backdrop-blur-xl shadow-2xl day:bg-white/95 day:border-slate-200 p-5"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-400 flex items-center gap-1">
                <Compass className="w-3 h-3" />
                Guided Tour
              </p>
              <h3 className="text-sm font-bold text-white day:text-slate-900">{current.title}</h3>
            </div>
          </div>
          <button onClick={finish} aria-label="Skip tour" className="text-slate-500 hover:text-slate-300 day:hover:text-slate-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-slate-400 day:text-slate-600 leading-relaxed mb-4">{current.description}</p>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-4 bg-sky-400" : "w-1.5 bg-slate-700 day:bg-slate-200"}`} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={prev}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 day:hover:bg-slate-100 day:hover:text-slate-900 transition-colors"
                aria-label="Previous step"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={next}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-medium transition-colors"
            >
              {step >= STEPS.length - 1 ? "Finish" : "Next"}
              {step < STEPS.length - 1 && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
