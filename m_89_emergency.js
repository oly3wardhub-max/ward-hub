/* Emergency plan: what I do now (by calling), the whole plan, contacts, and checking on every household. Saved on the phone so it opens without a connection. */
(function () {
  const WH = window.WH = window.WH || {}; WH.routes = WH.routes || {}; WH.act = WH.act || {}; WH.more = WH.more || []; WH.quick = WH.quick || [];
  const ICON = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2.5l7.5 13h-15z"/><path d="M10 8v3.5M10 14v.01"/></svg>';
  const who = () => WH.isBish() || WH.can('leader') || WH.can('clerk') || WH.can('teacher');
  WH.more.push({ title: 'Emergency plan', sub: 'What to do, by calling · works offline', href: '#/x/emergency', icon: ICON, color: '#FF3B30', order: 1, show: who, group: 'Emergency' });
  WH.quick.push({ title: 'Emergency', href: '#/x/emergency', color: '#FF3B30', icon: ICON, show: who });
  const PH = ['Right away', 'First hours', 'First days'];
  let E = null, F = 'left', Q = '';
  WH.routes.emergency = {
    view() {
      WH.screen('Emergency plan', 'What to do, step by step', WH.skeleton(5), { back: '#/more', backLabel: 'More' });
      WH.cached('emergency', 'emergency', {}, (d, first) => { if (!d) return; if (d.error) { document.getElementById('body').innerHTML = WH.errorBox(d.error); return; } E = d; draw(); });
    }
  };
  const tel = p => String(p || '').replace(/[^\d+]/g, '');
  function steps(rows) { return rows.map((r, i) => `<div class="row wrap"><span class="chip ${r.Phase === 'Right away' ? 'red' : r.Phase === 'First hours' ? 'orange' : 'blue'}" style="min-width:26px;justify-content:center">${i + 1}</span><div class="main"><div class="t" style="font-weight:600">${WH.esc(r.Title)}</div><div class="s" style="color:var(--text);font-size:15px;line-height:1.4">${WH.esc(r.Text)}</div>${r.Phone ? `<a class="btn small gray" style="text-decoration:none;margin-top:6px" href="tel:${tel(r.Phone)}">Call ${WH.esc(r.Phone)}</a>` : ''}</div></div>`).join(''); }
  function draw() {
    const { esc, I } = WH, d = E, mine = d.mine || ['Everyone'];
    let h = '';
    if (d.active) h += `<div class="list" style="background:var(--red-tint)"><div class="row wrap"><div class="main"><div class="t" style="font-weight:700;color:var(--red)">${d.active.drill ? 'Practice drill' : 'Emergency'}: ${esc(d.active.name)}</div><div class="s">Started ${esc(String(d.active.started).replace('T', ' at '))} by ${esc(d.active.by)}</div></div>${d.canStart ? '<button class="btn small gray" data-act="emEnd">End</button>' : ''}</div></div>`;
    else if (d.canStart) h += `<div class="btns" style="margin-top:0"><button class="btn red" data-act="emStart">Start emergency check-in</button><button class="btn gray" data-act="emDrill">Practice drill</button></div><p class="foot">Every leader then sees what to do first, and elders quorum and Relief Society leaders mark each household.</p>`;
    /* my steps */
    const myRows = d.plan.filter(r => PH.indexOf(r.Phase) >= 0 && mine.indexOf(r.Role) >= 0);
    PH.forEach(ph => {
      const rows = myRows.filter(r => r.Phase === ph).sort((a, b) => (a.Role === 'Everyone' ? 0 : 1) - (b.Role === 'Everyone' ? 0 : 1) || (+a.Order || 0) - (+b.Order || 0));
      if (rows.length) h += `<div class="section-h big"><span>${esc(ph)}</span></div><div class="list">${steps(rows)}</div>`;
    });
    /* if it's a… */
    const hz = [...new Set(d.plan.filter(r => r.Phase === 'Hazard').map(r => r.Role))];
    if (hz.length) h += `<div class="section-h big"><span>If it's…</span></div><div class="list">${hz.map(z => `<details class="row wrap" style="display:block"><summary style="font-size:17px;padding:2px 0;cursor:pointer">${esc(z)}</summary><div style="margin-top:6px">${d.plan.filter(r => r.Phase === 'Hazard' && r.Role === z).sort((a, b) => (+a.Order || 0) - (+b.Order || 0)).map(r => `<div style="margin:4px 0 8px"><b>${esc(r.Title)}.</b> ${esc(r.Text)}</div>`).join('')}</div></details>`).join('')}</div>`;
    /* places and contacts */
    const info = d.plan.filter(r => r.Phase === 'Info');
    h += `<div class="section-h"><span>Where and who</span>${d.canEdit ? '<button class="link" style="font-size:15px" data-act="emWhere">Edit</button>' : ''}</div><div class="list">${d.places.map((p, i) => WH.kv(i ? 'Backup gathering place' : 'Ward council gathers at', p)).join('')}${d.stake ? WH.kv('Stake emergency contact', d.stake) : ''}${WH.kv('Report every household within', d.hours + ' hours')}
      ${info.map(r => `<div class="row wrap"><div class="main"><div class="t">${esc(r.Title)}</div><div class="s">${esc(r.Text)}</div></div>${r.Phone ? `<a class="btn small gray" style="text-decoration:none" href="tel:${tel(r.Phone)}">Call</a>` : ''}</div>`).join('')}</div>`;
    h += `<div class="section-h"><span>Ward council</span></div><div class="list">${d.contacts.map(c => `<div class="row"><div class="main"><div class="t">${esc(c.name)}</div><div class="s">${esc(c.calling)}</div></div>${c.phone ? `<a class="btn small gray" style="text-decoration:none" href="tel:${tel(c.phone)}">Call</a><a class="btn small gray" style="text-decoration:none;margin-left:6px" href="sms:${tel(c.phone)}">Text</a>` : ''}</div>`).join('')}</div>`;
    /* the check-first list, kept before any emergency */
    if (!d.active && d.canCheck) h += d.check ? `<div class="section-h big"><span>Check first</span><span class="chip orange">${d.check.counts.first}</span></div><p class="foot" style="margin-top:-4px">Households to check on first: those who live alone, are elderly, or have medical or special needs. Tap the star.</p><div class="search">${I.search}<input id="emq" type="search" placeholder="Search households" value="${esc(Q)}"></div><div class="list">${d.check.list.filter(x => !Q || (x.household + ' ' + x.people.join(' ')).toLowerCase().includes(Q)).slice(0, 120).map(x => `<button class="row" data-act="emFirst" data-h="${esc(x.household)}" data-on="${x.first ? 0 : 1}"><span style="font-size:20px;width:26px;color:var(--${x.first ? 'orange' : 'sub'})">${x.first ? '★' : '☆'}</span><div class="main"><div class="t">${esc(x.household)}</div><div class="s">${esc(x.people.join(', '))}</div></div></button>`).join('')}</div>`
      : '<div class="btns"><button class="btn gray" data-act="emBoard">Keep the check-first list</button></div>';
    /* check-in */
    if (d.active && d.check) {
      const c = d.check.counts, L = d.check.list.filter(x => (F === 'all' || (F === 'left' && !x.status) || (F === 'help' && x.status === 'Needs help') || (F === 'urgent' && x.status === 'Urgent') || (F === 'cant' && x.status === "Can't reach") || (F === 'safe' && x.status === 'Safe')) && (!Q || (x.household + ' ' + x.people.join(' ')).toLowerCase().includes(Q)));
      h += `<div class="section-h big"><span>Check on every household</span></div>
        <div class="seg" style="flex-wrap:wrap">${[['left', 'Not yet', c.left], ['urgent', 'Urgent', c.urgent], ['help', 'Needs help', c.help], ['cant', "Can't reach", c.cant], ['safe', 'Safe', c.safe], ['all', 'All', c.total]].map(o => `<button class="${F === o[0] ? 'on' : ''}" data-act="emF" data-f="${o[0]}">${o[1]} ${o[2]}</button>`).join('')}</div>
        <div class="search">${I.search}<input id="emq" type="search" placeholder="Search households" value="${esc(Q)}"></div>
        <div class="list">${L.slice(0, 150).map(x => `<div class="row wrap"><div class="main"><div class="t">${x.first ? '<span style="color:var(--orange)">★</span> ' : ''}${esc(x.household)}</div><div class="s">${esc(x.people.join(', '))}${x.status ? ` · <b style="color:var(--${x.status === 'Safe' ? 'green' : /Needs help|Urgent/.test(x.status) ? 'red' : 'orange'})">${esc(x.status)}</b>${x.needs ? ': ' + esc(x.needs) : ''} · ${esc(x.by)}` : ''}</div>
          <div class="btns" style="margin-top:8px;flex-wrap:wrap"><button class="btn small ${x.status === 'Safe' ? '' : 'gray'}" data-act="emMark" data-h="${esc(x.household)}" data-s="Safe">Safe</button><button class="btn small ${x.status === 'Needs help' ? 'red' : 'gray'}" data-act="emMark" data-h="${esc(x.household)}" data-s="Needs help">Needs help</button><button class="btn small ${x.status === 'Urgent' ? 'red' : 'gray'}" data-act="emMark" data-h="${esc(x.household)}" data-s="Urgent">Urgent</button><button class="btn small gray" data-act="emMark" data-h="${esc(x.household)}" data-s="Can't reach">Can't reach</button>${x.phones.map(p => `<a class="btn small gray" style="text-decoration:none" href="tel:${tel(p.p)}">Call ${esc(p.n.split(' ')[0])}</a>`).join('')}</div></div></div>`).join('') || '<div class="empty">None here.</div>'}</div>`;
      if (d.canStart) h += `<div class="btns"><a class="btn" style="text-decoration:none" href="${esc(WH.smsHref ? WH.smsHref(d.stake ? [tel(d.stake.replace(/^[^\d+]*/, ''))] : [], report()) || 'sms:?&body=' + encodeURIComponent(report()) : '#')}">Report to the stake</a></div><p class="foot">${esc(report())}</p>`;
    }
    /* the whole plan */
    const roles = [...new Set(d.plan.filter(r => PH.indexOf(r.Phase) >= 0 || r.Phase === 'Before').map(r => r.Role))];
    h += `<div class="section-h big"><span>The whole plan</span></div><div class="list">${roles.map(role => `<details class="row wrap" style="display:block"><summary style="font-size:17px;padding:2px 0;cursor:pointer">${esc(role)}${mine.indexOf(role) >= 0 ? ' <span class="chip blue">You</span>' : ''}</summary><div style="margin-top:6px">${['Before'].concat(PH).map(ph => { const rs = d.plan.filter(r => r.Role === role && r.Phase === ph).sort((a, b) => (+a.Order || 0) - (+b.Order || 0)); return rs.length ? `<div class="foot" style="margin:8px 0 2px;text-transform:uppercase">${esc(ph === 'Before' ? 'Before an emergency' : ph)}</div>` + rs.map(r => `<div style="margin:4px 0 8px" ${d.canEdit ? `data-act="emStep" data-id="${esc(r.ID)}" role="button"` : ''}><b>${esc(r.Title)}.</b> ${esc(r.Text)}${d.canEdit ? ' <span style="color:var(--accent)">Edit</span>' : ''}</div>`).join('') : ''; }).join('')}</div></details>`).join('')}</div>${d.canEdit ? '<div class="btns"><button class="btn gray" data-act="emStep">Add a step</button></div>' : ''}
      <p class="foot">Saved on this phone, so it opens without a connection.${d.canEdit ? ' Tap any step to change it, or Add a step: one step per role and stage, or a hazard card (stage "Hazard", role = the hazard).' : ''}${d.plan.some(r => r.Notes === 'Starter plan') ? ' This is the starter plan from the Church\'s ward emergency planning guide until the ward\'s own plan is entered.' : ''}</p>`;
    document.getElementById('body').innerHTML = h;
    const q = document.getElementById('emq'); if (q) q.addEventListener('input', () => { Q = q.value.trim().toLowerCase(); const pos = q.selectionStart; draw(); const n = document.getElementById('emq'); n.focus(); n.setSelectionRange(pos, pos); });
  }
  function report() {
    const c = E.check ? E.check.counts : null; if (!c) return '';
    const help = E.check.list.filter(x => /Needs help|Urgent/.test(x.status)).map(x => x.household + (x.needs ? ' (' + x.needs + ')' : '')).slice(0, 12);
    return `${E.active.drill ? 'PRACTICE DRILL. ' : ''}${WH.S.boot.settings && WH.S.boot.settings.ward_name || 'Ward'} report, ${E.active.name}: ${c.total} households · ${c.safe} safe · ${c.urgent || 0} urgent · ${c.help} need help · ${c.cant} can't reach · ${c.left} not yet checked.${help.length ? ' Needs: ' + help.join('; ') + '.' : ''} Missionaries: ___. Meetinghouse: ___.`;
  }
  Object.assign(WH.act, {
    emF(el) { F = el.dataset.f; draw(); },
    emStep(el) {
      const r = el.dataset.id ? E.plan.find(x => x.ID === el.dataset.id) : { Phase: 'Right away', Role: 'Everyone', Order: 1 };
      WH.form(el.dataset.id ? 'Step' : 'New step', [{ name: 'Phase', label: 'Stage', type: 'select', options: ['Right away', 'First hours', 'First days', 'Before', 'Info', 'Hazard'] }, { name: 'Role', label: 'Who (or the hazard)', ph: 'Everyone, Bishop, Elders quorum, Earthquake…' }, { name: 'Order', type: 'number' }, { name: 'Title' }, { name: 'Text', label: 'What to do', type: 'textarea' }, { name: 'Phone' }, { name: 'Link' }], r,
        async row => { row.ID = r.ID; await WH.call('emStepSave', { row }); WH.store.del('c:emergency'); WH.routes.emergency.view(); },
        el.dataset.id ? async () => { await WH.call('emStepSave', { row: { ID: r.ID }, remove: true }); WH.store.del('c:emergency'); WH.routes.emergency.view(); } : null);
    },
    emWhere() {
      const s = WH.S.boot.settings || {};
      WH.form('Where and who', [{ name: 'emergency_place1', label: 'Ward council gathers at' }, { name: 'emergency_place2', label: 'Backup gathering place' }, { name: 'emergency_stake_phone', label: 'Stake emergency contact (name and phone)' }, { name: 'emergency_hours', label: 'Report every household within (hours)', type: 'number' }],
        { emergency_place1: E.places[0] || '', emergency_place2: E.places[1] || '', emergency_stake_phone: E.stake || '', emergency_hours: E.hours }, async row => { await WH.call('emSettingsSave', row); Object.assign(s, row); WH.store.del('c:emergency'); WH.routes.emergency.view(); });
    },
    async emStart() {
      const name = prompt('What happened? (e.g. Earthquake, Wildfire, Winter storm)'); if (name == null) return;
      try { await WH.call('emergencyStart', { name }); WH.store.del('c:emergency'); WH.store.del('c:today'); WH.routes.emergency.view(); } catch (e) { WH.toast(e.message); }
    },
    async emDrill() { try { await WH.call('emergencyStart', { name: 'Practice drill', drill: true }); WH.store.del('c:emergency'); WH.store.del('c:today'); WH.routes.emergency.view(); } catch (e) { WH.toast(e.message); } },
    async emBoard(el) { el.innerHTML = '<span class="spin"></span>'; try { const d = await WH.call('emergency', { board: true }); E = d; draw(); } catch (e) { WH.toast(e.message); } },
    async emFirst(el) { const h = el.dataset.h, on = el.dataset.on === '1'; try { await WH.call('checkFirst', { household: h, on }); const x = E.check.list.find(y => y.household === h); x.first = on; E.check.counts.first += on ? 1 : -1; draw(); } catch (e) { WH.toast(e.message); } },
    async emEnd() { if (!confirm('End the emergency check-in? The marks are kept.')) return; try { await WH.call('emergencyEnd', {}); WH.store.del('c:emergency'); WH.store.del('c:today'); WH.routes.emergency.view(); } catch (e) { WH.toast(e.message); } },
    async emMark(el) {
      const s = el.dataset.s, h = el.dataset.h; let needs = '';
      if (s === 'Needs help' || s === 'Urgent') { needs = prompt(s === 'Urgent' ? 'What happened? (injured, trapped, fire…) Call 911 first for anything life-threatening.' : 'What do they need? (medical, shelter, food, utilities…)') || ''; }
      if (!navigator.onLine) { WH.toast('No connection. Text the bishop instead.'); return; }
      try { const r = await WH.call('checkIn', { household: h, status: s, needs }); const x = E.check.list.find(y => y.household === h); Object.assign(x, { status: s, needs, by: WH.S.boot.me.name }); E.check.counts = r.counts; WH.store.set('c:emergency', E); draw(); } catch (e) { WH.toast(e.message); }
    }
  });
})();
