import { useEffect } from "react"

/**
 * Global keyboard shortcut, e.g. useKeyboardShortcut("k", () => setOpen(true), { meta: true })
 * for Ctrl+K / Cmd+K. Modeled on useEscapeKey.ts's listener/cleanup pattern.
 */
export function useKeyboardShortcut(
  key: string,
  handler: () => void,
  options: { meta?: boolean; active?: boolean } = {}
) {
  const { meta = false, active = true } = options

  useEffect(() => {
    if (!active) return
    function handleKeyDown(e: KeyboardEvent) {
      const metaMatches = !meta || e.metaKey || e.ctrlKey
      if (metaMatches && e.key.toLowerCase() === key.toLowerCase()) {
        e.preventDefault()
        handler()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [key, meta, active, handler])
}
