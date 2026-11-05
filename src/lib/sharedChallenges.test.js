import { describe, expect, it } from 'vitest'
import { sharedChallengeCanJoin, sharedChallengeLink, sharedChallengeStatus, sharedChallengeTotals } from './sharedChallenges.js'

const group = (extra = {}) => ({ status: 'open', start_date: '2026-10-10', end_date: '2026-10-20', ...extra })

describe('sharedChallenges', () => {
  it('calcule le statut du groupe selon la date locale', () => {
    expect(sharedChallengeStatus(group(), '2026-10-09')).toBe('upcoming')
    expect(sharedChallengeStatus(group(), '2026-10-10')).toBe('active')
    expect(sharedChallengeStatus(group(), '2026-10-20')).toBe('active')
    expect(sharedChallengeStatus(group(), '2026-10-21')).toBe('finished')
    expect(sharedChallengeStatus(group({ status: 'archived' }), '2026-10-15')).toBe('archived')
  })

  it('autorise l’adhésion jusqu’au jour du début inclus', () => {
    expect(sharedChallengeCanJoin(group(), '2026-10-09')).toBe(true)
    expect(sharedChallengeCanJoin(group(), '2026-10-10')).toBe(true)
    expect(sharedChallengeCanJoin(group(), '2026-10-11')).toBe(false)
    expect(sharedChallengeCanJoin(group({ status: 'archived' }), '2026-10-01')).toBe(false)
  })

  it('agrège les progressions sans exposer les tâches', () => {
    expect(sharedChallengeTotals([])).toEqual({ done: 0, total: 0, pct: 0 })
    expect(sharedChallengeTotals([
      { done: 3, total: 4 },
      { done: '7', total: '10' },
    ])).toEqual({ done: 10, total: 14, pct: 71 })
  })

  it('construit un lien d’invitation avec un code encodé', () => {
    expect(sharedChallengeLink('ABC 123', 'https://focusflow.app')).toBe('https://focusflow.app/challenges/rejoindre/ABC%20123')
  })
})
