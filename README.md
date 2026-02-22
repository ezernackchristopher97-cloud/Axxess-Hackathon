# NeuroSync Care

**Predictive Neurological Care Platform for Clinicians, Providers, and Caregivers**

Live Demo: [https://neurosync-care-server.onrender.com](https://neurosync-care-server.onrender.com)

---

## Summary

NeuroSync Care is a clinical decision support platform built for providers managing patients with neurological conditions. It combines predictive risk scoring, ICD-10 code assignment, AI-assisted triage, caregiver coordination, and emergency documentation into a single system. The platform was built by unifying three of my existing personal projects (REOP AI, Neural Entropy, and ReUnity) into a cohesive tool that connects patients, caregivers, clinicians, and first responders. It addresses both Axxess Hackathon tracks: AI-Driven Preventative Health Partner and Diagnostic Assistant.

---

## Architecture

![Architecture Diagram](docs/architecture_clean.png)

The system has three layers:

1. **Mobile App** (Expo 54 / React Native): Patient-facing app with 7 screens covering profile, risk scoring, caregiver alerts, visit summaries, AI chat, emergency card, and settings.
2. **Web Dashboard** (HTML/JS): Clinician-facing single-page dashboard with the same feature set, plus ICD-10 code lookup powered by the NLM Clinical Tables API.
3. **Server** (Node.js / Express): API proxy for Featherless AI (DeepSeek-V3), risk computation, and visit summary generation. Deployed on Render.

The BoraFramework entropy computation (Shannon Entropy, Sample Entropy, Vicsek Order) runs client-side for real-time risk analysis without server round-trips.

---

## Tech Stack

| Layer       | Technology                                      |
| ----------- | ----------------------------------------------- |
| Mobile      | React Native, Expo 54, TypeScript               |
| Web         | HTML, CSS, JavaScript                           |
| Server      | Node.js, Express                                |
| AI          | Featherless AI (DeepSeek-V3)                    |
| Clinical    | NLM Clinical Tables API (ICD-10-CM, CMS codes)  |
| Deployment  | Render.com                                      |

---

## Setup

### Quick Start (Demo Mode)

```bash
# Start the server
cd server
npm install
npm run dev

# In a new terminal, start the mobile app
cd mobile
npm install
npx expo start
```

Scan the QR code with Expo Go. Demo Mode works with mock data and requires no API key.

### Live AI Mode

1. Copy `.env.example` to `server/.env`
2. Add your `FEATHERLESS_API_KEY`
3. Start the server and mobile app
4. Toggle Demo Mode off in the app settings

### Running on a Physical Device

```bash
cd mobile
EXPO_PUBLIC_SERVER_URL=http://YOUR_LOCAL_IP:3001 npx expo start
```

---

## Project Structure

```
/mobile    React Native mobile app (Expo)
/server    Express backend and web dashboard
/docs      Documentation, architecture diagrams, demo script
/archive   Original source code from integrated projects
```

---

## License

2026 Christopher Ezernack. Axxess Hackathon 2026.
