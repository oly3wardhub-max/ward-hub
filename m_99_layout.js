/* The More menu, organized the way people look for things: a few short sections instead of one long list. Runs last, after every feature has added its item. */
(function () {
  const WH = window.WH = window.WH || {}; WH.ready = WH.ready || [];
  const L = [
    ['Emergency', ['Emergency plan']],
    ['Sunday', ['Plan ahead', 'Lesson schedule', 'Lesson texts', 'Substitute requests', 'Youth Sunday agendas', 'Away dates']],
    ['People', ['Messages', 'Picture for a text', 'Newsletter', 'Ministering interviews', 'Elders quorum zones', 'Checklists', 'Youth protection', 'Permission forms']],
    ['Calendar and events', ['Calendar and lists', 'Print a calendar', 'Building', 'Sign-up sheets', 'Dinner groups', 'Flags', 'Turns', 'Ward conference visits', 'Funerals']],
    ['Councils and interviews', ['Meetings', 'Tasks', 'Announcements', 'Appointments', 'Tithing declaration', 'Inbox', 'Feedback']],
    ['Ward and stake', ['Church News', 'Stake page', 'Ask the Hub']],
    ['Administrator', ['Paste from LCR', 'Who can open the Hub', 'Settings', 'Health', 'All lists']]
  ];
  const place = () => {
    const at = {}; L.forEach(([g, titles], gi) => titles.forEach((t, i) => { at[t] = [g, gi * 100 + i]; }));
    (WH.more || []).forEach(m => { const a = at[m.title]; if (a) { m.group = a[0]; m.order = a[1]; } else if (m.group !== 'Help') { m.group = m.group || 'More'; m.order = 650 + (m.order || 0); } else m.order = 900; });
  };
  place(); WH.ready.push(place);
})();
