# 🏥 Smart Health Room

> An intelligent IoT-based healthcare room combining **Arduino mega**, **ESP32**, **Node.js**, **MongoDB**, **Next.js**, and **Flutter** to monitor environmental conditions, room security, and sleep quality in real time.

---

# 📖 Table of Contents

- Project Overview
- Objectives
- Main Features
- System Architecture
- Data Flow
- Technologies
- Project Structure
- IoT Hardware
- Backend
- Frontend
- Mobile Application
- Database
- Authentication
- Dashboard
- Admin Panel
- AI Instructions
- Development Rules

---

# 📌 Project Overview

Smart Health Room is an IoT healthcare monitoring system designed to improve the comfort, security, and health of the room occupant.

The project combines several technologies:

- Arduino Mega 2560
- ESP32 WiFi Module
- Node.js Backend API
- MongoDB Database
- Next.js Web Application
- Flutter Mobile Application (In Development)

The room continuously monitors environmental conditions, user presence, access control, sleep quality, and emergency situations.

All sensor data are collected by the Arduino Mega, transmitted through the ESP32 to the backend server, processed, stored inside MongoDB, and finally displayed in real-time on the Web Dashboard and the future Mobile Application.

The system is designed using a modular architecture so new sensors and features can easily be added without changing the existing architecture.

---

# 🎯 Project Objectives

The primary objective of Smart Health Room is to create a connected healthcare environment capable of monitoring the room and assisting the user automatically.

Main objectives:

- Monitor room temperature
- Monitor humidity
- Monitor air quality
- Monitor room brightness
- Monitor sound level
- Detect user presence on the bed
- Analyze sleep quality
- Secure room access using RFID
- Send alerts in dangerous situations
- Store historical sensor data
- Display live information through dashboards
- Provide remote monitoring through Web and Mobile applications

---

# ⭐ Main Features

## IoT Monitoring

- Temperature monitoring
- Humidity monitoring
- Gas detection
- Light detection
- Sound detection
- Bed occupancy detection
- Date & Time display

---

## Security

- RFID Authentication
- Authorized Cards
- Invalid Card Detection
- Automatic Door Opening
- Servo Motor Control
- RGB Status Indicator
- Buzzer Alarm

---

## Dashboard

- Live Sensor Values
- Live WebSocket Updates
- Sensor History
- Alerts
- Sleep Analysis
- Statistics
- Device Status

---

## User Features

Registered users can:

- Register
- Login
- Logout
- Update Profile
- Change Password
- Delete Account
- View Dashboard
- View Sensor History
- View Alerts
- Order Product

---

## Administrator Features

Administrators can:

- Manage Users
- Add Users
- Edit Users
- Delete Users
- Manage Comments
- Manage Product Orders
- View Statistics
- Monitor Connected Devices

---

# 🏗 System Architecture

```
                    +-----------------------+
                    |    RFID Cards         |
                    +----------+------------+
                               |
                               |
                               v

                    +-----------------------+
                    |    Arduino Mega       |
                    |                       |
                    |  Reads All Sensors    |
                    +----------+------------+
                               |
                               |
                               v

                    +-----------------------+
                    |       ESP32           |
                    |     WiFi Module       |
                    +----------+------------+
                               |
                               |
                        HTTP / JSON
                               |
                               |
                               v

                    +-----------------------+
                    | Node.js Backend API   |
                    | Express + Socket.IO   |
                    +----------+------------+
                               |
          +--------------------+--------------------+
          |                                         |
          |                                         |
          v                                         v

 +-----------------------+              +-----------------------+
 |      MongoDB          |              |      WebSocket        |
 |                       |              |      Live Updates      |
 +-----------+-----------+              +-----------+-----------+
             |                                          |
             |                                          |
             v                                          v

+-------------------------+            +-------------------------+
| Next.js Dashboard       |            | Flutter Mobile App      |
| (Current)               |            | (Future Development)    |
+-------------------------+            +-------------------------+

```

---

# 🔄 Complete Data Flow

The complete workflow of the system is:

1.

Sensors collect data.

↓

2.

Arduino Mega reads all sensors.

↓

3.

Arduino sends sensor values to ESP32.

↓

4.

ESP32 connects to WiFi.

↓

5.

ESP32 sends JSON data to Backend API.

↓

6.

Backend validates incoming data.

↓

7.

Backend calculates alerts.

↓

8.

Backend calculates Sleep Score.

↓

9.

Backend stores data inside MongoDB.

↓

10.

Backend broadcasts updates using WebSocket.

↓

11.

Dashboard receives live updates instantly.

↓

12.

Users monitor room status from anywhere.

---

# 💻 Technologies Used

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- App Router
- Zustand
- WebSocket Client

---

## Backend

