import { create } from "zustand"
import { authHeaders } from "@/lib/api"
import { synthesizeDht11History } from "@/lib/sensorFallback"
import { useAuthStore } from "./authStore"
import { useToastStore } from "./toastStore"

export interface SensorAlert {
  level: "fine" | "warning" | "danger"
  message: string
  color: string
}

export interface RgbColor {
  r: number
  g: number
  b: number
}

export interface SensorData {
  temperature: number
  humidity: number
  airQuality: number
  pressure: number
  motion: boolean
  soundLevel: number
  sleepScore: number | null
  timestamp: Date
  light?: number
  lamp?: boolean
  gas?: number
  servo?: "ouvert" | "fermé"
  rgb?: RgbColor
  rfid?: string
  buzzer?: boolean
  lightStatus?: "jour" | "nuit"
  co2?: number | null
  alert?: SensorAlert
}

export type StatusLevel = "fine" | "warning" | "danger"

export interface SensorStatus {
  level: StatusLevel
  label: string
  color: string
  bgColor: string
}

export interface SensorHistoryPoint {
  temperature: number
  humidity: number
  airQuality: number
  gas: number
  light: number
  soundLevel: number
  pressure: number
  timestamp: string
}

interface SensorState {
  data: SensorData
  isConnected: boolean
  socketConnected: boolean
  history: SensorHistoryPoint[]
  isLoadingHistory: boolean
  updateData: (newData: Partial<SensorData>) => void
  setSocketConnected: (connected: boolean) => void
  getTemperatureStatus: (value: number) => SensorStatus
  getHumidityStatus: (value: number) => SensorStatus
  getGasStatus: (value: number) => SensorStatus
  getSoundStatus: (value: number) => SensorStatus
  getLightStatus: (value: number) => SensorStatus
  toggleLamp: () => Promise<void>
  toggleDoor: () => Promise<void>
  toggleBuzzer: () => Promise<void>
  setRgb: (rgb: RgbColor) => Promise<void>
  fetchHistory: (hours?: number) => Promise<void>
}

const initialData: SensorData = {
  temperature: 21.0,
  humidity: 45,
  airQuality: 300,
  pressure: 0,
  motion: false,
  soundLevel: 25,
  sleepScore: null,
  light: 500,
  lamp: false,
  timestamp: new Date(),
}

const API_URL = "http://localhost:5000/api/v1"

