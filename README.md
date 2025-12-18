# 📚 YouTube Study Mode

A Chrome extension that transforms YouTube into a distraction-free study platform by blocking all non-educational content.

## ✨ Features

### 🚫 Blocks All Distractions:
- **Shorts** - No more short-form content rabbit holes
- **Trending** - Removes trending page and suggestions
- **Music** - Hides music recommendations
- **Ads** - Blocks all advertisements
- **Recommendations** - Removes sidebar and homepage suggestions
- **Comments** - Hides comment sections
- **End screens** - Blocks video suggestions at the end
- **Autoplay** - Prevents automatic next video

### ✅ Shows Only Study Content:
- **Continue Watching** - Your unfinished videos
- **Your Playlists** - Your saved study playlists
- **Search** - Full search functionality maintained
- **Subscriptions** - Access to your subscribed channels

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

## 🎮 Controls

- **Toggle Button** - Enable/Disable study mode
- **Reload Button** - Refresh YouTube page
- **Status Indicator** - Shows current mode (Active/Inactive)

## 🛠️ Technical Details

### Files Structure:
```
yt-study-mode/
├── manifest.json       # Extension configuration
├── content.js          # Main blocking logic
├── style.css          # CSS-based blocking
├── background.js      # Background processes
├── popup/
│   ├── popup.html     # Extension popup UI
│   ├── popup.css      # Popup styling
│   └── popup.js       # Popup controls
└── README.md          # Documentation
```

### How It Works:
1. **CSS Blocking** - Hides elements using display:none
2. **JavaScript Blocking** - Removes elements dynamically
3. **URL Interception** - Prevents navigation to Shorts/Trending
4. **Mutation Observer** - Catches dynamically loaded content

## 🔧 Customization

To modify what gets blocked, edit the `hideSelectors` array in [content.js](content.js).

To allow certain content, add selectors to the `keepSelectors` array.

## ⚙️ Permissions

- `storage` - Save user preferences
- `tabs` - Reload YouTube tabs
- `host_permissions` - Access YouTube pages

## 📝 Notes

- Extension runs only on youtube.com
- Default state is ENABLED
- Uses Chrome Storage API for persistence
- MutationObserver ensures dynamic content is blocked

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

- [ ] Whitelist specific channels
- [ ] Custom keyword filtering
- [ ] Study time tracking
- [ ] Focus mode timer
- [ ] Export/Import settings

## 📄 License

Free to use and modify for personal and educational purposes.

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

---

**Stay focused. Stay productive. Keep learning! 📚✨**
