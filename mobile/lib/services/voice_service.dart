import 'package:flutter_tts/flutter_tts.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;

/// Wraps Speech-To-Text (voice input) and Text-To-Speech (voice playback)
/// for the AI Assistant — a thin singleton service, matching the pattern
/// already used for `SocketService`/`ApiClient`.
class VoiceService {
  VoiceService._();
  static final VoiceService instance = VoiceService._();

  final stt.SpeechToText _speech = stt.SpeechToText();
  final FlutterTts _tts = FlutterTts();
  bool _speechInitialized = false;
  bool _ttsConfigured = false;
  void Function()? _onDone;

  bool get isListening => _speech.isListening;

  Future<bool> _ensureSpeechInitialized() async {
    if (_speechInitialized) return true;
    _speechInitialized = await _speech.initialize(
      onStatus: (status) {
        if (status == 'done' || status == 'notListening') {
          _onDone?.call();
        }
      },
    );
    return _speechInitialized;
  }

  Future<void> _ensureTtsConfigured() async {
    if (_ttsConfigured) return;
    await _tts.setSpeechRate(0.48);
    await _tts.setPitch(1.0);
    _ttsConfigured = true;
  }

  /// Starts listening; [onResult] is called with the live transcription as
  /// the user speaks, [onDone] once listening stops (silence or manual stop).
  Future<bool> startListening({
    required void Function(String text) onResult,
    required void Function() onDone,
  }) async {
    final available = await _ensureSpeechInitialized();
    if (!available) return false;
    _onDone = onDone;
    await _speech.listen(
      onResult: (result) => onResult(result.recognizedWords),
      listenOptions: stt.SpeechListenOptions(partialResults: true),
    );
    return true;
  }

  void stopListening() => _speech.stop();

  Future<void> speak(String markdownText) async {
    await _ensureTtsConfigured();
    final plain = _stripMarkdown(markdownText);
    await _tts.stop();
    await _tts.speak(plain);
  }

  Future<void> stopSpeaking() => _tts.stop();

  String _stripMarkdown(String text) {
    return text
        .replaceAll(RegExp(r'^#+\s*', multiLine: true), '')
        .replaceAllMapped(RegExp(r'\*\*(.*?)\*\*'), (m) => m.group(1) ?? '')
        .replaceAllMapped(RegExp(r'_(.*?)_'), (m) => m.group(1) ?? '')
        .replaceAll(RegExp(r'^-\s*', multiLine: true), '')
        .replaceAll('\n', '. ');
  }
}
