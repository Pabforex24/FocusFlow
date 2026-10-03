import { describe, it, expect } from 'vitest'
import { addDays, diffDays, occurrenceDates, startOfWeekKey, toKey, fromKey } from './dates.js'
import { computeLevel, computeStats, computeBadges, xpForLevel } from './gamification.js'
import { buildChallengeTasks, challengeEndKey, challengeProgress } from './challenges.js'
import { monthSummary, goalProgress, lastDays } from './stats.js'

const task = (day, done, extra = {}) => ({ id: Math.random().toString(), scheduled_on: day, done, xp_value: 10, ...extra })

describe('dates', () => {
  it('toKey/fromKey font un aller-retour sans décalage', () => {
    expect(toKey(fromKey('2026-03-29'))).toBe('2026-03-29') // changement d'heure
  })
  it('addDays traverse les fins de mois et d\'année', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(diffDays('2026-09-01', '2026-09-30')).toBe(29)
  })
  it('semaine commençant le lundi', () => {
    expect(startOfWeekKey('2026-09-30')).toBe('2026-09-28') // mercredi → lundi
  })
  it('fréquences', () => {
    expect(occurrenceDates('2026-09-28', '2026-10-04', 'daily')).toHaveLength(7)
    expect(occurrenceDates('2026-09-28', '2026-10-04', 'workdays')).toHaveLength(5)
    expect(occurrenceDates('2026-09-28', '2026-10-04', 'weekend')).toEqual(['2026-10-03', '2026-10-04'])
  })
})

describe('niveaux et XP', () => {
  it('formule n*100+50', () => {
    expect(xpForLevel(1)).toBe(150)
    expect(computeLevel(0)).toMatchObject({ level: 1, xpIntoLevel: 0, xpForNext: 150 })
    expect(computeLevel(150).level).toBe(2)
    expect(computeLevel(399).level).toBe(2)
    expect(computeLevel(400).level).toBe(3)
  })
  it('XP : tâches + bonus journée parfaite + focus', () => {
    const tasks = [task('2026-09-30', true), task('2026-09-30', true)]
    const s = computeStats({ tasks, focusSessions: [{}], today: '2026-09-30' })
    expect(s.xp).toBe(20 + 50 + 30)
    expect(s.perfectDays).toBe(1)
  })
  it('pénalité pour jour manqué, doublée en hardcore, annulée par un jour de repos', () => {
    const tasks = [task('2026-09-28', false), task('2026-09-29', true), task('2026-09-29', true)]
    const base = { tasks, today: '2026-09-30' }
    expect(computeStats(base).missedDays).toBe(1)
    expect(computeStats({ ...base, restDays: ['2026-09-28'] }).missedDays).toBe(0)
    const normal = computeStats(base).xp
    const hard = computeStats({ ...base, hardcore: true }).xp
    expect(normal).toBe(Math.max(0, 20 + 50 - 15))
    expect(hard).toBe(Math.max(0, 20 + 50 - 30))
  })
  it('l\'XP ne descend jamais sous 0', () => {
    const s = computeStats({ tasks: [task('2026-09-01', false)], today: '2026-09-30' })
    expect(s.xp).toBe(0)
  })
})

describe('série (streak)', () => {
  it('compte les jours consécutifs, aujourd\'hui non fait ne casse pas la série', () => {
    const tasks = [task('2026-09-28', true), task('2026-09-29', true), task('2026-09-30', false)]
    expect(computeStats({ tasks, today: '2026-09-30' }).streak).toBe(2)
  })
  it('un trou casse la série', () => {
    const tasks = [task('2026-09-26', true), task('2026-09-29', true), task('2026-09-30', true)]
    const s = computeStats({ tasks, today: '2026-09-30' })
    expect(s.streak).toBe(2)
    expect(s.longestStreak).toBe(2)
  })
  it('un jour de repos protège la série sans l\'incrémenter', () => {
    const tasks = [task('2026-09-28', true), task('2026-09-30', true)]
    expect(computeStats({ tasks, restDays: ['2026-09-29'], today: '2026-09-30' }).streak).toBe(2)
  })
  it('aucune donnée : tout à zéro', () => {
    expect(computeStats({ tasks: [], today: '2026-09-30' })).toMatchObject({ xp: 0, level: 1, streak: 0 })
  })
})

