/* BIOMOTOR Sport and Fitness — offline support for the installed app */
const VERSION = 'biomotor-v42-2026-11-27';
const SHELL = ['./', './index.html', './download.html', './css/styles.css', './js/app.js', './sk/config.sk', './manifest.webmanifest',
  './assets/bm-logo.png', './assets/bm-mark.png', './assets/bm-fav.png', './assets/icons/icon-192.png', './assets/icons/icon-512.png'];
const CDN = /^(https:\/\/(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com|storage\.googleapis\.com\/mediapipe-models))/;
const BIG = /\/assets\/mediapipe\//;   // body-tracking model files: cache first, they never change

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (/supabase\.(co|in)$/.test(url.hostname)) return;              // never cache login / data calls
  if (url.origin === location.origin && BIG.test(url.pathname)) {
    e.respondWith(caches.match(req).then(m => m || fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(VERSION).then(x => x.put(req, c)); } return r; })));
    return;
  }
  if (url.origin === location.origin) {
    // pages, code and settings: network first so updates arrive, cache when offline
    e.respondWith(fetch(req, { cache: 'no-cache' }).then(r => { if (r.ok) { const c = r.clone(); caches.open(VERSION).then(x => x.put(req, c)); } return r; })
      .catch(() => caches.match(req).then(m => m || (req.mode === 'navigate' ? caches.match('./index.html') : undefined))));
    return;
  }
  if (CDN.test(req.url)) {
    // libraries and fonts: cache first
    e.respondWith(caches.match(req).then(m => m || fetch(req).then(r => { const c = r.clone(); caches.open(VERSION).then(x => x.put(req, c)); return r; })));
  }
});
