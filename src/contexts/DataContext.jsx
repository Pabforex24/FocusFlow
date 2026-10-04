import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import * as api from '../services/api.js'
import { useAuth } from './AuthContext.jsx'
import { useToast } from './ToastContext.jsx'
import { toUserMessage, AppError } from '../lib/errors.js'
import { reportError } from '../lib/report.js'
import { addDays, occurrenceDates, startOfWeekKey, todayKey } from '../lib/dates.js'
import { computeBadges, computeStats } from '../lib/gamification.js'
import { buildChallengeTasks, challengeEndKey, isChallengeFinished } from '../lib/challenges.js'

const DataContext = createContext(null)

const EMPTY = {
  profile: null, domains: [], goals: [], tasks: [], activeChallenges: [],
  customChallenges: [], restDays: [], focusSessions: [],
}
const STALE_AFTER_MS = 30_000

export function DataProvider({ children }) {
  const { user } = useAuth()
  const toast = useToast()
  const [data, setData] = useState(EMPTY)
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [loadError, setLoadError] = useState(null)
  const [today, setToday] = useState(todayKey())

  const pendingRef = useRef(0)      // nombre de modifications en cours
  const loadSeqRef = useRef(0)      // ignore les réponses de chargements périmés
  const lastLoadRef = useRef(0)
  const userId = user?.id ?? null

  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!userId) return
    if (pendingRef.current > 0) return // ne jamais écraser une modification en cours
    const seq = ++loadSeqRef.current
    if (!silent) setStatus('loading')
    try {
      const next = await api.loadAll(userId)
      if (seq !== loadSeqRef.current) return
      setData(next)
      setStatus('ready')
      setLoadError(null)
      lastLoadRef.current = Date.now()
    } catch (error) {
      if (seq !== loadSeqRef.current) return
      reportError(error, { where: 'chargement' })
      if (silent) return // un échec d'actualisation en arrière-plan garde les données affichées
      setLoadError(toUserMessage(error))
      setStatus('error')
    }
  }, [userId])

  // Charge à la connexion, vide à la déconnexion.
  useEffect(() => {
    loadSeqRef.current += 1
    if (!userId) { setData(EMPTY); setStatus('loading'); return }
    refresh()
  }, [userId, refresh])

  // Actualise au retour sur l'app / au retour du réseau, et change de jour à minuit.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      setToday(todayKey())
      if (Date.now() - lastLoadRef.current > STALE_AFTER_MS) refresh({ silent: true })
    }
    const onOnline = () => refresh({ silent: true })
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', onOnline)
    const tick = setInterval(() => setToday(todayKey()), 60_000)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', onOnline)
      clearInterval(tick)
    }
  }, [refresh])

  // Exécute une modification : signale l'erreur à l'utilisateur, renvoie true/false.
  const act = useCallback(async (fn, successMessage) => {
    if (!userId) { toast.error('Vous devez être connecté.'); return false }
    pendingRef.current += 1
    try {
      await fn()
      if (successMessage) toast.success(successMessage)
      return true
    } catch (error) {
      if (!(error instanceof AppError)) reportError(error, { where: 'action' }) // erreurs attendues (règles métier) non remontées
      toast.error(toUserMessage(error))
      return false
    } finally {
      pendingRef.current -= 1
    }
  }, [userId, toast])

  const patch = useCallback((key, fn) => setData((d) => ({ ...d, [key]: fn(d[key]) })), [])
  const replaceIn = (list, row) => list.map((x) => (x.id === row.id ? row : x))

  const actions = useMemo(() => ({
    refresh,

    // Domaines
    addDomain: (d) => act(async () => { const row = await api.createDomain(userId, d); patch('domains', (l) => [...l, row]) }, 'Domaine créé'),
    editDomain: (id, p) => act(async () => { const row = await api.updateDomain(id, p); patch('domains', (l) => replaceIn(l, row)) }, 'Domaine modifié'),
    removeDomain: (id) => act(async () => {
      await api.deleteDomain(id)
      setData((d) => ({
        ...d,
        domains: d.domains.filter((x) => x.id !== id),
        goals: d.goals.filter((g) => g.domain_id !== id),
        tasks: d.tasks.map((t) => {
          if (t.domain_id !== id) return t
          const goalGone = d.goals.some((g) => g.id === t.goal_id && g.domain_id === id)
          return { ...t, domain_id: null, goal_id: goalGone ? null : t.goal_id }
        }),
      }))
    }, 'Domaine supprimé'),

    // Objectifs
    addGoal: (g) => act(async () => { const row = await api.createGoal(userId, g); patch('goals', (l) => [...l, row]) }, 'Objectif créé'),
    editGoal: (id, p) => act(async () => { const row = await api.updateGoal(id, p); patch('goals', (l) => replaceIn(l, row)) }, 'Objectif modifié'),
    removeGoal: (id) => act(async () => {
      await api.deleteGoal(id)
      setData((d) => ({
        ...d,
        goals: d.goals.filter((g) => g.id !== id),
        tasks: d.tasks.map((t) => (t.goal_id === id ? { ...t, goal_id: null } : t)),
      }))
    }, 'Objectif supprimé'),

    // Tâches. `repeat` = { frequency, days } crée des occurrences concrètes (pas de modèle caché).
    addTask: (task, repeat) => act(async () => {
      if (repeat && repeat.frequency !== 'none') {
        const days = Math.min(Math.max(Number(repeat.days) || 7, 1), 90)
        const dates = occurrenceDates(task.scheduled_on, addDays(task.scheduled_on, days - 1), repeat.frequency)
        if (dates.length === 0) throw new AppError('Aucune date ne correspond à cette répétition.')
        const rows = await api.createTasks(userId, dates.map((d) => ({ ...task, scheduled_on: d })))
        patch('tasks', (l) => [...l, ...rows])
      } else {
        const row = await api.createTask(userId, task)
        patch('tasks', (l) => [...l, row])
      }
    }, 'Tâche ajoutée'),
    editTask: (id, p) => act(async () => { const row = await api.updateTask(id, p); patch('tasks', (l) => replaceIn(l, row)) }, 'Tâche modifiée'),
    removeTask: (id) => act(async () => { await api.deleteTask(id); patch('tasks', (l) => l.filter((t) => t.id !== id)) }, 'Tâche supprimée'),

    // Cocher : mise à jour immédiate, retour arrière si le serveur refuse.
    toggleTask: async (task) => {
      const done = !task.done
      const optimistic = { ...task, done, done_at: done ? new Date().toISOString() : null }
      patch('tasks', (l) => replaceIn(l, optimistic))
      const ok = await act(async () => {
        const row = await api.updateTask(task.id, { done, done_at: optimistic.done_at })
        patch('tasks', (l) => replaceIn(l, row))
      })
      if (!ok) patch('tasks', (l) => replaceIn(l, task))
      return ok
    },
    postponeTask: (task) => act(async () => {
      const row = await api.updateTask(task.id, { scheduled_on: addDays(task.scheduled_on, 1), postponed: true })
      patch('tasks', (l) => replaceIn(l, row))
    }, 'Tâche reportée à demain'),

    // Challenges
    startCatalogueChallenge: ({ challenge, startKey, domainId, goalId }) => act(async () => {
      if (data.activeChallenges.some((a) => a.challenge_id === challenge.id && a.end_date >= todayKey())) {
        throw new AppError('Ce challenge est déjà en cours.')
      }
      const endKey = challengeEndKey(startKey, challenge.durationDays)
      const rows = buildChallengeTasks({ blueprints: challenge.blueprints, startKey, endKey, domainId, goalId })
      const { challenge: created, tasks } = await api.startChallenge(
        userId,
        { challenge_id: challenge.id, title: challenge.title, color: challenge.color, start_date: startKey, end_date: endKey },
        rows,
      )
      setData((d) => ({ ...d, activeChallenges: [created, ...d.activeChallenges], tasks: [...d.tasks, ...tasks] }))
    }, 'Challenge démarré'),
    stopChallenge: (id) => act(async () => {
      await api.deleteActiveChallenge(id)
      setData((d) => ({
        ...d,
        activeChallenges: d.activeChallenges.filter((a) => a.id !== id),
        tasks: d.tasks.filter((t) => t.challenge_active_id !== id),
      }))
    }, 'Challenge supprimé'),
    addCustomChallenge: (c) => act(async () => { const row = await api.createCustomChallenge(userId, c); patch('customChallenges', (l) => [row, ...l]) }, 'Challenge créé'),
    editCustomChallenge: (id, p) => act(async () => { const row = await api.updateCustomChallenge(id, p); patch('customChallenges', (l) => replaceIn(l, row)) }, 'Challenge modifié'),
    removeCustomChallenge: (id) => act(async () => { await api.deleteCustomChallenge(id); patch('customChallenges', (l) => l.filter((c) => c.id !== id)) }, 'Challenge supprimé'),

    // Imprévu : protège la série du jour, une fois par semaine (lundi → dimanche).
    declareRestDay: (day) => act(async () => {
      const weekStart = startOfWeekKey(day)
      const weekEnd = addDays(weekStart, 6)
      if (data.restDays.includes(day)) throw new AppError('Un imprévu est déjà déclaré pour ce jour.')
      if (data.restDays.some((d) => d >= weekStart && d <= weekEnd)) throw new AppError('Un seul imprévu par semaine est autorisé.')
      await api.addRestDay(userId, day)
      patch('restDays', (l) => [...l, day])
    }, 'Imprévu déclaré : votre série est protégée'),

    recordFocus: ({ minutes, taskId }) => act(async () => {
      const row = await api.addFocusSession(userId, { minutes, task_id: taskId || null, completed_on: todayKey() })
      patch('focusSessions', (l) => [...l, row])
      if (taskId) {
        const task = await api.updateTask(taskId, { done: true, done_at: new Date().toISOString() })
        patch('tasks', (l) => replaceIn(l, task))
      }
    }, 'Session Focus terminée : +30 XP'),

    setHardcore: (value) => act(async () => {
      const row = await api.updateProfile(userId, { hardcore_mode: value })
      setData((d) => ({ ...d, profile: row }))
    }),
  }), [act, patch, refresh, userId, data.activeChallenges, data.restDays])

  const derived = useMemo(() => {
    const challengesDone = data.activeChallenges.filter((a) => isChallengeFinished(a, data.tasks, today)).length
    const stats = computeStats({
      tasks: data.tasks, restDays: data.restDays, focusSessions: data.focusSessions,
      hardcore: data.profile?.hardcore_mode ?? false, challengesDone, today,
    })
    return { stats, badges: computeBadges(stats) }
  }, [data, today])

  const value = useMemo(() => ({ ...data, ...derived, status, loadError, today, actions }), [data, derived, status, loadError, today, actions])
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export const useData = () => useContext(DataContext)
