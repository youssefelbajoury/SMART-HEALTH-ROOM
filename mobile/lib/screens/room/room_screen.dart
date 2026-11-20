import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/health_score.dart';
import '../../core/utils/page_transitions.dart';
import '../../core/utils/thresholds.dart';
import '../../providers/sensor_provider.dart';
import '../../providers/theme_provider.dart';
import '../../widgets/shimmer_placeholder.dart';
import '../sensors/sensors_screen.dart';
import 'widgets/remote_control_sheet.dart';
import 'widgets/room_status_tile.dart';

/// Interactive Room screen — live door/lamp/RGB/bed/sensor state, all
/// sourced from the same `SensorProvider.data` the Home screen already
/// keeps in sync via the `sensor-update` Socket.IO broadcast (the payload
/// carries actuator state alongside sensor readings, so no separate
/// "room state" event is needed).
class RoomScreen extends StatelessWidget {
  const RoomScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final sensor = context.watch<SensorProvider>();
    final themeProvider = context.watch<ThemeProvider>();
    final data = sensor.data;
    final isDay = themeProvider.resolveIsDay(sensorIsDay: data?.isDay ?? true);
    final textColor = isDay ? const Color(0xFF0F172A) : Colors.white;

    return Scaffold(
      backgroundColor: isDay ? const Color(0xFFF0F9FF) : const Color(0xFF0F172A),
      appBar: AppBar(
        title: Text('Room', style: TextStyle(color: textColor, fontWeight: FontWeight.w700)),
        iconTheme: IconThemeData(color: textColor),
      ),
      floatingActionButton: data == null
          ? null
          : FloatingActionButton.extended(
              onPressed: () {
                HapticFeedback.selectionClick();
                showRemoteControlSheet(context);
              },
              icon: const Icon(Icons.sports_esports_rounded),
              label: const Text('Remote Control'),
              backgroundColor: AppColors.primary500,
            ),
      body: data == null
          ? _buildLoading(isDay)
          : RefreshIndicator(
              onRefresh: () => sensor.refresh(),
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final crossAxisCount = constraints.maxWidth > 900 ? 4 : (constraints.maxWidth > 600 ? 3 : 2);
                  final tiles = [
                    RoomStatusTile(
                      heroTag: 'sensor-door',
                      icon: data.servo == 'ouvert' ? Icons.meeting_room_rounded : Icons.sensor_door_rounded,
                      label: 'Door',
                      value: data.servo == 'ouvert' ? 'Open' : 'Closed',
                      color: data.servo == 'ouvert' ? AppColors.warning : AppColors.fine,
                      isDay: isDay,
                      isBusy: sensor.isSendingCommand,
                      onTap: () => showRemoteControlSheet(context),
                    ),
                    RoomStatusTile(
                      icon: Icons.lightbulb_rounded,
                      label: 'Lamp',
                      value: data.lamp ? 'On' : 'Off',
                      color: data.lamp ? AppColors.warning : AppColors.secondary400,
                      isDay: isDay,
                      isBusy: sensor.isTogglingLamp,
                      onTap: () {
                        HapticFeedback.lightImpact();
                        context.read<SensorProvider>().toggleLamp();
                      },
                    ),
                    RoomStatusTile(
                      icon: Icons.color_lens_rounded,
                      label: 'RGB Light',
                      value: 'R${data.rgb.r} G${data.rgb.g} B${data.rgb.b}',
                      color: Color.fromARGB(255, data.rgb.r, data.rgb.g, data.rgb.b),
                      isDay: isDay,
                      onTap: () => showRemoteControlSheet(context),
                    ),
                    RoomStatusTile(
                      icon: Icons.bed_rounded,
                      label: 'Bed',
                      value: data.isOccupied ? 'Occupied' : 'Vacant',
                      subtitle: data.sleepScore != null ? 'Sleep score ${data.sleepScore!.round()}' : null,
                      color: data.isOccupied ? AppColors.sleepViolet : AppColors.secondary400,
                      isDay: isDay,
                    ),
                    RoomStatusTile(
                      heroTag: 'sensor-temperature',
                      icon: Icons.thermostat_rounded,
                      label: 'Temperature',
                      value: '${data.temperature.toStringAsFixed(1)}°C',
                      color: _levelColor(Thresholds.levelFor('temperature', data.temperature)),
                      isDay: isDay,
                      onTap: () => Navigator.of(context).push(fadeSlideRoute(const SensorsScreen())),
                    ),
                    RoomStatusTile(
                      heroTag: 'sensor-humidity',
                      icon: Icons.water_drop_rounded,
                      label: 'Humidity',
                      value: '${data.humidity.toStringAsFixed(0)}%',
                      color: _levelColor(Thresholds.levelFor('humidity', data.humidity)),
                      isDay: isDay,
                      onTap: () => Navigator.of(context).push(fadeSlideRoute(const SensorsScreen())),
                    ),
                    RoomStatusTile(
                      heroTag: 'sensor-gas',
                      icon: Icons.air_rounded,
                      label: 'Gas',
                      value: '${data.gas.toStringAsFixed(0)} ppm',
                      color: _levelColor(Thresholds.levelFor('gas', data.gas)),
                      isDay: isDay,
                      onTap: () => Navigator.of(context).push(fadeSlideRoute(const SensorsScreen())),
                    ),
                    RoomStatusTile(
                      heroTag: 'sensor-light',
                      icon: Icons.light_mode_rounded,
                      label: 'Light',
                      value: '${data.light.toStringAsFixed(0)} lx',
                      color: _levelColor(lightLevelFor(data.light)),
                      isDay: isDay,
                      onTap: () => Navigator.of(context).push(fadeSlideRoute(const SensorsScreen())),
                    ),
                    RoomStatusTile(
                      heroTag: 'sensor-sound',
                      icon: Icons.volume_up_rounded,
                      label: 'Sound',
                      value: '${data.soundLevel.toStringAsFixed(0)} dB',
                      color: _levelColor(Thresholds.levelFor('soundLevel', data.soundLevel)),
                      isDay: isDay,
                      onTap: () => Navigator.of(context).push(fadeSlideRoute(const SensorsScreen())),
                    ),
                  ];

                  return GridView.count(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 96),
                    crossAxisCount: crossAxisCount,
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 1.05,
                    children: tiles,
                  );
                },
              ),
            ),
    );
  }

  Color _levelColor(ThresholdLevel level) => switch (level) {
        ThresholdLevel.fine => AppColors.fine,
        ThresholdLevel.warning => AppColors.warning,
        ThresholdLevel.danger => AppColors.danger,
      };

  Widget _buildLoading(bool isDay) {
    return GridView.count(
      padding: const EdgeInsets.all(16),
      crossAxisCount: 2,
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.05,
      children: List.generate(8, (i) => ShimmerPlaceholder(isDay: isDay, height: 140)),
    );
  }
}