- Node.js
- Express.js
- TypeScript
- Socket.IO
- JWT Authentication
- bcryptjs
- Mongoose
- Zod Validation
- Nodemailer
- Winston Logger

---

## Database

MongoDB

Collections:

- users
- sensorData
- alerts

---

## IoT

- Arduino Mega 2560
- ESP32
- RFID RC522
- LCD 1602 I2C
- DHT11
- MQ Gas Sensor
- FSR Pressure Sensor
- Photoresistor
- RTC DS1302
- Servo SG90
- RGB LED
- Passive Buzzer
- Sound Sensor

---

## Mobile

Flutter

Status:

🚧 Under Development

---

# 📂 Project Structure

```
projet-IOT-main/

│

├── backend/

│ ├── src/

│ │ ├── config/

│ │ ├── controllers/

│ │ ├── middleware/

│ │ ├── models/

│ │ ├── routes/

│ │ ├── services/

│ │ ├── utils/

│ │ └── app.ts

│

├── web/

│ ├── src/

│ │ ├── app/

│ │ ├── components/

│ │ ├── hooks/

│ │ ├── lib/

│ │ ├── store/

│ │ └── providers/

│

├── iot/

│

├── mobile/ (Future)

│

└── README.md

```

---

# 📁 Folder Description

## backend/

Contains the REST API, authentication system, database connection, WebSocket server, business logic, and IoT communication.

---

## web/

Contains the complete Next.js web application including:

- Home Page
- Product Page
- Login
- Register
- Dashboard
- Admin

---

## iot/

Contains Arduino and ESP32 source code.

Responsible for:

- Reading sensors
- RFID authentication
- Servo control
- LCD display
- Sending JSON to Backend

---

## mobile/

Flutter application.

Currently under development.

Future features:

- Live Dashboard
- Notifications
- Alerts
- Sleep Reports
- User Profile

---

# 📌 Current Project Status

Backend

✅ Working

Frontend

✅ Working

Dashboard

✅ Working

Authentication

✅ Working

MongoDB

✅ Working

ESP32 Communication

✅ Working

Arduino

✅ Working

Flutter

🚧 In Development

AI

🚧 Future Feature

# 🔌 IoT Hardware

The Smart Health Room relies on an Arduino Mega 2560 as the main controller.

All sensors are connected to the Arduino. The ESP32 is only responsible for WiFi communication with the backend server.

The IoT system continuously collects environmental and user-related data before transmitting it to the backend.

---

# 📦 IoT Components

## Arduino Mega 2560

Main microcontroller.

Responsibilities:

- Read all sensors
- Control LCD
- Control Servo Motor
- Control RGB LED
- Control Buzzer
- Read RFID cards
- Communicate with ESP32
- Send sensor values

---

## ESP32

Responsibilities:

- Connect to WiFi
- Receive data from Arduino
- Convert data to JSON
- Send HTTP requests
- Maintain communication with Backend API

The ESP32 does NOT process business logic.

Business logic belongs to the Backend.

---

## RFID RC522

Purpose:

Secure room access.

Functions:

- Register authorized cards
- Read RFID cards
- Validate access
- Deny unauthorized users

---

## LCD 1602 I2C

Displays:

- Welcome message
- Temperature
- Humidity
- Gas level
- Date
- Time
- Alerts
- RFID messages
- Sleep messages

---

## DHT11

Measures:

- Temperature
- Humidity

---

## MQ Gas Sensor

Measures:

- Air Quality
- Dangerous Gas Concentration

---

## FSR Pressure Sensor

Detects:

- Bed Occupancy
- Sleep Start
- Sleep End

Used by Sleep Score algorithm.

---

## Sound Sensor

Measures:

- Noise level
- Night disturbances

Used by Sleep Score algorithm.

---

## Photoresistor

Measures:

Ambient Light.

Possible states:

- Day
- Night

---

## RTC DS1302

Provides:

- Date
- Time

Required for:

- Sleep Duration
- Historical Data
- Dashboard Timeline

---

## RGB LED

Status indicator.

Green

System Normal

Yellow

Warning

Red

Danger

---

## Passive Buzzer

Provides audible alerts.

Examples:

- RFID success
- RFID failure
- Dangerous gas
- High temperature
- High humidity

---

## Servo Motor SG90

Automatically opens the room door after successful RFID authentication.

---

# 🔌 Wiring Diagram

## ESP32 ↔ Arduino Mega

| Arduino Mega | ESP32      |
| ------------ | ---------- |
| GND          | GND        |
| TX1 (18)     | RX2 GPIO16 |
| RX1 (19)     | TX2 GPIO17 |

---

## RFID RC522

