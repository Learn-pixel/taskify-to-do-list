// ==== DOM nodes ====
const taskInput = document.getElementById("task-text");
const taskCategory = document.getElementById("task-category");
const addTaskBtn = document.getElementById("add-task");
const taskList = document.getElementById("tasks");
const taskCount = document.getElementById("task-count");
const progressBar = document.getElementById("progress-bar");
const themeToggleBtn = document.getElementById("theme-toggle");

const searchInput = document.getElementById("search");
const statusButtons = document.querySelectorAll(".filter-btn");
const filterCategory = document.getElementById("filter-category");

// ==== State ====
let tasks = []; // [{id, text, category, completed}]
let statusFilter = "all"; // all | active | completed
let categoryFilter = "all"; // all | work | study | personal | general
let searchQuery = ""; // lowercase string

// ==== Init ====
window.addEventListener("load", () => {
  loadTheme();
  loadTasks();
  attachEvents();
  updateStats(); // ensure UI shows saved EXP/badge on startup
});


// ==== Events ====
function attachEvents() {
  addTaskBtn.addEventListener("click", addTask);

  // Enter to add
  taskInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addTask();
  });

  // Filters
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value.toLowerCase();
    renderTasks();
  });

  statusButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      statusFilter = btn.dataset.status;
      statusButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderTasks();
    });
  });

  filterCategory.addEventListener("change", (e) => {
    categoryFilter = e.target.value;
    renderTasks();
  });

  // Theme toggle + persist
  themeToggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("light-theme");
    localStorage.setItem(
      "theme",
      document.body.classList.contains("light-theme") ? "light" : "dark"
    );
    updateThemeIcon();
  });
}

// ==== Theme ====
function loadTheme() {
  const saved = localStorage.getItem("theme") || "dark";
  if (saved === "light") document.body.classList.add("light-theme");
  updateThemeIcon();
}

function updateThemeIcon() {
  themeToggleBtn.textContent = document.body.classList.contains("light-theme")
    ? "☀️"
    : "🌙";
}

// ==== CRUD ====
function addTask() {
  const text = taskInput.value.trim();
  const category = taskCategory.value;

  if (text === "") {
    alert("Please enter a task!");
    return;
  }

  const newTask = {
    id: Date.now(),
    text,
    category,
    completed: false,
  };

  tasks.push(newTask);
  saveTasks();
  renderTasks();

  taskInput.value = "";
}

function editTask(id) {
  const task = tasks.find((t) => t.id === id);
  const newText = prompt("Edit your task:", task ? task.text : "");
  if (newText === null) return; // cancelled
  const trimmed = newText.trim();
  if (trimmed === "") return;

  tasks = tasks.map((t) => (t.id === id ? { ...t, text: trimmed } : t));
  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  saveTasks();
  renderTasks();
}

function toggleComplete(id) {
  tasks = tasks.map((t) =>
    t.id === id ? { ...t, completed: !t.completed } : t
  );
  saveTasks();
  renderTasks();
}

// ==== Render ====
function renderTasks() {
  taskList.innerHTML = "";

  const filtered = tasks.filter((t) => {
    const statusOK =
      statusFilter === "all" ||
      (statusFilter === "active" && !t.completed) ||
      (statusFilter === "completed" && t.completed);

    const categoryOK = categoryFilter === "all" || t.category === categoryFilter;

    const searchOK = t.text.toLowerCase().includes(searchQuery);

    return statusOK && categoryOK && searchOK;
  });

  filtered.forEach((task) => {
    const li = document.createElement("li");
    if (task.completed) li.classList.add("completed");

    // content
    const content = document.createElement("div");
    content.className = "task-content";

    const badge = document.createElement("span");
    badge.className = `badge ${task.category}`;
    badge.textContent = task.category;

    const text = document.createElement("span");
    text.className = "task-text";
    text.textContent = task.text;
    if (task.completed) text.classList.add("completed");

    content.appendChild(badge);
    content.appendChild(text);

    // actions
    const actions = document.createElement("div");
    actions.className = "task-actions";

    const toggleBtn = document.createElement("button");
    toggleBtn.className = "toggle";
    toggleBtn.textContent = task.completed ? "Undo" : "✔";
    toggleBtn.addEventListener("click", () => toggleComplete(task.id));

    const editBtn = document.createElement("button");
    editBtn.className = "edit";
    editBtn.textContent = "✏️";
    editBtn.addEventListener("click", () => editTask(task.id));

    const delBtn = document.createElement("button");
    delBtn.className = "delete";
    delBtn.textContent = "❌";
    delBtn.addEventListener("click", () => deleteTask(task.id));

    actions.appendChild(toggleBtn);
    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    // assemble
    li.appendChild(content);
    li.appendChild(actions);
    taskList.appendChild(li);
  });

  updateProgress();
}

