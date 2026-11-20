"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/authStore"

function hasAuthHeader(init?: RequestInit): boolean {
  const headers = init?.headers
  if (!headers) return false
  if (headers instanceof Headers) return headers.has("Authorization")
  if (Array.isArray(headers)) return headers.some(([key]) => key.toLowerCase() === "authorization")
  return Object.keys(headers).some((key) => key.toLowerCase() === "authorization")
}

export function SessionGuard() {
  const router = useRouter()

  useEffect(() => {
    const originalFetch = window.fetch

    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const response = await originalFetch(...args)
      const [, init] = args

      if (response.status === 401 && hasAuthHeader(init) && useAuthStore.getState().isAuthenticated) {
        useAuthStore.getState().logout()
        router.push("/login?expired=1")
      }

      return response
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [router])

  return null
}
