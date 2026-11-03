import { Link, useLocation } from 'react-router-dom'
import { Pause, Play, Timer, X } from 'lucide-react'
import { useFocus, useFocusTimer } from '../contexts/FocusContext.jsx'
import { formatFocusTime } from '../lib/focus.js'
import { ProgressBar } from './ui/ProgressBar.jsx'
import { cn } from '../lib/cn.js'

function requestDetailFullscreen() {
  if (document.fullscreenElement || !document.documentElement.requestFullscreen) return
  document.documentElement.requestFullscreen().catch(() => {})
}

// Barre flottante visible sur toutes les pages tant qu'une session Focus est en cours.
// Seul composant abonné au tick horodaté : les pages ne se re-rendent pas chaque seconde.
export default function FocusBar({ layout = 'standard' }) {
  const { active, abandon, pause, resume } = useFocus()
  const { remainingMs, paused } = useFocusTimer()
  const { pathname, search } = useLocation()
  if (!active) return null
  const total = active.totalMs
  const elapsed = total ? ((total - remainingMs) / total) * 100 : 0
  const style = layout === 'compact'
    ? { right: 'calc(env(safe-area-inset-right, 0px) + 0.75rem)', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }
    : undefined

  return (
    <div role="timer" aria-label={`Temps restant : ${formatFocusTime(remainingMs, total)}`}
      className={cn(
        'fixed z-30 animate-fade-up rounded-2xl border border-brand-400/20 bg-linear-to-br from-brand-700 to-brand-950 p-3.5 text-white shadow-pop',
        layout === 'desktop' && 'inset-x-auto right-6 bottom-6 w-80',
        layout === 'standard' && 'inset-x-3 bottom-[calc(5.25rem+env(safe-area-inset-bottom))]',
        layout === 'compact' && 'w-72 max-w-[calc(100vw-6rem)]',
      )}
      style={style}>
      <div className="flex items-center gap-3">
        <Link to="/focus" state={{ from: `${pathname}${search}` }} onClick={requestDetailFullscreen}
          aria-label="Ouvrir le détail Focus" title="Ouvrir le détail Focus"
          className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/15 transition hover:bg-white/25 active:scale-95">
          <Timer className="size-5" aria-hidden />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-xl leading-tight font-bold tabular-nums">{formatFocusTime(remainingMs, total)}</p>
          <p className="truncate text-xs text-white/75">{paused ? 'En pause' : active.taskTitle ?? 'Session Focus en cours'}</p>
        </div>
        <button type="button" onClick={paused ? resume : pause} aria-label={paused ? 'Reprendre la session' : 'Mettre la session en pause'}
          title={paused ? 'Reprendre' : 'Pause'}
          className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/15 transition hover:bg-white/25 active:scale-95">
          {paused ? <Play className="size-4" aria-hidden /> : <Pause className="size-4" aria-hidden />}
        </button>
        <button type="button" onClick={abandon} aria-label="Abandonner la session" title="Abandonner"
          className="grid size-11 shrink-0 place-items-center rounded-xl bg-rose-500/20 text-rose-200 transition hover:bg-rose-500/30 hover:text-rose-100 active:scale-95">
          <X className="size-5" aria-hidden />
        </button>
      </div>
      <ProgressBar className="mt-3 bg-white/20" size="sm" value={elapsed} color="#ffffff" />
    </div>
  )
}
