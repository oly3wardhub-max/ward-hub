/* All lists: a simple viewer and editor for any tab you're allowed to use (missionaries, recommends, quotes, sources, dinner groups…). */
(function () {
  const WH = window.WH = window.WH || {}; WH.routes = WH.routes || {}; WH.act = WH.act || {}; WH.more = WH.more || [];
  WH.more.push({ title: 'All lists', sub: 'Missionaries, recommends, quotes, sources and more', href: '#/x/lists', icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M7 5h10M7 10h10M7 15h10"/><circle cx="3.5" cy="5" r="1"/><circle cx="3.5" cy="10" r="1"/><circle cx="3.5" cy="15" r="1"/></svg>', color: '#636366', order: 70, show: () => WH.isBish() || WH.can('clerk'), group: 'Administrator' });
  const SKIP = { Settings: 1, Access: 1, Log: 1, Inbox: 1 };
  let T = null, rows = null, q = '';
  WH.routes.lists = {
    view(args) {
      const tabs = (WH.S.boot.tabs || []).filter(t => !SKIP[t.name]);
      if (args && args[0]) return listView(decodeURIComponent(args[0]));
      const by = {}; tabs.forEach(t => (by[t.section] = by[t.section] || []).push(t));
      WH.screen('All lists', 'Every list in the ward spreadsheet you can use', Object.keys(by).map(s => `<div class="section-h"><span>${WH.esc(s)}</span></div><div class="list">${by[s].map(t => `<button class="row" data-go="#/x/lists/${encodeURIComponent(t.name)}"><div class="main"><div class="t">${WH.esc(t.name)}</div><div class="s">${WH.esc(t.note || '')}</div></div>${t.edit ? '' : '<span class="chip">View</span>'}${WH.I.chev}</button>`).join('')}</div>`).join(''), { back: '#/more', backLabel: 'More' });
    }
  };
  function listView(name) {
    T = (WH.S.boot.tabs || []).find(t => t.name === name); if (!T) return;
    q = '';
    WH.screen(name, WH.esc(T.note || ''), WH.skeleton(5), { back: '#/x/lists', backLabel: 'All lists', right: T.edit ? '<span class="lsadd"></span>' : '' });
    WH.call('list', { tabs: [name] }).then(d => { rows = d.data[name] || []; draw(); }).catch(e => { document.getElementById('body').innerHTML = WH.errorBox(e.message); });
  }
  const title = r => { const c = T.cols.map(x => x[0]); const k = ['Name', 'Person', 'Title', 'Text', 'Task', 'Item', 'Organization', 'Group'].find(x => c.indexOf(x) >= 0 && r[x]); return r[k] || r[c[1]] || r[c[0]]; };
  const sub = r => T.cols.slice(1, 6).map(c => c[0]).filter(c => r[c] !== '' && r[c] !== false && r[c] != null && r[c] !== title(r)).slice(0, 3).map(c => (c === 'Date' || /date|Expires|Left|Home/.test(c)) && /^\d{4}-/.test(r[c]) ? WH.fmt(r[c]) : (r[c] === true ? c : r[c])).join(' · ');
  function draw() {
    const { esc, I } = WH;
    document.querySelectorAll('.lsadd').forEach(x => x.innerHTML = `<button class="btn small" data-act="lsNew">${I.plus} Add</button>`);
    const f = rows.filter(r => !q || JSON.stringify(r).toLowerCase().includes(q));
    document.getElementById('body').innerHTML = `<div class="search">${I.search}<input id="lsq" type="search" placeholder="Search" value="${esc(q)}"></div>
      ${f.length ? `<div class="list">${f.slice(0, 200).map((r, i) => `<button class="row" data-act="lsOpen" data-i="${rows.indexOf(r)}"><div class="main"><div class="t">${esc(String(title(r)).slice(0, 90))}</div><div class="s">${esc(String(sub(r)).slice(0, 120))}</div></div>${I.chev}</button>`).join('')}</div>` : '<div class="list"><div class="empty">Nothing here yet.</div></div>'}
      <p class="foot">${f.length} of ${rows.length}${f.length > 200 ? ' · showing 200; search to narrow' : ''}</p>`;
    const qi = document.getElementById('lsq'); qi.addEventListener('input', () => { q = qi.value.trim().toLowerCase(); const pos = qi.selectionStart; draw(); const n = document.getElementById('lsq'); n.focus(); n.setSelectionRange(pos, pos); });
  }
  const fields = () => T.cols.filter((c, i) => !(i === 0 && c[1] === 'id') && c[1] !== 'secret').map((c, i) => {
    const t = c[1], f = { name: c[0], ph: (T.help || [])[T.cols.indexOf(c)] || '' };
    if (t.startsWith('choice:')) { f.type = 'select'; f.options = t.slice(7).split(',').filter(Boolean); }
    else if (t === 'bool') f.type = 'toggle';
    else if (t === 'date' || t === 'dateid') f.type = 'date';
    else if (t === 'number') f.type = 'number';
    else if (t === 'person') f.list = 'people';
    else if (t === 'text' && /Notes|Text|Summary|Purpose|Lesson|Task|Item/.test(c[0])) f.type = 'textarea';
    return f;
  });
  Object.assign(WH.act, {
    async lsNew() { await WH.loadNames(); WH.form('New', fields(), {}, async row => { await WH.call('save', { tab: T.name, row }); listView(T.name); }); },
    async lsOpen(el) {
      const r = rows[+el.dataset.i]; await WH.loadNames();
      if (!T.edit) { WH.openSheet(`<header><span style="min-width:64px"></span><h2>${WH.esc(String(title(r)).slice(0, 40))}</h2><button class="link r" data-act="close">Done</button></header><div class="list">${T.cols.map(c => WH.kv(c[0], r[c[0]] === true ? 'Yes' : r[c[0]] === false ? '' : r[c[0]])).join('')}</div>`); return; }
      const idc = T.cols[0][0];
      WH.form(String(title(r)).slice(0, 40), fields(), r, async row => { row[idc] = r[idc]; await WH.call('save', { tab: T.name, row }); listView(T.name); },
        T.cols[0][1] === 'id' || T.cols[0][1] === 'dateid' ? async () => { await WH.call('remove', { tab: T.name, id: r[idc] }); listView(T.name); } : null);
    }
  });
})();
