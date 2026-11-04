import { addDays, todayKey } from './dates.js'
import { goalProgress, lastDays } from './stats.js'

// Analyse locale du Coach : aucune requête réseau, aucun texte inventé.
// Elle se recalcule à chaque changement de données et sert aussi de repli au chat IA.

const short = (value, max = 80) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
const normalize = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const plural = (count, singular, pluralWord = `${singular}s`) => `${count} ${count > 1 ? pluralWord : singular}`

function period(tasks, endKey) {
  const days = lastDays(tasks, endKey)
  const total = days.reduce((sum, day) => sum + day.total, 0)
  const done = days.reduce((sum, day) => sum + day.done, 0)
  return { days, total, done, rate: total ? Math.round((done / total) * 100) : null }
}

function riskState({ overdue, lateGoals, remaining, missedDays, restDays, streak }) {
  if (overdue.length) return { value: `${overdue.length} en retard`, hint: 'À replacer ou supprimer', tone: 'warning' }
  if (lateGoals.length) return { value: `${lateGoals.length} objectif${lateGoals.length > 1 ? 's' : ''}`, hint: 'Échéance dépassée', tone: 'warning' }
  if (remaining.length >= 6) return { value: 'Charge élevée', hint: 'Réduis à 3 priorités', tone: 'warning' }
  if (missedDays >= 3) return { value: `${missedDays} jours manqués`, hint: 'Déclare un imprévu si besoin', tone: 'info' }
  if (!restDays.length && streak >= 5) return { value: 'Série à protéger', hint: 'Prévois un jour de repos', tone: 'info' }
  return { value: 'Sous contrôle', hint: 'Aucun blocage majeur', tone: 'success' }
}

