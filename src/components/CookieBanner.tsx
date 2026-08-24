import React, { useState, useEffect } from 'react'
import { Cookie, ShieldCheck, Check, Settings, X, Info } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Switch } from '@/src/components/ui/switch'
import { Panel } from '@/src/App'
import { toast } from 'sonner'

export interface CookiePreferences {
  essential: boolean
  analytics: boolean
  preferences: boolean
}

const COOKIE_NAME = 'oblivion_cookie_consent'

// Utility functions for cookies
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const matches = document.cookie.match(new RegExp(
    '(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'
  ))
  return matches ? decodeURIComponent(matches[1]) : null
}

export function setCookie(name: string, value: string, days = 365) {
  if (typeof document === 'undefined') return
  const date = new Date()
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
  const expires = '; expires=' + date.toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; SameSite=Lax`
}

export function deleteCookie(name: string) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
}

export function getSavedCookiePreferences(): CookiePreferences | null {
  const cookieVal = getCookie(COOKIE_NAME)
  if (cookieVal) {
    try {
      return JSON.parse(cookieVal)
    } catch {
      // Fallback
    }
  }
  try {
    const localVal = localStorage.getItem(COOKIE_NAME)
    if (localVal) return JSON.parse(localVal)
  } catch {}
  return null
}

export function CookieBanner({
  openModal,
  onCloseModal
}: {
  openModal?: boolean
  onCloseModal?: () => void
}) {
  const [showBanner, setShowBanner] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [prefs, setPrefs] = useState<CookiePreferences>({
    essential: true,
    analytics: true,
    preferences: true
  })

  useEffect(() => {
    const saved = getSavedCookiePreferences()
    if (!saved) {
      // First visit: show bottom consent banner
      const timer = setTimeout(() => setShowBanner(true), 800)
      return () => clearTimeout(timer)
    } else {
      setPrefs(saved)
    }
  }, [])

  useEffect(() => {
    if (openModal) {
      setShowDetails(true)
    }
  }, [openModal])

  const savePreferences = (newPrefs: CookiePreferences) => {
    setPrefs(newPrefs)
    const jsonStr = JSON.stringify(newPrefs)
    setCookie(COOKIE_NAME, jsonStr, 365)
    try {
      localStorage.setItem(COOKIE_NAME, jsonStr)
    } catch {}

    // Apply or clean cookie side-effects
    if (!newPrefs.analytics) {
      deleteCookie('oblivion_analytics_session')
    } else {
      setCookie('oblivion_analytics_session', 'enabled', 30)
    }

    if (!newPrefs.preferences) {
      deleteCookie('oblivion_theme_cache')
    } else {
      setCookie('oblivion_theme_cache', 'enabled', 365)
    }

    setShowBanner(false)
    setShowDetails(false)
    if (onCloseModal) onCloseModal()

    toast.success('Cookie preferences updated & saved!', {
      icon: <ShieldCheck className="h-4 w-4 text-emerald-400" />
    })
  }

  const handleAcceptAll = () => {
    savePreferences({ essential: true, analytics: true, preferences: true })
  }

  const handleRejectOptional = () => {
    savePreferences({ essential: true, analytics: false, preferences: false })
  }

  return (
    <>
      {/* Floating Bottom Cookie Banner */}
      {showBanner && !showDetails && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[250] w-[92%] max-w-xl p-4 md:p-5 rounded-2xl bg-zinc-900/95 backdrop-blur-2xl border border-white/15 shadow-2xl shadow-black/80 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 text-white font-bold text-sm">
              <div className="h-8 w-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/30">
                <Cookie className="h-4 w-4" />
              </div>
              <div>
                <span>Oblivion Cookie & Privacy System</span>
                <p className="text-[11px] font-normal text-white/60 leading-relaxed mt-0.5">
                  We use cookies and local storage to save your focus timers, ambient backgrounds, and session statistics.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowBanner(false)}
              className="text-white/40 hover:text-white transition-colors p-1"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-end gap-2 text-xs">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(true)}
              className="text-white/70 hover:text-white hover:bg-white/10 text-xs h-8"
            >
              <Settings className="h-3.5 w-3.5 mr-1.5 text-white/50" /> Preferences
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRejectOptional}
              className="bg-white/5 hover:bg-white/10 text-white/90 border-white/10 text-xs h-8"
            >
              Essential Only
            </Button>
            <Button
              size="sm"
              onClick={handleAcceptAll}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs h-8 shadow-lg shadow-orange-600/30 border border-orange-400/30"
            >
              <Check className="h-3.5 w-3.5 mr-1" /> Accept All
            </Button>
          </div>
        </div>
      )}

      {/* Preferences Modal */}
      <Panel
        open={showDetails}
        onClose={() => {
          setShowDetails(false)
          if (onCloseModal) onCloseModal()
        }}
        title="Cookie & Privacy Settings"
        icon={<Cookie className="h-4 w-4 text-orange-400" />}
        width="max-w-lg"
      >
        <div className="p-6 space-y-5">
          <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-200/90 leading-relaxed flex items-start gap-2.5">
            <Info className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
            <span>
              Oblivion respects your privacy. We do not sell data or run advertising cookies. All preferences are stored directly on your browser via HTTP cookies & local storage.
            </span>
          </div>

          <div className="space-y-3">
            {/* Essential */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <span>Strictly Essential Cookies</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">Required</span>
                </div>
                <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
                  Required for core site functionality, authentication state, and saving your active Pomodoro timer loop.
                </p>
              </div>
              <Switch checked={true} disabled className="opacity-70 cursor-not-allowed shrink-0" />
            </div>

            {/* Analytics */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-white">Analytics & Performance Cookies</div>
                <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
                  Allows storing session counts, total focused minutes, and streak milestones in client cookies for productivity charts.
                </p>
              </div>
              <Switch
                checked={prefs.analytics}
                onCheckedChange={(val) => setPrefs({ ...prefs, analytics: val })}
                className="shrink-0"
              />
            </div>

            {/* Personalization */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-white">Personalization & Theme Cookies</div>
                <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
                  Saves your preferred background wallpaper, dim level, film grain, and clock size across browser restarts.
                </p>
              </div>
              <Switch
                checked={prefs.preferences}
                onCheckedChange={(val) => setPrefs({ ...prefs, preferences: val })}
                className="shrink-0"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/10">
            <Button
              variant="ghost"
              onClick={handleRejectOptional}
              className="text-white/60 hover:text-white text-xs"
            >
              Reject Optional
            </Button>
            <Button
              onClick={() => savePreferences(prefs)}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs border border-orange-400/30"
            >
              Save Preferences
            </Button>
          </div>
        </div>
      </Panel>
    </>
  )
}
