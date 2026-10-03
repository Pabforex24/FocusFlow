// Service worker volontairement simple et prévisible :
//  - les fichiers de l'application (même origine, GET) sont servis depuis le cache, mis à jour en arrière-plan ;
//  - les pages de navigation utilisent le réseau d'abord, avec l'écran d'accueil en cache en secours ;
//  - Supabase (autre origine) n'est JAMAIS intercepté : les données viennent toujours du serveur.
const CACHE = 'focusflow-shell-v1'
const SHELL = ['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/')))
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((response) => {
        if (response.ok) caches.open(CACHE).then((cache) => cache.put(request, response.clone()))
        return response
      })
      return cached || network
    })
  )
})
