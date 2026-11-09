/* Leaders: meetings and minutes, tasks, announcements, appointments and booking, youth protection, inbox. */
(function () {
  const WH = window.WH = window.WH || {}; WH.routes = WH.routes || {}; WH.act = WH.act || {}; WH.more = WH.more || [];
  const ic = p => `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const lead = () => WH.isBish() || WH.can('clerk') || WH.can('leader');
  WH.more.push(
    { title: 'Meetings', sub: 'Agendas, notes and minutes', href: '#/x/meetings', icon: ic('<rect x="3" y="4" width="14" height="13" rx="2"/><path d="M3 8h14M7 2.5v3M13 2.5v3M6.5 11.5h7M6.5 14h4"/>'), color: '#5856D6', order: 20, show: lead, group: 'Leaders' },
    { title: 'Tasks', sub: 'Everyone\'s to-dos', href: '#/x/tasks', icon: ic('<path d="M4 5.5l1.5 1.5L8 4.5M4 11l1.5 1.5L8 10M10.5 6h6M10.5 11.5h6M4 16h12"/>'), color: '#FF3B30', order: 21, show: lead, group: 'Leaders' },
    { title: 'Announcements', sub: 'Submit and approve', href: '#/x/announcements', icon: ic('<path d="M3 8v4l9 4V4L3 8zM12 7h2.5a2.5 2.5 0 0 1 0 5H12M5 12.5l1 4h2.5"/>'), color: '#FF9500', order: 22, show: lead, group: 'Leaders' },
    { title: 'Appointments', sub: 'Interviews and booking links', href: '#/x/appointments', icon: ic('<circle cx="10" cy="10" r="7"/><path d="M10 6v4l3 2"/>'), color: '#30B0C7', order: 23, show: () => WH.isBish(), group: 'Leaders' },
    { title: 'Youth protection', sub: 'Training and reminders', href: '#/x/training', icon: ic('<path d="M10 2.5l6 2.5v4.5c0 3.9-2.5 6.6-6 8-3.5-1.4-6-4.1-6-8V5z"/><path d="M7.5 10l2 2 3.5-3.5"/>'), color: '#34C759', order: 24, show: () => WH.isBish() || (WH.S.boot.me.orgs || []).some(o => /^(Young Women|Young Men|Primary)$/.test(o)), group: 'Leaders' },
    { title: 'Inbox', sub: 'Calendars and scans to approve', href: '#/x/inbox', icon: ic('<path d="M3 11l2.5-6.5h9L17 11v5H3zM3 11h4l1 2h4l1-2h4"/>'), color: '#8E8E93', order: 25, show: () => WH.can('admin'), group: 'Leaders' }
  );
  const back = { back: '#/more', backLabel: 'More' };
  const err = e => { const b = document.getElementById('body'); if (b) b.innerHTML = WH.errorBox(e.message || e); };

  /* ---------- Meetings ---------- */
  let MT = null, MTL = null;
  WH.routes.meetings = {
    view(args) {
      if (args && args[0]) return meetingView(decodeURIComponent(args[0]));
      WH.screen('Meetings', '', WH.skeleton(4), Object.assign({ right: '<span class="mtadd"></span>' }, back));
      WH.call('meetings', {}).then(d => {
        MTL = d; document.querySelectorAll('.mtadd').forEach(x => x.innerHTML = (d.types || []).length ? `<button class="btn small" data-act="mtNew">${WH.I.plus} New</button>` : '');
        const { esc, fmt, I, ymd, today } = WH, t = ymd(today());
        const up = d.meetings.filter(m => m.Date >= t), past = d.meetings.filter(m => m.Date < t).reverse();
        const row = m => `<button class="row" data-go="#/x/meetings/${encodeURIComponent(m.ID)}"><div class="main"><div class="t">${esc(m.Type === 'Presidency' ? m.Organization + ' presidency' : m.Type)}</div><div class="s">${esc(fmt(m.Date, { weekday: 'short', month: 'short', day: 'numeric' }))}${m.Time ? ' · ' + esc(m.Time) : ''}</div></div>${m['Minutes sent'] ? '<span class="chip green">Minutes sent</span>' : m.Status === 'Held' ? '<span class="chip">Held</span>' : ''}${I.chev}</button>`;
        document.getElementById('body').innerHTML = `<div class="section-h big"><span>Coming up</span></div>${up.length ? '<div class="list">' + up.map(row).join('') + '</div>' : '<div class="list"><div class="empty">Nothing scheduled.</div></div>'}
          ${past.length ? `<div class="section-h big"><span>Earlier</span></div><div class="list">${past.slice(0, 12).map(row).join('')}</div>` : ''}<p class="foot">Bishopric and ward council meetings are added from the schedule in Settings, with their usual agenda. Tap New for a presidency meeting, youth council, or missionary or temple and family history coordination.</p>`;
      }).catch(err);
    }
  };
  function meetingView(id) {
    WH.screen('Meeting', '', WH.skeleton(5), { back: '#/x/meetings', backLabel: 'Meetings' });
    WH.call('meeting', { id }).then(d => { MT = d; drawMeeting(); }).catch(err);
  }
  function drawMeeting() {
    const { esc, I, long, kv } = WH, d = MT, m = d.meeting;
    document.querySelector('.largetitle h1').textContent = m.Type === 'Presidency' ? m.Organization + ' presidency' : m.Type;
    document.querySelector('.subtitle') && (document.querySelector('.subtitle').textContent = long(m.Date));
    let h = `<p class="subtitle">${esc(long(m.Date))}${m.Time ? ' · ' + esc(m.Time) : ''}</p>`;
    h += `<div class="list">${kv('Opening prayer', m['Opening prayer'], d.canEdit ? 'mtEdit' : '')}${kv('Spiritual thought', m['Spiritual thought'], d.canEdit ? 'mtEdit' : '')}${kv('Closing prayer', m['Closing prayer'], d.canEdit ? 'mtEdit' : '')}</div>`;
    h += `<div class="section-h big"><span>Agenda</span><button class="link" style="font-size:15px" data-act="agAdd">Add</button></div>`;
    h += d.items.length ? '<div class="list">' + d.items.map(a => `<button class="row wrap" ${d.canEdit ? `data-act="agEdit" data-id="${esc(a.ID)}"` : ''}><div class="main"><div class="t">${esc(a.Item)}</div><div class="s">${[a.Lead, a.Minutes ? a.Minutes + ' min' : ''].filter(Boolean).map(esc).join(' · ')}</div>${a.Notes ? `<div class="s" style="color:var(--text);margin-top:4px">${esc(a.Notes)}</div>` : ''}${a.Decision ? `<div class="s" style="color:var(--green);margin-top:4px">Decided: ${esc(a.Decision)}</div>` : ''}</div>${d.canEdit ? I.chev : ''}</button>`).join('') + '</div>' : '<div class="list"><div class="empty">No agenda items yet.</div></div>';
    if (d.tasks.length) h += `<div class="section-h big"><span>Assignments</span></div><div class="list">${d.tasks.map(t => `<div class="row"><div class="main"><div class="t">${esc(t.Task)}</div><div class="s">${esc(t.Owner)}${t.Due ? ' · ' + esc(WH.fmt(t.Due)) : ''}</div></div><span class="chip ${t.Status === 'Done' ? 'green' : ''}">${esc(t.Status)}</span></div>`).join('')}</div>`;
    if (m.Summary) h += `<div class="section-h big"><span>Key points</span></div><div class="list"><div class="row wrap"><div class="main"><div class="s" style="color:var(--text);font-size:15px;line-height:1.5;white-space:pre-line">${esc(m.Summary)}</div></div></div></div>`;
    if (d.canEdit && WH.recordBox) h += WH.recordBox(d);
    if (d.canEdit) h += `<div class="section-h big"><span>Notes</span></div><div class="list"><div class="field col"><textarea id="mtnotes" style="min-height:90px" placeholder="General notes">${esc(m.Notes || '')}</textarea></div></div>
      <div class="btns"><button class="btn gray" data-act="mtSaveNotes">Save notes</button><button class="btn" data-act="mtMinutes">Send minutes</button></div>
      <p class="foot">Minutes open in your own email with everything filled in${d.emails.length ? ' for ' + d.emails.length + ' people' : ''}.</p>`;
    document.getElementById('body').innerHTML = h;
  }
  WH.meetingReload = () => meetingView(MT.meeting.ID);
  WH.meetingNow = () => MT;
  function minutesText() {
    const d = MT, m = d.meeting, L = [];
    L.push(m.Type + ' · ' + WH.long(m.Date)); L.push('');
    if (m['Opening prayer']) L.push('Opening prayer: ' + m['Opening prayer']);
    if (m['Spiritual thought']) L.push('Spiritual thought: ' + m['Spiritual thought']);
    L.push('');
    if (m.Summary) { L.push('Key points'); L.push(m.Summary); L.push(''); }
    d.items.forEach((a, i) => { L.push((i + 1) + '. ' + a.Item + (a.Lead ? ' (' + a.Lead + ')' : '')); if (a.Notes) L.push('   ' + a.Notes); if (a.Decision) L.push('   Decided: ' + a.Decision); });
    if (d.tasks.length) { L.push(''); L.push('Assignments:'); d.tasks.forEach(t => L.push('• ' + t.Task + ' — ' + t.Owner + (t.Due ? ' (by ' + WH.fmt(t.Due) + ')' : ''))); }
    if (m.Notes) { L.push(''); L.push(m.Notes); }
    if (m['Closing prayer']) { L.push(''); L.push('Closing prayer: ' + m['Closing prayer']); }
    return L.join('\n');
  }
  Object.assign(WH.act, {
    mtNew() {
      const d = MTL; WH.form('New meeting', [{ name: 'type', label: 'Meeting', type: 'select', options: d.types }, { name: 'org', label: 'Organization (presidency meetings)', type: 'select', options: d.orgs }, { name: 'date', label: 'Date', type: 'date' }, { name: 'time', label: 'Time', ph: '7:00 PM' }],
        { type: d.types[0], org: d.orgs[0], date: WH.ymd(WH.today()) }, async row => { const r = await WH.call('meetingNew', row); location.hash = '#/x/meetings/' + encodeURIComponent(r.id); });
    },
    async mtEdit() { await WH.loadNames(); const m = MT.meeting; WH.form('Meeting', [{ name: 'Opening prayer', list: 'people' }, { name: 'Spiritual thought', list: 'people' }, { name: 'Closing prayer', list: 'people' }, { name: 'Time' }, { name: 'Status', type: 'select', options: ['Planned', 'Held', 'Cancelled'] }], m, async row => { row.ID = m.ID; await WH.call('meetingSave', { row }); meetingView(m.ID); }); },
    agAdd() {
      if (!MT.canEdit) { const it = prompt('What should be on the agenda?'); if (it) WH.call('agendaAdd', { meeting: MT.meeting.ID, item: it }).then(() => { WH.toast('Added', true); meetingView(MT.meeting.ID); }).catch(e => WH.toast(e.message)); return; }
      WH.form('Agenda item', [{ name: 'Item', type: 'textarea' }, { name: 'Lead', list: 'people' }, { name: 'Minutes', type: 'number' }], { Order: MT.items.length + 1 }, async row => { row.Meeting = MT.meeting.ID; row.Order = MT.items.length + 1; row.Source = WH.S.boot.me.name; await WH.call('agendaSave', { row }); meetingView(MT.meeting.ID); });
    },
    async agEdit(el) {
      const a = MT.items.find(x => x.ID === el.dataset.id); await WH.loadNames();
      WH.form('Agenda item', [{ name: 'Item', type: 'textarea' }, { name: 'Lead', list: 'people' }, { name: 'Minutes', type: 'number' }, { name: 'Order', type: 'number' }, { name: 'Notes', type: 'textarea' }, { name: 'Decision', type: 'textarea' }], a,
        async row => { row.ID = a.ID; row.Meeting = MT.meeting.ID; await WH.call('agendaSave', { row }); meetingView(MT.meeting.ID); },
        async () => { await WH.call('agendaSave', { row: { ID: a.ID }, remove: true }); meetingView(MT.meeting.ID); },
        `<div class="btns" style="margin:0 0 12px"><button class="btn gray" id="mkTask">Make it an assignment</button></div>`);
      document.getElementById('mkTask').onclick = () => { WH.closeSheet(); taskForm({ Task: a.Item, Owner: a.Lead, Source: MT.meeting.ID, Organization: 'Ward', Status: 'Not started' }, () => meetingView(MT.meeting.ID)); };
    },
    async mtSaveNotes() { try { await WH.call('meetingSave', { row: { ID: MT.meeting.ID, Notes: document.getElementById('mtnotes').value } }); WH.toast('Saved', true); } catch (e) { WH.toast(e.message); } },
    async mtMinutes() {
      const n = document.getElementById('mtnotes'); if (n) MT.meeting.Notes = n.value;
      const body = minutesText(); try { await navigator.clipboard.writeText(body); } catch (e) { }
      await WH.call('meetingSave', { row: { ID: MT.meeting.ID, Notes: MT.meeting.Notes || '' } }).catch(() => { });
      WH.call('minutesSent', { id: MT.meeting.ID }).catch(() => { });
      location.href = 'mailto:?bcc=' + (MT.emails || []).join(',') + '&subject=' + encodeURIComponent('Minutes · ' + MT.meeting.Type + ' · ' + WH.fmt(MT.meeting.Date)) + '&body=' + encodeURIComponent(body.slice(0, 1800));
    }
  });

  /* ---------- Tasks ---------- */
  let TK = null, tkMine = true;
  const TASK_ORGS = ['Ward', 'Bishopric', 'Relief Society', 'Elders Quorum', 'Young Women', 'Young Men', 'Primary', 'Sunday School', 'Temple & Family History', 'Ward Mission', 'Activities'];
  WH.routes.tasks = {
    view() {
      WH.screen('Tasks', '', WH.skeleton(5), Object.assign({ right: '<span class="tkadd"></span>' }, back));
      WH.call('tasks', {}).then(d => { TK = d; drawTasks(); }).catch(err);
    }
  };
  function drawTasks() {
    const { esc, I, rel, ymd, today } = WH, t = ymd(today());
    document.querySelectorAll('.tkadd').forEach(x => x.innerHTML = `<button class="btn small" data-act="tkNew">${I.plus} Add</button>`);
    const list = TK.tasks.filter(x => x.Status !== 'Done' && (!tkMine || x.mine));
    const done = TK.tasks.filter(x => x.Status === 'Done' && (!tkMine || x.mine)).slice(-10).reverse();
    let h = `<div class="seg" style="margin-bottom:12px"><button class="${tkMine ? 'on' : ''}" data-act="tkMine" data-v="1">Mine</button><button class="${!tkMine ? 'on' : ''}" data-act="tkMine" data-v="0">Everyone's</button></div>`;
    h += list.length ? '<div class="list">' + list.map(x => `<button class="row wrap" data-act="tkOpen" data-id="${esc(x.ID)}"><span class="check" data-act="tkDone" data-id="${esc(x.ID)}"></span><div class="main"><div class="t">${esc(x.Task)}</div><div class="s">${[tkMine ? '' : x.Owner, x.Organization, x.Status !== 'Not started' ? x.Status : ''].filter(Boolean).map(esc).join(' · ')}</div></div>${x.Due ? `<span class="chip ${x.Due < t ? 'red' : rel(x.Due) === 'Today' ? 'orange' : ''}">${esc(rel(x.Due))}</span>` : ''}</button>`).join('') + '</div>' : `<div class="list"><div class="empty">${tkMine ? 'Nothing on your list.' : 'No open tasks.'}</div></div>`;
    if (done.length) h += `<div class="section-h"><span>Recently done</span></div><div class="list">${done.map(x => `<div class="row done"><span class="check on"></span><div class="main"><div class="t">${esc(x.Task)}</div></div></div>`).join('')}</div>`;
    document.getElementById('body').innerHTML = h;
  }
  async function taskForm(t, after) {
    await WH.loadNames();
    WH.form(t.ID ? 'Task' : 'New task', [{ name: 'Task', type: 'textarea' }, { name: 'Owner', list: 'people', ph: 'Name or calling' }, { name: 'Organization', type: 'select', options: TASK_ORGS }, { name: 'Due', type: 'date' }, { name: 'Status', type: 'select', options: ['Not started', 'In progress', 'Waiting', 'Done'] }, { name: 'Notes', type: 'textarea' }], t,
      async row => { if (t.ID) row.ID = t.ID; if (t.Source) row.Source = t.Source; if (!t.ID) row.Created = WH.ymd(WH.today()); if (row.Status === 'Done') row['Done on'] = WH.ymd(WH.today()); await WH.call('save', { tab: 'Tasks', row }); WH.store.del('c:today'); (after || WH.routes.tasks.view)(); },
      t.ID ? async () => { await WH.call('remove', { tab: 'Tasks', id: t.ID }); WH.routes.tasks.view(); } : null);
  }
  WH.taskForm = taskForm;
  Object.assign(WH.act, {
    tkMine(el) { tkMine = el.dataset.v === '1'; drawTasks(); },
    tkNew() { taskForm({ Owner: WH.S.boot.me.name, Organization: (WH.S.boot.me.orgs || [])[0] || 'Ward', Status: 'Not started' }); },
    tkOpen(el, ev) { const t = TK.tasks.find(x => x.ID === el.dataset.id); if (t) taskForm(t); },
    async tkDone(el) {
      el.classList.add('on'); el.closest('.row').classList.add('done');
      try { await WH.call('save', { tab: 'Tasks', row: { ID: el.dataset.id, Status: 'Done', 'Done on': WH.ymd(WH.today()) } }); WH.store.del('c:today'); setTimeout(() => WH.routes.tasks.view(), 500); } catch (e) { WH.toast(e.message); }
    }
  });

  /* ---------- Announcements ---------- */
  let AN = null;
  WH.routes.announcements = {
    view() {
      WH.screen('Announcements', 'For the program and the pulpit', WH.skeleton(4), Object.assign({ right: '<span class="anadd"></span>' }, back));
      WH.call('announcements', {}).then(d => { AN = d; drawAnn(); }).catch(err);
    }
  };
  function drawAnn() {
    const { esc, I, fmt } = WH;
    document.querySelectorAll('.anadd').forEach(x => x.innerHTML = `<button class="btn small" data-act="anNew">${I.plus} Add</button>`);
    const nw = AN.list.filter(a => a.Status === 'New'), ok = AN.list.filter(a => a.Status === 'Approved');
    const row = a => `<button class="row wrap" data-act="anOpen" data-id="${esc(a.ID)}"><span class="dot" style="background:${WH.ORGCOLOR[a.Organization] || '#8E8E93'}"></span><div class="main"><div class="t" style="font-size:15px">${esc(a.Text)}</div><div class="s">${esc(a.Organization)}${a.From || a.Through ? ' · ' + esc([a.From && fmt(a.From), a.Through && fmt(a.Through)].filter(Boolean).join(' – ')) : a['Event date'] ? ' · event ' + esc(fmt(a['Event date'])) : ''}${a['On program'] ? ' · on program' : ''}</div></div>${I.chev}</button>`;
    document.getElementById('body').innerHTML = `${nw.length ? `<div class="section-h big"><span>To approve</span><span class="chip orange">${nw.length}</span></div><div class="list">${nw.map(row).join('')}</div>` : ''}
      <div class="section-h big"><span>Approved</span></div>${ok.length ? '<div class="list">' + ok.map(row).join('') + '</div>' : '<div class="list"><div class="empty">None right now.</div></div>'}
      <p class="foot">Approved announcements show on the conducting sheet between their dates, and on the program when "On program" is on.</p>`;
  }
  const annFields = () => [{ name: 'Text', type: 'textarea' }, { name: 'Organization', type: 'select', options: AN.orgs.length ? AN.orgs : ['Ward'] }, { name: 'Event date', type: 'date' }, { name: 'From', label: 'First Sunday', type: 'date' }, { name: 'Through', label: 'Last Sunday', type: 'date' }, { name: 'On program', type: 'toggle' }];
  Object.assign(WH.act, {
    anNew() { WH.form('Announcement', annFields(), { Organization: AN.orgs[0], 'On program': true }, async row => { row.Status = AN.canApprove ? 'Approved' : 'New'; row['Submitted by'] = WH.S.boot.me.name; row['Submitted on'] = WH.ymd(WH.today()); await WH.call('save', { tab: 'Announcements', row }); WH.routes.announcements.view(); }); },
    anOpen(el) {
      const a = AN.list.find(x => x.ID === el.dataset.id);
      const extra = AN.canApprove && a.Status === 'New' ? `<div class="btns" style="margin:0 0 12px"><button class="btn" id="anOk">Approve</button><button class="btn red" id="anNo">Decline</button></div>` : '';
      WH.form('Announcement', annFields(), a, async row => { row.ID = a.ID; await WH.call('save', { tab: 'Announcements', row }); WH.store.del('c:today'); WH.routes.announcements.view(); },
        async () => { await WH.call('remove', { tab: 'Announcements', id: a.ID }); WH.routes.announcements.view(); }, extra);
      const set = s => async () => { try { await WH.call('save', { tab: 'Announcements', row: { ID: a.ID, Organization: a.Organization, Status: s } }); WH.closeSheet(); WH.store.del('c:today'); WH.routes.announcements.view(); } catch (e) { WH.toast(e.message); } };
      if (extra) { document.getElementById('anOk').onclick = set('Approved'); document.getElementById('anNo').onclick = set('Declined'); }
    }
  });

  /* ---------- Appointments ---------- */
  let AP = null;
  WH.routes.appointments = {
    view() {
      WH.screen('Appointments', '', WH.skeleton(4), back);
      WH.call('appointments', {}).then(d => { AP = d; drawAppts(); }).catch(err);
    }
  };
  function drawAppts() {
    const { esc, fmt, I } = WH, base = location.origin + location.pathname.replace(/[^/]*$/, '');
    const by = {}; AP.list.forEach(a => (by[a.Date] = by[a.Date] || []).push(a));
    let h = `<div class="btns" style="margin-top:0"><button class="btn" data-act="apSlots">${I.plus} Open booking times</button><button class="btn gray" data-act="apNew">Add one</button></div>`;
    h += `<div class="list" style="margin-top:12px">${AP.withList.slice(0, 3).map(w => `<button class="row" data-act="apShare" data-w="${esc(w)}" data-url="${esc(base + 'book.html?with=' + encodeURIComponent(w))}"><div class="main"><div class="t">Booking link · ${esc(w)}</div><div class="s">Shows open and taken times only, never who</div></div><span class="chip blue">Share</span></button>`).join('')}</div>`;
    Object.keys(by).sort().forEach(d => {
      h += `<div class="section-h"><span>${esc(fmt(d, { weekday: 'long', month: 'short', day: 'numeric' }))}</span></div><div class="list">${by[d].map(a => `<button class="row" data-act="apOpen" data-id="${esc(a.ID)}"><div class="main"><div class="t">${esc(a.Time)} · ${a.Status === 'Open' ? '<span style="color:var(--sub)">Open</span>' : esc(a.Person || 'Booked')}</div><div class="s">${[a.With, a.Purpose, a.Place].filter(Boolean).map(esc).join(' · ')}</div></div><span class="chip ${a.Status === 'Open' ? '' : a.Status === 'Booked' ? 'blue' : 'green'}">${esc(a.Status)}</span>${I.chev}</button>`).join('')}</div>`;
    });
    if (!AP.list.length) h += '<div class="list" style="margin-top:12px"><div class="empty">No appointments coming up.</div></div>';
    document.getElementById('body').innerHTML = h;
  }
  const apFields = () => [{ name: 'Date', type: 'date' }, { name: 'Time', ph: '1:15 PM' }, { name: 'Minutes', type: 'number' }, { name: 'With', type: 'select', options: AP.withList }, { name: 'Person', list: 'people' }, { name: 'Purpose' }, { name: 'Place' }, { name: 'Phone' }, { name: 'Status', type: 'select', options: ['Open', 'Booked', 'Done', 'Cancelled', 'No-show'] }, { name: 'Notes', type: 'textarea' }];
  Object.assign(WH.act, {
    async apNew() { await WH.loadNames(); WH.form('Appointment', apFields(), { With: 'Bishop', Minutes: 15, Status: 'Booked', Date: WH.nextSun() }, async row => { await WH.call('save', { tab: 'Appointments', row }); WH.routes.appointments.view(); }); },
    async apOpen(el) {
      const a = AP.list.find(x => x.ID === el.dataset.id); await WH.loadNames();
      const tel = String(a.Phone || '').replace(/[^\d+]/g, '');
      const extra = tel && a.Status === 'Booked' ? `<div class="btns" style="margin:0 0 12px"><a class="btn gray" href="${WH.smsHref ? WH.smsHref([tel], 'Hi ' + String(a.Person).split(' ')[0] + ', reminder of your appointment with the ' + a.With.toLowerCase() + ' on ' + WH.fmt(a.Date, { weekday: 'long', month: 'short', day: 'numeric' }) + ' at ' + a.Time + (a.Place ? ', ' + a.Place : '') + '.') : 'sms:' + tel}">Text a reminder</a></div>` : '';
      WH.form('Appointment', apFields(), a, async row => { row.ID = a.ID; await WH.call('save', { tab: 'Appointments', row }); WH.routes.appointments.view(); }, async () => { await WH.call('remove', { tab: 'Appointments', id: a.ID }); WH.routes.appointments.view(); }, extra);
    },
    apSlots() {
      WH.form('Open booking times', [{ name: 'with', label: 'With', type: 'select', options: AP.withList }, { name: 'kind', label: 'For', type: 'select', options: ['Tithing', 'Interview', 'Booking'] }, { name: 'date', label: 'Date', type: 'date' }, { name: 'start', label: 'From', ph: '1:00 PM' }, { name: 'end', label: 'Until', ph: '3:00 PM' }, { name: 'minutes', label: 'Minutes each', type: 'number' }, { name: 'place', label: 'Place' }],
        { with: 'Bishop', kind: 'Tithing', date: WH.nextSun(), start: '1:00 PM', end: '3:00 PM', minutes: 10, place: "Bishop's office" },
        async row => { const r = await WH.call('makeSlots', row); WH.toast(r.made + ' times opened', true); WH.routes.appointments.view(); });
    },
    async apShare(el) { const url = el.dataset.url; try { if (navigator.share) await navigator.share({ title: 'Book a time with the ' + el.dataset.w.toLowerCase(), url }); else { await navigator.clipboard.writeText(url); WH.toast('Link copied', true); } } catch (e) { } }
  });

  /* ---------- Youth protection ---------- */
  let TR = null;
  WH.routes.training = {
    view() {
      WH.screen('Youth protection', 'Protecting Children and Youth training', WH.skeleton(4), back);
      WH.call('training', {}).then(d => { TR = d; drawTraining(); }).catch(err);
    }
  };
  function drawTraining() {
    const { esc, fmt } = WH, chip = { expired: '<span class="chip red">Expired</span>', due15: '<span class="chip red">15 days</span>', due30: '<span class="chip orange">30 days</span>', due60: '<span class="chip orange">60 days</span>', ok: '<span class="chip green">Current</span>', unknown: '<span class="chip">?</span>', none: '<span class="chip red">No record</span>' };
    const due = r => ['due60', 'due30', 'due15', 'expired', 'none'].indexOf(r.state) >= 0;
    const msg = r => r.state === 'none' ? 'Hi ' + String(r.Person).split(' ')[0] + ', thank you for serving with our ' + (TR.orgs[0] || 'youth') + '. Please complete the Church\'s Protecting Children and Youth training when you can (about 30 minutes): ' + TR.link + ' Thank you!'
      : 'Hi ' + String(r.Person).split(' ')[0] + ', a friendly reminder that your youth protection training ' + (r.days < 0 ? 'has expired' : 'expires ' + fmt(r.Expires, { month: 'long', day: 'numeric' })) + '. It takes about 30 minutes: ' + TR.link + ' Thank you!';
    const n = TR.list.filter(due).length;
    let h = TR.scoped ? `<p class="foot" style="margin-top:0">${esc(TR.orgs.join(' and '))}: your presidency, advisers, leaders and teachers. ${n ? n + ' need a reminder.' : 'Everyone is current.'}</p>` : '';
    if (!TR.list.length) h += '<div class="list"><div class="empty">No training records yet.' + (TR.canPaste ? ' Paste the LCR youth protection report below.' : ' The executive secretary adds them from LCR.') + '</div></div>';
    else h += '<div class="list">' + TR.list.map(r => {
      const which = r.state === 'due30' || r.state === 'due60' ? 30 : 15, already = which === 30 ? r['Texted 30'] : r['Texted 15'];
      const btn = due(r) && r.phone ? `<a class="btn small ${already ? 'gray' : ''}" style="text-decoration:none" data-act="trText" data-id="${esc(r.ID || '')}" data-w="${which}" href="${esc(WH.smsHref ? WH.smsHref([r.phone], msg(r)) : '')}">${already ? 'Again' : 'Text'}</a>` : '';
      return `<div class="row"><div class="main"><div class="t">${esc(r.Person)}</div><div class="s">${r.calling ? esc(r.calling) + ' · ' : ''}${r.state === 'none' ? 'No training on record' : r.Expires ? 'Expires ' + esc(fmt(r.Expires, { month: 'short', day: 'numeric', year: 'numeric' })) : 'No date'}${r['Texted 30'] ? ' · texted ' + esc(fmt(r['Texted 30'])) : ''}${r['Texted 15'] ? ' · texted ' + esc(fmt(r['Texted 15'])) : ''}</div></div>${chip[r.state] || ''}${btn ? '<span style="width:8px"></span>' + btn : ''}</div>`;
    }).join('') + '</div>';
    if (TR.canPaste) h += `<div class="section-h big"><span>Update from LCR</span></div><p class="foot">In LCR: Reports › Youth Protection Training. Copy the whole list and paste it here.</p>
      <div class="list"><div class="field col"><textarea id="trtext" style="min-height:120px;font-size:14px" placeholder="Paste here"></textarea></div></div><div class="btns"><button class="btn" data-act="trPaste">Update</button></div>
      <p class="foot">An email goes out 60 days before it expires (when emails are on). Youth and Primary presidencies see their own people here and get a Today reminder; anyone can be texted from here.</p>`;
    else h += '<p class="foot">Each text opens on your phone with the training link. The executive secretary updates the records from LCR each month.</p>';
    document.getElementById('body').innerHTML = h;
  }
  Object.assign(WH.act, {
    trText(el) { if (el.dataset.id) WH.call('trainingTexted', { id: el.dataset.id, which: +el.dataset.w }).catch(() => { }); location.href = el.getAttribute('href'); setTimeout(() => WH.routes.training.view(), 800); },
    async trPaste() { const t = document.getElementById('trtext').value; if (!t.trim()) { WH.toast('Paste the report first'); return; } try { const r = await WH.call('trainingPaste', { text: t }); WH.toast(r.saved + ' updated' + (r.unknown.length ? ' · ' + r.unknown.length + ' not on the ward list' : ''), true); WH.routes.training.view(); } catch (e) { WH.toast(e.message); } }
  });

  /* ---------- Inbox ---------- */
  WH.routes.inbox = {
    view() {
      WH.screen('Inbox', 'Approve what the Hub read', WH.skeleton(3), back);
      WH.call('inbox', {}).then(d => {
        const { esc, fmt } = WH;
        let h = d.pendingEvents.length ? `<div class="section-h big"><span>Calendar events</span><span class="chip orange">${d.pendingEvents.length}</span></div><div class="list">${d.pendingEvents.map(e => `<div class="row wrap"><div class="main"><div class="t">${esc(e.Title)}</div><div class="s">${esc(fmt(e.Date, { weekday: 'short', month: 'short', day: 'numeric' }))}${e.Start ? ' · ' + esc(e.Start) : ''} · ${esc(e.Organization)} · from ${esc(e.Source)}</div></div><button class="btn small" data-act="ibEv" data-id="${esc(e.ID)}" data-ok="1">Add</button><button class="btn small gray" data-act="ibEv" data-id="${esc(e.ID)}" data-ok="0">Skip</button></div>`).join('')}</div>` : '';
        h += d.items.length ? `<div class="section-h big"><span>Scans</span></div><div class="list">${d.items.map(i => `<div class="row wrap"><div class="main"><div class="t">${esc(i.Summary)}</div><div class="s">${esc(i.From)} · ${esc(i.Kind)}</div></div><button class="btn small" data-act="ibIt" data-id="${esc(i.ID)}" data-ok="1">Add</button><button class="btn small gray" data-act="ibIt" data-id="${esc(i.ID)}" data-ok="0">Skip</button></div>`).join('')}</div>` : '';
        if (!h) h = '<div class="list"><div class="empty">All caught up.</div></div>';
        h = '<div class="btns" style="margin-top:0"><button class="btn" data-act="scanOpen">Scan a calendar</button></div>' + h;
        h += '<p class="foot">Linked calendars are read every night (Sources tab). Items that need a person land here.</p>';
        document.getElementById('body').innerHTML = h;
      }).catch(err);
    }
  };
  Object.assign(WH.act, {
    async ibEv(el) { try { await WH.call('inboxDecide', { event: el.dataset.id, approve: el.dataset.ok === '1' }); el.closest('.row').remove(); WH.store.del('c:calendar'); } catch (e) { WH.toast(e.message); } },
    async ibIt(el) { try { await WH.call('inboxDecide', { id: el.dataset.id, approve: el.dataset.ok === '1' }); el.closest('.row').remove(); } catch (e) { WH.toast(e.message); } }
  });
})();
