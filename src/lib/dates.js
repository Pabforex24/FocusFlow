// Toutes les dates "métier" sont des jours locaux au format "YYYY-MM-DD".
// On n'utilise jamais toISOString() pour un jour : il renvoie l'UTC et décale la date.

const pad = (n) => String(n).padStart(2, '0')

export function toKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function todayKey() {
  return toKey(new Date())
}

// Midi local : évite tout souci de changement d'heure.
export function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0)
}

export function addDays(key, n) {
  const d = fromKey(key)
  d.setDate(d.getDate() + n)
  return toKey(d)
}

export function diffDays(fromKeyStr, toKeyStr) {
  return Math.round((fromKey(toKeyStr) - fromKey(fromKeyStr)) / 86400000)
}

// 0 = lundi … 6 = dimanche
export function weekdayIndex(key) {
  return (fromKey(key).getDay() + 6) % 7
}

export function startOfWeekKey(key) {
  return addDays(key, -weekdayIndex(key))
}

export function formatLong(key) {
  return fromKey(key).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function formatShort(key) {
  return fromKey(key).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export function formatMonth(year, monthIndex) {
  return new Date(year, monthIndex, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

export function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate()
}

export function monthKey(year, monthIndex, day) {
  return `${year}-${pad(monthIndex + 1)}-${pad(day)}`
}

// Jours d'une période (bornes incluses) qui respectent une fréquence.
export function occurrenceDates(startKey, endKey, frequency = 'daily') {
  const result = []
  for (let key = startKey; key <= endKey; key = addDays(key, 1)) {
    const wd = weekdayIndex(key)
    if (frequency === 'workdays' && wd > 4) continue
    if (frequency === 'weekend' && wd < 5) continue
    result.push(key)
  }
  return result
}
