"use client"

import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuthStore } from "@/store/authStore"
import { Avatar } from "@/components/ui/avatar"
import {
  Activity,
  Bell,
  Settings,
  LogOut,
  Siren,
  Map,
  Gamepad2,
  History,
  PieChart,
  BarChart3,
  ChevronsLeft,
  ChevronsRight,
  Circle,
  ClipboardList,
  MessageCircle,
} from "lucide-react"

const dashboardNav = [
  { href: "/dashboard", label: "Dashboard", icon: Activity },
  { href: "/dashboard/assistant", label: "AI Assistant", icon: MessageCircle },
  { href: "/dashboard/emergency", label: "Emergencies", icon: Siren },
  { href: "/dashboard/alerts", label: "Alerts", icon: Bell },
  { href: "/dashboard/history", label: "History", icon: History },
  { href: "/dashboard/room-map", label: "Room Map", icon: Map },
  { href: "/dashboard/occupancy", label: "Occupancy", icon: PieChart },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/remote-control", label: "Remote Control", icon: Gamepad2 },
  { href: "/dashboard/orders", label: "My Order", icon: ClipboardList },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

interface DashboardSidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}

export function DashboardSidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  const handleLogout = () => {
    logout()
    router.push("/")
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
                className="font-bold text-lg text-white day:text-slate-900 whitespace-nowrap overflow-hidden"
              >
                SmartRoom
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto overflow-x-hidden">
        {dashboardNav.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              title={collapsed ? item.label : undefined}
              aria-label={item.label}
              className={`relative flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                collapsed ? "justify-center" : ""
              } ${isActive ? "text-indigo-300 day:text-indigo-600" : "text-slate-400 hover:text-slate-200 day:text-slate-500 day:hover:text-slate-800"}`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-pill"
                  className="absolute inset-0 rounded-xl bg-indigo-500/15 border border-indigo-500/30 day:bg-indigo-50 day:border-indigo-200"
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
                    className="relative font-medium text-sm whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle (desktop only) */}
      <button
        onClick={onToggleCollapse}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="hidden lg:flex items-center gap-2 mx-3 mb-2 px-3 py-2.5 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 day:hover:text-slate-800 day:hover:bg-slate-100 transition-colors justify-center"
      >
        {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
      </button>

      {/* User + logout */}
      <div className={`mx-3 mb-3 p-3 rounded-2xl bg-slate-800/40 border border-slate-800 day:bg-slate-50 day:border-slate-200 ${collapsed ? "flex flex-col items-center gap-2" : ""}`}>
        <div className={`flex items-center gap-3 ${collapsed ? "" : "mb-3"}`}>
          <div className="relative shrink-0">
            <Avatar src={user?.profileImage} name={user?.name} size="sm" />
            <Circle
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 text-emerald-400 fill-emerald-400 ring-2 ring-slate-900 day:ring-white rounded-full"
              role="img"
              aria-label="Online"
            />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-medium text-white day:text-slate-900 truncate">{user?.name || "User"}</p>
              <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${
                user?.role === "admin" ? "bg-violet-500/20 text-violet-300 day:bg-violet-100 day:text-violet-600" : "bg-slate-700 text-slate-300 day:bg-slate-200 day:text-slate-600"
              }`}>
                {user?.role === "admin" ? "Admin" : "User"}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          title={collapsed ? "Log Out" : undefined}
          aria-label="Log Out"
          className={`flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 day:text-slate-500 transition-colors w-full ${collapsed ? "justify-center" : "px-1"}`}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Log Out</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 84 : 272 }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        className="hidden lg:flex flex-col bg-slate-900/90 backdrop-blur-xl border-r border-slate-800/80 day:bg-white/95 day:border-slate-100 day:shadow-sm fixed top-0 left-0 h-full z-30 transition-colors duration-500"
      >
        {body}
      </motion.aside>

      {/* Mobile overlay + drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="lg:hidden fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="lg:hidden fixed top-0 left-0 h-full w-72 bg-slate-900 border-r border-slate-800 day:bg-white day:border-slate-100 z-50"
            >
              {body}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
