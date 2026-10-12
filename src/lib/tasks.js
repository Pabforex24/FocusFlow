import { addDays, occurrenceDates } from './dates.js'

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

// Configuration mémorisée sur chaque occurrence d'une série (ce qui suffit à la reconstruire :
// le début et la fin se déduisent des dates des occurrences).
export const repeatConfig = (repeat) => ({ frequency: repeat?.frequency ?? 'daily', weekdays: repeat?.weekdays ?? [] })

// Dates d'une répétition.
// - mode « until » : de `startKey` jusqu'à `repeat.until` (bornes incluses).
// - sinon : `repeat.days` jours à partir de `startKey`.
export function recurrenceDates(startKey, repeat) {
  const frequency = repeat?.frequency ?? 'daily'
  const weekdays = repeat?.weekdays ?? []
  const endKey = repeat?.mode === 'until'
    ? repeat.until
    : addDays(startKey, Math.max(1, Math.floor(Number(repeat?.days) || 1)) - 1)
  if (!endKey || endKey < startKey) return []
  return occurrenceDates(startKey, endKey, frequency, weekdays)
}
