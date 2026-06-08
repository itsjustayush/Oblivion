import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality } from "@google/genai";

let genAIClient: GoogleGenAI | null = null;
function getGenAI() {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    genAIClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return genAIClient;
}

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

  // ClickUp Auth Routes
  app.get('/api/auth/clickup/url', (req, res) => {
    const clientId = process.env.CLICKUP_CLIENT_ID;
    if (!clientId) return res.status(500).json({ error: 'ClickUp Client ID not configured' });
    
    const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol;
    const appUrl = process.env.APP_URL || `${protocol}://${req.get('host')}`;
    const redirectUri = `${appUrl}/auth/clickup/callback`;

    console.log('ClickUp Redirect URI:', redirectUri);
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
    });
    res.json({ url: `https://app.clickup.com/api?${params}` });
  });

  app.post('/api/auth/clickup/token', async (req, res) => {
    const { code } = req.body;
    const clientId = process.env.CLICKUP_CLIENT_ID;
    const clientSecret = process.env.CLICKUP_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: 'ClickUp credentials not configured' });
    }

    try {
      const response = await fetch('https://api.clickup.com/api/v2/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code: code
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

  app.get('/api/auth/clickup/callback', async (req, res) => {
    const { code } = req.query;
    res.send(`
      <html>
        <body style="background: #121212; color: white; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh;">
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'CLICKUP_AUTH_SUCCESS', code: '${code}' }, '*');
              window.close();
            }
          </script>
          <div style="text-align: center;">
            <h2>Connecting ClickUp...</h2>
            <p>This window should close automatically.</p>
          </div>
        </body>
      </html>
    `);
  });

  app.get('/api/clickup/tasks', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Missing ClickUp access token' });

    try {
      const teamRes = await fetch('https://api.clickup.com/api/v2/team', {
        headers: { 'Authorization': authHeader }
      });
      const teamData = await teamRes.json();
      
      if (teamData.error) {
        return res.status(400).json(teamData);
      }

      let allTasks: any[] = [];
      for (const team of teamData.teams || []) {
        const taskRes = await fetch(`https://api.clickup.com/api/v2/team/${team.id}/task?subtasks=true`, {
          headers: { 'Authorization': authHeader }
        });
        const taskData = await taskRes.json();
        allTasks = [...allTasks, ...(taskData.tasks || [])];
      }
      res.json({ tasks: allTasks });
    } catch (err) {
      console.error('ClickUp Sync Error:', err);
      res.status(500).json({ error: 'Failed to fetch tasks from ClickUp' });
    }
  });

  app.get('/api/clickup/docs', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Missing ClickUp access token' });

    try {
      const teamRes = await fetch('https://api.clickup.com/api/v2/team', {
        headers: { 'Authorization': authHeader }
      });
      const teamData = await teamRes.json();
      
      if (teamData.error) {
        return res.status(400).json(teamData);
      }

      let allDocs: any[] = [];
      for (const team of teamData.teams || []) {
        const docRes = await fetch(`https://api.clickup.com/api/v2/team/${team.id}/doc`, {
          headers: { 'Authorization': authHeader }
        });
        const docData = await docRes.json();
        allDocs = [...allDocs, ...(docData.docs || [])];
      }
      res.json({ docs: allDocs });
    } catch (err) {
      console.error('ClickUp Docs Sync Error:', err);
      res.status(500).json({ error: 'Failed to fetch docs from ClickUp' });
    }
  });

  // Personal Agent Gemini Interact Endpoint
  app.post("/api/agent/interact", async (req, res) => {
    const { prompt, history, documents, limitLength = true } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "No prompt provided" });
    }

    try {
      const ai = getGenAI();

      let systemInstruction = "You are Oblivion Agent, the user's highly brainy personal voice assistant. " +
        "You have a sleek, calming, futuristic cyber-aesthetic voice. " +
        "You speak directly, naturally, and warmly. " +
        (limitLength 
          ? "Keep your responses extremely concise (1 to 3 short sentences maximum) so that it is readable and perfectly suitable for text-to-speech vocalization. " 
          : "Provide a comprehensive but friendly response. ") +
        "You can search Google regarding real-time details of events, coding, news, or articles if needed. " +
        "Keep formatting clean and without heavy Markdown if limitLength is true, so that speech synthesizers don't read raw markdown asterisks or blockquotes.";

      if (documents && Array.isArray(documents) && documents.length > 0) {
        systemInstruction += "\n\nHere are some documents, articles, or notes provided by the user for context:\n" +
          documents.map((d: any) => `[[TITLE: ${d.title || "Untitled"}]]\n${d.content || ""}`).join("\n\n");
      }

      let contents: any[] = [];
      if (history && Array.isArray(history) && history.length > 0) {
        contents = history.map((m: any) => ({
          role: m.sender === "user" ? "user" : "model",
          parts: [{ text: m.text }]
        }));
      } else {
        contents = [{ role: "user", parts: [{ text: prompt }] }];
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction,
          tools: [{ googleSearch: {} }],
        }
      });

      const text = response.text || "";

      // Extract search grounding metadata sources
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const sources = chunks ? chunks.map((c: any) => {
        if (c.web) {
          return { title: c.web.title, uri: c.web.uri };
        }
        return null;
      }).filter(Boolean) : [];

      res.json({ text, sources });
    } catch (err: any) {
      console.error("Gemini Agent Error:", err);
      res.status(500).json({ error: err.message || "Failed to generate AI response" });
    }
  });

  // Personal Agent Text-to-Speech Endpoint
  app.post("/api/agent/tts", async (req, res) => {
    const { text, voice = "Zephyr" } = req.body; // prebuilt voices: Zephyr, Kore, Puck, or Sarvam voices
    if (!text) {
      return res.status(400).json({ error: "No text provided for TTS" });
    }

    try {
      // Strip basic markdown tags to prevent TTS reading "asterisk asterisk"
      const cleanText = text
        .replace(/\*\*?/g, "")
        .replace(/`{1,3}/g, "")
        .replace(/#+\s+/g, "")
        .replace(/-\s+/g, "")
        .trim();

      const sarvamVoices = ["meera", "pavan", "kamlesh", "arvind", "lata", "reema"];
      const lowerVoice = voice.toLowerCase();
      const isSarvamVoice = sarvamVoices.includes(lowerVoice) || lowerVoice.startsWith("sarvam");

      if (isSarvamVoice) {
        // Sarvam.ai TTS integration
        const sarvamApiKey = process.env.SARVAM_API_KEY || "sk_jq8at0h2_ztxBambU22tHxRL8xvOHIqEI";
        
        let speaker = "meera";
        for (const sv of sarvamVoices) {
          if (lowerVoice.includes(sv)) {
            speaker = sv;
            break;
          }
        }

        // Detect Hindi or default to en-IN
        let targetLanguageCode = "en-IN";
        const hasHindiCheck = /[\u0900-\u097F]/.test(cleanText);
        if (hasHindiCheck) {
          targetLanguageCode = "hi-IN";
        }

        console.log(`[Sarvam TTS] Requesting speaker=${speaker}, language=${targetLanguageCode}`);

        const sarvamRes = await fetch("https://api.sarvam.ai/v1/text-to-speech", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-subscription-key": sarvamApiKey
          },
          body: JSON.stringify({
            inputs: [cleanText],
            target_language_code: targetLanguageCode,
            speaker: speaker,
            pitch: 0.5,
            pace: 1.0,
            loudness: 1.5,
            speech_sample_rate: 8000,
            enable_preprocessing: true,
            model: "bulbul:v1"
          })
        });

        if (!sarvamRes.ok) {
          const errMsg = await sarvamRes.text();
          console.error(`[Sarvam TTS] Error status: ${sarvamRes.status}, response: ${errMsg}`);
          throw new Error(`Sarvam AI returned error: ${errMsg || sarvamRes.statusText}`);
        }

        const data: any = await sarvamRes.json();
        if (data && data.audios && data.audios.length > 0) {
          console.log("[Sarvam TTS] Generated speech successfully");
          return res.json({ audio: data.audios[0], isWav: true });
        } else {
          throw new Error("No audios elements returned by Sarvam AI");
        }
      }

      // Default: Gemini TTS
      const ai = getGenAI();

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: `Say warmly: ${cleanText}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice }
            }
          }
        }
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        throw new Error("No audio data returned from Gemini TTS");
      }

      res.json({ audio: base64Audio, isWav: false });
    } catch (err: any) {
      console.error("TTS Provider Error:", err);
      res.status(500).json({ error: err.message || "Failed to generate voice speech" });
    }
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
