import React, { useEffect, useMemo, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { BarChart2, Brain, Coffee, Flame, LayoutList, RotateCcw, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/src/components/ui/button'
import { Panel, db, handleFirestoreError } from '@/src/App'
import { collection, deleteDoc, doc, getDocs, onSnapshot, query, setDoc, where } from 'firebase/firestore'
import type { User } from 'firebase/auth'

function StatCard({ label, value, icon, color }: { label: string, value: string, icon: React.ReactNode, color: string }) {
  return (
    <div className={`relative min-h-[122px] overflow-hidden rounded-[1.35rem] p-4 sm:p-5 border border-white/10 bg-gradient-to-br ${color} group transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:shadow-xl hover:shadow-black/20`}>
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-5">
          <div className="text-white/90 p-2 rounded-xl bg-black/15 border border-white/10">{icon}</div>
          <span className="text-[9px] font-mono tracking-widest text-white/35">LIVE</span>
        </div>
        <div className="mt-auto">
          <div className="text-[9px] uppercase tracking-[0.18em] text-white/55 font-bold mb-1">{label}</div>
          <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">{value}</div>
        </div>
      </div>
      <div className="absolute top-0 right-0 -mr-7 -mt-7 opacity-[0.08] group-hover:opacity-[0.15] transition-opacity duration-300">
        {React.cloneElement(icon as React.ReactElement<{ size?: number }>, { size: 112 })}
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
    <Panel open={open} onClose={onClose} title="Focus Insights & Analytics" icon={<BarChart2 className="h-4 w-4" />} width="max-w-5xl">
      <div className="p-4 sm:p-6 md:p-8 h-full flex flex-col gap-5 overflow-auto thin-scroll bg-[radial-gradient(circle_at_top_right,rgba(232,112,42,0.08),transparent_34%),#09090b]">

        {/* Header with Timeframe Filter */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-white/10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-orange-400/10 border border-orange-400/20 text-[9px] uppercase tracking-[0.2em] font-bold text-orange-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" /> Personal operating system
            </div>
            <div className="flex items-center gap-2.5 mb-1">
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Focus Analytics
              </h2>
            </div>
            <p className="text-xs text-white/40 font-medium">Real-time personalized workflow metrics & interactive trends.</p>
          </div>

          <div className="flex max-w-full overflow-x-auto bg-white/5 border border-white/10 rounded-xl p-1 self-start no-scrollbar">
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
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          <StatCard label="Streak" value={`${pomoCycles > 0 ? 1 : 0} days`} icon={<Flame className="h-4 w-4" />} color="from-orange-600/60 to-red-600/40" />
          <StatCard label="Focus Time" value={formatFocusTime(totalFocusTimeMinutes)} icon={<Zap className="h-4 w-4" />} color="from-amber-600/60 to-orange-600/40" />
          <StatCard label="Focus Score" value={String(focusScore)} icon={<Brain className="h-4 w-4" />} color="from-indigo-600/60 to-purple-600/40" />
          <StatCard label="Tasks Done" value={String(tasksDone)} icon={<LayoutList className="h-4 w-4" />} color="from-emerald-600/60 to-teal-600/40" />
          <StatCard label="Sessions" value={String(Math.max(sessions.length, pomoCycles))} icon={<RotateCcw className="h-4 w-4" />} color="from-blue-600/60 to-cyan-600/40" />
          <StatCard label="Break Time" value={`${(pomoCycles * 5).toFixed(0)}m`} icon={<Coffee className="h-4 w-4" />} color="from-pink-600/60 to-rose-600/40" />
        </div>

        {/* Interactive Animated Chart Section */}
        <div className="p-4 sm:p-6 rounded-[1.5rem] bg-white/[0.025] border border-white/10 flex flex-col space-y-4 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/5">
            <div>
              <h3 className="text-xs uppercase tracking-[0.2em] text-white/50 font-bold">Productivity Metrics</h3>
              <p className="text-[10px] text-white/30">Showing {timeRange === '7d' ? 'last 7 days' : timeRange === '30d' ? 'last 30 days' : 'historical'} breakdown</p>
            </div>

            {/* Metric Switcher */}
            <div className="flex max-w-full overflow-x-auto bg-black/40 border border-white/10 rounded-lg p-1 text-[10px] font-bold uppercase tracking-wider no-scrollbar">
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

          <div className="w-full h-[230px] sm:h-[280px] relative pt-2">
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
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


export { StatsPanel }
