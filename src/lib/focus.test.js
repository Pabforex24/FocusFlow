import { describe, expect, it } from 'vitest'
import {
  MAX_FOCUS_MS,
  createFocusSession,
  durationFromParts,
  focusSessionMinutes,
  formatDurationLabel,
  formatFocusTime,
  normalizeFocusSession,
  pauseFocusSession,
  remainingFocusMs,
  resumeFocusSession,
  splitFocusTime,
} from './focus.js'

describe('durées Focus', () => {
  it('valide zéro et les dépassements', () => {
    expect(durationFromParts({}).ok).toBe(false)
    expect(durationFromParts({ hours: 24 }).error).toMatch(/heures/)
    expect(durationFromParts({ minutes: 60 }).error).toMatch(/minutes/)
    expect(durationFromParts({ hours: 23, minutes: 59, seconds: 59 })).toEqual({ ok: true, ms: MAX_FOCUS_MS, seconds: 86_399 })
  })

  it('refuse les décimales et les valeurs négatives', () => {
    expect(durationFromParts({ minutes: '1.5' }).ok).toBe(false)
    expect(durationFromParts({ seconds: -1 }).ok).toBe(false)
  })

  it('formate en minutes:secondes puis heures:minutes:secondes', () => {
    expect(formatFocusTime(25 * 60_000, 25 * 60_000)).toBe('25:00')
    expect(formatFocusTime(3_599_000, 3_599_000)).toBe('59:59')
    expect(formatFocusTime(3_600_000, 3_600_000)).toBe('01:00:00')
    expect(formatFocusTime(23 * 3_600_000 + 59 * 60_000 + 59_000, MAX_FOCUS_MS)).toBe('23:59:59')
  })

  it('affiche les heures selon la durée totale, pas le temps restant', () => {
    expect(splitFocusTime(59_000, 2 * 3_600_000).showHours).toBe(true)
    expect(formatFocusTime(59_000, 2 * 3_600_000)).toBe('00:00:59')
  })

  it('arrondit la durée du libellé et des minutes enregistrées', () => {
    expect(formatDurationLabel(1_500_000)).toBe('25 min')
    expect(formatDurationLabel(5_400_000)).toBe('1 h 30 min')
    expect(formatDurationLabel(20_000)).toBe('20 s')
    expect(focusSessionMinutes(1)).toBe(1)
    expect(focusSessionMinutes(20_000)).toBe(1)
    expect(focusSessionMinutes(MAX_FOCUS_MS)).toBe(1440)
  })
})

describe('sessions Focus', () => {
  it('pause et reprend sans perdre de temps', () => {
    const start = 1_000_000
    const created = createFocusSession(25 * 60_000, { id: 't1', title: 'Lire' }, start)
    const paused = pauseFocusSession(created, start + 5 * 60_000)
    expect(paused.paused).toBe(true)
    expect(paused.endsAt).toBeNull()
    expect(remainingFocusMs(paused, start + 60 * 60_000)).toBe(20 * 60_000)

    const resumed = resumeFocusSession(paused, start + 60 * 60_000)
    expect(resumed.paused).toBe(false)
    expect(resumed.endsAt).toBe(start + 80 * 60_000)
    expect(remainingFocusMs(resumed, start + 65 * 60_000)).toBe(15 * 60_000)
  })

  it('restaure une ancienne session sans totalMs', () => {
    const old = normalizeFocusSession({ endsAt: 2_000_000, minutes: 25, taskId: 't1', taskTitle: 'Lire' }, 1_000_000)
    expect(old.totalMs).toBe(25 * 60_000)
    expect(old.paused).toBe(false)
    expect(old.minutes).toBe(25)
  })

  it('restaure une session en pause', () => {
    const saved = normalizeFocusSession({ totalMs: 60_000, remainingMs: 30_000, paused: true, minutes: 1 }, 5_000)
    expect(saved.paused).toBe(true)
    expect(saved.endsAt).toBeNull()
    expect(saved.remainingMs).toBe(30_000)
  })
})
