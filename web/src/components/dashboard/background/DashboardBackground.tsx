"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useBackgroundScene } from "@/hooks/useBackgroundScene"
import { CelestialLayer } from "./CelestialLayer"
import { SkyObjects } from "./SkyObjects"
import { WeatherEffects } from "./WeatherEffects"
import { ParticleField } from "./ParticleField"

export function DashboardBackground() {
  const scene = useBackgroundScene()
  const gradient = `linear-gradient(180deg, ${scene.colors.stops.join(", ")})`

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-90" aria-hidden="true">
      <AnimatePresence>
        <motion.div
          key={`${scene.period}-${scene.category}`}
          className="absolute inset-0"
          style={{ background: gradient, boxShadow: `inset 0 0 160px 40px ${scene.colors.glow}` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: scene.reducedMotion ? 0 : 2.5, ease: "easeInOut" }}
        />
      </AnimatePresence>

      <CelestialLayer scene={scene} />
      <SkyObjects scene={scene} />
      <WeatherEffects scene={scene} />
      <ParticleField scene={scene} />
    </div>
  )
}
