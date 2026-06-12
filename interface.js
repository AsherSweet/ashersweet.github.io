var calendarInitialised = false;
var editingEntryId = null;


function toDatetimeLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}


function handleTimeToggle(checkbox) {
  const picker      = document.getElementById('manual-time-picker');
  const input       = document.getElementById('manual-datetime');
  const inputEnd    = document.getElementById('manual-datetime-end');
  const sleepManual = document.getElementById('sleep-manual-times');
  const sleepStart  = document.getElementById('sleep-start');
  const sleepEnd    = document.getElementById('sleep-end');

  if (checkbox.checked) {
    const now = toDatetimeLocal(new Date().toISOString());
    input.value      = now;
    inputEnd.value   = '';
    if (sleepStart) sleepStart.value = now;
    if (sleepEnd)   sleepEnd.value   = '';
    picker.style.display      = 'block';
    if (sleepManual) sleepManual.style.display = 'block';
    updateSleepEndRowVisibility();
  } else {
    picker.style.display = 'none';
    if (sleepManual) sleepManual.style.display = 'none';
  }
}

function updateSleepEndRowVisibility() {
  const endRow = document.getElementById('sleep-end-row');
  if (!endRow) return;
  // Hide end input when there's already an open sleep (only need wake time)
  endRow.style.display = getOpenSleepEntry() ? 'none' : 'flex';
}

function getLogTime() {
  const toggle = document.getElementById('manual-time-toggle');
  if (toggle && toggle.checked) {
    const input = document.getElementById('manual-datetime');
    if (input && input.value) return new Date(input.value).toISOString();
  }
  return new Date().toISOString();
}

function getLogEndTime() {
  const toggle = document.getElementById('manual-time-toggle');
  if (toggle && toggle.checked) {
    const input = document.getElementById('manual-datetime-end');
    if (input && input.value) return new Date(input.value).toISOString();
  }
  return null;
}

function getSleepManualStart() {
  const input = document.getElementById('sleep-start');
  if (input && input.value) return new Date(input.value).toISOString();
  return getLogTime();
}

function getSleepManualEnd() {
  const input = document.getElementById('sleep-end');
  if (input && input.value) return new Date(input.value).toISOString();
  return null;
}



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

// Log Activity

function handleLog() {
  const selected = document.querySelector('.radioBtn:checked');
  const feedback = document.getElementById('log-feedback');
  if (!selected) {
    feedback.textContent = "Please select an activity first.";
    feedback.style.color = "#e07070";
    return;
  }
  activityLog(selected.value, getLogTime(), getLogEndTime());
  feedback.textContent = `"${selected.value}" logged!`;
  feedback.style.color = "var(--accent-color)";
  setTimeout(() => feedback.textContent = "", 2000);
}

// Star Rating

function initStarRating(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll('.star').forEach(star => {
    star.addEventListener('click', function() {
      setStarRating(containerId, parseInt(this.dataset.value));
    });
    star.addEventListener('mouseover', function() {
      highlightStars(containerId, parseInt(this.dataset.value));
    });
  });
  container.addEventListener('mouseleave', function() {
    highlightStars(containerId, parseInt(container.dataset.selected || '0'));
  });
}

function setStarRating(containerId, value) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.dataset.selected = value;
  highlightStars(containerId, value);
}

function highlightStars(containerId, value) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll('.star').forEach(star => {
    star.classList.toggle('active', parseInt(star.dataset.value) <= value);
  });
}

function getSelectedQuality(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return null;
  const val = parseInt(container.dataset.selected || '0');
  return val > 0 ? val : null;
}

//  Sleep Toggle 

function updateSleepButton() {
  const btn          = document.getElementById('sleep-btn');
  const icon         = document.getElementById('sleep-btn-icon');
  const text         = document.getElementById('sleep-btn-text');
  const qualityPicker = document.getElementById('sleep-quality-picker');
  if (!btn) return;

  const open = getOpenSleepEntry();

  if (open) {
    btn.className  = 'sleep-btn sleep-btn--wake';
    icon.className = 'fas fa-sun me-2';
    text.textContent = 'Log Wake Time';
    if (qualityPicker) qualityPicker.style.display = 'block';
  } else {
    btn.className  = 'sleep-btn sleep-btn--bedtime';
    icon.className = 'fas fa-moon me-2';
    text.textContent = 'Log Bedtime';
    if (qualityPicker) qualityPicker.style.display = 'none';
  }
  updateSleepEndRowVisibility();
}

