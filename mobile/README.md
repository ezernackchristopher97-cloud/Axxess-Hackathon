# REOP-AI Mobile App

A professional React Native mobile application for REOP-AI, powered by AIModelG3.

## Features

- **AI Chat Interface** - Natural conversations with AIModelG3
- **User Authentication** - Login, register, password reset
- **Biometric Login** - Face ID / Fingerprint support
- **Pro Subscriptions** - Multiple billing options via Stripe
- **Dark Theme** - Premium dark green and gold design
- **Cross-Platform** - iOS and Android from single codebase

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- EAS CLI: `npm install -g eas-cli`
- Expo Go app on your phone (for testing)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npx expo start
```

### Testing on Device

1. Install **Expo Go** from App Store or Google Play
2. Scan the QR code from the terminal
3. The app will load on your device

## Project Structure

```
reop-ai-mobile/
├── App.tsx                 # Main app with navigation
├── app.json               # Expo configuration
├── eas.json               # EAS Build configuration
├── src/
│   ├── screens/           # Screen components
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── ForgotPasswordScreen.tsx
│   │   ├── ConversationsScreen.tsx
│   │   ├── ChatScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   └── SubscriptionScreen.tsx
│   ├── contexts/          # React contexts
│   │   └── AuthContext.tsx
│   ├── services/          # API services
│   │   └── api.ts
│   └── utils/             # Utilities
│       └── theme.ts
├── assets/                # App icons and splash screens
├── store-assets/          # App Store/Play Store screenshots
└── DEPLOYMENT_GUIDE.md    # Full deployment instructions
```

## Building for Production

### iOS (App Store)

```bash
# Login to EAS
eas login

# Build for App Store
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

### Android (Google Play)

```bash
# Build for Google Play
eas build --platform android --profile production

# Submit to Google Play
eas submit --platform android
```

## Configuration

### API Endpoint

The app connects to `https://reop-ai.com` by default. This is configured in:
- `src/services/api.ts`
- `app.json` (extra.apiUrl)

### Bundle Identifiers

- iOS: `com.reopai.app`
- Android: `com.reopai.app`

## Theme Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Background | #0a1f1a | Main background |
| Card | #1a3d32 | Card backgrounds |
| Gold | #ffd700 | Accents, logo |
| Tan | #d4a574 | Primary buttons |
| Text | #ffffff | Primary text |

## Support

- Website: https://reop-ai.com
- Email: ezernackchristopher97@gmail.com

## License

Proprietary - All rights reserved.


---

## Full Architecture Integration

The mobile app connects to the REOP-AI backend which implements the complete AIModelG3 cognitive architecture:

### Core Architecture Modules (5,363 lines on backend)

| Module | Lines | Description |
|--------|-------|-------------|
| `aimodelg3.ts` | 2,166 | Quaternion algebra, regime selection, entropy analysis |
| `entropyMirroring.ts` | 777 | RIME entropy mirroring, user personality profiling |
| `neuralPruning.ts` | 743 | Hebbian learning, synaptic burning, geometric optimization |
| `vicsekConsensus.ts` | 543 | Multi-agent flocking dynamics for consensus |
| `aiMiddleware.ts` | 552 | LLM API wrapper with full architecture integration |
| `imageGeneration.ts` | 582 | Image generation with prompt optimization |

### Architecture Components

- **Quaternion Semantic Encoding** - Non-commutative Hamilton product for semantic operations
- **Multi-Agent Consensus** - Builder, Critic, Verifier agents with Vicsek flocking
- **Entropy Analysis** - RIME framework for response policy selection
- **Neural Pruning** - Hebbian learning with synaptic burning
- **Regime Selection** - Automatic detection of algebraic, geometric, planning, semantic modes

---

## Mobile App Statistics

| Component | Files | Lines |
|-----------|-------|-------|
| Screens | 12 | 5,500+ |
| Components | 6 | 1,200+ |
| Services | 1 | 471 |
| Contexts | 1 | 350+ |
| **Total** | **22** | **18,091** |

---

## Additional Screens

### Architecture Dashboard
Real-time statistics showing:
- Neural pruning metrics (total/active/pruned synapses)
- Vicsek consensus status (order parameter, agent count)
- Entropy mirroring state (current state, mirroring strength)
- Memory optimization stats (compression ratio, tokens saved)
- User profile analysis (formality, verbosity, technicality, emotionality)

### Image Generator Screen
Dedicated image generation with:
- Style presets (photorealistic, artistic, abstract, etc.)
- Prompt optimization using entropy analysis
- Generation history
- Full-resolution preview and sharing

### OCR Scanner Screen
Document scanning with:
- Camera capture
- Gallery selection
- Multi-agent text extraction with consensus verification
- Copy/share functionality

---

## API Services

The app uses these API endpoints:

```typescript
// Authentication
authApi.login(email, password)
authApi.register(name, email, password)
authApi.logout()
authApi.me()
authApi.forgotPassword(email)

// Conversations
conversationsApi.list()
conversationsApi.create(title?)
conversationsApi.getMessages(conversationId)
conversationsApi.sendMessage(conversationId, content, imageUrl?)
conversationsApi.delete(id)
conversationsApi.search(query, startDate?, endDate?)

// Subscriptions
subscriptionApi.getStatus()
subscriptionApi.getUsage()
subscriptionApi.createCheckout(billingOption)

// Image Generation
imageApi.generate(prompt, style?)
imageApi.getHistory(limit?)
imageApi.getStyles()

// OCR
ocrApi.extract(imageUrl)
ocrApi.analyze(imageUrl, question)

// Voice
voiceApi.transcribe(audioData, language?)

// Image Editing
imageEditApi.edit(editPrompt, originalImageUrl, editType?)
imageEditApi.detectEdit(message)

// Architecture Stats
architectureApi.getStats()
architectureApi.getMiddlewareStats()
architectureApi.getUserProfile()
architectureApi.exportMetrics(format)
```

---

## Deployment Guide

See [DEPLOYMENT-README.md](./DEPLOYMENT-README.md) for complete step-by-step instructions including:

- Mac setup with Homebrew, Node.js, Xcode, Android Studio
- EAS build configuration
- iOS App Store submission
- Google Play Store submission
- Screenshot requirements and store listing content

---

## Related Repositories

- [AI-MODELg3](https://github.com/ezernackchristopher97-cloud/AI-MODELg3) - Web application with full backend

---

**Copyright 2024-2026 REOP Solutions. All rights reserved.**
