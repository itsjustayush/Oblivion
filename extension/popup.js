// Oblivion Chrome Extension Popup Logic
document.addEventListener('DOMContentLoaded', () => {
  const timerDisplay = document.getElementById('timerDisplay');
  const toggleBtn = document.getElementById('toggleBtn');
  const resetBtn = document.getElementById('resetBtn');
  const openAppBtn = document.getElementById('openAppBtn');
  const shieldBadge = document.getElementById('shieldBadge');
  const blockNotificationsToggle = document.getElementById('blockNotificationsToggle');
  const keepAwakeToggle = document.getElementById('keepAwakeToggle');
  const modeTabs = document.querySelectorAll('.mode-tab');
  const newTaskInput = document.getElementById('newTaskInput');
  const addTaskBtn = document.getElementById('addTaskBtn');
  const taskList = document.getElementById('taskList');

  let currentMode = 'focus';
  let running = false;
  let remaining = 25 * 60;
  let blockNotifications = true;
  let keepAwake = true;
  let tasks = [];

  // Load saved state
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['oblivion_timer', 'oblivion_tasks'], (res) => {
      if (res.oblivion_timer && typeof res.oblivion_timer === 'object') {
        const state = res.oblivion_timer;
        currentMode = ['focus', 'short', 'long'].includes(state.mode) ? state.mode : 'focus';
        running = state.running === true;
        remaining = Number.isFinite(state.remaining) ? Math.max(0, Math.min(24 * 60 * 60, state.remaining)) : 25 * 60;
        blockNotifications = state.blockNotifications !== false;
        keepAwake = state.keepAwake !== false;

        updateUI();
      }
      if (Array.isArray(res.oblivion_tasks)) {
        tasks = res.oblivion_tasks
          .filter((task) => task && typeof task.text === 'string')
          .slice(0, 200)
          .map((task) => ({ text: task.text.slice(0, 500), completed: task.completed === true }));
        renderTasks();
      }
    });
  }

  function updateUI() {
    // Mode tabs
    modeTabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.mode === currentMode);
    });

    // Time display
    const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
    const secs = String(remaining % 60).padStart(2, '0');
    timerDisplay.textContent = `${mins}:${secs}`;

    // Toggle button
    toggleBtn.textContent = running ? 'Pause' : 'Start Focus';
    toggleBtn.style.background = running ? '#ef4444' : '#ffffff';
    toggleBtn.style.color = running ? '#ffffff' : '#09090b';

    // Shield badge
    shieldBadge.style.display = (running && blockNotifications) ? 'flex' : 'none';

    blockNotificationsToggle.checked = blockNotifications;
    keepAwakeToggle.checked = keepAwake;
  }

  function saveState() {
    const state = {
      mode: currentMode,
      running,
      remaining,
      blockNotifications,
      keepAwake,
      lastUpdated: Date.now()
    };
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ oblivion_timer: state });
      chrome.runtime.sendMessage({ type: 'TIMER_UPDATE', state });
    }
    updateUI();
  }

  // Timer Tick Interval in Popup
  setInterval(() => {
    if (running && remaining > 0) {
      remaining--;
      updateUI();
    } else if (running && remaining === 0) {
      running = false;
      if (typeof chrome !== 'undefined' && chrome.notifications) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icon.png',
          title: 'Oblivion Focus Session Completed!',
          message: 'Great work! Take a short break or start another session.',
          priority: 2
        });
      }
      saveState();
    }
  }, 1000);

  // Tab mode switching
  modeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      currentMode = tab.dataset.mode;
      running = false;
      if (currentMode === 'focus') remaining = 25 * 60;
      else if (currentMode === 'short') remaining = 5 * 60;
      else if (currentMode === 'long') remaining = 15 * 60;
      saveState();
    });
  });

  // Start / Pause
  toggleBtn.addEventListener('click', () => {
    running = !running;
    saveState();
  });

  // Reset
  resetBtn.addEventListener('click', () => {
    running = false;
    if (currentMode === 'focus') remaining = 25 * 60;
    else if (currentMode === 'short') remaining = 5 * 60;
    else if (currentMode === 'long') remaining = 15 * 60;
    saveState();
  });

  // Toggles
  blockNotificationsToggle.addEventListener('change', (e) => {
    blockNotifications = e.target.checked;
    saveState();
  });

  keepAwakeToggle.addEventListener('change', (e) => {
    keepAwake = e.target.checked;
    saveState();
  });

  // Open full Web App button
  openAppBtn.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: 'https://ai.studio/build' });
    } else {
      window.open(window.location.origin, '_blank');
    }
  });

  // Tasks
  function renderTasks() {
    taskList.replaceChildren();
    tasks.forEach((task, i) => {
      const item = document.createElement('div');
      item.className = `task-item ${task.completed ? 'completed' : ''}`;

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'task-checkbox';
      checkbox.checked = task.completed === true;

      const label = document.createElement('span');
      label.style.flex = '1';
      label.textContent = task.text;

      checkbox.addEventListener('change', (e) => {
        tasks[i].completed = e.target.checked;
        saveTasks();
      });
      item.append(checkbox, label);
      taskList.appendChild(item);
    });
  }

  function saveTasks() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ oblivion_tasks: tasks });
    }
    renderTasks();
  }

  addTaskBtn.addEventListener('click', () => {
    const text = newTaskInput.value.trim();
    if (text) {
      tasks.push({ text: text.slice(0, 500), completed: false });
      newTaskInput.value = '';
      saveTasks();
    }
  });

  newTaskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      addTaskBtn.click();
    }
  });
});
