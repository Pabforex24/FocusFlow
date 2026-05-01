import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  AppStore, Domain, Goal, Task, Challenge, ActiveChallenge,
  FocusSession, UserStats, Badge, OnboardingState,
  ALL_BADGES, xpForLevel, FrequencyType, getOccurrenceDates,
} from '@/types'

// ─── Challenge catalogue ──────────────────────────────────────────────────────
export const CHALLENGE_CATALOGUE: Challenge[] = [
  {
    id: 'ch-trading-30',
    title: 'Trader Discipline 30J',
    description: 'Construis une routine de trading solide : backtest quotidien, journal et analyse hebdo.',
    durationDays: 30, color: '#00C2A8', icon: 'TrendingUp',
    blueprints: [
      { id: 'bp-t1', title: '1h de backtest', domainId: 'seed-d1', duration: '1h', frequency: 'workdays' },
      { id: 'bp-t2', title: 'Mettre à jour le journal de trades', domainId: 'seed-d1', duration: '20min', frequency: 'daily' },
    ],
  },
  {
    id: 'ch-sport-21',
    title: 'Défi Forme 21J',
    description: 'Adopte une routine sportive en 21 jours avec cardio, musculation et récupération.',
    durationDays: 21, color: '#FFB830', icon: 'Dumbbell',
    blueprints: [
      { id: 'bp-s1', title: 'Footing 20 minutes', domainId: 'seed-d2', duration: '20min', frequency: 'daily' },
      { id: 'bp-s2', title: 'Séance musculation', domainId: 'seed-d2', duration: '45min', frequency: 'workdays' },
    ],
  },
  {
    id: 'ch-learning-14',
    title: 'Deep Learning 14J',
    description: "Plonge dans un sujet d'étude intensif avec sessions concentrées et révisions.",
    durationDays: 14, color: '#4EA8DE', icon: 'Brain',
    blueprints: [
      { id: 'bp-l1', title: "Session d'étude focalisée", domainId: 'seed-d3', duration: '1h30', frequency: 'daily' },
      { id: 'bp-l2', title: 'Révision des notes', domainId: 'seed-d3', duration: '20min', frequency: 'daily' },
    ],
  },
  {
    id: 'ch-wellness-7',
    title: 'Reset Bien-être 7J',
    description: 'Une semaine pour tout remettre à zéro : hydratation, sommeil, mouvement, pleine conscience.',
    durationDays: 7, color: '#1BC47D', icon: 'Leaf',
    blueprints: [
      { id: 'bp-w1', title: "Boire 2L d'eau", domainId: 'seed-d2', duration: '—', frequency: 'daily' },
      { id: 'bp-w2', title: 'Méditation 10 min', domainId: 'seed-d2', duration: '10min', frequency: 'daily' },
    ],
  },
]

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

const today    = new Date().toISOString().split('T')[0]
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

const seedDomains: Domain[] = [
  { id: 'seed-d1', name: 'Trading', icon: 'TrendingUp', color: '#00C2A8', createdAt: new Date().toISOString() },
  { id: 'seed-d2', name: 'Sport',   icon: 'Dumbbell',   color: '#FFB830', createdAt: new Date().toISOString() },
  { id: 'seed-d3', name: 'Études',  icon: 'BookOpen',   color: '#4EA8DE', createdAt: new Date().toISOString() },
]

const seedGoals: Goal[] = [
  { id: 'seed-g1', domainId: 'seed-d1', title: 'Faire 30h de backtest en 1 mois',  description: '',  deadline: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0], createdAt: new Date().toISOString() },
  { id: 'seed-g2', domainId: 'seed-d2', title: "Courir 5km sans s'arrêter",         description: '',  deadline: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0], createdAt: new Date().toISOString() },
  { id: 'seed-g3', domainId: 'seed-d3', title: 'Valider le module de finance',      description: '',  deadline: new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0], createdAt: new Date().toISOString() },
]

