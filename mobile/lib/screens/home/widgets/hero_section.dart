import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import '../../../core/utils/smart_assistant.dart';

/// Ported from the web dashboard's inline hero: greeting + live clock.
class HeroSection extends StatefulWidget {
  final String firstName;
  final bool isDay;

  const HeroSection({super.key, required this.firstName, required this.isDay});

  @override
  State<HeroSection> createState() => _HeroSectionState();
}

class _HeroSectionState extends State<HeroSection> {
  late DateTime _now;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _now = DateTime.now();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) => setState(() => _now = DateTime.now()));
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final textColor = widget.isDay ? const Color(0xFF0F172A) : Colors.white;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '${getGreeting(_now)}, ${widget.firstName}',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: textColor),
              ).animate().fadeIn(duration: 400.ms).slideX(begin: -0.05, end: 0),
              const SizedBox(height: 4),
              Text(
                'Real-time monitoring of your environment',
                style: TextStyle(fontSize: 14, color: textColor.withValues(alpha: 0.7)),
              ).animate().fadeIn(delay: 100.ms, duration: 400.ms),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: (widget.isDay ? Colors.black : Colors.white).withValues(alpha: 0.06),
            borderRadius: BorderRadius.circular(999),
          ),
          child: Text(
            DateFormat('HH:mm:ss').format(_now),
            style: TextStyle(color: textColor, fontWeight: FontWeight.w600, fontFeatures: const [FontFeature.tabularFigures()]),
          ),
        ).animate().fadeIn(duration: 400.ms),
      ],
    );
  }
}
