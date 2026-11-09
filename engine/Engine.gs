/**
 * Ward Hub v2 · Engine
 * The app (on GitHub Pages) talks to this script. The spreadsheet is the one source of truth.
 * Setup for a new ward: make an empty Google Sheet › Extensions › Apps Script › paste this file ›
 * run setUp() once › Deploy › New deployment › Web app (Execute as: Me, Who has access: Anyone).
 * Nothing here contains ward data; every ward's copy is separate.
 */
var SCHEMA = {"tabs":[
  {"name":"Settings","section":"Setup","cols":[["Key","key"],["Section","text"],["Setting","text"],["Value","text"],["Help","text"]],"read":["admin","bishopric"],"edit":["admin"],"scope":null,"note":"Every setting in one place. Change only the Value column.","help":["Internal name; don't change","","What it is","Change this",""]},
  {"name":"Access","section":"Setup","cols":[["ID","id"],["Person","person"],["Email","email"],["Phone","phone"],["Role","choice:Admin,Bishopric,Clerk,Leader,Teacher,Music,Building,Member"],["Organizations","text"],["Status","choice:Active,Paused,Removed"],["Key","secret"],["Link sent","date"],["Last opened","datetime"],["Notes","text"]],"read":["admin"],"edit":["admin"],"scope":null,"note":"Who can open the app. Access normally follows callings; this tab holds keys and overrides.","help":["","","","","Blank = from their calling","Blank = from their calling","","Personal sign-in key (made by the Hub)","","",""]},
  {"name":"People","section":"People","cols":[["ID","id"],["Name","text"],["Sort name","text"],["Gender","choice:M,F"],["Birth date","date"],["Phone","phone"],["Email","email"],["Parent phone","phone"],["Household","text"],["Spouse","person"],["Attends","choice:Yes,Sometimes,No,Unknown"],["Moved in","date"],["Don't ask to speak","bool"],["Don't text","bool"],["No birthday on program","bool"],["Notes","text"],["Source","choice:LCR,Manual,Moved out"],["Updated","date"]],"read":["admin","bishopric","clerk","leader","teacher"],"edit":["admin","bishopric","clerk"],"scope":null,"note":"Everyone in the ward, from LCR. Notes are bishopric-only. Leaders see adults and their own classes.","help":["","First Last","Last, First","","","","","Youth only","","","","","","","","Bishopric only","",""]},
  {"name":"Callings","section":"People","cols":[["ID","id"],["Organization","org"],["Group","text"],["Calling","text"],["Person","person"],["Status","choice:Serving,Proposed,Extended,Sustained,Set apart,Release planned,Released,Open"],["Sustained","date"],["Set apart","date"],["Change","choice:,Call,Release,Call and release"],["Sunday","date"],["Extends","person"],["Sets apart","person"],["Recorded in LCR","date"],["Private notes","text"],["Source","choice:LCR,Hub"]],"read":["admin","bishopric","clerk","leader"],"edit":["admin"],"scope":"Organization","note":"Every calling. Proposed changes live here until recorded in LCR.","help":["","","Class, quorum or zone","","","","","","","Sustain or release on","","","","Bishopric only",""]},
  {"name":"Groups","section":"People","cols":[["ID","id"],["Kind","choice:Class,Quorum,Zone,Text group,Dinner group,Cleaning,Flags,Other"],["Organization","org"],["Group","text"],["Person","person"],["Role","choice:Member,Leader,Teacher,Assistant"],["Period","text"],["Notes","text"]],"read":["admin","bishopric","clerk","leader","teacher"],"edit":["admin","bishopric","leader"],"scope":"Organization","note":"Class lists, elders quorum zones, text groups and other lists. One row per person in a group.","help":["","","","","","","e.g. 2027 Jan\u2013Jul; blank = always",""]},
  {"name":"Sundays","section":"Sunday","cols":[["Date","dateid"],["Type","choice:Regular,Fast & Testimony,General Conference,Stake Conference,Ward Conference,Primary Program,Christmas Program,Special Program,No meeting"],["Organizer","person"],["Conducting","person"],["Presiding","text"],["Stake visitor","text"],["High council","text"],["Stake business","bool"],["Organist","person"],["Chorister","person"],["Opening hymn","number"],["Sacrament hymn","number"],["Intermediate hymn","number"],["Closing hymn","number"],["Theme","text"],["Theme text","text"],["Picture","text"],["Published","datetime"],["Notes","text"]],"read":["admin","bishopric","clerk","music"],"edit":["admin","bishopric","music"],"scope":null,"note":"One row per Sunday. Speakers and prayers are on Participants.","help":["The Sunday","","","","","","","","","","","","","","Scripture or quote reference","","","",""]},
  {"name":"Participants","section":"Sunday","cols":[["ID","id"],["Date","date"],["Order","number"],["Role","choice:Invocation,Speaker,Youth speaker,High council,Musical number,Testimony,Benediction"],["Person","person"],["Topic","text"],["Minutes","number"],["Status","choice:Idea,Asked,Accepted,Declined,Done"],["Asked on","date"],["Answered on","date"],["Reminded","date"],["Thanked","date"],["Notes","text"]],"read":["admin","bishopric","clerk","music"],"edit":["admin","bishopric"],"scope":null,"note":"Everyone on a Sunday program. Speaker and prayer history comes from here.","help":["","The Sunday","","","","","","","","","","",""]},
  {"name":"Announcements","section":"Sunday","cols":[["ID","id"],["Organization","org"],["Text","text"],["Event date","date"],["From","date"],["Through","date"],["On program","bool"],["Status","choice:New,Approved,Declined,Done"],["Submitted by","text"],["Submitted on","date"],["Notes","text"]],"read":["admin","bishopric","clerk","leader"],"edit":["admin","bishopric","leader"],"scope":"Organization","note":"Announcements for the program and conducting sheet.","help":["","","","","First Sunday","Last Sunday","","","","",""]},
  {"name":"Events","section":"Calendar","cols":[["ID","id"],["Date","date"],["End date","date"],["Start","time"],["End","time"],["Title","text"],["Organization","org"],["Place","text"],["Public","bool"],["Status","choice:Approved,Inbox,Skipped,Cancelled"],["Repeat","choice:,Weekly,Every other week,Monthly (same weekday)"],["Until","date"],["Skip","text"],["Source","text"],["Source ID","text"],["Notes","text"],["Permission form","bool"]],"read":["admin","bishopric","clerk","leader","teacher","member"],"edit":["admin","bishopric","leader"],"scope":"Organization","note":"One ward calendar. Linked calendars and scans land here.","help":["","","","","","","","","Shows on the public calendar","","","Last date it repeats","Dates it doesn't happen, comma separated","","","","Youth need a signed permission form"]},
  {"name":"Building","section":"Calendar","cols":[["ID","id"],["Date","date"],["Start","time"],["End","time"],["Rooms","text"],["For","text"],["Contact","text"],["Phone","phone"],["Email","email"],["Kind","choice:Ward,Stake,Family,Other"],["Purpose","text"],["Status","choice:Requested,Approved,Declined,Cancelled"],["Requested on","datetime"],["Decided by","text"],["Notes","text"]],"read":["admin","bishopric","building"],"edit":["admin","building"],"scope":null,"note":"Building reservations and requests.","help":["","","","","","Organization or family","","","","","","","","",""]},
  {"name":"Teaching","section":"Teaching","cols":[["ID","id"],["Organization","org"],["Class","text"],["Date","date"],["Teacher","text"],["Lesson","text"],["Link","link"],["Summary","text"],["Reminded","date"]],"read":["admin","bishopric","clerk","leader","teacher"],"edit":["admin","bishopric","leader"],"scope":"Organization","note":"Who teaches what, each Sunday.","help":["","","","","","","","",""]},
  {"name":"Meetings","section":"Leaders","cols":[["ID","id"],["Type","choice:Bishopric,Ward council,Youth council,PEC,Other"],["Date","date"],["Time","time"],["Status","choice:Planned,Held,Cancelled"],["Opening prayer","person"],["Spiritual thought","person"],["Closing prayer","person"],["Notes","text"],["Minutes sent","date"]],"read":["admin","bishopric","clerk"],"edit":["admin","bishopric"],"scope":null,"note":"Meetings. Agenda items are on Agenda.","help":["","","","","","","","","",""]},
  {"name":"Agenda","section":"Leaders","cols":[["ID","id"],["Meeting","ref:Meetings"],["Order","number"],["Item","text"],["Lead","text"],["Minutes","number"],["Notes","text"],["Decision","text"],["Source","text"]],"read":["admin","bishopric","clerk"],"edit":["admin","bishopric"],"scope":null,"note":"Agenda items and minutes for each meeting.","help":["","","","","","","","",""]},
  {"name":"Tasks","section":"Leaders","cols":[["ID","id"],["Task","text"],["Owner","text"],["Organization","org"],["Due","date"],["Status","choice:Not started,In progress,Waiting,Done"],["Source","text"],["Notes","text"],["Created","date"],["Done on","date"]],"read":["admin","bishopric","clerk","leader"],"edit":["admin","bishopric","clerk","leader"],"scope":"Organization","note":"Everyone's to-dos.","help":["","","Name or calling","","","","Meeting, Sunday or calling change","","",""]},
  {"name":"Appointments","section":"Leaders","cols":[["ID","id"],["Date","date"],["Time","time"],["Minutes","number"],["With","choice:Bishop,First counselor,Second counselor,Executive secretary,Clerk"],["Person","person"],["Purpose","text"],["Place","text"],["Status","choice:Open,Booked,Done,Cancelled,No-show"],["Source","text"],["Phone","phone"],["Notes","text"],["Calendar event","text"],["Reminded","date"]],"read":["admin"],"edit":["admin","bishopric"],"scope":null,"note":"Interviews and appointments. Booking pages show only open or taken, never who. Counselors see names only for their own.","help":["","","","","","","Hidden from everyone but the bishopric and Kevin","","","","","","",""]},
  {"name":"Training","section":"Leaders","cols":[["ID","id"],["Person","person"],["Calling","text"],["Course","text"],["Completed","date"],["Expires","date"],["Emailed 60","date"],["Texted 30","date"],["Texted 15","date"],["Notes","text"]],"read":["admin","bishopric"],"edit":["admin"],"scope":null,"note":"Youth protection training, from the LCR report.","help":["","","","Protecting Children and Youth","","","","","",""]},
  {"name":"Recommends","section":"Leaders","cols":[["ID","id"],["Person","person"],["Type","text"],["Expires","date"],["Updated","date"]],"read":["admin","bishopric"],"edit":["admin","bishopric"],"scope":null,"note":"Temple recommend expirations. Bishopric only.","help":["","","","",""]},
  {"name":"Permissions","section":"Calendar","cols":[["ID","id"],["Event","text"],["Date","date"],["Title","text"],["Organization","org"],["Person","person"],["Received","bool"],["Received on","date"],["Notes","text"]],"read":["admin","bishopric"],"edit":["admin","bishopric"],"scope":null,"note":"Permission and medical release forms turned in for activities and trips. Leaders use it from the app.","help":["","Calendar item ID","","","","Youth or child","","",""]},
  {"name":"Newsletters","section":"Leaders","cols":[["ID","id"],["Organization","org"],["Date","date"],["Subject","text"],["Intro","text"],["Items","text"],["Include calendar","bool"],["Attachment","link"],["Status","choice:Draft,Scheduled,Sending,Sent"],["Sent on","date"],["Sent to","number"],["Send plan","json"],["Notes","text"]],"read":["admin","bishopric","leader"],"edit":["admin","bishopric","leader"],"scope":"Organization","note":"Organization newsletters (Relief Society first).","help":["","","","","","A line starting with # is a heading; [lessons], [birthdays], [stake calendar], [ward calendar] and [new members] fill themselves in","","A link to the stake memo or a flyer","","","","Which addresses go on which day (made by the Hub)",""]},
  {"name":"Funerals","section":"Leaders","cols":[["ID","id"],["Name","text"],["Date","date"],["Time","time"],["Place","text"],["Viewing","text"],["Family contact","text"],["Family phone","phone"],["Presiding","text"],["Conducting","text"],["Organist","text"],["Chorister","text"],["Family prayer","text"],["Opening hymn","text"],["Invocation","text"],["Life sketch","text"],["Speakers","text"],["Musical numbers","text"],["Closing hymn","text"],["Benediction","text"],["Dedication of the grave","text"],["Burial","text"],["Luncheon","text"],["Status","choice:Planning,Held"],["Notes","text"]],"read":["admin","bishopric","clerk"],"edit":["admin","bishopric"],"scope":null,"note":"Funeral planning and the order of service.","help":["","Who passed away","","","","e.g. 9:30\u201310:30 AM, Relief Society room","","","","","","","","","","","One per line","One per line","","","","","","",""]},
  {"name":"Emergency","section":"Emergency","cols":[["ID","id"],["Phase","choice:Right away,First hours,First days,Before,Info"],["Role","text"],["Order","number"],["Title","text"],["Text","text"],["Phone","phone"],["Link","link"],["Notes","text"]],"read":["admin","bishopric","clerk","leader","teacher"],"edit":["admin","bishopric"],"scope":null,"note":"The ward emergency plan, by role. Opens on phones even without a connection once it has been opened once.","help":["","","Everyone, Bishop, Bishopric, Executive secretary, Clerk, Elders quorum, Relief Society, Ministering, Youth leaders, Primary, Teachers, Emergency specialist","","","What to do","","",""]},
  {"name":"Check-ins","section":"Emergency","cols":[["ID","id"],["Event","text"],["Household","text"],["Status","choice:Safe,Needs help,Can't reach"],["Needs","text"],["By","text"],["When","datetime"]],"read":["admin","bishopric"],"edit":["admin","bishopric"],"scope":null,"note":"Who has been accounted for in an emergency. Elders quorum and Relief Society leaders mark households from the app.","help":["","Which emergency","","","Medical, shelter, food, utilities\u2026","",""]},
  {"name":"Missionaries","section":"Leaders","cols":[["ID","id"],["Name","text"],["Title","choice:Elder,Sister,Couple"],["Mission","text"],["Email","email"],["Left","date"],["Home","date"],["On program","bool"],["Notes","text"]],"read":["admin","bishopric","clerk","member"],"edit":["admin","bishopric"],"scope":null,"note":"Missionaries serving from the ward.","help":["","","","","","","Expected","",""]},
  {"name":"Sources","section":"Engine","cols":[["ID","id"],["Organization","org"],["Kind","choice:Google Calendar,Google Sheet,Google Doc,iCal,Upload"],["Link","link"],["Goes to","choice:Events,Teaching,Groups,People,Announcements"],["Auto-approve","bool"],["Schedule","choice:Nightly,Weekly,Manual"],["Last read","datetime"],["Result","text"]],"read":["admin"],"edit":["admin"],"scope":null,"note":"Where each organization's calendar, lists and schedules come from.","help":["","","","","","","","",""]},
  {"name":"Inbox","section":"Engine","cols":[["ID","id"],["Received","datetime"],["From","text"],["Kind","text"],["Summary","text"],["Data","json"],["Status","choice:New,Approved,Edited,Skipped"],["Decided by","text"],["Decided on","datetime"]],"read":["admin"],"edit":["admin"],"scope":null,"note":"Things the Hub read that need a person's OK.","help":["","","","","","What the Hub read","","",""]},
  {"name":"Log","section":"Engine","cols":[["When","datetime"],["Who","text"],["Action","text"],["Tab","text"],["Row","text"],["Detail","text"]],"read":["admin"],"edit":[],"scope":null,"note":"Every change, newest first. Kept 18 months.","help":["","","","","",""]},
  {"name":"Library","section":"Library","cols":[["ID","id"],["Kind","choice:Quote,Image,Talk prompt,Agenda template,Event template,Funeral quote,Sacrament sentiment,Zone duty,Rotation"],["Title","text"],["Text","text"],["Source","text"],["Link","link"],["Best for","text"],["Notes","text"]],"read":["admin","bishopric","clerk","leader","music"],"edit":["admin","bishopric"],"scope":null,"note":"Quotes, pictures, talk prompts and templates.","help":["","","","","","","",""]},
  {"name":"Hymns","section":"Library","cols":[["Number","id"],["Title","text"],["Book","choice:Hymns,Hymns\u2014For Home and Church,Children's Songbook"]],"read":["admin","bishopric","clerk","leader","music","member"],"edit":["admin","music"],"scope":null,"note":"Hymn numbers and titles.","help":["","",""]}
],"settings":[
  ["ward_name", "Ward", "Ward name", "", "Shown at the top of the app and program"],
  ["stake_name", "Ward", "Stake name", "", ""],
  ["time_zone", "Ward", "Time zone", "America/Denver", ""],
  ["meeting_time", "Ward", "Sacrament meeting starts", "9:00 AM", ""],
  ["building_name", "Ward", "Building", "", ""],
  ["bishop", "Leaders", "Bishop", "", "Name as on the ward list"],
  ["exec_sec", "Leaders", "Executive secretary", "", "Runs the Hub week to week"],
  ["clerk", "Leaders", "Ward clerk", "", ""],
  ["presiding_default", "Sunday", "Presiding when no one else is chosen", "", ""],
  ["high_council", "Sunday", "Usual high councilor", "", ""],
  ["stake_presidency", "Sunday", "Stake presidency (comma separated)", "", ""],
  ["talk_minutes", "Sunday", "Speaking time target (minutes)", "20", ""],
  ["music_minutes", "Sunday", "Minutes per musical number", "4", ""],
  ["due_months", "Sunday", "Suggest speakers after this many months", "24", ""],
  ["skip_days", "Sunday", "Skip someone in suggestions for this many days", "60", ""],
  ["program_footer", "Program", "Program footer", "", ""],
  ["show_birthdays", "Program", "Show birthdays on the program", "Yes", ""],
  ["show_quote", "Program", "Show the quote on the program", "Yes", ""],
  ["show_picture", "Program", "Picture of the Savior on the program", "Yes", ""],
  ["bishopric_weeks", "Meetings", "Bishopric meeting Sundays (1-5)", "2,4,5", ""],
  ["council_weeks", "Meetings", "Ward council Sundays (1-5)", "1,3", ""],
  ["council_time", "Meetings", "Ward council time", "", ""],
  ["ypt_link", "Training", "Youth protection course link", "https://www.churchofjesuschrist.org/callings/safety/protecting-children-and-youth?lang=eng", ""],
  ["ypt_email_days", "Training", "Email this many days before it expires", "60", ""],
  ["ypt_text_days", "Training", "Kevin texts at these days", "30,15", ""],
  ["bld_block_hours", "Building", "Family reservations: hours per block", "4", ""],
  ["bld_max_open", "Building", "Family reservations: most open at once", "2", ""],
  ["bld_weeks_ahead", "Building", "Family reservations: weeks ahead", "8", ""],
  ["bld_holidays", "Building", "Holidays with family limits", "Thanksgiving,Christmas Eve,Christmas,New Year's Eve,New Year's Day", ""],
  ["archive_months", "Housekeeping", "Keep history this many months", "18", ""],
  ["archive_month", "Housekeeping", "Tidy-up month", "January", ""],
  ["email_pause", "Housekeeping", "Pause all emails (Yes/No)", "Yes", "While Yes, the Hub sends nothing except sign-in links to admins"],
  ["email_daily_cap", "Housekeeping", "Emails per day (Google limit 100)", "90", ""],
  ["backup_weeks", "Housekeeping", "Weekly backups to keep (Drive \u203a Ward Hub backups)", "8", ""],
  ["email_digest", "Emails", "Monday email to the bishopric (Yes/No)", "Yes", "Waits for Pause all emails = No"],
  ["email_clerk", "Emails", "Monday For LCR email to the clerks (Yes/No)", "Yes", ""],
  ["email_lessons", "Emails", "Wednesday lesson email to teachers (Yes/No)", "Yes", "Skipped for anyone already texted"],
  ["email_appts", "Emails", "Appointment reminder the day before (Yes/No)", "Yes", "Never says what the appointment is for"],
  ["permission_form_link", "Youth", "Permission and medical release form", "https://www.churchofjesuschrist.org/bc/content/shared/content/english/pdf/callings/primary/parental-permission-medical-release.pdf?lang=en", "Sent to parents with permission-form texts"],
  ["newsletter_from", "Newsletter", "Newsletters signed by (blank = the organization's presidency)", "", ""],
  ["ask_hub", "Engine", "Ask the Hub (Yes/No)", "Yes", "Uses the Gemini key. Sends calendar and Sunday plans only: no phones, emails, birthdays or notes"],
  ["emergency_active", "Emergency", "Emergency under way (set from the app)", "", ""],
  ["emergency_place1", "Emergency", "Ward council gathering place", "", "From the red binder"],
  ["emergency_place2", "Emergency", "Backup gathering place", "", ""],
  ["emergency_hours", "Emergency", "Report every household to the bishop within (hours)", "4", ""],
  ["emergency_stake_phone", "Emergency", "Stake emergency contact (name and phone)", "", ""],
  ["gemini_key", "Engine", "Gemini key (free tier) for reading photos and Docs", "", "Kept private"],
  ["gemini_model", "Engine", "Gemini model", "gemini-2.5-flash", "Change only if Google retires this one"],
  ["app_url", "Engine", "App address", "", ""],
  ["api_url", "Engine", "Engine address (Deploy \u203a Web app URL)", "", "Filled in after the first deployment"],
  ["public_calendar", "Engine", "Show the public calendar", "Yes", ""]
]};
var VERSION = '2.10.0';

/* ---------------- entry points ---------------- */
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.action === 'ics') return ContentService.createTextOutput(icsFeed_(p.orgs)).setMimeType(ContentService.MimeType.ICAL);
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
  var t0 = Date.now(); MEMO_ = {};
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

/* Read a whole tab as objects. Kept in memory for this request, and in the script cache (in pieces) until the next write to that tab. */
var MEMO_ = {};
function rows_(name) {
  var cache = CacheService.getScriptCache(), ver = PropertiesService.getScriptProperties().getProperty('v:' + name) || '0';
  var ck = 'tab:' + name + ':' + ver;
  if (MEMO_[ck]) return MEMO_[ck];
  try {
    var n = +cache.get(ck + ':n');
    if (n > 0) {
      var keys = []; for (var i = 0; i < n; i++) keys.push(ck + ':' + i);
      var got = cache.getAll(keys), parts = [];
      for (var j = 0; j < n; j++) { if (got[keys[j]] == null) { parts = null; break; } parts.push(got[keys[j]]); }
      if (parts) return (MEMO_[ck] = JSON.parse(parts.join('')));
    }
  } catch (e) {}
  var d = tabDef_(name), sh = sheet_(name), last = sh.getLastRow(), cn = d.cols.length;
  var out = [];
  if (last >= 2) {
    var head = sh.getRange(1, 1, 1, Math.max(cn, sh.getLastColumn())).getValues()[0].map(String);
    var vals = sh.getRange(2, 1, last - 1, head.length).getValues();
    var idx = d.cols.map(function (c) { return head.indexOf(c[0]); });
    for (var r = 0; r < vals.length; r++) {
      var row = vals[r]; if (!row.some(function (x) { return x !== '' && x !== null; })) continue;
      var o = { _r: r + 2 };
      for (var c = 0; c < cn; c++) o[d.cols[c][0]] = idx[c] < 0 ? '' : toOut_(row[idx[c]], d.cols[c][1]);
      out.push(o);
    }
  }
  try {
    var s = JSON.stringify(out), size = 90000, put = {}, k = 0;
    for (var p = 0; p < s.length; p += size) put[ck + ':' + (k++)] = s.slice(p, p + size);
    if (k <= 30) { put[ck + ':n'] = String(k); cache.putAll(put, 21600); }
  } catch (e) {}
  return (MEMO_[ck] = out);
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
    var cal = String(c.Calling), fromLcr = c.Source !== 'Hub'; // bishopric-level access only from callings recorded in LCR
    if (fromLcr && /^Bishop$/i.test(cal)) { roles.admin = 1; roles.bishopric = 1; }
    else if (fromLcr && /Bishopric .*Counselor/i.test(cal)) roles.bishopric = 1;
    else if (fromLcr && /Executive Secretary/i.test(cal) && c.Organization === 'Bishopric') { roles.admin = 1; roles.bishopric = 1; }
    else if (fromLcr && /Ward Clerk|Assistant Clerk|Membership Clerk|Finance Clerk/i.test(cal) && c.Organization === 'Bishopric') { roles.clerk = 1; }
    if (/music|organist|chorister/i.test(cal)) roles.music = 1;
    if (/building|scheduler/i.test(cal)) roles.building = 1;
    if (c.Organization && c.Organization !== 'Stake' && LEAD_RX.test(cal)) { roles.leader = 1; orgs[c.Organization] = 1; }
  });
  rows_('Groups').forEach(function (g) {
    if (nkey_(g.Person) === k && g.Role === 'Teacher' && (g.Kind === 'Class' || g.Kind === 'Quorum')) { roles.teacher = 1; orgs[g.Organization] = orgs[g.Organization] || 0; }
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
  if (tabName === 'People' && !bish && !me.roles.clerk) {
    // Leaders see adults (like the ward directory) and the youth and children in their own classes; teachers see only their class.
    var names = {}, G = rows_('Groups');
    if (me.roles.leader) G.forEach(function (g) { if (me.orgs.indexOf(g.Organization) >= 0 && (g.Kind === 'Class' || g.Kind === 'Quorum')) names[nkey_(g.Person)] = 1; });
    myClasses_(me).forEach(function (g) { names[nkey_(g.Person)] = 1; });
    rows = rows.filter(function (r) { var a = age_(r['Birth date']); return names[nkey_(r.Name)] || (me.roles.leader && a !== null && a >= 18); })
      .map(function (r) { var o = Object.assign({}, r); o['Birth date'] = r['Birth date'] ? '1900' + String(r['Birth date']).slice(4) : ''; if (!names[nkey_(r.Name)]) o['Parent phone'] = ''; return o; });
  }
  if (tabName === 'Groups' && !bish && !me.roles.clerk && !me.roles.leader) {
    var mineG = {}; myClasses_(me).forEach(function (g) { mineG[g.ID] = 1; });
    rows = rows.filter(function (r) { return mineG[r.ID]; });
  }
  if (tabName === 'Settings') rows = rows.map(function (r) { var o = Object.assign({}, r); if (SECRET_SETTINGS[r.Key] && r.Value) o.Value = '••••••'; return o; });
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
      var okOrg = function (org) {
        if (me.orgs.indexOf(org) >= 0) return true;
        if (tabName === 'Events' && org === 'Youth' && (me.orgs.indexOf('Young Women') >= 0 || me.orgs.indexOf('Young Men') >= 0)) return true;
        return false;
      };
      var newOrg = row[d.scope] || (cur && cur[d.scope]);
      if (tabName === 'Tasks') {
        var myk = nkey_(me.name), owns = cur && nkey_(cur.Owner).indexOf(myk) >= 0;
        if (cur && !okOrg(cur[d.scope]) && !owns) throw new Error('That belongs to another organization.');
        if (!okOrg(newOrg) && newOrg !== 'Ward' && !owns) throw new Error('That belongs to another organization.');
      } else {
        if (cur && !okOrg(cur[d.scope])) throw new Error('That belongs to another organization.');
        if (!okOrg(newOrg)) throw new Error('That belongs to another organization.');
      }
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
    var youthOk = tabName === 'Events' && cur[d.scope] === 'Youth' && (me.orgs.indexOf('Young Women') >= 0 || me.orgs.indexOf('Young Men') >= 0);
    if (d.scope && !isBishopric_(me) && !me.roles.clerk && me.orgs.indexOf(cur[d.scope]) < 0 && !youthOk) throw new Error('That belongs to another organization.');
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
/* "Jackson & Shea Barney" teaches as Jackson Barney and Shea Barney. */
function teaches_(teacher, name) {
  var parts = String(teacher || '').split(/\s*(?:&|,|\band\b|\/)\s*/).filter(Boolean), k = nkey_(name);
  if (parts.length >= 2) { var last = parts[parts.length - 1].split(' ').pop(); parts = parts.map(function (p) { return p.indexOf(' ') < 0 ? p + ' ' + last : p; }); }
  return parts.some(function (p) { return nkey_(p) === k; });
}
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
    if (a && (!emailPaused_() || /admin/i.test(a.Role || ''))) { ensureKey_(a); sendLink_(a); }
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
    if (req.renew) { CacheService.getScriptCache().remove('who:' + a.Key); a.Key = ''; save_(null, 'Access', { ID: a.ID, Key: '' }, { system: true, quiet: true }); }
    ensureKey_(a);
    if (req.email !== false && !emailPaused_()) sendLink_(a, req.app);
    return { link: linkFor_(a, req.app) };
  }
};

