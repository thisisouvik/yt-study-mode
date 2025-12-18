(function() {
  'use strict';

  // Helpers
  function getParam(name) {
    try {
      var u = new URL(location.href);
      return u.searchParams.get(name);
    } catch (_) { return null; }
  }
  function isHomeRoute() {
    var p = (location.pathname || '/').replace(/\/$/, '');
    return p === '' || p === '/' || p === '/feed' || p === '/feed/you';
  }

  // State
  chrome.storage.sync.get([
    'enabled', 'allowMusic',
    'whitelistChannelIds', 'studyPlaylists', 'studyLastVideo',
    'hideComments', 'hideRecommendations', 'disableAutoplay',
    'examMode', 'allowedWhitelisted', 'playlistsOnly'
  ], function(cfg) {
    var enabled = cfg.enabled !== false;
    var active = enabled;
    if (!enabled) { document.body.classList.remove('study-mode-active'); return; }

    var musicAllowed = cfg.allowMusic === true;
    var whitelistChannelIds = Array.isArray(cfg.whitelistChannelIds) ? cfg.whitelistChannelIds : [];
    var studyPlaylists = Array.isArray(cfg.studyPlaylists) ? cfg.studyPlaylists : [];
    var studyLastVideo = cfg.studyLastVideo || null;
    var hideCommentsPref = cfg.hideComments !== false; // default true
    var hideRecsPref = cfg.hideRecommendations !== false; // default true
    var disableAutoplayPref = cfg.disableAutoplay !== false; // default true
    var examMode = cfg.examMode === true;
    var allowedWhitelisted = cfg.allowedWhitelisted !== false; // default true
    var playlistsOnly = cfg.playlistsOnly === true;

    console.log('YouTube Study Mode: Active');
    document.body.classList.add('study-mode-active');

    // Eligibility helpers
    function isWhitelistedChannel(channelId) {
      if (!channelId) return false;
      return Array.isArray(whitelistChannelIds) && whitelistChannelIds.indexOf(channelId) !== -1;
    }
    function isFromStudyPlaylist(listId) {
      if (!listId) return false;
      return Array.isArray(studyPlaylists) && studyPlaylists.some(function(p){ return p && p.playlistId === listId; });
    }
    function currentVideoInfo() {
      var videoId = getParam('v');
      if (!videoId) return null;
      var titleEl = document.querySelector('h1.ytd-watch-metadata') || document.querySelector('h1.title');
      var title = titleEl ? titleEl.textContent.trim() : (document.title || '').replace(/ - YouTube$/, '');
      var channelLink = document.querySelector('#owner-name a, ytd-channel-name a');
      var channelName = channelLink ? channelLink.textContent.trim() : '';
      var channelHref = channelLink ? (channelLink.getAttribute('href') || '') : '';
      var match = channelHref.match(/\/channel\/([\w-]+)/);
      var channelId = match ? match[1] : channelHref || '';
      var imgEl = document.querySelector('link[rel="preload"][as="image"][href*="i.ytimg.com"]') || document.querySelector('ytd-player img');
      var thumbnail = imgEl ? (imgEl.getAttribute('href') || imgEl.getAttribute('src')) : '';
      var listId = getParam('list');
      return { videoId: videoId, title: title, channelId: channelId, channelName: channelName, thumbnail: thumbnail, listId: listId };
    }
    function isEligible(info) {
      if (!info) return false;
      var eligible = isWhitelistedChannel(info.channelId) || isFromStudyPlaylist(info.listId);
      if (playlistsOnly) eligible = isFromStudyPlaylist(info.listId);
      if (!allowedWhitelisted) eligible = isFromStudyPlaylist(info.listId);
      return !!eligible;
    }

    // Hide distractions
    function hideDistractions() {
      if (!active) return;
      var selectors = [];
      // Shorts
      selectors.push('ytd-reel-shelf-renderer','ytd-rich-shelf-renderer[is-shorts]','[is-shorts]','ytd-shorts','#shorts-container');
      // Trending & Explore
      selectors.push('ytd-guide-entry-renderer:has([title="Trending"])','ytd-guide-entry-renderer:has([title="Explore"])');
      // Home grid (non section)
      selectors.push('ytd-rich-grid-row:not(:has(ytd-rich-section-renderer))','ytd-rich-item-renderer');
      // Recommendations (conditional)
      if (hideRecsPref) { selectors.push('#related','#secondary'); }
      // Comments (conditional)
      if (hideCommentsPref) { selectors.push('ytd-comments','ytd-comments-header-renderer','#comments'); }
      // End screen
      selectors.push('.ytp-ce-element','.ytp-endscreen-content');
      // Mini guide
      selectors.push('ytd-mini-guide-renderer');
      // Search refinement
      selectors.push('ytd-search-refinement-card-renderer');
      // Notifications
      selectors.push('#notification-count');
      // Merch
      selectors.push('ytd-merch-shelf-renderer');
      // Live chat
      selectors.push('ytd-live-chat-frame');
      // Playlist panel
      selectors.push('ytd-playlist-panel-renderer');
      // Ads
      selectors.push('.video-ads','.ytp-ad-module','ytd-display-ad-renderer','ytd-statement-banner-renderer','ytd-banner-promo-renderer','ytd-ad-slot-renderer','#masthead-ad');
      // Music (conditional)
      if (!musicAllowed) {
        selectors.push('ytd-guide-entry-renderer:has([title="Music"])');
        selectors.push('ytd-rich-shelf-renderer:has([title*="Music"])');
        selectors.push('ytd-rich-shelf-renderer:has([title*="music"])');
        selectors.push('a[href*="/channel/UC-9-kyTW8ZkZNDHQJ6FgpwQ"]');
      }
      // Apply
      selectors.forEach(function(selector){
        try {
          document.querySelectorAll(selector).forEach(function(el){
            if (!el.closest('.ytd-rich-section-renderer')) {
              el.style.display = 'none';
              el.style.visibility = 'hidden';
            }
          });
        } catch (_) {}
      });
      // Keep Continue Watching sections
      ['ytd-rich-section-renderer','ytd-item-section-renderer'].forEach(function(selector){
        try { document.querySelectorAll(selector).forEach(function(el){ el.style.display=''; el.style.visibility=''; }); } catch(_){ }
      });
      // Home only: show Continue watching sections
      if (isHomeRoute()) {
        var richSections = document.querySelectorAll('ytd-rich-section-renderer');
        richSections.forEach(function(section){
          var title = section.querySelector('#title-text, h2');
          if (title && /Continue watching/i.test(title.textContent)) section.style.display='';
        });
      }
      // Hide shorts in search
      document.querySelectorAll('ytd-video-renderer').forEach(function(video){
        var badge = video.querySelector('.badge-shape-wiz__text');
        if (badge && badge.textContent.toLowerCase().indexOf('short') !== -1) video.style.display='none';
      });
    }

    // Navigation blocks
    function blockNavigationLinks() {
      if (!active) return;
      var selector = 'a[href*="/shorts"], a[href*="/trending"], a[href*="/feed/explore"]';
      if (!musicAllowed) selector += ', a[href*="/channel/UC-9-kyTW8ZkZNDHQJ6FgpwQ"]';
      document.querySelectorAll(selector).forEach(function(link){
        link.style.display='none';
        link.style.pointerEvents='none';
      });
    }
    var originalPushState = history.pushState;
    var originalReplaceState = history.replaceState;
    history.pushState = function(state){
      if (!active) return originalPushState.apply(history, arguments);
      if (arguments[2] && (arguments[2].indexOf('/shorts/')!==-1 || arguments[2].indexOf('/trending')!==-1)) return;
      return originalPushState.apply(history, arguments);
    };
    history.replaceState = function(state){
      if (!active) return originalReplaceState.apply(history, arguments);
      if (arguments[2] && (arguments[2].indexOf('/shorts/')!==-1 || arguments[2].indexOf('/trending')!==-1)) return;
      return originalReplaceState.apply(history, arguments);
    };
    window.addEventListener('popstate', function(){ updateHomeVisibility(); enforceExamMode(); });

    // Autoplay enforcement
    function enforceAutoplayOff() {
      if (!active) return;
      if (!disableAutoplayPref) return;
      try {
        var btn = document.querySelector('.ytp-autonav-toggle-button');
        if (btn && btn.getAttribute('aria-checked') === 'true') btn.click();
      } catch(_){}
      try {
        var compact = document.querySelector('ytd-compact-autoplay-renderer paper-toggle-button');
        if (compact && (compact.hasAttribute('checked') || compact.getAttribute('aria-pressed') === 'true')) compact.click();
      } catch(_){}
    }

    // Study Home overlay
    var HOME_ID = 'yt-study-home';
    function removeStudyHome(){ document.body.classList.remove('study-home-active'); var x=document.getElementById(HOME_ID); if (x&&x.parentElement) x.parentElement.removeChild(x); }
    function buildContinueStudyingSection(){
      var section = document.createElement('section'); section.className='study-section';
      var h = document.createElement('h2'); h.textContent='Continue Studying'; section.appendChild(h);
      if (!studyLastVideo) { var p=document.createElement('p'); p.className='study-empty'; p.textContent='No study video yet. Watch a whitelisted channel or from a saved playlist to track progress.'; section.appendChild(p); return section; }
      var card = document.createElement('div'); card.className='study-card';
      var thumb=document.createElement('img'); if (studyLastVideo.thumbnail) thumb.src=studyLastVideo.thumbnail; thumb.alt='thumbnail'; card.appendChild(thumb);
      var meta=document.createElement('div'); meta.className='study-meta';
      var t=document.createElement('div'); t.className='study-title'; t.textContent=studyLastVideo.title||'Last video'; meta.appendChild(t);
      if (studyLastVideo.channelName){ var ch=document.createElement('div'); ch.className='study-channel'; ch.textContent=studyLastVideo.channelName; meta.appendChild(ch); }
      var btn=document.createElement('a'); var secs=Math.max(0,Math.floor(studyLastVideo.lastTime||0)); var tParam=secs>0?'&t='+secs+'s':''; btn.href='https://www.youtube.com/watch?v='+studyLastVideo.videoId+tParam; btn.className='study-btn'; btn.textContent=secs>0?'Resume':'Play'; meta.appendChild(btn);
      card.appendChild(meta); section.appendChild(card); return section;
    }
    function buildPlaylistsSection(){
      var section=document.createElement('section'); section.className='study-section';
      var h=document.createElement('h2'); h.textContent='Study Playlists'; section.appendChild(h);
      if (!Array.isArray(studyPlaylists) || studyPlaylists.length===0){ var p=document.createElement('p'); p.className='study-empty'; p.textContent='No playlists yet. Save your educational playlists to see them here.'; section.appendChild(p); return section; }
      var list=document.createElement('div'); list.className='study-list';
      studyPlaylists.slice(0,8).forEach(function(pl){ if(!pl||!pl.playlistId) return; var a=document.createElement('a'); a.className='study-list-item'; a.textContent=pl.title||pl.playlistId; a.href=pl.url||('https://www.youtube.com/playlist?list='+pl.playlistId); list.appendChild(a); });
      section.appendChild(list); return section;
    }
    function renderStudyHome(){
      if (!active) return removeStudyHome();
      if (!isHomeRoute()) return removeStudyHome();
      document.body.classList.add('study-home-active');
      var mount=document.getElementById(HOME_ID);
      if (!mount){ mount=document.createElement('div'); mount.id=HOME_ID; mount.className='study-home'; var primary=document.getElementById('primary')||document.body; primary.prepend(mount); }
      mount.innerHTML='';
      var title=document.createElement('h1'); title.className='study-title-main'; title.textContent='YouTube Study Mode'; mount.appendChild(title);
      mount.appendChild(buildContinueStudyingSection());
      mount.appendChild(buildPlaylistsSection());
    }
    function updateHomeVisibility(){ if (!active) { removeStudyHome(); return; } if (isHomeRoute()) renderStudyHome(); else removeStudyHome(); }

    // Exam Mode (hard lock)
    var EXAM_ID='yt-exam-lock';
    function ensureExamOverlay(){
      var overlay=document.getElementById(EXAM_ID);
      if (!overlay){ overlay=document.createElement('div'); overlay.id=EXAM_ID; overlay.style.position='fixed'; overlay.style.inset='0'; overlay.style.zIndex='2147483647'; overlay.style.background='rgba(0,0,0,0.85)'; overlay.style.display='flex'; overlay.style.flexDirection='column'; overlay.style.alignItems='center'; overlay.style.justifyContent='center'; overlay.style.color='#fff'; overlay.style.textAlign='center'; overlay.style.gap='16px'; document.documentElement.appendChild(overlay); }
      overlay.innerHTML='';
      var title=document.createElement('div'); title.style.fontSize='22px'; title.style.fontWeight='800'; title.textContent='YouTube is locked.'; overlay.appendChild(title);
      var subtitle=document.createElement('div'); subtitle.style.fontSize='16px'; subtitle.style.opacity='0.9'; subtitle.textContent='Focus on your exam preparation.'; overlay.appendChild(subtitle);
      var allowedWrap=document.createElement('div'); allowedWrap.style.display='flex'; allowedWrap.style.flexDirection='column'; allowedWrap.style.gap='8px'; allowedWrap.style.marginTop='8px';
      if (studyLastVideo && isEligible(studyLastVideo)){
        var secs=Math.max(0,Math.floor(studyLastVideo.lastTime||0)); var tParam=secs>0?'&t='+secs+'s':'';
        var resume=document.createElement('a'); resume.href='https://www.youtube.com/watch?v='+studyLastVideo.videoId+tParam; resume.textContent='Resume last study video'; resume.style.display='inline-block'; resume.style.padding='10px 14px'; resume.style.borderRadius='8px'; resume.style.background='#1976d2'; resume.style.color='#fff'; resume.style.textDecoration='none'; resume.style.fontWeight='700'; allowedWrap.appendChild(resume);
      }
      if (Array.isArray(studyPlaylists) && studyPlaylists.length>0){ var list=document.createElement('div'); list.style.display='grid'; list.style.gridTemplateColumns='repeat(auto-fill, minmax(200px, 1fr))'; list.style.gap='8px';
        studyPlaylists.slice(0,6).forEach(function(pl){ if(!pl||!pl.playlistId) return; var a=document.createElement('a'); a.href=pl.url||('https://www.youtube.com/playlist?list='+pl.playlistId); a.textContent=pl.title||pl.playlistId; a.style.display='block'; a.style.padding='8px 10px'; a.style.borderRadius='6px'; a.style.background='#2c2c2c'; a.style.color='#fff'; a.style.textDecoration='none'; list.appendChild(a); });
        allowedWrap.appendChild(list);
      }
      if (allowedWrap.childElementCount>0) overlay.appendChild(allowedWrap);
      overlay.style.pointerEvents='all';
      return overlay;
    }
    function removeExamOverlay(){ var x=document.getElementById(EXAM_ID); if (x&&x.parentElement) x.parentElement.removeChild(x); }
    function enforceExamMode(){
      if (!active || !examMode){ removeExamOverlay(); document.documentElement.style.pointerEvents=''; return; }
      var vid=document.querySelector('video'); if (vid && !vid.paused){ try{ vid.pause(); }catch(_){}}
      var path=location.pathname||''; var onWatch=path.indexOf('/watch')!==-1; var info=onWatch?currentVideoInfo():null; var eligible=onWatch?isEligible(info):false;
      if (onWatch && eligible){ document.documentElement.style.pointerEvents=''; removeExamOverlay(); }
      else { var overlay=ensureExamOverlay(); document.documentElement.style.pointerEvents='none'; overlay.style.pointerEvents='all'; }
    }

    // Initial run
    hideDistractions();
    blockNavigationLinks();
    enforceAutoplayOff();
    updateHomeVisibility();
    enforceExamMode();

    // Periodic reinforce (SPA)
    setInterval(function(){ if (!active) return; hideDistractions(); blockNavigationLinks(); enforceAutoplayOff(); updateHomeVisibility(); enforceExamMode(); }, 500);

    // DOM changes
    var observer = new MutationObserver(function(){ if (!active) return; hideDistractions(); blockNavigationLinks(); enforceAutoplayOff(); updateHomeVisibility(); enforceExamMode(); });
    observer.observe(document.body, { childList: true, subtree: true });

    // Progress + Study time tracking
    var progressTimer = null;
    var studyTimeTimer = null;
    function attachProgressTracker(){
      var video = document.querySelector('video');
      if (!video) return;
      if (!progressTimer){
        progressTimer = setInterval(function(){
          var info = currentVideoInfo(); if (!info) return;
          var eligible = isEligible(info); if (!eligible) return;
          var lastTime = Math.floor(video.currentTime || 0);
          var payload = { videoId: info.videoId, title: info.title, channelId: info.channelId, channelName: info.channelName, thumbnail: info.thumbnail, listId: info.listId, lastTime: lastTime, savedAt: Date.now() };
          chrome.storage.sync.set({ studyLastVideo: payload });
          studyLastVideo = payload;
        }, 5000);
      }
      if (!studyTimeTimer){
        studyTimeTimer = setInterval(function(){
          var info=currentVideoInfo(); if (!info) return; if (video.paused) return;
          var eligible=isEligible(info); if (!eligible) return;
          var key = new Date().toISOString().slice(0,10);
          chrome.storage.sync.get(['studyStats'], function(d){ var stats=d.studyStats||{}; stats[key]=(stats[key]||0)+1; chrome.storage.sync.set({ studyStats: stats }); });
        }, 60000);
      }
    }
    attachProgressTracker();
    var trackerObserver = new MutationObserver(attachProgressTracker);
    trackerObserver.observe(document.documentElement, { childList: true, subtree: true });

    // React to storage changes
    chrome.storage.onChanged.addListener(function(changes, area){
      if (area !== 'sync') return;
      if (changes.allowMusic) musicAllowed = changes.allowMusic.newValue === true;
      if (changes.whitelistChannelIds) whitelistChannelIds = Array.isArray(changes.whitelistChannelIds.newValue) ? changes.whitelistChannelIds.newValue : [];
      if (changes.studyPlaylists) { studyPlaylists = Array.isArray(changes.studyPlaylists.newValue) ? changes.studyPlaylists.newValue : []; renderStudyHome(); }
      if (changes.studyLastVideo) { studyLastVideo = changes.studyLastVideo.newValue || null; renderStudyHome(); }
      if (changes.hideComments) hideCommentsPref = changes.hideComments.newValue !== false;
      if (changes.hideRecommendations) hideRecsPref = changes.hideRecommendations.newValue !== false;
      if (changes.disableAutoplay) disableAutoplayPref = changes.disableAutoplay.newValue !== false;
      if (changes.examMode) { examMode = changes.examMode.newValue === true; enforceExamMode(); }
      if (changes.allowedWhitelisted) allowedWhitelisted = changes.allowedWhitelisted.newValue !== false;
      if (changes.playlistsOnly) playlistsOnly = changes.playlistsOnly.newValue === true;
      if (changes.enabled) {
        var nowEnabled = changes.enabled.newValue !== false;
        active = nowEnabled;
        if (!nowEnabled) {
          document.body.classList.remove('study-mode-active');
          removeStudyHome(); removeExamOverlay();
          // Restore any inline hidden elements
          try {
            ['ytd-reel-shelf-renderer','ytd-rich-shelf-renderer[is-shorts]','[is-shorts]','ytd-shorts','#shorts-container','#related','#secondary','ytd-comments','ytd-comments-header-renderer','#comments','.ytp-ce-element','.ytp-endscreen-content','ytd-mini-guide-renderer','ytd-search-refinement-card-renderer','#notification-count','ytd-merch-shelf-renderer','ytd-live-chat-frame','ytd-playlist-panel-renderer','.video-ads','.ytp-ad-module','ytd-display-ad-renderer','ytd-statement-banner-renderer','ytd-banner-promo-renderer','ytd-ad-slot-renderer','#masthead-ad','ytd-in-feed-ad-layout-renderer','ytd-promoted-sparkles-web-renderer','ytd-rich-grid-row:not(:has(ytd-rich-section-renderer))','ytd-rich-item-renderer'].forEach(function(sel){
              document.querySelectorAll(sel).forEach(function(el){ el.style.display=''; el.style.visibility=''; });
            });
          } catch(_){}
        } else {
          document.body.classList.add('study-mode-active');
          updateHomeVisibility(); enforceExamMode();
        }
      }
    });
  });
})();
(function() {
  'use strict';

  // Check if extension is enabled
  chrome.storage.sync.get(["enabled", "allowMusic", "whitelistChannelIds", "studyPlaylists", "studyLastVideo", "hideComments", "hideRecommendations", "disableAutoplay", "examMode", "allowedWhitelisted", "playlistsOnly"], (cfg) => {
    const enabled = cfg.enabled !== false;
    if (!enabled) return;

    console.log("YouTube Study Mode: Active");
    let musicAllowed = cfg.allowMusic === true;
    let whitelistChannelIds = Array.isArray(cfg.whitelistChannelIds) ? cfg.whitelistChannelIds : [];
    let studyPlaylists = Array.isArray(cfg.studyPlaylists) ? cfg.studyPlaylists : [];
    let studyLastVideo = cfg.studyLastVideo || null;
    let hideCommentsPref = cfg.hideComments !== false; // default true
    let hideRecsPref = cfg.hideRecommendations !== false; // default true
    let disableAutoplayPref = cfg.disableAutoplay !== false; // default true
    let examMode = cfg.examMode === true;
    let allowedWhitelisted = cfg.allowedWhitelisted !== false; // default true
    let playlistsOnly = cfg.playlistsOnly === true;

    // Utility: determine if on Home route
    const isHomeRoute = () => {
      const p = location.pathname.replace(/\/$/, '');
      return p === '' || p === '/feed' || p === '/feed/you';
    const hideSelectors = [
    
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
      ...(hideRecsPref ? ['#related', '#secondary'] : []),
      'ytd-rich-item-renderer',
      
      ...(hideCommentsPref ? ['ytd-comments', 'ytd-comments-header-renderer', '#comments'] : []),
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
      const imgEl = document.querySelector('link[rel="preload"][as="image"][href*="i.ytimg.com"]') || document.querySelector('ytd-player img');
      const thumbnail = imgEl ? (imgEl.getAttribute('href') || imgEl.getAttribute('src')) : '';
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

      if (!studyTimeTimer) {
        studyTimeTimer = setInterval(() => {
          const info = currentVideoInfo();
          if (!info) return;
          let eligible = isWhitelistedChannel(info.channelId) || isFromStudyPlaylist(info.listId);
          if (playlistsOnly) eligible = isFromStudyPlaylist(info.listId);
          if (!allowedWhitelisted) eligible = isFromStudyPlaylist(info.listId);
          if (!eligible) return;
          if (video.paused) return;
          const key = new Date().toISOString().slice(0,10);
          chrome.storage.sync.get(['studyStats'], (d) => {
            const stats = d.studyStats || {};
            stats[key] = (stats[key] || 0) + 1; // +1 minute
            chrome.storage.sync.set({ studyStats: stats });
          });
        }, 60000);
      }
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
      if (changes.hideComments) hideCommentsPref = changes.hideComments.newValue !== false;
      if (changes.hideRecommendations) hideRecsPref = changes.hideRecommendations.newValue !== false;
      if (changes.disableAutoplay) disableAutoplayPref = changes.disableAutoplay.newValue !== false;
      if (changes.examMode) { examMode = changes.examMode.newValue === true; enforceExamMode(); }
      if (changes.allowedWhitelisted) allowedWhitelisted = changes.allowedWhitelisted.newValue !== false;
      if (changes.playlistsOnly) playlistsOnly = changes.playlistsOnly.newValue === true;
        } else {
          updateHomeVisibility();
        }
      }
    });
  });
})();
