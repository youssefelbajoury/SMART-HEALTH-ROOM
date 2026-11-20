import 'dart:typed_data';
import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import '../../models/emergency.dart';
import '../../models/sensor_data.dart';
import '../../models/user.dart';
import '../../models/weather.dart';
import 'health_score.dart';
import 'room_quality.dart';
import 'predictive_warning.dart';
import 'smart_assistant.dart';

/// Ports the web app's Health & Environment PDF report (`healthReport.ts`):
/// patient info, score breakdowns, current readings, outdoor weather,
/// predictive warning, recommendations table, emergency history, and a
/// hand-drawn (vector, not a scraped screenshot) trend chart — same data,
/// same sections, rendered with Dart's `pdf` package since jsPDF is
/// JS-only. A pure function of already-computed data, exactly like the
/// original.
const _brandColor = PdfColor.fromInt(0xFF0EA5E9);
const _darkColor = PdfColor.fromInt(0xFF0F172A);
const _mutedColor = PdfColor.fromInt(0xFF64748B);

Future<Uint8List> buildHealthReportPdf({
  required AppUser user,
  required SensorData data,
  required HealthScoreResult healthScore,
  required RoomQualityResult roomQuality,
  required PredictiveWarning? predictiveWarning,
  required List<AssistantRecommendation> recommendations,
  required List<Emergency> emergencyHistory,
  required WeatherReading? weather,
  required List<SensorData> trendHistory,
}) async {
  final doc = pw.Document();

  doc.addPage(
    pw.MultiPage(
      pageFormat: PdfPageFormat.a4,
      header: (context) => _buildHeader(context),
      footer: (context) => _buildFooter(context),
      build: (context) => [
        _buildPatientInfo(user),
        pw.SizedBox(height: 16),
        _buildScoreSection(healthScore, roomQuality),
        pw.SizedBox(height: 16),
        _buildCurrentReadings(data),
        pw.SizedBox(height: 16),
        if (weather != null) ...[_buildWeatherSection(weather), pw.SizedBox(height: 16)],
        if (predictiveWarning != null) ...[_buildPredictiveWarning(predictiveWarning), pw.SizedBox(height: 16)],
        _buildRecommendationsTable(recommendations),
        pw.SizedBox(height: 16),
        _buildEmergencyHistoryTable(emergencyHistory),
        pw.SizedBox(height: 16),
        _buildTrendChart(trendHistory),
      ],
    ),
  );

  return doc.save();
}

pw.Widget _buildHeader(pw.Context context) {
  return pw.Column(
    children: [
      pw.Row(
        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
        children: [
          pw.Text(
            'Smart Health Room',
            style: pw.TextStyle(fontSize: 18, fontWeight: pw.FontWeight.bold, color: _brandColor),
          ),
          pw.Text(
            'Health & Environment Report',
            style: pw.TextStyle(fontSize: 11, color: _mutedColor),
          ),
        ],
      ),
      pw.SizedBox(height: 6),
      pw.Container(height: 2, color: _brandColor),
      pw.SizedBox(height: 12),
    ],
  );
}

pw.Widget _buildFooter(pw.Context context) {
  return pw.Column(
    children: [
      pw.Divider(color: _mutedColor, thickness: 0.5),
      pw.Row(
        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
        children: [
          pw.Text(
            'Generated ${DateFormat('MMM d, y – HH:mm').format(DateTime.now())}',
            style: pw.TextStyle(fontSize: 8, color: _mutedColor),
          ),
          pw.Text('Page ${context.pageNumber} of ${context.pagesCount}', style: pw.TextStyle(fontSize: 8, color: _mutedColor)),
        ],
      ),
    ],
  );
}

pw.Widget _buildPatientInfo(AppUser user) {
  return pw.Container(
    padding: const pw.EdgeInsets.all(12),
    decoration: pw.BoxDecoration(borderRadius: pw.BorderRadius.circular(8), color: PdfColors.grey100),
    child: pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Text('Patient Information', style: pw.TextStyle(fontSize: 13, fontWeight: pw.FontWeight.bold, color: _darkColor)),
        pw.SizedBox(height: 6),
        pw.Text('Name: ${user.name}', style: const pw.TextStyle(fontSize: 10)),
        pw.Text('Email: ${user.email}', style: const pw.TextStyle(fontSize: 10)),
        if (user.deviceId != null) pw.Text('Device ID: ${user.deviceId}', style: const pw.TextStyle(fontSize: 10)),
      ],
    ),
  );
}

