/* Messages: text any group from your own phone; lesson texts; elders quorum zones and turns; speaker invitations. */
(function () {
  const WH = window.WH = window.WH || {}; WH.routes = WH.routes || {}; WH.act = WH.act || {}; WH.more = WH.more || [];
  const ICON = '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 2.5c4.4 0 8 2.9 8 6.6s-3.6 6.6-8 6.6c-.8 0-1.6-.1-2.3-.3L3.5 17.5l1.2-3.4C3 12.9 2 11.1 2 9.1 2 5.4 5.6 2.5 10 2.5z"/></svg>';
  const BOOK = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M10 5c-2-1.5-4.5-1.8-7-1.3v11.5c2.5-.5 5-.2 7 1.3 2-1.5 4.5-1.8 7-1.3V3.7c-2.5-.5-5-.2-7 1.3zM10 5v11.5"/></svg>';
  const MAP = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M2.5 5l5-2 5 2 5-2v12l-5 2-5-2-5 2z M7.5 3v12 M12.5 5v12"/></svg>';
  const canText = () => WH.isBish() || WH.can('leader') || WH.can('teacher');
  WH.more.push({ title: 'Messages', sub: 'Text a group from your phone', href: '#/x/messages', icon: ICON, color: '#34C759', order: 10, show: canText });
  WH.more.push({ title: 'Lesson texts', sub: "This Sunday's lessons, ready to send", href: '#/x/lessons', icon: BOOK, color: '#FF9500', order: 11, show: canText });
  WH.more.push({ title: 'Elders quorum zones', sub: 'Members, zone leaders and turns', href: '#/x/zones', icon: MAP, color: '#007AFF', order: 12, show: () => WH.isBish() || ((WH.S.boot.me.orgs || []).indexOf('Elders Quorum') >= 0) });

  const apple = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);
  function smsHref(nums, body) {
    nums = [].concat(nums || []).map(n => String(n || '').replace(/[^0-9+]/g, '')).filter(n => n.length >= 7);
    nums = nums.filter((n, i) => nums.indexOf(n) === i); if (!nums.length) return '';
    const b = encodeURIComponent(body || '');
    if (apple) return nums.length > 1 ? 'sms:/open?addresses=' + nums.join(',') + '&body=' + b : 'sms:' + nums[0] + '&body=' + b;
    return 'sms:' + nums.join(',') + '?body=' + b;
  }
  WH.smsHref = smsHref;

  /* ---------- state ---------- */
  const M = { aud: null, org: '', gid: '', who: 'youth', msg: null, mode: 'group', named: true, sent: {}, lessons: null };
  const groupsOf = org => (M.aud.groups || []).filter(g => g.org === org);
  const cur = () => (M.aud.groups || []).find(g => g.org === M.org && g.id === M.gid) || null;
  function recipients(g) {
    if (!g) return [];
    let out = [];
    const isKids = g.youth || g.children;
    g.members.forEach(m => {
      if (m.x) return;
      if (!isKids) { out.push(m); return; }
      const who = g.children ? 'parents' : M.who;
      if (who === 'youth' || who === 'both') out.push(m);
      if (who === 'parents' || who === 'both') (m.parents || []).forEach(p => out.push({ n: p.n, f: String(p.n).split(' ')[0], p: p.p, parentOf: m.n }));
    });
    const seen = {}; return out.filter(r => { const k = String(r.p || r.n).replace(/\D/g, '') || r.n; if (seen[k]) return false; seen[k] = 1; return true; });
  }

  WH.routes.messages = {
    view(args) {
      const { screen, cached, skeleton, errorBox } = WH;
      if (args && args[0]) { M.org = decodeURIComponent(args[0]); M.gid = decodeURIComponent(args[1] || ''); if (args[2]) M.msg = decodeURIComponent(args[2]); }
      screen('Messages', 'Texts go from your phone. Replies come to you.', skeleton(5), { back: '#/more', backLabel: 'More' });
      cached('audiences', 'audiences', {}, d => {
        if (!d) return; if (d.error) { document.getElementById('body').innerHTML = errorBox(d.error); return; }
        M.aud = d; if (!M.org || !groupsOf(M.org).length) { M.org = (d.groups[0] || {}).org || ''; M.gid = ''; }
        if (!M.gid || !cur()) M.gid = (groupsOf(M.org)[0] || {}).id || '';
        draw();
        if (!M.lessons) WH.call('lessons', {}).then(r => { M.lessons = r; if (M.msg === null) draw(); }).catch(() => { });
      });
    }
  };
  function draw() {
    const { esc } = WH, body = document.getElementById('body'); if (!body || !M.aud) return;
    const orgs = [...new Set(M.aud.groups.map(g => g.org))];
    const g = cur(), list = recipients(g), withPhone = list.filter(r => r.p), noPhone = list.filter(r => !r.p), skipped = g ? g.members.filter(m => m.x).length : 0;
    if (M.msg === null) M.msg = suggest(g) || '';
    let h = orgs.length > 1 ? `<div class="dates" style="margin-bottom:4px">${orgs.map(o => `<button class="date ${o === M.org ? 'on' : ''}" style="min-width:auto" data-act="msgOrg" data-org="${esc(o)}"><div class="d" style="font-size:15px;padding:4px 2px;white-space:nowrap">${esc(o)}</div></button>`).join('')}</div>` : '';
    h += `<div class="section-h"><span>Who</span></div><div class="list">${groupsOf(M.org).map(x => `<button class="row" data-act="msgGroup" data-id="${esc(x.id)}"><span class="check ${x.id === M.gid ? 'on' : ''}" style="width:22px;height:22px"></span><div class="main"><div class="t">${esc(x.label)}</div>${x.leader ? `<div class="s">Leader: ${esc(x.leader)}</div>` : ''}</div><span class="r">${x.members.length}</span></button>`).join('')}</div>`;
    h += `<div class="foot" style="display:flex;gap:16px;flex-wrap:wrap"><button class="link" style="font-size:15px" data-act="msgNewGroup">Save a new group</button>${g && g.saved ? `<button class="link" style="font-size:15px" data-act="msgEditGroup">Change this group</button>` : ''}</div>`;
    if (g && (g.youth || g.children)) h += `<div class="section-h"><span>Send to</span></div>${g.children ? '<div class="list"><div class="row"><div class="main"><div class="t">Parents</div><div class="s">Children are reached through their parents.</div></div></div></div>' : `<div class="seg">${[['youth', 'Youth'], ['parents', 'Parents'], ['both', 'Youth + parents']].map(o => `<button class="${M.who === o[0] ? 'on' : ''}" data-act="msgWho" data-v="${o[0]}">${o[1]}</button>`).join('')}</div><p class="foot">Texting youth? Include their parents or another leader.</p>`}`;
    h += `<div class="section-h"><span>Message</span><span>${withPhone.length} with a phone${noPhone.length ? ' · ' + noPhone.length + ' without' : ''}${skipped ? ' · ' + skipped + " on Don't text" : ''}</span></div>`;
    const tpl = templates(g);
    if (tpl.length) h += `<div class="dates" style="margin-bottom:6px">${tpl.map((t, i) => `<button class="date" style="min-width:auto" data-act="msgTpl" data-i="${i}"><div class="d" style="font-size:14px;padding:4px 2px;white-space:nowrap">${esc(t[0])}</div></button>`).join('')}</div>`;
    h += `<div class="list"><div class="field col"><textarea id="msgtext" style="min-height:120px;font-size:17px" placeholder="What would you like to tell them?">${esc(M.msg)}</textarea></div></div>`;
    h += `<div class="section-h"><span>How to send</span></div><div class="seg">${[['group', 'Group texts'], ['one', 'One at a time']].map(o => `<button class="${M.mode === o[0] ? 'on' : ''}" data-act="msgMode" data-v="${o[0]}">${o[1]}</button>`).join('')}</div>`;
    h += `<p class="foot">${M.mode === 'group' ? 'Each button opens one group text of up to 20 on your phone. Everyone in it sees the numbers and replies.' : 'Each button opens a private text to one person. Replies come only to you.'}</p>`;
    if (M.mode === 'group') {
      const nums = withPhone.map(r => r.p), batches = [];
      for (let i = 0; i < nums.length; i += 20) batches.push(nums.slice(i, i + 20));
      h += batches.length ? batches.map((b, i) => `<a class="btn" style="margin-top:10px;text-decoration:none" data-act="msgSent" data-n="${b.length}" href="${esc(smsHref(b, M.msg))}">${WH.I.msg.replace('<svg', '<svg width="18" height="18"')} Text ${batches.length > 1 ? 'group ' + (i + 1) + ' ' : ''}(${b.length})</a>`).join('') : '<div class="list"><div class="empty">No phone numbers in this group.</div></div>';
    } else {
      h += `<div class="list" style="margin-top:8px"><div class="field"><label style="flex:1">Start with their first name</label><span class="toggle"><input type="checkbox" id="msgnamed" ${M.named ? 'checked' : ''}><span></span></span></div></div><div class="list" style="margin-top:10px">` +
        withPhone.map(r => { const body = (M.named ? 'Hi ' + r.f + ', ' : '') + M.msg, done = M.sent[r.p]; return `<div class="row" style="${done ? 'opacity:.45' : ''}"><div class="main"><div class="t">${esc(r.n)}</div>${r.parentOf ? `<div class="s">Parent of ${esc(r.parentOf)}</div>` : ''}</div><a class="btn small" style="text-decoration:none" data-act="msgOne" data-p="${esc(r.p)}" href="${esc(smsHref([r.p], body))}">${done ? 'Sent' : 'Text'}</a></div>`; }).join('') + '</div>';
    }
    const emails = list.filter(r => r.e).map(r => r.e);
    if (emails.length) h += `<div class="btns"><button class="btn gray" data-act="msgEmail">Email them instead (${emails.length})</button></div>`;
    if (noPhone.length) h += `<div class="section-h"><span>No phone on the ward list</span></div><div class="list">${noPhone.slice(0, 40).map(r => `<div class="row"><div class="main"><div class="t" style="font-size:15px">${esc(r.n)}</div></div></div>`).join('')}</div>`;
    body.innerHTML = h;
    const ta = document.getElementById('msgtext'); ta.addEventListener('input', () => { M.msg = ta.value; refreshLinks(); });
    const nm = document.getElementById('msgnamed'); if (nm) nm.addEventListener('change', () => { M.named = nm.checked; draw(); });
  }
  function refreshLinks() { // keep the buttons' text current without redrawing (so typing isn't interrupted)
    document.querySelectorAll('#body a[href^="sms:"]').forEach(a => {
      const u = a.getAttribute('href'), i = u.indexOf('body=');
      if (a.dataset.p) { const r = recipients(cur()).find(x => x.p === a.dataset.p); a.setAttribute('href', smsHref([a.dataset.p], (M.named && r ? 'Hi ' + r.f + ', ' : '') + M.msg)); }
      else if (i >= 0) a.setAttribute('href', u.slice(0, i + 5) + encodeURIComponent(M.msg));
    });
  }
  function lessonFor(g) {
    const L = (M.lessons && M.lessons.lessons) || [];
    if (!g) return null;
    const cls = String(g.id).startsWith('c:') ? g.id.slice(2) : '';
    return L.find(l => l.org === g.org && l.text && (!cls || l.cls === cls)) || L.find(l => l.org === g.org && l.text) || null;
  }
  function templates(g) {
    const t = [], me = M.aud.me, l = lessonFor(g);
    if (l) t.push(['This Sunday\'s lesson', l.text]);
    if (g && g.zone && M.duties) M.duties.filter(d => d.now === g.label).forEach(d => t.push([d.name, d.msg || `Your zone (${g.label}) has ${d.name.toLowerCase()} this week. Thank you!`]));
    t.push(['Reminder', `Reminder from ${me}: `]);
    t.push(['Blank', '']);
    return t;
  }
  function suggest(g) { const l = lessonFor(g); return l ? l.text : ''; }

  Object.assign(WH.act, {
    msgOrg(el) { M.org = el.dataset.org; M.gid = (groupsOf(M.org)[0] || {}).id || ''; draw(); },
    msgGroup(el) { M.gid = el.dataset.id; M.sent = {}; draw(); },
    msgWho(el) { M.who = el.dataset.v; draw(); },
    msgMode(el) { M.mode = el.dataset.v; draw(); },
    msgTpl(el) { const t = templates(cur())[+el.dataset.i]; if (t) { M.msg = t[1]; draw(); const ta = document.getElementById('msgtext'); ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); } },
    msgSent(el) { if (!M.msg.trim()) { WH.toast('Type a message first'); return; } WH.call('textSent', { group: (cur() || {}).label, count: +el.dataset.n }).catch(() => { }); location.href = el.getAttribute('href'); },
    msgOne(el) { if (!M.msg.trim()) { WH.toast('Type a message first'); return; } M.sent[el.dataset.p] = 1; WH.call('textSent', { group: (cur() || {}).label + ' (one)', count: 1 }).catch(() => { }); location.href = el.getAttribute('href'); setTimeout(draw, 600); },
    msgEmail() {
      const list = recipients(cur()).filter(r => r.e).map(r => r.e); let body = M.msg || '';
      try { navigator.clipboard.writeText(body); } catch (e) { }
      if (body.length > 1800) body = body.slice(0, 1700) + '\n\n[Cut short. The whole message is copied; paste it here.]';
      location.href = 'mailto:?bcc=' + list.join(',') + '&subject=' + encodeURIComponent((cur() || {}).label || '') + '&body=' + encodeURIComponent(body);
    },
    msgNewGroup() { groupEditor('', []); },
    msgEditGroup() { const g = cur(); groupEditor(g.saved, g.members.map(m => m.n)); }
  });
  async function groupEditor(name, names) {
    const { esc, openSheet } = WH; await WH.loadNames();
    const pool = WH.DATALISTS.people || [];
    const sel = new Set(names);
    const render = q => pool.filter(n => !q || n.toLowerCase().includes(q)).slice(0, 80).map(n => `<button class="row" data-pick="${esc(n)}"><span class="check ${sel.has(n) ? 'on' : ''}" style="width:22px;height:22px"></span><div class="main"><div class="t">${esc(n)}</div></div></button>`).join('');
    openSheet(`<header><button class="link" data-act="close">Cancel</button><h2>${name ? 'Change group' : 'New group'}</h2><button class="link r" id="gsave">Save</button></header>
      <div class="list"><div class="field"><label>Name</label><input id="gname" value="${esc(name)}" placeholder="e.g. Compassionate service"></div></div>
      <div class="search" style="margin-top:12px">${WH.I.search}<input id="gq" placeholder="Search names"></div><p class="foot" id="gcount">${sel.size} chosen</p><div class="list" id="glist">${render('')}</div>`);
    const gl = document.getElementById('glist');
    document.getElementById('gq').addEventListener('input', e => { gl.innerHTML = render(e.target.value.trim().toLowerCase()); });
    gl.addEventListener('click', e => { const b = e.target.closest('[data-pick]'); if (!b) return; const n = b.dataset.pick; sel.has(n) ? sel.delete(n) : sel.add(n); b.querySelector('.check').classList.toggle('on'); document.getElementById('gcount').textContent = sel.size + ' chosen'; });
    document.getElementById('gsave').onclick = async () => {
      const nm = document.getElementById('gname').value.trim(); if (!nm) { WH.toast('Name the group'); return; }
      try { await WH.call('saveTextGroup', { org: M.org === 'Ward' ? (WH.S.boot.me.orgs[0] || 'Ward') : M.org, name: nm, old: name, names: [...sel] }); WH.store.del('c:audiences'); WH.closeSheet(); WH.toast('Saved', true); M.gid = 's:' + M.org + ':' + nm; WH.routes.messages.view(); } catch (e) { WH.toast(e.message); }
    };
  }

  /* ---------- Lesson texts ---------- */
  WH.routes.lessons = {
    view() {
      const { screen, cached, skeleton, errorBox, esc } = WH;
      screen('Lesson texts', 'The lessons for this coming Sunday', skeleton(4), { back: '#/more', backLabel: 'More' });
      cached('lessons', 'lessons', {}, d => {
        if (!d) return; if (d.error) { document.getElementById('body').innerHTML = errorBox(d.error); return; }
        M.lessons = d;
        const L = d.lessons.filter(l => l.topic || l.teacher);
        document.getElementById('body').innerHTML = (L.length ? L.map(l => `<div class="section-h"><span>${esc(l.org)}${l.cls && l.cls !== l.org ? ' · ' + esc(l.cls) : ''}</span>${l.canEdit ? `<button class="link" style="font-size:15px" data-act="lessonEdit" data-id="${esc(l.id)}">Edit</button>` : ''}</div>
          <div class="list"><div class="row wrap"><div class="main"><div class="t">${esc(l.topic || 'No topic yet')}</div><div class="s">${l.teacher ? 'Teacher: ' + esc(l.teacher) : 'No teacher listed'}</div>${l.text ? `<div class="s" style="margin-top:8px;color:var(--text);font-size:15px">${esc(l.text)}</div>` : ''}</div></div>
          ${l.text ? `<button class="row" data-act="lessonSend" data-id="${esc(l.id)}"><div class="main"><div class="t" style="color:var(--accent)">Text this to the class</div></div>${WH.I.chev}</button>` : ''}</div>`).join('') : '<div class="list"><div class="empty">No lessons are on the teaching schedule for this Sunday.</div></div>') +
          '<p class="foot">Lessons come from each organization\'s teaching schedule. Links go to Come, Follow Me or For the Strength of Youth.</p>';
      });
    }
  };
  Object.assign(WH.act, {
    lessonSend(el) {
      const l = M.lessons.lessons.find(x => x.id === el.dataset.id); if (!l) return;
      const gid = l.cls && l.cls !== l.org && !/adult/i.test(l.cls) ? 'c:' + l.cls : (/Relief|Elders/.test(l.org) ? 'all' : 'all');
      M.msg = l.text; location.hash = '#/x/messages/' + encodeURIComponent(l.org) + '/' + encodeURIComponent(gid) + '/' + encodeURIComponent(l.text);
    },
    lessonEdit(el) {
      const l = M.lessons.lessons.find(x => x.id === el.dataset.id); if (!l) return;
      WH.form('Lesson', [{ name: 'Lesson', label: 'Topic' }, { name: 'Teacher', list: 'people' }, { name: 'Link', ph: 'Filled in for you' }, { name: 'Summary', type: 'textarea' }], { Lesson: l.lesson, Teacher: l.teacher, Link: l.link, Summary: l.summary },
        async row => { row.ID = l.id; row.Organization = l.org; await WH.call('save', { tab: 'Teaching', row }); WH.store.del('c:lessons'); M.lessons = null; WH.routes.lessons.view(); });
    }
  });

  /* ---------- Elders quorum zones ---------- */
  WH.routes.zones = {
    view() {
      const { screen, skeleton, errorBox, esc } = WH;
      screen('Zones', 'Elders quorum', skeleton(5), { back: '#/more', backLabel: 'More' });
      Promise.all([WH.call('audiences', {}), WH.call('duties', {})]).then(([a, du]) => {
        M.aud = a; M.duties = du.duties;
        const zones = a.groups.filter(g => g.zone);
        let h = `<div class="section-h big"><span>Turns</span><button class="link" style="font-size:15px" data-act="dutyEdit" data-i="-1">Add</button></div>`;
        h += du.duties.length ? '<div class="list">' + du.duties.map((d, i) => `<button class="row" data-act="dutyEdit" data-i="${i}"><div class="main"><div class="t">${esc(d.name)}</div><div class="s">${d.active ? `This week: <b>${esc(d.now)}</b> · next: ${esc(d.next)}` : 'Not this month'}${d.every > 1 ? ' · every ' + d.every + ' weeks' : ''}</div></div>${WH.I.chev}</button>`).join('') + '</div>'
          + du.duties.filter(d => d.active && d.now).map(d => `<div class="btns"><button class="btn gray" data-act="dutyText" data-z="${esc(d.now)}" data-msg="${esc(d.msg || `Your zone (${d.now}) has ${d.name.toLowerCase()} this week. Thank you!`)}">Text ${esc(d.now)} about ${esc(d.name.toLowerCase())}</button></div>`).join('')
          : '<div class="list"><div class="empty">No turns yet. Add one for chairs or snow; it rotates through the zones by itself.</div></div>';
        h += `<div class="section-h big"><span>Zones</span><button class="link" style="font-size:15px" data-act="zoneAdd">Add a person</button></div>`;
        zones.forEach(z => {
          h += `<div class="section-h"><span>${esc(z.label)}</span><span>${z.members.length}</span></div><div class="list">${z.members.map(m => `<button class="row" data-act="zonePerson" data-n="${esc(m.n)}" data-z="${esc(z.label)}"><div class="main"><div class="t">${esc(m.n)}</div>${m.lead ? '<div class="s">Zone leader</div>' : ''}</div>${m.lead ? '<span class="chip blue">Leader</span>' : ''}${WH.I.chev}</button>`).join('')}</div>`;
        });
        h += '<p class="foot">Youth companions stay on the lists in LCR but aren\'t texted. Changes here don\'t change LCR.</p>';
        document.getElementById('body').innerHTML = h;
      }).catch(e => { document.getElementById('body').innerHTML = errorBox(e.message); });
    }
  };
  const zoneNames = () => M.aud.groups.filter(g => g.zone).map(g => g.label);
  Object.assign(WH.act, {
    dutyText(el) { M.org = 'Elders Quorum'; M.gid = 'z:' + el.dataset.z; M.msg = el.dataset.msg; location.hash = '#/x/messages/' + encodeURIComponent('Elders Quorum') + '/' + encodeURIComponent('z:' + el.dataset.z) + '/' + encodeURIComponent(el.dataset.msg); },
    dutyEdit(el) {
      const i = +el.dataset.i, d = i >= 0 ? M.duties[i] : { name: '', msg: '', every: 1, months: '', start: WH.nextSun() };
      WH.form(i >= 0 ? 'Turn' : 'New turn', [{ name: 'name', label: 'Name', ph: 'Chairs, snow…' }, { name: 'every', label: 'Every (weeks)', type: 'number' }, { name: 'months', label: 'Months', ph: 'e.g. Dec, Jan, Feb (blank = all year)' }, { name: 'start', label: 'Starts', type: 'date' }, { name: 'msg', label: 'Text', type: 'textarea' }], d,
        async row => { await WH.call('saveDuty', { duty: Object.assign({ id: d.id, order: d.order || [] }, row) }); WH.routes.zones.view(); },
        i >= 0 ? async () => { await WH.call('saveDuty', { duty: { id: d.id }, remove: true }); WH.routes.zones.view(); } : null);
    },
    async zoneAdd() {
      await WH.loadNames();
      WH.form('Add to a zone', [{ name: 'person', label: 'Person', list: 'people' }, { name: 'zone', label: 'Zone', type: 'select', options: zoneNames() }, { name: 'leader', label: 'Zone leader', type: 'toggle' }], {},
        async row => { await WH.call('zoneSet', row); WH.store.del('c:audiences'); WH.routes.zones.view(); });
    },
    zonePerson(el) {
      const n = el.dataset.n, z = el.dataset.z, m = (M.aud.groups.find(g => g.label === z && g.zone) || { members: [] }).members.find(x => x.n === n) || {};
      WH.form(n, [{ name: 'zone', label: 'Zone', type: 'select', options: zoneNames() }, { name: 'leader', label: 'Zone leader', type: 'toggle' }], { zone: z, leader: !!m.lead },
        async row => { await WH.call('zoneSet', { person: n, zone: row.zone, leader: row.leader }); WH.store.del('c:audiences'); WH.routes.zones.view(); },
        async () => { await WH.call('zoneSet', { person: n, remove: true }); WH.store.del('c:audiences'); WH.routes.zones.view(); });
    },
    /* speaker invitation from the Sunday program */
    async invitePart(el) {
      try {
        const r = await WH.call('inviteText', { id: el.dataset.id, app: location.origin + location.pathname.replace(/[^/]*$/, '') });
        WH.store.del('c:sunday:' + el.dataset.date);
        if (!r.phone) { try { await navigator.clipboard.writeText(r.text); } catch (e) { } WH.toast('No phone on file. The invitation is copied.'); return; }
        location.href = smsHref([r.phone], r.text);
      } catch (e) { WH.toast(e.message); }
    }
  });
})();
