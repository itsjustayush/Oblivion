import { useEffect, useRef, useState } from 'react'
import { Music2, Pause, Play, SkipBack, SkipForward } from 'lucide-react'
import { toast } from 'sonner'

type Track = { name: string; artists?: { name: string }[]; album?: { images?: { url: string }[] } }
type PlayerState = { paused: boolean; track_window?: { current_track?: Track } }
type Player = { addListener: (event: string, callback: (data: any) => void) => void; connect: () => Promise<boolean>; disconnect: () => void; togglePlay: () => Promise<void>; nextTrack: () => Promise<void>; previousTrack: () => Promise<void> }

declare global { interface Window { Spotify?: { Player: new (options: any) => Player }; onSpotifyWebPlaybackSDKReady?: () => void } }

let sdkPromise: Promise<void> | null = null
function loadSdk() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Playback is browser-only'))
  if (window.Spotify) return Promise.resolve()
  if (sdkPromise) return sdkPromise
  sdkPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://sdk.scdn.co/spotify-player.js'
    script.async = true
    script.onload = () => window.setTimeout(() => window.Spotify ? resolve() : reject(new Error('Spotify playback SDK did not load')), 0)
    script.onerror = () => reject(new Error('Spotify playback SDK failed to load'))
    window.onSpotifyWebPlaybackSDKReady = resolve
    document.head.appendChild(script)
  }).catch((error) => { sdkPromise = null; throw error })
  return sdkPromise
}

export function SpotifyFullPlayer({ token, playlistId, playlistName }: { token: string; playlistId: string; playlistName: string }) {
  const playerRef = useRef<Player | null>(null)
  const [ready, setReady] = useState(false)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [state, setState] = useState<PlayerState | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setReady(false); setDeviceId(null); setError(null)
    void loadSdk().then(() => {
      if (cancelled || !window.Spotify) return
      const player = new window.Spotify.Player({ name: 'Oblivion Focus Player', volume: 0.65, getOAuthToken: (cb: (value: string) => void) => cb(token) })
      playerRef.current = player
      player.addListener('ready', (data: { device_id: string }) => { if (!cancelled) { setDeviceId(data.device_id); setReady(true) } })
      player.addListener('not_ready', () => { if (!cancelled) setReady(false) })
      player.addListener('player_state_changed', (next: PlayerState | null) => { if (!cancelled) setState(next) })
      player.addListener('initialization_error', (data: { message?: string }) => { if (!cancelled) setError(data.message || 'Spotify could not initialize the player.') })
      player.addListener('authentication_error', (data: { message?: string }) => { if (!cancelled) setError(data.message || 'Spotify authentication expired. Reconnect Spotify.') })
      player.addListener('account_error', () => { if (!cancelled) setError('Spotify Web Playback requires an eligible Premium account.') })
      void player.connect().then((connected) => { if (!connected && !cancelled) setError('Spotify browser player could not connect.') })
    }).catch((reason: unknown) => { if (!cancelled) setError(reason instanceof Error ? reason.message : 'Spotify playback SDK failed to load.') })
    return () => { cancelled = true; playerRef.current?.disconnect(); playerRef.current = null }
  }, [token])

  useEffect(() => {
    if (!ready || !deviceId) return
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    void fetch('https://api.spotify.com/v1/me/player', { method: 'PUT', headers, body: JSON.stringify({ device_ids: [deviceId], play: false }) })
  }, [ready, deviceId, token])

  const playPlaylist = async () => {
    if (!deviceId) return
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    const transfer = await fetch('https://api.spotify.com/v1/me/player', { method: 'PUT', headers, body: JSON.stringify({ device_ids: [deviceId], play: true }) })
    if (!transfer.ok && transfer.status !== 204) throw new Error('Could not activate the Spotify player')
    const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(deviceId)}`, { method: 'PUT', headers, body: JSON.stringify({ context_uri: `spotify:playlist:${playlistId}` }) })
    if (!response.ok) throw new Error('Spotify could not start this playlist')
    toast.success('Playing the full playlist')
  }

  const run = (action: () => Promise<void>) => { void action().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Spotify playback failed')) }
  const current = state?.track_window?.current_track

  return <div className="w-full h-full min-h-[350px] flex flex-col items-center justify-center p-6 text-center bg-zinc-950">
    {current?.album?.images?.[0]?.url ? <img src={current.album.images[0].url} alt="" className="h-32 w-32 rounded-2xl object-cover mb-5 shadow-2xl" /> : <Music2 className="h-12 w-12 text-[#e8702a] mb-4" />}
    <div className="text-base font-bold text-white">{current?.name || playlistName}</div>
    <div className="text-xs text-white/45 mt-1">{current?.artists?.map((artist) => artist.name).join(', ') || (ready ? 'Full-track playback ready' : 'Preparing Spotify player')}</div>
    {error ? <div className="text-xs text-red-300 mt-4 max-w-xs">{error}</div> : <div className="text-[10px] text-white/35 mt-4">{ready ? 'Full tracks enabled' : 'Connecting to Spotify…'}</div>}
    <div className="flex items-center gap-3 mt-7">
      <button onClick={() => run(() => playerRef.current?.previousTrack() || Promise.resolve())} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center" aria-label="Previous track"><SkipBack className="h-4 w-4" /></button>
      <button onClick={() => run(() => playerRef.current?.togglePlay() || playPlaylist())} className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-lg" aria-label={state?.paused === false ? 'Pause' : 'Play'}>{state?.paused === false ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}</button>
      <button onClick={() => run(() => playerRef.current?.nextTrack() || Promise.resolve())} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center" aria-label="Next track"><SkipForward className="h-4 w-4" /></button>
    </div>
    <button onClick={() => run(playPlaylist)} disabled={!ready} className="mt-5 px-4 py-2 rounded-full bg-[#e8702a] disabled:opacity-40 text-white text-[10px] font-bold uppercase tracking-widest">Play {playlistName}</button>
  </div>
}
