"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Sparkles, Trash2 } from "lucide-react"
import { useSmartAssistant } from "@/hooks/useSmartAssistant"
import { useChatStore } from "@/store/chatStore"
import { answerQuestion } from "@/lib/assistantIntents"
import { EmptyState } from "@/components/ui/empty-state"
import { ChatBubble } from "@/components/dashboard/assistant/ChatBubble"
import { TypingIndicator } from "@/components/dashboard/assistant/TypingIndicator"
import { SuggestedQuestions } from "@/components/dashboard/assistant/SuggestedQuestions"

export default function AssistantPage() {
  const { context, recommendations, userName } = useSmartAssistant()
  const messages = useChatStore((s) => s.messages)
  const isTyping = useChatStore((s) => s.isTyping)
  const ask = useChatStore((s) => s.ask)
  const clear = useChatStore((s) => s.clear)

  const [input, setInput] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length, isTyping])

  const handleAsk = (question: string) => {
    ask(question, (q) => answerQuestion(q, context, recommendations, userName))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    handleAsk(input)
    setInput("")
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[900px]">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-4 mb-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-950/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white day:text-slate-900">AI Health Assistant</h1>
            <p className="text-slate-400 day:text-slate-500 text-sm">Ask about your room — answers use your live sensor data only</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clear}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 day:text-slate-500 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </motion.div>

      <div className="flex-1 dash-glass p-4 sm:p-6 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {messages.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="Ask me anything about your room"
              description="Try a suggested question below, or type your own — every answer is generated from your real sensor data, never invented."
            />
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <ChatBubble key={m.id} message={m} />
              ))}
            </AnimatePresence>
          )}
          {isTyping && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        <div className="pt-4 mt-4 border-t border-slate-800 day:border-slate-200 space-y-3">
          <SuggestedQuestions onPick={handleAsk} disabled={isTyping} />
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your health score, room quality, or any sensor..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-800 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all day:bg-slate-50 day:border-slate-200 day:text-slate-700 day:placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={isTyping || !input.trim()}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white transition-colors shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
