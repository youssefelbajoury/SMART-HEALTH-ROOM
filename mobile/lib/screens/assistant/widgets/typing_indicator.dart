import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

/// "Thinking" animation — three dots pulsing in sequence while the
/// assistant's fixed-delay answer is pending.
class TypingIndicator extends StatelessWidget {
  final bool isDay;

  const TypingIndicator({super.key, required this.isDay});

  @override
  Widget build(BuildContext context) {
    final dotColor = isDay ? const Color(0xFF0F172A) : Colors.white;
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 6),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isDay ? Colors.white : Colors.white.withValues(alpha: 0.06),
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(16),
            topRight: Radius.circular(16),
            bottomRight: Radius.circular(16),
            bottomLeft: Radius.circular(4),
          ),
          border: Border.all(color: isDay ? const Color(0xFFE2E8F0) : Colors.white12),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: List.generate(3, (i) {
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 2),
              child: Container(
                width: 7,
                height: 7,
                decoration: BoxDecoration(color: dotColor.withValues(alpha: 0.6), shape: BoxShape.circle),
              )
                  .animate(onPlay: (c) => c.repeat(reverse: true))
                  .fadeIn(delay: (i * 160).ms, duration: 400.ms, begin: 0.2)
                  .scale(begin: const Offset(0.7, 0.7), end: const Offset(1, 1), duration: 400.ms),
            );
          }),
        ),
      ),
    );
  }
}
