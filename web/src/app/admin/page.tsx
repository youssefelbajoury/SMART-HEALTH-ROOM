"use client"

import { useState } from "react"
import { useAdminStore } from "@/store/admin-store"
import { AdminNavbar } from "@/components/admin/admin-navbar"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { StatsCards } from "@/components/admin/stats-card"
import { OrderStatsCards } from "@/components/admin/order-stats-card"
import { OrderTable } from "@/components/admin/order-table"
import { ActivityTimeline } from "@/components/admin/activity-timeline"
import { UserTable } from "@/components/admin/user-table"
import { ToastProvider } from "@/components/admin/toast-provider"
import { OrderProgressToast } from "@/components/admin/order-progress-toast"

export default function AdminPage() {
  const theme = useAdminStore((state) => state.theme)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

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

            <h2 className="text-lg font-semibold text-slate-900 admin-dark:text-white mb-4">Orders Management</h2>
            <OrderStatsCards />
            <div className="mb-8">
              <OrderTable />
            </div>

            <div className="mb-8">
              <ActivityTimeline />
            </div>

            <h2 className="text-lg font-semibold text-slate-900 admin-dark:text-white mb-4">Users Management</h2>
            <StatsCards />
            <UserTable />
          </div>
        </main>
      </div>
    </div>
  )
}
