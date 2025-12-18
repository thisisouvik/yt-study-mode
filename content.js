chrome.storage.sync.get("enabled", ({ enabled }) => {
  if (enabled === false) return;

  const hideSelectors = [
    "ytd-rich-grid-renderer",
    "ytd-reel-shelf-renderer",
    "#related",
    "ytd-comments",
    "ytd-mini-guide-renderer"
  ];

  const hideDistractions = () => {
    hideSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        el.style.display = "none";
      });
    });
  };

  setInterval(hideDistractions, 1000);
});
