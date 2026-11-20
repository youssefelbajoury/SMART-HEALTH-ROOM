import { create } from "zustand"
import { useToastStore } from "./toastStore"
import { authHeaders } from "@/lib/api"

export type OrderStatus = "pending" | "accepted" | "processing" | "delivered" | "rejected" | "delivery-failed"

export interface OrderTimelineEntry {
  status: OrderStatus
  at: string
  note?: string
}

export interface Order {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string
  email: string
  phone?: string
  status: OrderStatus
  timeline: OrderTimelineEntry[]
  createdAt: string
  updatedAt: string
}

interface OrderState {
  myOrders: Order[]
  isLoading: boolean
  fetchMyOrders: () => Promise<void>
}

const API_URL = "http://localhost:5000/api/v1"

export const useOrderStore = create<OrderState>((set) => ({
  myOrders: [],
  isLoading: false,

  fetchMyOrders: async () => {
    set({ isLoading: true })
    try {
      const response = await fetch(`${API_URL}/orders/me`, { headers: authHeaders() })
      if (!response.ok) throw new Error("Failed to load your orders")
      const data = await response.json()
      set({ myOrders: data.orders, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      useToastStore.getState().addToast({
        type: "error",
        title: "Error",
        message: error instanceof Error ? error.message : "Unable to load your orders.",
      })
    }
  },
}))