| Arduino | RC522 |
| ------- | ----- |
| 53      | SDA   |
| 52      | SCK   |
| 51      | MOSI  |
| 50      | MISO  |
| 49      | RST   |
| 3.3V    | VCC   |
| GND     | GND   |

---

## LCD 1602 I2C

| Arduino | LCD |
| ------- | --- |
| 20      | SDA |
| 21      | SCL |
| 5V      | VCC |
| GND     | GND |

---

## DHT11

| Arduino | DHT11 |
| ------- | ----- |
| A1      | DATA  |
| 5V      | VCC   |
| GND     | GND   |

---

## MQ Gas Sensor

| Arduino | MQ  |
| ------- | --- |
| A0      | AO  |
| 5V      | VCC |
| GND     | GND |

---

## FSR Pressure Sensor

| Arduino | FSR           |
| ------- | ------------- |
| A2      | Signal        |
| 5V      | VCC           |
| GND     | 10kΩ Resistor |

---

## Photoresistor

| Arduino | LDR           |
| ------- | ------------- |
| A3      | Signal        |
| 5V      | VCC           |
| GND     | 10kΩ Resistor |

---

## Sound Sensor

| Arduino | Sensor |
| ------- | ------ |
| D8      | OUT    |
| 5V      | VCC    |
| GND     | GND    |

---

## RGB LED

| Arduino | RGB            |
| ------- | -------------- |
| D3      | Red            |
| D5      | Green          |
| D6      | Blue           |
| GND     | Common Cathode |

---

## Buzzer

| Arduino | Buzzer   |
| ------- | -------- |
| D2      | Positive |
| GND     | Negative |

---

## Servo

| Arduino | Servo  |
| ------- | ------ |
| D7      | Signal |
| 5V      | VCC    |
| GND     | GND    |

---

## RTC DS1302

| Arduino | RTC |
| ------- | --- |
| 22      | CLK |
| 23      | DAT |
| 24      | RST |
| 5V      | VCC |
| GND     | GND |

---

# 🌐 IoT Communication

The project uses two communication layers.

## Layer 1

Arduino Mega

↓

Serial UART

↓

ESP32

---

## Layer 2

ESP32

↓

WiFi

↓

REST API

↓

Backend

---

Communication format:

JSON

Example:

```json
{
  "temperature": 24,
  "humidity": 48,
  "gas": 170,
  "pressure": 820,
  "sound": 25,
  "light": 600,
  "timestamp": "2026-07-16T15:20:30Z"
}
```

---

# 🔄 Complete IoT Workflow

Sensors

↓

Arduino reads sensors

↓

Arduino updates LCD

↓

Arduino updates RGB

↓

Arduino controls buzzer

↓

Arduino sends values to ESP32

↓

ESP32 builds JSON

↓

ESP32 sends HTTP POST

↓

Backend validates data

↓

Backend stores MongoDB

↓

Backend broadcasts WebSocket

↓

Dashboard updates instantly

---

# 🔐 RFID Workflow

System starts

↓

LCD displays

```
PLEASE SCAN YOUR CARD
```

↓

RFID card detected

↓

Card exists?

YES

↓

Green LED

↓

One Beep

↓

Servo opens door

↓

LCD

```
WELCOME
```

↓

User enters room

---

If NO

↓

Red LED

↓

Double Beep

↓

LCD

```
INVALID CARD
```

↓

Door remains locked

---

# 🛏 Sleep Monitoring Workflow

Pressure detected?

↓

YES

↓

User is on bed

↓

Save start time

↓

Monitor sound

↓

Monitor duration

↓

Monitor movement

↓

Pressure removed

↓

Save wake-up time

↓

Calculate

- Total sleep
- Sleep duration
- Noise level
- Sleep Score

↓

Store in MongoDB

↓

Display on Dashboard

---

# 😴 Sleep Score

The Sleep Score is calculated by the backend.

Current parameters:

- Sleep Duration
- Bed Occupancy
- Noise Level
- Sleep Interruptions

Future versions may include:

- Heart Rate
- Oxygen Saturation
- Body Temperature
- AI-based Analysis

The score is stored inside MongoDB and displayed on the dashboard.

---

# 🚨 Alert System

The backend continuously checks sensor thresholds.

Possible alerts:

## Temperature

If temperature exceeds threshold

↓

Create Alert

↓

Save MongoDB

↓

Broadcast WebSocket

↓

Dashboard Notification

↓

LCD

```
TEMPERATURE TOO HIGH
```

↓

Red LED

↓

Buzzer Alarm

---

## Humidity

Same workflow.

---

## Gas

Same workflow.

---

## Future Alerts

- Fire Detection
- Smoke Detection
- Intrusion Detection
- Device Offline
- Internet Connection Lost

---

# 📡 WebSocket Events

The backend broadcasts real-time events.