/* Emails are paused until the ward is ready (Settings › Pause all emails). While paused, only admins can get their sign-in link. */
function emailPaused_() { return !/^no$/i.test(setting_('email_pause') || 'Yes'); }
function weekKey_() { var s = addDays_(today_(), -today_().getDay()); return ymd_(s); }
function ensureKey_(a) {
  if (a.Key) return a.Key;
  var key = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '').slice(0, 32);
  save_(null, 'Access', { ID: a.ID, Key: key }, { system: true, quiet: true });
  a.Key = key; return key;
}
function appUrl_(app) {
  var set = String(setting_('app_url') || '').replace(/[#?].*$/, '');
  if (set) return set;
  app = String(app || '').replace(/[#?].*$/, '');
  return /^https:\/\/[a-z0-9-]+\.github\.io\//i.test(app) ? app : '';
}
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
    htmlBody: '<p>Hi ' + String(a.Person).split(' ')[0] + ',</p><p>Here is your personal link to the ' + hubName_() + '. Open it on your phone, then choose <b>Add to Home Screen</b> (iPhone: Share button; Android: ⋮ menu › Install app).</p>' +
      '<p><a href="' + link + '" style="display:inline-block;background:#1F2A44;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none">Open Ward Hub</a></p>' +
      '<p style="color:#666">This link is just for you. Please don\'t forward it.</p>',
    name: hubName_()
  });
  save_(null, 'Access', { ID: a.ID, 'Link sent': ymd_(today_()) }, { system: true, quiet: true });
}

/* ---------------- Today ---------------- */
var CHECKLIST = [
  { id: 'inbox', day: 0, text: 'Review the inbox (scans, linked calendars)', go: '#/x/inbox' },
  { id: 'speakers', day: 1, text: 'Confirm next Sunday\'s speakers and prayers', go: '#/sunday' },
  { id: 'lcr', day: 1, text: 'Hand the For LCR list to the clerk', go: '#/x/changes' },
  { id: 'announce', day: 3, text: 'Approve announcements for Sunday', go: '#/x/announcements' },
  { id: 'lessons', day: 3, text: 'Send this week\'s lesson texts', go: '#/x/lessons' },
  { id: 'publish', day: 5, text: 'Publish the program', go: '#/sunday/{sun}/program' },
  { id: 'reminders', day: 5, text: 'Text speaker and prayer reminders', go: '#/x/reminders' },
  { id: 'appts', day: 6, text: 'Confirm Sunday interviews', go: '#/x/appointments' },
  { id: 'lcrpaste', day: 1, text: 'Monthly: paste members and callings from LCR', go: '#/x/lcr', monthly: true },
  { id: 'ypt', day: 1, text: 'Monthly: paste the youth protection report', go: '#/x/training', monthly: true }
];
/* Items that are plainly done tick themselves. */
function autoDone_() {
  var sun = ymd_(nextSunday_()), out = {};
  if (!rows_('Events').some(function (e) { return e.Status === 'Inbox'; }) && !rows_('Inbox').some(function (i) { return i.Status === 'New'; })) out.inbox = 'Nothing waiting';
  if (!rows_('Announcements').some(function (a) { return a.Status === 'New'; })) out.announce = 'Nothing to approve';
  var S = rows_('Sundays').filter(function (x) { return x.Date === sun; })[0]; if (S && S.Published) out.publish = 'Published';
  var parts = rows_('Participants').filter(function (p) { return p.Date === sun && p.Person && /Accepted/.test(p.Status); });
  if (parts.length && parts.every(function (p) { return p.Reminded; })) out.reminders = 'All reminded';
  if (parts.length && !rows_('Participants').some(function (p) { return p.Date === sun && /Idea|Asked/.test(p.Status); })) out.speakers = 'All accepted';
  return out;
}
function today_view_(me) {
  var t = today_(), tY = ymd_(t), wkEnd = ymd_(addDays_(t, 7)), sun = nextSunday_(t), sunY = ymd_(sun);
  var needs = [], week = [];
  try { var em = emActive_(); if (em && (isBishopric_(me) || me.roles.leader || me.roles.clerk || me.roles.teacher)) needs.push({ kind: 'emergency', title: 'Emergency: ' + em.name, due: '', top: true, sub: 'Tap for what to do now' }); } catch (e) {}
  var myName = nkey_(me.name), myCallings = (me.callings || []).map(nkey_);
  if (can_(me, 'Tasks', 'read')) {
    visible_(me, 'Tasks').forEach(function (x) {
      if (x.Status === 'Done') return;
      var o = nkey_(x.Owner), mine = o && (o.indexOf(myName) >= 0 || myName.indexOf(o) >= 0 || myCallings.some(function (c) { return c && (c.indexOf(o) >= 0 || o.indexOf(c) >= 0); }));
      if (!mine && !(me.roles.admin && (/executive|secretary/i.test(x.Owner) || (setting_('exec_sec') && nkey_(x.Owner) === nkey_(setting_('exec_sec')))))) return;
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
  if (me.roles.clerk || me.roles.admin) {
    var lcr = rows_('Callings').filter(function (c) { return c.Source === 'Hub' && c.Change && !c['Recorded in LCR'] && /Sustained|Set apart/.test(c.Status); });
    if (lcr.length) needs.push({ kind: 'lcr', title: lcr.length + ' change' + (lcr.length > 1 ? 's' : '') + ' to record in LCR', sub: lcr.slice(0, 3).map(function (c) { return c.Person; }).join(', '), due: '' });
  }
  if (me.roles.admin) {
    var inbox = rows_('Inbox').filter(function (i) { return i.Status === 'New'; }).length;
    if (inbox) needs.push({ kind: 'inbox', title: inbox + ' item' + (inbox > 1 ? 's' : '') + ' in the inbox', due: tY, sub: 'From scans and linked calendars' });
    var tr = rows_('Training').filter(function (x) { return x.Expires && x.Expires <= ymd_(addDays_(t, 30)); });
    if (tr.length) needs.push({ kind: 'training', title: tr.length + ' youth protection renewal' + (tr.length > 1 ? 's' : '') + ' due soon', due: tr[0].Expires, sub: tr.slice(0, 3).map(function (x) { return x.Person; }).join(', ') });
  }
  var myk2 = nkey_(me.name), in14 = ymd_(addDays_(t, 14));
  rows_('Teaching').forEach(function (l) {
    if (!l.Date || l.Date < tY || l.Date > in14 || !teaches_(l.Teacher, me.name)) return;
    var topic = String(l.Lesson || '').replace(/^Come, Follow Me( for Primary)?:\s*/i, '');
    needs.push({ kind: 'teach', id: l.ID, title: 'You teach ' + (l.Class && l.Class !== l.Organization ? l.Class : l.Organization) + (topic ? ': ' + topic : ''), due: l.Date, sub: l.Organization, link: l.Link || (typeof lessonLink_ === 'function' ? lessonLink_(l.Organization, l.Lesson, l.Date) : '') });
  });
  needs.sort(function (a, b) { return (b.top ? 1 : 0) - (a.top ? 1 : 0) || String(a.due || '9999').localeCompare(String(b.due || '9999')); });

  if (can_(me, 'Events', 'read')) occurrences_(me, tY, wkEnd).forEach(function (e) { week.push({ date: e.date, time: e.time, title: e.title, org: e.org, place: e.place }); });
  meetingsFor_(t, 7).forEach(function (m) { if (isBishopric_(me) || (m.type === 'Ward council' && me.roles.leader)) week.push(m); });
  week.sort(function (a, b) { return (a.date + timeKey_(a.time)).localeCompare(b.date + timeKey_(b.time)); });

  var sunday = null;
  if (isBishopric_(me) || me.roles.music) {
    var sv = sunday_view_(me, sunY);
    sunday = { date: sunY, type: sv.sunday ? sv.sunday.Type : 'Regular', conducting: sv.sunday ? sv.sunday.Conducting : '', speakers: sv.participants.filter(function (x) { return /speaker|high council|musical/i.test(x.Role); }).map(function (x) { return { name: x.Person, role: x.Role, status: x.Status }; }), hymns: sv.hymns };
  }
  var out = { date: tY, needs: needs, week: week, sunday: sunday };
  if (me.roles.admin) {
    var done = JSON.parse(PropertiesService.getScriptProperties().getProperty('chk:' + weekKey_()) || '{}');
    var auto = autoDone_(), sunY = ymd_(nextSunday_()), firstWeek = today_().getDate() <= 7;
    out.checklist = CHECKLIST.filter(function (c) { return !c.monthly || firstWeek; }).map(function (c) { return { id: c.id, text: c.text, day: c.day, go: String(c.go || '').replace('{sun}', sunY), done: done[c.id] || auto[c.id] || '' }; });
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
    .addItem('Add imported sheets', 'mergeImports')
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
  try { repairs_(); } catch (e) { log_('Hub', 'repair', '', '', String(e)); }
  try { installJobs_(); } catch (e) { log_('Hub', 'jobs', '', '', String(e)); }
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


/* ================= Program: online (public) and printed ================= */
PUBLIC_ACTIONS.program = 1;

/* Public: the last published program (what the QR code opens). Never shows anything unpublished. */
ACTIONS.program = function (req) {
  var p = PropertiesService.getScriptProperties(), key = req.date ? 'pub:' + req.date : 'pub:latest';
  var raw = p.getProperty(key);
  if (!raw && !req.date) return { program: null, message: 'The program for this Sunday has not been published yet.' };
  if (!raw) return { program: null, message: 'No program was published for that Sunday.' };
  return { program: JSON.parse(raw) };
};
/* Bishopric: see the program before publishing. */
ACTIONS.programPreview = function (req, me) {
  if (!(isBishopric_(me) || me.roles.music || me.roles.clerk)) throw new Error('Only the bishopric can preview the program.');
  return { program: buildProgram_(req.date || ymd_(nextSunday_())) };
};
/* Bishopric: publish. The online program updates at once; the date is saved on the Sunday. */
ACTIONS.publish = function (req, me) {
  if (!isBishopric_(me)) throw new Error('Only the bishopric publishes the program.');
  var d = req.date || ymd_(nextSunday_()), prog = buildProgram_(d);
  prog.published = Utilities.formatDate(new Date(), tz_(), "yyyy-MM-dd'T'HH:mm");
  var json = JSON.stringify(prog), p = PropertiesService.getScriptProperties();
  if (json.length > 8800) { prog.birthdays = prog.birthdays.slice(0, 12); prog.announcements = prog.announcements.slice(0, 8); json = JSON.stringify(prog); }
  p.setProperty('pub:' + d, json);
  var latest = p.getProperty('pub:latest'), ld = latest ? JSON.parse(latest).date : '';
  if (!ld || d >= ld || ld < ymd_(today_())) p.setProperty('pub:latest', json);
  save_(me, 'Sundays', { Date: d, Published: prog.published }, { system: true });
  return { program: prog };
};

function buildProgram_(d) {
  var set = settings_(), S = rows_('Sundays').filter(function (s) { return s.Date === d; })[0] || { Date: d, Type: 'Regular' };
  var parts = rows_('Participants').filter(function (p) { return p.Date === d && p.Status !== 'Declined' && p.Status !== 'Idea'; })
    .sort(function (a, b) { return (+a.Order || 0) - (+b.Order || 0); });
  var hymnT = {}; rows_('Hymns').forEach(function (h) { hymnT[String(h.Number)] = h.Title; });
  var hy = function (k) { return S[k] ? { n: String(S[k]), title: hymnT[String(S[k])] || '' } : null; };
  var who = function (role) { return parts.filter(function (p) { return p.Role === role; }).map(function (p) { return p.Person; }).join(', '); };
  var label = { 'Speaker': 'Speaker', 'Youth speaker': 'Youth Speaker', 'High council': 'High Council Speaker', 'Musical number': 'Musical Number', 'Testimony': 'Testimony' };
  var items = parts.filter(function (p) { return !/Invocation|Benediction/.test(p.Role); }).map(function (p) { return { role: label[p.Role] || p.Role, name: p.Person, musical: p.Role === 'Musical number' }; });
  var dd = parseYmd_(d), wkStart = addDays_(dd, 0), wkEnd = addDays_(dd, 6);
  var birthdays = [];
  if (!/^no$/i.test(set.show_birthdays || 'Yes')) rows_('People').forEach(function (p) {
    if (!p['Birth date'] || p['No birthday on program'] === true || p.Source === 'Moved out') return;
    var b = parseYmd_(p['Birth date']);
    for (var i = 0; i < 7; i++) { var x = addDays_(wkStart, i); if (x.getMonth() === b.getMonth() && x.getDate() === b.getDate()) { birthdays.push(p.Name); break; } }
  });
  var ann = rows_('Announcements').filter(function (a) {
    if (a.Status !== 'Approved' || a['On program'] !== true) return false;
    if (a['Event date'] && a['Event date'] < d) return false;
    if (a.From || a.Through) return (!a.From || a.From <= d) && (!a.Through || a.Through >= d);
    return !!a['Event date'] && a['Event date'] <= ymd_(addDays_(dd, 21));
  }).map(function (a) { return { org: a.Organization, text: a.Text }; });
  var pic = null;
  if (!/^no$/i.test(set.show_picture || 'Yes')) {
    var imgs = rows_('Library').filter(function (l) { return l.Kind === 'Image' && l.Link; });
    pic = imgs.filter(function (l) { return S.Picture && l.Title === S.Picture; })[0] || imgs[Math.abs(hash_(d)) % Math.max(1, imgs.length)] || null;
    if (pic) pic = { src: pic.Link, title: pic.Title, page: pic.Source };
  }
  var miss = rows_('Missionaries').filter(function (m) { return m['On program'] === true; }).map(function (m) { return { name: (m.Title ? m.Title + ' ' : '') + m.Name, mission: m.Mission }; });
  var noMeeting = /General Conference|Stake Conference|No meeting/.test(S.Type);
  return {
    ward: set.ward_name || '', stake: set.stake_name || '', date: d, type: S.Type || 'Regular', time: set.meeting_time || '', noMeeting: noMeeting,
    presiding: S['Stake visitor'] || S.Presiding || set.presiding_default || '', conducting: S.Conducting || '', organist: S.Organist || '', chorister: S.Chorister || '',
    opening: hy('Opening hymn'), sacrament: hy('Sacrament hymn'), intermediate: hy('Intermediate hymn'), closing: hy('Closing hymn'),
    invocation: who('Invocation'), benediction: who('Benediction'), items: items, fast: S.Type === 'Fast & Testimony',
    business: true, theme: /^no$/i.test(set.show_quote || 'Yes') ? null : (S['Theme text'] || S.Theme ? { text: S['Theme text'] || '', source: S.Theme || '' } : null),
    announcements: ann, birthdays: birthdays, missionaries: miss, picture: pic, footer: set.program_footer || '',
    building: set.app_url ? String(set.app_url).replace(/[#?].*$/, '') + 'building.html' : ''
  };
}
function hash_(s) { var h = 0; s = String(s); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }


/* ================= Messages: who a leader can text, lesson texts, zone turns, speaker invitations ================= */
function age_(birth) { if (!birth) return null; var b = parseYmd_(birth), t = today_(); var a = t.getFullYear() - b.getFullYear(); if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--; return a; }
function first_(name) { return String(name || '').split(' ')[0]; }
function periodOk_(p, d) { // '', 'to 2026-12', '2027-01 to 2027-07'
  p = String(p || '').trim(); if (!p) return true;
  var ym = d.slice(0, 7), m = p.match(/^(\d{4}-\d\d)?\s*to\s*(\d{4}-\d\d)$/);
  if (!m) return true;
  return (!m[1] || ym >= m[1]) && ym <= m[2];
}
function textOrgsFor_(me) {
  if (isBishopric_(me)) return ['Relief Society', 'Elders Quorum', 'Young Women', 'Young Men', 'Primary', 'Sunday School', 'Ward council', 'Ward'];
  var o = me.orgs.slice();
  if (me.roles.teacher) (me.teachOrgs || []).forEach(function (x) { if (o.indexOf(x) < 0) o.push(x); });
  return o;
}
/* Everyone a person may text, grouped. Phones only; "Don't text" is honored. */
ACTIONS.audiences = function (req, me) {
  var orgs = textOrgsFor_(me), tY = ymd_(today_()), ppl = rows_('People').filter(function (p) { return p.Source !== 'Moved out'; });
  var byName = {}, households = {};
  ppl.forEach(function (p) { byName[nkey_(p.Name)] = p; (households[p.Household] = households[p.Household] || []).push(p); });
  var parentsOf = function (p) {
    var out = [];
    if (p['Parent phone']) out.push({ n: 'Parent of ' + first_(p.Name), p: p['Parent phone'] });
    (households[p.Household] || []).forEach(function (h) { var a = age_(h['Birth date']); if (a !== null && a >= 25 && h.Phone && h["Don't text"] !== true) out.push({ n: h.Name, p: h.Phone, parentOf: p.Name }); });
    return out.slice(0, 3);
  };
  var m = function (p, extra) { return Object.assign({ n: p.Name, f: first_(p.Name), p: p.Phone || '', e: p.Email || '', x: p["Don't text"] === true, y: (age_(p['Birth date']) || 99) < 18 }, extra || {}); };
  var groups = [], G = rows_('Groups'), C = rows_('Callings').filter(function (c) { return !/Released|Proposed|Open/.test(c.Status); });
  var add = function (org, id, label, members, opts) { if (members.length) groups.push(Object.assign({ org: org, id: id, label: label, members: members }, opts || {})); };
  var adults = function (g) { return ppl.filter(function (p) { var a = age_(p['Birth date']); return p.Gender === g && a !== null && a >= 18; }); };
  var newIn = function (p) { return p['Moved in'] && p['Moved in'] >= ymd_(addDays_(today_(), -365)); };
  var classGroups = function (org, kind) {
    var names = {};
    G.forEach(function (g) { if (g.Organization === org && (g.Kind === kind || (kind === 'Class' && g.Kind === 'Quorum')) && periodOk_(g.Period, tY)) names[g.Group] = 1; });
    return Object.keys(names).sort();
  };
  var membersOf = function (org, group, role) {
    return G.filter(function (g) { return g.Organization === org && g.Group === group && (!role || g.Role === role) && periodOk_(g.Period, tY); })
      .map(function (g) { return byName[nkey_(g.Person)] || { Name: g.Person, Phone: '' }; });
  };
  orgs.forEach(function (org) {
    var leadsIt = isBishopric_(me) || me.orgs.indexOf(org) >= 0;
    if ((org === 'Relief Society' || org === 'Elders Quorum') && leadsIt) {
      var all = adults(org === 'Relief Society' ? 'F' : 'M');
      add(org, 'all', org === 'Relief Society' ? 'All sisters' : 'All brothers', all.map(function (p) { return m(p); }));
      add(org, 'attends', 'Those who attend', all.filter(function (p) { return p.Attends === 'Yes'; }).map(function (p) { return m(p); }));
      add(org, 'new', 'New in the last year', all.filter(newIn).map(function (p) { return m(p); }));
      [[18, 30], [31, 50], [51, 70], [71, 120]].forEach(function (r) { add(org, 'a' + r[0], 'Ages ' + r[0] + (r[1] > 100 ? '+' : '–' + r[1]), all.filter(function (p) { var a = age_(p['Birth date']); return a >= r[0] && a <= r[1]; }).map(function (p) { return m(p); }), { sub: true }); });
      add(org, 'leaders', 'Presidency and teachers', C.filter(function (c) { return c.Organization === org; }).map(function (c) { return byName[nkey_(c.Person)]; }).filter(Boolean).map(function (p) { return m(p); }), { sub: true });
      if (org === 'Elders Quorum') {
        var zones = {}; G.forEach(function (g) { if (g.Kind === 'Zone') (zones[g.Group] = zones[g.Group] || []).push(g); });
        var allz = [];
        Object.keys(zones).sort().forEach(function (z) {
          var mem = zones[z].map(function (g) { var p = byName[nkey_(g.Person)]; return p ? m(p, { lead: g.Role === 'Leader' }) : null; }).filter(function (x) { return x && !x.y; });
          allz = allz.concat(mem); add(org, 'z:' + z, z, mem, { zone: true, leader: (zones[z].filter(function (g) { return g.Role === 'Leader'; })[0] || {}).Person || '' });
        });
        add(org, 'zones', 'All zones', allz);
      }
    }
    if (org === 'Young Women' || org === 'Young Men' || org === 'Primary' || org === 'Sunday School') {
      var leadsOrg = isBishopric_(me) || me.orgs.indexOf(org) >= 0;
      var cls = classGroups(org, 'Class');
      if (!leadsOrg) { var myk = nkey_(me.name); cls = cls.filter(function (c) { return G.some(function (g) { return g.Organization === org && g.Group === c && g.Role === 'Teacher' && nkey_(g.Person).indexOf(myk) >= 0; }); }); }
      var everyone = [];
      cls.forEach(function (c) {
        var kids = membersOf(org, c, 'Member');
        var mem = kids.map(function (p) { return m(p, { y: true, parents: p.Name ? parentsOf(p) : [] }); });
        everyone = everyone.concat(mem);
        add(org, 'c:' + c, c, mem, { youth: org !== 'Primary', children: org === 'Primary' });
      });
      if (!leadsOrg) return;
      if (cls.length > 1) add(org, 'all', org === 'Primary' ? 'All Primary families' : 'Everyone in ' + org, everyone, { youth: org !== 'Primary', children: org === 'Primary' });
      var teachers = G.filter(function (g) { return g.Organization === org && g.Role === 'Teacher'; }).map(function (g) { return byName[nkey_(g.Person)]; }).filter(Boolean);
      var leaders = C.filter(function (c) { return c.Organization === org; }).map(function (c) { return byName[nkey_(c.Person)]; }).filter(Boolean);
      var seen = {}, tl = teachers.concat(leaders).filter(function (p) { if (seen[p.Name]) return false; seen[p.Name] = 1; return true; });
      add(org, 'leaders', 'Leaders and teachers', tl.map(function (p) { return m(p); }));
    }
    if (leadsIt && ['Relief Society', 'Elders Quorum', 'Young Women', 'Young Men', 'Primary', 'Sunday School', 'Ward council', 'Ward', 'Bishopric', 'Stake'].indexOf(org) < 0) {
      var seenC = {};
      add(org, 'callings', 'Everyone with a calling here', C.filter(function (c) { return c.Organization === org; }).map(function (c) { return byName[nkey_(c.Person)]; }).filter(function (p) { if (!p || seenC[p.Name]) return false; seenC[p.Name] = 1; return true; }).map(function (p) { return m(p); }));
    }
    if (org === 'Ward council' || org === 'Ward') {
      var wc = C.filter(function (c) { return /^(Bishop|Bishopric .*Counselor|Ward Executive Secretary|Ward Clerk|Relief Society President|Elders Quorum President|Young Women President|Primary President|Sunday School President|Ward Mission Leader|Ward Temple and Family History Leader)$/i.test(c.Calling); });
      if (org === 'Ward council') add('Ward', 'council', 'Ward council', wc.map(function (c) { return byName[nkey_(c.Person)]; }).filter(Boolean).map(function (p) { return m(p); }));
      if (org === 'Ward') {
        var tch = {}; G.forEach(function (g) { if (g.Role === 'Teacher' && byName[nkey_(g.Person)]) tch[g.Person] = byName[nkey_(g.Person)]; });
        add('Ward', 'teachers', 'All teachers', Object.keys(tch).map(function (k) { return m(tch[k]); }));
        add('Ward', 'adults', 'All adults', ppl.filter(function (p) { return (age_(p['Birth date']) || 0) >= 18; }).map(function (p) { return m(p); }), { big: true });
      }
    }
  });
  G.filter(function (g) { return g.Kind === 'Text group' && (isBishopric_(me) || orgs.indexOf(g.Organization) >= 0); }).forEach(function (g) {
    var id = 's:' + g.Organization + ':' + g.Group, grp = groups.filter(function (x) { return x.id === id && x.org === g.Organization; })[0];
    var p = byName[nkey_(g.Person)]; if (!p) return;
    var ag = age_(p['Birth date']);
    if (ag !== null && ag < 18 && !G.some(function (x) { return x.Organization === g.Organization && (x.Kind === 'Class' || x.Kind === 'Quorum') && nkey_(x.Person) === nkey_(p.Name); })) return;
    if (!grp) { grp = { org: g.Organization, id: id, label: '★ ' + g.Group, members: [], saved: g.Group }; groups.push(grp); }
    grp.members.push(m(p));
  });
  return { groups: groups, me: first_(me.name), orgs: orgs };
};

/* Save (or replace) a text group. */
ACTIONS.saveTextGroup = function (req, me) {
  var org = String(req.org || ''), name = String(req.name || '').trim().slice(0, 40), names = [].concat(req.names || []);
  if (!name) throw new Error('Name the group.');
  if (!isBishopric_(me) && me.orgs.indexOf(org) < 0) throw new Error('That belongs to another organization.');
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var sh = sheet_('Groups'), old = rows_('Groups').filter(function (g) { return g.Kind === 'Text group' && g.Organization === org && g.Group === (req.old || name); });
    old.sort(function (a, b) { return b._r - a._r; }).forEach(function (g) { sh.deleteRow(g._r); });
    bump_('Groups');
  } finally { lock.releaseLock(); }
  names.forEach(function (n) { save_(me, 'Groups', { Kind: 'Text group', Organization: org, Group: name, Person: n, Role: 'Member' }, { system: true, quiet: true }); });
  log_(me.name, 'text group', 'Groups', name, names.length + ' people');
  return { saved: names.length };
};
ACTIONS.dontText = function (req, me) {
  if (!(isBishopric_(me) || me.roles.leader)) throw new Error('Only leaders can change this.');
  var p = rows_('People').filter(function (x) { return x.Name === req.name; })[0]; if (!p) throw new Error('Not found');
  if (!isBishopric_(me) && !ACTIONS.audiences({}, me).groups.some(function (g) { return g.members.some(function (m) { return m.n === p.Name; }); })) throw new Error('That person isn\'t in your organization.');
  save_(me, 'People', { ID: p.ID, "Don't text": !!req.on }, { system: true });
  return { ok: true };
};
/* Record that a text went out (who sent it, to which group, how many). Nothing about the message itself. */
ACTIONS.textSent = function (req, me) { log_(me.name, 'text', 'Messages', String(req.group || '').slice(0, 60), (+req.count || 0) + ' people'); return {}; };

/* ---------- lessons ---------- */
var CFM_SLUG = { 2026: 'come-follow-me-for-home-and-church-old-testament-2026', 2027: 'come-follow-me-for-home-and-church-new-testament-2027', 2028: 'come-follow-me-for-home-and-church-book-of-mormon-2028' };
var FSY_GUIDE = [['gods plan', '01-gods-plan-for-you'], ['communicate', '02-god-wants-to-communicate-with-you'], ['help with god', '03-you-can-help-with-gods-work'], ['jesus christ will help', '04-jesus-christ-will-help-you'], ['walk in god', '05-walk-in-gods-light'], ['love god', '06-love-god-love-your-neighbor'], ['temple ordinances', '08-temple-ordinances-and-covenants'], ['ordinances and covenants', '07-ordinances-and-covenants-give-you-access-to-gods-blessings'], ['priesthood keys', '09-you-are-blessed-by-priesthood'], ['body is sacred', '10-your-body-is-sacred'], ['truth will make', '11-truth-will-make-you-free'], ['brings joy', '12-jesus-christ-brings-joy'], ['make inspired choices', '002-make-inspired-choices']];
function lessonLink_(org, topic, d) {
  var t = String(topic || '').toLowerCase(), dt = parseYmd_(d);
  if (/come, follow me|cfm/.test(t) || org === 'Sunday School' || org === 'Primary' || /Relief Society|Elders Quorum/.test(org) && /come, follow me/.test(t)) {
    var slug = CFM_SLUG[dt.getFullYear()]; if (!slug) return 'https://www.churchofjesuschrist.org/learn/come-follow-me';
    if (org === 'Primary') slug = slug.replace('home-and-church', 'primary');
    var start = new Date(dt.getFullYear(), 0, 1); start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    var wk = Math.floor((dt.getTime() - 6 * 864e5 - start.getTime()) / (7 * 864e5)) + 1;
    return 'https://www.churchofjesuschrist.org/study/manual/' + slug + '/' + ('0' + Math.max(1, Math.min(52, wk))).slice(-2) + '?lang=eng';
  }
  var g = FSY_GUIDE.filter(function (x) { return t.indexOf(x[0]) >= 0; })[0];
  if (g) return 'https://www.churchofjesuschrist.org/study/manual/for-the-strength-of-youth/' + g[1] + '?lang=eng';
  if (/general conference|conference talk/.test(t)) return 'https://www.churchofjesuschrist.org/study/general-conference?lang=eng';
  if (org === 'Young Women' || org === 'Young Men') return 'https://www.churchofjesuschrist.org/study/manual/for-the-strength-of-youth?lang=eng';
  return '';
}
ACTIONS.lessons = function (req, me) {
  var orgs = textOrgsFor_(me), sun = req.date || ymd_(nextSunday_());
  var rows = rows_('Teaching').filter(function (l) { return l.Date === sun && (isBishopric_(me) || orgs.indexOf(l.Organization) >= 0); });
  var label = { 'Sunday School': 'Sunday School', 'Young Women': 'Young Women', 'Young Men': 'Young Men', 'Primary': 'Primary', 'Relief Society': 'Relief Society', 'Elders Quorum': 'Elders quorum' };
  var out = rows.map(function (l) {
    var topic = String(l.Lesson || '').replace(/^Come, Follow Me( for Primary)?:\s*/i, '').trim();
    var link = l.Link || lessonLink_(l.Organization, l.Lesson, sun);
    var cls = l.Class && l.Class !== l.Organization ? l.Class : '';
    var text = topic ? (label[l.Organization] || l.Organization) + (cls ? ' (' + cls + ')' : '') + ' this Sunday, ' + Utilities.formatDate(parseYmd_(sun), tz_(), 'MMM d') + ': ' + topic + '.' + (l.Summary ? ' ' + l.Summary : '') + (l.Teacher ? ' Taught by ' + l.Teacher + '.' : '') + (link ? ' Read ahead: ' + link : '') : '';
    return { id: l.ID, org: l.Organization, cls: l.Class, teacher: l.Teacher, topic: topic, lesson: l.Lesson, link: link, summary: l.Summary, text: text, canEdit: isBishopric_(me) || me.orgs.indexOf(l.Organization) >= 0 };
  });
  return { date: sun, lessons: out };
};

/* ---------- zone turns (chairs, snow, …) kept in Library as Kind "Zone duty" ---------- */
function duties_() {
  return rows_('Library').filter(function (l) { return l.Kind === 'Zone duty'; }).map(function (l) {
    var o = {}; try { o = JSON.parse(l.Notes || '{}'); } catch (e) {}
    return { id: l.ID, org: l.Source || 'Elders Quorum', name: l.Title, msg: l.Text, start: o.start || '', every: +o.every || 1, months: o.months || '', order: o.order || [] };
  });
}
ACTIONS.duties = function (req, me) {
  var zones = {}; rows_('Groups').forEach(function (g) { if (g.Kind === 'Zone') zones[g.Group] = 1; });
  var names = Object.keys(zones).sort(), sun = nextSunday_();
  var out = duties_().map(function (d) {
    var order = (d.order.length ? d.order : names).filter(function (n) { return names.indexOf(n) >= 0; });
    var start = d.start ? parseYmd_(d.start) : sun, every = Math.max(1, d.every);
    var turn = function (k) { if (!order.length) return ''; var w = Math.floor(Math.round((sun.getTime() + k * every * 7 * 864e5 - start.getTime()) / 864e5) / (7 * every)); return order[((w % order.length) + order.length) % order.length]; };
    var months = String(d.months || '').split(/\s*,\s*/).filter(Boolean), mon = Utilities.formatDate(sun, tz_(), 'MMM');
    var active = !months.length || months.some(function (x) { return x.slice(0, 3).toLowerCase() === mon.toLowerCase(); });
    return Object.assign(d, { order: order, active: active, now: active ? turn(0) : '', next: turn(1), week: ymd_(sun) });
  });
  return { duties: out, zones: names };
};
ACTIONS.saveDuty = function (req, me) {
  if (!(isBishopric_(me) || me.orgs.indexOf('Elders Quorum') >= 0)) throw new Error('Only the elders quorum presidency changes zone turns.');
  var d = req.duty || {};
  if (d.id && !rows_('Library').some(function (l) { return l.ID === d.id && l.Kind === 'Zone duty'; })) throw new Error('Not found');
  if (req.remove) { remove_(Object.assign({}, me, { roles: Object.assign({}, me.roles, { admin: 1 }) }), 'Library', d.id); return {}; }
  if (!String(d.name || '').trim()) throw new Error('Name the assignment.');
  var id = save_(me, 'Library', { ID: d.id || '', Kind: 'Zone duty', Title: String(d.name).slice(0, 40), Text: String(d.msg || '').slice(0, 400), Source: 'Elders Quorum',
    Notes: JSON.stringify({ start: d.start || ymd_(nextSunday_()), every: Math.max(1, Math.min(8, +d.every || 1)), months: String(d.months || ''), order: [].concat(d.order || []) }) }, { system: true });
  return { id: id };
};
/* Zone membership: the EQ presidency adds, moves or removes people, and sets the leader. */
ACTIONS.zoneSet = function (req, me) {
  if (!(isBishopric_(me) || me.orgs.indexOf('Elders Quorum') >= 0)) throw new Error('Only the elders quorum presidency changes zones.');
  var name = String(req.person || '').trim(), zone = String(req.zone || '').trim();
  var cur = rows_('Groups').filter(function (g) { return g.Kind === 'Zone' && nkey_(g.Person) === nkey_(name); })[0];
  if (req.remove) { if (cur) remove_(Object.assign({}, me, { roles: Object.assign({}, me.roles, { admin: 1 }) }), 'Groups', cur.ID); return {}; }
  if (!name || !zone) throw new Error('Pick a person and a zone.');
  if (req.leader) rows_('Groups').filter(function (g) { return g.Kind === 'Zone' && g.Group === zone && g.Role === 'Leader' && nkey_(g.Person) !== nkey_(name); })
    .forEach(function (g) { save_(me, 'Groups', { ID: g.ID, Role: 'Member' }, { system: true, quiet: true }); });
  save_(me, 'Groups', { ID: cur ? cur.ID : '', Kind: 'Zone', Organization: 'Elders Quorum', Group: zone, Person: name, Role: req.leader ? 'Leader' : (cur && !('leader' in req) ? cur.Role : 'Member') }, { system: true });
  return {};
};

/* ---------- speaker invitations with a yes / no link ---------- */
PUBLIC_ACTIONS.invite = 1; PUBLIC_ACTIONS.answer = 1;
function inviteSecret_() { var p = PropertiesService.getScriptProperties(), s = p.getProperty('INVITE_SECRET'); if (!s) { s = Utilities.getUuid(); p.setProperty('INVITE_SECRET', s); } return s; }
function inviteToken_(id) { var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, id + '|' + inviteSecret_()); return id + '.' + Utilities.base64EncodeWebSafe(raw).slice(0, 16); }
function inviteRow_(t) {
  var id = String(t || '').split('.')[0]; if (!id || inviteToken_(id) !== t) return null;
  return rows_('Participants').filter(function (p) { return p.ID === id; })[0] || null;
}
ACTIONS.inviteText = function (req, me) {
  if (!isBishopric_(me)) throw new Error('Only the bishopric invites speakers.');
  var p = rows_('Participants').filter(function (x) { return x.ID === req.id; })[0]; if (!p) throw new Error('Not found');
  var person = rows_('People').filter(function (x) { return nkey_(x.Name) === nkey_(p.Person); })[0] || {};
  var url = appUrl_(req.app) + 'reply.html?t=' + encodeURIComponent(inviteToken_(p.ID));
  var when = Utilities.formatDate(parseYmd_(p.Date), tz_(), 'EEEE, MMMM d');
  var what = /Invocation|Benediction/.test(p.Role) ? 'offer the ' + (p.Role === 'Invocation' ? 'opening' : 'closing') + ' prayer' : /Musical/.test(p.Role) ? 'share a musical number' : 'speak' + (p.Topic ? ' on ' + p.Topic : '') + (p.Minutes ? ' for about ' + p.Minutes + ' minutes' : '');
  var text = 'Hi ' + first_(p.Person) + ', this is ' + me.name + ', on behalf of the bishopric. Would you be willing to ' + what + ' in sacrament meeting on ' + when + '? You can answer here: ' + url;
  if (p.Status === 'Idea' || !p.Status) save_(me, 'Participants', { ID: p.ID, Status: 'Asked', 'Asked on': ymd_(today_()) }, { system: true });
  return { text: text, phone: person.Phone || '', name: p.Person };
};
ACTIONS.invite = function (req) {
  var p = inviteRow_(req.t); if (!p) return { ok: false, error: 'This link is no longer valid.' };
  var what = /Invocation|Benediction/.test(p.Role) ? (p.Role === 'Invocation' ? 'Opening prayer' : 'Closing prayer') : /Musical/.test(p.Role) ? 'Musical number' : 'Talk' + (p.Topic ? ': ' + p.Topic : '');
  var prompt = rows_('Library').filter(function (l) { return l.Kind === 'Talk prompt'; })[0];
  return { ward: setting_('ward_name'), first: first_(p.Person), date: p.Date, what: what, minutes: p.Minutes || '', status: p.Status, time: setting_('meeting_time'), prompt: /Speaker|council/i.test(p.Role) && prompt ? prompt.Text : '' };
};
ACTIONS.answer = function (req) {
  var p = inviteRow_(req.t); if (!p) return { ok: false, error: 'This link is no longer valid.' };
  var yes = !!req.yes;
  save_(null, 'Participants', { ID: p.ID, Status: yes ? 'Accepted' : 'Declined', 'Answered on': ymd_(today_()), Notes: req.note ? String(p.Notes ? p.Notes + ' · ' : '') + 'They wrote: ' + String(req.note).slice(0, 300) : p.Notes }, { system: true });
  return { status: yes ? 'Accepted' : 'Declined' };
};


/* ================= Calendar: one ward calendar, repeating activities, public page and feed ================= */
/* Every occurrence of the events this person may see between two dates (repeats expanded, skipped dates left out). */
function occurrences_(me, from, to, opts) {
  opts = opts || {};
  var src = me ? visible_(me, 'Events') : rows_('Events').filter(function (e) { return e.Public === true; });
  var out = [];
  src.forEach(function (e) {
    if (!e.Date) return;
    if (!opts.all && e.Status && e.Status !== 'Approved') return;
    var skip = String(e.Skip || '').split(/\s*,\s*/).filter(Boolean);
    var push = function (d) {
      if (d < from || d > to || skip.indexOf(d) >= 0) return;
      out.push({ id: e.ID, date: d, end: e['End date'] && !e.Repeat ? e['End date'] : '', time: e.Start, endTime: e.End, title: e.Title, org: e.Organization, place: e.Place, public: e.Public === true, repeat: e.Repeat || '', status: e.Status || 'Approved', notes: e.Notes || '', source: e.Source || '' });
    };
    if (!e.Repeat) {
      var end = e['End date'] || e.Date;
      if (end >= from && e.Date <= to) out.push({ id: e.ID, date: e.Date, end: e['End date'] || '', time: e.Start, endTime: e.End, title: e.Title, org: e.Organization, place: e.Place, public: e.Public === true, repeat: '', status: e.Status || 'Approved', notes: e.Notes || '', source: e.Source || '' });
      return;
    }
    var d = parseYmd_(e.Date), until = e.Until || to, n = 0;
    var first = parseYmd_(e.Date), wd = first.getDay(), nth = Math.floor((first.getDate() - 1) / 7);
    while (ymd_(d) <= until && ymd_(d) <= to && n < 400) {
      push(ymd_(d)); n++;
      if (/Monthly/.test(e.Repeat)) { var m = new Date(d.getFullYear(), d.getMonth() + 1, 1); var off = (wd - m.getDay() + 7) % 7; m.setDate(1 + off + 7 * nth); if (m.getMonth() !== (d.getMonth() + 1) % 12) m.setDate(m.getDate() - 7); d = m; }
      else d = addDays_(d, /other/.test(e.Repeat) ? 14 : 7);
    }
  });
  out.sort(function (a, b) { return (a.date + timeKey_(a.time)).localeCompare(b.date + timeKey_(b.time)); });
  return out;
}
function timeKey_(t) { var m = String(t || '').match(/(\d+):?(\d\d)?\s*([AaPp])?/); if (!m) return '99:99'; var h = +m[1] % 12 + (/p/i.test(m[3] || '') ? 12 : 0); return ('0' + h).slice(-2) + ':' + (m[2] || '00'); }

ACTIONS.calendar = function (req, me) {
  var from = req.from || ymd_(today_()), to = req.to || ymd_(addDays_(parseYmd_(from), 120));
  var occ = occurrences_(me, from, to);
  if (isBishopric_(me) || me.roles.leader) meetingsFor_(parseYmd_(from), Math.min(120, Math.round((parseYmd_(to) - parseYmd_(from)) / 864e5))).forEach(function (m) {
    if (isBishopric_(me) || m.type === 'Ward council') occ.push({ id: '', date: m.date, time: m.time, title: m.title, org: m.org, place: '', meeting: true });
  });
  occ.sort(function (a, b) { return (a.date + timeKey_(a.time)).localeCompare(b.date + timeKey_(b.time)); });
  var canAdd = isBishopric_(me) || me.roles.leader;
  var myOrgs = isBishopric_(me) ? ORG_LIST_ : me.orgs.concat(me.orgs.some(function (o) { return /Young (Wo)?men/.test(o); }) ? ['Youth'] : []);
  var pending = me.roles.admin ? rows_('Events').filter(function (e) { return e.Status === 'Inbox'; }).length : 0;
  return { from: from, to: to, events: occ, canAdd: canAdd, orgs: myOrgs, pending: pending };
};
var ORG_LIST_ = ['Ward', 'Bishopric', 'Relief Society', 'Elders Quorum', 'Young Women', 'Young Men', 'Youth', 'Primary', 'Sunday School', 'Temple & Family History', 'Ward Mission', 'Activities', 'Music', 'Stake'];

/* One raw event row (for editing). */
ACTIONS.event = function (req, me) {
  var e = visible_(me, 'Events').filter(function (x) { return x.ID === req.id; })[0];
  if (!e) throw new Error('Not found');
  return { event: e, canEdit: can_(me, 'Events', 'edit') && (isBishopric_(me) || me.orgs.indexOf(e.Organization) >= 0 || (e.Organization === 'Youth' && me.orgs.some(function (o) { return /Young (Wo)?men/.test(o); }))) };
};
/* Skip one date of a repeating activity (e.g. no youth activity on Thanksgiving week). */
ACTIONS.skipDate = function (req, me) {
  var e = rows_('Events').filter(function (x) { return x.ID === req.id; })[0]; if (!e) throw new Error('Not found');
  var skip = String(e.Skip || '').split(/\s*,\s*/).filter(Boolean); if (skip.indexOf(req.date) < 0) skip.push(req.date);
  save_(me, 'Events', { ID: e.ID, Organization: e.Organization, Skip: skip.join(', ') });
  return {};
};

/* Public calendar (no sign-in): only events marked Public. */
PUBLIC_ACTIONS.publicCalendar = 1;
ACTIONS.publicCalendar = function (req) {
  if (/^no$/i.test(setting_('public_calendar') || 'Yes')) return { events: [], ward: setting_('ward_name') };
  var from = ymd_(today_()), to = ymd_(addDays_(today_(), 90));
  return { ward: setting_('ward_name'), events: occurrences_(null, from, to).map(function (e) { return { date: e.date, end: e.end, time: e.time, endTime: e.endTime, title: e.title, org: e.org, place: e.place }; }) };
};
/* Calendar feed for phones' calendar apps: …/exec?action=ics */
function icsFeed_(orgs) {
  var want = String(orgs || '').split(',').map(function (o) { return o.trim(); }).filter(Boolean);
  var from = ymd_(addDays_(today_(), -30)), to = ymd_(addDays_(today_(), 180)), ev = /^no$/i.test(setting_('public_calendar') || 'Yes') ? [] : occurrences_(null, from, to).filter(function (e) { return !want.length || want.indexOf(e.org) >= 0; });
  var esc = function (s) { return String(s || '').replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n'); };
  var L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Ward Hub//EN', 'X-WR-CALNAME:' + esc(setting_('ward_name') || 'Ward') + (want.length && want.length < 4 ? ' · ' + want.join(', ') : ' calendar'), 'X-WR-TIMEZONE:' + tz_()];
  ev.forEach(function (e, i) {
    var d = e.date.replace(/-/g, ''), t = timeKey_(e.time), t2 = e.endTime ? timeKey_(e.endTime) : '';
    L.push('BEGIN:VEVENT', 'UID:' + (e.id || 'x') + '-' + d + '@wardhub', 'DTSTAMP:' + Utilities.formatDate(new Date(), 'UTC', "yyyyMMdd'T'HHmmss'Z'"));
    if (t === '99:99') { L.push('DTSTART;VALUE=DATE:' + d); var nd = ymd_(addDays_(parseYmd_(e.end || e.date), 1)).replace(/-/g, ''); L.push('DTEND;VALUE=DATE:' + nd); }
    else { L.push('DTSTART;TZID=' + tz_() + ':' + d + 'T' + t.replace(':', '') + '00'); var et = t2 && t2 !== '99:99' ? t2 : ('0' + Math.min(23, +t.slice(0, 2) + 1)).slice(-2) + t.slice(2); L.push('DTEND;TZID=' + tz_() + ':' + d + 'T' + et.replace(':', '') + '00'); }
    L.push('SUMMARY:' + esc(e.title), 'LOCATION:' + esc(e.place), 'DESCRIPTION:' + esc(e.org), 'END:VEVENT');
  });
  L.push('END:VCALENDAR');
  return L.join('\r\n');
}

/* ================= Building: requests, family limits, approvals ================= */
PUBLIC_ACTIONS.buildingInfo = 1; PUBLIC_ACTIONS.buildingRequest = 1;
function bldRules_() {
  return { hours: +setting_('bld_block_hours') || 4, maxOpen: +setting_('bld_max_open') || 2, weeks: +setting_('bld_weeks_ahead') || 8, lastMinuteDays: 7,
    rooms: String(setting_('bld_rooms') || 'Chapel, Cultural hall, Kitchen, Relief Society room, Primary room, Classrooms').split(/\s*,\s*/).filter(Boolean),
    holidays: String(setting_('bld_holidays') || '').split(/\s*,\s*/).filter(Boolean), building: setting_('building_name') || 'the building' };
}
function holidayDates_(year) {
  var nthDow = function (m, dow, n) { var d = new Date(year, m, 1); d.setDate(1 + ((dow - d.getDay() + 7) % 7) + 7 * (n - 1)); return d; };
  var lastDow = function (m, dow) { var d = new Date(year, m + 1, 0); d.setDate(d.getDate() - ((d.getDay() - dow + 7) % 7)); return d; };
  var o = {};
  o["New Year's Day"] = new Date(year, 0, 1); o['Memorial Day'] = lastDow(4, 1); o['Independence Day'] = new Date(year, 6, 4); o['Pioneer Day'] = new Date(year, 6, 24);
  o['Labor Day'] = nthDow(8, 1, 1); o['Thanksgiving'] = nthDow(10, 4, 4); o['Christmas Eve'] = new Date(year, 11, 24); o['Christmas'] = new Date(year, 11, 25); o["New Year's Eve"] = new Date(year, 11, 31);
  var out = {}; for (var k in o) out[ymd_(o[k])] = k; return out;
}
function bldBusy_(from, to) {
  return rows_('Building').filter(function (b) { return (b.Status === 'Approved' || b.Status === 'Requested') && b.Date >= from && b.Date <= to; })
    .map(function (b) { return { date: b.Date, start: b.Start, end: b.End, rooms: b.Rooms, held: b.Status === 'Requested' }; });
}
function overlaps_(a, b) { return timeKey_(a.start) < timeKey_(b.end) && timeKey_(b.start) < timeKey_(a.end); }
function roomsClash_(r1, r2) { var A = String(r1 || '').toLowerCase(), B = String(r2 || '').toLowerCase(); if (/whole building/.test(A + B)) return true; return A.split(/\s*,\s*/).some(function (x) { return x && B.split(/\s*,\s*/).indexOf(x) >= 0; }); }
ACTIONS.buildingInfo = function (req) {
  var r = bldRules_(), t = today_(), to = ymd_(addDays_(t, 7 * r.weeks + 60)), hol = holidayDates_(t.getFullYear()), hol2 = holidayDates_(t.getFullYear() + 1);
  var holidays = {}; [hol, hol2].forEach(function (h) { for (var d in h) if (r.holidays.indexOf(h[d]) >= 0) holidays[d] = h[d]; });
  return { rules: r, busy: bldBusy_(ymd_(t), to), holidays: holidays, ward: setting_('ward_name') };
};
ACTIONS.buildingRequest = function (req, me) {
  var r = bldRules_(), b = req.request || {}, t = today_();
  var name = String(b.name || '').trim(), phone = String(b.phone || '').trim(), email = String(b.email || '').trim();
  if (!name || (!phone && !email)) return { ok: false, error: 'Please add your name and a phone or email.' };
  if (!/^\d{4}-\d\d-\d\d$/.test(b.date || '') || b.date < ymd_(t)) return { ok: false, error: 'Pick a date from today on.' };
  if (!b.start || !b.end || timeKey_(b.start) >= timeKey_(b.end)) return { ok: false, error: 'Check the start and end times.' };
  if (!b.rooms) return { ok: false, error: 'Choose the rooms you need.' };
  var family = (b.kind || 'Family') === 'Family', days = Math.round((parseYmd_(b.date) - t) / 864e5), lastMinute = days <= r.lastMinuteDays;
  var hrs = (function () { var a = timeKey_(b.start).split(':'), z = timeKey_(b.end).split(':'); return (+z[0] * 60 + +z[1] - +a[0] * 60 - +a[1]) / 60; })();
  if (family) {
    if (days > 7 * r.weeks) return { ok: false, error: 'Family reservations open ' + r.weeks + ' weeks ahead.' };
    if (hrs > r.hours) return { ok: false, error: 'Family reservations are up to ' + r.hours + ' hours. Make a second request for more time.' };
    var key = function (x) { return String(x.Phone || '').replace(/\D/g, '') || String(x.Email || '').toLowerCase(); }, mine = key({ Phone: phone, Email: email });
    var open = rows_('Building').filter(function (x) { return x.Kind === 'Family' && (x.Status === 'Approved' || x.Status === 'Requested') && x.Date >= ymd_(t) && key(x) === mine; });
    if (!lastMinute && open.length >= r.maxOpen) return { ok: false, error: 'You already have ' + open.length + ' upcoming reservations. Within ' + r.lastMinuteDays + ' days of a date you can add more.' };
    var hol = Object.assign(holidayDates_(t.getFullYear()), holidayDates_(t.getFullYear() + 1));
    if (hol[b.date] && r.holidays.indexOf(hol[b.date]) >= 0 && open.some(function (x) { return x.Date === b.date; })) return { ok: false, error: hol[b.date] + ' is a busy day: one reservation per family.' };
  }
  var clash = bldBusy_(b.date, b.date).filter(function (x) { return roomsClash_(x.rooms, b.rooms) && overlaps_(x, b); });
  if (clash.length) return { ok: false, error: 'That time is already taken (' + clash.map(function (c) { return c.start + '–' + c.end; }).join(', ') + '). Try another time or room.' };
  var auto = !family && me && (isBishopric_(me) || me.roles.building || me.roles.admin);
  var id = save_(me, 'Building', { Date: b.date, Start: b.start, End: b.end, Rooms: b.rooms, For: b.for || (family ? name + ' family' : b.kind), Contact: name, Phone: phone, Email: email, Kind: b.kind || 'Family', Purpose: String(b.purpose || '').slice(0, 200),
    Status: auto ? 'Approved' : 'Requested', 'Requested on': Utilities.formatDate(new Date(), tz_(), "yyyy-MM-dd'T'HH:mm"), 'Decided by': auto ? me.name : '' }, { system: true });
  return { id: id, status: auto ? 'Approved' : 'Requested' };
};
ACTIONS.building = function (req, me) {
  if (!(isBishopric_(me) || me.roles.building)) throw new Error('Only the building scheduler and bishopric see requests.');
  var from = ymd_(addDays_(today_(), -1));
  return { rules: bldRules_(), list: rows_('Building').filter(function (b) { return b.Date >= from && b.Status !== 'Cancelled'; }).map(strip_).sort(function (a, b) { return (a.Date + timeKey_(a.Start)).localeCompare(b.Date + timeKey_(b.Start)); }) };
};
ACTIONS.buildingDecide = function (req, me) {
  if (!(isBishopric_(me) || me.roles.building)) throw new Error('Only the building scheduler and bishopric approve requests.');
  var status = { approve: 'Approved', decline: 'Declined', cancel: 'Cancelled' }[req.decision]; if (!status) throw new Error('Choose approve or decline');
  save_(me, 'Building', { ID: req.id, Status: status, 'Decided by': me.name, Notes: req.note || '' }, { system: true });
  return { status: status };
};


/* ================= People & callings: organizations, classes, calling changes, For LCR, LCR paste ================= */
ACTIONS.org = function (req, me) {
  var org = String(req.org || ''), tY = ymd_(today_());
  var mine = isBishopric_(me) || me.roles.clerk || me.orgs.indexOf(org) >= 0 || (me.teachOrgs || []).indexOf(org) >= 0;
  if (!mine) throw new Error('You can see your own organization.');
  var lead = isBishopric_(me) || me.orgs.indexOf(org) >= 0;
  var callings = rows_('Callings').filter(function (c) { return c.Organization === org && !/Released|Proposed/.test(c.Status); })
    .map(function (c) { return { id: c.ID, calling: c.Calling, group: c.Group, person: c.Person, sustained: c.Sustained, setApart: c['Set apart'], status: c.Status }; });
  var groups = {};
  rows_('Groups').filter(function (g) { return g.Organization === org && (g.Kind === 'Class' || g.Kind === 'Quorum'); }).forEach(function (g) {
    var k = g.Group; groups[k] = groups[k] || { name: k, kind: g.Kind, teachers: [], members: [], later: [] };
    var item = { id: g.ID, person: g.Person, role: g.Role, period: g.Period, notes: g.Notes };
    if (g.Role === 'Teacher') groups[k].teachers.push(item);
    else if (periodOk_(g.Period, tY)) groups[k].members.push(item);
    else if (String(g.Period).match(/^(\d{4}-\d\d)/) && RegExp.$1 > tY.slice(0, 7)) groups[k].later.push(item);
  });
  var list = Object.keys(groups).map(function (k) { var g = groups[k]; g.members.sort(function (a, b) { return a.person.localeCompare(b.person); }); return g; });
  if (!lead) { var myk = nkey_(me.name); list = list.filter(function (g) { return g.teachers.some(function (t) { return nkey_(t.person) === myk; }); }); }
  var band = { 'Young Women': ['F', 12, 18], 'Young Men': ['M', 12, 18], 'Primary': ['', 3, 11] }[org], unassigned = [], coming = [];
  if (lead && band) {
    var Y = today_().getFullYear(), inAny = {};
    rows_('Groups').forEach(function (g) { if (g.Organization === org && (g.Kind === 'Class' || g.Kind === 'Quorum') && g.Role !== 'Teacher') inAny[nkey_(g.Person)] = 1; });
    rows_('People').forEach(function (p) {
      if (p.Source === 'Moved out' || !p['Birth date'] || (band[0] && p.Gender !== band[0]) || inAny[nkey_(p.Name)]) return;
      var turns = Y - +String(p['Birth date']).slice(0, 4), a = age_(p['Birth date']);
      if (turns >= band[1] && turns <= band[2] && a !== null && a < 18) unassigned.push({ person: p.Name, turns: turns });
      else if (org !== 'Primary' && turns + 1 === band[1]) coming.push({ person: p.Name, turns: turns + 1 });
    });
  }
  return { org: org, lead: lead, callings: callings, classes: list, unassigned: unassigned.sort(function (a, b) { return a.person.localeCompare(b.person); }), coming: coming.sort(function (a, b) { return a.person.localeCompare(b.person); }), nextYear: today_().getFullYear() + 1, open: rows_('Callings').filter(function (c) { return c.Organization === org && c.Status === 'Open'; }).map(function (c) { return { id: c.ID, calling: c.Calling }; }) };
};
/* Class lists: the presidency adds, moves or removes a member, or sets a teacher. */
ACTIONS.classSet = function (req, me) {
  var org = String(req.org || '');
  if (!(isBishopric_(me) || me.orgs.indexOf(org) >= 0)) throw new Error('Only this organization\'s presidency changes its classes.');
  var kind = org === 'Young Men' ? 'Quorum' : 'Class';
  if (req.id) {
    var cur = rows_('Groups').filter(function (g) { return g.ID === req.id; })[0];
    if (!cur || cur.Organization !== org || (cur.Kind !== 'Class' && cur.Kind !== 'Quorum')) throw new Error('That isn\'t one of this organization\'s classes.');
  }
  if (req.id && req.remove) { remove_(Object.assign({}, me, { roles: Object.assign({}, me.roles, { admin: 1 }) }), 'Groups', req.id); return {}; }
  var person = String(req.person || '').trim(), group = String(req.group || '').trim();
  if (!person || !group) throw new Error('Pick a person and a class.');
  save_(me, 'Groups', { ID: req.id || '', Kind: kind, Organization: org, Group: group, Person: person, Role: req.role || 'Member', Period: req.period || '', Notes: req.notes || '' }, { system: true });
  return {};
};

/* ---------- calling changes (bishopric) ---------- */
var CALL_STEPS = ['Proposed', 'Extended', 'Sustained', 'Set apart'];
ACTIONS.changes = function (req, me) {
  if (!(isBishopric_(me) || me.roles.clerk)) throw new Error('Calling changes are for the bishopric and clerks.');
  var rows = rows_('Callings').filter(function (c) { return c.Source === 'Hub' && c.Change && !(c['Recorded in LCR'] && /Serving|Released/.test(c.Status)); });
  return { changes: rows.map(function (c) { var o = {}; for (var k in c) if (k !== '_r') o[k] = c[k]; return o; }), steps: CALL_STEPS };
};
ACTIONS.changeSave = function (req, me) {
  if (!isBishopric_(me)) throw new Error('Only the bishopric changes callings.');
  var r = req.row || {};
  if (r.ID) { var c0 = rows_('Callings').filter(function (c) { return c.ID === r.ID; })[0]; if (!c0 || c0.Source !== 'Hub') throw new Error('Only calling changes made in the Hub can be edited here.'); r.Status = c0.Status; }
  else r.Status = 'Proposed';
  delete r['Recorded in LCR'];
  if (!r.Person || !r.Calling) throw new Error('Add the person and the calling.');
  r.Source = 'Hub'; if (!r.Status) r.Status = 'Proposed';
  var id = save_(me, 'Callings', r, { system: true });
  if (r.Status === 'Extended' && r.Sunday) addTaskOnce_('Sustain ' + r.Person + ' as ' + r.Calling + ' (' + r.Sunday + ')', 'Bishopric', r.Sunday, 'Calling change');
  return { id: id };
};
ACTIONS.changeStep = function (req, me) {
  if (!(isBishopric_(me) || me.roles.clerk)) throw new Error('Only the bishopric and clerks move calling changes.');
  var c = rows_('Callings').filter(function (x) { return x.ID === req.id; })[0]; if (!c) throw new Error('Not found');
  var t = ymd_(today_()), row = { ID: c.ID };
  if (req.step === 'recorded') {
    row['Recorded in LCR'] = t; row.Status = /Release/.test(c.Change) && !/Call/.test(c.Change) ? 'Released' : 'Serving';
    if (/Call/.test(c.Change) && !c.Sustained) row.Sustained = c.Sunday || t;
    if (/release/i.test(c.Change)) rows_('Callings').filter(function (x) { return x.Source === 'LCR' && nkey_(x.Person) === nkey_(c.Person) && x.Status === 'Serving' && (x.Calling === c.Calling || /^Release$/.test(c.Change)); })
      .forEach(function (x) { if (x.Calling === c.Calling || c.Change === 'Release') save_(null, 'Callings', { ID: x.ID, Status: 'Released' }, { system: true, quiet: true }); });
  } else {
    var i = CALL_STEPS.indexOf(c.Status), next = req.step || CALL_STEPS[Math.min(i + 1, CALL_STEPS.length - 1)];
    if (!isBishopric_(me)) throw new Error('Only the bishopric moves a calling to ' + next + '.');
    row.Status = next;
    if (next === 'Sustained' && !c.Sustained) row.Sustained = c.Sunday || t;
    if (next === 'Set apart' && !c['Set apart']) row['Set apart'] = t;
  }
  save_(me, 'Callings', row, { system: true });
  return {};
};
function addTaskOnce_(task, owner, due, source) {
  if (rows_('Tasks').some(function (t) { return t.Task === task; })) return;
  save_(null, 'Tasks', { Task: task, Owner: owner, Organization: 'Bishopric', Due: due, Status: 'Not started', Source: source, Created: ymd_(today_()) }, { system: true, quiet: true });
}
/* What the clerk should record in LCR. */
ACTIONS.forLcr = function (req, me) {
  if (!(isBishopric_(me) || me.roles.clerk)) throw new Error('This list is for the clerks and bishopric.');
  var items = rows_('Callings').filter(function (c) { return c.Source === 'Hub' && c.Change && !c['Recorded in LCR'] && /Sustained|Set apart/.test(c.Status); })
    .map(function (c) { return { id: c.ID, what: (c.Change === 'Release' ? 'Release ' : c.Change === 'Call and release' ? 'Call (and release) ' : 'Call ') + c.Person + (c.Change === 'Release' ? ' from ' : ' as ') + c.Calling, org: c.Organization, sustained: c.Sustained || c.Sunday, setApart: c['Set apart'], by: c['Sets apart'], status: c.Status }; });
  return { items: items };
};

/* ---------- LCR paste: members or callings ---------- */
function parseTable_(text) {
  var lines = String(text || '').replace(/\r/g, '').split('\n').map(function (l) { return l.replace(/ /g, ' '); }).filter(function (l) { return l.trim(); });
  var split = function (l) { return l.indexOf('\t') >= 0 ? l.split('\t') : l.split(/\s{2,}/); };
  var hi = -1, head = [];
  for (var i = 0; i < Math.min(lines.length, 20); i++) { var c = split(lines[i]).map(function (x) { return x.trim().toLowerCase(); }); if (c.indexOf('name') >= 0 && c.length >= 3) { hi = i; head = c; break; } }
  if (hi < 0) return { head: [], rows: [] };
  var rows = [];
  for (var j = hi + 1; j < lines.length; j++) {
    var cells = split(lines[j]).map(function (x) { return x.trim(); });
    if (cells.length < 2) continue;
    if (cells[0] === '' && cells.length > head.length) cells.shift();
    var o = {}; head.forEach(function (h, k) { o[h] = cells[k] || ''; });
    if (o.name && o.name.indexOf(',') > 0) rows.push(o);
  }
  return { head: head, rows: rows };
}
function lcrDate_(s) { s = String(s || '').trim(); if (!s) return ''; if (/^\d{4}-\d\d-\d\d/.test(s)) return s.slice(0, 10); var us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); if (us) return us[3] + '-' + ('0' + us[1]).slice(-2) + '-' + ('0' + us[2]).slice(-2); var d = new Date(s); if (isNaN(d)) { var m = s.match(/(\d{1,2})\s+(\w{3})\w*\s+(\d{4})/); if (m) d = new Date(m[2] + ' ' + m[1] + ', ' + m[3]); } return isNaN(d) ? '' : ymd_(d); }
function lcrPhone_(s) { var x = String(s || '').replace(/\D/g, ''); if (x.length === 11 && x[0] === '1') x = x.slice(1); return x.length === 10 ? x.slice(0, 3) + '-' + x.slice(3, 6) + '-' + x.slice(6) : String(s || '').trim(); }
var LCR_ORG = { 'Bishopric': 'Bishopric', 'Elders Quorum': 'Elders Quorum', 'Relief Society': 'Relief Society', 'Young Women': 'Young Women', 'Aaronic Priesthood Quorums': 'Young Men', 'Primary': 'Primary', 'Sunday School': 'Sunday School', 'Temple and Family History': 'Temple & Family History', 'Ward Missionaries': 'Ward Mission', 'Other Callings': 'Ward' };
function lcrDiff_(kind, text) {
  var t = parseTable_(text);
  if (!t.rows.length) throw new Error('Couldn\'t find the list in what was pasted. In LCR, select the whole table (including the heading row), copy, and paste here.');
  var people = rows_('People'), bySort = {}; people.forEach(function (p) { bySort[nkey_(p['Sort name'])] = p; });
  var out = { kind: kind, count: t.rows.length, add: [], change: [], gone: [], same: 0 };
  if (kind === 'members') {
    var seen = {};
    t.rows.forEach(function (r) {
      var k = nkey_(r.name), p = bySort[k]; seen[k] = 1;
      var n = { sort: r.name, gender: (r.gender || '').charAt(0).toUpperCase(), birth: lcrDate_(r['birth date'] || r.birthdate), phone: r['phone number'] || r.phone ? lcrPhone_(r['phone number'] || r.phone) : '', email: r['e-mail'] || r.email || '' };
      if (!p) { out.add.push(n); return; }
      var ch = [];
      if (n.phone && n.phone !== p.Phone) ch.push('phone');
      if (n.email && n.email.toLowerCase() !== String(p.Email).toLowerCase()) ch.push('email');
      if (n.birth && n.birth !== p['Birth date']) ch.push('birth date');
      if (p.Source === 'Moved out') ch.push('back in the ward');
      if (ch.length) out.change.push({ id: p.ID, name: p.Name, what: ch, n: n }); else out.same++;
    });
    people.forEach(function (p) { if (!seen[nkey_(p['Sort name'])] && p.Source !== 'Moved out' && p.Source !== 'Manual') out.gone.push({ id: p.ID, name: p.Name }); });
  } else {
    var cur = rows_('Callings').filter(function (c) { return c.Source === 'LCR' && c.Status !== 'Released'; }), key = function (person, calling) { return nkey_(person) + '|' + nkey_(calling); };
    var have = {}; cur.forEach(function (c) { have[key(c.Person, c.Calling)] = c; });
    var nameOf = function (sort) { var p = bySort[nkey_(sort)]; if (p) return p.Name; var a = String(sort).split(','); return (a.slice(1).join(',').trim() + ' ' + a[0].trim()).trim(); };
    var seenC = {};
    t.rows.forEach(function (r) {
      var cal = r.calling || r.position || ''; if (!cal) return;
      var person = nameOf(r.name), k = key(person, cal); seenC[k] = 1;
      if (have[k]) { out.same++; return; }
      var org = LCR_ORG[r.organizations || r.organization] || (/^Stake|High Council/.test(r.organizations || r.organization || '') ? 'Stake' : 'Ward');
      out.add.push({ person: person, calling: cal, org: org, sustained: lcrDate_(r.sustained), setApart: lcrDate_(r['set apart']) });
    });
    cur.forEach(function (c) { if (!seenC[key(c.Person, c.Calling)]) out.gone.push({ id: c.ID, name: c.Person, calling: c.Calling }); });
  }
  return out;
}
ACTIONS.lcrPreview = function (req, me) {
  if (!(me.roles.admin || me.roles.clerk)) throw new Error('Only the executive secretary and clerks paste from LCR.');
  return { diff: lcrDiff_(req.kind === 'callings' ? 'callings' : 'members', req.text) };
};
ACTIONS.lcrApply = function (req, me) {
  if (!(me.roles.admin || me.roles.clerk)) throw new Error('Only the executive secretary and clerks paste from LCR.');
  var d = lcrDiff_(req.kind === 'callings' ? 'callings' : 'members', req.text), t = ymd_(today_()), n = 0;
  if (d.kind === 'members') {
    d.add.forEach(function (a) { var parts = a.sort.split(','); save_(me, 'People', { Name: (parts.slice(1).join(',').trim() + ' ' + parts[0].trim()).trim(), 'Sort name': a.sort, Gender: a.gender, 'Birth date': a.birth, Phone: a.phone, Email: a.email, Household: parts[0].trim(), Attends: 'Unknown', 'Moved in': t, Source: 'LCR', Updated: t }, { system: true, quiet: true }); n++; });
    d.change.forEach(function (c) { var row = { ID: c.id, Updated: t, Source: 'LCR' }; if (c.n.phone) row.Phone = c.n.phone; if (c.n.email) row.Email = c.n.email; if (c.n.birth) row['Birth date'] = c.n.birth; save_(me, 'People', row, { system: true, quiet: true }); n++; });
    if (req.markGone !== false) d.gone.forEach(function (g) { save_(me, 'People', { ID: g.id, Source: 'Moved out', Updated: t }, { system: true, quiet: true }); n++; });
  } else {
    d.add.forEach(function (a) {
      var hub = rows_('Callings').filter(function (c) { return c.Source === 'Hub' && nkey_(c.Person) === nkey_(a.person) && nkey_(c.Calling) === nkey_(a.calling) && !c['Recorded in LCR']; })[0];
      if (hub) save_(me, 'Callings', { ID: hub.ID, 'Recorded in LCR': t, Status: 'Serving', Sustained: a.sustained || hub.Sustained }, { system: true, quiet: true });
      save_(me, 'Callings', { Organization: a.org, Calling: a.calling, Person: a.person, Status: 'Serving', Sustained: a.sustained, 'Set apart': a.setApart, 'Recorded in LCR': a.sustained || t, Source: 'LCR' }, { system: true, quiet: true }); n++;
    });
    d.gone.forEach(function (g) { save_(me, 'Callings', { ID: g.id, Status: 'Released' }, { system: true, quiet: true }); n++; });
  }
  log_(me.name, 'LCR paste', d.kind, '', d.add.length + ' new, ' + d.change.length + ' changed, ' + d.gone.length + ' gone');
  return { diff: d, applied: n };
};


/* ================= Leaders: meetings and minutes, tasks, announcements, appointments and booking, youth protection, inbox ================= */
function strip_(r) { var o = {}; for (var k in r) if (k !== '_r') o[k] = r[k]; return o; }

/* ---------- meetings ---------- */
function canMeeting_(me, type) { return isBishopric_(me) || me.roles.clerk || (type === 'Ward council' && me.roles.leader); }
function ensureMeetings_() {
  var have = {}; rows_('Meetings').forEach(function (m) { have[m.Type + '|' + m.Date] = 1; });
  meetingsFor_(today_(), 21).forEach(function (m) {
    if (have[m.type + '|' + m.date]) return;
    var id = (m.type === 'Bishopric' ? 'BM-' : 'WC-') + m.date;
    save_(null, 'Meetings', { ID: id, Type: m.type, Date: m.date, Time: m.time || '', Status: 'Planned' }, { system: true, quiet: true });
    rows_('Library').filter(function (l) { return l.Kind === 'Agenda template' && l.Title === m.type; }).forEach(function (l, i) {
      var mins = String(l.Notes || '').match(/(\d+)\s*min/);
      save_(null, 'Agenda', { Meeting: id, Order: i + 1, Item: l.Text, Lead: l['Best for'] || '', Minutes: mins ? +mins[1] : '', Source: 'Template' }, { system: true, quiet: true });
    });
  });
}
ACTIONS.meetings = function (req, me) {
  if (!(isBishopric_(me) || me.roles.clerk || me.roles.leader)) throw new Error('Meetings are for leaders.');
  try { ensureMeetings_(); } catch (e) {}
  var from = ymd_(addDays_(today_(), -60));
  var list = rows_('Meetings').filter(function (m) { return m.Date >= from && canMeeting_(me, m.Type); }).map(strip_)
    .sort(function (a, b) { return a.Date.localeCompare(b.Date); });
  return { meetings: list };
};
ACTIONS.meeting = function (req, me) {
  var m = rows_('Meetings').filter(function (x) { return x.ID === req.id; })[0]; if (!m || !canMeeting_(me, m.Type)) throw new Error('Not found');
  var items = rows_('Agenda').filter(function (a) { return a.Meeting === m.ID; }).map(strip_).sort(function (a, b) { return (+a.Order || 0) - (+b.Order || 0); });
  var tasks = rows_('Tasks').filter(function (t) { return t.Source === m.ID || t.Source === m.Type + ' ' + m.Date; }).map(strip_);
  var attendees = m.Type === 'Ward council' ? ACTIONS.audiences({}, Object.assign({}, me, { roles: { admin: 1, bishopric: 1 }, orgs: [] })).groups.filter(function (g) { return g.id === 'council'; })[0] : null;
  return { meeting: strip_(m), items: items, tasks: tasks, canEdit: isBishopric_(me), emails: attendees ? attendees.members.map(function (x) { return x.e; }).filter(Boolean) : [] };
};
/* Leaders can put an item on the ward council agenda. */
ACTIONS.agendaAdd = function (req, me) {
  var m = rows_('Meetings').filter(function (x) { return x.ID === req.meeting; })[0]; if (!m || !canMeeting_(me, m.Type)) throw new Error('Not found');
  var n = rows_('Agenda').filter(function (a) { return a.Meeting === m.ID; }).length;
  return { id: save_(me, 'Agenda', { Meeting: m.ID, Order: n + 1, Item: String(req.item || '').slice(0, 300), Lead: req.lead || me.name, Minutes: req.minutes || '', Source: me.name }, { system: true }) };
};
ACTIONS.minutesSent = function (req, me) { if (!isBishopric_(me)) throw new Error('Only the bishopric sends minutes.'); save_(me, 'Meetings', { ID: req.id, 'Minutes sent': ymd_(today_()), Status: 'Held' }, { system: true }); return {}; };

/* ---------- tasks ---------- */
ACTIONS.tasks = function (req, me) {
  var rows = visible_(me, 'Tasks'), myk = nkey_(me.name), cal = (me.callings || []).map(nkey_);
  var mine = function (t) { var o = nkey_(t.Owner); return o && (o.indexOf(myk) >= 0 || myk.indexOf(o) >= 0 || cal.some(function (c) { return c && (c.indexOf(o) >= 0 || o.indexOf(c) >= 0); })) || (me.roles.admin && /executive|secretary/i.test(t.Owner)); };
  return { tasks: rows.map(function (t) { t.mine = !!mine(t); return t; }).sort(function (a, b) { return String(a.Due || '9999').localeCompare(String(b.Due || '9999')); }), canAll: isBishopric_(me) };
};

/* ---------- announcements ---------- */
ACTIONS.announcements = function (req, me) {
  var t = ymd_(today_());
  var rows = visible_(me, 'Announcements').filter(function (a) { return a.Status === 'New' || ((a.Through || a['Event date'] || '9999') >= t && a.Status !== 'Declined' && a.Status !== 'Done'); });
  return { list: rows, canApprove: isBishopric_(me), orgs: isBishopric_(me) ? ORG_LIST_ : me.orgs };
};

/* ---------- appointments and public booking ---------- */
PUBLIC_ACTIONS.slots = 1; PUBLIC_ACTIONS.book = 1;
ACTIONS.appointments = function (req, me) {
  if (!isBishopric_(me)) throw new Error('Appointments are for the bishopric and executive secretary.');
  var from = ymd_(addDays_(today_(), -1));
  var cal = (me.callings || []).join('|'), myWith = /First Counselor/i.test(cal) ? 'First counselor' : /Second Counselor/i.test(cal) ? 'Second counselor' : /Clerk/i.test(cal) ? 'Clerk' : '';
  var list = rows_('Appointments').filter(function (a) { return a.Date >= from && a.Status !== 'Cancelled'; }).map(strip_)
    .map(function (a) { if (!me.roles.admin && a.With !== myWith) { a.Person = a.Status === 'Booked' ? 'Booked' : ''; a.Purpose = ''; a.Phone = ''; a.Notes = ''; } return a; })
    .sort(function (a, b) { return (a.Date + timeKey_(a.Time)).localeCompare(b.Date + timeKey_(b.Time)); });
  return { list: list, withList: ['Bishop', 'First counselor', 'Second counselor', 'Executive secretary', 'Clerk'] };
};
ACTIONS.makeSlots = function (req, me) {
  if (!isBishopric_(me)) throw new Error('Only the bishopric and executive secretary make booking times.');
  var d = String(req.date || ''), mins = Math.max(5, +req.minutes || 15), start = timeKey_(req.start), end = timeKey_(req.end);
  if (!/^\d{4}-\d\d-\d\d$/.test(d) || start === '99:99' || end === '99:99' || start >= end) throw new Error('Check the date and times.');
  var toMin = function (k) { return +k.slice(0, 2) * 60 + +k.slice(3); }, fmtT = function (m) { var h = Math.floor(m / 60), mm = m % 60; return ((h % 12) || 12) + ':' + ('0' + mm).slice(-2) + ' ' + (h < 12 ? 'AM' : 'PM'); };
  var n = 0;
  for (var m = toMin(start); m + mins <= toMin(end); m += mins) {
    save_(me, 'Appointments', { Date: d, Time: fmtT(m), Minutes: mins, With: req.with || 'Bishop', Status: 'Open', Place: req.place || '', Source: req.kind || 'Booking', Purpose: req.kind || '' }, { system: true, quiet: true }); n++;
  }
  log_(me.name, 'slots', 'Appointments', d, n + ' times with ' + (req.with || 'Bishop'));
  return { made: n };
};
/* Public: open and taken times only. Never who booked, never why. */
ACTIONS.slots = function (req) {
  var w = String(req['with'] || ''), from = ymd_(today_());
  var list = rows_('Appointments').filter(function (a) { return a.Date >= from && (!w || a.With === w) && (a.Status === 'Open' || a.Status === 'Booked') && /Booking|Tithing|Interview/i.test(a.Source || ''); })
    .map(function (a) { return { id: a.Status === 'Open' ? a.ID : '', date: a.Date, time: a.Time, minutes: a.Minutes, with: a.With, place: a.Place, open: a.Status === 'Open', kind: a.Source }; })
    .sort(function (a, b) { return (a.date + timeKey_(a.time)).localeCompare(b.date + timeKey_(b.time)); });
  return { ward: setting_('ward_name'), slots: list };
};
ACTIONS.book = function (req) {
  var name = String(req.name || '').trim(), phone = String(req.phone || '').trim();
  if (!name || !phone) return { ok: false, error: 'Please add your name and phone number.' };
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var a = rows_('Appointments').filter(function (x) { return x.ID === req.id; })[0];
    if (!a || a.Status !== 'Open') return { ok: false, error: 'Sorry, that time was just taken. Please pick another.' };
    save_(null, 'Appointments', { ID: a.ID, Status: 'Booked', Person: name.slice(0, 80), Phone: phone.slice(0, 30), Notes: String(req.note || '').slice(0, 300) }, { system: true });
    return { date: a.Date, time: a.Time, with: a.With, place: a.Place };
  } finally { lock.releaseLock(); }
};

/* ---------- youth protection training ---------- */
ACTIONS.training = function (req, me) {
  if (!isBishopric_(me)) throw new Error('Youth protection is for the bishopric and executive secretary.');
  var t = ymd_(today_()), ppl = {}; rows_('People').forEach(function (p) { ppl[nkey_(p.Name)] = p; });
  var list = rows_('Training').map(function (r) {
    var o = strip_(r), days = r.Expires ? Math.round((parseYmd_(r.Expires) - parseYmd_(t)) / 864e5) : null;
    o.days = days; o.phone = (ppl[nkey_(r.Person)] || {}).Phone || ''; o.state = days === null ? 'unknown' : days < 0 ? 'expired' : days <= 15 ? 'due15' : days <= 30 ? 'due30' : days <= 60 ? 'due60' : 'ok';
    return o;
  }).sort(function (a, b) { return (a.days === null ? 99999 : a.days) - (b.days === null ? 99999 : b.days); });
  return { list: list, link: setting_('ypt_link') };
};
/* Paste the LCR youth protection report: lines with a name and dates. */
ACTIONS.trainingPaste = function (req, me) {
  if (!me.roles.admin) throw new Error('Only the executive secretary and bishop update training.');
  var lines = String(req.text || '').replace(/\r/g, '').split('\n'), people = rows_('People'), bySort = {}, byName = {};
  people.forEach(function (p) { bySort[nkey_(p['Sort name'])] = p; byName[nkey_(p.Name)] = p; });
  var have = {}; rows_('Training').forEach(function (r) { have[nkey_(r.Person)] = r; });
  var n = 0, unknown = [];
  lines.forEach(function (l) {
    var dates = (l.match(/\b(\d{1,2} \w{3} \d{4}|\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d\d-\d\d|\w{3} \d{1,2}, \d{4})\b/g) || []).map(lcrDate_).filter(Boolean);
    var nameM = l.match(/^\s*([A-Za-z'’.\- ]+,\s*[A-Za-z'’.\- ]+)/) || l.match(/^\s*([A-Z][A-Za-z'’.\-]+(?: [A-Z][A-Za-z'’.\-]+)+)/);
    if (!nameM || !dates.length) return;
    var raw = nameM[1].trim(), p = bySort[nkey_(raw)] || byName[nkey_(raw)];
    var person = p ? p.Name : (raw.indexOf(',') > 0 ? raw.split(',')[1].trim() + ' ' + raw.split(',')[0].trim() : raw);
    if (!p) unknown.push(person);
    dates.sort();
    var completed = dates.length > 1 ? dates[0] : '', expires = dates[dates.length - 1];
    if (dates.length === 1 && expires < ymd_(today_())) { completed = expires; expires = ymd_(addDays_(parseYmd_(expires), 3 * 365)); }
    var cur = have[nkey_(person)];
    var row = { ID: cur ? cur.ID : '', Person: person, Course: 'Protecting Children and Youth', Completed: completed || (cur && cur.Completed) || '', Expires: expires };
    if (cur && cur.Expires !== expires) { row['Emailed 60'] = ''; row['Texted 30'] = ''; row['Texted 15'] = ''; }
    save_(me, 'Training', row, { system: true, quiet: true }); n++;
  });
  log_(me.name, 'training paste', 'Training', '', n + ' people');
  return { saved: n, unknown: unknown };
};
ACTIONS.trainingTexted = function (req, me) {
  if (!me.roles.admin) throw new Error('Only the executive secretary marks reminders.');
  var r = {}; r.ID = req.id; r[req.which === 15 || req.which === '15' ? 'Texted 15' : 'Texted 30'] = ymd_(today_());
  save_(me, 'Training', r, { system: true }); return {};
};

/* ---------- inbox ---------- */
ACTIONS.inbox = function (req, me) {
  if (!me.roles.admin) throw new Error('The inbox is for the executive secretary.');
  return { items: rows_('Inbox').filter(function (i) { return i.Status === 'New'; }).map(strip_), pendingEvents: rows_('Events').filter(function (e) { return e.Status === 'Inbox'; }).map(strip_) };
};
ACTIONS.inboxDecide = function (req, me) {
  if (!me.roles.admin) throw new Error('The inbox is for the executive secretary.');
  if (req.event) { save_(me, 'Events', { ID: req.event, Status: req.approve ? 'Approved' : 'Skipped' }, { system: true }); return {}; }
  var it = rows_('Inbox').filter(function (i) { return i.ID === req.id; })[0]; if (!it) throw new Error('Not found');
  if (req.approve) {
    var data = {}; try { data = typeof it.Data === 'string' ? JSON.parse(it.Data || '{}') : it.Data || {}; } catch (e) {}
    if (req.edited) data = req.edited;
    applyIn_(me, data, it.From || 'Inbox');
  }
  save_(me, 'Inbox', { ID: it.ID, Status: req.approve ? (req.edited ? 'Edited' : 'Approved') : 'Skipped', 'Decided by': me.name, 'Decided on': Utilities.formatDate(new Date(), tz_(), "yyyy-MM-dd'T'HH:mm") }, { system: true });
  return {};
};


/* ================= Administrator: access and links, settings, health, nightly jobs ================= */
function needAdmin_(me) { if (!me.roles.admin) throw new Error('Only the executive secretary and bishop can do this.'); }
ACTIONS.access = function (req, me) {
  needAdmin_(me);
  var list = rows_('Access').map(function (a) { var o = strip_(a); o.hasKey = !!a.Key; delete o.Key; var rf = rolesFor_(a.Person, a.Role, a.Organizations); o.roles = Object.keys(rf.roles).filter(function (r) { return r !== 'member'; }); o.orgs = rf.orgs; return o; });
  return { list: list.sort(function (a, b) { return String(a.Person).localeCompare(String(b.Person)); }), paused: emailPaused_() };
};
ACTIONS.accessSave = function (req, me) {
  needAdmin_(me);
  var r = req.row || {}; if (!r.Person) throw new Error('Add a name.');
  if (!r.Email) { var p = rows_('People').filter(function (x) { return nkey_(x.Name) === nkey_(r.Person); })[0]; if (p) { r.Email = p.Email; r.Phone = r.Phone || p.Phone; } }
  if (!r.Status) r.Status = 'Active';
  var id = save_(me, 'Access', r, { system: true }); clearWho_();
  return { id: id };
};
/* A personal link to send by text (works even while emails are paused). */
ACTIONS.linkFor = function (req, me) {
  needAdmin_(me);
  var a = rows_('Access').filter(function (x) { return x.ID === req.id; })[0]; if (!a) throw new Error('Not found');
  if (req.renew) { CacheService.getScriptCache().remove('who:' + a.Key); save_(null, 'Access', { ID: a.ID, Key: '' }, { system: true, quiet: true }); a.Key = ''; }
  ensureKey_(a);
  save_(null, 'Access', { ID: a.ID, 'Link sent': ymd_(today_()) }, { system: true, quiet: true });
  var link = linkFor_(a, req.app);
  log_(me.name, 'link', 'Access', a.ID, a.Person);
  return { link: link, person: a.Person, phone: a.Phone || ((rows_('People').filter(function (p) { return nkey_(p.Name) === nkey_(a.Person); })[0] || {}).Phone || ''), email: a.Email,
    text: 'Hi ' + first_(a.Person) + ', here is your personal link to the ' + hubName_() + '. Open it on your phone, then Add to Home Screen. Please don\'t share it: ' + link };
};
ACTIONS.settingsList = function (req, me) {
  needAdmin_(me);
  return { settings: rows_('Settings').map(function (s) { var o = strip_(s); if (SECRET_SETTINGS[s.Key] && s.Value) o.Value = '••••••'; return o; }) };
};
ACTIONS.settingSave = function (req, me) {
  needAdmin_(me);
  var s = rows_('Settings').filter(function (x) { return x.Key === req.setting; })[0]; if (!s) throw new Error('Not found');
  if (SECRET_SETTINGS[s.Key] && req.value === '••••••') return {};
  save_(me, 'Settings', { Key: s.Key, Value: String(req.value == null ? '' : req.value).slice(0, 2000) }, { system: true });
  SET_CACHE_ = null;
  return {};
};
ACTIONS.health = function (req, me) {
  needAdmin_(me);
  var p = PropertiesService.getScriptProperties(), jobs = {};
  try { jobs = JSON.parse(p.getProperty('JOBS') || '{}'); } catch (e) {}
  var quota = null; try { quota = MailApp.getRemainingDailyQuota(); } catch (e) {}
  var triggers = []; try { triggers = ScriptApp.getProjectTriggers().map(function (t) { return t.getHandlerFunction(); }); } catch (e) {}
  var counts = {}; SCHEMA.tabs.forEach(function (t) { try { counts[t.name] = rows_(t.name).length; } catch (e) { counts[t.name] = -1; } });
  return { version: VERSION, jobs: jobs, emailQuota: quota, paused: emailPaused_(), triggers: triggers, counts: counts, log: rows_('Log').slice(0, 25).map(strip_) };
};
ACTIONS.runJob = function (req, me) { needAdmin_(me); if (req.job === 'nightly') nightly(); if (req.job === 'sources') readSources_(); if (req.job === 'newsletters') newsletterJob(); if (req.job === 'backup') jobRecord_('backup', function () { return backup_(true); }); return ACTIONS.health(req, me); };

/* ---------- nightly jobs (installed by setUp) ---------- */
function installJobs_() {
  var have = ScriptApp.getProjectTriggers().map(function (t) { return t.getHandlerFunction(); });
  if (have.indexOf('nightly') < 0) ScriptApp.newTrigger('nightly').timeBased().everyDays(1).atHour(3).create();
  if (have.indexOf('newsletterJob') < 0) ScriptApp.newTrigger('newsletterJob').timeBased().everyDays(1).atHour(7).create();
}
function jobRecord_(name, fn) {
  var p = PropertiesService.getScriptProperties(), jobs = {}; try { jobs = JSON.parse(p.getProperty('JOBS') || '{}'); } catch (e) {}
  var t0 = Date.now(), ok = true, note = '';
  try { note = fn() || ''; } catch (e) { ok = false; note = String(e && e.message || e).slice(0, 200); log_('Hub', 'job failed', '', name, note); }
  jobs[name] = { when: Utilities.formatDate(new Date(), tz_(), "yyyy-MM-dd'T'HH:mm"), ok: ok, ms: Date.now() - t0, note: String(note).slice(0, 200) };
  p.setProperty('JOBS', JSON.stringify(jobs));
}
function nightly() {
  jobRecord_('sources', readSources_);
  jobRecord_('meetings', function () { ensureMeetings_(); return 'ok'; });
  jobRecord_('emails', function () { if (emailPaused_()) return 'paused'; return emailJobs_(null) + ' sent'; });
  jobRecord_('backup', function () { return backup_(false); });
  jobRecord_('tidy', tidy_);
}
/* Every linked source, every night: calendars and iCal links → Events; Google Sheets and Docs → see 85_sources. Weekly ones run on Mondays. */
function readSources_() {
  var done = 0, monday = today_().getDay() === 1;
  rows_('Sources').filter(function (s) { return s.Link && s.Schedule !== 'Manual' && (s.Schedule !== 'Weekly' || monday); }).forEach(function (s) { readSource_(s); done++; });
  return done + ' sources';
}
function readSource_(s) {
  var result = '';
  try {
    if (/Sheet/.test(s.Kind)) result = sheetSource_(s);
    else if (/Doc/.test(s.Kind)) result = docSource_(s);
    else result = calSource_(s);
  } catch (e) { result = 'Problem: ' + String(e.message || e).slice(0, 160); }
  save_(null, 'Sources', { ID: s.ID, 'Last read': Utilities.formatDate(new Date(), tz_(), "yyyy-MM-dd'T'HH:mm"), Result: result }, { system: true, quiet: true });
  return result;
}
/* Linked Google Calendars and iCal links → Events (auto-approved, or held in the inbox). */
function calSource_(s) {
  var from = today_(), to = addDays_(today_(), 120), got = [];
  if (/^https?:|^webcal:/i.test(s.Link)) got = parseIcs_(UrlFetchApp.fetch(String(s.Link).replace(/^webcal:/i, 'https:'), { muteHttpExceptions: true }).getContentText(), from, to);
  else { var cal = CalendarApp.getCalendarById(s.Link); if (!cal) throw new Error('Calendar not found. Share it with ' + wardAccount_() + ', or paste its iCal address instead.'); got = cal.getEvents(from, to).map(function (e) { return { uid: e.getId() + '|' + ymd_(e.getStartTime()), date: ymd_(e.getStartTime()), start: e.isAllDayEvent() ? '' : Utilities.formatDate(e.getStartTime(), tz_(), 'h:mm a'), end: e.isAllDayEvent() ? '' : Utilities.formatDate(e.getEndTime(), tz_(), 'h:mm a'), title: e.getTitle(), place: e.getLocation() }; }); }
  var r = upsertEvents_(s, got);
  return got.length + ' read · ' + r.added + ' new · ' + r.changed + ' changed' + (r.held ? ' · waiting for approval' : '');
}
function wardAccount_() { try { return Session.getEffectiveUser().getEmail(); } catch (e) { return 'the ward account'; } }
function upsertEvents_(s, got) {
  var have = {}; rows_('Events').forEach(function (e) { if (e['Source ID']) have[e['Source ID']] = e; });
  var added = 0, changed = 0, held = s['Auto-approve'] !== true;
  got.forEach(function (g) {
    var cur = have[g.uid], row = { Date: g.date, 'End date': g.endDate || '', Start: g.start || '', End: g.end || '', Title: g.title, Organization: s.Organization || 'Ward', Place: g.place || '', Source: s.Kind + ': ' + s.Organization, 'Source ID': g.uid };
    if (!cur) { row.Status = held ? 'Inbox' : 'Approved'; save_(null, 'Events', row, { system: true, quiet: true }); added++; }
    else if (cur.Date !== g.date || cur.Title !== g.title || cur.Start !== (g.start || '') || cur.Place !== (g.place || '')) { row.ID = cur.ID; save_(null, 'Events', row, { system: true, quiet: true }); changed++; }
  });
  return { added: added, changed: changed, held: held && added > 0 };
}
function parseIcs_(text, from, to) {
  var out = [], blocks = String(text || '').replace(/\r\n[ \t]/g, '').split('BEGIN:VEVENT').slice(1);
  var val = function (b, k) { var m = b.match(new RegExp('\\n' + k + '[^:\\n]*:([^\\n\\r]*)')); return m ? m[1].replace(/\\,/g, ',').replace(/\\n/g, ' ').trim() : ''; };
  var dt = function (s) { var m = String(s).match(/(\d{4})(\d\d)(\d\d)(?:T(\d\d)(\d\d))?(Z)?/); if (!m) return null; var d = m[6] ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0))) : new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0)); return { d: d, allDay: !m[4] }; };
  blocks.forEach(function (b) {
    b = '\n' + b; var s = dt(val(b, 'DTSTART')), e = dt(val(b, 'DTEND')); if (!s || s.d < from || s.d > to) return;
    out.push({ uid: val(b, 'UID') + '|' + ymd_(s.d), date: ymd_(s.d), start: s.allDay ? '' : Utilities.formatDate(s.d, tz_(), 'h:mm a'), end: e && !e.allDay ? Utilities.formatDate(e.d, tz_(), 'h:mm a') : '', title: val(b, 'SUMMARY'), place: val(b, 'LOCATION') });
  });
  return out;
}
/* Youth protection: an email 60 days before it expires (only when emails aren't paused). Kevin texts at 30 and 15 from the app. */
function trainingEmails_(plan) {
  var days = +setting_('ypt_email_days') || 60, t = today_(), sent = 0, link = setting_('ypt_link');
  var ppl = {}; rows_('People').forEach(function (p) { ppl[nkey_(p.Name)] = p; });
  rows_('Training').forEach(function (r) {
    if (!r.Expires || r['Emailed 60']) return;
    var left = Math.round((parseYmd_(r.Expires) - t) / 864e5), p = ppl[nkey_(r.Person)];
    if (left > days || left < 0 || !p || !p.Email) return;
    var ok = sendMail_({ job: 'Youth protection', to: p.Email, name: r.Person, subject: 'Youth protection training renewal', tag: 'ypt:' + r.ID,
      html: mailWrap_('Youth protection training', '<p>Hi ' + first_(r.Person) + ',</p><p>Your Protecting Children and Youth training expires on <b>' + Utilities.formatDate(parseYmd_(r.Expires), tz_(), 'MMMM d, yyyy') + '</b>. It takes about 30 minutes:</p><p><a href="' + link + '">' + link + '</a></p><p>Thank you for serving our youth.</p>') }, plan);
    if (ok && !plan) { save_(null, 'Training', { ID: r.ID, 'Emailed 60': ymd_(t) }, { system: true, quiet: true }); sent++; }
  });
  return sent + ' emails';
}
/* Keep the Log tab short. */
function tidy_() {
  var keep = (+setting_('archive_months') || 18), sh = sheet_('Log'), n = sh.getLastRow();
  if (n > 3000) { sh.deleteRows(3001, n - 3000); bump_('Log'); return 'log trimmed'; }
  return 'ok';
}


