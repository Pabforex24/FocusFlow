import { describe, expect, it } from 'vitest'
import { decideReminder, localDateKey, localHour } from './notifications.js'

const PARIS = 'Europe/Paris'
const at = (iso) => new Date(iso) // UTC
// Hiver : Paris = UTC+1.
const dailyProfile = { remind_enabled: true, remind_hour: 20, timezone: PARIS }

describe('localHour / localDateKey', () => {
  it('applique le décalage du fuseau', () => {
    expect(localHour(at('2026-01-15T19:30:00Z'), PARIS)).toBe(20)
    expect(localHour(at('2026-01-15T19:30:00Z'), 'UTC')).toBe(19)
  })

  it('bascule de jour au bon moment (Paris vs UTC)', () => {
    expect(localDateKey(at('2026-01-15T23:30:00Z'), PARIS)).toBe('2026-01-16')
    expect(localDateKey(at('2026-01-15T23:30:00Z'), 'UTC')).toBe('2026-01-15')
  })

  it('retombe sur UTC si le fuseau est absent', () => {
    expect(localHour(at('2026-01-15T19:30:00Z'), null)).toBe(19)
    expect(localDateKey(at('2026-01-15T23:30:00Z'), undefined)).toBe('2026-01-15')
  })
})

describe('decideReminder', () => {
  it('ne fait rien si les rappels sont désactivés', () => {
    const profile = { ...dailyProfile, remind_enabled: false }
    expect(decideReminder({ profile, now: at('2026-01-15T19:30:00Z'), tasksToday: [{}] })).toBeNull()
  })

  it('envoie le rappel quotidien à l\'heure choisie', () => {
    const r = decideReminder({ profile: dailyProfile, now: at('2026-01-15T19:30:00Z'), tasksToday: [{ done: true }, { done: false }, {}] })
    expect(r.kind).toBe('daily')
    expect(r.url).toBe('/tasks')
    expect(r.body).toContain('2 tâches')
  })

  it('mentionne la série quand elle existe', () => {
    const r = decideReminder({ profile: dailyProfile, stats: { streak: 5 }, now: at('2026-01-15T19:30:00Z'), tasksToday: [{ done: false }] })
    expect(r.body).toContain('série de 5 jours')
  })

  it('ignore l\'heure non correspondante et la journée terminée', () => {
    expect(decideReminder({ profile: { ...dailyProfile, remind_hour: 21 }, now: at('2026-01-15T19:30:00Z'), tasksToday: [{}] })).toBeNull()
    expect(decideReminder({ profile: dailyProfile, now: at('2026-01-15T19:30:00Z'), tasksToday: [{ done: true }] })).toBeNull()
  })

  it('alerte sur la série en soirée quand rien n\'a été fait', () => {
    const r = decideReminder({
      profile: dailyProfile, stats: { streak: 3 },
      now: at('2026-01-15T21:00:00Z'), // 22h à Paris
      tasksToday: [{ done: false }, { done: false }],
    })
    expect(r.kind).toBe('streak')
    expect(r.body).toContain('Série de 3 jours')
  })

  it('n\'alerte pas si le jour est protégé, en partie fait, ou sans série', () => {
    const base = { profile: dailyProfile, stats: { streak: 4 }, now: at('2026-01-15T21:00:00Z'), tasksToday: [{ done: false }] }
    expect(decideReminder({ ...base, restToday: true })).toBeNull()
    expect(decideReminder({ ...base, tasksToday: [{ done: true }, { done: false }] })).toBeNull()
    expect(decideReminder({ ...base, stats: { streak: 1 } })).toBeNull()
    expect(decideReminder({ ...base, tasksToday: [] })).toBeNull()
  })

  it('donne la priorité à l\'alerte de série sur le rappel quotidien', () => {
    const r = decideReminder({
      profile: { ...dailyProfile, remind_hour: 22 }, stats: { streak: 5 },
      now: at('2026-01-15T21:00:00Z'), tasksToday: [{ done: false }],
    })
    expect(r.kind).toBe('streak')
  })
})
