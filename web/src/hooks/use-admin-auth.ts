import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/authStore"

export function useAdminAuth() {
  const router = useRouter()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)

  const isAdmin = user?.role === "admin"

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    } else if (!isAdmin) {
      router.push("/403")
    }
  }, [isAuthenticated, isAdmin, router])

  return { isAuthenticated, user, isAdmin }
}
