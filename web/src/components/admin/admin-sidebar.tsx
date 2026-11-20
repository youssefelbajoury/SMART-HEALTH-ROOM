"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/store/authStore"
import { useOrderAdminStore } from "@/store/order-admin-store"
import { Avatar } from "@/components/ui/avatar"
import {
  X,
  LayoutDashboard,
  ClipboardList,
  Users,
  History,
  Bell,
  Settings,
  LogOut,
  Circle,
  ChevronsLeft,
  ChevronsRight,
  type LucideIcon,
} from "lucide-react"
import { ThemeModal } from "./theme-modal"

type NavItem = { label: string; icon: LucideIcon; href?: string; action?: "settings" | "logout" }

const navItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
  { label: "Orders", icon: ClipboardList, href: "/admin/orders" },
  { label: "Users", icon: Users, href: "/admin#users" },
  { label: "History", icon: History, href: "/admin#activity" },
  { label: "Alerts", icon: Bell, href: "/admin/alerts" },
  { label: "Settings", icon: Settings, action: "settings" },
  { label: "Logout", icon: LogOut, action: "logout" },
]

interface AdminSidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}

export function AdminSidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }: AdminSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const pendingOrderCount = useOrderAdminStore((state) => state.stats.pending)
  const [themeModalOpen, setThemeModalOpen] = useState(false)

  const handleSignOut = () => {
    logout()
    router.push("/login")
  }

  const body = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-5 py-6 ${collapsed ? "justify-center px-0" : ""}`}>
        <Link href="/" className="flex items-center gap-3 min-w-0">
          <img
            src="/images/logo.png"
            alt="Smart Health Room logo"
            className="h-10 w-auto object-contain shrink-0"
          />
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="font-bold text-lg text-slate-900 admin-dark:text-white whitespace-nowrap overflow-hidden"
              >
                ADMIN
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = !!item.href && pathname === item.href.split("#")[0] && !item.href.includes("#")
          const badge = item.label === "Orders" && pendingOrderCount > 0 ? pendingOrderCount : undefined
          const isDanger = item.action === "logout"

          const content = (
            <>
              {isActive && (
                <motion.div
                  layoutId="admin-sidebar-active-pill"
                  className="absolute inset-0 rounded-xl bg-sky-500/15 border border-sky-500/30 admin-dark:bg-sky-500/15 admin-dark:border-sky-500/30"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <Icon className="w-5 h-5 relative shrink-0" />
              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="relative font-medium text-sm whitespace-nowrap overflow-hidden flex-1 text-left"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {badge !== undefined && (
                <span className={`relative shrink-0 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ${collapsed ? "absolute -top-1 -right-1 w-4 h-4" : "w-5 h-5"}`}>
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </>
          )

          const className = `relative flex items-center gap-3 px-3 py-3 rounded-xl transition-colors w-full ${
            collapsed ? "justify-center" : ""
          } ${
            isDanger
              ? "text-red-500 hover:bg-red-50 admin-dark:hover:bg-red-500/10"
              : isActive
                ? "text-sky-600 admin-dark:text-sky-300"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 admin-dark:text-slate-400 admin-dark:hover:text-white admin-dark:hover:bg-white/5"
          }`

          if (item.action === "settings") {
            return (
              <button key={item.label} title={collapsed ? item.label : undefined} aria-label={item.label} onClick={() => setThemeModalOpen(true)} className={className}>
                {content}
              </button>
            )
          }
          if (item.action === "logout") {
            return (
              <button key={item.label} title={collapsed ? item.label : undefined} aria-label={item.label} onClick={handleSignOut} className={className}>
                {content}
              </button>
            )
          }
          return (
            <Link key={item.label} href={item.href!} title={collapsed ? item.label : undefined} aria-label={item.label} onClick={onCloseMobile} className={className}>
              {content}
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle (desktop only) */}
      <button
        onClick={onToggleCollapse}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="hidden lg:flex items-center gap-2 mx-3 mb-2 px-3 py-2.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 admin-dark:text-slate-500 admin-dark:hover:text-white admin-dark:hover:bg-white/5 transition-colors justify-center"
      >
        {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
      </button>

      {/* Profile footer */}
      <div className={`mx-3 mb-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 admin-dark:bg-white/5 admin-dark:border-white/10 ${collapsed ? "flex flex-col items-center gap-2" : "flex items-center gap-3"}`}>
        <div className="relative shrink-0">
          <Avatar src={user?.profileImage} name={user?.name} size="sm" />
          <Circle
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 text-emerald-400 fill-emerald-400 ring-2 ring-slate-50 admin-dark:ring-slate-900 rounded-full"
            role="img"
            aria-label="Online"
          />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 admin-dark:text-white truncate">{user?.name || "Admin"}</p>
            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-sky-100 text-sky-700 admin-dark:bg-sky-500/20 admin-dark:text-sky-300">
              Administrator
            </span>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseMobile}
            className="fixed inset-0 z-90 bg-slate-900/20 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 84 : 272 }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        className="hidden lg:flex flex-col bg-white/95 backdrop-blur-xl border-r border-slate-100 admin-dark:bg-slate-900/95 admin-dark:border-white/10 shadow-sm fixed top-0 left-0 h-full z-30 transition-colors duration-300"
      >
        {body}
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="lg:hidden fixed top-0 left-0 h-full w-72 bg-white admin-dark:bg-slate-900 border-r border-slate-100 admin-dark:border-white/10 z-95"
          >
            <div className="flex items-center justify-end px-4 pt-4">
              <button onClick={onCloseMobile} className="p-2 hover:bg-slate-100 admin-dark:hover:bg-white/10 rounded-lg">
                <X className="w-5 h-5 text-slate-500 admin-dark:text-slate-300" />
              </button>
            </div>
            {body}
          </motion.aside>
        )}
      </AnimatePresence>

      <ThemeModal isOpen={themeModalOpen} onClose={() => setThemeModalOpen(false)} />
    </>
  )
}
