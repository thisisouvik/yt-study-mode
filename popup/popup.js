document.addEventListener('DOMContentLoaded', () => {
  const statusText = document.getElementById('status-text');
  const statusDiv = document.getElementById('status');
  const toggleBtn = document.getElementById('toggle');
  const allowMusicCheckbox = document.getElementById('allow-music');
  
  function updateStatus() {
    chrome.storage.sync.get(['enabled', 'allowMusic'], ({ enabled, allowMusic }) => {
      const isEnabled = enabled !== false;
      
      if (isEnabled) {
        statusText.textContent = 'Active';
        statusDiv.className = 'status active';
        toggleBtn.textContent = 'Disable';
      } else {
        statusText.textContent = 'Inactive';
        statusDiv.className = 'status inactive';
        toggleBtn.textContent = 'Enable';
      }
      
      allowMusicCheckbox.checked = allowMusic === true;
    });
  }
  
  toggleBtn.onclick = () => {
    chrome.storage.sync.get(['enabled'], ({ enabled }) => {
      const newState = !(enabled !== false);
      chrome.storage.sync.set({ enabled: newState }, () => {
        updateStatus();
        chrome.tabs.query({ url: 'https://www.youtube.com/*' }, (tabs) => {
          tabs.forEach(tab => chrome.tabs.reload(tab.id));
        });
      });
    });
  };
  
  allowMusicCheckbox.onchange = () => {
    chrome.storage.sync.set({ allowMusic: allowMusicCheckbox.checked }, () => {
      chrome.tabs.query({ url: 'https://www.youtube.com/*' }, (tabs) => {
        tabs.forEach(tab => chrome.tabs.reload(tab.id));
      });
    });
  };
  
  updateStatus();
});
