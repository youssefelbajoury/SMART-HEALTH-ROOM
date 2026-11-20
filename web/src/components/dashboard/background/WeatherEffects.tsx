"use client"

import { memo } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useOccasionalReveal } from "@/hooks/useOccasionalReveal"
import type { BackgroundScene } from "@/hooks/useBackgroundScene"

interface LayerProps {
  scene: BackgroundScene
}

function seeded(i: number, salt: number) {
  return ((i * 9301 + salt) % 233280) / 233280
}

const RAIN_COUNT = 10
const RAIN_DROPS = Array.from({ length: RAIN_COUNT }, (_, i) => ({
  left: 2 + seeded(i, 49297) * 96,
  duration: 0.6 + seeded(i, 12345) * 0.5,
  delay: seeded(i, 5417) * 2,
}))

const SNOW_COUNT = 10
const SNOWFLAKES = Array.from({ length: SNOW_COUNT }, (_, i) => ({
  left: 2 + seeded(i, 8191) * 96,
  duration: 5 + seeded(i, 2003) * 4,
  delay: seeded(i, 733) * 4,
  size: 2 + (i % 3),
}))

function WeatherEffectsImpl({ scene }: LayerProps) {
  const { category, showRainbow, reducedMotion } = scene
  const showFlash = useOccasionalReveal(category === "storm" && !reducedMotion, 8_000, 22_000, 600)

  return (
    <div className="absolute inset-0">
      {category === "rain" && !reducedMotion && (
        <div className="absolute inset-0">
          {RAIN_DROPS.map((drop, i) => (
            <span
              key={i}
              className="absolute w-px h-3 bg-sky-200/60 bg-fall"
              style={{ left: `${drop.left}%`, top: 0, animationDuration: `${drop.duration}s`, animationDelay: `${drop.delay}s` }}
            />
          ))}
        </div>
      )}

      {category === "snow" && !reducedMotion && (
        <div className="absolute inset-0">
          {SNOWFLAKES.map((flake, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-white/80 bg-fall"
              style={{
                left: `${flake.left}%`,
                top: 0,
                width: flake.size,
                height: flake.size,
                animationDuration: `${flake.duration}s`,
                animationDelay: `${flake.delay}s`,
              }}
            />
          ))}
        </div>
      )}

      {showFlash && <div className="absolute inset-0 bg-white bg-lightning-flash" />}

      <AnimatePresence>
        {showRainbow && (
          <motion.svg
            key="rainbow"
            width="360"
            height="180"
            viewBox="0 0 360 180"
            className="absolute left-1/2 -translate-x-1/2"
            style={{ top: "6%" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
          >
            <path d="M10 180 A170 170 0 0 1 350 180" stroke="#ef4444" strokeWidth="6" fill="none" />
            <path d="M32 180 A148 148 0 0 1 328 180" stroke="#f97316" strokeWidth="6" fill="none" />
            <path d="M54 180 A126 126 0 0 1 306 180" stroke="#eab308" strokeWidth="6" fill="none" />
            <path d="M76 180 A104 104 0 0 1 284 180" stroke="#22c55e" strokeWidth="6" fill="none" />
            <path d="M98 180 A82 82 0 0 1 262 180" stroke="#3b82f6" strokeWidth="6" fill="none" />
            <path d="M120 180 A60 60 0 0 1 240 180" stroke="#8b5cf6" strokeWidth="6" fill="none" />
          </motion.svg>
        )}
      </AnimatePresence>
    </div>
  )
}

export const WeatherEffects = memo(WeatherEffectsImpl)
