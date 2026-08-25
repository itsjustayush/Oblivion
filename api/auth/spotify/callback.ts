import { randomBytes } from 'node:crypto';

const STATE_COOKIE = '__Host-oblivion_spotify_oauth';

function readCookie(header: unknown, name: string) {
  const source = typeof header === 'string' ? header : '';
  const pair = source.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return pair ? decodeURIComponent(pair.slice(name.length + 1)) : '';
}

function escapeJson(value: unknown) {
  return JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029');
}

function requestOrigin(req: any) {
  const configured = process.env.APP_URL?.trim();
  if (configured) return new URL(configured).origin;
  const host = String(req.headers?.host || '');
  const forwardedProto = String(req.headers?.['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const protocol = forwardedProto === 'http' && (host.startsWith('localhost:') || host.startsWith('127.0.0.1:')) ? 'http' : 'https';
  return new URL(`${protocol}://${host}`).origin;
}

export default async function handler(req: any, res: any) {
  if (String(req.method || 'GET').toUpperCase() !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).send('Method not allowed');
  }
  const state = typeof req.query?.state === 'string' ? req.query.state : '';
  const code = typeof req.query?.code === 'string' ? req.query.code : '';
  const expectedState = readCookie(req.headers?.cookie, STATE_COOKIE);
  const origin = requestOrigin(req);
  let message: Record<string, unknown> = { type: 'SPOTIFY_AUTH_ERROR' };

  if (state && code && expectedState && state === expectedState) {
    const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim();
    if (clientId && clientSecret) {
      try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code.slice(0, 2048),
            redirect_uri: `${origin}/api/auth/spotify/callback`
          }),
          signal: AbortSignal.timeout(10000)
        });
        const tokens = await response.json().catch(() => ({}));
        if (response.ok && typeof tokens.access_token === 'string') message = { type: 'SPOTIFY_AUTH_SUCCESS', tokens };
      } catch {
        // Keep the generic error message and do not expose provider details.
      }
    }
  }

  const nonce = randomBytes(16).toString('base64');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Set-Cookie', `${STATE_COOKIE}=; Max-Age=0; Path=/; Secure; HttpOnly; SameSite=Lax`);
  res.setHeader('Content-Security-Policy', `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; frame-ancestors 'none'`);
  const status = message.type === 'SPOTIFY_AUTH_SUCCESS' ? 200 : 400;
  return res.status(status).send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Spotify connection</title></head><body><script nonce="${nonce}">const message=${escapeJson(message)};const targetOrigin=${escapeJson(origin)};if(window.opener&&targetOrigin!=="null"){window.opener.postMessage(message,targetOrigin);window.close();}</script><p>Spotify connection completed. You may close this window.</p></body></html>`);
}
