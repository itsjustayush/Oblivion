type StatusService = {
  id: string;
  name: string;
  status: 'operational' | 'degraded' | 'down' | 'paused';
  description: string;
  uptimePercentage: string;
  historyBars: Array<{ status: string; date: string; latency: string }>;
  responseTimes: Array<{ time: string; value: number }>;
  lastChecked: string;
};

type Cache = { expiresAt: number; payload: Record<string, unknown> } | null;
let cache: Cache = null;

const MAX_MONITORS = 20;
const TTL_MS = 60_000;
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 30;
const requestWindows = new Map<string, { count: number; resetAt: number }>();

function boundedString(value: unknown, fallback: string, max = 160) {
  return typeof value === 'string' && value.length > 0 ? value.slice(0, max) : fallback;
}

async function providerFetch(url: string, token: string) {
  return fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(6_000)
  });
}

async function buildPayload() {
  const token = process.env.BETTERSTACK_API_TOKEN?.trim();
  if (!token) throw new Error('BETTERSTACK_API_TOKEN is not configured');

  const monitorsResponse = await providerFetch('https://uptime.betterstack.com/api/v2/monitors', token);
  if (!monitorsResponse.ok) throw new Error('Better Stack monitors request failed');
  const monitorPayload = await monitorsResponse.json();
  const monitors = Array.isArray(monitorPayload.data) ? monitorPayload.data.slice(0, MAX_MONITORS) : [];

  const services: StatusService[] = await Promise.all(monitors.map(async (monitor: any) => {
    const id = boundedString(monitor?.id, 'unknown', 128);
    const attributes = monitor?.attributes || {};
    const rawStatus = boundedString(attributes.status, 'degraded', 20);
    const status = rawStatus === 'down' ? 'down' : attributes.paused ? 'paused' : rawStatus === 'maintenance' ? 'degraded' : 'operational';
    let uptime = 100;
    let incidents: any[] = [];

    try {
      const response = await providerFetch(`https://uptime.betterstack.com/api/v2/monitors/${encodeURIComponent(id)}/sla`, token);
      if (response.ok) {
        const data = await response.json();
        const candidate = Number(data?.data?.attributes?.availability);
        if (Number.isFinite(candidate)) uptime = Math.max(0, Math.min(100, candidate));
      }
    } catch {}

    try {
      const response = await providerFetch(`https://uptime.betterstack.com/api/v2/incidents?monitor_id=${encodeURIComponent(id)}`, token);
      if (response.ok) {
        const data = await response.json();
        incidents = Array.isArray(data?.data) ? data.data.slice(0, 100) : [];
      }
    } catch {}

    const historyBars = Array.from({ length: 60 }, (_, index) => {
      const date = new Date(Date.now() - (59 - index) * 86_400_000).toISOString().slice(0, 10);
      const incident = incidents.find((item: any) => boundedString(item?.attributes?.started_at, '').slice(0, 10) === date);
      return incident
        ? { status: 'down', date, latency: `Outage (${boundedString(incident?.attributes?.cause, 'Incident', 120)})` }
        : { status: status === 'down' ? 'down' : 'up', date, latency: status === 'down' ? 'Unavailable' : 'Operational' };
    });

    return {
      id,
      name: boundedString(attributes.pronounceable_name || attributes.url, `Monitor ${id}`),
      status,
      description: 'HTTP uptime check monitored via Better Stack',
      uptimePercentage: `${uptime.toFixed(3)}%`,
      historyBars,
      responseTimes: [],
      lastChecked: attributes.last_checked_at ? new Date(attributes.last_checked_at).toLocaleTimeString() : 'Just now'
    };
  }));

  const payload = {
    name: 'Oblivion',
    url: 'https://oblivionstudy.com',
    status: services.some((service) => service.status === 'down') ? 'degraded' : 'operational',
    updatedAt: new Date().toISOString(),
    services,
    monitors: {
      betterStack: { name: 'Better Stack Uptime', status: 'connected', role: 'Primary Monitoring System', monitorCount: services.length }
    },
    incidents: []
  };
  cache = { expiresAt: Date.now() + TTL_MS, payload };
  return payload;
}

export default async function handler(req: any, res: any) {
  if (!['GET', 'HEAD'].includes(String(req.method || 'GET').toUpperCase())) {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const forwarded = typeof req.headers?.['x-forwarded-for'] === 'string' ? req.headers['x-forwarded-for'].split(',')[0].trim() : '';
  const requester = forwarded || String(req.headers?.['x-real-ip'] || 'unknown').slice(0, 128);
  const now = Date.now();
  const windowState = requestWindows.get(requester);
  if (!windowState || windowState.resetAt <= now) requestWindows.set(requester, { count: 1, resetAt: now + RATE_WINDOW_MS });
  else if (windowState.count >= RATE_LIMIT) return res.status(429).json({ error: 'Too many requests' });
  else windowState.count += 1;
  if (requestWindows.size > 2000) {
    for (const [key, value] of requestWindows) if (value.resetAt <= now) requestWindows.delete(key);
  }
  res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Origin-Agent-Cluster', '?1');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), payment=(), usb=()');
  if (cache && cache.expiresAt > Date.now()) return res.status(200).json(cache.payload);
  try {
    return res.status(200).json(await buildPayload());
  } catch {
    return res.status(503).json({ error: 'Status temporarily unavailable' });
  }
}
