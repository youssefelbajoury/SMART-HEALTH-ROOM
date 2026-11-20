"use client"

import { motion } from "framer-motion"

interface AvatarProps {
  src?: string | null
  name?: string
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

const sizeClasses: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-base",
  xl: "w-20 h-20 text-2xl",
}

export function Avatar({ src, name, size = "md", className = "" }: AvatarProps) {
  const initial = name?.trim()?.charAt(0)?.toUpperCase() || "U"

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`relative rounded-full overflow-hidden flex items-center justify-center font-bold text-white bg-gradient-to-br from-sky-400 to-blue-600 shrink-0 ${sizeClasses[size]} ${className}`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name ? `${name}'s avatar` : "User avatar"} className="w-full h-full object-cover" />
      ) : (
        <span aria-hidden="true">{initial}</span>
      )}
    </motion.div>
  )
}
