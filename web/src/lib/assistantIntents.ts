import type { AssistantContext, AssistantRecommendation } from "./smartAssistant"
import { getGreeting } from "./smartAssistant"
import { THRESHOLDS } from "./thresholds"
import type { RoomQualityKey } from "./roomQuality"

// Deterministic, rule-based Q&A layer for the AI Assistant chat. Every fact
// below is read straight from the same engines the rest of the dashboard
// already uses (healthScore.breakdown, roomQuality.explanations,
// predictiveWarning, generateSmartRecommendations, THRESHOLDS) — nothing here
// invents a number or calls any external/paid API.

export type AssistantIntent =
  | "greeting"
  | "room-status"
  | "health-score-why"
  | "room-quality-why"
  | "warning-why"
  | "what-to-do"
  | "how-improve"
  | "explain-gas"
  | "explain-humidity"
  | "explain-temperature"
  | "explain-air-quality"
  | "explain-every-sensor"
  | "explain-health-score"
  | "explain-room-quality"
  | "explain-recommendations"
  | "unknown"

interface IntentRule {
  intent: AssistantIntent
  phrases: string[]
}

// Checked in order — more specific multi-word phrases first, single-keyword
// fallbacks last, so "why is my health score low" matches health-score-why
// before the generic "score" keyword could steal it.
const INTENT_RULES: IntentRule[] = [
  { intent: "room-status", phrases: ["how is my room", "how's my room", "room status", "state of my room", "how does my room look"] },
  { intent: "health-score-why", phrases: ["why is my health score", "why health score", "health score low", "health score bad"] },
  { intent: "room-quality-why", phrases: ["why is room quality", "room quality decreasing", "room quality low", "why room quality"] },
  { intent: "warning-why", phrases: ["why did i receive a warning", "why did i get a warning", "why warning", "why alert", "why did i get an alert"] },
  { intent: "what-to-do", phrases: ["what should i do", "what to do now", "what can i do", "what should i do now"] },
  { intent: "how-improve", phrases: ["how can i improve", "improve my room", "how to improve", "how do i improve"] },
  { intent: "explain-every-sensor", phrases: ["explain every sensor", "explain all sensors", "explain sensors", "explain the sensors"] },
  { intent: "explain-recommendations", phrases: ["explain today's recommendations", "explain todays recommendations", "explain recommendations", "today's recommendations"] },
  { intent: "explain-health-score", phrases: ["explain health score", "what is health score", "what is the health score"] },
  { intent: "explain-room-quality", phrases: ["explain room quality", "what is room quality", "what is the room quality"] },
  { intent: "explain-gas", phrases: ["why is gas dangerous", "explain gas", "what is gas"] },
  { intent: "explain-air-quality", phrases: ["explain air quality", "what is air quality"] },
  { intent: "explain-humidity", phrases: ["explain humidity", "what is humidity"] },
  { intent: "explain-temperature", phrases: ["explain temperature", "what is temperature"] },
  { intent: "greeting", phrases: ["hello", "hi", "hey", "good morning", "good evening"] },
]

export function matchIntent(question: string): AssistantIntent {
  const q = question.toLowerCase().trim()
  for (const rule of INTENT_RULES) {
    if (rule.phrases.some((p) => q.includes(p))) return rule.intent
  }
  // Loose single-keyword fallback, still deterministic — no fuzzy/ML matching.
  if (q.includes("gas")) return "explain-gas"
  if (q.includes("air quality")) return "explain-air-quality"
  if (q.includes("humidity")) return "explain-humidity"
  if (q.includes("temperature")) return "explain-temperature"
  if (q.includes("health score")) return "explain-health-score"
  if (q.includes("room quality")) return "explain-room-quality"
  if (q.includes("recommendation")) return "explain-recommendations"
  if (q.includes("sensor")) return "explain-every-sensor"
  if (q.includes("warning") || q.includes("alert")) return "warning-why"
  if (q.includes("improve") || q.includes("better")) return "how-improve"
  if (q.includes("do now") || q.includes("should i")) return "what-to-do"
  return "unknown"
}

function gasValueOf(ctx: AssistantContext): number {
  return Math.round(ctx.data.gas ?? ctx.data.airQuality ?? 0)
}

function worstRoomQualityKey(ctx: AssistantContext): RoomQualityKey {
  const rq = ctx.roomQuality
  const scores: Record<RoomQualityKey, number> = {
    comfort: rq.comfort,
    airQuality: rq.airQuality,
    safety: rq.safety,
    energyEfficiency: rq.energyEfficiency,
  }
  return (Object.keys(scores) as RoomQualityKey[]).sort((a, b) => scores[a] - scores[b])[0]
}

