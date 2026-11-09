/* Program: preview, publish, print, share. */
(function () {
  const WH = window.WH = window.WH || {}; WH.routes = WH.routes || {}; WH.sundayExtras = WH.sundayExtras || []; WH.act = WH.act || {}; WH.more = WH.more || [];
  const appBase = () => location.origin + location.pathname.replace(/[^/]*$/, '');
  const onlineUrl = () => appBase() + 'program.html';
  let cur = null, pv = 'phone';
  const pvHtml = () => pv === 'phone' ? `<div class="hero" style="padding:20px 18px">${WHProgram.online(cur)}</div>`
    : `<div id="paperwrap" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.12)"><div id="paper" style="width:1056px;padding:40px;transform-origin:0 0;color:#000">${WHProgram.print(cur, WHProgram.qr(onlineUrl()))}</div></div><p class="foot">Letter paper, landscape, folded in half. Tap Print for the real thing.</p>`;
  const fitPaper = () => { const w = document.getElementById('paperwrap'), p = document.getElementById('paper'); if (!w || !p) return; const k = w.clientWidth / 1056; p.style.transform = 'scale(' + k + ')'; w.style.height = Math.ceil(p.offsetHeight * k) + 'px'; };

  WH.sundayExtras.push({ title: 'Program · publish and print', href: d => `#/sunday/${d}/program`, show: () => WH.isBish() || WH.can('music') || WH.can('clerk') });

  WH.routes.program = {
    tab: 'sunday',
    view([date]) {
      const { screen, cached, esc, skeleton, errorBox, long, nextSun } = WH;
      date = date || nextSun();
      WHProgram.addCss();
      screen('Program', esc(long(date)), skeleton(6), { back: '#/sunday/' + date, backLabel: 'Sunday' });
      cached('program:' + date, 'programPreview', { date }, d => {
        if (!d) return;
        if (d.error) { document.getElementById('body').innerHTML = errorBox(d.error); return; }
        cur = d.program;
        const S = (WH.sunCache() && WH.sunCache().date === date && WH.sunCache().sunday) || {};
        const pub = S.Published ? `Published ${new Date(S.Published).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}` : 'Not published yet';
        const zoom = (WH.S.boot.settings || {}).zoom_link || '';
        document.getElementById('body').innerHTML = `
          <div class="list"><div class="row"><div class="main"><div class="t">Online program</div><div class="s" id="pubstate">${esc(pub)}</div></div>
          <button class="btn small" data-act="progPublish" data-date="${date}">${WH.isBish() ? 'Publish' : ''}</button></div></div>
          <div class="btns"><button class="btn gray" data-act="progPrint">Print</button><button class="btn gray" data-act="progShare">Share link</button></div>
          <p class="foot">Publishing updates the page the QR code opens. 15 minutes before the meeting, the Hub publishes the latest version if anything changed.</p>
          <div class="section-h"><span>QR codes</span></div>
          <div class="list"><button class="row" data-act="qrShow" data-url="${esc(onlineUrl())}" data-name="Program"><span style="width:52px;height:52px;flex:none">${WHProgram.qr(onlineUrl())}</span><div class="main"><div class="t">Program</div><div class="s">Show full screen, save or print</div></div>${WH.I.chev}</button>
          ${zoom ? `<button class="row" data-act="qrShow" data-url="${esc(zoom)}" data-name="Zoom"><span style="width:52px;height:52px;flex:none">${WHProgram.qr(zoom)}</span><div class="main"><div class="t">Zoom</div><div class="s">For members joining from home</div></div>${WH.I.chev}</button>` : `<div class="row"><div class="main"><div class="t" style="color:var(--sub)">Zoom</div><div class="s">Add the link in Settings › Program to get its QR code</div></div></div>`}</div>
          <div class="btns"><a class="btn gray" style="text-decoration:none" href="sms:?&body=${encodeURIComponent('This Sunday\'s program: ' + onlineUrl() + (zoom ? '\nJoin on Zoom: ' + zoom : ''))}">Text ${zoom ? 'both links' : 'the link'}</a></div>
          <div class="section-h"><span>Preview</span></div>
          <div class="seg"><button class="${pv === 'phone' ? 'on' : ''}" data-act="progPv" data-v="phone">On a phone</button><button class="${pv === 'paper' ? 'on' : ''}" data-act="progPv" data-v="paper">Printed</button></div>
          <div id="pvbox">${pvHtml()}</div>`;
        if (!WH.isBish()) document.querySelector('[data-act=progPublish]').remove();
      });
    }
  };
  Object.assign(WH.act, {
    async progPublish(el) {
      const date = el.dataset.date; el.innerHTML = '<span class="spin"></span>';
      try {
        const r = await WH.call('publish', { date });
        cur = r.program; WH.store.del('c:sunday:' + date);
        document.getElementById('pubstate').textContent = 'Published just now'; el.textContent = 'Publish again'; WH.toast('Published', true);
      } catch (e) { el.textContent = 'Publish'; WH.toast(e.message); }
    },
    progPrint() {
      if (!cur) return;
      let root = document.getElementById('print-root');
      if (!root) { root = document.createElement('div'); root.id = 'print-root'; document.body.appendChild(root); }
      root.innerHTML = WHProgram.print(cur, WHProgram.qr(onlineUrl()));
      document.body.classList.add('printing-program');
      const go = () => { window.print(); setTimeout(() => document.body.classList.remove('printing-program'), 1000); };
      const imgs = root.querySelectorAll('img'); let left = imgs.length;
      if (!left) return setTimeout(go, 50);
      imgs.forEach(i => { if (i.complete) { if (--left === 0) go(); } else { i.onload = i.onerror = () => { if (--left === 0) go(); }; } });
      setTimeout(() => { if (left > 0) { left = 0; go(); } }, 2500);
    },
    progPv(el) { pv = el.dataset.v; document.querySelectorAll('[data-act=progPv]').forEach(b => b.classList.toggle('on', b === el)); document.getElementById('pvbox').innerHTML = pvHtml(); setTimeout(fitPaper, 30); },
    qrShow(el) {
      const url = el.dataset.url, name = el.dataset.name, svg = WHProgram.qr(url);
      WH.openSheet(`<header><span style="min-width:64px"></span><h2>${WH.esc(name)} QR code</h2><button class="link r" data-act="close">Done</button></header>
        <div style="background:#fff;border-radius:16px;padding:22px;margin:4px auto;max-width:360px">${svg.replace('<svg', '<svg style="width:100%;height:auto"')}</div>
        <p class="foot" style="text-align:center;word-break:break-all">${WH.esc(url)}</p>
        <div class="btns"><button class="btn" id="qrsave">Save as a picture</button><button class="btn gray" id="qrprint">Print</button></div>`);
      document.getElementById('qrsave').onclick = () => {
        const img = new Image(), c = document.createElement('canvas'); c.width = c.height = 1200;
        img.onload = () => { const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 1200, 1200); x.drawImage(img, 100, 100, 1000, 1000); c.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name.toLowerCase() + '-qr.png'; a.click(); }); };
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000"'));
      };
      document.getElementById('qrprint').onclick = () => {
        let root = document.getElementById('print-root'); if (!root) { root = document.createElement('div'); root.id = 'print-root'; document.body.appendChild(root); }
        root.innerHTML = `<div style="text-align:center;font:24pt Georgia,serif;padding-top:1in">${WH.esc(name === 'Zoom' ? 'Join sacrament meeting on Zoom' : 'Today\'s program')}<div style="width:5in;margin:.5in auto">${svg.replace('<svg', '<svg style="width:100%;height:auto"')}</div><div style="font-size:12pt">${WH.esc(url)}</div></div>`;
        document.body.classList.add('printing-program'); setTimeout(() => { window.print(); setTimeout(() => document.body.classList.remove('printing-program'), 1000); }, 60);
      };
    },
    async progShare() {
      const url = onlineUrl();
      try { if (navigator.share) await navigator.share({ title: 'Sacrament meeting program', url }); else { await navigator.clipboard.writeText(url); WH.toast('Link copied', true); } } catch (e) { }
    }
  });
})();
