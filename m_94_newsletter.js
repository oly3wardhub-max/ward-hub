/* Newsletter: an easy block editor for the Relief Society, elders quorum and ward newsletters.
   1 Write · 2 Add pictures and events · 3 Send. The newsletter is a list of blocks shown as they will look in email.
   Paste anything (an email, a flyer, a screenshot, part of a Word or Google Doc) and it becomes blocks; pictures are
   shrunk here and saved in the ward account's Drive so they show in everyone's email. Saves as you type. */
(function () {
  const WH = window.WH = window.WH || {}; WH.routes = WH.routes || {}; WH.act = WH.act || {}; WH.more = WH.more || [];
  const ic = p => `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const leads = list => WH.isBish() || list.some(o => ((WH.S.boot && WH.S.boot.me.orgs) || []).indexOf(o) >= 0);
  WH.more.push({ title: 'Newsletter', sub: 'Paste, add pictures and events, send', href: '#/x/newsletter', icon: ic('<rect x="3" y="3.5" width="14" height="13" rx="2"/><path d="M6 7.5h8M6 10.5h8M6 13.5h5"/>'), color: '#FF2D55', order: 14, show: () => leads(['Relief Society', 'Elders Quorum']), group: 'Leaders' });

  const MAX = 8 * 1024 * 1024, EDGE = 1600, Q = 0.85, WEEKS = [2, 4, 6, 8];
  const $ = s => document.querySelector(s), $$ = s => Array.from(document.querySelectorAll(s));
  const esc = s => WH.esc(s);
  const body = () => document.getElementById('body');
  let NL = null;   // the list: organizations, issues
  let ED = null;   // the open newsletter: { id, row, blocks, att, status, locked, step, sel, dirty, view }
  let seq = 0; const nk = () => 'b' + (++seq);

  /* ---------- look ---------- */
  function css() {
    if (document.getElementById('nl-css')) return;
    const s = document.createElement('style'); s.id = 'nl-css';
    s.textContent = `
.nl-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:0 0 6px}
.nl-steps button{border:0;background:var(--card);border-radius:12px;padding:8px 6px;min-height:60px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font-size:13px;font-weight:600;color:var(--sub);cursor:pointer;line-height:1.15;text-align:center}
.nl-steps button b{width:24px;height:24px;border-radius:50%;background:var(--gray-tint);display:grid;place-items:center;font-size:14px}
.nl-steps button.on{background:var(--accent);color:#fff}.nl-steps button.on b{background:rgba(255,255,255,.25)}
.nl-saved{font-size:13px;color:var(--sub);min-height:18px;text-align:right;margin:0 4px}
.nl-saved button{border:0;background:none;color:var(--accent);font-weight:600;font-size:13px;padding:0 0 0 6px;cursor:pointer}
.field input.nl-f{text-align:left;color:var(--text)}.field input.nl-f[type=date]{text-align:right}
.nl-f{display:block;width:100%;border:0;background:none;outline:none;font-size:17px;color:var(--text);padding:4px 0;min-width:0}
.nl-f.big{font-size:20px;font-weight:600}
.nl-paste{border:2px dashed var(--accent);border-radius:14px;background:var(--accent-tint);min-height:104px;padding:14px 16px;font-size:16px;line-height:1.4;outline:none;color:var(--text);cursor:text;-webkit-user-select:text;user-select:text;overflow:hidden;max-height:260px}
.nl-paste:empty::before{content:attr(data-ph);color:var(--sub);white-space:pre-line;pointer-events:none}
.nl-paste:focus{background:var(--card);border-style:solid}
.nl-paste.busy{opacity:.6}
.nl-card{background:#fff;color:#1c1c1e;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;color-scheme:light}
.nl-card .hd{background:#1F2A44;color:#fff;padding:12px 16px}.nl-card .hd small{display:block;font-size:12px;opacity:.75}.nl-card .hd div{font-size:18px;font-weight:600;word-break:break-word}
.nl-card .bl{padding:6px 0 10px}
.nlb{padding:4px 14px 4px 13px;border-left:3px solid transparent;position:relative;cursor:pointer}
.nlb.sel{border-left-color:#1F3A93;background:#f4f6fd}
.nlb .bd{min-width:0;padding:2px 0}
.nlb .tl{display:none;gap:8px;justify-content:flex-end;padding:6px 0 4px}
.nlb.sel .tl{display:flex}
.nlb .tl button{min-width:44px;height:38px;border:0;border-radius:10px;background:#e9ecf5;color:#1F2A44;display:flex;align-items:center;justify-content:center;gap:5px;cursor:pointer;padding:0 12px;font-size:14px;font-weight:600}
.nlb .tl button.rm{color:#b00020;background:#fdecee}
.nlb .tl button svg{width:16px;height:16px}
.nlb .tl button:disabled{opacity:.3;cursor:default}
.nl-card [contenteditable]{outline:none;border-radius:6px;padding:3px 5px;margin:0 -5px;-webkit-user-select:text;user-select:text;min-height:26px}
.nl-card [contenteditable="true"]:focus{background:#eef2ff;box-shadow:0 0 0 2px #c7d3fb}
.nl-card [contenteditable]:empty::before{content:attr(data-ph);color:#8e8e93}
.nlb .h{font-size:17px;font-weight:700;color:#1F2A44;margin-top:6px}
.nlb .tx p{margin:0 0 10px}.nlb .tx p:last-child{margin-bottom:0}.nlb .tx a,.nlb .auto a{color:#1F3A93}
.nlb .auto{border:1px dashed #d1d1d6;border-radius:10px;padding:8px 10px;background:#fafafa}
.nlb .tag{font-size:12px;color:#6e6e73;font-weight:600;letter-spacing:.2px;margin-bottom:4px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;text-transform:uppercase}
.nlb .muted,.nl-muted{color:#8e8e93;font-size:14px}
.nlb .pic{position:relative;text-align:center}
.nlb .pic img{max-width:100%;height:auto;border-radius:8px;display:block;margin:0 auto;min-height:40px;background:#f2f2f7}
.nlb .pic .ov{position:absolute;inset:0;display:flex;flex-direction:column;gap:8px;align-items:center;justify-content:center;background:rgba(255,255,255,.75);border-radius:8px;font-weight:600;font-size:14px;padding:10px;text-align:center}
.nlb .pic .ov.err{background:rgba(255,240,240,.94);color:#b00020}
.nlb .cap{text-align:center;color:#6e6e73;font-size:14px;margin-top:6px}
.nl-btnprev{display:inline-block;background:#1F2A44;color:#fff!important;padding:10px 18px;border-radius:10px;font-weight:600;text-decoration:none}
.nl-mini{border:0;background:#eef2ff;color:#1F3A93;border-radius:999px;padding:8px 14px;font-weight:600;font-size:15px;cursor:pointer;min-height:38px}
.nl-sg{display:flex;background:#ececf0;border-radius:9px;padding:2px;gap:2px;margin:2px 0 6px}
.nl-sg button{flex:1;border:0;background:none;padding:7px 4px;font-size:13px;font-weight:600;border-radius:7px;cursor:pointer;color:#1c1c1e;min-height:34px}
.nl-sg button.on{background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.14)}
.nl-evday{font-weight:700;margin:12px 0 2px}
.nl-ev{display:flex;gap:10px;align-items:flex-start;padding:6px 2px;cursor:pointer;min-height:40px}
.nl-ev input{width:22px;height:22px;flex:none;margin:1px 0 0;accent-color:#1F2A44;cursor:pointer}
.nl-ev small{display:block;color:#6e6e73;font-size:14px}
.nl-ev .tm{color:#6e6e73}
.nl-ev.off .w{opacity:.45;text-decoration:line-through}
.nl-in{width:100%;border:1px solid #d1d1d6;border-radius:8px;padding:8px 10px;font-size:15px;margin-top:8px;background:#fff;color:#1c1c1e}
.nl-add{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
.nl-add button{display:flex;align-items:center;gap:10px;min-height:52px;border:0;border-radius:12px;background:var(--card);color:var(--text);font-size:16px;font-weight:600;padding:8px 12px;cursor:pointer;text-align:left}
.nl-add button .i{width:30px;height:30px;border-radius:8px;display:grid;place-items:center;color:#fff;flex:none}.nl-add button .i svg{width:18px;height:18px}
@media(min-width:600px){.nl-add{grid-template-columns:repeat(4,1fr)}}
.nl-big{display:flex;gap:14px;align-items:center;width:100%;border:0;border-radius:14px;background:var(--card);padding:14px 16px;min-height:74px;text-align:left;cursor:pointer;color:var(--text);margin-top:10px;font:inherit}
.nl-big.pri{background:var(--accent);color:#fff}.nl-big b{font-size:17px;display:block}.nl-big small{display:block;font-size:14px;opacity:.8;margin-top:2px;line-height:1.3}
.nl-big .i{width:40px;height:40px;border-radius:10px;display:grid;place-items:center;background:var(--accent-tint);color:var(--accent);flex:none}.nl-big.pri .i{background:rgba(255,255,255,.2);color:#fff}.nl-big .i svg{width:22px;height:22px}
.nl-big:disabled{opacity:.5}
.nl-phone{width:390px;max-width:100%;margin:6px auto 0;border:9px solid #1c1c1e;border-radius:34px;overflow:hidden;background:#fff}
.nl-phone iframe{display:block;width:100%;height:620px;border:0;background:#fff}
.nl-undo{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(96px + var(--bottom));z-index:85;background:rgba(30,30,30,.95);color:#fff;border-radius:999px;padding:6px 6px 6px 18px;display:flex;gap:14px;align-items:center;font-size:15px;box-shadow:0 6px 20px rgba(0,0,0,.25)}
.nl-undo button{border:0;background:#fff;color:#1c1c1e;border-radius:999px;padding:9px 16px;font-weight:700;font-size:15px;cursor:pointer}
.nl-flash{animation:nlflash 1.4s ease}@keyframes nlflash{from{background:#fff3b0}to{background:transparent}}
.nl-thumbs{display:flex;gap:8px;flex-wrap:wrap;margin:10px 2px 0}.nl-thumbs span{position:relative}.nl-thumbs img{width:76px;height:76px;object-fit:cover;border-radius:10px;display:block;background:var(--card)}
.nl-thumbs i{position:absolute;inset:0;display:grid;place-items:center;font-style:normal;font-size:12px;font-weight:700;color:#fff;background:rgba(0,0,0,.45);border-radius:10px}
.nl-note{background:var(--orange-tint);color:var(--text);border-radius:12px;padding:10px 14px;font-size:15px;margin-top:10px}
.nl-solo .nlb{padding:8px 12px}`;
    document.head.appendChild(s);
  }
  const SVG = {
    up: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 13V3M3.5 7.5L8 3l4.5 4.5"/></svg>',
    down: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v10M3.5 8.5L8 13l4.5-4.5"/></svg>',
    x: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>',
    text: ic('<path d="M4 5h12M4 9h12M4 13h8"/>'), pic: ic('<rect x="2.5" y="4" width="15" height="12" rx="2"/><circle cx="7" cy="8.2" r="1.5"/><path d="M17.5 13l-4-4-7 7"/>'),
    cal: ic('<rect x="3" y="4" width="14" height="13" rx="2"/><path d="M3 8h14M7 2.5v3M13 2.5v3"/>'), book: ic('<path d="M3 4.5c2.5-1 4.5-1 7 .5 2.5-1.5 4.5-1.5 7-.5v11c-2.5-1-4.5-1-7 .5-2.5-1.5-4.5-1.5-7-.5z"/><path d="M10 5v11"/>'),
    cake: ic('<path d="M3.5 17h13v-6h-13zM3.5 13.5c2 1 3 1 4.3 0 1.3 1 2.6 1 4 0 1.3 1 2.6 1 4.7 0M10 11V8M10 5.5v.5"/>'), hi: ic('<circle cx="10" cy="7" r="3"/><path d="M4 17c.8-3 3-4.5 6-4.5s5.2 1.5 6 4.5"/>'),
    stake: ic('<path d="M3 17h14M5 17V9l5-4 5 4v8M10 2.5v2.5"/>'), link: ic('<path d="M8.5 11.5a3 3 0 0 0 4.2 0l2.6-2.6a3 3 0 0 0-4.2-4.2L10 5.8"/><path d="M11.5 8.5a3 3 0 0 0-4.2 0L4.7 11.1a3 3 0 0 0 4.2 4.2l1.1-1.1"/>'),
    mail: ic('<rect x="2.5" y="4.5" width="15" height="11" rx="2"/><path d="M3 5.5l7 5.5 7-5.5"/>'), send: ic('<path d="M17.5 2.5L9 11M17.5 2.5l-5 15-3.5-6.5L2.5 7.5z"/>'), phone: ic('<rect x="6" y="2.5" width="8" height="15" rx="2"/><path d="M9 15h2"/>')
  };
  const ADD = [['p', 'Text', SVG.text, '#8E8E93'], ['pic', 'Picture', SVG.pic, '#34C759'], ['ev', 'Events', SVG.cal, '#FF9500'], ['lessons', 'Lessons', SVG.book, '#5856D6'],
    ['birthdays', 'Birthdays', SVG.cake, '#FF2D55'], ['new members', 'New members', SVG.hi, '#5AC8FA'], ['stake calendar', 'Stake calendar', SVG.stake, '#8E8E93'], ['btn', 'Link', SVG.link, '#007AFF']];
  const TOKNAME = { lessons: 'Lessons', birthdays: 'Birthdays', 'birthdays next': 'Birthdays', 'new members': 'New members', 'stake calendar': 'Stake calendar', 'ward calendar': 'Ward calendar' };
  const TOKHEAD = { lessons: 'Lessons', birthdays: '{month} Birthdays', 'new members': 'Please welcome', 'stake calendar': 'Stake calendar' };

  /* ---------- the list of issues ---------- */
  WH.routes.newsletter = {
    view(args) {
      css();
      if (args && args[0]) return open(decodeURIComponent(args[0]));
      ED = null;
      WH.screen('Newsletter', 'Paste in what people send you, add pictures and the calendar, and send it', WH.skeleton(4), { back: '#/more', backLabel: 'More', right: '<span class="nladd"></span>' });
      WH.call('newsletters', {}).then(d => { NL = d; drawList(); }).catch(e => { body().innerHTML = WH.errorBox(e.message); });
    }
  };
  function drawList() {
    const { I, fmt } = WH, d = NL;
    $$('.nladd').forEach(x => x.innerHTML = `<button class="btn small" data-act="nlNew">${I.plus} New</button>`);
    body().innerHTML = `${d.list.length ? '' : `<button class="nl-big pri" data-act="nlNew"><span class="i">${SVG.text}</span><span><b>Start a newsletter</b><small>It begins with your usual sections. Paste or type your announcements, and the calendar, lessons and birthdays fill themselves in.</small></span></button>`}
      <div class="section-h"><span>Issues</span></div><div class="list">${d.list.length ? d.list.map(n => `<button class="row" data-go="#/x/newsletter/${encodeURIComponent(n.ID)}"><div class="main"><div class="t">${esc(n.Subject || 'Untitled')}</div><div class="s">${esc(n.Organization)} · ${esc(fmt(n.Date))}</div></div><span class="chip ${n.Status === 'Sent' ? 'green' : /Sched|Send/.test(n.Status) ? 'blue' : ''}">${esc(n.Status || 'Draft')}</span>${I.chev}</button>`).join('') : '<div class="empty">No newsletters yet. Tap New to start one.</div>'}</div>
      <div class="section-h"><span>Who gets it</span></div><div class="list">${d.orgs.map(o => `<div class="row"><div class="main"><div class="t">${esc(o.org)}</div><div class="s">${o.group ? 'Your newsletter list' : o.org === 'Ward' ? 'Every adult with an email' : 'Every ' + (o.org === 'Relief Society' ? 'sister' : 'brother') + ' with an email'}</div></div><span class="chip">${o.count}</span></div>`).join('')}</div>
      <p class="foot">To send to a smaller list: More › Messages, pick the people, tap Save a new group, and name it Newsletter.</p>`;
  }
  async function start(org) {
    try {
      const t = await WH.call('newsletterTemplate', { org });
      const r = await WH.call('newsletterSave', { row: t.row });
      NL = null; location.hash = '#/x/newsletter/' + encodeURIComponent(r.id);
    } catch (e) { WH.toast(e.message); }
  }

  /* ---------- open one ---------- */
  function open(id) {
    WH.screen('Newsletter', '', WH.skeleton(4), { back: '#/x/newsletter', backLabel: 'Newsletters' });
    const b = body(); wire(b);
    Promise.all([NL ? NL : WH.call('newsletters', {}), WH.call('newsletterView', { id })]).then(([l, v]) => {
      NL = l;
      const row = v.row || {}, locked = /Scheduled|Sending/.test(v.status);
      ED = { id, row, att: v.attachment || '', status: v.status, locked, view: v, html: v.html, sel: null, dirty: false, saving: null, step: locked ? 3 : 1,
        count: ((l.orgs.find(o => o.org === row.Organization) || {}).count) || v.emails.length,
        blocks: v.blocks.map(x => Object.assign({ k: nk() }, x)) };
      draw();
    }).catch(e => { b.innerHTML = WH.errorBox(e.message); });
  }
  const month = (next) => { const d = WH.pd(ED.row.Date || WH.ymd(WH.today())); if (next) d.setMonth(d.getMonth() + 1, 1); return d.toLocaleDateString(undefined, { month: 'long' }); };
  const fill = s => String(s || '').replace(/\{month\}/gi, month()).replace(/\{next month\}/gi, month(true));
  const pending = () => ED ? ED.blocks.filter(b => b.t === 'pic' && !b.url && b.state !== 'err').length : 0;

  function draw() {
    if (!ED || !body()) return;
    const s = ED.step;
    const steps = [[1, 'Write'], [2, 'Add pictures and events'], [3, 'Send']].map(([n, t]) => `<button class="${s === n ? 'on' : ''}" data-act="nlStep" data-s="${n}"><b>${n}</b>${t}</button>`).join('');
    body().innerHTML = `<div class="nl-steps" role="tablist">${steps}</div><div class="nl-saved" id="nlSaved"></div><div id="nlPane">${s === 1 ? paneWrite() : s === 2 ? panePics() : '<div class="skeleton"></div><div class="skeleton"></div>'}</div><input type="file" accept="image/*" multiple hidden id="nlPick">`;
    if (s === 3) paneSend();
    status();
  }
  const pasteBox = () => ED.locked ? '' : `<div class="nl-paste" id="nlPaste" contenteditable="true" role="textbox" aria-label="Paste here" data-ph="Paste here: an email someone sent you, a flyer, a screenshot, or part of a Word or Google Doc. Text becomes text, pictures become pictures.&#10;(Tap and hold › Paste, or Ctrl/⌘ V)"></div>`;

  /* Step 1: write */
  function paneWrite() {
    const r = ED.row;
    return `${ED.locked ? `<div class="nl-note">This is being sent from the ward account, so it can't change now. To change it, go to 3 Send and tap Stop sending.</div>` : ''}
      <div class="list"><div class="field col"><label>Title (the email's subject)</label><input class="nl-f big" data-f="subject" value="${esc(r.Subject || '')}" placeholder="Relief Society News" ${ED.locked ? 'disabled' : ''}></div>
      <div class="field"><label>Date</label><input type="date" class="nl-f" style="text-align:right" data-f="date" value="${esc(r.Date || '')}" ${ED.locked ? 'disabled' : ''}></div></div>
      <p class="foot">For the ${esc(r.Organization === 'Ward' ? 'ward' : r.Organization)} · ${ED.count} addresses. The date sets the birthday month and when the events start.</p>
      ${ED.locked ? '' : `<div class="section-h"><span>Paste here</span></div>${pasteBox()}`}
      <div class="section-h"><span>Your newsletter</span><span>${ED.locked ? '' : 'Tap a block to change it'}</span></div>
      ${card()}
      ${ED.locked ? '' : `<div class="section-h"><span>Add</span></div><div class="nl-add">${ADD.map(([t, label, svg, color]) => `<button data-act="nlAdd" data-t="${t}"><span class="i" style="background:${color}">${svg}</span>${label}</button>`).join('')}</div>
      <p class="foot" id="nlWhere">${where()}</p>`}
      <div class="btns"><button class="btn gray" data-act="nlPreview">${SVG.phone.replace('<svg', '<svg width="20" height="20"')} Preview on a phone</button></div>
      <div class="btns"><button class="btn" data-act="nlStep" data-s="2">Next: pictures and events</button></div>`;
  }
  const where = () => { const b = ED.blocks.find(x => x.k === ED.sel); return b ? 'New things go below the highlighted block. Tap another block to choose a different spot.' : 'New things go after your announcements. Tap a block first to put them somewhere else.'; };
  function card() {
    const bl = ED.blocks.length ? ED.blocks.map((b, i) => blockHtml(b, i)).join('') : `<div class="nlb"><div class="bd"><p class="muted" style="margin:10px 0">This newsletter is empty. Paste something in the box above, or tap a button below to add text, a picture, or the calendar.</p></div></div>`;
    return `<div class="nl-card" id="nlCard"><div class="hd"><small>Newsletter</small><div id="nlSubj">${esc(ED.row.Subject || 'Untitled')}</div></div><div class="bl">${bl}</div></div>`;
  }
  function blockHtml(b, i) {
    const n = ED.blocks.length, tools = ED.locked ? '' : `<div class="tl"><button data-act="nlUp" data-k="${b.k}" aria-label="Move up" ${i === 0 ? 'disabled' : ''}>${SVG.up}Up</button><button data-act="nlDown" data-k="${b.k}" aria-label="Move down" ${i === n - 1 ? 'disabled' : ''}>${SVG.down}Down</button><button class="rm" data-act="nlDelB" data-k="${b.k}" aria-label="Remove">${SVG.x}Remove</button></div>`;
    return `<div class="nlb ${ED.sel === b.k ? 'sel' : ''}" data-k="${b.k}"><div class="bd">${bodyHtml(b)}</div>${tools}</div>`;
  }
  const ce = () => ED.locked ? 'false' : 'true';
  function bodyHtml(b) {
    if (b.t === 'h') return `<div class="h" contenteditable="${ce()}" data-f="h" data-ph="Heading" enterkeyhint="done">${esc(fill(b.text))}</div>`;
    if (b.t === 'p') return `<div class="tx" contenteditable="${ce()}" data-f="text" data-ph="Type here…">${mdToHtml(b.text)}</div>`;
    if (b.t === 'pic') {
      const src = b.local || b.url || b.src || '';
      const ov = b.state === 'err' ? `<div class="ov err"><span>${esc(b.err || 'This picture did not upload.')}</span><span><button class="nl-mini" data-act="nlPicRetry" data-k="${b.k}">Try again</button> <button class="nl-mini" data-act="nlPicSwap" data-k="${b.k}">Choose photos</button></span></div>`
        : (!b.url ? `<div class="ov"><span class="spin"></span>${b.state === 'up' ? 'Adding the picture…' : 'Waiting…'}</div>` : '');
      return `<div class="pic">${src ? `<img src="${esc(src)}" alt="">` : '<div style="height:120px"></div>'}${ov}</div><div class="cap" contenteditable="${ce()}" data-f="cap" data-ph="Add a caption (optional)" enterkeyhint="done">${esc(b.cap || '')}</div>`;
    }
    if (b.t === 'btn') return `<p style="margin:8px 0"><a class="nl-btnprev">${esc(b.label || 'Open')}</a></p><div class="muted" style="word-break:break-all">${esc(b.url)}</div>${ED.locked ? '' : `<p style="margin:6px 0 2px"><button class="nl-mini" data-act="nlBtnEdit" data-k="${b.k}">Change the link</button></p>`}`;
    if (b.t === 'ev') return evBody(b);
    if (b.t === 'tok') {
      const empty = { birthdays: 'No birthdays that month, so this part is left out of the email.', 'birthdays next': 'No birthdays that month, so this part is left out of the email.', 'new members': 'No one new in the last two months, so this part is left out of the email.' }[b.tok];
      const bday = /birthdays/.test(b.tok) && !ED.locked ? `<span class="nl-sg" style="margin:0;text-transform:none;letter-spacing:0"><button class="${b.tok === 'birthdays' ? 'on' : ''}" data-act="nlBday" data-k="${b.k}" data-v="birthdays">${esc(month())}</button><button class="${b.tok === 'birthdays next' ? 'on' : ''}" data-act="nlBday" data-k="${b.k}" data-v="birthdays next">${esc(month(true))}</button></span>` : '';
      const att = b.tok === 'stake calendar' && !ED.locked ? `<input class="nl-in" data-f="att" inputmode="url" placeholder="Stake memo link (optional): https://…" value="${esc(ED.att)}">` : '';
      return `<div class="auto"><div class="tag">Fills itself in · ${esc(TOKNAME[b.tok] || b.tok)}${bday}</div>${b.html == null ? '<div class="muted">Loading…</div>' : (b.html.replace(/<[^>]+>/g, '').trim() ? b.html : `<div class="muted">${empty || 'Nothing to show yet.'}</div>`)}${att}</div>`;
    }
    return '';
  }
  function evBody(b) {
    const seg = ED.locked ? '' : `<div class="nl-sg">${WEEKS.map(w => `<button class="${+b.weeks === w ? 'on' : ''}" data-act="nlWeeks" data-k="${b.k}" data-w="${w}">${w} weeks</button>`).join('')}</div>`;
    let list = '';
    if (!b.events) list = '<div class="muted" style="padding:8px 0">Loading the calendar…</div>';
    else if (!b.events.length) list = '<div class="muted" style="padding:8px 0">Nothing on the calendar for these weeks. Tap Add an event.</div>';
    else {
      let day = '';
      b.events.forEach(e => {
        if (e.date !== day) { day = e.date; list += `<div class="nl-evday">${esc(WH.fmt(e.date, { weekday: 'long', month: 'long', day: 'numeric' }))}</div>`; }
        const when = e.time ? e.time + (e.endTime ? '–' + e.endTime : '') : (e.end && e.end > e.date ? 'Through ' + WH.fmt(e.end, { weekday: 'short', month: 'short', day: 'numeric' }) : 'All day');
        const sub = [e.place, e.org !== ED.row.Organization && e.org !== 'Ward' ? e.org : ''].filter(Boolean).join(' · ');
        list += `<label class="nl-ev ${e.skipped ? 'off' : ''}"><input type="checkbox" class="nl-evchk" data-k="${b.k}" data-key="${esc(e.key)}" ${e.skipped ? '' : 'checked'} ${ED.locked ? 'disabled' : ''} aria-label="Include ${esc(e.title)}"><span class="w"><span class="tm">${esc(when)}</span> · <b>${esc(e.title)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span></label>`;
      });
    }
    const n = (b.events || []).length, on = (b.events || []).filter(e => !e.skipped).length;
    return `<div class="auto"><div class="tag">The calendar · ${n ? on + ' of ' + n + ' events' : 'events'}</div>${seg}${list}
      ${ED.locked ? '' : `<p style="margin:10px 0 2px"><button class="nl-mini" data-act="nlAddEvent">+ Add an event</button></p><div class="muted" style="margin-top:6px">Uncheck anything to leave it out of the email.${b.stakeApart ? ' Stake events are in the Stake calendar block.' : ''}</div>`}</div>`;
  }

  /* Step 2: pictures and events */
  function panePics() {
    const pics = ED.blocks.filter(b => b.t === 'pic'), ev = ED.blocks.find(b => b.t === 'ev');
    return `${ED.locked ? `<div class="nl-note">This is being sent from the ward account, so it can't change now.</div>` : `
      <div class="section-h"><span>Pictures</span></div>${pasteBox()}
      <button class="nl-big pri" data-act="nlChoose"><span class="i">${SVG.pic}</span><span><b>Choose photos</b><small>From your phone or computer. You can pick several at once.</small></span></button>
      <p class="foot">Anyone who gets this email can see its pictures, and so can anyone they forward it to. Leave out private papers, and ask before adding pictures of children.</p>`}
      ${pics.length ? `<div class="nl-thumbs">${pics.map(b => `<span><img src="${esc(b.local || b.url || b.src || '')}" alt="">${b.url ? '' : `<i>${b.state === 'err' ? 'Problem' : 'Adding…'}</i>`}</span>`).join('')}</div><p class="foot">${pics.length} picture${pics.length > 1 ? 's' : ''} in this newsletter. Move or remove them in 1 Write.</p>` : ''}
      <div class="section-h"><span>Events</span></div>
      ${ev ? `<div class="nl-card nl-solo"><div class="nlb" data-k="${ev.k}"><div class="bd">${evBody(ev)}</div></div></div>`
        : ED.locked ? '<div class="list"><div class="empty">No calendar in this one.</div></div>' : `<button class="nl-big" data-act="nlAdd" data-t="ev"><span class="i">${SVG.cal}</span><span><b>Add the calendar</b><small>Every event in the next weeks: yours, the ward's, the stake's, and other organizations' public ones. Uncheck any you don't want.</small></span></button>
        <div class="btns"><button class="btn gray" data-act="nlAddEvent">+ Add an event</button></div>`}
      <div class="btns"><button class="btn" data-act="nlStep" data-s="3">Next: send</button></div>`;
  }

  /* Step 3: send */
  async function paneSend() {
    const ed = ED;
    try { await flush(ed); ed.view = await WH.call('newsletterView', { id: ed.id }); ed.html = ed.view.html; ed.status = ed.view.status; ed.locked = /Scheduled|Sending/.test(ed.status); }
    catch (e) { if (ED === ed && ED.step === 3) $('#nlPane').innerHTML = WH.errorBox(e.message); return; }
    if (ED !== ed || ED.step !== 3) return;
    const v = ed.view, st = v.status || 'Draft', sched = /Scheduled|Sending/.test(st), r = ed.row;
    const dayName = d => WH.fmt(d, { weekday: 'short', month: 'short', day: 'numeric' });
    const planTxt = v.plan.map(b => `${dayName(b.date)} (${b.count})`).join(' and ');
    const wait = pending();
    let h = `<div class="list"><div class="row"><div class="main"><div class="t" style="font-weight:600">${esc(r.Subject || 'Untitled')}</div><div class="s">${esc(r.Organization)} · ${v.emails.length} addresses · ${esc(st)}${r['Sent on'] ? ' ' + esc(WH.fmt(r['Sent on'])) : ''}</div></div></div></div>`;
    if (wait) h += `<div class="nl-note">${wait} picture${wait > 1 ? 's are' : ' is'} still being added. Wait a moment before sending.</div>`;
    if (sched) h += `<div class="section-h"><span>Sending from the ward account</span></div><div class="list">${v.plan.map(b => `<div class="row"><span class="check ${b.sent ? 'on' : ''}"></span><div class="main"><div class="t">${esc(dayName(b.date))}</div><div class="s">${b.count} addresses${b.sent ? ' · sent ' + esc(String(b.sent).slice(11)) : ' · about 7 AM'}</div></div></div>`).join('')}</div><div class="btns"><button class="btn gray" data-act="nlCancel">Stop sending</button></div>`;
    else {
      h += `<button class="nl-big pri" data-act="nlMine" ${wait ? 'disabled' : ''}><span class="i">${SVG.mail}</span><span><b>${st === 'Sent' ? 'Send again from my email' : 'Send from my email'}</b><small>Copy it into Gmail or Mail, paste the addresses into Bcc, and send. Pictures come along.</small></span></button>`;
      if (st !== 'Sent') h += `<button class="nl-big" data-act="nlSched" ${wait ? 'disabled' : ''}><span class="i">${SVG.send}</span><span><b>Send from the ward account</b><small>${v.paused ? 'Emails from the ward account are turned off for now. Use Send from my email.' : `The Hub emails it in ${v.plan.length} parts: ${esc(planTxt)}, about 7 AM.`}</small></span></button>
        <p class="foot">Google lets the ward account email 100 addresses a day, so the Hub splits the list over the ${v.plan.length > 2 ? v.plan.length : 'two'} quietest days this week.</p>`;
    }
    h += `<div class="section-h"><span>What they'll get</span><button class="link" style="font-size:15px" data-act="nlPreview">Bigger</button></div>${phone(ed.html)}`;
    if (!sched) h += `<div class="btns"><button class="btn red" data-act="nlDel">Remove this newsletter</button></div>`;
    $('#nlPane').innerHTML = h;
  }
  const doc = html => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:10px;background:#fff}img{max-width:100%;height:auto}</style></head><body>${html}</body></html>`;
  const phone = html => `<div class="nl-phone"><iframe sandbox="" title="Newsletter preview" srcdoc="${esc(doc(html))}"></iframe></div>`;

  /* ---------- saving as they type ---------- */
  let saveT = null;
  function status(s, bad) {
    const el = document.getElementById('nlSaved'); if (!el || !ED) return;
    if (s != null) ED.msg = { s, bad };
    const m = ED.msg || { s: '' };
    el.innerHTML = esc(m.s) + (m.bad ? '<button data-act="nlRetrySave">Try again</button>' : '');
    el.style.color = m.bad ? 'var(--red)' : '';
  }
  function changed(render) {
    if (!ED || ED.locked) return;
    ED.dirty = true; if (render) ED.render = true; status('Saving…');
    clearTimeout(saveT); saveT = setTimeout(() => save(ED), render ? 250 : 1200);
  }
  const clean = b => ({ t: b.t, text: b.text, url: b.url, cap: b.cap, link: b.link, label: b.label, weeks: b.weeks, skip: b.skip, tok: b.tok });
  async function save(ed) {
    if (!ed || ed.locked) return;
    if (ed.saving) { ed.again = true; return ed.saving; }
    if (!ed.dirty) return;
    if (ed === ED) clearTimeout(saveT);
    ed.dirty = false; const render = !!ed.render; ed.render = false;
    const sent = ed.blocks.filter(b => !(b.t === 'pic' && !b.url));
    const run = (async () => {
      try {
        const r = await WH.call('newsletterSave', { row: { ID: ed.id, Organization: ed.row.Organization, Subject: ed.row.Subject, Date: ed.row.Date, Attachment: ed.att, Status: ed.status }, blocks: sent.map(clean), render });
        if (r.render) {
          ed.html = r.html;
          r.render.forEach((x, i) => {
            const b = sent[i]; if (!b || b.t === 'p' || b.t === 'h' || b.t === 'pic') return;
            b.html = x.html; b.stakeApart = !!x.stakeApart;
            if (x.events) { const sk = new Set(b.skip || []); b.events = x.events.map(e => Object.assign(e, { skipped: sk.has(e.key) })); }
            if (ed === ED) redraw(b);
          });
        } else ed.html = null;
        NL = null; if (ed === ED) status('Saved');
      } catch (e) { ed.dirty = true; if (ed === ED) status('Not saved: ' + e.message, true); }
    })();
    ed.saving = run; await run; ed.saving = null;
    if (ed.again) { ed.again = false; if (ed.dirty) return save(ed); }
  }
  async function flush(ed) { ed = ed || ED; if (!ed) return; clearTimeout(saveT); if (ed.saving) await ed.saving; if (ed.dirty) await save(ed); if (ed.saving) await ed.saving; }
  async function freshHtml() { const ed = ED; if (!ed) return ''; if (ed.dirty || !ed.html) { ed.dirty = true; ed.render = true; await flush(ed); } if (!ed.html) { const v = await WH.call('newsletterView', { id: ed.id }); ed.html = v.html; } return ed.html; }
  window.addEventListener('hashchange', () => { if (ED && (ED.dirty || ED.saving)) save(ED); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && ED && ED.dirty) save(ED); });
  window.addEventListener('beforeunload', e => { if (ED && (ED.dirty || pending())) { if (ED.dirty) save(ED); e.preventDefault(); e.returnValue = ''; } });

  function redraw(b) { $$(`.nlb[data-k="${b.k}"] > .bd`).forEach(el => { if (!el.contains(document.activeElement)) el.innerHTML = bodyHtml(b); }); if (ED && ED.step === 2 && b.t === 'pic') { const p = $('#nlPane'); if (p && !p.contains(document.activeElement)) p.innerHTML = panePics(); } }
  function redrawAll(focusK) {
    const y = window.scrollY;
    if (ED.step === 1) { const c = $('#nlCard'); if (c) c.outerHTML = card(); const w = $('#nlWhere'); if (w) w.textContent = where(); }
    else if (ED.step === 2) $('#nlPane').innerHTML = panePics();
    window.scrollTo(0, y);
    if (focusK) { const el = $(`.nlb[data-k="${focusK}"]`); if (el) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.classList.add('nl-flash'); } }
  }
  function select(k) { ED.sel = k; $$('.nlb').forEach(el => el.classList.toggle('sel', el.dataset.k === k)); const w = $('#nlWhere'); if (w) w.textContent = where(); }

  /* Where new blocks go: below the highlighted block, or else after the announcements (before the first calendar or fill-in block). */
  function spot() {
    const i = ED.blocks.findIndex(b => b.k === ED.sel); if (i >= 0) return i + 1;
    let j = ED.blocks.findIndex(b => b.t === 'ev' || b.t === 'tok');
    if (j < 0) return ED.blocks.length;
    if (j > 0 && ED.blocks[j - 1].t === 'h') j--;
    return j;
  }
  function insert(list, opts = {}) {
    if (!list.length) return [];
    list.forEach(b => { b.k = b.k || nk(); });
    let at = spot();
    if (opts.paste) { const ph = ED.blocks.findIndex(b => b.t === 'p' && /^\([^]*paste[^]*\)$/i.test(String(b.text).trim())); if (ph >= 0) { ED.blocks.splice(ph, 1); at = ph; } }
    ED.blocks.splice(at, 0, ...list);
    ED.sel = list[list.length - 1].k;
    redrawAll(list[0].k);
    return list;
  }

  /* ---------- text: little markdown ([words](link), **bold**) <-> what the editor shows ---------- */
  function mdInline(s) { return esc(s).replace(/\[([^\]\n]+)\]\(((?:https?:\/\/|mailto:)[^\s)]+)\)/g, '<a href="$2">$1</a>').replace(/\*\*([^*\n]+?)\*\*/g, '<b>$1</b>'); }
  function mdToHtml(md) { const s = String(md || '').trim(); return s ? s.split(/\n\s*\n/).map(p => '<p>' + p.split('\n').map(mdInline).join('<br>') + '</p>').join('') : ''; }
  const BLOCK = new Set('P DIV H1 H2 H3 H4 H5 H6 LI UL OL TABLE TBODY THEAD TFOOT TR TD TH BLOCKQUOTE SECTION ARTICLE HEADER FOOTER CENTER PRE FIGURE FIGCAPTION DL DT DD ADDRESS MAIN NAV ASIDE HR FORM FIELDSET'.split(' '));
  const SKIP = new Set('SCRIPT STYLE META LINK TITLE HEAD NOSCRIPT TEMPLATE IFRAME OBJECT EMBED SVG CANVAS INPUT BUTTON SELECT TEXTAREA VIDEO AUDIO MAP XML'.split(' '));
  /* Any HTML → a flat list of paragraphs (runs of text, bold, links, line breaks), headings and pictures. */
  function walk(root) {
    const items = []; let para = null;
    const end = () => { if (para) { while (para.runs.length && para.runs[para.runs.length - 1].br) para.runs.pop(); if (para.runs.some(r => r.text && r.text.trim())) items.push({ type: para.h ? 'h' : 'para', runs: para.runs }); } para = null; };
    const add = (text, st) => { if (!para) { if (!text.trim()) return; para = { runs: [], h: st.h }; } para.runs.push({ text, bold: !!st.bold, href: st.href || '' }); };
    const visit = (node, st) => {
      if (node.nodeType === 3) { add(node.nodeValue.replace(/\s+/g, ' '), st); return; }
      if (node.nodeType !== 1) return;
      const tag = node.tagName.toUpperCase();
      if (SKIP.has(tag)) return;
      const style = String(node.getAttribute('style') || '').toLowerCase();
      if (/display\s*:\s*none|mso-hide\s*:\s*all|visibility\s*:\s*hidden/.test(style)) return;
      if (tag === 'BR') { if (para) para.runs.push({ br: 1 }); return; }
      if (tag === 'IMG') {
        const src = node.getAttribute('src') || '', w = parseInt(node.getAttribute('width'), 10) || 0, h = parseInt(node.getAttribute('height'), 10) || 0;
        if (src && !(w && w < 24) && !(h && h < 24)) { end(); items.push({ type: 'img', src, alt: (node.getAttribute('alt') || '').trim() }); }
        return;
      }
      const isH = /^H[1-6]$/.test(tag);
      let bold = st.bold || tag === 'B' || tag === 'STRONG' || isH;
      const fw = style.match(/font-weight\s*:\s*([a-z0-9]+)/); if (fw) bold = /bold|[6-9]00/.test(fw[1]);
      const hr = tag === 'A' ? String(node.getAttribute('href') || '').trim() : '', href = /^(https?:|mailto:)/i.test(hr) ? hr : st.href;
      const blk = BLOCK.has(tag) || isH;
      if (blk) end();
      if (tag === 'LI') { const ol = node.parentNode && node.parentNode.tagName === 'OL'; para = { runs: [{ text: (ol ? (Array.from(node.parentNode.children).filter(x => x.tagName === 'LI').indexOf(node) + 1) + '. ' : '• '), bold: false, href: '' }], h: false }; }
      const st2 = { bold, href, h: st.h || isH };
      Array.from(node.childNodes).forEach(c => visit(c, st2));
      if (blk) end();
    };
    visit(root, { bold: false, href: '', h: false }); end();
    return items;
  }
  const runsPlain = runs => runs.map(r => r.br ? '\n' : r.text).join('').split('\n').map(l => l.replace(/\s+/g, ' ').trim()).join('\n').trim();
  function runsMd(runs) {
    const m = [];
    runs.forEach(r => { const last = m[m.length - 1]; if (r.br) { m.push({ br: 1 }); return; } if (last && !last.br && last.bold === r.bold && last.href === r.href) last.text += r.text; else m.push({ text: r.text, bold: r.bold, href: r.href }); });
    let out = '';
    m.forEach(r => {
      if (r.br) { out += '\n'; return; }
      const core0 = r.text.trim(); if (!core0) { out += r.text ? ' ' : ''; return; }
      let core = core0.replace(/\*\*/g, '*');
      const bare = r.href && (r.href === core0 || r.href === 'mailto:' + core0 || r.href.replace(/\/$/, '') === core0.replace(/\/$/, ''));
      if (r.bold && !bare) core = '**' + core + '**';
      if (r.href && !bare) core = '[' + core.replace(/[[\]]/g, '') + '](' + r.href.replace(/[\s()]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')) + ')';
      out += (/^\s/.test(r.text) ? ' ' : '') + core + (/\s$/.test(r.text) ? ' ' : '');
    });
    return out.split('\n').map(l => l.replace(/[ \t]+/g, ' ').trim()).join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }
  const HEADERLINE = /^(from|sent|to|cc|bcc|date|subject|reply-to):\s/i, FWD = /^-{2,}\s*(forwarded|original) message\s*-{2,}$/i;
  /* Paragraphs, headings and pictures → blocks. A short bold first line becomes a heading; "From:/To:" lines of a forwarded email are dropped. */
  function toBlocks(items) {
    const out = []; let txt = [];
    const flush = () => { if (txt.length) { out.push({ t: 'p', text: txt.join('\n\n') }); txt = []; } };
    items.forEach(it => {
      if (it.type === 'img') { flush(); out.push({ t: 'pic', src: it.src, cap: '' }); return; }
      let runs = it.runs;
      const lines = runsPlain(runs).split('\n');
      if (lines.some(l => FWD.test(l)) || lines.filter(l => HEADERLINE.test(l)).length >= 2) {
        // drop the header lines of a forwarded email (they hold other people's addresses)
        const keep = []; let line = []; const flushLine = () => { const p = runsPlain(line); if (p && !FWD.test(p) && !HEADERLINE.test(p)) { if (keep.length) keep.push({ br: 1 }); keep.push(...line); } line = []; };
        runs.forEach(r => { if (r.br) flushLine(); else line.push(r); }); flushLine();
        runs = keep; if (!runs.some(r => r.text && r.text.trim())) return;
      }
      const plain = runsPlain(runs);
      if (it.type === 'h' && plain.length <= 120) { flush(); out.push({ t: 'h', text: plain.replace(/\s+/g, ' ') }); return; }
      const cut = runs.findIndex(r => r.br), first = cut < 0 ? runs : runs.slice(0, cut), rest = cut < 0 ? [] : runs.slice(cut + 1);
      const fl = runsPlain(first), words = first.filter(r => r.text && r.text.trim());
      if (words.length && words.every(r => r.bold) && fl.length >= 2 && fl.length <= 80) {
        flush(); out.push({ t: 'h', text: fl.replace(/\s+/g, ' ').replace(/:$/, '') });
        if (rest.some(r => r.text && r.text.trim())) txt.push(runsMd(rest));
        return;
      }
      txt.push(runsMd(runs));
    });
    flush();
    return out;
  }
  const textToItems = text => String(text).replace(/\r/g, '').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean).map(p => ({ type: 'para', runs: p.split('\n').reduce((a, l, i) => a.concat(i ? [{ br: 1 }, { text: l, bold: false, href: '' }] : [{ text: l, bold: false, href: '' }]), []) }));
  const domMd = el => walk(el).filter(i => i.type !== 'img').map(i => runsMd(i.runs)).join('\n\n');

  /* ---------- pasting ---------- */
  const imageFiles = dt => { const out = []; if (!dt) return out; Array.from(dt.files || []).forEach(f => { if (/^image\//.test(f.type)) out.push(f); }); if (!out.length) Array.from(dt.items || []).forEach(it => { if (it.kind === 'file' && /^image\//.test(it.type)) { const f = it.getAsFile(); if (f) out.push(f); } }); return out; };
  function fromClipboard(data) {
    const files = data.files || [], html = data.html || '', text = data.text || '';
    let items = html ? walk(new DOMParser().parseFromString(html, 'text/html').body) : [];
    const htmlText = items.some(i => i.type !== 'img');
    let blocks = [];
    if (items.length && (htmlText || !files.length)) blocks = toBlocks(items);
    else if (text.trim() && !(files.length && /^[^\n]{1,80}\.(png|jpe?g|gif|heic|webp)$/i.test(text.trim()))) blocks = toBlocks(textToItems(text));
    const spare = files.slice();
    if (!blocks.some(b => b.t === 'pic')) blocks = blocks.concat(spare.splice(0).map(f => ({ t: 'pic', file: f, cap: '' })));
    blocks.forEach(b => { if (b.t === 'pic' && !b.file) b.spare = spare; });
    return blocks;
  }
  function pasteBlocks(blocks) {
    if (!ED || ED.locked) return;
    if (!blocks.length) { WH.toast('Nothing to paste. Copy the text or picture first, then paste.'); return; }
    insert(blocks, { paste: true });
    const pics = blocks.filter(b => b.t === 'pic'), words = blocks.length - pics.length;
    pics.forEach(queue);
    changed(true);
    WH.toast(`Added ${[words ? words + ' block' + (words > 1 ? 's' : '') + ' of text' : '', pics.length ? pics.length + ' picture' + (pics.length > 1 ? 's' : '') : ''].filter(Boolean).join(' and ')}. Use ↑ ↓ to move them.`, true);
  }
  function onPaste(e, box) {
    const cd = e.clipboardData;
    const data = cd ? { files: imageFiles(cd), html: cd.getData('text/html'), text: cd.getData('text/plain') } : {};
    if (!data.files || (!data.files.length && !data.html && !data.text)) { setTimeout(() => readBox(box), 60); return; }  // let the phone paste, then read the box
    e.preventDefault();
    pasteBlocks(fromClipboard(data));
    if (box) box.innerHTML = '';
  }
  function readBox(box) {
    if (!box || !box.innerHTML.trim()) return;
    const html = box.innerHTML; box.innerHTML = '';
    pasteBlocks(fromClipboard({ html }));
  }

  /* ---------- pictures: shrink here, then save in the ward's Drive ---------- */
  let line = Promise.resolve();
  function queue(b) { b.state = 'wait'; const ed = ED; line = line.then(() => upload(ed, b)).catch(() => { }); }
  const toB64 = blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).replace(/^data:[^,]*,/, '')); r.onerror = () => rej(new Error('Could not read the picture.')); r.readAsDataURL(blob); });
  async function shrink(blob) {
    if (blob.type === 'image/gif' && blob.size < 1.5e6) return blob;   // keeps small animations
    const url = URL.createObjectURL(blob);
    try {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('This picture could not be opened here. Try a screenshot of it.')); i.src = url; });
      const w = img.naturalWidth, h = img.naturalHeight, s = Math.min(1, EDGE / Math.max(w, h, 1));
      if (s === 1 && blob.type === 'image/jpeg' && blob.size < 1.2e6) return blob;
      const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * s)); c.height = Math.max(1, Math.round(h * s));
      const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
      return await new Promise((res, rej) => c.toBlob(x => x ? res(x) : rej(new Error('This picture could not be made smaller.')), 'image/jpeg', Q));
    } finally { URL.revokeObjectURL(url); }
  }
  async function upload(ed, b) {
    if (!ed || !ed.blocks.includes(b) || b.url) return;
    b.state = 'up'; b.err = ''; if (ed === ED) redraw(b);
    try {
      let blob = b.file || null, r = null;
      if (!blob && b.src && /^(data:|blob:)/.test(b.src)) { try { blob = await (await fetch(b.src)).blob(); } catch (e) { } }
      if (!blob && b.src && /^https?:/i.test(b.src)) { try { const res = await fetch(b.src, { mode: 'cors', credentials: 'omit' }); if (res.ok) { const x = await res.blob(); if (/^image\//.test(x.type)) blob = x; } } catch (e) { } }
      if (!blob && b.src && /^https:/i.test(b.src)) { try { r = await WH.call('newsletterImage', { id: ed.id, src: b.src }); } catch (e) { if (!(b.spare && b.spare.length)) throw e; } }
      if (!r && !blob && b.spare && b.spare.length) blob = b.spare.shift();
      if (!r) {
        if (!blob) throw new Error('This picture could not be copied. Save it to your phone or computer, then tap Choose photos.');
        if (blob.type && !/^image\//.test(blob.type)) throw new Error('That file is not a picture.');
        if (blob.size > MAX) throw new Error(`This picture is ${(blob.size / 1048576).toFixed(1)} MB. The limit is 8 MB, so pick a smaller copy or take a screenshot of it.`);
        if (!b.local && blob) b.local = URL.createObjectURL(blob);
        if (ed === ED) redraw(b);
        const small = await shrink(blob);
        r = await WH.call('newsletterImage', { id: ed.id, data: await toB64(small), type: small.type });
      }
      b.url = r.url; b.state = ''; delete b.file; delete b.spare;
      if (!b.local && b.src && !/^blob:/.test(b.src)) b.local = b.src;
      ed.dirty = true; if (ed === ED) { redraw(b); changed(false); } else save(ed);
    } catch (e) { b.state = 'err'; b.err = e.message; if (ed === ED) redraw(b); }
  }
  function choose(after) {
    const inp = document.getElementById('nlPick'); if (!inp) return;
    inp.value = ''; inp.onchange = () => {
      const files = Array.from(inp.files || []).filter(f => /^image\//.test(f.type) || /\.(heic|heif|jpe?g|png|gif|webp)$/i.test(f.name));
      if (!files.length) return;
      if (after) after(files); else { const list = insert(files.map(f => ({ t: 'pic', file: f, cap: '' }))); list.forEach(queue); changed(false); WH.toast(`Adding ${files.length} picture${files.length > 1 ? 's' : ''}…`, true); }
    };
    inp.click();
  }

  /* ---------- typing, ticking, pasting inside the editor ---------- */
  const wired = new WeakSet();
  function wire(root) {
    if (wired.has(root)) return; wired.add(root);
    root.addEventListener('input', e => {
      if (!ED) return;
      const t = e.target, f = t.dataset && t.dataset.f; if (!f) { if (t.id === 'nlPaste' && /insertFromPaste|insertFromDrop/.test(e.inputType || '')) setTimeout(() => readBox(t), 60); return; }
      if (f === 'subject') { ED.row.Subject = t.value; const s = $('#nlSubj'); if (s) s.textContent = t.value || 'Untitled'; return changed(false); }
      if (f === 'date') { if (/^\d{4}-\d\d-\d\d$/.test(t.value)) { ED.row.Date = t.value; changed(true); } return; }
      if (f === 'att') { const v = t.value.trim(); if (!v || /^https:\/\/\S+$/.test(v)) { ED.att = v; changed(true); } return; }
      const k = t.closest('.nlb') && t.closest('.nlb').dataset.k, b = ED.blocks.find(x => x.k === k); if (!b) return;
      if (f === 'text') b.text = domMd(t);
      else if (f === 'h') { b.text = t.textContent.replace(/\s+/g, ' ').trim(); }
      else if (f === 'cap') b.cap = t.textContent.replace(/\s+/g, ' ').trim();
      changed(false);
    });
    root.addEventListener('change', e => {
      const t = e.target; if (!ED || !t.classList.contains('nl-evchk')) return;
      const b = ED.blocks.find(x => x.k === t.dataset.k); if (!b) return;
      const sk = new Set(b.skip || []); if (t.checked) sk.delete(t.dataset.key); else sk.add(t.dataset.key);
      b.skip = Array.from(sk); (b.events || []).forEach(ev => { ev.skipped = sk.has(ev.key); });
      t.closest('.nl-ev').classList.toggle('off', !t.checked);
      const tag = t.closest('.auto') && t.closest('.auto').querySelector('.tag'); if (tag && b.events) tag.firstChild.textContent = `The calendar · ${b.events.filter(x => !x.skipped).length} of ${b.events.length} events`;
      changed(false);
    });
    root.addEventListener('keydown', e => { const f = e.target.dataset && e.target.dataset.f; if ((f === 'h' || f === 'cap') && e.key === 'Enter') { e.preventDefault(); e.target.blur(); } });
    root.addEventListener('focusin', e => {
      const nb = e.target.closest && e.target.closest('.nlb'); if (nb && ED) select(nb.dataset.k);
      const t = e.target; if (t.dataset && t.dataset.f === 'text' && /^\(.*\)$/.test(t.textContent.trim())) setTimeout(() => { const r = document.createRange(); r.selectNodeContents(t); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }, 0);
    });
    root.addEventListener('focusout', e => { if (e.target.id === 'nlPaste') setTimeout(() => readBox(e.target), 30); });
    root.addEventListener('click', e => { const nb = e.target.closest('.nlb'); if (nb && ED && !e.target.closest('[data-act]') && document.getElementById('nlCard')) select(nb.dataset.k); });
    root.addEventListener('paste', e => {
      if (!ED || ED.locked) return;
      const box = e.target.closest && e.target.closest('#nlPaste'); if (box) return onPaste(e, box);
      const f = e.target.closest && e.target.closest('[data-f]'); if (!f || !f.isContentEditable) return;
      const cd = e.clipboardData; if (!cd) return;
      const files = imageFiles(cd), html = cd.getData('text/html') || '';
      if (f.dataset.f === 'text' && (files.length || /<img/i.test(html))) {   // pictures go in as their own blocks below
        e.preventDefault(); select(f.closest('.nlb').dataset.k); pasteBlocks(fromClipboard({ files, html, text: cd.getData('text/plain') })); return;
      }
      const text = cd.getData('text/plain'); if (!text) return;
      e.preventDefault(); document.execCommand('insertText', false, f.dataset.f === 'text' ? text : text.replace(/\s+/g, ' '));
    });
    root.addEventListener('dragover', e => { if (e.target.closest && e.target.closest('#nlPaste')) e.preventDefault(); });
    root.addEventListener('drop', e => {
      const box = e.target.closest && e.target.closest('#nlPaste'); if (!box || !ED) return;
      e.preventDefault(); const dt = e.dataTransfer;
      pasteBlocks(fromClipboard({ files: imageFiles(dt), html: dt.getData('text/html'), text: dt.getData('text/plain') }));
    });
  }
  // Ctrl/⌘ V anywhere on the editor (not in a field) works like the paste box.
  document.addEventListener('paste', e => {
    if (!ED || ED.locked || !document.getElementById('nlPane') || document.querySelector('.sheet')) return;
    const t = e.target; if (t.closest && (t.closest('input,textarea,[contenteditable="true"]'))) return;
    onPaste(e, null);
  });

  /* ---------- undo ---------- */
  let undoT = null;
  function undoBar(text, fn) {
    let el = document.getElementById('nlUndo'); if (el) el.remove();
    el = document.createElement('div'); el.id = 'nlUndo'; el.className = 'nl-undo'; el.innerHTML = `<span>${esc(text)}</span><button>Undo</button>`;
    document.body.appendChild(el);
    el.querySelector('button').onclick = () => { el.remove(); fn(); };
    clearTimeout(undoT); undoT = setTimeout(() => el.remove(), 7000);
  }

  /* ---------- copying for "Send from my email" (works on iPhone Safari and Android Chrome) ---------- */
  const plain = html => { const d = document.createElement('div'); d.innerHTML = html.replace(/<(p|div|li|br)[^>]*>/g, '\n$&').replace(/<img[^>]*>/g, ''); return d.textContent.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim(); };
  function execCopy(html, asText) {
    const d = document.createElement(asText ? 'textarea' : 'div');
    if (asText) d.value = html; else { d.contentEditable = 'true'; d.innerHTML = html; }
    d.setAttribute('readonly', ''); d.style.cssText = 'position:fixed;left:0;top:0;width:2px;height:2px;opacity:.01;overflow:hidden;z-index:-1;font-size:16px';
    document.body.appendChild(d);
    const sel = getSelection(); let ok = false;
    try { if (asText) { d.select(); d.setSelectionRange(0, html.length); } else { const r = document.createRange(); r.selectNodeContents(d); sel.removeAllRanges(); sel.addRange(r); } ok = document.execCommand('copy'); } catch (e) { }
    sel.removeAllRanges(); d.remove(); return ok;
  }
  /* Call straight from the tap (no waiting first), or Safari refuses. */
  function copyRich(html) {
    const txt = plain(html);
    try {
      if (window.ClipboardItem && navigator.clipboard && navigator.clipboard.write) {
        const item = new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }), 'text/plain': new Blob([txt], { type: 'text/plain' }) });
        return navigator.clipboard.write([item]).then(() => true, () => execCopy(html) || execCopy(txt, true));
      }
    } catch (e) { }
    return Promise.resolve(execCopy(html) || execCopy(txt, true));
  }
  function copyText(t) {
    try { if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t).then(() => true, () => execCopy(t, true)); } catch (e) { }
    return Promise.resolve(execCopy(t, true));
  }

  /* ---------- buttons ---------- */
  const blockOf = el => ED && ED.blocks.find(b => b.k === el.dataset.k);
  Object.assign(WH.act, {
    nlNew() {
      if (!NL) return;
      if (NL.orgs.length === 1) return start(NL.orgs[0].org);
      WH.openSheet(`<header><button class="link" data-act="close">Cancel</button><h2>Newsletter for</h2><span style="min-width:64px"></span></header><div class="list">${NL.orgs.map(o => `<button class="row" data-act="nlFor" data-org="${esc(o.org)}"><div class="main"><div class="t">${esc(o.org)}</div><div class="s">${o.count} addresses</div></div>${WH.I.chev}</button>`).join('')}</div>`);
    },
    nlFor(el) { WH.closeSheet(); setTimeout(() => start(el.dataset.org), 250); },
    nlStep(el) { if (!ED) return; const s = +el.dataset.s; if (ED.step === s) return; if (ED.dirty) save(ED); ED.step = s; draw(); window.scrollTo(0, 0); },
    nlRetrySave() { if (ED) { ED.dirty = true; ED.render = true; save(ED); } },
    nlUp(el) { move(el, -1); }, nlDown(el) { move(el, 1); },
    nlDelB(el) {
      const b = blockOf(el); if (!b) return; const i = ED.blocks.indexOf(b), ed = ED;
      ED.blocks.splice(i, 1); if (ED.sel === b.k) ED.sel = (ED.blocks[i - 1] || {}).k || null;
      redrawAll(); changed(b.t === 'tok' && b.tok === 'stake calendar');
      undoBar(b.t === 'pic' ? 'Picture removed' : b.t === 'ev' ? 'Calendar removed' : 'Removed', () => { if (ED !== ed) return; ED.blocks.splice(Math.min(i, ED.blocks.length), 0, b); ED.sel = b.k; redrawAll(b.k); changed(true); });
    },
    nlAdd(el) {
      if (!ED || ED.locked) return; const t = el.dataset.t;
      if (t === 'pic') return choose();
      if (t === 'btn') return linkForm(null);
      if (t === 'p') { const [b] = insert([{ t: 'p', text: '' }]); changed(false); setTimeout(() => { const x = $(`.nlb[data-k="${b.k}"] [data-f="text"]`); if (x) x.focus(); }, 350); return; }
      if (t === 'ev') {
        const have = ED.blocks.find(b => b.t === 'ev');
        if (have) { if (ED.step !== 1) { ED.step = 1; draw(); } const x = $(`.nlb[data-k="${have.k}"]`); if (x) { x.scrollIntoView({ block: 'center', behavior: 'smooth' }); x.classList.add('nl-flash'); } WH.toast('The calendar is already in. Here it is.'); return; }
        insert([{ t: 'h', text: 'Coming up' }, { t: 'ev', weeks: 6, skip: [] }]); changed(true); return;
      }
      if (ED.blocks.some(b => b.t === 'tok' && (b.tok === t || (t === 'birthdays' && b.tok === 'birthdays next')))) WH.toast('That part is in twice now. Remove one if you like.');
      insert([{ t: 'h', text: TOKHEAD[t] || TOKNAME[t] }, { t: 'tok', tok: t }]); changed(true);
    },
    nlBday(el) { const b = blockOf(el); if (!b || b.tok === el.dataset.v) return; b.tok = el.dataset.v; b.html = null; redraw(b); changed(true); },
    nlWeeks(el) { const b = blockOf(el); if (!b) return; b.weeks = +el.dataset.w; b.events = null; redraw(b); changed(true); },
    nlChoose() { choose(); },
    nlPicRetry(el) { const b = blockOf(el); if (b) { b.state = 'wait'; redraw(b); queue(b); } },
    nlPicSwap(el) { const b = blockOf(el); if (!b) return; choose(files => { b.file = files[0]; b.src = ''; b.local = ''; b.spare = []; queue(b); if (files.length > 1) { const list = files.slice(1).map(f => ({ t: 'pic', file: f, cap: '' })); ED.sel = b.k; insert(list).forEach(queue); } }); },
    nlBtnEdit(el) { const b = blockOf(el); if (b) linkForm(b); },
    nlAddEvent() {
      if (!ED || ED.locked) return; const org = ED.row.Organization;
      WH.form('Add an event', [{ name: 'Title', ph: 'Temple night' }, { name: 'Date', type: 'date' }, { name: 'Start', ph: '7:00 PM' }, { name: 'End', ph: '8:30 PM' }, { name: 'Place', ph: 'Relief Society room' }, { name: 'Public', label: 'On the public ward calendar', type: 'toggle' }],
        { Date: ED.row.Date || WH.ymd(WH.today()), Public: true },
        async row => {
          if (!row.Title || !row.Date) throw new Error('Add a title and a date');
          await WH.call('newsletterEvent', { id: ED.id, event: row });
          ['c:calendar', 'c:events', 'c:today'].forEach(k => WH.store.del(k));
          if (!ED.blocks.some(b => b.t === 'ev')) insert([{ t: 'h', text: 'Coming up' }, { t: 'ev', weeks: 6, skip: [] }]);
          else { const b = ED.blocks.find(x => x.t === 'ev'); b.events = null; redraw(b); }
          ED.dirty = true; changed(true);
        }, null, `<p class="foot" style="margin:0 4px 12px">It goes on the ward calendar as ${org === 'Ward' ? 'a ward event' : 'an ' + esc(org) + ' event'}, and into this newsletter.</p>`);
    },
    async nlPreview() {
      let html = ''; try { html = await freshHtml(); } catch (e) { WH.toast(e.message); return; }
      WH.openSheet(`<header><span style="min-width:64px"></span><h2>Preview on a phone</h2><button class="link r" data-act="close">Done</button></header>${phone(html)}<p class="foot" style="text-align:center">This is how it looks in email on a phone. Links open once it's sent.</p>`);
    },
    nlMine() {
      const v = ED && ED.view; if (!v) return;
      const bcc = v.emails.join(','), subj = ED.row.Subject || 'Newsletter', html = ED.html || v.html;
      const href = 'mailto:?subject=' + encodeURIComponent(subj) + (bcc.length < 1800 ? '&bcc=' + encodeURIComponent(bcc) : '');
      WH.openSheet(`<header><span style="min-width:64px"></span><h2>Send from my email</h2><button class="link r" data-act="close">Done</button></header>
        <div class="list"><button class="row" id="nl1"><span class="check" id="nl1c"></span><div class="main"><div class="t">1. Copy the newsletter</div><div class="s">With its headings, links and pictures</div></div></button>
        <button class="row" id="nl2"><span class="check" id="nl2c"></span><div class="main"><div class="t">2. Copy the ${v.emails.length} addresses</div><div class="s">Paste them into Bcc, so no one sees the others</div></div></button>
        <a class="row" href="${esc(href)}" style="text-decoration:none;color:inherit"><span class="check"></span><div class="main"><div class="t">3. Open my email</div><div class="s">Paste the newsletter into the message${bcc.length < 1800 ? '' : ' and the addresses into Bcc'}</div></div></a>
        <button class="row" id="nl4"><span class="check"></span><div class="main"><div class="t">4. Mark as sent</div><div class="s">So everyone knows it went out</div></div></button></div>
        <p class="foot">Paste with a long press › Paste (or Ctrl/⌘ V). If the pictures don't show while you write, they will when it arrives. A personal Gmail can send to about 500 addresses a day.</p>`);
      const tick = id => { const c = document.getElementById(id); if (c) c.classList.add('on'); };
      document.getElementById('nl1').onclick = () => copyRich(html).then(ok => { if (ok) tick('nl1c'); WH.toast(ok ? 'Newsletter copied. Now copy the addresses.' : 'Couldn\'t copy on this phone. Try Preview › select all › Copy.', ok); });
      document.getElementById('nl2').onclick = () => copyText(v.emails.join(', ')).then(ok => { if (ok) tick('nl2c'); WH.toast(ok ? 'Addresses copied' : 'Couldn\'t copy on this phone', ok); });
      document.getElementById('nl4').onclick = async () => { try { await WH.call('newsletterMarkSent', { id: ED.id, count: v.emails.length }); WH.closeSheet(); NL = null; ED.status = 'Sent'; ED.row['Sent on'] = WH.ymd(WH.today()); paneSend(); WH.toast('Marked as sent', true); } catch (e) { WH.toast(e.message); } };
    },
    async nlSched(el) {
      const v = ED && ED.view; if (!v) return;
      if (v.paused) { WH.toast('Emails from the ward account are turned off. Use "Send from my email" for now.'); return; }
      const dayName = d => WH.fmt(d, { weekday: 'short', month: 'short', day: 'numeric' });
      if (!confirm('Email this to ' + v.emails.length + ' people from the ward account, in ' + v.plan.length + ' parts (' + v.plan.map(b => dayName(b.date)).join(' and ') + ')? You can\'t change it while it\'s sending.')) return;
      el.disabled = true;
      try { await flush(); const r = await WH.call('newsletterSchedule', { id: ED.id }); WH.toast('Scheduled: ' + r.plan.map(b => dayName(b.date)).join(' and '), true); NL = null; ED.locked = true; paneSend(); } catch (e) { WH.toast(e.message); el.disabled = false; }
    },
    async nlCancel() {
      if (!confirm('Stop sending? Parts already sent stay sent.')) return;
      try { const r = await WH.call('newsletterCancel', { id: ED.id }); WH.toast(r.sent ? 'Stopped after ' + r.sent : 'Back to a draft you can change', true); NL = null; open(ED.id); } catch (e) { WH.toast(e.message); }
    },
    async nlDel() {
      if (!confirm('Remove this newsletter? This can\'t be undone.')) return;
      try { const id = ED.id; ED = null; await WH.call('newsletterRemove', { id }); NL = null; location.hash = '#/x/newsletter'; WH.toast('Removed', true); } catch (e) { WH.toast(e.message); }
    }
  });
  function move(el, d) {
    const b = blockOf(el); if (!b) return; const i = ED.blocks.indexOf(b), j = i + d; if (j < 0 || j >= ED.blocks.length) return;
    ED.blocks.splice(i, 1); ED.blocks.splice(j, 0, b); ED.sel = b.k;
    redrawAll(); const x = $(`.nlb[data-k="${b.k}"]`); if (x) x.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    changed(false);
  }
  function linkForm(b) {
    WH.form(b ? 'Change the link' : 'Add a link', [{ name: 'Label', label: 'Button says', ph: 'Open the flyer' }, { name: 'Link', ph: 'https://…' }], { Label: b ? b.label : '', Link: b ? b.url : '' }, async row => {
      let url = row.Link.trim(); if (/^www\./i.test(url)) url = 'https://' + url;
      if (!/^(https?:\/\/|mailto:)\S+$/i.test(url)) throw new Error('Paste a link that starts with https://');
      const label = row.Label.trim() || 'Open';
      if (b) { b.label = label; b.url = url; redraw(b); } else insert([{ t: 'btn', label, url }]);
      changed(false);
    }, null, '<p class="foot" style="margin:0 4px 12px">For a flyer, a sign-up sheet or a Google Form. To show a flyer itself, add it as a picture instead.</p>');
  }

  // for tests
  WH._nl = { toBlocks, walk, textToItems, fromClipboard, mdToHtml, domMd, runsMd, shrink, state: () => ED };
})();
