import { useMemo } from "react"
import { useSensorStore } from "@/store/sensor-store"
import { useEmergencyStore } from "@/store/emergencyStore"
import { useWeatherStore } from "@/store/weatherStore"
import { useAuthStore } from "@/store/authStore"
import { calculateHealthScore } from "@/lib/healthScore"
import { calculateRoomQuality } from "@/lib/roomQuality"
import { detectTrendWarning } from "@/lib/predictiveWarning"
import { OCCUPANCY_PRESSURE_THRESHOLD } from "@/lib/thresholds"
import { generateSmartRecommendations, buildAssistantSummarySentences, type AssistantContext } from "@/lib/smartAssistant"

export function useSmartAssistant() {
  const data = useSensorStore((state) => state.data)
  const history = useSensorStore((state) => state.history)
  const activeEmergency = useEmergencyStore((state) => state.active)
  const weather = useWeatherStore((state) => state.weather)
  const outdoorAqi = useWeatherStore((state) => state.airQuality)
  const userName = useAuthStore((state) => state.user?.name) ?? "there"

  const context: AssistantContext = useMemo(() => {
    const predictiveWarning = detectTrendWarning(history)
    const presence = (data.pressure ?? 0) > OCCUPANCY_PRESSURE_THRESHOLD

    return {
      data,
      history,
      healthScore: calculateHealthScore(data),
      roomQuality: calculateRoomQuality(data, weather, outdoorAqi, predictiveWarning, !!activeEmergency),
      predictiveWarning,
      weather,
      outdoorAqi,
      presence,
      now: new Date(),
    }
  }, [data, history, weather, outdoorAqi, activeEmergency])

  const recommendations = useMemo(() => generateSmartRecommendations(context), [context])
  const summarySentences = useMemo(
    () => buildAssistantSummarySentences(context, recommendations, userName),
    [context, recommendations, userName]
  )

  return { context, recommendations, summarySentences, userName }
}
