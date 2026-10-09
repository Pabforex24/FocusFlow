// Utilitaires navigateur pour les notifications push. La conversion de clé est pure
// (testée) ; les détections dépendent du navigateur et sont sans risque hors navigateur.

export const DEFAULT_REMIND_HOUR = 20 // heure proposée par défaut tant qu'aucun choix n'a été fait

// Convertit une clé publique VAPID (base64url) au format Uint8Array attendu par l'API Push.
export function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(normalized)
  const bytes = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i)
  return bytes
}

// ArrayBuffer -> base64url sans remplissage (format des clés p256dh/auth attendues par web-push).
function bufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// Extrait { endpoint, keys: { p256dh, auth } } d'un PushSubscription.
// `toJSON()` (standard) fournit les clés en base64url ; repli sur getKey() pour les navigateurs
// qui n'exposent pas `toJSON`. On n'utilise PAS `sub.keys`, qui n'est pas standard et souvent absent.
// Idempotent : un objet déjà sérialisé ({ endpoint, keys }) est renvoyé tel quel.
export function serializeSubscription(subscription) {
  if (subscription?.keys && typeof subscription.getKey !== 'function' && typeof subscription.toJSON !== 'function') {
    return {
      endpoint: subscription.endpoint,
      keys: { p256dh: subscription.keys.p256dh || null, auth: subscription.keys.auth || null },
    }
  }
  const json = typeof subscription?.toJSON === 'function' ? subscription.toJSON() : null
  let { p256dh, auth } = json?.keys ?? {}
  if ((!p256dh || !auth) && typeof subscription?.getKey === 'function') {
    const rawP256dh = subscription.getKey('p256dh')
    const rawAuth = subscription.getKey('auth')
    if (!p256dh && rawP256dh) p256dh = bufferToBase64Url(rawP256dh)
    if (!auth && rawAuth) auth = bufferToBase64Url(rawAuth)
  }
  return {
    endpoint: subscription?.endpoint,
    keys: { p256dh: p256dh || null, auth: auth || null },
  }
}

// Un abonnement est exploitable par le serveur uniquement si les deux clés sont présentes.
// Accepte indifféremment un PushSubscription ou un objet déjà sérialisé ({ endpoint, keys }).
export function hasSubscriptionKeys(subscription) {
  const { keys } = serializeSubscription(subscription)
  return Boolean(keys.p256dh && keys.auth)
}

export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  )
}

// Sur iPhone/iPad, les notifications n'existent que si l'app est installée sur l'écran d'accueil.
export function needsIosInstallHint() {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const standalone = window.matchMedia?.('(display-mode: standalone)')?.matches || navigator.standalone === true
  return isIos && !standalone
}

// Brave désactive par défaut le service push de Google : le Push API échoue
// (« push service error ») tant que l'utilisateur n'active pas l'option dans brave://settings/privacy.
export function isBrave() {
  return typeof navigator !== 'undefined' && Boolean(navigator.brave)
}
