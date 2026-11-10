/* Draws a sacrament meeting program: the online page members see, and the printed sheet. Shared by program.html and the app. */
window.WHProgram = (function () {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const longDate = d => { const p = String(d).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); };
  const hymn = (label, h) => h ? `<div class="pg-line"><span>${label}</span><i></i><span>#${esc(h.n)}</span></div><div class="pg-sub">${esc(h.title)}</div>` : '';
  const line = (k, v) => v ? `<div class="pg-line"><span>${esc(k)}</span><i></i><span>${esc(v)}</span></div>` : '';
  function order(p) {
    if (p.noMeeting) return `<div class="pg-center"><b>${esc(p.type)}</b><br>There is no ward sacrament meeting today.</div>`;
    let h = line('Presiding', p.presiding) + line('Conducting', p.conducting) + line('Chorister', p.chorister) + line('Organist', p.organist);
    h += '<div class="pg-gap"></div>' + hymn('Opening Hymn', p.opening) + line('Invocation', p.invocation);
    h += '<div class="pg-head">Ward and Stake Business</div>';
    h += hymn('Sacrament Hymn', p.sacrament) + '<div class="pg-head">Administration of the Sacrament</div>';
    if (p.fast) h += '<div class="pg-head">Bearing of Testimonies</div>';
    let mid = false;
    (p.items || []).forEach(it => {
      if (it.musical) h += `<div class="pg-head">${esc(it.role)}</div><div class="pg-sub">${esc(it.name)}</div>`;
      else h += line(it.role, it.name);
      if (!mid && p.intermediate && it === p.items[Math.floor(p.items.length / 2) - 1]) { h += hymn('Intermediate Hymn', p.intermediate); mid = true; }
    });
    if (p.intermediate && !mid) h += hymn('Intermediate Hymn', p.intermediate);
    h += hymn('Closing Hymn', p.closing) + line('Benediction', p.benediction);
    return h;
  }
  function side(p, qr) {
    let h = '';
    if (p.announcements && p.announcements.length) {
      h += '<div class="pg-title">Calendar for the<br><small>upcoming week</small></div>';
      let org = '';
      p.announcements.forEach(a => { if (a.org !== org) { h += `<div class="pg-org">${esc(a.org)}</div>`; org = a.org; } h += `<p>${esc(a.text)}</p>`; });
    }
    if (p.theme && (p.theme.text || p.theme.source)) h += `<div class="pg-kicker">Thought for the week</div><blockquote>${p.theme.text ? '“' + esc(p.theme.text.replace(/^[“"]|[”"]$/g, '')) + '”' : ''}<cite>— ${esc(p.theme.source)}</cite></blockquote>`;
    if (p.birthdays && p.birthdays.length) h += `<div class="pg-kicker">Happy birthday this week</div><p>${p.birthdays.map(esc).join(', ')}</p>`;
    if (p.missionaries && p.missionaries.length) {
      const mail = !qr; // email links on the online program only
      h += `<div class="pg-kicker">Serving missions</div><p>${p.missionaries.map(m => esc(m.name) + (m.mission ? ` <span class="pg-dim">· ${esc(m.mission)}</span>` : '') + (mail && m.email ? `<br><a class="pg-mail" href="mailto:${esc(m.email)}?subject=${encodeURIComponent('Hello from the ' + (p.ward || 'ward'))}">Email ${esc(m.short || m.name)}</a>` : '')).join('<br>')}</p>`;
      if (mail && p.missionaries.some(m => m.email)) h += '<p class="pg-dim">They love hearing from home. Write to them!</p>';
    }
    if (qr) { const what = ['the online program', (p.missionaries || []).some(m => m.email) ? 'emailing our missionaries' : '', (p.links || []).some(l => l.key === 'tithe') ? 'tithing declaration' : '', (p.links || []).some(l => l.key === 'meet') ? 'meeting with the bishop' : ''].filter(Boolean);
      h += `<div class="pg-qr">${qr}<div>Scan for ${what.length > 1 ? what.slice(0, -1).join(', ') + ' and ' + what[what.length - 1] : what[0]}</div></div>`; }
    if (p.footer) h += `<p class="pg-foot">${esc(p.footer)}</p>`;
    return h;
  }
  function header(p) {
    return `${p.picture ? `<img class="pg-pic" src="${esc(p.picture.src)}" alt="${esc(p.picture.title)}" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}
      <div class="pg-ward">${esc(p.ward)}</div><div class="pg-meeting">Sacrament Meeting</div><div class="pg-date">${esc(longDate(p.date))}</div><div class="pg-rule"></div>`;
  }
  const CSS = `
  .pg{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;color:#1c1c1e;line-height:1.35}
  .pg-ward{font-family:Georgia,"Times New Roman",serif;color:#1F3A93;font-size:22px;letter-spacing:2px;text-transform:uppercase;text-align:center;margin-top:10px}
  .pg-meeting{font-family:Georgia,serif;color:#1F3A93;letter-spacing:1.5px;text-transform:uppercase;text-align:center;font-size:13px}
  .pg-date{font-family:Georgia,serif;font-style:italic;text-align:center;font-size:14px;color:#555;margin-top:2px}
  .pg-rule{height:1px;background:#B08D57;width:60%;margin:10px auto 12px}
  .pg-pic{display:block;max-width:70%;max-height:260px;margin:0 auto;border-radius:6px;object-fit:cover}
  .pg-line{display:flex;align-items:baseline;gap:6px;margin:7px 0 0;font-size:15px}
  .pg-line i{flex:1;border-bottom:1px dotted #aaa;transform:translateY(-4px)}
  .pg-sub{text-align:center;font-family:Georgia,serif;font-style:italic;font-size:14px;color:#444;margin-top:1px}
  .pg-head{text-align:center;font-weight:700;color:#1F3A93;margin:14px 0 2px;font-size:15px}
  .pg-gap{height:6px}.pg-center{text-align:center;padding:20px 0}
  .pg-title{font-family:Georgia,serif;color:#1F3A93;text-transform:uppercase;letter-spacing:1.5px;text-align:center;font-size:17px;margin-bottom:6px}
  .pg-title small{font-size:13px}
  .pg-org{text-align:center;font-weight:700;color:#1F3A93;font-size:14px;margin-top:10px}
  .pg p{text-align:center;margin:3px 0 6px;font-size:14px}
  .pg-kicker{text-align:center;text-transform:uppercase;letter-spacing:1.5px;color:#B08D57;font-weight:700;font-size:12px;margin:16px 0 4px;border-top:1px solid #e3d6bf;padding-top:10px}
  .pg blockquote{margin:0;text-align:center;font-family:Georgia,serif;font-style:italic;font-size:15px}
  .pg blockquote cite{display:block;font-style:normal;font-size:12px;color:#555;margin-top:4px}
  .pg-dim{color:#777}.pg-qr{text-align:center;margin-top:16px;font-size:11px;color:#555}.pg-qr svg,.pg-qr img{width:96px;height:96px}
  .pg-foot{font-size:12px!important;color:#555}
  .pg-mail{font-size:13px}
  @media (prefers-color-scheme:dark){.pg-online{color:#f2f2f7}.pg-online .pg-ward,.pg-online .pg-meeting,.pg-online .pg-head,.pg-online .pg-org,.pg-online .pg-title{color:#8FA8FF}.pg-online .pg-sub,.pg-online .pg-date,.pg-online .pg-dim,.pg-online cite{color:#bbb}}
  .pg-print{width:7.6in;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:0 .45in;font-size:13px}
  .pg-print>div+div{border-left:1px dashed #ccc;padding-left:.35in}
  .pg-print .pg-line{font-size:13px;margin-top:5px}.pg-print .pg-sub{font-size:12px}.pg-print .pg-head{font-size:13px;margin-top:10px}.pg-print p{font-size:12px}
  .pg-print .pg-pic{max-height:2.4in}
  #print-root{display:none}@media print{@page{size:letter;margin:.45in}body.printing-program>*:not(#print-root){display:none!important}body.printing-program #print-root{display:block;color:#000}body.printing-program{background:#fff!important}}
  `;
  function online(p) {
    return `<div class="pg pg-online">${header(p)}${order(p)}<div class="pg-rule" style="margin-top:20px"></div>${side(p, '')}
      ${p.zoom ? `<p style="margin-top:18px"><a href="${esc(p.zoom)}">Join on Zoom</a></p>` : ''}${(p.links || []).map(l => `<p style="margin-top:18px"><a href="${esc(l.url)}">${esc(l.label)}</a></p>`).join('')}${p.building ? `<p style="margin-top:18px"><a href="${esc(p.building)}">Request the building</a></p>` : ''}</div>`;
  }
  function print(p, qrSvg) { return `<div class="pg pg-print"><div>${header(p)}${order(p)}</div><div>${side(p, qrSvg)}</div></div>`; }
  function qr(url) {
    if (!window.qrcode || !url) return '';
    try { const q = window.qrcode(0, 'M'); q.addData(url); q.make(); return q.createSvgTag({ cellSize: 3, margin: 0, scalable: true }); } catch (e) { return ''; }
  }
  function addCss() { if (!document.getElementById('pg-css')) { const s = document.createElement('style'); s.id = 'pg-css'; s.textContent = CSS; document.head.appendChild(s); } }
  return { online, print, qr, addCss, longDate };
})();
