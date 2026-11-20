/*
  =====================================================================
  SMART HEALTH ROOM - ARDUINO MEGA 2560
  =====================================================================
  Responsibilities:
    - Boot with a professional startup sequence + hardware self-test.
    - Read and validate all sensors (DHT11, MQ-2 gas, FSR, LDR, sound).
    - Drive local actuators (RFID access door, RGB, buzzer, lamp, LCD).
    - Persist registered RFID cards in EEPROM so registration is never
      required again after a reboot (until manually reset).
    - Run a smooth, non-blocking LCD dashboard carousel while occupied.
    - Send sensor/event data to the ESP32 over Serial1 (framed, checksummed).
    - Receive and execute remote commands relayed by the ESP32 over Serial1
      (door, lamp, RGB, buzzer, emergency), reusing the same actuator code
      paths as the local RFID/alert logic wherever possible.
  All configurable values live in config.h. No blocking delay() in the
  main loop — everything is millis()-driven so the AVR watchdog can run
  safely and the board never needs a manual reboot. (The one exception is
  a short delay() inside the explicit, user-triggered EEPROM factory
  reset, which intentionally reboots the board.)
*/

#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>
#include <ThreeWire.h>
#include <RtcDS1302.h>
#include <Servo.h>
#include <ArduinoJson.h>
#include <EEPROM.h>
#include <avr/wdt.h>

#include "config.h"

// ---------------------------------------------------------------
// GLOBAL OBJECTS
// ---------------------------------------------------------------
MFRC522 rfid(RFID_SS_PIN, RFID_RST_PIN);
LiquidCrystal_I2C lcd(LCD_ADDR, LCD_COLS, LCD_ROWS);
DHT dht(DHT_PIN, DHT_TYPE);
Servo doorServo;

ThreeWire rtcWire(RTC_DAT_PIN, RTC_CLK_PIN, RTC_RST_PIN);
RtcDS1302<ThreeWire> Rtc(rtcWire);

// ---------------------------------------------------------------
// LCD CUSTOM CHARACTERS (trend arrows + a guaranteed-solid progress block)
// ---------------------------------------------------------------
byte glyphUpArrow[8]    = {0b00100,0b01110,0b10101,0b00100,0b00100,0b00100,0b00100,0b00000};
byte glyphDownArrow[8]  = {0b00100,0b00100,0b00100,0b00100,0b10101,0b01110,0b00100,0b00000};
byte glyphSteadyArrow[8]= {0b00000,0b00100,0b00010,0b11111,0b00010,0b00100,0b00000,0b00000};
byte glyphBlock[8]      = {0b11111,0b11111,0b11111,0b11111,0b11111,0b11111,0b11111,0b11111};
#define GLYPH_UP     0
#define GLYPH_DOWN   1
#define GLYPH_STEADY 2
#define GLYPH_BLOCK  3

// ---------------------------------------------------------------
// STATE MACHINE
// (Hold/NameWait sub-states replace blocking delay()s so the loop never
//  stalls — commands, watchdog and door timing keep running.)
// ---------------------------------------------------------------
enum SystemState {
  STATE_BOOT_TITLE,
  STATE_BOOT_SUBTITLE,
  STATE_BOOT_PROGRESS,
  STATE_BOOT_SELFTEST,
  STATE_BOOT_READY,
  STATE_INIT_CARD_1,
  STATE_INIT_CARD_1_NAME_WAIT,
  STATE_INIT_CARD_1_HOLD,
  STATE_INIT_CARD_2,
  STATE_INIT_CARD_2_NAME_WAIT,
  STATE_INIT_CARD_2_HOLD,
  STATE_CONFIG_COMPLETE_HOLD,
  STATE_WAIT_SCAN,
  STATE_ACCESS_GRANTED_HOLD,
  STATE_ACCESS_COUNTDOWN,
  STATE_ACCESS_LOGGED_HOLD,
  STATE_ACCESS_DENIED_HOLD,
  STATE_INSIDE,
  STATE_EXIT_HOLD
};

SystemState state = STATE_BOOT_TITLE;
unsigned long stateEnteredAt = 0;

byte registeredUid[MAX_USERS][10];
byte registeredUidLen[MAX_USERS] = {0, 0};
String registeredName[MAX_USERS];
int registeredCount = 0;
String currentUserName = "";

// --- pending registration (name entry) ---
byte pendingUid[10];
byte pendingUidLen = 0;
String nameEntryBuffer = "";

bool doorIsOpen = false;
unsigned long doorOpenedAt = 0;
unsigned long lastSensorSendAt = 0;
unsigned long lastLcdCycleAt = 0;
bool wasLyingDown = false;
bool bedOccupied = false;

// --- LDR day/night state ---
bool isDark = false;
bool lastIsDark = false;
unsigned long lastLdrChangeAt = 0;

// --- Sound detection while lying down ---
bool soundDetectedWhileLying = false;
unsigned long soundDetectedAt = 0;

// --- Sensor validation fallbacks ---
float lastGoodTemp = 25.0;
float lastGoodHum = 50.0;
int lastGoodGas = 0;
int lastGoodFsr = 0;
int lastGoodLdr = 500;

// --- Sensor health monitoring (item 18) ---
#define SENSOR_FAULT_STREAK 5
bool tempSensorOffline = false;
bool gasSensorFault = false;
bool ldrSensorFault = false;
int tempFailStreak = 0;
int gasFailStreak = 0;
int ldrFailStreak = 0;

// --- Two-tier hazard detection (Warning / Emergency) ---
enum HazardTier { HAZARD_NONE, HAZARD_WARNING, HAZARD_EMERGENCY };
HazardTier hazardTier = HAZARD_NONE;
String hazardKind = "";
bool localEmergencyActive = false;

// --- Remote-control shadow state (commanded by ESP32 / backend) ---
bool remoteEmergencyActive = false;
bool manualBuzzerOn = false;
bool lampOn = false;
int remoteRgbR = 0, remoteRgbG = 0, remoteRgbB = 0;
String remoteRecommendationText = "";
unsigned long remoteRecommendationAt = 0;

// --- Buzzer alarm pulse (non-blocking) ---
unsigned long lastAlarmToggleAt = 0;
bool alarmToneOn = false;

// --- Non-blocking beep sequencer (card feedback) ---
struct BeepSequencer {
  bool active = false;
  int remaining = 0;
  int durationMs = 0;
  bool toneStarted = false;
  unsigned long lastChangeAt = 0;
};
BeepSequencer beepSeq;

// --- Door closing countdown (non-blocking, "5 4 3 2 1") ---
int doorCountdownValue = 0;
unsigned long doorCountdownLastTickAt = 0;

// --- Outgoing message sequence counter (duplicate detection on ESP32 side) ---
uint16_t txSeq = 0;

// --- Incoming command framing (Serial1 from ESP32) ---
String cmdLineBuffer = "";
unsigned long cmdLineStartedAt = 0;
uint16_t lastCmdSeq = 0;
bool haveSeenCmdSeq = false;

// --- Debug Serial (USB) line reader — name entry (existing) + "RESET" command (new) ---
String debugLineBuffer = "";

// --- ESP32 link health (heartbeat-based; see esp32.ino "ping" frame) ---
bool esp32Linked = false;
unsigned long lastEsp32SeenAt = 0;
bool statusLedOn = false;
unsigned long lastStatusLedToggleAt = 0;

// --- One-shot system banners overlaid on top of whatever the LCD is showing ---
bool systemBannerActive = false;
unsigned long systemBannerUntil = 0;

// --- EEPROM ---
bool eepromHasUsers = false;

// --- Boot sequence ---
const char *BOOT_TITLE_LINE0 = "SMART HEALTH";
const char *BOOT_TITLE_LINE1 = "ROOM";
int bootTitleCharIndex = 0;
unsigned long bootTitleLastCharAt = 0;
unsigned long bootTitleRevealDoneAt = 0;
int bootProgressColumn = 0;
bool rtcFaultAtBoot = false;