export function buildCoachAnalysis(data = {}) {
  const {
    tasks = [], goals = [], domains = [], stats = {}, restDays = [],
    activeChallenges = [], today = todayKey(),
  } = data

  const todayTasks = tasks.filter((task) => task.scheduled_on === today)
  const remaining = todayTasks.filter((task) => !task.done)
  const overdue = tasks.filter((task) => !task.done && task.scheduled_on < today)
  const week = period(tasks, today)
  const previous = period(tasks, addDays(today, -7))
  const trend = week.rate !== null && previous.rate !== null ? week.rate - previous.rate : null
  const activeDays = week.days.filter((day) => day.done > 0).length
  const bestDay = [...week.days].filter((day) => day.total > 0).sort((a, b) => b.rate - a.rate)[0] ?? null

  const lateGoals = goals
    .map((goal) => ({ goal, progress: goalProgress(goal, tasks) }))
    .filter(({ goal, progress }) => goal.deadline && goal.deadline < today && progress.pct < 100)
  const openGoals = goals
    .map((goal) => ({ goal, progress: goalProgress(goal, tasks) }))
    .filter(({ progress }) => progress.pct < 100)
  const challenge = activeChallenges.find((item) => item.end_date >= today) ?? null

  const domainStats = domains
    .map((domain) => {
      const own = tasks.filter((task) => task.domain_id === domain.id)
      const done = own.filter((task) => task.done).length
      return { id: domain.id, name: domain.name, color: domain.color, total: own.length, done, pct: own.length ? Math.round((done / own.length) * 100) : 0 }
    })
    .filter((domain) => domain.total > 0)
    .sort((a, b) => b.total - a.total)
  const rankedDomains = [...domainStats].filter((domain) => domain.total >= 2).sort((a, b) => a.pct - b.pct || b.total - a.total)
  const weakDomain = rankedDomains[0] ?? null
  const strongDomain = [...rankedDomains].sort((a, b) => b.pct - a.pct || b.total - a.total)[0] ?? null

  const priorityTask = remaining.find((task) => task.priority === 'high') ?? remaining[0] ?? null
  const streak = stats.streak ?? 0
  const longestStreak = stats.longestStreak ?? 0
  const missedDays = stats.missedDays ?? 0
  const risk = riskState({ overdue, lateGoals, remaining, missedDays, restDays, streak })

  const focus = {
    title: priorityTask ? 'Priorité du jour' : 'Prochaine action',
    text: priorityTask
      ? `Commence par « ${short(priorityTask.title, 70)} »${priorityTask.duration ? ` (${priorityTask.duration})` : ''} et garde une seule priorité jusqu'au bout.`
      : todayTasks.length
        ? 'La journée est terminée. Choisis une petite action pour demain afin de garder ton élan.'
        : 'Planifie une action de 10 minutes pour aujourd’hui. Une seule suffit pour créer de l’élan.',
    to: priorityTask ? '/tasks' : '/tasks?new=1',
    cta: priorityTask ? 'Voir mes tâches' : 'Planifier une tâche',
  }

  let headline
  let summary
  let tone = 'brand'
  if (tasks.length === 0) {
    headline = 'Commence par un pas minuscule'
    summary = 'Ajoute une tâche simple de 10 minutes. Le Coach pourra ensuite analyser ton rythme et t’aider à construire une routine.'
    tone = 'brand'
  } else if (overdue.length >= 3) {
    headline = 'Débloque l’arriéré'
    summary = `${plural(overdue.length, 'tâche')} en retard pèsent sur ta charge mentale. Choisis-en une à traiter maintenant, reporte le reste sans culpabiliser.`
    tone = 'warning'
  } else if (todayTasks.length > 0 && remaining.length === 0) {
    headline = 'Journée bouclée'
    summary = `Tout est fait aujourd’hui. Tu as ${week.rate === null ? 'un rythme régulier' : `${week.rate} % de complétion cette semaine`} : capitalise avec une petite action pour demain.`
    tone = 'success'
  } else if (remaining.length >= 6) {
    headline = 'Allège la journée'
    summary = `${remaining.length} tâches restent aujourd’hui. Garde trois priorités maximum et déplace le reste : finir vaut mieux que tout commencer.`
    tone = 'warning'
  } else if (week.rate !== null && week.rate < 50) {
    headline = 'Réduis pour mieux finir'
    summary = `Ta semaine est à ${week.rate} %. Diminue la charge de moitié et termine chaque tâche planifiée avant d’en ajouter une nouvelle.`
    tone = 'warning'
  } else if (trend !== null && trend >= 10) {
    headline = 'L’élan est là'
    summary = `Tu progresses de ${trend} points par rapport à la semaine précédente. Garde la même charge encore quelques jours.`
    tone = 'success'
  } else if (streak >= 5) {
    headline = 'Protège ta série'
    summary = `Ta série de ${streak} jours est solide. Une petite tâche suffit les jours difficiles, et un imprévu peut protéger le reste.`
    tone = 'success'
  } else {
    headline = 'Garde un rythme simple'
    summary = 'Une priorité claire, une action courte, puis tu t’arrêtes. La régularité compte plus que l’intensité.'
    tone = 'brand'
  }

  const momentumText = week.rate === null
    ? 'Pas encore assez de tâches cette semaine pour mesurer un rythme fiable.'
    : trend === null
      ? `${week.done}/${week.total} tâches terminées cette semaine, sans comparaison disponible.`
      : trend > 0
        ? `${week.done}/${week.total} tâches terminées, soit ${trend} points de mieux que la semaine précédente.`
        : trend < 0
          ? `${week.done}/${week.total} tâches terminées, soit ${Math.abs(trend)} points de moins que la semaine précédente.`
          : `${week.done}/${week.total} tâches terminées, au même rythme que la semaine précédente.`

  const riskText = overdue.length
    ? `${plural(overdue.length, 'tâche')} en retard. Commence par la plus ancienne ou supprime-la si elle n’a plus de sens.`
    : lateGoals.length
      ? `« ${short(lateGoals[0].goal.title, 60)} » a dépassé son échéance. Découpe-le en une tâche concrète cette semaine.`
      : remaining.length >= 6
        ? `${remaining.length} tâches restantes : trop pour une seule journée. Réduis à trois priorités.`
        : missedDays >= 3
          ? `${missedDays} jours manqués récemment. Un imprévu déclaré vaut mieux qu’une série cassée.`
          : !restDays.length && streak >= 5
            ? 'Aucun imprévu utilisé alors que ta série est longue. Garde une soupape pour les jours difficiles.'
            : 'Rien de bloquant. Continue avec une charge réaliste et des pauses prévues.'

  const balanceText = weakDomain
    ? `« ${short(weakDomain.name, 40)} » est le domaine le moins avancé (${weakDomain.pct} %). Ajoute une petite tâche pour le relancer.`
    : strongDomain
      ? `« ${short(strongDomain.name, 40)} » porte ton élan (${strongDomain.pct} %). Veille à ne pas oublier les autres domaines.`
      : 'Relie tes prochaines tâches à un domaine pour obtenir une analyse plus fine de ton équilibre.'

  const focusTask = priorityTask
  const plan = [
    {
      title: focusTask ? 'Commencer maintenant' : 'Créer un premier élan',
      text: focus.text,
      to: focus.to,
      cta: focus.cta,
    },
    lateGoals.length
      ? {
          title: 'Découper l’objectif en retard',
          text: `« ${short(lateGoals[0].goal.title, 55)} » est à ${lateGoals[0].progress.pct} %. Transforme-le en une tâche de 20 minutes.`,
          to: '/goals',
          cta: 'Revoir mes objectifs',
        }
      : overdue.length
        ? {
            title: 'Traiter l’arriéré',
            text: `Replace ou supprime ${plural(overdue.length, 'tâche')} en retard. Choisis la plus ancienne en premier.`,
            to: '/tasks',
            cta: 'Ouvrir les tâches',
          }
        : weakDomain
          ? {
              title: `Relancer ${short(weakDomain.name, 28)}`,
              text: `Ce domaine est à ${weakDomain.pct} %. Planifie une action courte cette semaine.`,
              to: '/tasks?new=1',
              cta: 'Ajouter une tâche',
            }
          : {
              title: 'Préparer demain',
              text: 'Choisis une seule action prioritaire pour demain et bloque-lui un créneau réaliste.',
              to: '/tasks?new=1',
              cta: 'Planifier demain',
            },
    challenge
      ? {
          title: 'Faire le point sur le défi',
          text: `« ${short(challenge.title, 50)} » se termine le ${challenge.end_date}. Vérifie les tâches restantes.`,
          to: '/challenges',
          cta: 'Ouvrir les défis',
        }
      : {
          title: 'Lancer un défi court',
          text: 'Un défi de 7 jours ajoute un cadre sans surcharger. Choisis un thème qui compte pour toi.',
          to: '/challenges',
          cta: 'Choisir un défi',
        },
  ]

  return {
    headline,
    summary,
    tone,
    metrics: [
      {
        label: 'Taux 7 jours',
        value: week.rate === null ? '—' : `${week.rate} %`,
        hint: trend === null ? `${week.done}/${week.total} tâches` : `${trend > 0 ? '+' : ''}${trend} pts vs semaine -1`,
        tone: week.rate === null ? 'info' : week.rate >= 70 ? 'success' : week.rate >= 50 ? 'brand' : 'warning',
      },
      {
        label: 'Série',
        value: `${streak} j`,
        hint: `Record : ${longestStreak} j`,
        tone: streak >= 3 ? 'success' : 'info',
      },
      {
        label: 'Priorité',
        value: focusTask ? short(focusTask.title, 28) : 'À planifier',
        hint: focusTask ? 'Tâche la plus urgente' : 'Aucune tâche restante',
        tone: focusTask ? 'brand' : 'info',
      },
      {
        label: 'Risque',
        value: risk.value,
        hint: risk.hint,
        tone: risk.tone,
      },
    ],
    focus,
    momentum: { text: momentumText, activeDays, bestDay, weekRate: week.rate, trend },
    risk: { ...risk, text: riskText },
    balance: { text: balanceText, domains: domainStats.slice(0, 4), weakDomain, strongDomain },
    plan,
    openGoals,
    lateGoals,
  }
}

