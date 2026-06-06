var calendarInitialised = false;

// ── Time Toggle ───────────────────────────────────────────────────────────

function handleTimeToggle(checkbox) {
  const picker = document.getElementById('manual-time-picker');
  const input  = document.getElementById('manual-datetime');
  if (checkbox.checked) {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    input.value = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    picker.style.display = 'block';
  } else {
    picker.style.display = 'none';
  }
}

function getLogTime() {
  const toggle = document.getElementById('manual-time-toggle');
  if (toggle && toggle.checked) {
    const input = document.getElementById('manual-datetime');
    if (input && input.value) return new Date(input.value).toISOString();
  }
  return new Date().toISOString();
}

// ── Activity Grid ─────────────────────────────────────────────────────────

function renderActivityGrid() {
  const grid = document.getElementById('activity-grid');
  if (!grid) return;

  const activities = getEnabledActivities();
  grid.innerHTML = '';

  if (activities.length === 0) {
    grid.innerHTML = '<div class="col-12 no-activities-msg">No activities selected. Add some in <strong>Settings</strong>.</div>';
    return;
  }

  activities.forEach(activity => {
    const col = document.createElement('div');
    col.className = 'col-4';
    col.innerHTML = `
      <input class="radioBtn" id="radio-${activity.id}" name="group" type="radio" value="${activity.name}" />
      <label for="radio-${activity.id}">
        <div class="toggle-icon fas fa-check"></div>
        <i class="activity-icon fas ${activity.icon}" style="color:${activity.color}"></i>
        <p class="activity-label mb-0">${activity.name}</p>
      </label>`;
    grid.appendChild(col);
  });
}

// ── Log Activity ──────────────────────────────────────────────────────────

function handleLog() {
  const selected = document.querySelector('.radioBtn:checked');
  const feedback = document.getElementById('log-feedback');
  if (!selected) {
    feedback.textContent = "Please select an activity first.";
    feedback.style.color = "#e07070";
    return;
  }
  activityLog(selected.value, getLogTime());
  feedback.textContent = `"${selected.value}" logged!`;
  feedback.style.color = "var(--accent-color)";
  setTimeout(() => feedback.textContent = "", 2000);
}

// ── Sleep Toggle ──────────────────────────────────────────────────────────

function updateSleepButton() {
  const btn  = document.getElementById('sleep-btn');
  const icon = document.getElementById('sleep-btn-icon');
  const text = document.getElementById('sleep-btn-text');
  if (!btn) return;

  const open = getOpenSleepEntry();
  if (open) {
    btn.className = 'sleep-btn sleep-btn--wake';
    icon.className = 'fas fa-sun me-2';
    text.textContent = 'Log Wake Time';
  } else {
    btn.className = 'sleep-btn sleep-btn--bedtime';
    icon.className = 'fas fa-moon me-2';
    text.textContent = 'Log Bedtime';
  }
}

function handleSleepToggle() {
  const open     = getOpenSleepEntry();
  const time     = getLogTime();
  const feedback = document.getElementById('log-feedback');

  if (open) {
    logSleepEnd(time);
    if (feedback) {
      feedback.textContent = 'Wake time logged!';
      feedback.style.color = '#d4b85a';
      setTimeout(() => feedback.textContent = '', 2000);
    }
  } else {
    logSleepStart(time);
    if (feedback) {
      feedback.textContent = 'Bedtime logged!';
      feedback.style.color = '#7b9cff';
      setTimeout(() => feedback.textContent = '', 2000);
    }
  }
  updateSleepButton();
}

// ── Settings ──────────────────────────────────────────────────────────────

function renderSettings() {
  const list = document.getElementById('settings-activity-list');
  if (!list) return;

  const settings = getSettings();
  list.innerHTML = '';

  DEFAULT_ACTIVITIES.forEach(activity => {
    const isEnabled = settings.enabled.includes(activity.id);
    const rule = settings.recurring[activity.id] || null;

    const row = document.createElement('div');
    row.className = 'activity-setting-row';
    row.innerHTML = `
      <div class="activity-setting-main">
        <div class="activity-setting-left">
          <i class="fas ${activity.icon} activity-setting-icon" style="color:${activity.color}"></i>
          <span class="activity-setting-name">${activity.name}</span>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="enable-${activity.id}" ${isEnabled ? 'checked' : ''}
            onchange="onActivityToggle('${activity.id}', this)">
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="recurring-row" id="recurring-row-${activity.id}"
           style="display:${isEnabled ? 'flex' : 'none'}">
        <i class="fas fa-rotate recurring-icon"></i>
        <span class="recurring-label">Auto-log daily at</span>
        <input type="time" id="recurring-time-${activity.id}" class="recurring-time-input"
          value="${rule ? rule.time : '08:00'}"
          onchange="onRecurringTimeChange('${activity.id}')">
        <label class="toggle-switch toggle-switch-sm">
          <input type="checkbox" id="recurring-enable-${activity.id}"
            ${rule && rule.enabled ? 'checked' : ''}
            onchange="onRecurringToggle('${activity.id}', this)">
          <span class="toggle-slider"></span>
        </label>
      </div>`;
    list.appendChild(row);
  });
}

function onActivityToggle(activityId, checkbox) {
  toggleActivity(activityId);
  const recurRow = document.getElementById(`recurring-row-${activityId}`);
  if (recurRow) recurRow.style.display = checkbox.checked ? 'flex' : 'none';
  renderActivityGrid();
}

function onRecurringToggle(activityId, checkbox) {
  if (checkbox.checked) {
    const timeInput = document.getElementById(`recurring-time-${activityId}`);
    setRecurring(activityId, timeInput.value);
  } else {
    setRecurringEnabled(activityId, false);
  }
}

function onRecurringTimeChange(activityId) {
  const enableCheckbox = document.getElementById(`recurring-enable-${activityId}`);
  if (enableCheckbox && enableCheckbox.checked) {
    const timeInput = document.getElementById(`recurring-time-${activityId}`);
    setRecurring(activityId, timeInput.value);
  }
}

// ── Calendar ──────────────────────────────────────────────────────────────

function initCalendar() {
  $('#calendar').fullCalendar({
    header: {
      left: 'prev,next today',
      center: 'title',
      right: 'month,agendaWeek,agendaDay'
    },
    height: window.innerHeight - 70,
    defaultView: 'month',
    timezone: 'local',
    eventSources: [local_event_source()]
  });
  window.addEventListener('resize', function() {
    $('#calendar').fullCalendar('option', 'height', window.innerHeight - 70);
  });
  calendarInitialised = true;
}

// ── Nav ───────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  renderActivityGrid();
  renderSettings();
  updateSleepButton();

  document.querySelectorAll("nav ul li").forEach(item => {
    item.addEventListener("click", () => {
      document.querySelectorAll("nav ul li").forEach(i => i.classList.remove("active"));
      item.classList.add("active");

      const pageId = item.getAttribute("data-page");
      document.querySelectorAll(".content").forEach(p => p.classList.remove("show"));
      document.getElementById(pageId).classList.add("show");

      if (pageId === "page-work") renderLog();

      if (pageId === "page-blog") {
        if (!calendarInitialised) {
          initCalendar();
        } else {
          $('#calendar').fullCalendar('render');
          $('#calendar').fullCalendar('refetchEvents');
        }
      }
    });
  });
});
