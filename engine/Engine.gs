/**
 * Ward Hub v2 · Engine
 * The app (on GitHub Pages) talks to this script. The spreadsheet is the one source of truth.
 * Setup for a new ward: make an empty Google Sheet › Extensions › Apps Script › paste this file ›
 * run setUp() once › Deploy › New deployment › Web app (Execute as: Me, Who has access: Anyone).
 * Nothing here contains ward data; every ward's copy is separate.
 */
var SCHEMA = {"tabs":[{"name":"Settings","section":"Setup","cols":[["Key","key"],["Section","text"],["Setting","text"],["Value","text"],["Help","text"]],"read":["admin","bishopric"],"edit":["admin"],"scope":null,"note":"Every setting in one place. Change only the Value column.","help":["Internal name; don't change","","What it is","Change this",""]},{"name":"Access","section":"Setup","cols":[["ID","id"],["Person","person"],["Email","email"],["Phone","phone"],["Role","choice:Admin,Bishopric,Clerk,Leader,Teacher,Music,Building,Member"],["Organizations","text"],["Status","choice:Active,Paused,Removed"],["Key","secret"],["Link sent","date"],["Last opened","datetime"],["Notes","text"]],"read":["admin"],"edit":["admin"],"scope":null,"note":"Who can open the app. Access normally follows callings; this tab holds keys and overrides.","help":["","","","","Blank = from their calling","Blank = from their calling","","Personal sign-in key (made by the Hub)","","",""]},{"name":"People","section":"People","cols":[["ID","id"],["Name","text"],["Sort name","text"],["Gender","choice:M,F"],["Birth date","date"],["Phone","phone"],["Email","email"],["Parent phone","phone"],["Household","text"],["Spouse","person"],["Attends","choice:Yes,Sometimes,No,Unknown"],["Moved in","date"],["Don't ask to speak","bool"],["Don't text","bool"],["No birthday on program","bool"],["Notes","text"],["Source","choice:LCR,Manual,Moved out"],["Updated","date"]],"read":["admin","bishopric","clerk","leader","teacher"],"edit":["admin","bishopric","clerk"],"scope":null,"note":"Everyone in the ward, from LCR. Notes are bishopric-only.","help":["","First Last","Last, First","","","","","Youth only","","","","","","","","Bishopric only","",""]},{"name":"Callings","section":"People","cols":[["ID","id"],["Organization","org"],["Group","text"],["Calling","text"],["Person","person"],["Status","choice:Serving,Proposed,Extended,Sustained,Set apart,Release planned,Released,Open"],["Sustained","date"],["Set apart","date"],["Change","choice:,Call,Release,Call and release"],["Sunday","date"],["Extends","person"],["Sets apart","person"],["Recorded in LCR","date"],["Private notes","text"],["Source","choice:LCR,Hub"]],"read":["admin","bishopric","clerk","leader"],"edit":["admin","bishopric","clerk"],"scope":"Organization","note":"Every calling. Proposed changes live here until recorded in LCR.","help":["","","Class, quorum or zone","","","","","","","Sustain or release on","","","","Bishopric only",""]},{"name":"Groups","section":"People","cols":[["ID","id"],["Kind","choice:Class,Quorum,Zone,Text group,Dinner group,Cleaning,Flags,Other"],["Organization","org"],["Group","text"],["Person","person"],["Role","choice:Member,Leader,Teacher,Assistant"],["Period","text"],["Notes","text"]],"read":["admin","bishopric","clerk","leader","teacher"],"edit":["admin","bishopric","leader"],"scope":"Organization","note":"Class lists, elders quorum zones, text groups and other lists. One row per person in a group.","help":["","","","","","","e.g. 2027 Jan\u2013Jul; blank = always",""]},{"name":"Sundays","section":"Sunday","cols":[["Date","dateid"],["Type","choice:Regular,Fast & Testimony,General Conference,Stake Conference,Ward Conference,Primary Program,Christmas Program,Special Program,No meeting"],["Organizer","person"],["Conducting","person"],["Presiding","text"],["Stake visitor","text"],["High council","text"],["Stake business","bool"],["Organist","person"],["Chorister","person"],["Opening hymn","number"],["Sacrament hymn","number"],["Intermediate hymn","number"],["Closing hymn","number"],["Theme","text"],["Theme text","text"],["Picture","text"],["Published","datetime"],["Notes","text"]],"read":["admin","bishopric","clerk","music"],"edit":["admin","bishopric","music"],"scope":null,"note":"One row per Sunday. Speakers and prayers are on Participants.","help":["The Sunday","","","","","","","","","","","","","","Scripture or quote reference","","","",""]},{"name":"Participants","section":"Sunday","cols":[["ID","id"],["Date","date"],["Order","number"],["Role","choice:Invocation,Speaker,Youth speaker,High council,Musical number,Testimony,Benediction"],["Person","person"],["Topic","text"],["Minutes","number"],["Status","choice:Idea,Asked,Accepted,Declined,Done"],["Asked on","date"],["Answered on","date"],["Reminded","date"],["Thanked","date"],["Notes","text"]],"read":["admin","bishopric","clerk","music"],"edit":["admin","bishopric"],"scope":null,"note":"Everyone on a Sunday program. Speaker and prayer history comes from here.","help":["","The Sunday","","","","","","","","","","",""]},{"name":"Announcements","section":"Sunday","cols":[["ID","id"],["Organization","org"],["Text","text"],["Event date","date"],["From","date"],["Through","date"],["On program","bool"],["Status","choice:New,Approved,Declined,Done"],["Submitted by","text"],["Submitted on","date"],["Notes","text"]],"read":["admin","bishopric","clerk","leader"],"edit":["admin","bishopric","leader"],"scope":"Organization","note":"Announcements for the program and conducting sheet.","help":["","","","","First Sunday","Last Sunday","","","","",""]},{"name":"Events","section":"Calendar","cols":[["ID","id"],["Date","date"],["End date","date"],["Start","time"],["End","time"],["Title","text"],["Organization","org"],["Place","text"],["Public","bool"],["Status","choice:Approved,Inbox,Skipped,Cancelled"],["Source","text"],["Source ID","text"],["Notes","text"]],"read":["admin","bishopric","clerk","leader","teacher","member"],"edit":["admin","bishopric","leader"],"scope":"Organization","note":"One ward calendar. Linked calendars and scans land here.","help":["","","","","","","","","Shows on the public calendar","","","",""]},{"name":"Building","section":"Calendar","cols":[["ID","id"],["Date","date"],["Start","time"],["End","time"],["Rooms","text"],["For","text"],["Contact","text"],["Phone","phone"],["Email","email"],["Kind","choice:Ward,Stake,Family,Other"],["Status","choice:Requested,Approved,Declined,Cancelled"],["Requested on","datetime"],["Notes","text"]],"read":["admin","bishopric","building"],"edit":["admin","building"],"scope":null,"note":"Building reservations and requests.","help":["","","","","","Organization or family","","","","","","",""]},{"name":"Teaching","section":"Teaching","cols":[["ID","id"],["Organization","org"],["Class","text"],["Date","date"],["Teacher","text"],["Lesson","text"],["Link","link"],["Summary","text"],["Reminded","date"]],"read":["admin","bishopric","clerk","leader","teacher"],"edit":["admin","bishopric","leader"],"scope":"Organization","note":"Who teaches what, each Sunday.","help":["","","","","","","","",""]},{"name":"Meetings","section":"Leaders","cols":[["ID","id"],["Type","choice:Bishopric,Ward council,Youth council,PEC,Other"],["Date","date"],["Time","time"],["Status","choice:Planned,Held,Cancelled"],["Opening prayer","person"],["Spiritual thought","person"],["Closing prayer","person"],["Notes","text"],["Minutes sent","date"]],"read":["admin","bishopric","clerk","leader"],"edit":["admin","bishopric"],"scope":null,"note":"Meetings. Agenda items are on Agenda.","help":["","","","","","","","","",""]},{"name":"Agenda","section":"Leaders","cols":[["ID","id"],["Meeting","ref:Meetings"],["Order","number"],["Item","text"],["Lead","text"],["Minutes","number"],["Notes","text"],["Decision","text"],["Source","text"]],"read":["admin","bishopric","clerk","leader"],"edit":["admin","bishopric"],"scope":null,"note":"Agenda items and minutes for each meeting.","help":["","","","","","","","",""]},{"name":"Tasks","section":"Leaders","cols":[["ID","id"],["Task","text"],["Owner","text"],["Organization","org"],["Due","date"],["Status","choice:Not started,In progress,Waiting,Done"],["Source","text"],["Notes","text"],["Created","date"],["Done on","date"]],"read":["admin","bishopric","clerk","leader"],"edit":["admin","bishopric","clerk","leader"],"scope":"Organization","note":"Everyone's to-dos.","help":["","","Name or calling","","","","Meeting, Sunday or calling change","","",""]},{"name":"Appointments","section":"Leaders","cols":[["ID","id"],["Date","date"],["Time","time"],["Minutes","number"],["With","choice:Bishop,First counselor,Second counselor,Executive secretary,Clerk"],["Person","person"],["Purpose","text"],["Place","text"],["Status","choice:Open,Booked,Done,Cancelled,No-show"],["Source","text"],["Phone","phone"],["Notes","text"],["Calendar event","text"],["Reminded","date"]],"read":["admin","bishopric"],"edit":["admin","bishopric"],"scope":null,"note":"Interviews and appointments. Booking pages show only open or taken, never who.","help":["","","","","","","Hidden from everyone but the bishopric and Kevin","","","","","","",""]},{"name":"Training","section":"Leaders","cols":[["ID","id"],["Person","person"],["Calling","text"],["Course","text"],["Completed","date"],["Expires","date"],["Emailed 60","date"],["Texted 30","date"],["Texted 15","date"],["Notes","text"]],"read":["admin","bishopric"],"edit":["admin"],"scope":null,"note":"Youth protection training, from the LCR report.","help":["","","","Protecting Children and Youth","","","","","",""]},{"name":"Recommends","section":"Leaders","cols":[["ID","id"],["Person","person"],["Type","text"],["Expires","date"],["Updated","date"]],"read":["admin","bishopric"],"edit":["admin","bishopric"],"scope":null,"note":"Temple recommend expirations. Bishopric only.","help":["","","","",""]},{"name":"Missionaries","section":"Leaders","cols":[["ID","id"],["Name","text"],["Title","choice:Elder,Sister,Couple"],["Mission","text"],["Email","email"],["Left","date"],["Home","date"],["On program","bool"],["Notes","text"]],"read":["admin","bishopric","clerk","member"],"edit":["admin","bishopric"],"scope":null,"note":"Missionaries serving from the ward.","help":["","","","","","","Expected","",""]},{"name":"Sources","section":"Engine","cols":[["ID","id"],["Organization","org"],["Kind","choice:Google Calendar,Google Sheet,Google Doc,iCal,Upload"],["Link","link"],["Goes to","choice:Events,Teaching,Groups,People,Announcements"],["Auto-approve","bool"],["Schedule","choice:Nightly,Weekly,Manual"],["Last read","datetime"],["Result","text"]],"read":["admin"],"edit":["admin"],"scope":null,"note":"Where each organization's calendar, lists and schedules come from.","help":["","","","","","","","",""]},{"name":"Inbox","section":"Engine","cols":[["ID","id"],["Received","datetime"],["From","text"],["Kind","text"],["Summary","text"],["Data","json"],["Status","choice:New,Approved,Edited,Skipped"],["Decided by","text"],["Decided on","datetime"]],"read":["admin"],"edit":["admin"],"scope":null,"note":"Things the Hub read that need a person's OK.","help":["","","","","","What the Hub read","","",""]},{"name":"Log","section":"Engine","cols":[["When","datetime"],["Who","text"],["Action","text"],["Tab","text"],["Row","text"],["Detail","text"]],"read":["admin"],"edit":[],"scope":null,"note":"Every change, newest first. Kept 18 months.","help":["","","","","",""]},{"name":"Library","section":"Library","cols":[["ID","id"],["Kind","choice:Quote,Image,Talk prompt,Agenda template,Event template,Funeral quote,Sacrament sentiment"],["Title","text"],["Text","text"],["Source","text"],["Link","link"],["Best for","text"],["Notes","text"]],"read":["admin","bishopric","clerk","leader","music"],"edit":["admin","bishopric"],"scope":null,"note":"Quotes, pictures, talk prompts and templates.","help":["","","","","","","",""]},{"name":"Hymns","section":"Library","cols":[["Number","id"],["Title","text"],["Book","choice:Hymns,Hymns\u2014For Home and Church,Children's Songbook"]],"read":["admin","bishopric","clerk","leader","music","member"],"edit":["admin","music"],"scope":null,"note":"Hymn numbers and titles.","help":["","",""]}],"settings":[["ward_name","Ward","Ward name","","Shown at the top of the app and program"],["stake_name","Ward","Stake name","",""],["time_zone","Ward","Time zone","America/Denver",""],["meeting_time","Ward","Sacrament meeting starts","9:00 AM",""],["building_name","Ward","Building","",""],["bishop","Leaders","Bishop","","Name as on the ward list"],["exec_sec","Leaders","Executive secretary","","Runs the Hub week to week"],["clerk","Leaders","Ward clerk","",""],["presiding_default","Sunday","Presiding when no one else is chosen","",""],["high_council","Sunday","Usual high councilor","",""],["stake_presidency","Sunday","Stake presidency (comma separated)","",""],["talk_minutes","Sunday","Speaking time target (minutes)","20",""],["music_minutes","Sunday","Minutes per musical number","4",""],["due_months","Sunday","Suggest speakers after this many months","24",""],["skip_days","Sunday","Skip someone in suggestions for this many days","60",""],["program_footer","Program","Program footer","",""],["show_birthdays","Program","Show birthdays on the program","Yes",""],["show_quote","Program","Show the quote on the program","Yes",""],["show_picture","Program","Picture of the Savior on the program","Yes",""],["bishopric_weeks","Meetings","Bishopric meeting Sundays (1-5)","2,4,5",""],["council_weeks","Meetings","Ward council Sundays (1-5)","1,3",""],["council_time","Meetings","Ward council time","",""],["ypt_link","Training","Youth protection course link","https://www.churchofjesuschrist.org/callings/safety/protecting-children-and-youth?lang=eng",""],["ypt_email_days","Training","Email this many days before it expires","60",""],["ypt_text_days","Training","Kevin texts at these days","30,15",""],["bld_block_hours","Building","Family reservations: hours per block","4",""],["bld_max_open","Building","Family reservations: most open at once","2",""],["bld_weeks_ahead","Building","Family reservations: weeks ahead","8",""],["bld_holidays","Building","Holidays with family limits","Thanksgiving,Christmas Eve,Christmas,New Year's Eve,New Year's Day",""],["archive_months","Housekeeping","Keep history this many months","18",""],["archive_month","Housekeeping","Tidy-up month","January",""],["email_daily_cap","Housekeeping","Emails per day (Google limit 100)","90",""],["gemini_key","Engine","Gemini key (free tier) for reading photos and Docs","","Kept private"],["app_url","Engine","App address","",""],["api_url","Engine","Engine address (Deploy \u203a Web app URL)","","Filled in after the first deployment"],["public_calendar","Engine","Show the public calendar","Yes",""]]};
var VERSION = '2.0.0';

