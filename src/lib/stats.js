import { addDays, daysInMonth, monthKey, startOfWeekKey, weekdayIndex } from './dates.js'
import { groupByDay } from './gamification.js'

export function rate(day) {
  return day && day.total > 0 ? day.done / day.total : null
}

// 7 derniers jours (aujourd'hui inclus) : [{ key, total, done, rate }]
export function lastDays(tasks, today, count = 7) {
  const days = groupByDay(tasks)
  return Array.from({ length: count }, (_, i) => {
    const key = addDays(today, i - (count - 1))
    const d = days[key] || { total: 0, done: 0 }
    return { key, total: d.total, done: d.done, rate: rate(d) }
  })
}

// Heatmap : `weeks` colonnes de 7 jours (lundi → dimanche), la dernière contient aujourd'hui.
export function heatmap(tasks, today, weeks = 16) {
  const days = groupByDay(tasks)
  const firstMonday = addDays(startOfWeekKey(today), -(weeks - 1) * 7)
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const key = addDays(firstMonday, w * 7 + d)
      return { key, future: key > today, rate: rate(days[key]), total: days[key]?.total ?? 0 }
    })
  )
}

export function monthSummary(tasks, year, monthIndex) {
  const days = groupByDay(tasks)
  const total = daysInMonth(year, monthIndex)
  const cells = []
  let done = 0, count = 0, xp = 0, activeDays = 0
  let best = null
  const xpByKey = {}
  for (const t of tasks) if (t.done) xpByKey[t.scheduled_on] = (xpByKey[t.scheduled_on] || 0) + t.xp_value

  for (let d = 1; d <= total; d++) {
    const key = monthKey(year, monthIndex, d)
    const day = days[key] || { total: 0, done: 0 }
    cells.push({ key, day: d, weekday: weekdayIndex(key), total: day.total, done: day.done, rate: rate(day) })
    done += day.done
    count += day.total
    xp += xpByKey[key] || 0
    if (day.done > 0) activeDays += 1
    if (day.total > 0 && (!best || rate(day) > best.rate)) best = { key, rate: rate(day), done: day.done }
  }
  return { cells, rate: count ? Math.round((done / count) * 100) : 0, xp, activeDays, best, done, count }
}

export function goalProgress(goal, tasks) {
  const own = tasks.filter((t) => t.goal_id === goal.id)
  const done = own.filter((t) => t.done).length
  return { done, total: own.length, pct: own.length ? Math.round((done / own.length) * 100) : 0 }
}

// Couleur de la heatmap/calendrier : rouge (0 %) → vert (100 %).
export function rateColor(r) {
  if (r === null) return 'var(--surface-2)'
  const hue = Math.round(r * 130)
  return `hsl(${hue} 65% ${30 + r * 10}%)`
}

// Taux de complétion (0-100) entre deux jours inclus ; null s'il n'y a aucune tâche.
export function rateBetween(tasks, fromKey, toKey) {
  const own = tasks.filter((t) => t.scheduled_on >= fromKey && t.scheduled_on <= toKey)
  if (own.length === 0) return null
  return Math.round((own.filter((t) => t.done).length / own.length) * 100)
}

// Taux par domaine : [{ domain, done, total, pct }]
export function domainBreakdown(domains, tasks) {
  return domains.map((domain) => {
    const own = tasks.filter((t) => t.domain_id === domain.id)
    const done = own.filter((t) => t.done).length
    return { domain, done, total: own.length, pct: own.length ? Math.round((done / own.length) * 100) : 0 }
  })
}
