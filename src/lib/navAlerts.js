// Alertes du centre de notifications. Elles sont dérivées des données déjà chargées :
// aucune table, aucun envoi, aucune valeur inventée. La lecture est mémorisée localement.

export const NAV_ALERTS_KEY = 'focusflow-nav-alerts-read'

export function buildNavAlerts({ tasks = [], today, stats = {} }) {
  const left = tasks.filter((task) => task.scheduled_on === today && !task.done).length
  const alerts = []

  if (left > 0) {
    alerts.push({
      id: `tasks-${today}`,
      kind: 'tasks',
      title: left === 1 ? '1 tâche reste aujourd’hui' : `${left} tâches restent aujourd’hui`,
      description: 'Ouvre tes tâches pour terminer la journée.',
      to: '/tasks',
    })
  }

  if (left > 0 && stats.streak > 0) {
    alerts.push({
      id: `streak-${today}`,
      kind: 'streak',
      title: `Série de ${stats.streak} jour${stats.streak > 1 ? 's' : ''}`,
      description: 'Une tâche terminée suffit à la prolonger.',
      to: '/tasks',
    })
  }

  const xpLeft = Number(stats.xpForNext) - Number(stats.xpIntoLevel)
  if (Number.isFinite(xpLeft) && xpLeft > 0 && xpLeft <= 50) {
    alerts.push({
      id: `level-${stats.level}-${stats.xp}`,
      kind: 'level',
      title: `Niveau ${Number(stats.level) + 1} tout proche`,
      description: `Encore ${xpLeft} XP pour passer au niveau suivant.`,
      to: '/profile',
    })
  }

  return alerts
}

export function unreadAlertCount(alerts, readIds = []) {
  const seen = new Set(readIds)
  return alerts.filter((alert) => !seen.has(alert.id)).length
}

export function readAlertIds() {
  try {
    const parsed = JSON.parse(localStorage.getItem(NAV_ALERTS_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

export function saveAlertIds(ids) {
  try {
    localStorage.setItem(NAV_ALERTS_KEY, JSON.stringify([...new Set(ids)]))
  } catch {
    // Le centre d'alertes reste utilisable sans mémoire de lecture.
  }
}
