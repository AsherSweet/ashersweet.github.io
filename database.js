const STORAGE_KEY = "activityDatabase";
function getRandomColour() {
  var letters = '0123456789ABCDEF';
  var colour = '#';
  for (var i = 0; i < 6; i++) {
    colour += letters[Math.floor(Math.random() * 16)];
  }
  return colour;
}

function loadDatabase() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveDatabase(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  // Refresh the calendar if it's been initialised
  if (typeof $ !== 'undefined') {
    var cal = $('#calendar');
    if (cal.length && cal.data('fullCalendar')) {
      cal.fullCalendar('refetchEvents');
    }
  }
}

function activityLog(activityId, logTime) {
  const db = loadDatabase();
  const entry = {
    id: db.length ? Math.max(...db.map(e => e.id)) + 1 : 1,
    activity: activityId,
    // Store as ISO string so Date parsing is unambiguous
    start: logTime || new Date().toISOString(), //This needs an if query, where if it's a long activity i.e. sleeping, then the activity needs an end time
    colour: getRandomColour()
    //stop: 
  };
  db.push(entry);
  saveDatabase(db);
  renderLog();
  return entry;
}

function getLogs() {
  return loadDatabase();
}

function removeEntry(id) {
  const db = loadDatabase().filter(e => e.id !== id);
  saveDatabase(db);
  renderLog();
}

function clearAllLogs() {
  saveDatabase([]);
  renderLog();
}

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
    const displayTime = new Date(entry.start).toLocaleString();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${entry.id}</td>
      <td>${entry.activity}</td>
      <td>${displayTime}</td>
      <td>
        <button class="delete-btn" onclick="removeEntry(${entry.id})" title="Delete">
          <i class="fas fa-times"></i>
        </button>
      </td>`;
    tbody.appendChild(tr);
  });
}

document.addEventListener("DOMContentLoaded", renderLog);
