/* Keeps the app's screens on the phone so it opens instantly, even offline. Ward data is never stored here. */
const V = 'wh-2.9.2';
const SHELL = ['./', 'index.html', 'app.css?v=2.9.2', 'config.js?v=2.9.2', 'demo.js?v=2.9.2', 'qrcode.js?v=2.9.2', 'progview.js?v=2.9.2', 'm_10_program.js?v=2.9.2', 'm_20_messages.js?v=2.9.2', 'm_30_calendar.js?v=2.9.2', 'm_40_people.js?v=2.9.2', 'm_50_leaders.js?v=2.9.2', 'm_60_admin.js?v=2.9.2', 'm_70_extras.js?v=2.9.2', 'm_75_turns.js?v=2.9.2', 'm_80_lists.js?v=2.9.2', 'm_85_more.js?v=2.9.2', 'm_87_connect.js?v=2.9.2', 'm_90_help.js?v=2.9.2', 'app.js?v=2.9.2', 'manifest.webmanifest', 'icons/icon-192.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (e.request.mode === 'navigate' || u.pathname.endsWith('.html') || u.pathname.endsWith('/')) {
    e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request).then(h => h || caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); } return r; })));
});
