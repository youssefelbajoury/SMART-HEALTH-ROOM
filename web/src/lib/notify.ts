// Plain, non-hook browser Notification trigger — reused by useBrowserNotification
// (for components that also need permission state) and by toastStore (which,
// being a plain Zustand store, can't use a React hook).
export function notifyBrowser(title: string, options?: NotificationOptions) {
  if (typeof window === "undefined" || !("Notification" in window)) return
  if (Notification.permission !== "granted") return
  new Notification(title, options)
}
