# Onboarding Guide

Welcome to the CamsureApp project! This guide will help you get started as a developer.

## Tech Stack
- **Expo (React Native):** Cross-platform mobile and web app framework
- **TypeScript:** Type safety for all code
- **React Native Web:** Web support for Expo
- **Lucide Icons:** Modern icon set for UI

## Folder Structure
- `app/` — Main app source code (tabs, screens, components)
- `assets/` — Images and static assets
- `node_modules/` — Dependencies
- `package.json` — Project dependencies and scripts
- `app.json` — Expo project config
- `CHANGELOG.md` — Project history
- `FEATURES.md` — Feature list
- `ONBOARDING.md` — This file

## Running Locally
### Mobile (iOS/Android)
1. Install dependencies:
   ```bash
   yarn install
   # or
   npm install
   ```
2. Start Expo:
   ```bash
   npx expo start
   ```
3. Scan the QR code with Expo Go app on your device, or run on an emulator.

### Web
1. Start Expo for web:
   ```bash
   npx expo start --web
   ```
2. Open the provided localhost URL in your browser.

## Deploying to Vercel (Web)
1. Build the web app:
   ```bash
   npx expo build:web
   # or
   npx expo export:web
   ```
2. Deploy the `web-build/` directory to Vercel (drag-and-drop or via CLI).
3. Optionally, add a `vercel.json` for custom config.

## Key Features & Where to Find Them
- **Camera Tab:** `app/(tabs)/camera.tsx`
- **Gallery Tab:** `app/(tabs)/gallery.tsx`
- **Kanban Tab:** `app/(tabs)/kanban.tsx`
- **Mock Data:** `app/data/gua-data.json`
- **App Entry:** `app/_layout.tsx` or `app/index.tsx`

## Need Help?
- See `FEATURES.md` for a full feature list.
- See `CHANGELOG.md` for recent changes.
- Ask the project maintainer for access or troubleshooting. 