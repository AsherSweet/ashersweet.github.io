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

const contents = document.querySelectorAll(".content");
const listItems = document.querySelectorAll("nav ul li");

listItems.forEach((item, idx) => {
  item.addEventListener("click", () => {
    hideAllContents();
    hideAllItems();

    item.classList.add("active");
    contents[idx].classList.add("show");
  });
});

function hideAllContents() {
  contents.forEach((content) => {
    content.classList.remove("show");
  });
}

function hideAllItems() {
  listItems.forEach((item) => {
    item.classList.remove("active");
  });
}
