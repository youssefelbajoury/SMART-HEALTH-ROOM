"use client"

import { motion } from "framer-motion"

interface SwitchProps {
  checked: boolean
  onChange: () => void
  disabled?: boolean
  activeColor?: string
}

export function Switch({ checked, onChange, disabled, activeColor = "#6366f1" }: SwitchProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className="relative w-12 h-7 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ backgroundColor: checked ? activeColor : "#334155" }}
    >
      <motion.span
        animate={{ x: checked ? 20 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md"
      />
    </button>
  )
}
