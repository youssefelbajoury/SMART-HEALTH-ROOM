import { create } from "zustand"
import { useToastStore } from "./toastStore"
import { authHeaders } from "@/lib/api"

export interface User {
  id: string
  name: string
  firstName?: string
  email: string
  role: "user" | "admin"
  avatar?: string
  isActive: boolean
  createdAt: string
  lastLogin?: string
  dateOfBirth?: string
  phone?: string
  address?: string
  deviceId?: string
}

interface Pagination {
  total: number
  page: number
  limit: number
  pages: number
}

interface UserStats {
  total: number
  admins: number
  active: number
  suspended: number
}

interface AdminState {
  users: User[]
  pagination: Pagination
  stats: UserStats
  searchQuery: string
  roleFilter: "all" | "user" | "admin"
  statusFilter: "all" | "active" | "suspended"
  sortBy: "nom" | "email" | "createdAt" | "lastLogin"
  sortOrder: "asc" | "desc"
  page: number
  selectedUser: User | null
  isSidebarOpen: boolean
  theme: "light" | "dark"
  isLoading: boolean

  // Actions
  setSearchQuery: (query: string) => void
  setRoleFilter: (role: "all" | "user" | "admin") => void
  setStatusFilter: (status: "all" | "active" | "suspended") => void
  setSort: (sortBy: AdminState["sortBy"], sortOrder: AdminState["sortOrder"]) => void
  setPage: (page: number) => void
  setSelectedUser: (user: User | null) => void
  toggleSidebar: () => void
  setTheme: (theme: "light" | "dark") => void
  fetchUsers: () => Promise<void>
  fetchStats: () => Promise<void>
  addUser: (user: {
    name: string
    email: string
    password: string
    role: "user" | "admin"
    firstName?: string
    dateOfBirth?: string
    phone?: string
    address?: string
    deviceId?: string
    profileImage?: string
  }) => Promise<void>
  updateUser: (
    id: string,
    data: {
      name?: string
      email?: string
      role?: "user" | "admin"
      firstName?: string
      dateOfBirth?: string
      phone?: string
      address?: string
      deviceId?: string
      profileImage?: string
    }
  ) => Promise<void>
  deleteUser: (id: string) => Promise<void>
  suspendUser: (id: string, suspended: boolean) => Promise<void>
  resetPassword: (id: string, newPassword: string) => Promise<void>
}

const API_URL = "http://localhost:5000/api/v1"

interface RawUser {
  id: string
  nom: string
  prenom?: string
  email: string
  role: "user" | "admin"
  profileImage?: string | null
  isActive: boolean
  createdAt: string
  lastLogin?: string
  dateNaissance?: string
  phone?: string
  address?: string
  deviceId?: string
}

function mapUser(raw: RawUser): User {
  return {
    id: raw.id,
    name: raw.nom,
    firstName: raw.prenom,
    email: raw.email,
    role: raw.role,
    avatar: raw.profileImage || undefined,
    isActive: raw.isActive,
    createdAt: raw.createdAt,
    lastLogin: raw.lastLogin,
    dateOfBirth: raw.dateNaissance,
    phone: raw.phone,
    address: raw.address,
    deviceId: raw.deviceId,
  }
}

async function parseErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json()
    return data.error || fallback
  } catch {
    return fallback
  }
}

