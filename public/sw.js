const STATIC_CACHE = 'merlin-static-retired-v17';
// V17 intentionally disables the old offline cache. Live intelligence must not be
// replaced by stale API or application responses from an earlier release.
self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.map(name => caches.delete(name)));
    await self.registration.unregister();
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/')) return;
  // Deliberately do not intercept static traffic; the server is authoritative.
});
