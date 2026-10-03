import { addDays, occurrenceDates } from './dates.js'

// Les blueprints décrivent des tâches récurrentes. Le domaine est choisi par
// l'utilisateur au démarrage du challenge (plus d'ids "seed" fragiles).
export const CHALLENGE_CATALOGUE = [
  {
    id: 'ch-trading-30', title: 'Trader Discipline 30J', durationDays: 30, color: '#00C2A8', icon: 'trending-up',
    description: 'Une routine de trading solide : backtest quotidien, journal et analyse.',
    blueprints: [
      { title: '1h de backtest', duration: '1h', frequency: 'workdays' },
      { title: 'Mettre à jour le journal de trades', duration: '20min', frequency: 'daily' },
    ],
  },
  {
    id: 'ch-sport-21', title: 'Défi Forme 21J', durationDays: 21, color: '#FFB830', icon: 'dumbbell',
    description: 'Une routine sportive en 21 jours : cardio, musculation et récupération.',
    blueprints: [
      { title: 'Footing 20 minutes', duration: '20min', frequency: 'daily' },
      { title: 'Séance de musculation', duration: '45min', frequency: 'workdays' },
    ],
  },
  {
    id: 'ch-learning-14', title: 'Deep Learning 14J', durationDays: 14, color: '#4EA8DE', icon: 'brain',
    description: 'Un sujet d\'étude intensif avec sessions concentrées et révisions.',
    blueprints: [
      { title: 'Session d\'étude focalisée', duration: '1h30', frequency: 'daily' },
      { title: 'Révision des notes', duration: '20min', frequency: 'daily' },
    ],
  },
  {
    id: 'ch-wellness-7', title: 'Reset Bien-être 7J', durationDays: 7, color: '#1BC47D', icon: 'leaf',
    description: 'Une semaine pour tout remettre à zéro : hydratation, sommeil, mouvement.',
    blueprints: [
      { title: 'Boire 2 L d\'eau', duration: '', frequency: 'daily' },
      { title: 'Méditation 10 min', duration: '10min', frequency: 'daily' },
    ],
  },
]

export const GENERATED_TASK_XP = 20

export function challengeEndKey(startKey, durationDays) {
  return addDays(startKey, durationDays - 1)
}

// Produit les lignes de tâches (sans user_id ni challenge_active_id, ajoutés par le service).
export function buildChallengeTasks({ blueprints, startKey, endKey, domainId, goalId = null }) {
  const rows = []
  for (const bp of blueprints) {
    for (const day of occurrenceDates(startKey, endKey, bp.frequency)) {
      rows.push({
        title: bp.title,
        duration: bp.duration || null,
        scheduled_on: day,
        domain_id: domainId,
        goal_id: goalId,
        xp_value: GENERATED_TASK_XP,
        priority: 'medium',
      })
    }
  }
  return rows
}

export function challengeProgress(activeChallenge, tasks) {
  const own = tasks.filter((t) => t.challenge_active_id === activeChallenge.id)
  const done = own.filter((t) => t.done).length
  return { done, total: own.length, pct: own.length ? Math.round((done / own.length) * 100) : 0 }
}

export function isChallengeFinished(activeChallenge, tasks, today) {
  const { done, total } = challengeProgress(activeChallenge, tasks)
  return total > 0 && done === total && activeChallenge.end_date <= today
}
