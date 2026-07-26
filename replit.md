# Oblivion Agent

A React + TypeScript + Express personal AI voice assistant with a futuristic cyber-aesthetic.

## Stack
- Frontend: React 19 + Vite + Tailwind CSS v4 + Radix UI + Recharts + Motion
- Backend: Express + tsx (dev) + esbuild (prod)
- AI: Google Gemini (`@google/genai`)
- Integrations: Spotify OAuth, ClickUp OAuth, Sarvam.ai TTS
- Analytics: Vercel Analytics + Speed Insights (already wired in `src/main.tsx`)

## How to run
- Development: `npm run dev` (starts Express + Vite middleware on port 3000)
- Production build: `npm run build` then `npm start`
- Type check: `npm run lint`

## Required secrets
Copy `.env.example` to `.env` and fill in at minimum:
- `GEMINI_API_KEY` — required for the AI assistant
- Optional: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `CLICKUP_CLIENT_ID`, `CLICKUP_CLIENT_SECRET`, `SARVAM_API_KEY`

## Notes
- Vercel Analytics and Speed Insights are already installed and mounted in `src/main.tsx`.
- A `websocket-driver` override was added to `package.json` to avoid a vulnerable transitive dependency pulled in by Firebase.
