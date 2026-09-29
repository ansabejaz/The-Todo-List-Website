// Exercise 3: JavaScript + DOM API — Todo List
// Group members: <Name 1>, <Name 2>, <Name 3>, <Name 4>
// (Replace the names above with your actual group members before submitting)

// ----- Element references -----
const taskInput = document.getElementById('task-input');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');
const removeLastBtn = document.getElementById('remove-last-btn');
const clearCompletedBtn = document.getElementById('clear-completed-btn');
const counter = document.getElementById('counter');
const emptyState = document.getElementById('empty-state');
const progressFill = document.getElementById('progress-fill');
const progressLabel = document.getElementById('progress-label');
const celebration = document.getElementById('celebration');
const filterRow = document.getElementById('filter-row');
const themeToggle = document.getElementById('theme-toggle');

// ----- State -----
// Each task: { id, text, completed, createdAt }
let tasks = loadTasks();
let currentFilter = 'all'; // 'all' | 'active' | 'completed'
let nextId = tasks.reduce((max, t) => Math.max(max, t.id), 0) + 1;

// ----- Toastr config (Bonus 2) -----
if (typeof toastr !== 'undefined') {
  toastr.options = {
    closeButton: true,
    progressBar: true,
    positionClass: 'toast-top-right',
    timeOut: 2200,
  };
}

function notify(type, message) {
  if (typeof toastr !== 'undefined') {
    toastr[type](message);
  } else {
    alert(message);
  }
}

// ----- Persistence -----
function loadTasks() {
  try {
    const raw = localStorage.getItem('todo-tasks');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem('todo-tasks', JSON.stringify(tasks));
  } catch (e) {
    // storage unavailable — app still works, just won't persist
  }
}

// ----- Adding a new task -----
function addTask() {
  const text = taskInput.value.trim();

  // Check that it is not empty. If empty, do nothing (but notify — Bonus 2).
  if (text === '') {
    notify('warning', 'Please enter a task first');
    return;
  }

  // Bonus 3: prevent duplicates (case-insensitive)
  const isDuplicate = tasks.some(
    (t) => t.text.toLowerCase() === text.toLowerCase()
  );
  if (isDuplicate) {
    notify('info', 'That task is already on the list');
    taskInput.value = '';
    return;
  }

  tasks.push({
    id: nextId++,
    text,
    completed: false,
    createdAt: Date.now(),
  });

  taskInput.value = '';
  taskInput.focus();

  saveTasks();
  render();
}

// ----- Toggle completed -----
function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  task.completed = !task.completed;
  saveTasks();
  render();
}

// ----- Delete a single task -----
function deleteTask(id, liElement) {
  // small exit animation before actually removing from state
  if (liElement) {
    liElement.classList.add('removing');
    setTimeout(() => {
      tasks = tasks.filter((t) => t.id !== id);
      saveTasks();
      render();
    }, 180);
  } else {
    tasks = tasks.filter((t) => t.id !== id);
    saveTasks();
    render();
  }
}

// ----- Bonus 1: Remove last task (by creation order) -----
function removeLastTask() {
  if (tasks.length === 0) {
    notify('info', 'The list is already empty');
    return;
  }
  tasks.pop();
  saveTasks();
  render();
}

// ----- Clear all completed tasks -----
function clearCompleted() {
  const hadCompleted = tasks.some((t) => t.completed);
  if (!hadCompleted) {
    notify('info', 'No completed tasks to clear');
    return;
  }
  tasks = tasks.filter((t) => !t.completed);
  saveTasks();
  render();
}

