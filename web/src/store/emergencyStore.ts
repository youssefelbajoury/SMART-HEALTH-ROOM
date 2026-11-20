import { create } from "zustand"
import { useAuthStore } from "./authStore"
import { useToastStore } from "./toastStore"
import { authHeaders } from "@/lib/api"

export interface TriggeredSensor {
  sensor: string
  value: number
  threshold: number
}

export interface Emergency {
  id: string
  level: "warning" | "danger"
  status: "active" | "resolved"
  message: string
  triggeredSensors: TriggeredSensor[]
  buzzerActive: boolean
  emailSent: boolean
  createdAt: Date
  resolvedAt?: Date
}

interface EmergencyState {
  active: Emergency | null
  history: Emergency[]
  isLoading: boolean
  activate: (emergency: Emergency) => void
  resolveActive: () => void
  setHistory: (history: Emergency[]) => void
  fetchActive: () => Promise<void>
  fetchHistory: () => Promise<void>
  resolve: (id: string) => Promise<void>
  triggerTest: () => Promise<void>
}

const API_URL = "http://localhost:5000/api/v1"

interface RawEmergency {
  _id?: string
  id?: string
  level: Emergency["level"]
  status: Emergency["status"]
  message: string
  triggeredSensors?: TriggeredSensor[]
  buzzerActive?: boolean
  emailSent?: boolean
  createdAt: string
  resolvedAt?: string
}

function parseEmergency(raw: RawEmergency): Emergency {
  return {
    id: raw._id || raw.id || "",
    level: raw.level,
    status: raw.status,
    message: raw.message,
    triggeredSensors: raw.triggeredSensors || [],
    buzzerActive: !!raw.buzzerActive,
    emailSent: !!raw.emailSent,
    createdAt: new Date(raw.createdAt),
    resolvedAt: raw.resolvedAt ? new Date(raw.resolvedAt) : undefined,
  }
}

export const useEmergencyStore = create<EmergencyState>((set, get) => ({
  active: null,
  history: [],
  isLoading: false,

  activate: (emergency) =>
    set((state) => ({
      active: emergency,
      history: [emergency, ...state.history.filter((h) => h.id !== emergency.id)],
    })),

  resolveActive: () =>
    set((state) => {
      if (!state.active) return state
      const resolved: Emergency = { ...state.active, status: "resolved", resolvedAt: new Date() }
      return {
        active: null,
        history: state.history.map((h) => (h.id === resolved.id ? resolved : h)),
      }
    }),

  setHistory: (history) => set({ history }),

  fetchActive: async () => {
    const userId = useAuthStore.getState().user?.id
    if (!userId) return

    try {
      const response = await fetch(`${API_URL}/emergencies/active`, { headers: authHeaders() })
      if (!response.ok) throw new Error("Failed to load emergency status")
      const data = await response.json()
      set({ active: data.emergency ? parseEmergency(data.emergency) : null })
    } catch (error) {
      useToastStore.getState().addToast({
        type: "error",
        title: "Error",
        message: error instanceof Error ? error.message : "Unable to load emergency status.",
      })
    }
  },

  fetchHistory: async () => {
    const userId = useAuthStore.getState().user?.id
    if (!userId) return

    set({ isLoading: true })
    try {
      const response = await fetch(`${API_URL}/emergencies`, { headers: authHeaders() })
      if (!response.ok) throw new Error("Failed to load emergency history")
      const data = await response.json()
      set({ history: (data.emergencies || []).map(parseEmergency), isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      useToastStore.getState().addToast({
        type: "error",
        title: "Error",
        message: error instanceof Error ? error.message : "Unable to load emergency history.",
      })
    }
  },

  resolve: async (id) => {
    const userId = useAuthStore.getState().user?.id
    if (!userId) return

    try {
      const response = await fetch(`${API_URL}/emergencies/${id}/resolve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
      })
      if (!response.ok) throw new Error("Failed to resolve the emergency")
      get().resolveActive()
    } catch (error) {
      useToastStore.getState().addToast({
        type: "error",
        title: "Error",
        message: error instanceof Error ? error.message : "Unable to resolve the emergency.",
      })
    }
  },

  // Fait passer une lecture synthétique critique par le vrai pipeline d'évaluation
  // (EmergencyService.process côté backend) — le résultat arrive via l'événement
  // WebSocket 'emergency:activated', déjà écouté par SocketProvider.
  triggerTest: async () => {
    const response = await fetch(`${API_URL}/emergencies/test-trigger`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
    })
    if (!response.ok) throw new Error("Failed to trigger the test emergency")
  },
}))
