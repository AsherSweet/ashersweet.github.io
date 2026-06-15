const STORAGE_KEY = "activityDatabase";
const SETTINGS_KEY = "activitySettings";

const DEFAULT_ACTIVITIES = [
  { id: 'exercise',   name: 'Exercise',   icon: 'fa-person-running', color: '#5b8dd9' },
  { id: 'caffeine',   name: 'Caffeine',   icon: 'fa-mug-hot',        color: '#d4845a' },
  { id: 'alcohol',    name: 'Alcohol',    icon: 'fa-wine-glass',     color: '#9b6dbd' },
  { id: 'food',       name: 'Food',       icon: 'fa-utensils',       color: '#5b9b6d' },
  { id: 'medication', name: 'Medication', icon: 'fa-pills',          color: '#d45a7a' },
  { id: 'light',      name: 'First Light',      icon: 'fa-sun',            color: '#d4b85a' },
  { id: 'rumination',     name: 'Rumination',     icon: 'fa-brain',          color: '#7a5a9b' },
  { id: 'screen',     name: 'Screen',     icon: 'fa-display',        color: '#5ab8d4' }
];

//  Settings

function getSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    if (!s) return { enabled: ['exercise', 'caffeine', 'meal', 'medication', 'light', 'alcohol', 'rumination', 'screen'], recurring: {} };
    if (!s.recurring) s.recurring = {};
    return s;
  } catch {
    return { enabled: ['exercise', 'caffeine', 'meal', 'medication', 'light', 'alcohol', 'rumination', 'screen'], recurring: {} };
  }
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function getEnabledActivities() {
  const { enabled } = getSettings();
  return DEFAULT_ACTIVITIES.filter(a => enabled.includes(a.id));
}

function toggleActivity(activityId) {
  const settings = getSettings();
  const idx = settings.enabled.indexOf(activityId);
  if (idx === -1) {
    settings.enabled.push(activityId);
  } else {
    settings.enabled.splice(idx, 1);
  }
  saveSettings(settings);
}

//  Recurring

function setRecurring(activityId, time) {
  const settings = getSettings();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  settings.recurring[activityId] = {
    time,
    enabled: true,
    lastFired: yesterday.toISOString().split('T')[0]
  };
  saveSettings(settings);
  checkAndFillRecurring();
}

function setRecurringEnabled(activityId, enabled) {
  const settings = getSettings();
  if (!settings.recurring[activityId]) return;
  settings.recurring[activityId].enabled = enabled;
  saveSettings(settings);
}

function removeRecurring(activityId) {
  const settings = getSettings();
  delete settings.recurring[activityId];
  saveSettings(settings);
}

function checkAndFillRecurring() {
  const settings = getSettings();
  const now = new Date();
  let changed = false;

  for (const [activityId, rule] of Object.entries(settings.recurring)) {
    if (!rule.enabled || !rule.time) continue;

    const activity = DEFAULT_ACTIVITIES.find(a => a.id === activityId);
    if (!activity) continue;

    const [ruleHour, ruleMin] = rule.time.split(':').map(Number);

    let checkDate = rule.lastFired
      ? new Date(rule.lastFired + 'T00:00:00')
      : new Date(now);
    if (rule.lastFired) checkDate.setDate(checkDate.getDate() + 1);
    checkDate.setHours(0, 0, 0, 0);

    const todayMidnight = new Date(now);
    todayMidnight.setHours(0, 0, 0, 0);

    while (checkDate <= todayMidnight) {
      const entryTime = new Date(checkDate);
      entryTime.setHours(ruleHour, ruleMin, 0, 0);

      if (entryTime <= now) {
        _insertRawEntry({
          activity: activity.name,
          activityId: activityId,
          start: entryTime.toISOString(),
          type: 'regular',
          colour: activity.color,
          recurring: true
        });
        settings.recurring[activityId].lastFired = checkDate.toISOString().split('T')[0];
        changed = true;
      }

      checkDate.setDate(checkDate.getDate() + 1);
    }
  }

  if (changed) {
    saveSettings(settings);
    renderLog();
    _refreshCalendar();
  }
}

