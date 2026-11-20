import { useEffect, useState } from "react"

/**
 * Shows a decorative element for `visibleMs` on a randomized interval between
 * `minDelayMs` and `maxDelayMs`. Single setTimeout chain, cleared on
 * unmount/disable — shared by every "occasional" background effect (birds,
 * airplane, shooting star, lightning) instead of duplicating the scheduling
 * logic per effect.
 */
export function useOccasionalReveal(enabled: boolean, minDelayMs: number, maxDelayMs: number, visibleMs: number): boolean {
  const [internalVisible, setInternalVisible] = useState(false)

  useEffect(() => {
    if (!enabled) return

    let showTimeout: ReturnType<typeof setTimeout>
    let hideTimeout: ReturnType<typeof setTimeout>

    const scheduleNext = () => {
      const delay = minDelayMs + Math.random() * (maxDelayMs - minDelayMs)
      showTimeout = setTimeout(() => {
        setInternalVisible(true)
        hideTimeout = setTimeout(() => {
          setInternalVisible(false)
          scheduleNext()
        }, visibleMs)
      }, delay)
    }

    scheduleNext()

    return () => {
      clearTimeout(showTimeout)
      clearTimeout(hideTimeout)
    }
  }, [enabled, minDelayMs, maxDelayMs, visibleMs])

  return enabled && internalVisible
}
