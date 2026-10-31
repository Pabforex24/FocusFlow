import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useData } from './DataContext.jsx'
import { useToast } from './ToastContext.jsx'
import Modal from '../components/Modal.jsx'
import { BellOff, CircleAlert, Timer } from 'lucide-react'
import { Alert } from '../components/ui/Alert.jsx'
import { Button } from '../components/ui/Button.jsx'
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx'
import { Field, Select } from '../components/ui/Input.jsx'
import { Segmented } from '../components/ui/Segmented.jsx'
import {
  QUICK_FOCUS_MINUTES,
  createFocusSession,
  durationFromParts,
  formatDurationLabel,
  normalizeFocusSession,
  pauseFocusSession,
  remainingFocusMs,
  resumeFocusSession,
} from '../lib/focus.js'
import {
  closeFocusNotification,
  requestFocusPermission,
  showFocusDone,
  showFocusStart,
  updateFocusNotification,
} from '../lib/focusNotify.js'

// Le minuteur se base sur l'heure réelle (endsAt) : il survit à la mise en veille et aux changements de page.
// Seul cet état éphémère est gardé en localStorage ; les données restent dans Supabase.
const STORAGE_KEY = 'focusflow-focus-session'
// Deux contextes : `FocusContext` ne change qu'au démarrage/à la fin d'une session (les pages qui
// n'utilisent que `openPicker` ne se re-rendent pas) ; `FocusTimerContext` change à chaque seconde
// et n'est consommé que par la barre FocusBar, seule composante qui affiche le décompte.
const FocusContext = createContext(null)
const FocusTimerContext = createContext(null)

function readSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const session = normalizeFocusSession(JSON.parse(raw), Date.now())
    if (session) return session
    localStorage.removeItem(STORAGE_KEY)
    return null
  } catch (error) {
    console.warn('[focus] session sauvegardée illisible', error)
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

function writeSaved(session) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch (error) {
    console.warn('[focus] sauvegarde impossible', error)
  }
}

export function FocusProvider({ children }) {
  const { actions, tasks, today, status, online } = useData()
  const toast = useToast()
  const { pathname } = useLocation()
  const detailActive = pathname === '/focus'
  const [session, setSession] = useState(readSaved)
  const [now, setNow] = useState(Date.now())
  const [picker, setPicker] = useState(null) // { task } quand le sélecteur est ouvert
  const [confirmAbandon, setConfirmAbandon] = useState(false)
  const finishingRef = useRef(false)
  const notifiedMinuteRef = useRef(null)
  const notificationSuppressedRef = useRef(false)

  useEffect(() => {
    if (!session || session.paused) return undefined
    const tick = () => setNow(Date.now())
    const id = setInterval(tick, 1000)
    document.addEventListener('visibilitychange', tick) // rattrapage immédiat au retour de veille
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick) }
  }, [session])

  // Notification persistante : mise à jour une fois par minute, sauf en pause et sur le Détail Focus.
  // Sur le Détail, l'application ne doit émettre que la notification de fin.
  useEffect(() => {
    if (!session) {
      notifiedMinuteRef.current = null
      notificationSuppressedRef.current = false
      return
    }
    if (session.paused || detailActive) {
      notifiedMinuteRef.current = null
      if (!notificationSuppressedRef.current) {
        notificationSuppressedRef.current = true
        closeFocusNotification()
      }
      return
    }
    notificationSuppressedRef.current = false
    const remaining = remainingFocusMs(session, now)
    if (remaining <= 0) return
    const minutes = Math.ceil(remaining / 60_000)
    if (minutes === notifiedMinuteRef.current) return
    notifiedMinuteRef.current = minutes
    updateFocusNotification(session, remaining)
  }, [now, session, detailActive])

  const clear = useCallback(() => { localStorage.removeItem(STORAGE_KEY); setSession(null); finishingRef.current = false }, [])

  // Fin de session : enregistre une seule fois, une fois les données chargées.
  useEffect(() => {
    if (!session || session.paused || !session.endsAt || now < session.endsAt || finishingRef.current || status !== 'ready' || !online) return
    finishingRef.current = true
    actions.recordFocus({ minutes: session.minutes, taskId: session.taskId }).then((ok) => {
      if (ok) { showFocusDone(session); clear() }
      else { finishingRef.current = false; toast.error('Session non enregistrée : nouvelle tentative dans un instant.') }
    })
  }, [now, session, status, online, actions, clear, toast])

  const start = useCallback((durationMs, task) => {
    const next = createFocusSession(durationMs, task)
    const permission = requestFocusPermission() // dans le geste utilisateur (clic « Démarrer »)
    writeSaved(next)
    notifiedMinuteRef.current = Math.ceil(next.totalMs / 60_000)
    setSession(next)
    setNow(Date.now())
    setPicker(null)
    permission.then((granted) => { if (granted && window.location.pathname !== '/focus') showFocusStart(next) })
  }, [])

  const pause = useCallback(() => {
    if (!session || session.paused) return
    const next = pauseFocusSession(session)
    if (next === session) { setNow(Date.now()); return }
    writeSaved(next)
    setSession(next)
    setNow(Date.now())
  }, [session])

  const resume = useCallback(() => {
    if (!session || !session.paused) return
    const next = resumeFocusSession(session)
    writeSaved(next)
    setSession(next)
    setNow(Date.now())
  }, [session])

  const value = useMemo(() => ({
    active: session,
    openPicker: (task = null) => setPicker({ task }),
    abandon: () => setConfirmAbandon(true),
    pause,
    resume,
  }), [session, pause, resume])

  const timer = useMemo(() => ({
    remainingMs: remainingFocusMs(session, now),
    totalMs: session?.totalMs ?? 0,
    paused: Boolean(session?.paused),
  }), [session, now])

  return (
    <FocusContext.Provider value={value}>
      <FocusTimerContext.Provider value={timer}>
        {children}
        {picker && <FocusPicker task={picker.task} tasks={tasks.filter((t) => t.scheduled_on === today && !t.done)} disabled={Boolean(session)} onStart={start} onClose={() => setPicker(null)} />}
        {confirmAbandon && (
          <ConfirmDialog title="Abandonner la session ?" message="Vous ne gagnerez pas les 30 XP de cette session." confirmLabel="Abandonner"
            onConfirm={() => { closeFocusNotification(); clear(); setConfirmAbandon(false) }} onCancel={() => setConfirmAbandon(false)} />
        )}
      </FocusTimerContext.Provider>
    </FocusContext.Provider>
  )
}

