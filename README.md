# NeuroSync Care

**A Preventive Health Partner & Diagnostic Assistant for Neurological Conditions**

© 2026 Christopher Ezernack. Axxess Hackathon 2026.

---

## Overview

NeuroSync Care is a mobile application for patients with neurological conditions. It integrates features from three of my prior systems (REOP AI, Neural Entropy, and ReUnity) into a single platform that connects the patient, caregiver, clinician, and first responder.

The project addresses both Axxess Hackathon tracks: an **AI-driven preventive health partner** (Track A) and a **diagnostic assistant** (Track B).

## Features

| Feature                 | Description                                                  | Original System    |
| ----------------------- | ------------------------------------------------------------ | ------------------ |
| Patient Profile         | Medical profile with symptoms, medications, and allergies.   | New                |
| Predictive Risk Score   | Entropy-based stability scoring via the BoraFramework.       | Neural Entropy     |
| Caregiver Alerts        | Real-time alert feed with care team management.              | ReUnity            |
| Visit Summary Generator | Structured and patient-friendly summaries via Featherless AI.| New + Featherless  |
| Assistant Chat          | Health information assistant.                                | REOP AI + Featherless |
| Emergency Card          | High-visibility card for first responders.                   | ReUnity            |
| ICD-10 Code Lookup      | Live search against NLM/CMS ICD-10-CM for billing codes.     | New                |
| Demo Mode               | Toggles between mock data and live AI.                       | New                |

---

## Quick Start (Demo Mode)

### 1. Start the Server

```bash
cd server
npm install
npm run dev
```

### 2. Start the Mobile App (in a new terminal)

```bash
cd mobile
npm install
npx expo start
```

### 3. Open on Your Phone

Scan the QR code with **Expo Go** (iOS or Android). The app runs in **Demo Mode** by default, with all features working with mock data (no API key needed).

### Running on a Physical Device

For the app to communicate with the server on your local network:

1.  Find your computer's local IP address (`ipconfig` or `ifconfig`).
2.  Start the server as usual: `cd server && npm run dev`
3.  Start the mobile app with the server URL: `cd mobile && EXPO_PUBLIC_SERVER_URL=http://YOUR_IP:3001 npx expo start`

---

## Live Mode (with Featherless AI)

1.  Copy `.env.example` to `server/.env`.
2.  Add your `FEATHERLESS_API_KEY` to `server/.env`.
3.  Start the server and mobile app.
4.  In the app's Settings screen, toggle Demo Mode OFF.

---

## Project Structure

-   `/mobile`: Expo/React Native mobile app.
-   `/server`: Minimal Express backend for Featherless AI proxying.
-   `/docs`: Project documentation (inventory, feature map, runbook, demo script).
-   `/archive`: Original source code archives.

## Architecture

The mobile app uses REOP AI Mobile (Expo 54, React 19) as its base, with modules from Neural Entropy (entropy scoring) and ReUnity (caregiver patterns) integrated. The Featherless AI integration uses OpenAI-compatible endpoints through the Express proxy server. The BoraFramework entropy computation runs entirely on-device.

## Source Code

Original source code from the three integrated projects is in the `/archive` directory.
