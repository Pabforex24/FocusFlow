/**
 * selectors.ts — Sélecteurs Zustand mémoïsés
 *
 * Pourquoi : les fonctions getGoalProgress / getDomainProgress / getGlobalProgress
 * dans le store recalculent tout le tableau tasks à chaque render.
 * Avec useMemo + un sélecteur stable, React ne recalcule que si tasks/goals/domains changent.
 *
 * Usage :
 *   const globalPct = useGlobalProgress()
 *   const pct       = useDomainProgress('domain-id')
 *   const pct       = useGoalProgress('goal-id')
 *   const todayTasks = useTodayTasks()
 *   const top3       = useTop3Tasks()
 */

import { useMemo } from 'react'
import { useStore } from '@/store'

// ── Progression globale ───────────────────────────────────────────────────────
export function useGlobalProgress(): number {
  const domains = useStore((s) => s.domains)
  const goals   = useStore((s) => s.goals)
  const tasks   = useStore((s) => s.tasks)

  return useMemo(() => {
    if (!domains.length) return 0
    const domainPcts = domains.map((d) => {
      const dGoals = goals.filter((g) => g.domainId === d.id)
      if (!dGoals.length) return 0
      const goalPcts = dGoals.map((g) => {
        const gTasks = tasks.filter((t) => t.goalId === g.id)
        return !gTasks.length ? 0 : Math.round((gTasks.filter((t) => t.done).length / gTasks.length) * 100)
      })
      return Math.round(goalPcts.reduce((a, p) => a + p, 0) / goalPcts.length)
    })
    return Math.round(domainPcts.reduce((a, p) => a + p, 0) / domainPcts.length)
  }, [domains, goals, tasks])
}

// ── Progression par domaine ───────────────────────────────────────────────────
export function useDomainProgress(domainId: string): number {
  const goals = useStore((s) => s.goals)
  const tasks = useStore((s) => s.tasks)

  return useMemo(() => {
    const dGoals = goals.filter((g) => g.domainId === domainId)
    if (!dGoals.length) return 0
    const pcts = dGoals.map((g) => {
      const gTasks = tasks.filter((t) => t.goalId === g.id)
      return !gTasks.length ? 0 : Math.round((gTasks.filter((t) => t.done).length / gTasks.length) * 100)
    })
    return Math.round(pcts.reduce((a, p) => a + p, 0) / pcts.length)
  }, [domainId, goals, tasks])
}

// ── Progression par objectif ──────────────────────────────────────────────────
export function useGoalProgress(goalId: string): number {
  const tasks = useStore((s) => s.tasks)

  return useMemo(() => {
    const gTasks = tasks.filter((t) => t.goalId === goalId)
    return !gTasks.length ? 0 : Math.round((gTasks.filter((t) => t.done).length / gTasks.length) * 100)
  }, [goalId, tasks])
}

// ── Tâches du jour ────────────────────────────────────────────────────────────
export function useTodayTasks() {
  const tasks = useStore((s) => s.tasks)

  return useMemo(() => {
    const todayStr = new Date().toDateString()
    return tasks.filter((t) => new Date(t.scheduledAt).toDateString() === todayStr)
  }, [tasks])
}

// ── Top 3 tâches prioritaires du jour ────────────────────────────────────────
export function useTop3Tasks() {
  const tasks = useStore((s) => s.tasks)

  return useMemo(() => {
    const todayStr = new Date().toDateString()
    return tasks
      .filter((t) => !t.done && new Date(t.scheduledAt).toDateString() === todayStr)
      .sort((a, b) =>
        ({ high: 3, medium: 2, low: 1 }[b.priority || 'medium'] ?? 2) -
        ({ high: 3, medium: 2, low: 1 }[a.priority || 'medium'] ?? 2)
      )
      .slice(0, 3)
  }, [tasks])
}

// ── Progressions de tous les domaines (pour le dashboard) ────────────────────
export function useAllDomainProgress(): Record<string, number> {
  const domains = useStore((s) => s.domains)
  const goals   = useStore((s) => s.goals)
  const tasks   = useStore((s) => s.tasks)

  return useMemo(() => {
    const result: Record<string, number> = {}
    for (const d of domains) {
      const dGoals = goals.filter((g) => g.domainId === d.id)
      if (!dGoals.length) { result[d.id] = 0; continue }
      const pcts = dGoals.map((g) => {
        const gTasks = tasks.filter((t) => t.goalId === g.id)
        return !gTasks.length ? 0 : Math.round((gTasks.filter((t) => t.done).length / gTasks.length) * 100)
      })
      result[d.id] = Math.round(pcts.reduce((a, p) => a + p, 0) / pcts.length)
    }
    return result
  }, [domains, goals, tasks])
}

// ── Stats du jour (pour le dashboard) ────────────────────────────────────────
export function useTodayStats() {
  const tasks = useStore((s) => s.tasks)

  return useMemo(() => {
    const todayStr = new Date().toDateString()
    const todayTasks = tasks.filter((t) => new Date(t.scheduledAt).toDateString() === todayStr)
    const done       = todayTasks.filter((t) => t.done)
    return {
      total:  todayTasks.length,
      done:   done.length,
      pct:    todayTasks.length ? Math.round((done.length / todayTasks.length) * 100) : 0,
    }
  }, [tasks])
}
