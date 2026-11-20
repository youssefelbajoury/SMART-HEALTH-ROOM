export function celsiusToFahrenheit(celsius: number): number {
  return celsius * 9 / 5 + 32
}

export function formatTemperature(value: number, unit: "C" | "F" = "C"): string {
  const displayValue = unit === "F" ? celsiusToFahrenheit(value) : value
  return `${Math.round(displayValue * 10) / 10}°${unit}`
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`
}

export function formatPpm(value: number): string {
  return `${Math.round(value)} ppm`
}

export function formatLux(value: number): string {
  return `${Math.round(value)} lux`
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  const diffMs = Date.now() - d.getTime()
  const diffSec = Math.floor(diffMs / 1000)

  if (diffSec < 5) return "Just now"
  if (diffSec < 60) return `${diffSec}s ago`

  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} min ago`

  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}h ago`

  const diffDay = Math.floor(diffHour / 24)
  if (diffDay === 1) return "Yesterday"
  if (diffDay < 7) return `${diffDay}d ago`

  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function formatDayGroup(date: Date | string): "Today" | "Yesterday" | "Earlier" {
  const d = typeof date === "string" ? new Date(date) : date
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000)

  if (d >= startOfToday) return "Today"
  if (d >= startOfYesterday) return "Yesterday"
  return "Earlier"
}
