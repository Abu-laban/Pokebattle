const CACHE_NAME = 'pokebattle-v3';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// ── Install: cache core files ──
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: remove old caches ──
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first للـ assets، network-first للباقي ──
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // الصور من PokeAPI و sprites — cache مع network fallback
  if (url.hostname.includes('raw.githubusercontent.com') ||
      url.hostname.includes('pokeapi.co')) {
    e.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(e.request).then(cached => {
          if (cached) return cached;
          return fetch(e.request).then(response => {
            if (response.ok) cache.put(e.request, response.clone());
            return response;
          }).catch(() => cached);
        })
      )
    );
    return;
  }

  // الملفات المحلية — cache first
  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request).then(response => {
        if (response.ok) {
          caches.open(CACHE_NAME).then(c => c.put(e.request, response.clone()));
        }
        return response;
      })
    ).catch(() => caches.match('/index.html'))
  );
});
