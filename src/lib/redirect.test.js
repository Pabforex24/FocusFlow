import { describe, expect, it } from 'vitest'
import { safeInternalPath } from './redirect.js'

describe('safeInternalPath', () => {
  it('accepte les chemins internes de l’application', () => {
    expect(safeInternalPath('/dashboard')).toBe('/dashboard')
    expect(safeInternalPath('/challenges/rejoindre/ABC234?x=1')).toBe('/challenges/rejoindre/ABC234?x=1')
    expect(safeInternalPath('/settings#apparence')).toBe('/settings#apparence')
    expect(safeInternalPath('/tasks//archive')).toBe('/tasks//archive')
  })

  it('refuse les URL absolues et protocol-relative', () => {
    expect(safeInternalPath('https://evil.example')).toBeNull()
    expect(safeInternalPath('javascript:alert(1)')).toBeNull()
    expect(safeInternalPath('//evil.example')).toBeNull()
    expect(safeInternalPath('///evil.example')).toBeNull()
  })

  it('refuse les antislashs et les séparateurs encodés', () => {
    expect(safeInternalPath('/\\evil.example')).toBeNull()
    expect(safeInternalPath('\\/evil.example')).toBeNull()
    expect(safeInternalPath('/%2F%2Fevil.example')).toBeNull()
    expect(safeInternalPath('/%5Cevil.example')).toBeNull()
  })

  it('refuse les caractères de contrôle et les valeurs non-chaînes', () => {
    expect(safeInternalPath('/dash\nboard')).toBeNull()
    expect(safeInternalPath('/dash\rboard')).toBeNull()
    expect(safeInternalPath('/dash\0board')).toBeNull()
    expect(safeInternalPath('')).toBeNull()
    expect(safeInternalPath(' /dashboard')).toBeNull()
    expect(safeInternalPath(null)).toBeNull()
    expect(safeInternalPath(undefined)).toBeNull()
    expect(safeInternalPath(42)).toBeNull()
  })
})
