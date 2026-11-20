"use client"

import { motion } from "framer-motion"
import { staggerContainer, fadeUp } from "@/lib/motion"

const SUGGESTED_QUESTIONS = [
  "How is my room?",
  "Why is my health score low?",
  "Why is room quality decreasing?",
  "What should I do now?",
  "How can I improve my room?",
  "Why is gas dangerous?",
  "Explain humidity",
  "Explain every sensor",
]

export function SuggestedQuestions({ onPick, disabled }: { onPick: (question: string) => void; disabled?: boolean }) {
  return (
    <motion.div
      variants={staggerContainer(0.04)}
      initial="hidden"
      animate="visible"
      className="flex flex-wrap gap-2"
    >
      {SUGGESTED_QUESTIONS.map((q) => (
        <motion.button
          key={q}
          variants={fadeUp}
          disabled={disabled}
          onClick={() => onPick(q)}
          className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white day:bg-slate-100 day:text-slate-600 day:hover:bg-slate-200 day:hover:text-slate-900 transition-colors disabled:opacity-50"
        >
          {q}
        </motion.button>
      ))}
    </motion.div>
  )
}
