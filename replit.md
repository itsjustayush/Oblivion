# Oblivion Agent

A React + TypeScript + Express personal focus workspace with a futuristic cyber-aesthetic.

## Stack
- Frontend: React 19 + Vite + Tailwind CSS v4 + Radix UI + Recharts + Motion
- Backend: Express + tsx (dev) + esbuild (prod)
- AI: Google Gemini (`@google/genai`)
- Data & Auth: Firebase (Authentication + Firestore)
- Integrations: Google Sign-in, Google Calendar, Google Tasks, Spotify OAuth
- Analytics: Vercel Analytics + Speed Insights (wired in `src/main.tsx`)

## How to run
- Development: `PORT=5000 npm run dev` (starts Express + Vite middleware on port 5000)
- Production build: `npm run build` then `npm start`
- Type check: `npm run lint`

The configured Replit workflow runs `PORT=5000 npm run dev`.

## Required secrets
Copy `.env.example` to `.env` and fill in at minimum:
- `GEMINI_API_KEY` — required for the AI assistant
- Optional: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`

## Notes
- Google Sign-in is handled with Firebase Auth. In cross-origin iframes (like the Replit preview), the popup flow falls back to a redirect flow.
- Vercel Analytics and Speed Insights are already installed and mounted in `src/main.tsx`.
- A `websocket-driver` override was added to `package.json` to avoid a vulnerable transitive dependency pulled in by Firebase.
