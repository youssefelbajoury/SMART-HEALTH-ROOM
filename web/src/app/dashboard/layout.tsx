"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { MotionConfig } from "framer-motion"
import { useAuthStore } from "@/store/authStore"
import { useEmergencyStore } from "@/store/emergencyStore"
import { useToastStore } from "@/store/toastStore"
import { useBrowserNotification } from "@/hooks/useBrowserNotification"
import { useDayNightTheme } from "@/hooks/useDayNightTheme"
import { useSettingsStore } from "@/store/settingsStore"
import { ToastProvider } from "@/components/admin/toast-provider"
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar"
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar"
import { PageTransition } from "@/components/providers/PageTransition"
import { DemoSimulator } from "@/components/dashboard/DemoSimulator"
import { DemoSequencer } from "@/components/dashboard/DemoSequencer"
import { BaselineSensorSimulator } from "@/components/dashboard/BaselineSensorSimulator"
import { DemoModeBanner } from "@/components/dashboard/DemoModeBanner"
import { GuidedTour } from "@/components/ui/guided-tour"
import { EmergencyCountdown } from "@/components/dashboard/EmergencyCountdown"
import { DashboardBackground } from "@/components/dashboard/background/DashboardBackground"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const role = useAuthStore((state) => state.user?.role)
  const authUserId = useAuthStore((state) => state.user?.id)
  const { fetchActive } = useEmergencyStore()
  const activeEmergency = useEmergencyStore((state) => state.active)
  const { permission, requestPermission } = useBrowserNotification()
  const { isDay } = useDayNightTheme()
  const themeOverride = useSettingsStore((state) => state.themeOverride)
  const reduceMotion = useSettingsStore((state) => state.reduceMotion)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    } else if (role === "admin") {
      router.push("/admin")
    }
  }, [isAuthenticated, role, router])

  useEffect(() => {
    if (authUserId) fetchActive()
  }, [authUserId, fetchActive])

  useEffect(() => {
    if (permission === "default") requestPermission()
  }, [permission, requestPermission])

  // Single source of truth for the day/night toast: DashboardLayout mounts
  // once for the whole /dashboard section, so this fires exactly once per
  // real transition instead of once per component that reads useDayNightTheme.
  const previousIsDay = useRef<boolean | null>(null)
  useEffect(() => {
    if (previousIsDay.current === null) {
      previousIsDay.current = isDay
      return
    }
    if (previousIsDay.current !== isDay) {
      const auto = themeOverride === "auto"
      useToastStore.getState().addToast({
        type: "success",
        title: isDay ? "Day Mode" : "Night Mode",
        message: auto
          ? `${isDay ? "Day" : "Night"} Mode activated automatically.`
          : `${isDay ? "Day" : "Night"} Mode set manually in Settings.`,
      })
      previousIsDay.current = isDay
    }
  }, [isDay, themeOverride])

  if (!isAuthenticated || role === "admin") return null

  const ambientClass = activeEmergency
    ? "bg-gradient-to-b from-red-950/20 via-slate-950 to-slate-950 day:from-red-100/60 day:via-white day:to-white"
    : isDay
      ? "bg-gradient-to-b from-amber-950/10 via-slate-950 to-slate-950 day:from-sky-50 day:via-white day:to-white"
      : "bg-gradient-to-b from-indigo-950/10 via-slate-950 to-slate-950"

  return (
    <MotionConfig reducedMotion={reduceMotion ? "always" : "never"}>
    <div data-theme={isDay ? "day" : "night"} className={`min-h-screen flex transition-colors duration-700 ${ambientClass}`}>
      <ToastProvider />
      <DemoSimulator />
      <DemoSequencer />
      <BaselineSensorSimulator />
      <GuidedTour />
      <EmergencyCountdown />

      <DashboardSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className={`relative flex-1 flex flex-col min-w-0 transition-[margin] duration-300 ${collapsed ? "lg:ml-21" : "lg:ml-68"}`}>
        {/* Dynamic Smart Environment Background — spans the whole dashboard
            content area (sidebar/navbar excluded), not just one section. */}
        <DashboardBackground />

        <div className="relative z-10 flex flex-col flex-1 min-h-full">
          <DashboardNavbar onOpenMobileSidebar={() => setMobileOpen(true)} />
          <DemoModeBanner />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="max-w-400 mx-auto w-full">
              <PageTransition>{children}</PageTransition>
            </div>
          </main>
        </div>
      </div>
    </div>
    </MotionConfig>
  )
}
