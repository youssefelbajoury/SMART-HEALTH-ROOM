import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../core/theme/sky_theme.dart';
import '../providers/settings_provider.dart';

/// The mobile equivalent of the web dashboard's fully decorative,
/// weather/time-reactive `DashboardBackground` — a gradient sky that shifts
/// through golden hour / day / blue hour / night, with a sun/moon and
/// (at night) twinkling stars. Respects both the OS-level reduced-motion
/// signal and Settings' own "Reduce Motion" preference.
class SkyBackground extends StatelessWidget {
  final SkyPeriod period;
  final WeatherVeilCategory veil;
  final Widget child;

  const SkyBackground({super.key, required this.period, required this.veil, required this.child});

  @override
  Widget build(BuildContext context) {
    final reduceMotion = MediaQuery.of(context).disableAnimations || context.watch<SettingsProvider>().reduceMotion;
    final gradient = SkyTheme.gradientFor(period, veil);
    final glow = SkyTheme.glowFor(period);
    final isNight = period == SkyPeriod.night || period == SkyPeriod.blueHour;

    return Stack(
      fit: StackFit.expand,
      children: [
        AnimatedContainer(
          duration: const Duration(seconds: 2),
          decoration: BoxDecoration(
            gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: gradient),
          ),
        ),
        IgnorePointer(
          child: Container(
            decoration: BoxDecoration(
              gradient: RadialGradient(
                center: const Alignment(0, -0.6),
                radius: 1.2,
                colors: [glow, Colors.transparent],
              ),
            ),
          ),
        ),
        if (isNight && !reduceMotion) const _StarField(),
        Positioned(
          top: 48,
          right: 28,
          child: Icon(
            isNight ? Icons.nightlight_round : Icons.wb_sunny_rounded,
            size: 34,
            color: Colors.white.withValues(alpha: 0.85),
          )
              .animate(onPlay: (c) => reduceMotion ? null : c.repeat(reverse: true))
              .fadeIn(duration: 1200.ms)
              .then()
              .moveY(begin: 0, end: reduceMotion ? 0 : -6, duration: 2400.ms, curve: Curves.easeInOut),
        ),
        child,
      ],
    );
  }
}

class _StarField extends StatelessWidget {
  const _StarField();

  @override
  Widget build(BuildContext context) {
    final random = math.Random(7);
    return IgnorePointer(
      child: Stack(
        children: List.generate(28, (i) {
          final left = random.nextDouble();
          final top = random.nextDouble() * 0.5;
          final delay = random.nextInt(2000);
          final size = 1.5 + random.nextDouble() * 2;
          return Align(
            alignment: Alignment(left * 2 - 1, top * 2 - 1),
            child: Container(
              width: size,
              height: size,
              decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
            ).animate(onPlay: (c) => c.repeat(reverse: true)).fadeIn(
                  delay: delay.ms,
                  duration: 1500.ms,
                  begin: 0.2,
                ),
          );
        }),
      ),
    );
  }
}
