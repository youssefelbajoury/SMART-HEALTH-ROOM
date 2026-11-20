import { create } from "zustand"
import { persist } from "zustand/middleware"

export type TemperatureUnit = "C" | "F"
export type ThemeOverride = "auto" | "day" | "night"

export interface NotificationPreferences {
  toastsEnabled: boolean
  soundEnabled: boolean
  browserNotificationsEnabled: boolean
}

interface SettingsState {
  temperatureUnit: TemperatureUnit
  themeOverride: ThemeOverride
  reduceMotion: boolean
  notifications: NotificationPreferences
  setTemperatureUnit: (unit: TemperatureUnit) => void
  setThemeOverride: (mode: ThemeOverride) => void
  setReduceMotion: (value: boolean) => void
  setNotificationPreference: (key: keyof NotificationPreferences, value: boolean) => void
}

// Centralized, persisted app preferences — the single source of truth every
// consumer (useDayNightTheme, toastStore, lib/format, DashboardLayout's
// MotionConfig) reads from, so a change here propagates everywhere
// automatically without any component needing its own copy of the setting.
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      temperatureUnit: "C",
      themeOverride: "auto",
      reduceMotion: false,
      notifications: {
        toastsEnabled: true,
        soundEnabled: true,
        browserNotificationsEnabled: true,
      },

      setTemperatureUnit: (unit) => set({ temperatureUnit: unit }),
      setThemeOverride: (mode) => set({ themeOverride: mode }),
      setReduceMotion: (value) => set({ reduceMotion: value }),
      setNotificationPreference: (key, value) =>
        set((state) => ({ notifications: { ...state.notifications, [key]: value } })),
    }),
    { name: "settings-storage" }
  )
)
