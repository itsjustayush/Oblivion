import React from "react";
import { ArrowUpRight, ArrowLeft, History, GitCommit, Sparkles } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";

export type ChangelogEntry = {
  version: string;
  date: string;
  title: string;
  description: string;
  items?: string[];
  image?: string;
  button?: {
    url: string;
    text: string;
  };
};

export interface ChangelogViewProps {
  className?: string;
  title?: string;
  description?: string;
  entries?: ChangelogEntry[];
  onBack?: () => void;
}

export const defaultEntries: ChangelogEntry[] = [
  {
    version: "Version 1.5.0",
    date: "30 July 2026",
    title: "Chrome Extension, DND Shield & Social Media Open Graph Preview",
    description:
      "Packaged Oblivion as an auto-updating Chrome Extension popup with Do Not Disturb notification blocking, and added Open Graph metadata for rich social previews.",
    items: [
      "Auto-Updating Chrome Extension: Built zero-download remote popup wrapper and complete Manifest V3 extension package with keep-awake and DND background service worker.",
      "Notification Focus Shield: Integrated real-time Do Not Disturb notification suppression toggle directly into the Pomodoro focus timer.",
      "Open Graph & Social Cards: Added 1200×630 high-definition social media preview branding (oblivion.png) with Open Graph and Twitter Card tags in index.html.",
      "Interactive Extension Modal: Added quick setup guide and 1-click code copying for manifest.json and popup.html in the main app navigation.",
    ],
    button: {
      url: "https://github.com/itsjustayush/oblivion",
      text: "View GitHub Repository",
    },
  },
  {
    version: "Version 1.4.0",
    date: "29 July 2026",
    title: "Strict Guest Mode Zero-State & Interactive Analytics",
    description:
      "Engineered strict multi-tenant session isolation in Firebase Firestore and transformed focus statistics into interactive AreaCharts with multi-metric toggles.",
    items: [
      "Strict Guest Mode Zero-State: Chart and analytics explicitly force zeroed-out values (0 focus, 0 tasks, 0 score) when logged out.",
      "Interactive Area Visualizations: Replaced static line charts with smooth gradient AreaCharts and metric toggling (Focus vs Target, Tasks & Sessions, Score Trend).",
      "Atmospheric HD Wallpapers: Added high-definition focus wallpapers including Starry Atmosphere, Calm Forest, Cosmic Nebula, Cozy Bokeh, and Dark Highlands.",
      "Firebase Data Scrubbing & Reset: Enhanced history reset workflows to erase local storage and zero out remote Firestore session collections.",
    ],
    button: {
      url: "https://github.com/itsjustayush/oblivion",
      text: "View GitHub Repository",
    },
  },
  {
    version: "Version 1.3.0",
    date: "29 July 2026",
    title: "Branding, Developer Attribution & Simplified Auth",
    description:
      "Updated application metadata, added author and repository attribution across navigation footers, and streamlined Google Authentication.",
    items: [
      "Developer & Repo Hyperlinks: Integrated direct links to GitHub repository and developer profiles in settings and footers.",
      "Simplified Authentication: Streamlined Google sign-in flow by removing unnecessary redirect loops.",
      "Refined App Metadata: Updated metadata.json to reflect Oblivion's ambient focus suite capabilities.",
    ],
  },
  {
    version: "Version 1.2.0",
    date: "27 July 2026",
    title: "Vercel Deployment Compatibility & Workspace Sync",
    description:
      "Optimized production build pipelines for Vercel serverless deployment and integrated Google Workspace event synchronization.",
    items: [
      "Vercel Deployment Optimization: Updated package lockfile registry URLs, specified Node 22 engine rules, and configured npm ci.",
      "Iframe Auth Fallback: Added popup and redirect handlers for Google OAuth within sandboxed iframe containers.",
      "Google Workspace Integration: Added Google Calendar event synchronization and unified Google Tasks endpoints.",
    ],
  },
  {
    version: "Version 1.1.0",
    date: "26 July 2026",
    title: "Spotlight UI & Telemetry Monitoring",
    description:
      "Introduced a cursor-following spotlight reveal effect and connected application telemetry directly to Vercel Analytics.",
    items: [
      "Interactive Spotlight Reveal: Replaced heavy background shaders with an ultra-smooth cursor-tracking spotlight effect.",
      "Vercel Telemetry: Added @vercel/analytics and @vercel/speed-insights for real-time app monitoring.",
      "Dependency Hardening: Added package overrides to fix transitive dependency paths.",
    ],
  },
  {
    version: "Version 1.0.0",
    date: "8 June 2026",
    title: "Gemini AI Agent & Persistent Firestore Notes",
    description:
      "Expanded backend architecture with secure Gemini AI server endpoints and structured Firestore collections.",
    items: [
      "Server-Side Gemini Proxy: Implemented /api/agent/interact endpoint to safely query Gemini models without exposing API keys.",
      "Firestore Schema Expansion: Added sticky note pinning, custom color tagging, and task ordering.",
    ],
    button: {
      url: "https://github.com/itsjustayush/oblivion/commit/73eb0f2",
      text: "View Commit Details",
    },
  },
  {
    version: "Version 0.1.0",
    date: "7 June 2026",
    title: "Initial Oblivion Platform Launch",
    description:
      "Introducing Oblivion: a minimalist, ambient focus space designed to help you eliminate distractions and enter deep flow states.",
    items: [
      "Ambient Clock & Customizable Focus Timer with Pomodoro cycles.",
      "Quick Notes Pad & Checklist with persistent cloud sync.",
      "Soundscape Audio Generator & Embedded Spotify Playlist player.",
      "Firebase Auth & Firestore Realtime Integration.",
    ],
    button: {
      url: "https://github.com/itsjustayush/oblivion",
      text: "Explore Source Code",
    },
  },
];

