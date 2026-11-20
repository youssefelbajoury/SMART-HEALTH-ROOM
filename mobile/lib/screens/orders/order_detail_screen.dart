import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../models/order.dart';
import '../../providers/theme_provider.dart';
import '../../widgets/glass_card.dart';
import 'widgets/order_progress_indicator.dart';
import 'widgets/order_timeline.dart';

class OrderDetailScreen extends StatelessWidget {
  final Order order;

  const OrderDetailScreen({super.key, required this.order});

  @override
  Widget build(BuildContext context) {
    final themeProvider = context.watch<ThemeProvider>();
    final isDay = themeProvider.resolveIsDay(sensorIsDay: true);
    final textColor = isDay ? const Color(0xFF0F172A) : Colors.white;

    return Scaffold(
      backgroundColor: isDay ? const Color(0xFFF0F9FF) : const Color(0xFF0F172A),
      appBar: AppBar(
        title: Text('Order Details', style: TextStyle(color: textColor, fontWeight: FontWeight.w700)),
        iconTheme: IconThemeData(color: textColor),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          GlassCard(
            isDay: isDay,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(order.fullName, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: textColor)),
                const SizedBox(height: 4),
                Text(order.email, style: TextStyle(fontSize: 13, color: textColor.withValues(alpha: 0.6))),
                if (order.phone != null) Text(order.phone!, style: TextStyle(fontSize: 13, color: textColor.withValues(alpha: 0.6))),
                const SizedBox(height: 4),
                Text(
                  'Submitted ${DateFormat('MMM d, y').format(order.createdAt)}',
                  style: TextStyle(fontSize: 11.5, color: textColor.withValues(alpha: 0.5)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          GlassCard(
            isDay: isDay,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Progress', style: TextStyle(fontWeight: FontWeight.w700, color: textColor)),
                const SizedBox(height: 16),
                OrderProgressIndicator(status: order.status, isDay: isDay),
              ],
            ),
          ),
          const SizedBox(height: 16),
          GlassCard(
            isDay: isDay,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Timeline', style: TextStyle(fontWeight: FontWeight.w700, color: textColor)),
                const SizedBox(height: 14),
                OrderTimelineView(timeline: order.timeline, isDay: isDay),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
