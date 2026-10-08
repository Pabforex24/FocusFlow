import { describe, expect, it } from 'vitest'
import { MAX_CONTEXT_CHARS, buildCoachContext, coachMessages } from './coachContext.js'

const task = (id, extra = {}) => ({
  id, title: `Tâche ${id}`, scheduled_on: '2026-10-08', done: false, xp_value: 10,
  domain_id: null, goal_id: null, challenge_active_id: null, priority: 'medium', ...extra,
})

const base = {
  today: '2026-10-08',
  profile: { hardcore_mode: true, display_name: 'Zoé', email: 'zoe@exemple.fr' },
  stats: { level: 3, xp: 850, streak: 5, longestStreak: 12, totalDone: 47, missedDays: 2 },
  restDays: ['2026-10-05'],
  focusSessions: [{ id: 'f1' }, { id: 'f2' }],
  goals: [
    { id: 'g1', title: 'Lancer le podcast', deadline: '2026-10-01' },
    { id: 'g2', title: 'Sans échéance', deadline: null },
  ],
  domains: [{ id: 'd1', name: 'Sport' }, { id: 'd2', name: 'Vide' }],
  activeChallenges: [
    { id: 'ac1', title: 'Défi Forme 21J', start_date: '2026-10-01', end_date: '2026-10-21' },
    { id: 'ac2', title: 'Terminé', start_date: '2026-09-01', end_date: '2026-09-21' },
  ],
  tasks: [
    task('t1', { done: true, domain_id: 'd1' }),
    task('t2', { domain_id: 'd1', priority: 'high' }),
    task('t3', { challenge_active_id: 'ac1', done: true }),
    task('t4', { scheduled_on: '2026-10-07' }),
  ],
}

describe('buildCoachContext', () => {
  it('résume la journée, la semaine et la série', () => {
    const ctx = buildCoachContext(base)
    expect(ctx.date).toBe('2026-10-08')
    expect(ctx.hardcore).toBe(true)
    expect(ctx.streak).toBe(5)
    expect(ctx.today).toEqual({ total: 3, done: 2, remaining: expect.any(Array) })
    expect(ctx.week.total).toBe(4)
    expect(ctx.week.done).toBe(2)
    expect(ctx.focusSessions).toBe(2)
    expect(ctx.restDaysUsed).toBe(1)
  })

  it('ne garde que les objectifs réellement en retard', () => {
    const ctx = buildCoachContext(base)
    expect(ctx.lateGoals).toEqual([{ title: 'Lancer le podcast', deadline: '2026-10-01', pct: 0 }])
  })

  it('ignore les challenges terminés et calcule leur progression', () => {
    const ctx = buildCoachContext(base)
    expect(ctx.activeChallenges).toEqual([
      { title: 'Défi Forme 21J', end: '2026-10-21', done: 1, total: 1, pct: 100 },
    ])
  })

  it('ne liste que les domaines qui ont des tâches', () => {
    const ctx = buildCoachContext(base)
    expect(ctx.domains).toEqual([{ name: 'Sport', done: 1, total: 2 }])
  })

  it('borne la liste des tâches restantes à 10', () => {
    const tasks = Array.from({ length: 40 }, (_, i) => task(`x${i}`))
    const ctx = buildCoachContext({ ...base, tasks })
    expect(ctx.today.total).toBe(40)
    expect(ctx.today.remaining).toHaveLength(10)
  })

  it('reste sous MAX_CONTEXT_CHARS même avec des données extrêmes', () => {
    const tasks = Array.from({ length: 500 }, (_, i) => task(`big${i}`, { title: 'T'.repeat(200) }))
    const goals = Array.from({ length: 50 }, (_, i) => ({ id: `g${i}`, title: 'G'.repeat(200), deadline: '2020-01-01' }))
    const ctx = buildCoachContext({ ...base, tasks, goals })
    expect(JSON.stringify(ctx).length).toBeLessThanOrEqual(MAX_CONTEXT_CHARS)
  })

  it("ne contient aucune donnée personnelle (pas d'email)", () => {
    const ctx = buildCoachContext({ ...base, user: { email: 'zoe@exemple.fr' } })
    expect(JSON.stringify(ctx)).not.toContain('zoe@exemple.fr')
  })
})

describe('coachMessages', () => {
  it(' produit un system prompt fixe puis le contexte en utilisateur', () => {
    const ctx = buildCoachContext(base)
    const messages = coachMessages(ctx)
    expect(messages).toHaveLength(2)
    expect(messages[0].role).toBe('system')
    expect(messages[0].content).toContain('français')
    expect(messages[1].role).toBe('user')
    expect(messages[1].content).toContain('"streak":5')
  })
})
