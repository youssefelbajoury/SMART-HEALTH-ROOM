export interface WeatherReading {
  temperature: number
  humidity: number
  code: number
  label: string
  category: WeatherCategory
  uvIndex: number
  sunrise: string
  sunset: string
}

export type WeatherCategory = "clear" | "cloudy" | "fog" | "rain" | "snow" | "storm"

export interface AirQualityReading {
  usAqi: number
}

const WEATHER_LABELS: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Rain showers",
  81: "Rain showers",
  82: "Violent showers",
  95: "Thunderstorm",
  96: "Thunderstorm",
  99: "Thunderstorm",
}

function categoryFor(code: number): WeatherCategory {
  if (code === 0 || code === 1) return "clear"
  if (code === 2 || code === 3) return "cloudy"
  if (code === 45 || code === 48) return "fog"
  if (code >= 51 && code <= 65) return "rain"
  if (code >= 71 && code <= 75) return "snow"
  if (code >= 80 && code <= 82) return "rain"
  if (code >= 95) return "storm"
  return "cloudy"
}

export function distanceFromComfort(temp: number, range: [number, number]): number {
  const [low, high] = range
  if (temp < low) return low - temp
  if (temp > high) return temp - high
  return 0
}

// Open-Meteo — free, no API key, no paid tier.
export async function fetchOutdoorWeather(lat: number, lon: number): Promise<WeatherReading | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,uv_index&daily=sunrise,sunset&timezone=auto`
    const response = await fetch(url)
    if (!response.ok) return null

    const data = await response.json()
    const code: number = data.current?.weather_code ?? 0

    return {
      temperature: data.current?.temperature_2m ?? 0,
      humidity: data.current?.relative_humidity_2m ?? 0,
      code,
      label: WEATHER_LABELS[code] ?? "Unknown",
      category: categoryFor(code),
      uvIndex: data.current?.uv_index ?? 0,
      sunrise: data.daily?.sunrise?.[0] ?? "",
      sunset: data.daily?.sunset?.[0] ?? "",
    }
  } catch {
    return null
  }
}

// Open-Meteo Air Quality API — same free/keyless tier, separate host.
export async function fetchOutdoorAirQuality(lat: number, lon: number): Promise<AirQualityReading | null> {
  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`
    const response = await fetch(url)
    if (!response.ok) return null

    const data = await response.json()
    const usAqi = data.current?.us_aqi
    if (usAqi === undefined || usAqi === null) return null

    return { usAqi }
  } catch {
    return null
  }
}
