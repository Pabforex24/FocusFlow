import { describe, expect, it } from 'vitest'
import { isPushSupported, needsIosInstallHint, urlBase64ToUint8Array } from './push.js'

describe('urlBase64ToUint8Array', () => {
  it('décode du base64 classique', () => {
    expect([...urlBase64ToUint8Array('AQAB')]).toEqual([1, 0, 1])
  })

  it('gère l\'alphabet base64url (- et _) et le remplissage manquant', () => {
    expect([...urlBase64ToUint8Array('AA__')]).toEqual([0, 15, 255])
    expect([...urlBase64ToUint8Array('AQ')]).toEqual([1])
  })
})

describe('détections navigateur', () => {
  it('ne prétend pas être supporté hors navigateur', () => {
    expect(isPushSupported()).toBe(false)
    expect(needsIosInstallHint()).toBe(false)
  })
})
