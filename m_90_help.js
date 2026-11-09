/* Shortcuts on Today, and a short guide written for each calling. */
(function () {
  const WH = window.WH = window.WH || {}; WH.routes = WH.routes || {}; WH.act = WH.act || {}; WH.more = WH.more || []; WH.quick = WH.quick || []; WH.ready = WH.ready || [];
  const ic = p => `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const lead = () => WH.isBish() || WH.can('leader') || WH.can('teacher');
  WH.quick.push(
    { title: 'Text a group', href: '#/x/messages', color: '#34C759', icon: ic('<path d="M10 3c4.4 0 8 2.7 8 6.2s-3.6 6.2-8 6.2c-.8 0-1.6-.1-2.3-.3L3.5 17l1.2-3.2C3 12.6 2 11 2 9.2 2 5.7 5.6 3 10 3z"/>'), show: lead },
    { title: 'Announcement', href: '#/x/announcements', color: '#FF9500', icon: ic('<path d="M3 8v4l9 4V4L3 8z"/>'), show: () => WH.isBish() || WH.can('leader') },
    { title: 'Tasks', href: '#/x/tasks', color: '#FF3B30', icon: ic('<path d="M4 6l1.5 1.5L8 5M10.5 6.5h6M4 12l1.5 1.5L8 11M10.5 12.5h6"/>'), show: () => WH.isBish() || WH.can('leader') || WH.can('clerk') },
    { title: 'Program', href: '#/sunday/' + '' , color: '#1F3A93', icon: ic('<path d="M5 3h10v14H5zM8 7h4M8 10h4M8 13h2"/>'), show: () => WH.isBish() || WH.can('music') },
    { title: 'Lesson texts', href: '#/x/lessons', color: '#FF9500', icon: ic('<path d="M10 5c-2-1.5-4.5-1.8-7-1.3v11.5c2.5-.5 5-.2 7 1.3 2-1.5 4.5-1.8 7-1.3V3.7c-2.5-.5-5-.2-7 1.3zM10 5v11.5"/>'), show: () => !WH.isBish() && (WH.can('leader') || WH.can('teacher')) },
    { title: 'How to use', href: '#/x/help', color: '#8E8E93', icon: ic('<circle cx="10" cy="10" r="7.5"/><path d="M8 8a2 2 0 1 1 2.8 1.8c-.5.3-.8.7-.8 1.2v.5M10 14.5v.01"/>') }
  );
  WH.ready.push(() => { const p = WH.quick.find(q => q.title === 'Program'); if (p) p.href = '#/sunday/' + WH.nextSun() + '/program'; });
  WH.more.push({ title: 'How to use Ward Hub', sub: 'A short guide for your calling', href: '#/x/help', icon: ic('<circle cx="10" cy="10" r="7.5"/><path d="M8 8a2 2 0 1 1 2.8 1.8c-.5.3-.8.7-.8 1.2v.5M10 14.5v.01"/>'), color: '#8E8E93', order: 90, group: 'Help' });

  const G = {
    install: ['Put it on your Home Screen', 'iPhone: open your link in Safari, tap Share, then Add to Home Screen. Android: open it in Chrome, tap ⋮, then Install app. It opens like any other app from then on.'],
    today: ['Today', 'Start here. "Needs you" lists what\'s yours, soonest first: tasks, Sundays that need speakers, lessons you teach, things to approve. Tap any item to act on it.'],
    msgs: ['Text a group', 'More › Messages. Pick who (your whole organization, a class, a zone, a saved group), type or pick a message, and tap a button. Your phone opens Messages with the names filled in. Texts come from your own phone, so replies come to you.'],
    youth: ['Texting youth', 'Choose "Youth + parents" so a parent is always included, as youth protection asks.'],
    lessons: ['Lesson texts', 'More › Lesson texts shows this Sunday\'s lessons with a link to the lesson. Tap "Text this to the class."'],
    classes: ['Your classes', 'People › Organizations › your organization. Tap a name to move them to another class, make someone a teacher, or remove them. Next year\'s classes show under "Later".'],
    cal: ['Your calendar', 'Calendar › Add. Choose your organization, and set Repeat for a weekly activity. If one week is off, open it and tap "Not happening".'],
    ann: ['Announcements', 'More › Announcements › Add. The bishopric approves it, and it shows on the conducting sheet (and the program if you turn that on).'],
    sunday: ['Plan a Sunday', 'Sunday: swipe to the week, tap Edit for hymns and conducting, Add for speakers and prayers. "Speaker and prayer ideas" lists who hasn\'t spoken lately. Open a speaker and tap "Text an invitation" — they answer yes or no from a link.'],
    program: ['Program', 'Sunday › Program: Preview shows the paper and phone versions. The bishopric taps Publish to update the page the QR code opens; Print gives the paper copy.'],
    conduct: ['Conducting', 'Sunday › Conduct: the whole script on your phone, with the sacrament prayers. Last-minute announcements and visiting authorities can be added right there.'],
    callings: ['Calling changes', 'People › Callings › New calling change. Move it along (Extended → Sustained → Set apart). On its Sunday it appears in the conducting script. The clerk sees it on "For LCR" and marks it Recorded.'],
    kevin: ['Your week', 'Today › This week is your checklist. Tap each as you finish it. The inbox holds dates read from linked calendars and scans until you approve them.'],
    links: ['Giving people access', 'More › Who can open the Hub › tap a person › Text their link. Each link is personal; you can make a new one any time and the old one stops working.'],
    lcr: ['Keeping LCR in step', 'More › Paste from LCR each month (members, then callings). You see what will change before anything does.'],
    clerk: ['For LCR', 'People › Callings › For LCR lists each calling and release to record. Tap Recorded when it\'s in LCR.'],
    zones: ['Elders quorum zones', 'More › Elders quorum zones: change zone members and leaders. Add a turn (chairs, snow) and it rotates through the zones by itself, with a button to text this week\'s zone.'],
    teacher: ['Teaching', 'Today shows the lesson you teach next with its link. Messages lets you text your class (and their parents).'],
    meetings: ['Meetings and notes', 'More › Meetings. Tap New for a presidency meeting, youth council, or missionary or temple and family history coordination. In a meeting, tap Record: the Hub writes it down, keeps only what matters, adds notes and decisions to the agenda, turns assignments into tasks, and carries open items to the next meeting. Or paste your notes instead.'],
    ypt: ['Youth protection', 'More › Youth protection lists your presidency, advisers and teachers, with when each person\'s training expires. Tap Text to send a reminder with the training link. Today tells you when someone is due.'],
    emergency: ['Emergency plan', 'More › Emergency plan (or Today › Emergency) shows what you do first, by calling, and works without a connection once opened. In an emergency the bishopric taps Start; elders quorum and Relief Society leaders then mark every household Safe, Needs help, Urgent or Can\'t reach.'],
    emspec: ['Keeping the emergency plan', 'More › Emergency plan: tap any step to change it, or Add a step (by calling and stage, or a hazard card). Edit Where and who for gathering places and the stake contact. Practice drill runs a test check-in; use it each April during the Great Utah ShakeOut.'],
    connect: ['Getting your calendar and lists in', 'More › Calendar and lists. Pick the way your organization already works: just use the app (Calendar › Add), link the Google Calendar, Sheet or Doc you already keep (share it with the ward account first, then it updates itself every night), paste a list copied from a spreadsheet, or scan a printed page. Kevin checks what comes in from links.'],
    setupmtg: ['Setup meetings', 'Meet each president for 15 minutes with More › Calendar and lists open on their phone: send their link, ask how they keep their calendar, lessons and phone list, and link, paste or scan each one together. Then check the inbox each week, and turn on Auto-approve for sources you trust.'],
    newsletter: ['Newsletter', 'More › Newsletter › New starts from your template with the next weeks\' events already in. Paste anything people send you, whether an email, a flyer screenshot or a photo, into the paste box, and the words and pictures land as their own pieces. Untick any event that shouldn\'t go out, or add one. It saves as you go. Then Preview, and send it on a schedule, or copy it and paste it into your own email with the addresses in Bcc.'],
    permits: ['Permission forms', 'For a trip or overnight activity, turn on "Youth need permission forms" on the calendar item (or More › Permission forms › Add). Tap Text each family: parents get a personal link to fill in and sign the form on their phone, and it shows as signed here with a PDF. Paper forms still work: tap the name when one comes in.'],
    funerals: ['Funerals', 'More › Funerals › New puts it on the calendar, reserves the building and hands out the usual tasks. Fill in the program as the family decides, then Print the order of service.'],
    ask: ['Ask the Hub', 'More › Ask the Hub answers quick questions ("When is the youth temple trip?") from the calendar and plans. It sends no phone numbers or private notes.'],
    privacy: ['Privacy', 'You only see your own organization. Bishopric notes, interview purposes and who booked appointments stay with the bishop and executive secretary. Please don\'t share your link.']
  };
  WH.routes.help = {
    view() {
      const r = (WH.S.boot && WH.S.boot.me.roles) || {}, { esc } = WH;
      let keys = ['install', 'today'];
      if (r.admin) keys = keys.concat(['kevin', 'sunday', 'program', 'conduct', 'callings', 'links', 'lcr', 'msgs', 'youth', 'funerals', 'ask', 'setupmtg', 'connect', 'meetings', 'emergency', 'ypt']);
      else if (r.bishopric) keys = keys.concat(['sunday', 'program', 'conduct', 'callings', 'msgs', 'youth', 'funerals', 'ask', 'meetings', 'emergency']);
      else if (r.clerk) keys = keys.concat(['clerk', 'lcr']);
      if (r.leader && !r.bishopric) keys = keys.concat(['connect', 'msgs', 'youth', 'lessons', 'classes', 'cal', 'ann', 'meetings', 'emergency']);
      if ((WH.S.boot.me.orgs || []).indexOf('Elders Quorum') >= 0) keys.push('zones');
      if (['Relief Society', 'Elders Quorum'].some(o => (WH.S.boot.me.orgs || []).indexOf(o) >= 0)) keys.push('newsletter');
      if (['Young Women', 'Young Men', 'Primary'].some(o => (WH.S.boot.me.orgs || []).indexOf(o) >= 0)) keys.push('permits', 'ypt');
      if ((WH.S.boot.me.callings || []).some(c => /emergency/i.test(c))) keys.push('emspec');
      if (r.leader && !r.bishopric) keys.push('ask');
      if (r.teacher && !r.leader) keys = keys.concat(['teacher']);
      if (r.music && !r.bishopric) keys.push('program');
      keys.push('privacy');
      keys = [...new Set(keys)];
      WH.screen('How to use', 'Written for ' + esc(((WH.S.boot.me.callings || [])[0]) || 'you'), keys.map(k => `<div class="list" style="margin-bottom:10px"><div class="row wrap"><div class="main"><div class="t" style="font-weight:600">${esc(G[k][0])}</div><div class="s" style="color:var(--text);font-size:15px;line-height:1.45;margin-top:4px">${esc(G[k][1])}</div></div></div></div>`).join('') + '<p class="foot">Questions? Ask the executive secretary.</p>', { back: '#/more', backLabel: 'More' });
    }
  };
})();
