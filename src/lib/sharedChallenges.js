import { todayKey } from './dates.js'

// Un défi partagé suit le même calendrier pour tous, mais chaque membre coche ses propres
// tâches. Ces fonctions ne manipulent que le groupe et des agrégats, jamais les tâches privées.
export function sharedChallengeStatus(group, today = todayKey()) {
  if (group.status === 'archived') return 'archived'
  if (today < group.start_date) return 'upcoming'
  if (today > group.end_date) return 'finished'
  return 'active'
}

export function sharedChallengeCanJoin(group, today = todayKey()) {
  return group.status !== 'archived' && today <= group.start_date
}

export function sharedChallengeTotals(rows = []) {
  const done = rows.reduce((sum, row) => sum + (Number(row.done) || 0), 0)
  const total = rows.reduce((sum, row) => sum + (Number(row.total) || 0), 0)
  return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 }
}

export function sharedChallengeLink(code, origin = window.location.origin) {
  return `${origin}/challenges/rejoindre/${encodeURIComponent(code)}`
}