pw.Widget _buildScoreSection(HealthScoreResult health, RoomQualityResult quality) {
  return pw.Row(
    crossAxisAlignment: pw.CrossAxisAlignment.start,
    children: [
      pw.Expanded(
        child: pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Text('Health Score: ${health.score} (${health.status})',
                style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold, color: _brandColor)),
            pw.SizedBox(height: 4),
            ...health.breakdown.map((b) => pw.Text('- ${b.label}: ${b.score}/100', style: const pw.TextStyle(fontSize: 9))),
          ],
        ),
      ),
      pw.SizedBox(width: 16),
      pw.Expanded(
        child: pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Text('Room Quality: ${quality.overall}%',
                style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold, color: _brandColor)),
            pw.SizedBox(height: 4),
            pw.Text('- Comfort: ${quality.comfort}%', style: const pw.TextStyle(fontSize: 9)),
            pw.Text('- Air Quality: ${quality.airQuality}%', style: const pw.TextStyle(fontSize: 9)),
            pw.Text('- Safety: ${quality.safety}%', style: const pw.TextStyle(fontSize: 9)),
            pw.Text('- Energy Efficiency: ${quality.energyEfficiency}%', style: const pw.TextStyle(fontSize: 9)),
          ],
        ),
      ),
    ],
  );
}

pw.Widget _buildCurrentReadings(SensorData data) {
  final rows = [
    ['Temperature', '${data.temperature.toStringAsFixed(1)}°C'],
    ['Humidity', '${data.humidity.toStringAsFixed(0)}%'],
    ['Gas', '${data.gas.toStringAsFixed(0)} ppm'],
    ['Sound Level', '${data.soundLevel.toStringAsFixed(0)} dB'],
    ['Light', '${data.light.toStringAsFixed(0)} lx'],
    ['Bed', data.isOccupied ? 'Occupied' : 'Vacant'],
  ];
  return pw.Column(
    crossAxisAlignment: pw.CrossAxisAlignment.start,
    children: [
      pw.Text('Current Readings', style: pw.TextStyle(fontSize: 13, fontWeight: pw.FontWeight.bold, color: _darkColor)),
      pw.SizedBox(height: 6),
      pw.Table(
        border: pw.TableBorder.all(color: PdfColors.grey300, width: 0.5),
        children: rows
            .map((r) => pw.TableRow(children: [
                  pw.Padding(padding: const pw.EdgeInsets.all(6), child: pw.Text(r[0], style: const pw.TextStyle(fontSize: 9))),
                  pw.Padding(
                      padding: const pw.EdgeInsets.all(6),
                      child: pw.Text(r[1], style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold))),
                ]))
            .toList(),
      ),
    ],
  );
}

pw.Widget _buildWeatherSection(WeatherReading weather) {
  return pw.Column(
    crossAxisAlignment: pw.CrossAxisAlignment.start,
    children: [
      pw.Text('Outdoor Weather', style: pw.TextStyle(fontSize: 13, fontWeight: pw.FontWeight.bold, color: _darkColor)),
      pw.SizedBox(height: 6),
      pw.Text(
        '${weather.temperature.toStringAsFixed(1)}°C, ${weather.label} — UV index ${weather.uvIndex.toStringAsFixed(0)}'
        '${weather.sunrise != null ? ', sunrise ${DateFormat('HH:mm').format(weather.sunrise!)}' : ''}'
        '${weather.sunset != null ? ', sunset ${DateFormat('HH:mm').format(weather.sunset!)}' : ''}',
        style: const pw.TextStyle(fontSize: 9),
      ),
    ],
  );
}

pw.Widget _buildPredictiveWarning(PredictiveWarning warning) {
  return pw.Container(
    padding: const pw.EdgeInsets.all(10),
    decoration: pw.BoxDecoration(
      color: PdfColors.orange50,
      border: pw.Border.all(color: PdfColors.orange300),
      borderRadius: pw.BorderRadius.circular(6),
    ),
    child: pw.Text('Predictive Warning: ${warning.message}',
        style: pw.TextStyle(fontSize: 9.5, color: PdfColors.orange900, fontWeight: pw.FontWeight.bold)),
  );
}

