import 'package:flutter/material.dart';

/// Renders the deliberately-constrained Markdown subset the assistant
/// engine produces (`##` headers, `-` bullets, `**bold**`, `_italic_`) —
/// the Flutter port of the web app's hand-rolled `MarkdownLite` component.
/// No full Markdown package is used, matching the original's intentionally
/// narrow feature set.
class MarkdownLite extends StatelessWidget {
  final String text;
  final Color color;

  const MarkdownLite({super.key, required this.text, required this.color});

  @override
  Widget build(BuildContext context) {
    final lines = text.split('\n').where((l) => l.trim().isNotEmpty).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: lines.map((line) {
        final trimmed = line.trim();
        if (trimmed.startsWith('## ')) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 4, top: 2),
            child: Text(
              trimmed.substring(3),
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: color),
            ),
          );
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 3, left: 4),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('•  ', style: TextStyle(color: color, fontWeight: FontWeight.w700)),
                Expanded(child: _RichInline(text: trimmed.substring(2), color: color)),
              ],
            ),
          );
        }
        return Padding(
          padding: const EdgeInsets.only(bottom: 4),
          child: _RichInline(text: trimmed, color: color),
        );
      }).toList(),
    );
  }
}

/// Parses `**bold**` and `_italic_` inline spans within a single line.
class _RichInline extends StatelessWidget {
  final String text;
  final Color color;

  const _RichInline({required this.text, required this.color});

  @override
  Widget build(BuildContext context) {
    final spans = <TextSpan>[];
    final pattern = RegExp(r'\*\*(.+?)\*\*|_(.+?)_');
    var lastEnd = 0;

    for (final match in pattern.allMatches(text)) {
      if (match.start > lastEnd) {
        spans.add(TextSpan(text: text.substring(lastEnd, match.start)));
      }
      final bold = match.group(1);
      if (bold != null) {
        spans.add(TextSpan(text: bold, style: const TextStyle(fontWeight: FontWeight.w800)));
      } else {
        spans.add(TextSpan(text: match.group(2), style: const TextStyle(fontStyle: FontStyle.italic)));
      }
      lastEnd = match.end;
    }
    if (lastEnd < text.length) {
      spans.add(TextSpan(text: text.substring(lastEnd)));
    }

    return RichText(
      text: TextSpan(style: TextStyle(fontSize: 13.5, height: 1.4, color: color), children: spans),
    );
  }
}