function handleSleepToggle() {
  const open     = getOpenSleepEntry();
  const feedback = document.getElementById('log-feedback');
  const toggle   = document.getElementById('manual-time-toggle');
  const isManual = toggle && toggle.checked;

  if (open) {
    // Logging wake time
    const wakeTime = isManual
      ? (getSleepManualEnd() || getSleepManualStart())
      : new Date().toISOString();
    const quality = getSelectedQuality('sleep-stars');
    logSleepEnd(wakeTime, quality);
    setStarRating('sleep-stars', 0);
    if (feedback) {
      feedback.textContent = 'Wake time logged!';
      feedback.style.color = '#d4b85a';
      setTimeout(() => feedback.textContent = '', 2000);
    }
  } else {
    // Logging bedtime
    const startTime = isManual ? getSleepManualStart() : new Date().toISOString();
    logSleepStart(startTime);

    // Manual mode with end time: complete the session immediately
    if (isManual && getSleepManualEnd()) {
      const quality = getSelectedQuality('sleep-stars');
      logSleepEnd(getSleepManualEnd(), quality);
      setStarRating('sleep-stars', 0);
      if (feedback) {
        feedback.textContent = 'Sleep logged!';
        feedback.style.color = '#7b9cff';
        setTimeout(() => feedback.textContent = '', 2000);
      }
      updateSleepButton();
      return;
    }

    if (feedback) {
      feedback.textContent = 'Bedtime logged!';
      feedback.style.color = '#7b9cff';
      setTimeout(() => feedback.textContent = '', 2000);
    }
  }
  updateSleepButton();
}

// Settings 

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

// Calendar 

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
    eventSources: [local_event_source()],
    eventClick: function(calEvent) {
      openEditModal(calEvent);
    }
  });
  window.addEventListener('resize', function() {
    $('#calendar').fullCalendar('option', 'height', window.innerHeight - 70);
  });
  calendarInitialised = true;
}

// Calendar Edit Modal 

function openEditModal(calEvent) {
  const entry = getLogs().find(e => e.id == calEvent.id);
  if (!entry) return;

  editingEntryId = entry.id;
  document.getElementById('edit-modal-title').textContent = entry.activity;
  document.getElementById('edit-start').value = toDatetimeLocal(entry.start);
  document.getElementById('edit-end').value   = toDatetimeLocal(entry.end);

  const qualityRow = document.getElementById('edit-quality-row');
  if (entry.type === 'sleep') {
    qualityRow.style.display = 'block';
    setStarRating('edit-stars', entry.quality || 0);
  } else {
    qualityRow.style.display = 'none';
  }

  document.getElementById('edit-modal').style.display = 'flex';
}

function closeEditModal() {
  document.getElementById('edit-modal').style.display = 'none';
  editingEntryId = null;
}

function saveEditModal() {
  if (editingEntryId === null) return;
  const startVal = document.getElementById('edit-start').value;
  const endVal   = document.getElementById('edit-end').value;

  const fields = {
    start: startVal ? new Date(startVal).toISOString() : undefined,
    end:   endVal   ? new Date(endVal).toISOString()   : null
  };

  const entry = getLogs().find(e => e.id === editingEntryId);
  if (entry && entry.type === 'sleep') {
    fields.quality = getSelectedQuality('edit-stars');
  }

  updateEntry(editingEntryId, fields);
  closeEditModal();
}

function deleteEditModal() {
  if (editingEntryId === null) return;
  removeEntry(editingEntryId);
  closeEditModal();
}

// Nav 

document.addEventListener("DOMContentLoaded", () => {
  renderActivityGrid();
  renderSettings();
  updateSleepButton();
  initStarRating('sleep-stars');
  initStarRating('edit-stars');

  document.getElementById('edit-modal').addEventListener('click', function(e) {
    if (e.target === this) closeEditModal();
  });

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
