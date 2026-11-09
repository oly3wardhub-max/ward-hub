/* Flag fundraiser (homes, crews, routes, trades), sign-up sheets with a public link, and dinner groups. */
(function () {
  const WH = window.WH = window.WH || {}; WH.routes = WH.routes || {}; WH.act = WH.act || {}; WH.more = WH.more || [];
  const ic = p => `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const me = () => (WH.S.boot && WH.S.boot.me) || { orgs: [], callings: [] };
  const cfg = () => (WH.S.boot && WH.S.boot.settings) || {};
  const leads = o => (me().orgs || []).indexOf(o) >= 0;
  const canFlags = () => WH.isBish() || leads(cfg().flag_org || 'Young Men') || (me().callings || []).some(c => /flag/i.test(c));
  const canDinner = () => WH.isBish() || leads(cfg().dinner_org || 'Relief Society');
  WH.more.push(
    { title: 'Flags', sub: 'Holiday flags: homes, crews and routes', href: '#/x/flags', icon: ic('<path d="M4.5 17.5v-15M4.5 3.5h11l-2.5 3.5 2.5 3.5h-11"/>'), color: '#D70015', order: 18, show: canFlags, group: 'Leaders' },
    { title: 'Sign-up sheets', sub: 'A link anyone can sign up on', href: '#/x/signups', icon: ic('<rect x="4" y="3.5" width="12" height="14" rx="2"/><path d="M7.5 3.5V2.5h5v1M7 8.5h6M7 11.5h6M7 14.5h3.5"/>'), color: '#34C759', order: 19, show: () => WH.isBish() || WH.can('leader'), group: 'Leaders' },
    { title: 'Dinner groups', sub: 'Households in small groups; hosts take turns', href: '#/x/dinners', icon: ic('<path d="M6 2.5v6a2 2 0 0 1-4 0v-6M4 8.5v9M14.5 17.5v-15c-2 0-3.5 2-3.5 5v4h3.5"/>'), color: '#FF9500', order: 20, show: canDinner, group: 'Leaders' }
  );
  const back = { back: '#/more', backLabel: 'More' };
  const body = h => { const b = document.getElementById('body'); if (b) b.innerHTML = h; };
  const err = e => body(WH.errorBox(e.message));
  const base = () => location.origin + location.pathname.replace(/[^/]*$/, '');
  const abs = u => /^https?:/.test(u) ? u : base() + u.replace(/^\.?\//, '');
  const money = n => '$' + (Math.round((+n || 0) * 100) / 100).toLocaleString();
  const apple = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);
  const mapHref = (a, city) => (apple ? 'https://maps.apple.com/?q=' : 'https://www.google.com/maps/search/?api=1&query=') + encodeURIComponent(a + (city ? ', ' + city : ''));
  const sms = (list, text) => WH.smsHref ? WH.smsHref(list.map(x => x.p), text) : '';
  const copy = async (t, msg) => { try { await navigator.clipboard.writeText(t); WH.toast(msg || 'Copied', true); } catch (e) { prompt('Copy this', t); } };
  const share = async (url, title) => { if (navigator.share) { try { await navigator.share({ title, url }); return; } catch (e) { if (e && e.name === 'AbortError') return; } } copy(url, 'Link copied'); };
  const day = d => d ? WH.fmt(d, { weekday: 'short', month: 'short', day: 'numeric' }) : '';
    function printHtml(html) {
    let root = document.getElementById('print-root'); if (!root) { root = document.createElement('div'); root.id = 'print-root'; document.body.appendChild(root); }
    root.innerHTML = `<style>@media screen{#print-root{display:none}}@media print{@page{size:letter;margin:.5in}body.printing-program>*:not(#print-root){display:none!important}body.printing-program #print-root{display:block;color:#000}body.printing-program{background:#fff!important}}
      #print-root .pg{font:11pt/1.35 Arial,sans-serif;page-break-after:always}#print-root .pg:last-child{page-break-after:auto}#print-root h1{font:18pt Georgia,serif;margin:0 0 4px}#print-root .sub{color:#333;margin:0 0 10px}
      #print-root table{width:100%;border-collapse:collapse}#print-root th,#print-root td{border:1px solid #000;padding:5px 6px;text-align:left;vertical-align:top}#print-root th{background:#eee}#print-root td.c{width:42px}</style>${html}`;
    document.body.classList.add('printing-program');
    setTimeout(() => { window.print(); setTimeout(() => document.body.classList.remove('printing-program'), 1000); }, 60);
  }

  /* =================================================================== Flags */
  let F = null, fseg = 'holidays', fq = '', fseason = '';
  const zoneLabel = id => { const z = (F.zones || []).find(x => x.id === String(id)); return z ? z.label : 'No zone'; };
  const isPaid = s => (+s.Paid || 0) > 0 && (+s.Paid || 0) >= (+s.Pledged || 0);
  const addrKey = a => { const m = String(a || '').trim().match(/^(\d+)\s*(.*)$/); return m ? { st: m[2].toLowerCase().replace(/[^a-z0-9 ]/g, ''), n: +m[1] } : { st: String(a || '').toLowerCase(), n: 0 }; };
  const route = zone => F.subs.filter(s => s.Stopped !== true && String(s.Zone) === String(zone)).sort((a, b) => {
    const ao = +a.Order || 1e6, bo = +b.Order || 1e6; if (ao !== bo) return ao - bo;
    const x = addrKey(a.Address), y = addrKey(b.Address); return x.st.localeCompare(y.st) || x.n - y.n;
  });
  WH.routes.flags = {
    view(args) {
      if (args && args[0] === 'h' && args[1]) return holiday(decodeURIComponent(args[1]));
      WH.screen('Flags', 'Holiday flag fundraiser', WH.skeleton(4), Object.assign({ right: '<span class="fladd"></span>' }, back));
      WH.call('flags', fseason ? { season: fseason } : {}).then(d => { F = d; fseason = d.season; draw(); }).catch(err);
    }
  };
  function draw() {
    const { esc, I } = WH, d = F, t = d.totals;
    document.querySelectorAll('.fladd').forEach(x => x.innerHTML = fseg === 'homes' ? `<button class="btn small" data-act="flNew">${I.plus} Home</button>` : fseg === 'holidays' ? `<button class="btn small" data-act="flHolNew">${I.plus} Holiday</button>` : '');
    let h = `<div class="hero"><div class="k">Season ${esc(d.season)}${d.season !== d.current ? ' (not the current one)' : ''}</div><div class="big">${t.homes} homes · ${t.flags} flags</div>
      <div class="s" style="color:var(--sub)">${money(t.paid)} received${t.pledged ? ' of ' + money(t.pledged) + ' promised' : ''} · ${t.unpaid ? t.unpaid + ' not paid yet' : 'everyone has paid'}${d.donation ? ' · suggested $' + esc(d.donation) + ' a flag' : ''}${t.noZone ? ` · <span style="color:var(--orange)">${t.noZone} without a zone</span>` : ''}</div></div>`;
    if (d.trades.length) h += `<div class="section-h"><span>Trade requests</span></div><div class="list">${d.trades.map(x => `<button class="row" data-act="flTrade" data-id="${esc(x.id)}"><div class="main"><div class="t">${esc(x.person)}</div><div class="s">${esc(x.holiday)} · ${esc(day(x.date))} · ${esc(zoneLabel(x.zone))}${x.notes ? ' · ' + esc(String(x.notes).split(' · ').pop()) : ''}</div></div><span class="chip orange">Trade</span>${I.chev}</button>`).join('')}</div>`;
    h += `<div class="seg" style="margin-top:16px">${[['holidays', 'Holidays'], ['homes', 'Homes'], ['unpaid', 'Not paid' + (t.unpaid ? ' ' + t.unpaid : '')]].map(o => `<button class="${fseg === o[0] ? 'on' : ''}" data-act="flSeg" data-v="${o[0]}">${o[1]}</button>`).join('')}</div>`;
    if (fseg === 'holidays') {
      h += `<div class="list" style="margin-top:12px">${d.holidays.length ? d.holidays.map(x => {
        const zs = d.zones.map(z => (x.crews[z.id] || []).length), need = zs.some(n => !n);
        return `<button class="row" data-go="#/x/flags/h/${encodeURIComponent(x.id)}" style="${x.past ? 'opacity:.55' : ''}"><div class="main"><div class="t">${esc(x.name)}</div><div class="s">${esc(day(x.date))}${x.start ? ' · ' + esc(x.start) : ''} · crews ${zs.join(' / ')}</div></div>${!x.past && need ? '<span class="chip orange">Needs crew</span>' : x.past ? '' : '<span class="chip green">Ready</span>'}${I.chev}</button>`;
      }).join('') : '<div class="empty">No flag holidays on the calendar yet.</div>'}</div>
      <div class="btns"><button class="btn gray" data-act="flYear">Add ${new Date().getFullYear() + 1}'s holidays</button></div>
      <p class="foot">Holidays are calendar items titled "Flags: …". One crew per zone; each crew gets its own link with only its homes.</p>`;
    } else {
      const unpaid = fseg === 'unpaid', q = fq.toLowerCase();
      const list = d.subs.filter(s => (!unpaid || (s.Stopped !== true && !isPaid(s))) && (!q || (s.Name + ' ' + s.Address).toLowerCase().includes(q)));
      h += `<div class="search" style="margin-top:12px">${I.search}<input id="flq" type="search" placeholder="Search names or streets" value="${esc(fq)}"></div>`;
      const zones = d.zones.map(z => z.id).concat(['']);
      zones.forEach(z => {
        const rows = list.filter(s => String(s.Zone || '') === z).sort((a, b) => z ? route(z).indexOf(a) - route(z).indexOf(b) : String(a.Address).localeCompare(String(b.Address)));
        if (!rows.length) return;
        h += `<div class="section-h"><span>${esc(z ? zoneLabel(z) : 'No zone yet')}</span><span>${rows.filter(s => s.Stopped !== true).length}</span></div><div class="list">${rows.map(s => {
          const due = Math.max(0, (+s.Pledged || 0) - (+s.Paid || 0));
          const chip = s.Stopped === true ? '<span class="chip">Stopped</span>' : isPaid(s) ? '<span class="chip green">Paid</span>' : `<span class="chip orange">${due ? money(due) + ' due' : 'Not paid'}</span>`;
          return `<div class="row"><button class="main" data-act="flEdit" data-id="${esc(s.ID)}" style="background:none;border:0;padding:0;text-align:left;color:inherit;font:inherit;cursor:pointer"><div class="t">${esc(s.Name)}</div><div class="s">${esc(s.Address)}${(+s.Flags || 1) > 1 ? ' · ' + s.Flags + ' flags' : ''}</div></button>${unpaid ? `<button class="btn small" data-act="flPay" data-id="${esc(s.ID)}">Paid</button>` : chip}</div>`;
        }).join('')}</div>`;
      });
      if (!list.length) h += `<div class="list"><div class="empty">${unpaid ? 'Everyone has paid.' : 'No homes yet. Tap Home to add one.'}</div></div>`;
      h += `<p class="foot">Only flag coordinators see these addresses and phones. Crews see only their own route, with names and addresses.</p>`;
      if (d.seasons.length > 1) h += `<div class="section-h"><span>Season</span></div><div class="seg" style="flex-wrap:wrap">${d.seasons.map(s => `<button class="${s === d.season ? 'on' : ''}" data-act="flSeason" data-v="${esc(s)}">${esc(s)}</button>`).join('')}</div>`;
      h += `<div class="btns"><button class="btn gray" data-act="flNewSeason">Start a new season</button></div><p class="foot">Copies everyone still taking a flag into the new season, not yet paid.</p>`;
    }
    body(h);
    const qi = document.getElementById('flq'); if (qi) qi.addEventListener('input', () => { fq = qi.value; const p = qi.selectionStart; draw(); const n = document.getElementById('flq'); n.focus(); n.setSelectionRange(p, p); });
  }
  const subFields = () => [{ name: 'Name', ph: 'Household or name' }, { name: 'Address', ph: '123 N Main St' }, { name: 'Zone', type: 'select', options: F.zones.map(z => z.id) }, { name: 'Order', label: 'Stop number', type: 'number', ph: 'blank = by street' },
    { name: 'Flags', type: 'number' }, { name: 'Pledged', label: 'Promised $', type: 'number' }, { name: 'Paid', label: 'Paid $', type: 'number' }, { name: 'How paid', ph: 'Cash, check, Venmo' }, { name: 'Phone' }, { name: 'Email' },
    { name: 'Placement', label: 'For the crew', ph: 'e.g. left of the driveway' }, { name: 'Stopped', label: 'No flag this season', type: 'toggle' }, { name: 'Notes', type: 'textarea' }];
  async function flagReload(id) { try { F = await WH.call('flags', { season: fseason }); } catch (e) { WH.toast(e.message); return; } if (id) holiday(id); else draw(); }
  Object.assign(WH.act, {
    flSeg(el) { fseg = el.dataset.v; draw(); },
    flSeason(el) { fseason = el.dataset.v; WH.routes.flags.view(); },
    flNew() { WH.form('New home', subFields(), { Flags: 1, Season: F.season }, async row => { row.Season = F.season; await WH.call('flagSubSave', { row }); await flagReload(); }); },
    flEdit(el) {
      const s = F.subs.find(x => x.ID === el.dataset.id); if (!s) return;
      const nums = s.Phone ? [{ p: s.Phone }] : [], x = [];
      if (nums.length) x.push(`<a class="btn small gray" style="text-decoration:none" href="${WH.esc(sms(nums, 'Hi ' + String(s.Name).split(' ')[0] + ', '))}">Text</a>`);
      x.push(`<a class="btn small gray" style="text-decoration:none" target="_blank" rel="noopener" href="${WH.esc(mapHref(s.Address, F.city))}">Map</a>`);
      WH.form(s.Name, subFields(), s, async row => { row.ID = s.ID; await WH.call('flagSubSave', { row }); await flagReload(); },
        async () => { await WH.call('flagSubRemove', { id: s.ID }); await flagReload(); }, `<div class="btns" style="margin:0 0 12px">${x.join('')}</div>`);
    },
    async flPay(el) {
      const s = F.subs.find(x => x.ID === el.dataset.id); if (!s) return;
      const v = prompt('Amount received for ' + s.Name, String(+s.Pledged || '')); if (v == null) return;
      try { await WH.call('flagSubSave', { row: { ID: s.ID, Paid: v } }); WH.toast('Marked paid', true); await flagReload(); } catch (e) { WH.toast(e.message); }
    },
    flNewSeason() {
      WH.form('Start a new season', [{ name: 'season', label: 'New season', ph: String(new Date().getFullYear() + 1) }], { season: String(new Date().getFullYear() + 1) }, async row => {
        const r = await WH.call('flagNewSeason', row); fseason = r.season; WH.toast(r.copied + ' homes copied', true); WH.routes.flags.view();
      });
    },
    flHolNew() { holForm({}); },
    async flYear() {
      const y = new Date().getFullYear() + 1; if (!confirm(`Add ${y}'s flag holidays to the calendar? The ones used before go on their usual dates; you can change any of them.`)) return;
      try { const r = await WH.call('flagYear', { year: y }); WH.toast(r.added.length ? r.added.length + ' holidays added' : 'They were already there', true); await flagReload(); } catch (e) { WH.toast(e.message); }
    }
  });
  function holForm(x) {
    WH.form(x.id ? 'Holiday' : 'New flag holiday', [{ name: 'name', label: 'Holiday', ph: 'e.g. Memorial Day' }, { name: 'date', label: 'Date', type: 'date' }, { name: 'start', label: 'Set up by', ph: '7:00 AM' }, { name: 'end', label: 'Take down after', ph: '6:00 PM' }], x,
      async row => { const r = await WH.call('flagHolidaySave', Object.assign({ id: x.id || '' }, row)); WH.store.del('c:today'); await flagReload(x.id ? r.id : null); },
      x.id ? async () => { await WH.call('flagHolidayRemove', { id: x.id }); location.hash = '#/x/flags'; } : null);
  }

  /* ---------- one holiday: crews and routes for each zone ---------- */
  let HID = '';
  async function holiday(id) {
    HID = id;
    WH.screen('Flags', '', WH.skeleton(4), { back: '#/x/flags', backLabel: 'Flags', right: '<button class="btn small gray" data-act="flPrint">Print</button>' });
    if (!F || !F.holidays.some(h => h.id === id)) { try { F = await WH.call('flags', { all: true }); fseason = F.season; } catch (e) { return err(e); } }
    const { esc, I } = WH, x = F.holidays.find(h => h.id === id); if (!x) return err(new Error('That holiday isn\'t on the calendar.'));
    const pl = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
    let h = '';
    F.zones.forEach(z => {
      const crew = x.crews[z.id] || [], homes = route(z.id), flags = homes.reduce((a, s) => a + (+s.Flags || 1), 0);
      h += `<div class="section-h big"><span>${esc(z.label)}</span><span style="font-size:15px;font-weight:400;color:var(--sub)">${pl(homes.length, 'home')} · ${pl(flags, 'flag')}</span></div>
        <div class="list">${crew.length ? crew.map(c => `<div class="row"><div class="main"><div class="t">${esc(c.person)}</div>${c.notes ? `<div class="s">${esc(c.notes)}</div>` : ''}</div><span class="chip ${c.kind === 'Youth' ? 'blue' : ''}">${esc(c.kind)}</span>${c.status !== 'Assigned' ? `<span class="chip ${c.status === 'Trade asked' ? 'orange' : 'green'}">${esc(c.status)}</span>` : ''}</div>`).join('') : '<div class="empty">No crew yet.</div>'}</div>
        <div class="btns" style="flex-wrap:wrap"><button class="btn small gray" style="white-space:nowrap" data-act="flCrew" data-z="${esc(z.id)}">${crew.length ? 'Change' : I.plus + ' Crew'}</button>${crew.length ? `<button class="btn small" style="white-space:nowrap" data-act="flText" data-z="${esc(z.id)}">Text crew</button>` : ''}<button class="btn small gray" style="white-space:nowrap" data-act="flLink" data-z="${esc(z.id)}">Crew page</button></div>
        <details class="list" style="margin-top:10px;padding:10px 16px"><summary style="cursor:pointer">Route (${homes.length})</summary>${homes.map((s, i) => `<div class="row" style="padding:8px 0"><span class="chip blue" style="min-width:28px;justify-content:center">${i + 1}</span><div class="main"><div class="t">${esc(s.Address)}</div><div class="s">${esc(s.Name)}${(+s.Flags || 1) > 1 ? ' · ' + s.Flags + ' flags' : ''}${s.Placement ? ' · ' + esc(s.Placement) : ''}</div></div><a class="btn small gray" style="text-decoration:none" target="_blank" rel="noopener" href="${esc(mapHref(s.Address, F.city))}">Map</a></div>`).join('') || '<div class="empty">No homes in this zone.</div>'}</details>`;
    });
    h += `<p class="foot">"Text crew" opens a text with their link. Youth are texted together with a parent. The crew page shows names and addresses only, and stops working two days after the holiday.</p>`;
    WH.screen(x.name, `${esc(WH.long(x.date))}${x.start ? ' · set up by ' + esc(x.start) : ''}${x.end ? ' · take down after ' + esc(x.end) : ''} · <button class="link" style="font-size:15px;padding:0" data-act="flHolEdit">Edit</button>`, h, { back: '#/x/flags', backLabel: 'Flags', right: '<button class="btn small gray" data-act="flPrint">Print</button>' });
  }
  const crewPeople = () => [...new Set([].concat(WH.DATALISTS.people || [], F.youth || [], F.families || []))].sort();
  let CREW = [];
  function crewSheet(z) {
    const { esc } = WH, x = F.holidays.find(h => h.id === HID);
    WH.openSheet(`<header><button class="link" data-act="close">Cancel</button><h2>${esc(zoneLabel(z))}</h2><button class="link r" id="crsv">Save</button></header>
      <div class="list" id="crl">${CREW.map((c, i) => `<div class="row"><div class="main"><div class="t">${esc(c.person)}</div></div><span class="chip ${c.kind === 'Youth' ? 'blue' : ''}">${esc(c.kind)}</span><button class="link" data-act="flCrewDel" data-i="${i}" data-z="${esc(z)}" style="color:var(--red);padding-left:10px">Remove</button></div>`).join('') || '<div class="empty">No one yet.</div>'}</div>
      <div class="section-h"><span>Add someone</span></div><div class="list"><div class="field"><label>Name</label><input id="crn" list="dl-crew" autocomplete="off" placeholder="Adult, youth or family" style="color:var(--text)"></div>
      <div class="field"><label>Who</label><select id="crk"><option>Adult</option><option>Youth</option><option>Family</option></select></div></div>
      <div class="btns"><button class="btn gray" data-act="flCrewAdd" data-z="${esc(z)}">Add</button></div>
      <datalist id="dl-crew">${crewPeople().map(n => `<option value="${esc(n)}">`).join('')}</datalist>
      <p class="foot">${esc(x ? x.name + ', ' + day(x.date) : '')}. Youth come from your own classes; anyone under 18 is marked Youth, and texts to youth include a parent.</p>`);
    document.getElementById('crsv').onclick = async () => {
      const n = document.getElementById('crn').value.trim(); if (n) CREW.push({ person: n, kind: document.getElementById('crk').value });
      try { await WH.call('flagCrewSave', { holiday: HID, zone: z, people: CREW }); WH.closeSheet(); WH.toast('Saved', true); await flagReload(HID); } catch (e) { WH.toast(e.message); }
    };
  }
  async function crewText(z) {
    const { esc } = WH;
    try {
      const r = await WH.call('flagCrewLink', { holiday: HID, zone: z, app: base() }), link = abs(r.link), text = r.text.replace(r.link, link), href = sms(r.to, text);
      WH.openSheet(`<header><span style="min-width:64px"></span><h2>Text the crew</h2><button class="link r" data-act="close">Done</button></header>
        ${href ? `<a class="btn" style="text-decoration:none" href="${esc(href)}">${WH.I.msg.replace('<svg', '<svg width="18" height="18"')} Text ${r.to.length} ${r.to.length === 1 ? 'person' : 'people'}</a>` : '<div class="list"><div class="empty">No phone numbers for this crew.</div></div>'}
        <div class="list" style="margin-top:12px">${r.to.map(p => `<div class="row"><div class="main"><div class="t">${esc(p.n)}</div></div><span class="s">${esc(p.p)}</span></div>`).join('')}</div>
        ${r.missing.length ? `<p class="foot">Not on the text: ${esc(r.missing.join(', '))}.</p>` : ''}
        <div class="section-h"><span>The message</span></div><div class="list"><div class="row wrap"><div class="main"><div class="s" style="color:var(--text)">${esc(text)}</div></div></div></div>
        <div class="btns"><button class="btn gray" data-act="flCopy" data-v="${esc(link)}">Copy the link</button></div>`);
    } catch (e) { WH.toast(e.message); }
  }
  function tradeSheet(id) {
    const { esc } = WH, t = F.trades.find(x => x.id === id); if (!t) return;
    const opts = [];
    F.holidays.filter(h => !h.past && h.id !== t.holidayId).forEach(h => F.zones.forEach(z => (h.crews[z.id] || []).forEach(c => opts.push({ id: c.id, same: z.id === String(t.zone), label: `${c.person} · ${h.name} ${day(h.date)} · ${zoneLabel(z.id)}` }))));
    opts.sort((a, b) => (b.same ? 1 : 0) - (a.same ? 1 : 0));
    WH.openSheet(`<header><button class="link" data-act="close">Cancel</button><h2>Trade</h2><span style="min-width:64px"></span></header>
      <div class="list"><div class="row wrap"><div class="main"><div class="t">${esc(t.person)}</div><div class="s">${esc(t.holiday)} · ${esc(day(t.date))} · ${esc(zoneLabel(t.zone))}<br>${esc(t.notes)}</div></div></div></div>
      <div class="section-h"><span>Swap with someone on another holiday</span></div><div class="list"><div class="field"><select id="trw" style="text-align:left"><option value=""></option>${opts.map(o => `<option value="${esc(o.id)}">${esc(o.label)}</option>`).join('')}</select></div></div>
      <div class="btns"><button class="btn" data-act="flTradeGo" data-id="${esc(id)}" data-d="swap">Swap</button></div>
      <div class="section-h"><span>Or someone else takes this one</span></div><div class="list"><div class="field"><label>Name</label><input id="trp" list="dl-crew" autocomplete="off" style="color:var(--text)"></div><div class="field"><label>Who</label><select id="trk"><option>Adult</option><option>Youth</option><option>Family</option></select></div></div>
      <datalist id="dl-crew">${crewPeople().map(n => `<option value="${esc(n)}">`).join('')}</datalist>
      <div class="btns"><button class="btn gray" data-act="flTradeGo" data-id="${esc(id)}" data-d="replace">Replace</button><button class="btn red" data-act="flTradeGo" data-id="${esc(id)}" data-d="decline">Not needed</button></div>`);
  }
  function flagPrint() {
    const x = F.holidays.find(h => h.id === HID); if (!x) return; const e = WH.esc, ward = cfg().ward_name || '';
    printHtml(F.zones.map(z => {
      const homes = route(z.id), crew = x.crews[z.id] || [];
      return `<div class="pg"><h1>Flags · ${e(x.name)} · ${e(z.label)}</h1><p class="sub">${e(ward)} · ${e(WH.long(x.date))}${x.start ? ' · set up by ' + e(x.start) : ''}${x.end ? ' · take down after ' + e(x.end) : ''}<br>Crew: ${e(crew.map(c => c.person).join(', ') || '________________')}${F.pickup ? '<br>Flags: ' + e(F.pickup) : ''}</p>
        <table><tr><th>#</th><th>Address</th><th>Name</th><th>Flags</th><th>Where</th><th class="c">Out</th><th class="c">In</th></tr>${homes.map((s, i) => `<tr><td>${i + 1}</td><td>${e(s.Address)}</td><td>${e(s.Name)}</td><td>${+s.Flags || 1}</td><td>${e(s.Placement || '')}</td><td></td><td></td></tr>`).join('') || '<tr><td colspan="7">No homes in this zone.</td></tr>'}</table>
        <p class="sub" style="margin-top:8px">${homes.length} homes · ${homes.reduce((a, s) => a + (+s.Flags || 1), 0)} flags. Please keep this list to your crew.</p></div>`;
    }).join(''));
  }
  Object.assign(WH.act, {
    flHolEdit() { const x = F.holidays.find(h => h.id === HID); if (x) holForm({ id: x.id, name: x.name, date: x.date, start: x.start, end: x.end }); },
    async flCrew(el) { await WH.loadNames(); const x = F.holidays.find(h => h.id === HID); CREW = (x.crews[el.dataset.z] || []).map(c => ({ person: c.person, kind: c.kind })); crewSheet(el.dataset.z); },
    flCrewDel(el) { CREW.splice(+el.dataset.i, 1); crewSheet(el.dataset.z); },
    flCrewAdd(el) { const n = document.getElementById('crn').value.trim(); if (!n) return; CREW.push({ person: n, kind: document.getElementById('crk').value }); crewSheet(el.dataset.z); },
    flText(el) { crewText(el.dataset.z); },
    async flLink(el) { try { const r = await WH.call('flagCrewLink', { holiday: HID, zone: el.dataset.z, app: base() }); const u = abs(r.link); WH.openSheet(`<header><span style="min-width:64px"></span><h2>Crew page</h2><button class="link r" data-act="close">Done</button></header><div class="list"><a class="row" href="${WH.esc(u)}" target="_blank" rel="noopener"><div class="main"><div class="t">Open the crew page</div><div class="s">${WH.esc(r.holiday)} · ${WH.esc(r.zone)}</div></div>${WH.I.chev}</a><button class="row" data-act="flCopy" data-v="${WH.esc(u)}"><div class="main"><div class="t">Copy the link</div></div></button></div><p class="foot">Anyone with this link sees this zone's names and addresses until two days after the holiday. Share it only with the crew.</p>`); } catch (e) { WH.toast(e.message); } },
    flCopy(el) { copy(el.dataset.v, 'Link copied'); },
    flPrint() { flagPrint(); },
    async flTrade(el) { await WH.loadNames(); tradeSheet(el.dataset.id); },
    async flTradeGo(el) {
      const d = el.dataset.d, p = { id: el.dataset.id, decide: d };
      if (d === 'swap') { p.with = document.getElementById('trw').value; if (!p.with) { WH.toast('Pick who they swap with'); return; } }
      if (d === 'replace') { p.person = document.getElementById('trp').value.trim(); p.kind = document.getElementById('trk').value; if (!p.person) { WH.toast('Type who takes their place'); return; } }
      try { await WH.call('flagTradeDecide', p); WH.closeSheet(); WH.toast(d === 'decline' ? 'Marked not needed' : 'Traded', true); await flagReload(); } catch (e) { WH.toast(e.message); }
    }
  });

  /* =================================================================== Sign-up sheets */
  let SU = null, SV = null;
  const suLink = id => base() + 'signup.html?s=' + encodeURIComponent(id);
  WH.routes.signups = {
    view(args) {
      if (args && args[0]) return suOpen(decodeURIComponent(args[0]));
      WH.screen('Sign-up sheets', 'Share a link; people add their name and phone', WH.skeleton(4), Object.assign({ right: `<button class="btn small" data-act="suNew">${WH.I.plus} New</button>` }, back));
      WH.call('signups', {}).then(d => { SU = d; suDraw(); }).catch(err);
    }
  };
  function suDraw() {
    const { esc, I } = WH, open = SU.list.filter(s => s.open), closed = SU.list.filter(s => !s.open);
    const row = s => `<button class="row" data-go="#/x/signups/${encodeURIComponent(s.id)}"><div class="main"><div class="t">${esc(s.title)}</div><div class="s">${esc(s.org)}${s.closes ? ' · closes ' + esc(day(s.closes)) : ''}${s.kind === 'Dinner groups' ? ' · dinner groups' : ''}</div></div><span class="chip ${s.open ? 'blue' : ''}">${s.count}${s.need ? ' of ' + s.need : ''}</span>${I.chev}</button>`;
    body(`<div class="section-h"><span>Open</span></div><div class="list">${open.map(row).join('') || '<div class="empty">No open sign-ups. Tap New.</div>'}</div>
      ${closed.length ? `<div class="section-h"><span>Closed</span></div><div class="list">${closed.slice(0, 20).map(row).join('')}</div>` : ''}
      <p class="foot">The public page shows first names and last initials. Phone numbers and notes come only to you.</p>`);
  }
  let SL = [];
  function suEditor(s) {
    const { esc } = WH, orgs = (SU && SU.orgs) || [];
    const slotRows = () => SL.map((x, i) => `<div class="list" style="margin-top:8px" data-slot="${i}"><div class="field"><label>Date</label><input type="date" data-k="date" value="${esc(x.date || '')}"></div><div class="field"><label>Time</label><input data-k="time" value="${esc(x.time || '')}" placeholder="10:00 AM"></div>
      <div class="field"><label>What</label><input data-k="label" value="${esc(x.label || '')}" placeholder="e.g. Set up, Salad, Driver"></div><div class="field"><label>How many</label><input data-k="need" inputmode="numeric" value="${esc(x.need || '')}" placeholder="blank = any number"></div>
      <div class="field"><button class="link" data-act="suSlotDel" data-i="${i}" style="color:var(--red)">Take out this slot</button></div></div>`).join('');
    WH.openSheet(`<header><button class="link" data-act="close">Cancel</button><h2>${s.ID ? 'Edit sign-up' : 'New sign-up'}</h2><button class="link r" id="susv">Save</button></header>
      <div class="list"><div class="field"><label>Title</label><input id="su-t" value="${esc(s.Title || '')}" placeholder="e.g. Christmas party help"></div>
      <div class="field"><label>For</label><select id="su-o">${orgs.map(o => `<option ${o === s.Organization ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></div>
      <div class="field"><label>Closes</label><input id="su-c" type="date" value="${esc(s.Closes || '')}"></div>
      <div class="field col"><label>What it's for (shows on the page)</label><textarea id="su-d">${esc(s.Description || '')}</textarea></div></div>
      <div class="section-h"><span>Slots</span></div><div id="su-sl">${slotRows()}</div>
      <div class="btns"><button class="btn gray" data-act="suSlotAdd">Add a slot</button></div>
      <p class="foot">A slot is one time or one job. "How many" stops sign-ups when it's full.</p>`);
    const sync = () => document.querySelectorAll('[data-slot]').forEach(el => { const x = SL[+el.dataset.slot]; el.querySelectorAll('[data-k]').forEach(i => { x[i.dataset.k] = i.value.trim(); }); });
    WH.act.suSlotAdd = () => { sync(); const last = SL[SL.length - 1] || {}; SL.push({ date: last.date || '', time: '', label: '', need: '' }); document.getElementById('su-sl').innerHTML = slotRows(); };
    WH.act.suSlotDel = el => { sync(); SL.splice(+el.dataset.i, 1); document.getElementById('su-sl').innerHTML = slotRows(); };
    document.getElementById('susv').onclick = async () => {
      sync();
      const row = { ID: s.ID || '', Title: document.getElementById('su-t').value.trim(), Organization: document.getElementById('su-o').value, Closes: document.getElementById('su-c').value, Description: document.getElementById('su-d').value, Status: s.Status || 'Open', Kind: s.Kind || 'Slots', Slots: SL };
      try { const r = await WH.call('signupSave', { row }); WH.closeSheet(); WH.toast('Saved', true); location.hash = '#/x/signups/' + encodeURIComponent(r.id); if (s.ID) suOpen(r.id); } catch (e) { WH.toast(e.message); }
    };
  }
  function suOpen(id) {
    WH.screen('Sign-up', '', WH.skeleton(3), { back: '#/x/signups', backLabel: 'Sign-up sheets' });
    Promise.all([SU ? SU : WH.call('signups', {}), WH.call('signupView', { id })]).then(([l, v]) => { SU = l; SV = v; suDetail(); }).catch(err);
  }
  function suDetail() {
    const { esc, I } = WH, s = SV.sheet, link = suLink(s.id), dinner = s.kind === 'Dinner groups';
    const txt = `Hi! Thank you for signing up for ${s.title}. `, href = sms(SV.phones, txt);
    let h = `<div class="largetitle"><h1 style="font-size:28px;line-height:34px">${esc(s.title)}</h1></div><p class="subtitle">${esc(s.org)}${s.closes ? ' · closes ' + esc(WH.long(s.closes)) : ''} · <span class="chip ${s.open ? 'green' : ''}">${s.open ? 'Open' : 'Closed'}</span></p>
      <div class="btns" style="margin-top:0"><button class="btn" data-act="suShare">Share the link</button><a class="btn gray" style="text-decoration:none" href="${esc(link)}" target="_blank" rel="noopener">Open the page</a></div>
      ${href ? `<div class="btns"><a class="btn gray" style="text-decoration:none" href="${esc(href)}">${I.msg.replace('<svg', '<svg width="18" height="18"')} Text everyone (${SV.phones.length})</a></div>` : ''}`;
    if (s.description) h += `<div class="list" style="margin-top:14px"><div class="row wrap"><div class="main"><div class="s" style="color:var(--text);white-space:pre-wrap">${esc(s.description)}</div></div></div></div>`;
    const person = (p, slot) => `<div class="row"><div class="main"><div class="t">${esc(p.name)}</div><div class="s">${p.phone ? `<a href="tel:${esc(String(p.phone).replace(/[^0-9+]/g, ''))}">${esc(p.phone)}</a>` : 'No phone'}${p.note ? ' · ' + esc(p.note) : ''}${p.by ? ' · added by ' + esc(p.by) : ''}</div></div><button class="link" style="color:var(--red)" data-act="suDrop" data-e="${esc(p.id)}" data-n="${esc(p.name)}">Remove</button></div>`;
    if (dinner) h += `<div class="section-h"><span>Signed up (${SV.joined.length})</span></div><div class="list">${SV.joined.map(p => person(p)).join('') || '<div class="empty">No one yet.</div>'}</div><p class="foot">Everyone who signs up here joins the dinner-groups list. Make the groups in More › Dinner groups.</p>`;
    else SV.slots.forEach(x => {
      h += `<div class="section-h"><span>${esc([x.date ? day(x.date) : '', x.time, x.label].filter(Boolean).join(' · '))}</span><span>${x.count}${x.need ? ' of ' + x.need : ''}</span></div><div class="list">${x.people.map(p => person(p)).join('') || '<div class="empty">No one yet.</div>'}
        <button class="row" data-act="suAdd" data-slot="${esc(x.id)}"><div class="main"><div class="t" style="color:var(--accent)">${I.plus.replace('<svg', '<svg width="14" height="14"')} Add someone</div></div></button></div>`;
    });
    h += `<div class="btns"><button class="btn gray" data-act="suEdit">Edit</button><button class="btn gray" data-act="suToggle">${s.status === 'Closed' ? 'Reopen' : 'Close it'}</button></div><div class="btns"><button class="btn red" data-act="suDel">Remove</button></div>`;
    body(h);
  }
  const suRow = s => ({ ID: s.id, Title: s.title, Organization: s.org, Description: s.description, Closes: s.closes, Status: s.status, Kind: s.kind });
  Object.assign(WH.act, {
    suNew() { SL = [{ date: '', time: '', label: '', need: '' }]; suEditor({ Organization: (SU && SU.orgs[0]) || '' }); },
    suEdit() { SL = SV.sheet.slots.map(x => Object.assign({}, x)); suEditor(suRow(SV.sheet)); },
    suShare() { share(suLink(SV.sheet.id), SV.sheet.title); },
    async suToggle() { const row = Object.assign(suRow(SV.sheet), { Slots: SV.sheet.slots, Status: SV.sheet.status === 'Closed' ? 'Open' : 'Closed' }); if (row.Status === 'Open' && row.Closes && row.Closes < WH.ymd(WH.today())) row.Closes = ''; try { await WH.call('signupSave', { row }); SU = null; suOpen(SV.sheet.id); } catch (e) { WH.toast(e.message); } },
    async suDel() { if (!confirm('Remove this sign-up and everyone on it?')) return; try { await WH.call('signupRemove', { id: SV.sheet.id }); SU = null; location.hash = '#/x/signups'; } catch (e) { WH.toast(e.message); } },
    async suDrop(el) { if (!confirm('Take ' + el.dataset.n + ' off?')) return; try { await WH.call('signupEntryRemove', { id: SV.sheet.id, entry: el.dataset.e }); suOpen(SV.sheet.id); } catch (e) { WH.toast(e.message); } },
    suAdd(el) { WH.form('Add someone', [{ name: 'name', label: 'Name' }, { name: 'phone', label: 'Phone' }, { name: 'note', label: 'Note' }], {}, async row => { await WH.call('signupEntryAdd', Object.assign({ id: SV.sheet.id, slot: el.dataset.slot }, row)); suOpen(SV.sheet.id); }); }
  });

  /* =================================================================== Dinner groups */
  let D = null;
  WH.routes.dinners = {
    view() {
      WH.screen('Dinner groups', 'Small groups of households; hosts take turns', WH.skeleton(4), back);
      WH.call('dinners', {}).then(d => { D = d; dDraw(); }).catch(err);
    }
  };
  const dText = g => `Hi! You're in dinner ${g.name.toLowerCase()} for ${D.season.name}: ${g.members.map(m => m.name + (m.dates.length ? ' (hosts ' + m.dates.map(day).join(', ') + ')' : '')).join('; ')}. Hosts, please send your address the week before. Thank you! ${me().name || ''}`;
  function dDraw() {
    const { esc, I } = WH, s = D.season || {};
    let h = s.name ? `<div class="hero"><div class="k">This season</div><div class="big">${esc(s.name)}</div><div style="color:var(--sub);font-size:15px">${D.groups.length} groups · ${D.groups.reduce((a, g) => a + g.members.length, 0)} households${s.dates && s.dates.length ? ' · dinners ' + s.dates.map(day).join(', ') : ''}</div></div>` : '<div class="list"><div class="empty">No groups yet this season.</div></div>';
    h += `<div class="btns"><button class="btn" data-act="dnMake">${s.name ? 'Make new groups' : 'Make groups'}</button></div><p class="foot">Groups of about ${D.size} households from everyone on the list below. Last season's groups are kept apart where possible, and those who hosted first last time host later.</p>`;
    D.groups.forEach(g => {
      const ph = [].concat(...g.members.map(m => m.phones)), href = sms(ph, dText(g));
      h += `<div class="section-h"><span>${esc(g.name)}</span>${href ? `<a href="${esc(href)}">Text group</a>` : ''}</div><div class="list">${g.members.map(m => `<button class="row" data-act="dnMove" data-id="${esc(m.id)}"><div class="main"><div class="t">${esc(m.name)}</div><div class="s">${m.dates.length ? 'Hosts ' + esc(m.dates.map(day).join(', ')) : 'Host turn ' + m.host}${m.phones.length ? '' : ' · <span style="color:var(--orange)">no phone</span>'}</div></div>${m.newer ? '<span class="chip blue">Newer</span>' : ''}${m.host === 1 ? '<span class="chip green">Hosts first</span>' : ''}</button>`).join('')}</div>`;
    });
    h += `<div class="section-h big"><span>Who wants to be in a group</span><span style="font-size:15px;font-weight:400;color:var(--sub)">${D.pool.length}</span></div>
      <div class="list"><div class="field"><input id="dn-n" list="dl-hh" placeholder="Add a household" autocomplete="off" style="text-align:left;color:var(--text)"><button class="btn small" data-act="dnAdd">Add</button></div>
      <div class="field"><label style="flex:1">Newer to the ward</label><span class="toggle"><input type="checkbox" id="dn-new"><span></span></span></div></div>
      <datalist id="dl-hh">${D.households.map(n => `<option value="${esc(n)}">`).join('')}</datalist>
      <details class="list" style="margin-top:10px;padding:10px 16px"><summary style="cursor:pointer">Everyone on the list (${D.pool.length})</summary>${D.pool.map(p => `<div class="row" style="padding:8px 0"><div class="main"><div class="t">${esc(p.name)}</div><div class="s">${p.newer ? 'Newer to the ward · ' : ''}${p.phones ? p.phones + ' phone' + (p.phones > 1 ? 's' : '') : 'no phone'}${p.page ? ' · signed up on the link' : ''}</div></div><button class="link" style="color:var(--red)" data-act="dnOut" data-id="${esc(p.id)}" data-n="${esc(p.name)}">Remove</button></div>`).join('')}</details>
      <div class="btns">${D.signup ? `<button class="btn gray" data-act="dnShare">Share the sign-up link</button><button class="btn gray" data-go="#/x/signups/${encodeURIComponent(D.signup.id)}">Who signed up</button>` : '<button class="btn gray" data-act="dnLink">Make a sign-up link</button>'}</div>
      <p class="foot">Households can join themselves with the sign-up link (name and phone). Phones come from the ward list, or from what they typed on the link.</p>`;
    body(h);
  }
  const parseDates = s => String(s || '').split(/[\n,;]+/).map(x => x.trim()).filter(Boolean).map(x => /^\d{4}-\d\d-\d\d$/.test(x) ? x : (isNaN(Date.parse(x)) ? '' : WH.ymd(new Date(x)))).filter(Boolean);
  Object.assign(WH.act, {
    dnMake() {
      const s = D.season || {}, y = new Date().getFullYear();
      WH.form('Make groups', [{ name: 'season', label: 'Season', ph: y + ' Spring' }, { name: 'size', label: 'Households per group', type: 'number' }, { name: 'dates', label: 'Dinner dates, one per line (each household hosts in turn)', type: 'textarea' }],
        { season: '', size: D.size, dates: '' }, async row => {
          if (row.season === s.name && !confirm('Remake ' + s.name + '? Its groups will be replaced.')) throw new Error('Not changed');
          const r = await WH.call('dinnerMake', { season: row.season, size: row.size, dates: parseDates(row.dates) });
          WH.toast(r.groups + ' groups' + (r.repeats ? ' · ' + r.repeats + ' pairs repeat from last season' : ''), true); WH.routes.dinners.view();
        });
    },
    dnMove(el) {
      const { esc } = WH, m = [].concat(...D.groups.map(g => g.members)).find(x => x.id === el.dataset.id); if (!m) return;
      WH.openSheet(`<header><button class="link" data-act="close">Cancel</button><h2>${esc(m.name)}</h2><span style="min-width:64px"></span></header>
        <div class="list">${D.groups.map(g => `<button class="row" data-act="dnMoveTo" data-id="${esc(m.id)}" data-g="${esc(g.name.replace(/\D/g, ''))}"><div class="main"><div class="t">Move to ${esc(g.name)}</div><div class="s">${esc(g.members.map(x => x.name).join(', '))}</div></div></button>`).join('')}
        <button class="row" data-act="dnMoveTo" data-id="${esc(m.id)}" data-g="0"><div class="main"><div class="t">Start a new group</div></div></button></div>
        ${m.phones.length ? `<div class="btns">${m.phones.map(p => `<a class="btn small gray" style="text-decoration:none" href="${esc(sms([p], 'Hi ' + p.n.split(' ')[0] + ', '))}">Text ${esc(p.n.split(' ')[0])}</a>`).join('')}</div>` : ''}`);
    },
    async dnMoveTo(el) { try { await WH.call('dinnerMove', { id: el.dataset.id, group: +el.dataset.g }); WH.closeSheet(); WH.routes.dinners.view(); } catch (e) { WH.toast(e.message); } },
    async dnAdd() { const n = document.getElementById('dn-n').value.trim(); if (!n) return; try { await WH.call('dinnerOptIn', { name: n, newer: document.getElementById('dn-new').checked }); WH.toast('Added', true); WH.routes.dinners.view(); } catch (e) { WH.toast(e.message); } },
    async dnOut(el) { if (!confirm('Take ' + el.dataset.n + ' off the list?')) return; try { await WH.call('dinnerOptOut', { id: el.dataset.id }); WH.routes.dinners.view(); } catch (e) { WH.toast(e.message); } },
    dnShare() { share(suLink(D.signup.id), D.signup.title); },
    async dnLink() {
      try { const r = await WH.call('signupSave', { row: { Title: 'Dinner groups', Organization: D.org, Kind: 'Dinner groups', Description: 'Join a small group of households for dinner. Each household takes a turn hosting.' } }); share(suLink(r.id), 'Dinner groups'); WH.routes.dinners.view(); } catch (e) { WH.toast(e.message); }
    }
  });
})();
