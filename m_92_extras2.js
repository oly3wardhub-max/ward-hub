/* Extras 2 (from v1): tithing declaration list, ministering interviews, away dates, feedback for the bishop, stake page,
   substitute requests, checklists, Church News, youth class agendas, ward conference visits, funeral booklet and meal calculator,
   and a picture maker for group texts. */
(function () {
  const WH = window.WH = window.WH || {}; WH.routes = WH.routes || {}; WH.act = WH.act || {}; WH.more = WH.more || []; WH.sundayExtras = WH.sundayExtras || []; WH.ready = WH.ready || []; WH.quick = WH.quick || [];
  const ic = p => `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const back = { back: '#/more', backLabel: 'More' };
  const $b = () => document.getElementById('body');
  const err = e => { const b = $b(); if (b) b.innerHTML = WH.errorBox(e.message || e); };
  const me = () => (WH.S && WH.S.boot && WH.S.boot.me) || { roles: {}, orgs: [], callings: [] };
  const roles = () => me().roles || {};
  const orgs = () => me().orgs || [];
  const isBishop = () => (me().callings || []).some(c => /^Bishop$/i.test(c));
  const firstOf = n => String(n || '').trim().split(/\s+/)[0];
  const base = () => location.origin + location.pathname.replace(/[^/]*$/, '');
  const msgIcon = () => WH.I.msg.replace('<svg', '<svg width="18" height="18"');
  const sms = (nums, body) => WH.smsHref ? WH.smsHref(nums, body) : '';
  const textBtn = (nums, body, label, cls) => { const h = sms(nums, body); return h ? `<a class="btn ${cls || ''}" style="text-decoration:none" href="${WH.esc(h)}">${msgIcon()} ${WH.esc(label)}</a>` : ''; };
  async function share(title, url) { try { if (navigator.share) await navigator.share({ title, url }); else { await navigator.clipboard.writeText(url); WH.toast('Link copied', true); } } catch (e) { } }
  function printHtml(html, page) {
    let root = document.getElementById('print-root'); if (!root) { root = document.createElement('div'); root.id = 'print-root'; document.body.appendChild(root); }
    root.innerHTML = `<style>@media screen{#print-root{display:none}}@media print{@page{${page || 'size:letter;margin:.6in'}}body.printing-program>*:not(#print-root){display:none!important}body.printing-program #print-root{display:block;color:#000}body.printing-program{background:#fff!important}}</style>` + html;
    document.body.classList.add('printing-program'); setTimeout(() => { window.print(); setTimeout(() => document.body.classList.remove('printing-program'), 1000); }, 60);
  }
  const quarterOf = d => { const x = WH.pd(d); return x.getFullYear() + '-Q' + (Math.floor(x.getMonth() / 3) + 1); };

  /* ---------- More menu ---------- */
  const canMin = () => WH.isBish() || orgs().some(o => o === 'Elders Quorum' || o === 'Relief Society');
  const canYouth = () => WH.isBish() || orgs().some(o => o === 'Young Women' || o === 'Young Men');
  const canAway = () => WH.isBish() || WH.can('music') || WH.can('leader') || WH.can('clerk');
  WH.more.push(
    { title: 'Tithing declaration', sub: 'Who has booked or declared, and who to invite', href: '#/x/tithing', icon: ic('<path d="M4 15.5h12M5.5 15.5V9M10 15.5V9M14.5 15.5V9M3.5 9h13L10 4.5z"/>'), color: '#A8834A', order: 14.5, show: () => WH.can('admin'), group: 'Leaders' },
    { title: 'Ministering interviews', sub: 'This quarter, by minister', href: '#/x/ministering', icon: ic('<circle cx="7" cy="7" r="2.6"/><circle cx="13.5" cy="7" r="2.6"/><path d="M2.5 16c.6-3 2.4-4.5 4.5-4.5s3.9 1.5 4.5 4.5M11 12c.8-.4 1.6-.5 2.5-.5 2.1 0 3.9 1.5 4.5 4.5"/>'), color: '#007AFF', order: 12.5, show: canMin, group: 'Leaders' },
    { title: 'Away dates', sub: 'Days you won\'t be at church', href: '#/x/away', icon: ic('<path d="M3 13l14-6M6 12l-2.5-3M11 10.5l-1-6.5 2-1 3 6"/><path d="M3 17h14"/>'), color: '#5AC8FA', order: 15, show: canAway, group: 'Leaders' },
    { title: 'Feedback', sub: 'From the public feedback page', href: '#/x/feedback', icon: ic('<path d="M3 4.5h14v9H8l-4 3v-3H3z"/>'), color: '#FF9500', order: 31, show: isBishop, group: 'Leaders' },
    { title: 'Stake page', sub: 'Stake leaders, links and events (public)', href: '#/x/stakepage', icon: ic('<path d="M3 17h14M5 17V9l5-4 5 4v8M8.5 17v-4h3v4"/>'), color: '#8E8E93', order: 33, show: () => WH.isBish(), group: 'Leaders' },
    { title: 'Substitute requests', sub: 'Teachers who need a substitute', href: '#/x/subs', icon: ic('<path d="M4 6h8M4 10h5M13 9l3 3-3 3M9 12h7"/>'), color: '#34C759', order: 11.7, show: () => WH.isBish() || WH.can('leader'), group: 'Leaders' },
    { title: 'Checklists', sub: 'Move-in, temple preparation, new convert, missions', href: '#/x/checklists', icon: ic('<path d="M4 5.5l1.5 1.5L8 4.5M4 11l1.5 1.5L8 10M10.5 6h6M10.5 11.5h6M4 16.5h12"/>'), color: '#30B0C7', order: 16, show: () => WH.isBish() || WH.can('leader'), group: 'Leaders' },
    { title: 'Church News', sub: 'This week\'s headlines', href: '#/x/news', icon: ic('<rect x="3" y="4" width="14" height="12" rx="2"/><path d="M6 7.5h8M6 10.5h8M6 13.5h5"/>'), color: '#1F3A93', order: 40, show: () => WH.isBish() || WH.can('leader') || WH.can('clerk') },
    { title: 'Youth Sunday agendas', sub: 'Class and quorum presidencies', href: '#/x/youthagenda', icon: ic('<rect x="4" y="3" width="12" height="14" rx="2"/><path d="M7 7h6M7 10h6M7 13h3"/>'), color: '#FF2D55', order: 13.5, show: canYouth, group: 'Leaders' },
    { title: 'Ward conference visits', sub: 'Which stake leader visits which class', href: '#/x/visits', icon: ic('<circle cx="10" cy="6" r="3"/><path d="M4 17c.7-3.5 3-5.5 6-5.5s5.3 2 6 5.5"/>'), color: '#5856D6', order: 33.5, show: () => WH.isBish() || WH.can('leader'), group: 'Leaders' },
    { title: 'Picture for a text', sub: 'Title, date and place on a picture', href: '#/x/graphic', icon: ic('<rect x="3" y="4" width="14" height="12" rx="2"/><circle cx="7.5" cy="8.5" r="1.5"/><path d="M3.5 14.5l4-4 3 3 2-2 4 3.5"/>'), color: '#AF52DE', order: 10.5, show: () => WH.isBish() || WH.can('leader') || WH.can('teacher') }
  );
  WH.sundayExtras.push({ title: 'Who\'s away this Sunday', href: d => '#/x/awayday/' + d, show: () => WH.isBish() || WH.can('music') || WH.can('clerk') });

  /* =========================================================================== 1. Tithing declaration */
  let TI = null, tiSeg = 'none';
  WH.routes.tithing = {
    view() {
      WH.screen('Tithing declaration', '', WH.skeleton(5), back);
      WH.call('tithingList', {}).then(d => { TI = d; tiDraw(); }).catch(err);
    }
  };
  const tiName = h => h.key + (h.adults.length ? ' · ' + h.adults.map(firstOf).join(' & ') : '');
  const tiLink = () => base() + 'book.html?with=Bishop';
  const tiMsg = h => `Hi ${h.adults.map(firstOf).join(' and ')}, Bishop ${String(TI.bishop || '').split(' ').pop()} invites your family to tithing declaration this year. Please pick a time that works for you: ${tiLink()}`;
  function tiDraw() {
    const { esc, fmt } = WH, c = TI.counts;
    const state = h => h.state === 'done' ? '<span class="chip green">Declared</span>' : h.state === 'booked' ? `<span class="chip blue">${esc(fmt(h.date))}</span>` : h.state === 'noshow' ? '<span class="chip orange">Missed</span>' : '<span class="chip">Not yet</span>';
    const pick = TI.households.filter(h => tiSeg === 'all' || (tiSeg === 'none' ? (h.state === 'none' || h.state === 'noshow') : h.state === tiSeg));
    let h = `<div class="list">${WH.kv('Declared', String(c.done))}${WH.kv('Booked', String(c.booked))}${WH.kv('Not yet scheduled', String(c.none))}${WH.kv('Open booking times', String(TI.openTimes))}</div>`;
    h += `<div class="btns"><button class="btn gray" data-act="tiShare">Share booking link</button><button class="btn gray" data-go="#/x/appointments">Open times</button></div>`;
    h += `<div class="seg">${[['none', 'Not yet'], ['booked', 'Booked'], ['done', 'Declared'], ['all', 'All']].map(([k, l]) => `<button class="${tiSeg === k ? 'on' : ''}" data-act="tiSeg" data-v="${k}">${l}</button>`).join('')}</div>`;
    h += `<div class="list">${pick.map(x => `<button class="row" data-act="tiOpen" data-k="${esc(x.key)}"><div class="main"><div class="t">${esc(tiName(x))}</div><div class="s">${x.state === 'booked' ? esc(fmt(x.date, { weekday: 'short', month: 'short', day: 'numeric' }) + (x.time ? ' · ' + x.time : '') + (x.with ? ' · ' + x.with : '')) : x.state === 'done' ? (x.marked ? 'Marked declared' : 'Met ' + esc(fmt(x.date))) : x.phones.length ? 'Tap to text an invitation' : 'No phone on file'}</div></div>${state(x)}${WH.I.chev}</button>`).join('') || '<div class="empty">No one here.</div>'}</div>`;
    if (TI.unmatched.length) h += `<div class="section-h"><span>Booked, name not on the ward list</span></div><div class="list">${TI.unmatched.map(u => `<div class="row"><div class="main"><div class="t">${esc(u.person)}</div><div class="s">${esc(fmt(u.date) + (u.time ? ' · ' + u.time : ''))}</div></div></div>`).join('')}</div>`;
    h += `<div class="btns"><button class="btn gray" data-act="tiPrint">Print the list</button></div><p class="foot">Households come from People. Times come from Appointments (Open booking times › For: Tithing). Only the bishop and executive secretary see this. ${TI.year}</p>`;
    $b().innerHTML = h;
  }
  Object.assign(WH.act, {
    tiSeg(el) { tiSeg = el.dataset.v; tiDraw(); },
    tiShare() { share('Tithing declaration: book a time with the bishop', tiLink()); },
    tiOpen(el) {
      const h = TI.households.find(x => x.key === el.dataset.k); if (!h) return; const { esc, fmt } = WH;
      const txt = h.state !== 'done' && h.phones.length ? textBtn(h.phones, tiMsg(h), h.state === 'booked' ? 'Text a reminder' : 'Text an invitation') : '';
      WH.openSheet(`<header><span style="min-width:64px"></span><h2>${esc(h.key)}</h2><button class="link r" data-act="close">Done</button></header>
        <div class="list">${WH.kv('Adults', h.adults.join(', '))}${h.kids ? WH.kv('Children', h.kids) : ''}${WH.kv('Status', h.state === 'done' ? 'Declared' : h.state === 'booked' ? 'Booked ' + fmt(h.date) + (h.time ? ' ' + h.time : '') : h.state === 'noshow' ? 'Missed their time' : 'Not yet scheduled')}</div>
        ${txt ? `<div class="btns">${txt}</div><p class="foot">The text includes the booking link. Children are never texted.</p>` : ''}
        <div class="btns">${h.state === 'done' && h.marked ? '<button class="btn gray" id="tiUndo">Undo "declared"</button>' : h.state !== 'done' ? '<button class="btn gray" id="tiDone">Mark declared (met another way)</button>' : ''}</div>`);
      const go = async done => { try { await WH.call('tithingMark', { household: h.key, done }); WH.closeSheet(); WH.routes.tithing.view(); } catch (e) { WH.toast(e.message); } };
      const d = document.getElementById('tiDone'), u = document.getElementById('tiUndo'); if (d) d.onclick = () => go(true); if (u) u.onclick = () => go(false);
    },
    tiPrint() {
      const { esc, fmt } = WH, st = h => h.state === 'done' ? 'Declared' : h.state === 'booked' ? fmt(h.date, { weekday: 'short', month: 'short', day: 'numeric' }) + (h.time ? ' ' + h.time : '') : h.state === 'noshow' ? 'Missed' : '';
      const rows = TI.households.map(h => `<tr><td style="width:18px">☐</td><td><b>${esc(h.key)}</b></td><td>${esc(h.adults.join(', '))}</td><td>${esc(st(h))}</td></tr>`).join('');
      printHtml(`<div style="font:10.5pt/1.35 -apple-system,Arial,sans-serif"><div style="font:18pt Georgia,serif">Tithing declaration ${esc(TI.year)}</div><div style="color:#555;margin:2px 0 10px">${esc(TI.ward || '')} · ${TI.counts.done} declared · ${TI.counts.booked} booked · ${TI.counts.none} not yet</div>
        <table style="width:100%;border-collapse:collapse">${rows.replace(/<td/g, '<td style="border-top:1px solid #ccc;padding:3px 6px 3px 0;vertical-align:top"')}</table><p style="color:#777;font-size:9pt;margin-top:10px">Confidential. Shred when the season is over.</p></div>`);
    }
  });

  /* =========================================================================== 2. Ministering interviews */
  let MI = null, miOrg = '';
  WH.routes.ministering = {
    view() {
      WH.screen('Ministering interviews', '', WH.skeleton(6), back);
      WH.call('ministering', { org: miOrg }).then(d => { MI = d; miOrg = d.org; miDraw(); }).catch(err);
    }
  };
  function miDraw() {
    const { esc, fmt } = WH;
    let h = MI.orgs.length > 1 ? `<div class="seg">${MI.orgs.map(o => `<button class="${o === MI.org ? 'on' : ''}" data-act="miOrg" data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div>` : '';
    h += `<div class="section-h big"><span>${esc(MI.quarterName)}</span><span class="chip ${MI.counts.done === MI.counts.total && MI.counts.total ? 'green' : 'blue'}">${MI.counts.done} of ${MI.counts.total}</span></div>`;
    const by = {}; MI.ministers.forEach(m => (by[m.group || ''] = by[m.group || ''] || []).push(m));
    Object.keys(by).forEach(g => {
      h += `<div class="section-h"><span>${esc(g || 'No district')}</span><span>${by[g].filter(m => m.done).length}/${by[g].length}</span></div><div class="list">${by[g].map(m => `<button class="row" data-act="miOpen" data-n="${esc(m.name)}"><div class="main"><div class="t">${esc(m.name)}</div><div class="s">${m.last ? 'Last: ' + esc(fmt(m.last, { month: 'short', day: 'numeric', year: 'numeric' })) + (m.by ? ' · ' + esc(m.by) : '') : 'No interview yet'}</div></div>${m.done ? '<span class="chip green">Done</span>' : '<span class="chip">Not yet</span>'}${WH.I.chev}</button>`).join('')}</div>`;
    });
    if (!MI.ministers.length) h += `<div class="list"><div class="empty">${MI.org === 'Relief Society' ? 'Add the sisters who minister, each with her district or companionship.' : 'No one on the list yet.'}</div></div>`;
    h += `<div class="btns"><button class="btn gray" data-act="miAdd">${WH.I.plus} Add to the list</button></div>`;
    h += `<p class="foot">${MI.kind === 'Zone' ? 'The list is the elders quorum zones. Adding someone here starts your own ministering list instead.' : 'Your ministering list, by district or companionship.'} Notes are private: ${MI.canNotes ? 'only your presidency and the bishop see them.' : 'only the presidency and the bishop see them.'} Still record interviews in LCR (Ministering › Current Assignments).</p>`;
    $b().innerHTML = h;
  }
  Object.assign(WH.act, {
    miOrg(el) { miOrg = el.dataset.o; WH.routes.ministering.view(); },
    async miAdd() {
      await WH.loadNames(); const groups = [...new Set(MI.ministers.map(m => m.group).filter(Boolean))];
      WH.form('Add to the list', [{ name: 'person', label: 'Name', list: 'people' }, { name: 'group', label: 'District or companionship', ph: groups[0] || 'District 1' }], {},
        async row => { await WH.call('ministerGroup', Object.assign({ org: MI.org }, row)); WH.routes.ministering.view(); });
    },
    miOpen(el) {
      const m = MI.ministers.find(x => x.name === el.dataset.n); if (!m) return; const { esc, fmt } = WH;
      const ask = `Hi ${firstOf(m.name)}, this is ${firstOf(me().name)} from the ${MI.org === 'Relief Society' ? 'Relief Society' : 'elders quorum'} presidency. Could we find a time this month for your ministering interview? It's a short visit about the people you minister to and how we can help. What days work for you?`;
      WH.openSheet(`<header><span style="min-width:64px"></span><h2>${esc(m.name)}</h2><button class="link r" data-act="close">Done</button></header>
        <div class="list">${WH.kv('District', m.group)}${WH.kv('Last interview', m.last ? fmt(m.last, { month: 'long', day: 'numeric', year: 'numeric' }) : '')}${WH.kv('This quarter', m.done ? 'Done' : 'Not yet')}</div>
        ${m.note ? `<div class="section-h"><span>Last note (private)</span></div><div class="list"><div class="row wrap"><div class="main"><div class="s" style="color:var(--text);white-space:pre-wrap">${esc(m.note)}</div></div></div></div>` : ''}
        ${!m.done ? `<div class="section-h"><span>Mark done</span></div><div class="list"><div class="field"><label>Date</label><input type="date" id="miD" value="${WH.ymd(WH.today())}"></div><div class="field col"><label>Short note (private)</label><textarea id="miN" placeholder="Anything to follow up on"></textarea></div></div><div class="btns"><button class="btn" id="miGo">Interview done</button></div>` : `<div class="btns"><button class="btn gray" id="miUndo">Undo this quarter's interview</button></div>`}
        ${!m.done && m.phone ? `<div class="btns">${textBtn([m.phone], ask, 'Text to set a time', 'gray')}</div>` : ''}
        ${MI.kind === 'Ministering' ? '<div class="btns"><button class="btn red" id="miRm">Take off the list</button></div>' : ''}`);
      const g = document.getElementById('miGo'); if (g) g.onclick = async () => { try { const d = document.getElementById('miD').value; if (d && quarterOf(d) !== MI.quarter && !confirm('That date is in another quarter. Save it anyway?')) return; await WH.call('ministerMark', { org: MI.org, name: m.name, date: d, note: document.getElementById('miN').value }); WH.closeSheet(); WH.toast('Saved. Remember LCR too.', true); WH.routes.ministering.view(); } catch (e) { WH.toast(e.message); } };
      const u = document.getElementById('miUndo'); if (u) u.onclick = async () => { try { await WH.call('ministerMark', { org: MI.org, undo: true, id: m.doneId }); WH.closeSheet(); WH.routes.ministering.view(); } catch (e) { WH.toast(e.message); } };
      const r = document.getElementById('miRm'); if (r) r.onclick = async () => { if (!confirm('Take ' + m.name + ' off the list?')) return; try { await WH.call('ministerGroup', { org: MI.org, person: m.name, remove: true }); WH.closeSheet(); WH.routes.ministering.view(); } catch (e) { WH.toast(e.message); } };
    }
  });

  /* =========================================================================== 3. Away dates */
  let AW = null;
  WH.routes.away = {
    view() {
      WH.screen('Away dates', 'Sunday planning warns when someone assigned is away', WH.skeleton(4), Object.assign({ right: `<button class="btn small" data-act="awNew">${WH.I.plus} Add</button>` }, back));
      WH.call('awayList', {}).then(d => { AW = d; awDraw(); }).catch(err);
    }
  };
  const awWhen = a => a.To && a.To !== a.From ? WH.fmt(a.From, { weekday: 'short', month: 'short', day: 'numeric' }) + ' – ' + WH.fmt(a.To, { weekday: 'short', month: 'short', day: 'numeric' }) : WH.fmt(a.From, { weekday: 'short', month: 'short', day: 'numeric' });
  function awDraw() {
    const { esc } = WH, mine = AW.list.filter(a => a.mine), rest = AW.list.filter(a => !a.mine);
    const row = a => `<button class="row" ${a.mine || AW.canAll ? `data-act="awEdit" data-id="${esc(a.ID)}"` : ''}><div class="main"><div class="t">${esc(a.mine ? awWhen(a) : a.Person)}</div><div class="s">${esc(a.mine ? (a.Note || '') : awWhen(a) + (a.Note ? ' · ' + a.Note : ''))}</div></div>${a.mine || AW.canAll ? WH.I.chev : ''}</button>`;
    $b().innerHTML = `<div class="section-h"><span>You</span></div><div class="list">${mine.map(row).join('') || '<div class="empty">You haven\'t marked any days away.</div>'}</div>
      <div class="section-h"><span>Others</span></div><div class="list">${rest.map(row).join('') || '<div class="empty">No one else is away soon.</div>'}</div>`;
  }
  const awFields = () => [{ name: 'from', label: 'First day', type: 'date' }, { name: 'to', label: 'Last day', type: 'date' }, { name: 'note', label: 'Note', ph: 'e.g. Family trip' }].concat(AW && AW.canAll ? [{ name: 'person', label: 'Who (blank = me)', list: 'people' }] : []);
  Object.assign(WH.act, {
    async awNew() { if (AW && AW.canAll) await WH.loadNames(); WH.form('Away', awFields(), { from: WH.nextSun(), to: WH.nextSun() }, async row => { await WH.call('awaySave', row); WH.routes.away.view(); }); },
    async awEdit(el) {
      const a = AW.list.find(x => x.ID === el.dataset.id); if (!a) return; if (AW.canAll) await WH.loadNames();
      WH.form('Away', awFields(), { from: a.From, to: a.To, note: a.Note, person: a.mine ? '' : a.Person }, async row => { if (!row.person) row.person = a.Person; await WH.call('awaySave', Object.assign({ id: a.ID }, row)); WH.routes.away.view(); },
        async () => { await WH.call('awayRemove', { id: a.ID }); WH.routes.away.view(); });
    }
  });
  /* For the Sunday screen: WH.awayWarnings(date) → Promise of HTML ('' when everyone is here). */
  WH.awayWarnings = async date => {
    try {
      const d = await WH.call('awayFor', { date }); if (!d.warnings.length) return '';
      return `<div class="list" style="background:var(--red-tint, #fdecea)">${d.warnings.map(w => `<div class="row wrap"><div class="main"><div class="t">${WH.esc(w.text)}</div></div></div>`).join('')}</div>`;
    } catch (e) { return ''; }
  };
  WH.routes.awayday = {
    view(args) {
      const date = args && args[0] ? decodeURIComponent(args[0]) : WH.nextSun();
      WH.screen('Who\'s away', WH.long(date), WH.skeleton(3), { back: '#/sunday/' + date, backLabel: 'Sunday' });
      WH.call('awayFor', { date }).then(d => {
        const { esc } = WH;
        $b().innerHTML = (d.warnings.length ? `<div class="section-h"><span>Needs a change</span></div><div class="list">${d.warnings.map(w => `<div class="row wrap"><div class="main"><div class="t">${esc(w.text)}</div></div><span class="chip red">${esc(w.role)}</span></div>`).join('')}</div>` : '<div class="list"><div class="empty">No one assigned this Sunday is away.</div></div>')
          + `<div class="section-h"><span>Away that day</span></div><div class="list">${d.away.map(a => `<div class="row"><div class="main"><div class="t">${esc(a.person)}</div><div class="s">${esc(awWhen({ From: a.from, To: a.to }))}${a.note ? ' · ' + esc(a.note) : ''}</div></div></div>`).join('') || '<div class="empty">No one.</div>'}</div>
          <div class="btns"><button class="btn gray" data-go="#/x/away">Away dates</button></div>`;
      }).catch(err);
    }
  };

  /* =========================================================================== 4. Feedback (bishop only) */
  let FB = null;
  WH.routes.feedback = {
    view() {
      WH.screen('Feedback', 'Only you see these', WH.skeleton(4), back);
      WH.call('feedbackList', {}).then(d => { FB = d; fbDraw(); }).catch(err);
    }
  };
  function fbDraw() {
    const { esc } = WH, url = base() + 'feedback.html';
    $b().innerHTML = `<div class="list">${FB.list.map(f => `<button class="row wrap" data-act="fbOpen" data-id="${esc(f.ID)}"><div class="main"><div class="t" style="${f.Status === 'New' ? 'font-weight:600' : ''}">${esc(String(f.Text).slice(0, 120))}${String(f.Text).length > 120 ? '…' : ''}</div><div class="s">${esc(f.From || 'Anonymous')} · ${esc(WH.fmt(String(f.When).slice(0, 10)))}</div></div><span class="chip ${f.Status === 'New' ? 'blue' : f.Status === 'Done' ? 'green' : ''}">${esc(f.Status || 'New')}</span></button>`).join('') || '<div class="empty">No feedback yet.</div>'}</div>
      <div class="btns"><button class="btn gray" data-act="fbShare" data-url="${esc(url)}">Share the feedback page</button></div><p class="foot">Members can write with or without their name. It comes only to you.</p>`;
  }
  Object.assign(WH.act, {
    fbShare(el) { share('Feedback for the bishop', el.dataset.url); },
    fbOpen(el) {
      const f = FB.list.find(x => x.ID === el.dataset.id); if (!f) return; const { esc } = WH;
      if (f.Status === 'New') { f.Status = 'Read'; WH.call('feedbackSet', { id: f.ID, status: 'Read' }).catch(() => { }); fbDraw(); }
      WH.openSheet(`<header><span style="min-width:64px"></span><h2>Feedback</h2><button class="link r" data-act="close">Done</button></header>
        <div class="list"><div class="row wrap"><div class="main"><div class="t" style="white-space:pre-wrap">${esc(f.Text)}</div></div></div>${WH.kv('From', f.From || 'Anonymous')}${f.Contact ? WH.kv('Contact', f.Contact) : ''}${WH.kv('When', String(f.When).replace('T', ' '))}</div>
        <div class="seg">${['New', 'Read', 'Done'].map(s => `<button class="${f.Status === s ? 'on' : ''}" data-act="fbSet" data-id="${esc(f.ID)}" data-s="${s}">${s}</button>`).join('')}</div>
        <div class="btns"><button class="btn red" data-act="fbRm" data-id="${esc(f.ID)}">Delete</button></div>`);
    },
    async fbSet(el) { try { await WH.call('feedbackSet', { id: el.dataset.id, status: el.dataset.s }); WH.closeSheet(); WH.routes.feedback.view(); } catch (e) { WH.toast(e.message); } },
    async fbRm(el) { if (!confirm('Delete this feedback?')) return; try { await WH.call('feedbackSet', { id: el.dataset.id, remove: true }); WH.closeSheet(); WH.routes.feedback.view(); } catch (e) { WH.toast(e.message); } }
  });

  /* =========================================================================== 5. Stake page settings */
  WH.routes.stakepage = {
    view() {
      WH.screen('Stake page', 'A public page for members', WH.skeleton(4), back);
      WH.call('stakeSettings', {}).then(d => {
        const { esc } = WH, url = base() + 'stake.html';
        $b().innerHTML = `<div class="list"><div class="field"><label style="flex:1">Show the stake page</label><span class="toggle"><input type="checkbox" id="spOn" ${d.page ? 'checked' : ''}><span></span></span></div>
          <div class="field col"><label>Stake leaders (one per line: Calling: Name)</label><textarea id="spL" rows="6" placeholder="Stake President: First Last">${esc(d.leaders)}</textarea></div>
          <div class="field col"><label>Links (one per line: Title | https://…)</label><textarea id="spK" rows="5" placeholder="Stake website | https://…">${esc(d.links)}</textarea></div></div>
          <div class="btns"><button class="btn" data-act="spSave">Save</button><button class="btn gray" data-act="spShare" data-url="${esc(url)}">Share</button></div>
          <p class="foot">The page is public: names only, no phone numbers. Upcoming stake events are the Stake items on the calendar marked Public (${(d.preview.events || []).length} now).</p>`;
      }).catch(err);
    }
  };
  Object.assign(WH.act, {
    async spSave() { try { await WH.call('stakeSettings', { save: { stake_page: document.getElementById('spOn').checked ? 'Yes' : 'No', stake_leaders: document.getElementById('spL').value, stake_links: document.getElementById('spK').value } }); WH.toast('Saved', true); } catch (e) { WH.toast(e.message); } },
    spShare(el) { share('Our stake', el.dataset.url); }
  });

  /* =========================================================================== 6. Substitute requests */
  let SB = null;
  WH.routes.subs = {
    view() {
      WH.screen('Substitute requests', '', WH.skeleton(4), back);
      WH.call('subs', {}).then(d => { SB = d; sbDraw(); }).catch(err);
    }
  };
  const sbLink = (org, cls) => base() + 'sub.html?c=' + encodeURIComponent(cls) + '&o=' + encodeURIComponent(org);
  function sbDraw() {
    const { esc, fmt } = WH, open = SB.list.filter(s => s.Status === 'Asked'), past = SB.list.filter(s => s.Status !== 'Asked');
    const row = s => `<button class="row" data-act="sbOpen" data-id="${esc(s.ID)}"><div class="main"><div class="t">${esc(s.Class)} · ${esc(fmt(s.Date, { weekday: 'short', month: 'short', day: 'numeric' }))}</div><div class="s">${esc(s.Teacher)}${s.Status === 'Found' ? ' → ' + esc(s.Substitute) : ''}${s.Note ? ' · ' + esc(s.Note) : ''}</div></div><span class="chip ${s.Status === 'Asked' ? 'orange' : s.Status === 'Found' ? 'green' : ''}">${esc(s.Status === 'Asked' ? 'Needs one' : s.Status)}</span>${WH.I.chev}</button>`;
    let h = `<div class="section-h big"><span>Needs a substitute</span></div><div class="list">${open.map(row).join('') || '<div class="empty">No open requests.</div>'}</div>`;
    if (past.length) h += `<div class="section-h"><span>Recent</span></div><div class="list">${past.map(row).join('')}</div>`;
    h += `<div class="section-h big"><span>Links for teachers</span></div><p class="foot" style="margin-top:-4px">Send each teacher their class's link (or put it in your newsletter). They pick the Sunday; it lands on your Today list.</p>`;
    SB.orgs.forEach(o => { const cl = (SB.info[o] || {}).classes || []; if (!cl.length) return; h += `<div class="section-h"><span>${esc(o)}</span></div><div class="list">${cl.map(c => `<button class="row" data-act="sbShare" data-url="${esc(sbLink(o, c))}" data-c="${esc(c)}"><div class="main"><div class="t">${esc(c)}</div></div><span class="chip blue">Share</span></button>`).join('')}</div>`; });
    $b().innerHTML = h;
  }
  Object.assign(WH.act, {
    sbShare(el) { share('Need a substitute for ' + el.dataset.c + '?', el.dataset.url); },
    sbOpen(el) {
      const s = SB.list.find(x => x.ID === el.dataset.id); if (!s) return; const { esc, fmt } = WH, info = SB.info[s.Organization] || { presidency: [], teachers: [] };
      const day = fmt(s.Date, { weekday: 'long', month: 'long', day: 'numeric' });
      const toPres = `${s.Teacher} needs a substitute for ${s.Class} on ${day}.${s.Note ? ' (' + s.Note + ')' : ''} Do you know someone who could teach?`;
      const ask = n => `Hi ${firstOf(n)}, could you substitute in ${s.Class} on ${day}? ${firstOf(s.Teacher)} can't be there and I can send you the lesson. Thank you!`;
      const toTeacher = `Hi ${firstOf(s.Teacher)}, we got your request for a substitute for ${s.Class} on ${day}. We'll let you know who will teach.`;
      WH.openSheet(`<header><span style="min-width:64px"></span><h2>${esc(s.Class)}</h2><button class="link r" data-act="close">Done</button></header>
        <div class="list">${WH.kv('Sunday', day)}${WH.kv('Teacher', s.Teacher)}${s.Note ? WH.kv('Note', s.Note) : ''}${s.Status === 'Found' ? WH.kv('Substitute', s.Substitute) : ''}</div>
        <div class="btns">${s.phone ? textBtn([s.phone], toTeacher, 'Text ' + firstOf(s.Teacher), 'gray') : ''}${info.presidency.length ? textBtn(info.presidency.map(p => p.p), toPres, 'Text the presidency', 'gray') : ''}</div>
        ${s.Status === 'Asked' && info.teachers.length ? `<div class="section-h"><span>Ask a substitute</span></div><div class="list">${info.teachers.filter(t => t.n !== s.Teacher).slice(0, 30).map(t => `<div class="row"><div class="main"><div class="t">${esc(t.n)}</div><div class="s">${esc(t.cls)}</div></div><a class="btn small" style="text-decoration:none" href="${esc(sms([t.p], ask(t.n)))}">Text</a></div>`).join('')}</div>` : ''}
        <div class="btns">${s.Status !== 'Found' ? '<button class="btn" id="sbFound">Found a substitute</button>' : ''}${s.Status === 'Asked' ? '<button class="btn gray" id="sbCancel">No longer needed</button>' : '<button class="btn gray" id="sbReopen">Still needs one</button>'}</div>
        <p class="foot">When you save who will teach, the lesson schedule updates and the task leaves Today.</p>`);
      const set = async (status, substitute) => { try { await WH.call('subSet', { id: s.ID, status, substitute }); WH.closeSheet(); WH.store.del('c:today'); WH.routes.subs.view(); } catch (e) { WH.toast(e.message); } };
      const f = document.getElementById('sbFound'); if (f) f.onclick = async () => { await WH.loadNames(); WH.form('Who will teach?', [{ name: 'sub', label: 'Substitute', list: 'people' }], {}, async row => { await WH.call('subSet', { id: s.ID, status: 'Found', substitute: row.sub }); WH.store.del('c:today'); WH.routes.subs.view(); }); };
      const c = document.getElementById('sbCancel'); if (c) c.onclick = () => set('Cancelled');
      const r = document.getElementById('sbReopen'); if (r) r.onclick = () => set('Asked');
    }
  });

  /* =========================================================================== 7. Checklists */
  let CK = null;
  WH.routes.checklists = {
    view() {
      WH.screen('Checklists', '', WH.skeleton(4), Object.assign({ right: `<button class="btn small" data-act="ckNew">${WH.I.plus} Start</button>` }, back));
      WH.call('checklists', {}).then(d => { CK = d; ckDraw(); }).catch(err);
    }
  };
  function ckDraw() {
    const { esc } = WH, open = CK.lists.filter(c => c.Status !== 'Done'), done = CK.lists.filter(c => c.Status === 'Done');
    const row = c => `<button class="row" data-go="#/x/checklist/${encodeURIComponent(c.ID)}"><div class="main"><div class="t">${esc(c.Person)}</div><div class="s">${esc(c.Checklist)} · ${esc(c.Organization)}</div></div><span class="chip ${c.done === c.total ? 'green' : 'blue'}">${c.done}/${c.total}</span>${WH.I.chev}</button>`;
    let h = `<div class="list">${open.map(row).join('') || '<div class="empty">Nothing in progress. Tap Start for a move-in, temple preparation, new convert or mission.</div>'}</div>`;
    if (done.length) h += `<div class="section-h"><span>Finished</span></div><div class="list">${done.map(row).join('')}</div>`;
    if (CK.canTemplates) h += `<div class="section-h big"><span>Checklists offered</span><button class="link" style="font-size:15px" data-act="ckTpl">Add</button></div><div class="list">${CK.templates.map(t => `<button class="row" data-act="ckTpl" data-id="${esc(t.ID)}"><div class="main"><div class="t">${esc(t.Name)}</div><div class="s">${esc(t.Organization)} · ${t.steps} steps</div></div>${WH.I.chev}</button>`).join('')}</div>`;
    h += '<p class="foot">The bishopric sees every checklist; each organization sees its own.</p>';
    $b().innerHTML = h;
  }
  Object.assign(WH.act, {
    async ckNew() {
      if (!CK) return; await WH.loadNames();
      WH.form('Start a checklist', [{ name: 'template', label: 'Checklist', type: 'select', options: CK.templates.map(t => t.Name) }, { name: 'person', label: 'For', list: 'people' }, { name: 'org', label: 'Organization', type: 'select', options: CK.orgs }], { template: (CK.templates[0] || {}).Name, org: CK.orgs[0] },
        async row => { const t = CK.templates.find(x => x.Name === row.template); if (!t) throw new Error('Pick a checklist.'); const r = await WH.call('checklistStart', { template: t.ID, person: row.person, org: row.org || t.Organization }); location.hash = '#/x/checklist/' + encodeURIComponent(r.id); });
    },
    ckTpl(el) {
      const t = el.dataset.id ? CK.templates.find(x => x.ID === el.dataset.id) : { Organization: 'Bishopric' };
      WH.form(t.ID ? 'Checklist' : 'New checklist', [{ name: 'Name' }, { name: 'Organization', type: 'select', options: CK.orgs }, { name: 'Steps', label: 'Steps (one per line)', type: 'textarea' }], t,
        async row => { if (t.ID) row.ID = t.ID; await WH.call('checklistTemplateSave', { row }); WH.routes.checklists.view(); },
        t.ID ? async () => { await WH.call('checklistTemplateSave', { id: t.ID, remove: true }); WH.routes.checklists.view(); } : null);
    }
  });
  WH.routes.checklist = {
    view(args) {
      const id = decodeURIComponent((args || [])[0] || '');
      WH.screen('Checklist', '', WH.skeleton(5), { back: '#/x/checklists', backLabel: 'Checklists' });
      WH.call('checklists', {}).then(d => { CK = d; const c = d.lists.find(x => x.ID === id); if (!c) throw new Error('Not found'); ckOne(c); }).catch(err);
    }
  };
  function ckOne(c) {
    const { esc, fmt } = WH;
    $b().innerHTML = `<div class="section-h big"><span>${esc(c.Person)}</span><span class="chip ${c.Status === 'Done' ? 'green' : 'blue'}">${c.Steps.filter(s => s.on).length}/${c.Steps.length}</span></div><p class="foot" style="margin-top:-4px">${esc(c.Checklist)} · ${esc(c.Organization)} · started ${esc(fmt(c.Started))}${c['Started by'] ? ' by ' + esc(c['Started by']) : ''}</p>
      <div class="list">${c.Steps.map((s, i) => `<div class="row ${s.on ? 'done' : ''}" role="button" style="cursor:pointer" data-act="ckTick" data-id="${esc(c.ID)}" data-i="${i}" data-on="${s.on ? 1 : 0}"><span class="check ${s.on ? 'on' : ''}"></span><div class="main"><div class="t">${esc(s.t)}</div>${s.on ? `<div class="s">${esc(s.by)} · ${esc(fmt(s.on))}</div>` : ''}</div></div>`).join('')}</div>
      <div class="list" style="margin-top:12px"><div class="field col"><label>Notes</label><textarea id="ckN" placeholder="Dates, who is helping…">${esc(c.Notes || '')}</textarea></div></div>
      <div class="btns"><button class="btn gray" data-act="ckNote" data-id="${esc(c.ID)}">Save notes</button><button class="btn red" data-act="ckRm" data-id="${esc(c.ID)}">Remove</button></div>`;
  }
  Object.assign(WH.act, {
    async ckTick(el) {
      const c = CK.lists.find(x => x.ID === el.dataset.id), i = +el.dataset.i, on = el.dataset.on !== '1';
      try { const r = await WH.call('checklistTick', { id: c.ID, i, done: on }); c.Steps = r.steps; c.Status = r.status; ckOne(c); if (r.status === 'Done') WH.toast('All done', true); } catch (e) { WH.toast(e.message); }
    },
    async ckNote(el) { try { await WH.call('checklistNote', { id: el.dataset.id, notes: document.getElementById('ckN').value }); WH.toast('Saved', true); } catch (e) { WH.toast(e.message); } },
    async ckRm(el) { if (!confirm('Remove this checklist?')) return; try { await WH.call('checklistRemove', { id: el.dataset.id }); location.hash = '#/x/checklists'; } catch (e) { WH.toast(e.message); } }
  });

  /* =========================================================================== 8. Church News */
  WH.routes.news = {
    view() {
      WH.screen('Church News', 'This week in Church News', WH.skeleton(5), back);
      WH.cached('x2news', 'churchNews', {}, d => {
        if (!d) return; if (d.error) { err(d); return; }
        const { esc } = WH;
        $b().innerHTML = `<div class="list">${d.items.map(x => `<button class="row wrap" data-act="openUrl" data-url="${esc(x.link)}"><div class="main"><div class="t">${esc(x.title)}</div>${x.date ? `<div class="s">${esc(x.date)}</div>` : ''}</div>${WH.I.chev}</button>`).join('') || '<div class="empty">No headlines right now. Try again later.</div>'}</div><p class="foot">Headlines and links from the Church News. The top three also go in the Monday bishopric email.</p>`;
      });
    }
  };

  /* =========================================================================== 9. Youth class agendas */
  let YA = null, yaCls = '', yaDate = '';
  WH.routes.youthagenda = {
    view() {
      WH.screen('Youth Sunday agendas', '', WH.skeleton(5), back);
      WH.call('youthAgendas', { date: yaDate }).then(d => { YA = d; yaDate = d.date; yaDraw(); }).catch(err);
    }
  };
  const YA_F = [['Conducting', 'Who conducts'], ['Opening prayer', 'Who'], ['Spiritual thought', 'Who, and on what'], ['Business', 'Activities, service, invitations…'], ['Lesson', 'Topic and who teaches'], ['Closing prayer', 'Who'], ['Notes', '']];
  const yaKey = c => c.org + '|' + c.cls;
  function yaText(c) { const r = c.row; return `${c.cls} · ${WH.fmt(YA.date, { weekday: 'long', month: 'long', day: 'numeric' })}\n` + YA_F.filter(([k]) => r[k]).map(([k]) => `${k}: ${r[k]}`).join('\n'); }
  function yaDraw() {
    const { esc, fmt } = WH; if (!YA.classes.find(c => yaKey(c) === yaCls)) yaCls = yaKey(YA.classes[0]);
    const c = YA.classes.find(x => yaKey(x) === yaCls), r = c.row;
    let h = `<div class="seg" style="flex-wrap:wrap">${YA.sundays.map(d => `<button class="${d === YA.date ? 'on' : ''}" data-act="yaDate" data-d="${d}">${esc(fmt(d))}</button>`).join('')}</div>`;
    if (YA.classes.length > 1) h += `<div class="seg" style="flex-wrap:wrap">${YA.classes.map(x => `<button class="${yaKey(x) === yaCls ? 'on' : ''}" data-act="yaCls" data-k="${esc(yaKey(x))}">${esc(x.cls)}</button>`).join('')}</div>`;
    h += `<datalist id="dl-ya">${c.names.map(n => `<option value="${esc(n)}">`).join('')}</datalist>`;
    h += `<div class="section-h big"><span>${esc(c.cls)}</span><span class="chip ${c.saved ? 'green' : ''}" id="yaSt">${c.saved ? 'Saved' : 'Not saved yet'}</span></div><div class="list">` + YA_F.map(([k, ph]) => /Business|Lesson|Notes|thought/.test(k)
      ? `<div class="field col"><label>${esc(k)}</label><textarea class="yain" data-k="${esc(k)}" placeholder="${esc(ph)}">${esc(r[k] || '')}</textarea></div>`
      : `<div class="field"><label>${esc(k)}</label><input class="yain" data-k="${esc(k)}" list="dl-ya" value="${esc(r[k] || '')}" placeholder="${esc(ph)}"></div>`).join('') + '</div>';
    if (c.lastBusiness && !r.Business) h += `<p class="foot">Last time's business: ${esc(c.lastBusiness)}</p>`;
    h += `<div class="btns"><button class="btn gray" data-act="yaShare">Share the agenda</button></div><p class="foot">Changes save as you go. The class presidency, their advisers and the bishopric see this. Names only, never phone numbers.</p>`;
    $b().innerHTML = h;
    document.querySelectorAll('.yain').forEach(inp => inp.addEventListener('change', async () => {
      const row = { Date: YA.date, Organization: c.org, Class: c.cls }; row[inp.dataset.k] = inp.value.trim();
      try { await WH.call('youthAgendaSave', { row }); r[inp.dataset.k] = row[inp.dataset.k]; c.saved = true; const st = document.getElementById('yaSt'); if (st) { st.textContent = 'Saved'; st.className = 'chip green'; } WH.toast('Saved', true); } catch (e) { WH.toast(e.message); }
    }));
  }
  Object.assign(WH.act, {
    yaDate(el) { yaDate = el.dataset.d; WH.routes.youthagenda.view(); },
    yaCls(el) { yaCls = el.dataset.k; yaDraw(); },
    async yaShare() { const c = YA.classes.find(x => yaKey(x) === yaCls), t = yaText(c); try { if (navigator.share) await navigator.share({ text: t }); else { await navigator.clipboard.writeText(t); WH.toast('Copied', true); } } catch (e) { } }
  });

  /* =========================================================================== 10. Ward conference visits */
  let VI = null, viDate = '';
  WH.routes.visits = {
    view() {
      WH.screen('Ward conference visits', '', WH.skeleton(4), Object.assign({ right: '<span class="viadd"></span>' }, back));
      WH.call('visits', { date: viDate }).then(d => { VI = d; viDate = d.date; viDraw(); }).catch(err);
    }
  };
  function viDraw() {
    const { esc } = WH;
    document.querySelectorAll('.viadd').forEach(x => x.innerHTML = VI.canEdit ? `<button class="btn small" data-act="viNew">${WH.I.plus} Add</button>` : '');
    let h = `<div class="list"><div class="field"><label>Sunday</label><input type="date" id="viD" value="${esc(VI.date)}"></div></div>${VI.wardConference ? '' : '<p class="foot">This Sunday isn\'t marked Ward Conference on the Sunday plan.</p>'}`;
    h += `<div class="list" style="margin-top:12px">${VI.list.map(v => `<button class="row" ${VI.canEdit ? `data-act="viEdit" data-id="${esc(v.ID)}"` : ''}><div class="main"><div class="t">${esc(v.Meeting)}</div><div class="s">${esc([v.Time, v.Visitor, v.Host ? 'Host: ' + v.Host : ''].filter(Boolean).join(' · '))}</div></div>${VI.canEdit ? WH.I.chev : ''}</button>`).join('') || '<div class="empty">No visits planned for this Sunday.</div>'}</div>`;
    h += `<div class="btns"><button class="btn gray" data-act="viPrint">Print</button></div><p class="foot">${VI.canEdit ? 'Leaders see the visits to their own organization.' : 'The bishopric plans these.'}</p>`;
    $b().innerHTML = h;
    document.getElementById('viD').addEventListener('change', e => { viDate = e.target.value; WH.routes.visits.view(); });
  }
  const viFields = () => [{ name: 'Time', ph: '10:00 AM' }, { name: 'Meeting', list: 'vimeet' }, { name: 'Organization', type: 'select', options: [...new Set(VI.meetings.map(m => m.org))] }, { name: 'Visitor', list: 'vistake' }, { name: 'Host', list: 'people' }, { name: 'Notes', type: 'textarea' }];
  function viLists() {
    const { esc } = WH; let el = document.getElementById('dl-vimeet'); if (el) el.remove(); el = document.getElementById('dl-vistake'); if (el) el.remove();
    document.body.insertAdjacentHTML('beforeend', `<datalist id="dl-vimeet">${VI.meetings.map(m => `<option value="${esc(m.meeting)}">`).join('')}</datalist><datalist id="dl-vistake">${VI.stake.map(n => `<option value="${esc(n)}">`).join('')}</datalist>`);
  }
  Object.assign(WH.act, {
    async viNew() { await WH.loadNames(); viLists(); WH.form('Visit', viFields(), { Organization: 'Ward' }, async row => { row.Date = VI.date; const m = VI.meetings.find(x => x.meeting === row.Meeting); if (m && !row.Organization) row.Organization = m.org; await WH.call('save', { tab: 'Visits', row }); WH.routes.visits.view(); }); },
    async viEdit(el) {
      const v = VI.list.find(x => x.ID === el.dataset.id); await WH.loadNames(); viLists();
      WH.form('Visit', viFields(), v, async row => { row.ID = v.ID; row.Date = v.Date; await WH.call('save', { tab: 'Visits', row }); WH.routes.visits.view(); }, async () => { await WH.call('remove', { tab: 'Visits', id: v.ID }); WH.routes.visits.view(); });
    },
    viPrint() {
      const { esc } = WH;
      printHtml(`<div style="font:11pt/1.4 -apple-system,Arial,sans-serif"><div style="font:18pt Georgia,serif">Ward conference visits</div><div style="color:#555;margin:2px 0 12px">${esc(VI.ward || '')} · ${esc(WH.long(VI.date))}</div>
        <table style="width:100%;border-collapse:collapse"><tr style="text-align:left"><th>Time</th><th>Class or meeting</th><th>Stake visitor</th><th>Ward host</th><th>Notes</th></tr>${VI.list.map(v => `<tr>${[v.Time, v.Meeting, v.Visitor, v.Host, v.Notes].map(x => `<td style="border-top:1px solid #ccc;padding:5px 8px 5px 0;vertical-align:top">${esc(x || '')}</td>`).join('')}</tr>`).join('')}</table></div>`);
    }
  });

  /* =========================================================================== 11. Funerals: folded program and meal calculator */
  WH.ready.push(() => {
    const o = WH.routes.funerals && WH.routes.funerals.view; if (!o) return;
    WH.routes.funerals.view = function (args) {
      o.apply(this, arguments);
      const id = decodeURIComponent((args || [])[0] || ''); if (!id) return;
      const t = setInterval(() => {
        const b = $b(); if (!b || b.querySelector('.skeleton') || !b.querySelector('.btns')) return; clearInterval(t);
        if (b.querySelector('[data-act="fuBook"]')) return;
        b.querySelector('.btns').insertAdjacentHTML('afterend', `<div class="btns"><button class="btn gray" data-act="fuBook" data-id="${WH.esc(id)}">Folded program</button><button class="btn gray" data-act="fuMeal">Meal calculator</button></div>`);
      }, 150);
      setTimeout(() => clearInterval(t), 8000);
    };
  });
  const MEAL = [['Ham, sliced (pounds)', 3], ['Funeral potatoes (9×13 pans)', 12], ['Green salad (large bowls)', 15], ['Fruit or pasta salad (large bowls)', 15], ['Rolls (dozens)', 8], ['Desserts (9×13 pans or 2 dozen cookies)', 18], ['Drinks (gallons)', 8], ['Plates, cups, napkins, utensils (sets)', 1]];
  function mealDraw(n) {
    const { esc } = WH; n = Math.max(0, Math.min(2000, +n || 0));
    return `<div class="list">${MEAL.map(([k, s]) => WH.kv(k, String(Math.ceil(n / s)))).join('')}${WH.kv('Tables (8 to a table)', String(Math.ceil(n / 8)))}${WH.kv('Chairs', String(n ? n + 10 : 0))}</div>`;
  }
  Object.assign(WH.act, {
    fuMeal() {
      WH.openSheet(`<header><span style="min-width:64px"></span><h2>Meal calculator</h2><button class="link r" data-act="close">Done</button></header>
        <div class="list"><div class="field"><label>Guests at the meal</label><input id="fmN" inputmode="numeric" value="60"></div></div><div id="fmOut">${mealDraw(60)}</div>
        <p class="foot">A rule of thumb for the Relief Society: round up, and ask for a few extra desserts. Sign-up items are potatoes, salads, rolls and desserts.</p>`);
      document.getElementById('fmN').addEventListener('input', e => { document.getElementById('fmOut').innerHTML = mealDraw(e.target.value); });
    },
    async fuBook(el) {
      const label = el.textContent; el.innerHTML = '<span class="spin"></span>';
      try {
        const [d, hy] = await Promise.all([WH.call('funerals', {}), WH.call('list', { tabs: ['Hymns'] }).catch(() => ({ data: { Hymns: [] } }))]);
        const f = d.list.find(x => x.ID === el.dataset.id); if (!f) throw new Error('Not found');
        WH.toast('Print two-sided (flip on short edge), then fold');
        printHtml(fuBookHtml(f, d, hy.data.Hymns || []), 'size:letter landscape;margin:0');
      } catch (e) { WH.toast(e.message); }
      el.textContent = label;
    }
  });
  function fuBookHtml(f, d, hymns) {
    const e = s => WH.esc(s || ''), L = v => String(v || '').split('\n').map(s => s.trim()).filter(Boolean), title = {}; hymns.forEach(h => title[String(h.Number)] = h.Title);
    const hy = v => { const s = String(v || '').trim().replace(/^#/, ''); return /^\d+$/.test(s) ? [title[s] ? '“' + title[s] + '”' : 'Hymn ' + s, title[s] ? 'Hymn ' + s : ''] : [s ? '“' + s + '”' : '', '']; };
    const row = (a, b, c, must) => b || must ? `<div class="r"><span class="a">${e(a)}</span><span class="dots"></span><span class="b">${b ? e(b) : '______________'}${c ? `<em>${e(c)}</em>` : ''}</span></div>` : '';
    const order = `<div class="h">Order of Service</div>${row('Presiding', f.Presiding, '', 1)}${row('Conducting', f.Conducting, '', 1)}${row('Organist', f.Organist)}${row('Chorister', f.Chorister)}${row('Family prayer', f['Family prayer'])}<div class="gap"></div>
      ${row('Opening hymn', ...hy(f['Opening hymn']), 1)}${row('Invocation', f.Invocation, '', 1)}${row('Life sketch', f['Life sketch'])}
      ${L(f.Speakers).map(s => row('Speaker', s)).join('')}${L(f['Musical numbers']).map(s => row('Musical number', s)).join('')}
      ${row('Remarks', f.Conducting)}${row('Closing hymn', ...hy(f['Closing hymn']), 1)}${row('Benediction', f.Benediction, '', 1)}<div class="gap"></div>${row('Interment', f.Burial)}${row('Dedication of the grave', f['Dedication of the grave'])}`;
    const q = (d.quotes || [])[0];
    const front = `<div class="front"><div class="orn"></div><div class="kick">In Loving Memory</div><div class="nm">${e(f.Name)}</div><div class="orn"></div><div class="sv">${e(WH.long(f.Date))}${f.Time ? ' · ' + e(f.Time) : ''}<br>${e(f.Place || d.building || '')}</div></div>`;
    const backP = `<div class="back">${q ? `<div class="q">“${e(q.text)}”<div class="qr">${e(q.source)}</div></div>` : '<div class="orn"></div>'}<div class="mo">${e(d.ward || '')}</div></div>`;
    const inside = `${f.Viewing ? `<div class="h">Viewing</div><div class="c">${e(f.Viewing)}</div>` : ''}${f.Burial ? `<div class="h">Interment</div><div class="c">${e(f.Burial)}</div>` : ''}${f.Luncheon ? `<div class="h">Family luncheon</div><div class="c">${e(f.Luncheon)}</div>` : ''}<div class="h">With gratitude</div><div class="c">The family thanks all who have shared their love, service and prayers.</div>`;
    const css = `.bk{font:12.5px/1.45 Georgia,serif;color:#222}.bk .h{font:700 10.5px Arial;letter-spacing:2.5px;text-transform:uppercase;color:#A8834A;text-align:center;margin:16px 0 8px}.bk .r{display:flex;align-items:baseline;gap:6px;margin:4px 0}.bk .a{white-space:nowrap}.bk .dots{flex:1;border-bottom:1px dotted #aaa}.bk .b{text-align:right}.bk .b em{display:block;font-size:10.5px;color:#666;font-style:normal}.bk .gap{height:8px}
      .bk .front,.bk .back{text-align:center}.bk .kick{font:11px Arial;letter-spacing:4px;text-transform:uppercase;color:#777;margin-top:10px}.bk .nm{font:400 30px/1.15 Georgia,serif;color:#1F3864;margin:10px 0}.bk .sv{font:12px Arial;color:#555;margin-top:12px}.bk .orn{width:60px;border-top:1px solid #A8834A;margin:14px auto}.bk .q{font-style:italic;font-size:14px;margin:18px 10px}.bk .qr{font:11px Arial;font-style:normal;color:#777;margin-top:6px}.bk .c{text-align:center}.bk .mo{font:10.5px Arial;color:#888;margin-top:22px}
      .bk .sheet{display:flex;width:11in;height:8.5in;page-break-after:always;box-sizing:border-box}.bk .pane{width:5.5in;padding:.55in .6in;box-sizing:border-box;overflow:hidden}.bk .mid{display:flex;flex-direction:column;justify-content:center}`;
    const sheet = (l, r, mid) => `<div class="sheet"><div class="pane${mid ? ' mid' : ''}">${l}</div><div class="pane${mid ? ' mid' : ''}">${r}</div></div>`;
    return `<style>${css}</style><div class="bk">${sheet(backP, front, 1)}${sheet(order, inside, 1)}</div>`;
  }

  /* =========================================================================== 12. Picture for a group text (made on this phone; nothing is uploaded) */
  const GR = { title: '', date: '', time: '', place: '', theme: 0, photo: null };
  const THEMES = [['#1F3A93', '#5856D6'], ['#A8834A', '#5C4422'], ['#34C759', '#0A6E3A'], ['#FF2D55', '#8E1F3A'], ['#FF9500', '#C93400'], ['#30B0C7', '#0B4F6C'], ['#1C1C1E', '#3A3A3C']];
  WH.routes.graphic = {
    view(args) {
      const q = new URLSearchParams(decodeURIComponent((args || [])[0] || '')); ['title', 'date', 'time', 'place'].forEach(k => { if (q.get(k)) GR[k] = q.get(k); });
      const { esc } = WH;
      WH.screen('Picture for a text', 'Make it here, then attach it to your group text', `<canvas id="grC" width="1080" height="1080" style="width:100%;max-width:420px;display:block;margin:0 auto;border-radius:14px;box-shadow:0 2px 10px rgba(0,0,0,.15)"></canvas>
        <div class="list" style="margin-top:14px"><div class="field"><label>Title</label><input class="grin" data-k="title" value="${esc(GR.title)}" placeholder="Ward Christmas party"></div>
        <div class="field"><label>Date</label><input class="grin" data-k="date" value="${esc(GR.date)}" placeholder="Friday, December 12"></div>
        <div class="field"><label>Time</label><input class="grin" data-k="time" value="${esc(GR.time)}" placeholder="6:30 PM"></div>
        <div class="field"><label>Place</label><input class="grin" data-k="place" value="${esc(GR.place)}" placeholder="Cultural hall"></div></div>
        <div class="section-h"><span>Background</span></div><div class="seg" style="flex-wrap:wrap">${THEMES.map((t, i) => `<button class="${!GR.photo && GR.theme === i ? 'on' : ''}" data-act="grTheme" data-i="${i}" aria-label="Color ${i + 1}"><span style="display:inline-block;width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,${t[0]},${t[1]});vertical-align:middle"></span></button>`).join('')}</div>
        <div class="btns"><label class="btn gray" style="text-align:center">Use a photo<input type="file" accept="image/*" id="grF" style="display:none"></label>${GR.photo ? '<button class="btn gray" data-act="grNoPhoto">No photo</button>' : ''}</div>
        <div class="btns"><button class="btn" data-act="grShare">Share</button><button class="btn gray" data-act="grSave">Save picture</button></div>
        <p class="foot">The picture is made on your phone; nothing is uploaded. Share sends it to Messages, or save it and attach it to the group text.</p>`, back);
      document.querySelectorAll('.grin').forEach(i => i.addEventListener('input', () => { GR[i.dataset.k] = i.value; grDraw(); }));
      document.getElementById('grF').addEventListener('change', e => {
        const file = e.target.files && e.target.files[0]; if (!file) return;
        const img = new Image(); img.onload = () => { GR.photo = img; WH.routes.graphic.view(); }; img.src = URL.createObjectURL(file);
      });
      grDraw();
    }
  };
  function grWrap(ctx, text, maxW) {
    const words = String(text).split(/\s+/).filter(Boolean), lines = []; let cur = '';
    words.forEach(w => { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; });
    if (cur) lines.push(cur); return lines;
  }
  function grDraw() {
    const c = document.getElementById('grC'); if (!c) return; const x = c.getContext('2d'), W = c.width, H = c.height, font = '-apple-system, "Segoe UI", Roboto, Arial, sans-serif';
    if (GR.photo) {
      const p = GR.photo, s = Math.max(W / p.width, H / p.height), w = p.width * s, h = p.height * s; x.drawImage(p, (W - w) / 2, (H - h) / 2, w, h);
      const g = x.createLinearGradient(0, H * 0.25, 0, H); g.addColorStop(0, 'rgba(0,0,0,0.05)'); g.addColorStop(1, 'rgba(0,0,0,0.78)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    } else {
      const t = THEMES[GR.theme] || THEMES[0], g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, t[0]); g.addColorStop(1, t[1]); x.fillStyle = g; x.fillRect(0, 0, W, H);
      x.globalAlpha = 0.08; x.fillStyle = '#fff'; x.beginPath(); x.arc(W * 0.85, H * 0.12, 300, 0, Math.PI * 2); x.fill(); x.beginPath(); x.arc(W * 0.1, H * 0.95, 220, 0, Math.PI * 2); x.fill(); x.globalAlpha = 1;
    }
    x.fillStyle = '#fff'; x.textAlign = 'left'; x.textBaseline = 'alphabetic'; x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = GR.photo ? 12 : 0;
    const ward = ((WH.S.boot && WH.S.boot.settings) || {}).ward_name || '', pad = 90;
    x.font = `600 34px ${font}`; x.globalAlpha = 0.85; x.fillText(ward.toUpperCase(), pad, 130); x.globalAlpha = 1;
    let size = 112; x.font = `800 ${size}px ${font}`; let lines = grWrap(x, GR.title || 'Your title', W - pad * 2);
    while (lines.length > 4 && size > 60) { size -= 8; x.font = `800 ${size}px ${font}`; lines = grWrap(x, GR.title || 'Your title', W - pad * 2); }
    const info = [GR.date, GR.time].filter(Boolean).join(' · '), place = GR.place || '';
    let y = H - pad - (place ? 70 : 0) - (info ? 80 : 0) - (lines.length - 1) * size * 1.05;
    lines.forEach(l => { x.fillText(l, pad, y); y += size * 1.05; });
    y += 10; x.font = `600 54px ${font}`; if (info) { x.fillText(info, pad, y + 30); y += 80; }
    x.font = `400 46px ${font}`; x.globalAlpha = 0.9; if (place) x.fillText(place, pad, y + 26); x.globalAlpha = 1; x.shadowBlur = 0;
  }
  const grBlob = () => new Promise(res => document.getElementById('grC').toBlob(res, 'image/png'));
  const grName = () => (String(GR.title || 'picture').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'picture') + '.png';
  Object.assign(WH.act, {
    grTheme(el) { GR.theme = +el.dataset.i; GR.photo = null; WH.routes.graphic.view(); },
    grNoPhoto() { GR.photo = null; WH.routes.graphic.view(); },
    async grShare() {
      const b = await grBlob(), file = new File([b], grName(), { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: GR.title || 'Picture' }); } catch (e) { } }
      else WH.act.grSave();
    },
    async grSave() { const b = await grBlob(), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = grName(); document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 30000); }
  });
})();
