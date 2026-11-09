/* Keeps the app's screens on the phone so it opens instantly, even offline. Ward data is never stored here. */
const V = 'wh-2.12.0';
const SHELL = ['./', 'index.html', 'app.css?v=2.12.0', 'config.js?v=2.12.0', 'demo.js?v=2.12.0', 'qrcode.js?v=2.12.0', 'progview.js?v=2.12.0', 'm_10_program.js?v=2.12.0', 'm_20_messages.js?v=2.12.0', 'm_30_calendar.js?v=2.12.0', 'm_40_people.js?v=2.12.0', 'm_50_leaders.js?v=2.12.0', 'm_60_admin.js?v=2.12.0', 'm_70_extras.js?v=2.12.0', 'm_75_turns.js?v=2.12.0', 'm_80_lists.js?v=2.12.0', 'm_85_more.js?v=2.12.0', 'm_86_plan.js?v=2.12.0', 'm_87_connect.js?v=2.12.0', 'm_88_week.js?v=2.12.0', 'm_89_emergency.js?v=2.12.0', 'm_90_help.js?v=2.12.0', 'm_91_community.js?v=2.12.0', 'm_92_extras2.js?v=2.12.0', 'm_93_record.js?v=2.12.0', 'm_99_layout.js?v=2.12.0', 'app.js?v=2.12.0', 'manifest.webmanifest', 'icons/icon-192.png'];
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
