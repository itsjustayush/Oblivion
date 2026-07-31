/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client'

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Home, StickyNote, ListChecks, Timer, CalendarDays, Music2, Settings as SettingsIcon,
  Maximize2, Minimize2, Plus, Trash2, X, Search, Play, Pause, RotateCcw, SkipForward,
  Check, Sparkles, Quote as QuoteIcon, ChevronRight,
  Navigation, CloudSun, Thermometer, Wind, Droplets, Info,
  BarChart2, Flame, Zap, Brain, LayoutList, Coffee,
  Pin, PinOff, Palette, ListTodo, History, ArrowUpRight,
  ShieldAlert, Puzzle, BellOff
} from 'lucide-react'
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Slider } from '@/src/components/ui/slider'
import { Switch } from '@/src/components/ui/switch'
import { Textarea } from '@/src/components/ui/textarea'
import { toast, Toaster } from 'sonner'
import { Cookie } from 'lucide-react'

const ChangelogView = React.lazy(() => import('@/src/components/ChangelogView').then(m => ({ default: m.ChangelogView })))
const ChromeExtensionModal = React.lazy(() => import('@/src/components/ChromeExtensionModal').then(m => ({ default: m.ChromeExtensionModal })))
const CookieBanner = React.lazy(() => import('@/src/components/CookieBanner').then(m => ({ default: m.CookieBanner })))
const CanvasNotesWorkspacePanel = React.lazy(() => import('@/src/components/CanvasNotesWorkspace').then(m => ({ default: m.CanvasNotesWorkspacePanel })))

/* ----------------------------- Background Library ---------------------------- */
const BACKGROUNDS = [
  { id: 'starry-night',  name: 'Starry Atmosphere', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=2400&q=85' },
  { id: 'foggy-forest',  name: 'Calm Forest',      url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=2400&q=85' },
  { id: 'rain-window',   name: 'Rainy Window',     url: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?auto=format&fit=crop&w=2400&q=85' },
  { id: 'deep-space',    name: 'Cosmic Nebula',    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2400&q=85' },
  { id: 'cozy-lights',   name: 'Cozy Bokeh',       url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=2400&q=85' },
  { id: 'dark-mountains',name: 'Dark Highlands',   url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2400&q=85' },
]

const PLAYLISTS = [
  { id: '0owPbYZr8bqzFfpzLmP8UV', name: 'Rainy Day Lofi' },
  { id: '37i9dQZF1DWWQRwui0ExPn', name: 'Lofi Beats' },
  { id: '37i9dQZF1DXcCnTAt8CfNe', name: 'Rainy Day' },
  { id: '37i9dQZF1DXbITWG1ZJKYt', name: 'Jazz Café' },
  { id: '37i9dQZF1DWZeKCadgRdKQ', name: 'Deep Focus' },
  { id: '37i9dQZF1DX3Ogo9pFvBkY', name: 'Ambient Study' },
]

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, onSnapshot, query, where, Timestamp, addDoc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const firestoreDbId = (firebaseConfig as any).firestoreDatabaseId || 'ai-studio-0d0d80dd-7827-43ff-af09-0e4f6ee44d44';
const db = getFirestore(app, firestoreDbId);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/calendar');
googleProvider.addScope('https://www.googleapis.com/auth/tasks');

/* ----------------------------- Spotlight Reveal ----------------------------- */
const BG_IMAGE_1 = "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260609_195923_b0ba8ace-1d1d-4f2c-9a28-1ab84b330680.png&w=1280&q=85";
const BG_IMAGE_2 = "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260609_201152_bba90a12-bf12-459f-91f0-51f237dbaf3b.png&w=1280&q=85";

function RevealLayer({ image }: { image: string }) {
  const layerRef = React.useRef<HTMLDivElement | null>(null)
  const mouseRef = React.useRef({ x: -999, y: -999 })
  const smoothRef = React.useRef({ x: -999, y: -999 })
  const rafRef = React.useRef<number | null>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', handleMouseMove)

    const loop = () => {
      if (mouseRef.current.x >= 0 && layerRef.current) {
        if (smoothRef.current.x < 0) {
          smoothRef.current = { ...mouseRef.current }
        } else {
          smoothRef.current.x += (mouseRef.current.x - smoothRef.current.x) * 0.1
          smoothRef.current.y += (mouseRef.current.y - smoothRef.current.y) * 0.1
        }
        const x = smoothRef.current.x
        const y = smoothRef.current.y
        const maskCss = `radial-gradient(circle 260px at ${x}px ${y}px, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 1) 40%, rgba(255, 255, 255, 0.75) 60%, rgba(255, 255, 255, 0.4) 75%, rgba(255, 255, 255, 0.12) 88%, rgba(255, 255, 255, 0) 100%)`
        layerRef.current.style.maskImage = maskCss
        layerRef.current.style.webkitMaskImage = maskCss
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div
      ref={layerRef}
      className="absolute inset-0 bg-center bg-cover bg-no-repeat z-30 pointer-events-none"
      style={{
        backgroundImage: `url(${image})`,
      }}
    />
  )
}

/* ----------------------------- Firestore Error Handler ----------------------------- */
function handleFirestoreError(error: unknown, op: string, path: string) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType: op,
    path: path,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    }
  }
  console.error('Firestore Error:', JSON.stringify(errInfo))
}

/* ----------------------------- Persistence Hook ----------------------------- */
const useLocal = <T,>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [val, setVal] = useState<T>(initial)
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null
      if (raw !== null) setVal(JSON.parse(raw))
    } catch {}
  }, [key])
  useEffect(() => {
    try { if (typeof window !== 'undefined') window.localStorage.setItem(key, JSON.stringify(val)) } catch {}
  }, [key, val])
  return [val, setVal]
}

const useSynced = <T,>(key: string, initial: T, user: User | null): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [val, setVal] = useState<T>(initial)
  const lastSyncedRef = React.useRef<string>('')
  const isRemoteRef = React.useRef<boolean>(false)

  // Load from local storage initially
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key)
      if (raw !== null) {
        setVal(JSON.parse(raw))
        lastSyncedRef.current = raw
      }
    } catch {}
  }, [key])

  // If user is logged in, listen to Firestore
  useEffect(() => {
    if (!user) return
    if (key === 'oblivion.settings') {
      return onSnapshot(doc(db, 'users', user.uid), (snap) => {
        if (snap.exists()) {
          const remoteData = snap.data() as T
          const str = JSON.stringify(remoteData)
          if (str !== lastSyncedRef.current) {
            isRemoteRef.current = true
            lastSyncedRef.current = str
            setVal(remoteData)
          }
        }
      }, (err) => handleFirestoreError(err, 'get', `users/${user.uid}`))
    }
  }, [user, key])

  // Save to local storage and Firestore
  useEffect(() => {
    try {
      const str = JSON.stringify(val)
      window.localStorage.setItem(key, str)
      if (user && key === 'oblivion.settings') {
        if (isRemoteRef.current) {
          isRemoteRef.current = false
        } else if (str !== lastSyncedRef.current) {
          lastSyncedRef.current = str
          setDoc(doc(db, 'users', user.uid), val as any, { merge: true })
        }
      }
    } catch {}
  }, [key, val, user])

  return [val, setVal]
}

const greetingFor = (hour: number, name?: string) => {
  const N = name || 'friend'
  if (hour < 5)  return [`Late night grind, ${N}?`, 'The night is yours.', 'One quiet hour at a time.']
  if (hour < 12) return [`Good morning, ${N}.`, `Let's make today count.`, 'Soft start. Steady focus.']
  if (hour < 17) return [`Making strides this afternoon, ${N}?`, 'Stay in the flow.', 'One task at a time.']
  if (hour < 21) return [`Good evening, ${N}.`, `Let's focus for a while.`, 'Wind down with intention.']
  return [`Late hours suit you, ${N}.`, 'Slow is smooth, smooth is fast.', 'A quiet mind goes far.']
}

/* ----------------------------- Rain ----------------------------- */
const Rain = React.memo(function Rain({ intensity = 60 }: { intensity: number }) {
  const drops = useMemo(() => {
    const count = Math.max(0, Math.min(220, Math.round(intensity * 2.2)))
    return Array.from({ length: count }).map((_, i) => ({
      i,
      left: Math.random() * 100,
      duration: 0.6 + Math.random() * 1.2,
      delay: -Math.random() * 2,
      height: 60 + Math.random() * 100,
      opacity: 0.4 + Math.random() * 0.5,
    }))
  }, [intensity])
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {drops.map(d => (
        <span key={d.i} className="rain-drop"
          style={{ left: `${d.left}%`, height: `${d.height}px`, animationDuration: `${d.duration}s`, animationDelay: `${d.delay}s`, opacity: d.opacity }} />
      ))}
    </div>
  )
})

/* ----------------------------- Weather Widget ----------------------------- */
interface WeatherData {
  temp: number;
  condition: string;
  location: string;
  code: number;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
  lastUpdated: string;
  forecast: {
    date: string;
    maxTemp: number;
    minTemp: number;
    code: number;
  }[];
}

function WeatherWidget() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const getWeatherDescription = (code: number) => {
    if (code === 0) return 'Clear';
    if (code <= 3) return 'Partly Cloudy';
    if (code <= 48) return 'Foggy';
    if (code <= 55) return 'Drizzle';
    if (code <= 65) return 'Rainy';
    if (code <= 77) return 'Snowy';
    if (code <= 82) return 'Showers';
    if (code <= 99) return 'Thunderstorm';
    return 'Cloudy';
  };

  const getWeatherIcon = (code: number) => {
    if (code === 0) return '☀️';
    if (code <= 2) return '☀️';
    if (code === 3) return '⛅';
    if (code <= 48) return '🌫️';
    if (code <= 55) return '💧';
    if (code <= 65) return '🌧️';
    if (code <= 77) return '❄️';
    if (code <= 82) return '🌦️';
    if (code <= 99) return '⛈️';
    return '☁️';
  };

  const fetchWeather = useCallback(async (lat: number, lon: number) => {
    let locationName = 'Local Area';

    // 1. Fetch Geolocation reverse lookup safely without throwing
    try {
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=11&addressdetails=1`).catch(() => null);
      if (geoRes && geoRes.ok) {
        const geoJson = await geoRes.json().catch(() => null);
        if (geoJson?.address) {
          const address = geoJson.address;
          locationName = address.city || address.town || address.village || address.suburb || address.county || 'Local Area';
        }
      }
    } catch {
      // Nominatim failed or CORS blocked; fallback to Local Area
    }

    // 2. Fetch Weather data with complete fallback support
    try {
      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&_=${Date.now()}`);
      if (!weatherRes.ok) throw new Error('Weather API unavailable');
      const weatherJson = await weatherRes.json();

      const current = weatherJson.current || {};
      const daily = weatherJson.daily || {};

      const forecast = (daily.time || []).slice(0, 5).map((date: string, i: number) => ({
        date,
        maxTemp: Math.round(daily.temperature_2m_max?.[i] ?? 24),
        minTemp: Math.round(daily.temperature_2m_min?.[i] ?? 16),
        code: daily.weather_code?.[i] ?? 0
      }));

      setData({
        temp: Math.round(current.temperature_2m ?? 22),
        condition: getWeatherDescription(current.weather_code ?? 0),
        location: locationName,
        code: current.weather_code ?? 0,
        humidity: current.relative_humidity_2m ?? 60,
        windSpeed: current.wind_speed_10m ?? 12,
        feelsLike: Math.round(current.apparent_temperature ?? 22),
        lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        forecast: forecast.length > 0 ? forecast : [
          { date: new Date().toISOString().split('T')[0], maxTemp: 24, minTemp: 16, code: 0 }
        ]
      });
    } catch {
      // Graceful default weather fallback if Open-Meteo is unreachable
      const todayStr = new Date().toISOString().split('T')[0];
      setData({
        temp: 22,
        condition: 'Clear',
        location: locationName,
        code: 0,
        humidity: 55,
        windSpeed: 10,
        feelsLike: 22,
        lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        forecast: [
          { date: todayStr, maxTemp: 25, minTemp: 17, code: 0 },
          { date: todayStr, maxTemp: 24, minTemp: 16, code: 1 },
          { date: todayStr, maxTemp: 26, minTemp: 18, code: 0 },
          { date: todayStr, maxTemp: 23, minTemp: 15, code: 2 },
          { date: todayStr, maxTemp: 25, minTemp: 17, code: 0 },
        ]
      });
    }
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout
    const initWeather = () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
          () => fetchWeather(22.5726, 88.3639), // Default location
          { enableHighAccuracy: false, timeout: 8000 }
        );
      } else {
        fetchWeather(22.5726, 88.3639);
      }
    };

    // Defer initial weather fetch by 1.2s to prioritize layout rendering
    timer = setTimeout(() => {
      initWeather();
    }, 1200);

    const interval = setInterval(initWeather, 1800000); // 30 minutes
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [fetchWeather]);

  if (!data) return (
    <div className="absolute top-20 sm:top-24 left-6 sm:left-8 z-50 glass px-4 py-2 rounded-2xl animate-pulse cursor-wait">
      <div className="w-24 h-8 bg-white/5 rounded-md" />
    </div>
  );

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, x: -10 }} 
        animate={{ opacity: 1, x: 0 }}
        onClick={() => setShowDetail(true)}
        className="absolute top-20 sm:top-24 left-6 sm:left-8 flex items-center gap-3.5 z-50 glass px-4 py-2.5 rounded-2xl group hover:bg-white/10 transition-all duration-500 border border-white/5 hover:border-white/10 cursor-pointer active:scale-95"
      >
        <div className="text-2xl drop-shadow-lg group-hover:scale-110 transition-transform duration-500">
          {getWeatherIcon(data.code)}
        </div>
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-bold text-white tracking-tight">{data.temp}°C</span>
            <span className="text-[10px] text-white/50 font-medium uppercase tracking-widest">{data.condition}</span>
          </div>
          <div className="text-[9px] text-white/30 uppercase tracking-[0.15em] font-bold mt-0.5 max-w-[120px] truncate flex items-center gap-1">
            <Navigation className="h-2 w-2" /> {data.location}
          </div>
        </div>
      </motion.div>

      <Panel 
        open={showDetail} 
        onClose={() => setShowDetail(false)} 
        title="Weather Forecast" 
        icon={<CloudSun className="h-4 w-4" />}
        width="max-w-md"
      >
        <div className="space-y-6 pt-2">
          {/* Current Detail */}
          <div className="p-6 rounded-3xl bg-white/5 border border-white/5 flex flex-col items-center text-center">
            <div className="text-6xl mb-4 drop-shadow-2xl">{getWeatherIcon(data.code)}</div>
            <div className="text-5xl font-bold tracking-tighter mb-1">{data.temp}°C</div>
            <div className="text-white/60 font-medium text-sm mb-4">{data.condition} in {data.location}</div>
            
            <div className="grid grid-cols-3 gap-8 w-full pt-4 border-t border-white/5">
              <div className="flex flex-col items-center gap-1">
                <Thermometer className="h-4 w-4 text-white/40" />
                <div className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Feels</div>
                <div className="text-xs font-bold">{data.feelsLike}°</div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Droplets className="h-4 w-4 text-white/40" />
                <div className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Humidity</div>
                <div className="text-xs font-bold">{data.humidity}%</div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Wind className="h-4 w-4 text-white/40" />
                <div className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Wind</div>
                <div className="text-xs font-bold">{data.windSpeed} <span className="text-[8px] opacity-50">km/h</span></div>
              </div>
            </div>
          </div>

          {/* 5-Day Forecast */}
          <div className="space-y-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold px-1">5-Day Forecast</div>
            <div className="space-y-2">
              {data.forecast.map((day, i) => (
                <div key={day.date} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="w-10 text-[10px] font-bold text-white/60 uppercase tracking-wider">
                      {i === 0 ? 'Today' : new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}
                    </span>
                    <span className="text-xl">{getWeatherIcon(day.code)}</span>
                    <span className="text-[10px] text-white/40 font-medium truncate max-w-[80px]">
                      {getWeatherDescription(day.code)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-white">{day.maxTemp}°</span>
                    <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/50 to-orange-500/50" />
                    </div>
                    <span className="text-xs font-bold text-white/40">{day.minTemp}°</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-1 p-3 text-[9px] text-white/20 uppercase tracking-[0.2em] font-medium border-t border-white/5">
            <div className="flex items-center gap-2">
              <Info className="h-3 w-3" /> Data by Open-Meteo · Geolocation enabled
            </div>
            <div className="opacity-60">Last updated: {data.lastUpdated}</div>
          </div>
        </div>
      </Panel>
    </>
  );
}

/* ----------------------------- Clock ----------------------------- */
function Clock({ size = 1 }: { size: number }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const fmtTime = useMemo(() => new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }), [])
  const fmtDate = useMemo(() => new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }), [])
  const timeStr = fmtTime.format(now)
  const [hm, ampm] = timeStr.split(' ')
  const dateStr = fmtDate.format(now)
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center select-none"
    >
      <div className="font-bold leading-none tracking-tighter text-white text-glow flex items-end drop-shadow-[0_10px_35px_rgba(232,112,42,0.3)]"
        style={{ fontSize: `clamp(90px, ${15 * size}vw, ${220 * size}px)` }}>
        <span>{hm}</span>
        <span className="ml-2.5 opacity-40 font-medium text-white/50" style={{ fontSize: '0.25em', marginBottom: '0.15em' }}>{ampm.toLowerCase()}</span>
      </div>
      <div className="mt-2 text-white/50 text-glow-soft text-sm uppercase tracking-[0.4em] font-medium">{dateStr}</div>
    </motion.div>
  )
}

