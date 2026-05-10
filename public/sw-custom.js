// ════════════════════════════════════════════════════════════════════════════
// FocusFlow — Service Worker v2
// Gère les push notifications ET les notifications locales schedulées
// ════════════════════════════════════════════════════════════════════════════

const ICON   = '/icons/icon-192.png'
const BADGE  = '/icons/icon-96.png'
const ORIGIN = self.location.origin

// ── Push notifications (depuis serveur futur) ────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title || 'FocusFlow', {
      body:    data.body  || '',
      icon:    data.icon  || ICON,
      badge:   BADGE,
      tag:     data.tag   || 'focusflow',
      data:    data.data  || {},
      vibrate: [200, 100, 200],
    })
  )
})

// ── Clic sur notification ────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/dashboard'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(ORIGIN) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})

// ── Messages depuis l'app (scheduleNotification, cancelNotification) ─────────
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {}

  if (type === 'SHOW_NOTIFICATION') {
    const { title, body, tag, url, delay = 0 } = payload
    setTimeout(() => {
      self.registration.showNotification(title, {
        body, icon: ICON, badge: BADGE, tag,
        data:    { url: url || '/tasks' },
        vibrate: [150, 80, 150],
      })
    }, delay)
  }

  if (type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// ── Activation immédiate ──────────────────────────────────────────────────────
self.addEventListener('install',  () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()))