// --- Hardware self-test ---
enum SelfTestItem {
  ST_LCD = 0, ST_RFID, ST_RTC, ST_DHT, ST_GAS, ST_FSR, ST_LDR, ST_SOUND,
  ST_RGB, ST_BUZZER, ST_SERVO, ST_ESP32, SELFTEST_COUNT
};
const char *selfTestNames[SELFTEST_COUNT] = {
  "LCD", "RFID READER", "RTC CLOCK", "DHT11 SENSOR", "MQ GAS SENSOR",
  "FSR SENSOR", "LDR SENSOR", "SOUND SENSOR", "RGB LED", "BUZZER",
  "SERVO", "ESP32 LINK"
};
bool selfTestResult[SELFTEST_COUNT];
bool selfTestResultKnown[SELFTEST_COUNT];
int selfTestIndex = 0;
int selfTestFailStage = 0; // 0=just recorded, 1=showing "ERROR/<name>" detail
bool selfTestEsp32Waiting = false;
unsigned long selfTestEsp32WaitStartedAt = 0;
bool anySelfTestFailed = false;

// --- Smart LCD dashboard carousel (item 6) ---
enum DashPage {
  DASH_GREETING, DASH_DATE, DASH_TIME, DASH_TEMP, DASH_HUM, DASH_GAS,
  DASH_LIGHT, DASH_BED, DASH_RECOMMENDATION, DASH_RGB, DASH_DOOR,
  DASH_STATS, DASH_SENSOR_HEALTH, DASH_PAGE_COUNT
};
int dashPage = 0;
bool dashboardForceRedraw = false;
enum LcdOverrideKind { OVR_NONE, OVR_EMERGENCY, OVR_RTC_ERROR, OVR_WARNING, OVR_LYING };
LcdOverrideKind lastOverrideKind = OVR_NONE;
String lastOverrideDetail = "";

const char *const DOW_NAMES[7] = {
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
};
const char *const MONTH_ABBR[13] = {
  "", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
};

// --- Trends + running statistics (items 8, 16) ---
float avgTemp = 25.0, avgHum = 50.0, avgGas = 0;
bool statsInitialized = false;
unsigned long lastStatsSampleAt = 0;
float prevTrendTemp = 25.0, prevTrendHum = 50.0, prevTrendGas = 0;
int8_t tempTrend = 0, humTrend = 0, gasTrend = 0;

// --- Recommendations (item 9) ---
String recommendationText = "";
unsigned long recommendationLastRotateAt = 0;

// ---------------------------------------------------------------
// EEPROM LAYOUT
// ---------------------------------------------------------------
struct StoredUser {
  byte uidLen;
  byte uid[10];
  char name[USER_NAME_MAX_LEN + 1];
};
struct EepromLayout {
  byte magic;
  byte count;
  StoredUser users[MAX_USERS];
};

// ---------------------------------------------------------------
// LOGGING HELPERS
// ---------------------------------------------------------------
void logInfo(const String &msg)      { Serial.print(F("[INFO] "));      Serial.println(msg); }
void logWarn(const String &msg)      { Serial.print(F("[WARNING] "));   Serial.println(msg); }
void logError(const String &msg)     { Serial.print(F("[ERROR] "));     Serial.println(msg); }
void logEmergency(const String &msg) { Serial.print(F("[EMERGENCY] ")); Serial.println(msg); }

// ---------------------------------------------------------------
// LCD HELPERS (flicker-free: pad/truncate + overwrite, no clear())
// ---------------------------------------------------------------
void lcdPrintLine(int row, const String &text) {
  String padded = text;
  while (padded.length() < LCD_COLS) padded += ' ';
  if (padded.length() > LCD_COLS) padded = padded.substring(0, LCD_COLS);
  lcd.setCursor(0, row);
  lcd.print(padded);
}

void lcdPrintLineWithTrendArrow(int row, const String &text, int8_t trend) {
  String padded = text;
  while (padded.length() < LCD_COLS - 1) padded += ' ';
  if (padded.length() > LCD_COLS - 1) padded = padded.substring(0, LCD_COLS - 1);
  lcd.setCursor(0, row);
  lcd.print(padded);
  lcd.setCursor(LCD_COLS - 1, row);
  if (trend > 0) lcd.write(byte(GLYPH_UP));
  else if (trend < 0) lcd.write(byte(GLYPH_DOWN));
  else lcd.write(byte(GLYPH_STEADY));
}

void showOverrideOnce(LcdOverrideKind kind, const String &line0, const String &line1) {
  if (kind == lastOverrideKind && line1 == lastOverrideDetail) return;
  lastOverrideKind = kind;
  lastOverrideDetail = line1;
  lcdPrintLine(0, line0);
  lcdPrintLine(1, line1);
}

void showSystemBanner(const String &line0, const String &line1, unsigned long durationMs) {
  systemBannerActive = true;
  systemBannerUntil = millis() + durationMs;
  lcdPrintLine(0, line0);
  lcdPrintLine(1, line1);
}

// ---------------------------------------------------------------
// EEPROM HELPERS (persistent RFID cards — item 3)
// ---------------------------------------------------------------
bool loadUsersFromEeprom() {
  EepromLayout layout;
  EEPROM.get(EEPROM_ADDR, layout);
  if (layout.magic != EEPROM_MAGIC_BYTE || layout.count == 0 || layout.count > MAX_USERS) return false;

  registeredCount = layout.count;
  for (int i = 0; i < registeredCount; i++) {
    registeredUidLen[i] = layout.users[i].uidLen;
    memcpy(registeredUid[i], layout.users[i].uid, layout.users[i].uidLen);
    layout.users[i].name[USER_NAME_MAX_LEN] = '\0';
    registeredName[i] = String(layout.users[i].name);
  }
  logInfo(String("Loaded ") + registeredCount + " registered card(s) from EEPROM");
  return true;
}

void saveUsersToEeprom() {
  EepromLayout layout;
  layout.magic = EEPROM_MAGIC_BYTE;
  layout.count = registeredCount;
  for (int i = 0; i < MAX_USERS; i++) {
    memset(layout.users[i].uid, 0, sizeof(layout.users[i].uid));
    layout.users[i].name[0] = '\0';
    if (i < registeredCount) {
      layout.users[i].uidLen = registeredUidLen[i];
      memcpy(layout.users[i].uid, registeredUid[i], registeredUidLen[i]);
      registeredName[i].toCharArray(layout.users[i].name, USER_NAME_MAX_LEN + 1);
    } else {
      layout.users[i].uidLen = 0;
    }
  }
  EEPROM.put(EEPROM_ADDR, layout);
  logInfo(F("Registered card(s) saved to EEPROM"));
}

void factoryResetEeprom() {
  logWarn(F("EEPROM reset requested via Serial — rebooting"));
  EEPROM.update(EEPROM_ADDR, 0xFF); // corrupt the magic byte -> treated as empty on next boot
  lcd.clear();
  lcdPrintLine(0, "EEPROM RESET");
  lcdPrintLine(1, "REBOOTING...");
  delay(800); // deliberate, user-triggered, one-shot — not part of the normal non-blocking loop
  wdt_enable(WDTO_15MS);
  while (true) {}
}

void handleDebugSerialCommands() {
  if (state == STATE_INIT_CARD_1_NAME_WAIT || state == STATE_INIT_CARD_2_NAME_WAIT) return; // name entry owns Serial there
  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\n') {
      debugLineBuffer.trim();
      if (debugLineBuffer.equalsIgnoreCase("RESET")) {
        factoryResetEeprom();
      }
      debugLineBuffer = "";
    } else if (c != '\r') {
      debugLineBuffer += c;
      if (debugLineBuffer.length() > 32) debugLineBuffer = "";
    }
  }
}

