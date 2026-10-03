import { addDays, todayKey } from './dates.js'

export const FOCUS_XP = 30
export const PERFECT_DAY_XP = 50
export const PENALTY_NORMAL = 15
export const PENALTY_HARDCORE = 30

// Niveau n : il faut n*100+50 XP pour passer au suivant.
export const xpForLevel = (level) => level * 100 + 50

export function computeLevel(xp) {
  let level = 1
  let spent = 0
  while (spent + xpForLevel(level) <= xp) {
    spent += xpForLevel(level)
    level += 1
  }
  return { level, xpIntoLevel: xp - spent, xpForNext: xpForLevel(level) }
}

// Regroupe les tâches par jour : { "2026-09-30": { total, done } }
export function groupByDay(tasks) {
  const days = {}
  for (const t of tasks) {
    const day = (days[t.scheduled_on] ||= { total: 0, done: 0 })
    day.total += 1
    if (t.done) day.done += 1
  }
  return days
}

function computeStreaks(days, restSet, today) {
  const keys = Object.keys(days).concat([...restSet]).sort()
  if (keys.length === 0) return { streak: 0, longest: 0 }

  // Série en cours : on part d'aujourd'hui (non terminé = pas encore perdu) puis on remonte.
  let streak = 0
  let cursor = today
  const todayDone = (days[today]?.done ?? 0) > 0
  if (!todayDone) cursor = addDays(today, -1)
  for (let guard = 0; guard < 5000; guard++) {
    const done = days[cursor]?.done ?? 0
    if (done > 0) streak += 1
    else if (!restSet.has(cursor)) break
    cursor = addDays(cursor, -1)
  }

  // Record : on parcourt toute la période.
  let longest = 0
  let run = 0
  for (let key = keys[0]; key <= today; key = addDays(key, 1)) {
    const done = days[key]?.done ?? 0
    if (done > 0) { run += 1; longest = Math.max(longest, run) }
    else if (!restSet.has(key) && key !== today) run = 0
  }
  return { streak, longest: Math.max(longest, streak) }
}

/**
 * Toutes les statistiques sont DÉRIVÉES des données (tâches, jours de repos, sessions focus).
 * Rien n'est stocké en double : impossible d'avoir un XP ou une série désynchronisés.
 */
export function computeStats({ tasks, restDays = [], focusSessions = [], hardcore = false, challengesDone = 0, today = todayKey() }) {
  const days = groupByDay(tasks)
  const restSet = new Set(restDays)

  let xp = 0
  let totalDone = 0
  let perfectDays = 0
  let missedDays = 0
  for (const t of tasks) if (t.done) { xp += t.xp_value; totalDone += 1 }
  xp += focusSessions.length * FOCUS_XP

  for (const [key, day] of Object.entries(days)) {
    if (day.total > 0 && day.done === day.total) { xp += PERFECT_DAY_XP; perfectDays += 1 }
    if (key < today && day.done === 0 && !restSet.has(key)) {
      missedDays += 1
      xp -= hardcore ? PENALTY_HARDCORE : PENALTY_NORMAL
    }
  }
  xp = Math.max(0, xp)

  const { streak, longest } = computeStreaks(days, restSet, today)
  return {
    xp, ...computeLevel(xp), streak, longestStreak: longest,
    totalDone, perfectDays, missedDays, focusCount: focusSessions.length, challengesDone,
  }
}

export const BADGES = [
  { id: 'first_task', icon: 'sprout', title: 'Premier pas', description: 'Terminer 1 tâche', test: (s) => s.totalDone >= 1 },
  { id: 'tasks_10', icon: 'circle-check', title: 'Régulier', description: 'Terminer 10 tâches', test: (s) => s.totalDone >= 10 },
  { id: 'tasks_50', icon: 'dumbbell', title: 'Endurant', description: 'Terminer 50 tâches', test: (s) => s.totalDone >= 50 },
  { id: 'tasks_100', icon: 'trophy', title: 'Centurion', description: 'Terminer 100 tâches', test: (s) => s.totalDone >= 100 },
  { id: 'streak_3', icon: 'flame', title: 'En route', description: 'Série de 3 jours', test: (s) => s.longestStreak >= 3 },
  { id: 'streak_7', icon: 'zap', title: 'Semaine parfaite', description: 'Série de 7 jours', test: (s) => s.longestStreak >= 7 },
  { id: 'streak_30', icon: 'mountain', title: 'Inarrêtable', description: 'Série de 30 jours', test: (s) => s.longestStreak >= 30 },
  { id: 'level_5', icon: 'star', title: 'Niveau 5', description: 'Atteindre le niveau 5', test: (s) => s.level >= 5 },
  { id: 'level_10', icon: 'crown', title: 'Niveau 10', description: 'Atteindre le niveau 10', test: (s) => s.level >= 10 },
  { id: 'perfect_day', icon: 'target', title: 'Journée parfaite', description: '100 % des tâches d\'un jour', test: (s) => s.perfectDays >= 1 },
  { id: 'perfect_5', icon: 'gem', title: 'Perfectionniste', description: '5 journées parfaites', test: (s) => s.perfectDays >= 5 },
  { id: 'focus_1', icon: 'timer', title: 'Première session', description: 'Terminer 1 session Focus', test: (s) => s.focusCount >= 1 },
  { id: 'focus_10', icon: 'brain', title: 'Concentré', description: 'Terminer 10 sessions Focus', test: (s) => s.focusCount >= 10 },
  { id: 'challenge_1', icon: 'flag', title: 'Challenger', description: 'Terminer un challenge', test: (s) => s.challengesDone >= 1 },
]

export function computeBadges(stats) {
  return BADGES.map((b) => ({ id: b.id, icon: b.icon, title: b.title, description: b.description, unlocked: b.test(stats) }))
}