export const COACH_PROMPTS = [
  'Organise ma journée',
  'Je suis débordé',
  'J’ai besoin de motivation',
]

export const COACH_ACTIONS = [
  { to: '/tasks?new=1', label: 'Planifier une tâche' },
  { to: '/goals?new=1', label: 'Créer un objectif' },
  { to: '/challenges', label: 'Choisir un défi' },
  { to: '/domains?new=1', label: 'Ajouter un domaine' },
]

// Réponse de secours quand l'IA n'est pas joignable : toujours concrète et basée sur les données.
export function localCoachReply(message, data = {}, analysis = buildCoachAnalysis(data)) {
  const text = normalize(message)
  const priority = analysis.focus.text
  const plan = analysis.plan

  if (/(planif|journee|tache|taches|organis|agenda|programm)/.test(text)) {
    return [
      `Pour aujourd’hui : ${priority}`,
      analysis.momentum.text,
      `Ensuite, ${plan[1].text}`,
    ].join('\n')
  }

  if (/(defi|challenge)/.test(text)) {
    return [
      plan[2].text,
      'Un défi court (7 jours) est plus facile à tenir qu’un mois complet : choisis un domaine prioritaire et garde une seule action quotidienne.',
    ].join('\n')
  }

  if (/(domaine|equilibre|repartition)/.test(text)) {
    return [
      analysis.balance.text,
      analysis.balance.weakDomain
        ? `Objectif réaliste : une tâche de 15 minutes sur « ${short(analysis.balance.weakDomain.name, 40)} » cette semaine.`
        : 'Commence par relier tes tâches existantes à un domaine pour voir où tu investis ton énergie.',
    ].join('\n')
  }

  if (/(objectif|but|goal)/.test(text)) {
    return analysis.lateGoals.length
      ? `L’objectif « ${short(analysis.lateGoals[0].goal.title, 60)} » est en retard. Découpe-le en une action de 20 minutes et planifie-la aujourd’hui.\n${plan[1].text}`
      : analysis.openGoals.length
        ? `Tu as ${plural(analysis.openGoals.length, 'objectif')} en cours. Choisis-en un seul cette semaine et traduis-le en une tâche concrète.`
        : 'Aucun objectif ouvert : c’est le bon moment pour définir un but simple et le relier à un domaine.'
  }

  if (/(motiv|envie|procrastin|fatigue|decourag|difficile|dur|peur)/.test(text)) {
    return [
      'Tu n’as pas besoin d’être motivé pour commencer : choisis une action de deux minutes, juste pour casser l’inertie.',
      priority,
      analysis.momentum.weekRate !== null && analysis.momentum.weekRate >= 50
        ? `Ta semaine est déjà à ${analysis.momentum.weekRate} % : tu sais avancer, même sans envie.`
        : 'Vise une seule tâche terminée aujourd’hui. C’est suffisant pour garder le cap.',
    ].join('\n')
  }

  if (/(charge|surcharge|trop|stress|anxieu|debord|epuise)/.test(text)) {
    return [
      analysis.risk.text,
      'Règle simple : trois priorités maximum, le reste est reporté ou supprimé. Une journée réussie n’est pas une journée pleine.',
    ].join('\n')
  }

  return [
    analysis.summary,
    analysis.momentum.text,
    `Prochaine étape : ${priority}`,
  ].join('\n')
}
