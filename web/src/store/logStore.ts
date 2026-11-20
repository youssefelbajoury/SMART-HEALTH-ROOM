import { create } from 'zustand'
import { useAuthStore } from './authStore'
import { useToastStore } from './toastStore'
import { authHeaders } from '@/lib/api'

export type LogLevel = 'info' | 'warning' | 'error' | 'success'

export interface SystemLog {
  id: string
  level: LogLevel
  source: string
  message: string
  metadata?: Record<string, unknown>
  createdAt: Date
}

interface LogPagination {
  total: number
  page: number
  limit: number
  pages: number
}

interface LogState {
  logs: SystemLog[]
  pagination: LogPagination
  isLoading: boolean
  fetchLogs: (opts?: { level?: LogLevel; search?: string; page?: number }) => Promise<void>
  prependLog: (log: SystemLog) => void
}

const API_URL = 'http://localhost:5000/api/v1'

export const useLogStore = create<LogState>((set) => ({
  logs: [],
  pagination: { total: 0, page: 1, limit: 50, pages: 0 },
  isLoading: false,

  fetchLogs: async (opts = {}) => {
    const userId = useAuthStore.getState().user?.id
    if (!userId) return

    set({ isLoading: true })
    try {
      const params = new URLSearchParams()
      if (opts.level) params.set('level', opts.level)
      if (opts.search) params.set('search', opts.search)
      params.set('page', String(opts.page || 1))
      params.set('limit', '50')

      const response = await fetch(`${API_URL}/logs?${params.toString()}`, { headers: authHeaders() })
      if (!response.ok) throw new Error('Failed to load logs')
      const data = await response.json()
      set({
        logs: (data.logs || []).map((l: Omit<SystemLog, 'createdAt'> & { createdAt: string }) => ({
          id: l.id,
          level: l.level,
          source: l.source,
          message: l.message,
          metadata: l.metadata,
          createdAt: new Date(l.createdAt),
        })),
        pagination: data.pagination || { total: 0, page: 1, limit: 50, pages: 0 },
        isLoading: false,
      })
    } catch (error) {
      set({ isLoading: false })
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Unable to load logs.',
      })
    }
  },

  // Live insertion from Socket.IO (see SocketProvider's 'new-log' listener) —
  // keeps the Logs page / Event Center / Timeline current without polling.
  prependLog: (log) => {
    set((state) => {
      if (state.logs.some((l) => l.id === log.id)) return state
      return {
        logs: [log, ...state.logs],
        pagination: { ...state.pagination, total: state.pagination.total + 1 },
      }
    })
  },
}))
