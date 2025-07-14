# CamsureApp

A modern, minimal, JIRA-inspired mobile and web app for compliance photo capture, gallery, and task management.

## Overview
CamsureApp is a cross-platform (iOS, Android, Web) app built with Expo and React Native. It features:
- A Camera tab for capturing photos with meta info overlays
- A Gallery tab for browsing project folders and images
- A Kanban tab for managing compliance tasks in a JIRA-like board

## Main Features
- **Camera:** Timestamp, location, and project/ticket overlays; review modal after photo
- **Gallery:** Folder-first view, minimal UI, image stickers, fast loading
- **Kanban:** JIRA-style columns, stats widgets, create task modal, filter/search, date picker for deadlines
- **Mobile & Web:** Optimized for both mobile and web (via Expo for Web)

See [`FEATURES.md`](./FEATURES.md) for a detailed feature list.

## Quick Start
1. Install dependencies:
   ```bash
   yarn install
   # or
   npm install
   ```
2. Start the app:
   ```bash
   npx expo start
   ```
3. Open on your device (Expo Go) or in your browser (`w` for web).

## Web Deployment (Vercel)
1. Build the web app:
   ```bash
   npx expo build:web
   ```
2. Deploy the `web-build/` directory to Vercel (drag-and-drop or CLI).
3. Optionally, add a `vercel.json` for custom config.

## Onboarding & Changelog
- See [`ONBOARDING.md`](./ONBOARDING.md) for developer onboarding.
- See [`CHANGELOG.md`](./CHANGELOG.md) for project history.

---

Made with ❤️ using Expo, React Native, and TypeScript. 