// ---------------------------------------------------------------
// SETUP
// ---------------------------------------------------------------
void setup() {
  Serial.begin(DEBUG_SERIAL_BAUD);
  Serial1.begin(ESP32_SERIAL_BAUD);

  SPI.begin();
  rfid.PCD_Init();

  Wire.begin();
  lcd.init();
  lcd.backlight();
  lcd.createChar(GLYPH_UP, glyphUpArrow);
  lcd.createChar(GLYPH_DOWN, glyphDownArrow);
  lcd.createChar(GLYPH_STEADY, glyphSteadyArrow);
  lcd.createChar(GLYPH_BLOCK, glyphBlock);

  dht.begin();

  pinMode(SOUND_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(RGB_R_PIN, OUTPUT);
  pinMode(RGB_G_PIN, OUTPUT);
  pinMode(RGB_B_PIN, OUTPUT);
  pinMode(LAMP_PIN, OUTPUT);
  digitalWrite(LAMP_PIN, LOW);
  pinMode(STATUS_LED_PIN, OUTPUT);
  digitalWrite(STATUS_LED_PIN, LOW);

  doorServo.attach(SERVO_PIN);
  doorServo.write(SERVO_CLOSED_ANGLE);

  Rtc.Begin();
  rtcFaultAtBoot = !Rtc.IsDateTimeValid();
  if (rtcFaultAtBoot) {
    Rtc.SetDateTime(RtcDateTime(__DATE__, __TIME__));
  }
  if (Rtc.GetIsWriteProtected()) Rtc.SetIsWriteProtected(false);
  if (!Rtc.GetIsRunning()) Rtc.SetIsRunning(true);

  setRGBColor(0, 0, 0);

  logInfo(String(DEVICE_NAME) + " v" + FIRMWARE_VERSION + " booting...");

  eepromHasUsers = loadUsersFromEeprom();

  lcd.clear();
  enterState(STATE_BOOT_TITLE);

  wdt_enable(WATCHDOG_TIMEOUT);
  logInfo(F("Watchdog armed"));
}

// ---------------------------------------------------------------
// MAIN LOOP (non-blocking, watchdog-fed every iteration)
// ---------------------------------------------------------------
void loop() {
  wdt_reset();

  receiveFromESP32();
  updateEsp32Link();
  handleDebugSerialCommands();

  if (systemBannerActive && millis() >= systemBannerUntil) {
    systemBannerActive = false;
    if (state == STATE_WAIT_SCAN) {
      lcdPrintLine(0, "PLEASE SCAN");
      lcdPrintLine(1, "YOUR CARD");
    } else if (state == STATE_INSIDE) {
      dashboardForceRedraw = true;
      lastOverrideKind = OVR_NONE;
    }
  }

  switch (state) {
    case STATE_BOOT_TITLE:    handleBootTitle();    break;
    case STATE_BOOT_SUBTITLE: handleBootSubtitle(); break;
    case STATE_BOOT_PROGRESS: handleBootProgress(); break;
    case STATE_BOOT_SELFTEST: handleBootSelfTest(); break;
    case STATE_BOOT_READY:    handleBootReady();    break;

    case STATE_INIT_CARD_1:
    case STATE_INIT_CARD_2:
      handleInitRegistration();
      break;
    case STATE_INIT_CARD_1_NAME_WAIT:
    case STATE_INIT_CARD_2_NAME_WAIT:
      handleNameEntry();
      break;
    case STATE_INIT_CARD_1_HOLD:
      if (millis() - stateEnteredAt >= MESSAGE_HOLD_MEDIUM_MS) {
        enterState(STATE_INIT_CARD_2);
        lcd.clear();
        lcdPrintLine(0, "Scan Second Card");
      }
      break;
    case STATE_INIT_CARD_2_HOLD:
      if (millis() - stateEnteredAt >= MESSAGE_HOLD_MEDIUM_MS) {
        enterState(STATE_CONFIG_COMPLETE_HOLD);
        lcd.clear();
        lcdPrintLine(0, "Configuration");
        lcdPrintLine(1, "Complete");
      }
      break;
    case STATE_CONFIG_COMPLETE_HOLD:
      if (millis() - stateEnteredAt >= MESSAGE_HOLD_MEDIUM_MS) {
        goToWaitScan();
      }
      break;

    case STATE_WAIT_SCAN:
      handleAccessControl();
      break;
    case STATE_ACCESS_GRANTED_HOLD:
      if (millis() - stateEnteredAt >= MESSAGE_HOLD_SHORT_MS) {
        enterState(STATE_ACCESS_COUNTDOWN);
        doorCountdownLastTickAt = millis();
        unsigned long elapsed = millis() - doorOpenedAt;
        unsigned long remaining = (elapsed < DOOR_OPEN_MS) ? (DOOR_OPEN_MS - elapsed) : 0;
        doorCountdownValue = (remaining + DOOR_COUNTDOWN_STEP_MS - 1) / DOOR_COUNTDOWN_STEP_MS;
        if (doorCountdownValue < 1) doorCountdownValue = 1;
        lcd.clear();
        lcdPrintLine(0, "Door Closing In");
        lcdPrintLine(1, String(doorCountdownValue));
      }
      break;
    case STATE_ACCESS_COUNTDOWN:
      if (millis() - doorCountdownLastTickAt >= DOOR_COUNTDOWN_STEP_MS) {
        doorCountdownLastTickAt = millis();
        doorCountdownValue--;
        if (doorCountdownValue > 0) {
          lcdPrintLine(1, String(doorCountdownValue));
        } else {
          enterState(STATE_ACCESS_LOGGED_HOLD);
          lcd.clear();
          lcdPrintLine(0, "Access Logged");
        }
      }
      break;
    case STATE_ACCESS_LOGGED_HOLD:
      if (millis() - stateEnteredAt >= MESSAGE_HOLD_SHORT_MS) {
        enterState(STATE_INSIDE);
        dashPage = 0;
        lastLcdCycleAt = millis();
        lastOverrideKind = OVR_NONE;
        lastIsDark = false;
        isDark = false;
        soundDetectedWhileLying = false;
        soundDetectedAt = 0;
        renderDashboardPage(dashPage, lastGoodTemp, lastGoodHum, lastGoodGas, false);
      }
      break;
    case STATE_ACCESS_DENIED_HOLD:
      if (millis() - stateEnteredAt >= MESSAGE_HOLD_SHORT_MS) {
        goToWaitScan();
      }
      break;

    case STATE_INSIDE:
      handleInsideMonitoring();
      handleExitScan();
      break;
    case STATE_EXIT_HOLD:
      if (millis() - stateEnteredAt >= MESSAGE_HOLD_SHORT_MS) {
        goToWaitScan();
      }
      break;
  }

  handleDoorAutoClose();
  updateActuators();
}

void enterState(SystemState next) {
  state = next;
  stateEnteredAt = millis();
}

// ---------------------------------------------------------------
// BOOT SEQUENCE (item 1) — typewriter title, subtitle, progress bar
// ---------------------------------------------------------------
void handleBootTitle() {
  int line0Len = strlen(BOOT_TITLE_LINE0);
  int line1Len = strlen(BOOT_TITLE_LINE1);
  int totalChars = line0Len + line1Len;

  if (bootTitleCharIndex < totalChars) {
    if (millis() - bootTitleLastCharAt >= BOOT_TITLE_CHAR_MS) {
      bootTitleLastCharAt = millis();
      if (bootTitleCharIndex < line0Len) {
        lcd.setCursor(bootTitleCharIndex, 0);
        lcd.print(BOOT_TITLE_LINE0[bootTitleCharIndex]);
      } else {
        int i = bootTitleCharIndex - line0Len;
        lcd.setCursor(i, 1);
        lcd.print(BOOT_TITLE_LINE1[i]);
      }
      bootTitleCharIndex++;
    }
    return;
  }

  if (bootTitleRevealDoneAt == 0) bootTitleRevealDoneAt = millis();
  if (millis() - bootTitleRevealDoneAt >= BOOT_TITLE_HOLD_MS) {
    enterState(STATE_BOOT_SUBTITLE);
    lcd.clear();
    lcdPrintLine(0, "Powered by");
    lcdPrintLine(1, "Mega + ESP32");
  }
}

void handleBootSubtitle() {
  if (millis() - stateEnteredAt >= BOOT_SUBTITLE_HOLD_MS) {
    enterState(STATE_BOOT_PROGRESS);
    bootProgressColumn = 0;
    lcd.clear();
    lcdPrintLine(0, "Initializing...");
  }
}

void handleBootProgress() {
  unsigned long stepMs = BOOT_PROGRESS_TOTAL_MS / BOOT_PROGRESS_COLUMNS;
  if (bootProgressColumn < BOOT_PROGRESS_COLUMNS &&
      millis() - stateEnteredAt >= (unsigned long)(bootProgressColumn + 1) * stepMs) {
    lcd.setCursor(bootProgressColumn, 1);
    lcd.write(byte(GLYPH_BLOCK));
    bootProgressColumn++;
  }

  if (bootProgressColumn >= BOOT_PROGRESS_COLUMNS) {
    enterState(STATE_BOOT_SELFTEST);
    selfTestIndex = 0;
    selfTestFailStage = 0;
    selfTestEsp32Waiting = false;
    anySelfTestFailed = false;
    for (int i = 0; i < SELFTEST_COUNT; i++) selfTestResultKnown[i] = false;
  }
}

void handleBootReady() {
  if (millis() - stateEnteredAt >= BOOT_READY_HOLD_MS) {
    if (eepromHasUsers) {
      goToWaitScan();
    } else {
      enterState(STATE_INIT_CARD_1);
      lcd.clear();
      lcdPrintLine(0, "Scan First Card");
    }
  }
}

// ---------------------------------------------------------------
// HARDWARE SELF-TEST (item 2)
// Best-effort: sensors with no electrical feedback path (sound, RGB,
// buzzer) can't be verified without extra hardware, so they report OK.
// The board never halts on a failure — it logs it and moves on.
// ---------------------------------------------------------------
bool runSelfTestItem(int index) {
  switch (index) {
    case ST_LCD: {
      Wire.beginTransmission(LCD_ADDR);
      return Wire.endTransmission() == 0;
    }
    case ST_RFID: {
      byte version = rfid.PCD_ReadRegister(MFRC522::VersionReg);
      return version != 0x00 && version != 0xFF;
    }
    case ST_RTC:
      return !rtcFaultAtBoot;
    case ST_DHT: {
      float t = dht.readTemperature();
      return !isnan(t);
    }
    case ST_GAS: {
      int v = analogRead(GAS_PIN);
      return v > 0 && v < 1023;
    }
    case ST_FSR:
      return true; // unloaded FSR legitimately reads near 0 — no reliable single-sample test
    case ST_LDR: {
      int v = analogRead(LDR_PIN);
      return v > 0 && v < 1023;
    }
    case ST_SOUND:
    case ST_RGB:
    case ST_BUZZER:
      return true; // no feedback path on this hardware — presence assumed
    case ST_SERVO:
      doorServo.write(SERVO_OPEN_ANGLE); // exercise it as part of the boot demo
      return true;
    default:
      return true;
  }
}

void handleBootSelfTest() {
  if (selfTestIndex >= SELFTEST_COUNT) {
    enterState(STATE_BOOT_READY);
    lcd.clear();
    lcdPrintLine(0, "SYSTEM READY");
    lcdPrintLine(1, anySelfTestFailed ? "CHECK WARNINGS" : "ALL SYSTEMS OK");
    doorServo.write(SERVO_CLOSED_ANGLE); // restore after the servo self-test twitch
    return;
  }

  if (selfTestIndex == ST_ESP32 && !selfTestResultKnown[ST_ESP32]) {
    if (!selfTestEsp32Waiting) {
      selfTestEsp32Waiting = true;
      selfTestEsp32WaitStartedAt = millis();
      lcd.clear();
      lcdPrintLine(0, "CHECKING...");
      lcdPrintLine(1, "ESP32 LINK");
    }
    bool waited = millis() - selfTestEsp32WaitStartedAt >= BOOT_SELFTEST_ESP32_WAIT_MS;
    if (!esp32Linked && !waited) return;

    selfTestResult[ST_ESP32] = esp32Linked;
    selfTestResultKnown[ST_ESP32] = true;
    if (!esp32Linked) anySelfTestFailed = true;
    logInfo(String(selfTestNames[ST_ESP32]) + ": " + (esp32Linked ? "OK" : "NOT DETECTED"));
    lcd.clear();
    if (esp32Linked) { lcdPrintLine(0, selfTestNames[ST_ESP32]); lcdPrintLine(1, "OK"); }
    else             { lcdPrintLine(0, "ERROR");                 lcdPrintLine(1, selfTestNames[ST_ESP32]); }
    stateEnteredAt = millis();
    return;
  }

  if (!selfTestResultKnown[selfTestIndex]) {
    bool ok = runSelfTestItem(selfTestIndex);
    selfTestResult[selfTestIndex] = ok;
    selfTestResultKnown[selfTestIndex] = true;
    if (!ok) anySelfTestFailed = true;
    logInfo(String(selfTestNames[selfTestIndex]) + ": " + (ok ? "OK" : "NOT DETECTED"));
    lcd.clear();
    if (ok) { lcdPrintLine(0, selfTestNames[selfTestIndex]); lcdPrintLine(1, "OK"); }
    else    { lcdPrintLine(0, "ERROR");                       lcdPrintLine(1, selfTestNames[selfTestIndex]); }
    stateEnteredAt = millis();
    return;
  }

  unsigned long holdMs = selfTestResult[selfTestIndex] ? BOOT_SELFTEST_STEP_MS : BOOT_ERROR_HOLD_MS;
  if (millis() - stateEnteredAt < holdMs) return;

  if (!selfTestResult[selfTestIndex] && selfTestFailStage == 0) {
    selfTestFailStage = 1;
    lcd.clear();
    lcdPrintLine(0, selfTestNames[selfTestIndex]);
    lcdPrintLine(1, "NOT DETECTED");
    stateEnteredAt = millis();
    return;
  }

  selfTestIndex++;
  selfTestFailStage = 0;
  stateEnteredAt = millis();
}

// ---------------------------------------------------------------
// RFID HELPERS
// ---------------------------------------------------------------
bool tryReadCard(byte *uid, byte *uidLen) {
  if (!rfid.PICC_IsNewCardPresent()) return false;
  if (!rfid.PICC_ReadCardSerial()) return false;
  *uidLen = rfid.uid.size;
  memcpy(uid, rfid.uid.uidByte, rfid.uid.size);
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
  return true;
}

bool uidEquals(byte *a, byte lenA, byte *b, byte lenB) {
  if (lenA != lenB) return false;
  for (byte i = 0; i < lenA; i++) if (a[i] != b[i]) return false;
  return true;
}

int matchRegisteredCard(byte *uid, byte uidLen) {
  for (int i = 0; i < registeredCount; i++) {
    if (uidEquals(uid, uidLen, registeredUid[i], registeredUidLen[i])) return i;
  }
  return -1;
}

// ---------------------------------------------------------------
// FIRST-TIME REGISTRATION FLOW (non-blocking) — items 3 & 4
// Only reached when EEPROM had no valid saved cards.
// ---------------------------------------------------------------
void handleInitRegistration() {
  byte uid[10];
  byte uidLen;
  if (!tryReadCard(uid, &uidLen)) return;

  memcpy(pendingUid, uid, uidLen);
  pendingUidLen = uidLen;
  nameEntryBuffer = "";

  logInfo(String("Card detected, slot ") + (registeredCount + 1) + " — type a name in Serial Monitor (3s)...");
  lcd.clear();
  lcdPrintLine(0, "NAME? (3s)");

  enterState(state == STATE_INIT_CARD_1 ? STATE_INIT_CARD_1_NAME_WAIT : STATE_INIT_CARD_2_NAME_WAIT);
}

void handleNameEntry() {
  bool timedOut = (millis() - stateEnteredAt >= NAME_ENTRY_TIMEOUT_MS);
  bool gotLine = false;

  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\n') {
      gotLine = true;
      break;
    } else if (c != '\r') {
      nameEntryBuffer += c;
    }
  }

  if (!gotLine && !timedOut) return;

  nameEntryBuffer.trim();

  int slot = registeredCount;
  memcpy(registeredUid[slot], pendingUid, pendingUidLen);
  registeredUidLen[slot] = pendingUidLen;
  registeredName[slot] = (nameEntryBuffer.length() > 0) ? nameEntryBuffer : (String("User ") + String(slot + 1));
  registeredCount++;
  saveUsersToEeprom();

  setRGBColor(0, 255, 0);
  startBeep(1, BEEP_ON_MS);
  lcd.clear();

  if (slot == 0) {
    lcdPrintLine(0, "1st Card Saved");
    logInfo(String("Card 1 registered: ") + registeredName[slot]);
    enterState(STATE_INIT_CARD_1_HOLD);
  } else {
    lcdPrintLine(0, "2nd Card Saved");
    logInfo(String("Card 2 registered: ") + registeredName[slot]);
    enterState(STATE_INIT_CARD_2_HOLD);
  }
}