/* ================= Extras: speaker and prayer ideas, scanning a calendar with Gemini ================= */
ACTIONS.ideas = function (req, me) {
  if (!isBishopric_(me)) throw new Error('Ideas are for the bishopric.');
  var kind = req.kind === 'pray' ? 'pray' : 'speak', t = today_(), due = +setting_('due_months') || 24, skip = +setting_('skip_days') || 60;
  var last = {}, lastP = {}, upcoming = {}, asked = {};
  rows_('Participants').forEach(function (p) {
    var k = nkey_(p.Person); if (!k) return;
    if (p.Date >= ymd_(t) && p.Status !== 'Declined') upcoming[k] = p.Date;
    if (p['Asked on'] && p['Asked on'] >= ymd_(addDays_(t, -skip))) asked[k] = p['Asked on'];
    if (p.Status === 'Declined' && p['Answered on'] && p['Answered on'] >= ymd_(addDays_(t, -skip))) asked[k] = p['Answered on'];
    if (p.Date > ymd_(t) || p.Status === 'Declined') return;
    if (/speaker|high council/i.test(p.Role)) { if (!last[k] || p.Date > last[k]) last[k] = p.Date; }
    if (/Invocation|Benediction/.test(p.Role)) { if (!lastP[k] || p.Date > lastP[k]) lastP[k] = p.Date; }
  });
  var cutoff = ymd_(addDays_(t, -Math.round(due * 30.4))), newCut = ymd_(addDays_(t, -365));
  var list = rows_('People').filter(function (p) {
    var a = age_(p['Birth date']), k = nkey_(p.Name);
    if (p.Source === 'Moved out' || p["Don't ask to speak"] === true || a === null || a < 12 || upcoming[k] || asked[k]) return false;
    if (p.Attends === 'No') return false;
    var l = kind === 'speak' ? last[k] : lastP[k];
    return !l || l < cutoff;
  }).map(function (p) {
    var k = nkey_(p.Name), a = age_(p['Birth date']);
    return { name: p.Name, age: a < 18 ? 'Youth' : 'Adult', spoke: last[k] || '', prayed: lastP[k] || '', isNew: !!(p['Moved in'] && p['Moved in'] >= newCut), attends: p.Attends, spouse: p.Spouse || '' };
  });
  list.sort(function (a, b) {
    if (a.isNew !== b.isNew) return a.isNew ? -1 : 1;
    if (a.attends !== b.attends) return a.attends === 'Yes' ? -1 : 1;
    var x = kind === 'speak' ? a.spoke : a.prayed, y = kind === 'speak' ? b.spoke : b.prayed;
    return String(x || '0000').localeCompare(String(y || '0000'));
  });
  return { kind: kind, ideas: list.slice(0, 60) };
};

