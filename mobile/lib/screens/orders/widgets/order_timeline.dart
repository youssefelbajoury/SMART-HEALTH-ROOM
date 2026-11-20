import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import '../../../core/utils/order_status.dart';
import '../../../models/order.dart';

/// Animated vertical timeline of an order's `timeline[]` — each entry is a
/// real status transition recorded by the backend's order-lifecycle
/// automation, not a synthesized/guessed step.
class OrderTimelineView extends StatelessWidget {
  final List<OrderTimelineEntry> timeline;
  final bool isDay;

  const OrderTimelineView({super.key, required this.timeline, required this.isDay});

  @override
  Widget build(BuildContext context) {
    final textColor = isDay ? const Color(0xFF0F172A) : Colors.white;

    if (timeline.isEmpty) {
      return Text('No timeline events yet.', style: TextStyle(color: textColor.withValues(alpha: 0.6)));
    }

    final sorted = [...timeline]..sort((a, b) => b.at.compareTo(a.at));

    return Column(
      children: sorted.asMap().entries.map((entry) {
        final i = entry.key;
        final e = entry.value;
        final isLast = i == sorted.length - 1;
        final style = orderStatusStyle(e.status);

        return IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Column(
                children: [
                  Container(
                    width: 28,
                    height: 28,
                    margin: const EdgeInsets.only(top: 2),
                    decoration: BoxDecoration(color: style.color.withValues(alpha: 0.15), shape: BoxShape.circle),
                    child: Icon(style.icon, size: 15, color: style.color),
                  ),
                  if (!isLast) Expanded(child: Container(width: 2, color: textColor.withValues(alpha: 0.12))),
                ],
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 20, top: 4),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(style.label, style: TextStyle(fontWeight: FontWeight.w700, color: textColor)),
                      const SizedBox(height: 2),
                      Text(
                        DateFormat('MMM d, y – HH:mm').format(e.at),
                        style: TextStyle(fontSize: 11.5, color: textColor.withValues(alpha: 0.55)),
                      ),
                      if (e.note != null && e.note!.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(e.note!, style: TextStyle(fontSize: 12, color: textColor.withValues(alpha: 0.7))),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        ).animate().fadeIn(delay: (i * 60).ms, duration: 300.ms).slideX(begin: 0.03, end: 0);
      }).toList(),
    );
  }
}
