import React, { useState } from 'react'
import { Panel } from '@/src/App'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { 
  Puzzle, ShieldAlert, Check, Copy, Download, ExternalLink, 
  Terminal, Sparkles, Monitor, BellOff, Clock
} from 'lucide-react'
import { toast } from 'sonner'

export function ChromeExtensionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'remote' | 'guide' | 'manifest' | 'popup' | 'background'>('remote')
  const [copiedTab, setCopiedTab] = useState<string | null>(null)

  const files = {
    remoteManifest: `{
  "manifest_version": 3,
  "name": "Oblivion Focus & Notification Shield",
  "version": "1.0.0",
  "description": "Oblivion Focus Web App Chrome Extension Wrapper",
  "action": {
    "default_popup": "popup.html",
    "default_width": 420,
    "default_height": 600
  },
  "permissions": ["storage", "notifications"]
}`,
    remotePopup: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body, html { margin: 0; padding: 0; width: 420px; height: 600px; overflow: hidden; background: #09090b; }
    iframe { width: 100%; height: 100%; border: none; }
  </style>
</head>
<body>
  <!-- Replace with your deployed Web App URL (e.g., Vercel / GitHub Pages / Cloud Run) -->
  <iframe src="https://ais-dev-6kft3g6vvzgw2ibcvgo5my-598162270833.asia-southeast1.run.app"></iframe>
</body>
</html>`,
    manifest: `{
  "manifest_version": 3,
  "name": "Oblivion Focus & Notification Shield",
  "version": "1.0.0",
  "description": "Minimalist focus timer, time tracker, screen keep-awake & notification blocker Chrome extension.",
  "permissions": [
    "storage",
    "notifications",
    "alarms",
    "activeTab"
  ],
  "action": {
    "default_popup": "popup.html",
    "default_title": "Oblivion Focus"
  },
  "background": {
    "service_worker": "background.js"
  }
}`,
    background: `// Oblivion Chrome Extension Service Worker
let timerState = { running: false, remaining: 25 * 60, mode: 'focus', blockNotifications: true };

chrome.alarms.create('oblivion_tick', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'oblivion_tick') {
    chrome.storage.local.get(['oblivion_timer'], (res) => {
      if (res.oblivion_timer?.running && res.oblivion_timer.remaining > 60) {
        res.oblivion_timer.remaining -= 60;
        chrome.storage.local.set({ oblivion_timer: res.oblivion_timer });
      }
    });
  }
});

