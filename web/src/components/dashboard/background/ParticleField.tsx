"use client"

import { memo } from "react"
import type { BackgroundScene } from "@/hooks/useBackgroundScene"

interface LayerProps {
  scene: BackgroundScene
}

const PARTICLE_COUNT = 6
const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  const a = ((i * 6151 + 3571) % 100000) / 100000
  const b = ((i * 2699 + 811) % 100000) / 100000
  return { top: 15 + a * 70, left: 5 + b * 90, duration: 7 + (i % 5), delay: i * 1.1 }
})

function ParticleFieldImpl({ scene }: LayerProps) {
  if (scene.reducedMotion) return null

  const tint = scene.isDay ? "bg-sky-200/50" : "bg-indigo-200/40"

  return (
    <div className="absolute inset-0">
      {PARTICLES.map((particle, i) => (
        <span
          key={i}
          className={`absolute w-1 h-1 rounded-full bg-particle-drift ${tint}`}
          style={{ top: `${particle.top}%`, left: `${particle.left}%`, animationDuration: `${particle.duration}s`, animationDelay: `${particle.delay}s` }}
        />
      ))}
    </div>
  )
}

export const ParticleField = memo(ParticleFieldImpl)
