import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import '../../../core/utils/order_status.dart';
import '../../../models/order.dart';
import '../../../widgets/glass_card.dart';

class OrderCard extends StatelessWidget {
  final Order order;
  final bool isDay;
  final VoidCallback onTap;
  final int index;

  const OrderCard({super.key, required this.order, required this.isDay, required this.onTap, this.index = 0});

  @override
  Widget build(BuildContext context) {
    final textColor = isDay ? const Color(0xFF0F172A) : Colors.white;
    final style = orderStatusStyle(order.status);

    return GlassCard(
      isDay: isDay,
      onTap: onTap,
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: style.color.withValues(alpha: 0.15), shape: BoxShape.circle),
            child: Icon(style.icon, color: style.color),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(order.fullName, style: TextStyle(fontWeight: FontWeight.w700, color: textColor)),
                const SizedBox(height: 2),
                Text(
                  DateFormat('MMM d, y').format(order.createdAt),
                  style: TextStyle(fontSize: 11.5, color: textColor.withValues(alpha: 0.55)),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(color: style.color.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(999)),
            child: Text(style.label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: style.color)),
          ),
          const SizedBox(width: 4),
          Icon(Icons.chevron_right_rounded, color: textColor.withValues(alpha: 0.4)),
        ],
      ),
    ).animate().fadeIn(delay: (index.clamp(0, 15) * 40).ms, duration: 300.ms).slideY(begin: 0.03, end: 0);
  }
}