void goToWaitScan() {
  enterState(STATE_WAIT_SCAN);
  lastOverrideKind = OVR_NONE;
  lcd.clear();
  lcdPrintLine(0, "PLEASE SCAN");
  lcdPrintLine(1, "YOUR CARD");
}

// ---------------------------------------------------------------
// ACCESS CONTROL (entry) — item 5
// ---------------------------------------------------------------
void handleAccessControl() {
  byte uid[10];
  byte uidLen;
  if (!tryReadCard(uid, &uidLen)) return;

  int slot = matchRegisteredCard(uid, uidLen);
  if (slot >= 0) {
    setRGBColor(0, 255, 0);
    startBeep(1, BEEP_ON_MS);
    currentUserName = registeredName[slot];
    lcd.clear();
    lcdPrintLine(0, "DOOR OPEN");
    lcdPrintLine(1, "WELCOME " + currentUserName);

    openDoor();
    logInfo(String("Access granted: ") + currentUserName);
    sendAccessEvent("granted", uid, uidLen, currentUserName);

    enterState(STATE_ACCESS_GRANTED_HOLD);
  } else {
    setRGBColor(255, 0, 0);
    startBeep(2, 120);
    lcd.clear();
    lcdPrintLine(0, "WRONG CARD");
    logWarn(String("Access denied: unknown card ") + uidToString(uid, uidLen));
    sendAccessEvent("denied", uid, uidLen, "");

    enterState(STATE_ACCESS_DENIED_HOLD);
  }
}

