# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Horse Racing Selector - A browser-based random team member selector using an animated horse race visualization. Pure vanilla JavaScript application with no build tools or frameworks.

**Live site:** https://cookerkate.com (also https://wfbtrakker.github.io/horse-racing-selector/)

## Development Setup

This is a static HTML/CSS/JS application with no build process.

### Running Locally

Start any HTTP server in the project root:

```bash
# Python
python -m http.server 8000

# Node.js
npx http-server -p 8000
```

Then open http://localhost:8000

### Deployment

The site is deployed via GitHub Pages. Any push to the `master` branch automatically deploys to both:
- GitHub Pages: https://wfbtrakker.github.io/horse-racing-selector/
- Custom domain (CNAME): https://cookerkate.com

No build step required - just commit and push HTML/CSS/JS changes.

## Architecture

### Module Structure

The application uses a modular JavaScript architecture with separate concerns:

**Storage Module** (`src/js/storage.js`)
- Central data management layer for all localStorage operations
- Single namespace: `'RacingWinner'` in localStorage
- Manages: users, race history, settings, app state
- Provides all CRUD operations for users and history
- **Important:** All data persistence must go through Storage module methods

**Race Module** (`src/js/race.js`)
- Core racing animation engine with `HorseState` class for physics simulation
- Handles 60fps canvas-like SVG animations with frame-rate independent movement
- Physics: Each horse has velocity, speed changes, and realistic finish behavior
- Winner determination: The winner gets a speed boost in the final 30% of the race while others slow down
- **Key detail:** Non-winners progressively slow down and finish at 85-96% of track distance
- Racing commentary system with dynamic text updates during race

**App Module** (`src/js/app.js`)
- Main orchestration layer - initializes all other modules
- View management (race, users, history, settings)
- Event handling for all UI interactions
- User management: add, edit, delete, enable/disable users
- Keyboard shortcuts (1-4 for tabs, Enter/Space for race)

**Effects Module** (`src/js/effects.js`)
- Visual celebration effects: confetti, fireworks, balloons, sparkles, etc.
- DOM-based particle systems
- Must clean up effects when switching views to prevent memory leaks

**Sounds Module** (`src/js/sounds.js`)
- Web Audio API integration with graceful degradation
- Audio files referenced but may not exist (handles missing files silently)
- Sound paths: `src/audio/spinning.mp3`, `src/audio/stop.mp3`, `src/audio/fanfare.mp3`

**Wheel Module** (`src/js/wheel.js`)
- **Legacy module** - Not actively used in current horse racing implementation
- Contains old wheel-of-fortune visualization code
- Keep for potential future features but avoid modifying unless specifically needed

### Script Load Order

Scripts in `index.html` must load in this exact order (dependencies matter):
1. `storage.js` - First (no dependencies)
2. `sounds.js` - Depends on Storage
3. `effects.js` - Depends on Storage
4. `race.js` - Depends on Storage
5. `app.js` - Last (depends on all others)

### Data Flow

1. User action (button click) → App module
2. App module → Race module (start race animation)
3. Race module → determines winner based on physics
4. Race module → App module (winner selected)
5. App module → Effects/Sounds modules (trigger celebration)
6. App module → Storage module (save to history)
7. App module → DOM updates (display winner)

### Key Features

**Anti-repeat Logic:** Same person cannot win twice in a row (managed in Race module)
**Fair Randomization:** All enabled users have equal probability
**Offline-first:** All data stored in localStorage, no backend required
**Responsive Design:** Works on desktop, tablet, and mobile

## Common Modifications

### Adding New Settings

1. Add default value to `Storage.DEFAULT_SETTINGS` in `storage.js`
2. Add UI control in the Settings view in `index.html`
3. Wire up event listener in `App.setupSettingsEvents()` in `app.js`
4. Use setting via `Storage.getSetting('settingName')` where needed

### Modifying Race Physics

All physics parameters are in `race.js`:
- `HorseState` class controls individual horse behavior
- Speed variation: `0.6x to 1.8x` base speed (random bursts)
- Final stretch: Last 30% of race (winner gets boost)
- Finish positions: Non-winners stop at 85-96% of track

### Adding New Winner Effects

1. Create effect function in `effects.js` (e.g., `newEffect()`)
2. Add case to `Effects.triggerWinnerEffect()` switch statement
3. Add `<option>` to winner effect dropdown in `index.html`
4. Ensure cleanup logic added to `Effects.clearEffects()`

## Testing

No automated tests. Manual testing workflow:

1. Test with minimum users (2) and maximum users (20)
2. Test race with different durations (5s, 10s, 20s)
3. Test all winner effects
4. Verify localStorage persistence (refresh page)
5. Test dark mode toggle
6. Test CSV export from history
7. Test data backup/restore with JSON download/upload
8. Verify anti-repeat logic (same user shouldn't win twice in a row)

## Browser Compatibility

Targets modern browsers (Chrome, Firefox, Safari, Edge latest versions).

Uses:
- LocalStorage API
- SVG with transforms
- CSS custom properties (variables)
- ES6+ JavaScript (const/let, arrow functions, classes)
- requestAnimationFrame for smooth animations

## File Organization

```
/
├── index.html           # Single-page app structure
├── CNAME               # Custom domain (cookerkate.com)
├── src/
│   ├── css/
│   │   └── styles.css  # All styles (1500+ lines)
│   └── js/
│       ├── app.js      # Main orchestrator
│       ├── storage.js  # Data persistence
│       ├── race.js     # Racing physics/animation
│       ├── effects.js  # Visual effects
│       ├── sounds.js   # Audio management
│       └── wheel.js    # Legacy (not used)
└── README.md           # User-facing documentation
```

## Important Constraints

- **No frameworks:** Pure vanilla JavaScript only
- **No build tools:** No webpack, vite, or bundlers
- **No npm:** No package.json or dependencies
- **No TypeScript:** Plain JavaScript only
- **Single HTML file:** All views in one `index.html`
- **Client-side only:** No server, no API calls, no database

## Debugging Tips

- Open browser DevTools → Application → Local Storage → `RacingWinner` to inspect data
- Console logs exist in Storage module for debugging localStorage errors
- Use Chrome DevTools Performance tab to debug animation frame rates
- Racing commentary in UI helps debug race state during development
