// Enregistrement du service worker + détection d'une nouvelle version.
// `onUpdate(apply)` est appelé quand une nouvelle version est prête : `apply()` l'active puis recharge la page.
export function registerServiceWorker(onUpdate) {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return

  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return
    reloading = true
    window.location.reload()
  })

  const announce = (worker) => onUpdate(() => worker.postMessage({ type: 'SKIP_WAITING' }))

  const start = () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      // Une version est déjà en attente (page rouverte avant d'avoir cliqué).
      if (registration.waiting && navigator.serviceWorker.controller) announce(registration.waiting)
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing
        worker?.addEventListener('statechange', () => {
          // "installed" avec un contrôleur existant = mise à jour (et non première installation).
          if (worker.state === 'installed' && navigator.serviceWorker.controller) announce(worker)
        })
      })
      // Vérifie s'il existe une nouvelle version au retour sur l'application.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') registration.update().catch(() => {})
      })
    }).catch((error) => console.error('[pwa] service worker non enregistré', error))
  }
  // Selon le moment où React s'affiche, l'événement « load » a peut-être déjà eu lieu.
  if (document.readyState === 'complete') start()
  else window.addEventListener('load', start)
}