Examples:

sensor:update

alert:new

device:connected

device:disconnected

sleep:updated

profile:updated

Future events can easily be added.

---

# 📈 Sensor Update Cycle

Every few seconds:

Read Sensors

↓

Send JSON

↓

Backend

↓

Database

↓

WebSocket

↓

Dashboard

This architecture guarantees near real-time monitoring.

# 🚀 Backend Architecture

The backend is the core of the Smart Health Room project.

It is responsible for:

- Authentication
- Authorization
- Receiving sensor data
- Processing IoT information
- Managing users
- Managing alerts
- Sleep Score calculation
- Database communication
- WebSocket communication
- Business logic

The backend is built using a modular architecture.

Every feature has its own responsibility.

Business logic should never be placed inside routes.

Routes should only forward requests to controllers.

Controllers should call services.

Services contain the business logic.

Models communicate with MongoDB.

This separation makes the project scalable and easy to maintain.

---

# 📂 Backend Folder Structure

```
backend/

├── src/

│
├── config/
│
├── controllers/
│
├── middleware/
│
├── models/
│
├── routes/
│
├── services/
│
├── utils/
│
└── app.ts

```

---

# 📁 config/

Contains all application configuration.

Examples:

- MongoDB Connection
- Environment Variables
- Server Configuration
- Port
- JWT Secret
- API Keys

Never place business logic inside config.

---

# 📁 controllers/

Controllers receive HTTP requests.

Responsibilities:

- Validate request

- Call services

- Return HTTP response

Controllers should stay as small as possible.

Example:

```
Client

↓

Route

↓

Controller

↓

Service

↓

Database
```

Examples:

Auth Controller

- Login

- Register

- Logout

- Refresh Token

Sensor Controller

- Receive ESP32 data

- Get latest values

- Get history

Alert Controller

- Get alerts

- Delete alert

Profile Controller

- Update profile

- Change password

---

# 📁 services/

Services contain all business logic.

This is the most important folder.

Examples:

Sleep Score calculation

Alert generation

Email sending

Statistics

Threshold verification

Never duplicate business logic.

If logic already exists,

reuse the existing service.

---

# 📁 models/

Models represent MongoDB collections.

Current models:

User

SensorData

Alert

Every new collection must have its own model.

Never access MongoDB directly from controllers.

Always use models.

---

# 📁 routes/

Routes define API endpoints.

Example:

```
POST /api/auth/login

↓

Auth Controller

↓

Auth Service
```

Routes should never contain business logic.

---

# 📁 middleware/

Contains reusable middleware.

Examples:

JWT Authentication

Authorization

Error Handling

Rate Limiting

Logging

Future middleware should also be added here.

---

# 📁 utils/

Contains helper functions.

Examples:

JWT

Logger

Validators

Date Formatting

Utility functions should not depend on business logic.

---

# ⚙ app.ts

Entry point of the backend.

Responsibilities:

Initialize Express

Load Environment Variables

Connect MongoDB

Initialize Socket.IO

Register Routes

Start HTTP Server

---

# 🗄 MongoDB Architecture

Current Collections

## users

Stores user accounts.

Fields may include:

- name

- email

- password

- role

- avatar

- createdAt

- updatedAt

Future fields:

phone

address

lastLogin

deviceId

---

## sensorData

Stores all sensor values.

Possible fields:

temperature

humidity

gas

pressure

light

sound

timestamp

deviceId

sleepSession

---

## alerts

Stores generated alerts.

Fields:

type

message

severity

createdAt

resolved

resolvedAt

Future:

resolvedBy

location

priority

---

# 🔐 Authentication

Authentication uses JWT.

Workflow

Register

↓

Hash Password

↓

Store MongoDB

↓

Login

↓

Verify Password

↓

Generate JWT

↓

Return Token

↓

Store Token

↓

Access Protected Routes

All protected routes must use JWT middleware.

Never bypass authentication.

---

# 👤 User Roles

Current roles:

Admin

User

Future roles:

Doctor

Caregiver

Guest

Manager

Role checking must always be performed using middleware.

Never trust frontend roles.

---

# 🌐 REST API Architecture

General Flow

```
Client

↓

HTTP Request

↓

Route

↓

Controller

↓

Service

↓

Model

↓

MongoDB

↓

Controller

↓

JSON Response
```

Always keep this architecture.

Never skip services.

---

# 📡 WebSocket Architecture

Socket.IO is responsible for live updates.

Backend emits events.

Frontend subscribes.

Example:

```
Sensor Updated

↓

Backend

↓

Socket.IO

↓

Dashboard

↓

User sees update instantly
```

Never send sensor data only through REST.

Live values must use WebSocket whenever possible.

---

# 📊 Sensor Processing Pipeline

