/* Your calendar and lists: each leader links a Google Calendar, Sheet or Doc, pastes a list, or scans a page. Kevin sees every organization's here. */
(function () {
  const WH = window.WH = window.WH || {}; WH.routes = WH.routes || {}; WH.act = WH.act || {}; WH.more = WH.more || [];
  WH.more.push({ title: 'Calendar and lists', sub: 'Link, paste or scan what your organization keeps', href: '#/x/connect', icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 11.5a3.5 3.5 0 0 0 5 0l2.5-2.5a3.5 3.5 0 0 0-5-5l-1 1"/><path d="M11.5 8.5a3.5 3.5 0 0 0-5 0L4 11a3.5 3.5 0 0 0 5 5l1-1"/></svg>', color: '#007AFF', order: 13, show: () => WH.isBish() || WH.can('leader'), group: 'Leaders' });
  let D = null, P = null;
  const WHAT = [['Events', 'Calendar dates'], ['Teaching', 'Lesson schedule'], ['People', 'Phone list']];
  const whatName = g => (WHAT.find(w => w[0] === g) || WHAT[0])[1];
  const err = e => { document.getElementById('body').innerHTML = WH.errorBox(e.message); };
  WH.routes.connect = {
    view() {
      WH.screen('Calendar and lists', 'Bring in what your organization already keeps', WH.skeleton(4), { back: '#/more', backLabel: 'More' });
      WH.call('mySources', {}).then(d => { D = d; draw(); }).catch(err);
    }
  };
  function draw() {
    const { esc, fmt } = WH, d = D;
    const card = (t, s, act, label) => `<div class="row wrap"><div class="main"><div class="t" style="font-weight:600">${t}</div><div class="s" style="color:var(--text);font-size:15px;line-height:1.4;margin-top:3px">${s}</div>${act ? `<div class="btns" style="margin-top:10px"><button class="btn small" data-act="${act}">${label}</button></div>` : ''}</div></div>`;
    let h = `<div class="section-h"><span>Pick the way your organization already works</span></div><div class="list">
      ${card('We just use the app', 'Add activities in Calendar › Add (set Repeat for weekly ones; open one and tap "Not happening" to skip a week). Classes and teachers are in People › Organizations. Nothing to connect.', '', '')}
      ${card('We keep a Google Calendar, Sheet or Doc', 'Link it once. The Hub reads it every night (Docs weekly), so keep using it the way you do now. Share it with <b>' + esc(d.account) + '</b> first.', 'cnLink', 'Link it')}
      ${card('We have a list in a spreadsheet, email or Word file', 'Copy the rows (with their heading row) and paste them. Dates go straight onto your calendar.', 'cnPaste', 'Paste a list')}
      ${card('We have it on paper or in a PDF', d.gemini ? 'Take a photo or choose the PDF. Gemini reads the dates and you check them before they\'re added.' : 'Kevin needs to add the free Gemini key first (Settings). Until then, give him the page and he\'ll add it.', d.gemini ? 'cnScan' : '', 'Scan it')}</div>`;
    h += `<div class="section-h"><span>Connected</span></div><div class="list">${d.sources.length ? d.sources.map(s => `<div class="row wrap"><div class="main"><div class="t">${esc(s.org)} · ${esc(s.kind)}</div><div class="s">${esc(whatName(s.goesTo))} · ${s.lastRead ? 'read ' + esc(fmt(String(s.lastRead).slice(0, 10))) : 'not read yet'}${s.result ? ' · ' + esc(s.result) : ''}</div>
        <div class="btns" style="margin-top:8px"><button class="btn small gray" data-act="cnRead" data-id="${esc(s.id)}">Read now</button>${d.admin ? `<button class="btn small gray" data-act="cnAuto" data-id="${esc(s.id)}" data-on="${s.auto ? 0 : 1}">${s.auto ? 'Auto-approve: on' : 'Auto-approve: off'}</button>` : ''}<button class="btn small gray" data-act="cnDel" data-id="${esc(s.id)}" style="color:var(--red)">Remove</button></div></div></div>`).join('') : '<div class="empty">Nothing linked yet.</div>'}</div>
      <p class="foot">${d.admin ? 'New dates from linked calendars wait in your inbox until you approve them, unless Auto-approve is on. Phone numbers always wait for you, and only fill in blanks.' : 'Kevin checks what comes in from a link before it shows on the calendar. Questions? Ask him.'}</p>`;
    document.getElementById('body').innerHTML = h;
  }
  const orgSel = () => `<div class="field"><label>Whose</label><select id="cnorg">${D.orgs.map(o => `<option>${WH.esc(o)}</option>`).join('')}</select></div>`;
  const whatSel = (only) => `<div class="field"><label>What it holds</label><select id="cnwhat">${WHAT.filter(w => !only || only.indexOf(w[0]) >= 0).map(w => `<option value="${w[0]}">${w[1]}</option>`).join('')}</select></div>`;
  const shrink = file => new Promise((res, rej) => {
    if (!/^image\//.test(file.type)) { const r = new FileReader(); r.onload = () => res({ data: String(r.result).split(',')[1], mime: file.type || 'application/pdf' }); r.onerror = rej; r.readAsDataURL(file); return; }
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => { const k = Math.min(1, 1800 / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); res({ data: c.toDataURL('image/jpeg', 0.85).split(',')[1], mime: 'image/jpeg' }); };
    img.onerror = rej; img.src = url;
  });
  /* the read-back: every row checked, uncheck what shouldn't go in */
  function preview(org, r) {
    const { esc, fmt } = WH, rows = r.events || r.lessons || r.people || [];
    P = { org, r, keep: rows.map(() => true) };
    const line = x => r.events ? `<div class="t">${esc(x.title)}</div><div class="s">${esc(fmt(x.date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }))}${x.start ? ' · ' + esc(x.start) + (x.endTime ? '–' + esc(x.endTime) : '') : ''}${x.place ? ' · ' + esc(x.place) : ''}</div>`
      : r.lessons ? `<div class="t">${esc(x.lesson || '—')}</div><div class="s">${esc(fmt(x.date, { month: 'short', day: 'numeric', year: 'numeric' }))}${x.cls ? ' · ' + esc(x.cls) : ''}${x.teacher ? ' · ' + esc(x.teacher) : ''}</div>`
      : `<div class="t">${esc(x.name)}</div><div class="s">${esc(Object.entries(x.set).map(([k, v]) => k + ' ' + v).join(' · '))}</div>`;
    WH.openSheet(`<header><button class="link" data-act="close">Cancel</button><h2>${rows.length} found</h2><button class="link r" id="cnadd">Add</button></header>
      <p class="foot" style="margin-top:0">${esc(r.summary || '')}${r.how === 'gemini' ? ' · read by Gemini, so check the dates' : ''}. Tap any you don't want.</p>
      <div class="list">${rows.map((x, i) => `<button class="row" data-act="cnKeep" data-i="${i}"><span class="check on"></span><div class="main">${line(x)}</div></button>`).join('') || '<div class="empty">Nothing found. Check that the heading row was copied too.</div>'}</div>
      ${r.people ? '<p class="foot">Phone numbers go to Kevin to approve, and only fill in people the ward list has no number for.</p>' : ''}`);
    document.getElementById('cnadd').onclick = async () => {
      const pick = rows.filter((x, i) => P.keep[i]); if (!pick.length) { WH.toast('Nothing picked'); return; }
      const key = r.events ? 'events' : r.lessons ? 'lessons' : 'people';
      try { const s = await WH.call('readInSave', { org, [key]: pick }); WH.closeSheet(); WH.store.del('c:calendar'); WH.toast(s.held ? s.held + ' sent to Kevin to approve' : s.added + ' added', true); } catch (e) { WH.toast(e.message); }
    };
  }
  Object.assign(WH.act, {
    cnKeep(el) { const i = +el.dataset.i; P.keep[i] = !P.keep[i]; el.querySelector('.check').classList.toggle('on', P.keep[i]); },
    cnLink() {
      const { esc } = WH;
      WH.openSheet(`<header><button class="link" data-act="close">Cancel</button><h2>Link it</h2><button class="link r" id="cngo">Add</button></header>
        <div class="list">${orgSel()}${whatSel()}<div class="field col"><label>Link</label><input id="cnlink" placeholder="Paste the link here" autocomplete="off"></div></div>
        <div class="section-h"><span>Where to find the link</span></div><div class="list">
        <div class="row wrap"><div class="main"><div class="t" style="font-weight:600">Google Calendar</div><div class="s">On a computer: calendar.google.com › the ⋮ next to your calendar › Settings and sharing › scroll to <b>Secret address in iCal format</b> › copy. (That address shows your calendar only to people who have it.)</div></div></div>
        <div class="row wrap"><div class="main"><div class="t" style="font-weight:600">Google Sheet or Doc</div><div class="s">Tap <b>Share</b>, add <b>${esc(D.account)}</b> as a Viewer, then <b>Copy link</b>. Sheets need a heading row: Date and Event (calendar), Date and Lesson (lessons), or Name and Phone (phone list).</div></div></div>
        <div class="row wrap"><div class="main"><div class="t" style="font-weight:600">Outlook or another calendar</div><div class="s">Look for "Publish" or "Subscribe" and copy the link that ends in .ics.</div></div></div></div>`);
      document.getElementById('cngo').onclick = async () => {
        const b = document.getElementById('cngo'); b.innerHTML = '<span class="spin"></span>';
        try { const r = await WH.call('sourceAdd', { org: document.getElementById('cnorg').value, goesTo: document.getElementById('cnwhat').value, link: document.getElementById('cnlink').value }); WH.closeSheet(); WH.toast(r.kind + ' linked · ' + r.result, true); WH.routes.connect.view(); }
        catch (e) { b.textContent = 'Add'; WH.toast(e.message); }
      };
    },
    cnPaste() {
      WH.openSheet(`<header><button class="link" data-act="close">Cancel</button><h2>Paste a list</h2><button class="link r" id="cngo">Read</button></header>
        <div class="list">${orgSel()}${whatSel()}<div class="field col"><textarea id="cntext" style="min-height:180px;font-size:14px" placeholder="Copy the rows from your spreadsheet, including the heading row (Date, Event, Time, Place), and paste here."></textarea></div></div>
        <p class="foot">${D.gemini ? 'A list from an email or a Word file works too; Gemini reads it (dates and lessons only).' : 'Rows copied from Google Sheets or Excel work best.'}</p>`);
      document.getElementById('cngo').onclick = async () => {
        const b = document.getElementById('cngo'), org = document.getElementById('cnorg').value; b.innerHTML = '<span class="spin"></span>';
        try { const r = await WH.call('readIn', { org, goesTo: document.getElementById('cnwhat').value, text: document.getElementById('cntext').value }); preview(org, r); }
        catch (e) { b.textContent = 'Read'; WH.toast(e.message); }
      };
    },
    cnScan() {
      WH.openSheet(`<header><button class="link" data-act="close">Cancel</button><h2>Scan it</h2><span style="min-width:64px"></span></header>
        <div class="list">${orgSel()}${whatSel(['Events', 'Teaching'])}</div>
        <p class="foot">A photo of a printed calendar or lesson schedule, or a PDF. Phone lists can't be scanned, to keep them private.</p>
        <label class="btn" style="margin-top:12px">Take or choose a photo or PDF<input id="cnfile" type="file" accept="image/*,application/pdf" hidden></label><div id="cnmsg" class="foot" style="text-align:center"></div>`);
      document.getElementById('cnfile').onchange = async e => {
        const f = e.target.files[0]; if (!f) return; const msg = document.getElementById('cnmsg'), org = document.getElementById('cnorg').value, what = document.getElementById('cnwhat').value; msg.innerHTML = '<span class="spin"></span> Reading…';
        try { const s = await shrink(f); const r = await WH.call('readIn', { org, goesTo: what, data: s.data, mime: s.mime }); preview(org, r); } catch (x) { msg.textContent = x.message; }
      };
    },
    async cnRead(el) { el.innerHTML = '<span class="spin"></span>'; try { const r = await WH.call('sourceReadNow', { id: el.dataset.id }); WH.toast(r.result, true); WH.routes.connect.view(); } catch (e) { WH.toast(e.message); el.textContent = 'Read now'; } },
    async cnAuto(el) { try { await WH.call('sourceAuto', { id: el.dataset.id, on: el.dataset.on === '1' }); WH.routes.connect.view(); } catch (e) { WH.toast(e.message); } },
    async cnDel(el) { if (!confirm('Stop reading this? Dates already on the calendar stay.')) return; try { await WH.call('sourceRemove', { id: el.dataset.id }); WH.routes.connect.view(); } catch (e) { WH.toast(e.message); } }
  });
})();
