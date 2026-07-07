var calendarInitialised = false;
var editingEntryId = null;
var lastClosedSleepId = null;
var sleepSelectedInManual = false;
var waso = null;
var tts = null;
//  Helpers 

function toDatetimeLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function showFeedback(el, msg, color) {
  if (!el) return;
  el.textContent = msg;
  el.style.color = color;
  setTimeout(() => el.textContent = '', 2000);
}

//  Time Toggle 

function handleTimeToggle(checkbox) {
  const picker   = document.getElementById('manual-time-picker');
  const input    = document.getElementById('manual-datetime');
  const inputEnd = document.getElementById('manual-datetime-end');

  if (checkbox.checked) {
    input.value    = toDatetimeLocal(new Date().toISOString());
    inputEnd.value = '';
    picker.style.display = 'block';
  } else {
    picker.style.display = 'none';
    sleepSelectedInManual = false;
  }
  updateSleepButton();
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

//  Activity Grid 

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
    ${activity.icon1 ? `<i class="activity-icon fas ${activity.icon1}" style="color:${activity.color}"></i>` : ''}
    ${activity.icon2 ? `<i class="activity-icon fas ${activity.icon2}" style="color:${activity.color}"></i>` : ''}
    <p class="activity-label mb-0">${activity.name}</p>
  </label>`;
    grid.appendChild(col);
    col.querySelector('.radioBtn').addEventListener('change', function() {
      if (this.checked && sleepSelectedInManual) {
        sleepSelectedInManual = false;
        updateSleepButton();
      }
    });
  });
}

//  Log Activity 

function handleLog() {
  const selected = document.querySelector('.radioBtn:checked');
  const feedback = document.getElementById('log-feedback');
  const toggle   = document.getElementById('manual-time-toggle');
  const isManual = toggle && toggle.checked;

  if (isManual && sleepSelectedInManual) {
    if (!getLogEndTime()) {
      feedback.textContent = "Please set an end time for sleep.";
      feedback.style.color = "#e07070";
      return;
    }
    openSleepQualityModal('manual');
    return;
  }

  if (!selected) {
    feedback.textContent = "Please select an activity first.";
    feedback.style.color = "#e07070";
    return;
  }
  activityLog(selected.value, getLogTime(), getLogEndTime());
  showFeedback(feedback, `"${selected.value}" logged!`, 'var(--accent-color)');
}




//  Sleep Toggle 

function updateSleepButton() {
  const btn      = document.getElementById('sleep-btn');
  const moonIcon = document.getElementById('sleep-icon-moon');
  const sunIcon  = document.getElementById('sleep-icon-sun');
  const tick     = document.getElementById('sleep-btn-tick');
  const text     = document.getElementById('sleep-btn-text');
  if (!btn) return;

  const toggle   = document.getElementById('manual-time-toggle');
  const isManual = toggle && toggle.checked;
  const open     = getOpenSleepEntry();

  if (isManual) {
    btn.className          = sleepSelectedInManual ? 'sleep-btn sleep-btn--manual-selected' : 'sleep-btn sleep-btn--manual-unselected';
    moonIcon.style.display = '';
    sunIcon.style.display  = '';
    tick.style.display     = sleepSelectedInManual ? 'block' : 'none';
    text.textContent       = 'Sleep';
  } else if (open) {
    btn.className       = 'sleep-btn sleep-btn--wake';
    moonIcon.style.display = 'none';
    sunIcon.style.display  = '';
    tick.style.display     = 'none';
    text.textContent = 'Log Wake Time';
  } else {
    btn.className       = 'sleep-btn sleep-btn--bedtime';
    moonIcon.style.display = '';
    sunIcon.style.display  = 'none';
    tick.style.display     = 'none';
    text.textContent = 'Log Bedtime';
  }
}

function handleSleepToggle() {
  const toggle   = document.getElementById('manual-time-toggle');
  const isManual = toggle && toggle.checked;
  const feedback = document.getElementById('log-feedback');
  const open     = getOpenSleepEntry();

  if (isManual) {
    sleepSelectedInManual = !sleepSelectedInManual;
    if (sleepSelectedInManual) {
      const checked = document.querySelector('.radioBtn:checked');
      if (checked) checked.checked = false;
    }
    updateSleepButton();
    return;
  }

  // Auto mode
  if (open) {
    lastClosedSleepId = open.id;
    logSleepEnd(new Date().toISOString(), null);
    showFeedback(feedback, 'Wake time logged!', '#d4b85a');
    openSleepQualityModal('auto');
  } else {
    logSleepStart(new Date().toISOString());
    showFeedback(feedback, 'Bedtime logged!', '#7b9cff');
  }
  updateSleepButton();
}

//  Dark Mode 

function toggleDarkMode(checkbox) {
  document.documentElement.setAttribute('data-bs-theme', checkbox.checked ? 'dark' : 'light');
  localStorage.setItem('darkMode', checkbox.checked ? '1' : '0');
}

//  Settings 
// Changes needed: Make some (first light) not removable
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
          ${activity.icon1 ? `<i class="activity-setting-icon fas ${activity.icon1}" style="color:${activity.color}"></i>` : ''}
          ${activity.icon2 ? `<i class="activity-setting-icon fas ${activity.icon2}" style="color:${activity.color}"></i>` : ''}
          <span class="activity-setting-name">${activity.name}</span>
        </div>
        <div class="form-check form-switch">
              ${activity.id!='light' ? `<input class="form-check-input" type="checkbox" id="enable-${activity.id}" ${isEnabled ? 'checked' : ''}
            onchange="onActivityToggle('${activity.id}', this)">`: ''}
          </div>
      </div>

      <div class="recurring-row activity-setting-left" id="recurring-row-${activity.id}"
           style="display:${isEnabled ? 'flex' : 'none'}">
        <i class="fas fa-rotate recurring-icon"></i>
  
        <span class="recurring-label">Auto-log daily at</span>

        <input type="time" id="recurring-time-${activity.id}" class="recurring-time-input"
          value="${rule ? rule.time : '08:00'}"
          onchange="onRecurringTimeChange('${activity.id}')">

        <div class="form-check form-switch">
           <input class="form-check-input" type="checkbox" id="recurring-enable-${activity.id}"
            ${rule && rule.enabled ? 'checked' : ''}
            onchange="onRecurringToggle('${activity.id}', this)">
            </div>
  
      </div>`;
    list.appendChild(row);
  });
}

// Activities in settings

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

//  Calendar 

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

//  Calendar Edit Modal 

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
    setRating('edit-stars', entry.quality || 0);
    setRating('calWaso', entry.waso || 0);
    
  } else {
    qualityRow.style.display = 'none';
  }
  document.getElementById('edit-modal').style.display = 'flex';
}
function openModal(modalid) {
  document.getElementById(modalid).style.display = '';
}
function closeModal(modalid) {
  document.getElementById(modalid).style.display = 'none';
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
    fields.waso = getSelectedQuality('calWaso')
  }
  updateEntry(editingEntryId, fields);
  closeModal('edit-modal');
}

function deleteEditModal() {
  if (editingEntryId === null) return;
  removeEntry(editingEntryId);
  closeModal('edit-modal');
}

//  Nav 

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem('darkMode') === '1') {
    document.documentElement.setAttribute('data-bs-theme', 'dark');
    const toggle = document.getElementById('dark-mode-toggle');
    if (toggle) toggle.checked = true;
  }
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