import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Palette, Pause, Play, RotateCw, X } from 'lucide-react'
import FocusTimerDisplay from '../components/focus/FocusTimerDisplay.jsx'
import Modal from '../components/Modal.jsx'
import { Button } from '../components/ui/Button.jsx'
import { useFocus, useFocusTimer } from '../contexts/FocusContext.jsx'
import { FOCUS_STYLES, readFocusStyle, saveFocusStyle } from '../lib/focusStyles.js'
import { cn } from '../lib/cn.js'

const CONTROLS_TIMEOUT = 4500
const PREVIEW_MS = 25 * 60_000

function useWakeLock() {
  useEffect(() => {
    let sentinel = null
    let cancelled = false
    const acquire = async () => {
      if (cancelled || document.visibilityState !== 'visible' || !('wakeLock' in navigator)) return
      try { sentinel = await navigator.wakeLock.request('screen') } catch { return }
      sentinel?.addEventListener('release', () => { sentinel = null })
    }
    const onVisibility = () => { if (document.visibilityState === 'visible' && !sentinel) acquire() }
    acquire()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      if (sentinel) sentinel.release?.().catch(() => {})
    }
  }, [])
}

export default function FocusDetail() {
  const { active, abandon, pause, resume } = useFocus()
  const { remainingMs, totalMs, paused } = useFocusTimer()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from
  const [style, setStyle] = useState(readFocusStyle)
  const [styleOpen, setStyleOpen] = useState(false)
  const [rotated, setRotated] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [activity, setActivity] = useState(0)
  const hadSessionRef = useRef(Boolean(active))

  useWakeLock()

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [])

  useEffect(() => () => {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {})
  }, [])

  useEffect(() => {
    if (active) { hadSessionRef.current = true; return }
    if (hadSessionRef.current) navigate(from || '/tasks', { replace: true })
  }, [active, from, navigate])

  const revealControls = useCallback(() => {
    setControlsVisible(true)
    setActivity((value) => value + 1)
  }, [])

  useEffect(() => {
    if (!controlsVisible || styleOpen) return undefined
    const timer = setTimeout(() => setControlsVisible(false), CONTROLS_TIMEOUT)
    return () => clearTimeout(timer)
  }, [controlsVisible, styleOpen, activity])

  useEffect(() => {
    const onKey = () => revealControls()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [revealControls])

  const chooseStyle = (next) => {
    setStyle(next)
    saveFocusStyle(next)
  }

  if (!active) {
    return (
      <main className="focus-detail grid min-h-dvh place-items-center px-5 text-fg">
        <div className="w-full max-w-sm rounded-3xl border border-line bg-surface/90 p-6 text-center shadow-pop backdrop-blur-xl">
          <p className="font-display text-lg font-semibold">Aucune session Focus en cours</p>
          <p className="mt-1 text-sm text-muted">Lancez une session depuis l’application pour ouvrir le détail du minuteur.</p>
          <Button className="mt-5 w-full" icon={ArrowLeft} onClick={() => navigate('/tasks')}>Retour aux tâches</Button>
        </div>
      </main>
    )
  }

  return (
    <main className="focus-detail fixed inset-0 z-40 overflow-hidden text-fg" data-focus-style={style} data-rotated={rotated ? 'true' : 'false'} onPointerDown={revealControls}>
      <div className="grid h-full place-items-center px-3 py-16">
        <FocusTimerDisplay style={style} remainingMs={remainingMs} totalMs={totalMs} paused={paused} />
      </div>

      {controlsVisible && (
        <div className="pointer-events-none absolute inset-0 z-10 animate-fade-in">
          <div className="pt-safe px-3 sm:px-5">
            <div className="pointer-events-auto mt-3 inline-flex sm:mt-5">
              <Button variant="secondary" icon={ArrowLeft} onClick={() => (from ? navigate(-1) : navigate('/tasks', { replace: true }))}>Retour</Button>
            </div>
          </div>

          <div className="pb-safe absolute inset-x-0 bottom-0 px-3 pb-4 sm:px-5 sm:pb-6">
            <div className="pointer-events-auto mx-auto flex w-fit max-w-full flex-wrap items-center justify-center gap-2 rounded-2xl border border-line bg-surface/90 p-2 shadow-pop backdrop-blur-xl">
              <Button variant={paused ? 'primary' : 'secondary'} icon={paused ? Play : Pause} onClick={paused ? resume : pause}>
                {paused ? 'Reprendre' : 'Pause'}
              </Button>
              <Button variant="danger-soft" icon={X} onClick={abandon}>Abandonner</Button>
              <Button variant="secondary" icon={RotateCw} aria-pressed={rotated}
                onClick={() => { setRotated((value) => !value); revealControls() }}>
                {rotated ? 'Redresser' : 'Pivoter'}
              </Button>
              <Button variant="secondary" icon={Palette} onClick={() => { setStyleOpen(true); revealControls() }}>Style</Button>
            </div>
          </div>
        </div>
      )}

      {styleOpen && (
        <Modal title="Style du minuteur" description="Dix ambiances, dont quatre nouvelles. Le changement est immédiat et sera conservé." icon={Palette} size="lg" onClose={() => setStyleOpen(false)}>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {FOCUS_STYLES.map((item) => {
              const selected = style === item.id
              return (
                <button key={item.id} type="button" aria-pressed={selected} onClick={() => chooseStyle(item.id)}
                  className={cn('group relative flex items-center gap-3 rounded-2xl border p-2.5 text-left transition active:scale-[0.99] sm:flex-col sm:items-stretch sm:gap-2.5',
                    selected ? 'border-brand-500 bg-brand-500/8 ring-2 ring-brand-500/25' : 'border-line bg-surface-2/40 hover:border-brand-500/40 hover:bg-surface-2/70')}>
                  <span className="relative grid h-20 w-28 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 sm:h-24 sm:w-full"
                    style={{ backgroundImage: `radial-gradient(120% 120% at 20% 0%, ${item.accent}2e, transparent 58%), linear-gradient(145deg, var(--surface-2), var(--surface))` }}>
                    <FocusTimerDisplay style={item.id} remainingMs={PREVIEW_MS} totalMs={PREVIEW_MS} preview />
                    <span className="absolute inset-x-4 bottom-1.5 h-px" style={{ background: `linear-gradient(90deg, transparent, ${item.accent}, transparent)` }} />
                    {selected && <span className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-brand-500 text-brand-950 shadow-sm"><Check className="size-3" strokeWidth={3} aria-hidden /></span>}
                  </span>
                  <span className="min-w-0 flex-1 sm:px-0.5">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-sm font-semibold text-fg">{item.label}</span>
                      <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">{item.tag}</span>
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-subtle">{item.description}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </Modal>
      )}
    </main>
  )
}
