/* Ward Hub v2 app. Plain JavaScript, no build step, so any ward can copy it. */
(function () {
  'use strict';
  const WH = window.WH = window.WH || {};
  WH.routes = WH.routes || {}; WH.tabViews = WH.tabViews || {}; WH.act = WH.act || {}; WH.more = WH.more || []; WH.ready = WH.ready || []; WH.sundayExtras = WH.sundayExtras || [];
  const VERSION = '2.13.4';
  const $ = (s, el = document) => el.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem('wh:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('wh:' + k, JSON.stringify(v)); } catch (e) { } },
    del(k) { try { localStorage.removeItem('wh:' + k); } catch (e) { } }
  };

  /* ---------- sign-in link: #k=KEY&api=URL ---------- */
  (function takeLink() {
    const h = location.hash.replace(/^#/, '');
    if (!/(^|&)k=/.test(h)) return;
    const p = new URLSearchParams(h);
    if (p.get('k')) store.set('key', p.get('k'));
    if (p.get('api')) store.set('api', p.get('api'));
    store.del('demo'); store.del('boot');
    history.replaceState(null, '', location.pathname + '#/today');
  })();

  const S = {
    get api() { return store.get('api') || (window.WARD_HUB_CONFIG || {}).api || ''; },
    get key() { return store.get('key') || ''; },
    get demo() { return !!store.get('demo'); },
    boot: store.get('boot', null), people: null
  };

  /* ---------- talking to the engine ---------- */
  async function call(action, params = {}) {
    const req = Object.assign({ action, key: S.key }, params);
    let res;
    if (S.demo) res = await window.WardHubDemo.call(req);
    else {
      if (!S.api) throw new Error('This app has not been connected to a ward yet.');
      const r = await fetch(S.api, { method: 'POST', body: JSON.stringify(req), redirect: 'follow' });
      res = await r.json();
    }
    if (!res.ok && res.error === 'signin') { signOut(res.message); throw new Error(res.message); }
    if (!res.ok && res.error === 'Unknown action') throw new Error('This needs the latest engine. In the spreadsheet: Extensions › Apps Script › paste the new Engine.gs › Deploy › Manage deployments › ✏️ › New version.');
    if (!res.ok) throw new Error(res.error || 'Something went wrong');
    return res;
  }
  /* Show what we had last time instantly, then refresh quietly. */
  async function cached(name, action, params, render) {
    const ck = 'c:' + name, old = store.get(ck);
    if (old) render(old, true); else render(null, true);
    spinner(true);
    try {
      const fresh = await call(action, params);
      store.set(ck, fresh);
      if (JSON.stringify(old && strip(old)) !== JSON.stringify(strip(fresh))) render(fresh, false);
    } catch (e) { if (!old) render({ error: e.message }, false); else toast(navigator.onLine ? e.message : 'Offline — showing what you had'); }
    finally { spinner(false); }
  }
  const strip = o => { const c = Object.assign({}, o); delete c.ms; return c; };
  let spinCount = 0;
  function spinner(on) {
    spinCount += on ? 1 : -1;
    let el = $('#refreshing');
    if (spinCount > 0 && !el) { el = document.createElement('div'); el.id = 'refreshing'; el.className = 'refreshing'; el.innerHTML = '<span class="spin"></span>'; document.body.appendChild(el); }
    if (spinCount <= 0 && el) el.remove();
  }
  let toastT;
  function toast(msg, ok) {
    const t = $('#toast'); t.innerHTML = (ok ? '<svg width="16" height="16" viewBox="0 0 16 16"><path d="M3 8.5l3 3 7-7" stroke="#34C759" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '') + esc(msg);
    t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200);
  }
  function signOut(msg) { store.del('key'); store.del('boot'); Object.keys(localStorage).filter(k => k.startsWith('wh:c:')).forEach(k => localStorage.removeItem(k)); S.boot = null; route(); if (msg) toast(msg); }

  /* ---------- dates ---------- */
  const pd = s => { const p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };
  const ymd = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const fmt = (s, o) => s ? pd(s).toLocaleDateString(undefined, o || { month: 'short', day: 'numeric' }) : '';
  const long = s => fmt(s, { weekday: 'long', month: 'long', day: 'numeric' });
  function rel(s) {
    if (!s) return '';
    const n = Math.round((pd(s) - today()) / 864e5);
    if (n === 0) return 'Today'; if (n === 1) return 'Tomorrow'; if (n === -1) return 'Yesterday';
    if (n < 0) return Math.abs(n) + ' days late';
    if (n < 7) return pd(s).toLocaleDateString(undefined, { weekday: 'long' });
    return fmt(s);
  }
  const nextSun = () => { const d = today(); d.setDate(d.getDate() + ((7 - d.getDay()) % 7)); return ymd(d); };

  /* ---------- icons (SF-Symbol-like line icons) ---------- */
  const I = {
    today: '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5.5" width="20" height="18" rx="4"/><path d="M4 11h20M9.5 3.5v4M18.5 3.5v4"/><path d="M10 16.5l2.6 2.6 5.4-5.4"/></svg>',
    sunday: '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 23.5h18M7 23.5V12l7-6 7 6v11.5"/><path d="M12 23.5v-5h4v5M14 2.5v3.5M12.4 4.2h3.2"/></svg>',
    calendar: '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="4" y="5.5" width="20" height="18" rx="4"/><path d="M4 11h20M9.5 3.5v4M18.5 3.5v4"/><circle cx="10" cy="15.5" r=".9" fill="currentColor"/><circle cx="14" cy="15.5" r=".9" fill="currentColor"/><circle cx="18" cy="15.5" r=".9" fill="currentColor"/><circle cx="10" cy="19.5" r=".9" fill="currentColor"/><circle cx="14" cy="19.5" r=".9" fill="currentColor"/></svg>',
    people: '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="11" cy="9.5" r="4"/><path d="M3.5 22.5c.8-4 3.8-6 7.5-6s6.7 2 7.5 6"/><circle cx="19.5" cy="10.5" r="3"/><path d="M19.8 16.6c2.6.3 4.3 2 4.8 4.9"/></svg>',
    more: '<svg viewBox="0 0 28 28" fill="currentColor"><circle cx="7" cy="14" r="2.1"/><circle cx="14" cy="14" r="2.1"/><circle cx="21" cy="14" r="2.1"/></svg>',
    chev: '<svg class="chev" viewBox="0 0 8 14"><path d="M1 1l6 6-6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    search: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="7" cy="7" r="5"/><path d="M11 11l3.5 3.5"/></svg>',
    left: '<svg width="12" height="20" viewBox="0 0 12 20"><path d="M10 2L2 10l8 8" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    plus: '<svg width="16" height="16" viewBox="0 0 16 16"><path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    phone: '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M6.6 2.5l2 3.6c.3.5.2 1.1-.2 1.5L7.2 8.8c.9 1.9 2.2 3.2 4 4l1.2-1.2c.4-.4 1-.5 1.5-.2l3.6 2c.5.3.7.9.5 1.4l-.7 1.9c-.3.8-1.1 1.3-2 1.2C8.6 17.4 2.6 11.4 2.1 4.7 2 3.8 2.5 3 3.3 2.7l1.9-.7c.5-.2 1.1 0 1.4.5z"/></svg>',
    msg: '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 2.5c4.4 0 8 2.9 8 6.6s-3.6 6.6-8 6.6c-.8 0-1.6-.1-2.3-.3L3.5 17.5l1.2-3.4C3 12.9 2 11.1 2 9.1 2 5.4 5.6 2.5 10 2.5z"/></svg>',
    mail: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2.5" y="4.5" width="15" height="11" rx="2"/><path d="M3 5.5l7 5.5 7-5.5"/></svg>'
  };
  const ORGCOLOR = { 'Relief Society': '#AF52DE', 'Elders Quorum': '#007AFF', 'Young Women': '#FF2D55', 'Young Men': '#0A84FF', Primary: '#FF9500', 'Sunday School': '#34C759', Bishopric: '#1F3A93', Ward: '#5856D6', Stake: '#8E8E93', Youth: '#FF375F', Activities: '#30B0C7', Music: '#BF5AF2' };
  const statusChip = s => ({ Accepted: '<span class="chip green">Yes</span>', Done: '<span class="chip">Done</span>', Asked: '<span class="chip orange">Asked</span>', Idea: '<span class="chip">Idea</span>', Declined: '<span class="chip red">No</span>' }[s] || (s ? `<span class="chip">${esc(s)}</span>` : ''));
  const statusDot = s => `<span class="dot ${({ Accepted: 'green', Done: 'green', Asked: 'orange', Declined: 'red', Idea: '' })[s] || ''}"></span>`;

  /* ---------- shell ---------- */
  const TABS = [['today', 'Today'], ['sunday', 'Sunday'], ['calendar', 'Calendar'], ['people', 'People'], ['more', 'More']];
  function drawTabs(on) {
    const nav = $('#tabs'); nav.hidden = false;
    const can = tabsFor();
    nav.innerHTML = TABS.filter(([k]) => can[k]).map(([k, label]) => `<button data-go="#/${k}" class="${on === k ? 'on' : ''}" aria-label="${label}">${I[k]}<span>${label}</span></button>`).join('');
  }
  function tabsFor() {
    const r = (S.boot && S.boot.me.roles) || {};
    return { today: true, sunday: !!(r.admin || r.bishopric || r.music || r.clerk), calendar: true, people: !!(r.admin || r.bishopric || r.clerk || r.leader || r.teacher), more: true };
  }
  function screen(title, sub, body, opts = {}) {
    const app = $('#app');
    app.innerHTML = `<div class="navbar" id="navbar">${opts.back ? `<button class="link" style="position:absolute;left:10px;bottom:6px;display:flex;align-items:center;gap:4px" data-go="${opts.back}">${I.left} Back</button>` : ''}${esc(title)}${opts.right ? `<span class="nb-right">${opts.right}</span>` : ''}</div>
      <main class="screen">${opts.back ? `<button class="link noprint" style="display:flex;align-items:center;gap:6px;margin-top:4px" data-go="${opts.back}">${I.left} ${esc(opts.backLabel || 'Back')}</button>` : ''}
      <div class="largetitle" style="${opts.back ? 'margin-top:10px' : ''}"><h1>${esc(title)}</h1>${opts.right || ''}</div>${sub ? `<p class="subtitle">${sub}</p>` : ''}<div id="body">${body}</div></main>`;
    onScroll();
  }
  function onScroll() { const nb = $('#navbar'); if (nb) nb.classList.toggle('show', window.scrollY > 46); }
  window.addEventListener('scroll', onScroll, { passive: true });
  const skeleton = n => Array.from({ length: n || 3 }, () => '<div class="skeleton"></div>').join('');
  const errorBox = e => `<div class="list"><div class="empty">${esc(e)}<br><br><button class="btn small gray" data-act="reload">Try again</button></div></div>`;

  /* ---------- router ---------- */
  function route() {
    closeSheet();
    if (!S.key && !S.demo) { $('#tabs').hidden = true; return welcome(); }
    if (!S.boot) return start();
    const parts = location.hash.replace(/^#\/?/, '').split('/');
    const tab = parts[0] || 'today';
    const can = tabsFor();
    const t = tab === 'x' ? 'x' : (can[tab] ? tab : 'today');
    drawTabs(t);
    window.scrollTo(0, 0);
    if (tab === 'x' && !WH.routes[parts[1]]) { location.hash = '#/more'; return; }
    if (tab === 'x' && WH.routes[parts[1]]) { drawTabs(WH.routes[parts[1]].tab || 'more'); return WH.routes[parts[1]].view(parts.slice(2)); }
    if (tab === 'sunday' && parts[2] && parts[2] !== 'conduct' && WH.routes[parts[2]]) return WH.routes[parts[2]].view([parts[1]]);
    const custom = WH.tabViews[t];
    if (custom) return custom(parts.slice(1));
    ({ today: viewToday, sunday: () => parts[2] === 'conduct' ? viewConduct(parts[1]) : viewSunday(parts[1]), calendar: viewCalendar, people: viewPeople, more: viewMore })[t]();
  }
  async function start() {
    $('#app').innerHTML = `<main class="screen"><div class="largetitle"><h1>Ward Hub</h1></div>${skeleton(4)}</main>`;
    try { const b = await call('boot'); S.boot = b; store.set('boot', b); route(); }
    catch (e) { $('#app').innerHTML = `<main class="screen"><div class="largetitle"><h1>Ward Hub</h1></div>${errorBox(e.message)}<div class="btns"><button class="btn gray" data-act="signout">Sign out</button></div></main>`; }
  }
  window.addEventListener('hashchange', route);
  document.addEventListener('click', e => {
    const go = e.target.closest('[data-go]');
    if (go) { e.preventDefault(); const h = go.getAttribute('data-go'); if (location.hash === h) route(); else location.hash = h; return; }
    const a = e.target.closest('[data-act]');
    if (a && (ACT[a.dataset.act] || WH.act[a.dataset.act])) { e.preventDefault(); (ACT[a.dataset.act] || WH.act[a.dataset.act])(a); }
  });

  /* ---------- Welcome ---------- */
  function welcome() {
    $('#app').innerHTML = `<div class="welcome">
      <img class="logo" src="icons/icon-192.png" alt="">
      <h1>Ward Hub</h1>
      <p>Open the personal link from your executive secretary on this phone, and you're in.</p>
      ${S.api ? `<div class="list"><div class="field"><input id="em" type="email" inputmode="email" autocomplete="email" placeholder="Your email address" aria-label="Email"></div></div>
      <button class="btn" data-act="sendlink">Email me my link</button><p class="foot" style="text-align:center;margin:10px 0 22px">It only goes to addresses the ward has on file.</p>` : ''}
      <button class="btn gray" data-act="demo">Try the demo</button>
      <p class="foot" style="text-align:center;margin-top:22px"><a href="setup.html">Setting up Ward Hub for another ward?</a></p>
    </div>`;
  }

  /* ---------- Today ---------- */
  function viewToday() {
    const me = S.boot.me, first = String(me.name).split(' ')[0];
    const hour = new Date().getHours(), greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    screen('Today', `${long(ymd(today()))} · ${greet}, ${esc(first)}`, skeleton(4));
    cached('today', 'today', {}, (d) => {
      if (!d) return;
      if (d.error) { $('#body').innerHTML = errorBox(d.error); return; }
      let h = '';
      if (d.checklist) {
        const left = d.checklist.filter(c => !c.done).length;
        h += `<div class="section-h big"><span>This week</span><span class="chip ${left ? 'blue' : 'green'}">${left ? left + ' to do' : 'All done'}</span></div><div class="list">` +
          d.checklist.map(c => `<div class="row ${c.done ? 'done' : ''}"><button data-act="check" data-id="${c.id}" data-on="${c.done ? 1 : 0}" aria-label="Done" style="background:none;border:0;padding:4px 6px 4px 0;margin:0"><span class="check ${c.done ? 'on' : ''}"></span></button><button class="main" ${c.go ? `data-go="${esc(c.go)}"` : ''} style="background:none;border:0;padding:0;text-align:left;color:inherit;font:inherit"><div class="t">${esc(c.text)}</div>${c.done ? `<div class="s">${esc(c.done)}</div>` : ''}</button>${c.go ? I.chev : ''}</div>`).join('') + '</div>';
      }
      h += `<div class="section-h big"><span>Needs you</span>${d.needs.length ? `<span class="chip">${d.needs.length}</span>` : ''}</div>`;
      h += d.needs.length ? '<div class="list">' + d.needs.map(n => {
        const late = n.due && n.due < ymd(today());
        const go = n.kind === 'emergency' ? 'data-go="#/x/emergency" style="background:var(--red-tint)"' : n.kind === 'sunday' ? `data-go="#/sunday/${n.id}"` : n.kind === 'task' ? `data-act="task" data-id="${esc(n.id)}"` : n.kind === 'announcements' ? `data-go="#/x/announcements"` : n.kind === 'lcr' ? `data-go="#/x/changes"` : n.kind === 'callings' ? `data-go="#/x/changes"` : n.kind === 'inbox' ? `data-go="#/x/inbox"` : n.kind === 'training' ? `data-go="#/x/training"` : n.kind === 'teach' && n.link ? `data-act="openUrl" data-url="${esc(n.link)}"` : '';
        return `<button class="row wrap" ${go}><div class="main"><div class="t">${esc(n.title)}</div>${n.sub ? `<div class="s">${esc(n.sub)}</div>` : ''}</div>${n.due ? `<span class="chip ${late ? 'red' : rel(n.due) === 'Today' ? 'orange' : ''}">${esc(rel(n.due))}</span>` : ''}${go ? I.chev : ''}</button>`;
      }).join('') + '</div>' : `<div class="list"><div class="empty">Nothing needs you right now.</div></div>`;
      if (d.sunday) {
        const sv = d.sunday;
        h += `<div class="section-h big"><span>${rel(sv.date) === 'Today' ? 'Today' : 'This Sunday'}</span><a href="#/sunday/${sv.date}">Plan</a></div>
          <button class="hero" style="border:0;width:100%;text-align:left;color:inherit;cursor:pointer" data-go="#/sunday/${sv.date}">
          <div class="k">${esc(fmt(sv.date, { weekday: 'long', month: 'long', day: 'numeric' }))} · ${esc(sv.type)}</div>
          <div class="big">${sv.conducting ? 'Conducting: ' + esc(sv.conducting) : 'Conducting not set'}</div>
          <div class="ppl">${sv.speakers.length ? sv.speakers.map(p => `<div class="p">${statusDot(p.status)}${esc(p.name)}<span class="role">${esc(p.role)}</span></div>`).join('') : '<div class="p" style="color:var(--sub)">No speakers yet</div>'}</div>
          ${hymnBlocks(sv.hymns)}</button>`;
      }
      h += `<div class="section-h big"><span>Coming up</span><a href="#/calendar">Calendar</a></div>` + weekList(d.week);
      const quick = (WH.quick || []).filter(q => !q.show || q.show());
      if (quick.length) h += `<div class="section-h big"><span>Shortcuts</span></div><div class="quick">${quick.map(q => `<button class="qbtn" data-go="${q.href}"><span class="icon" style="background:${q.color}">${q.icon}</span><span>${esc(q.title)}</span></button>`).join('')}</div>`;
      $('#body').innerHTML = h;
    });
  }
  function hymnBlocks(hy) {
    const ks = Object.keys(hy || {}); if (!ks.length) return '';
    return '<div class="hymns">' + ks.map(k => `<div class="hymn"><b>${esc(k.replace(' hymn', ''))} · ${esc(hy[k].n)}</b>${esc(hy[k].title || '')}</div>`).join('') + '</div>';
  }
  function weekList(week) {
    if (!week || !week.length) return '<div class="list"><div class="empty">Nothing on the calendar this week.</div></div>';
    return '<div class="list">' + week.map(w => `<div class="row ic"><span class="icon" style="background:${ORGCOLOR[w.org] || '#8E8E93'};font-size:12px;font-weight:700;flex-direction:column;line-height:1"><span style="font-size:9px;opacity:.85">${esc(fmt(w.date, { weekday: 'short' }).toUpperCase())}</span>${esc(pd(w.date).getDate())}</span><div class="main"><div class="t">${esc(w.title)}</div><div class="s">${[w.time, w.place, w.org].filter(Boolean).map(esc).join(' · ')}</div></div></div>`).join('') + '</div>';
  }

  /* ---------- Sunday ---------- */
  const ROLES = ['Invocation', 'Speaker', 'Youth speaker', 'High council', 'Musical number', 'Testimony', 'Benediction'];
  const TYPES = ['Regular', 'Fast & Testimony', 'General Conference', 'Stake Conference', 'Ward Conference', 'Primary Program', 'Christmas Program', 'Special Program', 'No meeting'];
  let sunCache = null;
  function viewSunday(date) {
    date = date || nextSun();
    const right = `<button class="btn small" data-go="#/sunday/${date}/conduct">Conduct</button>`;
    screen('Sunday', esc(long(date)), skeleton(5), { right });
    cached('sunday:' + date, 'sunday', { date }, (d) => {
      if (!d) return;
      if (d.error) { $('#body').innerHTML = errorBox(d.error); return; }
      sunCache = d;
      const s = d.sunday || { Date: date, Type: 'Regular' };
      const nav = (d.nav || []).slice();
      if (!nav.some(n => n.date === date)) nav.push({ date, type: s.Type, speakers: 0 });
      nav.sort((a, b) => a.date.localeCompare(b.date));
      let h = `<div class="dates">${nav.map(n => `<button class="date ${n.date === date ? 'on' : ''}" data-go="#/sunday/${n.date}"><div class="m">${esc(fmt(n.date, { month: 'short' }))}</div><div class="d">${pd(n.date).getDate()}</div><div class="n">${n.type === 'Regular' ? (n.speakers + ' spk') : esc(n.type.split(' ')[0])}</div></button>`).join('')}</div>`;
      h += `<div class="section-h"><span>Meeting</span><button class="link" style="font-size:15px" data-act="editSunday">Edit</button></div><div class="list">
        ${kv('Type', s.Type)}${kv('Presiding', s.Presiding || (S.boot.settings || {}).presiding_default)}${kv('Conducting', s.Conducting)}
        ${s['Stake visitor'] ? kv('Stake visitor', s['Stake visitor']) : ''}${s['High council'] ? kv('High council', s['High council']) : ''}${s['Stake business'] ? kv('Stake business', 'Yes') : ''}
        ${kv('Organist', s.Organist)}${kv('Chorister', s.Chorister)}</div>`;
      h += `<div class="section-h"><span>Hymns</span></div><div class="list">${['Opening hymn', 'Sacrament hymn', 'Intermediate hymn', 'Closing hymn'].filter(k => k !== 'Intermediate hymn' || s[k]).map(k => kv(k.replace(' hymn', ''), s[k] ? `${s[k]} · ${(d.hymns[k] || {}).title || ''}` : '', 'editSunday')).join('')}</div>`;
      h += `<div class="section-h"><span>Program</span>${WH.isBish() ? '<button class="link" style="font-size:15px" data-act="addPart">Add</button>' : ''}</div>`;
      h += d.participants.length ? '<div class="list">' + d.participants.map(p => `<button class="row" data-act="editPart" data-id="${esc(p.ID)}"><div class="main"><div class="t">${esc(p.Person || '—')}</div><div class="s">${esc(p.Role)}${p.Topic ? ' · ' + esc(p.Topic) : ''}</div></div>${statusChip(p.Status)}${I.chev}</button>`).join('') + '</div>'
        : '<div class="list"><div class="empty">No speakers or prayers yet. Tap Add.</div></div>';
      if (s.Theme || s['Theme text']) h += `<div class="section-h"><span>Theme</span></div><div class="list"><div class="row wrap"><div class="main"><div class="t">${esc(s['Theme text'] || '')}</div><div class="s">${esc(s.Theme || '')}</div></div></div></div>`;
      h += `<div class="section-h"><span>Announcements</span><span>${d.announcements.length}</span></div>`;
      h += d.announcements.length ? '<div class="list">' + d.announcements.map(a => `<div class="row wrap"><span class="dot" style="background:${ORGCOLOR[a.org] || '#8E8E93'}"></span><div class="main"><div class="t" style="font-size:15px">${esc(a.text)}</div><div class="s">${esc(a.org)}${a.onProgram ? ' · on program' : ''}</div></div></div>`).join('') + '</div>' : '<div class="list"><div class="empty">No announcements this week.</div></div>';
      h += `<div class="btns"><button class="btn" data-go="#/sunday/${date}/conduct">Conduct from this phone</button></div>`;
      h += WH.sundayExtras.filter(x => !x.show || x.show()).map(x => `<div class="btns" style="margin-top:10px"><button class="btn gray" data-go="${x.href(date)}">${esc(x.title)}</button></div>`).join('');
      $('#body').innerHTML = h;
    });
  }
  const kv = (k, v, act) => `<${act ? `button data-act="${act}"` : 'div'} class="row"><div class="main"><div class="t">${esc(k)}</div></div><div class="r" style="max-width:62%;overflow:hidden;text-overflow:ellipsis">${v ? esc(v) : '<span style="color:var(--faint)">—</span>'}</div></${act ? 'button' : 'div'}>`;

  function viewConduct(date) {
    date = date || nextSun();
    screen('Conducting', esc(long(date)), skeleton(6), { back: '#/sunday/' + date, backLabel: 'Sunday' });
    cached('sunday:' + date, 'sunday', { date }, (d) => {
      if (!d || d.error) { if (d) $('#body').innerHTML = errorBox(d.error); return; }
      sunCache = d;
      const s = d.sunday || {}, set = S.boot.settings || {};
      const P = r => d.participants.filter(p => p.Role === r);
      const hy = k => d.hymns[k] ? `<b>${esc(d.hymns[k].n)}</b> · ${esc(d.hymns[k].title)}` : '<span style="color:var(--faint)">not chosen</span>';
      const ward = set.ward_name || 'our ward';
      let h = `<div class="conduct">`;
      h += `<div class="list noprint" style="margin-bottom:6px"><div class="field"><label style="width:auto;flex:1">Stake presidency here</label><select data-sfield="Stake visitor"><option value="">No</option>${String(set.stake_presidency || '').split(/\s*,\s*/).filter(Boolean).map(n => `<option ${s['Stake visitor'] === n ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div>
        <div class="field"><label style="width:auto;flex:1">High councilor here</label><select data-sfield="High council"><option value="">No</option>${[set.high_council].filter(Boolean).map(n => `<option ${s['High council'] === n ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div>
        <div class="field"><label style="width:auto;flex:1">Stake business</label><span class="toggle"><input type="checkbox" data-sfield="Stake business" ${s['Stake business'] ? 'checked' : ''}><span></span></span></div></div>`;
      const presiding = s['Stake visitor'] || s.Presiding || set.presiding_default || 'the bishop';
      const welcomeBits = [`We are presided over by ${esc(presiding)}.`];
      if (s['Stake visitor'] && s.Presiding) welcomeBits.push(`We welcome ${esc(s['Stake visitor'])} of the stake presidency.`);
      if (s['High council']) welcomeBits.push(`We also welcome ${esc(s['High council'])} of the high council.`);
      if (s.Conducting) welcomeBits.push(`${esc(s.Conducting)} is conducting.`);
      welcomeBits.push(`Our organist is ${esc(s.Organist || '—')}, and our chorister is ${esc(s.Chorister || '—')}.`);
      h += `<h3>Welcome</h3><div class="say">Good morning, brothers and sisters, and welcome to sacrament meeting of the ${esc(ward)}. ${welcomeBits.join(' ')}</div>`;
      h += `<h3>Announcements</h3><div class="say">${d.announcements.length ? '<ul>' + d.announcements.map(a => `<li>${esc(a.text)}</li>`).join('') + '</ul>' : 'None'}
        <div class="noprint" style="display:flex;gap:8px;margin-top:10px"><input id="lastmin" placeholder="Add a last-minute announcement" style="flex:1;border:0;background:var(--card2);border-radius:10px;padding:10px 12px;font-size:16px;min-width:0"><button class="btn small" data-act="lastMin">Add</button></div></div>`;
      h += `<h3>Opening hymn</h3><div class="say">${hy('Opening hymn')}</div>`;
      h += `<h3>Invocation</h3><div class="say">${esc(P('Invocation').map(p => p.Person).join(', ') || '—')}</div>`;
      if ((d.business || []).length) h += `<h3>Ward business</h3><div class="say">${d.business.map(b => /Release/.test(b.change) ? `<p>${esc(b.title)} ${esc(b.person)} has been released as ${esc(b.calling)}. All who wish to express thanks for ${b.title === 'Sister' ? 'her' : 'his'} service may do so by the uplifted hand.</p>` : `<p>${esc(b.title)} ${esc(b.person)} has been called as ${esc(b.calling)}. Those who can sustain ${b.title === 'Sister' ? 'her' : 'him'} may manifest it. Those opposed, if any, may manifest it.</p>`).join('')}</div>`;
      if (s['Stake business']) h += `<h3>Stake business</h3><div class="say">We'll now turn the time over to ${esc(s['Stake visitor'] || s['High council'] || 'the stake')} for stake business.</div>`;
      h += `<h3>Sacrament</h3><div class="say">We'll now prepare to partake of the sacrament by singing ${hy('Sacrament hymn')}, after which the sacrament will be blessed and passed by the Aaronic Priesthood.</div>`;
      h += `<h3 class="noprint">Sacrament prayers (read along)</h3><div class="prayer"><b>Bread · D&amp;C 20:77</b>O God, the Eternal Father, we ask thee in the name of thy Son, Jesus Christ, to bless and sanctify this bread to the souls of all those who partake of it, that they may eat in remembrance of the body of thy Son, and witness unto thee, O God, the Eternal Father, that they are willing to take upon them the name of thy Son, and always remember him and keep his commandments which he has given them; that they may always have his Spirit to be with them. Amen.</div>
        <div class="prayer" style="margin-top:10px"><b>Water · D&amp;C 20:79</b>O God, the Eternal Father, we ask thee in the name of thy Son, Jesus Christ, to bless and sanctify this water to the souls of all those who drink of it, that they may do it in remembrance of the blood of thy Son, which was shed for them; that they may witness unto thee, O God, the Eternal Father, that they do always remember him, that they may have his Spirit to be with them. Amen.</div>`;
      h += `<h3>After the sacrament</h3><div class="say">We thank the Aaronic Priesthood for the reverent administration of the sacrament.${s.Type === 'Fast & Testimony' ? ' The remainder of the meeting is open for testimonies.' : ' We will now hear from:'}</div>`;
      const prog = d.participants.filter(p => !/Invocation|Benediction/.test(p.Role));
      if (prog.length) h += `<div class="list" style="margin-top:8px">${prog.map(p => `<div class="row"><div class="main"><div class="t">${esc(p.Person)}</div><div class="s">${esc(p.Role)}${p.Topic ? ' · ' + esc(p.Topic) : ''}</div></div></div>`).join('')}</div>`;
      h += `<h3>Closing</h3><div class="say">Closing hymn ${hy('Closing hymn')}, after which ${esc(P('Benediction').map(p => p.Person).join(', ') || '—')} will offer the benediction.</div>`;
      h += `<div class="btns noprint"><button class="btn gray" data-act="print">Print</button></div></div>`;
      $('#body').innerHTML = h;
      $('#body').querySelectorAll('[data-sfield]').forEach(el => el.addEventListener('change', async () => {
        const row = { Date: date }; row[el.dataset.sfield] = el.type === 'checkbox' ? el.checked : el.value;
        try { await call('save', { tab: 'Sundays', row }); store.del('c:sunday:' + date); toast('Saved', true); viewConduct(date); } catch (e) { toast(e.message); }
      }));
    });
  }

  /* ---------- Calendar ---------- */
  function viewCalendar() {
    screen('Calendar', 'Ward, organizations and stake', skeleton(5));
    cached('events', 'list', { tabs: ['Events'] }, (d) => {
      if (!d) return;
      if (d.error) { $('#body').innerHTML = errorBox(d.error); return; }
      const t = ymd(today());
      const ev = (d.data.Events || []).filter(e => (e['End date'] || e.Date) >= t && (!e.Status || e.Status === 'Approved')).sort((a, b) => (a.Date + (a.Start || '')).localeCompare(b.Date + (b.Start || '')));
      const orgs = [...new Set(ev.map(e => e.Organization))].sort();
      const pick = store.get('calOrg', '');
      let h = `<div class="dates" style="margin-bottom:10px"><button class="date ${!pick ? 'on' : ''}" style="min-width:auto" data-act="calOrg" data-org=""><div class="d" style="font-size:15px;padding:4px 2px">All</div></button>${orgs.map(o => `<button class="date ${pick === o ? 'on' : ''}" style="min-width:auto" data-act="calOrg" data-org="${esc(o)}"><div class="d" style="font-size:15px;padding:4px 2px;white-space:nowrap">${esc(o)}</div></button>`).join('')}</div>`;
      const list = ev.filter(e => !pick || e.Organization === pick);
      let month = '';
      if (!list.length) h += '<div class="list"><div class="empty">Nothing coming up.</div></div>';
      list.slice(0, 120).forEach((e, i) => {
        const m = fmt(e.Date, { month: 'long', year: 'numeric' });
        if (m !== month) { if (month) h += '</div>'; h += `<div class="section-h"><span>${esc(m)}</span></div><div class="list">`; month = m; }
        h += `<div class="row ic"><span class="icon" style="background:${ORGCOLOR[e.Organization] || '#8E8E93'};font-size:12px;font-weight:700;flex-direction:column;line-height:1"><span style="font-size:9px;opacity:.85">${esc(fmt(e.Date, { weekday: 'short' }).toUpperCase())}</span>${pd(e.Date).getDate()}</span><div class="main"><div class="t">${esc(e.Title)}</div><div class="s">${[e.Start, e.Place, e.Organization].filter(Boolean).map(esc).join(' · ')}</div></div></div>`;
      });
      if (month) h += '</div>';
      h += '<p class="foot">Adding events, linked calendars and building requests arrive in the next update.</p>';
      $('#body').innerHTML = h;
    });
  }

  /* ---------- People ---------- */
  function viewPeople() {
    screen('People', '', `<div class="search">${I.search}<input id="q" type="search" placeholder="Search names or callings" autocomplete="off" value="${esc(store.get('q', ''))}"></div><div id="plist">${skeleton(6)}</div>`);
    let data = null;
    const draw = () => {
      if (!data) return;
      if (data.error) { $('#plist').innerHTML = errorBox(data.error); return; }
      const q = ($('#q').value || '').trim().toLowerCase(); store.set('q', q);
      const cal = {}; (data.data.Callings || []).forEach(c => { if (!/Released|Proposed/.test(c.Status)) (cal[c.Person] = cal[c.Person] || []).push(c.Calling); });
      let ppl = (data.data.People || []).filter(p => !q || p.Name.toLowerCase().includes(q) || (cal[p.Name] || []).join(' ').toLowerCase().includes(q));
      ppl.sort((a, b) => String(a['Sort name']).localeCompare(String(b['Sort name'])));
      const total = ppl.length; ppl = ppl.slice(0, 150);
      $('#plist').innerHTML = ppl.length ? `<div class="list">${ppl.map(p => `<button class="row" data-act="person" data-name="${esc(p.Name)}"><div class="main"><div class="t">${esc(p['Sort name'] || p.Name)}</div>${cal[p.Name] ? `<div class="s">${esc(cal[p.Name].slice(0, 2).join(' · '))}</div>` : ''}</div>${I.chev}</button>`).join('')}</div><p class="foot">${total > 150 ? 'Showing 150 of ' + total + '. Search to narrow.' : total + ' people'}</p>` : '<div class="list"><div class="empty">No one matches.</div></div>';
      S.people = data.data;
    };
    $('#q').addEventListener('input', draw);
    cached('people', 'list', { tabs: ['People', 'Callings'] }, (d) => { if (d) { data = d; draw(); } });
  }
  function personSheet(name) {
    const d = S.people || {}; const p = (d.People || []).find(x => x.Name === name); if (!p) return;
    const cal = (d.Callings || []).filter(c => c.Person === name && !/Released/.test(c.Status));
    const tel = String(p.Phone || '').replace(/[^\d+]/g, '');
    openSheet(`<header><span style="min-width:64px"></span><h2>${esc(p.Name)}</h2><button class="link r" data-act="close">Done</button></header>
      ${tel ? `<div class="btns" style="margin-top:4px"><a class="btn gray" href="tel:${tel}">${I.phone.replace('<svg', '<svg width="18" height="18"')} Call</a><a class="btn gray" href="sms:${tel}">${I.msg.replace('<svg', '<svg width="18" height="18"')} Text</a>${p.Email ? `<a class="btn gray" href="mailto:${esc(p.Email)}">${I.mail.replace('<svg', '<svg width="18" height="18"')} Email</a>` : ''}</div>` : ''}
      <div class="section-h"><span>Details</span></div><div class="list">${kv('Phone', p.Phone)}${p['Parent phone'] ? kv('Parent phone', p['Parent phone']) : ''}${kv('Email', p.Email)}${p['Birth date'] ? kv('Birthday', fmt(p['Birth date'], { month: 'long', day: 'numeric' })) : ''}${p.Household ? kv('Household', p.Household) : ''}</div>
      ${cal.length ? `<div class="section-h"><span>Callings</span></div><div class="list">${cal.map(c => `<div class="row"><div class="main"><div class="t">${esc(c.Calling)}</div><div class="s">${esc(c.Organization)}${c.Sustained ? ' · since ' + esc(fmt(c.Sustained, { month: 'short', year: 'numeric' })) : ''}</div></div></div>`).join('')}</div>` : ''}
      ${(WH.isBish() || (S.boot.me.orgs || []).indexOf(p.Gender === 'F' ? 'Relief Society' : 'Elders Quorum') >= 0) ? `<div class="section-h"><span>Comes to church</span></div><div class="seg">${['Yes', 'Sometimes', 'No', 'Unknown'].map(v => `<button class="${(p.Attends || 'Unknown') === v ? 'on' : ''}" data-act="attends" data-name="${esc(p.Name)}" data-v="${v}">${v}</button>`).join('')}</div><p class="foot">Used for "Those who attend" in Messages.</p>` : ''}
      ${p.Notes ? `<div class="section-h"><span>Notes · bishopric only</span></div><div class="list"><div class="row wrap"><div class="main"><div class="t" style="font-size:15px">${esc(p.Notes)}</div></div></div></div>` : ''}`);
  }

  /* ---------- More ---------- */
  function viewMore() {
    const me = S.boot.me, set = S.boot.settings || {};
    const items = WH.more.filter(m => !m.show || m.show()).sort((a, b) => (a.order || 50) - (b.order || 50));
    const groups = {}; items.forEach(m => (groups[m.group || 'Ward'] = groups[m.group || 'Ward'] || []).push(m));
    const groupHtml = Object.keys(groups).map(g => `<div class="section-h"><span>${esc(g === 'Ward' ? (set.ward_name || 'Ward') : g)}</span></div><div class="list">${groups[g].map(m => `<button class="row ic" data-go="${m.href}"><span class="icon" style="background:${m.color || 'var(--accent)'}">${m.icon || ''}</span><div class="main"><div class="t">${esc(m.title)}</div>${m.sub ? `<div class="s">${esc(m.sub)}</div>` : ''}</div>${m.badge ? `<span class="chip blue">${esc(m.badge())}</span>` : ''}${I.chev}</button>`).join('')}</div>`).join('');
    screen('More', '', `<div class="list"><div class="row"><span class="icon" style="background:var(--accent);border-radius:50%;width:44px;height:44px;font-weight:700">${esc(String(me.name).split(' ').map(x => x[0]).slice(0, 2).join(''))}</span><div class="main"><div class="t" style="font-weight:600">${esc(me.name)}</div><div class="s">${esc((me.callings || []).slice(0, 2).join(' · ') || 'Member')}</div></div></div></div>
      ${groupHtml}
      <div class="section-h"><span>This phone</span></div><div class="list">
      <button class="row" data-act="install"><div class="main"><div class="t">Add to Home Screen</div><div class="s">Opens like an app, full screen</div></div>${I.chev}</button>
      <button class="row" data-act="refresh"><div class="main"><div class="t">Refresh everything</div></div>${I.chev}</button>
      <button class="row" data-act="signout"><div class="main"><div class="t" style="color:var(--red)">${S.demo ? 'Leave the demo' : 'Sign out on this phone'}</div></div></button></div>
      <p class="foot">Ward Hub ${VERSION}${S.demo ? ' · demo with invented names' : ''}</p>`);
  }

  /* ---------- sheets (edit forms slide up) ---------- */
  function openSheet(html) {
    const root = $('#sheet-root');
    root.innerHTML = `<div class="scrim" data-act="close"></div><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`;
    document.body.style.overflow = 'hidden';
    const sh = $('.sheet', root); let y0 = null;
    sh.addEventListener('touchstart', e => { if (sh.scrollTop <= 0) y0 = e.touches[0].clientY; }, { passive: true });
    sh.addEventListener('touchmove', e => { if (y0 != null) { const dy = e.touches[0].clientY - y0; if (dy > 0) sh.style.transform = `translateY(${dy}px)`; } }, { passive: true });
    sh.addEventListener('touchend', e => { if (y0 != null) { const dy = (e.changedTouches[0].clientY - y0); sh.style.transform = ''; if (dy > 110) closeSheet(); } y0 = null; });
  }
  function closeSheet() { const r = $('#sheet-root'); if (r) r.innerHTML = ''; document.body.style.overflow = ''; }
  function form(title, fields, vals, onSave, onDelete, extra) {
    const f = fields.map(x => {
      const v = vals[x.name] == null ? '' : vals[x.name];
      if (x.type === 'select') return `<div class="field"><label>${esc(x.label || x.name)}</label><select name="${esc(x.name)}">${['', ...x.options].map(o => `<option ${String(o) === String(v) ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></div>`;
      if (x.type === 'toggle') return `<div class="field"><label style="flex:1">${esc(x.label || x.name)}</label><span class="toggle"><input type="checkbox" name="${esc(x.name)}" ${v === true || v === 'Yes' ? 'checked' : ''}><span></span></span></div>`;
      if (x.type === 'textarea') return `<div class="field col"><label>${esc(x.label || x.name)}</label><textarea name="${esc(x.name)}">${esc(v)}</textarea></div>`;
      return `<div class="field"><label>${esc(x.label || x.name)}</label><input name="${esc(x.name)}" value="${esc(v)}" ${x.type === 'number' ? 'inputmode="numeric"' : ''} ${x.type === 'date' ? 'type="date"' : ''} ${x.list ? 'list="dl-' + x.list + '"' : ''} placeholder="${esc(x.ph || '')}" autocomplete="off"></div>`;
    }).join('');
    const lists = [...new Set(fields.filter(x => x.list).map(x => x.list))].map(l => `<datalist id="dl-${l}">${(DATALISTS[l] || []).map(n => `<option value="${esc(n)}">`).join('')}</datalist>`).join('');
    openSheet(`<header><button class="link" data-act="close">Cancel</button><h2>${esc(title)}</h2><button class="link r" id="sv">Save</button></header>${extra || ''}<div class="list">${f}</div>${lists}${onDelete ? '<div class="btns"><button class="btn red" id="del">Remove</button></div>' : ''}`);
    $('#sv').onclick = async () => {
      const row = {}; fields.forEach(x => { const el = $(`.sheet [name="${x.name}"]`); row[x.name] = x.type === 'toggle' ? el.checked : el.value.trim(); });
      $('#sv').innerHTML = '<span class="spin"></span>';
      try { await onSave(row); closeSheet(); toast('Saved', true); } catch (e) { $('#sv').textContent = 'Save'; toast(e.message); }
    };
    if (onDelete) $('#del').onclick = async () => { if (!confirm('Remove this?')) return; try { await onDelete(); closeSheet(); toast('Removed', true); } catch (e) { toast(e.message); } };
  }
  const DATALISTS = {};
  async function loadNames() {
    if (DATALISTS.people) return;
    try { const d = S.people ? { data: S.people } : await call('list', { tabs: ['People'] }); DATALISTS.people = (d.data.People || []).map(p => p.Name).sort(); } catch (e) { DATALISTS.people = []; }
  }

  /* ---------- actions ---------- */
  const ACT = {
    close: closeSheet,
    openUrl: el => { window.open(el.dataset.url, '_blank', 'noopener'); },
    reload: () => route(),
    demo: () => { store.set('demo', true); store.del('boot'); S.boot = null; location.hash = '#/today'; route(); },
    signout: () => { if (S.demo) { store.del('demo'); signOut(); return; } if (confirm('Sign out on this phone? You will need your link again.')) signOut('Signed out'); },
    refresh: () => { Object.keys(localStorage).filter(k => k.startsWith('wh:c:')).forEach(k => localStorage.removeItem(k)); store.del('boot'); S.boot = null; route(); toast('Refreshed', true); },
    print: () => window.print(),
    install: () => openSheet(`<header><span style="min-width:64px"></span><h2>Add to Home Screen</h2><button class="link r" data-act="close">Done</button></header>
      <div class="list"><div class="row wrap"><div class="main"><div class="t" style="font-weight:600">iPhone (Safari)</div><div class="s">Tap the Share button (square with an arrow), scroll down, tap <b>Add to Home Screen</b>, then <b>Add</b>.</div></div></div>
      <div class="row wrap"><div class="main"><div class="t" style="font-weight:600">Android (Chrome)</div><div class="s">Tap the ⋮ menu at the top right, then <b>Install app</b> (or <b>Add to Home screen</b>).</div></div></div></div>`),
    sendlink: async () => {
      const em = ($('#em').value || '').trim(); if (!/.+@.+\..+/.test(em)) { toast('Type your email address'); return; }
      try { await call('link', { email: em, app: location.origin + location.pathname }); toast('If that address is on file, your link is on its way', true); } catch (e) { toast(e.message); }
    },
    check: async el => {
      const on = el.dataset.on !== '1'; (el.closest('.row') || el).classList.toggle('done', on); $('.check', el).classList.toggle('on', on); el.dataset.on = on ? '1' : '0';
      try { await call('check', { item: el.dataset.id, done: on }); store.del('c:today'); } catch (e) { toast(e.message); }
    },
    attends: async el => {
      try { const r = await call('setAttends', { name: el.dataset.name, value: el.dataset.v }); const p = ((S.people || {}).People || []).find(x => x.Name === el.dataset.name); if (p) p.Attends = r.attends; el.parentNode.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === el)); store.del('c:audiences'); toast('Saved', true); } catch (e) { toast(e.message); }
    },
    task: async el => {
      const id = el.dataset.id;
      let t = null; try { const d = await call('list', { tabs: ['Tasks'] }); t = (d.data.Tasks || []).find(x => x.ID === id); } catch (e) { toast(e.message); return; }
      if (!t) return;
      form('Task', [{ name: 'Task', type: 'textarea' }, { name: 'Owner' }, { name: 'Due', type: 'date' }, { name: 'Status', type: 'select', options: ['Not started', 'In progress', 'Waiting', 'Done'] }, { name: 'Notes', type: 'textarea' }], t,
        async row => { row.ID = id; if (row.Status === 'Done') row['Done on'] = ymd(today()); await call('save', { tab: 'Tasks', row }); store.del('c:today'); viewToday(); });
    },
    person: async el => { if (!S.people) { try { const d = await call('list', { tabs: ['People', 'Callings'] }); S.people = d.data; } catch (e) { toast(e.message); return; } } personSheet(el.dataset.name); },
    calOrg: el => { store.set('calOrg', el.dataset.org); viewCalendar(); },
    editSunday: async () => {
      const d = sunCache; if (!d) return; await loadNames();
      const s = Object.assign({ Date: d.date }, d.sunday || {});
      form('Meeting', [{ name: 'Type', type: 'select', options: TYPES }, { name: 'Conducting', list: 'people' }, { name: 'Presiding', ph: (S.boot.settings || {}).presiding_default || '' },
        { name: 'Organist', list: 'people' }, { name: 'Chorister', list: 'people' }, { name: 'Opening hymn', type: 'number' }, { name: 'Sacrament hymn', type: 'number' }, { name: 'Intermediate hymn', type: 'number' }, { name: 'Closing hymn', type: 'number' },
        { name: 'Theme', ph: 'Scripture or quote reference' }, { name: 'Theme text', type: 'textarea' }, { name: 'Notes', type: 'textarea' }], s,
        async row => { row.Date = d.date; await call('save', { tab: 'Sundays', row }); store.del('c:sunday:' + d.date); store.del('c:today'); viewSunday(d.date); });
    },
    addPart: async () => { const d = sunCache; if (!d) return; await loadNames(); partForm({ Date: d.date, Role: 'Speaker', Status: 'Asked', Order: (d.participants.length ? Math.max(...d.participants.map(p => +p.Order || 0)) + 1 : 1) }, false); },
    editPart: async el => { const d = sunCache; if (!d) return; await loadNames(); partForm(d.participants.find(p => p.ID === el.dataset.id), true); },
    lastMin: async () => {
      const v = ($('#lastmin').value || '').trim(); const d = sunCache; if (!v || !d) return;
      try { await call('save', { tab: 'Announcements', row: { Organization: 'Ward', Text: v, From: d.date, Through: d.date, Status: 'Approved', 'On program': false, 'Submitted by': S.boot.me.name, 'Submitted on': ymd(today()) } }); store.del('c:sunday:' + d.date); toast('Added', true); viewConduct(d.date); } catch (e) { toast(e.message); }
    }
  };
  function partForm(p, existing) {
    const date = p.Date;
    form(existing ? 'Edit' : 'Add to program', [{ name: 'Role', type: 'select', options: ROLES }, { name: 'Person', list: 'people' }, { name: 'Topic' }, { name: 'Minutes', type: 'number' }, { name: 'Status', type: 'select', options: ['Idea', 'Asked', 'Accepted', 'Declined', 'Done'] }, { name: 'Order', type: 'number' }, { name: 'Notes', type: 'textarea' }], p,
      async row => { row.Date = date; if (existing) row.ID = p.ID; if (row.Status === 'Asked' && !p['Asked on']) row['Asked on'] = ymd(today()); await call('save', { tab: 'Participants', row }); store.del('c:sunday:' + date); store.del('c:today'); viewSunday(date); },
      existing ? async () => { await call('remove', { tab: 'Participants', id: p.ID }); store.del('c:sunday:' + date); viewSunday(date); } : null,
      existing && WH.isBish() && p.Person ? `<div class="btns" style="margin:0 0 12px"><button class="btn gray" data-act="invitePart" data-id="${esc(p.ID)}" data-date="${esc(date)}">${I.msg.replace('<svg', '<svg width="18" height="18"')} Text an invitation</button></div>` : '');
  }

  /* ---------- shared with the feature files (program.js, messages.js, …) ---------- */
  Object.assign(WH, { partForm, legacyCalendar: viewCalendar, S, store, call, cached, screen, form, openSheet, closeSheet, toast, esc, kv, skeleton, errorBox, pd, ymd, today, fmt, long, rel, nextSun, I, ORGCOLOR, statusChip, statusDot, loadNames, DATALISTS, route, hymnBlocks, weekList,
    can: r => !!((S.boot && S.boot.me.roles) || {})[r], isBish: () => { const r = (S.boot && S.boot.me.roles) || {}; return !!(r.admin || r.bishopric); }, sunCache: () => sunCache });
  WH.ready.forEach(f => { try { f(); } catch (e) { console.error(e); } });

  /* ---------- go ---------- */
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => { });
  route();
})();
