import { create } from "zustand"
import { playNotificationSound } from "@/lib/sound"
import { notifyBrowser } from "@/lib/notify"
import { useSettingsStore } from "@/store/settingsStore"

export interface Toast {
  id: string
  type: "success" | "warning" | "error" | "info"
  title: string
  message: string
  // Both default to true only for "error" (critical) severity — override per
  // call site for business events that need attention regardless of
  // severity (e.g. a new order arriving, which is "info" but time-sensitive).
  playSound?: boolean
  browserNotify?: boolean
}

interface ToastState {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, "id">) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const isCritical = toast.type === "error"
    const prefs = useSettingsStore.getState().notifications

    // A critical (emergency) toast is always shown in-app regardless of the
    // "toasts enabled" preference — this is a safety system, and muting the
    // preference shouldn't be able to hide an active emergency. Sound and
    // browser notifications still respect their own toggles even for
    // critical toasts (e.g. the user may want a silent-but-visible alert).
    if (!prefs.toastsEnabled && !isCritical) return

    const id = Math.random().toString(36).substr(2, 9)
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }))
    setTimeout(() => get().removeToast(id), 3000)

    if (prefs.soundEnabled && (toast.playSound ?? isCritical)) playNotificationSound()
    if (prefs.browserNotificationsEnabled && (toast.browserNotify ?? isCritical)) {
      notifyBrowser(toast.title, { body: toast.message, tag: `smart-room-${toast.type}` })
    }
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
  },
}))
