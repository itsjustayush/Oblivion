import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mic,
  MicOff,
  Files,
  Upload,
  Sparkles,
  Search,
  Volume2,
  VolumeX,
  X,
  Languages,
  RotateCcw,
  Plus,
  Trash2,
  ExternalLink,
  ChevronRight,
  Info
} from "lucide-react";
import { toast } from "sonner";

interface DocumentMeta {
  id: string;
  title: string;
  content: string;
}

// 24kHz Mono 16-bit Live PCM player
const playPcmBase64 = (base64Data: string, sampleRate = 24000) => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const binaryString = window.atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // 16-bit PCM has 2 bytes per sample
    const numSamples = len / 2;
    const floatData = new Float32Array(numSamples);
    const dataView = new DataView(bytes.buffer);
    
    for (let i = 0; i < numSamples; i++) {
      const intSample = dataView.getInt16(i * 2, true);
      floatData[i] = intSample / 32768.0;
    }
    
    const audioBuffer = audioCtx.createBuffer(1, numSamples, sampleRate);
    audioBuffer.getChannelData(0).set(floatData);
    
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);
    source.start(0);
    
    return { source, audioCtx, duration: audioBuffer.duration };
  } catch (err) {
    console.error("PCM playback error:", err);
    return null;
  }
};

// Play audio wav format Base64 using standard browser Web Audio API decoding
const playWavBase64 = async (base64Data: string) => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const binaryString = window.atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // decodeAudioData decodes the raw array buffer natively
    const audioBuffer = await audioCtx.decodeAudioData(bytes.buffer);
    
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);
    source.start(0);
    
    return { source, audioCtx, duration: audioBuffer.duration };
  } catch (err) {
    console.error("WAV playback error:", err);
    return null;
  }
};

