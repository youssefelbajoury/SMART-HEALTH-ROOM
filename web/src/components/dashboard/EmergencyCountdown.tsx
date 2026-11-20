"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { Siren, DoorOpen } from "lucide-react"
import { playNotificationSound } from "@/lib/sound"

const COUNT_START = 5

// Fullscreen reveal shown the instant a real emergency:activated socket event
// arrives (see SocketProvider). Purely a front-end dramatic beat — the actual
// emergency (DB record, email, door-unlock broadcast) has already happened
// server-side by the time this event fires.
export function EmergencyCountdown() {
  const [message, setMessage] = useState<string | null>(null)
  const [count, setCount] = useState(COUNT_START)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail
      setMessage(detail?.message || "Emergency detected")
      setCount(COUNT_START)
    }
    window.addEventListener("emergency:activated", handler)
    return () => window.removeEventListener("emergency:activated", handler)
  }, [])

  useEffect(() => {
    if (message === null) return

    if (count <= 0) {
      const closeTimeout = setTimeout(() => setMessage(null), 400)
      return () => clearTimeout(closeTimeout)
    }

    playNotificationSound()
    const tickTimeout = setTimeout(() => setCount((c) => c - 1), 1000)
    return () => clearTimeout(tickTimeout)
  }, [message, count])

  return (
    <AnimatePresence>
      {message !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-red-950/90 backdrop-blur-md flex items-center justify-center p-4"
          role="alertdialog"
          aria-live="assertive"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center max-w-md"
          >
            <motion.div
              animate={reduceMotion ? undefined : { scale: [1, 1.08, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-500/20 border border-red-400/40 flex items-center justify-center text-red-300"
            >
              <Siren className="w-8 h-8" />
            </motion.div>

            <p className="text-red-200 text-sm font-bold uppercase tracking-widest mb-2">Emergency Activated</p>
            <p className="text-white/80 text-sm mb-8">{message}</p>

            <div className="flex items-center justify-center gap-2 text-red-200 text-xs font-medium mb-4">
              <DoorOpen className="w-4 h-4" />
              Automatic Door Unlock
            </div>

            <AnimatePresence mode="wait">
              <motion.p
                key={count}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.4, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.3 }}
                className="text-7xl font-bold text-white tabular-nums"
              >
                {count > 0 ? count : ""}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
