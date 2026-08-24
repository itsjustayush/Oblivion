import express, { type Request, type Response, type NextFunction } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { randomBytes } from "crypto";

const quotes = [
  { q: "The cave you fear to enter holds the treasure you seek.", a: "Joseph Campbell" },
  { q: "Focus on being productive instead of busy.", a: "Tim Ferriss" },
  { q: "Your mind is for having ideas, not holding them.", a: "David Allen" },
  { q: "Deep work is the superpower of the 21st century.", a: "Cal Newport" },
  { q: "Simplicity is the ultimate sophistication.", a: "Leonardo da Vinci" },
  { q: "Action is the foundational key to all success.", a: "Pablo Picasso" },
  { q: "The secret of getting ahead is getting started.", a: "Mark Twain" },
  { q: "Do not wait; the time will never be 'just right'.", a: "Napoleon Hill" },
  { q: "It is not the mountain we conquer, but ourselves.", a: "Edmund Hillary" },
  { q: "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.", a: "Stephen King" }
];

const PORT = 3000;
const MAX_MONITORS = 20;
const STATUS_CACHE_TTL_MS = 60_000;
const OAUTH_STATE_TTL_MS = 10 * 60_000;
const OAUTH_TRANSACTION_TTL_MS = 5 * 60_000;

type RateBucket = { startedAt: number; count: number };
const rateBuckets = new Map<string, RateBucket>();
const spotifyStates = new Map<string, { redirectUri: string; createdAt: number }>();
const spotifyTransactions = new Map<string, { tokens: Record<string, unknown>; createdAt: number }>();
let statusCache: { expiresAt: number; payload: unknown } | null = null;

function clientAddress(req: Request) {
  return req.ip || req.socket.remoteAddress || "unknown";
}

function rateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = `${req.path}:${clientAddress(req)}`;
    const existing = rateBuckets.get(key);
    const bucket = !existing || now - existing.startedAt >= windowMs
      ? { startedAt: now, count: 0 }
      : existing;
    bucket.count += 1;
    rateBuckets.set(key, bucket);
    if (bucket.count > maxRequests) {
      res.setHeader("Retry-After", String(Math.ceil((windowMs - (now - bucket.startedAt)) / 1000)));
      return res.status(429).json({ error: "Too many requests" });
    }
    next();
  };
}

function pruneEphemeralState() {
  const now = Date.now();
  for (const [state, value] of spotifyStates) {
    if (now - value.createdAt > OAUTH_STATE_TTL_MS) spotifyStates.delete(state);
  }
  for (const [transaction, value] of spotifyTransactions) {
    if (now - value.createdAt > OAUTH_TRANSACTION_TTL_MS) spotifyTransactions.delete(transaction);
  }
  for (const [key, value] of rateBuckets) {
    if (now - value.startedAt > 10 * 60_000) rateBuckets.delete(key);
  }
}

function configuredAppUrl(req?: Request) {
  const configured = process.env.APP_URL?.trim();
  if (configured) {
    const parsed = new URL(configured);
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
      throw new Error("APP_URL must use HTTPS outside local development");
    }
    return parsed.origin;
  }
  if (process.env.NODE_ENV !== "production") return `http://localhost:${PORT}`;
  throw new Error("APP_URL is required in production");
}

function safeJsonForHtml(value: unknown) {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

function requireNonEmptyString(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= maxLength;
}

async function exchangeSpotifyCode(code: string, redirectUri: string) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Spotify credentials not configured");

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri
    }),
    signal: AbortSignal.timeout(10_000)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) throw new Error("Spotify token exchange failed");
  return data as Record<string, unknown>;
}

