"use client"

import { usePathname } from "next/navigation"
import { MotionConfig } from "framer-motion"
import { Footer } from "@/components/footer"
import { ToastProvider } from "@/components/admin/toast-provider"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showFooter = pathname !== "/login"

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50/30 flex flex-col">
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          {children}
        </div>
        {showFooter && <Footer />}
      </div>
      <ToastProvider />
    </MotionConfig>
  )
}