export function answerQuestion(
  question: string,
  ctx: AssistantContext,
  recommendations: AssistantRecommendation[],
  userName: string
): string {
  const intent = matchIntent(question)

  switch (intent) {
    case "greeting":
      return `${getGreeting(ctx.now)}, ${userName}! Ask me about your room status, health score, room quality, warnings, or any individual sensor — every answer comes straight from your live sensor data.`

    case "room-status": {
      const hs = ctx.healthScore
      const rq = ctx.roomQuality
      return [
        `Your room is currently **${hs.status}** — Health Score **${hs.score}/100**, Room Quality **${rq.overall}/100**.`,
        "",
        `- Comfort: ${rq.comfort}/100`,
        `- Air Quality: ${rq.airQuality}/100`,
        `- Safety: ${rq.safety}/100`,
        `- Energy Efficiency: ${rq.energyEfficiency}/100`,
      ].join("\n")
    }

    case "health-score-why": {
      const worst = [...ctx.healthScore.breakdown].sort((a, b) => a.score - b.score).slice(0, 3)
      const lines = worst.map((b) => `- **${b.label}**: ${b.level} (${b.score}/100)`)
      return `Your Health Score is **${ctx.healthScore.score}/100**. The factors pulling it down the most right now:\n\n${lines.join("\n")}`
    }

    case "room-quality-why": {
      const rq = ctx.roomQuality
      const worstKey = worstRoomQualityKey(ctx)
      return `Room Quality is **${rq.overall}/100**. The weakest area right now is **${worstKey}**: ${rq.explanations[worstKey]}`
    }

    case "warning-why": {
      if (ctx.predictiveWarning) {
        return `${ctx.predictiveWarning.message} This is a predictive warning — the trend is approaching, but hasn't yet reached, the danger threshold.`
      }
      const critical = recommendations.find((r) => r.severity === "critical" || r.severity === "warning") ?? recommendations[0]
      if (critical) {
        return [`${critical.message}`, "", ...critical.reasons.map((r) => `- ${r}`)].join("\n")
      }
      return "There's no active warning right now — every sensor is within its safe range."
    }

    case "what-to-do": {
      if (recommendations.length === 0) return "Nothing to act on right now — conditions are within comfortable ranges."
      const top = recommendations[0]
      return [`**Recommended action:** ${top.message}`, "", ...top.reasons.map((r) => `- ${r}`)].join("\n")
    }

    case "how-improve": {
      if (recommendations.length === 0) return "Your room is already in great shape — keep up the current routine."
      return recommendations.slice(0, 3).map((r) => `- ${r.message}`).join("\n")
    }

    case "explain-gas":
      return `Gas (Air Quality) is measured in **ppm** by the MQ4 sensor. Warning at ${THRESHOLDS.gas.warning}ppm, danger at ${THRESHOLDS.gas.danger}ppm — current reading: **${gasValueOf(ctx)}ppm**. High gas concentration usually means poor ventilation or a combustible/toxic gas source, which is why it's treated as a safety risk rather than just a comfort factor.`

    case "explain-air-quality":
      return `Air Quality tracks the same gas sensor (MQ4) in ppm. Warning at ${THRESHOLDS.gas.warning}ppm, danger at ${THRESHOLDS.gas.danger}ppm — current reading: **${gasValueOf(ctx)}ppm**. It feeds directly into the Room Quality Index's "Air Quality" sub-score.`

    case "explain-humidity":
      return `Humidity is measured as a percentage by the DHT11 sensor. Warning at ${THRESHOLDS.humidity.warning}%, danger at ${THRESHOLDS.humidity.danger}% — current reading: **${Math.round(ctx.data.humidity)}%**. Sustained high humidity affects comfort and can encourage mold growth.`

    case "explain-temperature":
      return `Temperature is measured in °C by the DHT11 sensor. Warning at ${THRESHOLDS.temperature.warning}°C, danger at ${THRESHOLDS.temperature.danger}°C — current reading: **${ctx.data.temperature.toFixed(1)}°C**.`

    case "explain-health-score":
      return `The Health Score (0-100) blends Temperature, Humidity, Gas, Sound, Lighting and Presence, each weighted, into one number. Yours is currently **${ctx.healthScore.score}/100** (${ctx.healthScore.status}).`

    case "explain-room-quality":
      return `The Room Quality Index (0-100) combines four sub-scores — Comfort, Air Quality, Safety and Energy Efficiency. Yours is currently **${ctx.roomQuality.overall}/100**.`

    case "explain-recommendations": {
      if (recommendations.length === 0) return "There are no active recommendations right now — everything looks good."
      return recommendations.map((r) => `- **${r.message}** _(${r.severity})_`).join("\n")
    }

    case "explain-every-sensor": {
      const gas = gasValueOf(ctx)
      return [
        "## Sensor Overview",
        `- **Temperature**: ${ctx.data.temperature.toFixed(1)}°C`,
        `- **Humidity**: ${Math.round(ctx.data.humidity)}%`,
        `- **Air Quality (Gas)**: ${gas}ppm`,
        `- **Light**: ${Math.round(ctx.data.light ?? 500)} lux`,
        `- **Sound**: ${ctx.data.soundLevel === 1 ? "Detected" : "Silent"}`,
        `- **Bed / Presence**: ${ctx.presence ? "Occupied" : "Free"}`,
      ].join("\n")
    }

    default:
      return "I can answer questions about your room status, health score, room quality, warnings, recommendations, and individual sensors (temperature, humidity, gas, air quality). Try one of the suggested questions below!"
  }
}
