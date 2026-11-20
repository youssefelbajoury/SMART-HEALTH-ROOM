import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../models/chat_message.dart';
import '../services/storage_service.dart';

/// Mirrors `web/src/store/chatStore.ts`: `ask(question, answerFn)` pushes
/// the user message, flags typing, and after a fixed 550ms delay (a UX
/// pacing device, not real inference latency — there is no LLM call) pushes
/// the answer computed by `answerFn` (backed by `assistant_intents.dart`).
/// Conversation history is persisted locally so it survives app restarts.
class ChatProvider extends ChangeNotifier {
  List<ChatMessage> messages = [];
  bool isTyping = false;
  bool _loaded = false;

  Future<void> loadHistory() async {
    if (_loaded) return;
    _loaded = true;
    final json = await StorageService.instance.chatHistoryJson;
    if (json == null) return;
    try {
      final list = jsonDecode(json) as List;
      messages = list.map((e) => ChatMessage.fromJson(Map<String, dynamic>.from(e as Map))).toList();
      notifyListeners();
    } catch (_) {
      // Corrupted/older-format history — start fresh rather than crash.
    }
  }

  Future<void> ask(String question, String Function(String question) answerFn) async {
    final trimmed = question.trim();
    if (trimmed.isEmpty) return;

    final userMessage = ChatMessage(
      id: '${DateTime.now().microsecondsSinceEpoch}-u',
      text: trimmed,
      isUser: true,
      timestamp: DateTime.now(),
    );
    messages = [...messages, userMessage];
    isTyping = true;
    notifyListeners();

    await Future.delayed(const Duration(milliseconds: 550));

    final answer = answerFn(trimmed);
    final botMessage = ChatMessage(
      id: '${DateTime.now().microsecondsSinceEpoch}-a',
      text: answer,
      isUser: false,
      timestamp: DateTime.now(),
    );
    messages = [...messages, botMessage];
    isTyping = false;
    notifyListeners();
    _persist();
  }

  Future<void> clear() async {
    messages = [];
    notifyListeners();
    await StorageService.instance.clearChatHistory();
  }

  void _persist() {
    final json = jsonEncode(messages.map((m) => m.toJson()).toList());
    StorageService.instance.saveChatHistoryJson(json);
  }
}