ESP32 sends JSON

↓

Controller validates request

↓

Service processes data

↓

Check thresholds

↓

Generate alerts

↓

Calculate sleep score

↓

Store MongoDB

↓

Broadcast WebSocket

↓

Dashboard updated

---

# 🧠 Sleep Score Service

Current inputs:

Pressure Sensor

Sound Sensor

Duration

Possible calculations:

Sleep Duration

Sleep Interruptions

Noise Impact

Sleep Consistency

Future AI version:

Machine Learning

Sleep Prediction

Recommendations

Anomaly Detection

Current implementation is rule-based.

---

# 🚨 Alert Service

Every sensor value passes through Alert Service.

Responsibilities:

Compare thresholds

Generate alert

Save database

Notify dashboard

Send notification

Future:

Email

SMS

Push Notifications

WhatsApp

---

# 📬 Email Service

Future feature.

Will send:

Danger Alerts

Weekly Reports

Sleep Reports

Account Verification

Password Reset

---

# 📈 Statistics Service

Responsible for:

Daily averages

Weekly averages

Monthly averages

Sleep trends

Gas trends

Temperature trends

Humidity trends

Future analytics should be implemented here.

---

# 📦 Backend Coding Rules

Always use TypeScript.

Always use async/await.

Never use callbacks.

Never duplicate logic.

Always validate user input.

Always return JSON.

Always handle errors.

Never expose passwords.

Always hash passwords.

Never trust frontend validation.

Use middleware whenever possible.

---

# 📜 Backend Naming Convention

Controllers

```
auth.controller.ts
sensor.controller.ts
```

Routes

```
auth.routes.ts
sensor.routes.ts
```

Models

```
User.ts
Alert.ts
SensorData.ts
```

Services

```
sleepScore.service.ts
alert.service.ts
```

Middleware

```
auth.middleware.ts
```

Utils

```
jwt.ts
logger.ts
```

Follow the same naming convention for all future files.

---

# 🤖 AI Backend Instructions

Before modifying backend code:

✔ Reuse existing services.

✔ Reuse existing models.

✔ Reuse existing middleware.

✔ Keep controllers thin.

✔ Keep services independent.

✔ Never change folder structure.

✔ Never rename existing API routes without updating frontend.

✔ Never duplicate database queries.

✔ Always use TypeScript types.

✔ Keep MongoDB schemas compatible.

✔ Preserve JWT authentication.

✔ Preserve WebSocket communication.

✔ Preserve REST API compatibility.

When adding a new feature:

1.

Create Model (if needed)

↓

2.

Create Service

↓

3.

Create Controller

↓

4.

Create Route

↓

5.

Register Route

↓

6.

Update Frontend

↓

7.

Test API

Never skip this workflow.

# 🖥️ Frontend Architecture

The Smart Health Room frontend is built with **Next.js**, **React**, **TypeScript**, and **Tailwind CSS**.

The frontend communicates with the backend using:

- REST API
- WebSocket (Socket.IO)

The frontend has two main objectives:

1. Display real-time information coming from the IoT devices.
2. Provide a modern, responsive, and intuitive user interface.

The frontend follows a modular architecture.

Every page, component, hook, and store has its own responsibility.

Business logic should never be duplicated.

---

# 📂 Frontend Folder Structure

```
web/

├── src/

│
├── app/
│
├── components/
│
├── hooks/
│
├── lib/
│
├── store/
│
└── providers/

```

---

# 📁 app/

Contains all application pages using the Next.js App Router.

Current sections:

```
app/

(auth)

(marketing)

dashboard

layout.tsx

globals.css

favicon.ico
```

The App Router is responsible for page navigation.

Every new page should be created inside the app folder.

---

# 📁 components/

Contains reusable UI components.

Examples:

Navbar

Footer

Cards

Buttons

Forms

Tables

Charts

Sensor Cards

Dashboard Widgets

Dialogs

Modals

Components should be reusable.

Never duplicate components.

If an existing component can be reused,

modify it instead of creating another one.

---

# 📁 hooks/

Contains custom React Hooks.

Examples:

useSocket()

Future examples:

useAuth()

useAlerts()

useSensors()

useTheme()

Hooks should contain reusable logic.

Never place UI inside hooks.

---

# 📁 lib/

Contains helper utilities.

Examples:

API Client

Date Formatter

Utilities

Constants

Configuration

---

# 📁 store/

Contains global application state.

Current stores:

authStore

sensorStore

alertStore

Future stores:

themeStore

userStore

orderStore

notificationStore

Global state should remain centralized.

---

# 📁 providers/

Contains application providers.

Examples:

Theme Provider

Socket Provider

Future:

Auth Provider

Notification Provider

Language Provider

---

