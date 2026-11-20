import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../models/emergency.dart';

/// Vertical timeline of past emergencies — newest first, each node colored
/// by whether it's still active or was resolved.
class EmergencyTimeline extends StatelessWidget {
  final List<Emergency> history;
  final bool isDay;

  const EmergencyTimeline({super.key, required this.history, required this.isDay});

  @override
  Widget build(BuildContext context) {
    final textColor = isDay ? const Color(0xFF0F172A) : Colors.white;

    if (history.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 32),
        child: Center(
          child: Column(
            children: [
              Icon(Icons.verified_user_rounded, size: 44, color: textColor.withValues(alpha: 0.3)),
              const SizedBox(height: 12),
              Text('No emergencies recorded.', style: TextStyle(color: textColor.withValues(alpha: 0.6))),
            ],
          ),
        ),
      );
    }

    final sorted = [...history]..sort((a, b) => b.createdAt.compareTo(a.createdAt));

    return Column(
      children: sorted.asMap().entries.map((entry) {
        final i = entry.key;
        final e = entry.value;
        final isLast = i == sorted.length - 1;
        final color = e.isActive ? AppColors.danger : AppColors.fine;

        return IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Column(
                children: [
                  Container(
                    width: 12,
                    height: 12,
                    margin: const EdgeInsets.only(top: 4),
                    decoration: BoxDecoration(color: color, shape: BoxShape.circle),
                  ),
                  if (!isLast) Expanded(child: Container(width: 2, color: textColor.withValues(alpha: 0.12))),
                ],
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(e.message, style: TextStyle(fontWeight: FontWeight.w700, color: textColor, fontSize: 13.5)),
                      const SizedBox(height: 4),
                      Text(
                        '${e.isActive ? "Active" : "Resolved"} · ${DateFormat('MMM d, y – HH:mm').format(e.createdAt)}',
                        style: TextStyle(fontSize: 11.5, color: color),
                      ),
                      if (e.triggeredSensors.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          e.triggeredSensors.map((s) => '${s.sensor}: ${s.value.toStringAsFixed(0)}').join(' · '),
                          style: TextStyle(fontSize: 11, color: textColor.withValues(alpha: 0.5)),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        ).animate().fadeIn(delay: (i * 40).ms, duration: 300.ms).slideX(begin: 0.03, end: 0);
      }).toList(),
    );
  }
}
