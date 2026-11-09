/* Newsletters, permission forms, funerals, Ask the Hub, and the email preview and backups on Health. */
(function () {
  const WH = window.WH = window.WH || {}; WH.routes = WH.routes || {}; WH.act = WH.act || {}; WH.more = WH.more || []; WH.ready = WH.ready || [];
  const ic = p => `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const orgs = () => (WH.S.boot && WH.S.boot.me.orgs) || [];
  const leads = list => WH.isBish() || list.some(o => orgs().indexOf(o) >= 0);
  WH.more.push(
    { title: 'Newsletter', sub: 'Write it once; send by email', href: '#/x/newsletter', icon: ic('<rect x="3" y="3.5" width="14" height="13" rx="2"/><path d="M6 7.5h8M6 10.5h8M6 13.5h5"/>'), color: '#FF2D55', order: 14, show: () => leads(['Relief Society', 'Elders Quorum']), group: 'Leaders' },
    { title: 'Permission forms', sub: 'Who has turned them in for each trip', href: '#/x/permits', icon: ic('<path d="M6 2.5h6l4 4v11H6z"/><path d="M12 2.5v4h4M8.5 12l2 2 3.5-4"/>'), color: '#5AC8FA', order: 15, show: () => leads(['Young Women', 'Young Men', 'Primary']), group: 'Leaders' },
    { title: 'Funerals', sub: 'Plan, reserve the building, print the order of service', href: '#/x/funerals', icon: ic('<path d="M10 2.5v15M5.5 7h9"/>'), color: '#8E8E93', order: 34, show: () => WH.isBish() || WH.can('clerk'), group: 'Leaders' },
    { title: 'Ask the Hub', sub: 'A quick answer from the calendar and plans', href: '#/x/ask', icon: ic('<circle cx="10" cy="10" r="7.5"/><path d="M8 8a2 2 0 1 1 2.8 1.8c-.5.3-.8.7-.8 1.2v.5M10 14.5v.01"/>'), color: '#5856D6', order: 16, show: () => WH.isBish() || WH.can('leader') || WH.can('clerk'), group: 'Leaders' }
  );
  const back = { back: '#/more', backLabel: 'More' };
  const err = e => { document.getElementById('body').innerHTML = WH.errorBox(e.message); };
  const plain = html => { const d = document.createElement('div'); d.innerHTML = html.replace(/<(p|div|li|br)[^>]*>/g, '\n$&'); return d.textContent.replace(/\n{3,}/g, '\n\n').trim(); };

  /* ---------------- Newsletter ---------------- */
  let NL = null, NV = null;
  WH.routes.newsletter = {
    view(args) {
      if (args && args[0]) return nlOpen(decodeURIComponent(args[0]));
      WH.screen('Newsletter', 'Write it in the app, then send it from your own email', WH.skeleton(4), Object.assign({ right: '<span class="nladd"></span>' }, back));
      WH.call('newsletters', {}).then(d => { NL = d; nlDraw(); }).catch(err);
    }
  };
  function nlDraw() {
    const { esc, I, fmt } = WH, d = NL;
    document.querySelectorAll('.nladd').forEach(x => x.innerHTML = `<button class="btn small" data-act="nlNew">${I.plus} New</button>`);
    document.getElementById('body').innerHTML = `<div class="section-h"><span>Who gets it</span></div><div class="list">${d.orgs.map(o => `<div class="row"><div class="main"><div class="t">${esc(o.org)}</div><div class="s">${o.group ? 'Your newsletter list' : o.org === 'Ward' ? 'Every adult with an email' : 'Every ' + (o.org === 'Relief Society' ? 'sister' : 'brother') + ' with an email'}</div></div><span class="chip">${o.count}</span></div>`).join('')}</div>
      <p class="foot">To send to a smaller list, add a group named "Newsletter" for your organization (People › Organizations, or All lists › Groups).</p>
      <div class="section-h"><span>Issues</span></div><div class="list">${d.list.length ? d.list.map(n => `<button class="row" data-go="#/x/newsletter/${encodeURIComponent(n.ID)}"><div class="main"><div class="t">${esc(n.Subject || 'Untitled')}</div><div class="s">${esc(n.Organization)} · ${esc(fmt(n.Date))}</div></div><span class="chip ${n.Status === 'Sent' ? 'green' : ''}">${esc(n.Status || 'Draft')}</span>${I.chev}</button>`).join('') : '<div class="empty">No newsletters yet. Tap New.</div>'}</div>`;
  }
  const nlFields = () => [{ name: 'Organization', type: 'select', options: NL.orgs.map(o => o.org) }, { name: 'Subject' }, { name: 'Date', label: 'Date (sets the birthday month)', type: 'date' }, { name: 'Intro', type: 'textarea' },
    { name: 'Items', label: 'Items · # starts a heading · [lessons] [birthdays] [stake calendar] [ward calendar] [new members] fill themselves in', type: 'textarea' }, { name: 'Attachment', label: 'Stake memo or flyer link', ph: 'https://…' }, { name: 'Include calendar', label: 'Add the ward calendar at the end', type: 'toggle' }];
  const dayName = d => WH.fmt(d, { weekday: 'short', month: 'short', day: 'numeric' });
  function nlOpen(id) {
    WH.screen('Newsletter', '', WH.skeleton(3), { back: '#/x/newsletter', backLabel: 'Newsletter' });
    Promise.all([NL ? NL : WH.call('newsletters', {}), WH.call('newsletterView', { id })]).then(([l, v]) => {
      NL = l; NV = Object.assign(v, { id, row: l.list.find(n => n.ID === id) || {} });
      const { esc } = WH, n = NV.row;
      const st = v.status || 'Draft', sched = /Scheduled|Sending/.test(st);
      const planTxt = v.plan.map(b => `${dayName(b.date)} (${b.count})`).join(' and ');
      const planRows = v.plan.map(b => `<div class="row"><span class="check ${b.sent ? 'on' : ''}"></span><div class="main"><div class="t">${esc(dayName(b.date))}</div><div class="s">${b.count} addresses${b.sent ? ' · sent ' + esc(String(b.sent).slice(11)) : ' · about 7 AM'}</div></div></div>`).join('');
      document.getElementById('body').innerHTML = `<div class="list"><div class="row"><div class="main"><div class="t" style="font-weight:600">${esc(n.Subject || 'Untitled')}</div><div class="s">${esc(n.Organization)} · ${NV.emails.length} addresses · ${esc(st)}${n['Sent on'] ? ' ' + esc(WH.fmt(n['Sent on'])) : ''}</div></div></div></div>
        ${sched ? `<div class="section-h"><span>Sending from the ward account</span></div><div class="list">${planRows}</div><div class="btns"><button class="btn gray" data-act="nlCancel">Stop sending</button></div>`
          : st === 'Sent' ? '<div class="btns"><button class="btn gray" data-act="nlEdit">Edit</button></div>'
          : `<div class="btns"><button class="btn" data-act="nlMine">Send from my email</button><button class="btn gray" data-act="nlEdit">Edit</button></div>
             <div class="btns"><button class="btn gray" data-act="nlSched">${v.paused ? 'Send from the ward account' : 'Send in ' + v.plan.length + ' parts: ' + esc(planTxt)}</button></div>
             <p class="foot">Google lets the ward account email 100 addresses a day, so the Hub splits the list over the ${v.plan.length > 2 ? v.plan.length : 'two'} quietest days this week${v.paused ? ' once emails are turned on (now: ' + esc(planTxt) + ')' : ''}.</p>`}
        <div class="section-h"><span>Preview</span></div>
        <iframe sandbox="" title="Newsletter preview" srcdoc="${esc(v.html)}" style="width:100%;height:560px;border:0;border-radius:12px;background:#fff"></iframe>
        ${sched ? '' : '<div class="btns"><button class="btn red" data-act="nlDel">Remove</button></div>'}`;
    }).catch(err);
  }
  async function nlStart(org) {
    try { const t = await WH.call('newsletterTemplate', { org }); WH.form('New newsletter', nlFields(), t.row, async row => { const r = await WH.call('newsletterSave', { row }); NL = null; location.hash = '#/x/newsletter/' + encodeURIComponent(r.id); }); } catch (e) { WH.toast(e.message); }
  }
  async function copyRich(html) {
    try { if (window.ClipboardItem) { await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }), 'text/plain': new Blob([plain(html)], { type: 'text/plain' }) })]); return true; } } catch (e) { }
    try { await navigator.clipboard.writeText(plain(html)); return true; } catch (e) { return false; }
  }
  Object.assign(WH.act, {
    nlNew() {
      if (NL.orgs.length === 1) return nlStart(NL.orgs[0].org);
      WH.openSheet(`<header><button class="link" data-act="close">Cancel</button><h2>Newsletter for</h2><span style="min-width:64px"></span></header><div class="list">${NL.orgs.map(o => `<button class="row" data-act="nlFor" data-org="${WH.esc(o.org)}"><div class="main"><div class="t">${WH.esc(o.org)}</div></div>${WH.I.chev}</button>`).join('')}</div>`);
    },
    nlFor(el) { WH.closeSheet(); setTimeout(() => nlStart(el.dataset.org), 250); },
    nlEdit() { WH.form('Edit newsletter', nlFields(), NV.row, async row => { row.ID = NV.id; row.Status = NV.row.Status; await WH.call('newsletterSave', { row }); NL = null; nlOpen(NV.id); }); },
    async nlDel() { if (!confirm('Remove this newsletter?')) return; try { await WH.call('newsletterRemove', { id: NV.id }); NL = null; location.hash = '#/x/newsletter'; } catch (e) { WH.toast(e.message); } },
    nlMine() {
      const { esc } = WH, bcc = NV.emails.join(','), subj = NV.subject || 'Newsletter';
      const href = 'mailto:?subject=' + encodeURIComponent(subj) + (bcc.length < 1800 ? '&bcc=' + encodeURIComponent(bcc) : '');
      WH.openSheet(`<header><span style="min-width:64px"></span><h2>Send from my email</h2><button class="link r" data-act="close">Done</button></header>
        <div class="list"><button class="row" id="nl1"><div class="main"><div class="t">1. Copy the newsletter</div><div class="s">With its headings and links</div></div></button>
        <button class="row" id="nl2"><div class="main"><div class="t">2. Copy the ${NV.emails.length} addresses</div><div class="s">Paste them into Bcc, so no one sees the others</div></div></button>
        <a class="row" href="${esc(href)}" style="text-decoration:none;color:inherit"><div class="main"><div class="t">3. Open my email</div><div class="s">Paste the newsletter into the message${bcc.length < 1800 ? '' : ' and the addresses into Bcc'}</div></div></a>
        <button class="row" id="nl4"><div class="main"><div class="t">4. Mark as sent</div><div class="s">So everyone knows it went out</div></div></button></div>
        <p class="foot">A personal Gmail can send to about 500 addresses a day, so the whole list fits in one email.</p>`);
      document.getElementById('nl1').onclick = async () => WH.toast(await copyRich(NV.html) ? 'Newsletter copied' : 'Couldn\'t copy on this phone', true);
      document.getElementById('nl2').onclick = async () => { try { await navigator.clipboard.writeText(NV.emails.join(', ')); WH.toast('Addresses copied', true); } catch (e) { WH.toast('Couldn\'t copy on this phone'); } };
      document.getElementById('nl4').onclick = async () => { try { await WH.call('newsletterMarkSent', { id: NV.id, count: NV.emails.length }); WH.closeSheet(); NL = null; nlOpen(NV.id); WH.toast('Marked as sent', true); } catch (e) { WH.toast(e.message); } };
    },
    async nlSched(el) {
      if (NV.paused) { WH.toast('Emails are paused. Use "Send from my email" for now.'); return; }
      if (!confirm('Email this to ' + NV.emails.length + ' people from the ward account, in ' + NV.plan.length + ' parts (' + NV.plan.map(b => dayName(b.date)).join(' and ') + ')?')) return;
      el.innerHTML = '<span class="spin"></span>';
      try { const r = await WH.call('newsletterSchedule', { id: NV.id }); WH.toast('Scheduled: ' + r.plan.map(b => dayName(b.date)).join(' and '), true); NL = null; nlOpen(NV.id); } catch (e) { WH.toast(e.message); nlOpen(NV.id); }
    },
    async nlCancel() {
      if (!confirm('Stop sending? Parts already sent stay sent.')) return;
      try { const r = await WH.call('newsletterCancel', { id: NV.id }); WH.toast(r.sent ? 'Stopped after ' + r.sent : 'Back to draft', true); NL = null; nlOpen(NV.id); } catch (e) { WH.toast(e.message); }
    }
  });

  /* ---------------- Permission forms ---------------- */
  let PF = null;
  WH.routes.permits = {
    view(args) {
      if (args && args[0]) return pfOpen(decodeURIComponent(args[0]));
      WH.screen('Permission forms', 'Trips and activities that need a signed form', WH.skeleton(3), Object.assign({ right: '<span class="pfadd"></span>' }, back));
      WH.call('permissions', {}).then(d => { PF = d; pfList(); }).catch(err);
    }
  };
  function pfList() {
    const { esc, I, fmt } = WH, d = PF;
    document.querySelectorAll('.pfadd').forEach(x => x.innerHTML = `<button class="btn small" data-act="pfNew">${I.plus} Add</button>`);
    document.getElementById('body').innerHTML = `<div class="list">${d.events.length ? d.events.map(e => `<button class="row" data-go="#/x/permits/${encodeURIComponent(e.id)}"><div class="main"><div class="t">${esc(e.title)}</div><div class="s">${esc(fmt(e.date, { weekday: 'short', month: 'short', day: 'numeric' }))}${e.end ? '–' + esc(fmt(e.end)) : ''} · ${esc(e.org)}</div></div><span class="chip ${e.total && e.received === e.total ? 'green' : 'orange'}">${e.received} of ${e.total}</span>${I.chev}</button>`).join('') : '<div class="empty">No trips need forms. Tap Add, or turn on "Youth need permission forms" on any calendar item.</div>'}</div>
      <p class="foot">Uses the Church's Parental or Guardian Permission and Medical Release form. Keep the signed paper forms with you on the trip.</p>`;
  }
  function pfOpen(id) {
    WH.screen('Permission forms', '', WH.skeleton(6), { back: '#/x/permits', backLabel: 'Forms' });
    WH.call('permissions', { id }).then(d => { PF = d; pfDraw(); }).catch(err);
  }
  function pfDraw() {
    const { esc, fmt } = WH, d = PF, e = d.event, missing = d.youth.filter(y => !y.received);
    const nums = missing.flatMap(y => y.parents.map(p => p.p));
    const when = fmt(e.date, { weekday: 'long', month: 'long', day: 'numeric' });
    const msg = `Hi! ${e.title} is ${when}${e.place ? ' (' + e.place + ')' : ''}. Please fill out and sign the permission and medical release form and send it back to me before then: ${d.link}`;
    document.getElementById('body').innerHTML = `<div class="section-h big"><span>${esc(e.title)}</span></div><p class="foot" style="margin-top:-4px">${esc(when)}${e.time ? ' · ' + esc(e.time) : ''} · ${esc(e.org)} · ${d.youth.length - missing.length} of ${d.youth.length} turned in</p>
      ${missing.length && nums.length && WH.smsHref ? `<div class="btns"><a class="btn" style="text-decoration:none" href="${esc(WH.smsHref(nums, msg))}">Text parents of the ${missing.length} still missing</a></div>` : ''}
      <div class="btns"><button class="btn gray" data-act="pfLink">Copy the form link</button></div>
      <div class="section-h"><span>Tap when you have their form</span></div>
      <div class="list">${d.youth.map(y => `<button class="row ${y.received ? '' : ''}" data-act="pfMark" data-n="${esc(y.n)}"><span class="check ${y.received ? 'on' : ''}"></span><div class="main"><div class="t">${esc(y.n)}</div><div class="s">${esc(y.cls)}${y.received && y.on ? ' · turned in ' + esc(fmt(y.on)) : y.parents.length ? '' : ' · no parent phone on file'}</div></div></button>`).join('') || '<div class="empty">No one in these classes yet.</div>'}</div>
      <p class="foot">Texts go to parents only, as youth protection asks.</p>`;
  }
  Object.assign(WH.act, {
    pfNew() {
      WH.form('Trip or activity', [{ name: 'Title' }, { name: 'Organization', type: 'select', options: PF.orgs }, { name: 'Date', type: 'date' }, { name: 'End date', label: 'Ends (overnight)', type: 'date' }, { name: 'Start', ph: '7:00 PM' }, { name: 'Place' }, { name: 'Notes', type: 'textarea' }], { Organization: PF.orgs[0], Date: WH.nextSun() },
        async row => { const r = await WH.call('permissionEvent', { row }); location.hash = '#/x/permits/' + encodeURIComponent(r.id); });
    },
    async pfMark(el) {
      const y = PF.youth.find(x => x.n === el.dataset.n); if (!y) return;
      y.received = !y.received; y.on = y.received ? WH.ymd(WH.today()) : ''; pfDraw();
      try { await WH.call('permissionMark', { event: PF.event.id, person: y.n, received: y.received }); } catch (e) { y.received = !y.received; pfDraw(); WH.toast(e.message); }
    },
    async pfLink() { try { await navigator.clipboard.writeText(PF.link); WH.toast('Link copied', true); } catch (e) { WH.toast(PF.link); } }
  });

  /* ---------------- Funerals ---------------- */
  let FU = null;
  const FCOLS = ['Name', 'Date', 'Time', 'Place', 'Viewing', 'Family contact', 'Family phone', 'Presiding', 'Conducting', 'Organist', 'Chorister', 'Family prayer', 'Opening hymn', 'Invocation', 'Life sketch', 'Speakers', 'Musical numbers', 'Closing hymn', 'Benediction', 'Dedication of the grave', 'Burial', 'Luncheon', 'Status', 'Notes'];
  const ffield = c => ({ name: c, type: c === 'Date' ? 'date' : c === 'Status' ? 'select' : /Speakers|Musical|Notes/.test(c) ? 'textarea' : '', options: ['Planning', 'Held'], list: /Presiding|Conducting|Organist|Chorister|prayer|Invocation|sketch|Benediction|Dedication|contact/.test(c) ? 'people' : '', ph: c === 'Time' ? '11:00 AM' : c === 'Viewing' ? '9:30–10:30 AM, Relief Society room' : '' });
  WH.routes.funerals = {
    view(args) {
      WH.screen('Funerals', '', WH.skeleton(3), Object.assign({ right: '<span class="fuadd"></span>' }, args && args[0] ? { back: '#/x/funerals', backLabel: 'Funerals' } : back));
      WH.call('funerals', {}).then(d => { FU = d; if (args && args[0]) fuOpen(decodeURIComponent(args[0])); else fuList(); }).catch(err);
    }
  };
  function fuList() {
    const { esc, I, fmt } = WH;
    document.querySelectorAll('.fuadd').forEach(x => x.innerHTML = FU.canEdit ? `<button class="btn small" data-act="fuNew">${I.plus} New</button>` : '');
    document.getElementById('body').innerHTML = `<div class="list">${FU.list.length ? FU.list.map(f => `<button class="row" data-go="#/x/funerals/${encodeURIComponent(f.ID)}"><div class="main"><div class="t">${esc(f.Name)}</div><div class="s">${esc(fmt(f.Date, { weekday: 'short', month: 'short', day: 'numeric' }))}${f.Time ? ' · ' + esc(f.Time) : ''}</div></div><span class="chip ${f.Status === 'Held' ? '' : 'blue'}">${esc(f.Status || 'Planning')}</span>${I.chev}</button>`).join('') : '<div class="empty">No funerals being planned.</div>'}</div>
      <p class="foot">New makes the calendar item, reserves the building, and gives the bishop, Relief Society, elders quorum and executive secretary their usual tasks.</p>`;
  }
  function fuOpen(id) {
    const f = FU.list.find(x => x.ID === id); if (!f) { fuList(); return; }
    const { esc, kv } = WH;
    document.querySelectorAll('.fuadd').forEach(x => x.innerHTML = '');
    document.getElementById('body').innerHTML = `<div class="section-h big"><span>${esc(f.Name)}</span>${FU.canEdit ? `<button class="link" style="font-size:15px" data-act="fuEdit" data-id="${esc(f.ID)}">Edit</button>` : ''}</div>
      <div class="btns"><button class="btn" data-act="fuPrint" data-id="${esc(f.ID)}">Print the order of service</button>${f['Family phone'] ? `<a class="btn gray" style="text-decoration:none" href="tel:${esc(String(f['Family phone']).replace(/[^0-9+]/g, ''))}">Call family</a>` : ''}</div>
      <div class="list" style="margin-top:14px">${FCOLS.slice(1).filter(c => f[c]).map(c => kv(c, /Date/.test(c) ? WH.long(f[c]) : String(f[c]).replace(/\n/g, ' · '))).join('')}</div>
      <p class="foot">Tasks are on Today and More › Tasks. The building reservation is on Building.</p>`;
  }
  function fuPrintHtml(f) {
    const e = s => WH.esc(s || ''), line = (k, v) => v ? `<tr><td class="k">${e(k)}</td><td>${e(v)}</td></tr>` : '';
    const lines = (k, v) => String(v || '').split('\n').map(s => s.trim()).filter(Boolean).map((s, i) => line(i ? '' : k, s)).join('');
    const q = (FU.quotes || [])[0];
    return `<style>@media screen{#print-root{display:none}}@media print{@page{size:letter;margin:.6in}body.printing-program>*:not(#print-root){display:none!important}body.printing-program #print-root{display:block;color:#000}body.printing-program{background:#fff!important}}#print-root .fu{font:12pt/1.45 Georgia,serif;max-width:6.5in;margin:0 auto;text-align:center}#print-root .fu h1{font-size:20pt;font-weight:normal;margin:.1in 0}#print-root .fu .sub{color:#444;margin-bottom:.25in}
      #print-root .fu table{margin:0 auto;border-collapse:collapse;text-align:left}#print-root .fu td{padding:3px 10px;vertical-align:top}#print-root .fu td.k{color:#555;text-align:right;white-space:nowrap}#print-root .fu .q{font-style:italic;margin-top:.35in;color:#333}</style>
      <div class="fu"><div class="sub">Funeral services for</div><h1>${e(f.Name)}</h1><div class="sub">${e(WH.long(f.Date))}${f.Time ? ' · ' + e(f.Time) : ''}<br>${e(f.Place || FU.building || '')}</div>
      <table>${line('Presiding', f.Presiding)}${line('Conducting', f.Conducting)}${line('Organist', f.Organist)}${line('Chorister', f.Chorister)}<tr><td colspan="2" style="height:10px"></td></tr>
      ${line('Family prayer', f['Family prayer'])}${line('Opening hymn', f['Opening hymn'])}${line('Invocation', f.Invocation)}${line('Life sketch', f['Life sketch'])}${lines('Speakers', f.Speakers)}${lines('Musical number', f['Musical numbers'])}${line('Closing hymn', f['Closing hymn'])}${line('Benediction', f.Benediction)}
      <tr><td colspan="2" style="height:10px"></td></tr>${line('Dedication of the grave', f['Dedication of the grave'])}${line('Interment', f.Burial)}${line('Luncheon', f.Luncheon)}</table>
      ${q ? `<div class="q">“${e(q.text)}”${q.source ? '<br>— ' + e(q.source) : ''}</div>` : ''}</div>`;
  }
  Object.assign(WH.act, {
    async fuNew() {
      await WH.loadNames();
      const flds = ['Name', 'Date', 'Time', 'Place', 'Viewing', 'Family contact', 'Family phone'].map(ffield).concat([{ name: '_cal', label: 'Add to the ward calendar', type: 'toggle' }, { name: '_pub', label: 'Show on the public calendar', type: 'toggle' }, { name: '_bld', label: 'Reserve the building', type: 'toggle' }, { name: '_tasks', label: 'Give out the usual tasks', type: 'toggle' }]);
      WH.form('New funeral', flds, { _cal: true, _bld: true, _tasks: true, Time: '11:00 AM', Place: FU.building || '' }, async row => {
        const opts = { calendar: row._cal, public: row._pub, building: row._bld, tasks: row._tasks };['_cal', '_pub', '_bld', '_tasks'].forEach(k => delete row[k]);
        const r = await WH.call('funeralCreate', Object.assign({ row }, opts)); WH.store.del('c:today'); location.hash = '#/x/funerals/' + encodeURIComponent(r.id);
      });
    },
    async fuEdit(el) {
      await WH.loadNames(); const f = FU.list.find(x => x.ID === el.dataset.id);
      WH.form('Edit', FCOLS.map(ffield), f, async row => { row.ID = f.ID; await WH.call('save', { tab: 'Funerals', row }); WH.routes.funerals.view([f.ID]); },
        async () => { await WH.call('remove', { tab: 'Funerals', id: f.ID }); location.hash = '#/x/funerals'; });
    },
    fuPrint(el) {
      const f = FU.list.find(x => x.ID === el.dataset.id);
      let root = document.getElementById('print-root'); if (!root) { root = document.createElement('div'); root.id = 'print-root'; document.body.appendChild(root); }
      root.innerHTML = fuPrintHtml(f); document.body.classList.add('printing-program');
      setTimeout(() => { window.print(); setTimeout(() => document.body.classList.remove('printing-program'), 1000); }, 60);
    }
  });

  /* ---------------- Ask the Hub ---------------- */
  const asked = [];
  WH.routes.ask = {
    view() {
      const { esc } = WH;
      const ideas = ['What\'s on the calendar this week?', 'Who is speaking next Sunday?', 'When is the next youth activity?', 'What do I need to do this week?'];
      WH.screen('Ask the Hub', 'A quick answer from the calendar and plans', `<div class="list"><div class="field col"><textarea id="askq" placeholder="When is the Relief Society Christmas dinner?" style="min-height:70px"></textarea></div></div>
        <div class="btns"><button class="btn" data-act="askGo">Ask</button></div>
        <div id="askout">${asked.map(a => `<div class="section-h"><span>${esc(a.q)}</span></div><div class="list"><div class="row wrap"><div class="main"><div class="t" style="line-height:1.45">${esc(a.a)}</div></div></div></div>`).join('')}</div>
        <div class="section-h"><span>Try</span></div><div class="list">${ideas.map(q => `<button class="row" data-act="askIdea" data-q="${esc(q)}"><div class="main"><div class="t">${esc(q)}</div></div></button>`).join('')}</div>
        <p class="foot">Answers come from Google's free Gemini, using only the calendar, Sunday plans, lessons and your tasks. No phone numbers, emails, birthdays, interview details or notes are sent. Check anything important in the Hub itself.</p>`, back);
    }
  };
  Object.assign(WH.act, {
    askIdea(el) { document.getElementById('askq').value = el.dataset.q; WH.act.askGo(document.querySelector('[data-act="askGo"]')); },
    async askGo(el) {
      const q = (document.getElementById('askq').value || '').trim(); if (!q) { WH.toast('Type a question'); return; }
      el.innerHTML = '<span class="spin"></span>';
      try { const r = await WH.call('ask', { q }); asked.unshift({ q, a: r.answer }); asked.length = Math.min(asked.length, 6); WH.routes.ask.view(); }
      catch (e) { WH.toast(e.message); el.textContent = 'Ask'; }
    }
  });

  /* ---------------- Health: emails that would go out, and backups ---------------- */
  WH.ready.push(() => {
    const orig = WH.routes.health && WH.routes.health.view; if (!orig) return;
    WH.routes.health.view = function () {
      orig.apply(this, arguments);
      const add = () => { const b = document.getElementById('body'); if (!b || !b.querySelector('[data-act="hlRun"]')) return setTimeout(add, 150); if (b.querySelector('#hlMore')) return;
        b.querySelector('[data-act="hlRun"]').closest('.btns').insertAdjacentHTML('afterend', `<div id="hlMore" class="btns"><button class="btn gray" data-go="#/x/emails">Emails that would go out</button><button class="btn gray" data-act="hlBackup">Back up now</button></div><p class="foot">Backups are copies of the spreadsheet in Google Drive › Ward Hub backups, made every Sunday night.</p>`); };
      add();
    };
  });
  let EM = null;
  WH.routes.emails = {
    view() {
      WH.screen('Emails', 'What the Hub would send this week', WH.skeleton(5), { back: '#/x/health', backLabel: 'Health' });
      WH.call('emailPreview', {}).then(d => {
        EM = d; const { esc } = WH, by = {}; d.list.forEach(x => (by[x.job] = by[x.job] || []).push(x));
        document.getElementById('body').innerHTML = `<div class="list"><div class="row wrap"><div class="main"><div class="t">${d.paused ? 'Emails are paused' : 'Emails are on'}</div><div class="s">${d.paused ? 'Nothing below is sent until Settings › Pause all emails is No. Monday: bishopric and clerks. Wednesday: teachers. Daily: appointment reminders and youth protection.' : 'These go out on their day at about 3 AM.'}</div></div></div></div>
          ${Object.keys(by).map(j => `<div class="section-h"><span>${esc(j)} · ${by[j].length}</span></div><div class="list">${by[j].map(x => `<button class="row" data-act="emSee" data-i="${x.i}"><div class="main"><div class="t">${esc(x.name)}</div><div class="s">${esc(x.subject)}</div></div>${WH.I.chev}</button>`).join('')}</div>`).join('') || '<div class="list"><div class="empty">Nothing to send this week.</div></div>'}`;
      }).catch(err);
    }
  };
  Object.assign(WH.act, {
    async emSee(el) {
      try { const r = await WH.call('emailPreview', { i: +el.dataset.i }); WH.openSheet(`<header><span style="min-width:64px"></span><h2>Preview</h2><button class="link r" data-act="close">Done</button></header><iframe sandbox="" title="Email preview" srcdoc="${WH.esc(r.sample)}" style="width:100%;height:70vh;border:0;border-radius:12px;background:#fff"></iframe>`); } catch (e) { WH.toast(e.message); }
    },
    async hlBackup(el) { el.innerHTML = '<span class="spin"></span>'; try { const r = await WH.call('runJob', { job: 'backup' }); WH.toast((r.jobs.backup || {}).note || 'Done', true); } catch (e) { WH.toast(e.message); } el.textContent = 'Back up now'; }
  });
})();