function Greeting({ name }: { name: string }) {
  const [hour, setHour] = useState(new Date().getHours())
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setHour(new Date().getHours()), 60000)
    return () => clearInterval(id)
  }, [])
  const opts = useMemo(() => greetingFor(hour, name), [hour, name])
  useEffect(() => { setIdx(Math.floor(Math.random() * opts.length)) }, [opts])
  return (
    <motion.p key={opts[idx]} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}
      className="text-white/85 text-glow-soft text-lg md:text-2xl font-light tracking-wide mb-2">
      {opts[idx]}
    </motion.p>
  )
}

/* ----------------------------- Custom Cursor ----------------------------- */
function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const dotInnerRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const ringInnerRef = useRef<HTMLDivElement>(null)

  const mouseRef = useRef({ x: -100, y: -100 })
  const trailRef = useRef({ x: -100, y: -100 })
  const isHoveredRef = useRef(false)
  const isClickedRef = useRef(false)
  const isVisibleRef = useRef(false)

  useEffect(() => {
    document.documentElement.classList.add('custom-cursor-active')

    const updateStyles = () => {
      const dotInner = dotInnerRef.current
      const ringInner = ringInnerRef.current
      if (!dotInner || !ringInner) return

      const isHovered = isHoveredRef.current
      const isClicked = isClickedRef.current

      if (isHovered) {
        dotInner.className = "rounded-full -translate-x-1/2 -translate-y-1/2 transition-all duration-150 ease-out w-3 h-3 bg-[#e8702a] shadow-md shadow-[#e8702a]/60"
        ringInner.className = "rounded-full -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ease-out w-11 h-11 border border-[#e8702a] bg-[#e8702a]/15 scale-110 shadow-lg shadow-[#e8702a]/20"
      } else if (isClicked) {
        dotInner.className = "rounded-full -translate-x-1/2 -translate-y-1/2 transition-all duration-150 ease-out w-2 h-2 bg-white"
        ringInner.className = "rounded-full -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ease-out w-7 h-7 border border-white/80 bg-white/20 scale-90"
      } else {
        dotInner.className = "rounded-full -translate-x-1/2 -translate-y-1/2 transition-all duration-150 ease-out w-2 h-2 bg-white"
        ringInner.className = "rounded-full -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ease-out w-8 h-8 border border-white/40 bg-white/5"
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }

      if (!isVisibleRef.current) {
        isVisibleRef.current = true
        if (dotRef.current) dotRef.current.style.opacity = '1'
        if (ringRef.current) ringRef.current.style.opacity = '1'
      }

      const target = e.target as HTMLElement | null
      const isHover = Boolean(
        target && (
          target.tagName === 'BUTTON' ||
          target.tagName === 'A' ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.closest('button') ||
          target.closest('a') ||
          target.closest('input') ||
          target.closest('textarea') ||
          target.closest('select') ||
          target.closest('[role="button"]') ||
          target.closest('.cursor-pointer') ||
          target.getAttribute('role') === 'button' ||
          target.classList.contains('cursor-pointer')
        )
      )

      if (isHover !== isHoveredRef.current) {
        isHoveredRef.current = isHover
        updateStyles()
      }
    }

    const handleMouseDown = () => {
      isClickedRef.current = true
      updateStyles()
    }

    const handleMouseUp = () => {
      isClickedRef.current = false
      updateStyles()
    }

    const handleMouseLeave = () => {
      isVisibleRef.current = false
      if (dotRef.current) dotRef.current.style.opacity = '0'
      if (ringRef.current) ringRef.current.style.opacity = '0'
    }

    const handleMouseEnter = () => {
      isVisibleRef.current = true
      if (dotRef.current) dotRef.current.style.opacity = '1'
      if (ringRef.current) ringRef.current.style.opacity = '1'
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('mousedown', handleMouseDown, { passive: true })
    window.addEventListener('mouseup', handleMouseUp, { passive: true })
    document.addEventListener('mouseleave', handleMouseLeave)
    document.addEventListener('mouseenter', handleMouseEnter)

    let animId: number
    const loop = () => {
      if (isVisibleRef.current) {
        const mx = mouseRef.current.x
        const my = mouseRef.current.y

        // Dot follows cursor immediately
        if (dotRef.current) {
          dotRef.current.style.transform = `translate3d(${mx}px, ${my}px, 0)`
        }

        // Smooth trailing ring lerp
        trailRef.current.x += (mx - trailRef.current.x) * 0.3
        trailRef.current.y += (my - trailRef.current.y) * 0.3

        if (ringRef.current) {
          ringRef.current.style.transform = `translate3d(${trailRef.current.x}px, ${trailRef.current.y}px, 0)`
        }
      }
      animId = requestAnimationFrame(loop)
    }

    animId = requestAnimationFrame(loop)

    return () => {
      document.documentElement.classList.remove('custom-cursor-active')
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mouseleave', handleMouseLeave)
      document.removeEventListener('mouseenter', handleMouseEnter)
      cancelAnimationFrame(animId)
    }
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-[99999] overflow-hidden">
      {/* Outer Ring Positioning Container */}
      <div
        ref={ringRef}
        style={{ opacity: 0 }}
        className="fixed top-0 left-0 pointer-events-none z-[99998] will-change-transform"
      >
        <div
          ref={ringInnerRef}
          className="rounded-full -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ease-out w-8 h-8 border border-white/40 bg-white/5"
        />
      </div>

      {/* Outer Dot Positioning Container */}
      <div
        ref={dotRef}
        style={{ opacity: 0 }}
        className="fixed top-0 left-0 pointer-events-none z-[99999] will-change-transform"
      >
        <div
          ref={dotInnerRef}
          className="rounded-full -translate-x-1/2 -translate-y-1/2 transition-all duration-150 ease-out w-2 h-2 bg-white"
        />
      </div>
    </div>
  )
}

/* ----------------------------- Panel ----------------------------- */
export function Panel({ open, onClose, title, icon, children, width = 'max-w-3xl' }: { open: boolean, onClose: () => void, title: string, icon: React.ReactNode, children: React.ReactNode, width?: string }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={onClose}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={`relative glass-strong rounded-2xl w-full ${width} h-[82vh] max-h-[720px] overflow-hidden flex flex-col shadow-2xl border border-white/20 z-10`}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-black/50">
              <div className="flex items-center gap-2.5 text-white">
                <span className="text-[#e8702a]">{icon}</span>
                <span className="text-sm font-semibold tracking-wide">{title}</span>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto thin-scroll">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ----------------------------- Stats ----------------------------- */
function StatCard({ label, value, icon, color }: { label: string, value: string, icon: React.ReactNode, color: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 border border-white/5 bg-gradient-to-br ${color} group transition-all hover:scale-[1.02] active:scale-[0.98]`}>
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <div className="text-white/80 p-2 rounded-lg bg-black/10">{icon}</div>
        </div>
        <div className="mt-auto">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold mb-1">{label}</div>
          <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
        </div>
      </div>
      <div className="absolute top-0 right-0 -mr-6 -mt-6 opacity-10 group-hover:opacity-20 transition-opacity">
        {React.cloneElement(icon as React.ReactElement, { size: 100 })}
      </div>
    </div>
  )
}

function StatsPanel({ open, onClose, user, pomoCycles, setPomoCycles, pomoRunning, pomoRemaining, pomoTotal, pomoMode }: { 
  open: boolean, 
  onClose: () => void, 
  user: User | null, 
  pomoCycles: number, 
  setPomoCycles: (c: number) => void,
  pomoRunning: boolean,
  pomoRemaining: number,
  pomoTotal: number,
  pomoMode: string
}) {
  const [tasksDone, setTasksDone] = useState(0)
  const [sessions, setSessions] = useState<{ duration: number, timestamp: number, day: string }[]>([])
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('7d')
  const [activeMetric, setActiveMetric] = useState<'focus' | 'tasks' | 'score'>('focus')

  useEffect(() => {
    if (!user) {
      setTasksDone(0)
      setSessions([])
      return
    }
    const qTasks = query(collection(db, 'users', user.uid, 'tasks'), where('done', '==', true))
    const unsubTasks = onSnapshot(qTasks, (snap) => setTasksDone(snap.size), (err) => handleFirestoreError(err, 'get', `users/${user.uid}/tasks`))
    
    const qSessions = query(collection(db, 'users', user.uid, 'sessions'))
    const unsubSessions = onSnapshot(qSessions, (snap) => {
      setSessions(snap.docs.map(d => d.data() as any))
    }, (err) => handleFirestoreError(err, 'get', `users/${user.uid}/sessions`))

    return () => {
      unsubTasks()
      unsubSessions()
      setTasksDone(0)
      setSessions([])
    }
  }, [user])

  const chartData = useMemo(() => {
    const daysCount = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365
    const result = []
    const now = new Date()

    // 1. Strict Guest Mode / Unauthenticated check: Always return zeroed dataset when logged out
    if (!user) {
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        const dayName = d.toLocaleDateString([], { weekday: 'short' })
        const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' })
        result.push({
          date: daysCount <= 7 ? dayName : dateStr,
          focus: 0,
          target: 0,
          tasks: 0,
          sessions: 0,
          score: 0
        })
      }
      return result
    }

    // 2. Authenticated User: Calculate ONLY from real per-user sessions & tasks (No mock fallback)
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dayName = d.toLocaleDateString([], { weekday: 'short' })
      const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' })
      
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
      const endOfDay = startOfDay + 86400000

      const daySessions = sessions.filter(s => s.timestamp >= startOfDay && s.timestamp < endOfDay)
      const focusMins = daySessions.reduce((acc, s) => acc + (s.duration || 0), 0)
      
      let totalFocus = focusMins
      if (i === 0) {
        totalFocus += pomoCycles * 25
      }

      const daySessionCount = daySessions.length + (i === 0 ? pomoCycles : 0)
      const tasksCompletedInDay = i === 0 ? tasksDone : (daySessions.length > 0 ? Math.min(tasksDone, daySessions.length) : 0)
      const dayScore = (totalFocus > 0 || tasksCompletedInDay > 0)
        ? Math.min(100, Math.round((totalFocus / 45) * 50 + tasksCompletedInDay * 10))
        : 0

      result.push({
        date: daysCount <= 7 ? dayName : dateStr,
        focus: totalFocus,
        target: totalFocus > 0 ? 45 : 0,
        tasks: tasksCompletedInDay,
        sessions: daySessionCount,
        score: dayScore
      })
    }
    
    return result
  }, [user, sessions, timeRange, pomoCycles, tasksDone])

  const activeFocusMinutes = useMemo(() => {
    if (pomoRunning && pomoMode === 'focus') {
      return (pomoTotal - pomoRemaining) / 60
    }
    return 0
  }, [pomoRunning, pomoMode, pomoTotal, pomoRemaining])

  const totalFocusTimeMinutes = useMemo(() => {
    if (!user) return 0
    const fromSessions = sessions.reduce((acc, s) => acc + (s.duration || 0), 0)
    return fromSessions + (pomoCycles * 25) + activeFocusMinutes
  }, [user, sessions, pomoCycles, activeFocusMinutes])

  const formatFocusTime = (minutes: number) => {
    if (minutes < 60) return `${minutes.toFixed(0)}m`
    const h = Math.floor(minutes / 60)
    const m = Math.round(minutes % 60)
    return `${h}h ${m}m`
  }

  const focusScore = useMemo(() => {
    if (!user || (totalFocusTimeMinutes === 0 && tasksDone === 0)) return 0
    const score = Math.min(100, (pomoCycles * 10) + (tasksDone * 5) + (activeFocusMinutes / 5))
    return Math.round(score)
  }, [user, pomoCycles, tasksDone, activeFocusMinutes, totalFocusTimeMinutes])

  const handleExport = () => {
    const data = {
      pomoCycles,
      tasksCompleted: tasksDone,
      focusTimeMinutes: totalFocusTimeMinutes,
      timestamp: new Date().toISOString(),
      user: user?.email || 'Anonymous',
      isolationUid: user?.uid || 'guest-local'
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `oblivion-stats-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Stats exported successfully')
  }

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all user session data and stats to 0 in Firebase & local state? This action cannot be undone.')) {
      try {
        setPomoCycles(0)
        localStorage.removeItem('oblivion.pomodoro.cycles')
        localStorage.setItem('oblivion.pomodoro.cycles', '0')
        
        if (user) {
          const qSessions = query(collection(db, 'users', user.uid, 'sessions'))
          const snap = await getDocs(qSessions)
          const deletePromises = snap.docs.map(d => deleteDoc(doc(db, 'users', user.uid, 'sessions', d.id)))
          
          const statsRef = doc(db, 'users', user.uid, 'stats', 'summary')
          const resetSummary = setDoc(statsRef, {
            totalFocusMinutes: 0,
            pomoCycles: 0,
            tasksCompleted: 0,
            resetAt: Date.now()
          })

          await Promise.all([...deletePromises, resetSummary])
        }
        
        setSessions([])
        toast.success('All user data and stats set to 0 in Firebase & local state!')
      } catch (err) {
        console.error('Reset failed:', err)
        toast.error('Failed to reset remote database sessions')
      }
    }
  }

  return (
    <Panel open={open} onClose={onClose} title="Focus Insights & Analytics" icon={<BarChart2 className="h-4 w-4" />} width="max-w-4xl">
      <div className="p-6 md:p-8 h-full flex flex-col space-y-6 overflow-auto thin-scroll bg-zinc-950/80">
        
        {/* Header with Timeframe Filter */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Focus Analytics
              </h2>
            </div>
            <p className="text-xs text-white/40 font-medium">Real-time personalized workflow metrics & interactive trends.</p>
          </div>

          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 self-start">
            {(['7d', '30d', '90d', 'all'] as const).map(t => (
              <button 
                key={t} 
                onClick={() => setTimeRange(t)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                  timeRange === t ? 'bg-white text-black shadow-md' : 'text-white/40 hover:text-white'
                }`}
              >
                {t === '7d' ? '7 Days' : t === '30d' ? '30 Days' : t === '90d' ? '90 Days' : 'All'}
              </button>
            ))}
          </div>
        </header>

        {/* 6 Key Performance Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Streak" value={`${pomoCycles > 0 ? 1 : 0} days`} icon={<Flame className="h-4 w-4" />} color="from-orange-600/60 to-red-600/40" />
          <StatCard label="Focus Time" value={formatFocusTime(totalFocusTimeMinutes)} icon={<Zap className="h-4 w-4" />} color="from-amber-600/60 to-orange-600/40" />
          <StatCard label="Focus Score" value={String(focusScore)} icon={<Brain className="h-4 w-4" />} color="from-indigo-600/60 to-purple-600/40" />
          <StatCard label="Tasks Done" value={String(tasksDone)} icon={<LayoutList className="h-4 w-4" />} color="from-emerald-600/60 to-teal-600/40" />
          <StatCard label="Sessions" value={String(Math.max(sessions.length, pomoCycles))} icon={<RotateCcw className="h-4 w-4" />} color="from-blue-600/60 to-cyan-600/40" />
          <StatCard label="Break Time" value={`${(pomoCycles * 5).toFixed(0)}m`} icon={<Coffee className="h-4 w-4" />} color="from-pink-600/60 to-rose-600/40" />
        </div>

        {/* Interactive Animated Chart Section */}
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col space-y-4 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/5">
            <div>
              <h3 className="text-xs uppercase tracking-[0.2em] text-white/50 font-bold">Productivity Metrics</h3>
              <p className="text-[10px] text-white/30">Showing {timeRange === '7d' ? 'last 7 days' : timeRange === '30d' ? 'last 30 days' : 'historical'} breakdown</p>
            </div>

            {/* Metric Switcher */}
            <div className="flex bg-black/40 border border-white/10 rounded-lg p-1 text-[10px] font-bold uppercase tracking-wider">
              <button 
                onClick={() => setActiveMetric('focus')}
                className={`px-2.5 py-1 rounded-md transition-all ${activeMetric === 'focus' ? 'bg-[#e8702a] text-white' : 'text-white/40 hover:text-white'}`}
              >
                Focus vs Target
              </button>
              <button 
                onClick={() => setActiveMetric('tasks')}
                className={`px-2.5 py-1 rounded-md transition-all ${activeMetric === 'tasks' ? 'bg-[#e8702a] text-white' : 'text-white/40 hover:text-white'}`}
              >
                Tasks & Sessions
              </button>
              <button 
                onClick={() => setActiveMetric('score')}
                className={`px-2.5 py-1 rounded-md transition-all ${activeMetric === 'score' ? 'bg-[#e8702a] text-white' : 'text-white/40 hover:text-white'}`}
              >
                Score Trend
              </button>
            </div>
          </div>
          
          <div className="w-full h-[280px] relative pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="focusGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e8702a" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#e8702a" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="targetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(9, 9, 11, 0.95)', 
                    border: '1px solid rgba(255,255,255,0.15)', 
                    borderRadius: '12px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                    padding: '10px 14px'
                  }}
                  itemStyle={{ fontSize: '11px', color: '#fff', padding: '2px 0' }}
                  labelStyle={{ fontSize: '11px', fontWeight: 'bold', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}
                />
                
                {activeMetric === 'focus' && (
                  <>
                    <Area 
                      type="natural" 
                      dataKey="target" 
                      name="Daily Target (mins)"
                      stroke="#6366f1" 
                      fillOpacity={1} 
                      fill="url(#targetGrad)" 
                      strokeWidth={2}
                      isAnimationActive={true}
                      animationDuration={1000}
                    />
                    <Area 
                      type="natural" 
                      dataKey="focus" 
                      name="Focus Time (mins)"
                      stroke="#e8702a" 
                      fillOpacity={1} 
                      fill="url(#focusGrad)" 
                      strokeWidth={3}
                      isAnimationActive={true}
                      animationDuration={1200}
                    />
                  </>
                )}

                {activeMetric === 'tasks' && (
                  <>
                    <Area 
                      type="natural" 
                      dataKey="tasks" 
                      name="Tasks Completed"
                      stroke="#10b981" 
                      fillOpacity={1} 
                      fill="url(#scoreGrad)" 
                      strokeWidth={2.5}
                      isAnimationActive={true}
                      animationDuration={1000}
                    />
                    <Area 
                      type="natural" 
                      dataKey="sessions" 
                      name="Sessions"
                      stroke="#3b82f6" 
                      fillOpacity={1} 
                      fill="url(#targetGrad)" 
                      strokeWidth={2.5}
                      isAnimationActive={true}
                      animationDuration={1200}
                    />
                  </>
                )}

                {activeMetric === 'score' && (
                  <Area 
                    type="natural" 
                    dataKey="score" 
                    name="Productivity Score"
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#scoreGrad)" 
                    strokeWidth={3}
                    isAnimationActive={true}
                    animationDuration={1200}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-[10px] text-white/30 italic">
            {user ? 'Cloud synchronized session analytics' : 'Local browser metrics engine'}
          </span>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={handleExport} className="text-[10px] uppercase tracking-widest font-bold text-white/40 hover:text-white border border-white/5 hover:border-white/10 px-4 py-1.5 h-auto">
              Export Data
            </Button>
            <Button variant="ghost" onClick={handleReset} className="text-[10px] uppercase tracking-widest font-bold text-red-400/70 hover:text-red-300 hover:bg-red-500/10 border border-red-500/10 px-4 py-1.5 h-auto">
              Reset All User Data
            </Button>
          </div>
        </div>

      </div>
    </Panel>
  )
}

/* ----------------------------- Notes ----------------------------- */
interface Note { id: string; title: string; body: string; updatedAt: number; color?: string; pinned?: boolean }

const KEEP_COLORS: { [key: string]: { name: string, bg: string, text: string, dot: string, border: string } } = {
  default: { name: 'Default', bg: 'bg-white/5 border-white/10 hover:bg-white/10', text: 'text-white', dot: 'bg-white/10 border-white/20', border: 'border-white/10' },
  red: { name: 'Red', bg: 'bg-red-950/20 border-red-500/30 hover:bg-red-950/30', text: 'text-red-200', dot: 'bg-red-500/80 border-red-400', border: 'border-red-500/25' },
  orange: { name: 'Orange', bg: 'bg-orange-950/25 border-orange-850/30 hover:bg-orange-950/35', text: 'text-orange-200', dot: 'bg-orange-500/80 border-orange-400', border: 'border-orange-500/25' },
  yellow: { name: 'Yellow', bg: 'bg-yellow-950/20 border-yellow-850/20 hover:bg-yellow-950/30', text: 'text-yellow-105', dot: 'bg-yellow-500/80 border-yellow-400', border: 'border-yellow-500/20' },
  green: { name: 'Green', bg: 'bg-emerald-950/20 border-emerald-800/30 hover:bg-emerald-950/30', text: 'text-emerald-200', dot: 'bg-emerald-500/80 border-emerald-400', border: 'border-emerald-500/25' },
  teal: { name: 'Teal', bg: 'bg-teal-950/20 border-teal-800/30 hover:bg-teal-950/30', text: 'text-teal-200', dot: 'bg-teal-500/80 border-teal-400', border: 'border-teal-500/25' },
  blue: { name: 'Blue', bg: 'bg-blue-950/25 border-blue-800/30 hover:bg-blue-950/35', text: 'text-blue-200', dot: 'bg-blue-500/80 border-blue-400', border: 'border-blue-500/25' },
  purple: { name: 'Purple', bg: 'bg-purple-950/20 border-purple-800/30 hover:bg-purple-950/30', text: 'text-purple-200', dot: 'bg-purple-500/80 border-purple-400', border: 'border-purple-500/25' },
  pink: { name: 'Pink', bg: 'bg-rose-950/20 border-rose-800/30 hover:bg-rose-950/30', text: 'text-rose-200', dot: 'bg-rose-500/80 border-rose-400', border: 'border-rose-500/25' },
}

function NotesPanel({ open, onClose, user, googleToken, setGoogleToken }: { open: boolean, onClose: () => void, user: User | null, googleToken: string | null, setGoogleToken: (t: string | null) => void }) {
  const [localNotes, setLocalNotes] = useState<Note[]>([])
  const [remoteNotes, setRemoteNotes] = useState<Note[]>([])
  const [active, setActive] = useState<string | null>(null)
  const [q, setQ] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('oblivion.notes')
      if (raw) setLocalNotes(JSON.parse(raw))
    } catch {}
  }, [])

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'users', user.uid, 'notes'))
    const unsubNotes = onSnapshot(q, (snap) => {
      setRemoteNotes(snap.docs.map(d => ({ id: d.id, ...d.data() } as Note)))
    }, (err) => handleFirestoreError(err, 'get', `users/${user.uid}/notes`))

    return () => { unsubNotes() }
  }, [user])

  const notes = user ? remoteNotes : localNotes
  const setNotes = (updater: (prev: Note[]) => Note[]) => {
    if (user) {
      // Logic for remote updates is handling individual docs usually
    } else {
      const next = updater(localNotes)
      setLocalNotes(next)
      localStorage.setItem('oblivion.notes', JSON.stringify(next))
    }
  }

  const addNote = async () => {
    if (!user) {
      const id = crypto.randomUUID()
      const n = { id, title: 'Untitled Note', body: '', updatedAt: Date.now(), pinned: false, color: 'default' }
      const list = [n, ...localNotes]
      setLocalNotes(list)
      localStorage.setItem('oblivion.notes', JSON.stringify(list))
      setActive(id)
      return
    }

    try {
      const n = { userId: user.uid, title: 'Untitled Note', body: '', updatedAt: Date.now(), pinned: false, color: 'default' }
      const docRef = await addDoc(collection(db, 'users', user.uid, 'notes'), n)
      setActive(docRef.id)
    } catch (err) {
      handleFirestoreError(err, 'create', `users/${user.uid}/notes`)
    }
  }

  const updateNote = async (id: string, patch: Partial<Note>) => {
    if (!user) {
      const list = localNotes.map(n => n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n)
      setLocalNotes(list)
      localStorage.setItem('oblivion.notes', JSON.stringify(list))
      return
    }

    try {
      const { id: _id, userId: _userId, ...cleanPatch } = patch as any
      await updateDoc(doc(db, 'users', user.uid, 'notes', id), { ...cleanPatch, updatedAt: Date.now() })
    } catch (err) {
      handleFirestoreError(err, 'update', `users/${user.uid}/notes/${id}`)
    }
  }

  const removeNote = async (id: string) => {
    if (!user) {
      const list = localNotes.filter(n => n.id !== id)
      setLocalNotes(list)
      localStorage.setItem('oblivion.notes', JSON.stringify(list))
      if (active === id) setActive(null)
      return
    }

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'notes', id))
      if (active === id) setActive(null)
    } catch (err) {
      handleFirestoreError(err, 'delete', `users/${user.uid}/notes/${id}`)
    }
  }

  const exportToGoogleTasks = async (note: Note) => {
    if (!googleToken) {
      toast.error('Connect with Google first (via Tasks or Agenda Sync)')
      return
    }
    toast('Syncing checklist note to Google Tasks...', { icon: '🔄' })
    try {
      const listsRes = await fetch('https://tasks.googleapis.com/v1/users/@me/lists', {
        headers: { 'Authorization': `Bearer ${googleToken}` }
      })
      const listsData = await listsRes.json()
      const primaryListId = listsData.items && listsData.items.length > 0 ? listsData.items[0].id : '@default'
      
      const payload: any = {
        title: note.title || 'Untitled Note',
        notes: note.body || ''
      }
      
      const createRes = await fetch(`https://tasks.googleapis.com/v1/lists/${primaryListId}/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      
      if (createRes.ok) {
        toast.success(`Exported "${note.title}" to Google Tasks!`)
      } else {
        throw new Error(await createRes.text())
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to export checklist to Google Tasks')
    }
  }

  const filtered = notes.filter(n => !q || (n.title + ' ' + n.body).toLowerCase().includes(q.toLowerCase()))
  
  // Sort and separate pinned/unpinned
  const pinnedNotes = filtered.filter(n => n.pinned).sort((a, b) => b.updatedAt - a.updatedAt)
  const otherNotes = filtered.filter(n => !n.pinned).sort((a, b) => b.updatedAt - a.updatedAt)

  const current = notes.find(n => n.id === active)
  const currentKeeperColor = current ? KEEP_COLORS[current.color || 'default'] || KEEP_COLORS.default : KEEP_COLORS.default

  const [localChecklistMode, setLocalChecklistMode] = useState(false)

  useEffect(() => {
    if (current) {
      const isList = current.body.split('\n').some(l => l.startsWith('[ ] ') || l.startsWith('[x] ') || l.startsWith('[X] '));
      setLocalChecklistMode(isList);
    } else {
      setLocalChecklistMode(false);
    }
  }, [active, current?.id]);

  const toggleChecklistMode = () => {
    if (!current) return;
    const nextMode = !localChecklistMode;
    setLocalChecklistMode(nextMode);
    
    if (nextMode) {
      const lines = current.body.split('\n');
      const formattedLines = lines.map(line => {
        if (line.startsWith('[ ] ') || line.startsWith('[x] ') || line.startsWith('[X] ')) {
          return line;
        }
        return `[ ] ${line}`;
      });
      updateNote(current.id, { body: formattedLines.join('\n') });
    } else {
      const lines = current.body.split('\n');
      const cleanedLines = lines.map(line => {
        if (line.startsWith('[ ] ')) return line.substring(4);
        if (line.startsWith('[x] ') || line.startsWith('[X] ')) return line.substring(4);
        return line;
      });
      updateNote(current.id, { body: cleanedLines.join('\n') });
    }
  };

  interface ChecklistItem {
    id: string;
    checked: boolean;
    text: string;
  }

  const parseChecklist = (body: string): ChecklistItem[] => {
    if (!body) return [{ id: '0', checked: false, text: '' }];
    const lines = body.split('\n');
    return lines.map((line, idx) => {
      const isChecked = line.startsWith('[x] ') || line.startsWith('[X] ');
      const isUnchecked = line.startsWith('[ ] ');
      return {
        id: String(idx),
        checked: isChecked,
        text: isChecked || isUnchecked ? line.substring(4) : line
      };
    });
  };

  const serializeChecklist = (items: ChecklistItem[]): string => {
    return items.map(item => `${item.checked ? '[x]' : '[ ]'} ${item.text}`).join('\n');
  };

  const renderNoteItem = (n: Note) => {
    const colorInfo = KEEP_COLORS[n.color || 'default'] || KEEP_COLORS.default;
    return (
      <div key={n.id} className={`group flex flex-col w-full text-left rounded-xl p-3 border transition-all duration-250 cursor-pointer ${colorInfo.bg} ${colorInfo.border} ${active === n.id ? 'ring-2 ring-white/30 scale-[1.01] shadow-lg' : 'opacity-85 hover:opacity-100 shadow-sm'}`}
        onClick={() => setActive(n.id)}>
        <div className="flex items-start justify-between gap-2">
          <div className={`text-xs font-semibold truncate flex-1 uppercase tracking-wider ${colorInfo.text}`}>{n.title || 'Untitled Note'}</div>
          <button 
            title={n.pinned ? "Unpin note" : "Pin note"}
            onClick={(e) => {
              e.stopPropagation();
              updateNote(n.id, { pinned: !n.pinned });
            }}
            className="opacity-0 group-hover:opacity-100 text-white/50 hover:text-white transition-opacity p-0.5"
          >
            {n.pinned ? <Pin className="h-3 w-3 fill-white text-white" /> : <PinOff className="h-3 w-3" />}
          </button>
        </div>
        <div className="text-[13px] text-white/70 line-clamp-3 mt-1.5 whitespace-pre-wrap leading-relaxed">
          {n.body || <span className="italic text-white/35">Empty note</span>}
        </div>
        <div className="text-[9px] text-white/40 mt-2 font-mono flex items-center justify-between">
          <span>{new Date(n.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          {n.color && n.color !== 'default' && (
            <span className="text-[8px] uppercase font-bold tracking-widest text-white/30 px-1.5 py-0.5 bg-white/5 rounded-full">{n.color}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <Panel open={open} onClose={onClose} title="Google Keep" icon={<StickyNote className="h-4 w-4" />}>
      <div className="grid grid-cols-[280px_1fr] h-full min-h-0 bg-zinc-950">
        <div className="border-r border-white/10 flex flex-col min-h-0 bg-black/40">
          <div className="p-3.5 flex items-center gap-2 border-b border-white/5">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
              <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search notes & tools…"
                className="pl-8 bg-white/5 border-white/10 text-white placeholder:text-white/40 h-9 text-xs" />
            </div>
            <Button size="icon" onClick={addNote} className="bg-white/10 hover:bg-white/20 h-9 w-9"><Plus className="h-4 w-4" /></Button>
          </div>
          
          <div className="px-4 py-2 border-b border-white/5 bg-white/[0.015] flex items-center justify-between">
            <div className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-bold">Notes List</div>
            {user ? (
              <span className="text-[8px] text-emerald-400 font-extrabold tracking-widest bg-emerald-950/45 border border-emerald-500/20 px-1.5 py-0.5 rounded">Cloud Backup</span>
            ) : (
              <span className="text-[8px] text-amber-500 font-extrabold tracking-widest bg-amber-950/45 border border-amber-500/20 px-1.5 py-0.5 rounded">Offline</span>
            )}
          </div>

          <div className="flex-1 overflow-auto thin-scroll p-3 space-y-4">
            {filtered.length === 0 && (
              <div className="text-white/45 text-xs text-center p-6 flex flex-col items-center gap-2">
                <span>No notes found.</span>
                <span className="text-[10px] text-white/30 italic">Click upper right + to create a Keep Note</span>
              </div>
            )}

            {pinnedNotes.length > 0 && (
              <div className="space-y-2">
                <div className="text-[8px] uppercase tracking-[0.25em] text-white/30 font-bold px-1 flex items-center gap-1.5">
                  <Pin className="h-2 w-2 fill-white/30" /> Pinned
                </div>
                {pinnedNotes.map(renderNoteItem)}
              </div>
            )}

            {otherNotes.length > 0 && (
              <div className="space-y-2">
                {pinnedNotes.length > 0 && (
                  <div className="text-[8px] uppercase tracking-[0.25em] text-white/30 font-bold px-1 pt-2">
                    Others
                  </div>
                )}
                {otherNotes.map(renderNoteItem)}
              </div>
            )}
          </div>
        </div>

        <div className={`flex flex-col min-h-0 transition-colors duration-300 ${currentKeeperColor.bg}`}>
          {current ? (
            <>
              <div className="p-4 flex items-center justify-between border-b border-white/5 bg-black/10 gap-3">
                <input 
                  value={current.title} 
                  onChange={e => updateNote(current.id, { title: e.target.value })}
                  className={`bg-transparent border-0 text-md font-semibold focus:outline-none p-0 flex-1 ${currentKeeperColor.text}`} 
                  placeholder="Title" 
                />
                
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={toggleChecklistMode}
                    title={localChecklistMode ? "Switch to Plain Text" : "Switch to Checklist view"}
                    className={`p-2 rounded-lg transition-colors flex items-center justify-center ${localChecklistMode ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                  >
                    <ListTodo className="h-4 w-4" />
                  </button>

                  <button 
                    onClick={() => updateNote(current.id, { pinned: !current.pinned })}
                    title={current.pinned ? "Unpin note" : "Pin note"}
                    className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                  >
                    {current.pinned ? <Pin className="h-4 w-4 fill-white text-white" /> : <Pin className="h-4 w-4" />}
                  </button>

                  <button 
                    onClick={() => exportToGoogleTasks(current)}
                    title="Export checklist to Google Tasks"
                    className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider"
                  >
                    <ListChecks className="h-4 w-4" />
                    <span className="hidden sm:inline">Export Tasks</span>
                  </button>

                  <button 
                    onClick={() => removeNote(current.id)}
                    title="Delete Note"
                    className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {localChecklistMode ? (
                <div className="flex-1 overflow-auto p-6 space-y-2 thin-scroll">
                  {parseChecklist(current.body).map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-3 group/item">
                      <button
                        onClick={() => {
                          const items = parseChecklist(current.body);
                          items[idx].checked = !items[idx].checked;
                          updateNote(current.id, { body: serializeChecklist(items) });
                        }}
                        className={`h-4.5 w-4.5 rounded border flex items-center justify-center transition-all ${item.checked ? 'bg-white border-white' : 'border-white/30 hover:border-white/60'}`}
                      >
                        {item.checked && <Check className="h-3.5 w-3.5 text-black" />}
                      </button>
                      <input
                        value={item.text}
                        onChange={(e) => {
                          const items = parseChecklist(current.body);
                          items[idx].text = e.target.value;
                          updateNote(current.id, { body: serializeChecklist(items) });
                        }}
                        onKeyDown={(e) => {
                          const items = parseChecklist(current.body);
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            items.splice(idx + 1, 0, { id: String(Date.now()), checked: false, text: '' });
                            updateNote(current.id, { body: serializeChecklist(items) });
                          } else if (e.key === 'Backspace' && item.text === '' && items.length > 1) {
                            e.preventDefault();
                            const nextItems = items.filter((_, i) => i !== idx);
                            updateNote(current.id, { body: serializeChecklist(nextItems) });
                          }
                        }}
                        className={`bg-transparent border-0 focus:outline-none flex-1 text-sm ${item.checked ? 'line-through text-white/40' : currentKeeperColor.text}`}
                        placeholder="List item"
                      />
                      <button
                        onClick={() => {
                          const items = parseChecklist(current.body);
                          const nextItems = items.filter((_, i) => i !== idx);
                          updateNote(current.id, { body: serializeChecklist(nextItems) });
                        }}
                        className="opacity-0 group-hover/item:opacity-100 text-white/30 hover:text-white transition-opacity p-1"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  
                  <button
                    onClick={() => {
                      const items = parseChecklist(current.body);
                      const blankText = items.length === 1 && items[0].text === '' ? false : true;
                      if (blankText) {
                        const nextItems = [...items, { id: String(Date.now()), checked: false, text: '' }];
                        updateNote(current.id, { body: serializeChecklist(nextItems) });
                      }
                    }}
                    className="flex items-center gap-2 text-xs text-white/50 hover:text-white/80 font-medium pt-2 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add list item</span>
                  </button>
                </div>
              ) : (
                <textarea 
                  value={current.body} 
                  onChange={e => updateNote(current.id, { body: e.target.value })}
                  placeholder="Start typing… Note supports checklists and text styling. Color-code using the palette below."
                  className={`flex-1 bg-transparent border-0 resize-none focus:outline-none p-6 text-[14px] leading-relaxed thin-scroll ${currentKeeperColor.text} placeholder:text-white/30`} 
                />
              )}

              <div className="flex items-center justify-between px-6 py-2 bg-black/20 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <Palette className="h-3.5 w-3.5 text-white/50" />
                  <div className="flex gap-1.5">
                    {Object.entries(KEEP_COLORS).map(([colorKey, colorVal]) => (
                      <button
                        key={colorKey}
                        onClick={() => updateNote(current.id, { color: colorKey })}
                        title={colorVal.name}
                        className={`h-4.5 w-4.5 rounded-full border transition-transform ${colorVal.dot} ${current.color === colorKey || (!current.color && colorKey === 'default') ? 'scale-125 border-white ring-2 ring-white/20' : 'hover:scale-110 border-transparent'}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="text-[10px] text-white/40 font-mono italic">
                  Last updated {new Date(current.updatedAt).toLocaleTimeString()}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-white/45 gap-2 select-none">
              <StickyNote className="h-10 w-10 text-white/20 stroke-[1.5]" />
              <div className="text-xs tracking-wider uppercase font-semibold text-white/30">Google Keep Notes Panel</div>
              <div className="text-[10px] text-white/20 italic">Select a note or tap + on the left to add a beautifully synced Keep Note</div>
            </div>
          )}
        </div>
      </div>
    </Panel>
  )
}

/* ----------------------------- Tasks ----------------------------- */
interface Task { id: string; text: string; done: boolean; createdAt: number }
function TaskRow({ t, onToggle, onRemove }: { t: Task, onToggle: (id: string) => void, onRemove: (id: string) => void, key?: string }) {
  return (
    <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}
      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/5 transition-colors">
      <button onClick={() => onToggle(t.id)}
        className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all ${t.done ? 'bg-white border-white' : 'border-white/30 hover:border-white/60'}`}>
        {t.done && <Check className="h-3.5 w-3.5 text-black" />}
      </button>
      <span className={`flex-1 text-[15px] transition-all ${t.done ? 'line-through text-white/40' : 'text-white/90'}`}>{t.text}</span>
      <button onClick={() => onRemove(t.id)} className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-300 transition-opacity">
        <Trash2 className="h-4 w-4" />
      </button>
    </motion.div>
  )
}
function ChecklistPanel({ open, onClose, user, googleToken, setGoogleToken }: { open: boolean, onClose: () => void, user: User | null, googleToken: string | null, setGoogleToken: (t: string | null) => void }) {
  const [localTasks, setLocalTasks] = useState<Task[]>([])
  const [remoteTasks, setRemoteTasks] = useState<Task[]>([])
  const [input, setInput] = useState('')

  // Tabs: flow = offline/Firestore, google = Google Tasks API
  const [activeTab, setActiveTab] = useState<'flow' | 'google'>('flow')

  // Google Tasks specific states
  const [taskLists, setTaskLists] = useState<{ id: string, title: string }[]>([])
  const [activeListId, setActiveListId] = useState<string>('')
  const [gTasks, setGTasks] = useState<{ id: string, title: string, status: 'needsAction' | 'completed' }[]>([])
  const [gLoading, setGLoading] = useState(false)
  const [listLoading, setListLoading] = useState(false)
  const [gInput, setGInput] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('oblivion.tasks')
      if (raw) setLocalTasks(JSON.parse(raw))
    } catch {}
  }, [])

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'users', user.uid, 'tasks'))
    const unsubTasks = onSnapshot(q, (snap) => {
      setRemoteTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as Task)))
    }, (err) => handleFirestoreError(err, 'get', `users/${user.uid}/tasks`))

    return () => { unsubTasks() }
  }, [user])

  // Google Tasks fetchers
  const fetchTaskLists = useCallback(async (tokenToUse: string) => {
    setListLoading(true)
    try {
      const res = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
        headers: { 'Authorization': `Bearer ${tokenToUse}` }
      })
      const data = await res.json()
      if (data.items) {
        setTaskLists(data.items)
        if (data.items.length > 0) {
          setActiveListId(data.items[0].id)
        }
      } else if (data.error) {
        // Token was likely expired or revoked
        setGoogleToken(null)
      }
    } catch (err) {
      console.error('Fetch Google Tasks Lists failed', err)
      setGoogleToken(null)
    } finally {
      setListLoading(false)
    }
  }, [setGoogleToken])

  const fetchTasksForList = useCallback(async (tokenToUse: string, listId: string) => {
    if (!listId) return
    setGLoading(true)
    try {
      const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks?showCompleted=true&showHidden=true&maxResults=100`, {
        headers: { 'Authorization': `Bearer ${tokenToUse}` }
      })
      const data = await res.json()
      if (data.items) {
        setGTasks(data.items.map((item: any) => ({
          id: item.id,
          title: item.title || 'Untitled Task',
          status: item.status
        })))
      } else {
        setGTasks([])
      }
    } catch (err) {
      console.error('Fetch Google Tasks failed', err)
    } finally {
      setGLoading(false)
    }
  }, [])

  useEffect(() => {
    if (googleToken && open && activeTab === 'google') {
      fetchTaskLists(googleToken)
    }
  }, [googleToken, open, activeTab, fetchTaskLists])

  useEffect(() => {
    if (googleToken && activeListId && open && activeTab === 'google') {
      fetchTasksForList(googleToken, activeListId)
    }
  }, [googleToken, activeListId, open, activeTab, fetchTasksForList])

  const linkGoogleTasks = async () => {
    try {
      toast('Connecting to Google...', { icon: '🔄' })
      const res = await signInWithPopup(auth, googleProvider)
      const cred = GoogleAuthProvider.credentialFromResult(res)
      const token = cred?.accessToken ?? null
      if (!token) throw new Error('No access token')
      setGoogleToken(token)
      toast.success('Connected to Google Tasks')
    } catch (err: any) {
      console.error(err)
      toast.error('Connection failed')
    }
  }

  const addGTaskItem = async () => {
    const val = gInput.trim()
    if (!val || !googleToken || !activeListId) return
    try {
      const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${activeListId}/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: val })
      })
      const data = await res.json()
      if (data.id) {
        setGInput('')
        fetchTasksForList(googleToken, activeListId)
        toast.success('Task added to Google Tasks')
      }
    } catch (err) {
      console.error('Failed to add Google Task', err)
      toast.error('Could not add task')
    }
  }

  const toggleGTaskItem = async (taskId: string, currentStatus: string) => {
    if (!googleToken || !activeListId) return
    const newStatus = currentStatus === 'completed' ? 'needsAction' : 'completed'
    try {
      // Optimistic update
      setGTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus as any } : t))
      
      const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${activeListId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${googleToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: newStatus,
          completed: newStatus === 'completed' ? new Date().toISOString() : null
        })
      })
      const data = await res.json()
      if (!data.id) {
        // Rollback on failure
        fetchTasksForList(googleToken, activeListId)
        throw new Error('API update failure')
      }
    } catch (err) {
      console.error('Failed to toggle Google Task', err)
      toast.error('Could not sync status changes')
    }
  }

  const deleteGTaskItem = async (taskId: string, taskTitle: string) => {
    if (!googleToken || !activeListId) return
    const confirmed = window.confirm(`Are you sure you want to delete "${taskTitle}" from Google Tasks?`)
    if (!confirmed) return
    try {
      // Optimistic update
      setGTasks(prev => prev.filter(t => t.id !== taskId))
      await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${activeListId}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${googleToken}`
        }
      })
      toast.success('Task deleted')
    } catch (err) {
      console.error('Failed to delete Google Task', err)
      fetchTasksForList(googleToken, activeListId)
      toast.error('Could not delete task')
    }
  }

  const tasks = user ? remoteTasks : localTasks

  const add = async () => {
    const t = input.trim(); if (!t) return
    if (user) {
      try {
        const newTask = { userId: user.uid, text: t, done: false, createdAt: Date.now() }
        await addDoc(collection(db, 'users', user.uid, 'tasks'), newTask)
      } catch (err) {
        handleFirestoreError(err, 'create', `users/${user.uid}/tasks`)
      }
    } else {
      const list = [{ id: crypto.randomUUID(), text: t, done: false, createdAt: Date.now() }, ...localTasks]
      setLocalTasks(list); localStorage.setItem('oblivion.tasks', JSON.stringify(list))
    }
    setInput('')
  }

  const toggle = async (id: string) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid, 'tasks', id), { done: !task.done })
      } catch (err) {
        handleFirestoreError(err, 'update', `users/${user.uid}/tasks/${id}`)
      }
    } else {
      const next = localTasks.map(t => t.id === id ? { ...t, done: !t.done } : t)
      setLocalTasks(next); localStorage.setItem('oblivion.tasks', JSON.stringify(next))
    }
  }

  const remove = async (id: string) => {
    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'tasks', id))
      } catch (err) {
        handleFirestoreError(err, 'delete', `users/${user.uid}/tasks/${id}`)
      }
    } else {
      const next = localTasks.filter(t => t.id !== id)
      setLocalTasks(next); localStorage.setItem('oblivion.tasks', JSON.stringify(next))
    }
  }

  const clearDone = async () => {
    if (user) {
      try {
        const batch = tasks.filter(t => t.done)
        for (const t of batch) {
          await deleteDoc(doc(db, 'users', user.uid, 'tasks', t.id))
        }
      } catch (err) {
        handleFirestoreError(err, 'delete', `users/${user.uid}/tasks/batch`)
      }
    } else {
      const next = localTasks.filter(t => !t.done)
      setLocalTasks(next); localStorage.setItem('oblivion.tasks', JSON.stringify(next))
    }
  }

  const pending = tasks.filter(t => !t.done)
  const done = tasks.filter(t => t.done)

  return (
    <Panel open={open} onClose={onClose} title="Checklist" icon={<ListChecks className="h-4 w-4" />} width="max-w-xl">
      <div className="flex flex-col h-full min-h-0">
        
        {/* Sleek navigation tabs */}
        <div className="flex px-5 pt-3 border-b border-white/5 space-x-6 shrink-0 bg-white/[0.01]">
          <button 
            onClick={() => setActiveTab('flow')}
            className={`pb-3 text-[10px] uppercase tracking-[0.2em] font-black transition-all relative ${activeTab === 'flow' ? 'text-white' : 'text-white/30 hover:text-white/60'}`}
          >
            Flow List
            {activeTab === 'flow' && (
              <motion.div layoutId="checklist-active-tab-indicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab('google')}
            className={`pb-3 text-[10px] uppercase tracking-[0.2em] font-black transition-all relative flex items-center gap-1.5 ${activeTab === 'google' ? 'text-white' : 'text-white/30 hover:text-white/60'}`}
          >
            Google Tasks
            {activeTab === 'google' && (
              <motion.div layoutId="checklist-active-tab-indicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full" />
            )}
          </button>
        </div>

        {activeTab === 'flow' ? (
          <div className="p-5 flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Managed Tasks</div>
            </div>
            <div className="flex gap-2">
              <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()}
                placeholder="Add a task and press Enter…"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 h-11" />
              <Button onClick={add} className="bg-white/10 hover:bg-white/20 h-11 px-4">Add</Button>
            </div>
            <div className="mt-5 flex-1 overflow-auto thin-scroll space-y-1.5 pr-1">
              <AnimatePresence initial={false}>
                {pending.map(t => <TaskRow key={t.id} t={t} onToggle={toggle} onRemove={remove} />)}
              </AnimatePresence>
              {done.length > 0 && (
                <div className="pt-4 mt-3 border-t border-white/10">
                  <div className="flex items-center justify-between text-xs uppercase tracking-wide text-white/40 mb-2">
                    <span>Completed · {done.length}</span>
                    <button onClick={clearDone} className="hover:text-white/70">Clear</button>
                  </div>
                  <AnimatePresence initial={false}>
                    {done.map(t => <TaskRow key={t.id} t={t} onToggle={toggle} onRemove={remove} />)}
                  </AnimatePresence>
                </div>
              )}
              {tasks.length === 0 && <div className="text-white/40 text-sm text-center pt-12">A quiet list. Add your first task.</div>}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 bg-black/[0.05]">
            {!googleToken ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="p-4 rounded-full bg-white/[0.02] border border-white/5 text-white/40">
                  <ListChecks className="h-8 w-8 text-white/30" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">Google Tasks Integration</h3>
                  <p className="text-xs text-white/40 mt-2 max-w-[280px] mx-auto leading-relaxed">
                    Access and manage your cloud-hosted Google Tasks directly from your workspace with safe syncs.
                  </p>
                </div>
                <button 
                  onClick={linkGoogleTasks}
                  className="px-6 py-3 rounded-xl text-xs uppercase font-black tracking-widest bg-white text-black hover:bg-white/95 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 shadow-lg shadow-white/5"
                >
                  <ListChecks className="h-4 w-4" /> Connect Google Account
                </button>
              </div>
            ) : (
              <div className="p-5 flex flex-col flex-1 min-h-0">
                
                {/* Horizontal slider for list picker */}
                {listLoading ? (
                  <div className="text-white/20 text-[10px] uppercase tracking-widest mb-3 animate-pulse">Loading task lists...</div>
                ) : (
                  taskLists.length > 0 && (
                    <div className="mb-4">
                      <div className="flex gap-1.5 overflow-x-auto pb-2 shrink-0 no-scrollbar max-w-full">
                        {taskLists.map(lst => (
                          <button
                            key={lst.id}
                            onClick={() => setActiveListId(lst.id)}
                            className={`px-3-5 py-1.5 rounded-full text-[9px] uppercase font-black tracking-widest shrink-0 transition-all border ${
                              activeListId === lst.id 
                                ? 'bg-white text-black border-white' 
                                : 'bg-white/5 text-white/55 border-white/5 hover:border-white/20'
                            }`}
                          >
                            {lst.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                )}

                {/* Adding task */}
                <div className="flex gap-2">
                  <Input 
                    value={gInput} 
                    onChange={e => setGInput(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && addGTaskItem()}
                    placeholder="Add task to Google Tasks…"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40 h-11" 
                  />
                  <Button onClick={addGTaskItem} className="bg-white/10 hover:bg-white/20 h-11 px-4">Add</Button>
                </div>

                {/* Google task lists items */}
                <div className="mt-5 flex-1 overflow-auto thin-scroll space-y-1.5 pr-1">
                  {gLoading ? (
                    <div className="text-center pt-12 text-white/40 text-xs uppercase tracking-widest animate-pulse">Loading tasks from Google...</div>
                  ) : (
                    <>
                      <AnimatePresence initial={false}>
                        {gTasks.filter(item => item.status !== 'completed').map(t => (
                          <motion.div key={t.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}
                            className="group flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/5 transition-colors">
                            <button onClick={() => toggleGTaskItem(t.id, t.status)}
                              className="h-5 w-5 rounded-md border border-white/30 hover:border-white/60 flex items-center justify-center transition-all">
                              {t.status === 'completed' && <Check className="h-3.5 w-3.5 text-black" />}
                            </button>
                            <span className="flex-1 text-[15px] text-white/90">{t.title}</span>
                            <button onClick={() => deleteGTaskItem(t.id, t.title)} className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-300 transition-opacity">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      {gTasks.some(item => item.status === 'completed') && (
                        <div className="pt-4 mt-3 border-t border-white/10">
                          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-white/40 mb-2">
                            <span>Completed · {gTasks.filter(item => item.status === 'completed').length}</span>
                          </div>
                          <AnimatePresence initial={false}>
                            {gTasks.filter(item => item.status === 'completed').map(t => (
                              <motion.div key={t.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}
                                className="group flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/5 transition-colors">
                                <button onClick={() => toggleGTaskItem(t.id, t.status)}
                                  className="h-5 w-5 rounded-md border bg-white border-white flex items-center justify-center transition-all">
                                  <Check className="h-3.5 w-3.5 text-black" />
                                </button>
                                <span className="flex-1 text-[15px] line-through text-white/40">{t.title}</span>
                                <button onClick={() => deleteGTaskItem(t.id, t.title)} className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-300 transition-opacity">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      )}

                      {gTasks.length === 0 && (
                        <div className="text-white/40 text-sm text-center pt-12">No tasks in this list. Clean slate!</div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </Panel>
  )
}

/* ----------------------------- Pomodoro ----------------------------- */
function DurationField({ label, v, set }: { label: string, v: number, set: (n: number) => void }) {
  return (
    <label className="block">
      <div className="text-[10px] tracking-[0.2em] uppercase mb-1">{label}</div>
      <input type="number" min={1} max={120} value={v}
        onChange={e => set(Math.max(1, Math.min(120, Number(e.target.value) || 1)))}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm text-center focus:outline-none focus:border-white/30" />
    </label>
  )
}
function PomodoroPanel({ open, onClose, mode, setMode, focusMin, setFocusMin, shortMin, setShortMin, longMin, setLongMin, running, setRunning, remaining, setRemaining, total, cycles, onComplete }: { 
  open: boolean, 
  onClose: () => void,
  mode: 'focus' | 'short' | 'long',
  setMode: (m: 'focus' | 'short' | 'long') => void,
  focusMin: number,
  setFocusMin: (n: number) => void,
  shortMin: number,
  setShortMin: (n: number) => void,
  longMin: number,
  setLongMin: (n: number) => void,
  running: boolean,
  setRunning: (r: boolean) => void,
  remaining: number,
  setRemaining: React.Dispatch<React.SetStateAction<number>>,
  total: number,
  cycles: number,
  onComplete: () => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editMin, setEditMin] = useState('')
  const [editSec, setEditSec] = useState('')
  const [blockNotifications, setBlockNotifications] = useState(() => {
    try {
      return localStorage.getItem('oblivion.pomo.block_notifications') !== 'false'
    } catch {
      return true
    }
  })

  const toggleBlockNotifications = (val: boolean) => {
    setBlockNotifications(val)
    try {
      localStorage.setItem('oblivion.pomo.block_notifications', String(val))
    } catch {}
    if (val && Notification && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission()
    }
  }

  const startEdit = () => {
    setRunning(false)
    setEditMin(String(Math.floor(remaining / 60)).padStart(2, '0'))
    setEditSec(String(remaining % 60).padStart(2, '0'))
    setIsEditing(true)
  }

  const saveEdit = () => {
    const m = Math.max(0, Math.min(120, Number(editMin) || 0))
    const s = Math.max(0, Math.min(59, Number(editSec) || 0))
    setRemaining(m * 60 + s)
    setIsEditing(false)
  }

  const togglePiP = async () => {
    if (!('documentPictureInPicture' in window)) {
      toast.error('Picture-in-Picture not supported by your browser')
      return
    }
    try {
      // @ts-ignore
      const pip = await window.documentPictureInPicture.requestWindow({
        width: 280,
        height: 320,
      })
      
      const container = document.createElement('div')
      container.id = 'pip-pomodoro'
      pip.document.body.append(container)
      
      // Copy styles
      const styles = document.querySelectorAll('style, link[rel="stylesheet"]')
      styles.forEach(s => pip.document.head.append(s.cloneNode(true)))
      pip.document.body.className = 'bg-[#050505] text-white flex flex-col items-center justify-center h-full m-0'
      
      toast.success('Pomodoro in Picture-in-Picture')
    } catch (e) {
      toast.error('Failed to open PiP')
    }
  }

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')
  const pct = total > 0 ? (1 - remaining / total) : 0
  const R = 110
  const C = 2 * Math.PI * R
  return (
    <Panel open={open} onClose={onClose} title="Pomodoro & Focus Shield" icon={<Timer className="h-4 w-4" />} width="max-w-md">
      <div className="p-6 flex flex-col items-center">
        {running && blockNotifications && mode === 'focus' && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] uppercase font-bold tracking-widest mb-4 animate-pulse">
            <ShieldAlert className="h-3.5 w-3.5 text-emerald-400" />
            <span>Notification Shield Active (DND)</span>
          </div>
        )}
        <div className="flex bg-white/5 p-1 rounded-full text-sm">
          {(['focus', 'short', 'long'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-4 py-1.5 rounded-full transition-all ${mode === m ? 'bg-white text-black' : 'text-white/70 hover:text-white'}`}>
              {m === 'focus' ? 'Focus' : m === 'short' ? 'Short' : 'Long'}
            </button>
          ))}
        </div>
        <div className="relative my-6 flex items-center justify-center">
          <svg width="260" height="260" viewBox="0 0 260 260" className="-rotate-90">
            <circle cx="130" cy="130" r={R} stroke="rgba(255,255,255,0.08)" strokeWidth="6" fill="none" />
            <motion.circle cx="130" cy="130" r={R} stroke="white" strokeWidth="6" fill="none" strokeLinecap="round"
              strokeDasharray={C} animate={{ strokeDashoffset: C * (1 - pct) }} transition={{ ease: 'linear', duration: 0.5 }}
              style={{ filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.35))' }} />
          </svg>
          <div className="absolute text-center">
            {isEditing ? (
              <div className="flex items-center justify-center gap-1">
                <input autoFocus type="text" value={editMin} onChange={e => setEditMin(e.target.value.slice(0, 2))} onBlur={saveEdit} onKeyDown={e => e.key === 'Enter' && saveEdit()}
                  className="bg-white/10 w-20 text-5xl font-semibold tabular-nums text-white text-center rounded-lg border border-white/20 focus:outline-none" />
                <span className="text-4xl text-white/40">:</span>
                <input type="text" value={editSec} onChange={e => setEditSec(e.target.value.slice(0, 2))} onBlur={saveEdit} onKeyDown={e => e.key === 'Enter' && saveEdit()}
                  className="bg-white/10 w-20 text-5xl font-semibold tabular-nums text-white text-center rounded-lg border border-white/20 focus:outline-none" />
              </div>
            ) : (
              <div onClick={startEdit} className="text-6xl font-semibold tabular-nums text-white text-glow cursor-pointer hover:scale-105 transition-transform">{mm}:{ss}</div>
            )}
            <div className="mt-2 text-xs uppercase tracking-[0.2em] text-white/50">Cycles · {cycles}</div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setRunning(!running)} className="bg-white text-black hover:bg-white/90 h-11 px-6 rounded-full font-bold uppercase tracking-wider text-xs">
            {running ? <><Pause className="h-4 w-4 mr-2" /> Pause</> : <><Play className="h-4 w-4 mr-2" /> Start</>}
          </Button>
          <Button onClick={togglePiP} variant="ghost" className="text-white/70 hover:text-white h-11 w-11 p-0 rounded-full bg-white/5 border border-white/5">
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button onClick={() => { setRunning(false); setRemaining(total) }} variant="ghost" className="text-white/70 hover:text-white h-11 px-4 rounded-full">
            <RotateCcw className="h-4 w-4 mr-2" /> Reset
          </Button>
          <Button onClick={onComplete} variant="ghost" className="text-white/70 hover:text-white h-11 px-4 rounded-full text-xs uppercase tracking-widest font-bold">
            <SkipForward className="h-4 w-4 mr-2" /> Skip
          </Button>
        </div>

        {/* Do Not Disturb Toggle Row */}
        <div className="mt-6 w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/10">
          <div className="flex items-center gap-2.5">
            <BellOff className="h-4 w-4 text-orange-400" />
            <div>
              <div className="text-xs font-semibold text-white">Block Notifications in Focus</div>
              <div className="text-[10px] text-white/40">Silence alerts while timer is running</div>
            </div>
          </div>
          <Switch checked={blockNotifications} onCheckedChange={toggleBlockNotifications} />
        </div>

        <div className="mt-6 w-full grid grid-cols-3 gap-3 text-center text-xs text-white/60">
          <DurationField label="Focus" v={focusMin} set={setFocusMin} />
          <DurationField label="Short" v={shortMin} set={setShortMin} />
          <DurationField label="Long" v={longMin} set={setLongMin} />
        </div>
      </div>
    </Panel>
  )
}

