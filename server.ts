import express, { type Request, type Response, type NextFunction } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

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

type RateBucket = { startedAt: number; count: number };
const rateBuckets = new Map<string, RateBucket>();
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
  for (const [key, value] of rateBuckets) {
    if (now - value.startedAt > 10 * 60_000) rateBuckets.delete(key);
  }
}

function requireNonEmptyString(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= maxLength;
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
            return { status: "up", date: dateStr, latency: "Operational" };
          });

          const responseTimes: Array<{ time: string; value: number }> = [];

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
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
    res.setHeader("Origin-Agent-Cluster", "?1");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), payment=(), usb=()");
    res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' https://apis.google.com https://accounts.google.com https://www.gstatic.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://images.unsplash.com https://images.higgs.ai https://*.cloudfront.net https://lh3.googleusercontent.com; font-src 'self' data:; connect-src 'self' https://nominatim.openstreetmap.org https://api.open-meteo.com https://tasks.googleapis.com https://www.googleapis.com https://apis.google.com https://accounts.google.com https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebaseapp.com; frame-src https://open.spotify.com https://*.firebaseapp.com https://accounts.google.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests");
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
    res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
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
