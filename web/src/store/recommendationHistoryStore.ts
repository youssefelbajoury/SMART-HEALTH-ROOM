import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { AssistantRecommendation } from "@/lib/smartAssistant"

export interface RecommendationHistoryEntry {
  id: string
  timestamp: string
  category: string
  severity: string
  message: string
}

const MAX_ENTRIES = 10

interface RecommendationHistoryState {
  entries: RecommendationHistoryEntry[]
  record: (recommendations: AssistantRecommendation[]) => void
}

export const useRecommendationHistoryStore = create<RecommendationHistoryState>()(
  persist(
    (set, get) => ({
      entries: [],

      record: (recommendations) => {
        const existingIds = new Set(get().entries.map((e) => e.id))
        const newEntries: RecommendationHistoryEntry[] = recommendations
          .filter((r) => !existingIds.has(r.id))
          .map((r) => ({
            id: r.id,
            timestamp: new Date().toISOString(),
            category: r.category,
            severity: r.severity,
            message: r.message,
          }))

        if (newEntries.length === 0) return

        set((state) => ({ entries: [...newEntries, ...state.entries].slice(0, MAX_ENTRIES) }))
      },
    }),
    { name: "recommendation-history-storage" }
  )
)
