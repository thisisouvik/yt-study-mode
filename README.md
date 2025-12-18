<p align="center">
	<img src="logo.png" alt="YouTube Study Mode" width="96" height="96" />
</p>

# 📚 YouTube Study Mode

A Chrome extension that turns YouTube into a distraction-free study dashboard. Blocks Shorts/Trending/Recommendations, enforces autoplay OFF, and adds a clean Study Home.

## ✨ Features

### 🚫 Blocks All Distractions:
- **Shorts** - No more short-form content rabbit holes
- **Trending** - Removes trending page and suggestions
- **Music** - Hides music recommendations
- **Ads** - Blocks all advertisements
- **Recommendations** - Removes sidebar and homepage suggestions (configurable)
- **Comments** - Hides comment sections (configurable)
- **End screens** - Blocks video suggestions at the end
- **Autoplay** - Continuously forced OFF while Study Mode is enabled

### ✅ Shows Only Study Content:
- **Continue Watching** - Your unfinished videos
- **Your Playlists** - Your saved study playlists
- **Search** - Full search functionality maintained
- **Whitelisted Channels** - Track resume-only for approved channels

### 🏠 Custom Study Home (Dashboard)
- Minimal overlay replaces the default YouTube Home
- Sections: Continue Studying + Study Playlists
- No algorithmic recommendations or unrelated videos
- Fast, SPA-safe render and updates

## 🚀 Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `yt-study-mode` folder
6. The extension is now installed!

## 💻 Usage

1. Click the extension icon in Chrome toolbar
2. Toggle between Active/Inactive modes
3. Reload YouTube page to apply changes
4. Focus on your studies without distractions!

## 🎮 Popup Dashboard

- Study Mode: ON/OFF pill
- Allowed Content: Subscribed (placeholder), Whitelisted, Playlists Only
- Quick Controls: Hide Comments, Hide Recommendations, Disable Autoplay
- Focus Tools: Study Time Today, Daily Limit, Start/Stop Focus Session
- Exam Mode: Hard lock — overlay says “YouTube is locked. Focus on your exam preparation.” and only allows whitelisted/playlist content

## 🛠️ Technical Details

### Files Structure:
```
yt-study-mode/
├── manifest.json       # Extension configuration
├── content.js          # Blocking, Study Home, autoplay, exam lock, tracking
├── style.css           # CSS-based blocking + Study Home styles
├── background.js       # (Currently unused)
├── popup/
│   ├── popup.html     # Extension popup UI
│   ├── popup.css      # Popup styling
│   └── popup.js       # Popup controls
├── logo.png            # Extension icon
└── README.md          # Documentation
```

### How It Works:
1. **CSS Blocking** - Hides elements using display:none
2. **JavaScript Blocking** - Removes/overlays dynamically (SPA-safe)
3. **Autoplay Enforcement** - Detects and toggles player/compact autoplay OFF
4. **URL Interception** - Prevents navigation to Shorts/Trending
5. **Study Home Overlay** - Injects minimal dashboard on Home routes
6. **Progress Tracking** - Saves last watched video + timestamp for resume
7. **Study Time Tracking** - Adds +1 min per active playback minute (eligible content)

## 🔧 Customization

- Allowed content: Save channel IDs to `whitelistChannelIds`, and playlists to `studyPlaylists`.
- Playlists Only: When enabled, progress/tracking only counts for saved playlists.
- Disable Autoplay / Hide Comments / Hide Recommendations: Toggle in the popup; `content.js` enforces them.

Examples (DevTools Console while on YouTube):

```js
chrome.storage.sync.set({ whitelistChannelIds: ['UCX6b17PVsYBQ0ip5gyeme-Q'] })
chrome.storage.sync.set({ studyPlaylists: [
	{ title: 'Linear Algebra', playlistId: 'PLxyz...', url: 'https://www.youtube.com/playlist?list=PLxyz...' }
]})
```

## ⚙️ Permissions

- `storage` - Save user preferences
- `tabs` - Reload YouTube tabs
- `host_permissions` - Access YouTube pages
 - `action` - Uses logo.png for toolbar icon

## 📝 Notes

- Extension runs only on youtube.com
- Default Study Mode is ON (unless disabled in popup)
- Chrome Storage API used for persistence and tracking
- MutationObserver + timer loops ensure SPA content stays aligned

## 🐛 Troubleshooting

**Extension not working?**
1. Make sure it's enabled in the popup
2. Reload the YouTube page
3. Check if extension is enabled in chrome://extensions/

**Some content still showing?**
- YouTube frequently updates their HTML structure
- The extension runs every 500ms to catch new elements
- Report any issues for updates

## 🎯 Future Enhancements

- [ ] One-click “Save current channel/playlist” buttons
- [ ] Subscription-based filtering implementation
- [ ] Keyword-level filtering
- [ ] Focus session timer + block non-study tabs
- [ ] Export/Import settings

## 📄 License

Free to use and modify for personal and educational purposes.

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

---

**Stay focused. Stay productive. Keep learning! 📚✨**
