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
      <p class="foot">To send to a smaller list: More › Messages, pick the people, tap Save a new group, and name it Newsletter.</p>
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
  /* Paper forms: tap each name as they come in. Online: each family gets a text with a personal link (permit.html?t=…);
     a signed form marks the youth as turned in and saves a PDF that leaders open here. */
  let PF = null, PFF = null;
  const pfApp = () => location.origin + location.pathname.replace(/[^/]*$/, '');
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
      <p class="foot">Uses the Church's Parental or Guardian Permission and Medical Release form. ${d.online ? 'Parents can sign it online from a personal link you text them, or on paper. ' : ''}Keep the signed forms with you on the trip.</p>`;
  }
  function pfOpen(id) {
    WH.screen('Permission forms', '', WH.skeleton(6), { back: '#/x/permits', backLabel: 'Forms' });
    WH.call('permissions', { id, app: pfApp() }).then(d => { PF = d; PF.texted = {}; pfDraw(); }).catch(err);
  }
  const pfWhen = e => WH.fmt(e.date, { weekday: 'long', month: 'long', day: 'numeric' });
  const pfFirst = n => String(n).split(' ')[0];
  const pfAnd = a => a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : (a[0] || '');
  const pfOn = () => !!(PF.online && PF.linksOpen);
  const pfUrl = y => (PF.appUrl || pfApp()) + 'permit.html?t=' + encodeURIComponent(y.t);
  /* One text per family: only that family's youth and their own links. */
  function pfMsg(kids) {
    const e = PF.event, head = `Hi! ${e.title} is ${pfWhen(e)}${e.place ? ' (' + e.place + ')' : ''}.`, who = pfAnd(kids.map(y => pfFirst(y.n)));
    if (!pfOn() || !kids.length || kids.some(y => !y.t)) return `${head} Please fill out and sign the permission and medical release form${kids.length ? ' for ' + who : ''} and send it back to me before then: ${PF.link}`;
    return `${head} Please fill out ${who}'s permission and medical release form before then. It takes about 3 minutes:\n${kids.map(y => (kids.length > 1 ? pfFirst(y.n) + ': ' : '') + pfUrl(y)).join('\n')}\nThis link is just for your family. A paper form works too.`;
  }
  /* Youth still missing a form, grouped by the parents' phones so brothers and sisters share one text. */
  function pfFamilies() {
    const by = {}, out = [];
    PF.youth.filter(y => !y.received && y.parents.length && y.t).forEach(y => {
      const k = y.parents.map(p => String(p.p).replace(/\D/g, '').slice(-10)).sort().join(',');
      if (!by[k]) out.push(by[k] = { kids: [], nums: y.parents.map(p => p.p), names: y.parents.map(p => p.n) });
      by[k].kids.push(y);
    });
    return out;
  }
  function pfDraw() {
    const { esc, fmt } = WH, d = PF, e = d.event, missing = d.youth.filter(y => !y.received), on = pfOn();
    const nums = missing.flatMap(y => y.parents.map(p => p.p)), fams = on ? pfFamilies() : [], nOnline = d.youth.filter(y => y.online).length;
    const when = pfWhen(e), tap = 'cursor:pointer';
    const top = on
      ? (fams.length ? `<div class="btns"><button class="btn" data-act="pfFam">${WH.I.msg.replace('<svg', '<svg width="18" height="18"')} Text each family (${fams.length})</button></div><p class="foot">One text per family, each with its own personal link. Parents can sign on their phone, or use a paper form.</p>` : '')
      : (missing.length && nums.length && WH.smsHref ? `<div class="btns"><a class="btn" style="text-decoration:none" href="${esc(WH.smsHref(nums, pfMsg([])))}">Text parents of the ${missing.length} still missing</a></div>` : '');
    const right = y => y.pdf ? `<button class="btn small gray" style="background:var(--accent-tint)" data-act="pfPdf" data-n="${esc(y.n)}">Open PDF</button>`
      : on && !y.received && y.t && y.parents.length && WH.smsHref ? `<a class="btn small gray" style="text-decoration:none;background:var(--accent-tint)" data-act="pfText" data-n="${esc(y.n)}" href="${esc(WH.smsHref(y.parents.map(p => p.p), pfMsg([y])))}">${d.texted[y.n] ? 'Text again' : 'Text form link'}</a>` : '';
    const sub = y => esc(y.cls) + (y.received ? (y.online ? ' · signed online ' : ' · turned in ') + (y.on ? esc(fmt(y.on)) : '') : !y.parents.length ? ' · no parent phone on file' : d.texted[y.n] ? ' · link texted' : '');
    document.getElementById('body').innerHTML = `<div class="section-h big"><span>${esc(e.title)}</span></div><p class="foot" style="margin-top:-4px">${esc(when)}${e.time ? ' · ' + esc(e.time) : ''} · ${esc(e.org)} · ${d.youth.length - missing.length} of ${d.youth.length} turned in${nOnline ? ' (' + nOnline + ' online)' : ''}</p>
      ${top}
      <div class="btns"><button class="btn gray" data-act="pfLink">Copy the ${on ? 'paper ' : ''}form link</button></div>
      <div class="section-h"><span>Tap when you have their form</span></div>
      <div class="list">${d.youth.map(y => `<div class="row" role="button" style="${tap}" data-act="pfMark" data-n="${esc(y.n)}"><span class="check ${y.received ? 'on' : ''}"></span><div class="main"><div class="t">${esc(y.n)}</div><div class="s">${sub(y)}</div></div>${right(y)}</div>`).join('') || '<div class="empty">No one in these classes yet.</div>'}</div>
      <p class="foot">Texts go to parents only, as youth protection asks.${on ? ' Forms signed online are saved as PDFs in the ward account\'s private Drive folder "Ward Hub permission forms"; health answers never go in the spreadsheet.' : ''}</p>`;
  }
  function pfFamDraw() {
    const { esc } = WH, s = PFF, f = s.list[s.i], n = s.list.length, msg = pfMsg(f.kids);
    const html = `<header><span style="min-width:64px"></span><h2>Text each family</h2><button class="link r" data-act="close">Done</button></header><div id="pff">
      <p class="foot" style="margin:4px 16px 8px">Family ${s.i + 1} of ${n}${f.sent ? ' · texted' : ''}</p>
      <div class="list"><div class="row wrap"><div class="main"><div class="t">${esc(pfAnd(f.kids.map(y => y.n)))}</div><div class="s">To ${esc(f.names.join(', '))}</div></div></div>
      <div class="row wrap"><div class="main"><div class="s" style="white-space:pre-wrap;color:var(--text);font-size:15px;word-break:break-all">${esc(msg)}</div></div></div></div>
      <div class="btns"><a class="btn" style="text-decoration:none" data-act="pfFamText" href="${esc(WH.smsHref(f.nums, msg))}">${f.sent ? 'Text them again' : 'Text this family'}</a></div>
      <div class="btns"><button class="btn gray" data-act="pfFamStep" data-d="-1" ${s.i ? '' : 'disabled style="opacity:.4"'}>Back</button><button class="btn gray" data-act="pfFamStep" data-d="1">${s.i + 1 < n ? (f.sent ? 'Next family' : 'Skip') : 'Finish'}</button></div>
      <p class="foot">Each text carries only this family's link, so a form can't be signed for someone else's child.</p></div>`;
    const cur = document.getElementById('pff');
    if (cur && cur.closest('.sheet')) cur.closest('.sheet').innerHTML = '<div class="grab"></div>' + html; else WH.openSheet(html);
  }
  function pfB64(b64, type) { const a = atob(b64), u = new Uint8Array(a.length); for (let i = 0; i < a.length; i++) u[i] = a.charCodeAt(i); return new Blob([u], { type }); }
  Object.assign(WH.act, {
    pfNew() {
      WH.form('Trip or activity', [{ name: 'Title' }, { name: 'Organization', type: 'select', options: PF.orgs }, { name: 'Date', type: 'date' }, { name: 'End date', label: 'Ends (overnight)', type: 'date' }, { name: 'Start', ph: '7:00 PM' }, { name: 'Place' }, { name: 'Notes', type: 'textarea' }], { Organization: PF.orgs[0], Date: WH.nextSun() },
        async row => { const r = await WH.call('permissionEvent', { row }); location.hash = '#/x/permits/' + encodeURIComponent(r.id); });
    },
    async pfMark(el) {
      const y = PF.youth.find(x => x.n === el.dataset.n); if (!y) return;
      if (y.online && !confirm(pfFirst(y.n) + '\'s form was signed online. Mark it as not turned in?')) return;
      const was = { received: y.received, on: y.on, online: y.online };
      y.received = !y.received; y.on = y.received ? WH.ymd(WH.today()) : ''; y.online = false; pfDraw();
      try { await WH.call('permissionMark', { event: PF.event.id, person: y.n, received: y.received }); } catch (e) { Object.assign(y, was); pfDraw(); WH.toast(e.message); }
    },
    pfText(el) { PF.texted[el.dataset.n] = 1; location.href = el.getAttribute('href'); setTimeout(pfDraw, 600); },
    async pfPdf(el) {
      const y = PF.youth.find(x => x.n === el.dataset.n); if (!y) return;
      const label = el.textContent; el.innerHTML = '<span class="spin"></span>';
      try {
        const r = await WH.call('permitPdf', { event: PF.event.id, person: y.n });
        const a = document.createElement('a'); a.href = URL.createObjectURL(pfB64(r.pdf, 'application/pdf')); a.download = r.name || 'Permission form.pdf'; a.target = '_blank';
        document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 60000);
      } catch (e) { WH.toast(e.message); }
      el.textContent = label;
    },
    pfFam() { PFF = { list: pfFamilies(), i: 0 }; if (PFF.list.length) pfFamDraw(); },
    pfFamText(el) { const f = PFF.list[PFF.i]; f.sent = 1; f.kids.forEach(y => PF.texted[y.n] = 1); location.href = el.getAttribute('href'); setTimeout(pfFamDraw, 600); },
    pfFamStep(el) {
      PFF.i = Math.max(0, PFF.i + +el.dataset.d);
      if (PFF.i >= PFF.list.length) { const k = PFF.list.filter(f => f.sent).length; WH.closeSheet(); pfDraw(); WH.toast(k + ' of ' + PFF.list.length + ' families texted', true); return; }
      pfFamDraw();
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
      <div class="btns"><button class="btn" data-act="fuPrint" data-id="${esc(f.ID)}">Print the order of service</button><button class="btn gray" data-act="fuConduct" data-id="${esc(f.ID)}">Conducting sheet</button></div><div class="btns">${f['Family phone'] ? `<a class="btn gray" style="text-decoration:none" href="tel:${esc(String(f['Family phone']).replace(/[^0-9+]/g, ''))}">Call family</a>` : ''}</div>
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
    fuConduct(el) {
      const f = FU.list.find(x => x.ID === el.dataset.id), e = s => WH.esc(s || '____'), L = (k, v) => String(v || '').split('\n').map(s => s.trim()).filter(Boolean);
      const steps = [`Welcome. We are gathered for the funeral services of <b>${e(f.Name)}</b>. We extend our love and sympathy to the family.`, `These services are presided over by ${e(f.Presiding)}, and I am ${e(f.Conducting)}. ${f.Organist ? 'The organist is ' + e(f.Organist) + '.' : ''} ${f.Chorister ? 'Music is directed by ' + e(f.Chorister) + '.' : ''}`,
        f['Family prayer'] ? `A family prayer was offered before the services by ${e(f['Family prayer'])}.` : '', `We will open by singing <b>${e(f['Opening hymn'])}</b>, after which ${e(f.Invocation)} will offer the invocation.`,
        f['Life sketch'] ? `${e(f['Life sketch'])} will share a life sketch.` : '', ...L('', f.Speakers).map(s => `We will now hear from ${e(s)}.`), ...L('', f['Musical numbers']).map(s => `We will now enjoy a musical number: ${e(s)}.`),
        `We will close by singing <b>${e(f['Closing hymn'])}</b>, after which ${e(f.Benediction)} will offer the benediction.`, `Following the services${f.Burial ? ', interment will be at ' + e(f.Burial) : ''}${f['Dedication of the grave'] ? '; ' + e(f['Dedication of the grave']) + ' will dedicate the grave' : ''}.${f.Luncheon ? ' A luncheon for the family will follow: ' + e(f.Luncheon) + '.' : ''} We thank all who have helped.`].filter(Boolean);
      let root = document.getElementById('print-root'); if (!root) { root = document.createElement('div'); root.id = 'print-root'; document.body.appendChild(root); }
      root.innerHTML = `<style>@media screen{#print-root{display:none}}@media print{@page{size:letter;margin:.7in}body.printing-program>*:not(#print-root){display:none!important}body.printing-program #print-root{display:block;color:#000}}</style><div style="font:13pt/1.5 Georgia,serif"><div style="font-size:18pt;margin-bottom:4px">Conducting · Funeral of ${e(f.Name)}</div><div style="color:#555;margin-bottom:16px">${WH.esc(WH.long(f.Date))}${f.Time ? ' · ' + WH.esc(f.Time) : ''}</div><ol style="padding-left:20px">${steps.map(s => `<li style="margin:0 0 12px">${s}</li>`).join('')}</ol></div>`;
      document.body.classList.add('printing-program'); setTimeout(() => { window.print(); setTimeout(() => document.body.classList.remove('printing-program'), 1000); }, 60);
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
