# 🐎 Horse Racing Selector

A fun and engaging random team member selector using an exciting horse racing visualization! Watch horses gallop across lanes to randomly pick a winner.

## 🌐 Live Demo

**[Try it now!](https://wfbtrakker.github.io/horse-racing-selector/)**

## ✨ Features

### 🏇 Racing Visualization
- **Realistic horse emojis** that gallop across horizontal lanes
- **Variable speed bursts** - horses randomly speed up and slow down during the race
- **Dramatic finish** - winner pulls ahead in the final stretch
- **Smooth animations** at 60fps with realistic bobbing motion

### 🎯 Smart Selection
- **Prevents consecutive repeats** - same person cannot win twice in a row
- **Fair randomization** - all enabled users have equal probability
- **Configurable duration** - races from 5 to 20 seconds

### 👥 User Management
- **Easy user management** - add, edit, delete, enable/disable team members
- **Auto-color assignment** from 22-color palette
- **Support for 2-20 users**
- **Name truncation** for long names

### 📊 History & Statistics
- **Complete race history** - rolling 500-race limit
- **Win statistics** - counts, percentages, and streaks
- **CSV export** - download your history
- **Deleted user tracking** - historical accuracy maintained

### 🎨 Customization
- **Dark mode** - easy on the eyes
- **Winner effects** - confetti, fireworks, sparkles, and more
- **Sound effects** - racing sounds, stop sound, and fanfare
- **Custom race name** - personalize your app

### 💾 Data Management
- **Full offline support** - works without internet
- **LocalStorage persistence** - your data stays in your browser
- **JSON backup/restore** - download and upload your complete data
- **No external dependencies** - pure vanilla JavaScript

### 📱 Responsive Design
- **Works on all devices** - desktop, tablet, and mobile
- **Touch support** - swipe to start race on mobile
- **Adaptive layout** - scales beautifully to any screen size

### ⌨️ Keyboard Navigation
- **Number keys** - 1 (Race), 2 (Users), 3 (History), 4 (Settings)
- **Arrow keys** - navigate between tabs
- **Enter/Space** - start race

## 🚀 Getting Started

### Quick Start
1. Visit **[https://wfbtrakker.github.io/horse-racing-selector/](https://wfbtrakker.github.io/horse-racing-selector/)**
2. Add at least 2 team members in the Users tab
3. Click "Start Race" and watch the horses go!

### Local Development
```bash
# Clone the repository
git clone https://github.com/wfbtrakker/horse-racing-selector.git
cd horse-racing-selector

# Start a local server (choose one)
python -m http.server 8000
# OR
npx http-server -p 8000

# Open http://localhost:8000 in your browser
```

## 🎮 How to Use

### Adding Users
1. Go to the **Users** tab
2. Enter a name (2-15 characters)
3. Click **Add User** - color is automatically assigned
4. Repeat for all team members (minimum 2, maximum 20)

### Running a Race
1. Go to the **Race** tab
2. Click **Start Race** or press Enter/Space
3. Watch the horses race across the track
4. The winner is announced with a golden glow effect

### Viewing History
1. Go to the **History** tab
2. View all previous races in chronological order
3. Switch to **Statistics** to see win counts and percentages
4. Export to CSV for external analysis

### Customizing Settings
1. Go to the **Settings** tab
2. Adjust race duration (5-20 seconds)
3. Change winner effect (confetti, fireworks, etc.)
4. Toggle dark mode and sound effects
5. Customize the race name

## 🛠️ Technology Stack

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with custom properties
- **Vanilla JavaScript** - No frameworks or libraries
- **LocalStorage API** - Data persistence
- **SVG** - Scalable horse graphics
- **Web Audio API** - Sound effects

## 📋 Use Cases

Perfect for:
- **Team standups** - randomly select who goes first
- **Task assignment** - fairly distribute responsibilities
- **Presentations** - pick the next presenter
- **Game nights** - choose teams or order
- **Classrooms** - select students for activities
- **Ice breakers** - random partner selection

## 🎯 Browser Support

Works on all modern browsers:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

## 📝 License

MIT License - feel free to use for any purpose!

## 🤝 Contributing

Contributions welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## 📧 Contact

Created by wfbtrakker
Repository: [https://github.com/wfbtrakker/horse-racing-selector](https://github.com/wfbtrakker/horse-racing-selector)

---

**Ready to race?** [Launch the app!](https://wfbtrakker.github.io/horse-racing-selector/) 🏇