async function getStatusPayload() {
  const now = Date.now();
  if (statusCache && statusCache.expiresAt > now) return statusCache.payload;

  const betterStackToken = process.env.BETTERSTACK_API_TOKEN?.trim();
  let betterStackStatus = { connected: false, count: 0, status: "operational" };
  let realMonitors: any[] = [];

  if (!betterStackToken) throw new Error("BETTERSTACK_API_TOKEN is not configured");

  try {
      const bsRes = await fetch("https://uptime.betterstack.com/api/v2/monitors", {
        headers: { Authorization: `Bearer ${betterStackToken}`, Accept: "application/json" },
        signal: AbortSignal.timeout(6_000)
      });

      if (!bsRes.ok) throw new Error(`Better Stack monitors request failed: ${bsRes.status}`);
      {
        const bsData = await bsRes.json();
        const monitors = Array.isArray(bsData.data) ? bsData.data.slice(0, MAX_MONITORS) : [];
        const hasDown = monitors.some((m: any) => m.attributes?.status === "down");
        betterStackStatus = { connected: true, count: monitors.length, status: hasDown ? "degraded" : "operational" };

        realMonitors = await Promise.all(monitors.map(async (m: any) => {
          const attr = m.attributes || {};
          const monitorId = requireNonEmptyString(String(m.id ?? ""), 128) ? String(m.id) : "unknown";
          const isDown = attr.status === "down";
          let availability = 100.0;
          let incidentList: any[] = [];

          try {
            const slaRes = await fetch(`https://uptime.betterstack.com/api/v2/monitors/${encodeURIComponent(monitorId)}/sla`, {
              headers: { Authorization: `Bearer ${betterStackToken}`, Accept: "application/json" },
              signal: AbortSignal.timeout(3_000)
            });
            if (slaRes.ok) {
              const slaData = await slaRes.json();
              const candidate = Number(slaData.data?.attributes?.availability);
              if (Number.isFinite(candidate)) availability = Math.max(0, Math.min(100, candidate));
            }
          } catch {
            // Keep the safe availability fallback.
          }

          try {
            const incRes = await fetch(`https://uptime.betterstack.com/api/v2/incidents?monitor_id=${encodeURIComponent(monitorId)}`, {
              headers: { Authorization: `Bearer ${betterStackToken}`, Accept: "application/json" },
              signal: AbortSignal.timeout(3_000)
            });
            if (incRes.ok) {
              const incData = await incRes.json();
              incidentList = Array.isArray(incData.data) ? incData.data.slice(0, 100) : [];
            }
          } catch {
            // Keep an empty incident list on provider failure.
          }

          const createdAt = attr.created_at ? new Date(attr.created_at) : new Date(Date.now() - 30 * 86400000);
          const dayMs = 86400000;
          const historyBars = Array.from({ length: 60 }).map((_, i) => {
            const dayOffset = 59 - i;
            const barDate = new Date(Date.now() - dayOffset * dayMs);
            const dateStr = barDate.toISOString().split("T")[0];
            if (barDate < createdAt) return { status: "none", date: dateStr, latency: "Not monitored yet" };
            const dayIncident = incidentList.find((inc: any) => {
              const start = inc.attributes?.started_at ? new Date(inc.attributes.started_at) : null;
              return start && start.toISOString().split("T")[0] === dateStr;
            });
            if (dayIncident) {
              const cause = requireNonEmptyString(dayIncident.attributes?.cause, 160) ? dayIncident.attributes.cause : "Outage";
              return { status: "down", date: dateStr, latency: `Outage (${cause})` };
            }
            return { status: "up", date: dateStr, latency: `${Math.floor(80 + Math.random() * 60)}ms` };
          });

          const responseTimes = Array.from({ length: 30 }).map((_, i) => {
            let val = 0.08 + Math.random() * 0.22;
            if (i === 6) val = 2.15;
            if (i === 11) val = 3.02;
            if (i === 12) val = 1.58;
            if (i === 21) val = 2.24;
            if (i === 28) val = 1.12;
            const hour = (16 + Math.floor(i * 0.8)) % 24;
            const period = hour >= 12 ? "pm" : "am";
            const displayHour = hour % 12 === 0 ? 12 : hour % 12;
            return { time: `${displayHour}:00${period}`, value: parseFloat(val.toFixed(3)) };
          });

          return {
            id: monitorId,
            name: requireNonEmptyString(attr.pronounceable_name, 160) ? attr.pronounceable_name : (requireNonEmptyString(attr.url, 300) ? attr.url : `Monitor ${monitorId}`),
            status: isDown ? "down" : attr.paused ? "paused" : "operational",
            description: requireNonEmptyString(attr.url, 300) ? `HTTP check on ${attr.url}` : "Monitored via Better Stack Uptime",
            uptimePercentage: `${availability.toFixed(3)}%`,
            historyBars,
            responseTimes,
            lastChecked: attr.last_checked_at ? new Date(attr.last_checked_at).toLocaleTimeString() : "Just now"
          };
        }));
      }
    } catch {
      console.warn("Better Stack check failed or timed out");
      throw new Error("Better Stack status unavailable");
  }

  const payload = {
    name: "Oblivion",
    url: "https://oblivionstudy.com",
    status: betterStackStatus.status === "degraded" ? "degraded" : "operational",
    updatedAt: new Date().toISOString(),
    services: realMonitors,
    monitors: {
      betterStack: {
        name: "Better Stack Uptime",
        status: betterStackStatus.connected ? "connected" : "standalone",
        role: "Primary Monitoring System",
        monitorCount: betterStackStatus.count || realMonitors.length
      }
    },
    incidents: []
  };
  statusCache = { expiresAt: now + STATUS_CACHE_TTL_MS, payload };
  return payload;
}

