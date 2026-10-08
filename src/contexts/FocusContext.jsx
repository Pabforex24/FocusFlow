import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useData } from './DataContext.jsx'
import { useToast } from './ToastContext.jsx'
import Modal from '../components/Modal.jsx'
import { Timer } from 'lucide-react'
import { Alert } from '../components/ui/Alert.jsx'
import { Button } from '../components/ui/Button.jsx'
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx'
import { Field, Select } from '../components/ui/Input.jsx'
import { Segmented } from '../components/ui/Segmented.jsx'

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
    const s = JSON.parse(raw)
    return s && typeof s.endsAt === 'number' && typeof s.minutes === 'number' ? s : null
  } catch (error) {
    console.warn('[focus] session sauvegardée illisible', error)
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export const formatClock = (ms) => {
  const total = Math.max(0, Math.ceil(ms / 1000))
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export function FocusProvider({ children }) {
  const { actions, tasks, today, status, online } = useData()
  const toast = useToast()
  const [session, setSession] = useState(readSaved)
  const [now, setNow] = useState(Date.now())
  const [picker, setPicker] = useState(null) // { task } quand le sélecteur est ouvert
  const [confirmAbandon, setConfirmAbandon] = useState(false)
  const finishingRef = useRef(false)

  useEffect(() => {
    if (!session) return undefined
    const tick = () => setNow(Date.now())
    const id = setInterval(tick, 1000)
    document.addEventListener('visibilitychange', tick) // rattrapage immédiat au retour de veille
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick) }
  }, [session])

  const clear = useCallback(() => { localStorage.removeItem(STORAGE_KEY); setSession(null); finishingRef.current = false }, [])

  // Fin de session : enregistre une seule fois, une fois les données chargées.
  useEffect(() => {
    if (!session || now < session.endsAt || finishingRef.current || status !== 'ready' || !online) return
    finishingRef.current = true
    actions.recordFocus({ minutes: session.minutes, taskId: session.taskId }).then((ok) => {
      if (ok) clear()
      else { finishingRef.current = false; toast.error('Session non enregistrée : nouvelle tentative dans un instant.') }
    })
  }, [now, session, status, online, actions, clear, toast])

  const start = useCallback((minutes, task) => {
    const next = { endsAt: Date.now() + minutes * 60_000, minutes, taskId: task?.id ?? null, taskTitle: task?.title ?? null }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setSession(next)
    setNow(Date.now())
    setPicker(null)
  }, [])

  const value = useMemo(() => ({
    active: session,
    openPicker: (task = null) => setPicker({ task }),
    abandon: () => setConfirmAbandon(true),
  }), [session])

  const timer = useMemo(() => ({ remainingMs: session ? session.endsAt - now : 0 }), [session, now])

  return (
    <FocusContext.Provider value={value}>
      <FocusTimerContext.Provider value={timer}>
        {children}
        {picker && <FocusPicker task={picker.task} tasks={tasks.filter((t) => t.scheduled_on === today && !t.done)} disabled={Boolean(session)} onStart={start} onClose={() => setPicker(null)} />}
        {confirmAbandon && (
          <ConfirmDialog title="Abandonner la session ?" message="Vous ne gagnerez pas les 30 XP de cette session." confirmLabel="Abandonner"
            onConfirm={() => { clear(); setConfirmAbandon(false) }} onCancel={() => setConfirmAbandon(false)} />
        )}
      </FocusTimerContext.Provider>
    </FocusContext.Provider>
  )
}

function FocusPicker({ task, tasks, disabled, onStart, onClose }) {
  const [minutes, setMinutes] = useState(25)
  const [taskId, setTaskId] = useState(task?.id ?? '')
  const chosen = tasks.find((t) => t.id === taskId) || task || null
  return (
    <Modal title="Session Focus" description="Une tâche, un minuteur, zéro distraction." icon={Timer} size="sm" onClose={onClose}>
      <div className="space-y-5">
        {disabled && <Alert tone="warning">Une session est déjà en cours.</Alert>}
        <Field label="Durée">
          <Segmented fill value={minutes} onChange={setMinutes} options={[15, 25, 45, 60].map((m) => ({ value: m, label: `${m} min` }))} />
        </Field>
        <Field label="Tâche liée" hint="Optionnel : elle sera cochée à la fin de la session (+30 XP)">
          <Select value={taskId} onChange={(e) => setTaskId(e.target.value)}>
            <option value="">Aucune</option>
            {task && !tasks.some((t) => t.id === task.id) && <option value={task.id}>{task.title}</option>}
            {tasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </Select>
        </Field>
        <Button size="lg" className="w-full" icon={Timer} disabled={disabled} onClick={() => onStart(minutes, chosen)}>Démarrer · {minutes} min</Button>
      </div>
    </Modal>
  )
}

export const useFocus = () => useContext(FocusContext)
export const useFocusTimer = () => useContext(FocusTimerContext)
