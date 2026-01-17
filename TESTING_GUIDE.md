# Horse Racing Testing Guide

## Quick Start

### 1. Start Local Server

Choose one of these methods:

**Option A: Python 3**
```bash
python -m http.server 8000
```

**Option B: Python 2**
```bash
python -m SimpleHTTPServer 8000
```

**Option C: Node.js**
```bash
npx http-server -p 8000
```

### 2. Open Browser
Navigate to: `http://localhost:8000`

### 3. First-Time Setup
1. You'll see the welcome screen
2. Click "Get Started" to go to Users tab
3. Add at least 2 users (names will auto-assign colors)
4. Click on "Race" tab (or press "1" key)
5. Click "Start Race" button (or press Enter/Space)

## Manual Testing Checklist

### ✅ Core Race Functionality

**Race Rendering:**
- [ ] Race track displays with horizontal lanes
- [ ] Each enabled user has their own lane
- [ ] User names appear on the left side of each lane
- [ ] Finish line appears as golden dashed vertical line on right
- [ ] Horses appear at start line (left side) in correct colors

**Race Animation:**
- [ ] Click "Start Race" button
- [ ] Horses animate smoothly from left to right
- [ ] Horses move at variable speeds (randomly speed up/slow down)
- [ ] Racing sound plays during animation
- [ ] One horse crosses finish line first
- [ ] All other horses stop before finish line
- [ ] Animation duration matches setting (default 7 seconds)

**Winner Selection:**
- [ ] Winner announced at top of screen
- [ ] Winning horse highlighted with golden glow
- [ ] Stop sound plays when race ends
- [ ] Fanfare sound plays 300ms after stop
- [ ] Browser tab title shows: "{Winner Name} | Horse Racing"
- [ ] Winner effect triggers (confetti/fireworks/etc based on setting)

**Consecutive Prevention:**
- [ ] Run race multiple times (5-10 races)
- [ ] Verify same user does NOT win twice in a row
- [ ] All enabled users eventually get selected

### ✅ User Management Integration

**Adding Users:**
- [ ] Add 3rd user → race track re-renders with 3 lanes
- [ ] Add up to 20 users → all lanes fit on screen
- [ ] Each new user gets unique horse color

**Editing Users:**
- [ ] Edit user color → horse color updates immediately
- [ ] Edit user name → lane label updates

**Deleting Users:**
- [ ] Delete a user → race track re-renders without that lane
- [ ] Previous history entries show "Deleted User"
- [ ] Statistics still include deleted user's wins

**Enable/Disable:**
- [ ] Disable user → they're excluded from race track
- [ ] Race button disabled when <2 enabled users
- [ ] Enable user → they reappear on race track

### ✅ History & Statistics

**History Recording:**
- [ ] Each race creates history entry
- [ ] Entry shows: spin number, date/time, winner name
- [ ] Newest entries appear at top
- [ ] History limited to 500 entries (oldest auto-removed)
- [ ] Export CSV downloads correctly

**Statistics:**
- [ ] Win counts accurate for each user
- [ ] Selection percentages add up to ~100%
- [ ] Current streaks update correctly
- [ ] Longest streaks tracked properly

### ✅ Settings Integration

**Race Duration:**
- [ ] Slider at 1 second → race completes in ~1 second
- [ ] Slider at 10 seconds → race completes in ~10 seconds
- [ ] Default 7 seconds works correctly

**Animation Speed:**
- [ ] Adjust multiplier → affects race pace
- [ ] Setting persists after refresh

**Sounds:**
- [ ] Toggle off → no sounds play during race
- [ ] Toggle on → racing, stop, fanfare sounds play

**Winner Effects:**
- [ ] Select "Confetti Burst" → confetti appears after race
- [ ] Select "Fireworks" → fireworks display after race
- [ ] Select "None" → no visual effects
- [ ] Test other effect options

**Theme:**
- [ ] Light mode: sky blue → grass green gradient background
- [ ] Dark mode: navy → dark green gradient background
- [ ] All text readable in both modes

**Data Management:**
- [ ] Download All Data → JSON file downloads
- [ ] Upload Data → imports correctly with confirmation
- [ ] Clear History → history deleted, users preserved
- [ ] Reset App → everything cleared

### ✅ Navigation & Shortcuts

**Tab Navigation:**
- [ ] Click "Race" tab → shows race view
- [ ] Click "Users" tab → shows users view
- [ ] Click "History" tab → shows history view
- [ ] Click "Settings" tab → shows settings view