export const ChangelogView: React.FC<ChangelogViewProps> = ({
  title = "Changelog",
  description = "Stay up to date with the latest features, improvements, and system updates in Oblivion.",
  entries = defaultEntries,
  className,
  onBack,
}) => {
  return (
    <div className={cn("min-h-screen bg-zinc-950 text-white selection:bg-orange-500/30 selection:text-orange-200 overflow-y-auto thin-scroll", className)}>
      {/* Navigation Bar */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-950/80 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-white/60 hover:text-white hover:bg-white/10 gap-2 text-xs font-bold uppercase tracking-wider transition-all"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Space
              </Button>
            )}
            <div className="flex items-center gap-2 text-white font-bold tracking-tight">
              <History className="h-4 w-4 text-orange-400" />
              <span className="text-sm uppercase tracking-widest text-white/90">Oblivion Changelogs</span>
            </div>
          </div>

          <a
            href="https://github.com/itsjustayush/oblivion"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors bg-white/5 border border-white/10 px-3 py-1.5 rounded-full"
          >
            <GitCommit className="h-3.5 w-3.5 text-orange-400" />
            <span className="font-mono text-[11px]">github.com/itsjustayush/oblivion</span>
            <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Main Content */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="mx-auto max-w-3xl mb-12 border-b border-white/10 pb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold mb-4">
              <Sparkles className="h-3.5 w-3.5" /> Product Updates & Logs
            </div>
            <h2 className="mb-4 text-3xl font-extrabold tracking-tight md:text-5xl text-white">
              {title}
            </h2>
            <p className="text-base text-zinc-400 md:text-lg leading-relaxed">
              {description}
            </p>
          </div>

          <div className="mx-auto max-w-3xl space-y-16">
            {entries.map((entry, index) => (
              <div
                key={index}
                className="relative flex flex-col gap-4 md:flex-row md:gap-12 pb-12 border-b border-white/5 last:border-b-0"
              >
                <div className="top-24 flex h-min w-48 shrink-0 items-center gap-3 md:sticky">
                  <Badge variant={index === 0 ? "secondary" : "outline"} className="text-xs font-mono tracking-wide">
                    {entry.version}
                  </Badge>
                  <span className="text-xs font-medium text-zinc-400">
                    {entry.date}
                  </span>
                </div>
                <div className="flex flex-col flex-1">
                  <h2 className="mb-3 text-xl leading-snug font-bold text-white md:text-2xl">
                    {entry.title}
                  </h2>
                  <p className="text-sm text-zinc-300 md:text-base leading-relaxed">
                    {entry.description}
                  </p>
                  {entry.items && entry.items.length > 0 && (
                    <ul className="mt-4 space-y-2 text-sm text-zinc-400 md:text-base">
                      {entry.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start gap-2.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-orange-400 mt-2 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {entry.image && (
                    <img
                      src={entry.image}
                      alt={`${entry.version} visual`}
                      className="mt-6 w-full rounded-xl border border-white/10 object-cover shadow-2xl"
                    />
                  )}
                  {entry.button && (
                    <div className="mt-6">
                      <a
                        href={entry.button.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-400 hover:text-orange-300 transition-colors bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 px-3.5 py-2 rounded-lg"
                      >
                        {entry.button.text} <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ChangelogView;
