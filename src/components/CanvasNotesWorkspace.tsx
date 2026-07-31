import React, { useState, useEffect, useMemo, useRef, useCallback, startTransition } from 'react'
import {
  Plus, Trash2, X, Search, Maximize2, Minimize2, ZoomIn, ZoomOut,
  Command, FileText, Layers, MapPin, Layout, Share2, Sparkles,
  Bold, Italic, Heading2, CheckSquare, List, Move, Eye, Save, Cloud,
  GripVertical, Palette, Lock, ArrowUpRight, Check, ChevronRight
} from 'lucide-react'
import { Panel } from '@/src/App'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { toast } from 'sonner'
import { initializeApp, getApps, getApp } from 'firebase/app'
import { User } from 'firebase/auth'
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore'
import firebaseConfig from '@/firebase-applet-config.json'

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
const firestoreDbId = (firebaseConfig as any).firestoreDatabaseId || 'ai-studio-0d0d80dd-7827-43ff-af09-0e4f6ee44d44'
const db = getFirestore(app, firestoreDbId)

export type ArtifactKind = 'document' | 'map' | 'kit' | 'lore' | 'canvas' | 'graph'

export interface Artifact {
  id: string
  kind: ArtifactKind
  title: string
  subtitle: string
  content: string
  x: number
  y: number
  w: number
  h: number
  tone: 'paper' | 'panel' | 'tint'
  color?: string
}

type FocusMode = 'all' | 'index' | 'board' | 'editor'

const STORAGE_KEY = 'oblivion.canvas_workspace.v1'
const DEFAULT_BOARD_W = 2800
const DEFAULT_BOARD_H = 2000

// Default single initial note requested by user
const DEFAULT_ARTIFACTS: Artifact[] = [
  {
    id: 'a-start',
    kind: 'document',
    title: 'Start here! Your first note!',
    subtitle: 'Notes & Ideas',
    content: `# Start here! Your first note!\n\nWelcome to your endless spatial workspace!\n\n- Drag notes anywhere on the canvas\n- Use zoom & pan controls to organize your thoughts\n- Edit notes live on the right panel\n- Press Cmd+K / Ctrl+K for quick command search`,
    x: 140,
    y: 120,
    w: 360,
    h: 360,
    tone: 'paper'
  }
]

