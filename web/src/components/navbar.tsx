"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Home, Package, LayoutDashboard, LogIn, Menu, X, ChevronRight, type LucideIcon } from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import { useToastStore } from "@/store/toastStore"

interface NavLink {
  href: string
  label: string
  icon: LucideIcon
  resolvedHref?: string
}

const staticNavLinks: NavLink[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/product", label: "Product", icon: Package },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const role = useAuthStore((state) => state.user?.role)

  const dashboardHref = !isAuthenticated ? "/login?redirect=/dashboard" : role === "admin" ? "/admin" : "/dashboard"
  const navLinks = [...staticNavLinks, { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, resolvedHref: dashboardHref }]

  const handleDashboardClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isAuthenticated) return
    e.preventDefault()
    useToastStore.getState().addToast({
      type: "info",
      title: "🔒 Login Required",
      message: "Please sign in to access your Smart Health dashboard.",
    })
    router.push("/login?redirect=/dashboard")
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <motion.header initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-white/90 backdrop-blur-xl shadow-lg border-b border-slate-100/50" : "bg-transparent"
      }`}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img
              src="/images/logo.png"
              alt="Smart Health Room logo"
              className="h-9 w-auto object-contain group-hover:scale-110 transition-transform"
            />
            <span className="font-bold text-lg tracking-tight text-slate-900">
              Smart<span className="text-sky-500">Health</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const href = link.resolvedHref ?? link.href
              const isActive = pathname === href
              const Icon = link.icon
              return (
                <Link key={link.href} href={href}
                  onClick={link.href === "/dashboard" ? handleDashboardClick : undefined}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 group
                    ${isActive ? "text-sky-600 bg-sky-50" : "text-slate-600 hover:text-sky-600 hover:bg-slate-50"}`}>
                  <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? "text-sky-500" : ""}`} />
                  {link.label}
                  {isActive && (
                    <motion.div layoutId="navbar-indicator" className="absolute bottom-0 left-2 right-2 h-0.5 bg-sky-500 rounded-full"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }} />
                  )}
                </Link>
              )
            })}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 text-white text-sm font-medium shadow-lg hover:shadow-xl hover:bg-sky-600 transition-all hover:-translate-y-0.5 active:scale-95">
              <LogIn className="w-4 h-4" />
              Sign In
            </Link>
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? "Close menu" : "Open menu"} className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}
            className="md:hidden bg-white/95 backdrop-blur-xl border-b border-slate-100 overflow-hidden">
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link, i) => {
                const href = link.resolvedHref ?? link.href
                const Icon = link.icon
                return (
                  <motion.div key={link.href} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                    <Link href={href}
                      onClick={(e) => {
                        if (link.href === "/dashboard") handleDashboardClick(e)
                        setMobileOpen(false)
                      }}
                      className="flex items-center justify-between px-4 py-3 rounded-xl text-slate-700 hover:bg-sky-50 hover:text-sky-600 transition-colors">
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{link.label}</span>
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </motion.div>
                )
              })}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="pt-2">
                <Link href="/login" onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-sky-500 text-white font-medium shadow-lg">
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}