# Architecture Document — Intelligent Emergency Mode

> Written before any code change, per project AI instructions. This document reflects a full read of `README.md`, `backend/`, `web/`, and `iot/`.

---

## 1. Current Project Understanding

### 1.1 Stack (confirmed)
- **Backend**: Node.js + Express + TypeScript (ESM, `type: module`), Mongoose/MongoDB, Socket.IO, Zod, Winston, JWT, `nodemailer` (installed but **currently unused anywhere**).
- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4, Zustand stores, `framer-motion`, `socket.io-client` (installed but **currently unused anywhere**), `lucide-react` icons.
- **IoT**: Arduino Mega (`iot/arduino/arduino.ino`, canonical — `iot/iot/arduino_uno/*` and `iot/iot/esp32/*` look like an older duplicate set) reads all sensors and drives LCD/RGB/servo/buzzer locally; ESP32 (`iot/esp32/esp32.ino`) only does WiFi + `HTTPClient` **POST** of JSON to the backend. ESP32 never opens a server or polls for commands — it is push-only.

### 1.2 Backend request flow (as documented in README, confirmed in code)
`Route → Controller → Service → Model → MongoDB`, with Socket.IO for live push. Route registration: `backend/src/routes/index.ts` → `/api/v1/{auth,sensors,alerts}`.

### 1.3 What actually happens today when the ESP32 posts data
`POST /api/v1/sensors/data` → `sensor.controller.ts#ingestData`:
1. Looks up `User` by `deviceId`.
2. Saves a `SensorData` document (temperature, humidity, airQuality/gas, pressure, motion, soundLevel, light, lamp, rfid, buzzer, servo, rgb, lightStatus, rtc, co2, sleepScore).
3. Runs `SleepScoreService` if bed is occupied.
4. Calls a **local function `calculateAlert(readings)` defined inside the controller file** — this directly violates the README's own rule *"Never generate alerts inside controllers"* / *"Every sensor value should pass through Alert Service"*.
5. Broadcasts a Socket.IO event `sensor-update` to room `user._id` with the alert object embedded — but **the computed `alert` is never saved onto the `SensorData` document** (`SensorData.create(...)` does not include it, and the schema has no `alert` field at all).

