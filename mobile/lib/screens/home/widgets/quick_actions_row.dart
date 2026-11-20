import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../widgets/stat_pill.dart';

/// Ported from the web dashboard's `QUICK_ACTIONS` — 4 pure-navigation
/// shortcuts, wired to their real, already-built destinations by both
/// callers (Home and Dashboard).
class QuickActionsRow extends StatelessWidget {
  final bool isDay;
  final VoidCallback onRemoteControl;
  final VoidCallback onEmergencies;
  final VoidCallback onAskAssistant;
  final VoidCallback onAnalytics;

  const QuickActionsRow({
    super.key,
    required this.isDay,
    required this.onRemoteControl,
    required this.onEmergencies,
    required this.onAskAssistant,
    required this.onAnalytics,
  });

  @override
  Widget build(BuildContext context) {
    final actions = [
      (Icons.auto_awesome_rounded, 'Ask Assistant', onAskAssistant),
      (Icons.bar_chart_rounded, 'Analytics', onAnalytics),
      (Icons.sports_esports_rounded, 'Remote Control', onRemoteControl),
      (Icons.warning_amber_rounded, 'Emergencies', onEmergencies),
    ];

    return SizedBox(
      height: 44,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: actions.length,
        separatorBuilder: (context, index) => const SizedBox(width: 10),
        itemBuilder: (context, i) {
          final (icon, label, onTap) = actions[i];
          return StatPill(
            icon: icon,
            label: label,
            color: isDay ? const Color(0xFF0369A1) : Colors.white,
            onTap: onTap,
          ).animate().fadeIn(delay: (i * 60).ms, duration: 300.ms);
        },
      ),
    );
  }
}