export function AIAgentBlob() {
  const [isOpen, setIsOpen] = useState(false);
  const [agentState, setAgentState] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [showCaptions, setShowCaptions] = useState(true);
  
  // Real-time transcripts
  const [userSpeechText, setUserSpeechText] = useState("");
  const [agentSpeechText, setAgentSpeechText] = useState("");
  
  // Text Chat inputs
  const [chatInput, setChatInput] = useState("");
  const [responses, setResponses] = useState<{ sender: "user" | "agent"; text: string; timestamp: number }[]>([]);
  
  // Documents / Pastes
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [pastedUrl, setPastedUrl] = useState("");
  const [docInputText, setDocInputText] = useState("");
  const [docTitle, setDocTitle] = useState("");
  const [showDocModal, setShowDocModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Audio Playback
  const [activeVoice, setActiveVoice] = useState<string>("Zephyr");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const activeAudioSourceRef = useRef<any>(null);
  
  // Google Search grounding sources retrieved
  const [searchSources, setSearchSources] = useState<{ title: string; uri: string }[]>([]);
  
  // Speech Recognition Ref
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);

  // Stop active voice audio playback
  const stopPlayback = useCallback(() => {
    if (activeAudioSourceRef.current) {
      try {
        activeAudioSourceRef.current.source.stop();
        activeAudioSourceRef.current.audioCtx.close();
      } catch {}
      activeAudioSourceRef.current = null;
    }
    setIsPlayingAudio(false);
    if (agentState === "speaking") {
      setAgentState("idle");
    }
  }, [agentState]);

  // Handle Speech Recognition initializations
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        isListeningRef.current = true;
        setAgentState("listening");
        setUserSpeechText("Listening...");
        stopPlayback();
      };

      recognition.onresult = (e: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (e.results[i].isFinal) {
            finalTranscript += e.results[i][0].transcript;
          } else {
            interimTranscript += e.results[i][0].transcript;
          }
        }

        const currentText = finalTranscript || interimTranscript;
        if (currentText) {
          setUserSpeechText(currentText);
        }
      };

      recognition.onerror = (e: any) => {
        console.warn("Speech recognition error", e);
        if (e.error !== "no-speech") {
          toast.error(`Mic error: ${e.error}`);
        }
      };

      recognition.onend = () => {
        isListeningRef.current = false;
        // If we transitioned to thinking, speech finished nicely.
        // Otherwise, if we were listening, send prompt or transition to idle.
        if (agentState === "listening") {
          const textToSend = userSpeechText.trim();
          if (textToSend && textToSend !== "Listening...") {
            handleAgentInteract(textToSend);
          } else {
            setAgentState("idle");
          }
        }
      };

      recognitionRef.current = recognition;
    }
  }, [userSpeechText, agentState, stopPlayback]);

  // Core API interaction with Gemini 3.5 Flash + Web Search
  const handleAgentInteract = async (promptText: string) => {
    if (!promptText.trim()) return;
    
    stopPlayback();
    setAgentState("thinking");
    setUserSpeechText(promptText);
    setAgentSpeechText("Synthesizing answer...");
    
    // Add to chat history
    const userMsg = { sender: "user" as const, text: promptText, timestamp: Date.now() };
    setResponses(prev => [...prev, userMsg]);

    try {
      // 1. Fetch grounded summary from Gemini with conversational history
      const res = await fetch("/api/agent/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptText,
          history: [...responses, userMsg],
          documents: documents,
          limitLength: true // Keep vocal answers concise
        })
      });

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setAgentSpeechText(data.text);
      if (data.sources) {
        setSearchSources(data.sources);
      }

      // Add response to chat history
      setResponses(prev => [
        ...prev,
        { sender: "agent", text: data.text, timestamp: Date.now() }
      ]);

      // 2. Play Audio via Gemini or Sarvam TTS
      setAgentState("speaking");
      const ttsRes = await fetch("/api/agent/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: data.text,
          voice: activeVoice
        })
      });

      const ttsData = await ttsRes.json();
      if (ttsData.error) {
        throw new Error(ttsData.error);
      }
      if (ttsData.audio) {
        setIsPlayingAudio(true);
        const played = ttsData.isWav 
          ? await playWavBase64(ttsData.audio)
          : playPcmBase64(ttsData.audio);

        if (played) {
          activeAudioSourceRef.current = played;
          // Set duration timeout based on actual audio length or average speech speed
          const words = data.text.split(" ").length;
          const playDurationMs = played.duration 
            ? (played.duration * 1000 + 400)
            : Math.max((words / 2.5) * 1000 + 1200, 2500);
          
          setTimeout(() => {
            setIsPlayingAudio(false);
            setAgentState("idle");
          }, playDurationMs);
        } else {
          setAgentState("idle");
        }
      } else {
        setAgentState("idle");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Agent failed to respond.");
      setAgentSpeechText("Sorry, I spent a moment looking for that but ran into a glitch.");
      setAgentState("idle");
    }
  };

  // Turn voice capture ON or OFF
  const toggleListening = () => {
    if (isListeningRef.current) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setAgentState("idle");
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          // Restart recognition
          toast.error("Could not access microphone.");
        }
      } else {
        toast.error("Web Speech API not supported in this browser. Try typing your message.");
      }
    }
  };

  // Direct manual Chat submit
  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = chatInput.trim();
    if (!prompt) return;
    setChatInput("");
    handleAgentInteract(prompt);
  };

  // Read URLs or articles (Scraping simulated by feeding content block)
  const addArticleByUrl = async () => {
    const url = pastedUrl.trim();
    if (!url) return;
    setIsUploading(true);
    try {
      // Create readable summary wrapper
      const simulatedText = `Extracted article contents from: ${url}. Oblivion knowledge proxy fetched this article to find details. Use search grounding if newer references are needed.`;
      const domainName = new URL(url).hostname || "Webpage";
      
      const newDoc: DocumentMeta = {
        id: Math.random().toString(),
        title: `${domainName} Link Resource`,
        content: simulatedText
      };

      setDocuments(prev => [...prev, newDoc]);
      setPastedUrl("");
      toast.success(`Connected article link context from ${domainName}`);
    } catch (err) {
      toast.error("Invalid URL format.");
    } finally {
      setIsUploading(false);
    }
  };

  // Add custom manual document/paste content
  const handleDocAddManual = () => {
    const title = docTitle.trim() || "User Uploaded Paste";
    const text = docInputText.trim();
    if (!text) return;

    const newDoc: DocumentMeta = {
      id: Math.random().toString(),
      title,
      content: text
    };

    setDocuments(prev => [...prev, newDoc]);
    setDocTitle("");
    setDocInputText("");
    setShowDocModal(false);
    toast.success(`Custom context document "${title}" loaded`);
  };

  // Delete document context
  const deleteDocContext = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
    toast.success("Document context removed");
  };

  return (
    <>
      {/* 1. REAL-TIME OVERLAY FLOATING CAPTIONS (Subtitles) */}
      <AnimatePresence>
        {showCaptions && (agentState === "listening" || agentState === "speaking" || agentState === "thinking") && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 w-full max-w-xl px-6 py-4 glass rounded-2xl border border-white/10 z-40 text-center pointer-events-none"
          >
            <div className="text-[10px] uppercase tracking-[0.25em] text-cyan-400 font-bold mb-1">
              {agentState === "listening" ? "Transcribing You" : agentState === "thinking" ? "Grounded Reasoning" : "Vocal Delivery"}
            </div>
            <div className="text-sm font-sans tracking-wide text-white leading-relaxed">
              {agentState === "listening" && (
                <span className="text-white/90 italic">"{userSpeechText}"</span>
              )}
              {agentState === "thinking" && (
                <span className="text-white/50 animate-pulse">Consulting internet resources & formulating response...</span>
              )}
              {agentState === "speaking" && (
                <span className="text-cyan-300">"{agentSpeechText}"</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. THE FLOATING GLASSMORPHIC DRAGGABLE BLOB */}
      <div className="fixed bottom-24 right-8 z-30">
        <AnimatePresence>
          {!isOpen && (
            <motion.button
              layoutId="agent-container"
              whileHover={{ scale: 1.15, rotate: 4 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsOpen(true)}
              className="group relative h-16 w-16 rounded-full flex items-center justify-center cursor-pointer overflow-hidden shadow-2xl"
              style={{
                background: "radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.03) 100%)",
                boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.2)"
              }}
            >
              {/* Spinning organic glass rings using absolute absolute layout */}
              <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-[spin_5s_linear_infinite]" />
              <div className="absolute inset-0 rounded-full border border-purple-500/20 animate-[spin_8s_linear_infinite_reverse]" style={{ margin: "2px" }} />
              
              {/* The pulsing organic blob background glows */}
              <div className={`absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-400/20 via-purple-500/20 to-emerald-400/20 opacity-70 blur-md transition-transform duration-700 ${
                agentState === "listening" ? "scale-125 saturate-150 animate-pulse" :
                agentState === "thinking" ? "animate-[bounce_2s_infinite]" :
                agentState === "speaking" ? "scale-110 saturate-120 animate-pulse" : ""
              }`} />

              {/* Central Core Sphere */}
              <div className={`h-8 w-8 rounded-full flex items-center justify-center bg-white/10 border border-white/20 shadow-inner overflow-hidden transition-all duration-500 ${
                agentState === "listening" ? "bg-red-500/20 border-red-500/40" :
                agentState === "thinking" ? "bg-cyan-500/20 border-cyan-500/40" :
                agentState === "speaking" ? "bg-emerald-500/20 border-emerald-500/40" : ""
              }`}>
                {agentState === "listening" ? (
                  <Mic className="h-4 w-4 text-red-400 animate-pulse" />
                ) : agentState === "thinking" ? (
                  <Sparkles className="h-4 w-4 text-cyan-400 animate-spin" />
                ) : agentState === "speaking" ? (
                  <Volume2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Sparkles className="h-4 w-4 text-white/60 group-hover:text-cyan-400 transition-colors" />
                )}
              </div>
              
              {/* Backlight Glow Aura */}
              <div className="absolute -inset-1 rounded-full bg-cyan-400/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* 3. THE EXPANDED SCI-FI GLASS INTERFACE CARD */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              layoutId="agent-container"
              style={{
                background: "rgba(10, 12, 18, 0.45)",
                boxShadow: "0 20px 50px 0 rgba(0, 0, 0, 0.4)",
                backdropFilter: "blur(24px)",
                border: "1px solid rgba(255, 255, 255, 0.08)"
              }}
              className="absolute bottom-0 right-0 w-[420px] max-w-[90vw] h-[550px] rounded-3xl flex flex-col overflow-hidden z-40 text-white"
            >
              {/* Head Panel */}
              <div className="p-4-5 flex items-center justify-between border-b border-white/5 bg-white/[0.01]">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-500 flex items-center justify-center p-[1px] shadow-lg shadow-cyan-500/10">
                    <div className="h-full w-full rounded-full bg-black/80 flex items-center justify-center">
                      <Sparkles className="h-3 w-3 text-cyan-300" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Oblivion Agent</h3>
                    <p className="text-[9px] text-white/40 uppercase tracking-widest font-mono font-bold mt-0.5">Dual-Model Personal Voice</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => setShowCaptions(!showCaptions)}
                    className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all ${showCaptions ? 'text-cyan-400 bg-white/5 border border-white/10' : 'text-white/40 hover:text-white/70'}`}
                    title="Toggle Floating Captions Overlay"
                  >
                    <Languages className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="h-7 w-7 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4 flex flex-col">
                
                {/* 3D Wave Visualizer Frame */}
                <div className="flex flex-col items-center justify-center p-6 border border-white/5 rounded-2xl bg-black/20 relative overflow-hidden shrink-0">
                  <div className={`absolute inset-0 bg-gradient-to-tr from-cyan-500/5 via-transparent to-purple-500/5 transition-opacity duration-1000 ${
                    agentState !== "idle" ? "opacity-100" : "opacity-30"
                  }`} />

                  {/* Pulsing visual sound wave orb */}
                  <div className="relative h-24 w-24 flex items-center justify-center">
                    <motion.div
                      animate={agentState === "listening" ? { scale: [1, 1.25, 1], rotate: 360 } :
                               agentState === "thinking" ? { scale: [1.1, 0.95, 1.1], rotate: -180 } :
                               agentState === "speaking" ? { scale: [1, 1.15, 1.05, 1] } : { scale: 1 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className={`absolute inset-0 rounded-full bg-gradient-to-tr transition-all duration-700 filter blur-xl opacity-30 ${
                        agentState === "listening" ? "from-red-500 via-pink-400 to-purple-500 saturate-150" :
                        agentState === "thinking" ? "from-cyan-400 via-blue-500 to-purple-500 animate-pulse" :
                        agentState === "speaking" ? "from-emerald-400 via-teal-400 to-cyan-500 saturate-120" : 
                        "from-cyan-400/40 via-purple-500/20 to-white/10"
                      }`}
                    />
                    
                    {/* SVG Interactive Sound Wave Core */}
                    <svg className="w-20 h-20 relative z-10" viewBox="0 0 100 100">
                      {agentState === "listening" && (
                        <>
                          <circle cx="50" cy="50" r="28" fill="none" stroke="rgba(239, 68, 68, 0.3)" strokeWidth="1" className="animate-ping" />
                          <circle cx="50" cy="50" r="22" fill="none" stroke="rgba(239, 68, 68, 0.5)" strokeWidth="2" />
                          <path d="M 30 50 Q 40 20, 50 80 T 70 50" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" className="animate-[pulse_1s_infinite]" />
                        </>
                      )}
                      {agentState === "thinking" && (
                        <>
                          <circle cx="50" cy="50" r="25" fill="none" stroke="rgba(34, 211, 238, 0.3)" strokeWidth="2" strokeDasharray="10, 5" className="animate-[spin_4s_linear_infinite]" />
                          <circle cx="50" cy="50" r="16" fill="none" stroke="rgba(147, 51, 234, 0.5)" strokeWidth="3" strokeDasharray="5, 10" className="animate-[spin_2s_linear_infinite_reverse]" />
                        </>
                      )}
                      {agentState === "speaking" && (
                        <>
                          <circle cx="50" cy="50" r="24" fill="none" stroke="rgba(52, 211, 153, 0.3)" strokeWidth="1" className="animate-ping" />
                          <path d="M 25 50 Q 32 30, 40 70 T 55 30 T 70 65 T 75 50" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" className="animate-pulse" />
                        </>
                      )}
                      {agentState === "idle" && (
                        <circle cx="50" cy="50" r="22" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="2" className="animate-pulse" />
                      )}
                    </svg>
                  </div>

                  {/* Verbal Status Text */}
                  <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-white/50 z-10 mt-3 flex items-center gap-2">
                    {agentState === "listening" && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />}
                    {agentState === "speaking" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                    {agentState === "thinking" && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-spin" />}
                    {agentState === "idle" && <span className="w-1.5 h-1.5 rounded-full bg-white/20" />}
                    {agentState === "listening" ? "Listening to voice..." :
                     agentState === "thinking" ? "Thinking & Searching..." :
                     agentState === "speaking" ? "Speaking Response" :
                     "Tap Mic To Speak"}
                  </span>
                </div>

                {/* Grounded Web references references Section */}
                {searchSources.length > 0 && (
                  <div className="p-3 border border-cyan-500/10 rounded-2xl bg-cyan-500/[0.02] space-y-2 shrink-0">
                    <div className="flex items-center gap-1.5 text-cyan-400 text-[10px] uppercase tracking-wider font-bold">
                      <Search className="h-3 w-3" />
                      <span>Google Search Grounding Sources</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {searchSources.slice(0, 3).map((src, idx) => (
                        <a
                          key={idx}
                          href={src.uri}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-all text-left text-xs"
                        >
                          <span className="text-white/70 font-medium truncate max-w-[280px]">{src.title}</span>
                          <ExternalLink className="h-3 w-3 text-cyan-400/75 shrink-0 ml-2" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Documents, Article text parsing Dropzone */}
                <div className="p-3.5 border border-white/5 rounded-2xl bg-white/[0.01] space-y-3 shrink-0">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-white/40 font-bold">
                    <span className="flex items-center gap-1.5"><Files className="h-3.5 w-3.5" /> Context Documents ({documents.length})</span>
                    <button onClick={() => setShowDocModal(true)} className="text-cyan-400 hover:text-cyan-300 font-black">+ Create Paste</button>
                  </div>

                  {documents.length > 0 ? (
                    <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
                      {documents.map(doc => (
                        <div key={doc.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs shrink-0 text-white/80">
                          <span className="truncate max-w-[100px] text-[11px] font-sans">{doc.title}</span>
                          <button onClick={() => deleteDocContext(doc.id)} className="text-white/30 hover:text-red-400 transition-colors">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-white/20 text-[11px] text-center py-2 italic font-mono">
                      No documents loaded. Agent searches the live web only.
                    </div>
                  )}

                  {/* Pasting raw URL */}
                  <div className="flex gap-1.5">
                    <input
                      type="url"
                      value={pastedUrl}
                      onChange={e => setPastedUrl(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addArticleByUrl()}
                      placeholder="Paste article / web URL and press Enter..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs placeholder:text-white/30 text-white outline-none focus:border-cyan-500/50 transition-colors"
                    />
                    <button
                      onClick={addArticleByUrl}
                      className="px-3 rounded-xl bg-white/10 hover:bg-white/20 text-xs uppercase font-medium tracking-wide transition-colors"
                    >
                      Fetch
                    </button>
                  </div>
                </div>

                {/* Text Messages History list */}
                <div className="flex-1 flex flex-col min-h-[140px] border border-white/5 rounded-2xl bg-black/10 overflow-hidden">
                  <div className="p-2 border-b border-white/5 bg-white/[0.01] text-[9px] uppercase tracking-wider text-white/30 font-bold px-3">
                    Transcript Ledger
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2.5 no-scrollbar text-xs">
                    {responses.length > 0 ? (
                      responses.map((m, idx) => (
                        <div key={idx} className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}>
                          <div className={`p-2.5 rounded-2xl max-w-[85%] text-[13px] leading-relaxed ${
                            m.sender === "user" 
                              ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-100 rounded-tr-sm" 
                              : "bg-white/5 border border-white/10 text-white/90 rounded-tl-sm"
                          }`}>
                            {m.text}
                          </div>
                          <span className="text-[8px] text-white/20 mt-1 uppercase font-mono">
                            {m.sender === "user" ? "You" : "Oblivion Agent"}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="h-full flex items-center justify-center text-center text-white/30 italic p-4">
                        Voice transcripts & historical grounding logs will accumulate here.
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Text / Voice input trigger toolbar */}
              <div className="p-4 border-t border-white/5 bg-black/30 flex flex-col gap-3">
                
                {/* Voice presets select */}
                <div className="flex flex-col gap-1.5 text-[10px] uppercase font-mono tracking-wider text-white/30">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1 font-semibold text-white/50">Active Speaker: <span className="text-cyan-400">{activeVoice}</span></span>
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar col-span-3">
                    {/* Gemini Voices */}
                    {["Zephyr", "Kore", "Puck"].map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => {
                          setActiveVoice(v);
                          toast.success(`Active voice: Gemini ${v}`);
                        }}
                        className={`px-2 py-1 rounded-md border transition-all text-[9px] shrink-0 ${
                          activeVoice === v 
                            ? 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10 font-bold' 
                            : 'text-white/40 border-white/5 hover:text-white/80 hover:bg-white/5'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                    <div className="w-[1px] h-3 bg-white/10 self-center shrink-0" />
                    {/* Sarvam Indian Voices */}
                    {["Meera", "Pavan", "Kamlesh", "Arvind", "Lata", "Reema"].map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => {
                          setActiveVoice(v.toLowerCase());
                          toast.success(`Active voice: Sarvam ${v} (IN)`);
                        }}
                        className={`px-2 py-1 rounded-md border transition-all text-[9px] shrink-0 ${
                          activeVoice === v.toLowerCase() 
                            ? 'text-purple-400 border-purple-500/30 bg-purple-500/10 font-bold' 
                            : 'text-white/45 border-white/5 hover:text-white/80 hover:bg-white/5'
                        }`}
                      >
                        {v} (IN)
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleChatSubmit} className="flex gap-2 items-center">
                  {/* Floating Toggle Voice capture Mic */}
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`h-11 w-11 rounded-xl flex items-center justify-center shadow-lg transition-all border ${
                      agentState === "listening"
                        ? "bg-red-500/20 border-red-500/40 text-red-400 animate-pulse"
                        : "bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-cyan-400"
                    }`}
                    title="Activate Microphone"
                  >
                    {agentState === "listening" ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </button>

                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder={agentState === "listening" ? "Listening..." : "Type task, query or topic..."}
                    disabled={agentState === "listening"}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl h-11 px-4 text-xs placeholder:text-white/30 text-white outline-none focus:border-cyan-500/50 focus:bg-white/[0.07] transition-all"
                  />

                  <button
                    type="submit"
                    disabled={agentState === "listening" || !chatInput.trim()}
                    className="h-11 px-4.5 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-white/90 disabled:opacity-30 disabled:hover:bg-white transition-all shadow-md shadow-white/5"
                  >
                    Send
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Manual Paste/Create context Document Modal */}
      <AnimatePresence>
        {showDocModal && (
          <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="w-full max-w-md glass border border-white/10 rounded-3xl p-6 space-y-4 shadow-2xl text-white"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <span className="text-xs uppercase tracking-[0.2em] font-black text-white/80">Add Document Context</span>
                <button onClick={() => setShowDocModal(false)} className="text-white/40 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Document Title</label>
                  <input
                    type="text"
                    value={docTitle}
                    onChange={e => setDocTitle(e.target.value)}
                    placeholder="e.g. Project Notes, Article PDF, React Guide..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs placeholder:text-white/20 text-white outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Content Text / Article Copy-Paste</label>
                  <textarea
                    rows={6}
                    value={docInputText}
                    onChange={e => setDocInputText(e.target.value)}
                    placeholder="Paste your logs, notes, articles, documents, code snippets, or texts here..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs placeholder:text-white/20 text-white outline-none focus:border-cyan-500/50 transition-colors font-mono resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 justify-end text-xs font-bold uppercase tracking-wider">
                <button
                  onClick={() => setShowDocModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDocAddManual}
                  disabled={!docInputText.trim()}
                  className="px-5 py-2.5 rounded-xl bg-cyan-400 text-black hover:bg-cyan-300 disabled:opacity-40 disabled:hover:bg-cyan-400 transition-colors"
                >
                  Load Context
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
