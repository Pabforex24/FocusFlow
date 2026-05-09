/**
 * FocusFlow — Tests unitaires
 * Lancer : npx vitest run
 * Coverage : npx vitest run --coverage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { xpForLevel, getOccurrenceDates, ALL_BADGES } from '@/types/index'

// ── Mock Supabase (le store l'importe au module level) ───────────────────────
vi.mock('@/lib/supabase', () => ({ supabase: null }))

// ── Mock localStorage (indisponible dans l'environnement Node de Vitest) ─────
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem:    (k: string) => store[k] ?? null,
    setItem:    (k: string, v: string) => { store[k] = v },
    removeItem: (k: string) => { delete store[k] },
    clear:      () => { store = {} },
  }
})()
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

// Import du store APRÈS le mock
import { useStore } from '@/store'

// ── Helper : reset du store entre chaque test ────────────────────────────────
function resetStore() {
  useStore.setState({
    domains:             [],
    goals:               [],
    tasks:               [],
    badges:              ALL_BADGES.map((b) => ({ ...b })),
    streak:              0,
    lastActive:          null,
    activeChallenges:    [],
    customChallenges:    [],
    deletedCatalogueIds: [],
    catalogueOverrides:  {},
    focusSession:        null,
    focusModalOpen:      false,
    userStats: {
      xp: 0, level: 1, xpToNextLevel: xpForLevel(1),
      totalTasksDone: 0, challengesCompleted: 0,
      longestStreak: 0, hardcoreMode: false,
    },
  })
}

// ════════════════════════════════════════════════════════════════════════════
// 1. FONCTIONS PURES
// ════════════════════════════════════════════════════════════════════════════

describe('xpForLevel', () => {
  it('niveau 1 → 150 XP nécessaires', () => {
    expect(xpForLevel(1)).toBe(150)
  })
  it('niveau 2 → 250 XP', () => {
    expect(xpForLevel(2)).toBe(250)
  })
  it('croît linéairement (n×100+50)', () => {
    for (let n = 1; n <= 10; n++) {
      expect(xpForLevel(n)).toBe(n * 100 + 50)
    }
  })
})

describe('getOccurrenceDates', () => {
  const monday    = new Date('2025-01-06') // lundi
  const friday    = new Date('2025-01-10') // vendredi
  const sunday    = new Date('2025-01-12') // dimanche

  it('daily → 7 dates sur 7 jours', () => {
    const end = new Date('2025-01-12')
    expect(getOccurrenceDates(monday, end, 'daily')).toHaveLength(7)
  })

  it('workdays → seulement lun-ven', () => {
    const end = new Date('2025-01-12')
    const dates = getOccurrenceDates(monday, end, 'workdays')
    expect(dates).toHaveLength(5)
    dates.forEach((d) => {
      expect(d.getDay()).toBeGreaterThanOrEqual(1)
      expect(d.getDay()).toBeLessThanOrEqual(5)
    })
  })

  it('weekend → seulement sam-dim', () => {
    const end = new Date('2025-01-12')
    const dates = getOccurrenceDates(monday, end, 'weekend')
    expect(dates).toHaveLength(2)
    dates.forEach((d) => {
      expect([0, 6]).toContain(d.getDay())
    })
  })

  it('custom [1,3] → lundi et mercredi seulement', () => {
    const end = new Date('2025-01-12')
    const dates = getOccurrenceDates(monday, end, 'custom', [1, 3])
    expect(dates).toHaveLength(2)
    expect(dates[0].getDay()).toBe(1) // lundi
    expect(dates[1].getDay()).toBe(3) // mercredi
  })

  it('start === end → 1 date si le jour correspond', () => {
    expect(getOccurrenceDates(monday, monday, 'daily')).toHaveLength(1)
  })

  it('end avant start → tableau vide', () => {
    expect(getOccurrenceDates(friday, monday, 'daily')).toHaveLength(0)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 2. STORE — DOMAINS
// ════════════════════════════════════════════════════════════════════════════

describe('Store — Domains', () => {
  beforeEach(resetStore)

  it('addDomain crée un domaine avec id', () => {
    useStore.getState().addDomain({ name: 'Trading', icon: 'TrendingUp', color: '#00E5B0' })
    const { domains } = useStore.getState()
    expect(domains).toHaveLength(1)
    expect(domains[0].name).toBe('Trading')
    expect(domains[0].id).toBeTruthy()
  })

  it('updateDomain modifie le nom', () => {
    useStore.getState().addDomain({ name: 'Sport', icon: 'Dumbbell', color: '#FF5E7A' })
    const id = useStore.getState().domains[0].id
    useStore.getState().updateDomain(id, { name: 'Fitness' })
    expect(useStore.getState().domains[0].name).toBe('Fitness')
  })

  it('deleteDomain supprime le domaine, ses objectifs et ses tâches', () => {
    const s = useStore.getState()
    s.addDomain({ name: 'Dev', icon: 'Code', color: '#7B5EA7' })
    const domId = useStore.getState().domains[0].id
    s.addGoal({ title: 'Apprendre React', domainId: domId, createdAt: new Date().toISOString() })
    const goalId = useStore.getState().goals[0].id
    s.addTask({
      title: 'Lire la doc',
      domainId: domId, goalId,
      scheduledAt: new Date().toISOString(),
      done: false, xpValue: 10, priority: 'medium',
      createdAt: new Date().toISOString(),
    })
    useStore.getState().deleteDomain(domId)
    const state = useStore.getState()
    expect(state.domains).toHaveLength(0)
    expect(state.goals).toHaveLength(0)
    expect(state.tasks).toHaveLength(0)
  })

  it('deleteDomain ne touche pas les autres domaines', () => {
    const s = useStore.getState()
    s.addDomain({ name: 'A', icon: 'Star', color: '#00E5B0' })
    s.addDomain({ name: 'B', icon: 'Star', color: '#3DD8FA' })
    const idA = useStore.getState().domains[0].id
    useStore.getState().deleteDomain(idA)
    expect(useStore.getState().domains).toHaveLength(1)
    expect(useStore.getState().domains[0].name).toBe('B')
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 3. STORE — GOALS
// ════════════════════════════════════════════════════════════════════════════

describe('Store — Goals', () => {
  beforeEach(resetStore)

  it('addGoal crée un objectif', () => {
    useStore.getState().addDomain({ name: 'Sport', icon: 'Dumbbell', color: '#FF5E7A' })
    const domId = useStore.getState().domains[0].id
    useStore.getState().addGoal({ title: 'Courir 5km', domainId: domId, createdAt: new Date().toISOString() })
    expect(useStore.getState().goals).toHaveLength(1)
    expect(useStore.getState().goals[0].domainId).toBe(domId)
  })

  it('deleteGoal supprime aussi ses tâches liées', () => {
    const s = useStore.getState()
    s.addDomain({ name: 'D', icon: 'Star', color: '#00E5B0' })
    const domId = s.domains[0]?.id ?? useStore.getState().domains[0].id
    useStore.getState().addGoal({ title: 'Obj', domainId: domId, createdAt: new Date().toISOString() })
    const goalId = useStore.getState().goals[0].id
    useStore.getState().addTask({
      title: 'Tâche liée', domainId: domId, goalId,
      scheduledAt: new Date().toISOString(),
      done: false, xpValue: 10, priority: 'medium',
      createdAt: new Date().toISOString(),
    })
    useStore.getState().deleteGoal(goalId)
    expect(useStore.getState().goals).toHaveLength(0)
    expect(useStore.getState().tasks).toHaveLength(0)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 4. STORE — TASKS & GAMIFICATION
// ════════════════════════════════════════════════════════════════════════════

describe('Store — Tasks & XP', () => {
  beforeEach(resetStore)

  function addTask(xpValue = 10, done = false) {
    useStore.getState().addTask({
      title: 'Test task',
      scheduledAt: new Date().toISOString(),
      done, xpValue, priority: 'medium',
      createdAt: new Date().toISOString(),
    })
    return useStore.getState().tasks[useStore.getState().tasks.length - 1].id
  }

  it('toggleTask marque done=true et incrémente totalTasksDone', () => {
    const id = addTask()
    useStore.getState().toggleTask(id)
    const state = useStore.getState()
    expect(state.tasks[0].done).toBe(true)
    expect(state.tasks[0].doneAt).toBeTruthy()
    expect(state.userStats.totalTasksDone).toBe(1)
  })

  it('toggleTask inverse : done=true → done=false, décrémente totalTasksDone', () => {
    const id = addTask()
    useStore.getState().toggleTask(id)
    useStore.getState().toggleTask(id)
    const state = useStore.getState()
    expect(state.tasks[0].done).toBe(false)
    expect(state.userStats.totalTasksDone).toBe(0)
  })

  it('toggleTask ajoute le xpValue au total XP', () => {
    // Planifier la tâche dans le futur → pas de bonus "journée complète"
    // Pré-débloquer les badges → pas de XP bonus badge
    useStore.setState((s) => ({
      userStats: { ...s.userStats, totalTasksDone: 999 },
      badges: s.badges.map((b) => ({ ...b, unlockedAt: new Date().toISOString() })),
    }))
    const xpBefore = useStore.getState().userStats.xp
    const tomorrow = new Date(Date.now() + 86400000).toISOString()
    useStore.getState().addTask({
      title: 'XP test', scheduledAt: tomorrow,
      done: false, xpValue: 20, priority: 'medium',
      createdAt: new Date().toISOString(),
    })
    const id = useStore.getState().tasks.at(-1)!.id
    useStore.getState().toggleTask(id)
    expect(useStore.getState().userStats.xp).toBe(xpBefore + 20)
  })

  it('awardXP accumule correctement', () => {
    useStore.getState().awardXP(50)
    useStore.getState().awardXP(100)
    expect(useStore.getState().userStats.xp).toBe(150)
  })

  it('awardXP passe au niveau 2 après 150 XP', () => {
    useStore.getState().awardXP(150)
    expect(useStore.getState().userStats.level).toBe(2)
  })

  it('awardXP passe au niveau 3 après 150+250 XP', () => {
    useStore.getState().awardXP(400)
    expect(useStore.getState().userStats.level).toBe(3)
  })

  it('deleteTask supprime la tâche', () => {
    const id = addTask()
    useStore.getState().deleteTask(id)
    expect(useStore.getState().tasks).toHaveLength(0)
  })

  it('updateTask modifie le titre', () => {
    const id = addTask()
    useStore.getState().updateTask(id, { title: 'Nouveau titre' })
    expect(useStore.getState().tasks[0].title).toBe('Nouveau titre')
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 5. STORE — SÉLECTEURS DE PROGRESSION
// ════════════════════════════════════════════════════════════════════════════

describe('Store — Sélecteurs de progression', () => {
  beforeEach(resetStore)

  it('getGoalProgress → 0% si aucune tâche', () => {
    useStore.getState().addDomain({ name: 'D', icon: 'Star', color: '#00E5B0' })
    const domId = useStore.getState().domains[0].id
    useStore.getState().addGoal({ title: 'Obj', domainId: domId, createdAt: new Date().toISOString() })
    const goalId = useStore.getState().goals[0].id
    expect(useStore.getState().getGoalProgress(goalId)).toBe(0)
  })

  it('getGoalProgress → 50% si 1 tâche sur 2 faite', () => {
    useStore.getState().addDomain({ name: 'D', icon: 'Star', color: '#00E5B0' })
    const domId = useStore.getState().domains[0].id
    useStore.getState().addGoal({ title: 'Obj', domainId: domId, createdAt: new Date().toISOString() })
    const goalId = useStore.getState().goals[0].id
    useStore.getState().addTask({ title: 'T1', goalId, domainId: domId, scheduledAt: new Date().toISOString(), done: true,  xpValue: 10, priority: 'medium', createdAt: new Date().toISOString() })
    useStore.getState().addTask({ title: 'T2', goalId, domainId: domId, scheduledAt: new Date().toISOString(), done: false, xpValue: 10, priority: 'medium', createdAt: new Date().toISOString() })
    expect(useStore.getState().getGoalProgress(goalId)).toBe(50)
  })

  it('getGoalProgress → 100% si toutes les tâches faites', () => {
    useStore.getState().addDomain({ name: 'D', icon: 'Star', color: '#00E5B0' })
    const domId = useStore.getState().domains[0].id
    useStore.getState().addGoal({ title: 'Obj', domainId: domId, createdAt: new Date().toISOString() })
    const goalId = useStore.getState().goals[0].id
    useStore.getState().addTask({ title: 'T1', goalId, domainId: domId, scheduledAt: new Date().toISOString(), done: true, xpValue: 10, priority: 'medium', createdAt: new Date().toISOString() })
    useStore.getState().addTask({ title: 'T2', goalId, domainId: domId, scheduledAt: new Date().toISOString(), done: true, xpValue: 10, priority: 'medium', createdAt: new Date().toISOString() })
    expect(useStore.getState().getGoalProgress(goalId)).toBe(100)
  })

  it('getDomainProgress → moyenne des objectifs', () => {
    useStore.getState().addDomain({ name: 'D', icon: 'Star', color: '#00E5B0' })
    const domId = useStore.getState().domains[0].id
    // Goal 1 : 100%
    useStore.getState().addGoal({ title: 'G1', domainId: domId, createdAt: new Date().toISOString() })
    const g1 = useStore.getState().goals[0].id
    useStore.getState().addTask({ title: 'T', goalId: g1, domainId: domId, scheduledAt: new Date().toISOString(), done: true, xpValue: 10, priority: 'medium', createdAt: new Date().toISOString() })
    // Goal 2 : 0%
    useStore.getState().addGoal({ title: 'G2', domainId: domId, createdAt: new Date().toISOString() })
    const g2 = useStore.getState().goals[1].id
    useStore.getState().addTask({ title: 'T', goalId: g2, domainId: domId, scheduledAt: new Date().toISOString(), done: false, xpValue: 10, priority: 'medium', createdAt: new Date().toISOString() })
    expect(useStore.getState().getDomainProgress(domId)).toBe(50)
  })

  it('getGlobalProgress → 0 si aucun domaine', () => {
    expect(useStore.getState().getGlobalProgress()).toBe(0)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 6. STORE — BADGES
// ════════════════════════════════════════════════════════════════════════════

describe('Store — Badges', () => {
  beforeEach(resetStore)

  it('badge first_task débloqué après 1ère tâche complétée', () => {
    useStore.getState().addTask({
      title: 'T', scheduledAt: new Date().toISOString(),
      done: false, xpValue: 10, priority: 'medium',
      createdAt: new Date().toISOString(),
    })
    const id = useStore.getState().tasks[0].id
    useStore.getState().toggleTask(id)
    const badge = useStore.getState().badges.find((b) => b.id === 'first_task')
    expect(badge?.unlockedAt).toBeTruthy()
  })

  it('badge streak_7 débloqué quand streak ≥ 7', () => {
    useStore.setState({ streak: 7 })
    useStore.getState().checkAndAwardBadges()
    const badge = useStore.getState().badges.find((b) => b.id === 'streak_7')
    expect(badge?.unlockedAt).toBeTruthy()
  })

  it('badge tasks_10 débloqué quand totalTasksDone ≥ 10', () => {
    useStore.setState({ userStats: { ...useStore.getState().userStats, totalTasksDone: 10 } })
    useStore.getState().checkAndAwardBadges()
    const badge = useStore.getState().badges.find((b) => b.id === 'tasks_10')
    expect(badge?.unlockedAt).toBeTruthy()
  })

  it('un badge déjà débloqué ne se redéclenche pas', () => {
    useStore.setState({ streak: 7 })
    useStore.getState().checkAndAwardBadges()
    const first = useStore.getState().badges.find((b) => b.id === 'streak_7')?.unlockedAt
    useStore.getState().checkAndAwardBadges()
    const second = useStore.getState().badges.find((b) => b.id === 'streak_7')?.unlockedAt
    expect(first).toBe(second)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 7. STORE — GAMIFICATION : STREAK & PÉNALITÉ
// ════════════════════════════════════════════════════════════════════════════

describe('Store — Streak & Pénalité', () => {
  beforeEach(resetStore)

  it('applyDailyPenalty ne pénalise pas si streak = 0', () => {
    useStore.getState().applyDailyPenalty()
    expect(useStore.getState().userStats.xp).toBe(0)
    expect(useStore.getState().streak).toBe(0)
  })

  it('applyDailyPenalty réduit XP de 15 si pas de tâche hier (mode normal)', () => {
    useStore.setState({ streak: 5, userStats: { ...useStore.getState().userStats, xp: 100 } })
    useStore.getState().applyDailyPenalty()
    expect(useStore.getState().userStats.xp).toBe(85)
    expect(useStore.getState().streak).toBe(0)
  })

  it('applyDailyPenalty réduit XP de 30 en mode Hardcore', () => {
    useStore.setState({
      streak: 5,
      userStats: { ...useStore.getState().userStats, xp: 100, hardcoreMode: true },
    })
    useStore.getState().applyDailyPenalty()
    expect(useStore.getState().userStats.xp).toBe(70)
  })

  it('applyDailyPenalty ne descend pas sous 0 XP', () => {
    useStore.setState({ streak: 3, userStats: { ...useStore.getState().userStats, xp: 10 } })
    useStore.getState().applyDailyPenalty()
    expect(useStore.getState().userStats.xp).toBeGreaterThanOrEqual(0)
  })

  it('toggleHardcoreMode bascule le mode', () => {
    expect(useStore.getState().userStats.hardcoreMode).toBe(false)
    useStore.getState().toggleHardcoreMode()
    expect(useStore.getState().userStats.hardcoreMode).toBe(true)
    useStore.getState().toggleHardcoreMode()
    expect(useStore.getState().userStats.hardcoreMode).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 8. STORE — FOCUS
// ════════════════════════════════════════════════════════════════════════════

describe('Store — Focus', () => {
  beforeEach(resetStore)

  it('startFocus crée une session running', () => {
    useStore.getState().startFocus(undefined, 25)
    const s = useStore.getState().focusSession
    expect(s?.status).toBe('running')
    expect(s?.durationMinutes).toBe(25)
    expect(s?.elapsedSeconds).toBe(0)
  })

  it('pauseFocus met la session en pause', () => {
    useStore.getState().startFocus(undefined, 25)
    useStore.getState().pauseFocus()
    expect(useStore.getState().focusSession?.status).toBe('paused')
  })

  it('resumeFocus remet en running', () => {
    useStore.getState().startFocus(undefined, 25)
    useStore.getState().pauseFocus()
    useStore.getState().resumeFocus()
    expect(useStore.getState().focusSession?.status).toBe('running')
  })

  it('abandonFocus passe en abandoned', () => {
    useStore.getState().startFocus(undefined, 25)
    useStore.getState().abandonFocus()
    expect(useStore.getState().focusSession?.status).toBe('abandoned')
  })

  it('tickFocus incrémente elapsedSeconds', () => {
    useStore.getState().startFocus(undefined, 25)
    useStore.getState().tickFocus()
    useStore.getState().tickFocus()
    expect(useStore.getState().focusSession?.elapsedSeconds).toBe(2)
  })

  it('tickFocus passe en done quand elapsed >= durationMinutes×60', () => {
    useStore.getState().startFocus(undefined, 1) // 1 minute = 60 secondes
    useStore.setState({
      focusSession: { ...useStore.getState().focusSession!, elapsedSeconds: 59 },
    })
    useStore.getState().tickFocus()
    expect(useStore.getState().focusSession?.status).toBe('done')
  })

  it('openFocusModal / closeFocusModal contrôlent focusModalOpen', () => {
    expect(useStore.getState().focusModalOpen).toBe(false)
    useStore.getState().openFocusModal()
    expect(useStore.getState().focusModalOpen).toBe(true)
    useStore.getState().closeFocusModal()
    expect(useStore.getState().focusModalOpen).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 9. STORE — CATALOGUE CHALLENGES
// ════════════════════════════════════════════════════════════════════════════

import { CHALLENGE_CATALOGUE } from '@/store'

describe('Store — Catalogue Challenges', () => {
  beforeEach(resetStore)

  it('getEffectiveChallenge retourne un challenge du catalogue', () => {
    const first = CHALLENGE_CATALOGUE[0]
    const result = useStore.getState().getEffectiveChallenge(first.id)
    expect(result?.id).toBe(first.id)
  })

  it('updateCatalogueChallenge applique un override', () => {
    const id = CHALLENGE_CATALOGUE[0].id
    useStore.getState().updateCatalogueChallenge(id, { title: 'Titre modifié' })
    const result = useStore.getState().getEffectiveChallenge(id)
    expect(result?.title).toBe('Titre modifié')
  })

  it('deleteCatalogueChallenge retourne undefined pour le challenge masqué', () => {
    const id = CHALLENGE_CATALOGUE[0].id
    useStore.getState().deleteCatalogueChallenge(id)
    expect(useStore.getState().getEffectiveChallenge(id)).toBeUndefined()
  })

  it('addCustomChallenge ajoute un challenge custom', () => {
    useStore.getState().addCustomChallenge({
      title: 'Mon challenge', description: 'Test',
      durationDays: 14, color: '#00E5B0', icon: 'Star', blueprints: [],
    })
    expect(useStore.getState().customChallenges).toHaveLength(1)
  })

  it('deleteCustomChallenge supprime le challenge', () => {
    useStore.getState().addCustomChallenge({
      title: 'A supprimer', description: '',
      durationDays: 7, color: '#FF5E7A', icon: 'Trash', blueprints: [],
    })
    const id = useStore.getState().customChallenges[0].id
    useStore.getState().deleteCustomChallenge(id)
    expect(useStore.getState().customChallenges).toHaveLength(0)
  })
})
