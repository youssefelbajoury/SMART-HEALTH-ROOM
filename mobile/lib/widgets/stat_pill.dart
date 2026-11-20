import 'package:flutter/material.dart';

/// The mobile equivalent of the web dashboard's glass "pill" badges used in
/// the hero/assistant/quick-actions rows.
class StatPill extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback? onTap;

  const StatPill({super.key, required this.icon, required this.label, required this.color, this.onTap});

  @override
  Widget build(BuildContext context) {
    final content = Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 6),
          Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w600, fontSize: 13)),
        ],
      ),
    );
    if (onTap == null) return content;
    return InkWell(borderRadius: BorderRadius.circular(999), onTap: onTap, child: content);
  }
}
