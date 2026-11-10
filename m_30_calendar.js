/* Calendar: one ward calendar with repeating activities; building requests and approvals. */
(function () {
  const WH = window.WH = window.WH || {}; WH.routes = WH.routes || {}; WH.act = WH.act || {}; WH.more = WH.more || []; WH.tabViews = WH.tabViews || {};
  const BLD = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 17h14M5 17V8l5-4 5 4v9M8.5 17v-4h3v4"/></svg>';
  WH.more.push({ title: 'Building', sub: 'Requests and approvals', href: '#/x/building', icon: BLD, color: '#8E8E93', order: 30, show: () => WH.isBish() || WH.can('building') });
  const REPEAT = ['', 'Weekly', 'Every other week', 'Monthly (same weekday)'];
  let C = null;

  WH.tabViews.calendar = function () {
    const { screen, cached, skeleton, errorBox } = WH;
    screen('Calendar', 'Ward, organizations and stake', skeleton(5), { right: '<span class="caladd"></span>' });
    cached('calendar', 'calendar', {}, d => {
      if (!d) return;
      if (d.error) {
        if (/latest engine/.test(d.error)) return WH.legacyCalendar ? WH.legacyCalendar() : (document.getElementById('body').innerHTML = errorBox(d.error));
        document.getElementById('body').innerHTML = errorBox(d.error); return;
      }
      C = d; draw();
    });
  };
  function draw() {
    const { esc, fmt, pd, ORGCOLOR, store, I } = WH, d = C, body = document.getElementById('body'); if (!body) return;
    if (d.canAdd) document.querySelectorAll('.caladd').forEach(x => { x.innerHTML = `<button class="btn small" data-act="calNew">${I.plus} Add</button>`; });
    const orgs = [...new Set(d.events.map(e => e.org))].sort(), pick = store.get('calOrg', '');
    let h = '';
    if (d.pending) h += `<div class="list" style="margin-bottom:10px"><button class="row" data-go="#/x/inbox"><div class="main"><div class="t">${d.pending} event${d.pending > 1 ? 's' : ''} waiting for approval</div><div class="s">From linked calendars and scans</div></div><span class="chip orange">Review</span>${I.chev}</button></div>`;
    h += `<div class="dates" style="margin-bottom:10px"><button class="date ${!pick ? 'on' : ''}" style="min-width:auto" data-act="calOrg" data-org=""><div class="d" style="font-size:15px;padding:4px 2px">All</div></button>${orgs.map(o => `<button class="date ${pick === o ? 'on' : ''}" style="min-width:auto" data-act="calOrg" data-org="${esc(o)}"><div class="d" style="font-size:15px;padding:4px 2px;white-space:nowrap">${esc(o)}</div></button>`).join('')}</div>`;
    const list = d.events.filter(e => !pick || e.org === pick);
    let month = '';
    if (!list.length) h += '<div class="list"><div class="empty">Nothing coming up.</div></div>';
    list.slice(0, 200).forEach(e => {
      const m = fmt(e.date, { month: 'long', year: 'numeric' });
      if (m !== month) { if (month) h += '</div>'; h += `<div class="section-h"><span>${esc(m)}</span></div><div class="list">`; month = m; }
      const tag = e.id ? `button data-act="calOpen" data-id="${esc(e.id)}" data-date="${e.date}"` : 'div';
      h += `<${tag} class="row ic"><span class="icon" style="background:${ORGCOLOR[e.org] || '#8E8E93'};font-size:12px;font-weight:700;flex-direction:column;line-height:1"><span style="font-size:9px;opacity:.85">${esc(fmt(e.date, { weekday: 'short' }).toUpperCase())}</span>${pd(e.date).getDate()}</span><div class="main"><div class="t">${esc(e.title)}</div><div class="s">${[e.time ? e.time + (e.endTime ? '–' + e.endTime : '') : '', e.place, e.org, e.repeat ? '↻ ' + e.repeat.toLowerCase() : ''].filter(Boolean).map(esc).join(' · ')}</div></div>${e.public ? '' : ''}${e.id ? I.chev : ''}</${tag.split(' ')[0]}>`;
    });
    if (month) h += '</div>';
    const api = WH.S.api;
    h += `<div class="section-h"><span>Share</span></div><div class="list">
      <a class="row" href="calendar.html"><div class="main"><div class="t">Public ward calendar</div><div class="s">Events marked public, for anyone</div></div>${I.chev}</a>
      ${api ? `<a class="row" href="${esc(api.replace(/^https:/, 'webcal:'))}?action=ics"><div class="main"><div class="t">Add to my phone's calendar</div><div class="s">Public events keep updating on their own</div></div>${I.chev}</a>` : ''}
      <a class="row" href="building.html"><div class="main"><div class="t">Request the building</div></div>${I.chev}</a></div>`;
    body.innerHTML = h;
  }
  const fields = () => [{ name: 'Title' }, { name: 'Date', type: 'date' }, { name: 'Start', ph: '7:00 PM' }, { name: 'End', ph: '8:30 PM' }, { name: 'Organization', type: 'select', options: C.orgs }, { name: 'Place' },
    { name: 'Public', label: 'On the public calendar', type: 'toggle' }, { name: 'Repeat', type: 'select', options: REPEAT.slice(1) }, { name: 'Until', label: 'Repeats until', type: 'date' }, { name: 'End date', label: 'Ends (multi-day)', type: 'date' }, { name: 'Permission form', label: 'Youth need permission forms', type: 'toggle' }, { name: 'Notes', type: 'textarea' }];
  Object.assign(WH.act, {
    calOrg(el) { WH.store.set('calOrg', el.dataset.org); draw(); },
    calNew() {
      WH.form('New event', fields(), { Organization: C.orgs[0], Date: WH.ymd(WH.today()) }, async row => {
        if (!row.Title || !row.Date) throw new Error('Add a title and a date');
        row.Status = 'Approved'; await WH.call('save', { tab: 'Events', row }); WH.store.del('c:calendar'); WH.store.del('c:today'); WH.tabViews.calendar();
      });
    },
    async calOpen(el) {
      let r; try { r = await WH.call('event', { id: el.dataset.id }); } catch (e) { WH.toast(e.message); return; }
      const e = r.event, date = el.dataset.date, { esc } = WH;
      if (!r.canEdit) {
        WH.openSheet(`<header><span style="min-width:64px"></span><h2>${esc(e.Title)}</h2><button class="link r" data-act="close">Done</button></header><div class="list">${WH.kv('Date', WH.long(date))}${WH.kv('Time', [e.Start, e.End].filter(Boolean).join('–'))}${WH.kv('Place', e.Place)}${WH.kv('Organization', e.Organization)}${e.Repeat ? WH.kv('Repeats', e.Repeat) : ''}</div>${e.Notes ? `<p class="foot">${esc(e.Notes)}</p>` : ''}${WH.isBish() || WH.can('leader') || WH.can('teacher') ? `<div class="btns"><button class="btn gray" data-act="evPic" data-h="#/x/graphic/${encodeURIComponent(new URLSearchParams({ kicker: /Young|Youth/.test(e.Organization || '') ? 'Youth activity' : (e.Organization || ''), title: e.Title || '', date: WH.fmt(date, { weekday: 'long', month: 'short', day: 'numeric' }), time: e.Start || '', place: e.Place || '' }).toString())}">Picture for a text</button></div>` : ''}`);
        return;
      }
      const extra = e.Repeat ? `<div class="btns" style="margin:0 0 12px"><button class="btn gray" id="skipone">Not happening ${esc(WH.fmt(date, { month: 'short', day: 'numeric' }))}</button></div>` : '';
      WH.form('Event', fields(), e, async row => { row.ID = e.ID; await WH.call('save', { tab: 'Events', row }); WH.store.del('c:calendar'); WH.store.del('c:today'); WH.tabViews.calendar(); },
        async () => { await WH.call('remove', { tab: 'Events', id: e.ID }); WH.store.del('c:calendar'); WH.tabViews.calendar(); }, extra);
      const sk = document.getElementById('skipone');
      if (sk) sk.onclick = async () => { try { await WH.call('skipDate', { id: e.ID, date }); WH.closeSheet(); WH.toast('Skipped ' + WH.fmt(date), true); WH.store.del('c:calendar'); WH.tabViews.calendar(); } catch (x) { WH.toast(x.message); } };
    }
  });

  /* ---------- Building requests (scheduler and bishopric) ---------- */
  WH.routes.building = {
    view() {
      const { screen, skeleton, errorBox, esc, fmt, I } = WH;
      screen('Building', 'Requests and reservations', skeleton(4), { back: '#/more', backLabel: 'More' });
      WH.call('building', {}).then(d => {
        const req = d.list.filter(b => b.Status === 'Requested'), ok = d.list.filter(b => b.Status === 'Approved');
        const row = b => `<button class="row" data-act="bldOpen" data-id="${esc(b.ID)}"><div class="main"><div class="t">${esc(b.For || b.Contact)}</div><div class="s">${esc(fmt(b.Date, { weekday: 'short', month: 'short', day: 'numeric' }))} · ${esc(b.Start)}–${esc(b.End)} · ${esc(b.Rooms)}</div></div><span class="chip ${b.Status === 'Requested' ? 'orange' : 'green'}">${b.Kind === 'Family' ? 'Family' : esc(b.Kind)}</span>${I.chev}</button>`;
        document.getElementById('body').innerHTML = `<div class="section-h big"><span>To decide</span>${req.length ? `<span class="chip orange">${req.length}</span>` : ''}</div>${req.length ? '<div class="list">' + req.map(row).join('') + '</div>' : '<div class="list"><div class="empty">No requests waiting.</div></div>'}
          <div class="section-h big"><span>Reserved</span></div>${ok.length ? '<div class="list">' + ok.map(row).join('') + '</div>' : '<div class="list"><div class="empty">Nothing reserved yet.</div></div>'}
          <div class="btns"><a class="btn gray" href="building.html">Make a reservation</a></div>
          <p class="foot">Family limits: up to ${d.rules.hours} hours each, ${d.rules.maxOpen} at a time, ${d.rules.weeks} weeks ahead; inside ${d.rules.lastMinuteDays} days anyone can add more. Change these in Settings.</p>`;
        WH.bld = d;
      }).catch(e => { document.getElementById('body').innerHTML = errorBox(e.message); });
    }
  };
  Object.assign(WH.act, {
    bldOpen(el) {
      const b = WH.bld.list.find(x => x.ID === el.dataset.id), { esc, kv } = WH; if (!b) return;
      const tel = String(b.Phone || '').replace(/[^\d+]/g, '');
      WH.openSheet(`<header><span style="min-width:64px"></span><h2>${esc(b.For || b.Contact)}</h2><button class="link r" data-act="close">Done</button></header>
        <div class="list">${kv('Date', WH.long(b.Date))}${kv('Time', b.Start + '–' + b.End)}${kv('Rooms', b.Rooms)}${kv('Kind', b.Kind)}${kv('Contact', b.Contact)}${kv('Phone', b.Phone)}${kv('Email', b.Email)}${b.Purpose ? kv('Purpose', b.Purpose) : ''}${kv('Status', b.Status)}</div>
        ${tel ? `<div class="btns"><a class="btn gray" href="sms:${tel}">Text ${esc(String(b.Contact).split(' ')[0])}</a></div>` : ''}
        <div class="btns">${b.Status === 'Requested' ? `<button class="btn" data-act="bldDecide" data-id="${esc(b.ID)}" data-d="approve">Approve</button><button class="btn red" data-act="bldDecide" data-id="${esc(b.ID)}" data-d="decline">Decline</button>` : `<button class="btn red" data-act="bldDecide" data-id="${esc(b.ID)}" data-d="cancel">Cancel reservation</button>`}</div>
        <p class="foot">While emails are paused, let them know by text.</p>`);
    },
    async bldDecide(el) {
      try { await WH.call('buildingDecide', { id: el.dataset.id, decision: el.dataset.d }); WH.closeSheet(); WH.toast('Done', true); WH.routes.building.view(); } catch (e) { WH.toast(e.message); }
    }
  });
  WH.act = WH.act || {}; WH.act.evPic = el => { WH.closeSheet(); location.hash = el.dataset.h; };
})();
