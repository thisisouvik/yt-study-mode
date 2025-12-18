// YouTube Study Mode - Block all distractions + Study Home + Autoplay control
(function() {
  'use strict';

  // Check if extension is enabled
  chrome.storage.sync.get(["enabled", "allowMusic", "whitelistChannelIds", "studyPlaylists", "studyLastVideo"], (cfg) => {
    const enabled = cfg.enabled !== false;
    if (!enabled) return;

    console.log("YouTube Study Mode: Active");
    let musicAllowed = cfg.allowMusic === true;
    let whitelistChannelIds = Array.isArray(cfg.whitelistChannelIds) ? cfg.whitelistChannelIds : [];
    let studyPlaylists = Array.isArray(cfg.studyPlaylists) ? cfg.studyPlaylists : [];
    let studyLastVideo = cfg.studyLastVideo || null;

    // Utility: determine if on Home route
    const isHomeRoute = () => {
      const p = location.pathname.replace(/\/$/, '');
      return p === '' || p === '/feed' || p === '/feed/you';
    };
    
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
      if (isHomeRoute()) {
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

    // Enforce autoplay OFF while Study Mode is enabled
    function enforceAutoplayOff() {
      try {
        const btn = document.querySelector('.ytp-autonav-toggle-button');
        if (btn && btn.getAttribute('aria-checked') === 'true') {
          btn.click();
        }
      } catch {}
      try {
        const compact = document.querySelector('ytd-compact-autoplay-renderer paper-toggle-button');
        if (compact && (compact.hasAttribute('checked') || compact.getAttribute('aria-pressed') === 'true')) {
          compact.click();
        }
      } catch {}
    }

    // Study Home Overlay
    const HOME_ID = 'yt-study-home';
    function removeStudyHome() {
      document.body.classList.remove('study-home-active');
      const existing = document.getElementById(HOME_ID);
      if (existing && existing.parentElement) existing.parentElement.removeChild(existing);
    }

    function buildContinueStudyingSection() {
      const section = document.createElement('section');
      section.className = 'study-section';
      const h = document.createElement('h2');
      h.textContent = 'Continue Studying';
      section.appendChild(h);

      if (!studyLastVideo) {
        const p = document.createElement('p');
        p.className = 'study-empty';
        p.textContent = 'No study video yet. Watch a whitelisted channel or from a saved playlist to track progress.';
        section.appendChild(p);
        return section;
      }

      const card = document.createElement('div');
      card.className = 'study-card';

      const thumb = document.createElement('img');
      if (studyLastVideo.thumbnail) thumb.src = studyLastVideo.thumbnail;
      thumb.alt = 'thumbnail';
      card.appendChild(thumb);

      const meta = document.createElement('div');
      meta.className = 'study-meta';
      const t = document.createElement('div');
      t.className = 'study-title';
      t.textContent = studyLastVideo.title || 'Last video';
      meta.appendChild(t);
      if (studyLastVideo.channelName) {
        const ch = document.createElement('div');
        ch.className = 'study-channel';
        ch.textContent = studyLastVideo.channelName;
        meta.appendChild(ch);
      }
      const btn = document.createElement('a');
      const secs = Math.max(0, Math.floor(studyLastVideo.lastTime || 0));
      const tParam = secs > 0 ? `&t=${secs}s` : '';
      btn.href = `https://www.youtube.com/watch?v=${studyLastVideo.videoId}${tParam}`;
      btn.className = 'study-btn';
      btn.textContent = secs > 0 ? 'Resume' : 'Play';
      meta.appendChild(btn);
      card.appendChild(meta);
      section.appendChild(card);
      return section;
    }

    function buildPlaylistsSection() {
      const section = document.createElement('section');
      section.className = 'study-section';
      const h = document.createElement('h2');
      h.textContent = 'Study Playlists';
      section.appendChild(h);

      if (!Array.isArray(studyPlaylists) || studyPlaylists.length === 0) {
        const p = document.createElement('p');
        p.className = 'study-empty';
        p.textContent = 'No playlists yet. Save your educational playlists to see them here.';
        section.appendChild(p);
        return section;
      }

      const list = document.createElement('div');
      list.className = 'study-list';
      studyPlaylists.slice(0, 8).forEach(pl => {
        if (!pl || !pl.playlistId) return;
        const a = document.createElement('a');
        a.className = 'study-list-item';
        a.textContent = pl.title || pl.playlistId;
        a.href = pl.url || `https://www.youtube.com/playlist?list=${pl.playlistId}`;
        list.appendChild(a);
      });
      section.appendChild(list);
      return section;
    }

    function renderStudyHome() {
      if (!isHomeRoute()) return removeStudyHome();
      document.body.classList.add('study-home-active');
      let mount = document.getElementById(HOME_ID);
      if (!mount) {
        mount = document.createElement('div');
        mount.id = HOME_ID;
        mount.className = 'study-home';
        const primary = document.getElementById('primary') || document.body;
        primary.prepend(mount);
      }
      mount.innerHTML = '';
      const title = document.createElement('h1');
      title.className = 'study-title-main';
      title.textContent = 'YouTube Study Mode';
      mount.appendChild(title);
      mount.appendChild(buildContinueStudyingSection());
      mount.appendChild(buildPlaylistsSection());
    }

    function updateHomeVisibility() {
      if (isHomeRoute()) {
        renderStudyHome();
      } else {
        removeStudyHome();
      }
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
    window.addEventListener('popstate', updateHomeVisibility);
    
    // Initial run
    hideDistractions();
    blockNavigationLinks();
    enforceAutoplayOff();
    updateHomeVisibility();
    
    // Run periodically to catch dynamically loaded content
    setInterval(() => {
      hideDistractions();
      blockNavigationLinks();
      enforceAutoplayOff();
      updateHomeVisibility();
    }, 500);
    
    // Run on DOM changes
    const observer = new MutationObserver(() => {
      hideDistractions();
      blockNavigationLinks();
      enforceAutoplayOff();
      updateHomeVisibility();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Track last watched educational video + timestamp
    let progressTimer = null;
    function getParam(name) {
      const m = new URL(location.href);
      return m.searchParams.get(name);
    }
    function currentVideoInfo() {
      const videoId = getParam('v');
      if (!videoId) return null;
      const titleEl = document.querySelector('h1.ytd-watch-metadata') || document.querySelector('h1.title');
      const title = titleEl ? titleEl.textContent.trim() : (document.title || '').replace(/ - YouTube$/, '');
      const channelLink = document.querySelector('#owner-name a, ytd-channel-name a');
      const channelName = channelLink ? channelLink.textContent.trim() : '';
      const channelHref = channelLink ? channelLink.getAttribute('href') || '' : '';
      const channelIdMatch = channelHref.match(/\/channel\/([\w-]+)/);
      const channelId = channelIdMatch ? channelIdMatch[1] : channelHref || '';
      const img = document.querySelector('link[rel="preload"][as="image"][href*="i.ytimg.com"])') || document.querySelector('ytd-player img');
      const thumbnail = img ? img.getAttribute('href') || img.getAttribute('src') : '';
      const listId = getParam('list');
      return { videoId, title, channelId, channelName, thumbnail, listId };
    }
    function isWhitelistedChannel(channelId) {
      if (!channelId) return false;
      return Array.isArray(whitelistChannelIds) && whitelistChannelIds.includes(channelId);
    }
    function isFromStudyPlaylist(listId) {
      if (!listId) return false;
      return Array.isArray(studyPlaylists) && studyPlaylists.some(p => p && p.playlistId === listId);
    }
    function attachProgressTracker() {
      const video = document.querySelector('video');
      if (!video) return;
      if (progressTimer) return;
      progressTimer = setInterval(() => {
        const info = currentVideoInfo();
        if (!info) return;
        const eligible = isWhitelistedChannel(info.channelId) || isFromStudyPlaylist(info.listId);
        if (!eligible) return;
        const lastTime = Math.floor(video.currentTime || 0);
        const payload = { ...info, lastTime, savedAt: Date.now() };
        chrome.storage.sync.set({ studyLastVideo: payload });
        studyLastVideo = payload;
      }, 5000);
    }
    attachProgressTracker();
    const trackerObserver = new MutationObserver(attachProgressTracker);
    trackerObserver.observe(document.documentElement, { childList: true, subtree: true });

    // React to storage changes (enabled/music/whitelist/playlists/lastVideo)
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'sync') return;
      if (changes.allowMusic) {
        musicAllowed = changes.allowMusic.newValue === true;
      }
      if (changes.whitelistChannelIds) {
        whitelistChannelIds = Array.isArray(changes.whitelistChannelIds.newValue) ? changes.whitelistChannelIds.newValue : [];
      }
      if (changes.studyPlaylists) {
        studyPlaylists = Array.isArray(changes.studyPlaylists.newValue) ? changes.studyPlaylists.newValue : [];
        renderStudyHome();
      }
      if (changes.studyLastVideo) {
        studyLastVideo = changes.studyLastVideo.newValue || null;
        renderStudyHome();
      }
      if (changes.enabled) {
        const nowEnabled = changes.enabled.newValue !== false;
        if (!nowEnabled) {
          removeStudyHome();
        } else {
          updateHomeVisibility();
        }
      }
    });
  });
})();