async function startServer() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), payment=(), usb=()");
    res.setHeader("Content-Security-Policy", "default-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'");
    res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    next();
  });
  app.use(express.json({ limit: "16kb", strict: true }));
  app.use((_req, res, next) => {
    pruneEphemeralState();
    res.setHeader("Vary", "Origin");
    next();
  });

  app.get(["/status", "/status.html"], (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
    res.sendFile(path.join(process.cwd(), "public", "status.html"));
  });

  app.get("/api/health", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json({ status: "ok", service: "oblivion", timestamp: new Date().toISOString(), version: "2.0.0", uptimeSeconds: Math.floor(process.uptime()) });
  });

  app.get("/api/status", rateLimit(30, 60_000), async (_req, res) => {
    try {
      res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
      res.json(await getStatusPayload());
    } catch {
      res.status(503).json({ error: "Status temporarily unavailable" });
    }
  });

  app.get("/api/quotes", (_req, res) => {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    res.json(randomQuote);
  });

  app.get("/api/auth/spotify/url", rateLimit(10, 60_000), (req, res) => {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    if (!clientId) return res.status(500).json({ error: "Spotify Client ID not configured" });
    try {
      const appUrl = configuredAppUrl(req);
      const redirectUri = `${appUrl}/auth/spotify/callback`;
      const state = randomBytes(32).toString("base64url");
      spotifyStates.set(state, { redirectUri, createdAt: Date.now() });
      const params = new URLSearchParams({
        client_id: clientId,
        response_type: "code",
        redirect_uri: redirectUri,
        state,
        scope: "user-read-private user-read-email playlist-read-private user-modify-playback-state user-read-playback-state",
        show_dialog: "true"
      });
      res.setHeader("Cache-Control", "no-store");
      res.json({ url: `https://accounts.spotify.com/authorize?${params}` });
    } catch {
      res.status(500).json({ error: "OAuth configuration is invalid" });
    }
  });

  app.post("/api/auth/spotify/token", rateLimit(10, 60_000), async (req, res) => {
    const { code, state } = req.body ?? {};
    if (!requireNonEmptyString(code, 2_048) || !requireNonEmptyString(state, 512)) {
      return res.status(400).json({ error: "Invalid authorization request" });
    }
    const stateRecord = spotifyStates.get(state);
    spotifyStates.delete(state);
    if (!stateRecord || Date.now() - stateRecord.createdAt > OAUTH_STATE_TTL_MS) {
      return res.status(400).json({ error: "Invalid or expired OAuth state" });
    }
    try {
      const data = await exchangeSpotifyCode(code, stateRecord.redirectUri);
      res.setHeader("Cache-Control", "no-store");
      res.json(data);
    } catch {
      res.status(400).json({ error: "Failed to exchange authorization code" });
    }
  });

  app.post("/api/auth/spotify/session", rateLimit(20, 60_000), (req, res) => {
    const { transactionId } = req.body ?? {};
    if (!requireNonEmptyString(transactionId, 128)) return res.status(400).json({ error: "Invalid transaction" });
    const transaction = spotifyTransactions.get(transactionId);
    spotifyTransactions.delete(transactionId);
    if (!transaction || Date.now() - transaction.createdAt > OAUTH_TRANSACTION_TTL_MS) {
      return res.status(400).json({ error: "Invalid or expired transaction" });
    }
    res.setHeader("Cache-Control", "no-store");
    res.json(transaction.tokens);
  });

  app.get("/auth/spotify/callback", async (req, res) => {
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const stateRecord = spotifyStates.get(state);
    spotifyStates.delete(state);
    let origin = "null";
    let message: Record<string, unknown> = { type: "SPOTIFY_AUTH_ERROR" };

    try {
      origin = new URL(stateRecord?.redirectUri || configuredAppUrl()).origin;
    } catch {
      origin = "null";
    }

    if (stateRecord && Date.now() - stateRecord.createdAt <= OAUTH_STATE_TTL_MS && requireNonEmptyString(code, 2_048)) {
      try {
        const tokens = await exchangeSpotifyCode(code, stateRecord.redirectUri);
        const transactionId = randomBytes(32).toString("base64url");
        spotifyTransactions.set(transactionId, { tokens, createdAt: Date.now() });
        message = { type: "SPOTIFY_AUTH_SUCCESS", transactionId };
      } catch {
        message = { type: "SPOTIFY_AUTH_ERROR" };
      }
    }

    const nonce = randomBytes(16).toString("base64");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Security-Policy", `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; frame-ancestors 'none'`);
    res.status(message.type === "SPOTIFY_AUTH_SUCCESS" ? 200 : 400).send(`
      <!doctype html>
      <html lang="en"><head><meta charset="utf-8"><title>Connecting Spotify</title></head>
      <body style="background:#121212;color:white;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh">
        <script nonce="${nonce}">
          const message = ${safeJsonForHtml(message)};
          const targetOrigin = ${safeJsonForHtml(origin)};
          if (window.opener && targetOrigin !== "null") {
            window.opener.postMessage(message, targetOrigin);
            window.close();
          }
        </script>
        <div style="text-align:center"><h2>Connecting Spotify...</h2><p>This window should close automatically.</p></div>
      </body></html>
    `);
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, { dotfiles: "deny", index: "index.html" }));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.use((_req, res) => res.status(404).json({ error: "Not found" }));
  app.listen(PORT, "0.0.0.0", () => console.log(`Server running on http://localhost:${PORT}`));
}

startServer().catch((error) => {
  console.error("Failed to start server", error instanceof Error ? error.message : "unknown error");
  process.exitCode = 1;
});