/* ----------------------------- Calendar ----------------------------- */
interface AppEvent { 
  id: string; 
  title: string; 
  when: string; 
  isGoogle?: boolean; 
  calendarId?: string; 
  calendarConfigColor?: string; 
}

interface GoogleCalendarInfo {
  id: string;
  summary: string;
  backgroundColor?: string;
  foregroundColor?: string;
  primary?: boolean;
}

function CalendarPanel({ open, onClose, user, gEvents, setGEvents, googleToken, setGoogleToken }: { open: boolean, onClose: () => void, user: User | null, gEvents: AppEvent[], setGEvents: (e: AppEvent[]) => void, googleToken: string | null, setGoogleToken: (t: string | null) => void }) {
  const [localEvents, setLocalEvents] = useState<AppEvent[]>([])
  const [remoteEvents, setRemoteEvents] = useState<AppEvent[]>([])
  const [title, setTitle] = useState('')
  const [when, setWhen] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [view, setView] = useState<'month' | 'list'>('month')
  const [selectedDate, setSelectedDate] = useState(new Date())

  const [googleCalendars, setGoogleCalendars] = useState<GoogleCalendarInfo[]>(() => {
    try {
      const stored = localStorage.getItem('oblivion.google_calendars')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('oblivion.selected_calendar_ids')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  // Load local
  useEffect(() => {
    try {
      const raw = localStorage.getItem('oblivion.events')
      if (raw) setLocalEvents(JSON.parse(raw))
    } catch {}
  }, [])

  // Sync remote
  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'users', user.uid, 'events'))
    return onSnapshot(q, (snap) => {
      setRemoteEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as AppEvent)))
    }, (err) => handleFirestoreError(err, 'get', `users/${user.uid}/events`))
  }, [user])

  useEffect(() => {
    localStorage.setItem('oblivion.google_calendars', JSON.stringify(googleCalendars))
  }, [googleCalendars])

  useEffect(() => {
    localStorage.setItem('oblivion.selected_calendar_ids', JSON.stringify(selectedCalendarIds))
  }, [selectedCalendarIds])

  const syncGoogle = async () => {
    if (!user) return toast.error('Sign in to sync Google Calendar')
    setSyncing(true)
    try {
      let token = googleToken
      if (!token) {
        toast('Connecting to Google...', { icon: '🔄' })
        const res = await signInWithPopup(auth, googleProvider)
        const cred = GoogleAuthProvider.credentialFromResult(res)
        token = cred?.accessToken ?? null
        if (!token) throw new Error('No access token')
        setGoogleToken(token)
      }
      
      toast('Fetching calendar list...', { icon: '📅' })
      const listRes = await fetch('https://www.googleapis.com/calendar/v3/users/@me/calendarList', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const listData = await listRes.json()
      
      let fetchedCalendars: GoogleCalendarInfo[] = []
      if (listData.items) {
        fetchedCalendars = listData.items.map((item: any) => ({
          id: item.id,
          summary: item.summary,
          backgroundColor: item.backgroundColor || '#3b82f6',
          foregroundColor: item.foregroundColor || '#ffffff',
          primary: !!item.primary
        }))
        setGoogleCalendars(fetchedCalendars)
        if (selectedCalendarIds.length === 0) {
          setSelectedCalendarIds(fetchedCalendars.map(c => c.id))
        }
      }

      toast('Fetching events for calendars...', { icon: '📅' })
      const allEventsList: AppEvent[] = []
      const targetCalendars = fetchedCalendars.length > 0 ? fetchedCalendars : googleCalendars
      if (targetCalendars.length === 0) {
        targetCalendars.push({ id: 'primary', summary: 'Primary Calendar', backgroundColor: '#3b82f6', primary: true })
      }

      const minTime = new Date().toISOString()
      await Promise.all(targetCalendars.map(async (cal) => {
        try {
          const gRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?maxResults=100&timeMin=${minTime}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (!gRes.ok) return
          const data = await gRes.json()
          if (data.items) {
            const mapped = data.items.map((item: any) => ({
              id: item.id,
              title: item.summary || 'Google Event',
              when: item.start?.dateTime || item.start?.date || new Date().toISOString(),
              isGoogle: true,
              calendarId: cal.id,
              calendarConfigColor: cal.backgroundColor
            }))
            allEventsList.push(...mapped)
          }
        } catch (e) {
          console.error(`Error fetching calendar events for ${cal.id}:`, e)
        }
      }))

      setGEvents(allEventsList)
      toast.success(`Synced events from ${targetCalendars.length} calendars!`)
    } catch (err) {
      console.error(err)
      toast.error('Sync failed. Check browser permissions.')
    } finally { setSyncing(false) }
  }

  const add = async () => {
    if (!title.trim() || !when) return
    let gEventId: string | undefined = undefined;

    if (user && googleToken) {
      try {
        toast('Syncing event to Google Calendar...', { icon: '📅' })
        const startIso = new Date(when).toISOString()
        const endIso = new Date(new Date(when).getTime() + 60 * 60 * 1000).toISOString() // 1 hour duration
        const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${googleToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            summary: title.trim(),
            start: { dateTime: startIso },
            end: { dateTime: endIso }
          })
        })
        if (res.ok) {
          const data = await res.json()
          gEventId = data.id
          toast.success('Event synced to Google Calendar!')
        } else {
          console.error('Google Calendar event creation failed', await res.text())
        }
      } catch (err) {
        console.error('Google Calendar API error:', err)
      }
    }

    if (user) {
      try {
        const newEv = { 
          userId: user.uid, 
          title: title.trim(), 
          when,
          ...(gEventId ? { googleEventId: gEventId, isGoogle: true } : {})
        }
        await addDoc(collection(db, 'users', user.uid, 'events'), newEv)
      } catch (err) {
        handleFirestoreError(err, 'create', `users/${user.uid}/events`)
      }
    } else {
      const next = [...localEvents, { id: crypto.randomUUID(), title: title.trim(), when }].sort((a, b) => a.when.localeCompare(b.when))
      setLocalEvents(next)
      localStorage.setItem('oblivion.events', JSON.stringify(next))
    }
    setTitle(''); setWhen('')
  }

  const remove = async (id: string) => {
    if (user) {
      try {
        const eventToDel = remoteEvents.find(e => e.id === id)
        const gId = (eventToDel as any)?.googleEventId
        if (googleToken && gId) {
          try {
            await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${gId}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${googleToken}` }
            })
            toast.success('Removed from Google Calendar')
          } catch (err) {
            console.error('Failed to delete google calendar event:', err)
          }
        }
        await deleteDoc(doc(db, 'users', user.uid, 'events', id))
      } catch (err) {
        handleFirestoreError(err, 'delete', `users/${user.uid}/events/${id}`)
      }
    } else {
      const next = localEvents.filter(e => e.id !== id)
      setLocalEvents(next)
      localStorage.setItem('oblivion.events', JSON.stringify(next))
    }
  }

  const events = user ? remoteEvents : localEvents

  const monthName = selectedDate.toLocaleString('default', { month: 'long' })
  const year = selectedDate.getFullYear()
  const daysInMonth = new Date(year, selectedDate.getMonth() + 1, 0).getDate()
  const firstDay = new Date(year, selectedDate.getMonth(), 1).getDay()

  const filteredGEvents = useMemo(() => {
    if (googleCalendars.length === 0) return gEvents
    return gEvents.filter(e => {
      if (!e.calendarId) return true
      return selectedCalendarIds.includes(e.calendarId)
    })
  }, [gEvents, googleCalendars, selectedCalendarIds])

  const allEvents = useMemo(() => {
    return [...events, ...filteredGEvents].sort((a, b) => a.when.localeCompare(b.when))
  }, [events, filteredGEvents])

  const upcoming = allEvents.filter(e => new Date(e.when).getTime() >= Date.now() - 60000)

  return (
    <Panel open={open} onClose={onClose} title="Agenda" icon={<CalendarDays className="h-4 w-4" />} width="max-w-4xl">
      <div className="grid grid-cols-[320px_1fr] h-full min-h-0 bg-zinc-950">
        <div className="p-5 border-r border-white/10 flex flex-col min-h-0 bg-white/[0.015]">
          
          {/* Google Calendars Filtering Workspace */}
          {googleCalendars.length > 0 && (
            <div className="mb-6 bg-white/[0.02] border border-white/5 rounded-xl p-3">
              <div className="text-[9px] uppercase tracking-[0.2em] text-white/40 mb-3 font-semibold flex items-center justify-between">
                <span>Google Calendars</span>
                <button onClick={syncGoogle} className="text-white/60 hover:text-white transition-colors text-[9px] uppercase font-bold tracking-widest bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/5">Sync</button>
              </div>
              <div className="space-y-2 max-h-[140px] overflow-y-auto thin-scroll pr-1">
                {googleCalendars.map(cal => {
                  const isChecked = selectedCalendarIds.includes(cal.id)
                  return (
                    <label key={cal.id} className="flex items-center gap-2.5 cursor-pointer group py-1">
                      <input 
                        type="checkbox" 
                        checked={isChecked} 
                        onChange={() => {
                          if (isChecked) {
                            setSelectedCalendarIds(selectedCalendarIds.filter(id => id !== cal.id))
                          } else {
                            setSelectedCalendarIds([...selectedCalendarIds, cal.id])
                          }
                        }}
                        className="accent-white rounded bg-transparent h-3.5 w-3.5 border border-white/20 text-white focus:ring-0 focus:ring-offset-0"
                      />
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: cal.backgroundColor || '#3b82f6' }} />
                      <span className="text-[11px] text-white/70 group-hover:text-white transition-colors truncate flex-1">{cal.summary}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-4 font-bold flex items-center justify-between">
            <span>Add Event</span>
            {!googleCalendars.length && (
              <button onClick={syncGoogle} className="hover:text-white transition-colors bg-white/5 px-2 py-0.5 rounded text-[9px]">Google Sync</button>
            )}
          </div>
          <div className="space-y-3">
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="What's happening?"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 h-10 text-sm" />
            <div className="space-y-2">
              <input type="datetime-local" value={when} onChange={e => setWhen(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-white/30" />
              <Button onClick={add} className="w-full bg-white/10 hover:bg-white/20 h-10 text-sm uppercase tracking-widest font-bold">Add to Agenda</Button>
            </div>
          </div>
          
          <div className="mt-8 flex-1 overflow-auto thin-scroll">
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-3 font-bold">Upcoming</div>
            <div className="space-y-1">
              {upcoming.length === 0 && <div className="text-white/20 text-[11px] py-4 text-center italic font-medium">A blank page exists ahead…</div>}
              {upcoming.map(e => (
                <div key={e.id} className="group flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-all">
                  <div 
                    className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 glow-pulse" 
                    style={{ backgroundColor: e.isGoogle ? (e.calendarConfigColor || '#3b82f6') : 'rgba(255,255,255,0.7)' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-white/90 truncate font-semibold">{e.title}</div>
                    <div className="text-[10px] text-white/30 font-mono mt-0.5">{new Date(e.when).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(e.when).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                  </div>
                  {!e.isGoogle && (
                    <button onClick={() => remove(e.id)} className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all p-1">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col min-h-0 bg-black/30">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-lg font-bold text-white tracking-tight">{monthName} <span className="text-white/30">{year}</span></span>
              <div className="flex bg-white/5 rounded-lg p-0.5">
                <button onClick={() => setSelectedDate(new Date(year, selectedDate.getMonth() - 1, 1))} className="p-1 hover:text-white text-white/40"><ChevronRight className="h-4 w-4 rotate-180" /></button>
                <button onClick={() => setSelectedDate(new Date(year, selectedDate.getMonth() + 1, 1))} className="p-1 hover:text-white text-white/40"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="flex bg-white/5 rounded-lg p-1 text-[10px] font-bold uppercase tracking-wider">
              <button onClick={() => setView('month')} className={`px-3 py-1 rounded-md transition-all ${view === 'month' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}>Grid</button>
              <button onClick={() => setView('list')} className={`px-3 py-1 rounded-md transition-all ${view === 'list' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}>Flow</button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-5 thin-scroll">
            {view === 'month' ? (
              <div className="grid grid-cols-7 gap-px bg-white/5 border border-white/5 rounded-xl overflow-hidden shadow-2xl">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="bg-white/[0.02] py-2 text-center text-[10px] font-bold uppercase tracking-widest text-white/30 border-b border-white/5">{d}</div>
                ))}
                {Array.from({ length: 42 }).map((_, i) => {
                  const day = i - firstDay + 1
                  const isCurrentMonth = day > 0 && day <= daysInMonth
                  const isToday = isCurrentMonth && day === new Date().getDate() && selectedDate.getMonth() === new Date().getMonth() && year === new Date().getFullYear()
                  const dateStr = isCurrentMonth ? `${year}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : null
                  const dayEvents = dateStr ? allEvents.filter(e => e.when.startsWith(dateStr)) : []

                  return (
                    <div key={i} className={`min-h-[90px] p-2 bg-black/20 relative group transition-colors ${isCurrentMonth ? 'hover:bg-white/[0.04]' : 'opacity-20 pointer-events-none'}`}>
                      <span className={`text-[11px] font-mono ${isToday ? 'h-6 w-6 bg-white text-black rounded-full flex items-center justify-center font-bold' : 'text-white/40'}`}>
                        {isCurrentMonth ? day : ''}
                      </span>
                      <div className="mt-2 space-y-1">
                        {dayEvents.slice(0, 3).map(e => (
                          e.isGoogle ? (
                            <div 
                              key={e.id} 
                              className="text-[9px] px-1.5 py-0.5 rounded border truncate font-medium"
                              style={{ 
                                backgroundColor: `${e.calendarConfigColor || '#3b82f6'}1a`,
                                borderColor: `${e.calendarConfigColor || '#3b82f6'}4d`,
                                color: e.calendarConfigColor || '#93c5fd' 
                              }}
                            >
                              {e.title}
                            </div>
                          ) : (
                            <div key={e.id} className="text-[9px] px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-white/70 truncate animate-fade-in font-medium">
                              {e.title}
                            </div>
                          )
                        ))}
                        {dayEvents.length > 3 && <div className="text-[8px] text-white/20 pl-1">+{dayEvents.length - 3} more</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in pr-1">
                {allEvents.filter(e => {
                  const dateVal = new Date(e.when)
                  return dateVal.getFullYear() === year && dateVal.getMonth() === selectedDate.getMonth()
                }).length === 0 ? (
                  <div className="text-white/30 text-xs text-center py-16 italic border border-white/5 rounded-2xl bg-white/[0.01]">
                    No items scheduled for {monthName} {year}
                  </div>
                ) : (
                  <div className="relative border-l border-white/10 pl-5 ml-2 space-y-4">
                    {allEvents.filter(e => {
                      const dateVal = new Date(e.when)
                      return dateVal.getFullYear() === year && dateVal.getMonth() === selectedDate.getMonth()
                    }).map((e, index) => {
                      const dateObj = new Date(e.when)
                      const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      const dateStr = dateObj.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
                      return (
                        <div key={e.id || index} className="relative group flex items-start justify-between gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                          <div className="absolute -left-[26px] top-[22px] h-3 w-3 rounded-full border-2 border-zinc-950 flex items-center justify-center bg-zinc-900">
                            <span 
                              className="h-1.5 w-1.5 rounded-full" 
                              style={{ backgroundColor: e.isGoogle ? (e.calendarConfigColor || '#3b82f6') : 'rgba(255,255,255,0.7)' }}
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="text-[14px] text-white font-semibold truncate tracking-wide">{e.title}</div>
                            <div className="flex items-center gap-3 text-[10px] text-white/40 mt-1.5 font-mono">
                              <span className="text-white/60">{dateStr}</span>
                              <span>·</span>
                              <span>{timeStr}</span>
                              {e.isGoogle && (
                                <>
                                  <span>·</span>
                                  <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest text-[#93c5fd]" style={{ backgroundColor: `${e.calendarConfigColor || '#3b82f6'}20`, color: e.calendarConfigColor || '#93c5fd' }}>
                                    Google
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {!e.isGoogle && (
                            <button onClick={() => remove(e.id)} className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-400 transition-all p-1.5 bg-white/5 rounded-lg border border-white/5">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Panel>
  )
}

/* ----------------------------- Spotify ----------------------------- */
function SpotifyPanel({ open, onClose, playlistId, setPlaylistId, connectSpotify, user }: { 
  open: boolean, 
  onClose: () => void, 
  playlistId: string, 
  setPlaylistId: (id: string) => void, 
  connectSpotify: () => void, 
  user: User | null
}) {
  const [isConnected, setIsConnected] = useState(false)
  const [playerActivated, setPlayerActivated] = useState(false)

  useEffect(() => {
    if (!user) return
    return onSnapshot(doc(db, 'users', user.uid, 'integrations', 'spotify'), (snap) => {
      setIsConnected(snap.exists())
    }, (err) => handleFirestoreError(err, 'get', `users/${user.uid}/integrations/spotify`))
  }, [user])

  useEffect(() => {
    if (open && !playerActivated) {
      setPlayerActivated(true)
    }
  }, [open, playerActivated])

  const activePlaylist = PLAYLISTS.find(p => p.id === playlistId) || PLAYLISTS[0]

  return (
    <div 
      className={`fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 transition-all duration-300 ${
        open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/75 backdrop-blur-md" 
        onClick={onClose} 
      />

      {/* Main Split Window Container */}
      <div className={`relative glass-strong rounded-2xl w-full max-w-5xl h-[82vh] max-h-[720px] overflow-hidden flex flex-col shadow-2xl border border-white/20 z-10 transition-all duration-300 ${
        open ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
      }`}>
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-black/50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-white/10 text-white">
              <Music2 className="h-4 w-4" />
            </div>
            <span className="font-semibold text-sm text-white tracking-wide">Focus Playlists</span>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            aria-label="Close Spotify Panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Content Split Layout */}
        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-white/10">
          
          {/* Left Column: Curation & Playlist Selection */}
          <div className="w-full md:w-1/2 p-6 md:p-8 space-y-6 overflow-y-auto thin-scroll flex flex-col justify-between">
            <div className="space-y-6">
              <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.25em] text-white/30 font-bold mb-1">Curation</div>
                  <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">Choose your vibe</h2>
                </div>
                <button onClick={connectSpotify} className={`px-4 py-2 rounded-xl text-[10px] uppercase font-bold tracking-widest flex items-center gap-2 border transition-all h-fit ${isConnected ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-white/5 border-white/10 text-white/50 hover:bg-green-500/10 hover:border-green-500/30 hover:text-green-400'}`}>
                  {isConnected ? <><Check className="h-4 w-4" /> Connected</> : <><Music2 className="h-4 w-4" /> Link Spotify</>}
                </button>
              </header>

              <div className="grid grid-cols-1 gap-2.5">
                {PLAYLISTS.map(p => {
                  const isSelected = playlistId === p.id
                  return (
                    <button 
                      key={p.id} 
                      onClick={() => {
                        setPlaylistId(p.id)
                        if (!playerActivated) setPlayerActivated(true)
                      }}
                      className={`group relative p-4 rounded-2xl transition-all border flex items-center justify-between text-left overflow-hidden ${
                        isSelected 
                          ? 'bg-white text-black border-white shadow-xl shadow-white/10 scale-[1.01]' 
                          : 'bg-white/[0.03] text-white border-white/5 hover:border-white/20 hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`shrink-0 h-11 w-11 rounded-xl flex items-center justify-center transition-colors ${isSelected ? 'bg-black/10' : 'bg-white/5 group-hover:bg-white/10'}`}>
                          <Music2 className={`h-5 w-5 ${isSelected ? 'text-black' : 'text-white/40'}`} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className={`text-[12px] font-black uppercase tracking-[0.12em] truncate ${isSelected ? 'text-black' : 'text-white'}`}>{p.name}</span>
                          <span className={`text-[10px] font-medium ${isSelected ? 'text-black/60' : 'text-white/40'}`}>
                            {isSelected ? 'Loaded in Player' : 'Click to load playlist'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isSelected ? (
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-black text-white">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                            Playing
                          </span>
                        ) : (
                          <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 p-4 flex items-center gap-3 bg-white/[0.01] mt-4">
              <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-white/30" />
              </div>
              <div>
                <div className="text-[11px] text-white/70 font-bold uppercase tracking-wider">Background Audio</div>
                <div className="text-[10px] text-white/30 leading-tight">Closing this window keeps your audio playing seamlessly in the background.</div>
              </div>
            </div>
          </div>

          {/* Right Column: Spotify Window Embed (Facade / Lazy Loaded) */}
          <div className="w-full md:w-1/2 p-6 md:p-8 bg-black/40 flex flex-col h-full min-h-[400px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest text-white/80">Spotify Player</span>
              </div>
              <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/5 border border-white/10">{activePlaylist.name}</span>
            </div>

            <div className="flex-1 w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-950 relative min-h-[350px]">
              {playerActivated ? (
                <iframe 
                  key={playlistId} 
                  title="Spotify Player Window"
                  src={`https://open.spotify.com/embed/playlist/${playlistId}?utm_source=oblivion&theme=0`}
                  width="100%" 
                  height="100%" 
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                  loading="lazy" 
                  className="w-full h-full rounded-2xl"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-black/60">
                  <Music2 className="h-12 w-12 text-[#e8702a] mb-3 animate-pulse" />
                  <p className="text-sm font-semibold text-white mb-2">Focus Playlist Facade</p>
                  <button 
                    onClick={() => setPlayerActivated(true)}
                    className="px-5 py-2.5 rounded-full bg-[#e8702a] hover:bg-[#d2611f] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg"
                  >
                    Start Spotify Player
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

/* ----------------------------- Settings ----------------------------- */
function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.25em] text-white/40 mb-3">{title}</div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}
function Row({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="text-sm text-white/80">{label}</div>
      <div>{children}</div>
    </div>
  )
}
interface AppSettings { name: string; showGreeting: boolean; bgId: string; rain: number; blur: number; dim: number; grain: boolean; clockSize: number; keepAwake: boolean }
function SettingsPanel({ open, onClose, settings, setSettings, user, login, logout, connectSpotify, onOpenChangelog, onOpenExtensionModal, onOpenCookieModal }: { open: boolean, onClose: () => void, settings: AppSettings, setSettings: (s: AppSettings) => void, user: User | null, login: () => void, logout: () => void, connectSpotify: () => void, onOpenChangelog: () => void, onOpenExtensionModal: () => void, onOpenCookieModal: () => void }) {
  const upd = (k: keyof AppSettings, v: any) => setSettings({ ...settings, [k]: v })
  return (
    <Panel open={open} onClose={onClose} title="Settings" icon={<SettingsIcon className="h-4 w-4" />} width="max-w-xl">
      <div className="p-5 space-y-6 overflow-auto thin-scroll max-h-[70vh]">
        <Section title="Cloud Sync">
          {!user ? (
            <Button onClick={login} className="w-full bg-white text-black hover:bg-white/90">
              <Sparkles className="h-4 w-4 mr-2" /> Sign in with Google
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl">
                <div className="flex items-center gap-3">
                  <img src={user.photoURL || ''} className="h-8 w-8 rounded-full" alt="" />
                  <div>
                    <div className="text-xs font-bold text-white">{user.displayName}</div>
                    <div className="text-[10px] text-white/40">{user.email}</div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={logout} className="text-[10px] uppercase tracking-widest text-white/40 hover:text-red-400">Sign Out</Button>
              </div>
              <div className="text-[10px] text-white/40 italic px-1">Settings, notes, and tasks are now synced across devices.</div>
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-white/10 gap-3 flex">
             <Button variant="outline" onClick={connectSpotify} className="w-full border-white/10 text-white/80 hover:bg-white/5 h-10 text-[10px] uppercase tracking-wider font-bold">
                <Music2 className="h-3.5 w-3.5 mr-2" /> Spotify
             </Button>
          </div>
        </Section>
        <Section title="Display & Power">
          <Row label="Keep Screen Awake (Prevents Sleep)">
            <Switch checked={settings.keepAwake ?? true} onCheckedChange={v => upd('keepAwake', v)} />
          </Row>
        </Section>
        <Section title="Atmosphere">
          <Row label={`Rain intensity · ${settings.rain}%`}>
            <Slider value={[settings.rain]} min={0} max={100} step={1} onValueChange={v => upd('rain', v[0])} className="max-w-xs w-48" />
          </Row>
          <Row label={`Background blur · ${settings.blur}px`}>
            <Slider value={[settings.blur]} min={0} max={20} step={1} onValueChange={v => upd('blur', v[0])} className="max-w-xs w-48" />
          </Row>
          <Row label={`Dim · ${settings.dim}%`}>
            <Slider value={[settings.dim]} min={0} max={80} step={1} onValueChange={v => upd('dim', v[0])} className="max-w-xs w-48" />
          </Row>
          <Row label="Film grain">
            <Switch checked={settings.grain} onCheckedChange={v => upd('grain', v)} />
          </Row>
        </Section>
        <Section title="Clock">
          <Row label={`Clock size · ${settings.clockSize.toFixed(2)}x`}>
            <Slider value={[settings.clockSize * 100]} min={60} max={140} step={2}
              onValueChange={v => upd('clockSize', v[0] / 100)} className="max-w-xs w-48" />
          </Row>
        </Section>
        <div className="pt-4 border-t border-white/10 flex flex-col items-center gap-3">
          <button
            onClick={() => {
              onClose()
              onOpenExtensionModal()
            }}
            className="w-full flex items-center justify-between text-xs text-emerald-400 hover:text-emerald-300 font-bold uppercase tracking-wider transition-all py-2.5 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 group"
          >
            <div className="flex items-center gap-2">
              <Puzzle className="h-4 w-4 text-emerald-400" />
              <span>Chrome Popup Extension & DND Shield</span>
            </div>
            <ArrowUpRight className="h-4 w-4 text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
          <button
            onClick={() => {
              onClose()
              onOpenCookieModal()
            }}
            className="w-full flex items-center justify-between text-xs text-sky-400 hover:text-sky-300 font-bold uppercase tracking-wider transition-all py-2.5 px-4 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 group"
          >
            <div className="flex items-center gap-2">
              <Cookie className="h-4 w-4 text-sky-400" />
              <span>Cookie & Privacy Preferences</span>
            </div>
            <ArrowUpRight className="h-4 w-4 text-sky-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
          <button
            onClick={() => {
              onClose()
              onOpenChangelog()
            }}
            className="w-full flex items-center justify-between text-xs text-orange-400 hover:text-orange-300 font-bold uppercase tracking-wider transition-all py-2.5 px-4 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 group"
          >
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-orange-400" />
              <span>Changelog & Release Notes</span>
            </div>
            <ArrowUpRight className="h-4 w-4 text-orange-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
          <div className="text-center text-xs text-white/50 font-medium">
            Made with love ❤️ by <a href="https://github.com/itsjustayush" target="_blank" rel="noopener noreferrer" className="hover:underline text-white/70 hover:text-white transition-colors">Ayush Bhattacharya</a>
          </div>
        </div>
      </div>
    </Panel>
  )
}

/* ----------------------------- Dock ----------------------------- */
const DOCK_ITEMS = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'notes', icon: StickyNote, label: 'Google Keep' },
  { id: 'tasks', icon: ListChecks, label: 'Checklist' },
  { id: 'stats', icon: BarChart2, label: 'Stats' },
  { id: 'pomo', icon: Timer, label: 'Pomodoro' },
  { id: 'cal', icon: CalendarDays, label: 'Agenda' },
  { id: 'music', icon: Music2, label: 'Music' },
  { id: 'extension', icon: Puzzle, label: 'Chrome Ext' },
  { id: 'settings', icon: SettingsIcon, label: 'Settings' },
  { id: 'fs', icon: Maximize2, label: 'Fullscreen' },
] as const
function Dock({ onAction, isFullscreen }: { onAction: (id: string) => void, isFullscreen: boolean }) {
  const [hovered, setHovered] = useState<string | null>(null)
  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="fixed left-1/2 -translate-x-1/2 bottom-6 z-30"
    >
      <div className="glass dock-shadow rounded-full px-2 py-2 flex items-center gap-1 overflow-x-auto no-scrollbar max-w-[90vw]">
        {DOCK_ITEMS.map(it => {
          const Icon = it.id === 'fs' && isFullscreen ? Minimize2 : it.icon
          return (
            <div key={it.id} className="relative">
              <AnimatePresence>
                {hovered === it.id && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                    className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md text-[11px] bg-black/70 border border-white/10 text-white/90 whitespace-nowrap">
                    {it.label}
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.button
                onMouseEnter={() => setHovered(it.id)} onMouseLeave={() => setHovered(null)}
                onClick={() => onAction(it.id)}
                whileHover={{ scale: 1.18, y: -6 }} whileTap={{ scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                className="h-11 w-11 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                aria-label={it.label}
              >
                <Icon className="h-5 w-5" />
              </motion.button>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

/* ----------------------------- Quote Pill ----------------------------- */
const CURATED_QUOTES = [
  { q: "Deep work is the ability to focus without distraction on a cognitively demanding task.", a: "Cal Newport" },
  { q: "Focus is a muscle. The more you practice it, the stronger it gets.", a: "Anonymous" },
  { q: "Concentrate all your thoughts upon the work at hand. The sun's rays do not burn until brought to a focus.", a: "Alexander Graham Bell" },
  { q: "Simplicity boils down to two steps: Eliminate the nonessential, focus on what matters.", a: "Leo Babauta" },
  { q: "Action is the foundational key to all success.", a: "Pablo Picasso" },
  { q: "Your mind is for having ideas, not holding them.", a: "David Allen" }
]

function QuotePill() {
  const [q, setQ] = useState<{ q: string; a: string } | null>(null)
  useEffect(() => {
    const randomQuote = CURATED_QUOTES[Math.floor(Math.random() * CURATED_QUOTES.length)]
    setQ(randomQuote)
  }, [])
  if (!q) return null
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2, duration: 1 }}
      className="fixed bottom-28 left-8 text-left w-full max-w-xs z-50 hidden md:block pointer-events-auto">
      <div className="italic font-serif text-lg text-white/80 leading-relaxed drop-shadow-md">&ldquo;{q.q}&rdquo;</div>
      <div className="mt-2 text-[9px] uppercase tracking-[0.25em] text-white/50 font-medium">— {q.a}</div>
    </motion.div>
  )
}

/* ----------------------------- App ----------------------------- */
const DEFAULT_SETTINGS: AppSettings = {
  name: '', showGreeting: true, bgId: 'starry-night',
  rain: 55, blur: 4, dim: 45, grain: true, clockSize: 1, keepAwake: true,
}

const App = () => {
  const [user, setUser] = useState<User | null>(null)
  const [googleToken, setGoogleTokenState] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('oblivion.google_token') || null
    } catch {
      return null
    }
  })

  const setGoogleToken = useCallback((token: string | null) => {
    setGoogleTokenState(token)
    try {
      if (token) {
        sessionStorage.setItem('oblivion.google_token', token)
      } else {
        sessionStorage.removeItem('oblivion.google_token')
      }
    } catch {}
  }, [])

  const [settings, setSettings] = useSynced<AppSettings>('oblivion.settings', DEFAULT_SETTINGS, user)
  const [open, setOpen] = useState<string | null>(null)
  const [cookieModalOpen, setCookieModalOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [playlistId, setPlaylistId] = useState(PLAYLISTS[0].id)
  const [mounted, setMounted] = useState(false)

  const [gEvents, setGEvents] = useState<AppEvent[]>([])

  // Screen Wake Lock API: Prevent display shut off during focus sessions
  useEffect(() => {
    let wakeLock: any = null
    const requestWakeLock = async () => {
      if ((settings.keepAwake ?? true) && 'wakeLock' in navigator) {
        try {
          wakeLock = await (navigator as any).wakeLock.request('screen')
        } catch {}
      }
    }

    requestWakeLock()

    const handleVisibilityChange = () => {
      if (wakeLock !== null && document.visibilityState === 'visible' && (settings.keepAwake ?? true)) {
        requestWakeLock()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (wakeLock) {
        wakeLock.release().catch(() => {})
      }
    }
  }, [settings.keepAwake])

  // Pomodoro State Lifted
  const [pomoMode, setPomoMode] = useState<'focus' | 'short' | 'long'>('focus')
  const [pomoFocusMin, setPomoFocusMin] = useLocal('oblivion.pomodoro.focus', 25)
  const [pomoShortMin, setPomoShortMin] = useLocal('oblivion.pomodoro.short', 5)
  const [pomoLongMin, setPomoLongMin] = useLocal('oblivion.pomodoro.long', 15)
  const [pomoRunning, setPomoRunning] = useState(false)
  const [pomoCycles, setPomoCycles] = useLocal('oblivion.pomodoro.cycles', 0)
  
  const pomoTotal = useMemo(() => (pomoMode === 'focus' ? pomoFocusMin : pomoMode === 'short' ? pomoShortMin : pomoLongMin) * 60, [pomoMode, pomoFocusMin, pomoShortMin, pomoLongMin])
  const [pomoRemaining, setPomoRemaining] = useState(pomoTotal)

  const handlePomoComplete = useCallback(() => {
    const playNotification = (type: 'focus' | 'break') => {
      const url = type === 'focus' 
        ? 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg' 
        : 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg';
      const audio = new Audio(url);
      audio.volume = 0.5;
      audio.play().catch(() => {});
    };

    if (pomoMode === 'focus') {
      setPomoCycles(c => c + 1)
      toast.success('Focus session complete · take a break')
      playNotification('focus');
      
      if (user) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const day = days[new Date().getDay()]
        addDoc(collection(db, 'users', user.uid, 'sessions'), {
          userId: user.uid,
          duration: pomoFocusMin,
          timestamp: Date.now(),
          day: day
        }).catch(err => handleFirestoreError(err, 'create', `users/${user.uid}/sessions`))
      }

      setPomoMode((pomoCycles + 1) % 4 === 0 ? 'long' : 'short')
    } else {
      toast('Break is over · back to focus')
      playNotification('break');
      setPomoMode('focus')
    }
  }, [pomoMode, pomoCycles, setPomoCycles, user, pomoFocusMin])

  useEffect(() => {
    setMounted(true)
    return onAuthStateChanged(auth, (u) => setUser(u))
  }, [])

  useEffect(() => {
    setPomoRemaining(pomoTotal)
    setPomoRunning(false)
  }, [pomoMode, pomoFocusMin, pomoShortMin, pomoLongMin, pomoTotal])

  useEffect(() => {
    if (!pomoRunning) return
    const id = setInterval(() => {
      setPomoRemaining(r => {
        if (r <= 1) {
          clearInterval(id)
          setPomoRunning(false)
          handlePomoComplete()
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [pomoRunning, handlePomoComplete])

  const login = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider)
      const cred = GoogleAuthProvider.credentialFromResult(res)
      const token = cred?.accessToken ?? null
      if (token) {
        setGoogleToken(token)
      }
      if (res.user && !settings.name) setSettings(s => ({ ...s, name: res.user.displayName || '' }))
    } catch (err) {
      toast.error('Sign in failed')
    }
  }

  const logout = () => {
    setGoogleToken(null)
    signOut(auth)
  }

  const connectSpotify = async () => {
    try {
      const res = await fetch('/api/auth/spotify/url')
      const { url } = await res.json()
      window.open(url, 'spotify_auth', 'width=600,height=700')
    } catch {
      toast.error('Failed to initiate Spotify connection')
    }
  }

  useEffect(() => {
    const handleMessage = async (e: MessageEvent) => {
      // Valid origins for postMessage
      const origin = e.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) return;

      if (e.data?.type === 'SPOTIFY_AUTH_SUCCESS' && e.data?.code) {
        toast('Syncing with Spotify...', { icon: '🎵' })
        try {
          const response = await fetch('/api/auth/spotify/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: e.data.code })
          })
          const tokens = await response.json()
          
          if (tokens.access_token && user) {
            await setDoc(doc(db, 'users', user.uid, 'integrations', 'spotify'), {
              ...tokens,
              updatedAt: Date.now()
            })
            toast.success('Spotify connected successfully')
          }
        } catch (err) {
          toast.error('Failed to link Spotify account')
        }
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [user])

  const toggleFullscreen = useCallback(() => {
    if (typeof document === 'undefined') return
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }, [])

  const dispatch = (id: string) => {
    if (id === 'home') setOpen(null)
    else if (id === 'fs') toggleFullscreen()
    else if (['notes', 'tasks', 'stats', 'pomo', 'cal', 'music', 'settings', 'changelogs', 'extension'].includes(id)) setOpen(id)
  }

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      const k = e.key.toLowerCase()
      if (k === 'escape') return setOpen(null)
      if (k === 'n') setOpen('notes')
      else if (k === 'v') setOpen('canvas')
      else if (k === 't') setOpen('tasks')
      else if (k === 's') setOpen('stats')
      else if (k === 'p') setOpen('pomo')
      else if (k === 'c') setOpen('cal')
      else if (k === 'm') setOpen('music')
      else if (k === ',') setOpen('settings')
      else if (k === 'f') toggleFullscreen()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleFullscreen])

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-[#e0d8d0] font-sans selection:bg-[#e8702a]/30">
      <CustomCursor />
      <Toaster position="top-right" toastOptions={{ className: 'glass text-white border-white/20' }} />

      {/* Hero Section */}
      <section className="relative w-full h-screen overflow-hidden bg-black" style={{ height: '100dvh' }}>
        {/* Base geological landscape image (z-10) with slow zoom */}
        <div
          className="absolute inset-0 bg-center bg-cover bg-no-repeat z-10 hero-zoom"
          style={{ backgroundImage: `url(${BG_IMAGE_1})` }}
        />

        {/* Reveal image layer (z-30) */}
        <RevealLayer image={BG_IMAGE_2} />

        {/* Rain animation if enabled */}
        {mounted && settings.rain > 0 && <Rain intensity={settings.rain} />}
        {mounted && settings.grain && <div className="grain z-20 pointer-events-none" />}

        {/* Top Fixed Navigation Bar */}
        <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between p-4 sm:p-6">
          {/* Brand wordmark pointing to repository */}
          <a href="https://github.com/itsjustayush/oblivion" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 cursor-pointer group">
            <span className="text-white text-2xl font-playfair italic tracking-tight drop-shadow-md hover:text-white/90 transition-colors">Oblivion</span>
          </a>

          {/* Center Glassmorphism Pill Menu */}
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-xl border border-white/15 rounded-full px-2 py-1.5 items-center gap-1 shadow-2xl">
            <button
              onClick={() => setOpen('pomo')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${open === 'pomo' ? 'bg-[#e8702a] text-white font-semibold shadow-md shadow-[#e8702a]/30' : 'text-white/80 hover:bg-white/20 hover:text-white'}`}
            >
              Pomodoro
            </button>
            <button
              onClick={() => setOpen('tasks')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${open === 'tasks' ? 'bg-[#e8702a] text-white font-semibold shadow-md shadow-[#e8702a]/30' : 'text-white/80 hover:bg-white/20 hover:text-white'}`}
            >
              Tasks
            </button>
            <button
              onClick={() => setOpen('cal')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${open === 'cal' ? 'bg-[#e8702a] text-white font-semibold shadow-md shadow-[#e8702a]/30' : 'text-white/80 hover:bg-white/20 hover:text-white'}`}
            >
              Calendar
            </button>
            <button
              onClick={() => setOpen('notes')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${open === 'notes' ? 'bg-[#e8702a] text-white font-semibold shadow-md shadow-[#e8702a]/30' : 'text-white/80 hover:bg-white/20 hover:text-white'}`}
            >
              Notes
            </button>
            <button
              onClick={() => setOpen('canvas')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${open === 'canvas' ? 'bg-[#e8702a] text-white font-semibold shadow-md shadow-[#e8702a]/30' : 'text-white/80 hover:bg-white/20 hover:text-white'}`}
            >
              Canvas
            </button>
            <button
              onClick={() => setOpen('music')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${open === 'music' ? 'bg-[#e8702a] text-white font-semibold shadow-md shadow-[#e8702a]/30' : 'text-white/80 hover:bg-white/20 hover:text-white'}`}
            >
              Music
            </button>
            <button
              onClick={() => setOpen('stats')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${open === 'stats' ? 'bg-[#e8702a] text-white font-semibold shadow-md shadow-[#e8702a]/30' : 'text-white/80 hover:bg-white/20 hover:text-white'}`}
            >
              Stats
            </button>
            <button
              onClick={() => setOpen('settings')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${open === 'settings' ? 'bg-[#e8702a] text-white font-semibold shadow-md shadow-[#e8702a]/30' : 'text-white/80 hover:bg-white/20 hover:text-white'}`}
              title="Settings"
            >
              <SettingsIcon className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Right Account Sign In */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen('settings')}
              className="md:hidden p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white/80 hover:text-white"
              title="Settings"
            >
              <SettingsIcon className="h-4 w-4" />
            </button>
            {!user ? (
              <button
                onClick={login}
                className="bg-[#e8702a] hover:bg-[#d2611f] text-white text-xs font-semibold px-5 py-2 rounded-full transition-all shadow-lg active:scale-95 flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Sign In
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/20 rounded-full px-3 py-1.5 shadow-lg">
                <img src={user.photoURL || ''} className="w-6 h-6 rounded-full border border-[#e8702a]/50" alt="" />
                <span className="text-xs font-medium text-white hidden sm:inline">{user.displayName}</span>
                <button onClick={logout} className="text-[10px] uppercase font-mono text-white/50 hover:text-[#e8702a] pl-1">Out</button>
              </div>
            )}
          </div>
        </nav>

        {/* Integrated Central Clock/Timer Hub in exact screen center */}
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center pt-28 sm:pt-36 md:pt-40 px-6 pointer-events-none">
          <div className="pointer-events-auto flex flex-col items-center max-w-sm w-full">
            <Clock size={settings.clockSize} />

            {/* Pomodoro controls in center - sleek, frameless & transparent */}
            <div className="mt-5 w-full flex flex-col items-center gap-3">
              {/* Mode Pills */}
              <div className="flex items-center gap-1.5 p-1 rounded-full justify-center">
                <button
                  onClick={() => { setPomoMode('focus'); setPomoRunning(false); }}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${pomoMode === 'focus' ? 'bg-[#e8702a] text-white font-semibold shadow-lg shadow-[#e8702a]/35 ring-1 ring-[#e8702a]/50' : 'text-white/80 hover:text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm'}`}
                >
                  Focus ({pomoFocusMin}m)
                </button>
                <button
                  onClick={() => { setPomoMode('short'); setPomoRunning(false); }}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${pomoMode === 'short' ? 'bg-[#e8702a] text-white font-semibold shadow-lg shadow-[#e8702a]/35 ring-1 ring-[#e8702a]/50' : 'text-white/80 hover:text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm'}`}
                >
                  Short ({pomoShortMin}m)
                </button>
                <button
                  onClick={() => { setPomoMode('long'); setPomoRunning(false); }}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${pomoMode === 'long' ? 'bg-[#e8702a] text-white font-semibold shadow-lg shadow-[#e8702a]/35 ring-1 ring-[#e8702a]/50' : 'text-white/80 hover:text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm'}`}
                >
                  Long ({pomoLongMin}m)
                </button>
              </div>

              {/* Digital countdown & Play/Pause */}
              <div className="flex items-center justify-center gap-4 py-1 px-4">
                <span className="font-mono text-3xl sm:text-4xl font-bold tracking-wider text-white text-glow">
                  {Math.floor(pomoRemaining / 60).toString().padStart(2, '0')}:{(pomoRemaining % 60).toString().padStart(2, '0')}
                </span>
                <button
                  onClick={() => setPomoRunning(!pomoRunning)}
                  className="w-10 h-10 rounded-full bg-[#e8702a] hover:bg-[#d2611f] text-white flex items-center justify-center transition-all shadow-lg shadow-[#e8702a]/35 hover:scale-105 active:scale-95"
                  title={pomoRunning ? 'Pause' : 'Start'}
                >
                  {pomoRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                </button>
                <button
                  onClick={() => { setPomoRunning(false); setPomoRemaining(pomoTotal); }}
                  className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white/70 hover:text-white flex items-center justify-center transition-all backdrop-blur-sm"
                  title="Reset"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Cycle indicator dots */}
              <div className="flex items-center gap-1.5 mt-0.5">
                {[0, 1, 2, 3].map(i => (
                  <div
                    key={i}
                    className={`h-2 w-2 rounded-full transition-all ${i < (pomoCycles % 4) ? 'bg-[#e8702a] shadow-md shadow-[#e8702a]/60' : 'bg-white/20'}`}
                  />
                ))}
                <span className="text-[10px] text-white/60 font-mono ml-2">Streak: {pomoCycles}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Weather Widget */}
        <WeatherWidget />
      </section>

      {/* Bottom Left Corner Attribution */}
      <div className="fixed bottom-6 left-6 z-[120] text-xs text-white/80 backdrop-blur-xl bg-black/40 px-3.5 py-1.5 rounded-full border border-white/15 shadow-xl pointer-events-auto select-none flex items-center gap-1.5 font-medium">
        Made with love ❤️ by <a href="https://github.com/itsjustayush" target="_blank" rel="noopener noreferrer" className="hover:underline text-white transition-colors">Ayush Bhattacharya</a>
      </div>

      {/* Quote Pill */}
      <QuotePill />

      {/* Panels */}
      <React.Suspense fallback={null}>
        <StatsPanel 
          open={open === 'stats'} 
          onClose={() => setOpen(null)} 
          user={user} 
          pomoCycles={pomoCycles} 
          setPomoCycles={setPomoCycles} 
          pomoRunning={pomoRunning}
          pomoRemaining={pomoRemaining}
          pomoTotal={pomoTotal}
          pomoMode={pomoMode}
        />
        <NotesPanel open={open === 'notes'} onClose={() => setOpen(null)} user={user} googleToken={googleToken} setGoogleToken={setGoogleToken} />
        {open === 'canvas' && <CanvasNotesWorkspacePanel open={open === 'canvas'} onClose={() => setOpen(null)} user={user} />}
        <ChecklistPanel open={open === 'tasks'} onClose={() => setOpen(null)} user={user} googleToken={googleToken} setGoogleToken={setGoogleToken} />
        <PomodoroPanel 
          open={open === 'pomo'} 
          onClose={() => setOpen(null)}
          mode={pomoMode}
          setMode={setPomoMode}
          focusMin={pomoFocusMin}
          setFocusMin={setPomoFocusMin}
          shortMin={pomoShortMin}
          setShortMin={setPomoShortMin}
          longMin={pomoLongMin}
          setLongMin={setPomoLongMin}
          running={pomoRunning}
          setRunning={setPomoRunning}
          remaining={pomoRemaining}
          setRemaining={setPomoRemaining}
          total={pomoTotal}
          cycles={pomoCycles}
          onComplete={handlePomoComplete}
        />
        <CalendarPanel open={open === 'cal'} onClose={() => setOpen(null)} user={user} gEvents={gEvents} setGEvents={setGEvents} googleToken={googleToken} setGoogleToken={setGoogleToken} />
        <SpotifyPanel open={open === 'music'} onClose={() => setOpen(null)} playlistId={playlistId} setPlaylistId={setPlaylistId} connectSpotify={connectSpotify} user={user} />
        <SettingsPanel open={open === 'settings'} onClose={() => setOpen(null)} settings={settings} setSettings={setSettings} user={user} login={login} logout={logout} connectSpotify={connectSpotify} onOpenChangelog={() => setOpen('changelogs')} onOpenExtensionModal={() => setOpen('extension')} onOpenCookieModal={() => setCookieModalOpen(true)} />
        {open === 'extension' && <ChromeExtensionModal open={open === 'extension'} onClose={() => setOpen(null)} />}
        <CookieBanner openModal={cookieModalOpen} onCloseModal={() => setCookieModalOpen(false)} />

        {/* Fullscreen Changelog Page Overlay */}
        <AnimatePresence>
          {open === 'changelogs' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed inset-0 z-[200] bg-zinc-950 overflow-y-auto"
            >
              <ChangelogView onBack={() => setOpen('settings')} />
            </motion.div>
          )}
        </AnimatePresence>
      </React.Suspense>

      {/* Dedicated Fullscreen Toggle Button at Bottom Right */}
      <button
        onClick={toggleFullscreen}
        className="fixed bottom-6 right-6 z-[120] h-11 w-11 rounded-full bg-black/50 backdrop-blur-xl hover:bg-black/80 text-white flex items-center justify-center transition-all shadow-xl hover:scale-105 active:scale-95 border border-white/20 group"
        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        aria-label="Toggle Fullscreen"
      >
        {isFullscreen ? <Minimize2 className="h-5 w-5 text-white/90 group-hover:text-white" /> : <Maximize2 className="h-5 w-5 text-white/90 group-hover:text-white" />}
      </button>
    </div>
  )
}

export default App
