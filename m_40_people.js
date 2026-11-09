/* People: search, organizations with classes and callings, calling changes, For LCR, paste from LCR. */
(function () {
  const WH = window.WH = window.WH || {}; WH.routes = WH.routes || {}; WH.act = WH.act || {}; WH.more = WH.more || []; WH.tabViews = WH.tabViews || {};
  const PASTE = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="5" y="3.5" width="10" height="14" rx="2"/><path d="M8 3.5V2.5h4v1"/><path d="M8 9h4M8 12h4"/></svg>';
  WH.more.push({ title: 'Paste from LCR', sub: 'Members and callings', href: '#/x/lcr', icon: PASTE, color: '#5856D6', order: 40, show: () => WH.can('admin') || WH.can('clerk') });
  const ORGS = ['Bishopric', 'Relief Society', 'Elders Quorum', 'Young Women', 'Young Men', 'Primary', 'Sunday School', 'Temple & Family History', 'Ward Mission', 'Activities', 'Music', 'Ward'];
  let seg = 'people', P = null;

  WH.tabViews.people = function (args) {
    const { screen, skeleton, esc, store } = WH, me = WH.S.boot.me;
    seg = args && args[0] ? args[0] : (store.get('pseg', 'people'));
    const canChanges = WH.isBish() || WH.can('clerk');
    const segs = [['people', 'People'], ['orgs', 'Organizations']].concat(canChanges ? [['changes', 'Callings']] : []);
    if (!segs.some(s => s[0] === seg)) seg = 'people';
    screen('People', '', `<div class="seg" style="margin-bottom:12px">${segs.map(s => `<button class="${seg === s[0] ? 'on' : ''}" data-act="pSeg" data-v="${s[0]}">${s[1]}</button>`).join('')}</div><div id="pbody">${skeleton(5)}</div>`);
    if (seg === 'people') peopleList();
    else if (seg === 'orgs') orgList();
    else changesView();
  };
  WH.act.pSeg = el => { WH.store.set('pseg', el.dataset.v); WH.tabViews.people([el.dataset.v]); };

  function peopleList() {
    const { esc, I } = WH, box = document.getElementById('pbody');
    box.innerHTML = `<div class="search">${I.search}<input id="q" type="search" placeholder="Search names or callings" autocomplete="off" value="${esc(WH.store.get('q', ''))}"></div><div id="plist">${WH.skeleton(6)}</div>`;
    const draw = () => {
      if (!P) return; if (P.error) { document.getElementById('plist').innerHTML = WH.errorBox(P.error); return; }
      const q = (document.getElementById('q').value || '').trim().toLowerCase(); WH.store.set('q', q);
      const cal = {}; (P.data.Callings || []).forEach(c => { if (!/Released|Proposed/.test(c.Status)) (cal[c.Person] = cal[c.Person] || []).push(c.Calling); });
      let ppl = (P.data.People || []).filter(p => p.Source !== 'Moved out' && (!q || p.Name.toLowerCase().includes(q) || (cal[p.Name] || []).join(' ').toLowerCase().includes(q) || String(p.Phone || '').replace(/\D/g, '').includes(q.replace(/\D/g, '') || '§')));
      ppl.sort((a, b) => String(a['Sort name']).localeCompare(String(b['Sort name'])));
      const total = ppl.length; ppl = ppl.slice(0, 150);
      document.getElementById('plist').innerHTML = ppl.length ? `<div class="list">${ppl.map(p => `<button class="row" data-act="person" data-name="${esc(p.Name)}"><div class="main"><div class="t">${esc(p['Sort name'] || p.Name)}</div>${cal[p.Name] ? `<div class="s">${esc(cal[p.Name].slice(0, 2).join(' · '))}</div>` : ''}</div>${I.chev}</button>`).join('')}</div><p class="foot">${total > 150 ? 'Showing 150 of ' + total + '. Search to narrow.' : total + ' people'}</p>` : '<div class="list"><div class="empty">No one matches.</div></div>';
      WH.S.people = P.data;
    };
    document.getElementById('q').addEventListener('input', draw);
    WH.cached('people', 'list', { tabs: ['People', 'Callings'] }, d => { if (d) { P = d; draw(); } });
  }

  function orgList() {
    const { esc, I, ORGCOLOR } = WH, me = WH.S.boot.me, box = document.getElementById('pbody');
    const mine = WH.isBish() || WH.can('clerk') ? ORGS : [...new Set((me.orgs || []).concat(me.teachOrgs || []))];
    box.innerHTML = mine.length ? `<div class="list">${mine.map(o => `<button class="row ic" data-go="#/x/org/${encodeURIComponent(o)}"><span class="icon" style="background:${ORGCOLOR[o] || '#8E8E93'}">${esc(o.split(' ').map(w => w[0]).join('').slice(0, 2))}</span><div class="main"><div class="t">${esc(o)}</div></div>${I.chev}</button>`).join('')}</div>` : '<div class="list"><div class="empty">You\'ll see your organization here.</div></div>';
  }

  /* ---------- one organization ---------- */
  let O = null;
  WH.routes.org = {
    tab: 'people',
    view([org]) {
      org = decodeURIComponent(org || '');
      WH.screen(org, '', WH.skeleton(5), { back: '#/people/orgs', backLabel: 'People' });
      WH.call('org', { org }).then(d => { O = d; drawOrg(); }).catch(e => { document.getElementById('body').innerHTML = WH.errorBox(e.message); });
    }
  };
  function drawOrg() {
    const { esc, I, fmt } = WH, d = O;
    let h = '';
    if (d.classes.length) {
      h += `<div class="section-h big"><span>Classes</span>${d.lead ? `<button class="link" style="font-size:15px" data-act="clsAdd">Add a person</button>` : ''}</div>`;
      d.classes.forEach(c => {
        h += `<div class="section-h"><span>${esc(c.name)}</span><span>${c.members.length}</span></div><div class="list">`;
        h += c.teachers.map(t => `<button class="row" ${d.lead ? `data-act="clsPerson" data-id="${esc(t.id)}" data-g="${esc(c.name)}"` : ''}><div class="main"><div class="t">${esc(t.person)}</div></div><span class="chip blue">Teacher</span>${d.lead ? I.chev : ''}</button>`).join('');
        if (!c.teachers.length && d.lead) h += `<button class="row" data-act="clsTeacher" data-g="${esc(c.name)}"><div class="main"><div class="t" style="color:var(--orange)">No teacher yet · add one</div></div>${I.chev}</button>`;
        h += c.members.map(m => `<button class="row" ${d.lead ? `data-act="clsPerson" data-id="${esc(m.id)}" data-g="${esc(c.name)}"` : `data-act="person" data-name="${esc(m.person)}"`}><div class="main"><div class="t">${esc(m.person)}</div>${m.notes ? `<div class="s">${esc(m.notes)}</div>` : ''}</div>${I.chev}</button>`).join('');
        h += '</div>';
        if (c.later.length) h += `<details class="foot" style="margin:8px 4px 0"><summary>Later: ${c.later.length} (${esc(c.later[0].period)})</summary>${c.later.map(m => esc(m.person)).join(', ')}</details>`;
      });
    }
    const groups = {}; d.callings.forEach(c => (groups[c.group || ''] = groups[c.group || ''] || []).push(c));
    h += `<div class="section-h big"><span>Callings</span><span class="chip">${d.callings.length}</span></div>`;
    Object.keys(groups).sort().forEach(g => {
      if (g) h += `<div class="section-h"><span>${esc(g)}</span></div>`;
      h += `<div class="list">${groups[g].map(c => `<button class="row" data-act="person" data-name="${esc(c.person)}"><div class="main"><div class="t">${esc(c.person)}</div><div class="s">${esc(c.calling)}${c.sustained ? ' · since ' + esc(fmt(c.sustained, { month: 'short', year: 'numeric' })) : ''}</div></div>${I.chev}</button>`).join('')}</div>`;
    });
    if (d.open.length) h += `<div class="section-h"><span>Open callings</span></div><div class="list">${d.open.map(c => `<div class="row"><div class="main"><div class="t">${esc(c.calling)}</div></div><span class="chip orange">Open</span></div>`).join('')}</div>`;
    h += '<p class="foot">Class changes here don\'t change LCR. Callings change through the bishopric.</p>';
    document.getElementById('body').innerHTML = h;
  }
  const classNames = () => O.classes.map(c => c.name);
  async function clsForm(title, vals, onDelete) {
    await WH.loadNames();
    WH.form(title, [{ name: 'person', label: 'Person', list: 'people' }, { name: 'group', label: 'Class', type: 'select', options: classNames() }, { name: 'role', label: 'Role', type: 'select', options: ['Member', 'Teacher'] }, { name: 'period', label: 'Only during', ph: 'e.g. 2027-01 to 2027-07' }, { name: 'notes', label: 'Note', type: 'textarea' }], vals,
      async row => { await WH.call('classSet', Object.assign({ org: O.org, id: vals.id || '' }, row)); WH.routes.org.view([encodeURIComponent(O.org)]); }, onDelete);
  }
  Object.assign(WH.act, {
    clsAdd() { clsForm('Add to a class', { group: classNames()[0], role: 'Member' }); },
    clsTeacher(el) { clsForm('Add a teacher', { group: el.dataset.g, role: 'Teacher' }); },
    clsPerson(el) {
      const c = O.classes.find(x => x.name === el.dataset.g), m = c.teachers.concat(c.members).find(x => x.id === el.dataset.id); if (!m) return;
      clsForm(m.person, { id: m.id, person: m.person, group: c.name, role: m.role, period: m.period, notes: m.notes },
        async () => { await WH.call('classSet', { org: O.org, id: m.id, remove: true }); WH.routes.org.view([encodeURIComponent(O.org)]); });
    }
  });

  /* ---------- calling changes ---------- */
  WH.routes.changes = { tab: 'people', view() { WH.store.set('pseg', 'changes'); WH.tabViews.people(['changes']); } };
  let CH = null;
  function changesView() {
    Promise.all([WH.call('changes', {}), WH.call('forLcr', {})]).then(([c, f]) => { CH = c; drawChanges(f); }).catch(e => { document.getElementById('pbody').innerHTML = WH.errorBox(e.message); });
  }
  function drawChanges(f) {
    const { esc, I, fmt } = WH, bish = WH.isBish();
    let h = bish ? `<div class="btns" style="margin-top:0"><button class="btn" data-act="chNew">${I.plus} New calling change</button></div>` : '';
    if (f.items.length) h += `<div class="section-h big"><span>For LCR</span><span class="chip orange">${f.items.length}</span></div><div class="list">${f.items.map(i => `<div class="row"><div class="main"><div class="t">${esc(i.what)}</div><div class="s">${esc(i.org)}${i.sustained ? ' · sustained ' + esc(fmt(i.sustained)) : ''}${i.setApart ? ' · set apart ' + esc(fmt(i.setApart)) : ''}</div></div><button class="btn small" data-act="chStep" data-id="${esc(i.id)}" data-step="recorded">Recorded</button></div>`).join('')}</div><p class="foot">Tap Recorded after entering it in LCR.</p>`;
    const by = {}; CH.changes.filter(c => !(c.Status === 'Sustained' || c.Status === 'Set apart') || !c['Recorded in LCR']).forEach(c => (by[c.Status] = by[c.Status] || []).push(c));
    CH.steps.forEach(s => {
      const L = by[s] || []; if (!L.length) return;
      h += `<div class="section-h big"><span>${esc(s)}</span><span class="chip">${L.length}</span></div><div class="list">${L.map(c => `<button class="row" data-act="chOpen" data-id="${esc(c.ID)}"><div class="main"><div class="t">${esc(c.Change === 'Release' ? 'Release ' + c.Person : c.Person)}</div><div class="s">${esc(c.Calling)} · ${esc(c.Organization)}${c.Sunday ? ' · ' + esc(fmt(c.Sunday)) : ''}</div></div>${I.chev}</button>`).join('')}</div>`;
    });
    if (!CH.changes.length && !f.items.length) h += '<div class="list"><div class="empty">No calling changes in progress.</div></div>';
    document.getElementById('pbody').innerHTML = h;
  }
  const chFields = () => [{ name: 'Change', type: 'select', options: ['Call', 'Release', 'Call and release'] }, { name: 'Person', list: 'people' }, { name: 'Calling' }, { name: 'Organization', type: 'select', options: ORGS }, { name: 'Group', label: 'Class / group' }, { name: 'Sunday', label: 'Sustain on', type: 'date' }, { name: 'Extends', list: 'people', label: 'Extends' }, { name: 'Sets apart', list: 'people' }, { name: 'Private notes', type: 'textarea' }];
  Object.assign(WH.act, {
    async chNew() { await WH.loadNames(); WH.form('Calling change', chFields(), { Change: 'Call' }, async row => { await WH.call('changeSave', { row }); changesView(); }); },
    async chOpen(el) {
      const c = CH.changes.find(x => x.ID === el.dataset.id); if (!c) return; await WH.loadNames();
      const i = CH.steps.indexOf(c.Status), next = CH.steps[i + 1];
      const extra = WH.isBish() && next ? `<div class="btns" style="margin:0 0 12px"><button class="btn" data-act="chStep" data-id="${WH.esc(c.ID)}" data-step="${WH.esc(next)}">Mark ${WH.esc(next.toLowerCase())}</button></div>` : '';
      WH.form(c.Person, chFields(), c, async row => { row.ID = c.ID; row.Status = c.Status; await WH.call('changeSave', { row }); changesView(); },
        WH.isBish() ? async () => { await WH.call('remove', { tab: 'Callings', id: c.ID }); changesView(); } : null, extra);
    },
    async chStep(el) { try { await WH.call('changeStep', { id: el.dataset.id, step: el.dataset.step }); WH.closeSheet(); WH.toast('Updated', true); WH.store.del('c:today'); changesView(); } catch (e) { WH.toast(e.message); } }
  });

  /* ---------- Paste from LCR ---------- */
  let LK = 'members';
  WH.routes.lcr = {
    view() {
      const { esc } = WH;
      WH.screen('Paste from LCR', 'Keep members and callings current', `<div class="seg">${[['members', 'Members'], ['callings', 'Callings']].map(o => `<button class="${LK === o[0] ? 'on' : ''}" data-act="lcrKind" data-v="${o[0]}">${o[1]}</button>`).join('')}</div>
        <ol class="foot" style="padding-left:20px;line-height:1.5"><li>In LCR, open <b>${LK === 'members' ? 'Membership › Member List' : 'Organizations › Callings (Members with Callings)'}</b>.</li><li>Select the whole table, heading row included, and copy.</li><li>Paste below and tap Preview. Nothing changes until you tap Apply.</li></ol>
        <div class="list"><div class="field col"><textarea id="lcrtext" style="min-height:160px;font-size:14px" placeholder="Paste here"></textarea></div></div>
        <div class="btns"><button class="btn" data-act="lcrPreview">Preview</button></div><div id="lcrout"></div>`, { back: '#/more', backLabel: 'More' });
    }
  };
  let LT = '';
  Object.assign(WH.act, {
    lcrKind(el) { LK = el.dataset.v; WH.routes.lcr.view(); },
    async lcrPreview() {
      LT = document.getElementById('lcrtext').value; if (!LT.trim()) { WH.toast('Paste the LCR list first'); return; }
      const out = document.getElementById('lcrout'); out.innerHTML = WH.skeleton(2);
      try {
        const { diff: d } = await WH.call('lcrPreview', { kind: LK, text: LT }), { esc } = WH;
        const warn = d.gone.length > Math.max(15, d.count * 0.2);
        out.innerHTML = `<div class="section-h big"><span>What will change</span></div><div class="list">${WH.kv('Rows read', d.count)}${WH.kv('New', d.add.length)}${LK === 'members' ? WH.kv('Updated', d.change.length) : ''}${WH.kv(LK === 'members' ? 'Moved out' : 'Released', d.gone.length)}${WH.kv('No change', d.same)}</div>
          ${warn ? `<div class="list" style="margin-top:10px"><div class="row wrap"><div class="main"><div class="t" style="color:var(--red)">That's a lot marked ${LK === 'members' ? 'moved out' : 'released'}.</div><div class="s">Make sure you copied the whole list, not just one page or one organization.</div></div></div></div>` : ''}
          ${d.add.length ? `<div class="section-h"><span>New</span></div><div class="list">${d.add.slice(0, 40).map(a => `<div class="row"><div class="main"><div class="t" style="font-size:15px">${esc(a.sort || a.person)}</div>${a.calling ? `<div class="s">${esc(a.calling)}</div>` : ''}</div></div>`).join('')}</div>` : ''}
          ${d.change.length ? `<div class="section-h"><span>Updated</span></div><div class="list">${d.change.slice(0, 40).map(c => `<div class="row"><div class="main"><div class="t" style="font-size:15px">${esc(c.name)}</div><div class="s">${esc(c.what.join(', '))}</div></div></div>`).join('')}</div>` : ''}
          ${d.gone.length ? `<div class="section-h"><span>${LK === 'members' ? 'Moved out (kept, marked)' : 'Released'}</span></div><div class="list">${d.gone.slice(0, 40).map(g => `<div class="row"><div class="main"><div class="t" style="font-size:15px">${esc(g.name)}</div>${g.calling ? `<div class="s">${esc(g.calling)}</div>` : ''}</div></div>`).join('')}</div>` : ''}
          <div class="btns"><button class="btn" data-act="lcrApply" data-warn="${warn ? 1 : 0}">Apply</button></div>`;
      } catch (e) { out.innerHTML = WH.errorBox(e.message); }
    },
    async lcrApply(el) {
      if (el.dataset.warn === '1' && !confirm('Many will be marked. Are you sure this is the whole list?')) return;
      if (!confirm('Apply these changes?')) return;
      try { const r = await WH.call('lcrApply', { kind: LK, text: LT }); WH.toast(r.applied + ' updated', true); ['c:people', 'c:audiences', 'c:today'].forEach(k => WH.store.del(k)); WH.routes.lcr.view(); } catch (e) { WH.toast(e.message); }
    }
  });
})();
