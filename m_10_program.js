/* Program: preview, publish, print, share. */
(function () {
  const WH = window.WH = window.WH || {}; WH.routes = WH.routes || {}; WH.sundayExtras = WH.sundayExtras || []; WH.act = WH.act || {}; WH.more = WH.more || [];
  const appBase = () => location.origin + location.pathname.replace(/[^/]*$/, '');
  const onlineUrl = () => appBase() + 'program.html';
  let cur = null;

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
        document.getElementById('body').innerHTML = `
          <div class="list"><div class="row"><div class="main"><div class="t">Online program</div><div class="s" id="pubstate">${esc(pub)}</div></div>
          <button class="btn small" data-act="progPublish" data-date="${date}">${WH.isBish() ? 'Publish' : ''}</button></div></div>
          <div class="btns"><button class="btn gray" data-act="progPrint">Print</button><button class="btn gray" data-act="progShare">Share link</button></div>
          <p class="foot">Publishing updates the page the QR code opens. Printing uses what you see below.</p>
          <div class="section-h"><span>Preview</span></div>
          <div class="hero" style="padding:20px 18px">${WHProgram.online(cur)}</div>`;
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
    async progShare() {
      const url = onlineUrl();
      try { if (navigator.share) await navigator.share({ title: 'Sacrament meeting program', url }); else { await navigator.clipboard.writeText(url); WH.toast('Link copied', true); } } catch (e) { }
    }
  });
})();
