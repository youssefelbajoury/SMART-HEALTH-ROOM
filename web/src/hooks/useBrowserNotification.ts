import { useCallback, useState } from "react"
import { notifyBrowser } from "@/lib/notify"

export function useBrowserNotification() {
  // Lazy initializer, not an effect: `permission` is only ever read inside
  // other effects (never directly in JSX), so there's no SSR/hydration
  // mismatch risk in reading it synchronously on first render.
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default"
  )

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return "denied"
    const result = await Notification.requestPermission()
    setPermission(result)
    return result
  }, [])

  const notify = useCallback((title: string, options?: NotificationOptions) => {
    notifyBrowser(title, options)
  }, [])

  return { permission, requestPermission, notify }
}
