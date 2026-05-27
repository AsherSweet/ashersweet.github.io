var calendarInitialised = false;

function initCalendar() {
  $('#calendar').fullCalendar({
    header: {
      left: 'prev,next today',
      center: 'title',
      right: 'month,agendaWeek,agendaDay'
    },
    height: window.innerHeight - 60, // leave room for nav
    defaultView: 'month',
    timezone: 'local',
    eventSources: [local_event_source()]
  });
  window.addEventListener('resize', function() {
    $('#calendar').fullCalendar('option', 'height', window.innerHeight - 60);
  });
  calendarInitialised = true;
}

function handleLog() {
  const selected = document.querySelector('.radioBtn:checked');
  const feedback = document.getElementById('log-feedback');
  if (!selected) {
    feedback.textContent = "Please select an activity first.";
    feedback.style.color = "#e07070";
    return;
  }
  activityLog(selected.value);
  feedback.textContent = `"${selected.value}" logged!`;
  feedback.style.color = "var(--accent-color)";
  setTimeout(() => feedback.textContent = "", 2000);
}

document.addEventListener("DOMContentLoaded", () => {
  const navItems = document.querySelectorAll("nav ul li");

  navItems.forEach(item => {
    item.addEventListener("click", () => {
      navItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");

      const pageId = item.getAttribute("data-page");
      document.querySelectorAll(".content").forEach(page => {
        page.classList.remove("show");
      });
      document.getElementById(pageId).classList.add("show");

      if (pageId === "page-work") {
        renderLog();
      }

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
