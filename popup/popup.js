document.addEventListener('DOMContentLoaded', () => {
  const $ = (id) => document.getElementById(id);
  const modeToggle = $('mode-toggle');
  const allowedSubscribed = $('allowedSubscribed');
  const allowedWhitelisted = $('allowedWhitelisted');
  const playlistsOnly = $('playlistsOnly');
  const hideComments = $('hideComments');
  const hideRecommendations = $('hideRecommendations');
  const disableAutoplay = $('disableAutoplay');
  const studyTime = $('studyTime');
  const dailyLimit = $('dailyLimit');
  const focusToggle = $('focus-toggle');
  const examToggle = $('exam-toggle');

  function setModePill(enabled) {
    if (enabled) {
      modeToggle.textContent = 'ON';
      modeToggle.classList.remove('off');
    } else {
      modeToggle.textContent = 'OFF';
      modeToggle.classList.add('off');
    }
  }

  function minutesStr(mins) { return `${Math.max(0, Math.floor(mins||0))} min`; }
  function todayKey() { return new Date().toISOString().slice(0,10); }

  function loadState() {
    chrome.storage.sync.get([
      'enabled', 'allowMusic',
      'allowedSubscribed', 'allowedWhitelisted', 'playlistsOnly',
      'hideComments', 'hideRecommendations', 'disableAutoplay',
      'studyStats', 'dailyLimitMinutes', 'focusSessionActive',
      'examMode'
    ], (cfg) => {
      const enabled = cfg.enabled !== false;
      setModePill(enabled);

      allowedSubscribed.checked = cfg.allowedSubscribed === true;
      allowedWhitelisted.checked = cfg.allowedWhitelisted !== false; // default true
      playlistsOnly.checked = cfg.playlistsOnly === true;

      hideComments.checked = cfg.hideComments !== false; // default true
      hideRecommendations.checked = cfg.hideRecommendations !== false; // default true
      disableAutoplay.checked = cfg.disableAutoplay !== false; // default true

      const stats = cfg.studyStats || {};
      const today = stats[todayKey()] || 0;
      studyTime.textContent = minutesStr(today);

      dailyLimit.value = cfg.dailyLimitMinutes || 120;

      const focusActive = cfg.focusSessionActive === true;
      focusToggle.textContent = focusActive ? 'Stop Focus Session' : 'Start Focus Session';

      const exam = cfg.examMode === true;
      examToggle.textContent = exam ? 'UNLOCK YOUTUBE' : 'LOCK YOUTUBE';
      examToggle.classList.toggle('danger', !exam);
    });
  }

  modeToggle.onclick = () => {
    chrome.storage.sync.get(['enabled'], ({ enabled }) => {
      const newState = !(enabled !== false);
      chrome.storage.sync.set({ enabled: newState }, () => {
        setModePill(newState);
        chrome.tabs.query({ url: 'https://www.youtube.com/*' }, (tabs) => tabs.forEach(t => chrome.tabs.reload(t.id)));
      });
    });
  };

  const bindCheck = (el, key) => el.addEventListener('change', () => {
    const obj = {}; obj[key] = el.checked; chrome.storage.sync.set(obj, () => {
      chrome.tabs.query({ url: 'https://www.youtube.com/*' }, (tabs) => tabs.forEach(t => chrome.tabs.reload(t.id)));
    });
  });

  bindCheck(allowedSubscribed, 'allowedSubscribed');
  bindCheck(allowedWhitelisted, 'allowedWhitelisted');
  bindCheck(playlistsOnly, 'playlistsOnly');
  bindCheck(hideComments, 'hideComments');
  bindCheck(hideRecommendations, 'hideRecommendations');
  bindCheck(disableAutoplay, 'disableAutoplay');

  dailyLimit.addEventListener('change', () => {
    const val = Math.max(10, parseInt(dailyLimit.value || '120', 10));
    chrome.storage.sync.set({ dailyLimitMinutes: val });
  });

  focusToggle.addEventListener('click', () => {
    chrome.storage.sync.get(['focusSessionActive'], ({ focusSessionActive }) => {
      const newVal = !(focusSessionActive === true);
      chrome.storage.sync.set({ focusSessionActive: newVal, focusStartAt: newVal ? Date.now() : null }, () => {
        focusToggle.textContent = newVal ? 'Stop Focus Session' : 'Start Focus Session';
      });
    });
  });

  examToggle.addEventListener('click', () => {
    chrome.storage.sync.get(['examMode'], ({ examMode }) => {
      const newVal = !(examMode === true);
      chrome.storage.sync.set({ examMode: newVal }, () => {
        loadState();
        chrome.tabs.query({ url: 'https://www.youtube.com/*' }, (tabs) => tabs.forEach(t => chrome.tabs.reload(t.id)));
      });
    });
  });

  loadState();
});
