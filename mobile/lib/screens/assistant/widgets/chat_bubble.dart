import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../models/chat_message.dart';
import '../../../widgets/markdown_lite.dart';

/// A single chat bubble — user messages right-aligned/solid, assistant
/// messages left-aligned/glass with rendered `MarkdownLite` and an optional
/// "speak" (Text-To-Speech) action.
class ChatBubble extends StatelessWidget {
  final ChatMessage message;
  final bool isDay;
  final VoidCallback? onSpeak;
  final bool isSpeaking;

  const ChatBubble({super.key, required this.message, required this.isDay, this.onSpeak, this.isSpeaking = false});

  @override
  Widget build(BuildContext context) {
    final isUser = message.isUser;
    final textColor = isUser ? Colors.white : (isDay ? const Color(0xFF0F172A) : Colors.white);
    final bubbleColor = isUser
        ? AppColors.primary500
        : (isDay ? Colors.white : Colors.white.withValues(alpha: 0.06));

    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 6),
        padding: const EdgeInsets.all(14),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
        decoration: BoxDecoration(
          color: bubbleColor,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(isUser ? 16 : 4),
            bottomRight: Radius.circular(isUser ? 4 : 16),
          ),
          border: isUser ? null : Border.all(color: isDay ? const Color(0xFFE2E8F0) : Colors.white12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            isUser
                ? Text(message.text, style: TextStyle(color: textColor, fontSize: 14, height: 1.4))
                : MarkdownLite(text: message.text, color: textColor),
            const SizedBox(height: 6),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  DateFormat('HH:mm').format(message.timestamp),
                  style: TextStyle(fontSize: 10.5, color: textColor.withValues(alpha: 0.55)),
                ),
                if (!isUser && onSpeak != null) ...[
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: onSpeak,
                    child: Icon(
                      isSpeaking ? Icons.volume_up_rounded : Icons.volume_up_outlined,
                      size: 15,
                      color: isSpeaking ? AppColors.primary500 : textColor.withValues(alpha: 0.5),
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    ).animate().fadeIn(duration: 250.ms).slideY(begin: 0.08, end: 0);
  }
}
