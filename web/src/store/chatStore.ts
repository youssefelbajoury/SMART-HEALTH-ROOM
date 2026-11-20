import { create } from "zustand"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  text: string
  timestamp: Date
}

interface ChatState {
  messages: ChatMessage[]
  isTyping: boolean
  ask: (question: string, answer: (question: string) => string) => void
  clear: () => void
}

// Deliberately not persisted — a chat history that survives reloads with no
// "clear conversation" affordance would be an odd default for this UI; the
// underlying facts (health score, room quality, sensors) are always re-derived
// live anyway, so nothing is lost by starting fresh each session.
const TYPING_DELAY_MS = 550

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isTyping: false,

  ask: (question, answer) => {
    const trimmed = question.trim()
    if (!trimmed) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
      timestamp: new Date(),
    }
    set((state) => ({ messages: [...state.messages, userMessage], isTyping: true }))

    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: answer(trimmed),
        timestamp: new Date(),
      }
      set((state) => ({ messages: [...state.messages, assistantMessage], isTyping: false }))
    }, TYPING_DELAY_MS)
  },

  clear: () => set({ messages: [], isTyping: false }),
}))