void handleExitScan() {
  byte uid[10];
  byte uidLen;
  if (!tryReadCard(uid, &uidLen)) return;

  int slot = matchRegisteredCard(uid, uidLen);
  if (slot >= 0) {
    openDoor();
    lcd.clear();
    lcdPrintLine(0, "GOODBYE");
    lcdPrintLine(1, registeredName[slot]);
    logInfo(String("Exit: ") + registeredName[slot]);
    currentUserName = "";
    enterState(STATE_EXIT_HOLD);
  }
}

// ---------------------------------------------------------------
// DOOR / SERVO
// ---------------------------------------------------------------
void openDoor() {
  doorServo.write(SERVO_OPEN_ANGLE);
  doorIsOpen = true;
  doorOpenedAt = millis();
}

void closeDoor() {
  doorServo.write(SERVO_CLOSED_ANGLE);
  doorIsOpen = false;
}

void handleDoorAutoClose() {
  if (remoteEmergencyActive || localEmergencyActive) return; // stay open for the whole emergency
  if (doorIsOpen && (millis() - doorOpenedAt >= DOOR_OPEN_MS)) {
    closeDoor();
  }
}

// ---------------------------------------------------------------
// SENSOR VALIDATION (reject impossible/corrupted readings)
// ---------------------------------------------------------------
float validateTemp(float raw) {
  if (isnan(raw) || raw < TEMP_MIN_C || raw > TEMP_MAX_VALID_C) {
    logWarn(String("Sensor validation failed: temperature=") + String(raw));
    return lastGoodTemp;
  }
  lastGoodTemp = raw;
  return raw;
}

float validateHum(float raw) {
  if (isnan(raw) || raw < HUM_MIN_PCT || raw > HUM_MAX_VALID_PCT) {
    logWarn(String("Sensor validation failed: humidity=") + String(raw));
    return lastGoodHum;
  }
  lastGoodHum = raw;
  return raw;
}

int validateGas(int raw) {
  if (raw < GAS_MIN_RAW || raw > GAS_MAX_RAW_VALID) {
    logWarn(String("Sensor validation failed: gas=") + String(raw));
    return lastGoodGas;
  }
  lastGoodGas = raw;
  return raw;
}

int validateFsr(int raw) {
  if (raw < FSR_MIN_RAW || raw > FSR_MAX_RAW_VALID) {
    logWarn(String("Sensor validation failed: fsr=") + String(raw));
    return lastGoodFsr;
  }
  lastGoodFsr = raw;
  return raw;
}

int validateLdr(int raw) {
  if (raw < LDR_MIN_RAW || raw > LDR_MAX_RAW_VALID) {
    logWarn(String("Sensor validation failed: light=") + String(raw));
    return lastGoodLdr;
  }
  if (abs(raw - lastGoodLdr) > LDR_SPIKE_JUMP) {
    logWarn(String("Sensor validation failed: light spike raw=") + String(raw) + " last=" + String(lastGoodLdr));
    return lastGoodLdr;
  }
  lastGoodLdr = raw;
  return raw;
}

// ---------------------------------------------------------------
// SENSOR HEALTH (item 18) — consecutive-failure streak, not a single
// bad sample, so a transient glitch doesn't get reported as an offline
// sensor. Clears itself the moment good readings resume.
// ---------------------------------------------------------------
void updateSensorHealth(float rawTemp, int rawGas, int rawLdr) {
  if (isnan(rawTemp)) tempFailStreak++; else tempFailStreak = 0;
  tempSensorOffline = tempFailStreak >= SENSOR_FAULT_STREAK;

  if (rawGas <= GAS_MIN_RAW || rawGas >= GAS_MAX_RAW_VALID) gasFailStreak++; else gasFailStreak = 0;
  gasSensorFault = gasFailStreak >= SENSOR_FAULT_STREAK;

  if (rawLdr <= LDR_MIN_RAW || rawLdr >= LDR_MAX_RAW_VALID) ldrFailStreak++; else ldrFailStreak = 0;
  ldrSensorFault = ldrFailStreak >= SENSOR_FAULT_STREAK;
}

String firstActiveFault() {
  if (tempSensorOffline) return "TEMP OFFLINE";
  if (gasSensorFault) return "MQ SENSOR ERR";
  if (ldrSensorFault) return "LDR DISCONN.";
  return "";
}

// ---------------------------------------------------------------
// TWO-TIER HAZARD DETECTION (Warning / Emergency) — items 11 & 12
// ---------------------------------------------------------------
String warningMessageFor(const String &kind) {
  if (kind == "gas") return "Gas Detected";
  if (kind == "temperature") return "Temp High";
  if (kind == "humidity") return "Humidity High";
  return "";
}

String emergencyMessageFor(const String &kind) {
  if (kind == "gas") return "GAS DANGER";
  if (kind == "temperature") return "TEMP DANGER";
  if (kind == "humidity") return "HUMIDITY DANGER";
  return "DOOR OPEN/ALARM";
}

void updateHazardState(float temp, float hum, int gasRaw) {
  HazardTier newTier = HAZARD_NONE;
  String newKind = "";

  if (gasRaw > GAS_EMERGENCY_RAW)       { newTier = HAZARD_EMERGENCY; newKind = "gas"; }
  else if (temp > TEMP_EMERGENCY_C)     { newTier = HAZARD_EMERGENCY; newKind = "temperature"; }
  else if (hum > HUM_EMERGENCY_PCT)     { newTier = HAZARD_EMERGENCY; newKind = "humidity"; }
  else if (gasRaw > GAS_WARN_RAW)       { newTier = HAZARD_WARNING;   newKind = "gas"; }
  else if (temp > TEMP_WARN_C)          { newTier = HAZARD_WARNING;   newKind = "temperature"; }
  else if (hum > HUM_WARN_PCT)          { newTier = HAZARD_WARNING;   newKind = "humidity"; }

  if (newTier == hazardTier && newKind == hazardKind) return;

  int value = (newKind == "gas") ? gasRaw : (int)(newKind == "temperature" ? temp : hum);

  if (newTier == HAZARD_EMERGENCY) {
    logEmergency(String("Hazard emergency: ") + newKind + " = " + value);
    sendAlertEvent(newKind.c_str(), value, "emergency");
    if (!localEmergencyActive) {
      localEmergencyActive = true;
      openDoor();
    }
  } else if (newTier == HAZARD_WARNING) {
    logWarn(String("Hazard warning: ") + newKind + " = " + value);
    sendAlertEvent(newKind.c_str(), value, "warning");
    localEmergencyActive = false;
  } else {
    logInfo(F("Hazard cleared — SYSTEM NORMAL"));
    localEmergencyActive = false;
    showSystemBanner("SYSTEM NORMAL", "All Clear", MESSAGE_HOLD_MEDIUM_MS);
  }

  hazardTier = newTier;
  hazardKind = newKind;
}