# 🎨 UI Design Philosophy

The UI must always remain:

Modern

Minimal

Responsive

Fast

Accessible

Professional

Smooth animations are encouraged.

Avoid unnecessary complexity.

---

# 📱 Responsive Design

The application must support:

Desktop

Laptop

Tablet

Mobile

Layouts should adapt automatically.

Never create desktop-only pages.

---

# 🏠 Home Page

Purpose:

Introduce the Smart Health Room project.

Sections:

Hero Section

Project Description

Buttons

- Product
- Dashboard

Why Smart Health Room

Advantages

Smart Sensors

Customer Reviews

Product Preview

Footer

Navigation Bar

---

## Hero Section

Contains:

Project Name

Project Description

CTA Buttons

Buttons:

View Product

Dashboard

---

## Why Smart Health Room

Highlights:

Real-time Monitoring

WiFi Connectivity

JWT Security

Cross Platform

Sleep Score

Modern Dashboard

---

## Smart Sensors Section

Displays cards for:

Temperature

Humidity

Air Quality

Noise Level

Light

Alerts

IoT

Security

Each card contains:

Icon

Title

Short Description

---

## Customer Reviews

Purpose:

Display user feedback.

Future:

Rating System

Comments

Average Rating

Pagination

---

## Product Preview

Displays:

Product Image

Short Description

Button:

Discover Product

---

# 📦 Product Page

Purpose:

Present the Smart Health Room product.

Layout:

Left:

Product Image

Right:

Product Description

Order Button

---

## Product Description

Contains:

Overview

Features

Specifications

Advantages

---

## Order Form

Opened after clicking

Order Product

Future fields:

Name

Email

Phone

Address

City

Country

Quantity

Notes

---

## Detailed Description

Explains:

Hardware

Software

IoT Features

Dashboard

Security

Sleep Monitoring

---

## User Reviews

Contains:

Rating

Comments

User Name

Date

Future:

Images

Verified Purchase

---

# 🔐 Authentication Pages

Current Pages:

Login

Register

Authentication uses JWT.

Future pages:

Forgot Password

Reset Password

Verify Email

---

## Login Page

Fields:

Email

Password

Remember Me

Login Button

After login:

Redirect Dashboard

---

## Register Page

Fields:

Full Name

Email

Password

Confirm Password

Register Button

---

# 📊 Dashboard

The dashboard is the most important page.

Purpose:

Display all live IoT information.

Requires authentication.

Unauthenticated users must never access it.

---

Dashboard Sections

Temperature

Humidity

Gas

Light

Sound

Bed Status

Lamp Control

Charts

Alerts

Profile

Settings

---

## Sensor Cards

Each card contains:

Icon

Current Value

Status

Unit

Color

Timestamp

Example:

Temperature

21°C

Normal

---

## Bed Card

Possible states:

Occupied

Free

Displayed using FSR sensor.

---

## Light Card

Displays:

Lamp ON

Lamp OFF

Future:

Remote Lamp Control

---

## Activity Chart

Displays:

24 Hours

7 Days

30 Days

Future:

Custom Range

---

# 🔔 Alerts Page

Displays all alerts.

Each alert contains:

Severity

Type

Message

Timestamp

Status

Future:

Resolve Button

Delete

Filter

Search

---

# ⚙ Settings Page

Future settings:

Theme

Language

Notifications

Profile

Password

Account

Privacy

---

# 👨‍💼 Admin Panel

Accessible only by administrators.

Purpose:

Manage the application.

---

Dashboard Cards

Total Users

Admins

Active Users

New Users

Future:

Orders

Revenue

Connected Devices

Online Users

---

## Users Table

Columns:

Avatar

ID

Name

Email

Role

Registration Date

Last Login

Actions

---

## Add User

Fields:

Name

Email

Password

Role

Admin

User

Future:

Phone

Avatar

Status

---

## Edit User

Editable:

Name

Email

Role

Future:

Phone

Avatar

Permissions

---

## Delete User

Soft delete.

Never permanently delete data unless explicitly requested.

---

# 🔄 Frontend Data Flow

Page

↓

Store

↓

REST API

↓

Backend

↓

MongoDB

↓

Response

↓

UI Update

Live data:

Backend

↓

WebSocket

↓

Socket Hook

↓

Store

↓

Dashboard

---

# 🌐 WebSocket Usage

The frontend listens for:

sensor:update

alert:new

device:connected

device:disconnected

sleep:updated

Future events can be added without changing existing architecture.

---

# 🎨 Styling Rules

Always use Tailwind CSS.

Prefer utility classes.

Avoid inline styles.

Reuse existing classes.

Maintain responsive layouts.

---

# 📦 Component Rules

Every component should:

Have a single responsibility.

Receive props.

