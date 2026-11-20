"use client"

import { useAdminAuth } from "@/hooks/use-admin-auth"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin } = useAdminAuth()

  if (!isAuthenticated || !isAdmin) return null

  return children
}