// ---------------------------------------------------------------
// TRENDS + RUNNING STATISTICS (items 8 & 16)
// EMA (exponential moving average) keeps this O(1) in RAM — no sample
// history array needed.
// ---------------------------------------------------------------
int8_t computeTrend(float current, float previous, float delta) {
  if (current - previous > delta) return 1;
  if (previous - current > delta) return -1;
  return 0;
}

void updateStatistics(float temp, float hum, int gasRaw) {
  if (millis() - lastStatsSampleAt < STATS_SAMPLE_INTERVAL_MS) return;
  lastStatsSampleAt = millis();

  if (!statsInitialized) {
    avgTemp = temp; avgHum = hum; avgGas = gasRaw;
    prevTrendTemp = temp; prevTrendHum = hum; prevTrendGas = gasRaw;
    statsInitialized = true;
    return;
  }

  tempTrend = computeTrend(temp, prevTrendTemp, TREND_DELTA_TEMP_C);
  humTrend  = computeTrend(hum, prevTrendHum, TREND_DELTA_HUM_PCT);
  gasTrend  = computeTrend((float)gasRaw, prevTrendGas, (float)TREND_DELTA_GAS_RAW);
  prevTrendTemp = temp; prevTrendHum = hum; prevTrendGas = gasRaw;

  avgTemp += STATS_EMA_ALPHA * (temp - avgTemp);
  avgHum  += STATS_EMA_ALPHA * (hum - avgHum);
  avgGas  += STATS_EMA_ALPHA * (gasRaw - avgGas);
}

// ---------------------------------------------------------------
// SMART RECOMMENDATIONS (item 9) — computed locally from live sensor
// state + time of day (the ESP32/backend protocol has no "recommendation"
// channel today; if one is ever added, a remote value take priority for
// up to 60s — see the "recommendation" branch in handleCommand()).
// ---------------------------------------------------------------
String computeRecommendation() {
  if (remoteRecommendationText.length() > 0 && millis() - remoteRecommendationAt < 60000UL) {
    return remoteRecommendationText;
  }

  RtcDateTime now = Rtc.GetDateTime();
  if (bedOccupied && soundDetectedWhileLying) return "Reduce Noise";
  if (isDark && (now.Hour() >= 22 || now.Hour() < 6)) return "Sleep Earlier";
  if (avgGas > GAS_WARN_RAW * 0.7f) return "Open Window";
  if (avgTemp > 26.0f) return "Drink Water";
  if (!isDark && !bedOccupied && avgTemp >= 18.0f && avgTemp <= 26.0f && avgHum >= 30.0f && avgHum <= 60.0f) {
    return "Excellent Weather";
  }
  if (!isDark && !bedOccupied) return "Good Day For Walking";
  return "Stay Hydrated";
}

String currentRecommendation() {
  if (recommendationText.length() == 0 || millis() - recommendationLastRotateAt >= RECOMMENDATION_ROTATE_MS) {
    recommendationLastRotateAt = millis();
    recommendationText = computeRecommendation();
  }
  return recommendationText;
}