Avoid duplicated logic.

Be reusable.

Be typed using TypeScript.

---

# 📜 Frontend Naming Convention

Pages

```
page.tsx
```

Layouts

```
layout.tsx
```

Components

```
SensorCard.tsx

Navbar.tsx

Footer.tsx
```

Hooks

```
useSocket.ts

useAuth.ts
```

Stores

```
sensorStore.ts

authStore.ts
```

Utilities

```
utils.ts
```

Follow PascalCase for components.

Follow camelCase for hooks and utilities.

---

# 🤖 AI Frontend Instructions

Before modifying frontend code:

✅ Keep the App Router structure.

✅ Reuse existing components.

✅ Reuse existing hooks.

✅ Reuse existing stores.

✅ Keep TypeScript types.

✅ Keep Tailwind styling consistent.

✅ Preserve responsive design.

✅ Never duplicate components.

✅ Never hardcode API URLs.

✅ Preserve WebSocket integration.

✅ Keep accessibility in mind.

When adding a new page:

1.

Create page inside app/

↓

2.

Reuse existing layout

↓

3.

Create reusable components

↓

4.

Connect REST API

↓

5.

Connect WebSocket if needed

↓

6.

Update navigation

↓

7.

Test responsive behavior

Never bypass this workflow.

---

# 📌 Future Frontend Features

Dark Mode

Multi-language

Notifications

Charts

Analytics

AI Recommendations

Device Management

Camera Integration

Voice Commands

Offline Mode

Progressive Web App (PWA)

Flutter synchronization

# 🤖 AI Instructions

> This project is designed to be maintained by both human developers and AI coding assistants (Claude Code).

Before making any modification, the AI assistant **must read this document completely**.

The AI must understand the current architecture before generating or modifying any code.

The primary objective is to **extend the project without breaking the existing architecture**.

---

# 🎯 AI Main Objectives

The AI should always:

- Understand the existing architecture before coding.
- Reuse existing code whenever possible.
- Keep the project modular.
- Respect the current folder structure.
- Preserve backward compatibility.
- Write clean, readable, and maintainable code.
- Prefer extending existing modules over creating unnecessary new ones.

---

# 🚫 AI Must NEVER Do

The AI must NEVER:

❌ Rename folders without updating imports.

❌ Change the project architecture.

❌ Remove existing functionality.

❌ Delete API endpoints.

❌ Delete MongoDB collections.

❌ Duplicate business logic.

❌ Hardcode URLs.

❌ Hardcode secrets.

❌ Store passwords in plain text.

❌ Remove TypeScript types.

❌ Replace REST API with another architecture.

❌ Remove JWT authentication.

❌ Break WebSocket communication.

❌ Break responsive design.

❌ Rewrite the whole application to implement one feature.

---

# ✅ AI Should ALWAYS Do

Whenever possible:

✔ Reuse Components

✔ Reuse Services

✔ Reuse Hooks

✔ Reuse Stores

✔ Reuse Models

✔ Reuse Utilities

✔ Reuse Middleware

✔ Reuse Existing API

✔ Reuse Existing Layouts

✔ Reuse Existing Types

The AI should prefer modifying existing files rather than creating duplicate files.

---

# 📂 Where To Add New Features

## New Backend Feature

Create:

Model (if needed)

↓

Service

↓

Controller

↓

Route

↓

Register Route

↓

Test Endpoint

↓

Update Frontend

---

## New Frontend Page

Create page inside

```
app/
```

Reuse:

Layout

Navbar

Footer

Components

Hooks

Stores

API Client

Never duplicate existing pages.

---

## New Dashboard Card

Create:

Reusable Component

↓

Connect Store

↓

Connect WebSocket

↓

Update Dashboard

---

## New Sensor

Adding a new sensor requires updating:

Arduino

↓

ESP32 JSON

↓

Backend Model

↓

Validation

↓

Database

↓

WebSocket

↓

Frontend Store

↓

Dashboard Card

↓

History

Never update only one layer.

All layers must stay synchronized.

---

## New MongoDB Collection

Steps:

Create Model

↓

Create Service

↓

Create Controller

↓

Create Route

↓

Register Route

↓

Frontend Integration

---

## New REST API

Always follow:

Route

↓

Controller

↓

Service

↓

Model

↓

MongoDB

Never access MongoDB directly inside routes.

Never place business logic inside routes.

---

## New WebSocket Event

Create event inside backend.

↓

Broadcast event.

↓

Listen inside frontend.

↓

Update Store.

↓

Update UI.

---

# 📦 Folder Responsibilities

## backend/config

Configuration only.

Never add business logic.

---

## backend/controllers

Receive HTTP requests.

Call services.

Return responses.

No business logic.

---

## backend/services

