// Service Worker custom — FocusFlow
// Écoute les push notifications depuis le serveur (optionnel — pour usage futur)
// next-pwa génère sw.js automatiquement au build, ce fichier est un complément.

self.addEventListener('push', (event) => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title || 'FocusFlow', {
      body:  data.body  || '',
      icon:  data.icon  || '/icons/icon-192.png',
      badge: '/icons/icon-96.png',
      tag:   data.tag   || 'focusflow',
      data:  data.data  || {},
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/dashboard'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})