function _insertRawEntry(entry) {
  const db = loadDatabase();
  entry.id = db.length ? Math.max(...db.map(e => e.id)) + 1 : 1;
  db.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function _refreshCalendar() {
  if (typeof $ !== 'undefined') {
    const cal = $('#calendar');
    if (cal.length && cal.data('fullCalendar')) {
      cal.fullCalendar('refetchEvents');
    }
  }
}

//  Database 

function loadDatabase() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveDatabase(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  _refreshCalendar();
}


// Universal entry creation handles both regular activities and sleep sessions.
// Call this from anywhere instead of activityLog / logSleepStart.
// tts - Time To Sleep   
// waso - Wake after sleep onset, How long you are awake during the night
function logEntry({ activity, activityId, start, end, type, colour, quality, tts, waso, recurring } = {}) {
  const db  = loadDatabase();
  const def = DEFAULT_ACTIVITIES.find(a => a.name === activity || a.id === activity || a.id === activityId);
  const entry = {
    id:         db.length ? Math.max(...db.map(e => e.id)) + 1 : 1,
    activity:   def ? def.name  : activity,
    activityId: def ? def.id    : (activityId || (activity || '').toLowerCase()),
    start:      start  || new Date().toISOString(),
    end:        end    || null,
    type:       type   || 'regular',
    colour:     colour || (def ? def.color : getRandomColour()),
    tts:        tts    || null,
    waso:       waso   || null
  };
  if (quality  != null) entry.quality  = quality;
  if (recurring      ) entry.recurring = true;
  db.push(entry);
  saveDatabase(db);
  renderLog();
  return entry;
}

function activityLog(activityName, logTime, endTime) {
  return logEntry({ activity: activityName, start: logTime, end: endTime, type: 'regular' });
}

function updateEntry(id, fields) {
  const db = loadDatabase();
  const entry = db.find(e => e.id === id);
  if (!entry) return;
  Object.assign(entry, fields);
  saveDatabase(db);
  renderLog();
}

//  Sleep 

function getOpenSleepEntry() {
  return loadDatabase().find(e => e.type === 'sleep' && !e.end) || null;
}

function logSleepStart(startTime) {
  return logEntry({ activity: 'Sleep', activityId: 'sleep', start: startTime, type: 'sleep', colour: '#7b9cff' });
}

function logSleepEnd(endTime, quality) {
  const db = loadDatabase();
  const open = db.find(e => e.type === 'sleep' && !e.end);
  if (!open) return null;
  open.end = endTime || new Date().toISOString();
  if (quality != null) open.quality = quality;
  saveDatabase(db);
  renderLog();
  return open;
}

//  Utilities 

function getRandomColour() {
  const letters = '0123456789ABCDEF';
  let colour = '#';
  for (let i = 0; i < 6; i++) colour += letters[Math.floor(Math.random() * 16)];
  return colour;
}

function getLogs() {
  return loadDatabase();
}

function removeEntry(id) {
  saveDatabase(loadDatabase().filter(e => e.id !== id));
  renderLog();
}

function clearAllLogs() {
  saveDatabase([]);
  renderLog();
}
// Log Section
function renderLog() {
  const tbody = document.getElementById("log-body");
  const logSection = document.getElementById("log-section");
  const logEmpty = document.getElementById("log-empty");
  if (!tbody) return;

  tbody.innerHTML = "";
  const logs = getLogs().slice().reverse();

  if (logs.length === 0) {
    if (logSection) logSection.style.display = "none";
    if (logEmpty) logEmpty.style.display = "block";
    return;
  }

  if (logSection) logSection.style.display = "block";
  if (logEmpty) logEmpty.style.display = "none";

  logs.forEach(entry => {
    const startStr = new Date(entry.start).toLocaleString();
    let timeCell;
    if (entry.type === 'sleep') {
      timeCell = entry.end
        ? `${startStr} → ${new Date(entry.end).toLocaleString()}`
        : `${startStr} <span class="ongoing-badge">ongoing</span>`;
    } else {
      timeCell = entry.end
        ? `${startStr} → ${new Date(entry.end).toLocaleString()}`
        : startStr;
    }
    const recurBadge = entry.recurring ? '<span class="recurring-badge">auto</span>' : '';
    const qualityStars = (entry.type === 'sleep' && entry.quality)
      ? `<span class="quality-badge">${'★'.repeat(entry.quality)}</span>`
      : '';
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${entry.id}</td>
      <td>${entry.activity}${recurBadge}${qualityStars}</td>
      <td>${timeCell}</td>
      <td>
        <button class="delete-btn" onclick="removeEntry(${entry.id})" title="Delete">
          <i class="fas fa-times"></i>
        </button>
      </td>`;
    tbody.appendChild(tr);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  checkAndFillRecurring();
  renderLog();
});
