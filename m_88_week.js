/* Speaker and prayer reminders for Sunday, and each organization's lesson schedule. */
(function () {
  const WH = window.WH = window.WH || {}; WH.routes = WH.routes || {}; WH.act = WH.act || {}; WH.more = WH.more || []; WH.sundayExtras = WH.sundayExtras || [];
  const ic = p => `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  WH.sundayExtras.push({ title: 'Text speaker and prayer reminders', href: d => `#/x/reminders/${d}`, show: () => WH.isBish() });
  WH.more.push({ title: 'Lesson schedule', sub: 'Who teaches what, each Sunday', href: '#/x/teaching', icon: ic('<rect x="3" y="4" width="14" height="13" rx="2"/><path d="M3 8h14M7 2.5v3M13 2.5v3"/>'), color: '#FF9500', order: 11.5, show: () => WH.isBish() || WH.can('leader'), group: 'Leaders' });

  /* ---------- reminders ---------- */
  let R = null;
  WH.routes.reminders = {
    view(args) {
      const date = args && args[0] ? decodeURIComponent(args[0]) : WH.nextSun();
      WH.screen('Reminders', WH.fmt(date, { weekday: 'long', month: 'long', day: 'numeric' }), WH.skeleton(4), { back: '#/sunday/' + date, backLabel: 'Sunday' });
      WH.call('reminders', { date }).then(d => { R = d; draw(); }).catch(e => { document.getElementById('body').innerHTML = WH.errorBox(e.message); });
    }
  };
  function draw() {
    const { esc } = WH;
    document.getElementById('body').innerHTML = (R.list.length ? `<div class="list">${R.list.map(p => `<div class="row wrap"><div class="main"><div class="t">${esc(p.person)}</div><div class="s">${esc(p.role)}${p.topic ? ' · ' + esc(p.topic) : ''}${p.reminded ? ' · reminded ' + esc(WH.fmt(p.reminded)) : ''}</div></div>
      ${p.phone && WH.smsHref ? `<a class="btn small ${p.reminded ? 'gray' : ''}" style="text-decoration:none" data-act="rmText" data-id="${esc(p.id)}" href="${esc(WH.smsHref([p.phone], p.text))}">${p.reminded ? 'Again' : 'Text'}</a>` : '<span class="chip">No phone</span>'}</div>`).join('')}</div>`
      : '<div class="list"><div class="empty">No one has accepted for this Sunday yet.</div></div>') + '<p class="foot">Each text opens on your phone with the day, time and topic filled in, so replies come to you.</p>';
  }
  WH.act.rmText = el => { WH.call('reminded', { id: el.dataset.id }).then(() => { WH.store.del('c:today'); }).catch(() => { }); location.href = el.getAttribute('href'); setTimeout(() => WH.routes.reminders.view([R.date]), 900); };

  /* ---------- lesson schedule ---------- */
  let T = null, org = '', C = null;
  const addW = (s, i) => { const d = WH.pd(s); d.setDate(d.getDate() + 7 * i); return WH.ymd(d); };
  WH.routes.teaching = {
    view() {
      WH.screen('Lesson schedule', 'Who teaches what, each Sunday', WH.skeleton(5), { back: '#/more', backLabel: 'More', right: '<span class="tsadd"></span>' });
      WH.call('curriculum', {}).then(c => { C = c; if (T) drawT(); }).catch(() => { });
      WH.call('list', { tabs: ['Teaching'] }).then(d => { T = (d.data.Teaching || []); drawT(); }).catch(e => { document.getElementById('body').innerHTML = WH.errorBox(e.message); });
    }
  };
  const myOrgs = () => WH.isBish() ? ['Relief Society', 'Elders Quorum', 'Young Women', 'Young Men', 'Primary', 'Sunday School'] : (WH.S.boot.me.orgs || []);
  function drawT() {
    const { esc, I, fmt } = WH, orgs = myOrgs(); if (!org || orgs.indexOf(org) < 0) org = orgs[0] || '';
    document.querySelectorAll('.tsadd').forEach(x => x.innerHTML = `<button class="btn small" data-act="tsNew">${I.plus} Add</button>`);
    const from = addW(WH.ymd(WH.today()), -1), rows = T.filter(t => t.Organization === org && t.Date >= from).sort((a, b) => (a.Date + a.Class).localeCompare(b.Date + b.Class));
    const by = {}; rows.forEach(t => (by[t.Date] = by[t.Date] || []).push(t));
    let h = orgs.length > 1 ? `<div class="seg" style="flex-wrap:wrap">${orgs.map(o => `<button class="${o === org ? 'on' : ''}" data-act="tsOrg" data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div>` : '';
    h += planCard();
    h += Object.keys(by).length ? Object.keys(by).slice(0, 16).map(d => `<div class="section-h"><span>${esc(fmt(d, { weekday: 'short', month: 'short', day: 'numeric' }))}</span></div><div class="list">${by[d].map(t => `<button class="row" data-act="tsEdit" data-id="${esc(t.ID)}"><div class="main"><div class="t">${esc(t.Lesson || 'Lesson not set')}</div><div class="s">${esc(t.Class || '')}${t.Teacher ? ' · ' + esc(t.Teacher) : /^No classes/.test(t.Lesson || '') ? '' : ' · <span style="color:var(--orange)">no teacher</span>'}</div></div>${t.Link ? `<span class="chip blue" data-act="tsOpen" data-u="${esc(t.Link)}">Open</span>` : ''}${I.chev}</button>`).join('')}</div>`).join('')
      : '<div class="list"><div class="empty">No lessons planned yet. Tap Add, or paste a whole schedule in More › Calendar and lists.</div></div>';
    h += '<p class="foot">The Hub fills in each Sunday from the Church\'s plan and keeps it 20 weeks ahead. Anything you type in a lesson stays as you wrote it. Teachers see their lesson on Today, and it fills in Lesson texts and newsletters.</p>';
    if (WH.isBish()) h += '<div class="btns"><button class="btn gray" data-act="tsRefresh">Fill in from the Church\'s plan now</button></div>';
    document.getElementById('body').innerHTML = h;
  }
  function planCard() {
    if (!C || !C.months) return '';
    const { esc, fmt } = WH, m = C.months[0], nx = C.months[1], mon = ym => fmt(ym + '-15', { month: 'long' });
    const no = C.months.flatMap(x => x.noClass).filter(x => x.date >= WH.ymd(WH.today()));
    const noLine = no.length ? `<div class="s">No classes: ${no.map(x => esc(fmt(x.date, { month: 'short', day: 'numeric' }) + ' (' + x.why.toLowerCase() + ')')).join(', ')}</div>` : '';
    if (org === 'Young Women' || org === 'Young Men') {
      const topics = m.topics.filter(Boolean);
      return `<div class="section-h big"><span>This month in the FSY guide</span></div><div class="list">
        <div class="row wrap"><div class="main"><div class="t">${esc(mon(m.ym))}: “${esc(m.chapter)}”</div>
        <div class="s">Fast Sunday${m.fast ? ' (' + esc(fmt(m.fast, { month: 'short', day: 'numeric' })) + ')' : ''}: study the chapter${m.ym >= '2027-01' ? ' and choose an invitation' : ''} · middle Sundays: learn more${topics.length ? ' about ' + esc(topics.join(' and ')) : ''} · last Sunday: becoming a covenant ${org === 'Young Women' ? 'daughter' : 'son'} of God</div>
        <div class="s">Next: ${esc(mon(nx.ym))}, “${esc(nx.chapter)}”</div>${noLine}</div><span class="chip blue" data-act="tsOpen" data-u="${esc(m.link)}">Open</span></div></div>
        <p class="foot">Youth presidencies plan who conducts, prays and helps teach in More › Youth Sunday agendas.</p>`;
    }
    if (org === 'Sunday School' || org === 'Primary') return `<div class="list"><div class="row wrap"><div class="main"><div class="t">Come, Follow Me for Home and Church</div><div class="s">${org === 'Primary' ? 'On fast Sunday Primary may use a fast-Sunday lesson from the back of the manual.' : 'Every Sunday, 25 minutes, after sacrament meeting.'}</div>${noLine}</div>${C.cfm ? `<span class="chip blue" data-act="tsOpen" data-u="${esc(C.cfm)}">This week</span>` : ''}</div></div>`;
    if (org === 'Elders Quorum' || org === 'Relief Society') return `<div class="list"><div class="row wrap"><div class="main"><div class="t">General conference messages</div><div class="s">The presidency picks the talk for each Sunday.</div>${noLine}</div><span class="chip blue" data-act="tsOpen" data-u="${esc(C.gc)}">Talks</span></div></div>`;
    return '';
  }
  const fields = () => [{ name: 'Organization', type: 'select', options: myOrgs() }, { name: 'Date', type: 'date' }, { name: 'Class', ph: 'e.g. Gospel Doctrine, Sunbeams' }, { name: 'Teacher', list: 'people' }, { name: 'Lesson', type: 'textarea' }, { name: 'Link', ph: 'https://…' }, { name: 'Summary', type: 'textarea' }, { name: 'repeat', label: 'Same class and teacher for more Sundays', type: 'number', ph: '0' }];
  Object.assign(WH.act, {
    tsOrg(el) { org = el.dataset.o; drawT(); },
    tsOpen(el) { window.open(el.dataset.u, '_blank', 'noopener'); },
    async tsRefresh(el) { el.innerHTML = '<span class="spin"></span>'; try { const r = await WH.call('lessonPlanNow', {}); WH.toast(r.result, true); } catch (e) { WH.toast(e.message); } WH.routes.teaching.view(); },
    async tsNew() {
      await WH.loadNames(); const last = T.filter(t => t.Organization === org).sort((a, b) => b.Date.localeCompare(a.Date))[0] || {};
      const next = last.Date && last.Date >= WH.nextSun() ? addW(last.Date, 1) : WH.nextSun();
      WH.form('Add a lesson', fields(), { Organization: org, Date: next, Class: last.Class || '', Teacher: last.Teacher || '' }, async row => {
        const n = Math.min(26, +row.repeat || 0); delete row.repeat;
        for (let i = 0; i <= n; i++) { const r = Object.assign({}, row, { Date: addW(row.Date, i) }); if (i) r.Lesson = ''; await WH.call('save', { tab: 'Teaching', row: r }); }
        org = row.Organization; WH.routes.teaching.view();
      });
    },
    async tsEdit(el) {
      await WH.loadNames(); const t = T.find(x => x.ID === el.dataset.id); if (!t) return;
      WH.form('Lesson', fields().slice(0, 7), t, async row => { row.ID = t.ID; await WH.call('save', { tab: 'Teaching', row }); WH.routes.teaching.view(); },
        async () => { await WH.call('remove', { tab: 'Teaching', id: t.ID }); WH.routes.teaching.view(); });
    }
  });
})();
