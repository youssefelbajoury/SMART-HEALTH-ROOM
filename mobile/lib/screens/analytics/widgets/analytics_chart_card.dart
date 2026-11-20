import 'dart:ui' as ui;
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';
import '../../../widgets/glass_card.dart';

/// A single trend chart — line chart with pan/zoom (`InteractiveViewer`) and
/// a PNG export button (captures the chart via `RepaintBoundary`, matching
/// the web Analytics page's `toBase64Image()` chart export).
class AnalyticsChartCard extends StatefulWidget {
  final String title;
  final List<FlSpot> spots;
  final Color color;
  final String unit;
  final bool isDay;
  final double? minY;
  final double? maxY;

  const AnalyticsChartCard({
    super.key,
    required this.title,
    required this.spots,
    required this.color,
    required this.unit,
    required this.isDay,
    this.minY,
    this.maxY,
  });

  @override
  State<AnalyticsChartCard> createState() => _AnalyticsChartCardState();
}

class _AnalyticsChartCardState extends State<AnalyticsChartCard> {
  final _repaintKey = GlobalKey();
  bool _exporting = false;

  Future<void> _exportPng() async {
    setState(() => _exporting = true);
    try {
      final boundary = _repaintKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;
      if (boundary == null) return;
      final image = await boundary.toImage(pixelRatio: 3);
      final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      if (byteData == null) return;
      final bytes = byteData.buffer.asUint8List();

      final fileName = '${widget.title.toLowerCase().replaceAll(' ', '_')}_${DateTime.now().millisecondsSinceEpoch}.png';
      // `XFile.fromData` shares the PNG straight from memory — no
      // filesystem access needed, so this works identically on Android and
      // Web (which has no local file path to construct a plain `XFile` from).
      await Share.shareXFiles(
        [XFile.fromData(bytes, mimeType: 'image/png', name: fileName)],
        text: '${widget.title} chart',
      );
    } finally {
      if (mounted) setState(() => _exporting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final textColor = widget.isDay ? const Color(0xFF0F172A) : Colors.white;

    return GlassCard(
      isDay: widget.isDay,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(child: Text(widget.title, style: TextStyle(fontWeight: FontWeight.w700, color: textColor))),
              IconButton(
                onPressed: widget.spots.isEmpty || _exporting ? null : () {
                  HapticFeedback.lightImpact();
                  _exportPng();
                },
                icon: _exporting
                    ? SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: textColor))
                    : Icon(Icons.ios_share_rounded, size: 18, color: textColor.withValues(alpha: 0.7)),
                tooltip: 'Export as PNG',
              ),
            ],
          ),
          const SizedBox(height: 4),
          if (widget.spots.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 24),
              child: Center(child: Text('No data for this range yet.', style: TextStyle(color: textColor.withValues(alpha: 0.5)))),
            )
          else
            RepaintBoundary(
              key: _repaintKey,
              child: Container(
                color: widget.isDay ? Colors.white : const Color(0xFF0F172A),
                padding: const EdgeInsets.only(top: 8, right: 12),
                height: 180,
                child: InteractiveViewer(
                  panEnabled: true,
                  scaleEnabled: true,
                  minScale: 1,
                  maxScale: 4,
                  child: LineChart(
                    LineChartData(
                      minY: widget.minY,
                      maxY: widget.maxY,
                      gridData: FlGridData(
                        show: true,
                        drawVerticalLine: false,
                        getDrawingHorizontalLine: (_) => FlLine(color: textColor.withValues(alpha: 0.08), strokeWidth: 1),
                      ),
                      borderData: FlBorderData(show: false),
                      titlesData: FlTitlesData(
                        topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        bottomTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        leftTitles: AxisTitles(
                          sideTitles: SideTitles(
                            showTitles: true,
                            reservedSize: 34,
                            getTitlesWidget: (value, meta) => Text(
                              value.toStringAsFixed(0),
                              style: TextStyle(fontSize: 9, color: textColor.withValues(alpha: 0.5)),
                            ),
                          ),
                        ),
                      ),
                      lineTouchData: LineTouchData(
                        touchTooltipData: LineTouchTooltipData(
                          getTooltipItems: (spots) => spots
                              .map((s) => LineTooltipItem('${s.y.toStringAsFixed(1)}${widget.unit}', TextStyle(color: widget.color, fontWeight: FontWeight.w700)))
                              .toList(),
                        ),
                      ),
                      lineBarsData: [
                        LineChartBarData(
                          spots: widget.spots,
                          isCurved: true,
                          color: widget.color,
                          barWidth: 2.2,
                          dotData: const FlDotData(show: false),
                          belowBarData: BarAreaData(show: true, color: widget.color.withValues(alpha: 0.12)),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
