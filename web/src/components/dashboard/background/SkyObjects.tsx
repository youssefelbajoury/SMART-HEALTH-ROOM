"use client"

import { memo } from "react"
import { motion } from "framer-motion"
import { Plane } from "lucide-react"
import { useOccasionalReveal } from "@/hooks/useOccasionalReveal"
import type { BackgroundScene } from "@/hooks/useBackgroundScene"

interface LayerProps {
  scene: BackgroundScene
}

const CLOUDS = [
  { top: 12, scale: 1, duration: 95, delay: 0 },
  { top: 24, scale: 0.7, duration: 130, delay: -40 },
  { top: 34, scale: 0.5, duration: 75, delay: -18 },
]

const FIREFLY_COUNT = 8
const FIREFLIES = Array.from({ length: FIREFLY_COUNT }, (_, i) => {
  const a = ((i * 7919 + 104729) % 100000) / 100000
  const b = ((i * 5303 + 1009) % 100000) / 100000
  return { top: 45 + a * 45, left: 4 + b * 92, duration: 4 + (i % 4), delay: i * 0.6 }
})

function Cloud({ tint }: { tint: string }) {
  return (
    <svg width="140" height="46" viewBox="0 0 140 46" fill="none">
      <ellipse cx="38" cy="28" rx="34" ry="16" fill={tint} />
      <ellipse cx="72" cy="18" rx="30" ry="18" fill={tint} />
      <ellipse cx="102" cy="26" rx="26" ry="14" fill={tint} />
    </svg>
  )
}

function SkyObjectsImpl({ scene }: LayerProps) {
  const { isDay, category, reducedMotion } = scene

  const overcast = category === "cloudy" || category === "fog" || category === "rain" || category === "storm" || category === "snow"
  const cloudTint = category === "storm" ? "#1e293b" : overcast ? "#94a3b8" : isDay ? "#f8fafc" : "#334155"
  const cloudOpacity = category === "storm" ? 0.55 : overcast ? 0.4 : isDay ? 0.35 : 0.18
  const activeClouds = overcast ? CLOUDS : CLOUDS.slice(0, 2)

  const flyingEnabled = isDay && !reducedMotion && (category === "clear" || category === "cloudy")
  const showBird = useOccasionalReveal(flyingEnabled, 15_000, 45_000, 6_000)
  const showPlane = useOccasionalReveal(flyingEnabled, 40_000, 100_000, 9_000)

  return (
    <div className="absolute inset-0">
      {!reducedMotion &&
        activeClouds.map((cloud, i) => (
          <div
            key={i}
            className="absolute bg-cloud-drift"
            style={{
              top: `${cloud.top}%`,
              left: 0,
              width: "100%",
              opacity: cloudOpacity,
              animationDuration: `${cloud.duration}s`,
              animationDelay: `${cloud.delay}s`,
              transform: `scale(${cloud.scale})`,
              transformOrigin: "left center",
            }}
          >
            <Cloud tint={cloudTint} />
          </div>
        ))}

      {reducedMotion &&
        activeClouds.map((cloud, i) => (
          <div
            key={i}
            className="absolute"
            style={{ top: `${cloud.top}%`, left: `${10 + i * 30}%`, opacity: cloudOpacity, transform: `scale(${cloud.scale})` }}
          >
            <Cloud tint={cloudTint} />
          </div>
        ))}

      {showBird && (
        <motion.svg
          width="28"
          height="14"
          viewBox="0 0 28 14"
          className="absolute"
          style={{ top: "20%" }}
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: "110vw", opacity: [0, 1, 1, 0] }}
          transition={{ duration: 6, ease: "linear" }}
        >
          <path d="M0 7 Q7 0 14 7 Q21 0 28 7" stroke="#475569" strokeWidth="1.5" fill="none" />
        </motion.svg>
      )}

      {showPlane && (
        <motion.div
          className="absolute text-slate-400 day:text-slate-500"
          style={{ top: "10%" }}
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: "110vw", opacity: [0, 0.8, 0.8, 0] }}
          transition={{ duration: 9, ease: "linear" }}
        >
          <Plane className="w-4 h-4 rotate-45" />
        </motion.div>
      )}

      {!isDay && (
        <div className="absolute inset-0">
          {FIREFLIES.map((fly, i) => (
            <span
              key={i}
              className={`absolute w-1 h-1 rounded-full bg-lime-300 ${reducedMotion ? "opacity-40" : "bg-firefly-float"}`}
              style={{
                top: `${fly.top}%`,
                left: `${fly.left}%`,
                animationDuration: reducedMotion ? undefined : `${fly.duration}s`,
                animationDelay: reducedMotion ? undefined : `${fly.delay}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export const SkyObjects = memo(SkyObjectsImpl)
