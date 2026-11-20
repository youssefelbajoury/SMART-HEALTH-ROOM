import { useAuthStore } from "@/store/authStore"

export function authHeaders(): Record<string, string> {
  const token = useAuthStore.getState().accessToken
  return token ? { Authorization: `Bearer ${token}` } : {}
}
