import 'package:socket_io_client/socket_io_client.dart' as io;
import '../core/config/api_config.dart';

/// Wraps the same Socket.IO server the web dashboard connects to
/// (`websocket.service.ts`'s one-room-per-user model). A client `emit`s
/// `register` with the Mongo user id; the backend then targets that room
/// with `sensor-update`, `new-alert`, `emergency:*`, `new-log`, and the
/// `*-command` actuator events — no new events are introduced here.
class SocketService {
  SocketService._();
  static final SocketService instance = SocketService._();

  io.Socket? _socket;
  String? _registeredUserId;

  bool get isConnected => _socket?.connected ?? false;

  void connect(String userId) {
    if (_socket != null && _registeredUserId == userId) {
      if (!isConnected) _socket!.connect();
      return;
    }
    disconnect();
    _registeredUserId = userId;
    _socket = io.io(
      ApiConfig.socketUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .enableReconnection()
          .setReconnectionDelay(2000)
          .setReconnectionDelayMax(60000)
          .build(),
    );
    _socket!.onConnect((_) => _socket!.emit('register', userId));
    _socket!.connect();
  }

  void on(String event, void Function(dynamic data) handler) {
    _socket?.on(event, handler);
  }

  void off(String event) {
    _socket?.off(event);
  }

  void disconnect() {
    _socket?.dispose();
    _socket = null;
    _registeredUserId = null;
  }
}
