// FullCalendar event source that reads directly from localStorage

function local_event_source() {
  return {
    id: 'localstorage',
    events: function(start, end, timezone, callback) {
      var raw;
      try {
        raw = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
      } catch(e) {
        raw = [];
      }

      var events = [];
      for (var i = 0; i < raw.length; i++) {
        var entry = raw[i];
        // Parse the stored time string back to a Date
        var date = new Date(entry.start);
        if (isNaN(date.getTime())) continue; // skip unparseable entries

        var momentDate = moment(date);
        // Only include events within the current calendar view range
        if (!momentDate.isBetween(start, end, null, '[]')) continue;

        events.push({
          id:    entry.id,
          title: entry.activity,
          start: date,
          end:   new Date(date.getTime() + 30 * 60 * 1000), // 30min block
          color: entry.colour
        });
      }
      callback(events);
    }
  };
}