**Keyboard Shortcuts:**
- [ ] Press "1" → goes to Race tab
- [ ] Press "2" → goes to Users tab
- [ ] Press "3" → goes to History tab
- [ ] Press "4" → goes to Settings tab
- [ ] Arrow Left/Right → cycles through tabs
- [ ] Press Enter on Race tab → starts race
- [ ] Press Space on Race tab → starts race

**Touch Gestures (Mobile/Tablet):**
- [ ] Swipe on race track → starts race

### ✅ Responsive Design

**Desktop (>1024px):**
- [ ] Race track fills width nicely (max 1200px)
- [ ] User name labels are 16px and readable
- [ ] Min height 450px
- [ ] All controls accessible

**Tablet (768-1024px):**
- [ ] Race track adapts to screen width
- [ ] User name labels are 14px and readable
- [ ] Min height 350px
- [ ] Touch controls work

**Mobile (<480px):**
- [ ] Race track scales down appropriately
- [ ] User name labels are 12px (may be small but readable)
- [ ] Min height 280px
- [ ] Buttons large enough for touch
- [ ] Navigation tabs accessible (may stack or shrink)

### ✅ Edge Cases & Performance

**Button States:**
- [ ] Race button disabled when <2 enabled users
- [ ] Race button disabled during race
- [ ] Race button re-enabled after race completes
- [ ] Rapid clicking doesn't start multiple races

**State Management:**
- [ ] Switching away from Race tab clears winner effects
- [ ] Returning to Race tab shows last result
- [ ] Page refresh preserves users, history, settings
- [ ] Last viewed tab remembered after refresh

**Long Names:**
- [ ] User name >15 characters truncates with "..."
- [ ] Truncated names still readable in lane labels

**Many Users:**
- [ ] 20 users all fit on track
- [ ] Lane labels don't overlap
- [ ] All horses animate smoothly
- [ ] Performance remains good (60fps)

**Memory Leaks:**
- [ ] Run 50 consecutive races
- [ ] Check browser DevTools Performance/Memory
- [ ] No memory growth over time
- [ ] AnimationFrames properly canceled

### ✅ Browser Compatibility

Test in each browser:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

For each browser verify:
- [ ] No console errors
- [ ] Smooth animation
- [ ] Sounds play correctly
- [ ] All features work

## Bug Reporting

If you find issues, note:
1. **Browser & Version**: (e.g., Chrome 120)
2. **Device**: (e.g., Desktop, iPhone 14, etc.)
3. **Steps to Reproduce**:
   - Step 1
   - Step 2
   - Step 3
4. **Expected Result**:
5. **Actual Result**:
6. **Console Errors**: (open DevTools → Console, paste any errors)
7. **Screenshot**: (if visual issue)

## Common Issues & Fixes

**Issue: Horses don't animate**
- Check console for JavaScript errors
- Verify race.js loaded (DevTools → Network tab)
- Ensure at least 2 users are enabled

**Issue: No sounds play**
- Check sound toggle in Settings (must be ON)
- Verify browser allows audio playback
- Check browser volume/mute settings

**Issue: Race never completes**
- Check console for errors
- Verify animationFrameId is being created
- Check if timeout fallback fires (race should complete in duration + 1 second max)

**Issue: Same user wins multiple times in a row**
- This should NOT happen - bug in random selection logic
- Check console for errors in getRandomUserIndex()
- Verify Storage.getLastSelected() returns correct value

**Issue: Layout broken on mobile**
- Check viewport meta tag in HTML
- Verify CSS media queries apply
- Test in responsive mode (DevTools → Toggle Device Toolbar)

## Performance Benchmarks

Expected performance:
- **Frame Rate**: 60fps during animation
- **Race Duration**: Matches setting ±100ms
- **Render Time**: <100ms for 20 users
- **Memory**: No growth after 50 races
- **CPU**: <50% usage during animation (on modern hardware)

## Success Criteria

✅ **All tests pass** = Implementation successful
⚠️ **Minor issues** = Document and fix if critical
❌ **Major bugs** = Investigate and resolve

## Next Steps After Testing

1. Fix any bugs found
2. Deploy to GitHub Pages
3. Update CLAUDE.md with new architecture
4. Remove old wheel.js file (no longer needed)
5. Update README.md for end users