/* ---------------- entry points ---------------- */
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.action) return json_(handle_(p));
  return json_({ ok: true, app: 'Ward Hub', version: VERSION });
}
function doPost(e) {
  var req = {};
  try { req = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) { return json_({ ok: false, error: 'Bad request' }); }
  return json_(handle_(req));
}
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

var PUBLIC_ACTIONS = { hello: 1, link: 1 };
function handle_(req) {
  var t0 = Date.now();
  try {
    var a = String(req.action || '');
    if (!ACTIONS[a]) return { ok: false, error: 'Unknown action' };
    var me = null;
    if (!PUBLIC_ACTIONS[a]) {
      me = whoIs_(req.key);
      if (!me) return { ok: false, error: 'signin', message: 'This link has expired or was turned off. Ask the executive secretary for a new one.' };
    }
    var out = ACTIONS[a](req, me) || {};
    out.ok = out.ok !== false; out.ms = Date.now() - t0;
    if (me) touch_(me);
    return out;
  } catch (err) {
    log_('', 'error', '', '', String(err && err.stack || err).slice(0, 500));
    return { ok: false, error: String(err && err.message || err) };
  }
}

/* ---------------- schema helpers ---------------- */
function tabDef_(name) { for (var i = 0; i < SCHEMA.tabs.length; i++) if (SCHEMA.tabs[i].name === name) return SCHEMA.tabs[i]; return null; }
function ss_() { return SpreadsheetApp.getActive(); }
function tz_() { return setting_('time_zone') || ss_().getSpreadsheetTimeZone() || 'America/Denver'; }
function sheet_(name) {
  var sh = ss_().getSheetByName(name);
  if (!sh) { sh = ss_().insertSheet(name); var d = tabDef_(name); if (d) { sh.getRange(1, 1, 1, d.cols.length).setValues([d.cols.map(function (c) { return c[0]; })]); sh.setFrozenRows(1); } }
  return sh;
}
function ymd_(d) { return Utilities.formatDate(d, tz_(), 'yyyy-MM-dd'); }
function toOut_(v, type) {
  if (v instanceof Date) {
    if (type === 'time') return Utilities.formatDate(v, tz_(), 'h:mm a');
    if (type === 'datetime') return Utilities.formatDate(v, tz_(), "yyyy-MM-dd'T'HH:mm");
    return ymd_(v);
  }
  if (type === 'bool') return v === true || /^(yes|true|y|x|1)$/i.test(String(v));
  if (v === null || v === undefined) return '';
  return v;
}
function toIn_(v, type) {
  if (v === null || v === undefined) return '';
  if (type === 'bool') return (v === true || /^(yes|true|1)$/i.test(String(v))) ? 'Yes' : '';
  if ((type === 'date' || type === 'dateid') && /^\d{4}-\d\d-\d\d$/.test(String(v))) { var p = String(v).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  if (type === 'number') return v === '' ? '' : Number(v);
  if (type === 'json' && typeof v !== 'string') return JSON.stringify(v);
  return String(v).slice(0, 5000);
}

/* Read a whole tab as objects (cached until the next write to that tab). */
function rows_(name) {
  var cache = CacheService.getScriptCache(), ver = PropertiesService.getScriptProperties().getProperty('v:' + name) || '0';
  var ck = 'tab:' + name + ':' + ver;
  var hit = cache.get(ck);
  if (hit) { try { return JSON.parse(hit); } catch (e) {} }
  var d = tabDef_(name), sh = sheet_(name), last = sh.getLastRow(), n = d.cols.length;
  var out = [];
  if (last >= 2) {
    var head = sh.getRange(1, 1, 1, Math.max(n, sh.getLastColumn())).getValues()[0].map(String);
    var vals = sh.getRange(2, 1, last - 1, head.length).getValues();
    var idx = d.cols.map(function (c) { return head.indexOf(c[0]); });
    for (var r = 0; r < vals.length; r++) {
      var row = vals[r]; if (!row.some(function (x) { return x !== '' && x !== null; })) continue;
      var o = { _r: r + 2 };
      for (var c = 0; c < n; c++) o[d.cols[c][0]] = idx[c] < 0 ? '' : toOut_(row[idx[c]], d.cols[c][1]);
      out.push(o);
    }
  }
  var s = JSON.stringify(out);
  if (s.length < 95000) cache.put(ck, s, 21600);
  return out;
}
function bump_(name) { var p = PropertiesService.getScriptProperties(); p.setProperty('v:' + name, Date.now().toString(36) + Math.random().toString(36).slice(2, 6)); if (name === 'Settings') SET_CACHE_ = null; }

/* ---------------- settings ---------------- */
var SET_CACHE_ = null;
function settings_() {
  if (SET_CACHE_) return SET_CACHE_;
  var o = {}; rows_('Settings').forEach(function (r) { if (r.Key) o[r.Key] = r.Value; });
  return (SET_CACHE_ = o);
}
function setting_(k) { try { var v = settings_()[k]; return v === undefined ? '' : String(v); } catch (e) { return ''; } }
var SECRET_SETTINGS = { gemini_key: 1 };

/* ---------------- people and roles ---------------- */
function nkey_(s) { return String(s || '').toLowerCase().replace(/[^a-z]/g, ''); }
var LEAD_RX = /(president|counselor|secretary|adviser|advisor|leader|specialist|coordinator|bishop)/i;
function rolesFor_(name, override, orgsOverride) {
  var k = nkey_(name), roles = {}, orgs = {}, callings = [];
  rows_('Callings').forEach(function (c) {
    if (nkey_(c.Person) !== k || /Released|Proposed|Open/.test(c.Status)) return;
    callings.push(c.Calling);
    var cal = String(c.Calling);
    if (/^Bishop$/i.test(cal)) { roles.admin = 1; roles.bishopric = 1; }
    else if (/Bishopric .*Counselor/i.test(cal)) roles.bishopric = 1;
    else if (/Executive Secretary/i.test(cal) && c.Organization === 'Bishopric') { roles.admin = 1; roles.bishopric = 1; }
    else if (/Ward Clerk|Assistant Clerk|Membership Clerk|Finance Clerk/i.test(cal) && c.Organization === 'Bishopric') { roles.clerk = 1; roles.bishopric = 1; }
    if (/music|organist|chorister/i.test(cal)) roles.music = 1;
    if (/building|scheduler/i.test(cal)) roles.building = 1;
    if (c.Organization && c.Organization !== 'Stake' && LEAD_RX.test(cal)) { roles.leader = 1; orgs[c.Organization] = 1; }
  });
  rows_('Groups').forEach(function (g) {
    if (nkey_(g.Person) === k && g.Role === 'Teacher') { roles.teacher = 1; orgs[g.Organization] = orgs[g.Organization] || 0; }
    if (nkey_(g.Person) === k && g.Kind === 'Zone' && g.Role === 'Leader') { roles.leader = 1; }
  });
  if (override) {
    String(override).split(/\s*,\s*/).forEach(function (r) { if (r) roles[r.toLowerCase()] = 1; });
    if (roles.admin) roles.bishopric = 1;
  }
  if (orgsOverride) String(orgsOverride).split(/\s*,\s*/).forEach(function (o) { if (o) orgs[o] = 1; });
  roles.member = 1;
  return { roles: roles, orgs: Object.keys(orgs).filter(function (o) { return orgs[o]; }), teachOrgs: Object.keys(orgs), callings: callings };
}
function whoIs_(key) {
  key = String(key || '').trim();
  if (key.length < 16) return null;
  var cache = CacheService.getScriptCache(), hit = cache.get('who:' + key);
  if (hit) return JSON.parse(hit);
  var a = null;
  rows_('Access').some(function (r) { if (r.Key === key && r.Status !== 'Removed' && r.Status !== 'Paused') { a = r; return true; } return false; });
  if (!a) return null;
  var rf = rolesFor_(a.Person, a.Role, a.Organizations);
  var me = { id: a.ID, name: a.Person, email: a.Email, roles: rf.roles, orgs: rf.orgs, teachOrgs: rf.teachOrgs, callings: rf.callings, row: a._r };
  cache.put('who:' + key, JSON.stringify(me), 600);
  return me;
}
function touch_(me) {
  var cache = CacheService.getScriptCache(), k = 'touch:' + me.id;
  if (cache.get(k)) return;
  cache.put(k, '1', 3600);
  var sh = sheet_('Access'), head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var c = head.indexOf('Last opened') + 1;
  if (c > 0 && me.row) sh.getRange(me.row, c).setValue(new Date());
}
function can_(me, tabName, mode) {
  var d = tabDef_(tabName); if (!d) return false;
  var list = mode === 'edit' ? d.edit : d.read;
  for (var i = 0; i < list.length; i++) if (me.roles[list[i]]) return true;
  return false;
}
function isBishopric_(me) { return !!(me.roles.admin || me.roles.bishopric); }

/* Which rows and columns of a tab this person may see. */
var HIDDEN_COLS = { People: { Notes: 'bishopric' }, Callings: { 'Private notes': 'bishopric' }, Access: { Key: 'never' } };
function visible_(me, tabName) {
  if (!can_(me, tabName, 'read')) return [];
  var d = tabDef_(tabName), rows = rows_(tabName), bish = isBishopric_(me);
  if (!bish && d.scope && !me.roles.clerk) {
    var mine = {}; me.orgs.concat(me.teachOrgs || []).forEach(function (o) { mine[o] = 1; }); mine.Ward = 1;
    if (tabName === 'Events') mine.Stake = mine.Youth = 1;
    rows = rows.filter(function (r) { return mine[r[d.scope]] || (tabName === 'Events' && r.Public === true); });
  }
  if (tabName === 'People' && !bish && !me.roles.clerk && !me.roles.leader) {
    var names = {}; myClasses_(me).forEach(function (g) { names[nkey_(g.Person)] = 1; });
    rows = rows.filter(function (r) { return names[nkey_(r.Name)]; });
  }
  if (tabName === 'Events' && !bish && !me.roles.leader) rows = rows.filter(function (r) { return r.Status === 'Approved'; });
  var hide = HIDDEN_COLS[tabName];
  return rows.map(function (r) {
    var o = {}; for (var k in r) { if (k === '_r') continue; var h = hide && hide[k]; if (h === 'never' || (h === 'bishopric' && !bish)) continue; o[k] = r[k]; }
    return o;
  });
}
function myClasses_(me) {
  var k = nkey_(me.name), classes = {};
  var g = rows_('Groups');
  g.forEach(function (x) { if (nkey_(x.Person) === k && x.Role === 'Teacher') classes[x.Organization + '|' + x.Group] = 1; });
  return g.filter(function (x) { return classes[x.Organization + '|' + x.Group]; });
}

/* ---------------- writing ---------------- */
function save_(me, tabName, row, opts) {
  opts = opts || {};
  var d = tabDef_(tabName);
  if (!d) throw new Error('No such tab');
  if (!opts.system && !can_(me, tabName, 'edit')) throw new Error('You can view this but not change it.');
  var idCol = d.cols[0][0];
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var sh = sheet_(tabName), lastCol = Math.max(sh.getLastColumn(), d.cols.length);
    var head = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
    var cur = null;
    if (row[idCol]) rows_(tabName).some(function (r) { if (String(r[idCol]) === String(row[idCol])) { cur = r; return true; } return false; });
    if (!opts.system && d.scope && !isBishopric_(me) && !me.roles.clerk) {
      var org = row[d.scope] || (cur && cur[d.scope]);
      if (me.orgs.indexOf(org) < 0 && !(tabName === 'Tasks')) throw new Error('That belongs to another organization.');
    }
    if (!cur && d.cols[0][1] === 'id' && !row[idCol]) row[idCol] = newId_(tabName);
    var hide = HIDDEN_COLS[tabName] || {};
    var line = cur ? sh.getRange(cur._r, 1, 1, lastCol).getValues()[0] : head.map(function () { return ''; });
    d.cols.forEach(function (c) {
      var name = c[0], i = head.indexOf(name); if (i < 0) return;
      if (!(name in row)) return;
      if (hide[name] === 'never' && !opts.system) return;
      if (hide[name] === 'bishopric' && !isBishopric_(me) && !opts.system) return;
      line[i] = toIn_(row[name], c[1]);
    });
    if (cur) sh.getRange(cur._r, 1, 1, lastCol).setValues([line]);
    else sh.getRange(sh.getLastRow() + 1, 1, 1, lastCol).setValues([line]);
    bump_(tabName);
    if (tabName === 'Access' || tabName === 'Callings' || tabName === 'Groups') clearWho_();
    if (!opts.quiet) log_(me ? me.name : 'Hub', cur ? 'edit' : 'add', tabName, row[idCol], summary_(row));
    return row[idCol];
  } finally { lock.releaseLock(); }
}
function remove_(me, tabName, id) {
  var d = tabDef_(tabName);
  if (!can_(me, tabName, 'edit')) throw new Error('You can view this but not change it.');
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var cur = null; rows_(tabName).some(function (r) { if (String(r[d.cols[0][0]]) === String(id)) { cur = r; return true; } return false; });
    if (!cur) return false;
    if (d.scope && !isBishopric_(me) && me.orgs.indexOf(cur[d.scope]) < 0) throw new Error('That belongs to another organization.');
    sheet_(tabName).deleteRow(cur._r);
    bump_(tabName); log_(me.name, 'delete', tabName, id, summary_(cur));
    return true;
  } finally { lock.releaseLock(); }
}
function newId_(tabName) {
  var pre = { People: 'P', Callings: 'C', Groups: 'G', Participants: 'S', Announcements: 'A', Events: 'E', Building: 'B', Teaching: 'L', Meetings: 'MT', Agenda: 'AG', Tasks: 'T', Appointments: 'AP', Training: 'Y', Recommends: 'R', Missionaries: 'M', Sources: 'SRC', Inbox: 'IN', Library: 'Q', Access: 'U' }[tabName] || 'X';
  return pre + Utilities.getUuid().replace(/-/g, '').slice(0, 8).toUpperCase();
}
function summary_(row) { var s = []; for (var k in row) if (k !== '_r' && row[k] !== '' && s.length < 4) s.push(k + ': ' + String(row[k]).slice(0, 40)); return s.join(' · '); }
function clearWho_() { PropertiesService.getScriptProperties().setProperty('whoEpoch', String(Date.now())); var c = CacheService.getScriptCache(); rows_('Access').forEach(function (a) { if (a.Key) c.remove('who:' + a.Key); }); }
function log_(who, action, tab, id, detail) {
  try {
    var sh = sheet_('Log');
    sh.insertRowAfter(1);
    sh.getRange(2, 1, 1, 6).setValues([[new Date(), who || '', action, tab || '', String(id || ''), String(detail || '').slice(0, 300)]]);
  } catch (e) {}
}

