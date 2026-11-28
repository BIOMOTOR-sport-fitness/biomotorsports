/* BIOMOTOR Sport and Fitness — offline support for the installed app */
const VERSION = 'biomotor-v75-2026-11-28';
const SHELL = ['./', './index.html', './download.html', './css/styles.css', './js/app.js', './sk/config.sk', './manifest.webmanifest',
  './assets/bm-logo.png', './assets/bm-mark.png', './assets/bm-fav.png', './assets/icons/icon-192.png', './assets/icons/icon-512.png', './assets/vendor/pdf-lib.min.js', './vbt/index.html'];
const CDN = /^(https:\/\/(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com|storage\.googleapis\.com\/mediapipe-models))/;
const BIG = /\/assets\/mediapipe\//;   // body-tracking model files: cache first, they never change

self.addEventListener('install', e => {
  // fresh copies of this version's files (bypass the browser HTTP cache)
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(SHELL.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => null)))).then(() => self.skipWaiting()));
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
    if (/\/sw\.js$/.test(url.pathname) || req.cache === 'no-store') return;   // update checks always go to the network
    // pages, code and the VBT tracker: open at once from this version's cache, refresh the cache in the background
    // (every release changes VERSION, so a new version installs fresh copies of all files and the app reloads itself)
    e.respondWith(caches.open(VERSION).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req, { cache: 'no-cache' }).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => null);
      if (hit) { e.waitUntil(net); return hit; }
      const r = await net;
      return r || (req.mode === 'navigate' ? (await c.match('./index.html')) || Response.error() : Response.error());
    }));
    return;
  }
  if (CDN.test(req.url)) {
    // libraries and fonts: cache first
    e.respondWith(caches.match(req).then(m => m || fetch(req).then(r => { const c = r.clone(); caches.open(VERSION).then(x => x.put(req, c)); return r; })));
  }
});
