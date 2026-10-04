// Service worker volontairement simple et prévisible :
//  - /assets/* (fichiers à nom unique, jamais modifiés) : servis depuis le cache, ajoutés au fur et à mesure ;
//    le cache est plafonné et les plus anciens fichiers sont supprimés (il ne grossit plus indéfiniment) ;
//  - autres fichiers de l'application (même origine, GET) : cache + mise à jour en arrière-plan ;
//  - pages de navigation : réseau d'abord, écran d'accueil en cache en secours ;
//  - Supabase (autre origine) n'est JAMAIS intercepté : les données viennent toujours du serveur.
// Mise à jour : la nouvelle version attend (état "waiting") jusqu'à ce que l'utilisateur clique sur
// « Actualiser » dans le bandeau (voir src/lib/pwa.js). Augmentez VERSION pour vider les anciens caches.
const VERSION = 'v2'
const SHELL_CACHE = `focusflow-shell-${VERSION}`
const ASSET_CACHE = `focusflow-assets-${VERSION}`
const MAX_ASSETS = 60
const SHELL = ['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL)))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL_CACHE && k !== ASSET_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

async function trimAssets() {
  const cache = await caches.open(ASSET_CACHE)
  const keys = await cache.keys() // ordre d'insertion : les plus anciens d'abord
  await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_ASSETS)).map((key) => cache.delete(key)))
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/')))
    return
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone()
          caches.open(ASSET_CACHE).then((cache) => cache.put(request, copy)).then(trimAssets)
        }
        return response
      }))
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone()
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy))
        }
        return response
      })
      return cached || network
    })
  )
})
