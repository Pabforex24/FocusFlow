import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isToday, isTomorrow, isYesterday } from 'date-fns'
import { fr } from 'date-fns/locale'

// ─── Class merge utility ──────────────────────────────────────────────────────
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// ─── Date formatting ──────────────────────────────────────────────────────────
export function formatTaskDate(date) {
  if (isToday(date)) return "Aujourd'hui"
  if (isTomorrow(date)) return 'Demain'
  if (isYesterday(date)) return 'Hier'
  return format(date, 'EEEE d MMMM', { locale: fr })
}

export function formatDeadline(deadline) {
  const d = new Date(deadline)
  const daysLeft = Math.ceil((d.getTime() - Date.now()) / 86400000)
  if (daysLeft < 0) return 'Expiré'
  if (daysLeft === 0) return "Aujourd'hui !"
  if (daysLeft === 1) return 'Demain'
  if (daysLeft <= 7) return `${daysLeft}j restants`
  return format(d, 'd MMM yyyy', { locale: fr })
}

export function getDaysLeft(deadline): number | null {
  if (!deadline) return null
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)
}

// ─── Color helpers ────────────────────────────────────────────────────────────
export function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

// ─── Progress color ───────────────────────────────────────────────────────────
export function progressColor(pct) {
  if (pct >= 80) return '#22c55e'
  if (pct >= 50) return '#6d5aec'
  if (pct >= 20) return '#f59e0b'
  return '#f43f5e'
}

// ─── Greeting ────────────────────────────────────────────────────────────────
export function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bonne après-midi'
  return 'Bonsoir'
}

// ─── Motivational quotes ──────────────────────────────────────────────────────
export const MOTIVATIONAL_QUOTES = [
  'La discipline, c\'est choisir entre ce que vous voulez maintenant et ce que vous voulez le plus.',
  'Chaque tâche complétée est une brique de plus dans la construction de votre meilleure version.',
  'Ce n\'est pas la motivation qui crée l\'action — c\'est l\'action qui crée la motivation.',
  'Petits progrès quotidiens = résultats extraordinaires à long terme.',
  'La procrastination, c\'est voler à son propre futur. Reprenez le contrôle maintenant.',
  'Les habitudes forment l\'homme. Faites en sorte que les vôtres soient excellentes.',
]

export function getRandomQuote() {
  return MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]
}

// ─── Week activity data ───────────────────────────────────────────────────────
export function getWeekActivity(tasks) {
  const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000)
    const dateStr = d.toDateString()
    const all = tasks.filter((t) => new Date(t.scheduledAt).toDateString() === dateStr)
    const done = all.filter((t) => t.done)
    const dayIndex = (d.getDay() + 6) % 7
    return {
      label: days[dayIndex],
      date: d,
      total: all.length,
      done: done.length,
      pct: all.length ? Math.round((done.length / all.length) * 100) : 0,
    }
  })
}