function updateProgress() {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;

  taskCount.textContent =
    total === 0
      ? "No tasks yet"
      : `${completed} of ${total} tasks completed`;

  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  progressBar.style.width = percent + "%";
}

// ==== Storage ====
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function loadTasks() {
  const saved = JSON.parse(localStorage.getItem("tasks"));
  if (Array.isArray(saved)) tasks = saved;
  renderTasks();
}



// ---- UPDATED toggleComplete (drop-in replacement) ----
function toggleComplete(id) {
  // find previous state
  const before = tasks.find((t) => t.id === id);

  // toggle
  tasks = tasks.map((t) =>
    t.id === id ? { ...t, completed: !t.completed } : t
  );

  // find after-change state
  const after = tasks.find((t) => t.id === id);

  saveTasks();
  renderTasks();

  // If it JUST became completed, launch celebrations
  if (before && !before.completed && after && after.completed) {
    // small delay so DOM update is visible (optional)
    setTimeout(() => {
      launchConfetti({count: 28});
      showAnimal();
    }, 120);
  }
}

// ---- Confetti launcher ----
function launchConfetti(opts = {}) {
  const count = opts.count || 20;
  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.classList.add("confetti");

    // randomize size
    const w = 6 + Math.random() * 10;
    const h = 8 + Math.random() * 12;
    el.style.width = `${w}px`;
    el.style.height = `${h}px`;
    el.style.borderRadius = `${Math.random() > 0.6 ? 2 : 20}%`;

    // random start horizontal position
    el.style.left = `${Math.random() * 100}vw`;

    // random color (nice saturated pastel-ish colors)
    const hue = Math.floor(Math.random() * 360);
    el.style.backgroundColor = `hsl(${hue}deg 70% 60%)`;

    // random rotation speed / duration
    const dur = 900 + Math.random() * 900; // ms
    el.style.animationDuration = `${dur}ms`;

    // slight horizontal drift using CSS transform (set now, final is via keyframes)
    el.style.transform = `translateY(0) rotate(${Math.random()*360}deg)`;

    // ensure non-blocking
    el.style.pointerEvents = "none";

    document.body.appendChild(el);

    // remove after animation is done
    setTimeout(() => {
      try { el.remove(); } catch(e) {}
    }, dur + 200);
  }
}

// ---- Animal / emoji popup ----
function showAnimal() {
  const animals = ["🐦", "🐧", "🦊", "🐱", "🐶", "🦋", "🐥", "🐸", "🐼"];
  const emoji = animals[Math.floor(Math.random() * animals.length)];

  const el = document.createElement("div");
  el.className = "popup-animal";
  el.textContent = emoji;

  // random horizontal spawn (keep inside viewport margins)
  const left = 8 + Math.random() * 84; // 8vw -> 92vw
  el.style.left = `${left}vw`;

  document.body.appendChild(el);

  // remove after animation ends
  setTimeout(() => {
    try { el.remove(); } catch(e) {}
  }, 1600);
}


function toggleComplete(id) {
  const before = tasks.find((t) => t.id === id);

  tasks = tasks.map((t) =>
    t.id === id ? { ...t, completed: !t.completed } : t
  );

  const after = tasks.find((t) => t.id === id);

  if (before && after) {
    if (!before.completed && after.completed) {
      exp += 10; // add exp
    } else if (before.completed && !after.completed) {
      exp = Math.max(0, exp - 10); // remove exp but never below 0
    }
  }

  saveTasks();
  updateStats();
  renderTasks();

  if (before && !before.completed && after && after.completed) {
    setTimeout(() => {
      launchConfetti();
      showAnimal();
    }, 120);
  }
}

let exp = parseInt(localStorage.getItem("exp"), 10) || 0;
const expEl = document.getElementById("exp");
const badgeEl = document.getElementById("badge");

function getBadge(expVal) {
  if (expVal >= 200) return "🦸 Pro Hero";
  if (expVal >= 100) return "🔥 Streak Master";
  if (expVal >= 50)  return "🌱 Beginner";
  return "👶 Newbie";
}

function updateStats() {
  exp = Math.max(0, exp);
  if (expEl) expEl.textContent = exp;
  if (badgeEl) badgeEl.textContent = getBadge(exp);
  localStorage.setItem("exp", String(exp));
}
