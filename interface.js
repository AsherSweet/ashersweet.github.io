function handleLog() {
  const selected = document.querySelector('.radioBtn:checked');
  const feedback = document.getElementById('log-feedback');
  if (!selected) {
    feedback.textContent = "Please select an activity first.";
    feedback.style.color = "#e07070";
    return;
  }
  activityLog(selected.value, new Date().toLocaleString());
  feedback.textContent = `"${selected.value}" logged!`;
  feedback.style.color = "var(--accent-color)";
  setTimeout(() => feedback.textContent = "", 2000);
}

document.addEventListener("DOMContentLoaded", () => {
  const navItems = document.querySelectorAll("nav ul li");

  navItems.forEach(item => {
    item.addEventListener("click", () => {
      // Update nav active state
      navItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");

      // Show corresponding page
      const pageId = item.getAttribute("data-page");
      document.querySelectorAll(".content").forEach(page => {
        page.classList.remove("show");
      });
      document.getElementById(pageId).classList.add("show");

      // Re-render log when Work tab is opened
      if (pageId === "page-work") renderLog();
    });
  });
});
