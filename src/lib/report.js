// Suivi des erreurs en production, sans service tiers obligatoire.
// Si VITE_ERROR_ENDPOINT est défini (une adresse https qui accepte du JSON en POST : fonction serveur, Sentry "envelope"
// via un relais, etc.), chaque erreur y est envoyée. Sinon, elle reste dans la console.
// N'envoie jamais de données personnelles : message, pile d'appels, page, version, navigateur.
const ENDPOINT = import.meta.env.VITE_ERROR_ENDPOINT
const RELEASE = import.meta.env.VITE_APP_VERSION || 'dev'
const seen = new Set()

export function reportError(error, context = {}) {
  console.error('[erreur]', context.where ?? '', error)
  if (!ENDPOINT || !import.meta.env.PROD) return
  const message = String(error?.message ?? error)
  const key = `${context.where ?? ''}|${message}`
  if (seen.has(key) || seen.size > 50) return // évite d'inonder le serveur avec la même erreur
  seen.add(key)
  const payload = JSON.stringify({
    message, stack: String(error?.stack ?? '').slice(0, 4000), where: context.where ?? null,
    page: window.location.pathname, release: RELEASE, userAgent: navigator.userAgent, at: new Date().toISOString(),
  })
  try {
    if (!(navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, new Blob([payload], { type: 'text/plain' })))) {
      fetch(ENDPOINT, { method: 'POST', body: payload, keepalive: true, headers: { 'Content-Type': 'text/plain' } }).catch(() => {})
    }
  } catch { /* le suivi ne doit jamais casser l'application */ }
}

// Erreurs non rattrapées (hors rendu React) : à appeler une fois au démarrage.
export function installGlobalErrorReporting() {
  window.addEventListener('error', (event) => reportError(event.error ?? event.message, { where: 'window.error' }))
  window.addEventListener('unhandledrejection', (event) => reportError(event.reason, { where: 'unhandledrejection' }))
}
