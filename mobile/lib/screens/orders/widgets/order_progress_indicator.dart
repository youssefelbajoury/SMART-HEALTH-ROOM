import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/order_status.dart';

const _steps = ['Pending', 'Accepted', 'Processing', 'Delivered'];

/// Animated 4-step linear progress indicator for the order pipeline —
/// falls back to a terminal failure banner for rejected/delivery-failed.
class OrderProgressIndicator extends StatelessWidget {
  final String status;
  final bool isDay;

  const OrderProgressIndicator({super.key, required this.status, required this.isDay});

  @override
  Widget build(BuildContext context) {
    final textColor = isDay ? const Color(0xFF0F172A) : Colors.white;
    final step = orderProgressStep(status);

    if (step < 0) {
      final style = orderStatusStyle(status);
      return Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: style.color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: style.color.withValues(alpha: 0.3)),
        ),
        child: Row(
          children: [
            Icon(style.icon, color: style.color),
            const SizedBox(width: 10),
            Text(style.label, style: TextStyle(color: style.color, fontWeight: FontWeight.w700)),
          ],
        ),
      );
    }

    return Column(
      children: [
        Row(
          children: List.generate(_steps.length, (i) {
            final reached = i <= step;
            return Expanded(
              child: Row(
                children: [
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 400),
                    width: 22,
                    height: 22,
                    decoration: BoxDecoration(
                      color: reached ? AppColors.primary500 : textColor.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: reached
                        ? const Icon(Icons.check_rounded, size: 14, color: Colors.white)
                        : null,
                  ),
                  if (i != _steps.length - 1)
                    Expanded(
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 400),
                        height: 3,
                        color: i < step ? AppColors.primary500 : textColor.withValues(alpha: 0.1),
                      ),
                    ),
                ],
              ),
            );
          }),
        ),
        const SizedBox(height: 6),
        Row(
          children: _steps
              .map((s) => Expanded(
                    child: Text(
                      s,
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 10, color: textColor.withValues(alpha: 0.6)),
                    ),
                  ))
              .toList(),
        ),
      ],
    );
  }
}
