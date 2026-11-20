/*
  =====================================================================
  SMART HEALTH ROOM - ESP32 (WiFi / Backend Gateway)
  =====================================================================
  Responsibilities:
    - Receive validated sensor/event data from the Arduino Mega over
      Serial2 (framed, checksummed).
    - Connect to Wi-Fi and the backend, with automatic exponential
      reconnect on any disconnect (Wi-Fi, Socket.IO, HTTP).
    - Push sensor/access/alert/bed data to the backend REST API.
    - Receive remote commands from the backend over Socket.IO (the
      backend's existing real-time channel) and relay them to the
      Arduino, which owns the physical actuators.
    - Report device health periodically.
  All configurable values live in config.h. Nothing blocks in loop().
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <WebSocketsClient.h>
#include <SocketIOclient.h>
#include <esp_task_wdt.h>

#include "config.h"

// ---------------------------------------------------------------
// GLOBAL OBJECTS
// ---------------------------------------------------------------
SocketIOclient socketIO;

// ---------------------------------------------------------------
// WIFI STATE (non-blocking, exponential backoff)
// ---------------------------------------------------------------
enum WifiState { WIFI_ST_DISCONNECTED, WIFI_ST_CONNECTING, WIFI_ST_CONNECTED };
WifiState wifiState = WIFI_ST_DISCONNECTED;
unsigned long wifiAttemptStartedAt = 0;
unsigned long wifiNextAttemptAt = 0;
unsigned long wifiBackoffMs = WIFI_RECONNECT_BASE_MS;
unsigned long lastWifiCheckAt = 0;

// ---------------------------------------------------------------
// SOCKET.IO STATE
// ---------------------------------------------------------------
bool socketIOStarted = false;
bool socketConnected = false;
unsigned long socketBackoffMs = SOCKETIO_RECONNECT_BASE_MS;

// ---------------------------------------------------------------
// BACKEND HTTP STATE
// ---------------------------------------------------------------
bool backendReachable = false;

// ---------------------------------------------------------------
// LATEST SENSOR/ACTUATOR SNAPSHOT
// (Refreshed from every validated "sensors" line the Arduino sends;
//  forwarded as-is to the backend and used for health/status logging.)
// ---------------------------------------------------------------
float latestTemp = 0, latestHum = 0;
int latestGas = 0, latestLight = 0, latestFsr = 0, latestSound = 0;
bool latestDark = false, latestLamp = false, latestDoorOpen = false, latestBuzzer = false;
int latestRgbR = 0, latestRgbG = 0, latestRgbB = 0;
unsigned long lastSensorUpdateAt = 0;
bool haveSensorData = false;

bool emergencyActive = false;

// ---------------------------------------------------------------
// OVERALL CONNECTIVITY (item 8) — "ESP32 Connected/Disconnected" is the
// combined Wi-Fi + Socket.IO state, derived from data already tracked.
// ---------------------------------------------------------------
bool esp32FullyOnline = false;

// --- last time any Socket.IO event fired (connection monitoring, item 5) ---
unsigned long lastSocketEventAt = 0;

// --- previous door state, to log open/closed transitions only once (item 8) ---
bool prevDoorOpen = false;

// ---------------------------------------------------------------
// UART <- ARDUINO (framed line reader)
// ---------------------------------------------------------------
String lineBuffer = "";
unsigned long lineStartedAt = 0;
unsigned long lastUartActivity = 0;
unsigned long uartBytesReceived = 0;

// ---------------------------------------------------------------
// OUTGOING COMMAND SEQUENCE (to Arduino)
// ---------------------------------------------------------------
uint16_t cmdTxSeq = 0;

// ---------------------------------------------------------------
// HEARTBEAT (to Arduino) — lets the Mega tell "ESP32 idle" apart from
// "ESP32 disconnected/crashed"; purely additive, no existing frame changed.
// ---------------------------------------------------------------
unsigned long lastHeartbeatSentAt = 0;

// ---------------------------------------------------------------
// DUPLICATE DETECTION (per message type, from Arduino)
// ---------------------------------------------------------------
struct SeqTrack {
  const char *type;
  uint16_t lastSeq;
  bool seen;
};
SeqTrack seqTracks[5] = {
  {"sensors", 0, false},
  {"access", 0, false},
  {"alert", 0, false},
  {"bed", 0, false},
  {"ack", 0, false},
};

bool isDuplicate(const char *type, uint16_t seq) {
  for (int i = 0; i < 5; i++) {
    if (strcmp(seqTracks[i].type, type) == 0) {
      bool dup = seqTracks[i].seen && seqTracks[i].lastSeq == seq;
      seqTracks[i].lastSeq = seq;
      seqTracks[i].seen = true;
      return dup;
    }
  }
  return false;
}

// ---------------------------------------------------------------
// LOGGING HELPERS
// Severity tags (existing) + subsystem tags (new, item 11) — both kept
// concise and used at their natural call sites, nothing duplicated.
// ---------------------------------------------------------------
void logInfo(const String &msg)      { Serial.print(F("[INFO] "));      Serial.println(msg); }
void logWarn(const String &msg)      { Serial.print(F("[WARNING] "));   Serial.println(msg); }
void logEmergency(const String &msg) { Serial.print(F("[EMERGENCY] ")); Serial.println(msg); }

void logWifi(const String &msg)    { Serial.print(F("[WiFi] "));    Serial.println(msg); }
void logSocket(const String &msg)  { Serial.print(F("[Socket] "));  Serial.println(msg); }
void logArduino(const String &msg) { Serial.print(F("[Arduino] ")); Serial.println(msg); }
void logHttp(const String &msg)    { Serial.print(F("[HTTP] "));    Serial.println(msg); }

// ---------------------------------------------------------------
// SETUP
// ---------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(200);

  Serial.println();
  Serial.println(F("========================================"));
  Serial.println(String(DEVICE_NAME) + " v" + FIRMWARE_VERSION);
  Serial.println(F("========================================"));

  Serial2.begin(UART_BAUD, SERIAL_8N1, RXD2, TXD2);
  Serial2.setTimeout(100);
  logInfo(String("UART2 initialized RX=") + String(RXD2) + " TX=" + String(TXD2) + " baud=" + String(UART_BAUD));

  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);
  beginWifiConnect();

  esp_task_wdt_config_t twdtConfig = {
    .timeout_ms = WATCHDOG_TIMEOUT_S * 1000,
    .idle_core_mask = (1 << portNUM_PROCESSORS) - 1,
    .trigger_panic = true,
  };
  esp_err_t wdtErr = esp_task_wdt_init(&twdtConfig);
  if (wdtErr == ESP_ERR_INVALID_STATE) {
    // TWDT already initialized by the framework; apply our config instead.
    esp_task_wdt_reconfigure(&twdtConfig);
  }
  esp_task_wdt_add(NULL);
  logInfo(String("Watchdog armed (") + String(WATCHDOG_TIMEOUT_S) + "s)");
}

// ---------------------------------------------------------------
// MAIN LOOP (non-blocking)
// ---------------------------------------------------------------
void loop() {
  esp_task_wdt_reset();

  updateWifi();

  if (wifiState == WIFI_ST_CONNECTED) {
    if (!socketIOStarted) {
      beginSocketIO();
    }
    socketIO.loop();
    // socketIO.loop()/HTTPClient can each block for a few seconds on a slow
    // or congested link (TCP connect/handshake retries); reset right after
    // so those bounded stalls don't stack up toward the watchdog deadline.
    esp_task_wdt_reset();
  }

  readFromArduino();
  reportHealthIfDue();
  sendHeartbeatIfDue();
  updateOverallConnectivity();
}

// ---------------------------------------------------------------
// WIFI (exponential backoff reconnect, never blocks)
// ---------------------------------------------------------------
void beginWifiConnect() {
  logWifi(String("Connecting: ") + WIFI_SSID);
  WiFi.disconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  wifiState = WIFI_ST_CONNECTING;
  wifiAttemptStartedAt = millis();
}

void updateWifi() {
  if (millis() - lastWifiCheckAt < WIFI_CHECK_INTERVAL_MS) return;
  lastWifiCheckAt = millis();

  if (WiFi.status() == WL_CONNECTED) {
    if (wifiState != WIFI_ST_CONNECTED) {
      wifiState = WIFI_ST_CONNECTED;
      wifiBackoffMs = WIFI_RECONNECT_BASE_MS;
      logWifi(String("Connected, IP=") + WiFi.localIP().toString() +
              " RSSI=" + String(WiFi.RSSI()) + "dBm");
    }
    return;
  }

  if (wifiState == WIFI_ST_CONNECTED) {
    logWifi(F("Disconnected"));
    wifiState = WIFI_ST_DISCONNECTED;
    socketConnected = false;
    socketIOStarted = false;
    wifiNextAttemptAt = millis() + wifiBackoffMs;
    return;
  }

  if (wifiState == WIFI_ST_CONNECTING && millis() - wifiAttemptStartedAt > WIFI_CONNECT_TIMEOUT_MS) {
    wifiBackoffMs = min(wifiBackoffMs * 2, WIFI_RECONNECT_MAX_MS);
    logWifi(String("Connect attempt timed out, retrying in ") + String(wifiBackoffMs / 1000) + "s");
    wifiState = WIFI_ST_DISCONNECTED;
    wifiNextAttemptAt = millis() + wifiBackoffMs;
    return;
  }

  if (wifiState == WIFI_ST_DISCONNECTED && millis() >= wifiNextAttemptAt) {
    beginWifiConnect();
  }
}

// ---------------------------------------------------------------
// OVERALL CONNECTIVITY EVENT (item 8) — logged once per transition,
// combining Wi-Fi + Socket.IO state that's already tracked above.
// ---------------------------------------------------------------
void updateOverallConnectivity() {
  bool nowOnline = (wifiState == WIFI_ST_CONNECTED) && socketConnected;
  if (nowOnline == esp32FullyOnline) return;
  esp32FullyOnline = nowOnline;
  logInfo(esp32FullyOnline ? F("ESP32 Connected") : F("ESP32 Disconnected"));
}

// ---------------------------------------------------------------
// SOCKET.IO (backend real-time channel — remote commands)
// ---------------------------------------------------------------
void beginSocketIO() {
  socketIOStarted = true;
  socketIO.begin(SERVER_HOST, SERVER_PORT, SOCKETIO_PATH);
  socketIO.onEvent(socketIOEvent);
  logSocket(F("Client starting..."));
}

void socketIOEvent(socketIOmessageType_t type, uint8_t *payload, size_t length) {
  lastSocketEventAt = millis();

  switch (type) {
    case sIOtype_DISCONNECT:
      if (socketConnected) logSocket(F("Disconnected"));
      socketConnected = false;
      socketBackoffMs = min(socketBackoffMs * 2, SOCKETIO_RECONNECT_MAX_MS);
      socketIO.setReconnectInterval(socketBackoffMs);
      break;

    case sIOtype_CONNECT: {
      socketIO.send(sIOtype_CONNECT, "/");
      String registerPayload = String("[\"register\",\"") + BACKEND_USER_ID + "\"]";
      socketIO.sendEVENT(registerPayload);
      socketConnected = true;
      socketBackoffMs = SOCKETIO_RECONNECT_BASE_MS;
      socketIO.setReconnectInterval(socketBackoffMs);
      logSocket(F("Connected, registered with backend room"));
      break;
    }

    case sIOtype_EVENT:
      handleSocketEvent((char *)payload, length);
      break;

    case sIOtype_ERROR:
      logSocket(F("Error frame received"));
      break;

    default:
      break;
  }
}

void handleSocketEvent(char *payload, size_t length) {
  StaticJsonDocument<384> doc;
  DeserializationError err = deserializeJson(doc, payload, length);
  if (err) {
    logSocket(String("Event JSON parse error: ") + err.c_str());
    return;
  }
  if (!doc.is<JsonArray>() || doc.size() < 1) {
    logSocket(F("Event malformed (expected [name, data])"));
    return;
  }

  const char *eventName = doc[0] | "";
  JsonVariant data;
  if (doc.size() > 1) {
    data = doc[1];
  }

  if (strcmp(eventName, "lamp-command") == 0) {
    bool on = data["on"] | false;
    logArduino(String("Command: Lamp ") + (on ? "ON" : "OFF"));
    sendCommandToArduino("lamp", on ? "on" : "off");
    latestLamp = on;
  } else if (strcmp(eventName, "door-command") == 0) {
    const char *servo = data["servo"] | "fermé";
    bool open = strcmp(servo, "ouvert") == 0;
    logArduino(String("Command: Door ") + (open ? "Open" : "Close"));
    sendCommandToArduino("door", open ? "open" : "close");
    latestDoorOpen = open;
  } else if (strcmp(eventName, "buzzer-command") == 0) {
    bool on = data["on"] | false;
    logArduino(String("Command: Buzzer ") + (on ? "ON" : "OFF"));
    sendCommandToArduino("buzzer", on ? "on" : "off");
    latestBuzzer = on;
  } else if (strcmp(eventName, "rgb-command") == 0) {
    int r = data["rgb"]["r"] | 0;
    int g = data["rgb"]["g"] | 0;
    int b = data["rgb"]["b"] | 0;
    logArduino(String("Command: RGB(") + String(r) + "," + String(g) + "," + String(b) + ")");
    sendCommandToArduinoRgb(r, g, b);
    latestRgbR = r; latestRgbG = g; latestRgbB = b;
  } else if (strcmp(eventName, "emergency:activated") == 0) {
    emergencyActive = true;
    logEmergency(F("Emergency Activated"));
    sendCommandToArduino("emergency", "activate");
  } else if (strcmp(eventName, "emergency:resolved") == 0) {
    emergencyActive = false;
    logInfo(F("Emergency Resolved"));
    sendCommandToArduino("emergency", "resolve");
  } else {
    logSocket(String("Unknown event: ") + eventName);
  }
}

// ---------------------------------------------------------------
// COMMAND RELAY TO ARDUINO (framed JSON + checksum, mirrors the
// Arduino->ESP32 protocol so both links are equally robust)
// ---------------------------------------------------------------
byte computeChecksum(const String &s) {
  byte chk = 0;
  for (size_t i = 0; i < s.length(); i++) chk ^= (byte)s[i];
  return chk;
}

void sendFrameToArduino(JsonDocument &doc) {
  doc["seq"] = cmdTxSeq++;
  String out;
  serializeJson(doc, out);
  byte chk = computeChecksum(out);

  Serial2.print(out);
  Serial2.print('*');
  if (chk < 0x10) Serial2.print('0');
  Serial2.println(chk, HEX);
}

void sendCommandToArduino(const char *action, const char *value) {
  StaticJsonDocument<160> doc;
  doc["type"] = "cmd";
  doc["action"] = action;
  doc["value"] = value;
  sendFrameToArduino(doc);
}

void sendCommandToArduinoRgb(int r, int g, int b) {
  StaticJsonDocument<160> doc;
  doc["type"] = "cmd";
  doc["action"] = "rgb";
  doc["r"] = constrain(r, 0, 255);
  doc["g"] = constrain(g, 0, 255);
  doc["b"] = constrain(b, 0, 255);
  sendFrameToArduino(doc);
}

void sendHeartbeatIfDue() {
  if (millis() - lastHeartbeatSentAt < HEARTBEAT_INTERVAL_MS) return;
  lastHeartbeatSentAt = millis();

  StaticJsonDocument<64> doc;
  doc["type"] = "ping";
  sendFrameToArduino(doc);
}

// ---------------------------------------------------------------
// UART <- ARDUINO (framed line reader; never blocks or crashes on
// malformed/corrupted/duplicate input)
// ---------------------------------------------------------------
void readFromArduino() {
  while (Serial2.available()) {
    char c = Serial2.read();
    uartBytesReceived++;
    lastUartActivity = millis();
    lineStartedAt = millis();

    if (c == '\n') {
      if (lineBuffer.length() > 0) {
        processArduinoLine(lineBuffer);
        // Each line can trigger a blocking postJson() (up to HTTP_TIMEOUT_MS);
        // a burst of buffered lines could otherwise stack up past the watchdog
        // deadline before this function returns.
        esp_task_wdt_reset();
      }
      lineBuffer = "";
    } else if (c != '\r') {
      lineBuffer += c;
      if (lineBuffer.length() > SERIAL_LINE_MAX_LEN) {
        logArduino(F("Line too long, discarded"));
        lineBuffer = "";
      }
    }
  }

  if (lineBuffer.length() > 0 && millis() - lineStartedAt > SERIAL_LINE_TIMEOUT_MS) {
    logArduino(F("Stale partial line, discarded"));
    lineBuffer = "";
  }
}

void processArduinoLine(const String &line) {
  int star = line.lastIndexOf('*');
  if (star < 0 || star + 2 >= (int)line.length()) {
    logArduino(F("Malformed frame (no checksum), ignored"));
    return;
  }

  String json = line.substring(0, star);
  String chkStr = line.substring(star + 1);
  byte expected = (byte)strtol(chkStr.c_str(), nullptr, 16);
  byte actual = computeChecksum(json);

  if (expected != actual) {
    logArduino(F("Checksum mismatch, packet dropped (corrupted)"));
    return;
  }

  StaticJsonDocument<512> doc;
  DeserializationError err = deserializeJson(doc, json);
  if (err) {
    logArduino(String("JSON parse error: ") + err.c_str());
    return;
  }

  const char *type = doc["type"] | "";
  uint16_t seq = doc["seq"] | 0;

  if (isDuplicate(type, seq)) {
    logArduino(String("Duplicate ") + type + " packet ignored");
    return;
  }

  if (strcmp(type, "sensors") == 0) {
    handleSensorsLine(doc);
  } else if (strcmp(type, "access") == 0) {
    const char *status = doc["status"] | "";
    const char *name = doc["name"] | "";
    if (strcmp(status, "granted") == 0) {
      logArduino(String("RFID Accepted: ") + name);
    } else {
      logArduino(F("RFID Denied"));
    }
    postJson(ENDPOINT_ACCESS, doc);
  } else if (strcmp(type, "alert") == 0) {
    const char *kind = doc["kind"] | "";
    int value = doc["value"] | 0;
    const char *severity = doc["severity"] | "warning";
    if (strcmp(severity, "emergency") == 0) {
      logEmergency(String(kind) + " = " + value);
    } else {
      logWarn(String(kind) + " = " + value);
    }
    postJson(ENDPOINT_ALERTS, doc);
  } else if (strcmp(type, "bed") == 0) {
    postJson(ENDPOINT_BED, doc);
  } else if (strcmp(type, "ack") == 0) {
    const char *action = doc["action"] | "";
    const char *result = doc["result"] | "";
    logArduino(String("Ack: ") + action + " -> " + result);
  } else {
    logArduino(String("Unknown frame type: ") + type);
  }
}

// ---------------------------------------------------------------
// SENSOR TELEMETRY (Arduino -> ESP32 -> backend)
// ---------------------------------------------------------------
void handleSensorsLine(JsonDocument &doc) {
  latestTemp = doc["temp"] | 0.0;
  latestHum = doc["hum"] | 0.0;
  latestGas = doc["gas"] | 0;
  latestLight = doc["light"] | 0;
  latestFsr = doc["fsr"] | 0;
  latestSound = doc["sound"] | 0;
  latestDark = doc["dark"] | false;
  latestLamp = doc["lamp"] | false;
  latestDoorOpen = doc["door"] | false;
  if (latestDoorOpen != prevDoorOpen) {
    logArduino(latestDoorOpen ? F("Door Open") : F("Door Closed"));
    prevDoorOpen = latestDoorOpen;
  }
  latestBuzzer = doc["buzzer"] | false;
  latestRgbR = doc["rgb"]["r"] | 0;
  latestRgbG = doc["rgb"]["g"] | 0;
  latestRgbB = doc["rgb"]["b"] | 0;
  lastSensorUpdateAt = millis();
  haveSensorData = true;

  StaticJsonDocument<384> out;
  out["deviceId"] = DEVICE_ID;
  JsonObject readings = out.createNestedObject("readings");
  readings["temperature"] = latestTemp;
  readings["humidity"] = latestHum;
  readings["airQuality"] = latestGas;
  readings["gas"] = latestGas;
  readings["pressure"] = latestFsr;   // FSR is the closest available "pressure" sensor on this hardware
  readings["motion"] = false;         // no PIR/motion sensor on this hardware — always false
  readings["soundLevel"] = latestSound;
  readings["light"] = latestLight;
  readings["lamp"] = latestLamp;
  readings["servo"] = latestDoorOpen ? "ouvert" : "fermé";
  readings["buzzer"] = latestBuzzer;
  readings["lightStatus"] = latestDark ? "nuit" : "jour";
  JsonObject rgb = readings.createNestedObject("rgb");
  rgb["r"] = latestRgbR;
  rgb["g"] = latestRgbG;
  rgb["b"] = latestRgbB;

  postJson(ENDPOINT_SENSORS, out);
}

// ---------------------------------------------------------------
// HTTP POST TO BACKEND
// ---------------------------------------------------------------
void postJson(const char *endpoint, JsonDocument &doc) {
  if (WiFi.status() != WL_CONNECTED) {
    logHttp(String("POST skipped (Wi-Fi offline): ") + endpoint);
    return;
  }

  if (!doc.containsKey("deviceId")) {
    doc["deviceId"] = DEVICE_ID;
  }

  String body;
  serializeJson(doc, body);

  String url = String("http://") + SERVER_HOST + ":" + SERVER_PORT + endpoint;

  HTTPClient http;
  http.setTimeout(HTTP_TIMEOUT_MS);
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  int statusCode = http.POST(body);

  if (statusCode > 0) {
    backendReachable = true;
    if (statusCode >= 400) {
      logHttp(String(statusCode) + " from " + endpoint);
    }
  } else {
    backendReachable = false;
    logHttp(String("Request failed (") + endpoint + "): " + http.errorToString(statusCode));
  }

  http.end();
}

// ---------------------------------------------------------------
// DEVICE HEALTH REPORTING
// Printed as structured logs (always available on Serial). Also
// forward-compatible: appended to sensor payload if backend chooses
// to store it later — today's schema silently ignores unknown fields,
// so full dashboard integration needs a small backend addition.
// ---------------------------------------------------------------
unsigned long lastHealthReportAt = 0;

void reportHealthIfDue() {
  if (millis() - lastHealthReportAt < HEALTH_REPORT_INTERVAL_MS) return;
  lastHealthReportAt = millis();

  unsigned long uptimeS = millis() / 1000;
  unsigned long sinceSensorS = haveSensorData ? (millis() - lastSensorUpdateAt) / 1000 : 0;

  String wifiStr = (wifiState == WIFI_ST_CONNECTED) ? String("online") : String("offline");
  String rssiStr = (wifiState == WIFI_ST_CONNECTED) ? (String(WiFi.RSSI()) + "dBm") : String("n/a");
  String ipStr = (wifiState == WIFI_ST_CONNECTED) ? WiFi.localIP().toString() : String("n/a");
  String backendStr = backendReachable ? String("online") : String("offline");
  String socketStr = socketConnected ? String("online") : String("offline");
  String lastSensorStr = haveSensorData ? (String(sinceSensorS) + "s ago") : String("never");
  String lastSocketStr = (lastSocketEventAt > 0) ? (String((millis() - lastSocketEventAt) / 1000) + "s ago") : String("never");

  String msg = String("Health: fw=") + FIRMWARE_VERSION +
               " device=" + DEVICE_NAME +
               " wifi=" + wifiStr +
               " rssi=" + rssiStr +
               " ip=" + ipStr +
               " mac=" + WiFi.macAddress() +
               " uptime=" + String(uptimeS) + "s" +
               " freeHeap=" + String(ESP.getFreeHeap()) +
               " backend=" + backendStr +
               " socket=" + socketStr +
               " lastSocketEvent=" + lastSocketStr +
               " lastSensorUpdate=" + lastSensorStr +
               " uartRxBytes=" + String(uartBytesReceived) +
               " lastUartActivity=" + String((millis() - lastUartActivity) / 1000) + "s ago";

  logInfo(msg);
}