// ----- Edit a task's text (double-click to edit) -----
function startEditing(task, li) {
  const textSpan = li.querySelector('.task-text');
  const input = document.createElement('input');
  input.type = 'text';
  input.value = task.text;
  input.className = 'task-edit-input';

  li.replaceChild(input, textSpan);
  input.focus();
  input.select();

  const finishEdit = (commit) => {
    if (commit) {
      const newText = input.value.trim();
      if (newText === '') {
        notify('warning', 'Task text cannot be empty');
      } else {
        task.text = newText;
        saveTasks();
      }
    }
    render();
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') finishEdit(true);
    if (e.key === 'Escape') finishEdit(false);
  });
  input.addEventListener('blur', () => finishEdit(true));
  input.addEventListener('click', (e) => e.stopPropagation());
}

// ----- Reorder tasks -----
function moveTask(id, direction) {
  const index = tasks.findIndex((t) => t.id === id);
  const targetIndex = index + direction;
  if (index === -1 || targetIndex < 0 || targetIndex >= tasks.length) return;
  [tasks[index], tasks[targetIndex]] = [tasks[targetIndex], tasks[index]];
  saveTasks();
  render();
}

// ----- Filtering -----
function getFilteredTasks() {
  if (currentFilter === 'active') return tasks.filter((t) => !t.completed);
  if (currentFilter === 'completed') return tasks.filter((t) => t.completed);
  return tasks;
}

filterRow.addEventListener('click', (e) => {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;
  currentFilter = btn.dataset.filter;
  [...filterRow.querySelectorAll('.filter-btn')].forEach((b) =>
    b.classList.toggle('active', b === btn)
  );
  render();
});

// ----- Rendering -----
function render() {
  const filtered = getFilteredTasks();

  taskList.innerHTML = '';

  filtered.forEach((task, index) => {
    const li = document.createElement('li');
    li.className = task.completed ? 'completed' : '';
    li.dataset.id = task.id;

    // Numbered badge — reflects current position in the visible list
    const number = document.createElement('span');
    number.className = 'task-number';
    number.textContent = index + 1;

    const textSpan = document.createElement('span');
    textSpan.className = 'task-text';
    textSpan.textContent = task.text;
    textSpan.title = `Added ${new Date(task.createdAt).toLocaleString()}`;

    const upBtn = document.createElement('button');
    upBtn.className = 'task-move';
    upBtn.textContent = '▲';
    upBtn.title = 'Move up';
    upBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      moveTask(task.id, -1);
    });

    const downBtn = document.createElement('button');
    downBtn.className = 'task-move';
    downBtn.textContent = '▼';
    downBtn.title = 'Move down';
    downBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      moveTask(task.id, 1);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'task-delete';
    deleteBtn.textContent = '✕';
    deleteBtn.title = 'Delete task';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteTask(task.id, li);
    });

    // Click toggles completed
    li.addEventListener('click', () => toggleTask(task.id));

    // Double-click to edit
    textSpan.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      startEditing(task, li);
    });

    li.appendChild(number);
    li.appendChild(textSpan);
    li.appendChild(upBtn);
    li.appendChild(downBtn);
    li.appendChild(deleteBtn);

    taskList.appendChild(li);
  });

  emptyState.style.display = filtered.length === 0 ? 'block' : 'none';

  updateCounter();
}

// ----- Updating the counter, progress bar, and celebration -----
function updateCounter() {
  const total = tasks.length;
  const remaining = tasks.filter((t) => !t.completed).length;
  const completed = total - remaining;

  counter.textContent = `Remaining: ${remaining} | Total: ${total}`;

  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  progressFill.style.width = `${percent}%`;
  progressLabel.textContent = `${percent}%`;

  celebration.style.display = total > 0 && remaining === 0 ? 'block' : 'none';
}

// ----- Theme toggle -----
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('todo-theme', theme);
}

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

// ----- Event listeners -----
addBtn.addEventListener('click', addTask);

taskInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    addTask();
  }
});

removeLastBtn.addEventListener('click', removeLastTask);
clearCompletedBtn.addEventListener('click', clearCompleted);

// ----- Init -----
applyTheme(localStorage.getItem('todo-theme') || 'light');
render();
