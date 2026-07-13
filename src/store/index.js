import { create } from 'zustand'
import * from '@/lib/db'
import { persist } from 'zustand/middleware'

// ─── Challenge catalogue ──────────────────────────────────────────────────────
export const CHALLENGE_CATALOGUE: Challenge[] = [
  {
    id: 'ch-trading-30',
    title: 'Trader Discipline 30J',
    description: 'Construis une routine de trading solide : backtest quotidien, journal et analyse hebdo.',
    durationDays: 30, color: '#00C2A8', icon: 'TrendingUp',
    blueprints: [
      { id: 'bp-t1', title: '1h de backtest',                     domainId: 'seed-d1', goalId: '', duration: '1h',    frequency: 'workdays' },
      { id: 'bp-t2', title: 'Mettre à jour le journal de trades',  domainId: 'seed-d1', goalId: '', duration: '20min', frequency: 'daily'    },
    ],
  },
  {
    id: 'ch-sport-21',
    title: 'Défi Forme 21J',
    description: 'Adopte une routine sportive en 21 jours avec cardio, musculation et récupération.',
    durationDays: 21, color: '#FFB830', icon: 'Dumbbell',
    blueprints: [
      { id: 'bp-s1', title: 'Footing 20 minutes',  domainId: 'seed-d2', goalId: '', duration: '20min', frequency: 'daily'    },
      { id: 'bp-s2', title: 'Séance musculation',   domainId: 'seed-d2', goalId: '', duration: '45min', frequency: 'workdays' },
    ],
  },
  {
    id: 'ch-learning-14',
    title: 'Deep Learning 14J',
    description: "Plonge dans un sujet d'étude intensif avec sessions concentrées et révisions.",
    durationDays: 14, color: '#4EA8DE', icon: 'Brain',
    blueprints: [
      { id: 'bp-l1', title: "Session d'étude focalisée", domainId: 'seed-d3', goalId: '', duration: '1h30', frequency: 'daily' },
      { id: 'bp-l2', title: 'Révision des notes',         domainId: 'seed-d3', goalId: '', duration: '20min', frequency: 'daily' },
    ],
  },
  {
    id: 'ch-wellness-7',
    title: 'Reset Bien-être 7J',
    description: 'Une semaine pour tout remettre à zéro : hydratation, sommeil, mouvement, pleine conscience.',
    durationDays: 7, color: '#1BC47D', icon: 'Leaf',
    blueprints: [
      { id: 'bp-w1', title: "Boire 2L d'eau",    domainId: 'seed-d2', goalId: '', duration: '—',    frequency: 'daily' },
      { id: 'bp-w2', title: 'Méditation 10 min',  domainId: 'seed-d2', goalId: '', duration: '10min', frequency: 'daily' },
    ],
  },
]

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

const today    = new Date().toISOString().split('T')[0]
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

// ─── Seed data ────────────────────────────────────────────────────────────────

const seedDomains: Domain[] = [
  { id: 'seed-d1', name: 'Trading', icon: 'TrendingUp', color: '#00C2A8', createdAt: new Date().toISOString() },
  { id: 'seed-d2', name: 'Sport',   icon: 'Dumbbell',   color: '#FFB830', createdAt: new Date().toISOString() },
  { id: 'seed-d3', name: 'Études',  icon: 'BookOpen',   color: '#4EA8DE', createdAt: new Date().toISOString() },
]

const seedGoals: Goal[] = [
  { id: 'seed-g1', domainId: 'seed-d1', title: '30h de backtest',          unit: 'heures',  createdAt: new Date().toISOString() },
  { id: 'seed-g2', domainId: 'seed-d2', title: '20 séances de sport',       unit: 'séances', createdAt: new Date().toISOString() },
  { id: 'seed-g3', domainId: 'seed-d3', title: 'Valider le module finance', unit: '',        createdAt: new Date().toISOString() },
]

