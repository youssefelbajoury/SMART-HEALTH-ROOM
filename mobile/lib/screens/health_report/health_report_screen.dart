import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:printing/printing.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/dashboard_insights.dart';
import '../../core/utils/health_report.dart';
import '../../providers/auth_provider.dart';
import '../../providers/emergency_provider.dart';
import '../../providers/sensor_provider.dart';
import '../../providers/weather_provider.dart';

/// Health Report — generates the exact same multi-section PDF as the web
/// app's Health & Environment Report (patient info, score breakdowns,
/// current readings, outdoor weather, predictive warning, recommendations,
/// emergency history, trend chart), using the same already-computed data.
/// `PdfPreview` (from the `printing` package) provides the in-app preview
/// and native share sheet; a custom action saves a copy to the device.
class HealthReportScreen extends StatefulWidget {
  const HealthReportScreen({super.key});

  @override
  State<HealthReportScreen> createState() => _HealthReportScreenState();
}

class _HealthReportScreenState extends State<HealthReportScreen> {
  late final Future<Uint8List> _pdfBytes = _generate();
  bool _saving = false;

  Future<Uint8List> _generate() async {
    final auth = context.read<AuthProvider>();
    final sensor = context.read<SensorProvider>();
    final emergency = context.read<EmergencyProvider>();
    final weather = context.read<WeatherProvider>();

    final data = sensor.data!;
    final insights = computeDashboardInsights(
      data: data,
      history: sensor.history,
      weather: weather.weather,
      outdoorAqi: weather.outdoorAqi,
      emergencyActive: emergency.active != null,
      userName: auth.user?.displayFirstName ?? 'there',
    );

    return buildHealthReportPdf(
      user: auth.user!,
      data: data,
      healthScore: insights.healthScore,
      roomQuality: insights.roomQuality,
      predictiveWarning: insights.predictiveWarning,
      recommendations: insights.recommendations,
      emergencyHistory: emergency.history,
      weather: weather.weather,
      trendHistory: sensor.history,
    );
  }

  Future<void> _saveToDevice(Uint8List bytes) async {
    setState(() => _saving = true);
    try {
      final fileName = 'health_report_${DateTime.now().millisecondsSinceEpoch}.pdf';
      // `Printing.sharePdf` handles the platform split internally (native
      // share sheet on Android/iOS, browser download on Web) — no
      // filesystem access needed, so this works identically everywhere.
      await Printing.sharePdf(bytes: bytes, filename: fileName);
      HapticFeedback.mediumImpact();
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final sensor = context.watch<SensorProvider>();

    if (sensor.data == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Health Report')),
        body: const Center(child: Text('No sensor data available yet.')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Health Report'),
        actions: [
          FutureBuilder<Uint8List>(
            future: _pdfBytes,
            builder: (context, snapshot) {
              if (!snapshot.hasData) return const SizedBox.shrink();
              return IconButton(
                icon: _saving
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.download_rounded),
                tooltip: 'Download',
                onPressed: _saving ? null : () => _saveToDevice(snapshot.data!),
              );
            },
          ),
        ],
      ),
      body: FutureBuilder<Uint8List>(
        future: _pdfBytes,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('Failed to generate report: ${snapshot.error}'));
          }
          final bytes = snapshot.data!;
          return PdfPreview(
            build: (format) async => bytes,
            allowPrinting: true,
            allowSharing: true,
            canChangeOrientation: false,
            canChangePageFormat: false,
            canDebug: false,
            pdfFileName: 'health_report.pdf',
            actionBarTheme: const PdfActionBarTheme(backgroundColor: AppColors.primary500, iconColor: Colors.white),
          );
        },
      ),
    );
  }
}
