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
    if (d.active) h += `<div class="list" style="background:var(--red-tint)"><div class="row wrap"><div class="main"><div class="t" style="font-weight:700;color:var(--red)">Emergency: ${esc(d.active.name)}</div><div class="s">Started ${esc(String(d.active.started).replace('T', ' at '))} by ${esc(d.active.by)}</div></div>${d.canStart ? '<button class="btn small gray" data-act="emEnd">End</button>' : ''}</div></div>`;
    else if (d.canStart) h += `<div class="btns" style="margin-top:0"><button class="btn red" data-act="emStart">Start emergency check-in</button></div><p class="foot">Every leader then sees what to do first, and elders quorum and Relief Society leaders mark each household.</p>`;
    /* my steps */
    const myRows = d.plan.filter(r => PH.indexOf(r.Phase) >= 0 && mine.indexOf(r.Role) >= 0);
    PH.forEach(ph => {
      const rows = myRows.filter(r => r.Phase === ph).sort((a, b) => (a.Role === 'Everyone' ? 0 : 1) - (b.Role === 'Everyone' ? 0 : 1) || (+a.Order || 0) - (+b.Order || 0));
      if (rows.length) h += `<div class="section-h big"><span>${esc(ph)}</span></div><div class="list">${steps(rows)}</div>`;
    });
    /* places and contacts */
    const info = d.plan.filter(r => r.Phase === 'Info');
    h += `<div class="section-h"><span>Where and who</span></div><div class="list">${d.places.map((p, i) => WH.kv(i ? 'Backup gathering place' : 'Ward council gathers at', p)).join('')}${d.stake ? WH.kv('Stake emergency contact', d.stake) : ''}${WH.kv('Report every household within', d.hours + ' hours')}
      ${info.map(r => `<div class="row wrap"><div class="main"><div class="t">${esc(r.Title)}</div><div class="s">${esc(r.Text)}</div></div>${r.Phone ? `<a class="btn small gray" style="text-decoration:none" href="tel:${tel(r.Phone)}">Call</a>` : ''}</div>`).join('')}</div>`;
    h += `<div class="section-h"><span>Ward council</span></div><div class="list">${d.contacts.map(c => `<div class="row"><div class="main"><div class="t">${esc(c.name)}</div><div class="s">${esc(c.calling)}</div></div>${c.phone ? `<a class="btn small gray" style="text-decoration:none" href="tel:${tel(c.phone)}">Call</a><a class="btn small gray" style="text-decoration:none;margin-left:6px" href="sms:${tel(c.phone)}">Text</a>` : ''}</div>`).join('')}</div>`;
    /* check-in */
    if (d.active && d.check) {
      const c = d.check.counts, L = d.check.list.filter(x => (F === 'all' || (F === 'left' && !x.status) || (F === 'help' && x.status === 'Needs help') || (F === 'cant' && x.status === "Can't reach") || (F === 'safe' && x.status === 'Safe')) && (!Q || (x.household + ' ' + x.people.join(' ')).toLowerCase().includes(Q)));
      h += `<div class="section-h big"><span>Check on every household</span></div>
        <div class="seg" style="flex-wrap:wrap">${[['left', 'Not yet', c.left], ['help', 'Needs help', c.help], ['cant', "Can't reach", c.cant], ['safe', 'Safe', c.safe], ['all', 'All', c.total]].map(o => `<button class="${F === o[0] ? 'on' : ''}" data-act="emF" data-f="${o[0]}">${o[1]} ${o[2]}</button>`).join('')}</div>
        <div class="search">${I.search}<input id="emq" type="search" placeholder="Search households" value="${esc(Q)}"></div>
        <div class="list">${L.slice(0, 150).map(x => `<div class="row wrap"><div class="main"><div class="t">${esc(x.household)}</div><div class="s">${esc(x.people.join(', '))}${x.status ? ` · <b style="color:var(--${x.status === 'Safe' ? 'green' : x.status === 'Needs help' ? 'red' : 'orange'})">${esc(x.status)}</b>${x.needs ? ': ' + esc(x.needs) : ''} · ${esc(x.by)}` : ''}</div>
          <div class="btns" style="margin-top:8px;flex-wrap:wrap"><button class="btn small ${x.status === 'Safe' ? '' : 'gray'}" data-act="emMark" data-h="${esc(x.household)}" data-s="Safe">Safe</button><button class="btn small ${x.status === 'Needs help' ? 'red' : 'gray'}" data-act="emMark" data-h="${esc(x.household)}" data-s="Needs help">Needs help</button><button class="btn small gray" data-act="emMark" data-h="${esc(x.household)}" data-s="Can't reach">Can't reach</button>${x.phones.map(p => `<a class="btn small gray" style="text-decoration:none" href="tel:${tel(p.p)}">Call ${esc(p.n.split(' ')[0])}</a>`).join('')}</div></div></div>`).join('') || '<div class="empty">None here.</div>'}</div>`;
      if (d.canStart) h += `<div class="btns"><a class="btn" style="text-decoration:none" href="${esc(WH.smsHref ? WH.smsHref(d.stake ? [tel(d.stake.replace(/^[^\d+]*/, ''))] : [], report()) || 'sms:?&body=' + encodeURIComponent(report()) : '#')}">Report to the stake</a></div><p class="foot">${esc(report())}</p>`;
    }
    /* the whole plan */
    const roles = [...new Set(d.plan.filter(r => PH.indexOf(r.Phase) >= 0 || r.Phase === 'Before').map(r => r.Role))];
    h += `<div class="section-h big"><span>The whole plan</span></div><div class="list">${roles.map(role => `<details class="row wrap" style="display:block"><summary style="font-size:17px;padding:2px 0;cursor:pointer">${esc(role)}${mine.indexOf(role) >= 0 ? ' <span class="chip blue">You</span>' : ''}</summary><div style="margin-top:6px">${['Before'].concat(PH).map(ph => { const rs = d.plan.filter(r => r.Role === role && r.Phase === ph).sort((a, b) => (+a.Order || 0) - (+b.Order || 0)); return rs.length ? `<div class="foot" style="margin:8px 0 2px;text-transform:uppercase">${esc(ph === 'Before' ? 'Before an emergency' : ph)}</div>` + rs.map(r => `<div style="margin:4px 0 8px"><b>${esc(r.Title)}.</b> ${esc(r.Text)}</div>`).join('') : ''; }).join('')}</div></details>`).join('')}</div>
      <p class="foot">Saved on this phone, so it opens without a connection.${d.canEdit ? ' To put in the red binder\'s plan: More › All lists › Emergency (one row per step, by role).' : ''}${d.plan.some(r => r.Notes === 'Starter plan') ? ' This is the starter plan from the Church\'s ward emergency planning guide until the ward\'s own plan is entered.' : ''}</p>`;
    document.getElementById('body').innerHTML = h;
    const q = document.getElementById('emq'); if (q) q.addEventListener('input', () => { Q = q.value.trim().toLowerCase(); const pos = q.selectionStart; draw(); const n = document.getElementById('emq'); n.focus(); n.setSelectionRange(pos, pos); });
  }
  function report() {
    const c = E.check ? E.check.counts : null; if (!c) return '';
    const help = E.check.list.filter(x => x.status === 'Needs help').map(x => x.household + (x.needs ? ' (' + x.needs + ')' : '')).slice(0, 12);
    return `${WH.S.boot.settings && WH.S.boot.settings.ward_name || 'Ward'} report, ${E.active.name}: ${c.total} households · ${c.safe} safe · ${c.help} need help · ${c.cant} can't reach · ${c.left} not yet checked.${help.length ? ' Needs: ' + help.join('; ') + '.' : ''} Missionaries: ___. Meetinghouse: ___.`;
  }
  Object.assign(WH.act, {
    emF(el) { F = el.dataset.f; draw(); },
    async emStart() {
      const name = prompt('What happened? (e.g. Earthquake, Wildfire, Winter storm)'); if (name == null) return;
      try { await WH.call('emergencyStart', { name }); WH.store.del('c:emergency'); WH.store.del('c:today'); WH.routes.emergency.view(); } catch (e) { WH.toast(e.message); }
    },
    async emEnd() { if (!confirm('End the emergency check-in? The marks are kept.')) return; try { await WH.call('emergencyEnd', {}); WH.store.del('c:emergency'); WH.store.del('c:today'); WH.routes.emergency.view(); } catch (e) { WH.toast(e.message); } },
    async emMark(el) {
      const s = el.dataset.s, h = el.dataset.h; let needs = '';
      if (s === 'Needs help') { needs = prompt('What do they need? (medical, shelter, food, utilities…)') || ''; }
      if (!navigator.onLine) { WH.toast('No connection. Text the bishop instead.'); return; }
      try { const r = await WH.call('checkIn', { household: h, status: s, needs }); const x = E.check.list.find(y => y.household === h); Object.assign(x, { status: s, needs, by: WH.S.boot.me.name }); E.check.counts = r.counts; WH.store.set('c:emergency', E); draw(); } catch (e) { WH.toast(e.message); }
    }
  });
})();
