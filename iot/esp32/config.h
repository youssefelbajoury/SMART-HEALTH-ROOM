/*
  =====================================================================
  SMART HEALTH ROOM - ESP32 GATEWAY - CONFIGURATION
  =====================================================================
  Every configurable value lives here: Wi-Fi, backend, device identity,
  timing/reconnect behaviour. Fill in the values for your network and
  account before flashing.
*/
#ifndef SMART_ROOM_ESP32_CONFIG_H
#define SMART_ROOM_ESP32_CONFIG_H

// ---------------------------------------------------------------
// FIRMWARE IDENTITY
// ---------------------------------------------------------------
#define FIRMWARE_VERSION   "2.0.0"
#define DEVICE_NAME        "SmartHealthRoom-ESP32"
#define DEVICE_ID          "ESP32-MOHAMED-001"

// ---------------------------------------------------------------
// WIFI
// ---------------------------------------------------------------
#define WIFI_SSID           "REF"
#define WIFI_PASSWORD       "17062005"
#define WIFI_CONNECT_TIMEOUT_MS   15000UL
#define WIFI_RECONNECT_BASE_MS     2000UL   // first retry delay
#define WIFI_RECONNECT_MAX_MS     60000UL   // cap for exponential backoff

// ---------------------------------------------------------------
// BACKEND (HTTP REST)
// ---------------------------------------------------------------
#define SERVER_HOST   "192.168.43.153"
#define SERVER_PORT   5000

#define ENDPOINT_SENSORS "/api/v1/sensors/data"
#define ENDPOINT_ACCESS  "/api/v1/access"
#define ENDPOINT_ALERTS  "/api/v1/alerts"
#define ENDPOINT_BED     "/api/v1/bed"

#define HTTP_TIMEOUT_MS  5000UL

// ---------------------------------------------------------------
// BACKEND (Socket.IO — real-time commands)
// The backend broadcasts commands to a Socket.IO room named after the
// Mongo user _id (see backend/src/services/websocket.service.ts). The
// device only knows its deviceId, not that Mongo id, so it must be
// provisioned here manually — copy it from the account/admin panel.
// Required for remote control (door/lamp/rgb/buzzer/emergency) to work.
// ---------------------------------------------------------------
#define BACKEND_USER_ID "6a59414b34a4a42cf967a1ac"

#define SOCKETIO_PATH              "/socket.io/?EIO=4"
#define SOCKETIO_RECONNECT_BASE_MS  2000UL
#define SOCKETIO_RECONNECT_MAX_MS  60000UL

// ---------------------------------------------------------------
// UART TO ARDUINO MEGA
// ---------------------------------------------------------------
#define RXD2 16
#define TXD2 17
#define UART_BAUD 9600
#define SERIAL_LINE_MAX_LEN 500
#define SERIAL_LINE_TIMEOUT_MS 500UL

// ---------------------------------------------------------------
// TIMING
// ---------------------------------------------------------------
#define WIFI_CHECK_INTERVAL_MS      2000UL
#define HEALTH_REPORT_INTERVAL_MS  30000UL
#define UART_STATS_INTERVAL_MS      5000UL
#define HEARTBEAT_INTERVAL_MS       3000UL  // periodic "ping" frame so the Mega can detect an ESP32 disconnect

// ---------------------------------------------------------------
// WATCHDOG
// Must comfortably exceed the worst-case blocking time of a single
// socketIO.loop()/HTTPClient call. On ESP32 Core 3.x, delay()/yield() no
// longer implicitly feed the task watchdog (unlike Core 2.x), so a slow
// TCP connect/handshake inside the WebSockets library (bounded internally
// at ~5s per stall, WEBSOCKETS_TCP_TIMEOUT) can chain across a few retries
// under real Wi-Fi conditions. 25s gives headroom for that while still
// catching a genuine hang quickly.
// ---------------------------------------------------------------
#define WATCHDOG_TIMEOUT_S 25

#endif // SMART_ROOM_ESP32_CONFIG_H
