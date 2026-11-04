import { describe, expect, it } from 'vitest'
import { buildCoachAnalysis, COACH_ACTIONS, COACH_PROMPTS, localCoachReply } from './coachAnalysis.js'

const task = (id, day, extra = {}) => ({
  id, title: `Tâche ${id}`, scheduled_on: day, done: false, xp_value: 10,
  domain_id: null, goal_id: null, priority: 'medium', created_at: `${day}T08:00:00.000Z`, ...extra,
})

const base = {
  today: '2026-11-03',
  stats: { streak: 5, longestStreak: 12, missedDays: 0 },
  restDays: [],
  domains: [{ id: 'd1', name: 'Sport', color: '#4fb286' }, { id: 'd2', name: 'Travail', color: '#4ea8de' }],
  goals: [
    { id: 'g1', title: 'Objectif principal', deadline: null },
    { id: 'g2', title: 'Objectif en retard', deadline: '2026-10-25' },
  ],
  activeChallenges: [{ id: 'a1', title: 'Défi 7J', start_date: '2026-11-01', end_date: '2026-11-07' }],
  tasks: [
    task('t1', '2026-11-03', { done: true, domain_id: 'd1', goal_id: 'g1' }),
    task('t2', '2026-11-03', { priority: 'high', domain_id: 'd1' }),
    task('t3', '2026-11-02', { done: true, domain_id: 'd1' }),
    task('t4', '2026-10-30', { domain_id: 'd1', goal_id: 'g2' }),
    task('t5', '2026-10-24', { done: true, domain_id: 'd2' }),
    task('t6', '2026-10-23', { done: true, domain_id: 'd2' }),
  ],
}

describe('buildCoachAnalysis', () => {
  it('produit une analyse automatique et une priorité concrète', () => {
    const analysis = buildCoachAnalysis(base)
    expect(analysis.headline).toBeTruthy()
    expect(analysis.metrics).toHaveLength(4)
    expect(analysis.metrics.find((m) => m.label === 'Priorité').value).toContain('Tâche t2')
    expect(analysis.focus.text).toContain('Tâche t2')
    expect(analysis.plan).toHaveLength(3)
    expect(analysis.plan[1].title).toBe('Découper l’objectif en retard')
  })

  it('calcule le taux de la semaine et la tendance', () => {
    const analysis = buildCoachAnalysis(base)
    const metric = analysis.metrics.find((m) => m.label === 'Taux 7 jours')
    expect(metric.value).toBe('50 %')
    expect(metric.hint).toContain('-50 pts')
    expect(analysis.momentum.weekRate).toBe(50)
    expect(analysis.momentum.trend).toBe(-50)
  })

  it('repère le domaine faible et le risque', () => {
    const analysis = buildCoachAnalysis(base)
    expect(analysis.balance.weakDomain.name).toBe('Sport')
    expect(analysis.metrics.find((m) => m.label === 'Risque').value).toBe('1 en retard')
  })

  it('reste utile sans aucune tâche', () => {
    const analysis = buildCoachAnalysis({ today: '2026-11-03' })
    expect(analysis.headline).toBe('Commence par un pas minuscule')
    expect(analysis.focus.to).toBe('/tasks?new=1')
    expect(analysis.metrics.find((m) => m.label === 'Taux 7 jours').value).toBe('—')
  })

  it('propose des prompts et des actions d’organisation', () => {
    expect(COACH_PROMPTS.length).toBeGreaterThanOrEqual(4)
    expect(COACH_ACTIONS.map((action) => action.to)).toContain('/challenges')
  })
})

describe('localCoachReply', () => {
  const analysis = buildCoachAnalysis(base)

  it('répond à une demande de planification avec la priorité réelle', () => {
    const reply = localCoachReply('Planifie ma journée', base, analysis)
    expect(reply).toContain('Tâche t2')
    expect(reply).toContain('tâches terminées')
  })

  it('répond aux défis, domaines, objectifs et motivation', () => {
    expect(localCoachReply('Quel défi choisir ?', base, analysis)).toContain('Défi 7J')
    expect(localCoachReply('Aide-moi à équilibrer mes domaines', base, analysis)).toContain('Sport')
    expect(localCoachReply('Aide-moi avec mon objectif', base, analysis)).toContain('Objectif en retard')
    expect(localCoachReply('Je manque de motivation', base, analysis)).toContain('deux minutes')
    expect(localCoachReply('Je suis en surcharge', base, analysis)).toContain('trois priorités')
  })
})
