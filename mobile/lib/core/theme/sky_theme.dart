import 'package:flutter/material.dart';

/// Sky period + gradient system ported from the web dashboard's
/// `lib/backgroundScene.ts`, so the mobile Home background reacts to the
/// same real sunrise/sunset and weather data instead of a static theme.
enum SkyPeriod { goldenHourMorning, day, goldenHourEvening, blueHour, night }

enum WeatherVeilCategory { clear, cloudy, fog, rain, storm, snow }

class SkyTheme {
  SkyTheme._();

  static const int goldenHourMs = 40 * 60 * 1000;
  static const int blueHourMs = 25 * 60 * 1000;

  static const Map<SkyPeriod, List<Color>> baseGradients = {
    SkyPeriod.goldenHourMorning: [Color(0xFFFDE68A), Color(0xFFFCA5A5), Color(0xFF93C5FD)],
    SkyPeriod.day: [Color(0xFF7DD3FC), Color(0xFF38BDF8), Color(0xFF0EA5E9)],
    SkyPeriod.goldenHourEvening: [Color(0xFFFDBA74), Color(0xFFF472B6), Color(0xFF818CF8)],
    SkyPeriod.blueHour: [Color(0xFF312E81), Color(0xFF1E3A8A), Color(0xFF0F172A)],
    SkyPeriod.night: [Color(0xFF0F172A), Color(0xFF020617), Color(0xFF000000)],
  };

  static const Map<SkyPeriod, Color> glowByPeriod = {
    SkyPeriod.goldenHourMorning: Color(0x40FDE047),
    SkyPeriod.day: Color(0x3338BDF8),
    SkyPeriod.goldenHourEvening: Color(0x33F472B6),
    SkyPeriod.blueHour: Color(0x2E6366F1),
    SkyPeriod.night: Color(0x1A6366F1),
  };

  static const Map<WeatherVeilCategory, Color> veilByCategory = {
    WeatherVeilCategory.storm: Color(0xA61E293B), // 0.65
    WeatherVeilCategory.fog: Color(0x8C94A3B8), // 0.55
    WeatherVeilCategory.cloudy: Color(0x6664748B), // 0.4
    WeatherVeilCategory.rain: Color(0x6664748B),
    WeatherVeilCategory.snow: Color(0x6664748B),
    WeatherVeilCategory.clear: Colors.transparent,
  };

  /// Resolves the current [SkyPeriod] from real sunrise/sunset instants,
  /// windowed by the same golden/blue-hour constants as the web app.
  static SkyPeriod periodFor({
    required DateTime now,
    required DateTime? sunrise,
    required DateTime? sunset,
  }) {
    if (sunrise == null || sunset == null) {
      final hour = now.hour;
      if (hour >= 6 && hour < 18) return SkyPeriod.day;
      return SkyPeriod.night;
    }

    final msToSunrise = sunrise.difference(now).inMilliseconds;
    final msSinceSunrise = now.difference(sunrise).inMilliseconds;
    final msToSunset = sunset.difference(now).inMilliseconds;
    final msSinceSunset = now.difference(sunset).inMilliseconds;

    if (msToSunrise > 0 && msToSunrise <= blueHourMs) return SkyPeriod.blueHour;
    if (msSinceSunrise >= 0 && msSinceSunrise < goldenHourMs) return SkyPeriod.goldenHourMorning;
    if (msToSunset > 0 && msToSunset <= goldenHourMs) return SkyPeriod.goldenHourEvening;
    if (msSinceSunset >= 0 && msSinceSunset <= blueHourMs) return SkyPeriod.blueHour;
    if (now.isAfter(sunrise) && now.isBefore(sunset)) return SkyPeriod.day;
    return SkyPeriod.night;
  }

  static WeatherVeilCategory veilFor(String? weatherCategory) {
    switch (weatherCategory) {
      case 'storm':
        return WeatherVeilCategory.storm;
      case 'fog':
        return WeatherVeilCategory.fog;
      case 'rain':
        return WeatherVeilCategory.rain;
      case 'snow':
        return WeatherVeilCategory.snow;
      case 'cloudy':
        return WeatherVeilCategory.cloudy;
      default:
        return WeatherVeilCategory.clear;
    }
  }

  static List<Color> gradientFor(SkyPeriod period, WeatherVeilCategory veil) {
    final base = baseGradients[period]!;
    final veilColor = veilByCategory[veil]!;
    if (veilColor == Colors.transparent) return base;
    return base.map((c) => Color.alphaBlend(veilColor, c)).toList();
  }

  static Color glowFor(SkyPeriod period) => glowByPeriod[period]!;
}
