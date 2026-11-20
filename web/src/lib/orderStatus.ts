import type { OrderStatus } from "@/store/orderStore"

// Shared between order-table.tsx and order-detail-modal.tsx (both admin-dark themed
// surfaces). The dashboard's own orders/page.tsx and OrderTimeline.tsx intentionally
// keep a separate day:-themed palette since they render on a different surface.
export const ORDER_STATUS_PILL: Record<OrderStatus, string> = {
  pending: "bg-orange-50 text-orange-600 border border-orange-200 admin-dark:bg-orange-500/15 admin-dark:text-orange-300 admin-dark:border-orange-500/30",
  accepted: "bg-blue-50 text-blue-600 border border-blue-200 admin-dark:bg-blue-500/15 admin-dark:text-blue-300 admin-dark:border-blue-500/30",
  processing: "bg-purple-50 text-purple-600 border border-purple-200 admin-dark:bg-purple-500/15 admin-dark:text-purple-300 admin-dark:border-purple-500/30",
  delivered: "bg-emerald-50 text-emerald-600 border border-emerald-200 admin-dark:bg-emerald-500/15 admin-dark:text-emerald-300 admin-dark:border-emerald-500/30",
  rejected: "bg-red-50 text-red-600 border border-red-200 admin-dark:bg-red-500/15 admin-dark:text-red-300 admin-dark:border-red-500/30",
  "delivery-failed": "bg-rose-50 text-rose-600 border border-rose-200 admin-dark:bg-rose-500/15 admin-dark:text-rose-300 admin-dark:border-rose-500/30",
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  processing: "Processing",
  delivered: "Delivered",
  rejected: "Rejected",
  "delivery-failed": "Delivery Failed",
}
