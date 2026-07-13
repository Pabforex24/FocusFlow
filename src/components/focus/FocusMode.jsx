'use client'

import { useEffect, useRef, useState } from 'react'
import { useStore } from '@/store'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { hexToRgba, cn } from '@/lib/utils'
import { Play, Pause, Square, CheckCircle2, X, Timer, Zap } from 'lucide-react'


const DURATIONS = [15, 25, 45, 60]

export function FocusMode({ onClose, initialTask }: FocusModeProps) {
  const {
    focusSession, startFocus, tickFocus, pauseFocus,
    resumeFocus, completeFocus, abandonFocus, tasks,
  } = useStore()

  const [selectedTaskId, setSelectedTaskId] = useState(initialTask?.id)
  const [confirmAbandon, setConfirmAbandon]   = useState(false)
  const [selectedDuration, setSelectedDuration] = useState(25)
  const intervalRef = useRef | null>(null)

  const todayStr = new Date().toDateString()
  const todayPending = tasks.filter(
    (t) => !t.done && new Date(t.scheduledAt).toDateString() === todayStr
  )

  // Tick every second when running
  // On utilise Date.now() dans le store pour survivre à la mise en veille
  useEffect(() => {
    if (focusSession?.status === 'running') {
      // Tick immédiat pour rattraper le temps écoulé en veille
      tickFocus()
      intervalRef.current = setInterval(() => tickFocus(), 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [focusSession?.status])

  // Rattrapage au retour de veille (visibilitychange)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && focusSession?.status === 'running') {
        tickFocus() // recalcule immédiatement avec Date.now()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [focusSession?.status])

  const session = focusSession
  const isIdle = !session || session.status === 'idle'
  const isRunning = session?.status === 'running'
  const isPaused = session?.status === 'paused'
  const isDone = session?.status === 'done'
  const isAbandoned = session?.status === 'abandoned'

  const totalSeconds = (session?.durationMinutes || selectedDuration) * 60
  const elapsed = session?.elapsedSeconds || 0
  const remaining = Math.max(0, totalSeconds - elapsed)
  const pct = session ? (elapsed / totalSeconds) * 100 : 0

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')

  const activeTask = tasks.find((t) => t.id === (session?.taskId || selectedTaskId))
  const r = 54
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-sm bg-bg-2 border border-border-2 rounded-3xl p-6 shadow-card animate-scale-in">

        {/* Close */}
        <button
          onClick={() => { if (!isRunning) { abandonFocus(); onClose() } else { setConfirmAbandon(true) }}}
          className="absolute top-4 right-4 w-8 h-8 rounded-xl flex items-center justify-center bg-bg-3 text-content-3 hover:text-content transition-colors"
        >
          <X size={15} />
        </button>

        <h2 className="font-heading font-bold text-lg text-content mb-5 flex items-center gap-2">
          <Timer size={18} className="text-accent" /> Mode Focus
        </h2>

        {/* Task selector (only when idle) */}
        {(isIdle || isAbandoned) && (
          <div className="mb-4">
            <label className="text-xs text-content-3 font-medium block mb-1.5">Tâche (optionnel)</label>
            <select
              className="w-full bg-bg-3 border border-border rounded-xl px-3 py-2 text-sm text-content outline-none"
              value={selectedTaskId || ''}
              onChange={(e) => setSelectedTaskId(e.target.value || undefined)}
            >
              <option value="">— Session libre —</option>
              {todayPending.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>
        )}

        {/* Duration selector (only when idle) */}
        {(isIdle || isAbandoned) && (
          <div className="mb-6">
            <label className="text-xs text-content-3 font-medium block mb-1.5">Durée</label>
            <div className="flex gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDuration(d)}
                  className={cn(
                    'flex-1 py-2 rounded-xl text-xs font-bold border transition-all',
                    selectedDuration === d
                      ? 'bg-accent/15 border-accent/50 text-accent'
                      : 'bg-bg-3 border-border text-content-3 hover:border-border-2'
                  )}
                >
                  {d}min
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Ring timer */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-32 h-32">
            <svg width="128" height="128" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
              <circle
                cx="64" cy="64" r={r} fill="none"
                stroke={isDone ? '#00C2A8' : isAbandoned ? '#FF6B6B' : '#7B61FF'}
                strokeWidth="8"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {isDone ? (
                <CheckCircle2 size={32} className="text-success" />
              ) : isAbandoned ? (
                <X size={28} className="text-danger" />
              ) : (
                <>
                  <span className="font-heading font-extrabold text-2xl text-content">{mm}:{ss}</span>
                  <span className="text-[10px] text-content-3 mt-0.5">
                    {isRunning ? 'focus' : isPaused ? 'pause' : `${selectedDuration}min`}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Active task label */}
          {activeTask && (isRunning || isPaused) && (
            <p className="text-xs text-content-2 mt-3 text-center max-w-[200px] truncate">
              📌 {activeTask.title}
            </p>
          )}
        </div>

        {/* Completed state */}
        {isDone && (
          <div className="text-center mb-4 p-4 bg-success/10 border border-success/20 rounded-2xl">
            <p className="font-heading font-bold text-success text-lg">Session terminée ! 🎉</p>
            <p className="text-xs text-content-2 mt-1 flex items-center justify-center gap-1">
              <Zap size={12} className="text-warning" /> +30 XP gagnés
            </p>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          {(isIdle || isAbandoned) && (
            <button
              onClick={() => startFocus(selectedTaskId, selectedDuration)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border transition-all"
              style={{
                background: 'rgba(123,97,255,0.15)',
                borderColor: 'rgba(123,97,255,0.4)',
                color: '#7B61FF',
                boxShadow: '0 0 20px rgba(123,97,255,0.25)',
              }}
            >
              <Play size={16} fill="currentColor" /> Démarrer
            </button>
          )}

          {isRunning && (
            <>
              <button
                onClick={pauseFocus}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-bg-3 border border-border-2 text-content-2 hover:text-content transition-all"
              >
                <Pause size={16} /> Pause
              </button>
              <button
                onClick={completeFocus}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border transition-all"
                style={{ background: 'rgba(0,194,168,0.12)', borderColor: 'rgba(0,194,168,0.35)', color: '#00C2A8' }}
              >
                <CheckCircle2 size={16} /> Terminer
              </button>
            </>
          )}

          {isPaused && (
            <>
              <button
                onClick={resumeFocus}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border transition-all"
                style={{ background: 'rgba(123,97,255,0.15)', borderColor: 'rgba(123,97,255,0.4)', color: '#7B61FF' }}
              >
                <Play size={16} fill="currentColor" /> Reprendre
              </button>
              <button
                onClick={() => { abandonFocus(); onClose() }}
                className="w-12 flex items-center justify-center py-3 rounded-xl border border-border text-content-3 hover:text-danger hover:border-danger/40 transition-all"
              >
                <Square size={14} />
              </button>
            </>
          )}

          {isDone && (
            <button
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border transition-all"
              style={{ background: 'rgba(0,194,168,0.12)', borderColor: 'rgba(0,194,168,0.35)', color: '#00C2A8' }}
            >
              Fermer
            </button>
          )}
        </div>
      </div>
    </div>
    <ConfirmDialog
      open={confirmAbandon}
      onClose={() => setConfirmAbandon(false)}
      onConfirm={() => { abandonFocus(); onClose() }}
      title="Abandonner la session ?"
      description="Ta session Focus en cours sera annulée et tu ne recevras pas de XP. Es-tu sûr ?"
      confirmLabel="Abandonner"
    />
    </>
  )
}
