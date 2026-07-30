# Changelog

All notable changes, bug fixes, feature additions, and infrastructure updates for **Oblivion** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to semantic versioning and git commit history from [itsjustayush/oblivion](https://github.com/itsjustayush/oblivion).

---

## [1.5.0] - 2026-07-30

### Added
- **Chrome Popup Extension**: Created full Manifest V3 Chrome Extension package in `/extension` with background service worker, timer popup, screen keep-awake, and quick task list.
- **Zero-Download Auto-Updating Extension Wrapper**: Created interactive `ChromeExtensionModal` in main navigation displaying 2-file (`manifest.json` and `popup.html`) setup guide that connects directly to the live deployed URL for zero-download instant auto-updates upon pushing repo changes.
- **Do Not Disturb (DND) Focus Shield**: Implemented automatic notification suppression during active focus blocks, with live status indicator and switch control in Pomodoro timer.
- **Open Graph & Twitter Social Preview**: Added 1200×630 high-resolution branding preview image (`/public/oblivion.png`) and complete `<meta>` Open Graph and Twitter card tags in `index.html` for rich card previews on Discord, Twitter/X, WhatsApp, and LinkedIn.

---

## [1.4.0] - 2026-07-29

### Added
- **Changelog Documentation**: Added `Changelog.md` documenting complete project evolution from repository initialization to current releases.
- **Strict Guest Mode Zero-State**: Implemented strict unauthenticated checks in `StatsPanel` and chart components to force zeroed-out analytics (`focus: 0`, `tasks: 0`, `score: 0`) across all time ranges (7d, 30d, 90d, All) when no user is signed in.
- **Interactive Area Charts**: Transformed productivity visualizations into smooth gradient `AreaChart` views using Recharts, with multi-metric toggling (Focus vs Target, Tasks & Sessions, Score Trend).
- **High-Resolution Ambient Wallpapers**: Replaced older preset backgrounds with 6 atmospheric high-definition wallpapers (Starry Atmosphere, Calm Forest, Rainy Window, Cosmic Nebula, Cozy Bokeh, Dark Highlands).

### Fixed
- **Multi-Tenant Session & Data Isolation**: Secured Firestore user queries (`users/{uid}/sessions`, `users/{uid}/tasks`) to guarantee complete isolation between authenticated accounts and prevent session data leaks into Guest Mode or other users.
- **Firebase User Data Reset**: Enhanced the `handleReset` workflow in `StatsPanel` to clear local storage (`oblivion.pomodoro.cycles`) and scrub/reset user Firestore session collections (`users/{uid}/sessions`) and summary documents (`users/{uid}/stats/summary`) to 0.
- **State Reset on Logout**: Ensured all cached session state, task counters, and analytics charts are instantly wiped to 0 upon sign-out or switching to Guest Mode.

---

## [1.3.0] - 2026-07-29

### Changed
- **Metadata & App Description**: Updated `metadata.json` and project metadata to accurately reflect Oblivion as a minimalist ambient focus space with Pomodoro timer, integrated Spotify playlists, live weather, tasks, and productivity analytics.
- **Developer Branding & Navigation**: Added direct hyperlinks to the [GitHub Repository](https://github.com/itsjustayush/oblivion) in the header navigation and developer profile attribution in the settings panel and footer.
- **Authentication Streamlining**: Simplified Google Authentication flow, removing unnecessary redirect loops and streamlining session initialization (`commit 93d7e62`).

---

## [1.2.0] - 2026-07-27

### Added
- **Vercel Deployment Compatibility**: Configured public npm registry URLs in lockfile, set Node 22 engine specifications, and updated deployment configuration to use `npm ci` (`commit d75a403`).
- **Iframe Authentication Fallback**: Added popup and redirect fallback handlers for Google OAuth within sandboxed iframe containers (`commit 7c4eab0`).
- **Google Workspace Synchronization**: Integrated Google Calendar event syncing, unified Google Tasks API endpoints, and automatic user profile bootstrapping upon first sign-in (`commit 7c4eab0`).

### Documentation
- **Deployment Documentation**: Documented Vercel deployment setups and lockfile registry fixes (`commit 9ef1833`).

---

## [1.1.0] - 2026-07-26

### Added
- **Interactive Spotlight Reveal UI**: Replaced heavy visual elements with a lightweight cursor-following spotlight reveal effect (`commit 894bb4b`).
- **Vercel Telemetry & Monitoring**: Added `@vercel/analytics` and `@vercel/speed-insights` integration, routing application logs directly to Vercel (`commit 5040775`, `540b398`).

### Removed
- **Unused AI & Voice Modules**: Removed legacy ClickUp, Sarvam AI, and voice assistant components to keep the frontend lightweight and focused on core productivity (`commit 4cb5a76`).

### Security
- **Dependency Security**: Added `websocket-driver` dependency override to eliminate vulnerable transitive package paths (`commit 5040775`).

---

## [1.0.0] - 2026-06-08

### Added
- **Gemini API Integration**: Implemented server-side `/api/agent/interact` endpoint to securely proxy Gemini API requests without exposing API keys (`commit 73eb0f2`).
- **Firestore Schema Expansion**: Extended database schema to support sticky note pinning, color tagging, custom task ordering, and security rules (`commit 73eb0f2`).

---

## [0.1.0] - 2026-06-07

### Added
- **Initial Project Scaffolding**: Initialized React 18, Vite, and Tailwind CSS app architecture (`commit ae0ff9a`).
- **Core Productivity Suite**: Built primary ambient clock, Pomodoro focus timer with cycle tracking, quick notes pad, soundscape generator, and embedded Spotify widget.
- **Firebase Authentication & Firestore**: Configured Firebase auth state listeners, Google Auth provider, and persistent cloud document storage (`commit d5f02b9`).