/* Scan a printed or photographed calendar: Gemini reads the dates, and they wait in the inbox for approval. */
ACTIONS.scan = function (req, me) {
  if (!(me.roles.admin || isBishopric_(me) || me.roles.leader)) throw new Error('Only leaders can scan calendars.');
  var key = setting_('gemini_key'); if (!key) throw new Error('Scanning needs a free Gemini key: Settings › Engine › Gemini key. (Get one at aistudio.google.com.)');
  var org = String(req.org || 'Ward'), mime = String(req.mime || 'image/jpeg'), data = String(req.data || '');
  if (!data || data.length > 14e6) throw new Error('That file is too large. Try a smaller photo.');
  var prompt = 'Today is ' + ymd_(today_()) + '. This is a calendar or schedule for the "' + org + '" organization of a church congregation. List every dated event you can read. ' +
    'Answer only with JSON: {"summary":"one short sentence","events":[{"date":"YYYY-MM-DD","end":"YYYY-MM-DD or empty","start":"7:00 PM or empty","endTime":"","title":"","place":""}]}. ' +
    'Use the most likely year for each date (dates usually fall within the next 12 months). Do not include names of children or phone numbers.';
  var model = setting_('gemini_model') || 'gemini-2.5-flash';
  var res = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + encodeURIComponent(key), {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    payload: JSON.stringify({ contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mime, data: data } }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.1 } })
  });
  if (res.getResponseCode() !== 200) throw new Error('Gemini couldn\'t read it (' + res.getResponseCode() + '). Try a clearer photo.');
  var body = JSON.parse(res.getContentText()), text = (((body.candidates || [])[0] || {}).content || { parts: [{}] }).parts.map(function (p) { return p.text || ''; }).join('');
  var out = {}; try { out = JSON.parse(text.replace(/^```(json)?|```$/g, '')); } catch (e) { throw new Error('Gemini\'s answer couldn\'t be read. Try again.'); }
  var events = (out.events || []).filter(function (e) { return /^\d{4}-\d\d-\d\d$/.test(e.date || '') && e.title; }).slice(0, 80);
  var id = save_(me, 'Inbox', { Received: Utilities.formatDate(new Date(), tz_(), "yyyy-MM-dd'T'HH:mm"), From: me.name + ' · ' + org, Kind: 'Calendar scan', Summary: (out.summary || 'Calendar') + ' · ' + events.length + ' dates', Data: JSON.stringify({ org: org, events: events }), Status: 'New' }, { system: true });
  return { id: id, events: events, summary: out.summary || '' };
};


