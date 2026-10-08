// Contexte Coach IA : résumé compact des données utilisateur envoyé au modèle (Groq)
// par la fonction serveur api/coach.js. Volontairement privé (aucun email ni PII,
// seuls les titres et les chiffres partent) et borné à MAX_CONTEXT_CHARS.

import { todayKey } from './dates.js'
import { goalProgress, lastDays } from './stats.js'
import { challengeProgress } from './challenges.js'

export const MAX_CONTEXT_CHARS = 10_000

const short = (value, max) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max)

export function buildCoachContext(data = {}) {
  const {
    profile = {}, tasks = [], goals = [], stats = {}, restDays = [],
    focusSessions = [], activeChallenges = [], domains = [],
    today = todayKey(),
  } = data

  const todayTasks = tasks.filter((t) => t.scheduled_on === today)
  const remaining = todayTasks.filter((t) => !t.done)

  const week = lastDays(tasks, today)
  const weekTotal = week.reduce((n, d) => n + d.total, 0)
  const weekDone = week.reduce((n, d) => n + d.done, 0)

  const lateGoals = goals
    .filter((g) => g.deadline && g.deadline < today && goalProgress(g, tasks).pct < 100)
    .slice(0, 3)
    .map((g) => ({ title: short(g.title, 60), deadline: g.deadline, pct: goalProgress(g, tasks).pct }))

  const challenges = activeChallenges
    .filter((a) => a.end_date >= today)
    .slice(0, 3)
    .map((a) => ({ title: short(a.title, 60), end: a.end_date, ...challengeProgress(a, tasks) }))

  const byDomain = domains
    .map((d) => {
      const own = tasks.filter((t) => t.domain_id === d.id)
      return { name: short(d.name, 40), done: own.filter((t) => t.done).length, total: own.length }
    })
    .filter((d) => d.total > 0)
    .slice(0, 6)

  return {
    date: today,
    hardcore: profile.hardcore_mode ?? false,
    level: stats.level ?? 1,
    xp: stats.xp ?? 0,
    streak: stats.streak ?? 0,
    longestStreak: stats.longestStreak ?? 0,
    totalDone: stats.totalDone ?? 0,
    missedDays: stats.missedDays ?? 0,
    focusSessions: focusSessions.length,
    restDaysUsed: restDays.length,
    today: {
      total: todayTasks.length,
      done: todayTasks.length - remaining.length,
      remaining: remaining.slice(0, 10).map((t) => ({ title: short(t.title, 60), priority: t.priority ?? 'medium' })),
    },
    week: { total: weekTotal, done: weekDone },
    domains: byDomain,
    activeChallenges: challenges,
    lateGoals,
  }
}

// Messages envoyés au modèle : le system prompt reste côté serveur (le client n'envoie
// que le contexte, il ne peut donc pas détourner le rôle du coach).
export function coachMessages(ctx) {
  return [
    {
      role: 'system',
      content:
        'Tu es le coach personnel de FocusFlow, une application de discipline (domaines → objectifs → tâches, XP, séries, sessions de concentration). ' +
        'Réponds en français avec le tutoiement, de façon concrète et encourageante. ' +
        "Règles strictes : 4 phrases maximum, pas de liste, pas d'emoji, pas de titre ; " +
        "base-toi uniquement sur le contexte JSON fourni (n'invente ni tâche, ni chiffre, ni élément hors de l'application) ; " +
        'si tout va bien, salue brièvement et propose une seule amélioration réaliste.',
    },
    { role: 'user', content: `Contexte (JSON) :\n${JSON.stringify(ctx)}\n\nDonne mon conseil pour aujourd'hui.` },
  ]
}
