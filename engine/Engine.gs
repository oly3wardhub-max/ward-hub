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
  {"name":"Meetings","section":"Leaders","cols":[["ID","id"],["Type","choice:Bishopric,Ward council,Youth council,Presidency,Missionary coordination,Temple & family history coordination,PEC,Other"],["Organization","org"],["Date","date"],["Time","time"],["Status","choice:Planned,Held,Cancelled"],["Opening prayer","person"],["Spiritual thought","person"],["Closing prayer","person"],["Notes","text"],["Summary","text"],["Transcript","text"],["Minutes sent","date"]],"read":["admin","bishopric","clerk"],"edit":["admin","bishopric"],"scope":null,"note":"Meetings. Agenda items are on Agenda.","help":["","","For presidency meetings","","","","","","","","Key points the Hub drew from the recording or notes","Private Drive file (deleted after the set number of days)",""]},
  {"name":"Agenda","section":"Leaders","cols":[["ID","id"],["Meeting","ref:Meetings"],["Order","number"],["Item","text"],["Lead","text"],["Minutes","number"],["Notes","text"],["Decision","text"],["Source","text"]],"read":["admin","bishopric","clerk"],"edit":["admin","bishopric"],"scope":null,"note":"Agenda items and minutes for each meeting.","help":["","","","","","","","",""]},
  {"name":"Tasks","section":"Leaders","cols":[["ID","id"],["Task","text"],["Owner","text"],["Organization","org"],["Due","date"],["Status","choice:Not started,In progress,Waiting,Done"],["Source","text"],["Notes","text"],["Created","date"],["Done on","date"]],"read":["admin","bishopric","clerk","leader"],"edit":["admin","bishopric","clerk","leader"],"scope":"Organization","note":"Everyone's to-dos.","help":["","","Name or calling","","","","Meeting, Sunday or calling change","","",""]},
  {"name":"Appointments","section":"Leaders","cols":[["ID","id"],["Date","date"],["Time","time"],["Minutes","number"],["With","choice:Bishop,First counselor,Second counselor,Executive secretary,Clerk"],["Person","person"],["Purpose","text"],["Place","text"],["Status","choice:Open,Booked,Done,Cancelled,No-show"],["Source","text"],["Phone","phone"],["Notes","text"],["Calendar event","text"],["Reminded","date"]],"read":["admin"],"edit":["admin","bishopric"],"scope":null,"note":"Interviews and appointments. Booking pages show only open or taken, never who. Counselors see names only for their own.","help":["","","","","","","Hidden from everyone but the bishopric and Kevin","","","","","","",""]},
  {"name":"Training","section":"Leaders","cols":[["ID","id"],["Person","person"],["Calling","text"],["Course","text"],["Completed","date"],["Expires","date"],["Emailed 60","date"],["Texted 30","date"],["Texted 15","date"],["Notes","text"]],"read":["admin","bishopric"],"edit":["admin"],"scope":null,"note":"Youth protection training, from the LCR report.","help":["","","","Protecting Children and Youth","","","","","",""]},
  {"name":"Recommends","section":"Leaders","cols":[["ID","id"],["Person","person"],["Type","text"],["Expires","date"],["Updated","date"]],"read":["admin","bishopric"],"edit":["admin","bishopric"],"scope":null,"note":"Temple recommend expirations. Bishopric only.","help":["","","","",""]},
  {"name":"Permissions","section":"Calendar","cols":[["ID","id"],["Event","text"],["Date","date"],["Title","text"],["Organization","org"],["Person","person"],["Received","bool"],["Received on","date"],["Notes","text"]],"read":["admin","bishopric"],"edit":["admin","bishopric"],"scope":null,"note":"Permission and medical release forms turned in for activities and trips. Leaders use it from the app.","help":["","Calendar item ID","","","","Youth or child","","",""]},
  {"name":"Newsletters","section":"Leaders","cols":[["ID","id"],["Organization","org"],["Date","date"],["Subject","text"],["Intro","text"],["Items","text"],["Include calendar","bool"],["Attachment","link"],["Status","choice:Draft,Scheduled,Sending,Sent"],["Sent on","date"],["Sent to","number"],["Send plan","json"],["Notes","text"]],"read":["admin","bishopric","leader"],"edit":["admin","bishopric","leader"],"scope":"Organization","note":"Organization newsletters (Relief Society first).","help":["","","","","","A line starting with # is a heading; [lessons], [birthdays], [stake calendar], [ward calendar] and [new members] fill themselves in","","A link to the stake memo or a flyer","","","","Which addresses go on which day (made by the Hub)",""]},
  {"name":"Funerals","section":"Leaders","cols":[["ID","id"],["Name","text"],["Date","date"],["Time","time"],["Place","text"],["Viewing","text"],["Family contact","text"],["Family phone","phone"],["Presiding","text"],["Conducting","text"],["Organist","text"],["Chorister","text"],["Family prayer","text"],["Opening hymn","text"],["Invocation","text"],["Life sketch","text"],["Speakers","text"],["Musical numbers","text"],["Closing hymn","text"],["Benediction","text"],["Dedication of the grave","text"],["Burial","text"],["Luncheon","text"],["Status","choice:Planning,Held"],["Notes","text"]],"read":["admin","bishopric","clerk"],"edit":["admin","bishopric"],"scope":null,"note":"Funeral planning and the order of service.","help":["","Who passed away","","","","e.g. 9:30\u201310:30 AM, Relief Society room","","","","","","","","","","","One per line","One per line","","","","","","",""]},
  {"name":"Emergency","section":"Emergency","cols":[["ID","id"],["Phase","choice:Right away,First hours,First days,Before,Info,Hazard"],["Role","text"],["Order","number"],["Title","text"],["Text","text"],["Phone","phone"],["Link","link"],["Notes","text"]],"read":["admin","bishopric","clerk","leader","teacher"],"edit":["admin","bishopric"],"scope":null,"note":"The ward emergency plan, by role. Opens on phones even without a connection once it has been opened once.","help":["","","Everyone, Bishop, Bishopric, Executive secretary, Clerk, Elders quorum, Relief Society, Ministering, Youth leaders, Primary, Teachers, Emergency specialist","","","What to do","","",""]},
  {"name":"Check-ins","section":"Emergency","cols":[["ID","id"],["Event","text"],["Household","text"],["Status","choice:Safe,Needs help,Urgent,Can't reach,Check first"],["Needs","text"],["By","text"],["When","datetime"]],"read":["admin","bishopric"],"edit":["admin","bishopric"],"scope":null,"note":"Who has been accounted for in an emergency. Elders quorum and Relief Society leaders mark households from the app.","help":["","Which emergency","","","Medical, shelter, food, utilities\u2026","",""]},
  {"name":"Missionaries","section":"Leaders","cols":[["ID","id"],["Name","text"],["Title","choice:Elder,Sister,Couple"],["Mission","text"],["Email","email"],["Left","date"],["Home","date"],["On program","bool"],["Notes","text"]],"read":["admin","bishopric","clerk","member"],"edit":["admin","bishopric"],"scope":null,"note":"Missionaries serving from the ward.","help":["","","","","","","Expected","",""]},
  {"name":"Sources","section":"Engine","cols":[["ID","id"],["Organization","org"],["Kind","choice:Google Calendar,Google Sheet,Google Doc,iCal,Upload"],["Link","link"],["Goes to","choice:Events,Teaching,Groups,People,Announcements"],["Auto-approve","bool"],["Schedule","choice:Nightly,Weekly,Manual"],["Last read","datetime"],["Result","text"]],"read":["admin"],"edit":["admin"],"scope":null,"note":"Where each organization's calendar, lists and schedules come from.","help":["","","","","","","","",""]},
  {"name":"Inbox","section":"Engine","cols":[["ID","id"],["Received","datetime"],["From","text"],["Kind","text"],["Summary","text"],["Data","json"],["Status","choice:New,Approved,Edited,Skipped"],["Decided by","text"],["Decided on","datetime"]],"read":["admin"],"edit":["admin"],"scope":null,"note":"Things the Hub read that need a person's OK.","help":["","","","","","What the Hub read","","",""]},
  {"name":"Log","section":"Engine","cols":[["When","datetime"],["Who","text"],["Action","text"],["Tab","text"],["Row","text"],["Detail","text"]],"read":["admin"],"edit":[],"scope":null,"note":"Every change, newest first. Kept 18 months.","help":["","","","","",""]},
  {"name":"Library","section":"Library","cols":[["ID","id"],["Kind","choice:Quote,Image,Talk prompt,Agenda template,Event template,Funeral quote,Sacrament sentiment,Zone duty,Rotation"],["Title","text"],["Text","text"],["Source","text"],["Link","link"],["Best for","text"],["Notes","text"]],"read":["admin","bishopric","clerk","leader","music"],"edit":["admin","bishopric"],"scope":null,"note":"Quotes, pictures, talk prompts and templates.","help":["","","","","","","",""]},
  {"name":"Hymns","section":"Library","cols":[["Number","id"],["Title","text"],["Book","choice:Hymns,Hymns\u2014For Home and Church,Children's Songbook"]],"read":["admin","bishopric","clerk","leader","music","member"],"edit":["admin","music"],"scope":null,"note":"Hymn numbers and titles.","help":["","",""]},
  {"name":"Flag subscribers","section":"Community","cols":[["ID","id"],["Name","text"],["Address","text"],["Phone","phone"],["Email","email"],["Zone","text"],["Order","number"],["Flags","number"],["Pledged","number"],["Paid","number"],["Paid on","date"],["How paid","text"],["Season","text"],["Placement","text"],["Stopped","bool"],["Notes","text"]],"read":["admin","bishopric"],"edit":["admin","bishopric"],"scope":null,"note":"Homes that get a flag on holidays. Addresses are private: only the flag coordinators see this list; each crew sees only its own route.","help":["","Household or name","Where the flag goes","Coordinators only; never on the crew page","","1, 2, 3\u2026","Stop number in the zone (blank = by street)","How many flags","Donation promised","Amount received","","Cash, check, Venmo\u2026","Which year this sign-up is for","Shown to the crew, e.g. left of the driveway","Yes = no flag this season","Coordinators only"]},
  {"name":"Flag crews","section":"Community","cols":[["ID","id"],["Holiday","text"],["Date","date"],["Zone","text"],["Person","text"],["Kind","choice:Adult,Youth,Family"],["Status","choice:Assigned,Trade asked,Traded"],["Notes","text"]],"read":["admin","bishopric"],"edit":["admin","bishopric"],"scope":null,"note":"Who puts out the flags in each zone on each holiday. Holidays are calendar items titled Flags: \u2026","help":["","Calendar item ID of the holiday","","","Adult, youth or family","","",""]},
  {"name":"Sign-ups","section":"Community","cols":[["ID","id"],["Title","text"],["Organization","org"],["Description","text"],["Closes","date"],["Status","choice:Open,Closed"],["Kind","choice:Slots,Dinner groups"],["Slots","json"],["Created by","text"],["Created","date"]],"read":["admin","bishopric","leader"],"edit":["admin","bishopric","leader"],"scope":"Organization","note":"Sign-up sheets with a public link. Names show as first name and last initial; phones only to the organizer.","help":["Also the public link","","","","Last day to sign up","","","Made by the app","",""]},
  {"name":"Sign-up entries","section":"Community","cols":[["ID","id"],["Sheet","text"],["Slot","text"],["Name","text"],["Phone","phone"],["Note","text"],["Added","datetime"],["Added by","text"],["Code","secret"]],"read":["admin","bishopric"],"edit":["admin","bishopric"],"scope":null,"note":"Who signed up for what. Leaders see their own sheets in the app.","help":["","","","","","","","Blank = from the public page","Lets the person take their own name off"]},
  {"name":"Ministering Interviews","section":"Leaders","cols":[["ID","id"],["Organization","org"],["Minister","person"],["Date","date"],["By","text"],["Note","text"]],"read":[],"edit":[],"scope":null,"note":"Quarterly ministering interviews, kept by the elders quorum and Relief Society presidencies from the app. LCR is still the official record.","help":["","","Who was interviewed (or the companionship)","","Who held the interview","Private: only that presidency and the bishop see it in the app"]},
  {"name":"Away","section":"Sunday","cols":[["ID","id"],["Person","person"],["From","date"],["To","date"],["Note","text"],["Added","date"]],"read":["admin","bishopric","clerk","music","leader"],"edit":["admin","bishopric"],"scope":null,"note":"Dates leaders, the bishopric and musicians will be away. Sunday planning warns when someone assigned is away.","help":["","","First day away","Last day away","",""]},
  {"name":"Feedback","section":"Engine","cols":[["ID","id"],["When","datetime"],["From","text"],["Contact","text"],["Text","text"],["Status","choice:New,Read,Done"],["Notes","text"]],"read":[],"edit":[],"scope":null,"note":"Feedback from the public feedback page. Only the bishop sees it in the app.","help":["","","Blank = anonymous","","","",""]},
  {"name":"Substitutes","section":"Teaching","cols":[["ID","id"],["Organization","org"],["Class","text"],["Date","date"],["Teacher","text"],["Phone","phone"],["Note","text"],["Status","choice:Asked,Found,Cancelled"],["Substitute","text"],["Task","text"],["Created","datetime"]],"read":["admin","bishopric","leader"],"edit":["admin","bishopric"],"scope":"Organization","note":"Teachers asking for a substitute (from sub.html). The presidency sees each one on Today.","help":["","","","The Sunday","Who asked","","","","","Task ID on the president's list",""]},
  {"name":"Checklist Templates","section":"Leaders","cols":[["ID","id"],["Name","text"],["Organization","org"],["Steps","text"],["Notes","text"]],"read":["admin","bishopric","leader"],"edit":["admin","bishopric"],"scope":null,"note":"Checklists the Hub offers: move-in welcome, temple preparation, new convert, mission preparation, and your own.","help":["","","Who runs it","One step per line",""]},
  {"name":"Checklists","section":"Leaders","cols":[["ID","id"],["Person","person"],["Checklist","text"],["Organization","org"],["Steps","json"],["Started by","text"],["Started","date"],["Status","choice:Open,Done"],["Notes","text"]],"read":["admin","bishopric"],"edit":["admin","bishopric"],"scope":"Organization","note":"Checklists in progress for a person. The bishopric and the organization that owns each one see it.","help":["","Who it is for","","","Made by the Hub","","","",""]},
  {"name":"Youth Agendas","section":"Leaders","cols":[["ID","id"],["Date","date"],["Organization","org"],["Class","text"],["Conducting","text"],["Opening prayer","text"],["Spiritual thought","text"],["Business","text"],["Lesson","text"],["Introduces the lesson","text"],["Helps teach","text"],["Closing prayer","text"],["Notes","text"]],"read":["admin","bishopric"],"edit":["admin","bishopric"],"scope":"Organization","note":"Youth class and quorum presidencies' Sunday agendas. Names only, never phone numbers.","help":["","The Sunday","","Class or quorum","","","","","","","","",""]},
  {"name":"Visits","section":"Leaders","cols":[["ID","id"],["Date","date"],["Time","time"],["Meeting","text"],["Organization","org"],["Visitor","text"],["Host","text"],["Notes","text"]],"read":["admin","bishopric","leader"],"edit":["admin","bishopric"],"scope":"Organization","note":"Which stake leader visits which class or meeting on ward conference Sunday.","help":["","Ward conference Sunday","","Class or meeting visited","","Stake leader","Ward leader who welcomes them",""]}
],"settings":[
  ["ward_name", "Ward", "Ward name", "", "Shown at the top of the app and program"],
  ["stake_name", "Ward", "Stake name", "", ""],
  ["time_zone", "Ward", "Time zone", "America/Denver", ""],
  ["meeting_time", "Ward", "Sacrament meeting starts", "9:00 AM", "In even years, if the time changes every other January"],
  ["meeting_time_odd", "Ward", "Sacrament meeting starts in odd years (blank = same every year)", "", "For wards whose building schedule rotates every January"],
  ["meetings_before", "Meetings", "Bishopric and ward council start this many minutes before sacrament meeting (when no time is set)", "90", ""],
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
  ["publish_minutes_before", "Program", "Publish the program this many minutes before the meeting (Sundays)", "15", "Republishes if anything changed since"],
  ["zoom_link", "Program", "Zoom link for sacrament meeting (blank = none)", "", "Shown on the online program, with its own QR code"],
  ["show_birthdays", "Program", "Show birthdays on the program", "Yes", ""],
  ["show_quote", "Program", "Show the quote on the program", "Yes", ""],
  ["show_picture", "Program", "Picture of the Savior on the program", "Yes", ""],
  ["bishopric_weeks", "Meetings", "Bishopric meeting Sundays (1-5)", "2,4,5", ""],
  ["council_weeks", "Meetings", "Ward council Sundays (1-5)", "1,3", ""],
  ["council_time", "Meetings", "Ward council time (blank = before sacrament meeting)", "", ""],
  ["bishopric_time", "Meetings", "Bishopric meeting time (blank = before sacrament meeting)", "", ""],
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
  ["meeting_ai", "Engine", "Record and summarize meetings: Off, Paid key, or Free key (free: no bishopric meetings)", "Off", "On the free plan Google may use what is sent to improve its products"],
  ["transcript_days", "Engine", "Keep meeting transcripts this many days", "30", ""],
  ["permit_keep_days", "Youth", "Keep signed permission forms (PDF) this many days", "365", "Then they move to the Drive trash"],
  ["gemini_key", "Engine", "Gemini key (free tier) for reading photos and Docs", "", "Kept private"],
  ["gemini_model", "Engine", "Gemini model", "gemini-2.5-flash", "Change only if Google retires this one"],
  ["app_url", "Engine", "App address", "", ""],
  ["api_url", "Engine", "Engine address (Deploy \u203a Web app URL)", "", "Filled in after the first deployment"],
  ["public_calendar", "Engine", "Show the public calendar", "Yes", ""],
  ["flag_org", "Flags", "Organization that runs the flag fundraiser", "Young Men", "Its leaders and the bishopric manage the flags"],
  ["flag_donation", "Flags", "Suggested donation per flag for the year (blank = none)", "", ""],
  ["flag_zones", "Flags", "Number of zones", "3", ""],
  ["flag_zone_names", "Flags", "Zone names, comma separated (optional)", "", "e.g. North, Middle, South"],
  ["flag_season", "Flags", "Current season (blank = this year)", "", "Set from the app when a new season starts"],
  ["flag_city", "Flags", "City and state added to addresses for maps", "", ""],
  ["flag_pickup", "Flags", "Where crews pick up the flags", "", "Shown on the crew page"],
  ["dinner_org", "Dinner groups", "Organization that runs dinner groups", "Relief Society", "Its leaders and the bishopric make the groups"],
  ["dinner_size", "Dinner groups", "Households per group", "4", ""],
  ["dinner_season", "Dinner groups", "Current season (set from the app)", "", ""],
  ["stake_page", "Stake", "Show the public stake page (Yes/No)", "Yes", "stake.html: stake leaders, links and public stake events"],
  ["stake_leaders", "Stake", "Stake leaders for the stake page (one per line: Calling: Name)", "", "e.g. Stake President: First Last. No phone numbers: the page is public"],
  ["stake_links", "Stake", "Stake links (one per line: Title | https://\u2026)", "", "Shown on the stake page"],
  ["church_news_feed", "Emails", "Church News feed (RSS)", "https://www.thechurchnews.com/arc/outboundfeeds/rss/?outputType=xml", "Headlines for More \u203a Church News and the Monday bishopric email"],
  ["sub_page", "Teaching", "Teachers can ask for a substitute online (Yes/No)", "Yes", "sub.html?c=<class>"],
  ["feedback_page", "Ward", "Public feedback page for the bishop (Yes/No)", "Yes", "feedback.html"],
  ["permit_online", "Youth", "Parents can sign permission forms online (Yes/No)", "Yes", "Leaders text each family a personal link. Signed forms are saved as PDFs in Drive \u203a Ward Hub permission forms (private); health answers are never put in the spreadsheet"],
  ["permit_link_days", "Youth", "Online form links keep working this many days after the activity", "7", "After that the link says the form is closed"]
]};
var VERSION = '2.13.0';

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
  if (!me.roles.admin && yptOrgs_(me).length) {
    var mine = yptList_(me).filter(function (x) { return x.state === 'expired' || x.state === 'due15' || x.state === 'due30' || x.state === 'none'; });
    if (mine.length) needs.push({ kind: 'training', title: mine.length + ' in your organization need' + (mine.length > 1 ? '' : 's') + ' youth protection training', due: tY, sub: mine.slice(0, 3).map(function (x) { return x.Person; }).join(', ') });
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
/* Sacrament meeting time for a date (some buildings rotate times every other January). */
function churchTime_(ymd) {
  var y = +String(ymd || ymd_(today_())).slice(0, 4), odd = setting_('meeting_time_odd');
  return (odd && y % 2 === 1 ? odd : setting_('meeting_time')) || '';
}
function beforeChurch_(ymd) {
  var k = timeKey_(churchTime_(ymd)); if (k === '99:99') return '';
  var m = +k.slice(0, 2) * 60 + +k.slice(3) - (+setting_('meetings_before') || 90), h = Math.floor(m / 60);
  return ((h % 12) || 12) + ':' + ('0' + (m % 60)).slice(-2) + ' ' + (h < 12 ? 'AM' : 'PM');
}
function meetingsFor_(from, days) {
  var out = [], bw = String(setting_('bishopric_weeks') || '').split(','), cw = String(setting_('council_weeks') || '').split(',');
  for (var i = 0; i <= days; i++) {
    var d = addDays_(from, i); if (d.getDay() !== 0) continue;
    var w = String(weekOfMonth_(d));
    if (cw.indexOf(w) >= 0) out.push({ date: ymd_(d), time: setting_('council_time') || beforeChurch_(ymd_(d)), title: 'Ward council', org: 'Ward', type: 'Ward council' });
    if (bw.indexOf(w) >= 0) out.push({ date: ymd_(d), time: setting_('bishopric_time') || beforeChurch_(ymd_(d)), title: 'Bishopric meeting', org: 'Bishopric', type: 'Bishopric' });
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
    .addItem('Back up now', 'backupNow')
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
  try { lessonPlan_(); } catch (e) { log_('Hub', 'lesson plan', '', '', String(e)); }
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

/* Spreadsheet menu: Ward Hub › Back up now. */
function backupNow() { var r = backup_(true); try { SpreadsheetApp.getUi().alert('Backup: ' + r + '. Find it in Google Drive › Ward Hub backups.'); } catch (e) {} return r; }


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
    ward: set.ward_name || '', stake: set.stake_name || '', date: d, type: S.Type || 'Regular', time: churchTime_(d), noMeeting: noMeeting,
    presiding: S['Stake visitor'] || S.Presiding || set.presiding_default || '', conducting: S.Conducting || '', organist: S.Organist || '', chorister: S.Chorister || '',
    opening: hy('Opening hymn'), sacrament: hy('Sacrament hymn'), intermediate: hy('Intermediate hymn'), closing: hy('Closing hymn'),
    invocation: who('Invocation'), benediction: who('Benediction'), items: items, fast: S.Type === 'Fast & Testimony',
    business: true, theme: /^no$/i.test(set.show_quote || 'Yes') ? null : (S['Theme text'] || S.Theme ? { text: S['Theme text'] || '', source: S.Theme || '' } : null),
    announcements: ann, birthdays: birthdays, missionaries: miss, picture: pic, footer: set.program_footer || '',
    zoom: /^https:\/\//.test(set.zoom_link || '') ? set.zoom_link : '',
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
  return { ward: setting_('ward_name'), first: first_(p.Person), date: p.Date, what: what, minutes: p.Minutes || '', status: p.Status, time: churchTime_(p.Date), prompt: /Speaker|council/i.test(p.Role) && prompt ? prompt.Text : '' };
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
  var lines = String(text || '').replace(/\r/g, '').split('\n').map(function (l) { return l.replace(/\u00a0/g, ' '); }).filter(function (l) { return l.trim(); });
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
/* Who sees a meeting, and who runs it (agenda, notes, recording). */
var COORD_ORGS_ = { 'Missionary coordination': ['Elders Quorum', 'Relief Society', 'Ward Mission'], 'Temple & family history coordination': ['Elders Quorum', 'Relief Society', 'Temple & Family History'], 'Youth council': ['Young Women', 'Young Men'] };
function canMeeting_(me, type, org) {
  if (isBishopric_(me)) return true;
  if (type === 'Bishopric') return !!me.roles.clerk;
  if (type === 'Ward council') return !!(me.roles.leader || me.roles.clerk);
  if (type === 'Presidency') return me.orgs.indexOf(org) >= 0;
  var o = COORD_ORGS_[type]; return !!(o && o.some(function (x) { return me.orgs.indexOf(x) >= 0; }));
}
function canRunMeeting_(me, type, org) {
  if (type === 'Bishopric' || type === 'Ward council' || type === 'PEC') return isBishopric_(me);
  return canMeeting_(me, type, org);
}
function meetingOf_(me, id, run) {
  var m = rows_('Meetings').filter(function (x) { return x.ID === id; })[0];
  if (!m || !(run ? canRunMeeting_ : canMeeting_)(me, m.Type, m.Organization)) throw new Error(run ? 'Only those who run this meeting can change it.' : 'Not found');
  return m;
}
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
  var list = rows_('Meetings').filter(function (m) { return m.Date >= from && canMeeting_(me, m.Type, m.Organization); }).map(strip_)
    .sort(function (a, b) { return a.Date.localeCompare(b.Date); });
  var types = ['Presidency', 'Youth council', 'Missionary coordination', 'Temple & family history coordination'].concat(isBishopric_(me) ? ['Bishopric', 'Ward council', 'PEC', 'Other'] : []).filter(function (t) { return t === 'Presidency' ? me.orgs.length || isBishopric_(me) : canRunMeeting_(me, t, ''); });
  return { meetings: list, types: types, orgs: isBishopric_(me) ? ORG_LIST_ : me.orgs };
};
ACTIONS.meeting = function (req, me) {
  var m = meetingOf_(me, req.id);
  var items = rows_('Agenda').filter(function (a) { return a.Meeting === m.ID; }).map(strip_).sort(function (a, b) { return (+a.Order || 0) - (+b.Order || 0); });
  var tasks = rows_('Tasks').filter(function (t) { return t.Source === m.ID || t.Source === m.Type + ' ' + m.Date; }).map(strip_);
  var attendees = m.Type === 'Ward council' ? ACTIONS.audiences({}, Object.assign({}, me, { roles: { admin: 1, bishopric: 1 }, orgs: [] })).groups.filter(function (g) { return g.id === 'council'; })[0] : null;
  return { meeting: strip_(m), items: items, tasks: tasks, canEdit: canRunMeeting_(me, m.Type, m.Organization), ai: setting_('meeting_ai') || 'Off', aiOk: aiOk_(m), emails: attendees ? attendees.members.map(function (x) { return x.e; }).filter(Boolean) : meetingEmails_(m) };
};
/* Leaders can put an item on the ward council agenda. */
ACTIONS.agendaAdd = function (req, me) {
  var m = meetingOf_(me, req.meeting);
  var n = rows_('Agenda').filter(function (a) { return a.Meeting === m.ID; }).length;
  return { id: save_(me, 'Agenda', { Meeting: m.ID, Order: n + 1, Item: String(req.item || '').slice(0, 300), Lead: req.lead || me.name, Minutes: req.minutes || '', Source: me.name }, { system: true }) };
};
ACTIONS.minutesSent = function (req, me) { meetingOf_(me, req.id, true); save_(me, 'Meetings', { ID: req.id, 'Minutes sent': ymd_(today_()), Status: 'Held' }, { system: true }); return {}; };

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
/* Youth and Primary presidencies see their own leaders, advisers and teachers; the bishopric sees everyone. */
function yptOrgs_(me) { return (me.orgs || []).filter(function (o) { return /^(Young Women|Young Men|Primary)$/.test(o); }); }
function yptList_(me) {
  var all = isBishopric_(me) || me.roles.admin, orgs = yptOrgs_(me), t = ymd_(today_()), ppl = {}; rows_('People').forEach(function (p) { ppl[nkey_(p.Name)] = p; });
  var who = {};
  if (!all) {
    rows_('Callings').forEach(function (c) { if (orgs.indexOf(c.Organization) >= 0 && !/Released|Proposed|Open/.test(c.Status) && c.Person && (age_((ppl[nkey_(c.Person)] || {})['Birth date']) || 99) >= 18) who[nkey_(c.Person)] = c.Calling; });
    rows_('Groups').forEach(function (g) { if (orgs.indexOf(g.Organization) >= 0 && g.Role === 'Teacher' && g.Person) who[nkey_(g.Person)] = who[nkey_(g.Person)] || 'Teacher'; });
  }
  var have = {}, list = rows_('Training').filter(function (r) { return all || who[nkey_(r.Person)]; }).map(function (r) {
    var o = strip_(r), days = r.Expires ? Math.round((parseYmd_(r.Expires) - parseYmd_(t)) / 864e5) : null; have[nkey_(r.Person)] = 1;
    o.days = days; o.phone = (ppl[nkey_(r.Person)] || {}).Phone || ''; o.calling = who[nkey_(r.Person)] || '';
    o.state = days === null ? 'unknown' : days < 0 ? 'expired' : days <= 15 ? 'due15' : days <= 30 ? 'due30' : days <= 60 ? 'due60' : 'ok';
    return o;
  });
  Object.keys(who).forEach(function (k) { if (!have[k]) { var p = ppl[k] || {}; list.push({ ID: '', Person: p.Name || k, calling: who[k], phone: p.Phone || '', days: -99999, state: 'none' }); } });
  return list.sort(function (a, b) { return (a.days === null ? 99999 : a.days) - (b.days === null ? 99999 : b.days); });
}
ACTIONS.training = function (req, me) {
  if (!isBishopric_(me) && !yptOrgs_(me).length) throw new Error('Youth protection is for the bishopric and the youth and Primary presidencies.');
  return { list: yptList_(me), link: setting_('ypt_link'), scoped: !isBishopric_(me), orgs: yptOrgs_(me), canPaste: !!me.roles.admin };
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
  if (!me.roles.admin && !yptList_(me).some(function (x) { return x.ID && x.ID === req.id; })) throw new Error('Not someone in your organization.');
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
  jobRecord_('lessons', lessonPlan_);
  jobRecord_('publish', schedulePublish_);
  jobRecord_('emails', function () { if (emailPaused_()) return 'paused'; return emailJobs_(null) + ' sent'; });
  jobRecord_('backup', function () { return backup_(false); });
  jobRecord_('transcripts', cleanTranscripts_);
  jobRecord_('permission forms', cleanPermits_);
  jobRecord_('newsletter pictures', cleanNewsletterImages_);
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
    try { body += churchNewsHtml_(); } catch (e) {}
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
/* Written in the app as a list of blocks. The blocks are kept as readable lines in the Items column:
     # Heading
     Text (a blank line between paragraphs; [words](https://link) and **bold** are allowed)
     [picture https://… | caption]          a picture saved in the ward account's Drive (shared by link, so it shows in email)
     [button Sign up | https://…]           a link button (a flyer, a sign-up sheet)
     [events 6 weeks · skip ID@date, …]     every calendar item from the newsletter's date on, minus the ones left out
     [lessons] [birthdays] [birthdays next] [new members] [stake calendar] [ward calendar] fill themselves in.
   Older newsletters (Intro, "Include calendar", Attachment) still render exactly as before.
   Big lists go out in parts over the quietest days, so the ward account stays under Google's daily limit. */
var NL_TOKENS = ['lessons', 'birthdays', 'birthdays next', 'stake calendar', 'ward calendar', 'new members'];
var NL_IMG_FOLDER = 'Ward Hub newsletter images', NL_IMG_MAX = 8 * 1024 * 1024, NL_WEEKS = [2, 4, 6, 8];
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

/* Items text → blocks. Unknown [words] stay text, so nothing old is lost. */
function nlParse_(text) {
  var out = [], para = [];
  var flush = function () { while (para.length && !para[para.length - 1]) para.pop(); if (para.length) out.push({ t: 'p', text: para.join('\n') }); para = []; };
  String(text || '').replace(/\r/g, '').split('\n').forEach(function (line) {
    var t = line.trim(), m;
    if (!t) { if (para.length) para.push(''); return; }
    if ((m = t.match(/^\[([a-z ]+)\]$/i)) && NL_TOKENS.indexOf(m[1].toLowerCase()) >= 0) { flush(); out.push({ t: 'tok', tok: m[1].toLowerCase() }); return; }
    if ((m = t.match(/^\[events(?:\s+(\d+)\s*weeks?)?\s*(?:[·;|]\s*skip\s+([^\]]*))?\]$/i))) { flush(); out.push({ t: 'ev', weeks: NL_WEEKS.indexOf(+m[1]) >= 0 ? +m[1] : 6, skip: String(m[2] || '').split(/\s*,\s*/).filter(function (k) { return /^[^\s,@]+@\d{4}-\d\d-\d\d$/.test(k); }) }); return; }
    if ((m = t.match(/^\[picture\s+(https:\/\/[^\s|\]]+)\s*(?:\|\s*([^|]*?)\s*)?(?:\|\s*((?:https?:\/\/|mailto:)[^\s|\]]+)\s*)?\]$/i))) { flush(); out.push({ t: 'pic', url: m[1], cap: m[2] || '', link: m[3] || '' }); return; }
    if ((m = t.match(/^\[button\s+([^|]*?)\s*\|\s*((?:https?:\/\/|mailto:)[^\s|\]]+)\s*\]$/i))) { flush(); out.push({ t: 'btn', label: m[1] || 'Open', url: m[2] }); return; }
    if (/^#/.test(t)) { flush(); out.push({ t: 'h', text: t.replace(/^#+\s*/, '') }); return; }
    para.push(t.replace(/^\\/, ''));
  });
  flush();
  return out;
}
/* One block from the app, checked and tidied (null if it is empty or not allowed). */
function nlCleanBlock_(b) {
  var one = function (s, max) { return String(s == null ? '' : s).replace(/[\r\n\t]+/g, ' ').replace(/\|/g, '/').replace(/\]/g, ')').replace(/\s+/g, ' ').trim().slice(0, max || 300); };
  var url = /^(https?:\/\/|mailto:)[^\s|\]]+$/;
  if (!b || typeof b !== 'object') return null;
  if (b.t === 'h') { var h = one(b.text, 200); return h ? { t: 'h', text: h } : null; }
  if (b.t === 'p') {
    var txt = String(b.text == null ? '' : b.text).replace(/\r/g, '').split('\n').map(function (l) { return l.trim(); }).join('\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, 12000);
    return txt ? { t: 'p', text: txt } : null;
  }
  if (b.t === 'pic') return /^https:\/\/[^\s|\]]+$/.test(b.url || '') ? { t: 'pic', url: b.url, cap: one(b.cap, 300), link: url.test(b.link || '') ? b.link : '' } : null;
  if (b.t === 'btn') return url.test(b.url || '') ? { t: 'btn', label: one(b.label, 80) || 'Open', url: b.url } : null;
  if (b.t === 'ev') {
    var seen = {};
    return { t: 'ev', weeks: NL_WEEKS.indexOf(+b.weeks) >= 0 ? +b.weeks : 6, skip: (b.skip instanceof Array ? b.skip : []).map(String).filter(function (k) { if (seen[k] || !/^[^\s,@\]]+@\d{4}-\d\d-\d\d$/.test(k)) return false; seen[k] = 1; return true; }).slice(0, 200) };
  }
  if (b.t === 'tok' && NL_TOKENS.indexOf(b.tok) >= 0) return { t: 'tok', tok: b.tok };
  return null;
}
/* Blocks → Items text (what the app saves). Text lines that would read as a heading or a [block] get a \ in front. */
function nlSerialize_(blocks) {
  return (blocks || []).slice(0, 300).map(nlCleanBlock_).filter(Boolean).map(function (b) {
    if (b.t === 'h') return '# ' + b.text;
    if (b.t === 'p') return b.text.split('\n').map(function (l) { return /^(#|\[|\\)/.test(l) ? '\\' + l : l; }).join('\n');
    if (b.t === 'pic') return '[picture ' + b.url + (b.cap || b.link ? ' | ' + b.cap : '') + (b.link ? ' | ' + b.link : '') + ']';
    if (b.t === 'btn') return '[button ' + b.label + ' | ' + b.url + ']';
    if (b.t === 'ev') return '[events ' + b.weeks + ' weeks' + (b.skip.length ? ' · skip ' + b.skip.join(', ') : '') + ']';
    return '[' + b.tok + ']';
  }).join('\n\n');
}
/* Text with links and **bold**, one <p> per paragraph (lines inside a paragraph keep their breaks). */
function nlText_(s) {
  var keep = [], hold = function (h) { keep.push(h); return '\u0001' + (keep.length - 1) + '\u0002'; };
  var bold = function (h) { return h.replace(/\*\*([^*\n]+?)\*\*/g, '<b>$1</b>'); };
  var link = function (x) { return escH_(x).replace(/(https?:\/\/[^\s<\u0001]+)/g, '<a href="$1">$1</a>').replace(/(^|\s)(www\.[^\s<\u0001]+|[a-z0-9-]+\.(?:org|com)(?:\/[^\s<\u0001]*)?)(?=\s|$|[.,])/gi, '$1<a href="https://$2">$2</a>'); };
  var out = '';
  String(s || '').split(/\n\s*\n/).forEach(function (par) {
    var lines = par.split('\n').map(function (l) { return l.trim(); }).filter(function (l) { return l; });
    if (!lines.length) return;
    out += '<p>' + lines.map(function (l) {
      l = l.replace(/\[([^\]\n]+)\]\(((?:https?:\/\/|mailto:)[^\s)]+)\)/g, function (all, label, url) { return hold('<a href="' + escH_(url) + '">' + bold(escH_(label)) + '</a>'); });
      return bold(link(l)).replace(/\u0001(\d+)\u0002/g, function (all, i) { return keep[+i]; });
    }).join('<br>') + '</p>';
  });
  return out;
}
var NL_SYS_ = { roles: { admin: 1, bishopric: 1 }, orgs: [] };
/* Everything on the calendar for the newsletter's weeks: the organization's own events, the ward's, the stake's (unless a
   Stake calendar block shows them separately) and any other organization's public events. */
function nlEventList_(n, weeks, stakeApart) {
  var from = nlDate_(n), to = ymd_(addDays_(parseYmd_(from), 7 * (NL_WEEKS.indexOf(+weeks) >= 0 ? +weeks : 6) - 1));
  return occurrences_(NL_SYS_, from, to).filter(function (e) {
    if (e.org === 'Stake') return !stakeApart;
    if (/^Flags?:/i.test(String(e.title || '')) && !e.public) return false; // flag routes are for the crews, not the newsletter
    return e.org === n.Organization || e.org === 'Ward' || e.public;
  }).slice(0, 150);
}
function nlEventsHtml_(n, list, skip) {
  var sk = {}; (skip || []).forEach(function (k) { sk[k] = 1; });
  var L = list.filter(function (e) { return !sk[e.id + '@' + e.date]; });
  if (!L.length) return '<p style="color:#8e8e93">Nothing on the calendar for these weeks.</p>';
  var out = '', day = '';
  L.forEach(function (e) {
    if (e.date !== day) { day = e.date; out += '<div style="font-weight:700;margin:14px 0 4px;color:#1c1c1e">' + escH_(Utilities.formatDate(parseYmd_(e.date), tz_(), 'EEEE, MMMM d')) + '</div>'; }
    var when = e.time ? escH_(e.time) + (e.endTime ? '–' + escH_(e.endTime) : '') : (e.end && e.end > e.date ? 'Through ' + escH_(fmtDay_(e.end)) : 'All day');
    var sub = [e.place, e.org !== n.Organization && e.org !== 'Ward' ? e.org : ''].filter(Boolean).map(escH_).join(' · ');
    out += '<div style="margin:0 0 8px 12px"><span style="color:#6e6e73">' + when + '</span> · <b>' + escH_(e.title) + '</b>' + (sub ? '<div style="color:#6e6e73;font-size:14px">' + sub + '</div>' : '') + '</div>';
  });
  return out;
}
function nlHead_(t) { return '<div style="font-size:17px;font-weight:700;margin:18px 0 6px;color:#1F2A44">' + escH_(t) + '</div>'; }
function nlFill_(n) { var month = nlMonth_(n), next = nlMonth_(n, true); return function (s) { return String(s).replace(/\{month\}/gi, month).replace(/\{next month\}/gi, next); }; }
function nlStakeApart_(blocks) { return blocks.some(function (b) { return b.t === 'tok' && b.tok === 'stake calendar'; }); }
function nlBlockHtml_(b, n, fill, stakeApart) {
  if (b.t === 'h') return nlHead_(fill(b.text));
  if (b.t === 'p') return nlText_(fill(b.text));
  if (b.t === 'pic') {
    var img = '<img src="' + escH_(b.url) + '" alt="' + escH_(b.cap || '') + '" style="display:block;max-width:100%;height:auto;border:0;border-radius:8px;margin:0 auto">';
    return '<div style="margin:12px 0;text-align:center">' + (b.link ? '<a href="' + escH_(b.link) + '">' + img + '</a>' : img) + (b.cap ? '<div style="color:#6e6e73;font-size:14px;margin-top:6px">' + escH_(b.cap) + '</div>' : '') + '</div>';
  }
  if (b.t === 'btn') return '<p style="margin:14px 0"><a href="' + escH_(b.url) + '" style="display:inline-block;background:#1F2A44;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:600">' + escH_(b.label || 'Open') + '</a></p>';
  if (b.t === 'ev') return nlEventsHtml_(n, nlEventList_(n, b.weeks, stakeApart), b.skip);
  if (b.t === 'tok') return nlBlock_(b.tok, n);
  return '';
}
function nlHtml_(n) {
  var fill = nlFill_(n), blocks = nlParse_(fill(n.Intro || '')).concat(nlParse_(fill(n.Items || ''))), stake = nlStakeApart_(blocks), used = {}, out = '';
  blocks.forEach(function (b) { if (b.t === 'tok') used[b.tok] = 1; if (b.t === 'ev') used.events = 1; out += nlBlockHtml_(b, n, fill, stake); });
  if (n['Include calendar'] === true && !used['ward calendar']) out += nlHead_('Coming up') + nlBlock_('ward calendar', n);
  if (n.Attachment && !used['stake calendar']) out += '<p><a href="' + escH_(n.Attachment) + '" style="color:#1F2A44;font-weight:600">Open the attachment</a></p>';
  return mailWrap_(n.Subject || (n.Organization + ' newsletter'), out);
}
/* The blocks the editor shows: the old Intro becomes the first text, "Include calendar" becomes an events block and an
   attachment (without a Stake calendar block) becomes a link button. Each block comes with how it looks. */
function nlEditBlocks_(n) {
  var b = nlParse_(n.Intro || '').concat(nlParse_(n.Items || '')), att = String(n.Attachment || '');
  if (n['Include calendar'] === true && !b.some(function (x) { return x.t === 'ev' || (x.t === 'tok' && x.tok === 'ward calendar'); })) b.push({ t: 'h', text: 'Coming up' }, { t: 'ev', weeks: 6, skip: [] });
  if (att && !nlStakeApart_(b)) { b.push({ t: 'btn', label: 'Open the attachment', url: att }); att = ''; }
  return { blocks: b, attachment: att };
}
function nlRender_(n, blocks) {
  var fill = nlFill_(n), stake = nlStakeApart_(blocks.filter(Boolean));
  return blocks.map(function (b) {
    if (!b) return { html: '' };
    var o = { html: nlBlockHtml_(b, n, fill, stake) };
    if (b.t === 'ev') {
      var sk = {}; (b.skip || []).forEach(function (k) { sk[k] = 1; });
      o.events = nlEventList_(n, b.weeks, stake).map(function (e) { var k = e.id + '@' + e.date; return { key: k, date: e.date, end: e.end || '', time: e.time || '', endTime: e.endTime || '', title: e.title, place: e.place || '', org: e.org, own: e.org === n.Organization, skipped: !!sk[k] }; });
      o.stakeApart = stake;
    }
    return o;
  });
}
function nlTemplate_(org, me) {
  var name = me.name || '';
  if (org === 'Elders Quorum') return { Subject: 'Elders Quorum Weekend Update', Intro: '',
    Items: 'Hello elders, time for another weekend update!\n\n# Announcements\n(Type this week\'s announcements here, or paste them in the box above.)\n\n# Coming up\n[events 6 weeks]\n\n# EQ Lesson Schedule\n[lessons]\n\n# {month} Birthdays\n[birthdays]\n\n# New in the ward\n[new members]\n\n# Stake calendar\n[stake calendar]\n\n# Super High Quality Jokes* (*actual quality may vary)\n(Add your jokes.)\n\nHave a great week!\n' + name, 'Include calendar': false };
  if (org === 'Relief Society') return { Subject: 'Relief Society News', Intro: '',
    Items: 'Dear sisters,\n\n# Announcements\n(Type this week\'s announcements here, or paste them in the box above.)\n\n# Coming up\n[events 6 weeks]\n\n# Lessons\n[lessons]\n\n# {month} Birthdays\n[birthdays]\n\n# Please welcome\n[new members]\n\n# Stake\n[stake calendar]\n\nWith love,\n' + name, 'Include calendar': false };
  return { Subject: (setting_('ward_name') || 'Ward') + ' News', Intro: '', Items: 'Dear friends,\n\n# Announcements\n(Type the announcements here, or paste them in the box above.)\n\n# Coming up\n[events 6 weeks]\n\n# Stake\n[stake calendar]\n\n' + name, 'Include calendar': false };
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
/* Saves the row. From the block editor (req.blocks) the blocks become the Items text; with req.render it also returns how each block looks. */
ACTIONS.newsletterSave = function (req, me) {
  var r = req.row || {}; if (nlOrgs_(me).indexOf(r.Organization) < 0) throw new Error('Pick your organization.');
  var cur = r.ID ? nlGet_(me, r.ID) : null;
  if (cur && /Scheduled|Sending/.test(cur.Status)) throw new Error('Cancel the schedule before changing it.');
  if (cur && cur.Organization !== r.Organization) throw new Error('A newsletter stays with its organization.');
  var att = String(r.Attachment || '').trim(); if (att && !/^https:\/\//i.test(att)) throw new Error('The attachment needs to be a link that starts with https://');
  var date = /^\d{4}-\d\d-\d\d$/.test(r.Date || '') ? r.Date : ymd_(today_());
  var row = { Organization: r.Organization, Date: date, Subject: String(r.Subject || '').slice(0, 150), Intro: String(r.Intro || '').slice(0, 4000), Items: String(r.Items || '').slice(0, 45000), 'Include calendar': r['Include calendar'] === true, Attachment: att, Status: cur && cur.Status === 'Sent' ? 'Sent' : 'Draft' };
  var blocks = null;
  if (req.blocks) {
    if (!(req.blocks instanceof Array)) throw new Error('Bad blocks');
    row.Items = nlSerialize_(req.blocks); row.Intro = ''; row['Include calendar'] = false;
    if (row.Items.length > 45000) throw new Error('This newsletter is too long to save. Split it into two.');
    blocks = req.blocks.slice(0, 300).map(nlCleanBlock_);
  }
  if (r.ID) row.ID = r.ID;
  var id = save_(me, 'Newsletters', row, { system: true, quiet: !!(cur && req.blocks) });
  var out = { id: id };
  if (req.render) { var n = Object.assign({}, cur || {}, row, { ID: id }); out.render = nlRender_(n, blocks || nlEditBlocks_(n).blocks); out.html = nlHtml_(n); }
  return out;
};
ACTIONS.newsletterView = function (req, me) {
  var n = nlGet_(me, req.id), emails = nlRecipients_(n.Organization).map(function (x) { return x.e; }), sched = /Scheduled|Sending/.test(n.Status);
  var p = sched ? { plan: nlPlan_(n) } : nlPlanFor_(n, emails), ed = nlEditBlocks_(n), row = strip_(n); delete row['Send plan'];
  var shown = Object.assign({}, n, { Attachment: ed.attachment }), look = nlRender_(shown, ed.blocks);
  return { html: nlHtml_(n), subject: n.Subject, emails: emails, paused: emailPaused_(), status: n.Status || 'Draft', row: row, attachment: ed.attachment,
    blocks: ed.blocks.map(function (b, i) { return Object.assign({}, b, look[i]); }),
    plan: p.plan.map(function (b) { return { date: b.date, count: b.to.length, sent: b.sent || '', load: p.load ? p.load[b.date] : null }; }) };
};
ACTIONS.newsletterRemove = function (req, me) { var n = nlGet_(me, req.id); if (/Scheduled|Sending/.test(n.Status)) throw new Error('Cancel the schedule first.'); return { removed: remove_(me, 'Newsletters', req.id) }; };
ACTIONS.newsletterMarkSent = function (req, me) { var n = nlGet_(me, req.id); if (/Scheduled|Sending/.test(n.Status)) throw new Error('Cancel the schedule first.'); save_(me, 'Newsletters', { ID: n.ID, Status: 'Sent', 'Sent on': ymd_(today_()), 'Sent to': +req.count || '' }, { system: true }); return {}; };

/* A picture for a newsletter: saved in the ward account's Drive folder "Ward Hub newsletter images" and shared
   "anyone with the link can view", so it shows in everyone's email. The app shrinks pictures first (about 1600 px). */
function nlImgFolder_() { var it = DriveApp.getFoldersByName(NL_IMG_FOLDER); return it.hasNext() ? it.next() : DriveApp.createFolder(NL_IMG_FOLDER); }
function nlImgType_(bytes) {
  var b = function (i) { return bytes[i] & 255; }, n = bytes.length;
  if (n > 3 && b(0) === 0xFF && b(1) === 0xD8 && b(2) === 0xFF) return 'jpg';
  if (n > 8 && b(0) === 0x89 && b(1) === 0x50 && b(2) === 0x4E && b(3) === 0x47) return 'png';
  if (n > 6 && b(0) === 0x47 && b(1) === 0x49 && b(2) === 0x46 && b(3) === 0x38) return 'gif';
  if (n > 12 && b(0) === 0x52 && b(1) === 0x49 && b(2) === 0x46 && b(3) === 0x46 && b(8) === 0x57 && b(9) === 0x45 && b(10) === 0x42 && b(11) === 0x50) return 'webp';
  return '';
}
ACTIONS.newsletterImage = function (req, me) {
  var n = nlGet_(me, req.id);
  if (/Scheduled|Sending/.test(n.Status)) throw new Error('Stop the sending before changing it.');
  var big = 'That picture is too big (over 8 MB). Try a smaller copy or a screenshot of it.', bytes;
  if (req.src) {
    var src = String(req.src);
    if (!/^https:\/\/[^\s]+$/i.test(src)) throw new Error('That picture could not be copied. Save it, then use Choose photos.');
    var res = null; try { res = UrlFetchApp.fetch(src, { muteHttpExceptions: true, followRedirects: true }); } catch (e) {}
    if (!res || res.getResponseCode() !== 200) throw new Error('That picture could not be copied. Save it, then use Choose photos.');
    bytes = res.getBlob().getBytes();
  } else {
    var data = String(req.data || '').replace(/^data:[^,]*,/, '').replace(/\s+/g, '');
    if (!data) throw new Error('No picture came through. Try again.');
    if (data.length * 3 / 4 > NL_IMG_MAX + 3) throw new Error(big);
    bytes = Utilities.base64Decode(data);
  }
  if (bytes.length > NL_IMG_MAX) throw new Error(big);
  var ext = nlImgType_(bytes); if (!ext) throw new Error(req.src ? 'That picture could not be copied. Save it, then use Choose photos.' : 'That file is not a picture (JPEG, PNG, GIF or WebP).');
  var name = 'Newsletter ' + n.ID + ' ' + ymd_(today_()) + ' ' + Utilities.getUuid().slice(0, 6) + '.' + ext;
  var f = nlImgFolder_().createFile(Utilities.newBlob(bytes, ext === 'jpg' ? 'image/jpeg' : 'image/' + ext, name));
  try { f.setDescription('Newsletter ' + n.ID); } catch (e) {}
  try { f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); }
  catch (e) { try { f.setTrashed(true); } catch (x) {} throw new Error('Google Drive would not share the picture by link, so it would not show in email. The ward account needs link sharing turned on.'); }
  log_(me.name, 'picture', 'Newsletters', n.ID, Math.round(bytes.length / 1024) + ' KB');
  return { url: 'https://lh3.googleusercontent.com/d/' + f.getId(), file: f.getId(), kb: Math.round(bytes.length / 1024) };
};
/* Nightly: pictures for newsletters older than 180 days (or for removed ones) move to the Drive trash. */
function cleanNewsletterImages_() {
  var it = DriveApp.getFoldersByName(NL_IMG_FOLDER); if (!it.hasNext()) return 'no pictures yet';
  var days = +setting_('newsletter_image_days') || 180, cut = ymd_(addDays_(today_(), -days)), byId = {}, gone = 0, kept = 0;
  rows_('Newsletters').forEach(function (n) { byId[n.ID] = n; });
  var fi = it.next().getFiles();
  while (fi.hasNext()) {
    var f = fi.next(), m = String((f.getDescription && f.getDescription()) || f.getName()).match(/Newsletter (\S+)/), n = m ? byId[m[1]] : null;
    var made = f.getDateCreated ? ymd_(f.getDateCreated()) : '', when = n ? [nlDate_(n), String(n['Sent on'] || '')].sort().pop() : '';
    if (made && made < cut && (!n || when < cut)) { f.setTrashed(true); gone++; } else kept++;
  }
  return gone + ' old newsletter pictures moved to the trash · ' + kept + ' kept';
}
/* "Add an event" in the newsletter: a calendar item for the newsletter's organization, under the usual calendar rules. */
ACTIONS.newsletterEvent = function (req, me) {
  var n = nlGet_(me, req.id), e = req.event || {};
  var title = String(e.Title || '').trim().slice(0, 120); if (!title) throw new Error('Add a title.');
  if (!/^\d{4}-\d\d-\d\d$/.test(e.Date || '')) throw new Error('Pick a date.');
  var row = { Title: title, Date: e.Date, Start: String(e.Start || '').trim().slice(0, 20), End: String(e.End || '').trim().slice(0, 20), Place: String(e.Place || '').trim().slice(0, 120),
    Organization: n.Organization, Public: e.Public !== false, Status: 'Approved', Source: 'Newsletter' };
  return { id: save_(me, 'Events', row) };
};

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
/* Paper forms are tracked by tapping names. Parents can also sign online from a personal link (permit.html?t=…):
   the answers go only into a PDF in the ward account's private Drive folder "Ward Hub permission forms";
   the spreadsheet just records Received, the date and "Signed online". */
PUBLIC_ACTIONS.permitInfo = 1; PUBLIC_ACTIONS.permitSubmit = 1;
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
    out.push({ n: p.Name, id: p.ID, org: g.Organization, cls: g.Group, parents: parents.slice(0, 3) });
  });
  return out.sort(function (a, b) { return a.n.localeCompare(b.n); });
}
function permEvent_(me, id) {
  var e = rows_('Events').filter(function (x) { return x.ID === id; })[0];
  if (!e || e['Permission form'] !== true || !permOrgsFor_(e.Organization).some(function (o) { return isBishopric_(me) || me.orgs.indexOf(o) >= 0; })) throw new Error('Not found');
  return e;
}
function permitOn_() { return !/^no$/i.test(setting_('permit_online') || 'Yes'); }
function permitSecret_() { var p = PropertiesService.getScriptProperties(), s = p.getProperty('PERMIT_SECRET'); if (!s) { s = Utilities.getUuid() + Utilities.getUuid(); p.setProperty('PERMIT_SECRET', s); } return s; }
/* A personal link names one activity and one youth by ID, signed with a secret only the engine knows (a truncated keyed SHA-256), so it can't be guessed or changed. */
function permitSig_(eid, pid) { return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, permitSecret_() + '|permit|' + eid + '|' + pid)).replace(/=+$/, '').slice(0, 24); }
function permitToken_(eid, pid) { return eid + '.' + pid + '.' + permitSig_(eid, pid); }
function permitSame_(a, b) { a = String(a); b = String(b); if (a.length !== b.length) return false; var d = 0; for (var i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; }
function permitDays_() { var d = String(setting_('permit_link_days')).trim(); return /^\d+$/.test(d) ? +d : 7; }
function permitFind_(t) {
  var bad = 'This link isn\'t recognized. Please ask the youth leaders for a new one.';
  var m = String(t || '').match(/^([A-Za-z0-9_-]{1,40})\.([A-Za-z0-9_-]{1,40})\.([A-Za-z0-9_-]{24})$/);
  if (!m || !permitOn_() || !permitSame_(permitSig_(m[1], m[2]), m[3])) throw new Error(bad);
  var e = rows_('Events').filter(function (x) { return x.ID === m[1]; })[0];
  if (!e || e['Permission form'] !== true || e.Status === 'Cancelled') throw new Error(bad);
  if (String(e['End date'] || e.Date) < ymd_(addDays_(today_(), -permitDays_()))) throw new Error('This activity is over, so its form is closed. Please contact the youth leaders.');
  var y = permRoster_({ name: 'Online form', roles: { bishopric: true }, orgs: [] }, e).filter(function (x) { return x.id === m[2]; })[0];
  if (!y) throw new Error(bad);
  return { e: e, y: y, sig: m[3] };
}
function permitMarkRow_(e, y) { return rows_('Permissions').filter(function (x) { return x.Event === e.ID && nkey_(x.Person) === nkey_(y.n); })[0] || null; }
function permitFileKey_(eid, pid) { return 'permitFile:' + eid + ':' + pid; }
function permitWhen_(e) {
  var f = function (d) { return Utilities.formatDate(parseYmd_(d), tz_(), 'EEEE, MMMM d, yyyy'); };
  return f(e.Date) + (e['End date'] && e['End date'] !== e.Date ? ' to ' + f(e['End date']) : '') + (e.Start ? ', ' + e.Start + (e.End ? ' to ' + e.End : '') : '');
}
var PERMIT_OKS = [
  ['okGo', 'I give permission for my child to take part in this activity, including travel arranged by the leaders.'],
  ['okCare', 'If I can\'t be reached in an emergency, the adult leaders may get and consent to medical care for my child, including care by doctors and hospitals.'],
  ['okTrue', 'What I wrote here is true and complete, and my child will follow Church standards and the leaders\' directions during the activity.']
];
/* Answers from the public page, cleaned and checked. Throws a message the parent can act on. */
function permitClean_(req, y) {
  var s = function (k, n) { return String(req[k] == null ? '' : req[k]).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, n || 120); };
  var yn = function (k) { return req[k] === 'Yes' ? 'Yes' : req[k] === 'No' ? 'No' : ''; }, digits = function (x) { return String(x).replace(/\D/g, '').length; };
  var a = { birth: s('birth', 10), parent: s('parent', 80), rel: s('rel', 40), phone: s('phone', 30), phone2: s('phone2', 30), email: s('email', 120),
    ecName: s('ecName', 80), ecRel: s('ecRel', 40), ecPhone: s('ecPhone', 30),
    diet: yn('diet'), dietX: s('dietX', 500), alg: yn('alg'), algX: s('algX', 500), meds: s('meds', 800), self: yn('self'),
    chr: yn('chr'), chrX: s('chrX', 500), sur: yn('sur'), surX: s('surX', 500), limits: s('limits', 800), other: s('other', 800), signed: s('signed', 80) };
  PERMIT_OKS.forEach(function (o) { a[o[0]] = req[o[0]] === true; });
  var fy = first_(y.n), age = /^\d{4}-\d\d-\d\d$/.test(a.birth) ? age_(a.birth) : null, need = '';
  if (age === null || age < 3 || age > 25) need = 'Please check ' + fy + '\'s birth date.';
  else if (a.parent.length < 3) need = 'Please add your name.';
  else if (digits(a.phone) < 7) need = 'Please add a phone number where we can reach you.';
  else if (a.phone2 && digits(a.phone2) < 7) need = 'Please check the second phone number.';
  else if (a.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email)) need = 'Please check the email address.';
  else if (a.ecName.length < 3 || digits(a.ecPhone) < 7) need = 'Please add an emergency contact and their phone number.';
  else if (!a.diet || !a.alg || !a.chr || !a.sur) need = 'Please answer Yes or No to each health question.';
  else if (a.diet === 'Yes' && !a.dietX) need = 'Please describe the special diet.';
  else if (a.alg === 'Yes' && !a.algX) need = 'Please list the allergies.';
  else if (a.chr === 'Yes' && !a.chrX) need = 'Please tell us about the illness.';
  else if (a.sur === 'Yes' && !a.surX) need = 'Please tell us about the surgery or illness.';
  else if (a.meds && !a.self) need = 'Please say whether ' + fy + ' can take their own medicine.';
  else if (!a.okGo || !a.okCare || !a.okTrue) need = 'Please check all three permission boxes.';
  else if (!/\S{2,}\s+\S{2,}/.test(a.signed)) need = 'Please type your full name to sign.';
  if (need) throw new Error(need);
  if (a.diet === 'No') a.dietX = ''; if (a.alg === 'No') a.algX = ''; if (a.chr === 'No') a.chrX = ''; if (a.sur === 'No') a.surX = ''; if (!a.meds) a.self = '';
  a.age = age;
  return a;
}
function permitPdfHtml_(e, y, a, at) {
  var E = escH_, row = function (l, v) { return '<tr><td class="l">' + E(l) + '</td><td>' + (v === '' || v == null ? '<span class="n">—</span>' : E(v).replace(/\n/g, '<br>')) + '</td></tr>'; };
  var yn = function (l, v, x) { return row(l, v + (v === 'Yes' && x ? ': ' + x : '')); }, sec = function (t) { return '<h2>' + E(t) + '</h2><table>'; };
  var ward = setting_('ward_name');
  return '<html><head><meta charset="utf-8"><style>body{font:11pt Arial,sans-serif;color:#111;margin:28px}h1{font:600 17pt Georgia,serif;margin:0 0 2px}.k{font-size:8.5pt;letter-spacing:1.5px;text-transform:uppercase;color:#555}' +
    'h2{font-size:10pt;text-transform:uppercase;letter-spacing:1px;color:#333;border-bottom:1px solid #999;margin:16px 0 4px;padding-bottom:2px}table{width:100%;border-collapse:collapse}td{padding:3px 6px 3px 0;vertical-align:top}td.l{width:36%;color:#444}.n{color:#999}' +
    '.ok{margin:4px 0}.sig{margin-top:14px;padding:10px;border:1px solid #999}.sig b{font:italic 15pt Georgia,serif}.f{margin-top:16px;font-size:8.5pt;color:#555}</style></head><body>' +
    '<div class="k">' + E(ward ? ward + ' · ' : '') + 'Parent or guardian permission and medical release</div><h1>' + E(y.n) + '</h1><div>' + E(e.Title) + '</div>' +
    sec('Activity') + row('Activity', e.Title) + row('When', permitWhen_(e)) + row('Where', e.Place || '') + row('Organization', e.Organization) + '</table>' +
    sec('Participant') + row('Name', y.n) + row('Birth date', Utilities.formatDate(parseYmd_(a.birth), tz_(), 'MMMM d, yyyy') + ' (age ' + a.age + ')') + row('Class or quorum', y.cls || '') + '</table>' +
    sec('Parent or guardian') + row('Name', a.parent) + row('Relationship', a.rel) + row('Phone', a.phone) + row('Other phone', a.phone2) + row('Email', a.email) + '</table>' +
    sec('Emergency contact') + row('Name', a.ecName) + row('Relationship', a.ecRel) + row('Phone', a.ecPhone) + '</table>' +
    sec('Health') + yn('Special diet', a.diet, a.dietX) + yn('Allergies', a.alg, a.algX) + row('Medicines (prescription or over the counter)', a.meds || 'None') +
    (a.meds ? row('Can take their own medicine', a.self) : '') + yn('Chronic or recurring illness', a.chr, a.chrX) + yn('Surgery or serious illness in the past year', a.sur, a.surX) +
    row('Limits on activity', a.limits) + row('Anything else leaders should know', a.other) + '</table>' +
    sec('Permission') + '</table>' + PERMIT_OKS.map(function (o) { return '<div class="ok">' + (a[o[0]] ? '&#9746;' : '&#9744;') + ' ' + E(o[1]) + '</div>'; }).join('') +
    '<div class="sig">Signed by the parent or guardian (typed name): <b>' + E(a.signed) + '</b><br>Date: ' + E(Utilities.formatDate(at, tz_(), 'MMMM d, yyyy')) + '</div>' +
    '<div class="f">Signed online from a personal link the youth leaders sent this family, ' + E(Utilities.formatDate(at, tz_(), "MMMM d, yyyy 'at' h:mm a")) + '. Kept in the ward account\'s private Drive folder "Ward Hub permission forms". Take it along on the activity; delete it when the activity is over.</div>' +
    '</body></html>';
}
function permitFolder_() {
  var p = PropertiesService.getScriptProperties(), id = p.getProperty('PERMIT_DIR'), f = null;
  if (id) try { f = DriveApp.getFolderById(id); if (f.isTrashed()) f = null; } catch (x) { f = null; }
  if (!f) { var it = DriveApp.getFoldersByName('Ward Hub permission forms'); while (it.hasNext()) { var g = it.next(); if (!g.isTrashed()) { f = g; break; } } }
  if (!f) f = DriveApp.createFolder('Ward Hub permission forms');   // made by the ward account and never shared
  if (f.getId() !== id) p.setProperty('PERMIT_DIR', f.getId());
  return f;
}
function permitSavePdf_(e, y, a) {
  var at = new Date(), name = 'Permission form · ' + e.Title + ' ' + e.Date + ' · ' + y.n;
  var pdf = Utilities.newBlob(permitPdfHtml_(e, y, a, at), 'text/html', name + '.html').getAs('application/pdf').setName(name + '.pdf');
  var file = permitFolder_().createFile(pdf), p = PropertiesService.getScriptProperties(), k = permitFileKey_(e.ID, y.id), old = p.getProperty(k);
  p.setProperty(k, file.getId());
  if (old && old !== file.getId()) try { DriveApp.getFileById(old).setTrashed(true); } catch (x) {}   // signing again replaces the earlier form
  return file;
}
/* Public: what the parent's page shows. Only the activity and the youth's first name. */
ACTIONS.permitInfo = function (req) {
  var f = permitFind_(req.t), e = f.e, cur = permitMarkRow_(e, f.y);
  return { ward: setting_('ward_name'), title: e.Title, date: e.Date, end: e['End date'] || '', time: e.Start || '', endTime: e.End || '', place: e.Place || '', org: e.Organization,
    first: first_(f.y.n), signed: cur && cur.Received === true && /^Signed online/.test(String(cur.Notes || '')) ? cur['Received on'] : '', today: ymd_(today_()), paper: setting_('permission_form_link'), oks: PERMIT_OKS };
};
/* Public: the signed form. Answers go only into the PDF; the sheet records that it came in. */
ACTIONS.permitSubmit = function (req) {
  var f = permitFind_(req.t), e = f.e, y = f.y;
  var c = CacheService.getScriptCache(), ck = 'permitN:' + f.sig.slice(0, 16), n = +(c.get(ck) || 0);
  if (n >= 10) throw new Error('This link has been used many times today. Please try again tomorrow, or ask a leader for a paper form.');
  var a = permitClean_(req, y);
  c.put(ck, String(n + 1), 21600);
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    permitSavePdf_(e, y, a);
    var cur = permitMarkRow_(e, y), row = { Event: e.ID, Date: e.Date, Title: e.Title, Organization: e.Organization, Person: y.n, Received: true, 'Received on': ymd_(today_()), Notes: 'Signed online' };
    if (cur) row.ID = cur.ID;
    save_(null, 'Permissions', row, { system: true, quiet: true });
  } finally { lock.releaseLock(); }
  log_('Online form', 'permission', 'Permissions', e.ID, y.n + ' signed online');
  return { message: 'Thank you! ' + first_(y.n) + '\'s permission and medical release form for ' + e.Title + ' is signed. The leaders have it now.' };
};
ACTIONS.permissions = function (req, me) {
  if (!isBishopric_(me) && !permOrgsFor_('Youth').concat(['Primary']).some(function (o) { return me.orgs.indexOf(o) >= 0; })) throw new Error('Permission forms are for youth and Primary leaders.');
  var from = ymd_(addDays_(today_(), -7)), P = rows_('Permissions'), online = permitOn_();
  var evs = rows_('Events').filter(function (e) { return e['Permission form'] === true && e.Status !== 'Cancelled' && (e['End date'] || e.Date) >= from && permOrgsFor_(e.Organization).some(function (o) { return isBishopric_(me) || me.orgs.indexOf(o) >= 0; }); })
    .sort(function (a, b) { return String(a.Date).localeCompare(String(b.Date)); })
    .map(function (e) { var r = permRoster_(me, e), got = {}; P.forEach(function (x) { if (x.Event === e.ID && x.Received === true) got[nkey_(x.Person)] = 1; }); return { id: e.ID, title: e.Title, date: e.Date, end: e['End date'] || '', time: e.Start || '', org: e.Organization, place: e.Place || '', total: r.length, received: r.filter(function (y) { return got[nkey_(y.n)]; }).length }; });
  var out = { events: evs, link: setting_('permission_form_link'), online: online, orgs: isBishopric_(me) ? ['Youth', 'Young Women', 'Young Men', 'Primary'] : ['Youth'].concat(me.orgs).filter(function (o) { return permOrgsFor_(o).length && permOrgsFor_(o).some(function (x) { return isBishopric_(me) || me.orgs.indexOf(x) >= 0; }); }) };
  if (req.id) {
    var e = permEvent_(me, req.id), marks = {};
    P.forEach(function (x) { if (x.Event === e.ID) marks[nkey_(x.Person)] = x; });
    out.event = { id: e.ID, title: e.Title, date: e.Date, end: e['End date'] || '', time: e.Start || '', org: e.Organization, place: e.Place || '' };
    out.appUrl = appUrl_(req.app);
    out.linksOpen = online && String(e['End date'] || e.Date) >= ymd_(addDays_(today_(), -permitDays_()));
    out.youth = permRoster_(me, e).map(function (y) {
      var m = marks[nkey_(y.n)]; y.received = !!(m && m.Received === true); y.on = m ? m['Received on'] : '';
      y.pdf = !!(m && /^Signed online/.test(String(m.Notes || ''))); y.online = y.pdf && y.received;
      if (out.linksOpen) y.t = permitToken_(e.ID, y.id);
      return y;
    });
  }
  return out;
};
/* The signed PDF, for leaders who can see this youth. */
ACTIONS.permitPdf = function (req, me) {
  var e = permEvent_(me, req.event), y = permRoster_(me, e).filter(function (x) { return x.n === req.person; })[0];
  if (!y) throw new Error('That person isn\'t on this list.');
  var id = PropertiesService.getScriptProperties().getProperty(permitFileKey_(e.ID, y.id)), f = null;
  if (id) try { f = DriveApp.getFileById(id); if (f.isTrashed()) f = null; } catch (x) { f = null; }
  if (!f) throw new Error('There\'s no form signed online for ' + first_(y.n) + '. If it was deleted in Drive, ask the family to sign again.');
  log_(me.name, 'permission form opened', 'Permissions', e.ID, y.n);
  return { name: f.getName(), pdf: Utilities.base64Encode(f.getBlob().getBytes()) };
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
  var t = today_(), tY = ymd_(t), lines = ['Today is ' + tY + ' (' + Utilities.formatDate(t, tz_(), 'EEEE') + '). Ward: ' + (setting_('ward_name') || '') + '. Sacrament meeting: ' + churchTime_(tY) + '.'];
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
  var time = churchTime_(d), when = Utilities.formatDate(parseYmd_(d), tz_(), 'EEEE, MMMM d');
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


/* ================= Meetings for every council and presidency, and notes from a recording or pasted notes ================= */
/* Record in the app → each few minutes of audio is transcribed by Gemini → at the end, Gemini keeps only what matters:
   key points, notes and decisions on each agenda item, assignments (which become tasks), and items to carry forward. */

function meetingEmails_(m) {
  var orgs = m.Type === 'Presidency' ? [m.Organization] : (COORD_ORGS_[m.Type] || []), ppl = {}; rows_('People').forEach(function (p) { ppl[nkey_(p.Name)] = p; });
  var seen = {}, out = [];
  rows_('Callings').forEach(function (c) {
    if (/Released|Proposed|Open/.test(c.Status) || orgs.indexOf(c.Organization) < 0) return;
    if (!/President|Leader|Counselor|Secretary/i.test(c.Calling)) return;
    var p = ppl[nkey_(c.Person)], e = p && p.Email; if (e && !seen[e]) { seen[e] = 1; out.push(e); }
  });
  return out;
}
ACTIONS.meetingNew = function (req, me) {
  var type = String(req.type || ''), org = String(req.org || ''), d = String(req.date || '');
  if (type === 'Presidency' && !(isBishopric_(me) || me.orgs.indexOf(org) >= 0)) throw new Error('Pick your organization.');
  if (!canRunMeeting_(me, type, org)) throw new Error('You can\'t start that kind of meeting.');
  if (!/^\d{4}-\d\d-\d\d$/.test(d)) throw new Error('Pick a date.');
  return { id: save_(null, 'Meetings', { Type: type, Organization: type === 'Presidency' ? org : '', Date: d, Time: String(req.time || '').slice(0, 12), Status: 'Planned' }, { system: true }) };
};
ACTIONS.meetingSave = function (req, me) {
  var m = meetingOf_(me, (req.row || {}).ID, true), r = req.row, row = { ID: m.ID };
  ['Opening prayer', 'Spiritual thought', 'Closing prayer', 'Time', 'Status', 'Notes', 'Summary', 'Date'].forEach(function (k) { if (r[k] !== undefined) row[k] = String(r[k]).slice(0, 20000); });
  save_(null, 'Meetings', row, { system: true }); log_(me.name, 'save', 'Meetings', m.ID, ''); return {};
};
ACTIONS.agendaSave = function (req, me) {
  var r = req.row || {}, a = r.ID ? rows_('Agenda').filter(function (x) { return x.ID === r.ID; })[0] : null;
  var m = meetingOf_(me, a ? a.Meeting : r.Meeting, true);
  if (req.remove && a) { sheet_('Agenda').deleteRow(a._r); bump_('Agenda'); return {}; }
  var row = { Meeting: m.ID }; if (a) row.ID = a.ID;
  ['Order', 'Item', 'Lead', 'Minutes', 'Notes', 'Decision', 'Source'].forEach(function (k) { if (r[k] !== undefined) row[k] = String(r[k]).slice(0, 4000); });
  return { id: save_(null, 'Agenda', row, { system: true }) };
};

/* ---------- recording and notes ---------- */
function aiOk_(m) {
  var mode = String(setting_('meeting_ai') || 'Off');
  if (/^off/i.test(mode) || !setting_('gemini_key')) return false;
  if (/free/i.test(mode) && (m.Type === 'Bishopric' || m.Type === 'PEC')) return false;
  return true;
}
function transcriptFile_(m, create) {
  var it = DriveApp.getFoldersByName('Ward Hub meeting transcripts'), folder = it.hasNext() ? it.next() : (create ? DriveApp.createFolder('Ward Hub meeting transcripts') : null);
  if (!folder) return null;
  var name = 'Transcript ' + m.ID, fi = folder.getFilesByName(name);
  return fi.hasNext() ? fi.next() : (create ? folder.createFile(name, '', 'text/plain') : null);
}
ACTIONS.meetingAudio = function (req, me) {
  var m = meetingOf_(me, req.id, true);
  if (!aiOk_(m)) throw new Error(m.Type === 'Bishopric' ? 'Bishopric meetings aren\'t recorded on the free Gemini plan.' : 'Recording isn\'t turned on (Settings › Engine › Record and summarize meetings).');
  var data = String(req.data || ''); if (!data) throw new Error('No audio');
  if (data.length > 19e6) throw new Error('That part is too long. Record in the app, which sends it a few minutes at a time.');
  var out = gemini_([{ text: 'Transcribe this part of a church leadership meeting. Write what was said, in order, as plain text. When a speaker says a name or is addressed by name, label them; otherwise label speakers by voice ("Speaker 1"). Skip filler words. Answer only with JSON: {"text":"..."}' },
    { inline_data: { mime_type: String(req.mime || 'audio/webm').split(';')[0], data: data } }]);
  var text = String(out.text || '').trim(), f = transcriptFile_(m, true);
  f.setContent(f.getBlob().getDataAsString() + (text ? '\n\n[Part ' + (+req.part || 1) + ']\n' + text : ''));
  if (!m.Transcript) save_(null, 'Meetings', { ID: m.ID, Transcript: f.getId() }, { system: true, quiet: true });
  return { chars: text.length };
};
ACTIONS.meetingAnalyze = function (req, me) {
  var m = meetingOf_(me, req.id, true);
  var text = String(req.text || '').trim(), from = 'notes';
  if (!text) { var f = transcriptFile_(m, false); text = f ? f.getBlob().getDataAsString().trim() : ''; from = 'recording'; }
  if (text.length < 40) throw new Error('There isn\'t enough to go on yet. Record the meeting or paste the notes.');
  if (from === 'notes' && !setting_('gemini_key')) throw new Error('This needs the free Gemini key (Settings).');
  if (from === 'notes' && /^off/i.test(setting_('meeting_ai') || 'Off')) throw new Error('Turn on Settings › Engine › Record and summarize meetings first.');
  if (from === 'notes' && !aiOk_(m)) throw new Error('Bishopric meeting notes aren\'t sent to the free Gemini plan.');
  var items = rows_('Agenda').filter(function (a) { return a.Meeting === m.ID; }).sort(function (a, b) { return (+a.Order || 0) - (+b.Order || 0); });
  var people = meetingEmails_(m).length ? '' : '';
  var names = rows_('Callings').filter(function (c) { return !/Released|Proposed|Open/.test(c.Status); }).map(function (c) { return c.Person + ' (' + c.Calling + ')'; }).slice(0, 120).join('; ');
  var ask = 'You are the secretary for a ' + m.Type + (m.Organization ? ' (' + m.Organization + ')' : '') + ' meeting of a congregation of The Church of Jesus Christ of Latter-day Saints, held ' + m.Date + '. ' +
    'From the ' + (from === 'recording' ? 'transcript' : 'notes') + ' below, keep ONLY what matters: decisions, assignments, dates, and the few points leaders need to remember. Leave out small talk, prayers and thoughts word for word, and repetition. ' +
    'Protect privacy: never record details of anyone\'s worthiness, confessions, health, finances or family problems; write "discussed a member\'s needs (see the bishop)" instead. ' +
    'Match each point to an agenda item by its id when it fits. Assignments need an owner: use the person\'s name as it appears in this list when you can: ' + names + '. Dates as YYYY-MM-DD (today is ' + ymd_(today_()) + '). ' +
    'Answer only with JSON: {"summary":["3 to 8 short points"],"agenda":[{"id":"agenda id","notes":"short","decision":"short or empty"}],"tasks":[{"task":"","owner":"","due":"YYYY-MM-DD or empty"}],"carry":["items to put on the next agenda"],"prayers":{"opening":"","thought":"","closing":""}}\n\n' +
    'AGENDA:\n' + items.map(function (a) { return a.ID + ' | ' + a.Item + (a.Lead ? ' (' + a.Lead + ')' : ''); }).join('\n') + '\n\n' + (from === 'recording' ? 'TRANSCRIPT' : 'NOTES') + ':\n' + text.slice(0, 120000);
  var out = gemini_([{ text: ask }]), done = { points: 0, notes: 0, tasks: 0, carried: 0 };
  var sum = (out.summary || []).map(function (s) { return '• ' + String(s).trim(); }).filter(function (s) { return s.length > 2; }).slice(0, 10);
  var row = { ID: m.ID, Summary: sum.join('\n'), Status: 'Held' }, pr = out.prayers || {};
  if (pr.opening && !m['Opening prayer']) row['Opening prayer'] = String(pr.opening).slice(0, 80);
  if (pr.thought && !m['Spiritual thought']) row['Spiritual thought'] = String(pr.thought).slice(0, 80);
  if (pr.closing && !m['Closing prayer']) row['Closing prayer'] = String(pr.closing).slice(0, 80);
  save_(null, 'Meetings', row, { system: true, quiet: true }); done.points = sum.length;
  var byId = {}; items.forEach(function (a) { byId[a.ID] = a; });
  (out.agenda || []).forEach(function (x) {
    var a = byId[x.id]; if (!a || !(x.notes || x.decision)) return;
    var add = function (cur, v) { v = String(v || '').trim(); return !v ? cur : cur ? (cur.indexOf(v) >= 0 ? cur : cur + '\n' + v) : v; };
    save_(null, 'Agenda', { ID: a.ID, Notes: add(a.Notes, x.notes).slice(0, 4000), Decision: add(a.Decision, x.decision).slice(0, 2000) }, { system: true, quiet: true }); done.notes++;
  });
  var have = {}; rows_('Tasks').forEach(function (t) { if (t.Source === m.ID) have[nkey_(t.Task)] = 1; });
  (out.tasks || []).slice(0, 25).forEach(function (t) {
    var task = String(t.task || '').trim().slice(0, 300); if (!task || have[nkey_(task)]) return;
    save_(null, 'Tasks', { Task: task, Owner: String(t.owner || '').slice(0, 80), Due: /^\d{4}-\d\d-\d\d$/.test(t.due || '') ? t.due : '', Status: 'Not started', Organization: m.Organization || (m.Type === 'Bishopric' ? 'Bishopric' : 'Ward'), Source: m.ID, Created: ymd_(today_()) }, { system: true, quiet: true }); done.tasks++;
  });
  if ((out.carry || []).length) {
    try { ensureMeetings_(); } catch (e) {}
    var next = rows_('Meetings').filter(function (x) { return x.Type === m.Type && (x.Organization || '') === (m.Organization || '') && x.Date > m.Date && x.Status !== 'Cancelled'; }).sort(function (a, b) { return a.Date.localeCompare(b.Date); })[0];
    if (next) { var n = rows_('Agenda').filter(function (a) { return a.Meeting === next.ID; }).length; out.carry.slice(0, 10).forEach(function (c, i) { save_(null, 'Agenda', { Meeting: next.ID, Order: n + i + 1, Item: String(c).slice(0, 300), Source: 'Carried from ' + m.Date }, { system: true, quiet: true }); done.carried++; }); done.next = next.Date; }
  }
  log_(me.name, 'meeting notes', 'Meetings', m.ID, done.points + ' points, ' + done.tasks + ' assignments');
  return done;
};
ACTIONS.meetingTranscript = function (req, me) {
  var m = meetingOf_(me, req.id, true), f = transcriptFile_(m, false);
  return { text: f ? f.getBlob().getDataAsString() : '' };
};
ACTIONS.meetingTranscriptClear = function (req, me) {
  var m = meetingOf_(me, req.id, true), f = transcriptFile_(m, false); if (f) f.setTrashed(true);
  save_(null, 'Meetings', { ID: m.ID, Transcript: '' }, { system: true, quiet: true }); return {};
};
/* Nightly: transcripts are deleted after the set number of days. */
function cleanTranscripts_() {
  var it = DriveApp.getFoldersByName('Ward Hub meeting transcripts'); if (!it.hasNext()) return 'none';
  var cut = addDays_(today_(), -(+setting_('transcript_days') || 30)), fi = it.next().getFiles(), n = 0;
  while (fi.hasNext()) { var f = fi.next(); if (f.getLastUpdated() < cut) { f.setTrashed(true); n++; } }
  return n + ' removed';
}

/* Nightly: signed permission forms are kept for the set number of days, then moved to the trash. */
function cleanPermits_() {
  var it = DriveApp.getFoldersByName('Ward Hub permission forms'); if (!it.hasNext()) return 'none';
  var cut = addDays_(today_(), -(+setting_('permit_keep_days') || 365)), fi = it.next().getFiles(), n = 0;
  while (fi.hasNext()) { var f = fi.next(); if (f.getLastUpdated() < cut) { f.setTrashed(true); n++; } }
  return n + ' removed';
}


/* ================= Emergency plan: what each leader does, step by step, and checking on every household ================= */
/* A starter plan from the Church's ward emergency planning guide. Replace it with the ward's own plan (the red binder) in All lists › Emergency. */
var EM_STARTER_V = 2;
var EM_STARTER = [
  ['Info', 'Everyone', 1, 'Ward council gathering place', 'Fill in from the ward plan (Settings › Emergency). If it isn\'t safe, use the backup place.'],
  ['Info', 'Everyone', 2, 'Order of priorities', '1. Help anyone injured or in danger. 2. Account for every household and reunite families. 3. Report to the bishop, then the stake. 4. Arrange shelter, food and care. 5. Check Church property from outside. 6. Open the meetinghouse as a shelter only with the stake president\'s approval. 7. Organize neighbors to help neighbors.'],
  ['Info', 'Everyone', 3, 'If the bishop can\'t be reached', 'The first counselor leads, then the second counselor, then the elders quorum president, until the bishop is available.'],
  ['Info', 'Everyone', 4, 'If phones are down', 'Text instead of calling: texts often get through when calls don\'t. Then use the ward\'s radio plan (see the emergency specialist). If nothing works, send a runner (an adult, or youth with a parent\'s permission) or go in person to the gathering place.'],
  ['Info', 'Everyone', 5, 'Help and OK signs', 'If the ward uses them: households put an OK or HELP sign in a front window so ministers and neighbors can see at a glance who needs help.'],
  ['Right away', 'Everyone', 1, 'Your family first', 'Make sure you and your family are safe. Give first aid. Call 911 for anything life-threatening.'],
  ['Right away', 'Everyone', 2, 'Follow civil authorities', 'Do what police and fire officials say: evacuate, or stay where you are. Listen to local radio or official alerts.'],
  ['Right away', 'Everyone', 3, 'Check on those near you', 'Check on your neighbors, then on the families you minister to. Text a short report to your elders quorum or Relief Society leader: safe, needs help, or urgent.'],
  ['Right away', 'Bishop', 1, 'Go to the gathering place', 'Once your family is safe, go to the ward council gathering place, or gather the council by text.'],
  ['Right away', 'Bishop', 2, 'Start the check-in', 'Open More › Emergency plan and tap Start. Every leader then sees what to do, and elders quorum and Relief Society leaders mark each household.'],
  ['First hours', 'Bishop', 1, 'Report to the stake president', 'Report the condition of members and missionaries, then of the meetinghouse. Use the "Report to the stake" text on this screen.'],
  ['First hours', 'Bishop', 2, 'Meet the needs', 'Decide on food, shelter, medical care and clothing for those who need them, working with civil authorities. Use fast offerings for immediate needs.'],
  ['First days', 'Bishop', 1, 'Care for those who lost the most', 'Help members who lost homes, belongings or work, and those who are hurting; refer to Family Services when counseling would help. Look for ways the ward can serve the community.'],
  ['Right away', 'Bishopric', 1, 'Help the bishop', 'Join the gathering. One counselor checks on the youth and Primary leaders; one checks the meetinghouse from outside (never enter a damaged building).'],
  ['Right away', 'Executive secretary', 1, 'Keep the list', 'Watch the check-in on this screen. Call or text anyone marked "Can\'t reach." Keep a short log of decisions.'],
  ['First hours', 'Executive secretary', 2, 'Send the report', 'Send the bishop\'s report to the stake when he approves it.'],
  ['Right away', 'Elders quorum', 1, 'Start the ministering brothers', 'Text the zone leaders to check on every household they minister to, starting with the "check first" list.'],
  ['First hours', 'Elders quorum', 2, 'Mark each household', 'Mark each one Safe, Needs help, Urgent (injured or trapped) or Can\'t reach in the check-in, with what they need. Report every household to the bishop within the set number of hours.'],
  ['First hours', 'Elders quorum', 3, 'Organize help', 'Gather brothers with tools and skills (chainsaws, generators, first aid, CERT training) where the bishop sends them. Handle shelter and sanitation needs.'],
  ['Right away', 'Relief Society', 1, 'Start the ministering sisters', 'Text ministering sisters to check on every sister and family they minister to, starting with the "check first" list: those who live alone, are elderly, or have medical or special needs.'],
  ['First hours', 'Relief Society', 2, 'Mark each household', 'Mark each one Safe, Needs help, Urgent or Can\'t reach in the check-in, with what they need.'],
  ['First hours', 'Relief Society', 3, 'Care and meals', 'Arrange meals, a place to stay, and someone to sit with those who are frightened or grieving.'],
  ['Right away', 'Youth leaders', 1, 'If it happens at an activity', 'Keep the youth together with at least two adults. Take roll. Contact parents. Release a youth only to a parent or someone the parent names.'],
  ['First hours', 'Youth leaders', 2, 'Afterward', 'Text the parents of every youth in your class to be sure they are safe, and tell your president. Youth may help (messages, child care, cleanup) only with a parent\'s permission and an adult present.'],
  ['Right away', 'Primary', 1, 'If it happens during church', 'Teachers keep children together and leave by the nearest safe exit to the gathering spot outside. Take roll. Release a child only to a parent or guardian.'],
  ['First hours', 'Primary', 2, 'Watch the children', 'Offer supervised child care so parents can help or rest, always with two adults.'],
  ['Right away', 'Teachers', 1, 'If it happens during class', 'Stay with your class, leave by the nearest safe exit, and take roll at the gathering spot outside.'],
  ['First hours', 'Clerk', 1, 'Records and the list', 'Keep ward records safe and help the executive secretary reach those marked "Can\'t reach."'],
  ['Right away', 'Emergency specialist', 1, 'Communications', 'Set up the backup ways to talk (text, radio, runners) and keep the bishop connected to the stake.'],
  ['First hours', 'Emergency specialist', 2, 'Resources', 'Match needs with members\' skills and equipment, and with city and county resources.'],
  ['Before', 'Everyone', 1, 'Your family plan', 'Choose a family meeting place and a backup, and an out-of-town contact who can relay news. Keep your phone number and address current in Member Tools so leaders can reach you.'],
  ['Before', 'Everyone', 2, 'Kits and water', 'A go-kit with at least three days of supplies you can carry, and at home at least two weeks of food and water: one gallon of water per person per day. Include medicines, cash, copies of documents, a flashlight, a radio and chargers.'],
  ['Before', 'Everyone', 3, 'Your home', 'Strap the water heater and heavy furniture to the wall. Know how to shut off water, power and gas (gas only if you smell or hear a leak; the gas company must turn it back on).'],
  ['Before', 'Bishopric', 1, 'Review the plan', 'Ward council reviews this plan every six months and after any emergency, and practices the check-in during the Great Utah ShakeOut each April.'],
  ['Before', 'Elders quorum', 1, 'Keep the lists current', 'With the Relief Society: the "check first" list (members who live alone, are elderly or have special needs), and members with useful skills or equipment.'],
  ['Before', 'Relief Society', 1, 'Check-first list', 'Keep the "check first" households marked in the Hub, with the elders quorum.'],
  ['Before', 'Emergency specialist', 1, 'Test the backups', 'Test the radio plan and runners twice a year, and keep the plan current with the stake\'s.'],
  ['Hazard', 'Earthquake', 1, 'During', 'Drop, Cover and Hold On until the shaking stops. In bed, stay there and cover your head with a pillow. Outdoors, move away from buildings and power lines. Driving, pull over away from overpasses and stay in the car.'],
  ['Hazard', 'Earthquake', 2, 'After', 'Expect aftershocks. Put on sturdy shoes. If you smell gas, leave and call 911; don\'t use switches or flames. Check a building from outside before going in. Then check on your ministering families.'],
  ['Hazard', 'Wildfire or evacuation', 1, 'Steps', 'Leave as soon as officials say to; don\'t wait. Take your go-kit, medicines and pets. Tell your elders quorum or Relief Society leader where you went.'],
  ['Hazard', 'Winter storm or power outage', 1, 'Steps', 'Check first on members who are elderly or rely on power for medical equipment. Run generators outside only, away from windows (carbon monoxide). Offer warm places to stay.'],
  ['Hazard', 'Fire or gas leak at church', 1, 'Steps', 'Leave the building by the nearest safe exit and go to the gathering spot outside. Call 911. Teachers take roll. Don\'t go back in until firefighters say it\'s safe.'],
  ['Hazard', 'Medical emergency at church', 1, 'Steps', 'Call 911 and name the building address. Send someone to meet the ambulance at the door. Start first aid or CPR if you\'re trained.'],
  ['Hazard', 'Threat or violence at church', 1, 'Steps', 'Run if you can get out safely; hide and lock or barricade the door if you can\'t; as a last resort, defend yourself. Call 911 when it\'s safe. Teachers keep children with them.'],
  ['Hazard', 'Flood or burst pipes', 1, 'Steps', 'Turn off the water if you can. Avoid floodwater. Report meetinghouse damage to the bishop and the facilities manager.']
];

function emSeed_() {
  var rows = rows_('Emergency'), p = PropertiesService.getScriptProperties();
  if (rows.length && +p.getProperty('emStarterV') !== EM_STARTER_V && rows.every(function (r) { return r.Notes === 'Starter plan'; })) {
    var sh = sheet_('Emergency'); rows.sort(function (a, b) { return b._r - a._r; }).forEach(function (r) { sh.deleteRow(r._r); }); bump_('Emergency'); rows = [];
  }
  p.setProperty('emStarterV', String(EM_STARTER_V));
  if (rows.length) return;
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
function canEditPlan_(me) { return isBishopric_(me) || emRoles_(me).indexOf('Emergency specialist') >= 0; }
/* The bishopric and the ward emergency specialist keep the plan current in the app. */
ACTIONS.emStepSave = function (req, me) {
  if (!canEditPlan_(me)) throw new Error('The bishopric and the ward emergency specialist edit the plan.');
  var r = req.row || {}, cur = r.ID ? rows_('Emergency').filter(function (x) { return x.ID === r.ID; })[0] : null;
  if (req.remove && cur) { sheet_('Emergency').deleteRow(cur._r); bump_('Emergency'); return {}; }
  var row = { Phase: r.Phase, Role: String(r.Role || 'Everyone').slice(0, 60), Order: +r.Order || 1, Title: String(r.Title || '').slice(0, 120), Text: String(r.Text || '').slice(0, 2000), Phone: String(r.Phone || '').slice(0, 30), Link: /^https?:\/\//.test(r.Link || '') ? r.Link : '', Notes: 'Ward plan' };
  if (cur) row.ID = cur.ID;
  log_(me.name, 'emergency plan', 'Emergency', cur ? cur.ID : '', row.Title);
  return { id: save_(null, 'Emergency', row, { system: true }) };
};
ACTIONS.emSettingsSave = function (req, me) {
  if (!canEditPlan_(me)) throw new Error('The bishopric and the ward emergency specialist edit the plan.');
  ['emergency_place1', 'emergency_place2', 'emergency_stake_phone', 'emergency_hours'].forEach(function (k) { if (req[k] !== undefined) save_(null, 'Settings', { Key: k, Value: String(req[k]).slice(0, 200) }, { system: true, quiet: true }); });
  SET_CACHE_ = null; return {};
};
function emActive_() { try { return JSON.parse(setting_('emergency_active') || 'null'); } catch (e) { return null; } }
function canCheck_(me) { return isBishopric_(me) || me.roles.clerk || me.orgs.indexOf('Elders Quorum') >= 0 || me.orgs.indexOf('Relief Society') >= 0; }
ACTIONS.emergency = function (req, me) {
  if (!(isBishopric_(me) || me.roles.leader || me.roles.clerk || me.roles.teacher)) throw new Error('The emergency plan is for leaders and teachers.');
  emSeed_();
  var mine = emRoles_(me), plan = rows_('Emergency').map(strip_).sort(function (a, b) { return String(a.Role).localeCompare(String(b.Role)) || (+a.Order || 0) - (+b.Order || 0); });
  var C = rows_('Callings').filter(function (c) { return !/Released|Proposed|Open/.test(c.Status); }), ppl = {}; rows_('People').forEach(function (p) { ppl[nkey_(p.Name)] = p; });
  var key = /^(Bishop|Bishopric .*Counselor|Ward Executive Secretary|Ward Clerk|Relief Society President|Elders Quorum President|Young Women President|Primary President|Sunday School President|Ward Mission Leader|.*Emergency.*)$/i;
  var contacts = C.filter(function (c) { return key.test(c.Calling); }).map(function (c) { var p = ppl[nkey_(c.Person)] || {}; return { name: c.Person, calling: c.Calling, phone: p.Phone || '' }; });
  var out = { plan: plan, mine: mine, active: emActive_(), contacts: contacts, canStart: isBishopric_(me), canCheck: canCheck_(me), canEdit: canEditPlan_(me),
    places: [setting_('emergency_place1'), setting_('emergency_place2')].filter(Boolean), stake: setting_('emergency_stake_phone'), hours: +setting_('emergency_hours') || 4 };
  if ((out.active || req.board) && canCheck_(me)) out.check = emBoard_(me, out.active || { id: '' });
  return out;
};
/* Every household, with its latest mark in this emergency. Elders quorum and Relief Society see the households they serve; the bishopric sees all. */
function emBoard_(me, act) {
  var latest = {}, first = {};
  rows_('Check-ins').forEach(function (r) {
    if (r.Event === 'PRIORITY') { first[r.Household] = r.Status === 'Check first'; return; }
    if (act.id && r.Event === act.id && (!latest[r.Household] || String(r.When) >= String(latest[r.Household].When))) latest[r.Household] = r;
  });
  var hh = {};
  rows_('People').forEach(function (p) {
    if (p.Source === 'Moved out') return;
    var h = p.Household || p['Sort name'] || p.Name; (hh[h] = hh[h] || { household: h, people: [], phones: [] });
    hh[h].people.push(p.Name); if (p.Phone && (age_(p['Birth date']) || 99) >= 18) hh[h].phones.push({ n: p.Name, p: p.Phone });
  });
  var list = Object.keys(hh).sort(function (a, b) { return (first[b] ? 1 : 0) - (first[a] ? 1 : 0) || a.localeCompare(b); }).map(function (k) { var x = hh[k], l = latest[k]; x.first = !!first[k]; x.status = l ? l.Status : ''; x.needs = l ? l.Needs : ''; x.by = l ? l.By : ''; x.when = l ? l.When : ''; x.phones = x.phones.slice(0, 2); x.people = x.people.slice(0, 8); return x; });
  var n = function (s) { return list.filter(function (x) { return x.status === s; }).length; };
  return { list: list, counts: { total: list.length, safe: n('Safe'), help: n('Needs help'), urgent: n('Urgent'), cant: n('Can\'t reach'), left: n(''), first: list.filter(function (x) { return x.first; }).length } };
}
ACTIONS.checkFirst = function (req, me) {
  if (!canCheck_(me)) throw new Error('Elders quorum and Relief Society leaders keep the check-first list.');
  var h = String(req.household || '').slice(0, 120), cur = rows_('Check-ins').filter(function (r) { return r.Event === 'PRIORITY' && r.Household === h; })[0];
  var row = { Event: 'PRIORITY', Household: h, Status: req.on ? 'Check first' : 'Safe', By: me.name, When: Utilities.formatDate(new Date(), tz_(), "yyyy-MM-dd'T'HH:mm") };
  if (cur) row.ID = cur.ID; save_(null, 'Check-ins', row, { system: true, quiet: true });
  return {};
};
ACTIONS.emergencyStart = function (req, me) {
  if (!isBishopric_(me)) throw new Error('The bishopric starts the emergency check-in.');
  var name = String(req.name || '').trim().slice(0, 80) || 'Emergency';
  var act = { id: 'EM-' + Utilities.formatDate(new Date(), tz_(), "yyyyMMdd-HHmm"), name: name, drill: req.drill === true, started: Utilities.formatDate(new Date(), tz_(), "yyyy-MM-dd'T'HH:mm"), by: me.name };
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
  if (['Safe', 'Needs help', 'Urgent', 'Can\'t reach'].indexOf(req.status) < 0) throw new Error('Pick Safe, Needs help, Urgent or Can\'t reach.');
  var h = String(req.household || '').slice(0, 120); if (!h) throw new Error('Pick a household.');
  save_(null, 'Check-ins', { Event: act.id, Household: h, Status: req.status, Needs: String(req.needs || '').slice(0, 300), By: me.name, When: Utilities.formatDate(new Date(), tz_(), "yyyy-MM-dd'T'HH:mm") }, { system: true, quiet: true });
  return { counts: emBoard_(me, act).counts };
};

/* ================= v1 parity: leaders recommend calling changes; the program publishes itself on Sunday morning ================= */
ACTIONS.recommendCalling = function (req, me) {
  var org = String(req.org || ''); if (!(isBishopric_(me) || me.orgs.indexOf(org) >= 0)) throw new Error('Recommend changes for your own organization.');
  var person = String(req.person || '').trim(), calling = String(req.calling || '').trim().slice(0, 80), change = req.change === 'Release' ? 'Release' : 'Call';
  if (!person || !calling) throw new Error('Add the person and the calling.');
  var sys = Object.assign({}, me, { roles: Object.assign({}, me.roles, { admin: 1, bishopric: 1 }) });
  var id = save_(sys, 'Callings', { Organization: org, Calling: calling, Person: person, Status: 'Proposed', Change: change, Source: 'Hub', 'Private notes': ('Recommended by ' + me.name + (req.why ? ': ' + String(req.why).slice(0, 300) : '')) }, { system: true, quiet: true });
  try {
    ensureMeetings_();
    var bm = rows_('Meetings').filter(function (m) { return m.Type === 'Bishopric' && m.Status === 'Planned' && m.Date >= ymd_(today_()); }).sort(function (a, b) { return a.Date.localeCompare(b.Date); })[0];
    if (bm) save_(sys, 'Agenda', { Meeting: bm.ID, Order: 50, Item: 'Calling recommendation (' + org + '): ' + change + ' ' + person + (change === 'Release' ? ' from ' : ' as ') + calling, Lead: 'Bishop', Source: me.name }, { system: true, quiet: true });
  } catch (e) {}
  log_(me.name, 'recommend', 'Callings', id, org);
  return { id: id };
};
ACTIONS.myRecommendations = function (req, me) {
  var k = nkey_(me.name);
  return { list: rows_('Callings').filter(function (c) { return c.Source === 'Hub' && String(c['Private notes'] || '').indexOf('Recommended by ' + me.name) === 0; }).map(function (c) { return { person: c.Person, calling: c.Calling, change: c.Change, status: c.Status, org: c.Organization }; }) };
};
/* Sunday: 15 minutes before sacrament meeting, publish the program if no one has, or again if anything changed since. */
function autoPublish_() {
  if (today_().getDay() !== 0) return 'not Sunday';
  var d = ymd_(today_()), S = rows_('Sundays').filter(function (s) { return s.Date === d; })[0];
  if (S && S.Type === 'No meeting') return 'no meeting today';
  var sys = { name: 'Hub', roles: { admin: 1, bishopric: 1 }, orgs: [] }, p = PropertiesService.getScriptProperties(), old = p.getProperty('pub:' + d);
  if (old) {
    var a = JSON.parse(old), b = buildProgram_(d); delete a.published; delete b.published;
    if (JSON.stringify(a) === JSON.stringify(b)) return 'already up to date';
  }
  ACTIONS.publish({ date: d }, sys);
  return old ? 'republished with the latest changes' : 'published';
}
/* The nightly job sets a one-time trigger for 15 minutes before the meeting (Sundays only). */
function schedulePublish_() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'publishNow') ScriptApp.deleteTrigger(t); });
  if (today_().getDay() !== 0) return 'not Sunday';
  var k = timeKey_(churchTime_(ymd_(today_())) || '9:00 AM'); if (k === '99:99') k = '09:00';
  var at = today_(); at.setHours(+k.slice(0, 2), +k.slice(3) - (+setting_('publish_minutes_before') || 15), 0, 0);
  if (at <= new Date()) { autoPublish_(); return 'published now'; }
  ScriptApp.newTrigger('publishNow').timeBased().at(at).create();
  return 'set for ' + Utilities.formatDate(at, tz_(), 'h:mm a');
}
function publishNow() { jobRecord_('publish', autoPublish_); ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'publishNow') ScriptApp.deleteTrigger(t); }); }