/* ================= Turns: rotating family assignments (building cleaning, flags, …) ================= */
function contactsFor_(g, byName) {
  var out = [], p = byName[nkey_(g.Person)];
  if (p) return p.Phone ? [{ n: p.Name, p: p.Phone, e: p.Email }] : [{ n: p.Name, p: '', e: p.Email }];
  var m = String(g.Person).match(/^([^,]+),\s*(.+)$/);
  if (m) m[2].split(/\s*&\s*|\s+and\s+/).forEach(function (f) { var q = byName[nkey_(f.trim() + ' ' + m[1].trim())]; if (q) out.push({ n: q.Name, p: q.Phone, e: q.Email }); });
  if (!out.length) (String(g.Notes || '').match(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g) || []).forEach(function (ph) { out.push({ n: g.Person, p: ph, e: '' }); });
  return out;
}
function rotations_() {
  return rows_('Library').filter(function (l) { return l.Kind === 'Rotation'; }).map(function (l) {
    var o = {}; try { o = JSON.parse(l.Notes || '{}'); } catch (e) {}
    return { id: l.ID, name: l.Title, msg: l.Text, org: l.Source || 'Ward', kind: o.kind || 'Cleaning', group: o.group || '', per: Math.max(1, +o.per || 1), offset: +o.offset || 0, every: Math.max(1, +o.every || 1), start: o.start || '', months: o.months || '', day: o.day || '' };
  });
}
ACTIONS.turns = function (req, me) {
  if (!(isBishopric_(me) || me.roles.leader)) throw new Error('Turns are for leaders.');
  var byName = {}; rows_('People').forEach(function (p) { byName[nkey_(p.Name)] = p; });
  var G = rows_('Groups'), sun = nextSunday_(), mon = Utilities.formatDate(sun, tz_(), 'MMM').toLowerCase();
  var list = rotations_().map(function (r) {
    var mem = G.filter(function (g) { return g.Kind === r.kind && (!r.group || g.Group === r.group) && !/^skip/i.test(String(g.Notes || '')); }).sort(function (a, b) { return String(a.Person).localeCompare(String(b.Person)); });
    var start = r.start ? parseYmd_(r.start) : sun, n = mem.length;
    var months = String(r.months || '').split(/\s*,\s*/).filter(Boolean), active = !months.length || months.some(function (x) { return x.slice(0, 3).toLowerCase() === mon; });
    var slice = function (k) {
      if (!n) return [];
      var w = Math.floor(Math.round((sun.getTime() + k * r.every * 7 * 864e5 - start.getTime()) / 864e5) / (7 * r.every)), out = [];
      for (var i = 0; i < Math.min(r.per, n); i++) out.push(mem[(((r.offset + w * r.per + i) % n) + n) % n]);
      return out.map(function (g) { return { name: g.Person, contacts: contactsFor_(g, byName) }; });
    };
    var first = [];
    if (start > sun && n) for (var j = 0; j < Math.min(r.per, n); j++) { var g = mem[((r.offset + j) % n + n) % n]; first.push({ name: g.Person, contacts: contactsFor_(g, byName) }); }
    return Object.assign(r, { count: n, active: active, now: active && start <= sun ? slice(0) : [], next: active && start <= sun ? slice(1) : [], first: first, week: ymd_(sun) });
  });
  var kinds = {}; G.forEach(function (g) { if (/Cleaning|Flags|Dinner group|Other/.test(g.Kind)) { kinds[g.Kind + '|' + g.Group] = 1; } });
  return { turns: list, groups: Object.keys(kinds).map(function (k) { var a = k.split('|'); return { kind: a[0], group: a[1] }; }) };
};
ACTIONS.saveTurn = function (req, me) {
  if (!isBishopric_(me)) throw new Error('Only the bishopric and executive secretary change turns.');
  var d = req.turn || {};
  if (req.remove) { remove_(me, 'Library', d.id); return {}; }
  if (!String(d.name || '').trim()) throw new Error('Name it.');
  return { id: save_(me, 'Library', { ID: d.id || '', Kind: 'Rotation', Title: String(d.name).slice(0, 60), Text: String(d.msg || '').slice(0, 500), Source: d.org || 'Ward',
    Notes: JSON.stringify({ kind: d.kind || 'Cleaning', group: d.group || '', offset: +d.offset || 0, per: Math.max(1, +d.per || 1), every: Math.max(1, +d.every || 1), start: d.start || ymd_(nextSunday_()), months: d.months || '', day: d.day || '' }) }, { system: true }) };
};


/* ================= More: weekly emails (all wait for Pause all emails = No), backups, newsletters, permission forms, funerals, Ask the Hub ================= */

