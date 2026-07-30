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
      if (res.oblivion_timer) {
        const state = res.oblivion_timer;
        currentMode = state.mode || 'focus';
        running = state.running || false;
        remaining = state.remaining !== undefined ? state.remaining : 25 * 60;
        blockNotifications = state.blockNotifications !== undefined ? state.blockNotifications : true;
        keepAwake = state.keepAwake !== undefined ? state.keepAwake : true;

        updateUI();
      }
      if (res.oblivion_tasks) {
        tasks = res.oblivion_tasks;
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
    taskList.innerHTML = '';
    tasks.forEach((task, i) => {
      const item = document.createElement('div');
      item.className = `task-item ${task.completed ? 'completed' : ''}`;
      item.innerHTML = `
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
        <span style="flex:1;">${task.text}</span>
      `;
      item.querySelector('.task-checkbox').addEventListener('change', (e) => {
        tasks[i].completed = e.target.checked;
        saveTasks();
      });
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
      tasks.push({ text, completed: false });
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