/* ================= Community: the flag fundraiser, sign-up sheets with a public link, and dinner groups ================= */
PUBLIC_ACTIONS.flagCrew = 1; PUBLIC_ACTIONS.flagTrade = 1;
PUBLIC_ACTIONS.signupPublic = 1; PUBLIC_ACTIONS.signupJoin = 1; PUBLIC_ACTIONS.signupLeave = 1;
HIDDEN_COLS['Sign-up entries'] = { Code: 'never' };

/* ---------- shared helpers ---------- */
function cmSys_(me) { return Object.assign({}, me || { name: 'Hub', orgs: [] }, { roles: { admin: 1, bishopric: 1, member: 1 } }); }
/* Text typed by anyone: no control characters, never read by the sheet as a formula. */
function cmClean_(s, n, multi) {
  var v = String(s == null ? '' : s).replace(multi ? /[\u0000-\u0009\u000b-\u001f]/g : /[\u0000-\u001f]/g, ' ').trim().slice(0, n || 200);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}
function cmRaw_(s) { return String(s == null ? '' : s).replace(/^'/, ''); }
function cmSecret_() { var p = PropertiesService.getScriptProperties(), s = p.getProperty('COMMUNITY_SECRET'); if (!s) { s = Utilities.getUuid(); p.setProperty('COMMUNITY_SECRET', s); } return s; }
function cmSig_(s) { return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s + '|' + cmSecret_())).replace(/[^A-Za-z0-9]/g, '').slice(0, 16); }
function cmRate_(key, max) {
  var p = PropertiesService.getScriptProperties(), d = ymd_(today_()), was = String(p.getProperty('RATE:' + key) || '').split('|'), n = was[0] === d ? +was[1] || 0 : 0;
  if (n >= max) throw new Error('This page is very busy today. Please text the organizer instead.');
  p.setProperty('RATE:' + key, d + '|' + (n + 1));
}
function cmNow_() { return Utilities.formatDate(new Date(), tz_(), "yyyy-MM-dd'T'HH:mm"); }
/* "Mary Smith" → "Mary S."; "John & Jane Doe" → "John & Jane D." (what public pages show). */
function cmShort_(n) {
  var w = cmRaw_(n).trim().split(/\s+/); if (w.length < 2) return w[0] || '';
  var firsts = w.slice(0, -1).join(' ');
  if (!/&|\band\b/i.test(firsts)) firsts = w[0];
  return firsts + ' ' + w[w.length - 1].charAt(0).toUpperCase() + '.';
}
function cmPeople_() {
  var by = {}, hh = {};
  rows_('People').forEach(function (p) { if (p.Source === 'Moved out') return; by[nkey_(p.Name)] = p; var k = nkey_(p.Household); if (k) (hh[k] = hh[k] || []).push(p); });
  return { by: by, hh: hh };
}
function cmAdult_(p) { var a = age_(p['Birth date']); return a === null || a >= 18; }
/* Phones of the adults a name stands for: "Jane Doe", or a family written "John & Jane Doe". */
function cmAdultPhones_(label, P) {
  var raw = cmRaw_(label).trim(), one = P.by[nkey_(raw)], out = [];
  var add = function (p) { if (p && cmAdult_(p) && p.Phone && p["Don't text"] !== true && !out.some(function (o) { return o.n === p.Name; })) out.push({ n: p.Name, p: p.Phone }); };
  if (one) { add(one); return out; }
  var w = raw.replace(/\band\b/gi, '&').split(/\s+/); if (w.length < 2) return out;
  var last = w[w.length - 1], firsts = w.slice(0, -1).join(' ').split(/\s*[&,]\s*/).map(function (f) { return f.split(/\s+/)[0]; }).filter(Boolean);
  firsts.forEach(function (f) {
    var p = P.by[nkey_(f + ' ' + last)];
    if (!p) (P.hh[nkey_(last)] || []).some(function (h) { if (nkey_(first_(h.Name)) === nkey_(f)) { p = h; return true; } return false; });
    add(p);
  });
  return out;
}
/* Youth protection: a youth is texted only together with a parent. No parent phone = not texted. */
function cmYouthPhones_(p, P) {
  var out = [];
  if (p['Parent phone']) out.push({ n: 'Parent of ' + first_(p.Name), p: p['Parent phone'] });
  (P.hh[nkey_(p.Household)] || []).forEach(function (h) { var a = age_(h['Birth date']); if (a !== null && a >= 25 && h.Phone && h["Don't text"] !== true) out.push({ n: h.Name, p: h.Phone }); });
  out = out.slice(0, 3);
  if (out.length && p.Phone && p["Don't text"] !== true) out.unshift({ n: p.Name, p: p.Phone });
  return out;
}
/* Which youth organization each young man or young woman belongs to (from the class lists). */
function cmYouthOrgs_() {
  var o = {}; rows_('Groups').forEach(function (g) { if ((g.Kind === 'Class' || g.Kind === 'Quorum') && g.Role === 'Member' && (g.Organization === 'Young Women' || g.Organization === 'Young Men')) o[nkey_(g.Person)] = g.Organization; });
  return o;
}
function cmDedupe_(list) { var seen = {}; return list.filter(function (x) { var k = String(x.p).replace(/\D/g, '').slice(-10); if (!k || seen[k]) return false; seen[k] = 1; return true; }); }
/* Many rows at once (one write), and deleting rows by ID (bottom up). */
function cmAppend_(tab, list) {
  if (!list.length) return [];
  var d = tabDef_(tab), idCol = d.cols[0][0], lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var sh = sheet_(tab), lastCol = Math.max(sh.getLastColumn(), d.cols.length), head = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(String), ids = [];
    var lines = list.map(function (row) {
      if (!row[idCol]) row[idCol] = newId_(tab); ids.push(row[idCol]);
      var line = head.map(function () { return ''; });
      d.cols.forEach(function (c) { var i = head.indexOf(c[0]); if (i >= 0 && (c[0] in row)) line[i] = toIn_(row[c[0]], c[1]); });
      return line;
    });
    sh.getRange(sh.getLastRow() + 1, 1, lines.length, lastCol).setValues(lines);
    bump_(tab); if (tab === 'Groups') clearWho_();
    return ids;
  } finally { lock.releaseLock(); }
}
function cmDelete_(tab, ids) {
  if (!ids.length) return 0;
  var d = tabDef_(tab), want = {}; ids.forEach(function (i) { want[String(i)] = 1; });
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var rs = rows_(tab).filter(function (r) { return want[String(r[d.cols[0][0]])]; }).map(function (r) { return r._r; }).sort(function (a, b) { return b - a; });
    var sh = sheet_(tab); rs.forEach(function (r) { sh.deleteRow(r); });
    if (rs.length) { bump_(tab); if (tab === 'Groups') clearWho_(); }
    return rs.length;
  } finally { lock.releaseLock(); }
}
function cmSetting_(me, key, value) { save_(me, 'Settings', { Key: key, Value: value }, { system: true, quiet: true }); SET_CACHE_ = null; }

