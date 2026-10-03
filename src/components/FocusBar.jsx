import { Square, Timer } from 'lucide-react'
import { useFocus, formatClock } from '../contexts/FocusContext.jsx'
import { ProgressBar } from './ui/ProgressBar.jsx'

// Barre flottante visible sur toutes les pages tant qu'une session Focus est en cours.
export default function FocusBar() {
  const { active, remainingMs, abandon } = useFocus()
  if (!active) return null
  const total = active.minutes * 60_000
  const elapsed = ((total - remainingMs) / total) * 100

  return (
    <div role="timer" className="fixed inset-x-3 bottom-[calc(4rem+env(safe-area-inset-bottom)+1rem)] z-30 animate-fade-up rounded-2xl border border-brand-400/20 bg-linear-to-br from-brand-700 to-brand-950 p-3.5 text-white shadow-pop md:inset-x-auto md:right-6 md:bottom-6 md:w-80">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/15"><Timer className="size-5" aria-hidden /></span>
        <div className="min-w-0 flex-1">
          <p className="text-xl leading-tight font-bold tabular-nums">{formatClock(remainingMs)}</p>
          <p className="truncate text-xs text-white/75">{active.taskTitle ?? 'Session Focus en cours'}</p>
        </div>
        <button type="button" onClick={abandon} aria-label="Abandonner la session"
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/15 transition hover:bg-white/25 active:scale-95">
          <Square className="size-4" aria-hidden />
        </button>
      </div>
      <ProgressBar className="mt-3 bg-white/20" size="sm" value={elapsed} color="#ffffff" />
    </div>
  )
}
