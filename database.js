const STORAGE_KEY = "activityDatabase";

function loadDatabase() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveDatabase(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function activityLog(activityId, logTime) {
  const db = loadDatabase();
  const entry = {
    id: db.length + 1,
    activity: activityId,
    time: logTime || new Date().toLocaleString()
  };
  db.push(entry);
  saveDatabase(db);
  renderLog();
  return entry;
}

function getLogs() {
  return loadDatabase();
}

function renderLog() {
  const tbody = document.getElementById("log-body");
  if (!tbody) return;
  tbody.innerHTML = "";
  const logs = getLogs().slice().reverse();
  logs.forEach(entry => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${entry.id}</td><td>${entry.activity}</td><td>${entry.time}</td>`;
    tbody.appendChild(tr);
  });
  document.getElementById("log-section").style.display = logs.length ? "block" : "none";
}

document.addEventListener("DOMContentLoaded", renderLog);
