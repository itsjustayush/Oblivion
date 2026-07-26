import express from "express";
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Quotes
  app.get("/api/quotes", (req, res) => {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    res.json(randomQuote);
  });

  // Spotify Auth Routes
  app.get('/api/auth/spotify/url', (req, res) => {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    if (!clientId) return res.status(500).json({ error: 'Spotify Client ID not configured' });
    
    // Use APP_URL if available, otherwise fallback to request host with protocol
    const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol;
    const appUrl = process.env.APP_URL || `${protocol}://${req.get('host')}`;
    const redirectUri = `${appUrl}/auth/spotify/callback`;
    
    console.log('Spotify Redirect URI:', redirectUri);
    
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: 'user-read-private user-read-email playlist-read-private user-modify-playback-state user-read-playback-state',
      show_dialog: 'true'
    });
    res.json({ url: `https://accounts.spotify.com/authorize?${params}` });
  });

  app.post('/api/auth/spotify/token', async (req, res) => {
    const { code } = req.body;
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const appUrl = process.env.APP_URL || `https://${req.get('host')}`;
    const redirectUri = `${appUrl}/auth/spotify/callback`;

    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: 'Spotify credentials not configured' });
    }

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code as string,
          redirect_uri: redirectUri
        })
      });

      const data = await response.json();
      if (data.error) {
        return res.status(400).json(data);
      }
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: 'Failed to exchange token' });
    }
  });

  app.get('/auth/spotify/callback', async (req, res) => {
    const { code } = req.query;
    res.send(`
      <html>
        <body style="background: #121212; color: white; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh;">
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'SPOTIFY_AUTH_SUCCESS', code: '${code}' }, '*');
              window.close();
            }
          </script>
          <div style="text-align: center;">
            <h2>Connecting Spotify...</h2>
            <p>This window should close automatically.</p>
          </div>
        </body>
      </html>
    `);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
