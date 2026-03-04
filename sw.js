// PokéBattle Service Worker v3.0
const CACHE = 'pokebattle-v3';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Exo+2:wght@400;700;900&display=swap',
];

// تثبيت: تخزين الملفات
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      // تخزين الملفات الأساسية فقط (بدون external)
      return cache.addAll(['/', '/index.html', '/manifest.json'])
        .catch(() => cache.addAll(['/index.html']));
    })
  );
  self.skipWaiting();
});

// تفعيل: حذف الكاش القديم
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// جلب: network first ثم cache
self.addEventListener('fetch', e => {
  // تجاهل طلبات non-GET
  if (e.request.method !== 'GET') return;
  
  // تجاهل الـ API requests (PokeAPI sprites)
  const url = new URL(e.request.url);
  if (url.hostname === 'raw.githubusercontent.com' || 
      url.hostname === 'fonts.googleapis.com' ||
      url.hostname === 'fonts.gstatic.com') {
    // Stale-while-revalidate للموارد الخارجية
    e.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(e.request).then(cached => {
          const fresh = fetch(e.request).then(res => {
            if(res.ok) cache.put(e.request, res.clone());
            return res;
          }).catch(() => cached);
          return cached || fresh;
        })
      )
    );
    return;
  }
  
  // Network first للملفات المحلية
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then(c => c || caches.match('/index.html')))
  );
});
