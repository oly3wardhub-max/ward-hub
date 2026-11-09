/* Extras: speaker and prayer ideas for a Sunday; scanning a calendar photo into the inbox. */
(function () {
  const WH = window.WH = window.WH || {}; WH.routes = WH.routes || {}; WH.act = WH.act || {}; WH.sundayExtras = WH.sundayExtras || [];
  WH.sundayExtras.push({ title: 'Speaker and prayer ideas', href: d => `#/sunday/${d}/ideas`, show: () => WH.isBish() });
  let kind = 'speak', ID = null, DATE = '';
  WH.routes.ideas = {
    tab: 'sunday',
    view([date]) {
      DATE = date || WH.nextSun();
      WH.screen('Ideas', WH.esc(WH.long(DATE)), WH.skeleton(5), { back: '#/sunday/' + DATE, backLabel: 'Sunday' });
      load();
    }
  };
  function load() {
    WH.call('ideas', { kind }).then(d => { ID = d; draw(); }).catch(e => { document.getElementById('body').innerHTML = WH.errorBox(e.message); });
  }
  function draw() {
    const { esc, fmt } = WH;
    const since = s => s ? 'Last ' + (kind === 'speak' ? 'spoke' : 'prayed') + ' ' + fmt(s, { month: 'short', year: 'numeric' }) : 'Not on record';
    document.getElementById('body').innerHTML = `<div class="seg" style="margin-bottom:12px"><button class="${kind === 'speak' ? 'on' : ''}" data-act="ideaKind" data-v="speak">Speakers</button><button class="${kind === 'pray' ? 'on' : ''}" data-act="ideaKind" data-v="pray">Prayers</button></div>
      <div class="list">${ID.ideas.map(i => `<button class="row" data-act="ideaPick" data-n="${esc(i.name)}" data-a="${esc(i.age)}"><div class="main"><div class="t">${esc(i.name)}${i.isNew ? ' <span class="chip blue">New</span>' : ''}</div><div class="s">${esc(i.age)} · ${esc(since(kind === 'speak' ? i.spoke : i.prayed))}${i.spouse ? ' · with ' + esc(i.spouse) : ''}</div></div><span class="chip blue">Add</span></button>`).join('') || '<div class="empty">No ideas right now.</div>'}</div>
      <p class="foot">Leaves out anyone asked in the last ${esc((WH.S.boot.settings || {}).skip_days || 60)} days, anyone already planned, and anyone marked "Don't ask to speak".</p>`;
  }
  Object.assign(WH.act, {
    ideaKind(el) { kind = el.dataset.v; load(); },
    async ideaPick(el) {
      await WH.loadNames();
      const sc = WH.sunCache(); const order = sc && sc.date === DATE && sc.participants.length ? Math.max(...sc.participants.map(p => +p.Order || 0)) + 1 : 2;
      WH.partForm({ Date: DATE, Person: el.dataset.n, Role: kind === 'pray' ? 'Invocation' : (el.dataset.a === 'Youth' ? 'Youth speaker' : 'Speaker'), Status: 'Idea', Order: order }, false);
    }
  });

  /* ---------- scan a calendar (in the Inbox) ---------- */
  const shrink = file => new Promise((res, rej) => {
    if (!/^image\//.test(file.type)) { const r = new FileReader(); r.onload = () => res({ data: String(r.result).split(',')[1], mime: file.type || 'application/pdf' }); r.onerror = rej; r.readAsDataURL(file); return; }
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => { const max = 1800, k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); res({ data: c.toDataURL('image/jpeg', 0.85).split(',')[1], mime: 'image/jpeg' }); };
    img.onerror = rej; img.src = url;
  });
  const ORGS = ['Ward', 'Relief Society', 'Elders Quorum', 'Young Women', 'Young Men', 'Youth', 'Primary', 'Sunday School', 'Activities', 'Stake'];
  WH.act.scanOpen = () => {
    const me = WH.S.boot.me, orgs = WH.isBish() ? ORGS : (me.orgs || []);
    WH.openSheet(`<header><button class="link" data-act="close">Cancel</button><h2>Scan a calendar</h2><span style="min-width:64px"></span></header>
      <div class="list"><div class="field"><label>Whose</label><select id="scorg">${orgs.map(o => `<option>${WH.esc(o)}</option>`).join('')}</select></div></div>
      <p class="foot">Take a photo of a printed calendar or choose a PDF. The dates wait in the inbox until they're approved.</p>
      <label class="btn" style="margin-top:12px">Take or choose a photo<input id="scfile" type="file" accept="image/*,application/pdf" hidden></label><div id="scmsg" class="foot" style="text-align:center"></div>`);
    document.getElementById('scfile').onchange = async e => {
      const f = e.target.files[0]; if (!f) return; const msg = document.getElementById('scmsg'); msg.innerHTML = '<span class="spin"></span> Reading…';
      try { const s = await shrink(f); const r = await WH.call('scan', { data: s.data, mime: s.mime, org: document.getElementById('scorg').value }); WH.closeSheet(); WH.toast(r.events.length + ' dates found', true); if (WH.routes.inbox) WH.routes.inbox.view(); }
      catch (x) { msg.textContent = x.message; }
    };
  };
})();