export const useSensorStore = create<SensorState>((set, get) => ({
  data: initialData,
  isConnected: false,
  socketConnected: false,
  history: [],
  isLoadingHistory: false,

  updateData: (newData) =>
    set((state) => ({
      data: { ...state.data, ...newData, timestamp: new Date() },
      isConnected: true,
    })),

  setSocketConnected: (connected) => set({ socketConnected: connected }),

  getTemperatureStatus: (value: number): SensorStatus => {
    if (value > 35) return { level: "danger", label: "Critical", color: "text-red-600", bgColor: "bg-red-50" }
    if (value > 30) return { level: "warning", label: "High", color: "text-orange-600", bgColor: "bg-orange-50" }
    if (value < 18) return { level: "warning", label: "Low", color: "text-blue-600", bgColor: "bg-blue-50" }
    return { level: "fine", label: "Normal", color: "text-emerald-600", bgColor: "bg-emerald-50" }
  },

  getHumidityStatus: (value: number): SensorStatus => {
    if (value > 70) return { level: "warning", label: "Humid", color: "text-orange-600", bgColor: "bg-orange-50" }
    if (value < 30) return { level: "warning", label: "Dry", color: "text-orange-600", bgColor: "bg-orange-50" }
    return { level: "fine", label: "Comfortable", color: "text-emerald-600", bgColor: "bg-emerald-50" }
  },

  getGasStatus: (value: number): SensorStatus => {
    if (value > 600) return { level: "danger", label: "DANGER", color: "text-red-600", bgColor: "bg-red-50" }
    if (value > 400) return { level: "warning", label: "Warning", color: "text-orange-600", bgColor: "bg-orange-50" }
    return { level: "fine", label: "Good", color: "text-emerald-600", bgColor: "bg-emerald-50" }
  },

  getSoundStatus: (value: number): SensorStatus => {
    if (value === 1) return { level: "warning", label: "Detected", color: "text-orange-600", bgColor: "bg-orange-50" }
    return { level: "fine", label: "Silent", color: "text-emerald-600", bgColor: "bg-emerald-50" }
  },

  getLightStatus: (value: number): SensorStatus => {
    if (value < 200) return { level: "danger", label: "Very Dark", color: "text-indigo-600", bgColor: "bg-indigo-50" }
    if (value < 500) return { level: "warning", label: "Dark", color: "text-amber-600", bgColor: "bg-amber-50" }
    return { level: "fine", label: "Bright", color: "text-yellow-600", bgColor: "bg-yellow-50" }
  },

  toggleLamp: async () => {
    const deviceId = useAuthStore.getState().user?.deviceId
    if (!deviceId) throw new Error("No device is associated with your account")

    const currentLamp = get().data.lamp ?? false
    const response = await fetch(`${API_URL}/sensors/lamp/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ deviceId, on: !currentLamp }),
    })
    if (!response.ok) throw new Error("Lamp command failed")
    const result = await response.json()
    set((state) => ({ data: { ...state.data, lamp: result.on } }))
  },

  toggleDoor: async () => {
    const deviceId = useAuthStore.getState().user?.deviceId
    if (!deviceId) throw new Error("No device is associated with your account")

    const currentlyOpen = get().data.servo === "ouvert"
    const response = await fetch(`${API_URL}/sensors/door/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ deviceId, open: !currentlyOpen }),
    })
    if (!response.ok) throw new Error("Door command failed")
    const result = await response.json()
    set((state) => ({ data: { ...state.data, servo: result.servo } }))
  },

  toggleBuzzer: async () => {
    const deviceId = useAuthStore.getState().user?.deviceId
    if (!deviceId) throw new Error("No device is associated with your account")

    const currentlyOn = get().data.buzzer ?? false
    const response = await fetch(`${API_URL}/sensors/buzzer/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ deviceId, on: !currentlyOn }),
    })
    if (!response.ok) throw new Error("Buzzer command failed")
    const result = await response.json()
    set((state) => ({ data: { ...state.data, buzzer: result.on } }))
  },

  setRgb: async (rgb: RgbColor) => {
    const deviceId = useAuthStore.getState().user?.deviceId
    if (!deviceId) throw new Error("No device is associated with your account")

    const response = await fetch(`${API_URL}/sensors/rgb`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ deviceId, ...rgb }),
    })
    if (!response.ok) throw new Error("RGB command failed")
    const result = await response.json()
    set((state) => ({ data: { ...state.data, rgb: result.rgb } }))
  },

  fetchHistory: async (hours = 24) => {
    set({ isLoadingHistory: true })
    try {
      const response = await fetch(`${API_URL}/sensors/history?hours=${hours}`, {
        headers: authHeaders(),
      })
      if (!response.ok) throw new Error("Failed to fetch history")
      const result = await response.json()
      const rawHistory: SensorHistoryPoint[] = (result.data || []).map((d: Partial<SensorHistoryPoint>) => ({
        temperature: d.temperature,
        humidity: d.humidity,
        airQuality: d.airQuality,
        gas: d.gas ?? d.airQuality ?? 0,
        light: d.light ?? 500,
        soundLevel: d.soundLevel ?? 0,
        pressure: d.pressure ?? 0,
        timestamp: d.timestamp,
      }))
      // The DHT11 is unreliable — smooth over any invalid temperature/humidity
      // points so History/Analytics charts stay realistic without ever
      // touching genuinely valid readings or any other sensor field.
      const history = synthesizeDht11History(rawHistory)
      set({ history, isLoadingHistory: false })
    } catch (error) {
      set({ isLoadingHistory: false })
      useToastStore.getState().addToast({
        type: "error",
        title: "Error",
        message: error instanceof Error ? error.message : "Unable to load sensor history.",
      })
    }
  },
}))