const seedTasks: Task[] = [
  { id: uid(), title: '1h30 de backtest EUR/USD',                domainId: 'seed-d1', goalId: 'seed-g1', duration: '1h30',  scheduledAt: `${today}T08:00:00.000Z`,    done: false, xpValue: 10, priority: 'high',   createdAt: new Date().toISOString() },
  { id: uid(), title: 'Analyser les trades de la semaine',        domainId: 'seed-d1', goalId: 'seed-g1', duration: '30min', scheduledAt: `${today}T10:00:00.000Z`,    done: true,  xpValue: 10, doneAt: new Date().toISOString(), createdAt: new Date().toISOString() },
  { id: uid(), title: 'Footing 20 minutes',                       domainId: 'seed-d2', goalId: 'seed-g2', duration: '20min', scheduledAt: `${today}T07:00:00.000Z`,    done: false, xpValue: 10, priority: 'medium', createdAt: new Date().toISOString() },
  { id: uid(), title: 'Réviser chapitre 3 — Marchés financiers',  domainId: 'seed-d3', goalId: 'seed-g3', duration: '1h',    scheduledAt: `${today}T14:00:00.000Z`,    done: false, xpValue: 10, priority: 'medium', createdAt: new Date().toISOString() },
  { id: uid(), title: 'Backtest stratégie RSI',                   domainId: 'seed-d1', goalId: 'seed-g1', duration: '2h',    scheduledAt: `${tomorrow}T09:00:00.000Z`, done: false, xpValue: 10, priority: 'high',   createdAt: new Date().toISOString() },
]

