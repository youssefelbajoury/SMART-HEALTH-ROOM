"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useOrderAdminStore } from "@/store/order-admin-store"
import type { Order, OrderStatus } from "@/store/orderStore"
import {
  ClipboardList,
  Eye,
  Check,
  X as XIcon,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react"
import { Avatar } from "@/components/ui/avatar"
import { TableRowSkeleton } from "@/components/ui/skeleton"
import { useEffect, useState } from "react"
import { OrderDetailModal } from "@/components/admin/order-detail-modal"
import { OrderActionModal } from "@/components/admin/order-action-modal"
import { ORDER_STATUS_PILL as STATUS_PILL, ORDER_STATUS_LABEL as STATUS_LABEL } from "@/lib/orderStatus"

type PendingAction = { type: "accept" | "reject"; order: Order }

export function OrderTable() {
  const orders = useOrderAdminStore((state) => state.orders)
  const pagination = useOrderAdminStore((state) => state.pagination)
  const searchQuery = useOrderAdminStore((state) => state.searchQuery)
  const statusFilter = useOrderAdminStore((state) => state.statusFilter)
  const sortBy = useOrderAdminStore((state) => state.sortBy)
  const sortOrder = useOrderAdminStore((state) => state.sortOrder)
  const isLoading = useOrderAdminStore((state) => state.isLoading)
  const fetchOrders = useOrderAdminStore((state) => state.fetchOrders)
  const setSearchQuery = useOrderAdminStore((state) => state.setSearchQuery)
  const setStatusFilter = useOrderAdminStore((state) => state.setStatusFilter)
  const setSort = useOrderAdminStore((state) => state.setSort)
  const setPage = useOrderAdminStore((state) => state.setPage)
  const acceptOrder = useOrderAdminStore((state) => state.acceptOrder)
  const rejectOrder = useOrderAdminStore((state) => state.rejectOrder)

  const [viewOrder, setViewOrder] = useState<Order | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) setSort(field, sortOrder === "asc" ? "desc" : "asc")
    else setSort(field, "asc")
  }

  const handleConfirm = async () => {
    if (!pendingAction) return
    if (pendingAction.type === "accept") await acceptOrder(pendingAction.order.id)
    else await rejectOrder(pendingAction.order.id)
  }

  const actionCopy: Record<PendingAction["type"], { title: string; description: string; confirmLabel: string; variant: "danger" | "default" }> = {
    accept: {
      title: "Accept this order?",
      description: "It will automatically move through Processing and Delivered, creating a user account when complete.",
      confirmLabel: "Accept",
      variant: "default",
    },
    reject: {
      title: "Reject this order?",
      description: "No user account will be created. The order moves to History as Rejected.",
      confirmLabel: "Reject",
      variant: "danger",
    },
  }

  return (
    <div id="orders" className="admin-glass rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 admin-dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900 admin-dark:text-white">Orders</h3>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search orders..."
              className="pl-9 pr-3 py-2 rounded-lg bg-slate-50 admin-dark:bg-white/5 border border-slate-200 admin-dark:border-white/10 text-sm text-slate-600 admin-dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "all")}
            className="px-3 py-2 rounded-lg bg-slate-50 admin-dark:bg-white/5 border border-slate-200 admin-dark:border-white/10 text-sm text-slate-600 admin-dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="processing">Processing</option>
            <option value="delivered">Delivered</option>
            <option value="rejected">Rejected</option>
            <option value="delivery-failed">Delivery Failed</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 admin-dark:bg-white/5 text-slate-500 admin-dark:text-slate-400">
              <th className="px-6 py-3 text-left font-medium">Order ID</th>
              <th className="px-6 py-3 text-left font-medium">Photo</th>
              <th className="px-6 py-3 text-left font-medium">
                <button onClick={() => toggleSort("firstName")} className="flex items-center gap-1 hover:text-slate-700 admin-dark:hover:text-white">
                  First Name <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-6 py-3 text-left font-medium">
                <button onClick={() => toggleSort("lastName")} className="flex items-center gap-1 hover:text-slate-700 admin-dark:hover:text-white">
                  Last Name <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-6 py-3 text-left font-medium">Date of Birth</th>
              <th className="px-6 py-3 text-left font-medium">
                <button onClick={() => toggleSort("email")} className="flex items-center gap-1 hover:text-slate-700 admin-dark:hover:text-white">
                  Email <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-6 py-3 text-left font-medium">Phone</th>
              <th className="px-6 py-3 text-left font-medium">Status</th>
              <th className="px-6 py-3 text-left font-medium">
                <button onClick={() => toggleSort("createdAt")} className="flex items-center gap-1 hover:text-slate-700 admin-dark:hover:text-white">
                  Created At <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-6 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 admin-dark:divide-white/10">
            {isLoading && orders.length === 0 &&
              Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} columns={10} />)}
            <AnimatePresence>
              {orders.map((order, index) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-slate-50 admin-dark:hover:bg-white/5 transition-colors group"
                >
                  <td className="px-6 py-4 text-slate-500 admin-dark:text-slate-400 font-mono text-xs">#{order.id.slice(-8)}</td>
                  <td className="px-6 py-4">
                    <Avatar name={`${order.firstName} ${order.lastName}`} size="sm" />
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900 admin-dark:text-white">{order.firstName}</td>
                  <td className="px-6 py-4 font-medium text-slate-900 admin-dark:text-white">{order.lastName}</td>
                  <td className="px-6 py-4 text-slate-500 admin-dark:text-slate-400">{new Date(order.dateOfBirth).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-slate-500 admin-dark:text-slate-400">{order.email}</td>
                  <td className="px-6 py-4 text-slate-500 admin-dark:text-slate-400">{order.phone || "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_PILL[order.status]}`}>
                      {STATUS_LABEL[order.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 admin-dark:text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setViewOrder(order)}
                        title="View Details"
                        aria-label={`View details for ${order.firstName} ${order.lastName}`}
                        className="p-2 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 admin-dark:hover:bg-white/10 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {order.status === "pending" && (
                        <button
                          onClick={() => setPendingAction({ type: "accept", order })}
                          title="Accept"
                          aria-label={`Accept order from ${order.firstName} ${order.lastName}`}
                          className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 admin-dark:hover:bg-white/10 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      {(order.status === "pending" || order.status === "accepted" || order.status === "processing") && (
                        <button
                          onClick={() => setPendingAction({ type: "reject", order })}
                          title="Reject"
                          aria-label={`Reject order from ${order.firstName} ${order.lastName}`}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 admin-dark:hover:bg-white/10 transition-colors"
                        >
                          <XIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {!isLoading && orders.length === 0 && (
        <div className="py-12 text-center">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 admin-dark:text-slate-400">No orders found</p>
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="px-6 py-4 border-t border-slate-100 admin-dark:border-white/10 flex items-center justify-between">
          <p className="text-sm text-slate-500 admin-dark:text-slate-400">
            Page {pagination.page} of {pagination.pages} ({pagination.total} orders)
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

      <OrderDetailModal isOpen={!!viewOrder} onClose={() => setViewOrder(null)} order={viewOrder} />

      {pendingAction && (
        <OrderActionModal
          isOpen={!!pendingAction}
          onClose={() => setPendingAction(null)}
          onConfirm={handleConfirm}
          title={actionCopy[pendingAction.type].title}
          description={actionCopy[pendingAction.type].description}
          confirmLabel={actionCopy[pendingAction.type].confirmLabel}
          variant={actionCopy[pendingAction.type].variant}
        />
      )}
    </div>
  )
}