/* ---------------- dates ---------------- */
function today_() { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function nextSunday_(from) { var d = from ? new Date(from) : today_(); d.setDate(d.getDate() + ((7 - d.getDay()) % 7)); return d; }
function addDays_(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
function parseYmd_(s) { var p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
function weekOfMonth_(d) { return Math.floor((d.getDate() - 1) / 7) + 1; }

/* ---------------- actions ---------------- */
var ACTIONS = {
  hello: function () {
    return { app: 'Ward Hub', version: VERSION, ward: setting_('ward_name') || '', ready: !!setting_('ward_name') };
  },

  /* Email me my link (only to an address already on the Access tab). */
  link: function (req) {
    var email = String(req.email || '').trim().toLowerCase();
    var cache = CacheService.getScriptCache();
    if (!email || cache.get('link:' + email)) return { sent: true };
    cache.put('link:' + email, '1', 900);
    var a = null; rows_('Access').some(function (r) { if (String(r.Email).toLowerCase() === email && r.Status !== 'Removed' && r.Status !== 'Paused') { a = r; return true; } return false; });
    if (a) { ensureKey_(a); sendLink_(a, req.app); }
    return { sent: true };
  },

  /* Everything the app needs to start: who I am, settings, which tabs I can use. */
  boot: function (req, me) {
    var s = {}, all = settings_(); for (var k in all) if (!SECRET_SETTINGS[k]) s[k] = all[k];
    var tabs = SCHEMA.tabs.filter(function (t) { return can_(me, t.name, 'read'); }).map(function (t) {
      return { name: t.name, section: t.section, cols: t.cols, help: t.help, note: t.note, edit: can_(me, t.name, 'edit'), scope: t.scope };
    });
    return { me: { name: me.name, roles: me.roles, orgs: me.orgs, callings: me.callings }, settings: s, tabs: tabs, version: VERSION, today: ymd_(today_()) };
  },

  list: function (req, me) {
    var names = [].concat(req.tabs || req.tab || []), out = {};
    names.forEach(function (n) { if (tabDef_(n)) out[n] = visible_(me, n); });
    return { data: out };
  },

  save: function (req, me) { var id = save_(me, String(req.tab), req.row || {}); return { id: id }; },
  remove: function (req, me) { return { removed: remove_(me, String(req.tab), req.id) }; },

  today: function (req, me) { return today_view_(me); },
  sunday: function (req, me) { return sunday_view_(me, req.date); },

  /* Mark one of Kevin's weekly checklist items done. */
  check: function (req, me) {
    if (!me.roles.admin) throw new Error('Only the executive secretary and bishop use the checklist.');
    var wk = weekKey_(), p = PropertiesService.getScriptProperties(), k = 'chk:' + wk;
    var done = JSON.parse(p.getProperty(k) || '{}');
    if (req.done) done[req.item] = me.name + ' · ' + Utilities.formatDate(new Date(), tz_(), 'EEE h:mm a'); else delete done[req.item];
    p.setProperty(k, JSON.stringify(done));
    return { done: done };
  },

  /* Admin: make (or remake) someone's personal link and email it. */
  sendlink: function (req, me) {
    if (!me.roles.admin) throw new Error('Only the executive secretary and bishop send links.');
    var a = null; rows_('Access').some(function (r) { if (r.ID === req.id) { a = r; return true; } return false; });
    if (!a) throw new Error('Not found');
    if (req.renew) a.Key = '';
    ensureKey_(a);
    if (req.email !== false) sendLink_(a, req.app);
    return { link: linkFor_(a, req.app) };
  }
};

function weekKey_() { var s = addDays_(today_(), -today_().getDay()); return ymd_(s); }
function ensureKey_(a) {
  if (a.Key) return a.Key;
  var key = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '').slice(0, 32);
  save_(null, 'Access', { ID: a.ID, Key: key }, { system: true, quiet: true });
  a.Key = key; return key;
}
function appUrl_(app) { return String(app || setting_('app_url') || '').replace(/[#?].*$/, ''); }
function linkFor_(a, app) {
  var api = setting_('api_url') || ScriptApp.getService().getUrl();
  return appUrl_(app) + '#k=' + a.Key + '&api=' + encodeURIComponent(api);
}
function sendLink_(a, app) {
  if (!a.Email) return;
  var ward = setting_('ward_name') || 'your ward';
  var link = linkFor_(a, app);
  MailApp.sendEmail({
    to: a.Email, subject: 'Your Ward Hub link',
    htmlBody: '<p>Hi ' + String(a.Person).split(' ')[0] + ',</p><p>Here is your personal link to the ' + ward + ' Ward Hub. Open it on your phone, then choose <b>Add to Home Screen</b> (iPhone: Share button; Android: ⋮ menu › Install app).</p>' +
      '<p><a href="' + link + '" style="display:inline-block;background:#1F2A44;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none">Open Ward Hub</a></p>' +
      '<p style="color:#666">This link is just for you. Please don\'t forward it.</p>',
    name: ward + ' Ward Hub'
  });
  save_(null, 'Access', { ID: a.ID, 'Link sent': ymd_(today_()) }, { system: true, quiet: true });
}

/* ---------------- Today ---------------- */
var CHECKLIST = [
  { id: 'inbox', day: 0, text: 'Review the inbox (scans, linked calendars)' },
  { id: 'speakers', day: 1, text: 'Confirm next Sunday\'s speakers and prayers' },
  { id: 'announce', day: 3, text: 'Approve announcements for Sunday' },
  { id: 'lessons', day: 3, text: 'Send this week\'s lesson texts' },
  { id: 'publish', day: 5, text: 'Publish the program' },
  { id: 'reminders', day: 5, text: 'Text speaker and prayer reminders' },
  { id: 'lcr', day: 1, text: 'Hand the For LCR list to the clerk' },
  { id: 'appts', day: 6, text: 'Confirm Sunday interviews' }
];
function today_view_(me) {
  var t = today_(), tY = ymd_(t), wkEnd = ymd_(addDays_(t, 7)), sun = nextSunday_(t), sunY = ymd_(sun);
  var needs = [], week = [];
  var myName = nkey_(me.name), myCallings = (me.callings || []).map(nkey_);
  if (can_(me, 'Tasks', 'read')) {
    visible_(me, 'Tasks').forEach(function (x) {
      if (x.Status === 'Done') return;
      var o = nkey_(x.Owner), mine = o && (o.indexOf(myName) >= 0 || myName.indexOf(o) >= 0 || myCallings.some(function (c) { return c && (c.indexOf(o) >= 0 || o.indexOf(c) >= 0); }));
      if (!mine && !(me.roles.admin && /executive|kevin/i.test(x.Owner))) return;
      needs.push({ kind: 'task', id: x.ID, title: x.Task, due: x.Due, sub: x.Organization + (x.Source ? ' · ' + x.Source : ''), status: x.Status });
    });
  }
  if (isBishopric_(me)) {
    var parts = rows_('Participants');
    for (var w = 0; w < 3; w++) {
      var d = ymd_(addDays_(sun, 7 * w)), S = rows_('Sundays').filter(function (s) { return s.Date === d; })[0];
      if (S && /General Conference|Stake Conference|No meeting/.test(S.Type)) continue;
      var p = parts.filter(function (x) { return x.Date === d; });
      var spk = p.filter(function (x) { return /speaker|high council/i.test(x.Role); });
      var pend = p.filter(function (x) { return x.Status === 'Asked' || x.Status === 'Idea'; });
      var hasPr = p.some(function (x) { return x.Role === 'Invocation'; }) && p.some(function (x) { return x.Role === 'Benediction'; });
      if (spk.length < 2 || pend.length || !hasPr) needs.push({ kind: 'sunday', id: d, due: d, title: (w === 0 ? 'This Sunday' : 'Sunday ' + d.slice(5).replace('-', '/')) + ': ' + (spk.length < 2 ? (2 - spk.length) + ' speaker' + (spk.length === 1 ? '' : 's') + ' needed' : pend.length ? pend.length + ' not confirmed' : 'prayers needed'), sub: S ? S.Type : '' });
    }
    var calls = rows_('Callings').filter(function (c) { return c.Source === 'Hub' && c.Status !== 'Released' && c.Status !== 'Serving' && !c['Recorded in LCR']; });
    if (calls.length) needs.push({ kind: 'callings', title: calls.length + ' calling change' + (calls.length > 1 ? 's' : '') + ' in progress', sub: calls.slice(0, 3).map(function (c) { return c.Person; }).join(', '), due: '' });
    var newAnn = rows_('Announcements').filter(function (a) { return a.Status === 'New'; });
    if (newAnn.length) needs.push({ kind: 'announcements', title: newAnn.length + ' announcement' + (newAnn.length > 1 ? 's' : '') + ' to approve', due: sunY, sub: newAnn[0].Organization });
  }
  if (me.roles.admin) {
    var inbox = rows_('Inbox').filter(function (i) { return i.Status === 'New'; }).length;
    if (inbox) needs.push({ kind: 'inbox', title: inbox + ' item' + (inbox > 1 ? 's' : '') + ' in the inbox', due: tY, sub: 'From scans and linked calendars' });
    var tr = rows_('Training').filter(function (x) { return x.Expires && x.Expires <= ymd_(addDays_(t, 30)); });
    if (tr.length) needs.push({ kind: 'training', title: tr.length + ' youth protection renewal' + (tr.length > 1 ? 's' : '') + ' due soon', due: tr[0].Expires, sub: tr.slice(0, 3).map(function (x) { return x.Person; }).join(', ') });
  }
  needs.sort(function (a, b) { return String(a.due || '9999').localeCompare(String(b.due || '9999')); });

  if (can_(me, 'Events', 'read')) visible_(me, 'Events').forEach(function (e) {
    if (e.Status !== 'Approved' || !e.Date) return;
    var end = e['End date'] || e.Date;
    if (end >= tY && e.Date <= wkEnd) week.push({ date: e.Date, time: e.Start, title: e.Title, org: e.Organization, place: e.Place });
  });
  meetingsFor_(t, 7).forEach(function (m) { if (isBishopric_(me) || (m.type === 'Ward council' && me.roles.leader)) week.push(m); });
  week.sort(function (a, b) { return (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')); });

  var sunday = null;
  if (isBishopric_(me) || me.roles.music) {
    var sv = sunday_view_(me, sunY);
    sunday = { date: sunY, type: sv.sunday ? sv.sunday.Type : 'Regular', conducting: sv.sunday ? sv.sunday.Conducting : '', speakers: sv.participants.filter(function (x) { return /speaker|high council|musical/i.test(x.Role); }).map(function (x) { return { name: x.Person, role: x.Role, status: x.Status }; }), hymns: sv.hymns };
  }
  var out = { date: tY, needs: needs, week: week, sunday: sunday };
  if (me.roles.admin) {
    var done = JSON.parse(PropertiesService.getScriptProperties().getProperty('chk:' + weekKey_()) || '{}');
    out.checklist = CHECKLIST.map(function (c) { return { id: c.id, text: c.text, day: c.day, done: done[c.id] || '' }; });
  }
  return out;
}
function meetingsFor_(from, days) {
  var out = [], bw = String(setting_('bishopric_weeks') || '').split(','), cw = String(setting_('council_weeks') || '').split(',');
  for (var i = 0; i <= days; i++) {
    var d = addDays_(from, i); if (d.getDay() !== 0) continue;
    var w = String(weekOfMonth_(d));
    if (cw.indexOf(w) >= 0) out.push({ date: ymd_(d), time: setting_('council_time'), title: 'Ward council', org: 'Ward', type: 'Ward council' });
    if (bw.indexOf(w) >= 0) out.push({ date: ymd_(d), time: '', title: 'Bishopric meeting', org: 'Bishopric', type: 'Bishopric' });
  }
  return out;
}

/* ---------------- Sunday ---------------- */
function sunday_view_(me, date) {
  var d = date && /^\d{4}-\d\d-\d\d$/.test(date) ? date : ymd_(nextSunday_());
  if (!(isBishopric_(me) || me.roles.music || me.roles.clerk)) throw new Error('Sunday planning is for the bishopric.');
  var S = rows_('Sundays').filter(function (s) { return s.Date === d; })[0] || null;
  var parts = rows_('Participants').filter(function (p) { return p.Date === d; }).sort(function (a, b) { return (+a.Order || 0) - (+b.Order || 0); });
  var hymnT = {}; rows_('Hymns').forEach(function (h) { hymnT[String(h.Number)] = h.Title; });
  var hymns = {};
  if (S) ['Opening hymn', 'Sacrament hymn', 'Intermediate hymn', 'Closing hymn'].forEach(function (k) { if (S[k]) hymns[k] = { n: S[k], title: hymnT[String(S[k])] || '' }; });
  var d21 = ymd_(addDays_(parseYmd_(d), 21));
  var ann = rows_('Announcements').filter(function (a) {
    if (a.Status !== 'Approved') return false;
    if (a['Event date'] && a['Event date'] < d) return false;
    if (a.From || a.Through) return (!a.From || a.From <= d) && (!a.Through || a.Through >= d);
    if (a['Event date']) return a['Event date'] <= d21;
    return a['Submitted on'] && a['Submitted on'] >= ymd_(addDays_(parseYmd_(d), -14)) && a['Submitted on'] <= d;
  });
  var list = [], dd = parseYmd_(d);
  for (var i = -3; i <= 4; i++) list.push(ymd_(addDays_(dd, i * 7)));
  var nav = rows_('Sundays').filter(function (s) { return list.indexOf(s.Date) >= 0; }).map(function (s) {
    var p = rows_('Participants').filter(function (x) { return x.Date === s.Date && /speaker|high council/i.test(x.Role); });
    return { date: s.Date, type: s.Type, speakers: p.length };
  });
  var gender = {}; rows_('People').forEach(function (p) { gender[nkey_(p.Name)] = p.Gender; });
  var business = rows_('Callings').filter(function (c) { return c.Sunday === d && c.Change && c.Status !== 'Released'; }).map(function (c) {
    return { person: c.Person, calling: c.Calling, org: c.Organization, change: c.Change, title: gender[nkey_(c.Person)] === 'F' ? 'Sister' : 'Brother' };
  });
  return { date: d, sunday: S, participants: parts, hymns: hymns, business: business, announcements: ann.map(function (a) { return { id: a.ID, org: a.Organization, text: a.Text, onProgram: a['On program'] }; }), nav: nav };
}

/* ---------------- setup (run once from the editor or the menu) ---------------- */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Ward Hub')
    .addItem('Set up or repair tabs', 'setUp')
    .addItem('Show my admin link', 'showMyLink')
    .addToUi();
}
/* Builds every tab with its headings and the default settings. Safe to run again: it never deletes anything. */
function setUp() {
  SCHEMA.tabs.forEach(function (t) {
    var sh = ss_().getSheetByName(t.name);
    if (!sh) sh = ss_().insertSheet(t.name);
    var lastCol = Math.max(1, sh.getLastColumn());
    var head = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
    var missing = t.cols.map(function (c) { return c[0]; }).filter(function (c) { return head.indexOf(c) < 0; });
    if (head.join('') === '') { sh.getRange(1, 1, 1, t.cols.length).setValues([t.cols.map(function (c) { return c[0]; })]); }
    else if (missing.length) { sh.getRange(1, lastCol + 1, 1, missing.length).setValues([missing]); }
    sh.setFrozenRows(1);
    try { sh.getRange(1, 1, 1, sh.getLastColumn()).setFontWeight('bold').setBackground('#1F2A44').setFontColor('#FFFFFF'); } catch (e) {}
    bump_(t.name);
  });
  var have = {}; rows_('Settings').forEach(function (r) { have[r.Key] = 1; });
  SCHEMA.settings.forEach(function (s) { if (!have[s[0]]) save_(null, 'Settings', { Key: s[0], Section: s[1], Setting: s[2], Value: s[3], Help: s[4] }, { system: true, quiet: true }); });
  var blank = ss_().getSheetByName('Sheet1'); if (blank && blank.getLastRow() === 0 && ss_().getSheets().length > 1) ss_().deleteSheet(blank);
  var me = Session.getEffectiveUser().getEmail(), a = null;
  rows_('Access').some(function (r) { if (String(r.Email).toLowerCase() === String(me).toLowerCase()) { a = r; return true; } return false; });
  if (!a) save_(null, 'Access', { Person: setting_('exec_sec') || setting_('bishop') || 'Administrator', Email: me, Role: 'Admin', Status: 'Active', Notes: 'Made by setup' }, { system: true, quiet: true });
  return 'Ready';
}
function showMyLink() {
  var me = Session.getEffectiveUser().getEmail(), a = null;
  rows_('Access').some(function (r) { if (String(r.Email).toLowerCase() === String(me).toLowerCase()) { a = r; return true; } return false; });
  if (!a) { SpreadsheetApp.getUi().alert('Run "Set up or repair tabs" first.'); return; }
  ensureKey_(a);
  var html = HtmlService.createHtmlOutput('<p style="font:14px Arial">Open this on your phone (it is your personal link):</p><textarea style="width:100%;height:90px">' + linkFor_(a) + '</textarea>').setWidth(460).setHeight(200);
  SpreadsheetApp.getUi().showModalDialog(html, 'Your Ward Hub link');
}