/* =================================================================== the flag fundraiser */
/* Homes sign up for a flag on each holiday. Crews (adults, youth, families) put them out, one crew per zone.
   Addresses are private: only the coordinators (leaders of flag_org, anyone with a flag calling, and the bishopric) see the list;
   each crew gets a link to its own zone for that holiday only, with names and addresses and nothing else. */
function flagOrg_() { return setting_('flag_org') || 'Young Men'; }
/* Youth with quorum or class callings count as leaders elsewhere; neighbors' addresses and other youth's details are for adults only. */
function cmMinor_(me) { var p = rows_('People').filter(function (x) { return nkey_(x.Name) === nkey_(me.name); })[0], a = p ? age_(p['Birth date']) : null; return a !== null && a < 18; }
function canFlags_(me) { return isBishopric_(me) || ((me.orgs.indexOf(flagOrg_()) >= 0 || (me.callings || []).some(function (c) { return /flag/i.test(c); })) && !cmMinor_(me)); }
function needFlags_(me) { if (!canFlags_(me)) throw new Error('The flag fundraiser is run by the ' + flagOrg_() + ' leaders and the bishopric.'); }
function flagSeason_() { return setting_('flag_season') || String(today_().getFullYear()); }
function flagZones_() {
  var n = Math.max(1, Math.min(12, Math.floor(+setting_('flag_zones') || 3))), names = String(setting_('flag_zone_names') || '').split(/\s*,\s*/), out = [];
  for (var i = 1; i <= n; i++) out.push({ id: String(i), name: names[i - 1] || '', label: 'Zone ' + i + (names[i - 1] ? ' · ' + names[i - 1] : '') });
  return out;
}
function flagZone_(id) { var z = flagZones_().filter(function (x) { return x.id === String(id); })[0]; if (!z) throw new Error('Pick a zone.'); return z; }
function flagHolidays_() {
  return rows_('Events').filter(function (e) { return /^Flags?:/i.test(String(e.Title || '')) && e.Date && e.Status !== 'Cancelled'; })
    .sort(function (a, b) { return String(a.Date).localeCompare(String(b.Date)); });
}
function flagHoliday_(id) { var h = flagHolidays_().filter(function (x) { return x.ID === String(id || ''); })[0]; if (!h) throw new Error('That holiday isn\'t on the calendar.'); return h; }
function flagName_(h) { return String(h.Title || '').replace(/^Flags?:\s*/i, ''); }
function flagSubs_(season) { var cur = flagSeason_(); season = season || cur; return rows_('Flag subscribers').filter(function (s) { return (s.Season || cur) === season; }); }
function flagAddrKey_(a) { return cmRaw_(a).toLowerCase().replace(/[^a-z0-9]/g, ''); }
function flagPaid_(s) { var paid = +s.Paid || 0; return paid > 0 && paid >= (+s.Pledged || 0); }
/* Stops in a zone: the coordinator's numbers first, then by street and house number. */
function flagAddr_(a) { var m = cmRaw_(a).trim().match(/^(\d+)\s*(.*)$/); return m ? { st: m[2].toLowerCase().replace(/[^a-z0-9 ]/g, ''), n: +m[1] } : { st: cmRaw_(a).toLowerCase(), n: 0 }; }
function flagRoute_(subs, zone) {
  return subs.filter(function (s) { return s.Stopped !== true && String(s.Zone) === String(zone); }).sort(function (a, b) {
    var ao = +a.Order || 1e6, bo = +b.Order || 1e6; if (ao !== bo) return ao - bo;
    var x = flagAddr_(a.Address), y = flagAddr_(b.Address); return x.st.localeCompare(y.st) || x.n - y.n;
  });
}
function flagCrews_(hid, zone) { return rows_('Flag crews').filter(function (c) { return c.Holiday === hid && (zone == null || String(c.Zone) === String(zone)); }); }
/* The crew link: one per holiday and zone, signed so it can't be guessed, and it stops working two days after the holiday. */
function flagToken_(hid, zone) { return hid + '.' + zone + '.' + cmSig_('flag|' + hid + '|' + zone); }
function flagTok_(t) {
  var p = String(t || '').split('.'); if (p.length !== 3 || flagToken_(p[0], p[1]) !== String(t)) return null;
  var h = flagHolidays_().filter(function (x) { return x.ID === p[0]; })[0]; if (!h) return null;
  return { h: h, zone: p[1], expired: ymd_(addDays_(parseYmd_(h.Date), 2)) < ymd_(today_()) };
}
/* Youth a coordinator may put on a crew: their own classes (the bishopric: all youth). */
function flagYouth_(me) {
  var out = [], seen = {}, yo = cmYouthOrgs_();
  Object.keys(yo).forEach(function (k) { if (isBishopric_(me) || me.orgs.indexOf(yo[k]) >= 0) seen[k] = 1; });
  rows_('People').forEach(function (p) { var a = age_(p['Birth date']); if (seen[nkey_(p.Name)] && p.Source !== 'Moved out' && (a === null || a < 19)) out.push(p.Name); });
  return out.sort();
}