export function CanvasNotesWorkspacePanel({
  open,
  onClose,
  user
}: {
  open: boolean
  onClose: () => void
  user: User | null
}) {
  const [zenMode, setZenMode] = useState(false)
  const [savedStamp, setSavedStamp] = useState<string>('Saved locally')
  const [compact, setCompact] = useState(false)
  const [focusMode, setFocusMode] = useState<FocusMode>('all')
  const [query, setQuery] = useState('')
  const [cmdOpen, setCmdOpen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [boardOffset, setBoardOffset] = useState({ x: 40, y: 40 })
  const [editorWidth, setEditorWidth] = useState(440)
  const [draggingDivider, setDraggingDivider] = useState(false)
  const [panning, setPanning] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [draggingArtifact, setDraggingArtifact] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState('a-start')
  const [projectTitle, setProjectTitle] = useState('Start here! Your first note!')
  const [noteContent, setNoteContent] = useState(DEFAULT_ARTIFACTS[0].content)
  const [artifacts, setArtifacts] = useState<Artifact[]>(DEFAULT_ARTIFACTS)

  const rootRef = useRef<HTMLDivElement | null>(null)
  const boardPaneRef = useRef<HTMLDivElement | null>(null)
  const editorRef = useRef<HTMLTextAreaElement | null>(null)
  const saveTimerRef = useRef<number | null>(null)
  const isRemoteSyncRef = useRef(false)

  // Responsive Check
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const resize = () => startTransition(() => setCompact(window.innerWidth < 1024))
      resize()
      window.addEventListener('resize', resize)
      return () => window.removeEventListener('resize', resize)
    }
  }, [])

  // Cmd+K shortcut
  useEffect(() => {
    if (!open || typeof window === 'undefined') return
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        startTransition(() => setCmdOpen((v) => !v))
      }
      if (event.key === 'Escape') startTransition(() => setCmdOpen(false))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Load persistence (Local or Firebase)
  useEffect(() => {
    if (!open) return

    if (user) {
      // User is logged in: sync with Firestore under users/{user.uid}/canvas/workspace
      const docRef = doc(db, 'users', user.uid, 'canvas', 'data')
      const unsub = onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data()
          if (Array.isArray(data.artifacts) && data.artifacts.length > 0) {
            isRemoteSyncRef.current = true
            startTransition(() => {
              setArtifacts(data.artifacts)
              if (data.selectedId) setSelectedId(data.selectedId)
              if (data.zoom) setZoom(data.zoom)
              if (data.boardOffset) setBoardOffset(data.boardOffset)
            })
            setSavedStamp('Cloud synced')
          }
        }
      }, (err) => {
        console.error('Firestore Canvas Load Error:', err)
      })
      return () => unsub()
    } else {
      // Offline/Guest mode: load from LocalStorage
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const data = JSON.parse(raw)
          startTransition(() => {
            if (Array.isArray(data.artifacts) && data.artifacts.length > 0) setArtifacts(data.artifacts)
            if (data.selectedId) setSelectedId(data.selectedId)
            if (data.zoom) setZoom(data.zoom)
            if (data.boardOffset) setBoardOffset(data.boardOffset)
            if (data.editorWidth) setEditorWidth(data.editorWidth)
          })
          setSavedStamp('Saved locally')
        }
      } catch {}
    }
  }, [open, user])

  // Auto-save logic
  useEffect(() => {
    if (!open) return

    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
    saveTimerRef.current = window.setTimeout(() => {
      const payload = {
        artifacts,
        selectedId,
        zoom,
        boardOffset,
        editorWidth,
        updatedAt: Date.now()
      }

      if (user) {
        if (isRemoteSyncRef.current) {
          isRemoteSyncRef.current = false
          return
        }
        const docRef = doc(db, 'users', user.uid, 'canvas', 'data')
        setDoc(docRef, payload, { merge: true })
          .then(() => setSavedStamp('Cloud synced'))
          .catch(() => setSavedStamp('Sync failed'))
      } else {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
          setSavedStamp('Saved locally')
        } catch {}
      }
    }, 400)

    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
    }
  }, [open, artifacts, selectedId, zoom, boardOffset, editorWidth, user])

  // Selected item sync
  const selected = useMemo(
    () => artifacts.find((a) => a.id === selectedId) || artifacts[0],
    [artifacts, selectedId]
  )

  useEffect(() => {
    if (!selected) return
    startTransition(() => {
      setProjectTitle(selected.title)
      setNoteContent(selected.content)
    })
  }, [selected?.id])

  const filteredArtifacts = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return artifacts
    return artifacts.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.subtitle.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q)
    )
  }, [artifacts, query])

  const wordCount = useMemo(
    () => (noteContent.trim().length > 0 ? noteContent.trim().split(/\s+/).length : 0),
    [noteContent]
  )

  const applySelection = useCallback(
    (id: string) => {
      const target = artifacts.find((a) => a.id === id)
      if (!target || !boardPaneRef.current) return
      const pane = boardPaneRef.current.getBoundingClientRect()
      const nextX = pane.width / 2 - (target.x + target.w / 2) * zoom
      const nextY = pane.height / 2 - (target.y + target.h / 2) * zoom
      startTransition(() => {
        setSelectedId(id)
        setBoardOffset({ x: nextX, y: nextY })
        if (compact) setFocusMode('board')
        setCmdOpen(false)
      })
    },
    [artifacts, compact, zoom]
  )

  const updateSelected = useCallback(
    (titleValue: string, bodyValue: string) => {
      if (!selected) return
      startTransition(() => {
        setProjectTitle(titleValue)
        setNoteContent(bodyValue)
        setArtifacts((prev) =>
          prev.map((a) =>
            a.id === selected.id ? { ...a, title: titleValue, content: bodyValue } : a
          )
        )
      })
    },
    [selected]
  )

  const beginDividerDrag = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (compact) return
    event.currentTarget.setPointerCapture(event.pointerId)
    startTransition(() => {
      setDraggingDivider(true)
      setDragStart({ x: event.clientX, y: event.clientY })
    })
  }, [compact])

  const beginArtifactDrag = useCallback((event: React.PointerEvent<HTMLDivElement>, id: string) => {
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    startTransition(() => {
      setDraggingArtifact(id)
      setSelectedId(id)
      setDragStart({ x: event.clientX, y: event.clientY })
    })
  }, [])

  const addArtifact = useCallback((kind: ArtifactKind) => {
    const id = `art-${Date.now()}`
    const offsetBaseX = Math.abs(boardOffset.x) + 200
    const offsetBaseY = Math.abs(boardOffset.y) + 200

    let item: Artifact = {
      id,
      kind,
      title: 'New Note',
      subtitle: 'Notes & Ideas',
      content: '# New Note\n\nWrite your scene or project ideas here...',
      x: offsetBaseX,
      y: offsetBaseY,
      w: 320,
      h: 320,
      tone: 'paper'
    }

    if (kind === 'map') {
      item = {
        ...item,
        title: 'Spatial Canvas Map',
        subtitle: 'Maps & Diagrams',
        content: 'Routes, nodes, and spatial relationships mapped out.',
        w: 420,
        h: 280,
        tone: 'panel'
      }
    } else if (kind === 'graph') {
      item = {
        ...item,
        title: 'Concept Node',
        subtitle: 'Plot & Structure',
        content: 'Node: Trigger → Action → Result',
        w: 300,
        h: 200,
        tone: 'panel'
      }
    } else if (kind === 'canvas') {
      item = {
        ...item,
        title: 'Idea Card',
        subtitle: 'Quick Thought',
        content: 'Loose scene fragment or inspiration anchor.',
        w: 280,
        h: 180,
        tone: 'tint'
      }
    }

    startTransition(() => {
      setArtifacts((prev) => [...prev, item])
      setSelectedId(id)
    })
    toast.success(`Added new ${kind} artifact to canvas!`)
  }, [boardOffset])

  const deleteArtifact = useCallback((id: string) => {
    if (artifacts.length <= 1) {
      toast.error('Canvas needs at least one note!')
      return
    }
    startTransition(() => {
      const next = artifacts.filter(a => a.id !== id)
      setArtifacts(next)
      if (selectedId === id && next.length > 0) {
        setSelectedId(next[0].id)
      }
    })
    toast.success('Note removed from canvas')
  }, [artifacts, selectedId])

  const onRootPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (draggingDivider && rootRef.current) {
        const rect = rootRef.current.getBoundingClientRect()
        const next = rect.right - event.clientX
        startTransition(() => setEditorWidth(Math.max(320, Math.min(760, next))))
        return
      }
      if (panning) {
        const dx = event.clientX - dragStart.x
        const dy = event.clientY - dragStart.y
        startTransition(() => {
          setBoardOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }))
          setDragStart({ x: event.clientX, y: event.clientY })
        })
        return
      }
      if (draggingArtifact) {
        const dx = (event.clientX - dragStart.x) / zoom
        const dy = (event.clientY - dragStart.y) / zoom
        startTransition(() => {
          setArtifacts((prev) =>
            prev.map((a) =>
              a.id === draggingArtifact ? { ...a, x: a.x + dx, y: a.y + dy } : a
            )
          )
          setDragStart({ x: event.clientX, y: event.clientY })
        })
      }
    },
    [draggingDivider, panning, draggingArtifact, dragStart.x, dragStart.y, zoom]
  )

  const endPointerActions = useCallback(() => {
    startTransition(() => {
      setDraggingDivider(false)
      setPanning(false)
      setDraggingArtifact(null)
    })
  }, [])

  const paneLayout = useMemo(() => {
    if (!compact) return 'desktop'
    if (focusMode === 'index') return 'index'
    if (focusMode === 'editor') return 'editor'
    return 'board'
  }, [compact, focusMode])

  return (
    <Panel open={open} onClose={onClose} title="Endless Canvas & Notes Workspace" icon={<Layout className="h-4 w-4 text-orange-400" />} width="max-w-[95vw]">
      <div
        ref={rootRef}
        onPointerMove={onRootPointerMove}
        onPointerUp={endPointerActions}
        onPointerCancel={endPointerActions}
        className="relative w-full h-[78vh] min-h-[580px] bg-zinc-950 border border-white/10 rounded-xl overflow-hidden font-sans text-white select-none flex flex-col"
      >
        {/* Top Header Controls Bar */}
        {!zenMode && (
          <header className="h-12 border-b border-white/10 bg-black/60 backdrop-blur-xl px-4 flex items-center justify-between shrink-0 z-20">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2">
                  <span>Oblivion Canvas Workspace</span>
                </h3>
              </div>
              <span className="text-[10px] text-white/40 font-mono flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/5">
                <Cloud className="h-3 w-3 text-emerald-400" />
                {savedStamp}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => startTransition(() => setCmdOpen(true))}
                className="h-8 text-xs bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 gap-1.5"
                title="Command Palette (Cmd+K)"
              >
                <Command className="h-3.5 w-3.5 text-orange-400" />
                <span className="hidden sm:inline">Search</span>
                <kbd className="text-[9px] font-mono bg-black/40 px-1.5 py-0.5 rounded text-white/50 border border-white/10">⌘K</kbd>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => startTransition(() => setZenMode(true))}
                className="h-8 text-xs bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 gap-1"
                title="Zen Mode"
              >
                <Maximize2 className="h-3.5 w-3.5 text-white/60" />
                <span className="hidden sm:inline">Zen Mode</span>
              </Button>
            </div>
          </header>
        )}

        {/* Main 3-Column Workspace Layout */}
        <div className="grid flex-1 min-h-0 w-full overflow-hidden" style={{ gridTemplateColumns: compact ? '1fr' : `240px minmax(0, 1fr) 6px minmax(320px, ${editorWidth}px)` }}>
          
          {/* 1. Left Index Drawer / Directory */}
          {(paneLayout === 'desktop' || paneLayout === 'index') && (
            <aside className="bg-zinc-900/90 border-r border-white/10 flex flex-col min-h-0 divide-y divide-white/10">
              <div className="p-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
                  <Input
                    value={query}
                    onChange={(e) => startTransition(() => setQuery(e.target.value))}
                    placeholder="Filter canvas notes…"
                    className="pl-8 bg-white/5 border-white/10 text-white placeholder:text-white/30 h-8 text-xs rounded-lg"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto thin-scroll p-2 space-y-3">
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold tracking-widest text-white/40 px-2.5 py-1 flex items-center justify-between">
                    <span>Artifacts ({filteredArtifacts.length})</span>
                    <Layers className="h-3 w-3 text-white/30" />
                  </div>
                  {filteredArtifacts.map((artifact) => {
                    const isSelected = selectedId === artifact.id
                    return (
                      <div
                        key={artifact.id}
                        onClick={() => applySelection(artifact.id)}
                        className={`group relative w-full text-left p-2.5 rounded-xl transition-all cursor-pointer border flex items-center justify-between ${
                          isSelected
                            ? 'bg-orange-500/15 border-orange-500/40 text-white shadow-lg'
                            : 'bg-white/[0.02] hover:bg-white/5 border-white/5 text-white/70 hover:text-white'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold truncate flex items-center gap-2">
                            {artifact.kind === 'map' ? <MapPin className="h-3.5 w-3.5 text-sky-400 shrink-0" /> : <FileText className="h-3.5 w-3.5 text-orange-400 shrink-0" />}
                            <span className="truncate">{artifact.title || 'Untitled Note'}</span>
                          </div>
                          <div className="text-[10px] text-white/40 mt-0.5 truncate">{artifact.subtitle || 'Note'}</div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteArtifact(artifact.id)
                          }}
                          className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 p-1 transition-opacity"
                          title="Delete note"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="p-3 bg-black/30">
                <Button
                  onClick={() => addArtifact('document')}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold h-9 shadow-lg shadow-orange-500/20 gap-1.5"
                >
                  <Plus className="h-4 w-4" /> New Canvas Note
                </Button>
              </div>
            </aside>
          )}

          {/* 2. Center Infinite Spatial Canvas Board */}
          {(paneLayout === 'desktop' || paneLayout === 'board') && (
            <section
              ref={boardPaneRef}
              aria-label="Spatial board"
              onWheel={(event) => {
                event.preventDefault()
                const delta = event.deltaY > 0 ? -0.06 : 0.06
                startTransition(() =>
                  setZoom((value) => Math.max(0.35, Math.min(2.5, value + delta)))
                )
              }}
              onPointerDown={(event) => {
                if (event.button !== 0) return
                startTransition(() => {
                  setPanning(true)
                  setDragStart({ x: event.clientX, y: event.clientY })
                })
              }}
              className="relative overflow-hidden bg-[#090b0e] cursor-grab active:cursor-grabbing select-none"
              style={{
                backgroundImage: 'radial-gradient(rgba(255,255,255,0.14) 1px, transparent 1px)',
                backgroundSize: '22px 22px'
              }}
            >
              {/* Floating Zoom & Canvas Controls */}
              <div className="absolute right-4 top-4 z-30 flex items-center gap-1.5 bg-black/60 backdrop-blur-xl border border-white/15 p-1 rounded-xl shadow-2xl">
                <button
                  onClick={() => startTransition(() => setZoom((v) => Math.max(0.35, v - 0.1)))}
                  className="h-7 w-7 rounded-lg hover:bg-white/10 text-white/80 hover:text-white flex items-center justify-center transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <span className="text-[11px] font-mono font-bold text-white/90 px-2 min-w-[48px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => startTransition(() => setZoom((v) => Math.min(2.5, v + 0.1)))}
                  className="h-7 w-7 rounded-lg hover:bg-white/10 text-white/80 hover:text-white flex items-center justify-center transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
                <div className="h-4 w-[1px] bg-white/10 mx-1" />
                <button
                  onClick={() => startTransition(() => { setZoom(1); setBoardOffset({ x: 40, y: 40 }); })}
                  className="px-2 py-1 text-[10px] uppercase font-bold text-white/50 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                  title="Reset View"
                >
                  Reset
                </button>
              </div>

              {/* Infinite Board Layer */}
              <div
                className="absolute transition-transform duration-75 ease-out"
                style={{
                  left: boardOffset.x,
                  top: boardOffset.y,
                  width: DEFAULT_BOARD_W,
                  height: DEFAULT_BOARD_H,
                  transform: `scale(${zoom})`,
                  transformOrigin: '0 0'
                }}
              >
                {artifacts.map((artifact) => {
                  const isSelected = selectedId === artifact.id
                  return (
                    <div
                      key={artifact.id}
                      onPointerDown={(event) => beginArtifactDrag(event, artifact.id)}
                      className={`absolute rounded-2xl p-4 transition-all duration-150 cursor-grab active:cursor-grabbing border shadow-2xl backdrop-blur-md ${
                        isSelected
                          ? 'border-orange-500 ring-2 ring-orange-500/40 shadow-orange-500/20 z-20 scale-[1.01]'
                          : 'border-white/10 bg-zinc-900/90 text-white hover:border-white/20 z-10'
                      }`}
                      style={{
                        left: artifact.x,
                        top: artifact.y,
                        width: artifact.w,
                        height: artifact.h,
                        backgroundColor: artifact.tone === 'paper' ? '#18181b' : artifact.tone === 'tint' ? '#0f172a' : '#121215'
                      }}
                    >
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                        <div className="flex items-center gap-2 truncate">
                          <GripVertical className="h-4 w-4 text-white/30 cursor-grab shrink-0" />
                          <span className="text-xs font-bold text-white truncate">{artifact.title || 'Untitled Note'}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteArtifact(artifact.id)
                          }}
                          className="text-white/30 hover:text-red-400 transition-colors p-1"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="text-[10px] text-orange-400 font-semibold uppercase tracking-wider mb-2">
                        {artifact.subtitle || 'Notes'}
                      </div>

                      <div className="text-xs leading-relaxed text-white/80 whitespace-pre-wrap font-sans overflow-hidden line-clamp-[9]">
                        {artifact.content}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Bottom Quick Create Toolbar */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-black/80 backdrop-blur-2xl border border-white/15 p-2 rounded-2xl shadow-2xl">
                <span className="text-[10px] uppercase tracking-widest font-bold text-white/40 px-2">Add</span>
                <Button
                  size="sm"
                  onClick={() => addArtifact('document')}
                  className="bg-white/10 hover:bg-white/20 text-white text-xs h-8 rounded-xl border border-white/10 gap-1.5"
                >
                  <FileText className="h-3.5 w-3.5 text-orange-400" /> Note
                </Button>
                <Button
                  size="sm"
                  onClick={() => addArtifact('canvas')}
                  className="bg-white/10 hover:bg-white/20 text-white text-xs h-8 rounded-xl border border-white/10 gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5 text-sky-400" /> Idea Card
                </Button>
                <Button
                  size="sm"
                  onClick={() => addArtifact('map')}
                  className="bg-white/10 hover:bg-white/20 text-white text-xs h-8 rounded-xl border border-white/10 gap-1.5"
                >
                  <MapPin className="h-3.5 w-3.5 text-emerald-400" /> Map Board
                </Button>
                <Button
                  size="sm"
                  onClick={() => addArtifact('graph')}
                  className="bg-white/10 hover:bg-white/20 text-white text-xs h-8 rounded-xl border border-white/10 gap-1.5"
                >
                  <Layers className="h-3.5 w-3.5 text-amber-400" /> Node
                </Button>
              </div>
            </section>
          )}

          {/* Resizable Divider */}
          {!compact && (
            <div
              role="separator"
              onPointerDown={beginDividerDrag}
              className="bg-white/10 hover:bg-orange-500 cursor-col-resize transition-colors z-20"
            />
          )}

          {/* 3. Right Markdown Synced Editor Pane */}
          {(paneLayout === 'desktop' || paneLayout === 'editor') && (
            <aside className="bg-zinc-900/95 border-l border-white/10 flex flex-col min-h-0 divide-y divide-white/10">
              <div className="p-4 bg-black/20 space-y-2">
                <Input
                  value={projectTitle}
                  onChange={(e) => updateSelected(e.target.value, noteContent)}
                  className="bg-transparent border-0 text-base font-bold text-white placeholder:text-white/30 focus-visible:ring-0 px-0 h-8"
                  placeholder="Note Title"
                />
                <div className="flex items-center justify-between text-[11px] text-white/40 font-mono">
                  <span>{wordCount} words · {noteContent.length} characters</span>
                  <span className="text-orange-400 font-sans font-semibold">Live synced to canvas</span>
                </div>
              </div>

              {/* Toolbar */}
              <div className="px-3 py-2 bg-white/[0.02] flex items-center gap-1.5 overflow-x-auto thin-scroll">
                <button
                  onClick={() => {
                    const el = editorRef.current
                    if (!el) return
                    const start = el.selectionStart ?? 0
                    const end = el.selectionEnd ?? 0
                    const txt = noteContent.slice(start, end)
                    updateSelected(projectTitle, `${noteContent.slice(0, start)}**${txt}**${noteContent.slice(end)}`)
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white text-xs"
                  title="Bold (**text**)"
                >
                  <Bold className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => {
                    const el = editorRef.current
                    if (!el) return
                    const start = el.selectionStart ?? 0
                    const end = el.selectionEnd ?? 0
                    const txt = noteContent.slice(start, end)
                    updateSelected(projectTitle, `${noteContent.slice(0, start)}*${txt}*${noteContent.slice(end)}`)
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white text-xs"
                  title="Italic (*text*)"
                >
                  <Italic className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => {
                    const el = editorRef.current
                    if (!el) return
                    const start = el.selectionStart ?? 0
                    updateSelected(projectTitle, `${noteContent.slice(0, start)}\n## ${noteContent.slice(start)}`)
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white text-xs"
                  title="Heading 2 (## Title)"
                >
                  <Heading2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => {
                    const el = editorRef.current
                    if (!el) return
                    const start = el.selectionStart ?? 0
                    updateSelected(projectTitle, `${noteContent.slice(0, start)}\n- [ ] ${noteContent.slice(start)}`)
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white text-xs"
                  title="Checklist item (- [ ])"
                >
                  <CheckSquare className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => {
                    const el = editorRef.current
                    if (!el) return
                    const start = el.selectionStart ?? 0
                    updateSelected(projectTitle, `${noteContent.slice(0, start)}\n- ${noteContent.slice(start)}`)
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white text-xs"
                  title="Bullet list (- item)"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Textarea */}
              <textarea
                ref={editorRef}
                value={noteContent}
                onChange={(e) => updateSelected(projectTitle, e.target.value)}
                placeholder="Type markdown note contents here..."
                className="flex-1 w-full bg-transparent p-4 text-xs font-mono leading-relaxed text-white/90 placeholder:text-white/30 resize-none focus:outline-none thin-scroll"
              />
            </aside>
          )}
        </div>

        {/* Mobile Pane Switcher */}
        {compact && (
          <div className="p-2 bg-black/80 border-t border-white/10 flex items-center justify-center gap-2 z-30">
            <Button
              variant={focusMode === 'index' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => startTransition(() => setFocusMode('index'))}
              className="text-xs h-8"
            >
              Index
            </Button>
            <Button
              variant={focusMode === 'board' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => startTransition(() => setFocusMode('board'))}
              className="text-xs h-8"
            >
              Board
            </Button>
            <Button
              variant={focusMode === 'editor' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => startTransition(() => setFocusMode('editor'))}
              className="text-xs h-8"
            >
              Editor
            </Button>
          </div>
        )}

        {/* Floating Command Search Palette */}
        {cmdOpen && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md z-50 flex items-start justify-center pt-16">
            <div className="w-full max-w-lg bg-zinc-900 border border-white/20 rounded-2xl p-4 shadow-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Command className="h-4 w-4 text-orange-400" />
                  <span>Command Search</span>
                </div>
                <button onClick={() => startTransition(() => setCmdOpen(false))} className="text-white/40 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <Input
                value={query}
                onChange={(e) => startTransition(() => setQuery(e.target.value))}
                placeholder="Type note title or keywords..."
                className="bg-white/5 border-white/10 text-white text-xs h-9"
                autoFocus
              />

              <div className="max-h-64 overflow-y-auto thin-scroll space-y-1 pt-1">
                {filteredArtifacts.map((artifact) => (
                  <button
                    key={`cmd-${artifact.id}`}
                    onClick={() => applySelection(artifact.id)}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <div className="font-semibold">{artifact.title || 'Untitled Note'}</div>
                      <div className="text-[10px] text-white/40 truncate">{artifact.subtitle}</div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-white/30" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Exit Zen Mode floating button */}
        {zenMode && (
          <Button
            onClick={() => startTransition(() => setZenMode(false))}
            className="absolute top-4 right-4 z-50 bg-black/60 hover:bg-black/80 text-white border border-white/20 text-xs h-8 rounded-full"
          >
            <Minimize2 className="h-3.5 w-3.5 mr-1" /> Exit Zen
          </Button>
        )}
      </div>
    </Panel>
  )
}
