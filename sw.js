/* Service worker – BP Screening (Scudder). Makes the app work offline and installable.
 * - App files are precached in a versioned cache and served cache-first.
 * - Google Apps Script (sync / villages) and any other cross-origin request is NEVER cached:
 *   it goes straight to the network; the app's own offline queue handles failures.
 * - A new version waits until the user taps "New version available – tap to update".
 */
var VERSION = '1.3.0';
var CACHE = 'htn-shell-' + VERSION;
var SHELL = [
  './',
  './index.html',
  './app.js?v=1.3',
  './styles.css?v=1.3',
  './manifest.json',
  './favicon.ico',
  './icons/favicon.svg',
  './icons/favicon-32.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) {
    // cache: 'reload' bypasses the browser's HTTP cache so we store the fresh files of this version
    return cache.addAll(SHELL.map(function (u) { return new Request(u, { cache: 'reload' }); }));
  }));
});

self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('htn-shell-') === 0 && k !== CACHE; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data && event.data.type === 'GET_VERSION' && event.ports[0]) event.ports[0].postMessage(VERSION);
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;                       // POSTs (sync) -> network
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;        // Apps Script etc. -> network only, never cached
  if (req.mode === 'navigate') {
    // App shell: any page load in scope (incl. ?sync=… setup links) gets the cached index.html
    event.respondWith(caches.open(CACHE).then(function (cache) {
      return cache.match('./index.html').then(function (hit) {
        return hit || fetch(req);
      });
    }).catch(function () { return fetch(req); }));
    return;
  }
  event.respondWith(caches.open(CACHE).then(function (cache) {
    return cache.match(req).then(function (hit) { return hit || fetch(req); });
  }));
});