ACTIONS.flags = function (req, me) {
  needFlags_(me);
  var cur = flagSeason_(), season = String(req.season || cur), zones = flagZones_(), t = today_(), tY = ymd_(t), from = ymd_(addDays_(t, -30)), to = ymd_(addDays_(t, 430));
  var all = rows_('Flag subscribers'), seasons = {}; seasons[cur] = 1; all.forEach(function (s) { seasons[s.Season || cur] = 1; });
  var subs = flagSubs_(season).map(strip_), on = subs.filter(function (s) { return s.Stopped !== true; });
  var sum = function (k) { return on.reduce(function (a, s) { return a + (+s[k] || 0); }, 0); };
  var crews = rows_('Flag crews'), hol = flagHolidays_();
  var list = hol.filter(function (h) { return req.all || (h.Date >= from && h.Date <= to); }).map(function (h) {
    var z = {}; zones.forEach(function (zz) { z[zz.id] = crews.filter(function (c) { return c.Holiday === h.ID && String(c.Zone) === zz.id; }).map(function (c) { return { id: c.ID, person: c.Person, kind: c.Kind || 'Adult', status: c.Status || 'Assigned', notes: c.Notes || '' }; }); });
    return { id: h.ID, name: flagName_(h), date: h.Date, start: h.Start || '', end: h.End || '', past: h.Date < tY, crews: z };
  });
  var hmap = {}; hol.forEach(function (h) { hmap[h.ID] = h; });
  var trades = crews.filter(function (c) { return c.Status === 'Trade asked' && hmap[c.Holiday]; }).map(function (c) { return { id: c.ID, person: c.Person, kind: c.Kind, zone: c.Zone, holiday: flagName_(hmap[c.Holiday]), holidayId: c.Holiday, date: hmap[c.Holiday].Date, notes: c.Notes || '' }; });
  return {
    org: flagOrg_(), season: season, current: cur, seasons: Object.keys(seasons).sort(), donation: setting_('flag_donation'), zones: zones, city: setting_('flag_city'), pickup: setting_('flag_pickup'),
    subs: subs, totals: { homes: on.length, flags: on.reduce(function (a, s) { return a + (+s.Flags || 1); }, 0), pledged: sum('Pledged'), paid: sum('Paid'), unpaid: on.filter(function (s) { return !flagPaid_(s); }).length, noZone: on.filter(function (s) { return !s.Zone; }).length },
    holidays: list, trades: trades, youth: flagYouth_(me),
    families: rows_('Groups').filter(function (g) { return g.Kind === 'Flags' && g.Person; }).map(function (g) { return g.Person; }).sort()
  };
};
ACTIONS.flagSubSave = function (req, me) {
  needFlags_(me);
  var cur = null; if (req.row && req.row.ID) { cur = rows_('Flag subscribers').filter(function (x) { return x.ID === req.row.ID; })[0]; if (!cur) throw new Error('Not found'); }
  var r = Object.assign({}, cur ? strip_(cur) : {}, req.row || {});
  var name = cmClean_(r.Name, 100), addr = cmClean_(r.Address, 160); if (!name || !addr) throw new Error('Add the name and street address.');
  var zone = String(r.Zone == null ? '' : r.Zone).trim(); if (zone) flagZone_(zone);
  var flags = Math.max(1, Math.min(20, Math.floor(+r.Flags || 1))), don = +String(setting_('flag_donation') || '').replace(/[^\d.]/g, '') || 0;
  var money = function (v) { return v === '' || v == null ? '' : Math.max(0, Math.min(10000, Math.round(+String(v).replace(/[^\d.]/g, '') * 100) / 100 || 0)); };
  var pledged = money(r.Pledged); if (pledged === '' && !cur && don) pledged = don * flags;
  var paid = money(r.Paid), paidOn = /^\d{4}-\d\d-\d\d$/.test(r['Paid on'] || '') ? r['Paid on'] : '';
  if (paid && (!paidOn || (cur && +cur.Paid !== paid && r['Paid on'] === cur['Paid on']))) paidOn = ymd_(today_());
  if (!paid) paidOn = '';
  var row = { Name: name, Address: addr, Phone: cmClean_(r.Phone, 40), Email: cmClean_(r.Email, 120), Zone: zone, Order: r.Order === '' || r.Order == null ? '' : (Math.max(0, Math.floor(+r.Order)) || ''),
    Flags: flags, Pledged: pledged, Paid: paid, 'Paid on': paidOn, 'How paid': cmClean_(r['How paid'], 40), Season: cmClean_(r.Season, 20) || flagSeason_(), Placement: cmClean_(r.Placement, 200),
    Stopped: r.Stopped === true, Notes: cmClean_(r.Notes, 500, true) };
  if (cur) row.ID = cur.ID;
  else if (flagSubs_(row.Season).some(function (s) { return flagAddrKey_(s.Address) === flagAddrKey_(addr); })) throw new Error('That address is already on the list for ' + row.Season + '.');
  return { id: save_(me, 'Flag subscribers', row, { system: true }) };
};
ACTIONS.flagSubRemove = function (req, me) { needFlags_(me); return { removed: remove_(cmSys_(me), 'Flag subscribers', String(req.id || '')) }; };
/* A new season: everyone still taking a flag is copied over, not yet paid. */
ACTIONS.flagNewSeason = function (req, me) {
  needFlags_(me);
  var s = cmClean_(req.season, 20), cur = flagSeason_(); if (!s) throw new Error('Name the new season, e.g. ' + (today_().getFullYear() + 1) + '.');
  if (s === cur) throw new Error('That is already the current season.');
  var have = {}; flagSubs_(s).forEach(function (x) { have[flagAddrKey_(x.Address)] = 1; });
  var don = +String(setting_('flag_donation') || '').replace(/[^\d.]/g, '') || 0;
  var add = flagSubs_(cur).filter(function (x) { return x.Stopped !== true && !have[flagAddrKey_(x.Address)]; }).map(function (x) {
    return { Name: x.Name, Address: x.Address, Phone: x.Phone, Email: x.Email, Zone: x.Zone, Order: x.Order, Flags: x.Flags, Pledged: don ? don * (+x.Flags || 1) : x.Pledged, Paid: '', 'Paid on': '', 'How paid': '', Season: s, Placement: x.Placement, Stopped: false, Notes: x.Notes };
  });
  cmAppend_('Flag subscribers', add);
  cmSetting_(me, 'flag_season', s); log_(me.name, 'flag season', 'Flag subscribers', s, add.length + ' copied');
  return { copied: add.length, season: s };
};
ACTIONS.flagHolidaySave = function (req, me) {
  needFlags_(me);
  var name = cmClean_(req.name, 60).replace(/^Flags?:\s*/i, ''), d = String(req.date || '');
  if (!name || !/^\d{4}-\d\d-\d\d$/.test(d)) throw new Error('Add the holiday and its date.');
  var cur = req.id ? flagHoliday_(req.id) : null, hol = flagHolidays_();
  if (hol.some(function (h) { return h.Date === d && (!cur || h.ID !== cur.ID); })) throw new Error('There is already a flag holiday on that day.');
  var last = hol.filter(function (h) { return h.Start; }).slice(-1)[0] || {};
  var row = { Title: 'Flags: ' + name, Date: d, Start: cmClean_(req.start, 20) || (cur ? cur.Start : last.Start || '7:00 AM'), End: cmClean_(req.end, 20) || (cur ? cur.End : last.End || '6:00 PM'),
    Organization: cur ? cur.Organization : 'Ward', Place: cur ? cur.Place : 'Neighborhood', Status: 'Approved', Source: cur ? cur.Source : 'Flags' };
  if (cur) row.ID = cur.ID;
  var id = save_(me, 'Events', row, { system: true });
  if (cur && cur.Date !== d) flagCrews_(cur.ID).forEach(function (c) { save_(null, 'Flag crews', { ID: c.ID, Date: d }, { system: true, quiet: true }); });
  return { id: id };
};
ACTIONS.flagHolidayRemove = function (req, me) { needFlags_(me); var h = flagHoliday_(req.id); save_(me, 'Events', { ID: h.ID, Status: 'Cancelled' }, { system: true }); return {}; };
/* The usual date of a holiday in a given year (by its name), or the same month and day as last time. */
function flagRuleDate_(name, y, lastYmd) {
  var nth = function (m, wd, n) { var d = new Date(y, m, 1); d.setDate(1 + ((wd - d.getDay() + 7) % 7) + 7 * (n - 1)); return d; };
  var lastMon = function (m) { var d = new Date(y, m + 1, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; };
  var R = [[/memorial/i, function () { return lastMon(4); }], [/president|washington/i, function () { return nth(1, 1, 3); }], [/labor/i, function () { return nth(8, 1, 1); }],
    [/martin luther|mlk/i, function () { return nth(0, 1, 3); }], [/columbus|indigenous/i, function () { return nth(9, 1, 2); }], [/flag day/i, function () { return new Date(y, 5, 14); }],
    [/juneteenth/i, function () { return new Date(y, 5, 19); }], [/independence|fourth|4th/i, function () { return new Date(y, 6, 4); }], [/pioneer/i, function () { return new Date(y, 6, 24); }],
    [/patriot|9\/11|september 11/i, function () { return new Date(y, 8, 11); }], [/veteran/i, function () { return new Date(y, 10, 11); }], [/new year/i, function () { return new Date(y, 0, 1); }]];
  for (var i = 0; i < R.length; i++) if (R[i][0].test(name)) return ymd_(R[i][1]());
  if (lastYmd) { var p = parseYmd_(lastYmd); return ymd_(new Date(y, p.getMonth(), p.getDate())); }
  return '';
}
var FLAG_DEFAULTS_ = ['Presidents\' Day', 'Memorial Day', 'Flag Day', 'Independence Day', 'Labor Day', 'Patriot Day', 'Veterans Day'];
/* Add a whole year's holidays at once: the ones used before (or the usual list), each on its date that year. */
ACTIONS.flagYear = function (req, me) {
  needFlags_(me);
  var y = Math.floor(+req.year || 0); if (y < 2000 || y > 2100) throw new Error('Pick a year.');
  var hol = flagHolidays_(), last = {}, order = [];
  hol.forEach(function (h) { var n = flagName_(h).replace(/[‘’]/g, '\''), k = nkey_(n); if (!last[k]) order.push(k); last[k] = { name: n, h: h }; });
  if (!order.length) FLAG_DEFAULTS_.forEach(function (n) { var k = nkey_(n); order.push(k); last[k] = { name: n, h: null }; });
  var added = [];
  order.forEach(function (k) {
    var x = last[k], d = flagRuleDate_(x.name, y, x.h ? x.h.Date : ''); if (!d) return;
    if (hol.some(function (h) { return h.Date === d || (nkey_(flagName_(h).replace(/[‘’]/g, '\'')) === k && String(h.Date).slice(0, 4) === String(y)); })) return;
    save_(me, 'Events', { Title: 'Flags: ' + x.name, Date: d, Start: x.h ? x.h.Start : '7:00 AM', End: x.h ? x.h.End : '6:00 PM', Organization: x.h ? x.h.Organization : 'Ward', Place: x.h ? x.h.Place : 'Neighborhood', Status: 'Approved', Source: 'Flags' }, { system: true, quiet: true });
    added.push(x.name + ' ' + d);
  });
  if (added.length) log_(me.name, 'flag holidays', 'Events', String(y), added.join(', '));
  return { added: added };
};
/* Set who covers one zone on one holiday. Minors are always marked Youth. */
function flagPerson_(me, p, youth) {
  var person = cmClean_(p.person, 80), kind = ['Adult', 'Youth', 'Family'].indexOf(p.kind) >= 0 ? p.kind : 'Adult';
  if (!person) return null;
  var pp = rows_('People').filter(function (x) { return nkey_(x.Name) === nkey_(person); })[0], a = pp ? age_(pp['Birth date']) : null;
  if (a !== null && a < 18) kind = 'Youth';
  if (kind === 'Youth' && youth.map(nkey_).indexOf(nkey_(person)) < 0) throw new Error(person + ' isn\'t in your youth classes. Ask their leaders, or the bishopric can add them.');
  return { person: pp && kind !== 'Family' ? pp.Name : person, kind: kind };
}
ACTIONS.flagCrewSave = function (req, me) {
  needFlags_(me);
  var h = flagHoliday_(req.holiday), z = flagZone_(req.zone), youth = flagYouth_(me);
  var want = [].concat(req.people || []).slice(0, 15).map(function (p) { return flagPerson_(me, p || {}, youth); }).filter(Boolean);
  var cur = flagCrews_(h.ID, z.id), keep = {}, seen = {};
  want = want.filter(function (w) { var k = nkey_(w.person); if (seen[k]) return false; seen[k] = 1; return true; });
  cur.forEach(function (c) { var w = want.filter(function (x) { return nkey_(x.person) === nkey_(c.Person); })[0]; if (w) { keep[nkey_(c.Person)] = 1; if (w.kind !== c.Kind) save_(null, 'Flag crews', { ID: c.ID, Kind: w.kind }, { system: true, quiet: true }); } });
  cmDelete_('Flag crews', cur.filter(function (c) { return !keep[nkey_(c.Person)]; }).map(function (c) { return c.ID; }));
  cmAppend_('Flag crews', want.filter(function (w) { return !keep[nkey_(w.person)]; }).map(function (w) { return { Holiday: h.ID, Date: h.Date, Zone: z.id, Person: w.person, Kind: w.kind, Status: 'Assigned' }; }));
  log_(me.name, 'flag crew', 'Flag crews', h.ID, z.label + ': ' + want.map(function (w) { return w.person; }).join(', '));
  return { crew: flagCrews_(h.ID, z.id).map(function (c) { return { id: c.ID, person: c.Person, kind: c.Kind, status: c.Status || 'Assigned', notes: c.Notes || '' }; }) };
};
/* The crew's link and a ready text. Youth are texted only with a parent; a youth outside the coordinator's own classes is left to their leaders. */
ACTIONS.flagCrewLink = function (req, me) {
  needFlags_(me);
  var h = flagHoliday_(req.holiday), z = flagZone_(req.zone), P = cmPeople_(), yo = cmYouthOrgs_(), to = [], missing = [];
  var link = appUrl_(req.app) + 'flags.html?t=' + encodeURIComponent(flagToken_(h.ID, z.id));
  flagCrews_(h.ID, z.id).forEach(function (c) {
    var p = P.by[nkey_(c.Person)], a = p ? age_(p['Birth date']) : null;
    if (c.Kind === 'Youth' || (a !== null && a < 18)) {
      if (!p) { missing.push(c.Person + ' (not on the ward list)'); return; }
      if (!isBishopric_(me) && me.orgs.indexOf(yo[nkey_(p.Name)] || '-') < 0) { missing.push(c.Person + ' (ask their leaders)'); return; }
      var yp = cmYouthPhones_(p, P); if (!yp.length) { missing.push(c.Person + ' (no parent phone)'); return; }
      to = to.concat(yp); return;
    }
    var ph = cmAdultPhones_(c.Person, P); if (!ph.length) missing.push(c.Person + ' (no phone)'); to = to.concat(ph);
  });
  var pick = setting_('flag_pickup');
  var text = 'Thank you for putting out flags for ' + flagName_(h) + ', ' + fmtDay_(h.Date) + '. ' + z.label + '. ' + (h.Start ? 'Set up by ' + h.Start : 'Set up early morning') + (h.End ? ', take down after ' + h.End : '') + '.' +
    (pick ? ' Flags: ' + pick + '.' : '') + ' Your route (neighbors\' addresses, please keep it to your crew): ' + link + ' Can\'t make it? Ask for a trade on that page.';
  return { link: link, text: text, to: cmDedupe_(to), missing: missing, zone: z.label, holiday: flagName_(h) };
};
ACTIONS.flagTradeDecide = function (req, me) {
  needFlags_(me);
  var c = rows_('Flag crews').filter(function (x) { return x.ID === req.id; })[0]; if (!c) throw new Error('Not found');
  var note = function (x, s) { return (x.Notes ? x.Notes + ' · ' : '') + s; }, day = ymd_(today_());
  if (req.decide === 'decline') { save_(me, 'Flag crews', { ID: c.ID, Status: 'Assigned', Notes: note(c, 'Trade not needed ' + day) }, { system: true }); return {}; }
  if (req.decide === 'swap') {
    var o = rows_('Flag crews').filter(function (x) { return x.ID === req['with']; })[0]; if (!o || o.ID === c.ID) throw new Error('Pick who they trade with.');
    save_(me, 'Flag crews', { ID: c.ID, Person: o.Person, Kind: o.Kind, Status: 'Traded', Notes: note(c, 'Traded with ' + c.Person + ' ' + day) }, { system: true });
    save_(me, 'Flag crews', { ID: o.ID, Person: c.Person, Kind: c.Kind, Status: 'Traded', Notes: note(o, 'Traded with ' + o.Person + ' ' + day) }, { system: true });
    return {};
  }
  if (req.decide === 'replace') {
    var w = flagPerson_(me, { person: req.person, kind: req.kind }, flagYouth_(me)); if (!w) throw new Error('Who takes their place?');
    save_(me, 'Flag crews', { ID: c.ID, Person: w.person, Kind: w.kind, Status: 'Traded', Notes: note(c, 'Was ' + c.Person + ' ' + day) }, { system: true });
    return {};
  }
  throw new Error('Pick swap, replace or decline.');
};
/* Public crew page: this holiday, this zone, homes in order with name and address only. */
ACTIONS.flagCrew = function (req) {
  var c = flagTok_(req.t); if (!c) return { ok: false, error: 'This link isn\'t recognized. Ask the flag coordinator for a new one.' };
  if (c.expired) return { ok: false, error: 'This route was for ' + flagName_(c.h) + '. Ask the flag coordinator for the next holiday\'s link.' };
  var h = c.h, z = flagZones_().filter(function (x) { return x.id === c.zone; })[0] || { label: 'Zone ' + c.zone };
  var homes = flagRoute_(flagSubs_(), c.zone).map(function (s, i) { return { n: i + 1, name: cmRaw_(s.Name), address: cmRaw_(s.Address), flags: +s.Flags || 1, placement: cmRaw_(s.Placement) }; });
  return { ward: setting_('ward_name'), holiday: flagName_(h), date: h.Date, start: h.Start || '', end: h.End || '', zone: z.label, pickup: setting_('flag_pickup'), city: setting_('flag_city'),
    homes: homes, flags: homes.reduce(function (a, x) { return a + x.flags; }, 0), crew: flagCrews_(h.ID, c.zone).map(function (x) { return { name: cmShort_(x.Person), status: x.Status || 'Assigned' }; }) };
};
ACTIONS.flagTrade = function (req) {
  var c = flagTok_(req.t); if (!c || c.expired) throw new Error('This link isn\'t recognized.');
  cmRate_('flag:' + c.h.ID + ':' + c.zone, 20);
  var row = flagCrews_(c.h.ID, c.zone).filter(function (x) { return cmShort_(x.Person) === String(req.who || ''); })[0];
  if (!row) throw new Error('Pick your name.');
  var note = cmClean_(req.note, 200);
  save_(null, 'Flag crews', { ID: row.ID, Status: 'Trade asked', Notes: (row.Notes ? row.Notes + ' · ' : '') + 'Asked to trade ' + ymd_(today_()) + (note ? ': ' + note : '') }, { system: true, quiet: true });
  log_('Crew page', 'flag trade', 'Flag crews', row.ID, cmShort_(row.Person));
  return { msg: 'Thank you. The flag coordinator will find someone to trade with you and let you know.' };
};

/* =================================================================== sign-up sheets */
/* A leader makes a sheet with slots; anyone with the link adds their name and phone. The public page shows first names and last initials, never phones. */
function suCan_(me) { if (!(isBishopric_(me) || (me.roles.leader && !cmMinor_(me)))) throw new Error('Sign-up sheets are for leaders.'); }
function suOrgs_(me) { return isBishopric_(me) ? ORG_LIST_.filter(function (o) { return o !== 'Stake' && o !== 'Youth'; }) : me.orgs.slice(); }
function suMine_(me, s) { return isBishopric_(me) || me.orgs.indexOf(s.Organization) >= 0 || nkey_(s['Created by']) === nkey_(me.name); }
function suSlots_(s) { try { var a = JSON.parse(s.Slots || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
function suOpen_(s) { return s.Status !== 'Closed' && (!s.Closes || s.Closes >= ymd_(today_())); }
function suEntries_(id) { return rows_('Sign-up entries').filter(function (e) { return e.Sheet === id; }); }
function suGet_(me, id) { var s = rows_('Sign-ups').filter(function (x) { return x.ID === String(id || ''); })[0]; if (!s || !suMine_(me, s)) throw new Error('Not found'); return s; }
function suFind_(id) { id = String(id || ''); if (!/^SU[0-9A-Z]{6,}$/.test(id)) return null; return rows_('Sign-ups').filter(function (x) { return x.ID === id; })[0] || null; }
function suState_(s, full) {
  var E = suEntries_(s.ID);
  return suSlots_(s).map(function (sl) {
    var es = E.filter(function (e) { return e.Slot === sl.id; }), need = +sl.need || 0;
    return { id: sl.id, date: sl.date || '', time: sl.time || '', label: sl.label || '', need: need, count: es.length, left: need ? Math.max(0, need - es.length) : -1,
      people: full ? es.map(function (e) { return { id: e.ID, name: cmRaw_(e.Name), phone: cmRaw_(e.Phone), note: cmRaw_(e.Note), added: e.Added, by: e['Added by'] }; }) : es.map(function (e) { return cmShort_(e.Name); }) };
  });
}
ACTIONS.signups = function (req, me) {
  suCan_(me);
  var E = rows_('Sign-up entries');
  var list = rows_('Sign-ups').filter(function (s) { return suMine_(me, s); }).map(function (s) {
    var sl = suSlots_(s), n = E.filter(function (e) { return e.Sheet === s.ID; }).length;
    return { id: s.ID, title: s.Title, org: s.Organization, closes: s.Closes, open: suOpen_(s), status: s.Status || 'Open', kind: s.Kind || 'Slots', count: n, need: sl.reduce(function (a, x) { return a + (+x.need || 0); }, 0), slots: sl.length, created: s.Created, by: s['Created by'] };
  }).sort(function (a, b) { return (b.open ? 1 : 0) - (a.open ? 1 : 0) || String(b.created).localeCompare(String(a.created)); });
  return { list: list, orgs: suOrgs_(me), dinner: canDinner_(me) };
};
ACTIONS.signupSave = function (req, me) {
  suCan_(me);
  var r = req.row || {}, cur = r.ID ? suGet_(me, r.ID) : null;
  var title = cmClean_(r.Title, 120); if (!title) throw new Error('Give the sheet a title.');
  var org = String(r.Organization || (cur ? cur.Organization : '') || ''); if (suOrgs_(me).indexOf(org) < 0 && !(cur && cur.Organization === org)) throw new Error('Pick your organization.');
  var kind = (r.Kind || (cur && cur.Kind)) === 'Dinner groups' ? 'Dinner groups' : 'Slots';
  if (kind === 'Dinner groups' && !canDinner_(me)) throw new Error('Dinner groups are run by the ' + dinnerOrg_() + ' and the bishopric.');
  var seen = {}, slots = kind === 'Slots' ? [].concat(r.Slots || []).slice(0, 80).map(function (x) {
    x = x || {}; var id = /^[a-z0-9]{3,12}$/i.test(x.id || '') && !seen[x.id] ? x.id : 's' + Utilities.getUuid().replace(/-/g, '').slice(0, 7); seen[id] = 1;
    return { id: id, date: /^\d{4}-\d\d-\d\d$/.test(x.date || '') ? x.date : '', time: cmClean_(x.time, 20), label: cmClean_(x.label, 100), need: Math.max(0, Math.min(500, Math.floor(+x.need || 0))) };
  }).filter(function (x) { return x.label || x.date || x.time; }) : [];
  if (kind === 'Slots' && !slots.length) throw new Error('Add at least one slot (a date, a time or a job).');
  if (cur) suEntries_(cur.ID).forEach(function (e) { if (kind === 'Slots' && !slots.some(function (x) { return x.id === e.Slot; })) throw new Error(cmRaw_(e.Name) + ' signed up for a slot you took out. Take their name off first.'); });
  var row = { Title: title, Organization: org, Description: cmClean_(r.Description, 2000, true), Closes: /^\d{4}-\d\d-\d\d$/.test(r.Closes || '') ? r.Closes : '', Status: r.Status === 'Closed' ? 'Closed' : 'Open', Kind: kind, Slots: JSON.stringify(slots) };
  if (cur) row.ID = cur.ID;
  else { row.ID = 'SU' + Utilities.getUuid().replace(/-/g, '').slice(0, 10).toUpperCase(); row['Created by'] = me.name; row.Created = ymd_(today_()); }
  save_(me, 'Sign-ups', row, { system: true });
  return { id: row.ID };
};
/* The organizer's view: every name with phone and note, for texting everyone. */
ACTIONS.signupView = function (req, me) {
  suCan_(me);
  var s = suGet_(me, req.id), state = suState_(s, true), E = suEntries_(s.ID);
  var joined = (s.Kind === 'Dinner groups') ? E.map(function (e) { return { id: e.ID, name: cmRaw_(e.Name), phone: cmRaw_(e.Phone), note: cmRaw_(e.Note), added: e.Added, by: e['Added by'] }; }) : [];
  return { sheet: { id: s.ID, title: s.Title, org: s.Organization, description: s.Description, closes: s.Closes, status: s.Status || 'Open', open: suOpen_(s), kind: s.Kind || 'Slots', created: s.Created, by: s['Created by'], slots: suSlots_(s) },
    slots: state, joined: joined, phones: cmDedupe_(E.filter(function (e) { return e.Phone; }).map(function (e) { return { n: cmRaw_(e.Name), p: cmRaw_(e.Phone) }; })), ward: setting_('ward_name') };
};
ACTIONS.signupEntryAdd = function (req, me) {
  suCan_(me);
  var s = suGet_(me, req.id), name = cmClean_(req.name, 80); if (!name) throw new Error('Add a name.');
  var slot = s.Kind === 'Dinner groups' ? 'join' : (suSlots_(s).filter(function (x) { return x.id === req.slot; })[0] || {}).id;
  if (!slot) throw new Error('Pick a slot.');
  if (slot === 'join') dinnerOptIn_(name, req.newer === true);
  save_(null, 'Sign-up entries', { Sheet: s.ID, Slot: slot, Name: name, Phone: cmClean_(req.phone, 40), Note: cmClean_(req.note, 300), Added: cmNow_(), 'Added by': me.name, Code: Utilities.getUuid().replace(/-/g, '').slice(0, 16) }, { system: true, quiet: true });
  return {};
};
ACTIONS.signupEntryRemove = function (req, me) {
  suCan_(me);
  var s = suGet_(me, req.id), e = suEntries_(s.ID).filter(function (x) { return x.ID === req.entry; })[0]; if (!e) throw new Error('Already removed.');
  cmDelete_('Sign-up entries', [e.ID]); log_(me.name, 'sign-up remove', 'Sign-ups', s.ID, cmRaw_(e.Name));
  return {};
};
ACTIONS.signupRemove = function (req, me) {
  suCan_(me);
  var s = suGet_(me, req.id);
  cmDelete_('Sign-up entries', suEntries_(s.ID).map(function (e) { return e.ID; }));
  return { removed: remove_(cmSys_(me), 'Sign-ups', s.ID) };
};
/* ---- public sign-up page ---- */
ACTIONS.signupPublic = function (req) {
  var s = suFind_(req.s); if (!s) return { ok: false, error: 'This sign-up link isn\'t recognized.' };
  return { ward: setting_('ward_name'), id: s.ID, title: s.Title, org: s.Organization, description: cmRaw_(s.Description), closes: s.Closes, open: suOpen_(s), kind: s.Kind || 'Slots',
    slots: s.Kind === 'Dinner groups' ? [] : suState_(s, false), size: +setting_('dinner_size') || 4 };
};
ACTIONS.signupJoin = function (req) {
  var s = suFind_(req.s); if (!s) throw new Error('This sign-up link isn\'t recognized.');
  if (!suOpen_(s)) throw new Error('This sign-up is closed. Please contact the organizer.');
  cmRate_('su:' + s.ID, 400);
  var name = cmClean_(req.name, 80).replace(/\s+/g, ' '), phone = cmClean_(req.phone, 40), note = cmClean_(req.note, 300), slot = '';
  if (name.replace(/[^A-Za-zÀ-ɏ]/g, '').length < 2) throw new Error('Please type your name.');
  if (phone.replace(/\D/g, '').length < 7) throw new Error('Please add a phone number so the organizer can reach you.');
  var E = suEntries_(s.ID);
  if (s.Kind === 'Dinner groups') {
    slot = 'join';
    if (E.some(function (e) { return nkey_(e.Name) === nkey_(name); })) throw new Error('You\'re already signed up. Thank you!');
    dinnerOptIn_(name, req.newer === true, true);
  } else {
    var sl = suSlots_(s).filter(function (x) { return x.id === String(req.slot || ''); })[0]; if (!sl) throw new Error('Pick a time or a job.');
    var mine = E.filter(function (e) { return e.Slot === sl.id; });
    if (mine.some(function (e) { return nkey_(e.Name) === nkey_(name); })) throw new Error('You\'re already signed up for that one.');
    if (+sl.need && mine.length >= +sl.need) throw new Error('That one just filled up. Please pick another.');
    slot = sl.id;
  }
  var code = Utilities.getUuid().replace(/-/g, '').slice(0, 16);
  save_(null, 'Sign-up entries', { Sheet: s.ID, Slot: slot, Name: name, Phone: phone, Note: note, Added: cmNow_(), 'Added by': '', Code: code }, { system: true, quiet: true });
  log_('Sign-up page', 'sign-up', 'Sign-ups', s.ID, cmShort_(name));
  return { code: code, slot: slot, msg: s.Kind === 'Dinner groups' ? 'Thank you! You\'re signed up for dinner groups. The organizer will text your group.' : 'Thank you! You\'re signed up.', slots: s.Kind === 'Dinner groups' ? [] : suState_(s, false) };
};
ACTIONS.signupLeave = function (req) {
  var s = suFind_(req.s); if (!s) throw new Error('This sign-up link isn\'t recognized.');
  var code = String(req.code || ''); if (!/^[0-9a-f]{12,}$/i.test(code)) throw new Error('Not found.');
  var e = suEntries_(s.ID).filter(function (x) { return x.Code === code; })[0]; if (!e) throw new Error('Already taken off.');
  cmDelete_('Sign-up entries', [e.ID]);
  if (e.Slot === 'join') cmDelete_('Groups', dinnerPool_().filter(function (g) { return nkey_(g.Person) === nkey_(e.Name) && /sign-up page/i.test(g.Notes || ''); }).map(function (g) { return g.ID; }));
  log_('Sign-up page', 'sign-up removed', 'Sign-ups', s.ID, cmShort_(e.Name));
  return { msg: 'Your name was taken off.', slots: s.Kind === 'Dinner groups' ? [] : suState_(s, false) };
};

/* =================================================================== dinner groups */
/* Households opt in (rows on Groups with Kind "Dinner group"). Each season the coordinator makes groups of about N households,
   each household hosting in turn, keeping last season's tablemates apart where it can. Group rows: Group "Group 3", Period = the season. */
function dinnerOrg_() { return setting_('dinner_org') || 'Relief Society'; }
function canDinner_(me) { return isBishopric_(me) || (me.orgs.indexOf(dinnerOrg_()) >= 0 && !cmMinor_(me)); }
function needDinner_(me) { if (!canDinner_(me)) throw new Error('Dinner groups are run by the ' + dinnerOrg_() + ' and the bishopric.'); }
function dinnerCfg_() { try { return JSON.parse(setting_('dinner_season') || 'null') || {}; } catch (e) { return {}; } }
function dinnerAll_() { return rows_('Groups').filter(function (g) { return g.Kind === 'Dinner group' && g.Person; }); }
function dinnerIsGroup_(g) { return /^Group\s*\d+$/i.test(String(g.Group || '')); }
function dinnerPool_() { var seen = {}; return dinnerAll_().filter(function (g) { var k = nkey_(g.Person); if (dinnerIsGroup_(g) || seen[k]) return false; seen[k] = 1; return true; }); }
function dinnerNewer_(g) { return /newer/i.test(g.Notes || ''); }
function dinnerHostN_(g) { var m = String(g.Notes || '').match(/^Host (\d+)/); return m ? +m[1] : 99; }
function dinnerHostDates_(g) { var m = String(g.Notes || '').match(/^Host \d+: ([^·]*)/); return m ? m[1].trim().split(/\s*,\s*/).filter(function (x) { return /^\d{4}-\d\d-\d\d$/.test(x); }) : []; }
function dinnerNum_(s) { return +String(s).replace(/\D/g, '') || 0; }
function dinnerSeason_(name) {
  if (!name) return [];
  var by = {}; dinnerAll_().forEach(function (g) { if (dinnerIsGroup_(g) && g.Period === name) (by[g.Group] = by[g.Group] || []).push(g); });
  return Object.keys(by).sort(function (a, b) { return dinnerNum_(a) - dinnerNum_(b); }).map(function (k) { return { name: k, rows: by[k].sort(function (a, b) { return dinnerHostN_(a) - dinnerHostN_(b); }) }; });
}
function dinnerOptIn_(name, newer, fromPage) {
  var k = nkey_(name); if (!k) return false;
  if (dinnerPool_().some(function (g) { return nkey_(g.Person) === k; })) return false;
  save_(null, 'Groups', { Kind: 'Dinner group', Organization: dinnerOrg_(), Group: 'Signed up', Person: name, Role: 'Member', Notes: [newer ? 'Newer to ward' : '', fromPage ? 'From the sign-up page' : ''].filter(Boolean).join(' · ') }, { system: true, quiet: true });
  return true;
}
/* Household names for the opt-in list: "John & Jane Doe" for a couple, otherwise the adult's name. */
function dinnerHouseholds_(P) {
  var out = [];
  Object.keys(P.hh).forEach(function (k) {
    var ad = P.hh[k].filter(function (p) { var a = age_(p['Birth date']); return a !== null && a >= 18; }).sort(function (a, b) { return String(a['Birth date']).localeCompare(String(b['Birth date'])); });
    if (!ad.length) return;
    var a = ad[0], sp = a.Spouse ? ad.filter(function (p) { return nkey_(p.Name) === nkey_(a.Spouse); })[0] : null, last = String(a.Name).split(' ').slice(-1)[0];
    out.push(sp && String(sp.Name).split(' ').slice(-1)[0] === last ? first_(a.Name) + ' & ' + first_(sp.Name) + ' ' + last : a.Name);
  });
  return out.sort();
}
function dinnerPhones_(P) {
  var E = rows_('Sign-up entries').filter(function (e) { return e.Slot === 'join' && e.Phone; });
  return function (label) {
    var ph = cmAdultPhones_(label, P);
    if (!ph.length) E.forEach(function (e) { if (nkey_(e.Name) === nkey_(label)) ph = [{ n: cmRaw_(label), p: cmRaw_(e.Phone) }]; });
    return ph;
  };
}
ACTIONS.dinners = function (req, me) {
  needDinner_(me);
  var cfg = dinnerCfg_(), P = cmPeople_(), phones = dinnerPhones_(P);
  var pool = dinnerPool_().map(function (g) { return { id: g.ID, name: cmRaw_(g.Person), newer: dinnerNewer_(g), phones: phones(g.Person).length, page: /sign-up page/i.test(g.Notes || '') }; }).sort(function (a, b) { return a.name.localeCompare(b.name); });
  var groups = dinnerSeason_(cfg.name).map(function (gr) {
    return { name: gr.name, members: gr.rows.map(function (r) { return { id: r.ID, name: cmRaw_(r.Person), host: dinnerHostN_(r), dates: dinnerHostDates_(r), newer: dinnerNewer_(r), phones: phones(r.Person) }; }) };
  });
  var sheet = rows_('Sign-ups').filter(function (s) { return s.Kind === 'Dinner groups' && suOpen_(s); }).sort(function (a, b) { return String(b.Created).localeCompare(String(a.Created)); })[0];
  return { org: dinnerOrg_(), size: +setting_('dinner_size') || 4, season: cfg, pool: pool, groups: groups, households: dinnerHouseholds_(P), signup: sheet ? { id: sheet.ID, title: sheet.Title } : null, ward: setting_('ward_name') };
};
ACTIONS.dinnerOptIn = function (req, me) {
  needDinner_(me);
  var name = cmClean_(req.name, 100); if (!name) throw new Error('Add the household.');
  if (!dinnerOptIn_(name, req.newer === true)) throw new Error('They are already on the list.');
  return {};
};
ACTIONS.dinnerOptOut = function (req, me) {
  needDinner_(me);
  var g = dinnerPool_().filter(function (x) { return x.ID === req.id; })[0]; if (!g) throw new Error('Not found');
  cmDelete_('Groups', dinnerAll_().filter(function (x) { return !dinnerIsGroup_(x) && nkey_(x.Person) === nkey_(g.Person); }).map(function (x) { return x.ID; }));
  log_(me.name, 'dinner opt out', 'Groups', g.ID, cmRaw_(g.Person));
  return {};
};
/* Make this season's groups. Tries many shuffles and keeps the one with the fewest repeats of last season's pairs
   and the fewest newer households at one table. Hosts take turns; those who hosted first last time go later. */
ACTIONS.dinnerMake = function (req, me) {
  needDinner_(me);
  var name = cmClean_(req.season, 40); if (!name) throw new Error('Name the season, e.g. ' + today_().getFullYear() + ' Spring.');
  var size = Math.max(2, Math.min(8, Math.floor(+req.size || +setting_('dinner_size') || 4)));
  var dates = [].concat(req.dates || []).filter(function (d) { return /^\d{4}-\d\d-\d\d$/.test(d); }).sort().slice(0, 24);
  var pool = dinnerPool_(), N = pool.length; if (N < 2) throw new Error('At least two households need to opt in first.');
  var cfg = dinnerCfg_(), prev = cfg.name && cfg.name !== name ? cfg.name : (cfg.prev || '');
  var pairs = {}, hosted = {};
  dinnerSeason_(prev).forEach(function (gr) {
    var ks = gr.rows.map(function (r) { return nkey_(r.Person); });
    ks.forEach(function (a) { ks.forEach(function (b) { if (a !== b) pairs[a + '|' + b] = 1; }); });
    gr.rows.forEach(function (r) { if (dinnerHostN_(r) === 1) hosted[nkey_(r.Person)] = 1; });
  });
  var g = Math.max(1, Math.round(N / size)), sizes = []; for (var i = 0; i < g; i++) sizes.push(Math.floor(N / g) + (i < N % g ? 1 : 0));
  var items = pool.map(function (p) { return { name: cmRaw_(p.Person), k: nkey_(p.Person), newer: dinnerNewer_(p) }; });
  var pc = function (x, y) { return (pairs[x.k + '|' + y.k] ? 10 : 0) + (x.newer && y.newer ? 3 : 0); };
  var best = null, bestCost = 1e9;
  for (var trial = 0; trial < 300 && bestCost > 0; trial++) {
    var order = items.slice(); for (var a = order.length - 1; a > 0; a--) { var j = Math.floor(Math.random() * (a + 1)), t = order[a]; order[a] = order[j]; order[j] = t; }
    order.sort(function (x, y) { return (y.newer ? 1 : 0) - (x.newer ? 1 : 0); });
    var T = sizes.map(function () { return []; });
    order.forEach(function (x) {
      var bi = -1, bc = 1e9;
      T.forEach(function (tb, ti) { if (tb.length >= sizes[ti]) return; var c = tb.reduce(function (s, o) { return s + pc(o, x); }, 0) + Math.random(); if (c < bc) { bc = c; bi = ti; } });
      T[bi].push(x);
    });
    var cost = T.reduce(function (s, tb) { return s + tb.reduce(function (s2, x, xi) { return s2 + tb.slice(xi + 1).reduce(function (s3, y) { return s3 + pc(x, y); }, 0); }, 0); }, 0);
    if (cost < bestCost) { bestCost = cost; best = T; }
  }
  var repeats = best.reduce(function (s, tb) { return s + tb.reduce(function (s2, x, xi) { return s2 + tb.slice(xi + 1).filter(function (y) { return pairs[x.k + '|' + y.k]; }).length; }, 0); }, 0);
  var rows = [];
  best.forEach(function (tb, gi) {
    tb.sort(function (x, y) { return ((hosted[x.k] ? 1 : 0) - (hosted[y.k] ? 1 : 0)) || ((x.newer ? 1 : 0) - (y.newer ? 1 : 0)) || (Math.random() - 0.5); });
    tb.forEach(function (x, hi) {
      var mine = dates.filter(function (d, di) { return di % tb.length === hi; });
      rows.push({ Kind: 'Dinner group', Organization: dinnerOrg_(), Group: 'Group ' + (gi + 1), Person: x.name, Role: 'Member', Period: name,
        Notes: 'Host ' + (hi + 1) + (mine.length ? ': ' + mine.join(', ') : '') + (x.newer ? ' · Newer to ward' : '') });
    });
  });
  cmDelete_('Groups', dinnerAll_().filter(function (x) { return dinnerIsGroup_(x) && x.Period === name; }).map(function (x) { return x.ID; }));
  cmAppend_('Groups', rows);
  cmSetting_(me, 'dinner_season', JSON.stringify({ name: name, size: size, dates: dates, prev: prev, made: ymd_(today_()), by: me.name }));
  log_(me.name, 'dinner groups', 'Groups', name, best.length + ' groups, ' + N + ' households' + (repeats ? ', ' + repeats + ' repeat pairs' : ''));
  return { groups: best.length, households: N, repeats: repeats, prev: prev };
};
/* Move one household to another group (0 = a new group). They host last in their new group. */
ACTIONS.dinnerMove = function (req, me) {
  needDinner_(me);
  var cfg = dinnerCfg_(), r = dinnerAll_().filter(function (x) { return x.ID === req.id && dinnerIsGroup_(x) && x.Period === cfg.name; })[0]; if (!r) throw new Error('Not found');
  var season = dinnerSeason_(cfg.name), n = Math.floor(+req.group || 0);
  if (!n) n = season.reduce(function (m, gr) { return Math.max(m, dinnerNum_(gr.name)); }, 0) + 1;
  var target = season.filter(function (gr) { return dinnerNum_(gr.name) === n; })[0], hostN = target ? target.rows.length + 1 : 1;
  save_(me, 'Groups', { ID: r.ID, Group: 'Group ' + n, Notes: 'Host ' + hostN + (dinnerNewer_(r) ? ' · Newer to ward' : '') }, { system: true });
  return {};
};


/* ================= Extras 2 (from v1): tithing declaration list, ministering interviews, away dates, feedback for the bishop,
   stake page, substitute requests, checklists, Church News, youth class agendas, ward conference visits ================= */

/* ---------- shared helpers ---------- */
function x2Id_(pre) { return pre + Utilities.getUuid().replace(/-/g, '').slice(0, 8).toUpperCase(); }
function x2IsBishop_(me) { return (me.callings || []).some(function (c) { return /^Bishop$/i.test(String(c)); }); }
function x2BishopName_() {
  var b = ''; rows_('Callings').some(function (c) { if (/^Bishop$/i.test(c.Calling) && !/Released|Proposed|Open/.test(c.Status) && c.Person) { b = c.Person; return true; } return false; });
  return b || setting_('bishop');
}
/* This person's callings in one organization (serving). */
function x2MyCallings_(me, org) {
  var k = nkey_(me.name);
  return rows_('Callings').filter(function (c) { return nkey_(c.Person) === k && c.Organization === org && !/Released|Proposed|Open/.test(c.Status); }).map(function (c) { return String(c.Calling); });
}
/* The organization's own presidency ("Relief Society First Counselor"), not a class or quorum presidency inside it. */
function x2PresCalling_(org, cal) { return new RegExp('^' + org + ' (President|First Counselor|Second Counselor|Counselor)$', 'i').test(String(cal).trim()); }
function x2Presidency_(me, org) { return x2MyCallings_(me, org).some(function (c) { return x2PresCalling_(org, c); }); }
function x2People_() { var by = {}; rows_('People').forEach(function (p) { if (p.Source !== 'Moved out') by[nkey_(p.Name)] = p; }); return by; }
function x2Adult_(p) { var a = p ? age_(p['Birth date']) : null; return a === null || a >= 18; }
function x2Phone_(p) { return p && p.Phone && p["Don't text"] !== true && x2Adult_(p) ? String(p.Phone) : ''; }
/* Text typed on a public page: never a spreadsheet formula. */
function x2Safe_(s, n) { s = String(s == null ? '' : s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, n || 500); return /^[=+\-@]/.test(s) ? "'" + s : s; }
/* A daily allowance for public pages, so no one can flood the sheet. */
function x2Rate_(name, max) {
  var c = CacheService.getScriptCache(), k = 'x2rate:' + name + ':' + ymd_(today_()), n = +(c.get(k) || 0);
  if (n >= max) throw new Error('That is a lot for one day. Please try again tomorrow, or contact the executive secretary.');
  c.put(k, String(n + 1), 21600);
}
function x2Del_(tab, id) {
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try { var cur = rows_(tab).filter(function (r) { return String(r.ID) === String(id); })[0]; if (!cur) return false; sheet_(tab).deleteRow(cur._r); bump_(tab); return true; }
  finally { lock.releaseLock(); }
}
function x2Ymd_(s) { return /^\d{4}-\d\d-\d\d$/.test(String(s || '')) ? String(s) : ''; }

/* =====================================================================================================
   1. Tithing declaration: which households booked or declared this year, and who hasn't been scheduled.
   Booking uses the Appointments tab (Open booking times › For: Tithing) and the public book.html page. */
function x2IsTithe_(a) { return /tithing/i.test(String(a.Source || '') + ' ' + String(a.Purpose || '')); }
function x2Households_() {
  var H = {}, byName = {};
  rows_('People').forEach(function (p) {
    if (p.Source === 'Moved out' || !p.Name) return;
    var key = String(p.Household || p.Name).trim();
    var h = H[key] = H[key] || { key: key, adults: [], kids: 0, phones: [] };
    if (x2Adult_(p)) { h.adults.push(p.Name); var ph = x2Phone_(p); if (ph) h.phones.push(ph); } else h.kids++;
    byName[nkey_(p.Name)] = key;
  });
  return { H: H, byName: byName };
}
ACTIONS.tithingList = function (req, me) {
  if (!me.roles.admin) throw new Error('Tithing declaration is for the bishop and executive secretary.');
  var year = /^\d{4}$/.test(String(req.year || '')) ? String(req.year) : String(today_().getFullYear()), tY = ymd_(today_());
  var X = x2Households_(), H = X.H, unmatched = [];
  var bySurname = {}; Object.keys(H).forEach(function (k) { var s = nkey_(k.split(/[,\s]/)[0]); (bySurname[s] = bySurname[s] || []).push(k); });
  var rank = { done: 3, booked: 2, noshow: 1 };
  rows_('Appointments').forEach(function (a) {
    if (!x2IsTithe_(a) || String(a.Date).slice(0, 4) !== year || !a.Person || /Open|Cancelled/.test(a.Status)) return;
    var m = String(a.Notes || '').match(/^Household: (.+)$/), key = m && H[m[1]] ? m[1] : X.byName[nkey_(a.Person)];
    if (!key) { var last = nkey_(String(a.Person).trim().split(/\s+/).pop()), c = bySurname[last] || []; if (c.length === 1) key = c[0]; }
    var st = a.Status === 'Done' ? 'done' : a.Status === 'No-show' ? 'noshow' : 'booked';
    if (!key || !H[key]) { unmatched.push({ id: a.ID, person: a.Person, date: a.Date, time: a.Time, state: st }); return; }
    var h = H[key];
    if (!h.state || rank[st] > rank[h.state] || (st === h.state && a.Date > h.date)) { h.state = st; h.date = a.Date; h.time = a.Time; h.with = a.With; h.apptId = a.ID; h.marked = a.Source === 'Tithing (marked)'; }
  });
  var list = Object.keys(H).map(function (k) { var h = H[k]; return { key: k, adults: h.adults, kids: h.kids, phones: h.phones, state: h.state || 'none', date: h.date || '', time: h.time || '', with: h.with || '', apptId: h.apptId || '', marked: !!h.marked }; })
    .filter(function (h) { return h.adults.length; })
    .sort(function (a, b) { return a.key.localeCompare(b.key); });
  var count = function (s) { return list.filter(function (h) { return h.state === s; }).length; };
  var open = rows_('Appointments').filter(function (a) { return x2IsTithe_(a) && a.Status === 'Open' && a.Date >= tY; }).length;
  return { year: year, households: list, unmatched: unmatched, counts: { done: count('done'), booked: count('booked'), none: count('none') + count('noshow'), total: list.length }, openTimes: open, bishop: x2BishopName_(), ward: setting_('ward_name') };
};
/* Declared another way (in the hall, by letter): mark the household done, or undo. */
ACTIONS.tithingMark = function (req, me) {
  if (!me.roles.admin) throw new Error('Tithing declaration is for the bishop and executive secretary.');
  var X = x2Households_(), h = X.H[String(req.household || '')]; if (!h) throw new Error('Household not found.');
  var year = String(today_().getFullYear()), tag = 'Household: ' + h.key;
  if (req.done === false) {
    rows_('Appointments').filter(function (a) { return a.Source === 'Tithing (marked)' && a.Notes === tag && String(a.Date).slice(0, 4) === year; }).forEach(function (a) { x2Del_('Appointments', a.ID); });
    log_(me.name, 'tithing undo', 'Appointments', '', h.key);
    return {};
  }
  var id = save_(me, 'Appointments', { ID: x2Id_('AP'), Date: ymd_(today_()), Time: '', Minutes: '', With: 'Bishop', Person: h.adults[0], Purpose: 'Tithing declaration', Status: 'Done', Source: 'Tithing (marked)', Notes: tag }, { system: true });
  return { id: id };
};

/* =====================================================================================================
   2. Ministering interviews: each quarter, the elders quorum and Relief Society presidencies see who has had one.
   Ministers: the organization's Groups with Kind "Ministering" (built in the app); for elders quorum, the zones until then. */
var X2_MIN_ORGS = ['Elders Quorum', 'Relief Society'];
function x2MinCan_(me, org) { return X2_MIN_ORGS.indexOf(org) >= 0 && (isBishopric_(me) || me.orgs.indexOf(org) >= 0); }
function x2MinNotes_(me, org) { return x2IsBishop_(me) || x2Presidency_(me, org); }
function x2Quarter_(ymd) { var y = String(ymd).slice(0, 4), m = +String(ymd).slice(5, 7); return y + '-Q' + (Math.floor((m - 1) / 3) + 1); }
function x2QuarterName_(q) { var m = String(q).match(/^(\d{4})-Q(\d)$/); return m ? ['January–March', 'April–June', 'July–September', 'October–December'][+m[2] - 1] + ' ' + m[1] : q; }
function x2Ministers_(org) {
  var G = rows_('Groups'), kind = 'Ministering', list = G.filter(function (g) { return g.Kind === 'Ministering' && g.Organization === org; });
  if (!list.length && org === 'Elders Quorum') { kind = 'Zone'; list = G.filter(function (g) { return g.Kind === 'Zone' && g.Organization === org; }); }
  return { kind: kind, list: list };
}
ACTIONS.ministering = function (req, me) {
  var orgs = X2_MIN_ORGS.filter(function (o) { return x2MinCan_(me, o); });
  if (!orgs.length) throw new Error('Ministering interviews are for the elders quorum and Relief Society presidencies.');
  var org = orgs.indexOf(req.org) >= 0 ? req.org : orgs[0], tY = ymd_(today_()), q = x2Quarter_(tY), notes = x2MinNotes_(me, org);
  var M = x2Ministers_(org), ppl = x2People_(), seen = {};
  var hist = rows_('Ministering Interviews').filter(function (r) { return r.Organization === org; });
  var ministers = M.list.filter(function (g) { var p = ppl[nkey_(g.Person)]; if (seen[nkey_(g.Person)] || (p && !x2Adult_(p))) return false; seen[nkey_(g.Person)] = 1; return true; }).map(function (g) {
    var mine = hist.filter(function (r) { return nkey_(r.Minister) === nkey_(g.Person); }).sort(function (a, b) { return String(b.Date).localeCompare(String(a.Date)); });
    var last = mine[0] || null, done = mine.filter(function (r) { return x2Quarter_(r.Date) === q; })[0] || null;
    return { name: g.Person, group: g.Group, role: g.Role, phone: x2Phone_(ppl[nkey_(g.Person)]), last: last ? last.Date : '', by: last ? last.By : '', done: !!done, doneId: done ? done.ID : '',
      note: notes && last ? last.Note : '', count: mine.length };
  }).sort(function (a, b) { return String(a.group).localeCompare(String(b.group)) || a.name.localeCompare(b.name); });
  return { orgs: orgs, org: org, kind: M.kind, quarter: q, quarterName: x2QuarterName_(q), ministers: ministers, canNotes: notes,
    counts: { done: ministers.filter(function (m) { return m.done; }).length, total: ministers.length } };
};
ACTIONS.ministerMark = function (req, me) {
  var org = String(req.org || ''); if (!x2MinCan_(me, org)) throw new Error('Only that presidency can mark interviews.');
  if (req.undo) {
    var r = rows_('Ministering Interviews').filter(function (x) { return x.ID === req.id && x.Organization === org; })[0]; if (!r) throw new Error('Not found');
    x2Del_('Ministering Interviews', r.ID); log_(me.name, 'interview undo', 'Ministering Interviews', r.ID, org); return {};
  }
  var name = String(req.name || '').trim(); if (!name) throw new Error('Who was interviewed?');
  var d = x2Ymd_(req.date) || ymd_(today_()); if (d > ymd_(today_())) throw new Error('Pick the day it happened.');
  var id = save_(null, 'Ministering Interviews', { ID: x2Id_('MI'), Organization: org, Minister: name.slice(0, 120), Date: d, By: me.name, Note: String(req.note || '').slice(0, 300) }, { system: true, quiet: true });
  log_(me.name, 'interview', 'Ministering Interviews', id, org);
  return { id: id };
};
/* Build the ministering list in the app: add someone to a district or companionship, or take them off. */
ACTIONS.ministerGroup = function (req, me) {
  var org = String(req.org || ''); if (!x2MinCan_(me, org)) throw new Error('Only that presidency changes the list.');
  var name = String(req.person || '').trim(), grp = String(req.group || '').trim().slice(0, 60);
  var cur = rows_('Groups').filter(function (g) { return g.Kind === 'Ministering' && g.Organization === org && nkey_(g.Person) === nkey_(name); })[0];
  if (req.remove) { if (cur) x2Del_('Groups', cur.ID); clearWho_(); return {}; }
  if (!name || !grp) throw new Error('Add a name and a district or companionship.');
  save_(null, 'Groups', { ID: cur ? cur.ID : x2Id_('G'), Kind: 'Ministering', Organization: org, Group: grp, Person: name, Role: 'Member' }, { system: true });
  return {};
};

/* =====================================================================================================
   3. Away dates: the bishopric, musicians and leaders mark days they'll be away; Sunday planning warns. */
function x2CanAway_(me) { return isBishopric_(me) || me.roles.music || me.roles.leader || me.roles.clerk; }
ACTIONS.awayList = function (req, me) {
  if (!x2CanAway_(me)) throw new Error('Away dates are for leaders and musicians.');
  var tY = ymd_(today_()), k = nkey_(me.name);
  return { list: rows_('Away').filter(function (a) { return (a.To || a.From) >= tY; }).map(strip_).map(function (a) { a.mine = nkey_(a.Person) === k; return a; })
    .sort(function (a, b) { return String(a.From).localeCompare(String(b.From)); }), canAll: isBishopric_(me) };
};
ACTIONS.awaySave = function (req, me) {
  if (!x2CanAway_(me)) throw new Error('Away dates are for leaders and musicians.');
  var from = x2Ymd_(req.from), to = x2Ymd_(req.to) || from, who = isBishopric_(me) && req.person ? String(req.person).trim() : me.name;
  if (!from || to < from) throw new Error('Pick the first and last day you\'ll be away.');
  if (to > ymd_(addDays_(today_(), 730))) throw new Error('Pick dates within the next two years.');
  var row = { Person: who.slice(0, 80), From: from, To: to, Note: String(req.note || '').slice(0, 120), Added: ymd_(today_()) };
  if (req.id) { var cur = rows_('Away').filter(function (a) { return a.ID === req.id; })[0]; if (!cur) throw new Error('Not found'); if (nkey_(cur.Person) !== nkey_(me.name) && !isBishopric_(me)) throw new Error('Only that person or the bishopric can change this.'); row.ID = cur.ID; }
  else row.ID = x2Id_('AW');
  return { id: save_(me, 'Away', row, { system: true }) };
};
ACTIONS.awayRemove = function (req, me) {
  var cur = rows_('Away').filter(function (a) { return a.ID === req.id; })[0]; if (!cur) throw new Error('Not found');
  if (nkey_(cur.Person) !== nkey_(me.name) && !isBishopric_(me)) throw new Error('Only that person or the bishopric can remove this.');
  x2Del_('Away', cur.ID); log_(me.name, 'delete', 'Away', cur.ID, cur.Person); return {};
};
function x2AwayOn_(d) { return rows_('Away').filter(function (a) { return a.From && a.From <= d && (a.To || a.From) >= d; }); }
/* For the Sunday screen: who is away that day, and anyone assigned who is away. */
ACTIONS.awayFor = function (req, me) {
  if (!(isBishopric_(me) || me.roles.music || me.roles.clerk)) throw new Error('Sunday planning is for the bishopric.');
  var d = x2Ymd_(req.date) || ymd_(nextSunday_()), away = x2AwayOn_(d), by = {};
  away.forEach(function (a) { by[nkey_(a.Person)] = a; });
  var warn = [], add = function (who, what) { var a = by[nkey_(who)]; if (who && a) warn.push({ person: a.Person, role: what, text: a.Person + ' (' + what.toLowerCase() + ') will be away' + (a.Note ? ': ' + a.Note : '') + '.' }); };
  var S = rows_('Sundays').filter(function (s) { return s.Date === d; })[0];
  if (S) { add(S.Conducting, 'Conducting'); add(S.Organist, 'Organist'); add(S.Chorister, 'Chorister'); }
  rows_('Participants').forEach(function (p) { if (p.Date === d && p.Status !== 'Declined') add(p.Person, p.Role || 'On the program'); });
  rows_('Teaching').forEach(function (t) { if (t.Date !== d || !t.Teacher) return; away.forEach(function (a) { if (teaches_(t.Teacher, a.Person)) warn.push({ person: a.Person, role: 'Teaching', text: a.Person + ' teaches ' + (t.Class || t.Organization) + ' but will be away.' }); }); });
  var bish = rows_('Callings').filter(function (c) { return /^(Bishop|Bishopric .*Counselor)$/i.test(c.Calling) && c.Organization === 'Bishopric' && !/Released|Proposed|Open/.test(c.Status); }).map(function (c) { return c.Person; });
  var gone = bish.filter(function (n) { return by[nkey_(n)]; });
  if (gone.length && bish.length - gone.length < 2) warn.push({ person: '', role: 'Bishopric', text: 'Only ' + (bish.length - gone.length) + ' of the bishopric will be here (away: ' + gone.join(', ') + ').' });
  return { date: d, away: away.map(function (a) { return { person: a.Person, from: a.From, to: a.To, note: a.Note }; }), warnings: warn };
};

/* =====================================================================================================
   4. Feedback: a public page (anonymous or with a name). Only the bishop sees it. */
PUBLIC_ACTIONS.feedbackSend = 1;
ACTIONS.feedbackSend = function (req) {
  if (/^no$/i.test(setting_('feedback_page') || 'Yes')) return { ok: false, error: 'Feedback is turned off right now.' };
  var text = String(req.text || '').trim(); if (text.length < 3) return { ok: false, error: 'Please type your feedback.' };
  if (req.website) return { sent: true }; // a hidden field only robots fill in
  x2Rate_('feedback', 60);
  var id = save_(null, 'Feedback', { ID: x2Id_('FB'), When: Utilities.formatDate(new Date(), tz_(), "yyyy-MM-dd'T'HH:mm"), From: x2Safe_(req.name, 80), Contact: x2Safe_(req.contact, 120), Text: x2Safe_(text, 3000), Status: 'New' }, { system: true, quiet: true });
  log_('Public', 'feedback', 'Feedback', id, '');
  try {
    var b = x2BishopName_(), e = b ? emailOf_(b) : '';
    if (e) sendMail_({ job: 'Feedback', to: e, name: b, subject: 'New feedback for the bishop', tag: 'fb:' + id,
      html: mailWrap_('New feedback', '<p>' + escH_(req.name ? 'From ' + String(req.name).slice(0, 80) : 'Anonymous') + (req.contact ? ' · ' + escH_(String(req.contact).slice(0, 120)) : '') + '</p><blockquote style="border-left:3px solid #A8834A;margin:0;padding-left:12px">' + escH_(text.slice(0, 3000)).replace(/\n/g, '<br>') + '</blockquote>' + openHub_()) });
  } catch (err) {}
  return { sent: true, ward: setting_('ward_name') };
};
function x2NeedBishop_(me) { if (!x2IsBishop_(me)) throw new Error('Feedback is for the bishop only.'); }
ACTIONS.feedbackList = function (req, me) {
  x2NeedBishop_(me);
  return { list: rows_('Feedback').map(strip_).sort(function (a, b) { return String(b.When).localeCompare(String(a.When)); }).slice(0, 200) };
};
ACTIONS.feedbackSet = function (req, me) {
  x2NeedBishop_(me);
  var cur = rows_('Feedback').filter(function (f) { return f.ID === req.id; })[0]; if (!cur) throw new Error('Not found');
  if (req.remove) { x2Del_('Feedback', cur.ID); return {}; }
  var row = { ID: cur.ID }; if (/^(New|Read|Done)$/.test(req.status || '')) row.Status = req.status; if (req.notes != null) row.Notes = String(req.notes).slice(0, 1000);
  save_(null, 'Feedback', row, { system: true, quiet: true }); return {};
};

/* =====================================================================================================
   5. Stake page: public stake.html with stake leaders, links and upcoming public stake events. */
PUBLIC_ACTIONS.stakeInfo = 1;
function x2Lines_(s) { return String(s || '').replace(/\r/g, '').split(/\n|;\s*(?=\S)/).map(function (l) { return l.trim(); }).filter(Boolean); }
function x2StakeLeaders_() {
  var out = [];
  x2Lines_(setting_('stake_leaders')).forEach(function (l) { var m = l.match(/^([^:]+):\s*(.+)$/); if (m) out.push({ role: m[1].trim(), name: m[2].trim() }); else out.push({ role: '', name: l }); });
  if (!out.length) {
    String(setting_('stake_presidency') || '').split(/\s*,\s*/).filter(Boolean).forEach(function (n, i) { out.push({ role: ['Stake President', 'First Counselor', 'Second Counselor'][i] || 'Stake presidency', name: n }); });
    if (setting_('high_council')) out.push({ role: 'High councilor for our ward', name: setting_('high_council') });
  }
  return out.map(function (x) { return { role: x.role.slice(0, 60), name: x.name.replace(/[\d()+\-.\s]{7,}/g, ' ').trim().slice(0, 80) }; });
}
function x2StakeLinks_() {
  return x2Lines_(setting_('stake_links')).map(function (l) {
    var m = l.match(/^(.*?)\s*\|\s*(https:\/\/\S+)$/) || l.match(/^()(https:\/\/\S+)$/);
    return m ? { title: (m[1] || m[2].replace(/^https:\/\/(www\.)?/, '').split('/')[0]).slice(0, 80), url: m[2].slice(0, 400) } : null;
  }).filter(Boolean);
}
ACTIONS.stakeInfo = function () {
  if (/^no$/i.test(setting_('stake_page') || 'Yes')) return { off: true, ward: setting_('ward_name') };
  var from = ymd_(today_()), to = ymd_(addDays_(today_(), 120));
  return { ward: setting_('ward_name'), stake: setting_('stake_name'), leaders: x2StakeLeaders_(), links: x2StakeLinks_(),
    events: occurrences_(null, from, to).filter(function (e) { return e.org === 'Stake'; }).slice(0, 40).map(function (e) { return { date: e.date, end: e.end, time: e.time, endTime: e.endTime, title: e.title, place: e.place }; }) };
};
var X2_STAKE_KEYS = { stake_leaders: 1, stake_links: 1, stake_page: 1 };
ACTIONS.stakeSettings = function (req, me) {
  if (!isBishopric_(me)) throw new Error('The stake page is set up by the bishopric.');
  if (req.save) {
    var defs = {}; SCHEMA.settings.forEach(function (s) { defs[s[0]] = s; });
    Object.keys(X2_STAKE_KEYS).forEach(function (k) {
      if (req.save[k] == null) return;
      var v = String(req.save[k]).slice(0, 3000); if (k === 'stake_page') v = /^no$/i.test(v) || v === 'false' ? 'No' : 'Yes';
      var d = defs[k] || [k, 'Stake', k, '', ''], have = rows_('Settings').some(function (r) { return r.Key === k; });
      save_(null, 'Settings', have ? { Key: k, Value: v } : { Key: k, Section: d[1], Setting: d[2], Value: v, Help: d[4] }, { system: true, quiet: true });
    });
    SET_CACHE_ = null; log_(me.name, 'stake page', 'Settings', '', '');
  }
  return { leaders: setting_('stake_leaders'), links: setting_('stake_links'), page: !/^no$/i.test(setting_('stake_page') || 'Yes'), preview: ACTIONS.stakeInfo() };
};

/* =====================================================================================================
   6. Substitute teacher request: public sub.html?c=<class>. The presidency sees it on Today and texts from the app. */
PUBLIC_ACTIONS.subInfo = 1; PUBLIC_ACTIONS.subRequest = 1;
function x2Class_(c, o) {
  var k = nkey_(c), hit = null;
  rows_('Groups').some(function (g) { if ((g.Kind === 'Class' || g.Kind === 'Quorum') && nkey_(g.Group) === k && (!o || g.Organization === o)) { hit = { org: g.Organization, cls: g.Group }; return true; } return false; });
  return k ? hit : null;
}
function x2Sundays_(n) { var out = [], d = nextSunday_(); for (var i = 0; i < n; i++) out.push(ymd_(addDays_(d, 7 * i))); return out; }
ACTIONS.subInfo = function (req) {
  if (/^no$/i.test(setting_('sub_page') || 'Yes')) return { off: true };
  var c = x2Class_(req.c, req.o); if (!c) return { ok: false, error: 'That class wasn\'t found. Ask your presidency for the right link.' };
  var T = rows_('Teaching').filter(function (t) { return t.Organization === c.org && nkey_(t.Class) === nkey_(c.cls); });
  return { ward: setting_('ward_name'), cls: c.cls, org: c.org, sundays: x2Sundays_(6).map(function (d) { var t = T.filter(function (x) { return x.Date === d; })[0]; return { date: d, lesson: t ? String(t.Lesson || '').slice(0, 120) : '' }; }) };
};
ACTIONS.subRequest = function (req) {
  if (/^no$/i.test(setting_('sub_page') || 'Yes')) return { ok: false, error: 'Online requests are turned off. Please text your presidency.' };
  if (req.website) return { sent: true };
  var c = x2Class_(req.c, req.o); if (!c) return { ok: false, error: 'That class wasn\'t found. Ask your presidency for the right link.' };
  var d = x2Ymd_(req.date), name = String(req.name || '').trim();
  if (!d || d < ymd_(today_()) || d > ymd_(addDays_(today_(), 180))) return { ok: false, error: 'Pick the Sunday you need a substitute.' };
  if (name.length < 3) return { ok: false, error: 'Please type your name.' };
  x2Rate_('sub', 40);
  var dup = rows_('Substitutes').filter(function (s) { return s.Organization === c.org && s.Class === c.cls && s.Date === d && s.Status === 'Asked' && nkey_(s.Teacher) === nkey_(name); })[0];
  if (dup) return { sent: true, again: true };
  var id = x2Id_('SB'), nice = Utilities.formatDate(parseYmd_(d), tz_(), 'EEE, MMM d');
  var tid = save_(null, 'Tasks', { ID: x2Id_('T'), Task: 'Find a substitute for ' + c.cls + ' on ' + nice + ' (' + x2Safe_(name, 60).replace(/^'/, '') + ' asked)', Owner: x2PresOwner_(c.org), Organization: c.org, Due: d, Status: 'Not started', Source: 'Substitute ' + id, Created: ymd_(today_()), Notes: 'More › Substitute requests' }, { system: true, quiet: true });
  save_(null, 'Substitutes', { ID: id, Organization: c.org, Class: c.cls, Date: d, Teacher: x2Safe_(name, 80), Phone: x2Safe_(req.phone, 30), Note: x2Safe_(req.note, 300), Status: 'Asked', Task: tid, Created: Utilities.formatDate(new Date(), tz_(), "yyyy-MM-dd'T'HH:mm") }, { system: true, quiet: true });
  log_('Public', 'substitute', 'Substitutes', id, c.org + ' · ' + c.cls);
  return { sent: true };
};
/* Whose Today list a substitute request lands on: the organization's president (by calling, so it follows releases). */
function x2PresOwner_(org) {
  var has = rows_('Callings').some(function (c) { return c.Organization === org && new RegExp('^' + org + ' President$', 'i').test(c.Calling) && !/Released|Proposed|Open/.test(c.Status); });
  return has ? org + ' President' : (org === 'Young Men' ? 'Bishop' : org + ' President');
}
function x2SubOrgs_(me) { return isBishopric_(me) ? ['Primary', 'Sunday School', 'Young Women', 'Young Men', 'Relief Society', 'Elders Quorum'] : me.orgs.slice(); }
ACTIONS.subs = function (req, me) {
  if (!(isBishopric_(me) || me.roles.leader)) throw new Error('Substitute requests are for presidencies.');
  var orgs = x2SubOrgs_(me), from = ymd_(addDays_(today_(), -14)), ppl = x2People_();
  var list = rows_('Substitutes').filter(function (s) { return orgs.indexOf(s.Organization) >= 0 && s.Date >= from; }).map(strip_).sort(function (a, b) { return String(a.Date).localeCompare(String(b.Date)); })
    .map(function (s) { var p = ppl[nkey_(s.Teacher)]; s.phone = s.Phone || x2Phone_(p); return s; });
  var C = rows_('Callings').filter(function (c) { return !/Released|Proposed|Open/.test(c.Status); }), G = rows_('Groups');
  var info = {};
  orgs.forEach(function (o) {
    var pres = C.filter(function (c) { return c.Organization === o && (x2PresCalling_(o, c.Calling) || new RegExp('^' + o + ' Secretary$', 'i').test(c.Calling)) && nkey_(c.Person) !== nkey_(me.name); })
      .map(function (c) { var p = ppl[nkey_(c.Person)]; return { n: c.Person, p: x2Phone_(p) }; }).filter(function (x) { return x.p; });
    var seen = {}, teachers = G.filter(function (g) { return g.Organization === o && g.Role === 'Teacher'; }).map(function (g) { var p = ppl[nkey_(g.Person)]; if (!p || seen[p.Name]) return null; seen[p.Name] = 1; return { n: p.Name, p: x2Phone_(p), cls: g.Group }; }).filter(function (x) { return x && x.p; });
    var classes = {}; G.forEach(function (g) { if (g.Organization === o && (g.Kind === 'Class' || g.Kind === 'Quorum')) classes[g.Group] = 1; });
    info[o] = { presidency: pres, teachers: teachers.sort(function (a, b) { return a.n.localeCompare(b.n); }), classes: Object.keys(classes).sort() };
  });
  return { list: list, orgs: orgs, info: info };
};
ACTIONS.subSet = function (req, me) {
  var s = rows_('Substitutes').filter(function (x) { return x.ID === req.id; })[0]; if (!s) throw new Error('Not found');
  if (!(isBishopric_(me) || me.orgs.indexOf(s.Organization) >= 0)) throw new Error('That belongs to another organization.');
  var st = /^(Asked|Found|Cancelled)$/.test(req.status || '') ? req.status : 'Found', sub = String(req.substitute || '').trim().slice(0, 80);
  if (st === 'Found' && !sub) throw new Error('Who will teach?');
  save_(me, 'Substitutes', { ID: s.ID, Status: st, Substitute: st === 'Found' ? sub : '' }, { system: true });
  if (s.Task) save_(null, 'Tasks', { ID: s.Task, Status: st === 'Asked' ? 'Not started' : 'Done', 'Done on': st === 'Asked' ? '' : ymd_(today_()) }, { system: true, quiet: true });
  var changed = 0;
  if (st === 'Found') rows_('Teaching').forEach(function (t) {
    if (t.Date !== s.Date || t.Organization !== s.Organization || nkey_(t.Class) !== nkey_(s.Class)) return;
    save_(null, 'Teaching', { ID: t.ID, Teacher: sub, Reminded: '' }, { system: true, quiet: true }); changed++;
  });
  return { teaching: changed };
};

/* =====================================================================================================
   7. Checklists (move-in welcome, temple preparation, new convert, mission preparation…): start one for a person and tick steps. */
var X2_CK_DEFAULTS = [
  ['Move-in welcome', 'Bishopric', 'Records requested or arrived (clerk)\nWelcome visit from the bishopric\nMinistering brothers and sisters assigned\nIntroduced to their organizations\nA calling considered'],
  ['Temple preparation', 'Bishopric', 'Interview with the bishop to start preparing\nTemple preparation class (Endowed from on High)\nRecommend interview with a member of the bishopric\nInterview with the stake presidency\nTemple date set\nClothing and an escort arranged\nTemple visit'],
  ['New convert', 'Ward Mission', 'Baptism and confirmation recorded (clerk)\nMinistering brothers and sisters assigned\nNew member lessons with the missionaries\nA friend in the ward named\nFamily history started\nReceived a calling\nAaronic Priesthood or temple recommend for baptisms'],
  ['Mission preparation', 'Bishopric', 'Interview with the bishop\nMedical and dental exams\nOnline application completed\nBishop\'s recommendation submitted\nInterview with the stake president\nCall received\nTemple endowment\nFarewell talk scheduled\nSet apart'],
  ['Aaronic Priesthood ordination', 'Bishopric', 'Interview\nSustained in sacrament meeting\nOrdained\nRecorded (clerk)']
];
function x2CkSeed_() {
  var p = PropertiesService.getScriptProperties();
  if (rows_('Checklist Templates').length || p.getProperty('X2_CK_SEEDED')) return;
  X2_CK_DEFAULTS.forEach(function (t) { save_(null, 'Checklist Templates', { ID: x2Id_('CT'), Name: t[0], Organization: t[1], Steps: t[2], Notes: 'Starter' }, { system: true, quiet: true }); });
  p.setProperty('X2_CK_SEEDED', '1');
}
function x2CkCan_(me, org) { return isBishopric_(me) || (org && org !== 'Bishopric' && me.orgs.indexOf(org) >= 0); }
function x2CkSteps_(c) { var s = c.Steps; if (typeof s === 'string') { try { s = JSON.parse(s || '[]'); } catch (e) { s = []; } } return s || []; }
ACTIONS.checklists = function (req, me) {
  if (!(isBishopric_(me) || me.roles.leader)) throw new Error('Checklists are for the bishopric and organization leaders.');
  x2CkSeed_();
  var lists = rows_('Checklists').filter(function (c) { return x2CkCan_(me, c.Organization); }).map(function (c) {
    var o = strip_(c); o.Steps = x2CkSteps_(c); o.done = o.Steps.filter(function (s) { return s.on; }).length; o.total = o.Steps.length; return o;
  }).sort(function (a, b) { return ((a.Status === 'Done') - (b.Status === 'Done')) || String(a.Person).localeCompare(String(b.Person)); });
  var orgs = isBishopric_(me) ? ['Bishopric', 'Elders Quorum', 'Relief Society', 'Ward Mission', 'Young Women', 'Young Men', 'Primary', 'Temple & Family History'] : me.orgs.filter(function (o) { return o !== 'Bishopric'; });
  return { lists: lists, templates: rows_('Checklist Templates').map(strip_).map(function (t) { t.steps = String(t.Steps || '').split('\n').filter(function (x) { return x.trim(); }).length; return t; }), orgs: orgs, canTemplates: isBishopric_(me) };
};
ACTIONS.checklistStart = function (req, me) {
  var t = rows_('Checklist Templates').filter(function (x) { return x.ID === req.template; })[0]; if (!t) throw new Error('Pick a checklist.');
  var org = String(req.org || t.Organization || 'Bishopric'); if (!x2CkCan_(me, org)) throw new Error('Pick your own organization.');
  var person = String(req.person || '').trim().slice(0, 100); if (person.length < 2) throw new Error('Who is it for?');
  var steps = String(t.Steps || '').replace(/\r/g, '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean).map(function (s) { return { t: s.slice(0, 200), by: '', on: '' }; });
  return { id: save_(null, 'Checklists', { ID: x2Id_('CK'), Person: person, Checklist: t.Name, Organization: org, Steps: JSON.stringify(steps), 'Started by': me.name, Started: ymd_(today_()), Status: 'Open' }, { system: true }) };
};
function x2Ck_(me, id) { var c = rows_('Checklists').filter(function (x) { return x.ID === id; })[0]; if (!c || !x2CkCan_(me, c.Organization)) throw new Error('Not found'); return c; }
ACTIONS.checklistTick = function (req, me) {
  var c = x2Ck_(me, req.id), steps = x2CkSteps_(c), i = +req.i; if (!steps[i]) throw new Error('Not found');
  steps[i].on = req.done === false ? '' : ymd_(today_()); steps[i].by = req.done === false ? '' : me.name;
  var all = steps.every(function (s) { return s.on; });
  save_(null, 'Checklists', { ID: c.ID, Steps: JSON.stringify(steps), Status: all ? 'Done' : 'Open' }, { system: true, quiet: true });
  return { steps: steps, status: all ? 'Done' : 'Open' };
};
ACTIONS.checklistNote = function (req, me) { var c = x2Ck_(me, req.id); save_(null, 'Checklists', { ID: c.ID, Notes: String(req.notes || '').slice(0, 1000) }, { system: true, quiet: true }); return {}; };
ACTIONS.checklistRemove = function (req, me) { var c = x2Ck_(me, req.id); x2Del_('Checklists', c.ID); log_(me.name, 'delete', 'Checklists', c.ID, c.Checklist); return {}; };
ACTIONS.checklistTemplateSave = function (req, me) {
  if (!isBishopric_(me)) throw new Error('The bishopric changes the checklists.');
  if (req.remove) { x2Del_('Checklist Templates', req.id); return {}; }
  var r = req.row || {}; if (!String(r.Name || '').trim() || !String(r.Steps || '').trim()) throw new Error('Add a name and at least one step.');
  return { id: save_(me, 'Checklist Templates', { ID: r.ID || x2Id_('CT'), Name: String(r.Name).slice(0, 80), Organization: r.Organization || 'Bishopric', Steps: String(r.Steps).slice(0, 3000), Notes: r.Notes || '' }, { system: true }) };
};

/* =====================================================================================================
   8. Church News: headlines from the Church News feed (cached 6 hours). Links only, nothing copied. */
function x2NewsFetch_() {
  var url = setting_('church_news_feed') || 'https://www.thechurchnews.com/arc/outboundfeeds/rss/?outputType=xml';
  var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true });
  if (res.getResponseCode() >= 300) throw new Error('HTTP ' + res.getResponseCode());
  var xml = res.getContentText(), ent = function (t) {
    return String(t).replace(/&#(\d+);/g, function (m, n) { return String.fromCharCode(+n); }).replace(/&#x([0-9a-f]+);/gi, function (m, n) { return String.fromCharCode(parseInt(n, 16)); })
      .replace(/&amp;/g, '&').replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
  };
  var tag = function (blk, t) { var m = blk.match(new RegExp('<' + t + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + t + '>', 'i')); return m ? ent(m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '')).trim() : ''; };
  var out = [];
  (xml.match(/<(item|entry)[\s>][\s\S]*?<\/(item|entry)>/gi) || []).slice(0, 40).forEach(function (b) {
    var title = tag(b, 'title'), link = tag(b, 'link');
    if (!link) { var lm = b.match(/<link\b[^>]*href="([^"]+)"/i); link = lm ? ent(lm[1]) : ''; }
    link = link.replace(/^http:\/\//i, 'https://');
    var d = new Date(tag(b, 'pubDate') || tag(b, 'published') || tag(b, 'updated') || tag(b, 'dc:date'));
    if (!title || !/^https:\/\//i.test(link)) return;
    out.push({ title: title.slice(0, 160), link: link.slice(0, 400), at: isNaN(d) ? 0 : d.getTime() });
  });
  out.sort(function (a, b) { return b.at - a.at; });
  return out.slice(0, 15);
}
function x2News_() {
  var c = CacheService.getScriptCache(), hit = c.get('x2news');
  if (hit) { try { return JSON.parse(hit); } catch (e) {} }
  var p = PropertiesService.getScriptProperties(), items;
  try { items = x2NewsFetch_(); if (!items.length) throw new Error('empty'); p.setProperty('X2_NEWS', JSON.stringify(items)); }
  catch (e) { try { items = JSON.parse(p.getProperty('X2_NEWS') || '[]'); } catch (e2) { items = []; } log_('Hub', 'church news', '', '', String(e && e.message || e).slice(0, 120)); }
  try { c.put('x2news', JSON.stringify(items), 21600); } catch (e) {}
  return items;
}
/* This week's headlines (last 8 days), or the newest few when the week was quiet. */
function x2NewsWeek_(n) {
  var all = x2News_(), since = Date.now() - 8 * 864e5, wk = all.filter(function (x) { return x.at >= since; });
  return (wk.length >= Math.min(3, n) ? wk : all).slice(0, n).map(function (x) { return { title: x.title, link: x.link, date: x.at ? Utilities.formatDate(new Date(x.at), tz_(), 'MMM d') : '' }; });
}
/* For the Monday bishopric email (digestEmails_ in 80_more.gs): body += churchNewsHtml_(); */
function churchNewsHtml_() {
  var items = []; try { items = x2NewsWeek_(3); } catch (e) { items = []; }
  if (!items.length) return '';
  return h_('This week in Church News') + li_(items.map(function (x) { return '<a href="' + escH_(x.link) + '" style="color:#1F2A44">' + escH_(x.title) + '</a>'; }));
}
ACTIONS.churchNews = function (req, me) { return { items: x2NewsWeek_(10), feed: setting_('church_news_feed') }; };

/* =====================================================================================================
   9. Youth class agendas: each class or quorum presidency's Sunday agenda. Names only; no phone numbers. */
var X2_YORGS = ['Young Women', 'Young Men'];
function x2YouthClasses_(me) {
  var all = [], seen = {};
  rows_('Groups').forEach(function (g) { if (X2_YORGS.indexOf(g.Organization) >= 0 && (g.Kind === 'Class' || g.Kind === 'Quorum') && !seen[g.Organization + '|' + g.Group]) { seen[g.Organization + '|' + g.Group] = 1; all.push({ org: g.Organization, cls: g.Group }); } });
  all.sort(function (a, b) { return (a.org + a.cls).localeCompare(b.org + b.cls); });
  if (isBishopric_(me)) return all;
  var mine = {}, adult = x2Adult_(x2People_()[nkey_(me.name)]), k = nkey_(me.name);
  X2_YORGS.forEach(function (org) {
    x2MyCallings_(me, org).forEach(function (cal) {
      var ck = nkey_(cal), hit = all.filter(function (c) { return c.org === org && (ck.indexOf(nkey_(c.cls)) >= 0 || ck.indexOf(nkey_(c.cls.split(' ')[0])) === 0); });
      if (hit.length) hit.forEach(function (c) { mine[c.org + '|' + c.cls] = 1; });
      else if (adult) all.forEach(function (c) { if (c.org === org) mine[c.org + '|' + c.cls] = 1; });
    });
  });
  rows_('Groups').forEach(function (g) { if (g.Role === 'Teacher' && nkey_(g.Person) === k && X2_YORGS.indexOf(g.Organization) >= 0) mine[g.Organization + '|' + g.Group] = 1; });
  return all.filter(function (c) { return mine[c.org + '|' + c.cls]; });
}
var X2_YA_FIELDS = ['Conducting', 'Opening prayer', 'Spiritual thought', 'Business', 'Lesson', 'Introduces the lesson', 'Helps teach', 'Closing prayer', 'Notes'];
var X2_YA_TURNS = ['Conducting', 'Opening prayer', 'Introduces the lesson', 'Helps teach', 'Closing prayer'];
/* Turns: for a Sunday nobody has filled in, suggest who takes each part. Whoever has gone longest without a part goes first,
   and nobody repeats last week's part. Pool = the class members, or the names on earlier agendas. */
function x2Turns_(prevRows, names) {
  var pool = names.slice(), last = {}, lastRole = {};
  prevRows.forEach(function (a, i) { X2_YA_TURNS.forEach(function (k) { var n = String(a[k] || '').trim(); if (!n) return; if (pool.indexOf(n) < 0 && !names.length) pool.push(n); if (last[n] == null) { last[n] = i; lastRole[n] = i === 0 ? k : lastRole[n]; } }); });
  if (pool.length < 2) return null;
  var order = pool.slice().sort(function (a, b) { var x = last[a] == null ? 1e6 : last[a], y = last[b] == null ? 1e6 : last[b]; return y - x || pool.indexOf(a) - pool.indexOf(b); });
  var out = {}, used = {};
  X2_YA_TURNS.forEach(function (k) {
    var pick = order.filter(function (n) { return !used[n] && lastRole[n] !== k; })[0] || order.filter(function (n) { return !used[n]; })[0];
    if (pick) { out[k] = pick; used[pick] = 1; }
  });
  return out;
}
ACTIONS.youthAgendas = function (req, me) {
  var classes = x2YouthClasses_(me); if (!classes.length) throw new Error('Youth agendas are for youth class and quorum presidencies and their leaders.');
  var d = x2Ymd_(req.date) || ymd_(nextSunday_()), tY = ymd_(today_()), A = rows_('Youth Agendas'), G = rows_('Groups'), T = rows_('Teaching');
  return { date: d, classes: classes.map(function (c) {
    var a = A.filter(function (x) { return x.Date === d && x.Organization === c.org && x.Class === c.cls; })[0];
    var prev = A.filter(function (x) { return x.Date < d && x.Organization === c.org && x.Class === c.cls; }).sort(function (x, y) { return String(y.Date).localeCompare(String(x.Date)); })[0];
    var t = T.filter(function (x) { return x.Date === d && (x.Organization === c.org || x.Organization === 'Sunday School') && nkey_(x.Class) === nkey_(c.cls); })[0];
    var names = G.filter(function (g) { return g.Organization === c.org && g.Group === c.cls && g.Role === 'Member' && periodOk_(g.Period, tY); }).map(function (g) { return g.Person; }).sort();
    var row = a ? strip_(a) : { Date: d, Organization: c.org, Class: c.cls }, turns = null;
    if (!a && t && t.Lesson) row.Lesson = String(t.Lesson) + (t.Teacher ? ' (' + t.Teacher + ')' : '');
    if (!a) {
      var before = A.filter(function (x) { return x.Date < d && x.Organization === c.org && x.Class === c.cls; }).sort(function (x, y) { return String(y.Date).localeCompare(String(x.Date)); }).slice(0, 8);
      turns = x2Turns_(before, names); if (turns) Object.keys(turns).forEach(function (k) { row[k] = turns[k]; });
    }
    return { org: c.org, cls: c.cls, row: row, saved: !!a, suggested: !!turns, link: t && t.Link || '', names: names, lastBusiness: prev ? prev.Business || '' : '' };
  }), sundays: x2Sundays_(5) };
};
ACTIONS.youthAgendaSave = function (req, me) {
  var r = req.row || {}, c = x2YouthClasses_(me).filter(function (x) { return x.org === r.Organization && x.cls === r.Class; })[0];
  if (!c) throw new Error('Only that class\'s presidency and leaders can change this.');
  var d = x2Ymd_(r.Date); if (!d) throw new Error('Pick the Sunday.');
  var cur = rows_('Youth Agendas').filter(function (x) { return x.Date === d && x.Organization === c.org && x.Class === c.cls; })[0];
  var row = { ID: cur ? cur.ID : x2Id_('YA'), Date: d, Organization: c.org, Class: c.cls };
  X2_YA_FIELDS.forEach(function (k) { if (r[k] != null) row[k] = String(r[k]).replace(/(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g, '[phone]').slice(0, 1500); });
  return { id: save_(me, 'Youth Agendas', row, { system: true }) };
};

/* =====================================================================================================
   10. Ward conference visits: which stake leader visits which class or meeting. */
ACTIONS.visits = function (req, me) {
  if (!(isBishopric_(me) || me.roles.leader)) throw new Error('Ward conference visits are for leaders.');
  var tY = ymd_(today_()), wc = rows_('Sundays').filter(function (s) { return s.Type === 'Ward Conference' && s.Date >= tY; }).sort(function (a, b) { return a.Date.localeCompare(b.Date); })[0];
  var d = x2Ymd_(req.date) || (wc ? wc.Date : '');
  if (!d) { var last = rows_('Visits').filter(function (v) { return v.Date >= tY; }).sort(function (a, b) { return String(a.Date).localeCompare(String(b.Date)); })[0]; d = last ? last.Date : ymd_(nextSunday_()); }
  var list = visible_(me, 'Visits').filter(function (v) { return v.Date === d; }).sort(function (a, b) { return timeKey_(a.Time).localeCompare(timeKey_(b.Time)) || String(a.Meeting).localeCompare(String(b.Meeting)); });
  var classes = {}; rows_('Groups').forEach(function (g) { if (g.Kind === 'Class' || g.Kind === 'Quorum') classes[g.Organization + '|' + g.Group] = { org: g.Organization, meeting: g.Group }; });
  var meetings = [{ org: 'Ward', meeting: 'Sacrament meeting' }, { org: 'Relief Society', meeting: 'Relief Society' }, { org: 'Elders Quorum', meeting: 'Elders quorum' }, { org: 'Sunday School', meeting: 'Gospel Doctrine' },
    { org: 'Bishopric', meeting: 'Ward council' }, { org: 'Bishopric', meeting: 'Bishopric meeting' }, { org: 'Bishopric', meeting: 'Youth council' }, { org: 'Primary', meeting: 'Primary sharing time' }]
    .concat(Object.keys(classes).sort().map(function (k) { return classes[k]; }));
  return { date: d, wardConference: !!wc && wc.Date === d, list: list, meetings: meetings, canEdit: isBishopric_(me), stake: x2StakeLeaders_().map(function (x) { return x.name; }), ward: setting_('ward_name') };
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
  try { flagCrewsFromNotes_(); } catch (e) { log_('Hub', 'repair', 'Flag crews', '', String(e)); }
}
/* Flag holidays brought over from v1 list their crews in the notes ("Zone crews: 1=Rice, Lance & Mindy; 2=…").
   Put those on the Flag crews tab, once, for holidays that don't have crews yet. "Last, First & Spouse" becomes "First & Spouse Last". */
function flagCrewsFromNotes_() {
  var have = {}; rows_('Flag crews').forEach(function (c) { have[c.Holiday] = 1; });
  var n = 0;
  rows_('Events').forEach(function (e) {
    if (!/^Flags?:/i.test(String(e.Title || '')) || have[e.ID]) return;
    var m = String(e.Notes || '').match(/Zone crews:\s*(.+)$/i); if (!m) return;
    m[1].split(/;\s*(?=\d+\s*=)/).forEach(function (part) {
      var z = part.match(/^\s*(\d+)\s*=\s*(.+?)\s*$/); if (!z) return;
      var who = z[2], c = who.match(/^([^,]+),\s*(.+)$/); if (c) who = c[2].trim() + ' ' + c[1].trim();
      save_(null, 'Flag crews', { Holiday: e.ID, Date: e.Date, Zone: z[1], Person: who, Kind: 'Family', Status: 'Assigned', Notes: 'From v1' }, { system: true, quiet: true });
      n++;
    });
  });
  return n;
}


/* ================= Lesson plan: the Church's Sunday curriculum on every class's schedule =================
   Since September 2026 (First Presidency letter, March 30, 2026): sacrament meeting, then 25 minutes of Sunday School
   (Come, Follow Me) and 25 minutes of quorum, Relief Society and Young Women; Primary meets every week.
   - Young Women and Aaronic Priesthood quorums study one chapter of the For the Strength of Youth guide each month:
     fast Sunday introduces the chapter, the middle Sundays "learn more", the last Sunday is
     "Becoming a covenant daughter / son of God". The fast and last Sunday lessons are never dropped when a
     conference takes a Sunday; with fewer Sundays the middle lessons are combined.
   - Sunday School and Primary follow Come, Follow Me for Home and Church (2026 Old Testament, 2027 New Testament).
     On fast Sunday Primary may use a fast-Sunday lesson from the back of the manual.
   - Elders quorum and Relief Society teach from general conference messages the presidency chooses.
   - No classes on general conference Sundays (first Sunday of April and October) or stake conference.
   Runs nightly and from setUp. It only rewrites lessons the Hub wrote itself (or blank ones), so anything a leader
   types stays exactly as typed. */
var CUR_FSY_ = ['God’s plan is for you', 'God wants to communicate with you', 'You can help with God’s work', 'Jesus Christ will help you',
  'Walk in God’s light', 'Love God, love your neighbor', 'Ordinances and covenants give you access to God’s blessings',
  'Temple ordinances and covenants give you greater access to God’s blessings', 'You are blessed by priesthood keys and authority',
  'Your body is sacred', 'Truth will make you free', 'Jesus Christ brings joy'];
/* Second- and third-Sunday topics already published. Later months are read from the lesson pages when they appear. */
var CUR_TOPICS_ = { '2026-09': ['the restoration of the priesthood', 'priesthood keys'], '2026-10': ['the Word of Wisdom', 'the law of chastity'], '2026-11': ['studying the scriptures', 'the search for truth'] };
var CUR_CFM_ = [{ from: '2025-12-28', base: '2025-12-29', slug: 'come-follow-me-for-home-and-church-old-testament-2026' },
  { from: '2026-12-27', base: '2026-12-28', slug: 'come-follow-me-for-home-and-church-new-testament-2027' }];
var CUR_SITE_ = 'https://www.churchofjesuschrist.org/study/';
var CUR_GC_LINK_ = CUR_SITE_ + 'general-conference?lang=eng';
var CUR_AUTO_ = /^(For the Strength of Youth guide|FSY|Come, Follow Me|General conference message|No classes: (general|stake) conference|Behold Your Little Ones|Songs for this month)/;
var CUR_YOUTH_ = ['Young Women', 'Young Men'];

function curYm_(d) { return d.slice(0, 7); }
function curSundaysOf_(ym) { var p = ym.split('-'), d = new Date(+p[0], +p[1] - 1, 1), out = []; while (d.getDay() !== 0) d.setDate(d.getDate() + 1); while (d.getMonth() === +p[1] - 1) { out.push(ymd_(d)); d.setDate(d.getDate() + 7); } return out; }
function curGenConf_(d) { var m = +d.slice(5, 7); return (m === 4 || m === 10) && +d.slice(8, 10) <= 7; }
function curStakeConf_() {
  var out = {};
  rows_('Events').forEach(function (e) {
    if (!/stake conference/i.test(String(e.Title || '')) || e.Status === 'Cancelled' || !e.Date) return;
    var d = parseYmd_(e.Date), end = e['End date'] ? parseYmd_(e['End date']) : d;
    for (var i = 0; i < 4 && d <= end; i++) { if (d.getDay() === 0) out[ymd_(d)] = 1; d = addDays_(d, 1); }
  });
  return out;
}
function curFast_(ym, stake) { var s = curSundaysOf_(ym).filter(function (d) { return !curGenConf_(d) && !stake[d]; }); return s[0] || ''; }
function curCfm_(d) {
  var m = null; CUR_CFM_.forEach(function (x) { if (d >= x.from) m = x; });
  if (!m) return '';
  var wk = Math.floor((parseYmd_(d) - parseYmd_(m.base)) / 864e5 / 7) + 1;
  return wk >= 1 && wk <= 52 ? CUR_SITE_ + 'manual/' + m.slug + '/' + (wk < 10 ? '0' : '') + wk + '?lang=eng' : '';
}
function curFsyLink_(ym, slug) { var p = ym.split('-'); return CUR_SITE_ + 'ftsoy/' + p[0] + '/' + p[1] + (slug ? '/fsy-lessons/' + slug : '') + '?lang=eng'; }
/* Reads "2. Learn more about …" from the Church's lesson page once it's published, and remembers it. */
function curTopic_(ym, n) {
  var known = CUR_TOPICS_[ym]; if (known) return known[n - 2];
  var props = PropertiesService.getScriptProperties(), key = 'fsy:' + ym + ':' + n, got = props.getProperty(key);
  if (got) return got;
  var now = ymd_(today_()); if (ym > curYm_(ymd_(addDays_(today_(), 70))) || ym < curYm_(now)) return '';
  var cache = CacheService.getScriptCache(); if (cache.get('try:' + key)) return '';
  cache.put('try:' + key, '1', 86400);
  try {
    var r = UrlFetchApp.fetch(curFsyLink_(ym, n === 2 ? '02-second-sunday' : '03-third-sunday'), { muteHttpExceptions: true, followRedirects: true });
    if (r.getResponseCode() !== 200) return '';
    var html = r.getContentText(), m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || html.match(/<title>([\s\S]*?)<\/title>/i);
    var t = m ? m[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&#x27;|&#39;|&rsquo;/g, '’').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim() : '';
    t = t.replace(/\s*[|–-]\s*(For the Strength of Youth|The Church of Jesus Christ).*$/i, '').replace(/^\d\.\s*/, '');
    var lm = t.match(/^Learn more about\s+(.{3,120})$/i); if (!lm) return '';
    props.setProperty(key, lm[1]); return lm[1];
  } catch (e) { return ''; }
}
/* The FSY lesson for one class Sunday. slots = that org's class Sundays this month, in order. */
function curFsy_(org, d, slots) {
  var ym = curYm_(d), ch = CUR_FSY_[+ym.slice(5, 7) - 1], i = slots.indexOf(d), n = slots.length;
  var t2 = function () { return curTopic_(ym, 2); }, t3 = function () { return curTopic_(ym, 3); };
  var about = function (t) { return t ? 'Learn more about ' + t : 'Learn more about this month’s chapter, “' + ch + '”'; };
  if (i === 0) return { lesson: 'FSY (fast Sunday): Study the chapter “' + ch + '” in the For the Strength of Youth guide' + (d >= '2027-01-01' ? ' and choose an invitation' : ''), link: curFsyLink_(ym, '01-fast-sunday') };
  if (i === n - 1) return org === 'Young Women' ? { lesson: 'FSY (last Sunday): Becoming a covenant daughter of God', link: curFsyLink_(ym, '04a-fourth-sunday') }
    : { lesson: 'FSY (last Sunday): Becoming a covenant son of God', link: curFsyLink_(ym, '04b-fourth-sunday') };
  if (n === 3) { var a = t2(), b = t3(); return { lesson: 'FSY: ' + (a && b ? 'Learn more about ' + a + ' and ' + b : about('')) + ' (the 2nd and 3rd Sunday lessons together)', link: curFsyLink_(ym, '02-second-sunday') }; }
  if (i === 1) return { lesson: 'FSY: ' + about(t2()), link: curFsyLink_(ym, '02-second-sunday') };
  if (i === 2) return { lesson: 'FSY: ' + about(t3()), link: curFsyLink_(ym, '03-third-sunday') };
  return { lesson: 'FSY: Learn more — the class presidency picks from this month’s FSY magazine (“' + ch + '”)', link: curFsyLink_(ym, '') };
}
function curLesson_(org, cls, d, cur, ctx) {
  if (curGenConf_(d)) return { lesson: 'No classes: general conference', link: CUR_GC_LINK_ };
  if (ctx.stake[d]) return { lesson: 'No classes: stake conference', link: '' };
  var fast = ctx.fast[curYm_(d)] === d, cfm = curCfm_(d), base = String(cur || '').replace(/\s*\((or a new fast-Sunday lesson)\)\s*$/, '').replace(/\s*— fast Sunday:.*$/, '');
  if (CUR_YOUTH_.indexOf(org) >= 0) return curFsy_(org, d, ctx.slots[org + '|' + curYm_(d)] || [d]);
  if (org === 'Elders Quorum' || org === 'Relief Society') return { lesson: /^General conference message/.test(base) ? base : 'General conference message (the presidency chooses the talk)', link: CUR_GC_LINK_ };
  if (org === 'Primary') {
    if (/nursery/i.test(cls) || /^Behold Your Little Ones/.test(base)) return { lesson: 'Behold Your Little Ones (nursery manual)', link: CUR_SITE_ + 'manual/behold-your-little-ones-nursery-manual?lang=eng' };
    if (/singing|music/i.test(cls) || /^Songs for this month/.test(base)) return { lesson: 'Songs for this month (Primary music)', link: '' };
    if (!/^Come, Follow Me/.test(base)) base = 'Come, Follow Me for Primary: this week’s lesson';
    return { lesson: base + (fast ? ' — fast Sunday: you may use a fast-Sunday lesson from the back of the manual' : ''), link: cfm };
  }
  if (org === 'Sunday School') return { lesson: /^Come, Follow Me/.test(base) ? base : 'Come, Follow Me: this week’s lesson', link: cfm };
  return null;
}
function lessonPlan_() {
  var sh = sheet_('Teaching'), d = tabDef_('Teaching'), lastCol = Math.max(sh.getLastColumn(), d.cols.length);
  var head = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(String), col = {};
  ['ID', 'Organization', 'Class', 'Date', 'Teacher', 'Lesson', 'Link'].forEach(function (k) { col[k] = head.indexOf(k); });
  if (col.Lesson < 0 || col.Date < 0) return 'no Teaching tab';
  var lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    var last = sh.getLastRow(), vals = last >= 2 ? sh.getRange(2, 1, last - 1, lastCol).getValues() : [];
    var ds = function (v) { return v instanceof Date ? ymd_(v) : String(v || '').slice(0, 10); };
    var tY = ymd_(today_()), from = ymd_(addDays_(today_(), -7)), horizon = ymd_(addDays_(today_(), 7 * 20));
    var stake = curStakeConf_(), ctx = { stake: stake, fast: {}, slots: {} };
    /* Keep each organization's classes going at least 20 weeks ahead (same classes and teachers as its last Sunday). Relief Society gets its own row if it has none. */
    var byOrg = {}; vals.forEach(function (r) { var o = String(r[col.Organization] || ''), dd = ds(r[col.Date]); if (!o || !/^\d{4}-\d\d-\d\d$/.test(dd)) return; if (!byOrg[o] || dd > byOrg[o].last) byOrg[o] = { last: dd }; });
    if (!byOrg['Relief Society']) byOrg['Relief Society'] = { last: '', seed: [['Relief Society', '']] };
    var added = [];
    Object.keys(byOrg).forEach(function (o) {
      if (['Sunday School', 'Primary', 'Elders Quorum', 'Relief Society', 'Young Women', 'Young Men'].indexOf(o) < 0) return;
      var info = byOrg[o], seed = info.seed || vals.filter(function (r) { return String(r[col.Organization]) === o && ds(r[col.Date]) === info.last; }).map(function (r) { return [String(r[col.Class] || ''), String(r[col.Teacher] || '')]; });
      if (!seed.length) return;
      var s = info.last ? addDays_(parseYmd_(info.last), 7) : nextSunday_(today_());
      if (ymd_(s) < tY) s = nextSunday_(today_());
      for (; ymd_(s) <= horizon; s = addDays_(s, 7)) {
        seed.forEach(function (c) {
          var line = head.map(function () { return ''; });
          line[col.ID] = newId_('Teaching'); line[col.Organization] = o; line[col.Class] = c[0]; line[col.Date] = new Date(s.getTime()); if (col.Teacher >= 0) line[col.Teacher] = c[1]; line[col.Lesson] = '';
          if (col.Link >= 0) line[col.Link] = '';
          added.push(line);
        });
      }
    });
    var all = vals.concat(added);
    /* Class Sundays per youth org and month: not conference Sundays, and not Sundays a leader marked "5th Sunday…" or "No classes…". */
    var off = {};
    all.forEach(function (r) { var o = String(r[col.Organization]), dd = ds(r[col.Date]); if (CUR_YOUTH_.indexOf(o) >= 0 && /^(5th Sunday|No classes)/i.test(String(r[col.Lesson] || ''))) off[o + '|' + dd] = 1; });
    var months = {}; all.forEach(function (r) { var dd = ds(r[col.Date]); if (dd >= from) months[curYm_(dd)] = 1; });
    Object.keys(months).forEach(function (ym) {
      ctx.fast[ym] = curFast_(ym, stake);
      CUR_YOUTH_.forEach(function (o) { ctx.slots[o + '|' + ym] = curSundaysOf_(ym).filter(function (dd) { return !curGenConf_(dd) && !stake[dd] && !off[o + '|' + dd]; }); });
    });
    var changed = 0;
    all.forEach(function (r) {
      var dd = ds(r[col.Date]); if (dd < from) return;
      var cur = String(r[col.Lesson] || ''); if (cur && !CUR_AUTO_.test(cur)) return;
      var link = col.Link >= 0 ? String(r[col.Link] || '') : '';
      if (link && !/churchofjesuschrist\.org/.test(link)) return;
      var got = curLesson_(String(r[col.Organization]), String(r[col.Class] || ''), dd, cur, ctx); if (!got) return;
      if (got.lesson !== cur || (col.Link >= 0 && got.link !== link)) { r[col.Lesson] = got.lesson; if (col.Link >= 0) r[col.Link] = got.link; changed++; }
    });
    if (vals.length) {
      sh.getRange(2, col.Lesson + 1, vals.length, 1).setValues(vals.map(function (r) { return [r[col.Lesson]]; }));
      if (col.Link >= 0) sh.getRange(2, col.Link + 1, vals.length, 1).setValues(vals.map(function (r) { return [r[col.Link]]; }));
    }
    if (added.length) sh.getRange(sh.getLastRow() + 1, 1, added.length, lastCol).setValues(added);
    bump_('Teaching');
    return changed + ' lessons set' + (added.length ? ' · ' + added.length + ' class Sundays added' : '');
  } finally { lock.releaseLock(); }
}
/* What this month and the next two look like, for the Lesson schedule screen. */
ACTIONS.curriculum = function (req, me) {
  if (!(isBishopric_(me) || me.roles.leader || me.roles.teacher || me.roles.clerk || me.roles.admin)) throw new Error('The lesson plan is for leaders and teachers.');
  var stake = curStakeConf_(), t = today_(), out = [];
  for (var i = 0; i < 3; i++) {
    var m = new Date(t.getFullYear(), t.getMonth() + i, 1), ym = ymd_(m).slice(0, 7), sun = curSundaysOf_(ym);
    out.push({ ym: ym, chapter: CUR_FSY_[m.getMonth()], link: curFsyLink_(ym, ''), fast: curFast_(ym, stake), topics: [CUR_TOPICS_[ym] ? CUR_TOPICS_[ym][0] : (PropertiesService.getScriptProperties().getProperty('fsy:' + ym + ':2') || ''), CUR_TOPICS_[ym] ? CUR_TOPICS_[ym][1] : (PropertiesService.getScriptProperties().getProperty('fsy:' + ym + ':3') || '')],
      noClass: sun.filter(function (d) { return curGenConf_(d) || stake[d]; }).map(function (d) { return { date: d, why: curGenConf_(d) ? 'General conference' : 'Stake conference' }; }) });
  }
  return { months: out, cfm: curCfm_(ymd_(nextSunday_(t))), gc: CUR_GC_LINK_ };
};
ACTIONS.lessonPlanNow = function (req, me) {
  if (!(isBishopric_(me) || me.roles.admin)) throw new Error('The bishopric or the executive secretary refreshes the lesson plan.');
  return { result: lessonPlan_() };
};


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
      if (tab === 'Settings' && row.Key && have[String(row.Key)]) { if (/^(yes|true)$/i.test(String(row.Replace)) || (!setting_(row.Key) && row.Value !== '')) { save_(null, 'Settings', { Key: row.Key, Value: row.Value }, { system: true, quiet: true }); SET_CACHE_ = null; n++; } continue; }
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
