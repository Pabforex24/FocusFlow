import { describe, expect, it } from 'vitest'
import { buildNavAlerts, unreadAlertCount } from './navAlerts.js'

const today = '2026-11-02'
const task = (id, done, scheduledOn = today) => ({ id, done, scheduled_on: scheduledOn })

describe('buildNavAlerts', () => {
  it('signale les tâches restantes et la série en cours', () => {
    const alerts = buildNavAlerts({
      tasks: [task('a', false), task('b', false), task('c', true)],
      today,
      stats: { streak: 4, level: 2, xp: 120, xpIntoLevel: 20, xpForNext: 250 },
    })

    expect(alerts.map((alert) => alert.id)).toEqual([`tasks-${today}`, `streak-${today}`])
    expect(alerts[0].title).toBe('2 tâches restent aujourd’hui')
    expect(alerts[1].title).toBe('Série de 4 jours')
  })

  it('ignore les tâches terminées et les autres jours', () => {
    const alerts = buildNavAlerts({
      tasks: [task('a', true), task('b', false, '2026-11-01')],
      today,
      stats: { streak: 0, level: 1, xp: 0, xpIntoLevel: 0, xpForNext: 150 },
    })

    expect(alerts).toEqual([])
  })

  it('annonce un niveau proche uniquement sous 50 XP', () => {
    const near = buildNavAlerts({
      tasks: [],
      today,
      stats: { streak: 0, level: 3, xp: 500, xpIntoLevel: 300, xpForNext: 350 },
    })
    const far = buildNavAlerts({
      tasks: [],
      today,
      stats: { streak: 0, level: 3, xp: 500, xpIntoLevel: 100, xpForNext: 350 },
    })

    expect(near.map((alert) => alert.kind)).toEqual(['level'])
    expect(far).toEqual([])
  })

  it('compte uniquement les alertes non lues', () => {
    const alerts = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    expect(unreadAlertCount(alerts, ['a', 'c'])).toBe(1)
    expect(unreadAlertCount(alerts)).toBe(3)
  })
})