### 1.4 Two parallel, disconnected alert systems (important finding)
- **A — the "real" one, unused**: `models/Alert.ts` (proper collection: `userId, type, message, sensor, value, threshold, timestamp, read`) + `services/alert.service.ts` (`AlertService.checkAndCreate`, its own `THRESHOLDS` map, emits `new-alert` over Socket.IO, has `getUnreadCount/markAsRead/markAllAsRead/deleteOldAlerts`). **Nothing in the codebase calls `AlertService.checkAndCreate`.** It is dead code.
- **B — the one actually wired to routes, and broken**: `alert.controller.ts` queries `SensorData.find({ "alert.level": { $ne: "fine" } })`. Since `alert` is never persisted on `SensorData` (see 1.3.5), `GET /api/v1/alerts` will **always return an empty list** in practice. The dashboard's Alerts page (`web/src/app/dashboard/alerts/page.tsx`) therefore cannot show real history today.
- The frontend `alertStore.ts` and `SocketProvider.tsx` were clearly written **against system A** (they consume `Alert`-shaped objects and listen for `new-alert` / `alert-read` / `all-alerts-read`, exactly `AlertService`'s events). So the intended design already exists; it was just never connected end-to-end.

**Conclusion**: Intelligent Emergency Mode is the natural continuation of already-started, already-correctly-shaped work. The right move is to finish wiring system A (not invent a third alert system), and extend it with emergency-specific behavior.

### 1.5 Real-time transport mismatch (important finding)
- Backend (`websocket.service.ts`) runs a real **Socket.IO** server (`initSocketIO`), with `broadcastToUser(userId, event, data)` = `io.to(userId).emit(...)`. A browser must `socket.io-client` and emit `register` with its userId to join that room.
- Frontend `hooks/useSocket.ts` (the one actually used by `dashboard/page.tsx`) opens a **raw `new WebSocket("ws://localhost:5000")`** and expects text frames shaped `{ type, payload }`. Socket.IO's engine.io does not speak that protocol on the root path, and no `register` event is ever sent. In practice this connection will not receive `sensor-update` from the backend the way `SocketProvider.tsx` assumes.
- `SocketProvider.tsx` (which correctly expects `{ socket, isConnected }` and calls `socket.on('sensor-update' | 'new-alert' | 'alert-read' | 'all-alerts-read', ...)`, matching the Socket.IO server 1:1) is **never mounted** in `app/layout.tsx`.
- `socket.io-client` is already an installed dependency, unused.

**Conclusion**: real-time delivery for anything server-pushed (including Emergency Mode) is not reliably working today. This has to be fixed for Emergency Mode's "instant" requirements (banner, toast, browser notification, buzzer confirmation) to function at all. Fix = rewrite `useSocket.ts` to use `socket.io-client` (already a dependency, zero new architecture) and mount `SocketProvider` once in the root layout. This is a bug fix that unblocks the requested feature, not a redesign.

### 1.6 Auth mismatch (important finding, scoping decision needed)
- `web/src/hooks/use-auth.ts`: a fake, non-persisted, in-memory `useAuth` store — `login()` accepts any non-empty email/password, never calls the backend. This is what `app/(auth)/login/page.tsx` and `dashboard/layout.tsx` (the route guard) actually use.
- `web/src/store/authStore.ts`: the real, persisted (`zustand/persist`), backend-integrated store (`login/register/updateUser/changePassword` all call `/api/v1/auth/...`). This is what `settings/page.tsx` and `alertStore.ts` (for `userId`) actually use.
- Net effect: today, after "logging in" through the real login page, `useAuthStore.user` stays `null`, so anything keyed off it (alert history fetch, and any per-user Emergency history I add) has no `userId` to query with. This is a pre-existing gap, not something introduced by this feature.
- Per the task brief ("focus only on Intelligent Emergency Mode", "do not implement extra features"), I will **not** redesign auth. I will build Emergency Mode against `useAuthStore` (the real one — the same one `alertStore` already relies on), consistent with existing precedent. This means Emergency history in the dashboard will behave exactly like the existing Alerts page does today with respect to this gap. Flagging it explicitly so it's a known, intentional non-goal rather than a silent limitation.

### 1.7 Buzzer / hardware (important finding)
- `iot/arduino/arduino.ino` already turns the physical buzzer on/off **locally and autonomously** (`tone(BUZZER_PIN, ...)`/`noTone(...)`) based on onboard sensor thresholds, entirely independent of any round-trip to the backend. The ESP32 is push-only (`HTTPClient` POST); there is no command/polling channel from backend → device.
- Per the task brief ("reuse the existing communication", "do not change hardware architecture", "only add the logic necessary"), Emergency Mode will **not** invent a new remote-actuation protocol. `readings.buzzer` (already part of the payload and the `SensorData` schema) is treated as **telemetry confirming** the hardware already reacted, and is surfaced in the Emergency banner/record ("Buzzer: active"). No firmware changes.

### 1.8 Email
- `nodemailer` is an installed dependency but has zero usage anywhere in `backend/src`. No SMTP config exists in `.env`/`env.ts`.
- A free, no-cost solution is Gmail SMTP with an app password (or any SMTP the user already has). I will build `email.service.ts` behind optional env vars (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `ALERT_EMAIL_FROM`) validated as **optional** in `env.ts` (zod `.optional()`), so the app keeps working with zero config. If unset, the service logs a warning once and skips sending — infrastructure is complete but inert until the user supplies real credentials. I cannot fabricate working SMTP credentials myself.

---

## 2. Feature Design — Intelligent Emergency Mode

### 2.1 Configurable thresholds (single source of truth)
Today thresholds are duplicated three times: `AlertService.THRESHOLDS` (dead), `calculateAlert()` in the controller (hardcoded numbers, dead code path below an early `return`), and `sensor-store.ts` on the frontend (duplicated again for display-only status badges). New:
- `backend/src/config/thresholds.ts` — the single backend source of truth, one entry per sensor with `warning`/`danger` levels (temperature, humidity, gas/airQuality, soundLevel — matching what's actually measured today). Config file, no logic, per README's own convention for `config/`.
- Frontend keeps its existing display-only status helpers in `sensor-store.ts` as-is (cosmetic per-card coloring, already working, out of scope) — the authoritative danger decision is always the backend's.

### 2.2 Backend: `EmergencyService` (new, `backend/src/services/emergency.service.ts`)
Responsibilities (business logic only, per README's service-layer rule):
- `evaluate(readings)`: compares readings against `thresholds.ts`, returns which sensors are in `warning`/`danger` and at what value.
- `activate(userId, deviceId, readings, triggeredSensors)`: called only when at least one sensor is at `danger` level. Upserts a single **active** `Emergency` document per user (so repeated danger readings update the same incident instead of spamming new rows), broadcasts `emergency:activated` over the existing Socket.IO channel, and fires the (optional) email via `email.service.ts`.
- `resolve(userId)`: called when readings return to normal for a debounce window; marks the active `Emergency` as `resolved`, broadcasts `emergency:resolved`.
- Also calls the existing (currently dead) `AlertService.checkAndCreate` for `warning`-level (non-emergency) readings, finally wiring system A end-to-end (see 1.4) instead of the broken embedded-field approach in `calculateAlert()`.

### 2.3 Backend: `Emergency` model (new, `backend/src/models/Emergency.ts`)
Fields: `userId, deviceId, level ('warning'|'danger'), status ('active'|'resolved'), triggeredSensors: [{ sensor, value, threshold }], message, buzzerActive, emailSent, createdAt, resolvedAt`.

### 2.4 Backend: wiring changes
- `sensor.controller.ts#ingestData`: remove the in-controller `calculateAlert()` (dead-code tail included) and call `EmergencyService.evaluate/activate/resolve` + `AlertService.checkAndCreate` instead. Route/API shape (`POST /api/v1/sensors/data` request/response) stays the same — response still includes an `alert`/`emergency` summary so nothing calling this endpoint today breaks.
- `alert.controller.ts`: switch `getAlerts`/`getUnreadCount`/`markAsRead`/`markAllAsRead` to query the real `Alert` model instead of the broken `SensorData.alert` field. This makes the existing, already-deployed Alerts page actually work — required groundwork, not scope creep, since Emergency Mode's own history needs the same pattern done correctly.
- New `emergency.routes.ts` (`GET /api/v1/emergencies`, `GET /api/v1/emergencies/active`, `PATCH /api/v1/emergencies/:id/resolve`) registered in `routes/index.ts`, following the exact Route→Controller→Service→Model convention.
- `env.ts`: add optional SMTP vars.

### 2.5 Frontend: transport fix (prerequisite, see 1.5)
- Rewrite `hooks/useSocket.ts` to use `socket.io-client`, exposing `{ socket, isConnected }` — matching what `SocketProvider.tsx` already expects, so `SocketProvider.tsx` needs no changes.
- Mount `<SocketProvider>` once in `app/layout.tsx`.
- `dashboard/page.tsx` stops calling `useSocket()` directly (the provider now owns the single connection); it keeps reading from `useSensorStore` exactly as it does today.
- On connect, emit `register` with `useAuthStore.user.id` (backend already listens for this).

### 2.6 Frontend: new state — `emergencyStore.ts` (new Zustand store, following `alertStore.ts` conventions)
`isEmergencyActive, currentEmergency, history[], fetchHistory(), resolve()`. Populated by history should already be more robust than the current Alerts stores.

### 2.7 Frontend: UI additions (extend, don't redesign)
- `EmergencyBanner` component (new, `web/src/components/dashboard/EmergencyBanner.tsx`): animated (`framer-motion`) top banner, red theme, shown when `emergencyStore.isEmergencyActive`. Same visual language as existing cards (rounded-2xl, border, slate-900 base) but with a red pulse treatment — "professional", not flashing.
- Dashboard root wrapper gets a conditional class swap (`emergency` state → red-tinted background accents) applied narrowly (CSS variables/classes), not a full re-theme of unrelated pages.
- Emergency confirmation dialog (reuse existing modal conventions from `components/admin/*-modal.tsx` patterns) for acknowledging/resolving.
- Toasts: reuse the existing `ToastProvider`/`useAdminStore` toast pattern (currently admin-only) by promoting it to a shared location, OR add a small dashboard-scoped equivalent — **decision needed, see open questions**.
- Browser Notifications: new small hook `useBrowserNotification.ts` (`Notification.requestPermission()` + `new Notification(...)`), no existing code to reuse (first use of the Notification API in this repo) — invoked only on `emergency:activated`.
- Emergency history list on the dashboard (reuse the existing Alerts page's list/card visual pattern), either as a new `dashboard/emergency` route or a section on the existing Alerts page — **decision needed, see open questions**.

### 2.8 Mobile (Flutter)
Per instructions ("only if necessary and consistent"): skipped for this pass. `mobile/` will be checked for its current state but no Flutter code will be touched unless explicitly asked.

---

## 3. Files to be touched (final list, subject to the open questions below)

**Backend — new**
- `backend/src/config/thresholds.ts`
- `backend/src/models/Emergency.ts`
- `backend/src/services/emergency.service.ts`
- `backend/src/services/email.service.ts`
- `backend/src/controllers/emergency.controller.ts`
- `backend/src/routes/emergency.routes.ts`

**Backend — modified**
- `backend/src/controllers/sensor.controller.ts` (remove in-controller `calculateAlert`, call services)
- `backend/src/controllers/alert.controller.ts` (query real `Alert` model)
- `backend/src/routes/index.ts` (register `emergency.routes.ts`)
- `backend/src/config/env.ts` (optional SMTP vars)
- `.env` (SMTP vars — only if credentials are provided)

**Frontend — new**
- `web/src/store/emergencyStore.ts`
- `web/src/components/dashboard/EmergencyBanner.tsx`
- `web/src/components/dashboard/EmergencyDialog.tsx`
- `web/src/hooks/useBrowserNotification.ts`
- Emergency history UI (exact location per decision below)

**Frontend — modified**
- `web/src/hooks/useSocket.ts` (switch to `socket.io-client`)
- `web/src/app/layout.tsx` (mount `SocketProvider`)
- `web/src/app/dashboard/page.tsx` (consume emergency state, drop direct `useSocket()` call)
- `web/src/app/dashboard/layout.tsx` (banner slot)

No existing API route is deleted or renamed. No existing collection is removed. `SensorData` schema is unchanged (already has everything needed as telemetry).

---

## 4. Decisions (confirmed before implementation)

1. **Toasts**: promote the existing `ToastProvider` / `useAdminStore.toasts` plumbing to a shared location (e.g. move the toast slice into a shared store or a new `web/src/store/toastStore.ts`, mount `ToastProvider` at root layout level) so both admin and dashboard use one implementation.
2. **Emergency history placement**: new dedicated page `web/src/app/dashboard/emergency/page.tsx`, with a nav entry in `dashboard/layout.tsx`.
3. **Email credentials**: infrastructure only for this pass. `email.service.ts` fully implemented behind optional env vars; if unset, logs a warning once and skips sending. Setup instructions documented for later.
4. **Auth gap**: left as-is. Emergency Mode built on `useAuthStore`, matching the existing `alertStore` precedent. Not in scope to fix `use-auth.ts`.
