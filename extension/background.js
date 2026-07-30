// Oblivion Chrome Extension Service Worker
// Manages Notification Blocking (Do Not Disturb) & Background Timer Ticks

let timerState = {
  running: false,
  remaining: 25 * 60,
  mode: 'focus',
  blockNotifications: true,
  keepAwake: true
};

// Initialize & Load stored state
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['oblivion_timer'], (res) => {
    if (res.oblivion_timer) {
      timerState = res.oblivion_timer;
    }
    updateBadge();
  });
});

// Alarm tick every 1 minute when popup is closed
chrome.alarms.create('oblivion_tick', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'oblivion_tick') {
    chrome.storage.local.get(['oblivion_timer'], (res) => {
      if (res.oblivion_timer) {
        timerState = res.oblivion_timer;
        if (timerState.running && timerState.remaining > 60) {
          timerState.remaining -= 60;
          chrome.storage.local.set({ oblivion_timer: timerState });
          updateBadge();
        }
      }
    });
  }
});

// Handle incoming messages from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'TIMER_UPDATE' && msg.state) {
    timerState = msg.state;
    updateBadge();
  }
});

// DO NOT DISTURB / NOTIFICATION BLOCKER LOGIC
// Clears incoming Chrome notifications automatically while in active Focus mode
chrome.notifications.onCreated.addListener((notificationId) => {
  chrome.storage.local.get(['oblivion_timer'], (res) => {
    const state = res.oblivion_timer || timerState;
    if (state.running && state.blockNotifications && state.mode === 'focus') {
      // Clear notification immediately to enforce Do Not Disturb Focus Shield
      chrome.notifications.clear(notificationId, (wasCleared) => {
        console.log(`[Oblivion Shield] Cleared notification ${notificationId}: ${wasCleared}`);
      });
    }
  });
});

function updateBadge() {
  if (timerState.running) {
    const mins = Math.ceil(timerState.remaining / 60);
    chrome.action.setBadgeText({ text: `${mins}m` });
    chrome.action.setBadgeBackgroundColor({ color: timerState.blockNotifications ? '#34d399' : '#f97316' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}
