const CACHE_NAME = 'babycare-pwa-v1'

// Minimal app-shell list (works for both dev/prod; in dev it's mostly bypassed)
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/images/BabyCareLogo.png',
]

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => undefined),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      await self.clients.claim()
    })(),
  )
})

function isCacheableRequest(request) {
  if (request.method !== 'GET') return false
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return false
  // Avoid caching API calls, Supabase, etc.
  return true
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (!isCacheableRequest(request)) return

  // Cache-first for static assets, network-first for HTML navigation.
  const accept = request.headers.get('accept') || ''
  const isHTML = request.mode === 'navigate' || accept.includes('text/html')

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME)

      if (isHTML) {
        try {
          const fresh = await fetch(request)
          cache.put(request, fresh.clone())
          return fresh
        } catch {
          const cached = await cache.match(request)
          return cached || cache.match('/index.html') || Response.error()
        }
      }

      const cached = await cache.match(request)
      if (cached) return cached

      try {
        const fresh = await fetch(request)
        // Cache JS/CSS/images/fonts for offline-ish usage
        const dest = request.destination
        if (['script', 'style', 'image', 'font'].includes(dest)) {
          cache.put(request, fresh.clone())
        }
        return fresh
      } catch {
        return Response.error()
      }
    })(),
  )
})

