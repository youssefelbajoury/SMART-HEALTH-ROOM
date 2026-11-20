"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useAdminStore } from "@/store/admin-store"
import { useToastStore } from "@/store/toastStore"
import { authHeaders } from "@/lib/api"
import { AdminNavbar } from "@/components/admin/admin-navbar"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { ToastProvider } from "@/components/admin/toast-provider"
import { OrderProgressToast } from "@/components/admin/order-progress-toast"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { Siren, ShieldCheck, Clock, Volume2, Mail, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react"

const API_URL = "http://localhost:5000/api/v1"

interface AdminEmergency {
  _id: string
  userId?: { nom?: string; email?: string } | string
  message: string
  level: "warning" | "danger"
  status: "active" | "resolved"
  buzzerActive: boolean
  emailSent: boolean
  createdAt: string
}

interface Pagination {
  total: number
  page: number
  limit: number
  pages: number
}

export default function AdminAlertsPage() {
  const theme = useAdminStore((state) => state.theme)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [emergencies, setEmergencies] = useState<AdminEmergency[]>([])
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, pages: 1 })
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadEmergencies() {
      setIsLoading(true)
      setError(false)
      try {
        const r = await fetch(`${API_URL}/admin/emergencies?page=${page}`, { headers: authHeaders() })
        if (!r.ok) throw new Error("Failed to load alerts")
        const data = await r.json()
        if (cancelled) return
        setEmergencies(data.emergencies || [])
        setPagination(data.pagination || { total: 0, page: 1, limit: 20, pages: 1 })
      } catch {
        if (cancelled) return
        setError(true)
        useToastStore.getState().addToast({ type: "error", title: "Error", message: "Unable to load alerts." })
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadEmergencies()
    return () => {
      cancelled = true
    }
  }, [page, retryToken])

  return (
    <div
      data-admin-theme={theme === "dark" ? "dark" : undefined}
      className="min-h-screen bg-slate-50 admin-dark:bg-slate-950 transition-colors duration-300"
    >
      <ToastProvider />
      <OrderProgressToast />

      <AdminSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className={`transition-[margin] duration-300 ${collapsed ? "lg:ml-21" : "lg:ml-68"}`}>
        <AdminNavbar onOpenMobileSidebar={() => setMobileOpen(true)} />

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <AdminHeader />
            <h1 className="text-2xl font-bold text-slate-900 admin-dark:text-white mb-6">Alerts</h1>

            <div className="admin-glass rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4">
                {isLoading && emergencies.length === 0 ? (
                  <div className="space-y-3">
                    {[0, 1, 2].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : error && emergencies.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-16 px-6">
                    <div className="w-14 h-14 rounded-2xl bg-red-50 admin-dark:bg-red-500/10 border border-red-200 admin-dark:border-red-500/20 flex items-center justify-center mb-4">
                      <span className="text-red-500 text-2xl">!</span>
                    </div>
                    <p className="text-slate-700 admin-dark:text-slate-200 font-medium">Couldn&apos;t load alerts</p>
                    <p className="text-slate-500 admin-dark:text-slate-400 text-sm mt-1 max-w-sm">Something went wrong while fetching alerts.</p>
                    <button
                      onClick={() => setRetryToken((t) => t + 1)}
                      className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 admin-dark:bg-white/10 hover:bg-slate-200 admin-dark:hover:bg-white/20 text-slate-700 admin-dark:text-slate-200 text-sm font-medium transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Retry
                    </button>
                  </div>
                ) : emergencies.length === 0 ? (
                  <EmptyState icon={ShieldCheck} title="No alerts" description="Emergency alerts across every account will appear here." />
                ) : (
                  <div className="space-y-3">
                    {emergencies.map((e, index) => {
                      const userLabel = typeof e.userId === "object" ? e.userId?.nom || e.userId?.email : undefined
                      return (
                        <motion.div
                          key={e._id}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.04 }}
                          className={`p-4 rounded-xl border ${
                            e.status === "active"
                              ? "border-red-200 bg-red-50 admin-dark:border-red-500/30 admin-dark:bg-red-500/10"
                              : "border-slate-100 bg-slate-50 admin-dark:border-white/10 admin-dark:bg-white/5"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <Siren className={`w-5 h-5 shrink-0 mt-0.5 ${e.status === "active" ? "text-red-500" : "text-slate-400"}`} />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-900 admin-dark:text-white">{e.message}</p>
                                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500 admin-dark:text-slate-400">
                                  {userLabel && <span>{userLabel}</span>}
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(e.createdAt).toLocaleString()}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Volume2 className="w-3 h-3" />
                                    Buzzer {e.buzzerActive ? "active" : "inactive"}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    Email {e.emailSent ? "sent" : "not sent"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <span
                              className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${
                                e.status === "active"
                                  ? "bg-red-100 text-red-600 admin-dark:bg-red-500/20 admin-dark:text-red-300"
                                  : "bg-emerald-100 text-emerald-600 admin-dark:bg-emerald-500/20 admin-dark:text-emerald-300"
                              }`}
                            >
                              {e.status === "active" ? "Active" : "Resolved"}
                            </span>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>

              {pagination.pages > 1 && (
                <div className="px-4 py-4 border-t border-slate-100 admin-dark:border-white/10 flex items-center justify-between">
                  <p className="text-sm text-slate-500 admin-dark:text-slate-400">
                    Page {pagination.page} of {pagination.pages} ({pagination.total} alerts)
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={pagination.page <= 1}
                      aria-label="Previous page"
                      className="p-2 rounded-lg border border-slate-200 admin-dark:border-white/10 text-slate-500 admin-dark:text-slate-400 disabled:opacity-40 hover:bg-slate-50 admin-dark:hover:bg-white/10"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                      disabled={pagination.page >= pagination.pages}
                      aria-label="Next page"
                      className="p-2 rounded-lg border border-slate-200 admin-dark:border-white/10 text-slate-500 admin-dark:text-slate-400 disabled:opacity-40 hover:bg-slate-50 admin-dark:hover:bg-white/10"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
