import { addDays } from './dates.js'

// Tâches en retard : non faites et prévues avant aujourd'hui.
export function overdueTasks(tasks, today) {
  return tasks.filter((t) => !t.done && t.scheduled_on < today)
}

// Tâches d'un challenge actif, triées par date de prévue.
export function challengeTasks(tasks, challengeActiveId) {
  return tasks
    .filter((t) => t.challenge_active_id === challengeActiveId)
    .sort((a, b) => a.scheduled_on.localeCompare(b.scheduled_on) || a.created_at.localeCompare(b.created_at))
}

// Répartit une liste d'ids sur `days` jours à partir de `startDay` (tourniquet : équilibré à ±1).
export function spreadDates(ids, startDay, days) {
  const count = Math.min(Math.max(Math.floor(Number(days) || 1), 1), 90)
  return ids.map((id, i) => ({ id, day: addDays(startDay, i % count) }))
}