/* ---------- email helpers ---------- */
function hubName_() { return String(setting_('ward_name') || 'Ward').replace(/\s+Ward$/i, '') + ' Ward Hub'; }
function on_(k) { return !/^no$/i.test(setting_(k) || 'Yes'); }
function mailWrap_(title, body) {
  return '<div style="font:15px/1.5 -apple-system,Segoe UI,Arial,sans-serif;color:#1c1c1e;max-width:560px">' +
    '<div style="background:#1F2A44;color:#fff;padding:14px 18px;border-radius:12px 12px 0 0"><div style="font-size:12px;opacity:.75">' + escH_(hubName_()) + '</div><div style="font-size:19px;font-weight:600">' + escH_(title) + '</div></div>' +
    '<div style="border:1px solid #e5e5ea;border-top:0;border-radius:0 0 12px 12px;padding:16px 18px">' + body + '</div></div>';
}
function escH_(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function mailed_() { try { return JSON.parse(PropertiesService.getScriptProperties().getProperty('MAILED') || '{}'); } catch (e) { return {}; } }
/* One email. With a plan list, only notes what would go. Otherwise honors the pause, the daily cap, and never sends the same thing twice. */
function sendMail_(o, plan) {
  var done = mailed_();
  if (o.tag && done[o.tag]) return false;
  if (plan) { plan.push({ job: o.job, name: o.name, subject: o.subject, html: o.html }); return true; }
  if (emailPaused_() || !o.to) return false;
  var p = PropertiesService.getScriptProperties(), day = ymd_(today_()), cnt = {}; try { cnt = JSON.parse(p.getProperty('MAILCOUNT') || '{}'); } catch (e) {}
  if (cnt.d !== day) cnt = { d: day, n: 0 };
  if (cnt.n >= (+setting_('email_daily_cap') || 90)) return false;
  try { if (MailApp.getRemainingDailyQuota() < 1) return false; } catch (e) {}
  MailApp.sendEmail({ to: o.to, subject: o.subject, htmlBody: o.html, name: hubName_() });
  cnt.n++; p.setProperty('MAILCOUNT', JSON.stringify(cnt));
  if (o.tag) {
    done[o.tag] = day;
    var old = ymd_(addDays_(today_(), -60)); for (var k in done) if (done[k] < old) delete done[k];
    p.setProperty('MAILED', JSON.stringify(done));
  }
  log_('Hub', 'email', '', o.job, o.name);
  return true;
}
function meFor_(a) { var rf = rolesFor_(a.Person, a.Role, a.Organizations); return { id: a.ID, name: a.Person, email: a.Email, roles: rf.roles, orgs: rf.orgs, teachOrgs: rf.teachOrgs, callings: rf.callings }; }
function activeAccess_() { var seen = {}; return rows_('Access').filter(function (a) { var e = String(a.Email || '').trim().toLowerCase(); if (!e || a.Status === 'Removed' || a.Status === 'Paused' || seen[e]) return false; seen[e] = 1; return true; }); }
function emailOf_(name) {
  var k = nkey_(name), e = '';
  rows_('People').some(function (p) { if (nkey_(p.Name) === k && p.Email) { e = p.Email; return true; } return false; });
  if (!e) rows_('Access').some(function (a) { if (nkey_(a.Person) === k && a.Email) { e = a.Email; return true; } return false; });
  return e;
}
function fmtDay_(ymd) { return ymd ? Utilities.formatDate(parseYmd_(ymd), tz_(), 'EEE, MMM d') : ''; }
function li_(items) { return items.length ? '<ul style="padding-left:18px;margin:6px 0 14px">' + items.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>' : '<p style="color:#8e8e93;margin:4px 0 14px">Nothing this week.</p>'; }
function h_(t) { return '<div style="font-weight:600;margin-top:10px">' + escH_(t) + '</div>'; }
function openHub_() { var u = setting_('app_url'); return u ? '<p style="margin-top:16px"><a href="' + escH_(u) + '" style="color:#1F2A44">Open Ward Hub</a> (use your own link if this asks you to sign in)</p>' : ''; }

/* Which weekly emails go today (or all of them, for the preview). Returns how many were sent. */
function emailJobs_(plan, all) {
  var dow = today_().getDay(), n0 = plan ? plan.length : (function () { try { var c = JSON.parse(PropertiesService.getScriptProperties().getProperty('MAILCOUNT') || '{}'); return c.d === ymd_(today_()) ? c.n : 0; } catch (e) { return 0; } })();
  if ((all || dow === 1) && on_('email_digest')) digestEmails_(plan);
  if ((all || dow === 1) && on_('email_clerk')) clerkEmails_(plan);
  if ((all || dow === 3) && on_('email_lessons')) lessonEmails_(plan);
  if (on_('email_appts')) apptEmails_(plan);
  trainingEmails_(plan);
  if (plan) return plan.length - n0;
  try { var c = JSON.parse(PropertiesService.getScriptProperties().getProperty('MAILCOUNT') || '{}'); return (c.n || 0) - n0; } catch (e) { return 0; }
}
/* Monday: each member of the bishopric gets their week. Counselors see only their own appointments' names. */
function digestEmails_(plan) {
  var wk = weekKey_(), t = today_(), tY = ymd_(t), end = ymd_(addDays_(t, 7)), sun = ymd_(nextSunday_(addDays_(t, 1)));
  activeAccess_().forEach(function (a) {
    var me = meFor_(a); if (!isBishopric_(me)) return;
    var sv = sunday_view_(me, sun), body = '';
    var parts = sv.participants.map(function (p) { return escH_(p.Role) + ': ' + escH_(p.Person || '—') + (p.Status && p.Status !== 'Accepted' && p.Status !== 'Done' ? ' <span style="color:#c93400">(' + escH_(p.Status) + ')</span>' : ''); });
    body += h_('Sunday, ' + Utilities.formatDate(parseYmd_(sun), tz_(), 'MMMM d') + (sv.sunday && sv.sunday.Type && sv.sunday.Type !== 'Regular' ? ' · ' + sv.sunday.Type : '')) + li_(parts.length ? parts : ['<span style="color:#c93400">No one on the program yet</span>']);
    if (sv.business.length) body += h_('Callings to present') + li_(sv.business.map(function (b) { return escH_(b.change + ': ' + b.person + ' · ' + b.calling); }));
    body += h_('Meetings') + li_(meetingsFor_(t, 7).map(function (m) { return fmtDay_(m.date) + ' · ' + escH_(m.title) + (m.time ? ' · ' + escH_(m.time) : ''); }));
    var ap = ACTIONS.appointments({}, me).list.filter(function (x) { return x.Date >= tY && x.Date <= end && x.Status === 'Booked'; });
    body += h_('Appointments') + li_(ap.map(function (x) { return fmtDay_(x.Date) + ' ' + escH_(x.Time) + ' · ' + escH_(x.With) + ' · ' + escH_(x.Person || 'Booked'); }));
    var tasks = ACTIONS.tasks({}, me).tasks.filter(function (x) { return x.mine && x.Status !== 'Done' && (!x.Due || x.Due <= end); }).slice(0, 12);
    body += h_('Your tasks') + li_(tasks.map(function (x) { return escH_(x.Task) + (x.Due ? ' · due ' + fmtDay_(x.Due) : ''); }));
    if (me.roles.admin) {
      var inbox = rows_('Events').filter(function (e) { return e.Status === 'Inbox'; }).length, ann = rows_('Announcements').filter(function (x) { return x.Status === 'New'; }).length;
      if (inbox || ann) body += h_('Waiting for you') + li_([inbox ? inbox + ' calendar items in the inbox' : '', ann ? ann + ' announcements to approve' : ''].filter(Boolean));
    }
    sendMail_({ job: 'Bishopric week', to: a.Email, name: a.Person, subject: 'Your week · ' + fmtDay_(tY), tag: 'digest:' + wk + ':' + a.ID, html: mailWrap_('Your week', body + openHub_()) }, plan);
  });
}
/* Monday: the clerks get the For LCR list (only when there's something on it). */
function clerkEmails_(plan) {
  var items = ACTIONS.forLcr({}, { roles: { admin: 1, bishopric: 1 }, orgs: [] }).items; if (!items.length) return;
  activeAccess_().forEach(function (a) {
    var me = meFor_(a); if (!me.roles.clerk) return;
    sendMail_({ job: 'For LCR', to: a.Email, name: a.Person, subject: items.length + ' to record in LCR', tag: 'lcr:' + weekKey_() + ':' + a.ID,
      html: mailWrap_('To record in LCR', li_(items.map(function (i) { return escH_(i.what) + ' <span style="color:#8e8e93">· ' + escH_(i.org) + (i.sustained ? ' · sustained ' + fmtDay_(i.sustained) : '') + (i.setApart ? ' · set apart ' + fmtDay_(i.setApart) : '') + '</span>'; })) + '<p>When it\'s in LCR, tap <b>Recorded</b> on People › Callings › For LCR.</p>' + openHub_()) }, plan);
  });
}
/* Wednesday: each teacher gets Sunday's lesson (skipped if they were already texted). */
function lessonEmails_(plan) {
  var sun = ymd_(nextSunday_(today_()));
  rows_('Teaching').forEach(function (r) {
    if (r.Date !== sun || r.Reminded || !r.Teacher) return;
    String(r.Teacher).split(/\s*(?:,|&|\/| and )\s*/).filter(Boolean).forEach(function (who) {
      var e = emailOf_(who); if (!e) return;
      var ok = sendMail_({ job: 'Lesson', to: e, name: who, subject: 'Your lesson Sunday: ' + (r.Lesson || r.Class), tag: 'lesson:' + r.ID + ':' + nkey_(who),
        html: mailWrap_('Your lesson this Sunday', '<p>Hi ' + escH_(first_(who)) + ',</p><p>Thank you for teaching <b>' + escH_(r.Class || r.Organization) + '</b> on ' + fmtDay_(sun) + '.</p>' +
          (r.Lesson ? '<p style="font-size:17px;font-weight:600;margin:8px 0">' + escH_(r.Lesson) + '</p>' : '') + (r.Summary ? '<p>' + escH_(r.Summary) + '</p>' : '') +
          (r.Link ? '<p><a href="' + escH_(r.Link) + '" style="display:inline-block;background:#1F2A44;color:#fff;padding:10px 16px;border-radius:10px;text-decoration:none">Open the lesson</a></p>' : '')) }, plan);
      if (ok && !plan) save_(null, 'Teaching', { ID: r.ID, Reminded: ymd_(today_()) }, { system: true, quiet: true });
    });
  });
}
/* Daily: a reminder the day before a booked appointment. It never says what the appointment is for. */
function apptEmails_(plan) {
  var tom = ymd_(addDays_(today_(), 1));
  rows_('Appointments').forEach(function (r) {
    if (r.Date !== tom || r.Status !== 'Booked' || r.Reminded || !r.Person) return;
    var e = emailOf_(r.Person); if (!e) return;
    var ok = sendMail_({ job: 'Appointment', to: e, name: r.Person, subject: 'Reminder: your appointment tomorrow at ' + r.Time, tag: 'appt:' + r.ID,
      html: mailWrap_('See you tomorrow', '<p>Hi ' + escH_(first_(r.Person)) + ',</p><p>This is a reminder of your appointment with the ' + escH_(String(r.With || 'Bishop').toLowerCase()) + ' tomorrow, <b>' + fmtDay_(r.Date) + ' at ' + escH_(r.Time) + '</b>' + (r.Place ? ' in the ' + escH_(r.Place) : setting_('building_name') ? ' at the ' + escH_(setting_('building_name')) : '') + '.</p><p>If you need a different time, please reply or text the executive secretary.</p>') }, plan);
    if (ok && !plan) save_(null, 'Appointments', { ID: r.ID, Reminded: ymd_(today_()) }, { system: true, quiet: true });
  });
}
/* Kevin can see exactly what would go out once emails are turned on. */
ACTIONS.emailPreview = function (req, me) {
  needAdmin_(me);
  var plan = []; emailJobs_(plan, true);
  return { paused: emailPaused_(), list: plan.map(function (x, i) { return { i: i, job: x.job, name: x.name, subject: x.subject }; }), sample: req.i != null && plan[+req.i] ? plan[+req.i].html : '' };
};

/* ---------- backups: a copy of the spreadsheet in Drive every Sunday night ---------- */
function backup_(force) {
  if (!force && today_().getDay() !== 0) return 'Sundays only';
  var name = 'Ward Hub backup ' + ymd_(today_());
  var it = DriveApp.getFoldersByName('Ward Hub backups'), folder = it.hasNext() ? it.next() : DriveApp.createFolder('Ward Hub backups');
  if (folder.getFilesByName(name).hasNext()) return 'already saved today';
  DriveApp.getFileById(ss_().getId()).makeCopy(name, folder);
  var files = [], fi = folder.getFiles(); while (fi.hasNext()) { var f = fi.next(); if (/^Ward Hub backup \d/.test(f.getName())) files.push(f); }
  files.sort(function (a, b) { return b.getName().localeCompare(a.getName()); });
  files.slice(+setting_('backup_weeks') || 8).forEach(function (f) { f.setTrashed(true); });
  return 'saved ' + name + ' · ' + Math.min(files.length, +setting_('backup_weeks') || 8) + ' kept';
}

/* ---------- newsletters ---------- */
/* Written once in the app. Lines like [lessons] or [birthdays] fill themselves in. Big lists go out in parts over the quietest days, so the ward account stays under Google's daily limit. */
var NL_TOKENS = ['lessons', 'birthdays', 'birthdays next', 'stake calendar', 'ward calendar', 'new members'];
function nlOrgs_(me) {
  var withGroup = {}; rows_('Groups').forEach(function (g) { if (/newsletter/i.test(g.Group)) withGroup[g.Organization] = 1; });
  var all = ['Relief Society', 'Elders Quorum'].concat(Object.keys(withGroup).filter(function (o) { return o !== 'Relief Society' && o !== 'Elders Quorum'; }));
  if (isBishopric_(me)) return ['Ward'].concat(all);
  return all.filter(function (o) { return me.orgs.indexOf(o) >= 0; });
}
function nlAdults_(org) {
  return rows_('People').filter(function (p) { var a = age_(p['Birth date']); return p.Source !== 'Moved out' && a !== null && a >= 18 && (org === 'Ward' || org === 'Stake' || p.Gender === (org === 'Relief Society' ? 'F' : org === 'Elders Quorum' ? 'M' : '?')); });
}
function nlRecipients_(org) {
  var ppl = rows_('People').filter(function (p) { return p.Source !== 'Moved out'; }), by = {}; ppl.forEach(function (p) { by[nkey_(p.Name)] = p; });
  var G = rows_('Groups').filter(function (g) { return g.Organization === org && /newsletter/i.test(g.Group); });
  var list = G.length ? G.map(function (g) { return by[nkey_(g.Person)]; }).filter(Boolean) : nlAdults_(org);
  var seen = {};
  return list.filter(function (p) { var e = String(p.Email || '').trim().toLowerCase(); if (!/.+@.+\..+/.test(e) || seen[e]) return false; seen[e] = 1; return true; }).map(function (p) { return { n: p.Name, e: String(p.Email).trim() }; });
}
function nlDate_(n) { return /^\d{4}-\d\d-\d\d$/.test(n.Date || '') ? n.Date : ymd_(today_()); }
function nlMonth_(n, next) { var d = parseYmd_(nlDate_(n)); if (next) d = new Date(d.getFullYear(), d.getMonth() + 1, 1); return Utilities.formatDate(d, tz_(), 'MMMM'); }
function nlLine_(t, sub) { return '<div style="margin:2px 0 8px">' + t + (sub ? '<div style="color:#6e6e73;font-size:14px">' + sub + '</div>' : '') + '</div>'; }
function nlEvents_(list) { return list.length ? list.slice(0, 30).map(function (e) { return nlLine_('<b>' + fmtDay_(e.date) + '</b>' + (e.time ? ' · ' + escH_(e.time) + (e.endTime ? '–' + escH_(e.endTime) : '') : '') + ' · ' + escH_(e.title), escH_(e.place || '')); }).join('') : '<p style="color:#8e8e93">Nothing on the calendar yet.</p>'; }
function nlBlock_(tok, n) {
  var from = nlDate_(n), to = ymd_(addDays_(parseYmd_(from), 42)), sys = { roles: { admin: 1, bishopric: 1 }, orgs: [] };
  if (tok === 'lessons') {
    var start = ymd_(addDays_(parseYmd_(from), -6));
    var L = rows_('Teaching').filter(function (r) { return r.Organization === n.Organization && r.Date >= start && r.Lesson; }).sort(function (a, b) { return a.Date.localeCompare(b.Date); }).slice(0, 6);
    return L.length ? L.map(function (r) { return nlLine_('<b>' + Utilities.formatDate(parseYmd_(r.Date), tz_(), 'MMM d') + ':</b> ' + escH_(r.Lesson), escH_(r.Summary || '')); }).join('') : '<p style="color:#8e8e93">Lessons coming soon.</p>';
  }
  if (tok === 'birthdays' || tok === 'birthdays next') {
    var d0 = parseYmd_(from), m = tok === 'birthdays next' ? (d0.getMonth() + 1) % 12 : d0.getMonth();
    var B = nlAdults_(n.Organization).filter(function (p) { return p['Birth date'] && p['No birthday on program'] !== true && +String(p['Birth date']).slice(5, 7) === m + 1; })
      .sort(function (a, b) { return String(a['Birth date']).slice(8).localeCompare(String(b['Birth date']).slice(8)) || a.Name.localeCompare(b.Name); });
    var mn = Utilities.formatDate(new Date(2000, m, 1), tz_(), 'MMMM');
    return B.length ? B.map(function (p) { return nlLine_(mn + ' ' + (+String(p['Birth date']).slice(8, 10)) + ' - ' + escH_(p.Name)); }).join('') : '';
  }
  if (tok === 'stake calendar') {
    var h = nlEvents_(occurrences_(sys, from, to).filter(function (e) { return e.org === 'Stake'; }));
    if (n.Attachment) h += '<p><a href="' + escH_(n.Attachment) + '" style="color:#1F2A44;font-weight:600">Open the stake memo</a></p>';
    return h;
  }
  if (tok === 'ward calendar') return nlEvents_(occurrences_(sys, from, to).filter(function (e) { return n.Organization === 'Ward' ? e.public : (e.org === n.Organization || ((e.org === 'Ward' || e.org === 'Activities') && e.public)); }));
  if (tok === 'new members') {
    var since = ymd_(addDays_(parseYmd_(from), -60));
    var N = nlAdults_(n.Organization).filter(function (p) { return p['Moved in'] && p['Moved in'] >= since; });
    return N.length ? '<p>Please welcome ' + N.map(function (p) { return escH_(p.Name); }).join(', ') + '.</p>' : '';
  }
  return '';
}
/* Line by line: "# Heading", a [token] alone on its line, or text (blank lines between paragraphs). {month} is the newsletter's month. */
function nlHtml_(n) {
  var out = '', para = [], month = nlMonth_(n), next = nlMonth_(n, true);
  var flush = function () { if (para.length) out += '<p>' + para.join('<br>') + '</p>'; para = []; };
  var fill = function (s) { return String(s).replace(/\{month\}/gi, month).replace(/\{next month\}/gi, next); };
  var link = function (s) { return escH_(s).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>').replace(/(^|\s)(www\.[^\s<]+|[a-z0-9-]+\.(?:org|com)(?:\/[^\s<]*)?)(?=\s|$|[.,])/gi, '$1<a href="https://$2">$2</a>'); };
  var used = {};
  (fill(n.Intro || '') + '\n\n' + fill(n.Items || '')).split('\n').forEach(function (line) {
    var t = line.trim(), tok = t.match(/^\[([a-z ]+)\]$/i);
    if (!t) { flush(); return; }
    if (tok && NL_TOKENS.indexOf(tok[1].toLowerCase()) >= 0) { flush(); used[tok[1].toLowerCase()] = 1; out += nlBlock_(tok[1].toLowerCase(), n); return; }
    if (/^#\s*/.test(t)) { flush(); out += '<div style="font-size:17px;font-weight:700;margin:18px 0 6px;color:#1F2A44">' + escH_(t.replace(/^#\s*/, '')) + '</div>'; return; }
    para.push(link(t));
  });
  flush();
  if (n['Include calendar'] === true && !used['ward calendar']) out += '<div style="font-size:17px;font-weight:700;margin:18px 0 6px;color:#1F2A44">Coming up</div>' + nlBlock_('ward calendar', n);
  if (n.Attachment && !used['stake calendar']) out += '<p><a href="' + escH_(n.Attachment) + '" style="color:#1F2A44;font-weight:600">Open the attachment</a></p>';
  return mailWrap_(n.Subject || (n.Organization + ' newsletter'), out);
}
function nlTemplate_(org, me) {
  var name = me.name || '';
  if (org === 'Elders Quorum') return { Subject: 'Elders Quorum Weekend Update', Intro: 'Hello elders, time for another weekend update!',
    Items: '# Announcements\n(Type this week\'s announcements here.)\n\n# EQ Lesson Schedule\n[lessons]\n\n# {month} Birthdays\n[birthdays]\n\n# New in the ward\n[new members]\n\n# Stake calendar\n[stake calendar]\n\n# Super High Quality Jokes* (*actual quality may vary)\n(Add your jokes.)\n\nHave a great week!\n' + name, 'Include calendar': false };
  if (org === 'Relief Society') return { Subject: 'Relief Society News', Intro: 'Dear sisters,',
    Items: '# Announcements\n(Type this week\'s announcements here.)\n\n# Lessons\n[lessons]\n\n# {month} Birthdays\n[birthdays]\n\n# Please welcome\n[new members]\n\n# Coming up\n[ward calendar]\n\n# Stake\n[stake calendar]\n\nWith love,\n' + name, 'Include calendar': false };
  return { Subject: (setting_('ward_name') || 'Ward') + ' News', Intro: 'Dear friends,', Items: '# Coming up\n[ward calendar]\n\n# Stake\n[stake calendar]\n\n' + name, 'Include calendar': false };
}
function nlGet_(me, id) {
  var n = rows_('Newsletters').filter(function (x) { return x.ID === id; })[0];
  if (!n || nlOrgs_(me).indexOf(n.Organization) < 0) throw new Error('Not found');
  return n;
}
function nlPlan_(n) { try { return JSON.parse(n['Send plan'] || '[]'); } catch (e) { return []; } }

/* How busy each of the next days is for the ward account: the weekly emails that fall on it, newsletters already planned, and what history shows. */
function mailLoad_(dates, skipId) {
  var load = {}, tY = ymd_(today_()); dates.forEach(function (d) { load[d] = 0; });
  var A = activeAccess_(), bish = 0, clerks = 0;
  A.forEach(function (a) { var m = meFor_(a); if (isBishopric_(m)) bish++; if (m.roles.clerk) clerks++; });
  var hist = [0, 0, 0, 0, 0, 0, 0], since = ymd_(addDays_(today_(), -56));
  rows_('Log').forEach(function (l) { var w = String(l.When || '').slice(0, 10); if (l.Action === 'email' && w >= since && w < tY) hist[parseYmd_(w).getDay()] += 1 / 8; });
  dates.forEach(function (d) {
    var dd = parseYmd_(d), w = dd.getDay(), exp = 0;
    if (w === 1) exp += (on_('email_digest') ? bish : 0) + (on_('email_clerk') ? clerks : 0);
    if (w === 3 && on_('email_lessons')) exp += rows_('Teaching').filter(function (r) { return r.Date === ymd_(nextSunday_(dd)); }).length;
    if (on_('email_appts')) exp += rows_('Appointments').filter(function (a) { return a.Date === ymd_(addDays_(dd, 1)) && a.Status === 'Booked'; }).length;
    load[d] = Math.max(exp, Math.round(hist[w])) + 3;
  });
  rows_('Newsletters').forEach(function (n) { if (n.ID === skipId || !/Scheduled|Sending/.test(n.Status)) return; nlPlan_(n).forEach(function (b) { if (!b.sent && load[b.date] != null) load[b.date] += b.to.length + Math.ceil(b.to.length / 49); }); });
  return load;
}
/* The two (or more, for a long list) quietest days in the coming week, never Sunday. */
function nlPlanFor_(n, emails) {
  var cap = Math.min(100, +setting_('email_daily_cap') || 90), dates = [];
  for (var i = 1; dates.length < 7; i++) { var d = addDays_(today_(), i); if (d.getDay() !== 0) dates.push(ymd_(d)); }
  var load = mailLoad_(dates, n.ID), free = function (d) { return Math.max(0, cap - load[d]); };
  var order = dates.slice().sort(function (a, b) { return load[a] - load[b] || a.localeCompare(b); }), pick = [], room = 0;
  for (var k = 0; k < order.length && (pick.length < 2 || room < emails.length); k++) { pick.push(order[k]); room += free(order[k]) - Math.ceil(free(order[k]) / 50); }
  pick.sort();
  var plan = [], left = emails.slice();
  pick.forEach(function (d, j) {
    var share = Math.ceil(left.length / (pick.length - j)), fit = free(d) - Math.ceil(free(d) / 50);
    plan.push({ date: d, to: left.splice(0, Math.max(0, Math.min(share, fit))), sent: '' });
  });
  if (left.length) plan[plan.length - 1].to = plan[plan.length - 1].to.concat(left);
  return { plan: plan.filter(function (b) { return b.to.length; }), load: load, cap: cap };
}
ACTIONS.newsletters = function (req, me) {
  var orgs = nlOrgs_(me); if (!orgs.length) throw new Error('Newsletters are for the Relief Society and elders quorum presidencies and the bishopric.');
  var list = rows_('Newsletters').filter(function (n) { return orgs.indexOf(n.Organization) >= 0; }).map(function (n) { var o = strip_(n); delete o['Send plan']; return o; }).sort(function (a, b) { return String(b.Date).localeCompare(String(a.Date)); }).slice(0, 40);
  return { orgs: orgs.map(function (o) { return { org: o, count: nlRecipients_(o).length, group: rows_('Groups').some(function (g) { return g.Organization === o && /newsletter/i.test(g.Group); }) }; }), list: list, paused: emailPaused_(), tokens: NL_TOKENS };
};
ACTIONS.newsletterTemplate = function (req, me) { if (nlOrgs_(me).indexOf(req.org) < 0) throw new Error('Pick your organization.'); return { row: Object.assign({ Organization: req.org, Date: ymd_(today_()) }, nlTemplate_(req.org, me)) }; };
ACTIONS.newsletterSave = function (req, me) {
  var r = req.row || {}; if (nlOrgs_(me).indexOf(r.Organization) < 0) throw new Error('Pick your organization.');
  var cur = r.ID ? nlGet_(me, r.ID) : null;
  if (cur && /Scheduled|Sending/.test(cur.Status)) throw new Error('Cancel the schedule before changing it.');
  var att = String(r.Attachment || '').trim(); if (att && !/^https:\/\//i.test(att)) throw new Error('The attachment needs to be a link that starts with https://');
  var row = { Organization: r.Organization, Date: r.Date || ymd_(today_()), Subject: String(r.Subject || '').slice(0, 150), Intro: String(r.Intro || '').slice(0, 4000), Items: String(r.Items || '').slice(0, 20000), 'Include calendar': r['Include calendar'] === true, Attachment: att, Status: cur && cur.Status === 'Sent' ? 'Sent' : 'Draft' };
  if (r.ID) row.ID = r.ID;
  return { id: save_(me, 'Newsletters', row, { system: true }) };
};
ACTIONS.newsletterView = function (req, me) {
  var n = nlGet_(me, req.id), emails = nlRecipients_(n.Organization).map(function (x) { return x.e; }), sched = /Scheduled|Sending/.test(n.Status);
  var p = sched ? { plan: nlPlan_(n) } : nlPlanFor_(n, emails);
  return { html: nlHtml_(n), subject: n.Subject, emails: emails, paused: emailPaused_(), status: n.Status || 'Draft',
    plan: p.plan.map(function (b) { return { date: b.date, count: b.to.length, sent: b.sent || '', load: p.load ? p.load[b.date] : null }; }) };
};
ACTIONS.newsletterRemove = function (req, me) { var n = nlGet_(me, req.id); if (/Scheduled|Sending/.test(n.Status)) throw new Error('Cancel the schedule first.'); return { removed: remove_(me, 'Newsletters', req.id) }; };
ACTIONS.newsletterMarkSent = function (req, me) { var n = nlGet_(me, req.id); if (/Scheduled|Sending/.test(n.Status)) throw new Error('Cancel the schedule first.'); save_(me, 'Newsletters', { ID: n.ID, Status: 'Sent', 'Sent on': ymd_(today_()), 'Sent to': +req.count || '' }, { system: true }); return {}; };
/* Plan the parts now; the 7 AM job sends each part on its day. */
ACTIONS.newsletterSchedule = function (req, me) {
  var n = nlGet_(me, req.id);
  if (emailPaused_()) throw new Error('Emails are paused. Use "Send from my email" for now.');
  if (n.Status !== 'Draft' && n.Status) throw new Error('This one is already ' + String(n.Status).toLowerCase() + '.');
  var emails = nlRecipients_(n.Organization).map(function (x) { return x.e; }); if (!emails.length) throw new Error('No one on the list has an email address.');
  var p = nlPlanFor_(n, emails);
  p.plan.forEach(function (b) { b.replyTo = me.email || ''; b.by = me.name; });
  save_(me, 'Newsletters', { ID: n.ID, Status: 'Scheduled', 'Send plan': JSON.stringify(p.plan) }, { system: true });
  installJobs_();
  return { plan: p.plan.map(function (b) { return { date: b.date, count: b.to.length }; }) };
};
ACTIONS.newsletterCancel = function (req, me) {
  var n = nlGet_(me, req.id); if (!/Scheduled|Sending/.test(n.Status)) return {};
  var sent = nlPlan_(n).filter(function (b) { return b.sent; }), cnt = sent.reduce(function (s, b) { return s + b.to.length; }, 0);
  save_(me, 'Newsletters', { ID: n.ID, Status: cnt ? 'Sent' : 'Draft', 'Send plan': cnt ? JSON.stringify(sent) : '', 'Sent to': cnt || '', Notes: cnt ? 'Stopped after ' + cnt + ' of the list' : '' }, { system: true });
  return { sent: cnt };
};
function nlSendBatch_(n, b) {
  var html = nlHtml_(n), wn = String(setting_('ward_name') || 'Ward').replace(/\s+Ward$/i, ''), name = wn + ' Ward' + (n.Organization === 'Ward' ? '' : ' ' + n.Organization);
  var self = ''; try { self = Session.getEffectiveUser().getEmail(); } catch (e) {}
  for (var i = 0; i < b.to.length; i += 49) MailApp.sendEmail({ to: self || b.replyTo || b.to[i], bcc: b.to.slice(i, i + 49).join(','), subject: n.Subject || 'Newsletter', htmlBody: html, name: name, replyTo: b.replyTo || '' });
  var p = PropertiesService.getScriptProperties(), cnt = {}; try { cnt = JSON.parse(p.getProperty('MAILCOUNT') || '{}'); } catch (e) {}
  if (cnt.d !== ymd_(today_())) cnt = { d: ymd_(today_()), n: 0 };
  cnt.n += b.to.length; p.setProperty('MAILCOUNT', JSON.stringify(cnt));
}
/* Daily at 7 AM: send each part whose day has come, if Google's allowance has room; otherwise it waits a day. */
function newsletterJob() {
  jobRecord_('newsletters', function () {
    if (emailPaused_()) return 'paused';
    var tY = ymd_(today_()), done = 0, waiting = 0;
    rows_('Newsletters').filter(function (n) { return /Scheduled|Sending/.test(n.Status); }).forEach(function (n) {
      var plan = nlPlan_(n), changed = false;
      plan.forEach(function (b) {
        if (b.sent || b.date > tY) return;
        var left = 0; try { left = MailApp.getRemainingDailyQuota(); } catch (e) {}
        if (left < b.to.length + Math.ceil(b.to.length / 49) + 5) { waiting++; b.date = ymd_(addDays_(today_(), 1)); changed = true; return; }
        nlSendBatch_(n, b); b.sent = Utilities.formatDate(new Date(), tz_(), "yyyy-MM-dd'T'HH:mm"); done += b.to.length; changed = true;
        log_('Hub', 'newsletter', 'Newsletters', n.ID, b.to.length + ' addresses');
      });
      if (!changed) return;
      var all = plan.every(function (b) { return b.sent; }), total = plan.reduce(function (s, b) { return s + (b.sent ? b.to.length : 0); }, 0);
      save_(null, 'Newsletters', { ID: n.ID, 'Send plan': JSON.stringify(plan), Status: all ? 'Sent' : 'Sending', 'Sent on': all ? tY : '', 'Sent to': total }, { system: true, quiet: true });
    });
    return done + ' sent' + (waiting ? ' · ' + waiting + ' parts moved to tomorrow' : '');
  });
}
/* Right away, for a list small enough to fit in today's allowance. */
ACTIONS.newsletterSend = function (req, me) {
  var n = nlGet_(me, req.id);
  if (emailPaused_()) throw new Error('Emails are paused. Use "Send from my email" for now.');
  if (n.Status && n.Status !== 'Draft') throw new Error('This one is already ' + String(n.Status).toLowerCase() + '.');
  var to = nlRecipients_(n.Organization).map(function (x) { return x.e; }); if (!to.length) throw new Error('No one on the list has an email address.');
  var left = 0; try { left = MailApp.getRemainingDailyQuota(); } catch (e) {}
  if (left < to.length + Math.ceil(to.length / 49) + 10) throw new Error('Google allows ' + left + ' more addresses today and this list has ' + to.length + '. Schedule it over two days instead.');
  nlSendBatch_(n, { to: to, replyTo: me.email || '' });
  save_(me, 'Newsletters', { ID: n.ID, Status: 'Sent', 'Sent on': ymd_(today_()), 'Sent to': to.length }, { system: true });
  return { sent: to.length };
};

/* ---------- permission forms for youth activities and trips ---------- */
function permOrgsFor_(eventOrg) { return eventOrg === 'Youth' ? ['Young Women', 'Young Men'] : (['Young Women', 'Young Men', 'Primary'].indexOf(eventOrg) >= 0 ? [eventOrg] : []); }
function permRoster_(me, e) {
  var orgs = permOrgsFor_(e.Organization).filter(function (o) { return isBishopric_(me) || me.orgs.indexOf(o) >= 0; }), tY = ymd_(today_());
  var ppl = rows_('People').filter(function (p) { return p.Source !== 'Moved out'; }), by = {}, hh = {};
  ppl.forEach(function (p) { by[nkey_(p.Name)] = p; (hh[p.Household] = hh[p.Household] || []).push(p); });
  var seen = {}, out = [];
  rows_('Groups').forEach(function (g) {
    if (orgs.indexOf(g.Organization) < 0 || (g.Kind !== 'Class' && g.Kind !== 'Quorum') || g.Role !== 'Member' || !periodOk_(g.Period, tY)) return;
    var p = by[nkey_(g.Person)]; if (!p || seen[p.Name]) return; seen[p.Name] = 1;
    var parents = [];
    if (p['Parent phone']) parents.push({ n: 'Parent of ' + first_(p.Name), p: p['Parent phone'] });
    if (p.Household) (hh[p.Household] || []).forEach(function (h) { var a = age_(h['Birth date']); if (a !== null && a >= 25 && h.Phone && h["Don't text"] !== true) parents.push({ n: h.Name, p: h.Phone }); });
    out.push({ n: p.Name, org: g.Organization, cls: g.Group, parents: parents.slice(0, 3) });
  });
  return out.sort(function (a, b) { return a.n.localeCompare(b.n); });
}
function permEvent_(me, id) {
  var e = rows_('Events').filter(function (x) { return x.ID === id; })[0];
  if (!e || e['Permission form'] !== true || !permOrgsFor_(e.Organization).some(function (o) { return isBishopric_(me) || me.orgs.indexOf(o) >= 0; })) throw new Error('Not found');
  return e;
}
ACTIONS.permissions = function (req, me) {
  if (!isBishopric_(me) && !permOrgsFor_('Youth').concat(['Primary']).some(function (o) { return me.orgs.indexOf(o) >= 0; })) throw new Error('Permission forms are for youth and Primary leaders.');
  var from = ymd_(addDays_(today_(), -7)), P = rows_('Permissions');
  var evs = rows_('Events').filter(function (e) { return e['Permission form'] === true && e.Status !== 'Cancelled' && (e['End date'] || e.Date) >= from && permOrgsFor_(e.Organization).some(function (o) { return isBishopric_(me) || me.orgs.indexOf(o) >= 0; }); })
    .sort(function (a, b) { return String(a.Date).localeCompare(String(b.Date)); })
    .map(function (e) { var r = permRoster_(me, e), got = {}; P.forEach(function (x) { if (x.Event === e.ID && x.Received === true) got[nkey_(x.Person)] = 1; }); return { id: e.ID, title: e.Title, date: e.Date, end: e['End date'] || '', time: e.Start || '', org: e.Organization, place: e.Place || '', total: r.length, received: r.filter(function (y) { return got[nkey_(y.n)]; }).length }; });
  var out = { events: evs, link: setting_('permission_form_link'), orgs: isBishopric_(me) ? ['Youth', 'Young Women', 'Young Men', 'Primary'] : ['Youth'].concat(me.orgs).filter(function (o) { return permOrgsFor_(o).length && permOrgsFor_(o).some(function (x) { return isBishopric_(me) || me.orgs.indexOf(x) >= 0; }); }) };
  if (req.id) {
    var e = permEvent_(me, req.id), marks = {};
    P.forEach(function (x) { if (x.Event === e.ID) marks[nkey_(x.Person)] = x; });
    out.event = { id: e.ID, title: e.Title, date: e.Date, end: e['End date'] || '', time: e.Start || '', org: e.Organization, place: e.Place || '' };
    out.youth = permRoster_(me, e).map(function (y) { var m = marks[nkey_(y.n)]; y.received = !!(m && m.Received === true); y.on = m ? m['Received on'] : ''; return y; });
  }
  return out;
};
ACTIONS.permissionMark = function (req, me) {
  var e = permEvent_(me, req.event), who = permRoster_(me, e).filter(function (y) { return y.n === req.person; })[0];
  if (!who) throw new Error('That person isn\'t on this list.');
  var cur = rows_('Permissions').filter(function (x) { return x.Event === e.ID && nkey_(x.Person) === nkey_(who.n); })[0];
  var row = { Event: e.ID, Date: e.Date, Title: e.Title, Organization: e.Organization, Person: who.n, Received: req.received === true, 'Received on': req.received === true ? ymd_(today_()) : '' };
  if (cur) row.ID = cur.ID;
  save_(null, 'Permissions', row, { system: true, quiet: true }); log_(me.name, 'permission', 'Permissions', e.ID, who.n + (row.Received ? ' received' : ' not received'));
  return {};
};
ACTIONS.permissionEvent = function (req, me) {
  var r = req.row || {};
  if (!permOrgsFor_(r.Organization).some(function (o) { return isBishopric_(me) || me.orgs.indexOf(o) >= 0; })) throw new Error('Pick your organization.');
  if (!/^\d{4}-\d\d-\d\d$/.test(r.Date || '') || !r.Title) throw new Error('Add a title and date.');
  return { id: save_(me, 'Events', { Title: String(r.Title).slice(0, 120), Date: r.Date, 'End date': r['End date'] || '', Start: r.Start || '', Place: r.Place || '', Organization: r.Organization, Status: 'Approved', 'Permission form': true, Notes: r.Notes || '' }, { system: true }) };
};

/* ---------- funerals ---------- */
var FUNERAL_TASKS = [
  ['Visit the family; offer help with the funeral and the order of service', 'Bishop', 'Bishopric', 0],
  ['Reserve the building and tell the building scheduler', 'Executive secretary', 'Bishopric', 0],
  ['Arrange the family luncheon', 'Relief Society President', 'Relief Society', 1],
  ['Set up and take down chairs and tables', 'Elders Quorum President', 'Elders Quorum', -1],
  ['Ask the organist and chorister', 'Executive secretary', 'Music', 2],
  ['Print the order of service', 'Executive secretary', 'Bishopric', -2],
  ['Visit the family again after the funeral', 'Bishop', 'Bishopric', 14]
];
function addMins_(t, mins) { var k = timeKey_(t); if (k === '99:99') return ''; var m = (+k.slice(0, 2) * 60 + +k.slice(3) + mins + 1440) % 1440, h = Math.floor(m / 60); return ((h % 12) || 12) + ':' + ('0' + (m % 60)).slice(-2) + ' ' + (h < 12 ? 'AM' : 'PM'); }
ACTIONS.funeralCreate = function (req, me) {
  if (!isBishopric_(me)) throw new Error('Funerals are planned by the bishopric.');
  var r = req.row || {}; if (!r.Name || !/^\d{4}-\d\d-\d\d$/.test(r.Date || '')) throw new Error('Add the name and the date.');
  r.Status = r.Status || 'Planning';
  var id = save_(me, 'Funerals', r, { system: true }), made = [];
  if (req.calendar) { save_(me, 'Events', { Date: r.Date, Start: r.Time || '', Title: 'Funeral: ' + r.Name, Organization: 'Ward', Place: r.Place || '', Public: req.public === true, Status: 'Approved', Notes: r.Viewing ? 'Viewing ' + r.Viewing : '', Source: 'Funeral ' + id }, { system: true, quiet: true }); made.push('calendar'); }
  if (req.building) { save_(me, 'Building', { Date: r.Date, Start: addMins_(r.Time || '11:00 AM', -120), End: addMins_(r.Time || '11:00 AM', 210), Rooms: 'Chapel, Overflow, Relief Society room, Cultural hall, Kitchen', For: 'Ward', Contact: me.name, Kind: 'Ward', Purpose: 'Funeral: ' + r.Name, Status: 'Approved', 'Requested on': Utilities.formatDate(new Date(), tz_(), "yyyy-MM-dd'T'HH:mm"), 'Decided by': me.name }, { system: true, quiet: true }); made.push('building'); }
  if (req.tasks) {
    var d = parseYmd_(r.Date), t0 = today_();
    FUNERAL_TASKS.forEach(function (x) { var due = x[3] < 0 ? addDays_(d, x[3]) : x[3] >= 14 ? addDays_(d, x[3]) : addDays_(t0, x[3]); if (due > d && x[3] < 14) due = d; save_(me, 'Tasks', { Task: x[0] + ' (' + r.Name + ')', Owner: x[1], Organization: x[2], Due: ymd_(due), Status: 'Not started', Source: 'Funeral ' + id, Created: ymd_(t0) }, { system: true, quiet: true }); });
    made.push(FUNERAL_TASKS.length + ' tasks');
  }
  log_(me.name, 'funeral', 'Funerals', id, made.join(', '));
  return { id: id, made: made };
};
ACTIONS.funerals = function (req, me) {
  if (!(isBishopric_(me) || me.roles.clerk)) throw new Error('Funerals are for the bishopric.');
  var from = ymd_(addDays_(today_(), -120));
  return { list: rows_('Funerals').filter(function (f) { return !f.Date || f.Date >= from; }).map(strip_).sort(function (a, b) { return String(b.Date).localeCompare(String(a.Date)); }), canEdit: isBishopric_(me), ward: setting_('ward_name'), building: setting_('building_name'),
    quotes: rows_('Library').filter(function (l) { return l.Kind === 'Funeral quote' && l.Text && !/add your own|quotes the hub/i.test(l.Text); }).map(function (l) { return { text: l.Text, source: l.Source }; }) };
};

/* ---------- Ask the Hub: a short answer from the calendar and Sunday plans. Nothing personal leaves the spreadsheet. ---------- */
ACTIONS.ask = function (req, me) {
  if (!(isBishopric_(me) || me.roles.leader || me.roles.clerk)) throw new Error('Ask the Hub is for leaders.');
  if (!on_('ask_hub')) throw new Error('Ask the Hub is turned off in Settings.');
  var key = setting_('gemini_key'); if (!key) throw new Error('Ask the Hub needs a free Gemini key: Settings › Engine › Gemini key.');
  var q = String(req.q || '').trim().slice(0, 400); if (q.length < 3) throw new Error('Type a question.');
  var t = today_(), tY = ymd_(t), lines = ['Today is ' + tY + ' (' + Utilities.formatDate(t, tz_(), 'EEEE') + '). Ward: ' + (setting_('ward_name') || '') + '. Sacrament meeting: ' + (setting_('meeting_time') || '') + '.'];
  lines.push('CALENDAR (next 120 days):');
  occurrences_(me, tY, ymd_(addDays_(t, 120))).slice(0, 220).forEach(function (e) { lines.push(e.date + (e.time ? ' ' + e.time : '') + (e.endTime ? '-' + e.endTime : '') + ' | ' + e.title + ' | ' + e.org + (e.place ? ' | ' + e.place : '')); });
  meetingsFor_(t, 60).forEach(function (m) { lines.push(m.date + (m.time ? ' ' + m.time : '') + ' | ' + m.title + ' | meeting'); });
  if (can_(me, 'Participants', 'read')) {
    lines.push('SUNDAYS:');
    var end = ymd_(addDays_(t, 70)), P = rows_('Participants');
    rows_('Sundays').filter(function (s) { return s.Date >= tY && s.Date <= end; }).sort(function (a, b) { return a.Date.localeCompare(b.Date); }).forEach(function (s) {
      lines.push(s.Date + ' | ' + (s.Type || 'Regular') + (s.Conducting ? ' | conducting ' + s.Conducting : '') + ' | ' + P.filter(function (p) { return p.Date === s.Date; }).map(function (p) { return p.Role + ': ' + (p.Person || '?') + (p.Topic ? ' (' + p.Topic + ')' : '') + (p.Status ? ' [' + p.Status + ']' : ''); }).join('; '));
    });
  }
  if (can_(me, 'Teaching', 'read')) {
    lines.push('LESSONS:');
    var e6 = ymd_(addDays_(t, 42));
    visible_(me, 'Teaching').filter(function (r) { return r.Date >= tY && r.Date <= e6; }).slice(0, 120).forEach(function (r) { lines.push(r.Date + ' | ' + r.Organization + ' ' + (r.Class || '') + ' | ' + (r.Teacher || '?') + ' | ' + (r.Lesson || '')); });
  }
  var mine = ACTIONS.tasks({}, me).tasks.filter(function (x) { return x.mine && x.Status !== 'Done'; }).slice(0, 30);
  if (mine.length) { lines.push('MY TASKS:'); mine.forEach(function (x) { lines.push((x.Due || 'no date') + ' | ' + x.Task); }); }
  lines.push('BUILDING RULES: families may reserve ' + (setting_('bld_block_hours') || 4) + ' hours at a time, ' + (setting_('bld_max_open') || 2) + ' open requests, up to ' + (setting_('bld_weeks_ahead') || 8) + ' weeks ahead.');
  var prompt = 'You help the leaders of a congregation of The Church of Jesus Christ of Latter-day Saints plan their week. Answer the question in one to four short sentences, using only the facts below. ' +
    'Give dates as weekday and month day. If the answer is not below, say "I don\'t see that in the Hub." Do not invent names or dates.\n\n' + lines.join('\n') + '\n\nQUESTION: ' + q;
  var model = setting_('gemini_model') || 'gemini-2.5-flash';
  var res = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + encodeURIComponent(key), {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    payload: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 400 } })
  });
  if (res.getResponseCode() !== 200) throw new Error('Gemini didn\'t answer (' + res.getResponseCode() + '). Try again in a minute.');
  var body = JSON.parse(res.getContentText()), text = (((body.candidates || [])[0] || {}).content || { parts: [{}] }).parts.map(function (p) { return p.text || ''; }).join('').trim();
  log_(me.name, 'ask', '', '', '');
  return { answer: text || 'I don\'t see that in the Hub.' };
};


/* ================= Bringing things in: linked Google Sheets and Docs, pasted tables and text, photos and PDFs read by Gemini ================= */
/* Leaders connect their own organization's calendar, sheet or doc, or paste or scan. What runs unattended waits in Kevin's inbox unless he turns on Auto-approve. */

/* ---------- Gemini (free tier). Only calendar dates and lesson schedules are ever sent: never phone lists. ---------- */
function gemini_(parts) {
  var key = setting_('gemini_key'); if (!key) throw new Error('Reading photos, PDFs and Docs needs the free Gemini key (Settings › Engine › Gemini key). Kevin can add it.');
  var model = setting_('gemini_model') || 'gemini-2.5-flash';
  var res = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + encodeURIComponent(key), {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    payload: JSON.stringify({ contents: [{ parts: parts }], generationConfig: { responseMimeType: 'application/json', temperature: 0.1 } })
  });
  var code = res.getResponseCode();
  if (code !== 200) throw new Error(code === 429 ? 'Gemini\'s free allowance is used up for the moment. Try again in a few minutes.' : 'Gemini couldn\'t read it (' + code + '). Try a clearer photo or a smaller file.');
  var body = JSON.parse(res.getContentText()), text = (((body.candidates || [])[0] || {}).content || { parts: [{}] }).parts.map(function (p) { return p.text || ''; }).join('');
  try { return JSON.parse(text.replace(/^```(json)?|```$/g, '')); } catch (e) { throw new Error('Gemini\'s answer couldn\'t be read. Try again.'); }
}
function geminiRead_(goesTo, org, parts) {
  var ask = 'Today is ' + ymd_(today_()) + '. This comes from the "' + org + '" organization of a congregation of The Church of Jesus Christ of Latter-day Saints. ' +
    (goesTo === 'Teaching'
      ? 'It is a teaching schedule. List every lesson you can read. Answer only with JSON: {"summary":"one short sentence","lessons":[{"date":"YYYY-MM-DD","class":"","teacher":"","lesson":"","link":""}]}. '
      : 'List every dated event you can read. Answer only with JSON: {"summary":"one short sentence","events":[{"date":"YYYY-MM-DD","end":"YYYY-MM-DD or empty","start":"7:00 PM or empty","endTime":"","title":"","place":""}]}. ') +
    'Use the most likely year for each date (dates usually fall within the next 12 months). Leave out phone numbers, email addresses and the names of children.';
  return cleanRead_(goesTo, gemini_([{ text: ask }].concat(parts)));
}
function cleanRead_(goesTo, out) {
  var ok = function (d) { return /^\d{4}-\d\d-\d\d$/.test(d || ''); }, t = function (s, n) { return String(s || '').trim().slice(0, n || 120); };
  if (goesTo === 'Teaching') return { summary: t(out.summary, 200), lessons: (out.lessons || []).filter(function (l) { return ok(l.date) && (l.lesson || l.teacher); }).slice(0, 120).map(function (l) { return { date: l.date, cls: t(l['class'] || l.cls, 60), teacher: t(l.teacher, 80), lesson: t(l.lesson, 200), link: /^https?:\/\//.test(l.link || '') ? t(l.link, 400) : '' }; }) };
  return { summary: t(out.summary, 200), events: (out.events || []).filter(function (e) { return ok(e.date) && e.title; }).slice(0, 120).map(function (e) { return { date: e.date, end: ok(e.end) ? e.end : '', start: t(e.start, 12), endTime: t(e.endTime, 12), title: t(e.title), place: t(e.place) }; }) };
}

/* ---------- tables: a Google Sheet, or rows copied from Sheets, Excel, Word or an email ---------- */
var HEADS = {
  date: /^(date|day|when|sunday|week of|dates?)\b/, title: /^(event|activity|title|what|description|event name)\b/, start: /^(time|start|starts|start time|begins)\b/,
  end: /^(end|ends|end time)\b/, place: /^(place|location|where|room)\b/, cls: /^(class|group|quorum|course)\b/, teacher: /^(teacher|teachers|taught by|instructor|presenter)\b/,
  lesson: /^(lesson|topic|talk|chapter|reading|title|subject)\b/, link: /^(link|url|website)\b/, name: /^(name|member|person|full name|youth|sister|brother)\b/,
  phone: /^(phone|cell|mobile|phone number|cell phone)\b/, email: /^(email|e-mail|email address)\b/, parent: /^(parent|parents|parent phone|parent's phone)\b/
};
var NEED = { Events: ['date', 'title'], Teaching: ['date', 'lesson'], People: ['name'] };
function cellDate_(v) {
  if (v instanceof Date) return isNaN(v) ? '' : ymd_(v);
  var s = String(v || '').trim().replace(/^(sun|mon|tue|wed|thu|fri|sat)[a-z]*,?\s+/i, ''); if (!s) return '';
  if (/\d{4}/.test(s)) { var d = lcrDate_(s); if (d) return d; }
  var m = s.match(/^([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?$/) || s.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!m) return '';
  var t = today_(), x = /^\d/.test(m[1]) ? new Date(t.getFullYear(), +m[1] - 1, +m[2]) : new Date(m[1] + ' ' + m[2] + ', ' + t.getFullYear());
  if (isNaN(x)) return ''; if (x < addDays_(t, -60)) x.setFullYear(x.getFullYear() + 1);
  return ymd_(x);
}
function cellTime_(v) {
  if (v instanceof Date) return isNaN(v) ? '' : Utilities.formatDate(v, tz_(), 'h:mm a');
  var s = String(v || '').trim(), m = s.match(/(\d{1,2})(?::(\d\d))?\s*([ap]\.?m?\.?)?/i); if (!m) return '';
  var h = +m[1], ap = m[3] ? (/p/i.test(m[3]) ? 'PM' : 'AM') : (h >= 7 && h <= 11 ? 'AM' : 'PM');
  if (!m[3] && /p/i.test(s.slice(m.index + m[0].length))) ap = 'PM';
  return (h % 12 || 12) + ':' + (m[2] || '00') + ' ' + ap;
}
function tableRows_(vals, goesTo) {
  var need = NEED[goesTo] || NEED.Events;
  for (var i = 0; i < Math.min(vals.length, 10); i++) {
    var col = {}; vals[i].forEach(function (h, j) { var k = String(h || '').trim().toLowerCase(); if (!k) return; for (var f in HEADS) if (col[f] == null && HEADS[f].test(k) && !(goesTo === 'Teaching' && f === 'title')) { col[f] = j; break; } });
    if (goesTo === 'Teaching' && col.lesson == null && col.title != null) col.lesson = col.title;
    if (!need.every(function (f) { return col[f] != null; }) || (goesTo === 'People' && col.phone == null && col.email == null && col.parent == null)) continue;
    var out = [], get = function (r, f) { return col[f] == null ? '' : r[col[f]]; };
    for (var j = i + 1; j < vals.length; j++) {
      var r = vals[j]; if (!r.some(function (c) { return String(c).trim(); })) continue;
      if (goesTo === 'People') { var n = String(get(r, 'name')).trim(); if (n) out.push({ name: n, phone: lcrPhone_(get(r, 'phone')), email: String(get(r, 'email')).trim(), parent: lcrPhone_(get(r, 'parent')) }); continue; }
      var d = cellDate_(get(r, 'date')); if (!d) continue;
      var tm = String(get(r, 'start') instanceof Date ? '' : get(r, 'start')).split(/\s*[-–]\s*/);
      if (goesTo === 'Teaching') out.push({ date: d, cls: String(get(r, 'cls')).trim().slice(0, 60), teacher: String(get(r, 'teacher')).trim().slice(0, 80), lesson: String(get(r, 'lesson')).trim().slice(0, 200), link: /^https?:\/\//.test(String(get(r, 'link'))) ? String(get(r, 'link')).trim() : '' });
      else out.push({ date: d, start: cellTime_(get(r, 'start') instanceof Date ? get(r, 'start') : tm[0]), endTime: get(r, 'end') !== '' ? cellTime_(get(r, 'end')) : (tm[1] ? cellTime_(tm[1]) : ''), title: String(get(r, 'title')).trim().slice(0, 120), place: String(get(r, 'place')).trim().slice(0, 120), end: '' });
    }
    return out.filter(function (x) { return goesTo === 'People' || goesTo === 'Teaching' ? (x.lesson || x.teacher || x.name || x.phone) : x.title; });
  }
  return null;
}
function pastedTable_(text) {
  var lines = String(text || '').replace(/\r/g, '').split('\n').filter(function (l) { return l.trim(); });
  if (lines.length < 2 || !lines.some(function (l) { return l.indexOf('\t') >= 0; })) return null;
  return lines.map(function (l) { return l.split('\t'); });
}

/* ---------- linked Google Sheets: every tab, columns found by their headings ---------- */
function sheetSource_(s) {
  var ss;
  try { ss = /^https?:/.test(s.Link) ? SpreadsheetApp.openByUrl(s.Link) : SpreadsheetApp.openById(s.Link); }
  catch (e) { throw new Error('Can\'t open the sheet. In Google Sheets, tap Share and add ' + wardAccount_() + ' as a viewer.'); }
  var goes = s['Goes to'] || 'Events', rows = [], found = false;
  ss.getSheets().forEach(function (sh) {
    if (sh.getLastRow() < 2) return;
    var t = tableRows_(sh.getRange(1, 1, Math.min(sh.getLastRow(), 800), Math.min(sh.getLastColumn(), 26)).getValues(), goes);
    if (t) { found = true; rows = rows.concat(t); }
  });
  if (!found) throw new Error('No tab has the headings the Hub looks for (' + (goes === 'Teaching' ? 'Date and Lesson' : goes === 'People' ? 'Name and Phone' : 'Date and Event') + ').');
  if (goes === 'Events') { var r = upsertEvents_(s, rows.map(function (e) { return Object.assign(e, { uid: 'sheet:' + ss.getId() + '|' + e.date + '|' + nkey_(e.title), end: e.endTime, endDate: '' }); })); return rows.length + ' read · ' + r.added + ' new · ' + r.changed + ' changed' + (r.held ? ' · waiting for approval' : ''); }
  if (goes === 'Teaching') return holdOrApply_(s, { org: s.Organization, lessons: lessonChanges_(s.Organization, rows) }, rows.length);
  if (goes === 'People') return holdOrApply_(s, { org: s.Organization, people: peopleFills_(rows) }, rows.length, true);
  return 'Nothing to do';
}
/* ---------- linked Google Docs: Gemini reads the text when it changes ---------- */
function docSource_(s) {
  var goes = s['Goes to'] === 'Teaching' ? 'Teaching' : 'Events', text;
  if (s['Goes to'] === 'People') throw new Error('Phone lists need a Google Sheet, so they never go to Gemini.');
  try { text = (/^https?:/.test(s.Link) ? DocumentApp.openByUrl(s.Link) : DocumentApp.openById(s.Link)).getBody().getText(); }
  catch (e) { throw new Error('Can\'t open the Doc. In Google Docs, tap Share and add ' + wardAccount_() + ' as a viewer.'); }
  var p = PropertiesService.getScriptProperties(), hk = 'srcText:' + s.ID, h = hash_(text);
  if (p.getProperty(hk) === h) return 'No change since last time';
  var out = geminiRead_(goes, s.Organization, [{ text: 'DOCUMENT:\n' + text.slice(0, 40000) }]);
  p.setProperty(hk, h);
  if (goes === 'Teaching') return holdOrApply_(s, { org: s.Organization, lessons: lessonChanges_(s.Organization, out.lessons) }, out.lessons.length);
  var r = upsertEvents_(s, out.events.map(function (e) { return { uid: 'doc:' + s.ID + '|' + e.date + '|' + nkey_(e.title), date: e.date, endDate: e.end, start: e.start, end: e.endTime, title: e.title, place: e.place }; }));
  return out.events.length + ' read · ' + r.added + ' new · ' + r.changed + ' changed' + (r.held ? ' · waiting for approval' : '');
}
function hash_(s) { return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(s))).slice(0, 22); }
/* Lessons that are new or different from the teaching schedule. */
function lessonChanges_(org, lessons) {
  var have = {}; rows_('Teaching').forEach(function (r) { if (r.Organization === org) have[nkey_(r.Class) + '|' + r.Date] = r; });
  return (lessons || []).filter(function (l) { var c = have[nkey_(l.cls) + '|' + l.date]; return !c || (l.lesson && c.Lesson !== l.lesson) || (l.teacher && c.Teacher !== l.teacher) || (l.link && c.Link !== l.link); });
}
/* Phones and emails for people the ward list has without one. Never overwrites what LCR gave. */
function peopleFills_(rows) {
  var by = {}; rows_('People').forEach(function (p) { by[nkey_(p.Name)] = p; if (p['Sort name']) by[nkey_(p['Sort name'])] = p; });
  var out = [];
  rows.forEach(function (r) {
    var nm = String(r.name).replace(/^([^,]+),\s*(.+)$/, '$2 $1'), p = by[nkey_(nm)] || by[nkey_(r.name)]; if (!p) return;
    var set = {}, adult = (age_(p['Birth date']) || 99) >= 18;
    if (r.phone && !p.Phone) set.Phone = r.phone;
    if (r.email && !p.Email && /.+@.+\..+/.test(r.email)) set.Email = r.email;
    if (r.parent && !adult && !p['Parent phone']) set['Parent phone'] = r.parent;
    if (Object.keys(set).length) out.push({ name: p.Name, set: set });
  });
  return out;
}
/* Auto-approve applies it; otherwise one inbox item for Kevin (not repeated night after night). Phone lists always wait for Kevin. */
function holdOrApply_(s, data, read, always) {
  var n = (data.lessons || data.people || []).length; if (!n) return read + ' read · up to date';
  if (s['Auto-approve'] === true && !always) { var a = applyIn_(null, data, s.Kind + ': ' + s.Organization); return read + ' read · ' + a + ' updated'; }
  var p = PropertiesService.getScriptProperties(), hk = 'srcHold:' + s.ID, h = hash_(JSON.stringify(data));
  if (p.getProperty(hk) !== h) {
    save_(null, 'Inbox', { Received: Utilities.formatDate(new Date(), tz_(), "yyyy-MM-dd'T'HH:mm"), From: s.Kind + ' · ' + s.Organization, Kind: data.people ? 'Phone list' : 'Lessons', Summary: n + (data.people ? ' phone numbers or emails to fill in' : ' lessons new or changed'), Data: JSON.stringify(data), Status: 'New' }, { system: true, quiet: true });
    p.setProperty(hk, h);
  }
  return read + ' read · ' + n + ' waiting for approval';
}
function applyIn_(me, data, source) {
  var n = 0, org = data.org || 'Ward';
  (data.events || []).forEach(function (e) { save_(me, 'Events', { Date: e.date, 'End date': e.end || '', Start: e.start || '', End: e.endTime || '', Title: e.title, Organization: org, Place: e.place || '', Status: 'Approved', Source: source }, { system: true, quiet: true }); n++; });
  if (data.lessons) {
    var have = {}; rows_('Teaching').forEach(function (r) { if (r.Organization === org) have[nkey_(r.Class) + '|' + r.Date] = r; });
    data.lessons.forEach(function (l) {
      var c = have[nkey_(l.cls) + '|' + l.date], row = { Organization: org, Class: l.cls || (c && c.Class) || '', Date: l.date };
      if (l.lesson) row.Lesson = l.lesson; if (l.teacher) row.Teacher = l.teacher; if (l.link) row.Link = l.link;
      if (c) row.ID = c.ID; save_(me, 'Teaching', row, { system: true, quiet: true }); n++;
    });
  }
  if (data.people) {
    var P = {}; rows_('People').forEach(function (p) { P[p.Name] = p; });
    data.people.forEach(function (x) { var p = P[x.name]; if (!p) return; var row = { ID: p.ID }, any = false; for (var k in x.set) if (!p[k] && /^(Phone|Email|Parent phone)$/.test(k)) { row[k] = x.set[k]; any = true; } if (any) { save_(me, 'People', row, { system: true, quiet: true }); n++; } });
  }
  if (me) log_(me.name, 'brought in', '', '', n + ' from ' + source);
  return n;
}

/* ---------- what each leader sees: their connections, paste, scan ---------- */
function canOrg_(me, org) { return isBishopric_(me) || me.orgs.indexOf(org) >= 0 || (org === 'Youth' && me.orgs.some(function (o) { return /Young (Wo)?men/.test(o); })); }
function needLeader_(me) { if (!(isBishopric_(me) || me.roles.leader)) throw new Error('This is for organization leaders.'); }
ACTIONS.mySources = function (req, me) {
  needLeader_(me);
  var orgs = isBishopric_(me) ? ORG_LIST_.filter(function (o) { return o !== 'Bishopric'; }) : me.orgs.concat(me.orgs.some(function (o) { return /Young (Wo)?men/.test(o); }) ? ['Youth'] : []);
  return { orgs: orgs, account: wardAccount_(), gemini: !!setting_('gemini_key'), admin: !!me.roles.admin,
    sources: rows_('Sources').filter(function (s) { return s.Link && canOrg_(me, s.Organization); }).map(function (s) { return { id: s.ID, org: s.Organization, kind: s.Kind, goesTo: s['Goes to'] || 'Events', link: s.Link, auto: s['Auto-approve'] === true, schedule: s.Schedule, lastRead: s['Last read'], result: s.Result }; }) };
};
function kindOf_(link) {
  var l = String(link || '').trim();
  if (/docs\.google\.com\/spreadsheets\//.test(l)) return 'Google Sheet';
  if (/docs\.google\.com\/document\//.test(l)) return 'Google Doc';
  if (/^(https|webcal):\/\/\S+/i.test(l) && /ical|\.ics|calendar|outlook|webcal/i.test(l)) return 'iCal';
  if (/^[\w.+-]+@([\w-]+\.)*(google\.com|gmail\.com)$/i.test(l)) return 'Google Calendar';
  return '';
}
ACTIONS.sourceAdd = function (req, me) {
  needLeader_(me);
  var org = String(req.org || ''), link = String(req.link || '').trim(), goes = /^(Events|Teaching|People)$/.test(req.goesTo) ? req.goesTo : 'Events';
  if (!canOrg_(me, org)) throw new Error('Pick your organization.');
  var kind = kindOf_(link); if (!kind) throw new Error('That doesn\'t look like a Google Calendar, Google Sheet, Google Doc or calendar (iCal) link.');
  if (goes === 'People' && kind !== 'Google Sheet') throw new Error('Phone lists need a Google Sheet.');
  if (goes === 'Teaching' && /Calendar|iCal/.test(kind)) throw new Error('A teaching schedule needs a Google Sheet or Doc.');
  if (rows_('Sources').filter(function (s) { return s.Organization === org; }).length >= 8) throw new Error('That\'s plenty for one organization. Remove one first.');
  if (rows_('Sources').some(function (s) { return s.Link === link && s.Organization === org; })) throw new Error('That one is already connected.');
  var id = save_(me, 'Sources', { Organization: org, Kind: kind, Link: link, 'Goes to': goes, 'Auto-approve': false, Schedule: kind === 'Google Doc' ? 'Weekly' : 'Nightly' }, { system: true });
  var s = rows_('Sources').filter(function (x) { return x.ID === id; })[0];
  return { id: id, kind: kind, result: readSource_(s) };
};
function mySource_(me, id) { var s = rows_('Sources').filter(function (x) { return x.ID === id; })[0]; if (!s || !canOrg_(me, s.Organization)) throw new Error('Not found'); return s; }
ACTIONS.sourceReadNow = function (req, me) { needLeader_(me); return { result: readSource_(mySource_(me, req.id)) }; };
ACTIONS.sourceRemove = function (req, me) { needLeader_(me); var s = mySource_(me, req.id); sheet_('Sources').deleteRow(s._r); bump_('Sources'); log_(me.name, 'remove', 'Sources', s.ID, s.Kind + ' · ' + s.Organization); return { removed: true }; };
ACTIONS.sourceAuto = function (req, me) { if (!me.roles.admin) throw new Error('Only the executive secretary turns on Auto-approve.'); mySource_(me, req.id); save_(me, 'Sources', { ID: req.id, 'Auto-approve': req.on === true }, { system: true }); return {}; };
/* Read what a leader pasted or photographed. Nothing is saved until they tap Add. */
ACTIONS.readIn = function (req, me) {
  needLeader_(me);
  var org = String(req.org || ''), goes = /^(Events|Teaching|People)$/.test(req.goesTo) ? req.goesTo : 'Events';
  if (!canOrg_(me, org)) throw new Error('Pick your organization.');
  if (req.data) {
    if (goes === 'People') throw new Error('Phone lists can\'t be scanned. Paste them from a spreadsheet instead.');
    if (String(req.data).length > 14e6) throw new Error('That file is too large. Try a smaller photo.');
    return Object.assign({ how: 'gemini' }, geminiRead_(goes, org, [{ inline_data: { mime_type: String(req.mime || 'image/jpeg'), data: String(req.data) } }]));
  }
  var text = String(req.text || '').slice(0, 60000); if (!text.trim()) throw new Error('Paste something first.');
  var t = pastedTable_(text), rows = t ? tableRows_(t, goes) : null;
  if (rows && rows.length) {
    if (goes === 'People') { var f = peopleFills_(rows); return { how: 'table', summary: rows.length + ' names · ' + f.length + ' to fill in', people: f }; }
    return goes === 'Teaching' ? { how: 'table', summary: rows.length + ' lessons', lessons: rows } : { how: 'table', summary: rows.length + ' dates', events: rows };
  }
  if (goes === 'People') throw new Error('Copy the list from a spreadsheet with Name and Phone headings, then paste it here.');
  return Object.assign({ how: 'gemini' }, geminiRead_(goes, org, [{ text: 'PASTED TEXT:\n' + text }]));
};
ACTIONS.readInSave = function (req, me) {
  needLeader_(me);
  var org = String(req.org || ''); if (!canOrg_(me, org)) throw new Error('Pick your organization.');
  if (req.people) {
    var f = peopleFills_((req.people || []).map(function (x) { return { name: x.name, phone: (x.set || {}).Phone, email: (x.set || {}).Email, parent: (x.set || {})['Parent phone'] }; }));
    if (!f.length) return { added: 0, held: 0 };
    save_(null, 'Inbox', { Received: Utilities.formatDate(new Date(), tz_(), "yyyy-MM-dd'T'HH:mm"), From: me.name + ' · ' + org, Kind: 'Phone list', Summary: f.length + ' phone numbers or emails to fill in', Data: JSON.stringify({ org: org, people: f }), Status: 'New' }, { system: true });
    return { added: 0, held: f.length };
  }
  var data = cleanRead_(req.lessons ? 'Teaching' : 'Events', { events: req.events, lessons: req.lessons });
  data.org = org;
  return { added: applyIn_(me, data, 'Added by ' + me.name), held: 0 };
};

/* ---------- speaker and prayer reminders (Friday), and attendance marks for Relief Society and elders quorum leaders ---------- */
ACTIONS.reminders = function (req, me) {
  if (!isBishopric_(me)) throw new Error('Reminders are for the bishopric and executive secretary.');
  var d = /^\d{4}-\d\d-\d\d$/.test(req.date || '') ? req.date : ymd_(nextSunday_()), ppl = {}; rows_('People').forEach(function (p) { ppl[nkey_(p.Name)] = p; });
  var time = setting_('meeting_time') || '', when = Utilities.formatDate(parseYmd_(d), tz_(), 'EEEE, MMMM d');
  var verb = function (r) { return /speaker|high council/i.test(r) ? 'speaking' : /invocation/i.test(r) ? 'giving the opening prayer' : /benediction/i.test(r) ? 'giving the closing prayer' : /musical/i.test(r) ? 'sharing the musical number' : 'taking part'; };
  return { date: d, list: rows_('Participants').filter(function (p) { return p.Date === d && p.Person && /Accepted/.test(p.Status); }).sort(function (a, b) { return (+a.Order || 0) - (+b.Order || 0); }).map(function (p) {
    var q = ppl[nkey_(p.Person)] || {};
    return { id: p.ID, person: p.Person, role: p.Role, topic: p.Topic || '', reminded: p.Reminded || '', phone: q.Phone || '',
      text: 'Hi ' + first_(p.Person) + ', thank you for ' + verb(p.Role) + ' in sacrament meeting this ' + when + (time ? ' at ' + time : '') + '.' + (p.Topic && /speaker/i.test(p.Role) ? ' Your topic is ' + p.Topic + (p.Minutes ? ', about ' + p.Minutes + ' minutes' : '') + '.' : '') + ' Please sit on the stand a few minutes early. Thank you!' };
  }) };
};
ACTIONS.reminded = function (req, me) { if (!isBishopric_(me)) throw new Error('Not allowed'); save_(me, 'Participants', { ID: req.id, Reminded: ymd_(today_()) }, { system: true }); return {}; };
ACTIONS.setAttends = function (req, me) {
  var p = rows_('People').filter(function (x) { return x.Name === req.name; })[0]; if (!p) throw new Error('Not found');
  var a = age_(p['Birth date']), org = p.Gender === 'F' ? 'Relief Society' : 'Elders Quorum';
  if (!(isBishopric_(me) || me.roles.clerk || (me.orgs.indexOf(org) >= 0 && a !== null && a >= 18))) throw new Error('Only that person\'s presidency can mark this.');
  var v = ['Yes', 'Sometimes', 'No', 'Unknown'].indexOf(req.value) >= 0 ? req.value : 'Unknown';
  save_(me, 'People', { ID: p.ID, Attends: v }, { system: true }); return { attends: v };
};


/* ================= Emergency plan: what each leader does, step by step, and checking on every household ================= */
/* A starter plan from the Church's ward emergency planning guide. Replace it with the ward's own plan (the red binder) in All lists › Emergency. */
var EM_STARTER = [
  ['Info', 'Everyone', 1, 'Ward council gathering place', 'Fill in from the red binder (Settings › Emergency).'],
  ['Info', 'Everyone', 2, 'If phones are down', 'Text instead of calling: texts often get through when calls don\'t. If nothing works, go in person to the gathering place.'],
  ['Right away', 'Everyone', 1, 'Your family first', 'Make sure you and your family are safe. Give first aid. Call 911 for anything life-threatening.'],
  ['Right away', 'Everyone', 2, 'Follow civil authorities', 'Do what police and fire officials say: evacuate, or stay where you are.'],
  ['Right away', 'Everyone', 3, 'Check on those near you', 'Check on your neighbors, then on the families you minister to. Text a short report to your elders quorum or Relief Society leader.'],
  ['Right away', 'Bishop', 1, 'Go to the gathering place', 'Once your family is safe, go to the ward council gathering place, or gather the council by text.'],
  ['Right away', 'Bishop', 2, 'Start the check-in', 'Open More › Emergency plan and tap Start. Every leader then sees what to do, and elders quorum and Relief Society leaders mark each household.'],
  ['First hours', 'Bishop', 1, 'Report to the stake president', 'Report the condition of members and missionaries, then of the meetinghouse. Use the "Report to the stake" text on this screen.'],
  ['First hours', 'Bishop', 2, 'Meet the needs', 'Decide on food, shelter, medical care and clothing for those who need them, working with civil authorities and relief organizations.'],
  ['First days', 'Bishop', 1, 'Care for those who lost the most', 'Help members who lost homes, belongings or work, and those who are hurting. Look for ways the ward can help the community.'],
  ['Right away', 'Bishopric', 1, 'Help the bishop', 'Join the gathering. One counselor checks on the youth and Primary leaders; one checks on the meetinghouse from outside (never enter a damaged building).'],
  ['Right away', 'Executive secretary', 1, 'Keep the list', 'Watch the check-in on this screen. Call or text anyone marked "Can\'t reach." Keep a short log of decisions.'],
  ['First hours', 'Executive secretary', 2, 'Send the report', 'Send the bishop\'s report to the stake when he approves it.'],
  ['Right away', 'Elders quorum', 1, 'Start the ministering brothers', 'Text the zone leaders to check on every household they minister to.'],
  ['First hours', 'Elders quorum', 2, 'Mark each household', 'Mark each one Safe, Needs help or Can\'t reach in the check-in, with any needs (medical, shelter, food, utilities).'],
  ['First hours', 'Elders quorum', 3, 'Organize help', 'Gather brothers with tools and skills (chainsaws, generators, first aid) where the bishop sends them.'],
  ['Right away', 'Relief Society', 1, 'Start the ministering sisters', 'Text ministering sisters to check on every sister and family they minister to. Check first on those who live alone, are elderly or have special needs.'],
  ['First hours', 'Relief Society', 2, 'Mark each household', 'Mark each one Safe, Needs help or Can\'t reach in the check-in, with any needs.'],
  ['First hours', 'Relief Society', 3, 'Care and meals', 'Arrange meals, a place to stay, and someone to sit with those who are frightened or grieving.'],
  ['Right away', 'Youth leaders', 1, 'If it happens at an activity', 'Keep the youth together with two adults. Take roll. Contact parents. Release a youth only to a parent or someone the parent names.'],
  ['First hours', 'Youth leaders', 2, 'Afterward', 'Text the parents of every youth in your class to be sure they are safe, and tell your president.'],
  ['Right away', 'Primary', 1, 'If it happens during church', 'Teachers keep children together and leave by the nearest safe exit to the gathering spot outside. Take roll. Release a child only to a parent or guardian.'],
  ['Right away', 'Teachers', 1, 'If it happens during class', 'Stay with your class, leave by the nearest safe exit, and take roll at the gathering spot outside.'],
  ['First hours', 'Clerk', 1, 'Records and the list', 'Keep ward records safe and help the executive secretary reach those marked "Can\'t reach."'],
  ['Right away', 'Emergency specialist', 1, 'Communications', 'Set up the backup ways to talk (text, radio, in person) and keep the bishop connected to the stake.'],
  ['Before', 'Everyone', 1, 'Your family plan', 'Keep a 72-hour kit, water and a family plan. Know where you would meet if you were apart.'],
  ['Before', 'Bishopric', 1, 'Review the plan yearly', 'Ward council reviews this plan once a year and after any emergency.'],
  ['Before', 'Elders quorum', 1, 'Keep the lists current', 'With the Relief Society: members with special needs, and members with useful skills or equipment.'],
  ['Before', 'Emergency specialist', 1, 'Test the backups', 'Test the backup ways to talk twice a year.']
];
function emSeed_() {
  if (rows_('Emergency').length) return;
  EM_STARTER.forEach(function (r) { save_(null, 'Emergency', { Phase: r[0], Role: r[1], Order: r[2], Title: r[3], Text: r[4], Notes: 'Starter plan' }, { system: true, quiet: true }); });
}
/* Which parts of the plan are this person's. */
function emRoles_(me) {
  var r = ['Everyone'], c = (me.callings || []).join('|');
  if ((me.callings || []).some(function (x) { return /^Bishop$/i.test(x); })) r.push('Bishop');
  if (me.roles.bishopric) r.push('Bishopric');
  if (/Executive Secretary/i.test(c)) r.push('Executive secretary');
  if (me.roles.clerk) r.push('Clerk');
  if (me.orgs.indexOf('Elders Quorum') >= 0) r.push('Elders quorum');
  if (me.orgs.indexOf('Relief Society') >= 0) r.push('Relief Society');
  if (me.orgs.indexOf('Young Women') >= 0 || me.orgs.indexOf('Young Men') >= 0) r.push('Youth leaders');
  if (me.orgs.indexOf('Primary') >= 0) r.push('Primary');
  if (me.roles.teacher) r.push('Teachers');
  if (/emergency|preparedness/i.test(c)) r.push('Emergency specialist');
  if (/ministering/i.test(c) || me.orgs.indexOf('Elders Quorum') >= 0 || me.orgs.indexOf('Relief Society') >= 0) r.push('Ministering');
  return r;
}
function emActive_() { try { return JSON.parse(setting_('emergency_active') || 'null'); } catch (e) { return null; } }
function canCheck_(me) { return isBishopric_(me) || me.roles.clerk || me.orgs.indexOf('Elders Quorum') >= 0 || me.orgs.indexOf('Relief Society') >= 0; }
ACTIONS.emergency = function (req, me) {
  if (!(isBishopric_(me) || me.roles.leader || me.roles.clerk || me.roles.teacher)) throw new Error('The emergency plan is for leaders and teachers.');
  emSeed_();
  var mine = emRoles_(me), plan = rows_('Emergency').map(strip_).sort(function (a, b) { return String(a.Role).localeCompare(String(b.Role)) || (+a.Order || 0) - (+b.Order || 0); });
  var C = rows_('Callings').filter(function (c) { return !/Released|Proposed|Open/.test(c.Status); }), ppl = {}; rows_('People').forEach(function (p) { ppl[nkey_(p.Name)] = p; });
  var key = /^(Bishop|Bishopric .*Counselor|Ward Executive Secretary|Ward Clerk|Relief Society President|Elders Quorum President|Young Women President|Primary President|Sunday School President|Ward Mission Leader|.*Emergency.*)$/i;
  var contacts = C.filter(function (c) { return key.test(c.Calling); }).map(function (c) { var p = ppl[nkey_(c.Person)] || {}; return { name: c.Person, calling: c.Calling, phone: p.Phone || '' }; });
  var out = { plan: plan, mine: mine, active: emActive_(), contacts: contacts, canStart: isBishopric_(me), canCheck: canCheck_(me), canEdit: isBishopric_(me),
    places: [setting_('emergency_place1'), setting_('emergency_place2')].filter(Boolean), stake: setting_('emergency_stake_phone'), hours: +setting_('emergency_hours') || 4 };
  if (out.active && canCheck_(me)) out.check = emBoard_(me, out.active);
  return out;
};
/* Every household, with its latest mark in this emergency. Elders quorum and Relief Society see the households they serve; the bishopric sees all. */
function emBoard_(me, act) {
  var latest = {}; rows_('Check-ins').forEach(function (r) { if (r.Event === act.id && (!latest[r.Household] || String(r.When) >= String(latest[r.Household].When))) latest[r.Household] = r; });
  var hh = {};
  rows_('People').forEach(function (p) {
    if (p.Source === 'Moved out') return;
    var h = p.Household || p['Sort name'] || p.Name; (hh[h] = hh[h] || { household: h, people: [], phones: [] });
    hh[h].people.push(p.Name); if (p.Phone && (age_(p['Birth date']) || 99) >= 18) hh[h].phones.push({ n: p.Name, p: p.Phone });
  });
  var list = Object.keys(hh).sort().map(function (k) { var x = hh[k], l = latest[k]; x.status = l ? l.Status : ''; x.needs = l ? l.Needs : ''; x.by = l ? l.By : ''; x.when = l ? l.When : ''; x.phones = x.phones.slice(0, 2); x.people = x.people.slice(0, 8); return x; });
  var n = function (s) { return list.filter(function (x) { return x.status === s; }).length; };
  return { list: list, counts: { total: list.length, safe: n('Safe'), help: n('Needs help'), cant: n('Can\'t reach'), left: n('') } };
}
ACTIONS.emergencyStart = function (req, me) {
  if (!isBishopric_(me)) throw new Error('The bishopric starts the emergency check-in.');
  var name = String(req.name || '').trim().slice(0, 80) || 'Emergency';
  var act = { id: 'EM-' + Utilities.formatDate(new Date(), tz_(), "yyyyMMdd-HHmm"), name: name, started: Utilities.formatDate(new Date(), tz_(), "yyyy-MM-dd'T'HH:mm"), by: me.name };
  save_(me, 'Settings', { Key: 'emergency_active', Value: JSON.stringify(act) }, { system: true }); SET_CACHE_ = null;
  return { active: act };
};
ACTIONS.emergencyEnd = function (req, me) {
  if (!isBishopric_(me)) throw new Error('The bishopric ends the emergency check-in.');
  save_(me, 'Settings', { Key: 'emergency_active', Value: '' }, { system: true }); SET_CACHE_ = null; return {};
};
ACTIONS.checkIn = function (req, me) {
  if (!canCheck_(me)) throw new Error('Elders quorum and Relief Society leaders and the bishopric mark households.');
  var act = emActive_(); if (!act) throw new Error('No emergency check-in is running.');
  if (['Safe', 'Needs help', 'Can\'t reach'].indexOf(req.status) < 0) throw new Error('Pick Safe, Needs help or Can\'t reach.');
  var h = String(req.household || '').slice(0, 120); if (!h) throw new Error('Pick a household.');
  save_(null, 'Check-ins', { Event: act.id, Household: h, Status: req.status, Needs: String(req.needs || '').slice(0, 300), By: me.name, When: Utilities.formatDate(new Date(), tz_(), "yyyy-MM-dd'T'HH:mm") }, { system: true, quiet: true });
  return { counts: emBoard_(me, act).counts };
};


/* ================= One-time repairs (run by setUp; safe to repeat) ================= */
function repairs_() {
  // Names that came over as "Last, First" (two-word last names) become "First Last".
  rows_('People').forEach(function (p) {
    if (String(p.Name).indexOf(',') >= 0 && p['Sort name'] && String(p['Sort name']).indexOf(',') > 0) {
      var parts = String(p['Sort name']).split(','), fixed = parts.slice(1).join(',').trim() + ' ' + parts[0].trim();
      var old = p.Name;
      save_(null, 'People', { ID: p.ID, Name: fixed }, { system: true, quiet: true });
      ['Groups', 'Callings', 'Participants'].forEach(function (t) {
        rows_(t).forEach(function (r) { if (r.Person === old) save_(null, t, { ID: r.ID, Person: fixed }, { system: true, quiet: true }); });
      });
    }
  });
}


/* ================= Import: add rows from an uploaded workbook (File › Import › Insert new sheets) ================= */
/* Any sheet named "Import Groups", "Import Events" … is appended to that tab by its column names, then removed. */
function mergeImports() {
  var done = [];
  ss_().getSheets().forEach(function (sh) {
    var m = sh.getName().match(/^Import[ :_-]+(.+)$/i); if (!m) return;
    var tab = m[1].trim(), d = tabDef_(tab); if (!d || sh.getLastRow() < 2) return;
    var vals = sh.getRange(1, 1, sh.getLastRow(), sh.getLastColumn()).getValues(), head = vals[0].map(String), n = 0;
    var have = {}; rows_(tab).forEach(function (r) { have[String(r[d.cols[0][0]])] = 1; });
    if (tab === 'Groups') { // lists like Cleaning are replaced as a whole, so they never double up
      var ki = head.indexOf('Kind'), kinds = {};
      if (ki >= 0) for (var a = 1; a < vals.length; a++) if (/^(Cleaning|Flags|Other|Dinner group)$/.test(vals[a][ki])) kinds[vals[a][ki]] = 1;
      var gsh = sheet_('Groups'); rows_('Groups').filter(function (g) { return kinds[g.Kind]; }).sort(function (x, y) { return y._r - x._r; }).forEach(function (g) { gsh.deleteRow(g._r); });
      bump_('Groups');
    }
    for (var i = 1; i < vals.length; i++) {
      var row = {}; head.forEach(function (h, j) { if (h) row[h] = vals[i][j] instanceof Date ? ymd_(vals[i][j]) : vals[i][j]; });
      if (d.cols[0][1] !== 'id' && row[d.cols[0][0]] && have[String(row[d.cols[0][0]])]) continue;
      if (!Object.keys(row).some(function (k) { return row[k] !== '' && row[k] !== null; })) continue;
      if (d.cols[0][1] === 'id') delete row[d.cols[0][0]];
      save_(null, tab, row, { system: true, quiet: true }); n++;
    }
    ss_().deleteSheet(sh); done.push(tab + ': ' + n);
  });
  log_('Hub', 'import', '', '', done.join(', '));
  try { SpreadsheetApp.getUi().alert(done.length ? 'Added ' + done.join(', ') : 'No sheets named "Import …" were found.'); } catch (e) {}
  return done;
}

// ===== END OF WARD HUB ENGINE (if you can see this line, you copied everything) =====