const seedTasks: Task[] = [
  { id: uid(), title: '1h30 de backtest EUR/USD',               domainId: 'seed-d1', goalId: 'seed-g1', duration: '1h30',  scheduledAt: `${today}T08:00:00.000Z`,    done: false, xpValue: 10, priority: 'high',   createdAt: new Date().toISOString() },
  { id: uid(), title: 'Analyser les trades de la semaine',      domainId: 'seed-d1', goalId: 'seed-g1', duration: '30min', scheduledAt: `${today}T10:00:00.000Z`,    done: true,  xpValue: 10, doneAt: new Date().toISOString(), createdAt: new Date().toISOString() },
  { id: uid(), title: 'Footing 20 minutes',                     domainId: 'seed-d2', goalId: 'seed-g2', duration: '20min', scheduledAt: `${today}T07:00:00.000Z`,    done: false, xpValue: 10, priority: 'medium', createdAt: new Date().toISOString() },
  { id: uid(), title: 'Réviser chapitre 3 — Marchés financiers',domainId: 'seed-d3', goalId: 'seed-g3', duration: '1h',    scheduledAt: `${today}T14:00:00.000Z`,    done: false, xpValue: 10, priority: 'medium', createdAt: new Date().toISOString() },
  { id: uid(), title: 'Backtest stratégie RSI',                 domainId: 'seed-d1', goalId: 'seed-g1', duration: '2h',    scheduledAt: `${tomorrow}T09:00:00.000Z`, done: false, xpValue: 10, priority: 'high',   createdAt: new Date().toISOString() },
]

const initialUserStats: UserStats = {
  xp: 0, level: 1, xpToNextLevel: xpForLevel(1),
  totalTasksDone: 0, challengesCompleted: 0, longestStreak: 0,
  hardcoreMode: false,
}

const initialOnboarding: OnboardingState = { completed: false, step: 'domains' }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeLevel(xp: number): { level: number; xpToNextLevel: number } {
  let level = 1
  let cumulative = 0
  while (cumulative + xpForLevel(level) <= xp) {
    cumulative += xpForLevel(level)
    level++
  }
  return { level, xpToNextLevel: xpForLevel(level) - (xp - cumulative) }
}

/**
 * Génère TOUTES les occurrences des tâches d'un challenge entre startDate et endDate.
 * Chaque blueprint génère ses tâches selon sa fréquence propre.
 */
