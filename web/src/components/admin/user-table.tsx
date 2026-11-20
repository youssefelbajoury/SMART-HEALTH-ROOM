"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useAdminStore, User } from "@/store/admin-store"
import { User as UserIcon, Pencil, Trash2, UserPlus, Ban, KeyRound, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react"
import { Avatar } from "@/components/ui/avatar"
import { TableRowSkeleton } from "@/components/ui/skeleton"
import { useEffect, useState } from "react"
import { UserModal } from "@/components/admin/user-modal"
import { DeleteModal } from "@/components/admin/delete-modal"
import { PasswordResetModal } from "@/components/admin/password-reset-modal"

export function UserTable() {
  const users = useAdminStore((state) => state.users)
  const pagination = useAdminStore((state) => state.pagination)
  const roleFilter = useAdminStore((state) => state.roleFilter)
  const statusFilter = useAdminStore((state) => state.statusFilter)
  const sortBy = useAdminStore((state) => state.sortBy)
  const sortOrder = useAdminStore((state) => state.sortOrder)
  const isLoading = useAdminStore((state) => state.isLoading)
  const fetchUsers = useAdminStore((state) => state.fetchUsers)
  const setRoleFilter = useAdminStore((state) => state.setRoleFilter)
  const setStatusFilter = useAdminStore((state) => state.setStatusFilter)
  const setSort = useAdminStore((state) => state.setSort)
  const setPage = useAdminStore((state) => state.setPage)
  const suspendUser = useAdminStore((state) => state.suspendUser)

  const [editUser, setEditUser] = useState<User | null>(null)
  const [deleteUser, setDeleteUser] = useState<User | null>(null)
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [suspendingId, setSuspendingId] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    const openAddModal = () => setShowAddModal(true)
    window.addEventListener("admin:open-add-user", openAddModal)
    return () => window.removeEventListener("admin:open-add-user", openAddModal)
  }, [])

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) setSort(field, sortOrder === "asc" ? "desc" : "asc")
    else setSort(field, "asc")
  }

  const handleSuspend = async (user: User) => {
    setSuspendingId(user.id)
    try {
      await suspendUser(user.id, user.isActive)
    } catch {
      // toast already shown by the store
    } finally {
      setSuspendingId(null)
    }
  }

  return (
    <div id="users" className="admin-glass rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 admin-dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900 admin-dark:text-white">Users</h3>
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filter by role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as "all" | "user" | "admin")}
            className="px-3 py-2 rounded-lg bg-slate-50 admin-dark:bg-white/5 border border-slate-200 admin-dark:border-white/10 text-sm text-slate-600 admin-dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "suspended")}
            className="px-3 py-2 rounded-lg bg-slate-50 admin-dark:bg-white/5 border border-slate-200 admin-dark:border-white/10 text-sm text-slate-600 admin-dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 transition-colors shadow-md hover:shadow-lg"
          >
            <UserPlus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 admin-dark:bg-white/5 text-slate-500 admin-dark:text-slate-400">
              <th className="px-6 py-3 text-left font-medium">Photo</th>
              <th className="px-6 py-3 text-left font-medium">
                <button onClick={() => toggleSort("nom")} className="flex items-center gap-1 hover:text-slate-700 admin-dark:hover:text-white">
                  Name <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-6 py-3 text-left font-medium">
                <button onClick={() => toggleSort("email")} className="flex items-center gap-1 hover:text-slate-700 admin-dark:hover:text-white">
                  Email <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-6 py-3 text-left font-medium">Role</th>
              <th className="px-6 py-3 text-left font-medium">Status</th>
              <th className="px-6 py-3 text-left font-medium">
                <button onClick={() => toggleSort("createdAt")} className="flex items-center gap-1 hover:text-slate-700 admin-dark:hover:text-white">
                  Registered <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-6 py-3 text-left font-medium">
                <button onClick={() => toggleSort("lastLogin")} className="flex items-center gap-1 hover:text-slate-700 admin-dark:hover:text-white">
                  Last Login <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-6 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 admin-dark:divide-white/10">
            {isLoading && users.length === 0 &&
              Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} columns={8} />)}
            <AnimatePresence>
              {users.map((user, index) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-slate-50 admin-dark:hover:bg-white/5 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <Avatar src={user.avatar} name={user.name} size="md" />
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900 admin-dark:text-white">{user.name}</td>
                  <td className="px-6 py-4 text-slate-500 admin-dark:text-slate-400">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.role === "admin"
                        ? "bg-violet-50 text-violet-600 border border-violet-200 admin-dark:bg-violet-500/15 admin-dark:text-violet-300 admin-dark:border-violet-500/30"
                        : "bg-slate-50 text-slate-600 border border-slate-200 admin-dark:bg-white/5 admin-dark:text-slate-300 admin-dark:border-white/10"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.isActive
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200 admin-dark:bg-emerald-500/15 admin-dark:text-emerald-300 admin-dark:border-emerald-500/30"
                        : "bg-red-50 text-red-600 border border-red-200 admin-dark:bg-red-500/15 admin-dark:text-red-300 admin-dark:border-red-500/30"
                    }`}>
                      {user.isActive ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 admin-dark:text-slate-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-slate-500 admin-dark:text-slate-400">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditUser(user)}
                        title="Edit"
                        aria-label={`Edit ${user.name}`}
                        className="p-2 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 admin-dark:hover:bg-white/10 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setResetPasswordUser(user)}
                        title="Reset Password"
                        aria-label={`Reset password for ${user.name}`}
                        className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 admin-dark:hover:bg-white/10 transition-colors"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSuspend(user)}
                        disabled={suspendingId === user.id}
                        title={user.isActive ? "Suspend" : "Reactivate"}
                        aria-label={`${user.isActive ? "Suspend" : "Reactivate"} ${user.name}`}
                        className="p-2 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50 admin-dark:hover:bg-white/10 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteUser(user)}
                        title="Delete"
                        aria-label={`Delete ${user.name}`}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 admin-dark:hover:bg-white/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Empty / Loading States */}
      {!isLoading && users.length === 0 && (
        <div className="py-12 text-center">
          <UserIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 admin-dark:text-slate-400">No users found</p>
        </div>
      )}
      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="px-6 py-4 border-t border-slate-100 admin-dark:border-white/10 flex items-center justify-between">
          <p className="text-sm text-slate-500 admin-dark:text-slate-400">
            Page {pagination.page} of {pagination.pages} ({pagination.total} users)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(pagination.page - 1)}
              disabled={pagination.page <= 1}
              aria-label="Previous page"
              className="p-2 rounded-lg border border-slate-200 admin-dark:border-white/10 text-slate-500 admin-dark:text-slate-400 disabled:opacity-40 hover:bg-slate-50 admin-dark:hover:bg-white/10"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              aria-label="Next page"
              className="p-2 rounded-lg border border-slate-200 admin-dark:border-white/10 text-slate-500 admin-dark:text-slate-400 disabled:opacity-40 hover:bg-slate-50 admin-dark:hover:bg-white/10"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <UserModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} mode="create" />
      {editUser && (
        <UserModal
          isOpen={!!editUser}
          onClose={() => setEditUser(null)}
          mode="edit"
          user={editUser}
        />
      )}
      {deleteUser && (
        <DeleteModal
          isOpen={!!deleteUser}
          onClose={() => setDeleteUser(null)}
          user={deleteUser}
        />
      )}
      {resetPasswordUser && (
        <PasswordResetModal
          isOpen={!!resetPasswordUser}
          onClose={() => setResetPasswordUser(null)}
          user={resetPasswordUser}
        />
      )}
    </div>
  )
}
