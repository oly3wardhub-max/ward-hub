/* From v1: plan music and prayers months ahead on one screen; leaders recommend calling changes; print a calendar (youth quarter); funeral conducting sheet. */
(function () {
  const WH = window.WH = window.WH || {}; WH.routes = WH.routes || {}; WH.act = WH.act || {}; WH.more = WH.more || []; WH.sundayExtras = WH.sundayExtras || []; WH.ready = WH.ready || [];
  const ic = p => `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  WH.sundayExtras.push({ title: 'Plan ahead: music and prayers', href: () => '#/x/ahead', show: () => WH.isBish() || WH.can('music') });
  WH.more.push({ title: 'Plan ahead', sub: 'Hymns 6 months out, prayers 3 months out', href: '#/x/ahead', icon: ic('<path d="M7 15V5l9-2v10"/><circle cx="5" cy="15" r="2"/><circle cx="14" cy="13" r="2"/>'), color: '#AF52DE', order: 9, show: () => WH.isBish() || WH.can('music'), group: 'Leaders' });
  WH.more.push({ title: 'Print a calendar', sub: 'A quarter for your organization, or the whole ward', href: '#/x/calprint', icon: ic('<path d="M5 8V3h10v5M5 14H3V8h14v6h-2M6 12h8v5H6z"/>'), color: '#8E8E93', order: 17, show: () => WH.isBish() || WH.can('leader'), group: 'Leaders' });
  const pad = n => String(n).padStart(2, '0'), add = (s, n) => { const d = WH.pd(s); d.setDate(d.getDate() + n); return WH.ymd(d); };

  /* ---------- plan ahead ---------- */
  let A = null, seg = 'music';
  WH.routes.ahead = {
    view() {
      WH.screen('Plan ahead', '', WH.skeleton(6), { back: '#/more', backLabel: 'More' });
      const tabs = ['Sundays', 'Hymns'].concat(WH.isBish() ? ['Participants'] : []);
      WH.call('list', { tabs }).then(d => { A = d.data; drawA(); }).catch(e => { document.getElementById('body').innerHTML = WH.errorBox(e.message); });
    }
  };
  function drawA() {
    const { esc, fmt } = WH, first = WH.nextSun(), weeks = seg === 'music' ? 26 : 13, hy = {}; (A.Hymns || []).forEach(h => hy[h.Number] = h.Title);
    let h = WH.isBish() ? `<div class="seg"><button class="${seg === 'music' ? 'on' : ''}" data-act="ahSeg" data-v="music">Music · 6 months</button><button class="${seg === 'prayers' ? 'on' : ''}" data-act="ahSeg" data-v="prayers">Prayers · 3 months</button></div>` : '';
    h += `<datalist id="dl-hymn">${Object.keys(hy).map(n => `<option value="${esc(n)}">${esc(hy[n])}</option>`).join('')}</datalist>`;
    for (let i = 0; i < weeks; i++) {
      const d = add(first, 7 * i), S = (A.Sundays || []).find(s => s.Date === d) || {};
      h += `<div class="section-h"><span>${esc(fmt(d, { month: 'short', day: 'numeric' }))}${S.Type && S.Type !== 'Regular' ? ' · ' + esc(S.Type) : ''}</span></div><div class="list">`;
      if (seg === 'music') {
        h += ['Opening hymn', 'Sacrament hymn', 'Intermediate hymn', 'Closing hymn'].map(k => `<div class="field"><label>${k.replace(' hymn', '')}</label><input inputmode="numeric" list="dl-hymn" data-d="${d}" data-k="${k}" class="ahin" value="${esc(S[k] || '')}" placeholder="#"><span class="s" style="min-width:42%;text-align:right;color:var(--sub);font-size:13px" data-t="${d}|${k}">${esc(hy[S[k]] || '')}</span></div>`).join('')
          + ['Organist', 'Chorister'].map(k => `<div class="field"><label>${k}</label><input data-d="${d}" data-k="${k}" class="ahin" value="${esc(S[k] || '')}" list="dl-people"></div>`).join('');
      } else {
        const P = (A.Participants || []).filter(p => p.Date === d);
        h += ['Invocation', 'Benediction'].map(role => { const p = P.find(x => x.Role === role) || {}; return `<div class="field"><label>${role === 'Invocation' ? 'Opening prayer' : 'Closing prayer'}</label><input data-d="${d}" data-role="${role}" data-id="${esc(p.ID || '')}" class="ahpr" value="${esc(p.Person || '')}" list="dl-people" placeholder="Name"></div>`; }).join('');
      }
      h += '</div>';
    }
    h += `<p class="foot">Changes save as you go.${seg === 'music' ? ' Type a hymn number; the title appears beside it.' : ' Each prayer starts as "Asked"; invite them from the Sunday screen.'}</p>`;
    document.getElementById('body').innerHTML = h;
    WH.loadNames().then(() => { if (!document.getElementById('dl-people')) document.body.insertAdjacentHTML('beforeend', `<datalist id="dl-people">${(WH.DATALISTS.people || []).map(n => `<option value="${esc(n)}">`).join('')}</datalist>`); });
    document.querySelectorAll('.ahin').forEach(inp => inp.addEventListener('change', async () => {
      const row = { Date: inp.dataset.d }; row[inp.dataset.k] = inp.value.trim();
      const t = document.querySelector(`[data-t="${inp.dataset.d}|${inp.dataset.k}"]`); if (t) t.textContent = hy[inp.value.trim()] || (inp.value.trim() ? 'Not found' : '');
      try { await WH.call('save', { tab: 'Sundays', row }); let S = A.Sundays.find(s => s.Date === row.Date); if (!S) A.Sundays.push(S = { Date: row.Date }); Object.assign(S, row); WH.store.del('c:sunday:' + row.Date); WH.toast('Saved', true); } catch (e) { WH.toast(e.message); }
    }));
    document.querySelectorAll('.ahpr').forEach(inp => inp.addEventListener('change', async () => {
      const v = inp.value.trim(), id = inp.dataset.id;
      try {
        if (!v && id) { await WH.call('remove', { tab: 'Participants', id }); inp.dataset.id = ''; }
        else if (v) { const r = await WH.call('save', { tab: 'Participants', row: Object.assign(id ? { ID: id } : { Date: inp.dataset.d, Role: inp.dataset.role, Order: inp.dataset.role === 'Invocation' ? 1 : 99, Status: 'Asked' }, { Person: v }) }); if (r.id) inp.dataset.id = r.id; }
        WH.store.del('c:sunday:' + inp.dataset.d); WH.toast('Saved', true);
      } catch (e) { WH.toast(e.message); }
    }));
  }
  WH.act.ahSeg = el => { seg = el.dataset.v; drawA(); };

  /* ---------- recommend a calling change (from an organization's page) ---------- */
  WH.act.recNew = async el => {
    await WH.loadNames();
    WH.form('Recommend a change', [{ name: 'change', label: 'Change', type: 'select', options: ['Call', 'Release'] }, { name: 'person', label: 'Person', list: 'people' }, { name: 'calling', label: 'Calling', ph: 'e.g. Primary teacher (Sunbeams)' }, { name: 'why', label: 'Why (for the bishopric)', type: 'textarea' }],
      { change: 'Call' }, async row => { await WH.call('recommendCalling', Object.assign({ org: el.dataset.org }, row)); WH.toast('Sent to the bishopric', true); });
  };
  WH.ready.push(() => {
    const o = WH.routes.org && WH.routes.org.view; if (!o) return;
    WH.routes.org.view = function (args) {
      o.apply(this, arguments);
      const org = decodeURIComponent((args || [])[0] || '');
      const t = setInterval(() => { const b = document.getElementById('body'); if (!b || b.querySelector('.skeleton')) return; clearInterval(t);
        if (!WH.isBish() && (WH.S.boot.me.orgs || []).indexOf(org) < 0) return;
        b.insertAdjacentHTML('beforeend', `<div class="btns"><button class="btn gray" data-act="recNew" data-org="${WH.esc(org)}">Recommend a calling change</button></div><p class="foot">It goes to the bishopric as a proposed change, and onto the next bishopric meeting agenda.</p>`); }, 150);
      setTimeout(() => clearInterval(t), 8000);
    };
  });

  /* ---------- print a calendar ---------- */
  let CP = { from: '', months: 3, orgs: [] };
  WH.routes.calprint = {
    view() {
      const { esc } = WH, t = WH.today(), q = Math.floor(t.getMonth() / 3) * 3 + 3, start = new Date(t.getFullYear() + (q > 11 ? 1 : 0), q % 12, 1);
      if (!CP.from) CP.from = WH.ymd(start).slice(0, 7);
      const all = ['Ward', 'Youth', 'Young Women', 'Young Men', 'Primary', 'Relief Society', 'Elders Quorum', 'Sunday School', 'Activities', 'Stake'];
      if (!CP.orgs.length) CP.orgs = WH.isBish() ? ['Ward', 'Stake'] : (WH.S.boot.me.orgs || []).concat((WH.S.boot.me.orgs || []).some(o => /Young/.test(o)) ? ['Youth'] : []);
      WH.screen('Print a calendar', '', `<div class="list"><div class="field"><label>Starting</label><input type="month" id="cpfrom" value="${esc(CP.from)}"></div><div class="field"><label>Months</label><select id="cpm">${[1, 2, 3, 4, 6, 12].map(n => `<option ${n === CP.months ? 'selected' : ''}>${n}</option>`).join('')}</select></div></div>
        <div class="section-h"><span>Organizations</span></div><div class="list">${all.map(o => `<label class="row"><div class="main"><div class="t">${esc(o)}</div></div><input type="checkbox" class="cpo" value="${esc(o)}" ${CP.orgs.indexOf(o) >= 0 ? 'checked' : ''}></label>`).join('')}</div>
        <div class="btns"><button class="btn" data-act="cpGo">Print</button></div><p class="foot">For a youth quarter: Youth, Young Women and Young Men, 3 months.</p>`, { back: '#/more', backLabel: 'More' });
    }
  };
  WH.act.cpGo = async el => {
    CP.from = document.getElementById('cpfrom').value; CP.months = +document.getElementById('cpm').value; CP.orgs = [...document.querySelectorAll('.cpo:checked')].map(x => x.value);
    const from = CP.from + '-01', endD = WH.pd(from); endD.setMonth(endD.getMonth() + CP.months); endD.setDate(0); const to = WH.ymd(endD);
    el.innerHTML = '<span class="spin"></span>';
    try {
      const d = await WH.call('calendar', { from, to }); const ev = (d.events || []).filter(e => !e.meeting && CP.orgs.indexOf(e.org) >= 0);
      const { esc, fmt } = WH, ward = (WH.S.boot.settings || {}).ward_name || '';
      let h = `<div style="font:11pt/1.4 -apple-system,Arial,sans-serif;color:#000"><div style="font-size:18pt;font-weight:700">${esc(ward)} · ${esc(CP.orgs.join(', '))}</div><div style="color:#555;margin-bottom:10px">${esc(fmt(from, { month: 'long', year: 'numeric' }))} – ${esc(fmt(to, { month: 'long', year: 'numeric' }))}</div>`, mo = '';
      ev.forEach(e => { const m = fmt(e.date, { month: 'long', year: 'numeric' }); if (m !== mo) { h += `<div style="font-size:13pt;font-weight:700;margin:14px 0 4px;border-bottom:1px solid #999">${esc(m)}</div>`; mo = m; }
        h += `<div style="display:flex;gap:10px;padding:3px 0;break-inside:avoid"><div style="width:70px;flex:none;font-weight:600">${esc(fmt(e.date, { weekday: 'short', day: 'numeric' }))}</div><div style="width:80px;flex:none;color:#444">${esc(e.time || '')}</div><div>${esc(e.title)}${e.place ? ' <span style="color:#555">· ' + esc(e.place) + '</span>' : ''}${CP.orgs.length > 1 ? ' <span style="color:#777">· ' + esc(e.org) + '</span>' : ''}</div></div>`; });
      if (!ev.length) h += '<p>Nothing on the calendar for these months yet.</p>';
      h += '</div>';
      let root = document.getElementById('print-root'); if (!root) { root = document.createElement('div'); root.id = 'print-root'; document.body.appendChild(root); }
      root.innerHTML = '<style>@media screen{#print-root{display:none}}@media print{@page{size:letter;margin:.6in}body.printing-program>*:not(#print-root){display:none!important}body.printing-program #print-root{display:block}}</style>' + h;
      document.body.classList.add('printing-program'); setTimeout(() => { window.print(); setTimeout(() => document.body.classList.remove('printing-program'), 1000); }, 60);
    } catch (e) { WH.toast(e.message); }
    el.textContent = 'Print';
  };
})();
