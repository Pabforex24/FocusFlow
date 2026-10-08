// Décision et textes des notifications push. Fonctions pures (ni réseau ni DOM) : utilisées
// côté serveur par api/notify.js et couvertes par des tests. L'heure est toujours évaluée
// dans le fuseau de l'utilisateur, car le rappel part à une heure locale choisie.

export const STREAK_FROM_HOUR = 21 // heure locale à partir de laquelle la série est en danger

// Heure locale (0-23) dans un fuseau IANA. Repli sur UTC si le fuseau est absent/invalide.
export function localHour(date, timezone) {
  try {
    const formatted = new Intl.DateTimeFormat('en-US', { timeZone: timezone || 'UTC', hour: 'numeric', hour12: false }).format(date)
    return Number(formatted) % 24
  } catch {
    return date.getUTCHours()
  }
}

// Jour local "YYYY-MM-DD" (le format en-CA est justement ISO) dans un fuseau IANA.
export function localDateKey(date, timezone) {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone || 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
  } catch {
    return date.toISOString().slice(0, 10)
  }
}

const tasks = (n) => `${n} tâche${n > 1 ? 's' : ''}`

/**
 * Renvoie la notification à envoyer maintenant, ou null.
 * - `streak` (en priorité) : le soir, une série vivante qu'aucune tâche du jour n'entretient.
 * - `daily` : à l'heure choisie, s'il reste des tâches aujourd'hui.
 */
export function decideReminder({ profile = {}, stats = {}, tasksToday = [], restToday = false, now = new Date() }) {
  if (!profile.remind_enabled) return null

  const hour = localHour(now, profile.timezone)
  const remaining = tasksToday.filter((t) => !t.done).length
  const done = tasksToday.length - remaining
  const streak = stats.streak ?? 0

  if (hour >= STREAK_FROM_HOUR && streak >= 2 && tasksToday.length > 0 && done === 0 && !restToday) {
    return {
      kind: 'streak',
      title: 'Ta série est en danger',
      body: `Série de ${streak} jours : aucune tâche faite aujourd'hui. Coche-en une avant 23h59.`,
      url: '/tasks',
    }
  }

  if (hour === profile.remind_hour && remaining > 0) {
    const body = streak >= 2
      ? `Encore ${tasks(remaining)} avant minuit — série de ${streak} jours à préserver.`
      : `Il te reste ${tasks(remaining)} aujourd'hui.`
    return { kind: 'daily', title: 'Ton programme du jour', body, url: '/tasks' }
  }

  return null
}
