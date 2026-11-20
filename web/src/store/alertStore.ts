import { create } from 'zustand'
import { useAuthStore } from './authStore'
import { useToastStore } from './toastStore'
import { authHeaders } from '@/lib/api'

export interface Alert {
  id: string
  type: 'danger' | 'warning' | 'info'
  message: string
  sensor: string
  value: number
  timestamp: Date
  read: boolean
}

interface AlertState {
  alerts: Alert[]
  unreadCount: number
  isLoading: boolean
  addAlert: (alert: Alert) => void
  setAlerts: (alerts: Alert[]) => void
  setUnreadCount: (count: number) => void
  markAsRead: (alertId: string) => void
  markAllAsRead: () => void
  deleteAlert: (alertId: string) => Promise<void>
  fetchAlerts: () => Promise<void>
  fetchUnreadCount: () => Promise<void>
  // Applied from the server's realtime broadcast (another tab/device changed
  // this account's alerts) — local-only, never re-issues the REST call that
  // triggered the broadcast in the first place.
  applyAlertReadFromServer: (alertId: string, unreadCount: number) => void
  applyAllAlertsReadFromServer: (unreadCount: number) => void
  applyAlertDeletedFromServer: (alertId: string, unreadCount: number) => void
}

const API_URL = 'http://localhost:5000/api/v1'

export const useAlertStore = create<AlertState>((set, get) => ({
  alerts: [],
  unreadCount: 0,
  isLoading: false,

  addAlert: (alert) => set((state) => ({
    alerts: [alert, ...state.alerts].slice(0, 50),
    unreadCount: alert.read ? state.unreadCount : state.unreadCount + 1
  })),

  setAlerts: (alerts) => set({ alerts }),
  
  setUnreadCount: (count) => set({ unreadCount: count }),

  markAsRead: (alertId) => {
    const previous = get().alerts
    const previousUnread = get().unreadCount
    set((state) => ({
      alerts: state.alerts.map(a =>
        a.id === alertId ? { ...a, read: true } : a
      ),
      unreadCount: Math.max(0, state.unreadCount - 1)
    }))

    const userId = useAuthStore.getState().user?.id
    if (!userId) return

    fetch(`${API_URL}/alerts/${alertId}/read`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
    }).catch(() => set({ alerts: previous, unreadCount: previousUnread }))
  },

  markAllAsRead: () => {
    const previous = get().alerts
    const previousUnread = get().unreadCount
    set((state) => ({
      alerts: state.alerts.map(a => ({ ...a, read: true })),
      unreadCount: 0
    }))

    const userId = useAuthStore.getState().user?.id
    if (!userId) return

    fetch(`${API_URL}/alerts/read-all`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
    }).catch(() => set({ alerts: previous, unreadCount: previousUnread }))
  },

  deleteAlert: async (alertId) => {
    const previous = get().alerts
    const previousUnread = get().unreadCount
    const wasUnread = previous.find((a) => a.id === alertId)?.read === false
    set((state) => ({
      alerts: state.alerts.filter((a) => a.id !== alertId),
      unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
    }))

    try {
      const response = await fetch(`${API_URL}/alerts/${alertId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (!response.ok) throw new Error('Failed to delete alert')
    } catch (error) {
      set({ alerts: previous, unreadCount: previousUnread })
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Unable to delete this alert.',
      })
    }
  },

  fetchAlerts: async () => {
    const userId = useAuthStore.getState().user?.id
    if (!userId) return

    set({ isLoading: true })
    try {
      const response = await fetch(`${API_URL}/alerts`, { headers: authHeaders() })
      if (!response.ok) throw new Error('Failed to load alerts')
      const data = await response.json()
      set({
        alerts: data.alerts.map((a: Omit<Alert, "timestamp"> & { timestamp: string }) => ({
          ...a,
          timestamp: new Date(a.timestamp)
        })),
        isLoading: false
      })
    } catch (error) {
      set({ isLoading: false })
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Unable to load alerts.',
      })
    }
  },

  applyAlertReadFromServer: (alertId, unreadCount) => set((state) => ({
    alerts: state.alerts.map(a => a.id === alertId ? { ...a, read: true } : a),
    unreadCount,
  })),

  applyAllAlertsReadFromServer: (unreadCount) => set((state) => ({
    alerts: state.alerts.map(a => ({ ...a, read: true })),
    unreadCount,
  })),

  applyAlertDeletedFromServer: (alertId, unreadCount) => set((state) => ({
    alerts: state.alerts.filter(a => a.id !== alertId),
    unreadCount,
  })),

  fetchUnreadCount: async () => {
    const userId = useAuthStore.getState().user?.id
    if (!userId) return

    try {
      const response = await fetch(`${API_URL}/alerts/unread-count`, { headers: authHeaders() })
      if (!response.ok) throw new Error('Failed to load unread count')
      const data = await response.json()
      set({ unreadCount: data.unreadCount })
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    }
  }
}))