describe('badges', () => {
  it('14 badges, débloqués selon les stats', () => {
    const none = computeBadges(computeStats({ tasks: [], today: '2026-09-30' }))
    expect(none).toHaveLength(14)
    expect(none.every((b) => !b.unlocked)).toBe(true)
    const one = computeBadges(computeStats({ tasks: [task('2026-09-30', true)], today: '2026-09-30' }))
    expect(one.find((b) => b.id === 'first_task').unlocked).toBe(true)
    expect(one.find((b) => b.id === 'perfect_day').unlocked).toBe(true)
  })
})

describe('challenges', () => {
  it('génère les tâches selon fréquence et période', () => {
    const end = challengeEndKey('2026-09-28', 7)
    expect(end).toBe('2026-10-04')
    const rows = buildChallengeTasks({
      blueprints: [{ title: 'A', frequency: 'daily' }, { title: 'B', frequency: 'workdays' }],
      startKey: '2026-09-28', endKey: end, domainId: 'd1',
    })
    expect(rows).toHaveLength(7 + 5)
    expect(rows.every((r) => r.domain_id === 'd1' && r.xp_value === 20)).toBe(true)
  })
  it('progression d\'un challenge', () => {
    const ac = { id: 'ac1' }
    const tasks = [task('2026-09-28', true, { challenge_active_id: 'ac1' }), task('2026-09-29', false, { challenge_active_id: 'ac1' }), task('2026-09-29', true)]
    expect(challengeProgress(ac, tasks)).toEqual({ done: 1, total: 2, pct: 50 })
  })
})

describe('stats', () => {
  it('résumé mensuel', () => {
    const tasks = [task('2026-09-10', true), task('2026-09-10', false), task('2026-09-11', true)]
    const m = monthSummary(tasks, 2026, 8)
    expect(m.cells).toHaveLength(30)
    expect(m.count).toBe(3)
    expect(m.rate).toBe(67)
    expect(m.activeDays).toBe(2)
    expect(m.best.key).toBe('2026-09-11')
  })
  it('7 derniers jours', () => {
    const d = lastDays([task('2026-09-30', true)], '2026-09-30')
    expect(d).toHaveLength(7)
    expect(d[6]).toMatchObject({ key: '2026-09-30', done: 1, rate: 1 })
  })
  it('progression d\'un objectif sans tâche', () => {
    expect(goalProgress({ id: 'g' }, [])).toEqual({ done: 0, total: 0, pct: 0 })
  })
})

import { rateBetween, domainBreakdown } from './stats.js'
import { resolveIcon, tint, ICONS } from './icons.js'

describe('helpers de statistiques et icônes', () => {
  it('rateBetween', () => {
    const tasks = [task('2026-09-10', true), task('2026-09-11', false), task('2026-09-20', true)]
    expect(rateBetween(tasks, '2026-09-10', '2026-09-12')).toBe(50)
    expect(rateBetween(tasks, '2026-08-01', '2026-08-02')).toBeNull()
  })
  it('domainBreakdown', () => {
    const d = domainBreakdown([{ id: 'a' }, { id: 'b' }], [task('2026-09-10', true, { domain_id: 'a' }), task('2026-09-10', false, { domain_id: 'a' })])
    expect(d[0]).toMatchObject({ done: 1, total: 2, pct: 50 })
    expect(d[1]).toMatchObject({ total: 0, pct: 0 })
  })
  it('resolveIcon gère clés, anciens emojis et valeurs inconnues', () => {
    expect(resolveIcon('dumbbell')).toBe(ICONS.dumbbell)
    expect(resolveIcon('🏋️')).toBe(ICONS.dumbbell)
    expect(resolveIcon('???')).toBe(ICONS.target)
    expect(tint('#7B61FF', 0.5)).toBe('#7B61FF80')
  })
  it('les 14 badges ont une icône connue', () => {
    const badges = computeBadges(computeStats({ tasks: [], today: '2026-09-30' }))
    expect(badges.every((b) => ICONS[b.icon])).toBe(true)
  })
})
