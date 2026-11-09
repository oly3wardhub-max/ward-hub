/* Administrator: who can open the Hub (and their links), settings, health. */
(function () {
  const WH = window.WH = window.WH || {}; WH.routes = WH.routes || {}; WH.act = WH.act || {}; WH.more = WH.more || [];
  const ic = p => `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const adm = () => WH.can('admin');
  WH.more.push(
    { title: 'Who can open the Hub', sub: 'Personal links and access', href: '#/x/access', icon: ic('<circle cx="10" cy="7" r="3.5"/><path d="M3.5 17c.8-3.4 3.4-5 6.5-5s5.7 1.6 6.5 5"/>'), color: '#1F3A93', order: 60, show: adm, group: 'Administrator' },
    { title: 'Settings', sub: 'Ward, Sunday, building, emails', href: '#/x/settings', icon: ic('<circle cx="10" cy="10" r="2.5"/><path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M4.7 15.3l1.4-1.4M13.9 6.1l1.4-1.4"/>'), color: '#8E8E93', order: 61, show: adm, group: 'Administrator' },
    { title: 'Health', sub: 'Nightly jobs, email allowance, activity', href: '#/x/health', icon: ic('<path d="M2.5 10h3l2-5 3 10 2-5h5"/>'), color: '#34C759', order: 62, show: adm, group: 'Administrator' }
  );
  const back = { back: '#/more', backLabel: 'More' };
  const err = e => { const b = document.getElementById('body'); if (b) b.innerHTML = WH.errorBox(e.message || e); };

  let AC = null;
  WH.routes.access = {
    view() {
      WH.screen('Who can open the Hub', '', WH.skeleton(5), Object.assign({ right: '<span class="acadd"></span>' }, back));
      WH.call('access', {}).then(d => { AC = d; draw(); }).catch(err);
    }
  };
  function draw() {
    const { esc, I, fmt } = WH;
    document.querySelectorAll('.acadd').forEach(x => x.innerHTML = `<button class="btn small" data-act="acNew">${I.plus} Add</button>`);
    const act = AC.list.filter(a => a.Status !== 'Removed');
    document.getElementById('body').innerHTML = `${AC.paused ? '<div class="list" style="margin-bottom:10px"><div class="row wrap"><div class="main"><div class="t">Emails are paused</div><div class="s">Send links by text from here. Turn emails on in Settings when you\'re ready.</div></div></div></div>' : ''}
      <div class="list">${act.map(a => `<button class="row" data-act="acOpen" data-id="${esc(a.ID)}"><div class="main"><div class="t">${esc(a.Person)}</div><div class="s">${esc((a.roles || []).join(', ') || 'member')}${a.orgs && a.orgs.length ? ' · ' + esc(a.orgs.join(', ')) : ''}${a['Last opened'] ? ' · opened ' + esc(fmt(String(a['Last opened']).slice(0, 10))) : a['Link sent'] ? ' · link sent ' + esc(fmt(a['Link sent'])) : ''}</div></div>${a.Status === 'Paused' ? '<span class="chip orange">Paused</span>' : !a.hasKey ? '<span class="chip">No link yet</span>' : ''}${I.chev}</button>`).join('')}</div>
      <p class="foot">What each person sees comes from their callings. Set a Role only to give more (for example, Building for the scheduler).</p>`;
  }
  const fields = [{ name: 'Person', list: 'people' }, { name: 'Email' }, { name: 'Phone' }, { name: 'Role', label: 'Extra role', type: 'select', options: ['Admin', 'Bishopric', 'Clerk', 'Leader', 'Teacher', 'Music', 'Building'] }, { name: 'Organizations', label: 'Extra organizations', ph: 'e.g. Primary' }, { name: 'Status', type: 'select', options: ['Active', 'Paused', 'Removed'] }, { name: 'Notes', type: 'textarea' }];
  Object.assign(WH.act, {
    async acNew() { await WH.loadNames(); WH.form('Add a person', fields, { Status: 'Active' }, async row => { await WH.call('accessSave', { row }); WH.routes.access.view(); }); },
    async acOpen(el) {
      const a = AC.list.find(x => x.ID === el.dataset.id); await WH.loadNames();
      WH.form(a.Person, fields, a, async row => { row.ID = a.ID; await WH.call('accessSave', { row }); WH.routes.access.view(); }, null,
        `<div class="btns" style="margin:0 0 8px"><button class="btn" id="acText">Text their link</button><button class="btn gray" id="acCopy">Copy link</button></div><button class="link" id="acRenew" style="font-size:15px;margin:0 4px 12px">Make a new link (the old one stops working)</button>`);
      const get = async renew => (await WH.call('linkFor', { id: a.ID, renew: !!renew, app: location.origin + location.pathname.replace(/[^/]*$/, '') }));
      document.getElementById('acText').onclick = async () => { try { const r = await get(); if (!r.phone) { await navigator.clipboard.writeText(r.text).catch(() => { }); WH.toast('No phone on file. The message is copied.'); return; } location.href = WH.smsHref([r.phone], r.text); } catch (e) { WH.toast(e.message); } };
      document.getElementById('acCopy').onclick = async () => { try { const r = await get(); await navigator.clipboard.writeText(r.link); WH.toast('Link copied', true); } catch (e) { WH.toast(e.message); } };
      document.getElementById('acRenew').onclick = async () => { if (!confirm('Make a new link for ' + a.Person + '? Their old link stops working.')) return; try { await get(true); WH.toast('New link made', true); } catch (e) { WH.toast(e.message); } };
    }
  });

  let ST = null;
  WH.routes.settings = {
    view() {
      WH.screen('Settings', '', WH.skeleton(6), back);
      WH.call('settingsList', {}).then(d => {
        ST = d; const { esc, I } = WH, by = {};
        d.settings.forEach(s => (by[s.Section || 'Other'] = by[s.Section || 'Other'] || []).push(s));
        document.getElementById('body').innerHTML = Object.keys(by).map(sec => `<div class="section-h"><span>${esc(sec)}</span></div><div class="list">${by[sec].map(s => `<button class="row" data-act="stEdit" data-k="${esc(s.Key)}"><div class="main"><div class="t" style="font-size:16px">${esc(s.Setting)}</div>${s.Help ? `<div class="s">${esc(s.Help)}</div>` : ''}</div><div class="r" style="max-width:45%;overflow:hidden;text-overflow:ellipsis;font-size:15px">${esc(s.Value || '—')}</div></button>`).join('')}</div>`).join('') + '<p class="foot">These are the same as the Settings tab in the spreadsheet.</p>';
      }).catch(err);
    }
  };
  WH.act.stEdit = el => {
    const s = ST.settings.find(x => x.Key === el.dataset.k);
    const yn = /^(Yes|No)$/i.test(s.Value) || /\(Yes\/No\)/.test(s.Setting);
    WH.form(s.Setting, [yn ? { name: 'Value', type: 'select', options: ['Yes', 'No'] } : { name: 'Value', type: String(s.Value).length > 40 ? 'textarea' : 'text' }], s, async row => {
      await WH.call('settingSave', { setting: s.Key, value: row.Value }); WH.store.del('boot'); WH.routes.settings.view();
    });
  };

  WH.routes.health = {
    view() {
      WH.screen('Health', '', WH.skeleton(4), back);
      WH.call('health', {}).then(drawHealth).catch(err);
    }
  };
  function drawHealth(d) {
    const { esc, kv } = WH;
    const jobs = Object.keys(d.jobs || {});
    document.getElementById('body').innerHTML = `<div class="list">${kv('Engine version', d.version)}${kv('Emails', d.paused ? 'Paused' : 'On')}${kv('Emails left today', d.emailQuota == null ? '—' : d.emailQuota)}${kv('Nightly jobs', d.triggers.indexOf('nightly') >= 0 ? 'On (3 AM)' : 'Not set up — run setUp')}</div>
      <div class="section-h"><span>Last night</span></div><div class="list">${jobs.length ? jobs.map(j => `<div class="row"><div class="main"><div class="t">${esc(j)}</div><div class="s">${esc(d.jobs[j].when)} · ${esc(d.jobs[j].note)}</div></div><span class="chip ${d.jobs[j].ok ? 'green' : 'red'}">${d.jobs[j].ok ? 'OK' : 'Problem'}</span></div>`).join('') : '<div class="empty">Hasn\'t run yet.</div>'}</div>
      <div class="btns"><button class="btn gray" data-act="hlRun">Run nightly jobs now</button></div>
      <div class="section-h"><span>Rows in each tab</span></div><div class="list">${Object.keys(d.counts).map(k => kv(k, d.counts[k])).join('')}</div>
      <div class="section-h"><span>Recent activity</span></div><div class="list">${d.log.map(l => `<div class="row"><div class="main"><div class="t" style="font-size:15px">${esc(l.Who)} · ${esc(l.Action)} ${esc(l.Tab)}</div><div class="s">${esc(String(l.When).replace('T', ' '))} · ${esc(l.Detail)}</div></div></div>`).join('')}</div>`;
  }
  WH.act.hlRun = async el => { el.innerHTML = '<span class="spin"></span>'; try { drawHealth(await WH.call('runJob', { job: 'nightly' })); WH.toast('Done', true); } catch (e) { WH.toast(e.message); el.textContent = 'Run nightly jobs now'; } };
})();
