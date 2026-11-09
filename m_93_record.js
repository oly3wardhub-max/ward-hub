/* Record a meeting in the app: a few minutes of audio at a time goes to the engine to be transcribed, then one tap (or Stop) turns it into key points, agenda notes, decisions and assignments. */
(function () {
  const WH = window.WH = window.WH || {}; WH.act = WH.act || {};
  const CHUNK_MS = 4 * 60 * 1000;
  let R = null; // { id, stream, rec, part, queue, pending, failed, start, tick, wake, stopping }
  const pickMime = () => { for (const t of ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus']) if (window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) return t; return ''; };
  const b64 = blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1] || ''); r.onerror = rej; r.readAsDataURL(blob); });
  const $ = id => document.getElementById(id);
  const mmss = ms => { const s = Math.floor(ms / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

  WH.recordBox = d => {
    const ai = d.ai || 'Off', days = (WH.S.boot.settings || {}).transcript_days || 30;
    if (!d.aiOk) return `<div class="section-h big"><span>Notes from the meeting</span></div><div class="list"><div class="row wrap"><div class="main"><div class="t">Recording and automatic notes are off</div><div class="s">${/^off/i.test(ai) ? 'The executive secretary turns them on in Settings › Engine (Record and summarize meetings), with the Gemini key.' : 'Bishopric meetings aren\'t recorded on the free Gemini plan.'}</div></div></div></div>`;
    const live = R && R.id === d.meeting.ID;
    return `<div class="section-h big"><span>Notes from the meeting</span></div>
      <div class="list"><div class="row wrap"><div class="main"><div class="t" id="recstate">${live ? 'Recording…' : 'Record this meeting'}</div><div class="s" id="recsub">${live ? '' : 'The Hub writes it down, keeps only what matters, adds notes and decisions to the agenda, and turns assignments into tasks.'}</div></div>
      <button class="btn small ${live ? '' : 'red'}" data-act="${live ? 'recStop' : 'recGo'}" id="recbtn">${live ? 'Stop' : 'Record'}</button></div></div>
      <div class="btns"><button class="btn gray" data-act="recPaste">Paste notes instead</button><label class="btn gray" style="text-align:center">Upload a recording<input type="file" accept="audio/*,video/mp4" hidden id="recfile"></label></div>
      ${d.meeting.Transcript ? '<div class="btns"><button class="btn gray" data-act="recRedo">Make notes again from the recording</button><button class="btn gray" data-act="recView">See the transcript</button></div>' : ''}
      <p class="foot">Tell everyone it's being recorded. Keep this screen open and the phone plugged in. Private details (worthiness, health, money, family problems) are left out of the notes. ${/free/i.test(ai) ? 'On the free Gemini plan Google may use what is sent to improve its products, so keep confidential matters out of recorded meetings.' : ''} Transcripts are deleted after ${days} days.</p>`;
  };
  function ui(state, sub) { const s = $('recstate'), b = $('recsub'); if (s) s.textContent = state; if (b && sub != null) b.textContent = sub; }
  function send(blob) {
    if (!R || !blob.size) return;
    const n = ++R.part, id = R.id; R.pending++;
    R.queue = R.queue.then(async () => {
      const data = await b64(blob);
      for (let i = 0; i < 3; i++) { try { await WH.call('meetingAudio', { id, part: n, data, mime: blob.type || 'audio/webm' }); return; } catch (e) { if (i === 2) { R.failed++; WH.toast('Part ' + n + ' didn\'t send: ' + e.message); } else await new Promise(r => setTimeout(r, 4000 * (i + 1))); } }
    }).finally(() => { R.pending--; tickUi(); });
  }
  function segment() {
    const mime = pickMime(), opts = { audioBitsPerSecond: 32000 }; if (mime) opts.mimeType = mime;
    const rec = new MediaRecorder(R.stream, opts), chunks = [];
    rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
    rec.onstop = () => send(new Blob(chunks, { type: rec.mimeType || mime || 'audio/webm' }));
    rec.start(); R.rec = rec; R.segAt = Date.now();
  }
  function tickUi() { if (!R) return; ui(R.stopping ? 'Finishing…' : 'Recording ' + mmss(Date.now() - R.start), R.pending ? 'Sending part ' + (R.part - R.pending + 1) + '…' : 'Saved through part ' + R.part + '. Keep this screen open.'); }
  Object.assign(WH.act, {
    async recGo() {
      const d = WH.meetingNow(); if (!d) return;
      if (!navigator.mediaDevices || !window.MediaRecorder) { WH.toast('This phone\'s browser can\'t record here. Use a voice memo and "Upload a recording".'); return; }
      if (!confirm('Start recording? Let everyone know the meeting is being recorded.')) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
        R = { id: d.meeting.ID, stream, part: 0, queue: Promise.resolve(), pending: 0, failed: 0, start: Date.now() };
        segment();
        R.rot = setInterval(() => { if (R && R.rec && Date.now() - R.segAt >= CHUNK_MS) { R.rec.stop(); segment(); } }, 5000);
        R.tick = setInterval(tickUi, 1000);
        try { R.wake = await navigator.wakeLock.request('screen'); } catch (e) { }
        const b = $('recbtn'); if (b) { b.textContent = 'Stop'; b.dataset.act = 'recStop'; b.classList.remove('red'); }
        tickUi();
      } catch (e) { WH.toast('The microphone isn\'t available: ' + e.message); R = null; }
    },
    async recStop() {
      if (!R) return; R.stopping = true; clearInterval(R.rot);
      const done = new Promise(res => { const r = R.rec; const old = r.onstop; r.onstop = () => { old(); res(); }; });
      try { R.rec.stop(); } catch (e) { }
      await done; R.stream.getTracks().forEach(t => t.stop()); try { R.wake && R.wake.release(); } catch (e) { }
      ui('Finishing…', 'Sending the last part…');
      await R.queue; clearInterval(R.tick);
      const id = R.id, failed = R.failed; R = null;
      if (failed) WH.toast(failed + ' part(s) didn\'t send. The notes use the rest.');
      await analyze(id);
    },
    recPaste() {
      const d = WH.meetingNow();
      WH.openSheet(`<header><button class="link" data-act="close">Cancel</button><h2>Paste notes</h2><button class="link r" id="recgo">Make notes</button></header>
        <div class="list"><div class="field col"><textarea id="rectext" style="min-height:240px" placeholder="Paste or type the notes from the meeting. The Hub keeps what matters and fills in the agenda and assignments."></textarea></div></div>`);
      $('recgo').onclick = async () => { const t = $('rectext').value.trim(); if (!t) return; $('recgo').innerHTML = '<span class="spin"></span>'; WH.closeSheet(); await analyze(d.meeting.ID, t); };
    },
    async recRedo() { await analyze(WH.meetingNow().meeting.ID); },
    async recView() {
      try { const r = await WH.call('meetingTranscript', { id: WH.meetingNow().meeting.ID }); WH.openSheet(`<header><button class="link" id="recdel" style="color:var(--red)">Delete</button><h2>Transcript</h2><button class="link r" data-act="close">Done</button></header><div class="list"><div class="row wrap"><div class="main"><div class="s" style="color:var(--text);white-space:pre-wrap;font-size:14px">${WH.esc(r.text || 'Nothing yet.')}</div></div></div></div>`);
        $('recdel').onclick = async () => { if (!confirm('Delete the transcript now? The notes stay.')) return; await WH.call('meetingTranscriptClear', { id: WH.meetingNow().meeting.ID }); WH.closeSheet(); WH.meetingReload(); }; } catch (e) { WH.toast(e.message); }
    }
  });
  async function analyze(id, text) {
    ui('Making notes…', 'Keeping only what matters…');
    try {
      const r = await WH.call('meetingAnalyze', text ? { id, text } : { id });
      WH.toast(`${r.points} key points · ${r.notes} agenda notes · ${r.tasks} assignments${r.carried ? ' · ' + r.carried + ' carried to ' + WH.fmt(r.next) : ''}`, true);
    } catch (e) { WH.toast(e.message); }
    WH.store.del('c:today'); if (WH.meetingNow() && WH.meetingNow().meeting.ID === id) WH.meetingReload();
  }
  document.addEventListener('change', async e => {
    if (e.target.id !== 'recfile') return;
    const f = e.target.files[0], d = WH.meetingNow(); if (!f || !d) return;
    if (f.size > 14e6) { WH.toast('That recording is too large to send at once. Record in the app instead, which sends it a few minutes at a time.'); return; }
    ui('Sending the recording…', f.name);
    try { await WH.call('meetingAudio', { id: d.meeting.ID, part: 1, data: await b64(f), mime: f.type || 'audio/mp4' }); await analyze(d.meeting.ID); } catch (x) { WH.toast(x.message); ui('Record this meeting', ''); }
  });
  window.addEventListener('beforeunload', e => { if (R) { e.preventDefault(); e.returnValue = 'Recording'; } });
})();
