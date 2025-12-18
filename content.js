// YouTube Study Mode - Block all distractions
(function() {
  'use strict';

  // Check if extension is enabled
  chrome.storage.sync.get(["enabled", "allowMusic"], ({ enabled, allowMusic }) => {
    if (enabled === false) return;
    
    console.log("YouTube Study Mode: Active");
    const musicAllowed = allowMusic === true;
    
    // Comprehensive list of distracting elements to hide
    const hideSelectors = [
      // Shorts
      'ytd-reel-shelf-renderer',
      'ytd-rich-shelf-renderer[is-shorts]',
      '[is-shorts]',
      'ytd-shorts',
      '#shorts-container',
      
      // Trending & Explore
      'ytd-guide-entry-renderer:has([title="Trending"])',
      'ytd-guide-entry-renderer:has([title="Explore"])',
      
      // Home page recommendations (keep only Continue Watching)
      'ytd-rich-grid-row:not(:has(ytd-rich-section-renderer))',
      'ytd-rich-item-renderer',
      
      // Sidebar recommendations on video pages
      '#related',
      '#secondary',
      
      // Comments
      'ytd-comments',
      'ytd-comments-header-renderer',
      '#comments',
      
      // End screen suggestions
      '.ytp-ce-element',
      '.ytp-endscreen-content',
      
      // Mini guide (sidebar)
      'ytd-mini-guide-renderer',
      
      // Search suggestions in homepage
      'ytd-search-refinement-card-renderer',
      
      // Notification bell distractions
      '#notification-count',
      
      // Merchandising
      'ytd-merch-shelf-renderer',
      
      // Live chat
      'ytd-live-chat-frame',
      
      // Playlist recommendations
      'ytd-playlist-panel-renderer',
      
      // Ads (additional blockers)
      '.video-ads',
      '.ytp-ad-module',
      'ytd-display-ad-renderer',
      'ytd-statement-banner-renderer',
      'ytd-banner-promo-renderer',
      'ytd-ad-slot-renderer',
      '#masthead-ad',
    ];
    
    // Add music blocking selectors if music is not allowed
    if (!musicAllowed) {
      hideSelectors.push(
        'ytd-guide-entry-renderer:has([title="Music"])',
        'ytd-rich-shelf-renderer:has([title*="Music"])',
        'ytd-rich-shelf-renderer:has([title*="music"])',
        'a[href*="/channel/UC-9-kyTW8ZkZNDHQJ6FgpwQ"]' // YouTube Music channel
      );
    }
    
    // Elements to keep visible (whitelist)
    const keepSelectors = [
      'ytd-rich-section-renderer', // Continue Watching section
      'ytd-item-section-renderer', // Your videos section
    ];
    
    function hideDistractions() {
      // Hide all distracting elements
      hideSelectors.forEach(selector => {
        try {
          document.querySelectorAll(selector).forEach(el => {
            if (!el.closest('.ytd-rich-section-renderer')) {
              el.style.display = 'none';
              el.style.visibility = 'hidden';
            }
          });
        } catch (e) {
          // Skip invalid selectors
        }
      });
      
      // Show only Continue Watching and similar study-relevant sections
      keepSelectors.forEach(selector => {
        try {
          document.querySelectorAll(selector).forEach(el => {
            el.style.display = '';
            el.style.visibility = '';
          });
        } catch (e) {
          // Skip invalid selectors
        }
      });
      
      // Hide all home page videos except Continue Watching
      if (window.location.pathname === '/' || window.location.pathname === '/feed/you') {
        const richSections = document.querySelectorAll('ytd-rich-section-renderer');
        richSections.forEach(section => {
          const title = section.querySelector('#title-text, h2');
          if (title && title.textContent.includes('Continue watching')) {
            section.style.display = '';
          }
        });
      }
      
      // Block Shorts in search results
      document.querySelectorAll('ytd-video-renderer').forEach(video => {
        const badge = video.querySelector('.badge-shape-wiz__text');
        if (badge && badge.textContent.toLowerCase().includes('short')) {
          video.style.display = 'none';
        }
      });
    }
    
    // Block navigation to Shorts, Trending, Music
    function blockNavigationLinks() {
      let selector = 'a[href*="/shorts"], a[href*="/trending"], a[href*="/feed/explore"]';
      if (!musicAllowed) {
        selector += ', a[href*="/channel/UC-9-kyTW8ZkZNDHQJ6FgpwQ"]';
      }
      document.querySelectorAll(selector).forEach(link => {
        link.style.display = 'none';
        link.style.pointerEvents = 'none';
      });
    }
    
    // Intercept and block Shorts URLs
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(state) {
      if (arguments[2] && (arguments[2].includes('/shorts/') || arguments[2].includes('/trending'))) {
        console.log('YouTube Study Mode: Blocked navigation to', arguments[2]);
        return;
      }
      return originalPushState.apply(history, arguments);
    };
    
    history.replaceState = function(state) {
      if (arguments[2] && (arguments[2].includes('/shorts/') || arguments[2].includes('/trending'))) {
        console.log('YouTube Study Mode: Blocked navigation to', arguments[2]);
        return;
      }
      return originalReplaceState.apply(history, arguments);
    };
    
    // Initial run
    hideDistractions();
    blockNavigationLinks();
    
    // Run periodically to catch dynamically loaded content
    setInterval(() => {
      hideDistractions();
      blockNavigationLinks();
    }, 500);
    
    // Run on DOM changes
    const observer = new MutationObserver(() => {
      hideDistractions();
      blockNavigationLinks();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
})();