String greetingForHour(int hour) {
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

String rgbColorName(int r, int g, int b) {
  if (r == 0 && g == 0 && b == 0) return "OFF";
  if (r > 150 && g < 80 && b < 80) return "RED";
  if (g > 150 && r < 80 && b < 80) return "GREEN";
  if (b > 150 && r < 80 && g < 80) return "BLUE";
  if (r > 150 && g > 100 && b < 80) return "ORANGE";
  if (r > 150 && g > 150 && b > 150) return "WHITE";
  return "CUSTOM";
}

// ---------------------------------------------------------------
// SMART LCD DASHBOARD CAROUSEL (item 6) — one page per tick, no
// clear(), no flicker. Priority overrides (emergency/RTC/warning/lying
// down) are handled by updateInsideLcd() before this is ever reached.
// ---------------------------------------------------------------
void renderDashboardPage(int page, float temp, float hum, int gasRaw, bool lyingDownNow) {
  RtcDateTime now = Rtc.GetDateTime();
  switch (page) {
    case DASH_GREETING:
      lcdPrintLine(0, greetingForHour(now.Hour()));
      lcdPrintLine(1, currentUserName.length() ? currentUserName : String("Welcome Back"));
      break;
    case DASH_DATE: {
      char dateStr[17];
      snprintf(dateStr, sizeof(dateStr), "%02d %s %04d", now.Day(), MONTH_ABBR[now.Month()], now.Year());
      lcdPrintLine(0, DOW_NAMES[now.DayOfWeek()]);
      lcdPrintLine(1, dateStr);
      break;
    }
    case DASH_TIME: {
      char timeStr[9];
      snprintf(timeStr, sizeof(timeStr), "%02d:%02d:%02d", now.Hour(), now.Minute(), now.Second());
      lcdPrintLine(0, "Time");
      lcdPrintLine(1, timeStr);
      break;
    }
    case DASH_TEMP:
      lcdPrintLine(0, "Temperature");
      lcdPrintLineWithTrendArrow(1, String((int)temp) + "C", tempTrend);
      break;
    case DASH_HUM:
      lcdPrintLine(0, "Humidity");
      lcdPrintLineWithTrendArrow(1, String((int)hum) + "%", humTrend);
      break;
    case DASH_GAS:
      lcdPrintLine(0, "Gas");
      lcdPrintLineWithTrendArrow(1, gasRaw > GAS_WARN_RAW ? "Elevated" : "Normal", gasTrend);
      break;
    case DASH_LIGHT:
      lcdPrintLine(0, "Light Level");
      lcdPrintLine(1, isDark ? "Dark (Night)" : "Bright (Day)");
      break;
    case DASH_BED:
      lcdPrintLine(0, "Bed Status");
      lcdPrintLine(1, lyingDownNow ? "Occupied" : "Available");
      break;
    case DASH_RECOMMENDATION:
      lcdPrintLine(0, "Recommendation");
      lcdPrintLine(1, currentRecommendation());
      break;
    case DASH_RGB:
      lcdPrintLine(0, "RGB Status");
      lcdPrintLine(1, rgbColorName(remoteRgbR, remoteRgbG, remoteRgbB));
      break;
    case DASH_DOOR:
      lcdPrintLine(0, "Door Status");
      lcdPrintLine(1, doorIsOpen ? "OPEN" : "CLOSED");
      break;
    case DASH_STATS:
      lcdPrintLine(0, "Avg T:" + String((int)avgTemp) + "C H:" + String((int)avgHum) + "%");
      lcdPrintLine(1, "Avg Gas:" + String((int)avgGas));
      break;
    case DASH_SENSOR_HEALTH: {
      String fault = firstActiveFault();
      lcdPrintLine(0, fault.length() ? "SENSOR FAULT" : "Sensor Health");
      lcdPrintLine(1, fault.length() ? fault : String("All OK"));
      break;
    }
  }
}

void updateInsideLcd(float temp, float hum, int gasRaw, bool lyingDownNow) {
  if (systemBannerActive) return;

  bool emergencyActive = remoteEmergencyActive || localEmergencyActive;
  if (emergencyActive) {
    String detail = localEmergencyActive ? emergencyMessageFor(hazardKind) : String("DOOR OPEN/ALARM");
    showOverrideOnce(OVR_EMERGENCY, "EMERGENCY", detail);
    return;
  }
  if (!Rtc.IsDateTimeValid()) {
    showOverrideOnce(OVR_RTC_ERROR, "RTC ERROR", "CHECK CLOCK");
    return;
  }
  if (hazardTier == HAZARD_WARNING) {
    showOverrideOnce(OVR_WARNING, "WARNING", warningMessageFor(hazardKind));
    return;
  }
  if (lyingDownNow && soundDetectedWhileLying) {
    showOverrideOnce(OVR_LYING, "YOU ARE LYING", "DOWN + NOISE");
    return;
  }

  lastOverrideKind = OVR_NONE;

  if (millis() - lastLcdCycleAt >= DASHBOARD_PAGE_MS || dashboardForceRedraw) {
    lastLcdCycleAt = millis();
    dashboardForceRedraw = false;
    dashPage = (dashPage + 1) % DASH_PAGE_COUNT;
    renderDashboardPage(dashPage, temp, hum, gasRaw, lyingDownNow);
  }
}

// ---------------------------------------------------------------
// INSIDE MONITORING
// ---------------------------------------------------------------
void handleInsideMonitoring() {
  float rawTemp = dht.readTemperature();
  float rawHum = dht.readHumidity();
  int rawGas = analogRead(GAS_PIN);
  int rawFsr = analogRead(FSR_PIN);
  int rawLdr = analogRead(LDR_PIN);
  int soundState = digitalRead(SOUND_PIN);

  updateSensorHealth(rawTemp, rawGas, rawLdr);

  float temp = validateTemp(rawTemp);
  float hum = validateHum(rawHum);
  int gasRaw = validateGas(rawGas);
  int fsrRaw = validateFsr(rawFsr);
  int ldrRaw = validateLdr(rawLdr);

  // ---- LDR: Day/Night detection (item 15) ----
  isDark = (ldrRaw < LDR_DARK_THRESHOLD);
  if (isDark != lastIsDark && (millis() - lastLdrChangeAt >= LDR_DEBOUNCE_MS)) {
    lastLdrChangeAt = millis();
    lastIsDark = isDark;
    logInfo(isDark ? "Night" : "Morning");
    showSystemBanner("Night Mode", isDark ? "Activated" : "Day Mode", MESSAGE_HOLD_MEDIUM_MS);
  }

  updateHazardState(temp, hum, gasRaw);

  // ---- Bed presence + sound-while-lying detection ----
  bedOccupied = fsrRaw > FSR_BED_THRESHOLD;

  if (bedOccupied && soundState == HIGH) {
    if (!soundDetectedWhileLying) {
      soundDetectedWhileLying = true;
      soundDetectedAt = millis();
      logInfo(F("Sound detected while lying down"));
    }
  }

  if (soundDetectedWhileLying && (millis() - soundDetectedAt >= SOUND_DISPLAY_DURATION_MS)) {
    soundDetectedWhileLying = false;
    soundDetectedAt = 0;
  }

  if (bedOccupied && !wasLyingDown) {
    sendBedEvent("lying");
    soundDetectedWhileLying = false;
    soundDetectedAt = 0;
  } else if (!bedOccupied && wasLyingDown) {
    sendBedEvent("empty");
    soundDetectedWhileLying = false;
    soundDetectedAt = 0;
  }
  wasLyingDown = bedOccupied;

  updateStatistics(temp, hum, gasRaw);
  updateInsideLcd(temp, hum, gasRaw, bedOccupied);

  // ---- Periodic sensor push to ESP32 (protocol unchanged) ----
  if (millis() - lastSensorSendAt >= SENSOR_SEND_INTERVAL_MS) {
    lastSensorSendAt = millis();
    RtcDateTime now = Rtc.GetDateTime();
    char timeStr[9];
    char dateStr[11];
    snprintf(timeStr, sizeof(timeStr), "%02d:%02d", now.Hour(), now.Minute());
    snprintf(dateStr, sizeof(dateStr), "%02d/%02d/%04d", now.Day(), now.Month(), now.Year());
    sendSensorData(temp, hum, gasRaw, ldrRaw, fsrRaw, soundState, timeStr, dateStr);
  }
}

// ---------------------------------------------------------------
// ACTUATOR ARBITRATION (called once per loop, never blocks)
// Priority: Emergency (local or remote) > Warning > manual/idle state
// ---------------------------------------------------------------
void updateActuators() {
  bool emergencyActive = remoteEmergencyActive || localEmergencyActive;
  bool warningActive = (hazardTier == HAZARD_WARNING) && !emergencyActive;

  // ----- Buzzer -----
  if (emergencyActive) {
    buzzPulse(EMERGENCY_BUZZER_PULSE_MS, 1000);
  } else if (manualBuzzerOn) {
    tone(BUZZER_PIN, 2000);
  } else if (warningActive) {
    buzzPulse(WARN_BUZZER_PULSE_MS, 1200);
  } else if (beepSeq.active) {
    updateBeepSequencer();
  } else {
    noTone(BUZZER_PIN);
  }

  // ----- RGB -----
  if (emergencyActive) {
    setRGBColor(255, 0, 0);
  } else if (warningActive) {
    setRGBColor(255, 140, 0); // orange
  } else if (state == STATE_WAIT_SCAN || state == STATE_INSIDE) {
    setRGBColor(remoteRgbR, remoteRgbG, remoteRgbB);
  }
  // transient states (registration/access flashes) manage their own RGB above
}

void buzzPulse(unsigned long intervalMs, int toneHz) {
  if (millis() - lastAlarmToggleAt > intervalMs) {
    lastAlarmToggleAt = millis();
    alarmToneOn = !alarmToneOn;
    if (alarmToneOn) tone(BUZZER_PIN, toneHz);
    else noTone(BUZZER_PIN);
  }
}

// ---------------------------------------------------------------
// RGB / LAMP / BEEP HELPERS
// ---------------------------------------------------------------
void setRGBColor(int r, int g, int b) {
  r = constrain(r, 0, 255);
  g = constrain(g, 0, 255);
  b = constrain(b, 0, 255);
  if (!RGB_COMMON_CATHODE) { r = 255 - r; g = 255 - g; b = 255 - b; }
  analogWrite(RGB_R_PIN, r);
  analogWrite(RGB_G_PIN, g);
  analogWrite(RGB_B_PIN, b);
}

void setLamp(bool on) {
  lampOn = on;
  digitalWrite(LAMP_PIN, on ? HIGH : LOW);
}

void startBeep(int times, int durationMs) {
  beepSeq.active = true;
  beepSeq.remaining = times;
  beepSeq.durationMs = durationMs;
  beepSeq.toneStarted = false;
  beepSeq.lastChangeAt = millis();
}

void updateBeepSequencer() {
  if (!beepSeq.active) return;
  unsigned long elapsed = millis() - beepSeq.lastChangeAt;
  if (!beepSeq.toneStarted) {
    tone(BUZZER_PIN, 2000, beepSeq.durationMs);
    beepSeq.toneStarted = true;
    beepSeq.lastChangeAt = millis();
  } else if (elapsed >= (unsigned long)(beepSeq.durationMs + BEEP_GAP_MS)) {
    beepSeq.remaining--;
    if (beepSeq.remaining <= 0) {
      beepSeq.active = false;
      noTone(BUZZER_PIN);
    } else {
      tone(BUZZER_PIN, 2000, beepSeq.durationMs);
      beepSeq.lastChangeAt = millis();
    }
  }
}

// ---------------------------------------------------------------
// REMOTE EMERGENCY (commanded by ESP32/backend) — item 13
// ---------------------------------------------------------------
void startRemoteEmergency() {
  if (remoteEmergencyActive) return;
  remoteEmergencyActive = true;
  openDoor();
  logEmergency(F("Emergency Activated"));
  logEmergency(F("Door Opened"));
  logEmergency(F("RGB Red"));
  logEmergency(F("Buzzer Enabled"));
}

void stopRemoteEmergency() {
  if (!remoteEmergencyActive) return;
  remoteEmergencyActive = false;
  noTone(BUZZER_PIN);
  logInfo(F("Emergency Resolved"));
}

// ---------------------------------------------------------------
// ESP32 LINK HEALTH (item 14) — driven by the "ping" heartbeat frame
// the ESP32 now sends every HEARTBEAT_INTERVAL_MS over the same UART.
// ---------------------------------------------------------------
void updateEsp32Link() {
  bool linkedNow = (lastEsp32SeenAt != 0) && (millis() - lastEsp32SeenAt < ESP32_LINK_TIMEOUT_MS);
  if (linkedNow != esp32Linked) {
    esp32Linked = linkedNow;
    logInfo(esp32Linked ? F("ESP32 Connected") : F("ESP32 Offline"));
    if (state == STATE_WAIT_SCAN || state == STATE_INSIDE) {
      showSystemBanner("ESP32", esp32Linked ? "CONNECTED" : "OFFLINE", MESSAGE_HOLD_MEDIUM_MS);
    }
  }

  if (!esp32Linked) {
    if (millis() - lastStatusLedToggleAt >= STATUS_LED_BLINK_MS) {
      lastStatusLedToggleAt = millis();
      statusLedOn = !statusLedOn;
      digitalWrite(STATUS_LED_PIN, statusLedOn ? HIGH : LOW);
    }
  } else if (statusLedOn) {
    statusLedOn = false;
    digitalWrite(STATUS_LED_PIN, LOW);
  }
}

// ---------------------------------------------------------------
// FRAME HELPERS (checksum + duplicate-safe framing)
// Wire format: <json>*<XX>\n  where XX = 2-hex XOR checksum of <json>
// (UNCHANGED — this is the exact protocol the ESP32 already parses.)
// ---------------------------------------------------------------
byte computeChecksum(const String &s) {
  byte chk = 0;
  for (size_t i = 0; i < s.length(); i++) chk ^= (byte)s[i];
  return chk;
}

void sendFrame(JsonDocument &doc, const char *typeLabel) {
  doc["seq"] = txSeq++;
  String out;
  serializeJson(doc, out);
  byte chk = computeChecksum(out);

  Serial1.print(out);
  Serial1.print('*');
  if (chk < 0x10) Serial1.print('0');
  Serial1.println(chk, HEX);

  logInfo(String("TX->ESP32 [") + typeLabel + "]");
}

// ---------------------------------------------------------------
// UART -> ESP32 (framed JSON messages, one per line)
// ---------------------------------------------------------------
void sendSensorData(float temp, float hum, int gas, int light, int fsr, int sound,
                     const char *timeStr, const char *dateStr) {
  StaticJsonDocument<384> doc;
  doc["type"] = "sensors";
  doc["temp"] = temp;
  doc["hum"] = hum;
  doc["gas"] = gas;
  doc["light"] = light;
  doc["fsr"] = fsr;
  doc["sound"] = sound;
  doc["dark"] = isDark;
  doc["lamp"] = lampOn;
  doc["door"] = doorIsOpen;
  doc["buzzer"] = remoteEmergencyActive || localEmergencyActive || manualBuzzerOn || (hazardTier == HAZARD_WARNING);
  JsonObject rgb = doc.createNestedObject("rgb");
  rgb["r"] = remoteRgbR;
  rgb["g"] = remoteRgbG;
  rgb["b"] = remoteRgbB;
  doc["time"] = timeStr;
  doc["date"] = dateStr;
  sendFrame(doc, "sensors");
}

void sendAccessEvent(const char *status, byte *uid, byte uidLen, String name) {
  StaticJsonDocument<224> doc;
  doc["type"] = "access";
  doc["status"] = status;
  doc["uid"] = uidToString(uid, uidLen);
  if (name.length() > 0) doc["name"] = name;
  sendFrame(doc, "access");
}

void sendAlertEvent(const char *kind, int value, const char *severity) {
  StaticJsonDocument<192> doc;
  doc["type"] = "alert";
  doc["kind"] = kind;
  doc["value"] = value;
  doc["severity"] = severity;
  sendFrame(doc, "alert");
}

void sendBedEvent(const char *status) {
  StaticJsonDocument<128> doc;
  doc["type"] = "bed";
  doc["status"] = status;
  sendFrame(doc, "bed");
}

void sendAck(const char *action, bool ok) {
  StaticJsonDocument<128> doc;
  doc["type"] = "ack";
  doc["action"] = action;
  doc["result"] = ok ? "ok" : "error";
  sendFrame(doc, "ack");
}

String uidToString(byte *uid, byte uidLen) {
  String s = "";
  for (byte i = 0; i < uidLen; i++) {
    if (uid[i] < 0x10) s += "0";
    s += String(uid[i], HEX);
  }
  s.toUpperCase();
  return s;
}

// ---------------------------------------------------------------
// UART <- ESP32 (remote commands + heartbeat)
// Ignores corrupted/truncated/duplicate packets; never blocks or crashes
// on malformed input.
// ---------------------------------------------------------------
void receiveFromESP32() {
  while (Serial1.available()) {
    char c = Serial1.read();
    cmdLineStartedAt = millis();

    if (c == '\n') {
      if (cmdLineBuffer.length() > 0) {
        processCommandLine(cmdLineBuffer);
      }
      cmdLineBuffer = "";
    } else if (c != '\r') {
      cmdLineBuffer += c;
      if (cmdLineBuffer.length() > SERIAL_LINE_MAX_LEN) {
        logWarn(F("Command line too long, discarded"));
        cmdLineBuffer = "";
      }
    }
  }

  // Recover from a stale partial line (e.g. a dropped byte on the wire)
  if (cmdLineBuffer.length() > 0 && millis() - cmdLineStartedAt > SERIAL_LINE_TIMEOUT_MS) {
    logWarn(F("Stale partial command line, discarded"));
    cmdLineBuffer = "";
  }
}

void processCommandLine(const String &line) {
  int star = line.lastIndexOf('*');
  if (star < 0 || star + 2 >= (int)line.length()) {
    logWarn(F("Malformed command frame (no checksum), ignored"));
    return;
  }

  String json = line.substring(0, star);
  String chkStr = line.substring(star + 1);
  byte expected = (byte)strtol(chkStr.c_str(), nullptr, 16);
  byte actual = computeChecksum(json);

  if (expected != actual) {
    logWarn(F("Command checksum mismatch, packet dropped (corrupted)"));
    return;
  }

  StaticJsonDocument<256> doc;
  DeserializationError err = deserializeJson(doc, json);
  if (err) {
    logWarn(String("Command JSON parse error: ") + err.c_str());
    return;
  }

  // Any well-formed, checksum-valid frame from the ESP32 proves the link
  // is alive — including the periodic heartbeat, handled below.
  lastEsp32SeenAt = millis();

  const char *type = doc["type"] | "";

  if (strcmp(type, "ping") == 0) {
    return; // heartbeat only, nothing to execute
  }

  if (strcmp(type, "cmd") != 0) {
    logWarn(String("Unknown frame type from ESP32: ") + type);
    return;
  }

  uint16_t seq = doc["seq"] | 0;
  if (haveSeenCmdSeq && seq == lastCmdSeq) {
    logWarn(F("Duplicate command ignored"));
    return;
  }
  lastCmdSeq = seq;
  haveSeenCmdSeq = true;

  handleCommand(doc);
}

void handleCommand(JsonDocument &doc) {
  const char *action = doc["action"] | "";
  bool ok = true;

  if (strcmp(action, "door") == 0) {
    const char *value = doc["value"] | "";
    if (strcmp(value, "open") == 0) {
      openDoor();
      logInfo(F("Remote command: Door Open"));
    } else if (strcmp(value, "close") == 0) {
      closeDoor();
      logInfo(F("Remote command: Door Close"));
    } else {
      ok = false;
    }
  } else if (strcmp(action, "rgb") == 0) {
    remoteRgbR = constrain((int)(doc["r"] | 0), 0, 255);
    remoteRgbG = constrain((int)(doc["g"] | 0), 0, 255);
    remoteRgbB = constrain((int)(doc["b"] | 0), 0, 255);
    logInfo(String("Remote command: RGB(") + String(remoteRgbR) + "," + String(remoteRgbG) + "," + String(remoteRgbB) + ")");
  } else if (strcmp(action, "buzzer") == 0) {
    const char *value = doc["value"] | "";
    manualBuzzerOn = (strcmp(value, "on") == 0);
    logInfo(manualBuzzerOn ? F("Remote command: Buzzer On") : F("Remote command: Buzzer Off"));
  } else if (strcmp(action, "lamp") == 0) {
    const char *value = doc["value"] | "";
    setLamp(strcmp(value, "on") == 0);
    logInfo(lampOn ? F("Remote command: Lamp On") : F("Remote command: Lamp Off"));
  } else if (strcmp(action, "emergency") == 0) {
    const char *value = doc["value"] | "";
    if (strcmp(value, "activate") == 0) startRemoteEmergency();
    else if (strcmp(value, "resolve") == 0) stopRemoteEmergency();
    else ok = false;
  } else if (strcmp(action, "recommendation") == 0) {
    // Forward-compatible only: nothing on the ESP32/backend sends this
    // today, but if it ever does, it takes priority on the dashboard.
    remoteRecommendationText = String((const char *)(doc["value"] | ""));
    remoteRecommendationAt = millis();
    logInfo(String("Remote command: Recommendation - ") + remoteRecommendationText);
  } else {
    logWarn(String("Unknown command action: ") + action);
    ok = false;
  }

  sendAck(action, ok);
}