export const useAdminStore = create<AdminState>((set, get) => ({
  users: [],
  pagination: { total: 0, page: 1, limit: 20, pages: 1 },
  stats: { total: 0, admins: 0, active: 0, suspended: 0 },
  searchQuery: "",
  roleFilter: "all",
  statusFilter: "all",
  sortBy: "createdAt",
  sortOrder: "desc",
  page: 1,
  selectedUser: null,
  isSidebarOpen: false,
  theme: "light",
  isLoading: false,

  setSearchQuery: (query) => {
    set({ searchQuery: query, page: 1 })
    get().fetchUsers()
  },

  setRoleFilter: (role) => {
    set({ roleFilter: role, page: 1 })
    get().fetchUsers()
  },

  setStatusFilter: (status) => {
    set({ statusFilter: status, page: 1 })
    get().fetchUsers()
  },

  setSort: (sortBy, sortOrder) => {
    set({ sortBy, sortOrder })
    get().fetchUsers()
  },

  setPage: (page) => {
    set({ page })
    get().fetchUsers()
  },

  setSelectedUser: (user) => set({ selectedUser: user }),

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  setTheme: (theme) => set({ theme }),

  fetchUsers: async () => {
    const { searchQuery, roleFilter, statusFilter, sortBy, sortOrder, page } = get()
    set({ isLoading: true })
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set("search", searchQuery)
      if (roleFilter !== "all") params.set("role", roleFilter)
      if (statusFilter !== "all") params.set("status", statusFilter)
      params.set("sortBy", sortBy)
      params.set("sortOrder", sortOrder)
      params.set("page", String(page))

      const response = await fetch(`${API_URL}/admin/users?${params.toString()}`, {
        headers: authHeaders(),
      })
      if (!response.ok) throw new Error(await parseErrorMessage(response, "Failed to load users"))

      const data = await response.json()
      set({
        users: data.users.map(mapUser),
        pagination: data.pagination,
        isLoading: false,
      })
    } catch (error) {
      set({ isLoading: false })
      useToastStore.getState().addToast({
        type: "error",
        title: "Error",
        message: error instanceof Error ? error.message : "Unable to load users.",
      })
    }
  },

  fetchStats: async () => {
    try {
      const response = await fetch(`${API_URL}/admin/stats`, { headers: authHeaders() })
      if (!response.ok) return
      const data = await response.json()
      set({ stats: data })
    } catch {
      // Stats are non-critical — silently keep the last known values
    }
  },

  addUser: async (userData) => {
    const response = await fetch(`${API_URL}/admin/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(userData),
    })
    if (!response.ok) {
      const message = await parseErrorMessage(response, "Failed to create user")
      useToastStore.getState().addToast({ type: "error", title: "Error", message })
      throw new Error(message)
    }
    const data = await response.json()
    useToastStore.getState().addToast({
      type: "success",
      title: "User Added",
      message: `${data.user.nom} was created successfully.`,
    })
    await Promise.all([get().fetchUsers(), get().fetchStats()])
  },

  updateUser: async (id, data) => {
    const response = await fetch(`${API_URL}/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const message = await parseErrorMessage(response, "Failed to update user")
      useToastStore.getState().addToast({ type: "error", title: "Error", message })
      throw new Error(message)
    }
    useToastStore.getState().addToast({
      type: "success",
      title: "User Updated",
      message: "The information has been updated.",
    })
    await get().fetchUsers()
  },

  deleteUser: async (id) => {
    const response = await fetch(`${API_URL}/admin/users/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    })
    if (!response.ok) {
      const message = await parseErrorMessage(response, "Failed to delete user")
      useToastStore.getState().addToast({ type: "error", title: "Error", message })
      throw new Error(message)
    }
    useToastStore.getState().addToast({
      type: "error",
      title: "User Deleted",
      message: "The user has been permanently deleted.",
    })
    await Promise.all([get().fetchUsers(), get().fetchStats()])
  },

  suspendUser: async (id, suspended) => {
    const response = await fetch(`${API_URL}/admin/users/${id}/suspend`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ suspended }),
    })
    if (!response.ok) {
      const message = await parseErrorMessage(response, "Failed to update status")
      useToastStore.getState().addToast({ type: "error", title: "Error", message })
      throw new Error(message)
    }
    useToastStore.getState().addToast({
      type: suspended ? "warning" : "success",
      title: suspended ? "User Suspended" : "User Reactivated",
      message: suspended ? "This user's access has been suspended." : "This user's access has been restored.",
    })
    await Promise.all([get().fetchUsers(), get().fetchStats()])
  },

  resetPassword: async (id, newPassword) => {
    const response = await fetch(`${API_URL}/admin/users/${id}/reset-password`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ newPassword }),
    })
    if (!response.ok) {
      const message = await parseErrorMessage(response, "Failed to reset password")
      useToastStore.getState().addToast({ type: "error", title: "Error", message })
      throw new Error(message)
    }
    useToastStore.getState().addToast({
      type: "success",
      title: "Password Reset",
      message: "The new password is now active.",
    })
  },
}))