function CustomDurationField({ part, label, max, value, onChange }) {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-muted">
      <span>{label}</span>
      <input type="number" inputMode="numeric" min={0} max={max} step={1} value={value} placeholder="0"
        aria-label={label} onChange={(event) => onChange(part, event.target.value)} className="px-2 text-center tabular-nums" />
    </label>
  )
}

function FocusPicker({ task, tasks, disabled, onStart, onClose }) {
  const [quick, setQuick] = useState(25)
  const [customMode, setCustomMode] = useState(false)
  const [custom, setCustom] = useState({ hours: '', minutes: '', seconds: '' })
  const [error, setError] = useState('')
  const [taskId, setTaskId] = useState(task?.id ?? '')
  const chosen = tasks.find((t) => t.id === taskId) || task || null
  const customDuration = customMode ? durationFromParts(custom) : null

  const chooseQuick = (value) => {
    setQuick(value)
    setCustomMode(false)
    setError('')
  }

  const changeCustom = (part, value) => {
    setCustom((current) => ({ ...current, [part]: value }))
    setCustomMode(true)
    setError('')
  }

  const start = () => {
    if (disabled) return
    if (!customMode) { onStart(quick * 60_000, chosen); return }
    const result = durationFromParts(custom)
    if (!result.ok) { setError(result.error); return }
    onStart(result.ms, chosen)
  }

  const durationLabel = customMode
    ? customDuration?.ok ? formatDurationLabel(customDuration.ms) : 'durée libre'
    : `${quick} min`

  return (
    <Modal title="Session Focus" description="Une tâche, un minuteur, zéro distraction." icon={Timer} size="sm" onClose={onClose}>
      <div className="space-y-5">
        {disabled && <Alert tone="warning">Une session est déjà en cours.</Alert>}
        <Field label="Durée rapide">
          <Segmented fill value={customMode ? null : quick} onChange={chooseQuick}
            options={QUICK_FOCUS_MINUTES.map((m) => ({ value: m, label: `${m} min` }))} />
        </Field>
        <div className="space-y-2">
          <p className="text-sm font-medium text-fg">Durée libre</p>
          <div className="grid grid-cols-3 gap-2">
            <CustomDurationField part="hours" label="Heures" max={23} value={custom.hours} onChange={changeCustom} />
            <CustomDurationField part="minutes" label="Minutes" max={59} value={custom.minutes} onChange={changeCustom} />
            <CustomDurationField part="seconds" label="Secondes" max={59} value={custom.seconds} onChange={changeCustom} />
          </div>
          <p className="text-xs text-subtle">De 00:00:01 à 23:59:59. Touchez un champ pour utiliser une durée libre.</p>
          {error && <p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400"><CircleAlert className="size-3.5 shrink-0" aria-hidden />{error}</p>}
        </div>
        <Field label="Tâche liée" hint="Optionnel : elle sera cochée à la fin de la session (+30 XP)">
          <Select value={taskId} onChange={(e) => setTaskId(e.target.value)}>
            <option value="">Aucune</option>
            {task && !tasks.some((t) => t.id === task.id) && <option value={task.id}>{task.title}</option>}
            {tasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </Select>
        </Field>
        <Alert tone="info" icon={BellOff} title="Ne pas déranger">
          Avant de commencer, activez le mode « Ne pas déranger » du téléphone. Une page web ne peut pas bloquer les appels ni les notifications des autres applications.
        </Alert>
        <Button size="lg" className="w-full" icon={Timer} disabled={disabled} onClick={start}>
          Démarrer{customMode && !customDuration?.ok ? '' : ` · ${durationLabel}`}
        </Button>
      </div>
    </Modal>
  )
}

export const useFocus = () => useContext(FocusContext)
export const useFocusTimer = () => useContext(FocusTimerContext)
