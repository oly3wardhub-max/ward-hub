/* Demo mode: invented people and a pretend week, so anyone can try Ward Hub without a ward's data. */
window.WardHubDemo = (function () {
  const pad = n => String(n).padStart(2, '0');
  const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const sun = new Date(today); sun.setDate(sun.getDate() + ((7 - sun.getDay()) % 7));
  const S = n => { const d = new Date(sun); d.setDate(d.getDate() + 7 * n); return ymd(d); };
  const D = n => { const d = new Date(today); d.setDate(d.getDate() + n); return ymd(d); };
  const hymns = { 2: 'The Spirit of God', 19: 'We Thank Thee, O God, for a Prophet', 85: 'How Firm a Foundation', 136: 'I Know That My Redeemer Lives', 169: 'As Now We Take the Sacrament', 193: 'I Stand All Amazed', 241: 'Count Your Blessings', 1001: 'Come, Thou Fount of Every Blessing' };
  const db = {
    Sundays: [
      { Date: S(0), Type: 'Regular', Conducting: 'Daniel Price', Presiding: 'Bishop Price', Organist: 'Grace Lin', Chorister: 'Maria Ortiz', 'Opening hymn': 2, 'Sacrament hymn': 169, 'Closing hymn': 85, Theme: 'Moroni 7:47', 'Theme text': 'Charity is the pure love of Christ.', 'Stake business': false, 'Stake visitor': '', 'High council': '' },
      { Date: S(1), Type: 'Fast & Testimony', Conducting: 'Sam Okafor', Presiding: 'Bishop Price', Organist: 'Grace Lin', Chorister: 'Maria Ortiz', 'Opening hymn': 19, 'Sacrament hymn': 193, 'Closing hymn': 241 },
      { Date: S(2), Type: 'Regular', Conducting: 'Ellen Brooks', Presiding: 'Bishop Price', Organist: 'Grace Lin', Chorister: 'Maria Ortiz', 'Opening hymn': 1001, 'Sacrament hymn': 169 },
      { Date: S(-1), Type: 'Regular', Conducting: 'Ellen Brooks', 'Opening hymn': 136, 'Sacrament hymn': 193, 'Closing hymn': 2 }
    ],
    Participants: [
      { ID: 'S1', Date: S(0), Order: 1, Role: 'Invocation', Person: 'Hannah Reyes', Status: 'Accepted' },
      { ID: 'S2', Date: S(0), Order: 2, Role: 'Youth speaker', Person: 'Owen Clark', Topic: 'Charity', Status: 'Accepted' },
      { ID: 'S3', Date: S(0), Order: 3, Role: 'Speaker', Person: 'Priya Shah', Topic: 'Charity', Status: 'Accepted' },
      { ID: 'S4', Date: S(0), Order: 4, Role: 'Musical number', Person: 'Primary children', Status: 'Accepted' },
      { ID: 'S5', Date: S(0), Order: 5, Role: 'Speaker', Person: 'Tom Becker', Topic: 'Charity', Status: 'Asked' },
      { ID: 'S6', Date: S(0), Order: 6, Role: 'Benediction', Person: 'Lucy Park', Status: 'Accepted' },
      { ID: 'S7', Date: S(2), Order: 1, Role: 'Speaker', Person: 'Noah Ellis', Status: 'Asked' }
    ],
    Announcements: [
      { ID: 'A1', Organization: 'Relief Society', Text: 'Relief Society activity Tuesday at 7:00 pm — holiday wreaths.', Status: 'Approved', 'On program': true },
      { ID: 'A2', Organization: 'Primary', Text: 'Primary program practice next Saturday at 10:00 am.', Status: 'Approved', 'On program': true },
      { ID: 'A3', Organization: 'Young Women', Text: 'Youth service project Wednesday at the food bank.', Status: 'New', 'On program': false }
    ],
    Tasks: [
      { ID: 'T1', Task: 'Order sacrament bread for the next month', Owner: 'Executive secretary', Organization: 'Ward', Due: D(2), Status: 'Not started', Source: 'Ward council' },
      { ID: 'T2', Task: 'Set up interviews for the new deacons', Owner: 'Executive secretary', Organization: 'Bishopric', Due: D(5), Status: 'In progress', Source: 'Bishopric meeting' },
      { ID: 'T3', Task: 'Reserve the cultural hall for the Christmas party', Owner: 'Executive secretary', Organization: 'Activities', Due: D(-1), Status: 'Not started', Source: 'Ward council' }
    ],
    Events: [
      { Date: D(2), Start: '7:00 PM', Title: 'Relief Society activity', Organization: 'Relief Society', Place: 'Relief Society room' },
      { Date: D(3), Start: '7:00 PM', Title: 'Youth service project', Organization: 'Young Women', Place: 'Food bank' },
      { Date: D(6), Start: '10:00 AM', Title: 'Primary program practice', Organization: 'Primary', Place: 'Chapel' }
    ],
    People: ['Daniel Price', 'Sam Okafor', 'Ellen Brooks', 'Grace Lin', 'Maria Ortiz', 'Hannah Reyes', 'Owen Clark', 'Priya Shah', 'Tom Becker', 'Lucy Park', 'Noah Ellis', 'Ava Martin', 'Ben Carter', 'Chloe Nguyen', 'David Kim']
      .map((n, i) => ({ ID: 'P' + i, Name: n, 'Sort name': n.split(' ').reverse().join(', '), Phone: '555-01' + pad(i + 10), Email: n.split(' ')[0].toLowerCase() + '@example.com', Attends: 'Yes' })),
    Callings: [
      { ID: 'C1', Organization: 'Bishopric', Calling: 'Bishop', Person: 'Daniel Price', Status: 'Serving' },
      { ID: 'C2', Organization: 'Bishopric', Calling: 'Bishopric First Counselor', Person: 'Sam Okafor', Status: 'Serving' },
      { ID: 'C3', Organization: 'Bishopric', Calling: 'Bishopric Second Counselor', Person: 'Ellen Brooks', Status: 'Serving' },
      { ID: 'C4', Organization: 'Bishopric', Calling: 'Ward Executive Secretary', Person: 'Ava Martin', Status: 'Serving' },
      { ID: 'C5', Organization: 'Relief Society', Calling: 'Relief Society President', Person: 'Chloe Nguyen', Status: 'Serving' },
      { ID: 'C6', Organization: 'Primary', Calling: 'Primary President', Person: 'Priya Shah', Status: 'Serving' }
    ]
  };
  const done = {};
  const checklist = [
    { id: 'inbox', text: 'Review the inbox (scans, linked calendars)' }, { id: 'speakers', text: "Confirm next Sunday's speakers and prayers" },
    { id: 'announce', text: 'Approve announcements for Sunday' }, { id: 'lessons', text: "Send this week's lesson texts" },
    { id: 'publish', text: 'Publish the program' }, { id: 'reminders', text: 'Text speaker and prayer reminders' }
  ];
  const tabs = ['Sundays', 'Participants', 'Announcements', 'Tasks', 'Events', 'People', 'Callings'].map(n => ({ name: n, edit: true }));
  function sunday(date) {
    const d = date || S(0);
    const s = db.Sundays.find(x => x.Date === d) || null;
    const parts = db.Participants.filter(p => p.Date === d).sort((a, b) => a.Order - b.Order);
    const hy = {}; if (s) ['Opening hymn', 'Sacrament hymn', 'Intermediate hymn', 'Closing hymn'].forEach(k => { if (s[k]) hy[k] = { n: s[k], title: hymns[s[k]] || '' }; });
    const nav = [-1, 0, 1, 2, 3, 4].map(i => ({ date: S(i), type: (db.Sundays.find(x => x.Date === S(i)) || {}).Type || 'Regular', speakers: db.Participants.filter(p => p.Date === S(i) && /speaker/i.test(p.Role)).length }));
    return { date: d, sunday: s, participants: parts, hymns: hy, announcements: db.Announcements.filter(a => a.Status === 'Approved').map(a => ({ id: a.ID, org: a.Organization, text: a.Text, onProgram: a['On program'] })), nav };
  }
  const api = {
    hello: () => ({ ward: 'Sample Ward', ready: true }),
    boot: () => ({ me: { name: 'Ava Martin', roles: { admin: 1, bishopric: 1, member: 1 }, orgs: [], callings: ['Ward Executive Secretary'] }, settings: { ward_name: 'Sample Ward', stake_name: 'Sample Stake', presiding_default: 'Bishop Price', meeting_time: '9:00 AM' }, tabs, today: ymd(today), demo: true }),
    today: () => {
      const sv = sunday(S(0));
      const needs = db.Tasks.filter(t => t.Status !== 'Done').map(t => ({ kind: 'task', id: t.ID, title: t.Task, due: t.Due, sub: t.Organization + ' · ' + t.Source, status: t.Status }));
      needs.push({ kind: 'sunday', id: S(0), due: S(0), title: 'This Sunday: 1 not confirmed', sub: 'Regular' });
      needs.push({ kind: 'sunday', id: S(1), due: S(1), title: 'Sunday ' + S(1).slice(5).replace('-', '/') + ': prayers needed', sub: 'Fast & Testimony' });
      needs.push({ kind: 'announcements', title: '1 announcement to approve', due: S(0), sub: 'Young Women' });
      needs.sort((a, b) => String(a.due).localeCompare(String(b.due)));
      const week = db.Events.map(e => ({ date: e.Date, time: e.Start, title: e.Title, org: e.Organization, place: e.Place }));
      week.push({ date: S(0), time: '12:00 PM', title: 'Ward council', org: 'Ward' }); week.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
      return { date: ymd(today), needs, week, sunday: { date: S(0), type: sv.sunday.Type, conducting: sv.sunday.Conducting, speakers: sv.participants.filter(p => /speaker|musical/i.test(p.Role)).map(p => ({ name: p.Person, role: p.Role, status: p.Status })), hymns: sv.hymns },
        checklist: checklist.map(c => ({ ...c, done: done[c.id] || '' })) };
    },
    sunday: r => sunday(r.date),
    list: r => { const out = {}; [].concat(r.tabs || r.tab).forEach(n => out[n] = (db[n] || []).map(x => ({ ...x }))); return { data: out }; },
    save: r => {
      const t = db[r.tab] = db[r.tab] || []; const key = r.tab === 'Sundays' ? 'Date' : 'ID';
      let cur = r.row[key] && t.find(x => x[key] === r.row[key]);
      if (!cur) { cur = { [key]: r.row[key] || (r.tab[0] + Math.random().toString(36).slice(2, 7)) }; t.push(cur); }
      Object.assign(cur, r.row); return { id: cur[key] };
    },
    remove: r => { const t = db[r.tab] || []; const i = t.findIndex(x => x.ID === r.id); if (i >= 0) t.splice(i, 1); return { removed: i >= 0 }; },
    check: r => { if (r.done) done[r.item] = 'You · just now'; else delete done[r.item]; return { done }; },
    link: () => ({ sent: true })
  };
  return { call: req => new Promise(res => setTimeout(() => res(Object.assign({ ok: true }, api[req.action] ? api[req.action](req) : { ok: false, error: 'Not in the demo yet' })), 120)) };
})();
