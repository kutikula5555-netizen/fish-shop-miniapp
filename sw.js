const CACHE_NAME = 'chernaya-treska-admin-v1';
const APP_SHELL = [
  './admin.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key.startsWith('chernaya-treska-admin-') && key !== CACHE_NAME)
            .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // Do not cache Supabase API calls, authentication, or third-party scripts.
  if (url.origin !== self.location.origin || request.method !== 'GET') return;

  // Only the admin page gets the offline app-shell fallback.
  if (request.mode === 'navigate' && url.pathname.endsWith('/admin.html')) {
    event.respondWith(
      fetch(request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put('./admin.html', copy));
        return response;
      }).catch(() => caches.match('./admin.html'))
    );
    return;
  }

  // App icons and manifest can be served from cache.
  if (url.pathname.includes('/icons/') || url.pathname.endsWith('/manifest.webmanifest')) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request))
    );
  }
});
