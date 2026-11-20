/// Ported from `web/src/lib/weather.ts` — WMO weather-code → label/category
/// mapping, kept verbatim so the assistant/recommendations logic agrees
/// with the web app.
const Map<int, String> weatherLabels = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  71: 'Slight snow fall',
  73: 'Moderate snow fall',
  75: 'Heavy snow fall',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Thunderstorm with heavy hail',
};

String weatherCategoryFor(int code) {
  if (code == 0 || code == 1) return 'clear';
  if (code == 2 || code == 3) return 'cloudy';
  if (code == 45 || code == 48) return 'fog';
  if (code >= 51 && code <= 65) return 'rain';
  if (code >= 71 && code <= 75) return 'snow';
  if (code == 80 || code == 81 || code == 82) return 'rain';
  if (code >= 95) return 'storm';
  return 'cloudy';
}

class WeatherReading {
  final double temperature;
  final double humidity;
  final int code;
  final String label;
  final String category;
  final double uvIndex;
  final DateTime? sunrise;
  final DateTime? sunset;

  WeatherReading({
    required this.temperature,
    required this.humidity,
    required this.code,
    required this.label,
    required this.category,
    required this.uvIndex,
    this.sunrise,
    this.sunset,
  });

  factory WeatherReading.fromOpenMeteo(Map<String, dynamic> json) {
    final current = json['current'] as Map<String, dynamic>? ?? {};
    final daily = json['daily'] as Map<String, dynamic>? ?? {};
    final code = (current['weather_code'] as num?)?.toInt() ?? 0;
    final sunriseList = daily['sunrise'] as List?;
    final sunsetList = daily['sunset'] as List?;
    return WeatherReading(
      temperature: (current['temperature_2m'] as num?)?.toDouble() ?? 0,
      humidity: (current['relative_humidity_2m'] as num?)?.toDouble() ?? 0,
      code: code,
      label: weatherLabels[code] ?? 'Unknown',
      category: weatherCategoryFor(code),
      uvIndex: (current['uv_index'] as num?)?.toDouble() ?? 0,
      sunrise: sunriseList != null && sunriseList.isNotEmpty ? DateTime.tryParse(sunriseList[0].toString()) : null,
      sunset: sunsetList != null && sunsetList.isNotEmpty ? DateTime.tryParse(sunsetList[0].toString()) : null,
    );
  }
}
