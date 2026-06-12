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
        var startDate = new Date(entry.start);
        if (isNaN(startDate.getTime())) continue;

        var momentStart = moment(startDate);
        var endDate;

        if (entry.type === 'sleep') {
          endDate = entry.end ? new Date(entry.end) : new Date();
          var momentEnd = moment(endDate);
          if (momentEnd.isBefore(start) || momentStart.isAfter(end)) continue;
        } else {
          if (!momentStart.isBetween(start, end, null, '[]')) continue;
          endDate = entry.end
            ? new Date(entry.end)
            : new Date(startDate.getTime() + 30 * 60 * 1000);
        }

        var qualitySuffix = (entry.type === 'sleep' && entry.quality)
          ? ' ' + '★'.repeat(entry.quality)
          : '';

        events.push({
          id:     entry.id,
          title:  (entry.type === 'sleep'
                    ? (entry.end ? 'Sleep' : 'Sleep (ongoing)')
                    : entry.activity) + qualitySuffix,
          start:  startDate,
          end:    endDate,
          color:  entry.colour,
          allDay: false
        });
      }
      callback(events);
    }
  };
}
