import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';

/// Loading-state shimmer for cards, matching the web dashboard's skeleton
/// loaders shown while a widget's data source hasn't resolved yet.
class ShimmerPlaceholder extends StatelessWidget {
  final double height;
  final double? width;
  final BorderRadius borderRadius;
  final bool isDay;

  const ShimmerPlaceholder({
    super.key,
    this.height = 20,
    this.width,
    this.borderRadius = const BorderRadius.all(Radius.circular(10)),
    required this.isDay,
  });

  @override
  Widget build(BuildContext context) {
    final base = isDay ? Colors.grey.shade300 : Colors.white.withValues(alpha: 0.08);
    final highlight = isDay ? Colors.grey.shade100 : Colors.white.withValues(alpha: 0.18);
    return Shimmer.fromColors(
      baseColor: base,
      highlightColor: highlight,
      child: Container(
        height: height,
        width: width,
        decoration: BoxDecoration(color: base, borderRadius: borderRadius),
      ),
    );
  }
}