// DO NOT DISTURB / NOTIFICATION BLOCKER LOGIC
chrome.notifications.onCreated.addListener((notificationId) => {
  chrome.storage.local.get(['oblivion_timer'], (res) => {
    if (res.oblivion_timer?.running && res.oblivion_timer?.blockNotifications) {
      chrome.notifications.clear(notificationId);
    }
  });
});`,
    popup: `<!-- Oblivion Chrome Extension Popup -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Oblivion Focus</title>
  <style>
    body { width: 360px; height: 500px; background: #09090b; color: white; font-family: system-ui; padding: 16px; }
  </style>
</head>
<body>
  <h2>Oblivion Focus</h2>
  <div id="timerDisplay">25:00</div>
  <button id="toggleBtn">Start Focus</button>
  <script src="popup.js"></script>
</body>
</html>`
  }

  const copyCode = (key: 'manifest' | 'background' | 'popup') => {
    navigator.clipboard.writeText(files[key])
    setCopiedTab(key)
    toast.success(`Copied ${key} file contents to clipboard!`)
    setTimeout(() => setCopiedTab(null), 2000)
  }

  const downloadAllFiles = () => {
    const manifestBlob = new Blob([files.manifest], { type: 'application/json' })
    const url = URL.createObjectURL(manifestBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'manifest.json'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Downloaded manifest.json for Chrome Extension!')
  }

  return (
    <Panel open={open} onClose={onClose} title="Chrome Extension & DND Shield" icon={<Puzzle className="h-4 w-4 text-orange-400" />} width="max-w-3xl">
      <div className="p-6 md:p-8 space-y-6 overflow-auto thin-scroll max-h-[75vh]">
        {/* Header Hero Banner */}
        <div className="relative p-6 rounded-2xl bg-gradient-to-r from-orange-950/40 via-zinc-900 to-black border border-orange-500/20 overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 uppercase tracking-widest text-[10px]">
                  Manifest V3 Extension
                </Badge>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 uppercase tracking-widest text-[10px]">
                  Notification Shield Active
                </Badge>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">Oblivion Chrome Popup Extension</h3>
              <p className="text-xs text-white/60 mt-1 max-w-lg">
                Use Oblivion right inside your Chrome toolbar. Features live time tracking, screen keep-awake, quick tasks, and automatic Do Not Disturb notification suppression while in focus.
              </p>
            </div>
            <Button onClick={downloadAllFiles} className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider shrink-0 gap-2">
              <Download className="h-4 w-4" /> Download Manifest.json
            </Button>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col items-start gap-2">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
              <Clock className="h-4 w-4" />
            </div>
            <div className="text-xs font-bold text-white">Popup Focus Timer</div>
            <div className="text-[11px] text-white/50 leading-relaxed">Quick access to 25m focus blocks directly from Chrome's extension menu.</div>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col items-start gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <BellOff className="h-4 w-4" />
            </div>
            <div className="text-xs font-bold text-white">Notification Shield (DND)</div>
            <div className="text-[11px] text-white/50 leading-relaxed">Automatically silences incoming Chrome browser notifications when timer is running.</div>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col items-start gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Monitor className="h-4 w-4" />
            </div>
            <div className="text-xs font-bold text-white">Keep Screen Awake</div>
            <div className="text-[11px] text-white/50 leading-relaxed">Uses WakeLock API to keep display awake during deep work sessions.</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 gap-2 overflow-x-auto thin-scroll">
          <button
            onClick={() => setActiveTab('remote')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'remote' ? 'border-orange-500 text-orange-400' : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            ⚡ Auto-Updating Extension (Zero Download)
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'guide' ? 'border-orange-500 text-orange-400' : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            Local Extension Guide
          </button>
          <button
            onClick={() => setActiveTab('manifest')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'manifest' ? 'border-orange-500 text-orange-400' : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            manifest.json
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'remote' ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gradient-to-r from-orange-500/10 via-zinc-900 to-black border border-orange-500/20">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-orange-400" />
                No Code Download Required — Instant Auto-Updates
              </h4>
              <p className="text-xs text-white/60 mt-1 leading-relaxed">
                By pointing Chrome's extension popup to your live deployed Web App URL, <strong>every time you push changes to your GitHub repo (Vercel / Cloud Run / Netlify deployment), the Chrome Extension popup updates automatically in real-time</strong> without needing to re-download or rebuild any files on your PC!
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                <span className="h-6 w-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-mono text-xs font-bold shrink-0">1</span>
                <div>
                  <div className="text-xs font-bold text-white">Create a folder named "oblivion-extension" anywhere on your PC</div>
                  <div className="text-[11px] text-white/60 mt-0.5">You only need 2 tiny files inside this folder: <code className="bg-black/50 px-1.5 py-0.5 rounded text-orange-300 font-mono">manifest.json</code> and <code className="bg-black/50 px-1.5 py-0.5 rounded text-orange-300 font-mono">popup.html</code>.</div>
                </div>
              </div>

              <div className="flex gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                <span className="h-6 w-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-mono text-xs font-bold shrink-0">2</span>
                <div className="w-full">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-white">Copy <code className="text-orange-400 font-mono">manifest.json</code></div>
                    <Button size="sm" variant="ghost" onClick={() => copyCode('remoteManifest' as any)} className="h-6 text-[10px] text-orange-300">
                      Copy manifest.json
                    </Button>
                  </div>
                  <pre className="mt-2 p-3 rounded-lg bg-black/80 text-[10px] font-mono text-orange-200 overflow-x-auto">
                    {files.remoteManifest}
                  </pre>
                </div>
              </div>

              <div className="flex gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                <span className="h-6 w-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-mono text-xs font-bold shrink-0">3</span>
                <div className="w-full">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-white">Copy <code className="text-orange-400 font-mono">popup.html</code> (Hosting your live Web App URL)</div>
                    <Button size="sm" variant="ghost" onClick={() => copyCode('remotePopup' as any)} className="h-6 text-[10px] text-orange-300">
                      Copy popup.html
                    </Button>
                  </div>
                  <pre className="mt-2 p-3 rounded-lg bg-black/80 text-[10px] font-mono text-orange-200 overflow-x-auto">
                    {files.remotePopup}
                  </pre>
                </div>
              </div>

              <div className="flex gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                <span className="h-6 w-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-mono text-xs font-bold shrink-0">4</span>
                <div>
                  <div className="text-xs font-bold text-white">Load into Chrome</div>
                  <div className="text-[11px] text-white/60 mt-0.5">Go to <code className="bg-black/50 px-1 py-0.5 rounded text-orange-300 font-mono">chrome://extensions/</code>, enable Developer Mode, click <strong>Load unpacked</strong>, and select your <code className="text-orange-300 font-mono">oblivion-extension</code> folder. Done!</div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'guide' ? (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                <span className="h-6 w-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-mono text-xs font-bold shrink-0">1</span>
                <div>
                  <div className="text-xs font-bold text-white">Open Chrome Extensions Manager</div>
                  <div className="text-[11px] text-white/60 mt-0.5">Type <code className="bg-black/50 px-1.5 py-0.5 rounded text-orange-300 font-mono">chrome://extensions/</code> into your Google Chrome URL bar.</div>
                </div>
              </div>

              <div className="flex gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                <span className="h-6 w-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-mono text-xs font-bold shrink-0">2</span>
                <div>
                  <div className="text-xs font-bold text-white">Enable Developer Mode</div>
                  <div className="text-[11px] text-white/60 mt-0.5">Toggle the <strong>Developer mode</strong> switch in the top-right corner of the Extensions screen.</div>
                </div>
              </div>

              <div className="flex gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                <span className="h-6 w-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-mono text-xs font-bold shrink-0">3</span>
                <div>
                  <div className="text-xs font-bold text-white">Load Unpacked Extension</div>
                  <div className="text-[11px] text-white/60 mt-0.5">Click <strong>Load unpacked</strong> and select the <code className="bg-black/50 px-1.5 py-0.5 rounded text-orange-300 font-mono">/extension</code> directory from this project repo.</div>
                </div>
              </div>

              <div className="flex gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                <span className="h-6 w-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-mono text-xs font-bold shrink-0">4</span>
                <div>
                  <div className="text-xs font-bold text-white">Pin Oblivion to Chrome Toolbar</div>
                  <div className="text-[11px] text-white/60 mt-0.5">Click the Chrome extensions puzzle piece and pin Oblivion for instant 1-click focus sessions anytime.</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-white/50">{activeTab === 'manifest' ? 'manifest.json' : activeTab === 'background' ? 'background.js' : 'popup.html'}</span>
              <Button size="sm" variant="outline" onClick={() => copyCode(activeTab as any)} className="border-white/10 text-white hover:bg-white/10 text-xs">
                {copiedTab === activeTab ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                {copiedTab === activeTab ? 'Copied' : 'Copy Code'}
              </Button>
            </div>
            <pre className="p-4 rounded-xl bg-black/80 border border-white/10 text-[11px] font-mono text-orange-200/90 overflow-x-auto max-h-[300px] thin-scroll leading-relaxed">
              {files[activeTab as keyof typeof files]}
            </pre>
          </div>
        )}
      </div>
    </Panel>
  )
}
