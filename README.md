<div align="center">

# 🪐 OBLIVION

**A Minimalist, Ambient Focus Space & Personal Productivity Sanctuary**

*Designed for seamless flow state, distraction-free study sessions, ambient soundscapes, and intuitive workflow tracking.*

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-oblivionstudy.vercel.app-6366f1?style=for-the-badge)](https://oblivionstudy.vercel.app/)

<br />

[![React](https://img.shields.io/badge/React_18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase_Firestore-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com/)

---

### 🌐 [Launch Oblivion Live Application](https://oblivionstudy.vercel.app/)

</div>

<br />

## 📖 Deep-Dive Overview

In an era of relentless digital notifications, context switching, and cluttered browser tabs, **Oblivion** was created to restore clarity and deep concentration. 

Oblivion is an all-in-one ambient productivity sanctuary and study timer. Instead of forcing users to stitch together separate timer apps, music players, weather tabs, note widgets, and task managers, Oblivion unifies all essential deep-work utilities into a single, cohesive, dark-mode atmosphere.

By pairing customizable interval timing with curated audio vibes, real-time environment widgets, and streamlined task management, Oblivion helps students, developers, and creative professionals enter and sustain a prolonged state of **flow**.

---

## ✨ Core Feature Breakdown

### ⏱️ 1. Focus Timer (Pomodoro Engine)
* **Interval Modes:** Switch seamlessly between **Focus** (25 min default), **Short Break** (5 min), and **Long Break** (15 min) intervals with custom duration overrides.
* **Streak & Session Tracking:** Automatically tracks completed focus blocks, maintaining daily streak counters to reward consistency.
* **Fluid Time Display:** Large, crisp display typography with document title clock synchronization so you can track remaining time even when viewing other tabs.

### 🎵 2. Ambient Audio & Music Curation
* **Integrated Spotify Player:** Built-in streaming frame providing instant access to full playlists directly inside your study canvas.
* **Curated Vibe Channels:** Quick-switch ambient presets tailored for every mood:
  * 🎧 *Lofi Beats* — Relaxed, rhythmic instrumental study beats.
  * 🌧️ *Rainy Day* — Soothing precipitation and cozy atmospheric soundscapes.
  * ☕ *Jazz Café* — Warm, background acoustic coffee house jazz.
  * 🧘 *Deep Focus* — Binaural alpha waves and deep drone textures.
  * 📚 *Ambient Study* — Gentle cinematic textures designed to heighten cognitive processing.

### 🌤️ 3. Real-Time Weather & Environment Widget
* **Location-Based Detection:** Live weather tracking providing localized temperature, humidity, and condition updates.
* **Contextual Aesthetics:** Environment metadata blends into the background visuals, reinforcing a cozy, grounded study mood.

### 📝 4. Task & Todo Management
* **Intuitive Checklist:** Create, categorize, and complete tasks with custom priority badges and sub-item organization.
* **Persistence:** Instant background synchronization ensures your active task list is maintained across sessions.

### 📅 5. Calendar & Schedule Tracking
* **Event Planning:** Keep track of upcoming assignment deadlines, study groups, or exam schedules without leaving your focus space.
* **Visual Timelines:** Clear daily and weekly overview cards for effortless time-blocking.

### 🗒️ 6. Notes & Ideas Scratchpad
* **Instant Thought Capture:** Quick-note pad designed for capturing spontaneous ideas, code snippets, or review questions during active timer intervals.
* **Auto-Save:** Formatted scratchpad state saved automatically to prevent data loss.

### 📊 7. Analytics & Focus Insights
* **Productivity Metrics:** Historical logging of total focus hours, session counts, and completion efficiency.
* **Visual Progress:** Clean data visualizations summarizing daily productivity trends over time.

---

## 🏗️ Technical Architecture & Tech Stack

Oblivion is built on a modern, high-performance web architecture engineered for sub-second load times and real-time state synchronization.

```
┌─────────────────────────────────────────────────────────────┐
│                      Oblivion Client                        │
│   React 18  │  TypeScript  │  Vite  │  Tailwind CSS         │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐  ┌───────────────────────────┐
│     Firebase Cloud Storage   │  │    Vercel Edge Platform   │
│  • Firestore Real-time Sync  │  │  • Global Edge Delivery   │
│  • Per-User Data Isolation   │  │  • Web Analytics          │
│  • Security Rules Enforcement│  │  • Speed Insights         │
└──────────────────────────────┘  └───────────────────────────┘
```

### 💻 Frontend Technology
* **React 18:** Modern functional architecture utilizing stateful hooks, context providers, and optimized re-renders.
* **TypeScript:** Strict type-safety across all entities (tasks, events, timer states, user settings) ensuring zero runtime type errors.
* **Vite:** Lightning-fast HMR and optimized production bundling for rapid cold starts.
* **Tailwind CSS:** Utility-first dark-mode styling utilizing sleek translucent glassmorphism textures and precise spacing scales.

### 🔒 Backend & Data Persistence
* **Firebase Cloud Firestore:** Real-time document database storing user profiles, active task lists, event calendars, note entries, and historical analytics.
* **Granular Security Isolation:** Built using a secure multi-tenant data architecture where each authenticated user operates inside isolated collection paths (`/users/{userId}/*`). Firestore security rules strictly validate request authentication UID matching to prevent unauthorized data access.

### 📈 Telemetry & Web Vitals
* **Vercel Web Analytics:** Privacy-first traffic monitoring tracking active visitors and session duration.
* **Vercel Speed Insights:** Real-time Core Web Vitals profiling (LCP, FID, CLS) to guarantee optimal performance across all device viewports.

---

## 🎨 UI/UX & Design Philosophy

Oblivion adheres to a strict **"Anti-Distraction First"** visual design language:

1. **Dark Atmosphere:** Deep charcoal and warm dark canvas backgrounds (`#0d0d11`) lower eye strain during late-night study sessions.
2. **Subtle Elevation:** Soft, low-contrast 1px border lines and subtle glassmorphism containers maintain visual structure without creating visual noise.
3. **Fluid Micro-Interactions:** Smooth CSS transitions for button states, modal overlays, and timer progress rings create a tactile, polished feel.
4. **Spatial Balance:** Generous negative space ensures that primary actions (timer, audio controls) remain prominently centered.

---

## 🚀 Deployment & Infrastructure

Oblivion is continuously deployed on **Vercel's Global Edge Network**:

* **Automated CI/CD:** Automated builds triggered on production commits guarantee rapid feature delivery.
* **Global CDN Caching:** Static assets are served from edge nodes globally for instant initial load performance.
* **Serverless Functions:** API proxies handle secure integration callbacks without exposing client-side credentials.

---

## 🔮 Future Enhancements & Roadmap

- [ ] **Customizable Soundboard Layers:** Blend ambient rain, fireplace crackles, and thunderstorm sounds with custom volume sliders.
- [ ] **AI-Driven Study Planner:** Auto-schedule study blocks based on task deadlines and historical energy levels.
- [ ] **Social Focus Rooms:** Optional peer-to-peer virtual study rooms with shared timer sync and mute-by-default audio.
- [ ] **Advanced Data Export:** Export focus analytics and session logs to CSV, JSON, or Notion databases.

---

## 👤 Author & Credits

Designed and engineered with care for students and creators worldwide.

* **Project Repository & Live App:** [oblivionstudy.vercel.app](https://oblivionstudy.vercel.app/)
* **Contact & Inquiries:** info.cometlabs@gmail.com

---

<div align="center">
  <sub>Built for deep focus and uninterrupted work. © 2026 Oblivion.</sub>
</div>