Contains all business logic.

Preferred location for calculations.

Preferred location for Sleep Score.

Preferred location for Alert generation.

---

## backend/models

MongoDB Schemas only.

---

## backend/routes

API Endpoints only.

---

## backend/middleware

Authentication

Authorization

Validation

Rate Limiting

Logging

---

## backend/utils

Reusable helper functions.

---

## web/components

Reusable UI.

Never duplicate components.

---

## web/hooks

Reusable React logic.

---

## web/store

Global state.

---

## web/lib

Utilities.

---

## web/providers

Context Providers.

---

# 🧱 Development Rules

Always use:

TypeScript

Functional Components

Tailwind CSS

JWT

Socket.IO

REST API

MongoDB

Never introduce a new framework without a strong reason.

---

# 📝 Code Style

Use meaningful variable names.

Example:

Good

```
temperature
```

Bad

```
t
```

---

Good

```
sleepDuration
```

Bad

```
sd
```

---

Function names should clearly describe their purpose.

Good

```
calculateSleepScore()
```

Bad

```
calc()
```

---

# 📏 Naming Convention

Components

PascalCase

```
SensorCard.tsx
```

Hooks

camelCase

```
useSocket.ts
```

Services

camelCase

```
sleepScore.service.ts
```

Controllers

camelCase

```
sensor.controller.ts
```

Models

PascalCase

```
User.ts
```

Routes

camelCase

```
sensor.routes.ts
```

---

# 🔐 Security Rules

Always validate incoming data.

Always sanitize user input.

Always hash passwords.

Always verify JWT.

Never expose passwords.

Never expose secrets.

Never trust frontend validation.

Always validate backend requests.

---

# 🌐 API Rules

Every endpoint should:

Validate input.

Call controller.

Controller calls service.

Service calls model.

Return JSON.

Handle errors.

Never skip services.

---

# 🧠 Sleep Score Rules

Current Sleep Score is rule-based.

It depends on:

Pressure Sensor

Sound Sensor

Sleep Duration

Interruptions

Future versions may use AI.

Do not rename the Sleep Score service.

Future AI models should replace only the internal calculation logic.

---

# 🚨 Alert Rules

Every sensor value should pass through Alert Service.

Never generate alerts inside controllers.

Never generate alerts inside routes.

Alert thresholds should remain configurable.

---

# 📡 WebSocket Rules

REST API

↓

Database

↓

WebSocket

↓

Frontend

Live sensor values should always be sent through WebSocket.

Historical data should always come from REST API.

---

# 📱 Responsive Rules

Every page must support:

Desktop

Laptop

Tablet

Mobile

Never break responsive layouts.

---

# 🎨 UI Rules

Maintain consistent spacing.

Maintain color palette.

Maintain typography.

Maintain icons.

Maintain animations.

Reuse existing design language.

---

# 🧩 Component Rules

One component = One responsibility.

Never create huge components.

Split large components into reusable pieces.

---

# 📋 Before Every Commit

Checklist:

✅ TypeScript compiles

✅ No duplicated code

✅ No console errors

✅ Responsive tested

✅ API tested

✅ WebSocket tested

✅ MongoDB tested

✅ JWT tested

---

# 📚 Future Features

The following features are planned.

## IoT

- Heart Rate Sensor

- SpO₂ Sensor

- Body Temperature

- Smoke Detector

- Motion Sensor

- Camera

---

## Backend

- Email Verification

- Password Reset

- Push Notifications

- AI Sleep Analysis

- Report Generator

- Device Management

---

## Frontend

- Dark Mode

- Multi-language

- Charts

- Analytics

- PWA

- Device Management

- Notification Center

---

## Mobile

Flutter Application

Features:

Dashboard

Alerts

Sleep Reports

Statistics

Settings

Notifications

Remote Monitoring

---

# 🎯 Long-Term Vision

The Smart Health Room project aims to become a complete IoT healthcare platform.

Future objectives include:

- AI-assisted health monitoring.
- Intelligent sleep analysis.
- Predictive alerts.
- Cloud synchronization.
- Mobile ecosystem.
- Multi-device management.
- Remote healthcare assistance.
- Smart home integration.
- Wearable device support.
- Advanced analytics.

The architecture should remain modular, scalable, and maintainable to support these future improvements.

---

# ❤️ Final Notes For AI

Before generating code:

1. Read the project structure.
2. Understand existing architecture.
3. Reuse existing code whenever possible.
4. Never duplicate logic.
5. Preserve compatibility.
6. Keep the project modular.
7. Respect naming conventions.
8. Respect folder responsibilities.
9. Write clean and documented code.
10. Prefer extending rather than rewriting.

The goal is to improve the project continuously while preserving its architecture, readability, and maintainability.