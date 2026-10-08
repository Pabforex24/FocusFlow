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
