import { describe, expect, it } from 'vitest'
import { hasSubscriptionKeys, isBrave, isPushSupported, needsIosInstallHint, serializeSubscription, urlBase64ToUint8Array } from './push.js'

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

  it('ne détecte pas Brave hors Brave', () => {
    expect(isBrave()).toBe(false)
  })
})

describe('serializeSubscription', () => {
  it('utilise toJSON() quand il est disponible', () => {
    const sub = {
      endpoint: 'https://push.example/abc',
      toJSON: () => ({ endpoint: 'https://push.example/abc', keys: { p256dh: 'BPub', auth: 'Auth' } }),
    }
    expect(serializeSubscription(sub)).toEqual({ endpoint: 'https://push.example/abc', keys: { p256dh: 'BPub', auth: 'Auth' } })
    expect(hasSubscriptionKeys(sub)).toBe(true)
  })

  it('retombe sur getKey() (ArrayBuffer) si toJSON() manque', () => {
    const sub = {
      endpoint: 'https://push.example/def',
      getKey: (name) => (name === 'p256dh' ? Uint8Array.from([0, 15, 255]).buffer : Uint8Array.from([1, 0, 1]).buffer),
    }
    expect(serializeSubscription(sub)).toEqual({ endpoint: 'https://push.example/def', keys: { p256dh: 'AA__', auth: 'AQAB' } })
    expect(hasSubscriptionKeys(sub)).toBe(true)
  })

  it('ne considère pas un abonnement sans clés comme exploitable', () => {
    expect(serializeSubscription({ endpoint: 'https://push.example/ghi' })).toEqual({ endpoint: 'https://push.example/ghi', keys: { p256dh: null, auth: null } })
    expect(hasSubscriptionKeys({ endpoint: 'https://push.example/ghi' })).toBe(false)
  })

  it('est idempotent : un objet déjà sérialisé reste exploitable', () => {
    const serialized = { endpoint: 'https://push.example/abc', keys: { p256dh: 'BPub', auth: 'Auth' } }
    expect(serializeSubscription(serialized)).toEqual(serialized)
    expect(hasSubscriptionKeys(serialized)).toBe(true)
  })
})