function buildAllChallengeTasks(
  challenge: Challenge,
  acId: string,
  startDate: Date,
  endDate: Date,
  domainIdMap: Record<string, string>
): Omit<Task, 'id' | 'createdAt'>[] {
  const tasks: Omit<Task, 'id' | 'createdAt'>[] = []

  for (const bp of challenge.blueprints) {
    const freq: FrequencyType = bp.frequency || 'daily'
    const dates = getOccurrenceDates(startDate, endDate, freq, bp.customDays)

    for (const d of dates) {
      const dayStr = d.toISOString().split('T')[0]
      tasks.push({
        title: bp.title,
        domainId: domainIdMap[bp.domainId] ?? bp.domainId,
        duration: bp.duration,
        scheduledAt: `${dayStr}T08:00:00.000Z`,
        done: false,
        xpValue: 20,
        challengeActiveId: acId,
        priority: 'medium',
        frequency: freq,
        customDays: bp.customDays,
        isGenerated: true,
      })
    }
  }

  return tasks
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // ── Initial state ────────────────────────────────────────────────────────
      domains:          seedDomains,
      goals:            seedGoals,
      tasks:            seedTasks,
      streak:           3,
      lastActive:       new Date(Date.now() - 86400000).toDateString(),
      onboarding:       initialOnboarding,
      userStats:        initialUserStats,
      badges:           ALL_BADGES.map((b) => ({ ...b })),
      focusSession:     null,
      activeChallenges: [],
      customChallenges: [],

      // ── Domain actions ───────────────────────────────────────────────────────
      addDomain: (data) =>
        set((s) => ({ domains: [...s.domains, { ...data, id: uid(), createdAt: new Date().toISOString() }] })),
      updateDomain: (id, data) =>
        set((s) => ({ domains: s.domains.map((d) => (d.id === id ? { ...d, ...data } : d)) })),
      deleteDomain: (id) =>
        set((s) => {
          const goalIds = s.goals.filter((g) => g.domainId === id).map((g) => g.id)
          return {
            domains: s.domains.filter((d) => d.id !== id),
            goals:   s.goals.filter((g) => g.domainId !== id),
            tasks:   s.tasks.filter((t) => t.domainId !== id && !goalIds.includes(t.goalId || '')),
          }
        }),

      // ── Goal actions ─────────────────────────────────────────────────────────
      addGoal: (data) =>
        set((s) => ({ goals: [...s.goals, { ...data, id: uid(), createdAt: new Date().toISOString() }] })),
      updateGoal: (id, data) =>
        set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, ...data } : g)) })),
      deleteGoal: (id) =>
        set((s) => ({
          goals: s.goals.filter((g) => g.id !== id),
          tasks: s.tasks.filter((t) => t.goalId !== id),
        })),

      // ── Task actions ─────────────────────────────────────────────────────────
      addTask: (data) =>
        set((s) => ({ tasks: [...s.tasks, { ...data, id: uid(), createdAt: new Date().toISOString() }] })),
      bulkAddTasks: (list) =>
        set((s) => ({
          tasks: [...s.tasks, ...list.map((d) => ({ ...d, id: uid(), createdAt: new Date().toISOString() }))],
        })),
      toggleTask: (id) => {
        const { tasks, awardXP, checkAndAwardBadges, updateStreak } = get()
        const task = tasks.find((t) => t.id === id)
        if (!task) return
        const nowDone = !task.done
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, done: nowDone, doneAt: nowDone ? new Date().toISOString() : undefined } : t
          ),
          userStats: nowDone
            ? { ...s.userStats, totalTasksDone: s.userStats.totalTasksDone + 1 }
            : { ...s.userStats, totalTasksDone: Math.max(0, s.userStats.totalTasksDone - 1) },
        }))
        if (nowDone) {
          awardXP(task.xpValue ?? 10)
          updateStreak()
          checkAndAwardBadges()
          const { tasks: updatedTasks } = get()
          const todayStr = new Date().toDateString()
          const todayAll = updatedTasks.filter((t) => new Date(t.scheduledAt).toDateString() === todayStr)
          if (todayAll.length > 0 && todayAll.every((t) => t.done)) {
            awardXP(50)
          }
        }
      },
      deleteTask: (id) =>
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      // ── Gamification ─────────────────────────────────────────────────────────
      awardXP: (amount) => {
        set((s) => {
          const newXP = s.userStats.xp + amount
          const { level, xpToNextLevel } = computeLevel(newXP)
          return { userStats: { ...s.userStats, xp: newXP, level, xpToNextLevel } }
        })
      },

      checkAndAwardBadges: () => {
        const { userStats, badges, streak, tasks, awardXP } = get()
        const earned = new Set(badges.filter((b) => b.unlockedAt).map((b) => b.id))
        const newlyUnlocked: typeof badges = []

        const check = (id: typeof badges[0]['id'], condition: boolean) => {
          if (!earned.has(id) && condition) {
            newlyUnlocked.push({ ...badges.find((b) => b.id === id)!, unlockedAt: new Date().toISOString() })
          }
        }

        check('first_task',    userStats.totalTasksDone >= 1)
        check('tasks_10',      userStats.totalTasksDone >= 10)
        check('tasks_30',      userStats.totalTasksDone >= 30)
        check('tasks_100',     userStats.totalTasksDone >= 100)
        check('streak_7',      streak >= 7)
        check('streak_30',     streak >= 30)
        check('challenge_done',userStats.challengesCompleted >= 1)
        check('challenge_3',   userStats.challengesCompleted >= 3)

        const hour = new Date().getHours()
        const todayDone = tasks.filter((t) => t.done && new Date(t.doneAt || '').toDateString() === new Date().toDateString())
        if (todayDone.length > 0) {
          check('early_bird', hour < 8)
          check('night_owl',  hour >= 23)
        }

        if (newlyUnlocked.length > 0) {
          newlyUnlocked.forEach((b) => awardXP(b.xpReward))
          set((s) => ({
            badges: s.badges.map((b) => {
              const match = newlyUnlocked.find((u) => u.id === b.id)
              return match ? { ...b, unlockedAt: match.unlockedAt } : b
            }),
          }))
        }
      },

      applyDailyPenalty: () => {
        const { userStats, streak, tasks } = get()
        const yesterday = new Date(Date.now() - 86400000).toDateString()
        const hadYesterday = tasks.some((t) => t.done && new Date(t.doneAt || '').toDateString() === yesterday)
        if (!hadYesterday && streak > 0) {
          const penaltyXP = userStats.hardcoreMode ? 30 : 15
          const newXP = Math.max(0, userStats.xp - penaltyXP)
          const { level, xpToNextLevel } = computeLevel(newXP)
          set((s) => ({
            streak: 0,
            userStats: { ...s.userStats, xp: newXP, level, xpToNextLevel },
          }))
        }
      },

      toggleHardcoreMode: () =>
        set((s) => ({ userStats: { ...s.userStats, hardcoreMode: !s.userStats.hardcoreMode } })),

      // ── Focus Session ─────────────────────────────────────────────────────────
      startFocus: (taskId, durationMinutes = 25) => {
        set({
          focusSession: {
            id: uid(), taskId, durationMinutes,
            elapsedSeconds: 0, status: 'running',
            startedAt: new Date().toISOString(), xpEarned: 0,
          },
        })
      },
      tickFocus: () =>
        set((s) => {
          if (!s.focusSession || s.focusSession.status !== 'running') return s
          const elapsed = s.focusSession.elapsedSeconds + 1
          const target  = s.focusSession.durationMinutes * 60
          if (elapsed >= target) {
            return { focusSession: { ...s.focusSession, elapsedSeconds: target, status: 'done', completedAt: new Date().toISOString(), xpEarned: 30 } }
          }
          return { focusSession: { ...s.focusSession, elapsedSeconds: elapsed } }
        }),
      pauseFocus:   () => set((s) => s.focusSession ? { focusSession: { ...s.focusSession, status: 'paused'  } } : s),
      resumeFocus:  () => set((s) => s.focusSession ? { focusSession: { ...s.focusSession, status: 'running' } } : s),
      completeFocus: () => {
        const { focusSession, awardXP, toggleTask, checkAndAwardBadges } = get()
        if (!focusSession) return
        const xp = 30
        awardXP(xp)
        if (focusSession.taskId) toggleTask(focusSession.taskId)
        set((s) => ({
          focusSession: { ...focusSession, status: 'done', completedAt: new Date().toISOString(), xpEarned: xp },
          userStats: { ...s.userStats },
        }))
        checkAndAwardBadges()
      },
      abandonFocus: () => set((s) => s.focusSession ? { focusSession: { ...s.focusSession, status: 'abandoned' } } : s),

      // ── Challenge actions ─────────────────────────────────────────────────────
      startChallenge: (challengeId, domainIdMap) => {
        const { customChallenges } = get()
        const challenge =
          CHALLENGE_CATALOGUE.find((c) => c.id === challengeId) ||
          (customChallenges || []).find((c) => c.id === challengeId)
        if (!challenge) return

        const startDate = new Date()
        // endDate calculé depuis deadline ou durationDays
        const endDate = challenge.deadline
          ? new Date(challenge.deadline)
          : new Date(Date.now() + challenge.durationDays * 86400000)

        const acId = uid()

        // Génération COMPLÈTE de toutes les tâches
        const allTasks = buildAllChallengeTasks(challenge, acId, startDate, endDate, domainIdMap)

        const newAC: ActiveChallenge = {
          id: acId, challengeId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          isActive: true,
          currentDay: 1,
          createdAt: new Date().toISOString(),
        }

        set((s) => ({
          tasks: [...s.tasks, ...allTasks.map((t) => ({ ...t, id: uid(), createdAt: new Date().toISOString() }))],
          activeChallenges: [...s.activeChallenges, newAC],
        }))
      },

      generateAllChallengeTasks: (activeChallengeId) => {
        const { activeChallenges, customChallenges, tasks } = get()
        const ac = activeChallenges.find((a) => a.id === activeChallengeId)
        if (!ac || !ac.isActive) return

        const challenge =
          CHALLENGE_CATALOGUE.find((c) => c.id === ac.challengeId) ||
          (customChallenges || []).find((c) => c.id === ac.challengeId)
        if (!challenge) return

        // Supprimer les tâches non-complétées existantes et regénérer
        const existingGenerated = tasks.filter(
          (t) => t.challengeActiveId === activeChallengeId && t.isGenerated && !t.done
        )
        const idsToRemove = new Set(existingGenerated.map((t) => t.id))

        const newTasks = buildAllChallengeTasks(
          challenge,
          activeChallengeId,
          new Date(ac.startDate),
          new Date(ac.endDate),
          {}
        )

        set((s) => ({
          tasks: [
            ...s.tasks.filter((t) => !idsToRemove.has(t.id)),
            ...newTasks.map((t) => ({ ...t, id: uid(), createdAt: new Date().toISOString() })),
          ],
        }))
      },

      // Alias deprecated
      generateTodayChallengeTasks: (activeChallengeId) => {
        get().generateAllChallengeTasks(activeChallengeId)
      },

      stopChallenge: (activeChallengeId) => {
        set((s) => ({
          activeChallenges: s.activeChallenges.map((ac) =>
            ac.id === activeChallengeId ? { ...ac, isActive: false } : ac
          ),
          tasks: s.tasks.filter((t) => {
            if (t.challengeActiveId !== activeChallengeId) return true
            if (t.done) return true
            return new Date(t.scheduledAt) < new Date()
          }),
        }))
      },

      getChallengeProgress: (activeChallengeId) => {
        const { tasks } = get()
        const ct = tasks.filter((t) => t.challengeActiveId === activeChallengeId)
        if (!ct.length) return 0
        return Math.round((ct.filter((t) => t.done).length / ct.length) * 100)
      },

      getTodayChallengeTaskCount: (activeChallengeId) => {
        const { tasks } = get()
        const todayStr = new Date().toDateString()
        const ct = tasks.filter(
          (t) => t.challengeActiveId === activeChallengeId &&
                 new Date(t.scheduledAt).toDateString() === todayStr
        )
        return { total: ct.length, done: ct.filter((t) => t.done).length }
      },

      addCustomChallenge: (data) => {
        const newC: Challenge = {
          id: 'custom-' + uid(),
          title: data.title,
          description: data.description,
          durationDays: data.durationDays,
          color: data.color,
          icon: data.icon,
          blueprints: data.blueprints.map((bp) => ({ ...bp, id: bp.id || uid() })),
          deadline: data.deadline,
        }
        set((s) => ({ customChallenges: [...(s.customChallenges || []), newC] }))
      },
      updateCustomChallenge: (id, data) =>
        set((s) => ({
          customChallenges: (s.customChallenges || []).map((c) => (c.id === id ? { ...c, ...data } : c)),
        })),
      deleteCustomChallenge: (id) =>
        set((s) => ({ customChallenges: (s.customChallenges || []).filter((c) => c.id !== id) })),

      // ── Selectors ────────────────────────────────────────────────────────────
      updateStreak: () => {
        const { tasks, streak, lastActive, userStats } = get()
        const todayStr    = new Date().toDateString()
        const yesterdayStr= new Date(Date.now() - 86400000).toDateString()
        const hasDone = tasks.some((t) => t.done && new Date(t.scheduledAt).toDateString() === todayStr)
        if (hasDone && lastActive !== todayStr) {
          const newStreak = lastActive === yesterdayStr ? streak + 1 : 1
          set({
            streak: newStreak,
            lastActive: todayStr,
            userStats: { ...userStats, longestStreak: Math.max(userStats.longestStreak, newStreak) },
          })
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
        const gs = goals.filter((g) => g.domainId === domainId && !g.challengeId)
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
        const pending = tasks
          .filter((t) => !t.done && new Date(t.scheduledAt).toDateString() === todayStr)
          .sort((a, b) => {
            const prio = { high: 3, medium: 2, low: 1 }
            return (prio[b.priority || 'medium'] || 2) - (prio[a.priority || 'medium'] || 2)
          })
        return pending.slice(0, 3)
      },

      // ── Onboarding ────────────────────────────────────────────────────────────
      completeOnboarding: () => set({ onboarding: { completed: true, step: 'done' } }),
      setOnboardingStep: (step) => set((s) => ({ onboarding: { ...s.onboarding, step } })),
    }),
    { name: 'focusflow-store-v8' }
  )
)
