/*
  =====================================================================
  SMART HEALTH ROOM - ARDUINO MEGA 2560 - CONFIGURATION
  =====================================================================
  Every configurable value lives here. No secrets on this board (Wi-Fi/
  backend config lives on the ESP32 side), just hardware/timing/limits.
*/
#ifndef SMART_ROOM_ARDUINO_CONFIG_H
#define SMART_ROOM_ARDUINO_CONFIG_H

// ---------------------------------------------------------------
// FIRMWARE IDENTITY
// ---------------------------------------------------------------
#define FIRMWARE_VERSION   "2.0.0"
#define DEVICE_NAME        "SmartHealthRoom-Mega"

// ---------------------------------------------------------------
// PIN DEFINITIONS
// (Existing wiring reused as-is. LAMP_PIN=9 confirmed already wired
//  by the hardware owner — do not reassign without approval.)
// ---------------------------------------------------------------
#define RFID_SS_PIN   53
#define RFID_RST_PIN  49

#define LCD_ADDR      0x27
#define LCD_COLS      16
#define LCD_ROWS      2

#define DHT_PIN       A1
#define DHT_TYPE      DHT11

#define GAS_PIN       A0
#define FSR_PIN       A2
#define LDR_PIN       A3

#define SOUND_PIN     8
#define BUZZER_PIN    2

#define RGB_R_PIN     3
#define RGB_G_PIN     5
#define RGB_B_PIN     6
#define RGB_COMMON_CATHODE true

#define LAMP_PIN      9

#define SERVO_PIN          7
#define SERVO_CLOSED_ANGLE 0
#define SERVO_OPEN_ANGLE   90
#define DOOR_OPEN_MS       5000UL

#define RTC_CLK_PIN   22
#define RTC_DAT_PIN   23
#define RTC_RST_PIN   24

// External status LED — blinks while the ESP32 link is down, solid/off
// when connected. Pin 4 chosen because D9 (the spec's original suggestion)
// is already LAMP_PIN on this board.
#define STATUS_LED_PIN        4
#define STATUS_LED_BLINK_MS   300UL

// ---------------------------------------------------------------
// EEPROM (persistent RFID card storage — survives reboot/power loss)
// ---------------------------------------------------------------
#define EEPROM_ADDR          0
#define EEPROM_MAGIC_BYTE    0xA5
#define MAX_USERS            2
#define USER_NAME_MAX_LEN    20   // + 1 null terminator in storage

// ---------------------------------------------------------------
// SERIAL LINKS
// ---------------------------------------------------------------
#define DEBUG_SERIAL_BAUD       9600   // USB Serial (logging)
#define ESP32_SERIAL_BAUD       9600   // Serial1 <-> ESP32 (pins 18/19)
#define SERIAL_LINE_MAX_LEN     500    // reject/reset a line longer than this
#define SERIAL_LINE_TIMEOUT_MS  500UL  // reset a stale partial line (no '\n') after this long

// ---------------------------------------------------------------
// SENSOR VALIDATION BOUNDS
// Values outside [MIN, MAX_VALID] are rejected as corrupted/impossible.
// Two hazard tiers: *_WARN_* (slightly exceeded, orange/slow buzzer) and
// *_EMERGENCY_* (dangerous, red/fast buzzer/door auto-opens).
// ---------------------------------------------------------------
#define TEMP_MIN_C         -20.0
#define TEMP_MAX_VALID_C    60.0
#define TEMP_WARN_C         30.0
#define TEMP_EMERGENCY_C    35.0

#define HUM_MIN_PCT          0.0
#define HUM_MAX_VALID_PCT  100.0
#define HUM_WARN_PCT         60.0
#define HUM_EMERGENCY_PCT    70.0

#define GAS_MIN_RAW           0
#define GAS_MAX_RAW_VALID  1023
#define GAS_WARN_RAW        300
#define GAS_EMERGENCY_RAW   400

#define FSR_MIN_RAW            0
#define FSR_MAX_RAW_VALID   1023
#define FSR_BED_THRESHOLD    300

#define LDR_MIN_RAW            0
#define LDR_MAX_RAW_VALID   1023
#define LDR_DARK_THRESHOLD   500
#define LDR_SPIKE_JUMP        600  // reject a single-sample jump bigger than this vs. last accepted value

// ---------------------------------------------------------------
// TIMING (all non-blocking, millis()-based)
// ---------------------------------------------------------------
#define SENSOR_SEND_INTERVAL_MS    2000UL
#define LDR_DEBOUNCE_MS            2000UL
#define SOUND_DISPLAY_DURATION_MS  3000UL
#define MESSAGE_HOLD_SHORT_MS      1200UL
#define MESSAGE_HOLD_MEDIUM_MS     1500UL
#define NAME_ENTRY_TIMEOUT_MS      3000UL
#define BEEP_ON_MS                  150UL
#define BEEP_GAP_MS                  80UL
#define WARN_BUZZER_PULSE_MS         600UL   // slow pulse for WARNING tier
#define EMERGENCY_BUZZER_PULSE_MS    150UL   // fast pulse for EMERGENCY tier
#define DOOR_COUNTDOWN_STEP_MS      1000UL   // one countdown digit per second (matches DOOR_OPEN_MS=5000)

// ---------------------------------------------------------------
// BOOT SEQUENCE
// ---------------------------------------------------------------
#define BOOT_TITLE_CHAR_MS           60UL   // typewriter reveal speed
#define BOOT_TITLE_HOLD_MS         1200UL
#define BOOT_SUBTITLE_HOLD_MS      1400UL
#define BOOT_PROGRESS_TOTAL_MS     1600UL
#define BOOT_PROGRESS_COLUMNS        16
#define BOOT_SELFTEST_STEP_MS       350UL
#define BOOT_SELFTEST_ESP32_WAIT_MS 3500UL   // give the first ESP32 heartbeat time to arrive
#define BOOT_READY_HOLD_MS         1200UL
#define BOOT_ERROR_HOLD_MS          900UL    // extra hold per failed self-test item

// ---------------------------------------------------------------
// SMART DASHBOARD / RECOMMENDATIONS / STATISTICS / NIGHT MODE
// ---------------------------------------------------------------
#define DASHBOARD_PAGE_MS          3000UL
#define RECOMMENDATION_ROTATE_MS   6000UL
#define STATS_SAMPLE_INTERVAL_MS   5000UL    // cadence for the running averages
#define STATS_EMA_ALPHA               0.1f   // exponential-moving-average weight (low RAM, O(1) memory)
#define TREND_DELTA_TEMP_C            0.3f   // minimum change to show an up/down arrow instead of "steady"
#define TREND_DELTA_HUM_PCT           1.0f
#define TREND_DELTA_GAS_RAW             8
#define ESP32_LINK_TIMEOUT_MS      8000UL    // > 2x the ESP32 heartbeat interval (3s) for margin

// ---------------------------------------------------------------
// WATCHDOG
// ---------------------------------------------------------------
#define WATCHDOG_TIMEOUT WDTO_4S

#endif // SMART_ROOM_ARDUINO_CONFIG_H
