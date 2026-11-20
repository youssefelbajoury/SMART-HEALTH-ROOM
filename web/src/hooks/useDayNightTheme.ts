import { useSensorStore } from "@/store/sensor-store"
import { useSettingsStore } from "@/store/settingsStore"

// Pure derived state only — this hook is called from several components at
// once (navbar, layout, page, background scene), so any side effect placed
// here would fire once per call site on the same transition. The "Day/Night
// Mode activated" toast is fired exactly once, from DashboardLayout, which
// is the single stable mount point for the whole /dashboard section.
export function useDayNightTheme() {
  const lightStatus = useSensorStore((state) => state.data.lightStatus)
  const light = useSensorStore((state) => state.data.light)
  const themeOverride = useSettingsStore((state) => state.themeOverride)

  const autoIsDay = lightStatus ? lightStatus === "jour" : (light ?? 500) >= 500
  const isDay = themeOverride === "auto" ? autoIsDay : themeOverride === "day"

  return { isDay }
}
