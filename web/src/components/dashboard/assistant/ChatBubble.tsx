"use client"

import { motion } from "framer-motion"
import { Bot, User } from "lucide-react"
import { fadeUp } from "@/lib/motion"
import { formatRelativeTime } from "@/lib/format"
import { MarkdownLite } from "./MarkdownLite"
import type { ChatMessage } from "@/store/chatStore"

export function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user"

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className={`flex items-end gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser ? "bg-indigo-600 text-white" : "bg-slate-800 text-indigo-300 day:bg-slate-100 day:text-indigo-600"
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div className={`max-w-[80%] sm:max-w-[70%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm ${
            isUser
              ? "bg-indigo-600 text-white rounded-br-sm"
              : "dash-glass rounded-bl-sm text-slate-200 day:text-slate-700"
          }`}
        >
          <MarkdownLite text={message.text} />
        </div>
        <span className="text-[11px] text-slate-500 px-1">{formatRelativeTime(message.timestamp)}</span>
      </div>
    </motion.div>
  )
}
