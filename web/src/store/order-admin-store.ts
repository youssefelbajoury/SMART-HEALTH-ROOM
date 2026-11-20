import { create } from "zustand"
import { useToastStore } from "./toastStore"
import { authHeaders } from "@/lib/api"
import type { Order, OrderStatus } from "./orderStore"

export type { Order, OrderStatus }

interface Pagination {
  total: number
  page: number
  limit: number
  pages: number
}

interface OrderStats {
  total: number
  pending: number
  accepted: number
  processing: number
  delivered: number
  rejected: number
  deliveryFailed: number
}

export type ProgressStage = "accepted" | "processing" | "delivered" | "delivery-failed"

export interface OrderProgress {
  orderId: string
  name: string
  stage: ProgressStage
  error?: string
}

interface OrderAdminState {
  orders: Order[]
  pagination: Pagination
  stats: OrderStats
  searchQuery: string
  statusFilter: "all" | OrderStatus
  sortBy: "firstName" | "lastName" | "email" | "createdAt" | "status"
  sortOrder: "asc" | "desc"
  page: number
  isLoading: boolean
  progressToasts: OrderProgress[]

  setSearchQuery: (query: string) => void
  setStatusFilter: (status: "all" | OrderStatus) => void
  setSort: (sortBy: OrderAdminState["sortBy"], sortOrder: OrderAdminState["sortOrder"]) => void
  setPage: (page: number) => void
  fetchOrders: () => Promise<void>
  fetchStats: () => Promise<void>
  acceptOrder: (id: string) => Promise<void>
  rejectOrder: (id: string) => Promise<void>
  receiveNewOrder: (order: Order) => void
  applyStatusChange: (order: Order, event: OrderStatus, error?: string) => void
  dismissProgress: (orderId: string) => void
}

const API_URL = "http://localhost:5000/api/v1"

async function parseErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json()
    return data.error || fallback
  } catch {
    return fallback
  }
}

export const useOrderAdminStore = create<OrderAdminState>((set, get) => ({
  orders: [],
  pagination: { total: 0, page: 1, limit: 20, pages: 1 },
  stats: { total: 0, pending: 0, accepted: 0, processing: 0, delivered: 0, rejected: 0, deliveryFailed: 0 },
  searchQuery: "",
  statusFilter: "all",
  sortBy: "createdAt",
  sortOrder: "desc",
  page: 1,
  isLoading: false,
  progressToasts: [],

  setSearchQuery: (query) => {
    set({ searchQuery: query, page: 1 })
    get().fetchOrders()
  },

  setStatusFilter: (status) => {
    set({ statusFilter: status, page: 1 })
    get().fetchOrders()
  },

  setSort: (sortBy, sortOrder) => {
    set({ sortBy, sortOrder })
    get().fetchOrders()
  },

  setPage: (page) => {
    set({ page })
    get().fetchOrders()
  },

  fetchOrders: async () => {
    const { searchQuery, statusFilter, sortBy, sortOrder, page } = get()
    set({ isLoading: true })
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set("search", searchQuery)
      if (statusFilter !== "all") params.set("status", statusFilter)
      params.set("sortBy", sortBy)
      params.set("sortOrder", sortOrder)
      params.set("page", String(page))

      const response = await fetch(`${API_URL}/admin/orders?${params.toString()}`, {
        headers: authHeaders(),
      })
      if (!response.ok) throw new Error(await parseErrorMessage(response, "Failed to load orders"))

      const data = await response.json()
      set({ orders: data.orders, pagination: data.pagination, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      useToastStore.getState().addToast({
        type: "error",
        title: "Error",
        message: error instanceof Error ? error.message : "Unable to load orders.",
      })
    }
  },

  fetchStats: async () => {
    try {
      const response = await fetch(`${API_URL}/admin/orders/stats`, { headers: authHeaders() })
      if (!response.ok) return
      const data = await response.json()
      set({ stats: data })
    } catch {
      // Stats are non-critical — silently keep the last known values
    }
  },

  acceptOrder: async (id) => {
    const response = await fetch(`${API_URL}/admin/orders/${id}/accept`, {
      method: "PATCH",
      headers: authHeaders(),
    })
    if (!response.ok) {
      const message = await parseErrorMessage(response, "Failed to accept order")
      useToastStore.getState().addToast({ type: "error", title: "Error", message })
      throw new Error(message)
    }
    const data = await response.json()
    const order: Order = data.order
    set((state) => ({
      progressToasts: [
        ...state.progressToasts.filter((p) => p.orderId !== order.id),
        { orderId: order.id, name: `${order.firstName} ${order.lastName}`, stage: "accepted" },
      ],
    }))
    useToastStore.getState().addToast({
      type: "success",
      title: "Order Accepted",
      message: "Now processing automatically...",
    })
    await Promise.all([get().fetchOrders(), get().fetchStats()])
  },

  rejectOrder: async (id) => {
    const response = await fetch(`${API_URL}/admin/orders/${id}/reject`, {
      method: "PATCH",
      headers: authHeaders(),
    })
    if (!response.ok) {
      const message = await parseErrorMessage(response, "Failed to reject order")
      useToastStore.getState().addToast({ type: "error", title: "Error", message })
      throw new Error(message)
    }
    useToastStore.getState().addToast({
      type: "warning",
      title: "Order Rejected",
      message: "The order has been moved to History as Rejected.",
    })
    get().dismissProgress(id)
    await Promise.all([get().fetchOrders(), get().fetchStats()])
  },

  receiveNewOrder: (order) => {
    set((state) => ({
      orders: state.orders.length > 0 ? [order, ...state.orders] : state.orders,
    }))
    get().fetchStats()
  },

  applyStatusChange: (order, event, error) => {
    set((state) => ({
      orders: state.orders.map((o) => (o.id === order.id ? order : o)),
    }))
    get().fetchStats()

    if (event === "delivery-failed") {
      set((state) => ({
        progressToasts: state.progressToasts.map((p) =>
          p.orderId === order.id ? { ...p, stage: "delivery-failed", error } : p
        ),
      }))
      return
    }

    if (event === "accepted" || event === "processing" || event === "delivered") {
      set((state) => {
        const existing = state.progressToasts.find((p) => p.orderId === order.id)
        const entry: OrderProgress = {
          orderId: order.id,
          name: `${order.firstName} ${order.lastName}`,
          stage: event,
        }
        return {
          progressToasts: existing
            ? state.progressToasts.map((p) => (p.orderId === order.id ? entry : p))
            : [...state.progressToasts, entry],
        }
      })
    }
  },

  dismissProgress: (orderId) => {
    set((state) => ({ progressToasts: state.progressToasts.filter((p) => p.orderId !== orderId) }))
  },
}))
