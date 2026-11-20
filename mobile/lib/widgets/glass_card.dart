import 'dart:ui';
import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';

/// The mobile equivalent of the web dashboard's `.dash-glass` card system —
/// a frosted, translucent surface whose tint flips between the Night
/// (default) and Day palette.
class GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final bool isDay;
  final VoidCallback? onTap;
  final Color? tint;

  const GlassCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(18),
    required this.isDay,
    this.onTap,
    this.tint,
  });

  @override
  Widget build(BuildContext context) {
    final bg = tint ?? (isDay ? AppColors.glassDayBg : AppColors.glassNightBg);
    final border = isDay ? AppColors.glassDayBorder : AppColors.glassNightBorder;

    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            child: Container(
              padding: padding,
              decoration: BoxDecoration(
                color: bg,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: border),
                boxShadow: [
                  BoxShadow(
                    color: (isDay ? Colors.black : Colors.black).withValues(alpha: isDay ? 0.05 : 0.25),
                    blurRadius: 24,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: child,
            ),
          ),
        ),
      ),
    );
  }
}
