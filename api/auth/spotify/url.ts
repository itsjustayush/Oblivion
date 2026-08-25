import { randomBytes } from 'node:crypto';

const STATE_COOKIE = '__Host-oblivion_spotify_oauth';
const STATE_TTL_SECONDS = 600;
const SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
  'playlist-read-private'
].join(' ');

function requestOrigin(req: any) {
  const configured = process.env.APP_URL?.trim();
  if (configured) {
    const parsed = new URL(configured);
    if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') throw new Error('APP_URL must use HTTPS');
    return parsed.origin;
  }
  const host = String(req.headers?.host || '');
  if (!host) throw new Error('Host header is missing');
  const forwardedProto = String(req.headers?.['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const protocol = forwardedProto === 'http' && (host.startsWith('localhost:') || host.startsWith('127.0.0.1:')) ? 'http' : 'https';
  return new URL(`${protocol}://${host}`).origin;
}

export default function handler(req: any, res: any) {
  if (String(req.method || 'GET').toUpperCase() !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
  if (!clientId) return res.status(503).json({ error: 'Spotify is not configured' });

  try {
    const state = randomBytes(32).toString('base64url');
    const redirectUri = `${requestOrigin(req)}/api/auth/spotify/callback`;
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      state,
      scope: SCOPES,
      show_dialog: 'true'
    });
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Set-Cookie', `${STATE_COOKIE}=${encodeURIComponent(state)}; Max-Age=${STATE_TTL_SECONDS}; Path=/; Secure; HttpOnly; SameSite=Lax`);
    return res.status(200).json({ url: `https://accounts.spotify.com/authorize?${params.toString()}` });
  } catch {
    return res.status(500).json({ error: 'OAuth configuration is invalid' });
  }
}
