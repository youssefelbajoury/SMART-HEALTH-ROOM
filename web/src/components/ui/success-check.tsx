"use client"

import { motion } from "framer-motion"

interface SuccessCheckProps {
  size?: number
  label?: string
}

export function SuccessCheck({ size = 56, label }: SuccessCheckProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none">
          <motion.path
            d="M4 12.5l5 5L20 6.5"
            stroke="#10b981"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.45, delay: 0.15, ease: "easeOut" }}
          />
        </svg>
      </motion.div>
      {label && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="text-sm font-medium text-emerald-400"
        >
          {label}
        </motion.p>
      )}
    </div>
  )
}
