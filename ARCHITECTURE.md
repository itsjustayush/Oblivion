# System Architecture & Technical Specifications

## Architectural Overview

**Oblivion** is a high-performance, ambient productivity suite built around a **local-first** React application architecture running on a lightweight Express + Vite server layer.

```text
[ Browser Client ]
  ├── React 18 SPA (App.tsx)
  ├── Local Storage Engine (useLocal hook)
  ├── Responsive Layout Hook (useResponsiveLayout)
  ├── Custom Web Audio Rain & Ambient Sound Synthesizer
  ├── Framer Motion Animation & Glassmorphism Panels
  └── BaaS Clients (Firebase Firestore & Google Calendar API)
        │
[ Express / Server Proxy ]
  ├── Express.js (server.ts)
  ├── Static Asset Distribution & Vite Middleware
  └── OAuth Proxy Endpoints (Spotify / Google Workspace)
```

---

## Key Tech Stack Components

- **Frontend Framework**: React 18 with Vite, TypeScript.
- **Styling & Motion**: Tailwind CSS v3, Lucide React icons, Framer Motion (`motion/react`).
- **State Management & Persistence**: Custom `useLocal` React hook syncing browser `LocalStorage` with cloud fallback via Firebase Firestore.
- **Responsive System**: Custom `useResponsiveLayout` hook enforcing desktop pill navigation vs small-screen Bento Grid menu modal.
- **Audio Engine**: Web Audio API Procedural Synthesizer for procedural rain and pink noise, paired with Spotify Embed Player.
- **Backend Service**: Express.js server (`server.ts`) bundled with `esbuild`.

---

## Core Data Models

1. **Tasks & Checklists**: Stored under user isolated collection `users/{uid}/tasks`.
2. **Notes & Canvas**: Stored under `users/{uid}/notes` and `users/{uid}/canvas`.
3. **Hydration & Health Tracker**:
   - `waterCount`: Daily glass counter indexed by date (`oblivion_water_YYYY-MM-DD`).
   - `onlineSeconds`: Active session runtime timer used to calculate hydration intervals and real-time countdowns (`next reminder in: XXs`).
