import { describe, expect, it } from 'vitest'
import { formatDurationMinutes, parseDurationMinutes, taskMinutes } from './duration.js'

describe('durées des tâches', () => {
  it('convertit les formats hérités', () => {
    expect(parseDurationMinutes('30')).toBe(30)
    expect(parseDurationMinutes('30min')).toBe(30)
    expect(parseDurationMinutes('1h')).toBe(60)
    expect(parseDurationMinutes('1h30')).toBe(90)
    expect(parseDurationMinutes('1 h 30 min')).toBe(90)
    expect(parseDurationMinutes('1:30')).toBe(90)
    expect(parseDurationMinutes(' 45 minutes ')).toBe(45)
  })

  it('refuse les valeurs hors limites ou illisibles', () => {
    expect(parseDurationMinutes('')).toBeNull()
    expect(parseDurationMinutes('abc')).toBeNull()
    expect(parseDurationMinutes('0')).toBeNull()
    expect(parseDurationMinutes('2000')).toBeNull()
  })

  it('formate et déduit la durée d’une tâche', () => {
    expect(formatDurationMinutes(30)).toBe('30 min')
    expect(formatDurationMinutes(60)).toBe('1 h')
    expect(formatDurationMinutes(90)).toBe('1 h 30')
    expect(taskMinutes({ duration_minutes: 25 })).toBe(25)
    expect(taskMinutes({ duration: '1h15' })).toBe(75)
  })
})
