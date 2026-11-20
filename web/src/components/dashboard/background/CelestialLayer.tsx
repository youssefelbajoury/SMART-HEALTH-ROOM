"use client"

import { memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useOccasionalReveal } from "@/hooks/useOccasionalReveal"
import type { BackgroundScene } from "@/hooks/useBackgroundScene"

const SUN_POSITION: Record<string, { top: string; left: string }> = {
  goldenHourMorning: { top: "48%", left: "14%" },
  day: { top: "12%", left: "72%" },
  goldenHourEvening: { top: "46%", left: "82%" },
}

const MOON_POSITION: Record<string, { top: string; left: string }> = {
  blueHour: { top: "18%", left: "76%" },
  night: { top: "10%", left: "66%" },
}

const STAR_COUNT = 20
const STARS = Array.from({ length: STAR_COUNT }, (_, i) => {
  const a = ((i * 9301 + 49297) % 233280) / 233280
  const b = ((i * 4321 + 12345) % 233280) / 233280
  return {
    top: 4 + a * 55,
    left: 2 + b * 96,
    size: 1 + (i % 3),
    delay: (i % 10) * 0.3,
  }
})

interface LayerProps {
  scene: BackgroundScene
}

// A storm's dark cloud cover should fully hide the sun/moon; lighter
// overcast conditions only dim it.
const CELESTIAL_OPACITY: Record<string, number> = {
  storm: 0,
  fog: 0.15,
  rain: 0.35,
  cloudy: 0.6,
  snow: 0.6,
  clear: 1,
}

function CelestialLayerImpl({ scene }: LayerProps) {
  const { isDay, period, category, reducedMotion } = scene
  const sunPos = SUN_POSITION[period]
  const moonPos = MOON_POSITION[period]
  const showShootingStar = useOccasionalReveal(!isDay && !reducedMotion, 20_000, 60_000, 1_200)
  const celestialOpacity = CELESTIAL_OPACITY[category] ?? 1

  return (
    <div className="absolute inset-0">
      <AnimatePresence>
        {isDay && sunPos && celestialOpacity > 0 && (
          <motion.div
            key="sun"
            initial={{ opacity: 0 }}
            animate={{ opacity: celestialOpacity }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ top: sunPos.top, left: sunPos.left }}
          >
            <div
              className={`w-16 h-16 rounded-full bg-gradient-to-br from-amber-200 to-orange-400 shadow-[0_0_60px_24px_rgba(251,191,36,0.35)] ${
                reducedMotion ? "" : "animate-pulse"
              }`}
            />
          </motion.div>
        )}

        {!isDay && moonPos && celestialOpacity > 0 && (
          <motion.div
            key="moon"
            initial={{ opacity: 0 }}
            animate={{ opacity: celestialOpacity }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ top: moonPos.top, left: moonPos.left }}
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-100 to-slate-300 shadow-[0_0_40px_14px_rgba(226,232,240,0.25)]" />
          </motion.div>
        )}
      </AnimatePresence>

      {!isDay && (
        <div className="absolute inset-0">
          {STARS.map((star, i) => (
            <span
              key={i}
              className={`absolute rounded-full bg-white ${reducedMotion ? "opacity-60" : "bg-twinkle"}`}
              style={{
                top: `${star.top}%`,
                left: `${star.left}%`,
                width: star.size,
                height: star.size,
                animationDelay: `${star.delay}s`,
              }}
            />
          ))}

          {showShootingStar && (
            <motion.span
              className="absolute h-px w-24 bg-gradient-to-r from-white to-transparent"
              style={{ top: "15%", left: "10%" }}
              initial={{ opacity: 0, x: 0, y: 0 }}
              animate={{ opacity: [0, 1, 0], x: 220, y: 140 }}
              transition={{ duration: 1.1, ease: "easeIn" }}
            />
          )}
        </div>
      )}
    </div>
  )
}

export const CelestialLayer = memo(CelestialLayerImpl)
