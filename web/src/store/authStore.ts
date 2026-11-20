import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
  firstName?: string
  dateOfBirth?: string | null
  phone?: string
  address?: string
  role: 'user' | 'admin'
  profileImage?: string | null
  deviceId?: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (fields: {
    email: string
    password: string
    name: string
    firstName: string
    dateOfBirth?: string
    phone?: string
    address?: string
  }) => Promise<void>
  logout: () => void
  updateUser: (data: Partial<User>) => void
  updateProfileImage: (base64Image: string) => Promise<void>
  removeProfileImage: () => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
}

const API_URL = 'http://localhost:5000/api/v1'

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || 'Login failed')
          }

          set({
            user: {
              id: data.user.id,
              email: data.user.email,
              name: data.user.nom,
              firstName: data.user.prenom,
              dateOfBirth: data.user.dateNaissance,
              phone: data.user.phone,
              address: data.user.address,
              role: data.user.role,
              profileImage: data.user.profileImage,
              deviceId: data.user.deviceId,
            },
            accessToken: data.tokens.accessToken,
            refreshToken: data.tokens.refreshToken,
            isAuthenticated: true,
            isLoading: false
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      register: async (fields) => {
        set({ isLoading: true })
        try {
          const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fields),
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || 'Registration failed')
          }

          set({
            user: {
              id: data.user.id,
              email: data.user.email,
              name: data.user.nom,
              firstName: data.user.prenom,
              dateOfBirth: data.user.dateNaissance,
              phone: data.user.phone,
              address: data.user.address,
              role: data.user.role,
              profileImage: data.user.profileImage,
              deviceId: data.user.deviceId,
            },
            accessToken: data.tokens.accessToken,
            refreshToken: data.tokens.refreshToken,
            isAuthenticated: true,
            isLoading: false
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
      },

      updateUser: (data) => set((state) => ({
        user: state.user ? { ...state.user, ...data } : null
      })),

      updateProfileImage: async (base64Image) => {
        const { user, accessToken } = get()
        if (!user) throw new Error('Not authenticated')

        const response = await fetch(`${API_URL}/auth/profile-image`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ imageBase64: base64Image }),
        })

        if (!response.ok) throw new Error('Failed to update image')

        const data = await response.json()
        set((state) => ({
          user: state.user ? { ...state.user, profileImage: data.profileImage } : null
        }))
      },

      removeProfileImage: async () => {
        const { user, accessToken } = get()
        if (!user) throw new Error('Not authenticated')

        const response = await fetch(`${API_URL}/auth/profile-image`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        })

        if (!response.ok) throw new Error('Failed to remove image')

        set((state) => ({
          user: state.user ? { ...state.user, profileImage: null } : null
        }))
      },

      changePassword: async (currentPassword, newPassword) => {
        const { user, accessToken } = get()
        if (!user) throw new Error('Not authenticated')

        const response = await fetch(`${API_URL}/auth/password`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ currentPassword, newPassword }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to change password')
        }
      }
    }),
    {
      name: 'auth-storage',
    }
  )
)