const initialUserStats: UserStats = {
  xp: 0, level: 1, xpToNextLevel: xpForLevel(1),
  totalTasksDone: 0, challengesCompleted: 0, longestStreak: 0,
  hardcoreMode: false,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeLevel(xp): { level; xpToNextLevel: number } {
  let level = 1, cumulative = 0
  while (cumulative + xpForLevel(level) <= xp) {
    cumulative += xpForLevel(level); level++
  }
  return { level, xpToNextLevel: xpForLevel(level) - (xp - cumulative) }
}

function buildAllTasks(
  challenge: Challenge,
  acId,
  startDate: Date,
  endDate: Date,
  blueprintGoalMap: Record<string, string>
): Omit<Task, 'id' | 'createdAt'>[] {
  const tasks: Omit<Task, 'id' | 'createdAt'>[] = []

  for (const bp of challenge.blueprints) {
    const resolvedGoalId = blueprintGoalMap[bp.id] || bp.goalId
    const dates = getOccurrenceDates(startDate, endDate, bp.frequency, bp.customDays)

    for (const d of dates) {
      tasks.push({
        title: bp.title,
        domainId: bp.domainId,
        goalId: resolvedGoalId || undefined,
        duration: bp.duration,
        scheduledAt: d.toISOString().split('T')[0] + 'T08:00:00.000Z',
        done: false,
        xpValue: 20,
        challengeActiveId: acId,
        priority: 'medium',
        frequency: bp.frequency,
        customDays: bp.customDays,
        isGenerated: true,
      })
    }
  }
  return tasks
}

// ─── Storage SSR-safe ─────────────────────────────────────────────────────────
const ssrSafeStorage = {
  getItem: (key) => {
    if (typeof window === 'undefined') return null
    try {
      const str = localStorage.getItem(key)
      return str ? JSON.parse(str) 
    } catch { return null }
  },
  setItem: (key, value) => {
    if (typeof window === 'undefined') return
    try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
  },
  removeItem: (key) => {
    if (typeof window === 'undefined') return
    try { localStorage.removeItem(key) } catch {}
  },
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useStore = create()(
  persist(
    (set, get) => ({
      domains:          [],
      goals:            [],
      tasks:            [],
      streak:           0,
      lastActive,
      onboarding:       { completed: false, step: 'domains' },
      userStats:        initialUserStats,
      badges:           ALL_BADGES.map((b) => ({ ...b })),
      focusSession,
      focusModalOpen:   false,
      isInserting:      false,
      lastSyncedAt,
      restDays:            [],
      restDayUsedThisWeek: false,
      activeChallenges: [],
      customChallenges:    [],
      deletedCatalogueIds: [],
      catalogueOverrides:  {},

      // ── Domain ───────────────────────────────────────────────────────────────
      addDomain: async (data: Omit<Domain, 'id' | 'createdAt'>) => {
        const newDomain = { ...data, id: uid(), createdAt: new Date().toISOString() }
        const userId = get().supabaseUserId
        console.log('[store] addDomain — userId:', userId, 'name:', newDomain.name)
        // 1. Affichage immédiat (optimistic)
        set((s) => ({ domains: [...s.domains, newDomain] }))
        if (userId) {
          set({ isInserting: true })
          try {
            const error = await db.insertDomain(userId, newDomain)
            if (error) {
              console.error('[store] addDomain FAILED:', error.message, 'code:', error.code)
              // Rollback : retirer la donnée du store
              set((s) => ({ domains: s.domains.filter(d => d.id !== newDomain.id), isInserting: false }))
              return
            }
            console.log('[store] addDomain SUCCESS — confirmé dans Supabase')
            set({ isInserting: false })
          } catch (e) {
            console.error('[store] addDomain EXCEPTION:', e)
            set((s) => ({ domains: s.domains.filter(d => d.id !== newDomain.id), isInserting: false }))
          }
        }
      },
      updateDomain: (id, data) => {
        set((s) => ({ domains: s.domains.map((d) => (d.id === id ? { ...d, ...data } : d)) }))
        const updated = get().domains.find((d) => d.id === id)
        if (updated && get().supabaseUserId) db.updateDomain(updated).catch(console.error)
      },
      deleteDomain: (id) => {
        const gIds = get().goals.filter((g) => g.domainId === id).map((g) => g.id)
        set((s) => ({
          domains: s.domains.filter((d) => d.id !== id),
          goals:   s.goals.filter((g) => g.domainId !== id),
          tasks:   s.tasks.filter((t) => t.domainId !== id && !gIds.includes(t.goalId || '')),
        }))
        if (get().supabaseUserId) db.deleteDomain(id).catch(console.error)
      },

      // ── Goal ─────────────────────────────────────────────────────────────────
      addGoal: async (data: Omit<Goal, 'id' | 'createdAt'>) => {
        const newGoal = { ...data, id: uid(), createdAt: new Date().toISOString() }
        const userId = get().supabaseUserId
        console.log('[store] addGoal — userId:', userId, 'title:', newGoal.title)
        // 1. Affichage immédiat (optimistic)
        set((s) => ({ goals: [...s.goals, newGoal] }))
        if (userId) {
          set({ isInserting: true })
          try {
            const error = await db.insertGoal(userId, newGoal)
            if (error) {
              console.error('[store] addGoal FAILED:', error.message, 'code:', error.code)
              set((s) => ({ goals: s.goals.filter(g => g.id !== newGoal.id), isInserting: false }))
              return
            }
            console.log('[store] addGoal SUCCESS — confirmé dans Supabase')
            set({ isInserting: false })
          } catch (e) {
            console.error('[store] addGoal EXCEPTION:', e)
            set((s) => ({ goals: s.goals.filter(g => g.id !== newGoal.id), isInserting: false }))
          }
        }
      },
      updateGoal: (id, data) => {
        set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, ...data } : g)) }))
        const updated = get().goals.find((g) => g.id === id)
        if (updated && get().supabaseUserId) db.updateGoal(updated).catch(console.error)
      },
      deleteGoal: (id) => {
        set((s) => ({
          goals: s.goals.filter((g) => g.id !== id),
          tasks: s.tasks.filter((t) => t.goalId !== id),
        }))
        if (get().supabaseUserId) db.deleteGoal(id).catch(console.error)
      },

      // ── Task ─────────────────────────────────────────────────────────────────
      addTask: async (data: Omit<Task, 'id' | 'createdAt'>) => {
        const newTask = { ...data, id: uid(), createdAt: new Date().toISOString() }
        const userId = get().supabaseUserId
        console.log('[store] addTask — userId:', userId, 'title:', newTask.title)
        // 1. Affichage immédiat (optimistic)
        set((s) => ({ tasks: [...s.tasks, newTask] }))
        if (userId) {
          set({ isInserting: true })
          try {
            const error = await db.insertTask(userId, newTask)
            if (error) {
              console.error('[store] addTask FAILED:', error.message, 'code:', error.code)
              // Rollback : retirer la tâche du store
              set((s) => ({ tasks: s.tasks.filter(t => t.id !== newTask.id), isInserting: false }))
              return
            }
            console.log('[store] addTask SUCCESS — confirmé dans Supabase')
            set({ isInserting: false })
          } catch (e) {
            console.error('[store] addTask EXCEPTION:', e)
            set((s) => ({ tasks: s.tasks.filter(t => t.id !== newTask.id), isInserting: false }))
          }
        }
      },
      bulkAddTasks: async (list) => {
        const newTasks = list.map((d) => ({ ...d, id: uid(), createdAt: new Date().toISOString() }))
        set((s) => ({ tasks: [...s.tasks, ...newTasks] }))
        const userId = get().supabaseUserId
        if (!userId) return
        set({ isInserting: true })
        const error = await db.insertTasks(userId, newTasks)
        if (error) {
          const ids = new Set(newTasks.map((t) => t.id))
          set((s) => ({ tasks: s.tasks.filter((t) => !ids.has(t.id)), isInserting: false }))
          return
        }
        set({ isInserting: false })
      },
      toggleTask: (id) => {
        const { tasks, awardXP, checkAndAwardBadges, updateStreak } = get()
        const task = tasks.find((t) => t.id === id)
        if (!task) return
        const nowDone = !task.done
        const doneAt  = nowDone ? new Date().toISOString() : undefined
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, done: nowDone, doneAt } : t
          ),
          userStats: nowDone
            ? { ...s.userStats, totalTasksDone: s.userStats.totalTasksDone + 1 }
            : { ...s.userStats, totalTasksDone: Math.max(0, s.userStats.totalTasksDone - 1) },
        }))
        const userId = get().supabaseUserId
        if (userId) db.updateTask({ id, done: nowDone, doneAt }).catch(console.error)
        if (nowDone) {
          awardXP(task.xpValue ?? 10)
          updateStreak()
          checkAndAwardBadges()
          const { tasks: updated } = get()
          const todayStr = new Date().toDateString()
          const todayAll = updated.filter((t) => new Date(t.scheduledAt).toDateString() === todayStr)
          if (todayAll.length > 0 && todayAll.every((t) => t.done)) awardXP(50)
        }
      },
      deleteTask: (id) => {
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
        if (get().supabaseUserId) db.deleteTask(id).catch(console.error)
      },
      updateTask: (id, data) => {
        set((s) => ({ tasks: s.tasks.map((t) => t.id === id ? { ...t, ...data } : t) }))
        if (get().supabaseUserId) db.updateTask({ id, ...data }).catch(console.error)
      },

      // ── Gamification ─────────────────────────────────────────────────────────
      awardXP: (amount) =>
        set((s) => {
          const newXP = s.userStats.xp + amount
          const { level, xpToNextLevel } = computeLevel(newXP)
          return { userStats: { ...s.userStats, xp: newXP, level, xpToNextLevel } }
        }),
      checkAndAwardBadges: () => {
        const { userStats, badges, streak, tasks, awardXP } = get()
        const earned = new Set(badges.filter((b) => b.unlockedAt).map((b) => b.id))
        const unlocked: typeof badges = []
        const check = (id: typeof badges[0]['id'], cond) => {
          if (!earned.has(id) && cond) unlocked.push({ ...badges.find((b) => b.id === id), unlockedAt: new Date().toISOString() })
        }
        check('first_task',    userStats.totalTasksDone >= 1)
        check('tasks_10',      userStats.totalTasksDone >= 10)
        check('tasks_30',      userStats.totalTasksDone >= 30)
        check('tasks_100',     userStats.totalTasksDone >= 100)
        check('streak_7',      streak >= 7)
        check('streak_30',     streak >= 30)
        check('challenge_done',userStats.challengesCompleted >= 1)
        check('challenge_3',   userStats.challengesCompleted >= 3)
        const h = new Date().getHours()
        const todayDone = tasks.filter((t) => t.done && new Date(t.doneAt || '').toDateString() === new Date().toDateString())
        if (todayDone.length > 0) { check('early_bird', h < 8); check('night_owl', h >= 23) }
        if (unlocked.length > 0) {
          unlocked.forEach((b) => awardXP(b.xpReward))
          set((s) => ({
            badges: s.badges.map((b) => {
              const m = unlocked.find((u) => u.id === b.id)
              return m ? { ...b, unlockedAt: m.unlockedAt } : b
            }),
          }))
        }
      },
      postponeTask: (taskId) => {
        const task = get().tasks.find((t) => t.id === taskId)
        if (!task) return
        const tomorrow = new Date(Date.now() + 86400000)
        const original = new Date(task.scheduledAt)
        tomorrow.setHours(original.getHours(), original.getMinutes(), 0, 0)
        const scheduledAt = tomorrow.toISOString()
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId ? { ...t, scheduledAt, postponed: true } : t
          ),
        }))
        if (get().supabaseUserId) db.updateTask({ id: taskId, scheduledAt }).catch(console.error)
      },

      declareRestDay: () => {
        const { restDays, restDayUsedThisWeek } = get()
        const today = new Date().toDateString()
        if (restDays.includes(today)) {
          return { success: false, message: "Imprévu déjà déclaré pour aujourd'hui." }
        }
        if (restDayUsedThisWeek) {
          return { success: false, message: 'Tu utilisé ton imprévu cette semaine. Maximum 1 par semaine.' }
        }
        set((s) => ({
          restDays: [...s.restDays, today],
          restDayUsedThisWeek: true,
        }))
        return { success: true, message: "Imprévu déclaré. Ton streak est protégé pour aujourd'hui." }
      },

      applyDailyPenalty: () => {
        const { userStats, streak, tasks, restDays } = get()
        const yesterday = new Date(Date.now() - 86400000).toDateString()
        if (restDays.includes(yesterday)) return
        const had = tasks.some((t) => t.done && new Date(t.doneAt || '').toDateString() === yesterday)
        if (!had && streak > 0) {
          const pen = userStats.hardcoreMode ? 30 : 15
          const newXP = Math.max(0, userStats.xp - pen)
          const { level, xpToNextLevel } = computeLevel(newXP)
          set((s) => ({ streak: 0, userStats: { ...s.userStats, xp: newXP, level, xpToNextLevel } }))
        }
      },
      toggleHardcoreMode: () =>
        set((s) => ({ userStats: { ...s.userStats, hardcoreMode: !s.userStats.hardcoreMode } })),

      // ── Focus ─────────────────────────────────────────────────────────────────
      startFocus: (taskId, durationMinutes = 25) => {
        const now = Date.now()
        set({ focusSession: {
          id: uid(), taskId, durationMinutes,
          elapsedSeconds: 0, elapsedBeforePause: 0,
          runningStartedAt: now,
          status: 'running', startedAt: new Date(now).toISOString(), xpEarned: 0,
        }})
      },
      tickFocus: () =>
        set((s) => {
          if (!s.focusSession || s.focusSession.status !== 'running') return s
          const now     = Date.now()
          const elapsed = Math.floor(s.focusSession.elapsedBeforePause + (now - s.focusSession.runningStartedAt) / 1000)
          const target  = s.focusSession.durationMinutes * 60
          if (elapsed >= target)
            return { focusSession: { ...s.focusSession, elapsedSeconds: target, status: 'done', completedAt: new Date().toISOString(), xpEarned: 30 } }
          return { focusSession: { ...s.focusSession, elapsedSeconds: elapsed } }
        }),
      pauseFocus: () => set((s) => {
        if (!s.focusSession) return s
        const now = Date.now()
        const elapsed = Math.floor(s.focusSession.elapsedBeforePause + (now - s.focusSession.runningStartedAt) / 1000)
        return { focusSession: { ...s.focusSession, status: 'paused', elapsedSeconds: elapsed, elapsedBeforePause: elapsed } }
      }),
      resumeFocus: () => set((s) => {
        if (!s.focusSession) return s
        return { focusSession: { ...s.focusSession, status: 'running', runningStartedAt: Date.now() } }
      }),
      openFocusModal:  () => set({ focusModalOpen: true }),
      setLastSyncedAt: (ts) => set({ lastSyncedAt: ts }),
      closeFocusModal: () => set({ focusModalOpen: false }),
      completeFocus: () => {
        const { focusSession, awardXP, toggleTask, checkAndAwardBadges } = get()
        if (!focusSession) return
        awardXP(30)
        if (focusSession.taskId) toggleTask(focusSession.taskId)
        set((s) => ({ focusSession: { ...focusSession, status: 'done', completedAt: new Date().toISOString(), xpEarned: 30 } }))
        checkAndAwardBadges()
      },
      abandonFocus: () => set((s) => s.focusSession ? { focusSession: { ...s.focusSession, status: 'abandoned' } } : s),

      // ── Challenge ─────────────────────────────────────────────────────────────
      startChallenge: (challengeId, blueprintGoalMap = {}) => {
        const { customChallenges } = get()
        const challenge =
          CHALLENGE_CATALOGUE.find((c) => c.id === challengeId) ||
          (customChallenges || []).find((c) => c.id === challengeId)
        if (!challenge) return

        const startDate = new Date()
        const endDate   = challenge.deadline
          ? new Date(challenge.deadline)
          : new Date(Date.now() + challenge.durationDays * 86400000)

        const acId     = uid()
        const rawTasks = buildAllTasks(challenge, acId, startDate, endDate, blueprintGoalMap as Record<string, string>)
        const newTasks = rawTasks.map((t) => ({ ...t, id: uid(), createdAt: new Date().toISOString() }))

        const newAC: ActiveChallenge = {
          id: acId, challengeId,
          startDate: startDate.toISOString(),
          endDate:   endDate.toISOString(),
          isActive: true, currentDay: 1,
          createdAt: new Date().toISOString(),
        }

        set((s) => ({
          tasks: [...s.tasks, ...newTasks],
          activeChallenges: [...s.activeChallenges, newAC],
        }))

        const userId = get().supabaseUserId
        if (userId) {
          db.insertActiveChallenge(userId, newAC).catch(console.error)
          db.insertTasks(userId, newTasks).catch(console.error)
        }
      },

      stopChallenge: (acId) => {
        set((s) => ({
          activeChallenges: s.activeChallenges.map((ac) =>
            ac.id === acId ? { ...ac, isActive: false } : ac
          ),
          tasks: s.tasks.filter((t) => {
            if (t.challengeActiveId !== acId) return true
            return t.done || new Date(t.scheduledAt) < new Date()
          }),
        }))
        const userId = get().supabaseUserId
        if (userId) {
          db.updateActiveChallenge(acId, { isActive: false }).catch(console.error)
          db.deleteTasksByChallenge(acId).catch(console.error)
        }
      },

      getChallengeProgress: (acId) => {
        const { tasks } = get()
        const ct = tasks.filter((t) => t.challengeActiveId === acId)
        if (!ct.length) return 0
        return Math.round((ct.filter((t) => t.done).length / ct.length) * 100)
      },

      getTodayChallengeTaskCount: (acId) => {
        const { tasks } = get()
        const todayStr = new Date().toDateString()
        const ct = tasks.filter((t) => t.challengeActiveId === acId && new Date(t.scheduledAt).toDateString() === todayStr)
        return { total: ct.length, done: ct.filter((t) => t.done).length }
      },

      addCustomChallenge: (data: Omit<Challenge, 'id'>) => {
        const newChallenge = {
          ...data,
          id: 'custom-' + uid(),
          blueprints: data.blueprints.map((bp) => ({ ...bp, id: bp.id || uid() })),
        }
        set((s) => ({ customChallenges: [...(s.customChallenges || []), newChallenge] }))
        const userId = get().supabaseUserId
        if (userId) db.upsertCustomChallenge(userId, newChallenge).catch(console.error)
      },
      updateCustomChallenge: (id, data) => {
        set((s) => ({ customChallenges: s.customChallenges.map((c) => c.id === id ? { ...c, ...data } : c) }))
        if (get().supabaseUserId) db.updateCustomChallenge({ id, ...data }).catch(console.error)
      },
      deleteCustomChallenge: (id) => {
        set((s) => ({ customChallenges: s.customChallenges.filter((c) => c.id !== id) }))
        if (get().supabaseUserId) db.deleteCustomChallenge(id).catch(console.error)
      },

      updateCatalogueChallenge: (id, data) =>
        set((s) => ({
          catalogueOverrides: {
            ...s.catalogueOverrides,
            [id]: { ...(s.catalogueOverrides[id] || {}), ...data },
          },
        })),

      deleteCatalogueChallenge: (id) =>
        set((s) => ({
          deletedCatalogueIds: [...s.deletedCatalogueIds, id],
        })),

      getEffectiveChallenge: (id) => {
        const { customChallenges, catalogueOverrides, deletedCatalogueIds } = get()
        const custom = customChallenges.find((c) => c.id === id)
        if (custom) return custom
        if (deletedCatalogueIds.includes(id)) return undefined
        const base = CHALLENGE_CATALOGUE.find((c) => c.id === id)
        if (!base) return undefined
        const override = catalogueOverrides[id]
        return override ? { ...base, ...override } : base
      },

      // ── Supabase ──────────────────────────────────────────────────────────────
      supabaseUserId,
      userEmail,
      setSupabaseUser: (userId) => set({ supabaseUserId: userId }),
      setUserEmail:    (email) => set({ userEmail: email }),
      hydrateFromSupabase: ({ profile, domains, goals, tasks, customChallenges, activeChallenges }) => {
        const patch: Partial<AppStore> = {}
        patch.domains          = domains
        patch.goals            = goals
        patch.tasks            = tasks
        patch.customChallenges = customChallenges
        patch.activeChallenges = activeChallenges
        if (profile) {
          const { level, xpToNextLevel } = computeLevel(profile.xp ?? 0)
          patch.userStats = {
            xp: profile.xp ?? 0, level, xpToNextLevel,
            totalTasksDone:      profile.total_tasks_done  ?? 0,
            challengesCompleted: profile.challenges_done   ?? 0,
            longestStreak:       profile.longest_streak    ?? 0,
            hardcoreMode:        profile.hardcore_mode     ?? false,
          }
          patch.streak     = profile.streak_count ?? 0
          patch.lastActive = profile.last_active    ?? null
          patch.onboarding = { completed: true, step: 'done' }
        }
        set(patch as any)
      },

      // ── mergeFromSupabase — delta sync ────────────────────────────────────────
      mergeFromSupabase: ({ profile, domains, goals, tasks, customChallenges, activeChallenges }) => {
        const s = get()
        const patch: Partial<AppStore> = {}

        // Toujours merger (tableau vide = suppressions propagées)
        if (domains.length) {
          const map = new Map(s.domains.map((d) => [d.id, d]))
          domains.forEach((d) => map.set(d.id, d))
          patch.domains = Array.from(map.values())
        }
        if (goals.length) {
          const map = new Map(s.goals.map((g) => [g.id, g]))
          goals.forEach((g) => map.set(g.id, g))
          patch.goals = Array.from(map.values())
        }
        if (tasks.length) {
          const map = new Map(s.tasks.map((t) => [t.id, t]))
          tasks.forEach((t) => map.set(t.id, t))
          patch.tasks = Array.from(map.values())
        }
        if (customChallenges.length) {
          const map = new Map(s.customChallenges.map((c) => [c.id, c]))
          customChallenges.forEach((c) => map.set(c.id, c))
          patch.customChallenges = Array.from(map.values())
        }
        if (activeChallenges.length) {
          const map = new Map(s.activeChallenges.map((c) => [c.id, c]))
          activeChallenges.forEach((c) => map.set(c.id, c))
          patch.activeChallenges = Array.from(map.values())
        }
        if (profile) {
          const { level, xpToNextLevel } = computeLevel(profile.xp ?? 0)
          patch.userStats = {
            xp: profile.xp ?? 0, level, xpToNextLevel,
            totalTasksDone:      profile.total_tasks_done  ?? 0,
            challengesCompleted: profile.challenges_done   ?? 0,
            longestStreak:       profile.longest_streak    ?? 0,
            hardcoreMode:        profile.hardcore_mode     ?? false,
          }
          patch.streak     = profile.streak     ?? 0
          patch.lastActive = profile.last_active ?? null
        }
        set(patch as any)
      },


      setRecurringTemplates: (templates) => {
        set({ recurringTemplates: templates } as any)
      },

      // ── Recurring Templates ───────────────────────────────────────────────
      recurringTemplates: [] as any[],

      addRecurringTemplate: async (data) => {
        const newTemplate = { ...data, id: Date.now().toString(36) + Math.random().toString(36).slice(2,7), createdAt: new Date().toISOString() }
        set((s) => ({ recurringTemplates: [...s.recurringTemplates, newTemplate] }))
        const userId = get().supabaseUserId
        if (userId) {
          const error = await db.insertRecurringTemplate(userId, newTemplate)
          if (error) {
            set((s) => ({ recurringTemplates: s.recurringTemplates.filter((t) => t.id !== newTemplate.id) }))
            return
          }
        }
        get().generateRecurringTasksForDate(new Date())
      },
      updateRecurringTemplate: (id, data) => {
        set((s) => ({
          recurringTemplates: s.recurringTemplates.map((t) => t.id === id ? { ...t, ...data } : t),
        }))
        if (get().supabaseUserId) db.updateRecurringTemplateInDb(id, data).catch(console.error)
      },
      deleteRecurringTemplate: (id) => {
        set((s) => ({
          recurringTemplates: s.recurringTemplates.filter((t) => t.id !== id),
          tasks: s.tasks.filter((t) => {
            if (t.templateId !== id) return true
            return t.done || new Date(t.scheduledAt) < new Date()
          }),
        }))
        if (get().supabaseUserId) db.deleteRecurringTemplateFromDb(id).catch(console.error)
      },
      generateRecurringTasksForDate: (date: Date) => {
        const { recurringTemplates, tasks, supabaseUserId } = get()
        if (!recurringTemplates.length) return
        const dateStr   = date.toDateString()
        const dateISO   = date.toISOString().split('T')[0]
        const dayOfWeek = date.getDay()
        const newTasks = []
        for (const template of recurringTemplates) {
          if (!template.active) continue
          if (template.startDate > dateISO) continue
          if (template.endDate && template.endDate < dateISO) continue
          let match = false
          if      (template.frequency === 'daily')    match = true
          else if (template.frequency === 'workdays') match = dayOfWeek >= 1 && dayOfWeek <= 5
          else if (template.frequency === 'weekend')  match = dayOfWeek === 0 || dayOfWeek === 6
          else if (template.frequency === 'custom')   match = (template.customDays ?? []).includes(dayOfWeek)
          if (!match) continue
          const exists = tasks.some((t) => t.templateId === template.id && new Date(t.scheduledAt).toDateString() === dateStr)
          if (exists) continue
          const uid2 = Date.now().toString(36) + Math.random().toString(36).slice(2,7)
          newTasks.push({
            id: uid2, title: template.title,
            domainId: template.domainId, goalId: template.goalId,
            duration: template.duration,
            scheduledAt: dateISO + 'T' + template.timeOfDay + ':00.000Z',
            done: false, xpValue: template.xpValue ?? 10,
            priority: template.priority || 'medium',
            templateId: template.id, isGenerated: true,
            createdAt: new Date().toISOString(),
          })
        }
        if (!newTasks.length) return
        set((s) => ({ tasks: [...s.tasks, ...newTasks] }))
        if (supabaseUserId) db.insertTasks(supabaseUserId, newTasks).catch(console.error)
      },

      // ── Selectors ────────────────────────────────────────────────────────────
      resetRestDayWeekly: () => {
        const today = new Date()
        if (today.getDay() === 1) {
          set({ restDayUsedThisWeek: false })
        }
      },

      updateStreak: () => {
        const { tasks, streak, lastActive, userStats } = get()
        const todayStr     = new Date().toDateString()
        const yesterdayStr = new Date(Date.now() - 86400000).toDateString()
        const hasDone      = tasks.some((t) => t.done && new Date(t.scheduledAt).toDateString() === todayStr)
        if (hasDone && lastActive !== todayStr) {
          const ns = lastActive === yesterdayStr ? streak + 1 : 1
          set({ streak: ns, lastActive: todayStr, userStats: { ...userStats, longestStreak: Math.max(userStats.longestStreak, ns) } })
        }
      },
      getTasksForDate: (date) => {
        const d = date.toDateString()
        return get().tasks.filter((t) => new Date(t.scheduledAt).toDateString() === d)
      },
      getGoalProgress: (goalId) => {
        const ts = get().tasks.filter((t) => t.goalId === goalId)
        if (!ts.length) return 0
        return Math.round((ts.filter((t) => t.done).length / ts.length) * 100)
      },
      getDomainProgress: (domainId) => {
        const { goals, getGoalProgress } = get()
        const gs = goals.filter((g) => g.domainId === domainId)
        if (!gs.length) return 0
        return Math.round(gs.reduce((a, g) => a + getGoalProgress(g.id), 0) / gs.length)
      },
      getGlobalProgress: () => {
        const { domains, getDomainProgress } = get()
        if (!domains.length) return 0
        return Math.round(domains.reduce((a, d) => a + getDomainProgress(d.id), 0) / domains.length)
      },
      getTop3Tasks: () => {
        const { tasks } = get()
        const todayStr = new Date().toDateString()
        return tasks
          .filter((t) => !t.done && new Date(t.scheduledAt).toDateString() === todayStr)
          .sort((a, b) => ({ high: 3, medium: 2, low: 1 }[b.priority || 'medium'] - { high: 3, medium: 2, low: 1 }[a.priority || 'medium']))
          .slice(0, 3)
      },
      completeOnboarding: () => set({ onboarding: { completed: true, step: 'done' } }),
      setOnboardingStep: (step) => set((s) => ({ onboarding: { ...s.onboarding, step } })),
    }),
    {
      name: 'focusflow-store-v10',
      skipHydration: true,
      storage: ssrSafeStorage,
      // tasks, goals, domains sont des données serveur → jamais persistées localement
      // Seules les préférences UI et l'état de session sont gardés
      partialize: (state: AppStore) => {
        const {
          tasks: _t,
          goals: _g,
          domains: _d,
          activeChallenges: _ac,
          customChallenges: _cc,
          lastSyncedAt: _ls,
          isInserting: _ii,
          ...uiState
        } = state
        return uiState
      },
    }
  )
)
