import 'dart:math' as math;
import 'package:flutter/material.dart';

/// Circular score gauge — the mobile equivalent of the web dashboard's SVG
/// ring gauges (Health Score, Room Quality), r=42 style, animated.
class CircularGauge extends StatelessWidget {
  final int value; // 0-100
  final Color color;
  final Color trackColor;
  final double size;
  final Widget? center;

  const CircularGauge({
    super.key,
    required this.value,
    required this.color,
    required this.trackColor,
    this.size = 96,
    this.center,
  });

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: value / 100),
      duration: const Duration(milliseconds: 900),
      curve: Curves.easeOutCubic,
      builder: (context, animatedValue, _) {
        return SizedBox(
          width: size,
          height: size,
          child: CustomPaint(
            painter: _GaugePainter(progress: animatedValue, color: color, trackColor: trackColor),
            child: Center(
              child: center ??
                  Text(
                    '${(animatedValue * 100).round()}',
                    style: TextStyle(fontSize: size * 0.26, fontWeight: FontWeight.w700, color: color),
                  ),
            ),
          ),
        );
      },
    );
  }
}

class _GaugePainter extends CustomPainter {
  final double progress;
  final Color color;
  final Color trackColor;

  _GaugePainter({required this.progress, required this.color, required this.trackColor});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (math.min(size.width, size.height) - 10) / 2;
    final strokeWidth = size.width * 0.09;

    final trackPaint = Paint()
      ..color = trackColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;
    canvas.drawCircle(center, radius, trackPaint);

    final progressPaint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    const startAngle = -math.pi / 2;
    final sweepAngle = 2 * math.pi * progress;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      startAngle,
      sweepAngle,
      false,
      progressPaint,
    );
  }

  @override
  bool shouldRepaint(covariant _GaugePainter oldDelegate) =>
      oldDelegate.progress != progress || oldDelegate.color != color;
}
