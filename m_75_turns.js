/* Turns: rotating family assignments (building cleaning, flags, …), with a text to this week's families. */
(function () {
  const WH = window.WH = window.WH || {}; WH.routes = WH.routes || {}; WH.act = WH.act || {}; WH.more = WH.more || [];
  WH.more.push({ title: 'Turns', sub: 'Building cleaning and other rotations', href: '#/x/turns', icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15.5 7A6 6 0 0 0 4.6 6M4.5 13a6 6 0 0 0 10.9 1M15.5 3v4h-4M4.5 17v-4h4"/></svg>', color: '#AF52DE', order: 26, show: () => WH.isBish(), group: 'Leaders' });
  let D = null;
  WH.routes.turns = {
    view() {
      WH.screen('Turns', 'Rotations that move through families week by week', WH.skeleton(4), { back: '#/more', backLabel: 'More', right: '<span class="tnadd"></span>' });
      WH.call('turns', {}).then(d => { D = d; draw(); }).catch(e => { document.getElementById('body').innerHTML = WH.errorBox(e.message); });
    }
  };
  function draw() {
    const { esc, I, fmt } = WH;
    document.querySelectorAll('.tnadd').forEach(x => x.innerHTML = `<button class="btn small" data-act="tnNew">${I.plus} Add</button>`);
    let h = '';
    if (!D.turns.length) h = '<div class="list"><div class="empty">No rotations yet.</div></div>';
    D.turns.forEach((t, i) => {
      const fam = L => L.map(x => esc(String(x.name).replace(/^([^,]+),\s*(.+)$/, '$2 $1'))).join(', ');
      h += `<div class="section-h big"><span>${esc(t.name)}</span><button class="link" style="font-size:15px" data-act="tnEdit" data-i="${i}">Edit</button></div>
        <div class="list"><div class="row wrap"><div class="main"><div class="t">${t.active ? 'This week' : 'Not this month'}</div><div class="s" style="color:var(--text)">${t.active ? fam(t.now) : (t.months ? 'Our months: ' + esc(t.months) : '')}</div></div></div>
        ${t.first && t.first.length ? `<div class="row wrap"><div class="main"><div class="t">Starts ${esc(fmt(t.start, { month: 'short', day: 'numeric' }))}</div><div class="s">${fam(t.first)}</div></div></div>` : `<div class="row wrap"><div class="main"><div class="t">Next week</div><div class="s">${fam(t.next) || '—'}</div></div></div>`}</div>`;
      const nums = t.now.flatMap(x => x.contacts.map(c => c.p)).filter(Boolean);
      if (t.active && nums.length && WH.smsHref) h += `<div class="btns"><a class="btn" style="text-decoration:none" href="${esc(WH.smsHref(nums, t.msg || ''))}">${WH.I.msg.replace('<svg', '<svg width="18" height="18"')} Text this week's families (${nums.length})</a></div>`;
      h += `<p class="foot">${t.count} on the list · ${t.per} each ${t.every > 1 ? t.every + ' weeks' : 'week'}${t.day ? ' · ' + esc(t.day) : ''}. People marked "Skip" in the list are left out.</p>`;
    });
    document.getElementById('body').innerHTML = h;
  }
  const fields = () => [{ name: 'name', label: 'Name' }, { name: 'group', label: 'List', type: 'select', options: [...new Set(D.groups.map(g => g.group))] }, { name: 'per', label: 'Families each time', type: 'number' }, { name: 'every', label: 'Every (weeks)', type: 'number' }, { name: 'start', label: 'Starts', type: 'date' }, { name: 'months', label: 'Months', ph: 'blank = all year' }, { name: 'day', label: 'Day and time', ph: 'Saturday 9:00 am' }, { name: 'offset', label: 'Start at number', type: 'number' }, { name: 'msg', label: 'Text', type: 'textarea' }];
  Object.assign(WH.act, {
    tnNew() { WH.form('New rotation', fields(), { per: 2, every: 1, start: WH.nextSun(), group: (D.groups[0] || {}).group }, async row => { row.kind = (D.groups.find(g => g.group === row.group) || {}).kind || 'Other'; await WH.call('saveTurn', { turn: row }); WH.routes.turns.view(); }); },
    tnEdit(el) {
      const t = D.turns[+el.dataset.i];
      WH.form(t.name, fields(), t, async row => { row.id = t.id; row.kind = (D.groups.find(g => g.group === row.group) || {}).kind || t.kind; await WH.call('saveTurn', { turn: row }); WH.routes.turns.view(); },
        async () => { await WH.call('saveTurn', { turn: { id: t.id }, remove: true }); WH.routes.turns.view(); });
    }
  });
})();
