import { useStore } from '@/store'
import { useMemo } from 'react'

export function useEnrichedGoals(domainFilter) {
  const { goals, domains, tasks, getGoalProgress } = useStore()

  return useMemo(() => {
    const filtered = domainFilter
      ? goals.filter((g) => g.domainId === domainFilter)

    return filtered.map((goal) => {
      const domain = domains.find((d) => d.id === goal.domainId)
      // Only count non-challenge tasks for goal progress
      const goalTasks = tasks.filter((t) => t.goalId === goal.id && !t.challengeActiveId)
      return {
        ...goal,
        domain,
        progress: getGoalProgress(goal.id),
        taskCount: goalTasks.length,
        doneCount: goalTasks.filter((t) => t.done).length,
      }
    })
  }, [goals, domains, tasks, domainFilter])
}

export function useEnrichedDomains() {
  const { domains, goals, getDomainProgress } = useStore()

  return useMemo(
    () =>
      domains.map((d) => ({
        ...d,
        progress: getDomainProgress(d.id),
        goalCount: goals.filter((g) => g.domainId === d.id).length,
      })),
    [domains, goals]
  )
}

export function useDashboardStats() {
  const { tasks, goals, streak, getGlobalProgress, userStats } = useStore()

  return useMemo(() => {
    const today = new Date().toDateString()
    const todayAll  = tasks.filter((t) => new Date(t.scheduledAt).toDateString() === today && !t.challengeActiveId)
    const todayDone = todayAll.filter((t) => t.done)
    return {
      todayTotal:  todayAll.length,
      todayDone:   todayDone.length,
      todayPct:    todayAll.length ? Math.round((todayDone.length / todayAll.length) * 100) : 0,
      activeGoals: goals.length,
      streak,
      globalPct:   getGlobalProgress(),
      level:       userStats.level,
      xp:          userStats.xp,
    }
  }, [tasks, goals, streak, userStats])
}