pw.Widget _buildRecommendationsTable(List<AssistantRecommendation> recommendations) {
  return pw.Column(
    crossAxisAlignment: pw.CrossAxisAlignment.start,
    children: [
      pw.Text('Recommendations', style: pw.TextStyle(fontSize: 13, fontWeight: pw.FontWeight.bold, color: _darkColor)),
      pw.SizedBox(height: 6),
      if (recommendations.isEmpty)
        pw.Text('No active recommendations.', style: const pw.TextStyle(fontSize: 9))
      else
        pw.Table(
          border: pw.TableBorder.all(color: PdfColors.grey300, width: 0.5),
          columnWidths: const {0: pw.FlexColumnWidth(3), 1: pw.FlexColumnWidth(1), 2: pw.FlexColumnWidth(1)},
          children: [
            pw.TableRow(
              decoration: const pw.BoxDecoration(color: PdfColors.grey200),
              children: ['Message', 'Severity', 'Confidence']
                  .map((h) => pw.Padding(
                        padding: const pw.EdgeInsets.all(6),
                        child: pw.Text(h, style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold)),
                      ))
                  .toList(),
            ),
            ...recommendations.map((r) => pw.TableRow(children: [
                  pw.Padding(padding: const pw.EdgeInsets.all(6), child: pw.Text(r.message, style: const pw.TextStyle(fontSize: 8.5))),
                  pw.Padding(padding: const pw.EdgeInsets.all(6), child: pw.Text(r.severity.name, style: const pw.TextStyle(fontSize: 8.5))),
                  pw.Padding(padding: const pw.EdgeInsets.all(6), child: pw.Text('${r.confidence}%', style: const pw.TextStyle(fontSize: 8.5))),
                ])),
          ],
        ),
    ],
  );
}

pw.Widget _buildEmergencyHistoryTable(List<Emergency> history) {
  final recent = history.take(10).toList();
  return pw.Column(
    crossAxisAlignment: pw.CrossAxisAlignment.start,
    children: [
      pw.Text('Emergency History', style: pw.TextStyle(fontSize: 13, fontWeight: pw.FontWeight.bold, color: _darkColor)),
      pw.SizedBox(height: 6),
      if (recent.isEmpty)
        pw.Text('No emergencies recorded.', style: const pw.TextStyle(fontSize: 9))
      else
        pw.Table(
          border: pw.TableBorder.all(color: PdfColors.grey300, width: 0.5),
          children: [
            pw.TableRow(
              decoration: const pw.BoxDecoration(color: PdfColors.grey200),
              children: ['Date', 'Message', 'Status']
                  .map((h) => pw.Padding(
                        padding: const pw.EdgeInsets.all(6),
                        child: pw.Text(h, style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold)),
                      ))
                  .toList(),
            ),
            ...recent.map((e) => pw.TableRow(children: [
                  pw.Padding(
                      padding: const pw.EdgeInsets.all(6),
                      child: pw.Text(DateFormat('MMM d, HH:mm').format(e.createdAt), style: const pw.TextStyle(fontSize: 8.5))),
                  pw.Padding(padding: const pw.EdgeInsets.all(6), child: pw.Text(e.message, style: const pw.TextStyle(fontSize: 8.5))),
                  pw.Padding(
                      padding: const pw.EdgeInsets.all(6),
                      child: pw.Text(e.isActive ? 'Active' : 'Resolved', style: const pw.TextStyle(fontSize: 8.5))),
                ])),
          ],
        ),
    ],
  );
}

/// Hand-drawn (vector) temperature trend — deliberately not a scraped
/// screenshot, mirroring the web report's own `jsPDF` vector-drawn chart.
pw.Widget _buildTrendChart(List<SensorData> history) {
  return pw.Column(
    crossAxisAlignment: pw.CrossAxisAlignment.start,
    children: [
      pw.Text('Temperature Trend', style: pw.TextStyle(fontSize: 13, fontWeight: pw.FontWeight.bold, color: _darkColor)),
      pw.SizedBox(height: 6),
      if (history.length < 2)
        pw.Text('Not enough data to draw a trend.', style: const pw.TextStyle(fontSize: 9))
      else
        pw.CustomPaint(
          size: const PdfPoint(480, 140),
          painter: (canvas, size) {
            final values = history.map((d) => d.temperature).toList();
            final minV = values.reduce((a, b) => a < b ? a : b);
            final maxV = values.reduce((a, b) => a > b ? a : b);
            final range = (maxV - minV).abs() < 0.01 ? 1.0 : (maxV - minV);
            const padding = 20.0;
            final chartW = size.x - padding * 2;
            final chartH = size.y - padding * 2;

            canvas
              ..setStrokeColor(PdfColors.grey400)
              ..setLineWidth(0.5)
              ..drawLine(padding, padding, padding, size.y - padding)
              ..drawLine(padding, size.y - padding, size.x - padding, size.y - padding)
              ..strokePath();

            canvas.setStrokeColor(_brandColor);
            canvas.setLineWidth(1.2);
            for (var i = 0; i < values.length; i++) {
              final x = padding + (i / (values.length - 1)) * chartW;
              final y = size.y - padding - ((values[i] - minV) / range) * chartH;
              if (i == 0) {
                canvas.moveTo(x, y);
              } else {
                canvas.lineTo(x, y);
              }
            }
            canvas.strokePath();
          },
        ),
    ],
  );
}
