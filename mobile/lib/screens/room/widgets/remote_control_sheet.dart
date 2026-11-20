import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../providers/sensor_provider.dart';

const _rgbPresets = <(String, int, int, int)>[
  ('Red', 255, 0, 0),
  ('Green', 0, 255, 0),
  ('Blue', 0, 0, 255),
  ('White', 255, 255, 255),
  ('Amber', 255, 165, 0),
  ('Purple', 168, 85, 247),
];

/// Native mobile equivalent of the web dashboard's Remote Control page —
/// same 4 backend endpoints (`/sensors/{lamp,door,buzzer}/toggle`, `/sensors/rgb`),
/// surfaced as a bottom sheet instead of a full page since only Home/Dashboard/Room
/// need to reach it this session.
Future<void> showRemoteControlSheet(BuildContext context) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) => const _RemoteControlSheet(),
  );
}

class _RemoteControlSheet extends StatelessWidget {
  const _RemoteControlSheet();

  Future<void> _confirmAndRun(BuildContext context, {required String title, required String message, required Future<void> Function() action}) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.of(context).pop(true), child: const Text('Confirm')),
        ],
      ),
    );
    if (confirmed == true) {
      HapticFeedback.mediumImpact();
      await action();
    }
  }

  @override
  Widget build(BuildContext context) {
    final sensor = context.watch<SensorProvider>();
    final data = sensor.data;

    return Container(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 12,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      decoration: const BoxDecoration(
        color: AppColors.secondary900,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(999)),
          ),
          const SizedBox(height: 16),
          const Align(
            alignment: Alignment.centerLeft,
            child: Text('Remote Control', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 18)),
          ),
          const SizedBox(height: 20),
          if (data == null)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: Text('Waiting for device data…', style: TextStyle(color: Colors.white54)),
            )
          else ...[
            _ToggleRow(
              icon: Icons.sensor_door_rounded,
              label: 'Door',
              isOn: data.servo == 'ouvert',
              onLabel: 'Open',
              offLabel: 'Closed',
              isBusy: sensor.isSendingCommand,
              onTap: () => _confirmAndRun(
                context,
                title: data.servo == 'ouvert' ? 'Close the door?' : 'Open the door?',
                message: 'This sends a real command to the device.',
                action: () => context.read<SensorProvider>().toggleDoor(),
              ),
            ),
            const SizedBox(height: 12),
            _ToggleRow(
              icon: Icons.lightbulb_rounded,
              label: 'Lamp',
              isOn: data.lamp,
              onLabel: 'On',
              offLabel: 'Off',
              isBusy: sensor.isTogglingLamp,
              onTap: () {
                HapticFeedback.lightImpact();
                context.read<SensorProvider>().toggleLamp();
              },
            ),
            const SizedBox(height: 12),
            _ToggleRow(
              icon: Icons.campaign_rounded,
              label: 'Buzzer',
              isOn: data.buzzer,
              onLabel: 'Sounding',
              offLabel: 'Silent',
              isBusy: sensor.isSendingCommand,
              onTap: () => _confirmAndRun(
                context,
                title: 'Sound the buzzer?',
                message: 'This will trigger the physical alarm buzzer.',
                action: () => context.read<SensorProvider>().toggleBuzzer(),
              ),
            ),
            const SizedBox(height: 20),
            const Align(
              alignment: Alignment.centerLeft,
              child: Text('RGB Status Light', style: TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w600)),
            ),
            const SizedBox(height: 12),
            Row(
              children: _rgbPresets.map((preset) {
                final (_, r, g, b) = preset;
                final color = Color.fromARGB(255, r, g, b);
                final isActive = data.rgb.r == r && data.rgb.g == g && data.rgb.b == b;
                return Expanded(
                  child: GestureDetector(
                    onTap: () {
                      HapticFeedback.selectionClick();
                      context.read<SensorProvider>().setRgb(r: r, g: g, b: b);
                    },
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      height: 40,
                      decoration: BoxDecoration(
                        color: color,
                        shape: BoxShape.circle,
                        border: Border.all(color: isActive ? Colors.white : Colors.white24, width: isActive ? 3 : 1),
                      ),
                      child: isActive ? const Icon(Icons.check, size: 18, color: Colors.black87) : null,
                    ),
                  ),
                );
              }).toList(),
            ),
          ],
        ],
      ),
    );
  }
}

class _ToggleRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isOn;
  final String onLabel;
  final String offLabel;
  final bool isBusy;
  final VoidCallback onTap;

  const _ToggleRow({
    required this.icon,
    required this.label,
    required this.isOn,
    required this.onLabel,
    required this.offLabel,
    required this.isBusy,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final color = isOn ? AppColors.fine : Colors.white38;
    return Material(
      color: Colors.white.withValues(alpha: 0.05),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: isBusy ? null : onTap,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              Icon(icon, color: color),
              const SizedBox(width: 12),
              Expanded(
                child: Text(label, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
              ),
              if (isBusy)
                const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
              else
                Text(isOn ? onLabel : offLabel, style: TextStyle(color: color, fontWeight: FontWeight.w600)),
              const SizedBox(width: 8),
              Switch(value: isOn, onChanged: isBusy ? null : (_) => onTap(), activeThumbColor: AppColors.fine),
            ],
          ),
        ),
      ),
    );
  }
}
