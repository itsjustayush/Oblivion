import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgBuffer = Buffer.from(`
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#09090b" />
      <stop offset="50%" stop-color="#121215" />
      <stop offset="100%" stop-color="#09090b" />
    </linearGradient>
    <radialGradient id="orangeGlow" cx="0.8" cy="0.5" r="0.6">
      <stop offset="0%" stop-color="#ea580c" stop-opacity="0.2" />
      <stop offset="100%" stop-color="#ea580c" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="cardGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#18181b" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#09090b" stop-opacity="0.95" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000000" flood-opacity="0.6" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bgGrad)" />
  <rect width="1200" height="630" fill="url(#orangeGlow)" />

  <!-- Subtle Grid Pattern -->
  <g opacity="0.03" stroke="#ffffff" stroke-width="1">
    <path d="M 0,100 L 1200,100 M 0,200 L 1200,200 M 0,300 L 1200,300 M 0,400 L 1200,400 M 0,500 L 1200,500" />
    <path d="M 200,0 L 200,630 M 400,0 L 400,630 M 600,0 L 600,630 M 800,0 L 800,630 M 1000,0 L 1000,630" />
  </g>

  <!-- Left Column Content -->
  <!-- Title -->
  <text x="80" y="210" font-family="Georgia, serif" font-size="82" font-weight="normal" fill="#fafafa" letter-spacing="-1">Oblivion</text>

  <!-- Subtitle -->
  <text x="80" y="275" font-family="system-ui, -apple-system, sans-serif" font-size="22" fill="#a1a1aa" width="460">
    <tspan x="80" dy="0">A minimalist ambient focus space &amp; Pomodoro</tspan>
    <tspan x="80" dy="32">timer with Spotify, live weather, and productivity</tspan>
    <tspan x="80" dy="32">analytics.</tspan>
  </text>

  <!-- Feature Pills -->
  <g transform="translate(80, 400)">
    <!-- React -->
    <rect x="0" y="0" width="85" height="36" rx="18" fill="#ea580c" />
    <text x="42.5" y="23" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="#ffffff" text-anchor="middle">React</text>

    <!-- TypeScript -->
    <rect x="100" y="0" width="115" height="36" rx="18" fill="#ea580c" />
    <text x="157.5" y="23" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="#ffffff" text-anchor="middle">TypeScript</text>

    <!-- Firebase -->
    <rect x="230" y="0" width="100" height="36" rx="18" fill="#ea580c" />
    <text x="280" y="23" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="#ffffff" text-anchor="middle">Firebase</text>

    <!-- Vercel -->
    <rect x="345" y="0" width="90" height="36" rx="18" fill="#ea580c" />
    <text x="390" y="23" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="#ffffff" text-anchor="middle">Vercel</text>
  </g>

  <!-- Author Badge -->
  <g transform="translate(80, 520)">
    <rect x="0" y="0" width="200" height="36" rx="18" fill="#18181b" stroke="#27272a" stroke-width="1" />
    <text x="100" y="23" font-family="system-ui, sans-serif" font-size="14" font-weight="500" fill="#d4d4d8" text-anchor="middle">By Ayush Bhattacharya</text>
  </g>

  <!-- Right Side Mockup Frame -->
  <g transform="translate(560, 65)" filter="url(#shadow)">
    <!-- Main Window Outer -->
    <rect x="0" y="0" width="560" height="500" rx="20" fill="url(#cardGrad)" stroke="#27272a" stroke-width="1.5" />

    <!-- Window Bar Header -->
    <rect x="0" y="0" width="560" height="48" rx="20" fill="#18181b" />
    <rect x="0" y="28" width="560" height="20" fill="#18181b" />
    <line x1="0" y1="48" x2="560" y2="48" stroke="#27272a" stroke-width="1" />

    <!-- Window Control Dots -->
    <circle cx="28" cy="24" r="6" fill="#ef4444" opacity="0.8" />
    <circle cx="48" cy="24" r="6" fill="#eab308" opacity="0.8" />
    <circle cx="68" cy="24" r="6" fill="#22c55e" opacity="0.8" />

    <!-- Navigation Bar inside Mockup -->
    <text x="100" y="29" font-family="Georgia, serif" font-size="16" font-style="italic" fill="#fafafa">Oblivion</text>

    <!-- Top Navigation Tabs -->
    <g transform="translate(200, 16)" opacity="0.7">
      <rect x="0" y="0" width="230" height="24" rx="12" fill="#27272a" />
      <text x="25" y="16" font-family="system-ui, sans-serif" font-size="10" fill="#ffffff">Pomodoro</text>
      <text x="80" y="16" font-family="system-ui, sans-serif" font-size="10" fill="#a1a1aa">Tasks</text>
      <text x="120" y="16" font-family="system-ui, sans-serif" font-size="10" fill="#a1a1aa">Calendar</text>
      <text x="175" y="16" font-family="system-ui, sans-serif" font-size="10" fill="#a1a1aa">Music</text>
    </g>

    <rect x="460" y="16" width="70" height="22" rx="11" fill="#f97316" />
    <text x="495" y="31" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#ffffff" text-anchor="middle">Sign In</text>

    <!-- Center Clock Banner -->
    <g transform="translate(280, 240)">
      <!-- Giant Clock Number -->
      <text x="0" y="0" font-family="system-ui, -apple-system, sans-serif" font-size="96" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="-2">3:04</text>
      <text x="0" y="35" font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="#a1a1aa" text-anchor="middle" letter-spacing="2">WEDNESDAY, JULY 30</text>
    </g>

    <!-- Timer Controls below clock -->
    <g transform="translate(280, 350)">
      <!-- Mode selector -->
      <rect x="-105" y="0" width="210" height="28" rx="14" fill="#27272a" />
      <rect x="-100" y="2" width="70" height="24" rx="12" fill="#ea580c" />
      <text x="-65" y="18" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#ffffff" text-anchor="middle">Focus (25m)</text>
      <text x="0" y="18" font-family="system-ui, sans-serif" font-size="11" fill="#a1a1aa" text-anchor="middle">Short (5m)</text>
      <text x="65" y="18" font-family="system-ui, sans-serif" font-size="11" fill="#a1a1aa" text-anchor="middle">Long (15m)</text>

      <!-- Sub Clock 01:00 & Play Button -->
      <g transform="translate(0, 60)">
        <text x="-35" y="10" font-family="system-ui, sans-serif" font-size="28" font-weight="700" fill="#ffffff" text-anchor="end">01:00</text>
        <circle cx="10" cy="0" r="18" fill="#f97316" />
        <polygon points="7,-6 17,0 7,6" fill="#ffffff" />
      </g>
    </g>

    <!-- Bottom Left Widget -->
    <g transform="translate(24, 72)">
      <rect x="0" y="0" width="130" height="48" rx="12" fill="#18181b" stroke="#27272a" stroke-width="1" />
      <circle cx="24" cy="24" r="10" fill="#0284c7" opacity="0.3" />
      <text x="24" y="28" font-family="system-ui, sans-serif" font-size="12" text-anchor="middle" fill="#38bdf8">💧</text>
      <text x="46" y="22" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#ffffff">30°C</text>
      <text x="46" y="36" font-family="system-ui, sans-serif" font-size="9" fill="#a1a1aa">DRIZZLE</text>
    </g>

    <!-- Bottom Footer Tag -->
    <g transform="translate(24, 450)">
      <rect x="0" y="0" width="190" height="24" rx="12" fill="#18181b" stroke="#27272a" stroke-width="1" />
      <text x="95" y="16" font-family="system-ui, sans-serif" font-size="11" fill="#a1a1aa" text-anchor="middle">Made with ❤️ by Ayush</text>
    </g>
  </g>
</svg>
`);

if (!fs.existsSync('./public')) {
  fs.mkdirSync('./public', { recursive: true });
}

async function run() {
  await sharp(svgBuffer)
    .png()
    .toFile('./public/og-image.png');

  await sharp(svgBuffer)
    .png()
    .toFile('./public/oblivion.png');

  console.log('Successfully generated public/og-image.png and public/oblivion.png');
}

run();
