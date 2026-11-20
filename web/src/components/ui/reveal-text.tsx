"use client"

import { motion, useReducedMotion } from "framer-motion"
import { ElementType } from "react"

interface RevealTextProps {
  text: string
  className?: string
  wordClassName?: string
  delay?: number
  as?: ElementType
}

export function RevealText({ text, className, wordClassName, delay = 0, as: Tag = "span" }: RevealTextProps) {
  const reduceMotion = useReducedMotion()
  const words = text.split(" ")

  if (reduceMotion) {
    return <Tag className={`${className ?? ""} ${wordClassName ?? ""}`}>{text}</Tag>
  }

  return (
    <Tag className={className}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block overflow-hidden align-bottom mr-[0.25em] last:mr-0">
          <motion.span
            className={`inline-block ${wordClassName ?? ""}`}
            initial={{ y: "110%" }}
            animate={{ y: "0%" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: delay + i * 0.08 }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </Tag>
  )
}
