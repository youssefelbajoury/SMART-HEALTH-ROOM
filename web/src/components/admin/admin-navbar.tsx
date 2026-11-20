"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAdminStore } from "@/store/admin-store"
import { useEscapeKey } from "@/hooks/useEscapeKey"
import { Search, Shield, Menu, X } from "lucide-react"
import Link from "next/link"

interface AdminNavbarProps {
  onOpenMobileSidebar?: () => void
}

export function AdminNavbar({ onOpenMobileSidebar }: AdminNavbarProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const users = useAdminStore((state) => state.users)
  const setSearchQueryStore = useAdminStore((state) => state.setSearchQuery)

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setSearchQueryStore(value)
  }

  useEscapeKey(() => setSearchOpen(false), searchOpen)

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100 admin-dark:bg-slate-900/90 admin-dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <button
          onClick={onOpenMobileSidebar}
          aria-label="Open menu"
          className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 admin-dark:text-slate-400 admin-dark:hover:text-white"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <img src="/images/logo.png" alt="Smart Health Room logo" className="h-9 w-auto object-contain" />
          <span className="font-bold text-lg hidden sm:block admin-dark:text-white">
            Smart<span className="text-sky-500">Health</span>
          </span>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-xl relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
              placeholder="Search by name, email or ID..."
              aria-label="Search users"
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 admin-dark:bg-white/5 border border-slate-200 admin-dark:border-white/10 text-sm text-slate-900 admin-dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearch("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          <AnimatePresence>
            {searchOpen && searchQuery && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white admin-dark:bg-slate-900 rounded-xl border border-slate-100 admin-dark:border-white/10 shadow-lg overflow-hidden z-50"
              >
                {filteredUsers.length > 0 ? (
                  filteredUsers.slice(0, 5).map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        handleSearch(user.name)
                        setSearchOpen(false)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 admin-dark:hover:bg-white/5 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 admin-dark:text-white">{user.name}</p>
                        <p className="text-xs text-slate-500 admin-dark:text-slate-400">{user.email}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-slate-500 admin-dark:text-slate-400">No results found</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Admin Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-50 admin-dark:bg-sky-500/15 border border-sky-100 admin-dark:border-sky-500/30 text-sky-700 admin-dark:text-sky-300 text-sm font-medium">
          <Shield className="w-4 h-4" />
          <span className="hidden sm:inline">ADMIN</span>
        </div>
      </div>
    </header>
  )
}