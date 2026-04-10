/**
 * Race Module - Handles horse racing rendering and animation logic
 * Manages race track display, animations, and result calculation
 */

/**
 * HorseState Class - Manages individual horse position and velocity during race
 */
class HorseState {
    constructor(index, userId, userName, color, isWinner, totalDuration, raceDistance) {
        this.index = index;
        this.userId = userId;
        this.userName = userName;
        this.color = color;
        this.isWinner = isWinner;
        this.hasFallen = false;
        this.position = 50; // Start position (pixels from left)
        this.raceDistance = raceDistance;
        this.totalDuration = totalDuration;

        // Calculate base speed (pixels per millisecond)
        this.baseSpeed = this.raceDistance / this.totalDuration;
        this.velocity = this.baseSpeed;

        // Generate random speed change events
        this.speedChanges = this.generateSpeedChanges();
        this.currentSpeedIndex = 0;

        // Track when final stretch begins (last 30% of race)
        this.finalStretchStart = this.totalDuration * 0.7;

        // Random finish position for non-winners (85-96% of race distance)
        // This adds variety and prevents all horses from stopping at the same place
        this.maxFinishPercent = 0.85 + (Math.random() * 0.11);

        // Random slowdown characteristics for non-winners
        this.slowdownRate = 0.5 + (Math.random() * 0.3); // 0.5 to 0.8

        // When non-winners start slowing (30-50% through race)
        this.slowdownStart = this.totalDuration * (0.3 + Math.random() * 0.2);
    }

    /**
     * Generate random speed change events throughout the race
     */
    generateSpeedChanges() {
        const changes = [];
        const numChanges = 6 + Math.floor(Math.random() * 5); // 6-10 changes

        for (let i = 0; i < numChanges; i++) {
            const timePoint = (this.totalDuration / (numChanges + 1)) * (i + 1);

            // More variation in speed for competitive racing
            // Winner and non-winners get same speed variations initially
            const speedMultiplier = 0.6 + Math.random() * 1.2; // 0.6x to 1.8x base speed

            changes.push({
                time: timePoint,
                multiplier: speedMultiplier
            });
        }

        return changes.sort((a, b) => a.time - b.time);
    }

    /**
     * Update horse position based on elapsed time
     */
    update(elapsedTime, deltaTime) {
        // Use actual delta time for frame-rate independent animation
        // Cap deltaTime to prevent huge jumps if tab was backgrounded
        const cappedDeltaTime = Math.min(deltaTime, 50);

        // Apply speed changes at scheduled times (only before final stretch for non-winners)
        if (this.isWinner || elapsedTime < this.finalStretchStart) {
            while (this.currentSpeedIndex < this.speedChanges.length &&
                   elapsedTime >= this.speedChanges[this.currentSpeedIndex].time) {
                const change = this.speedChanges[this.currentSpeedIndex];
                this.velocity = this.baseSpeed * change.multiplier;
                this.currentSpeedIndex++;
            }
        }

        // Calculate movement based on whether this is the winner
        let movement = 0;

        // Calculate movement based on winner vs non-winner
        if (this.isWinner) {
            // WINNER LOGIC: Maintain speed and get boost in final stretch
            if (elapsedTime >= this.finalStretchStart) {
                // In final 30%, winner gets progressive speed boost
                const finalProgress = (elapsedTime - this.finalStretchStart) / (this.totalDuration - this.finalStretchStart);
                const boost = 1 + (finalProgress * 0.8); // Up to 1.8x boost in final stretch
                movement = this.baseSpeed * cappedDeltaTime * boost;

                // Ensure winner crosses finish line by end
                const targetPosition = 50 + this.raceDistance;
                const minPosition = 50 + (this.raceDistance * (0.7 + (finalProgress * 0.3)));
                if (this.position < minPosition) {
                    this.position = minPosition;
                }
            } else {
                // Before final stretch - use current velocity from speed changes
                movement = this.velocity * cappedDeltaTime;
            }
        } else {
            // NON-WINNER LOGIC: Progressive slowdown throughout race
            const targetPosition = 50 + (this.raceDistance * this.maxFinishPercent);
            const distanceRemaining = targetPosition - this.position;

            if (elapsedTime < this.slowdownStart) {
                // Early race (before slowdown starts) - normal variable speed
                movement = this.velocity * cappedDeltaTime;
            } else {
                // After slowdown starts - gradual deceleration throughout remainder of race
                const slowdownDuration = this.totalDuration - this.slowdownStart;
                const slowdownProgress = (elapsedTime - this.slowdownStart) / slowdownDuration;

                // Progressive slowdown: start at current speed, end at ~30-40% speed
                // Curve the slowdown - slow more gradually at first, then more rapidly
                const slowdownCurve = Math.pow(slowdownProgress, 1.5);
                const speedMultiplier = 1 - (slowdownCurve * this.slowdownRate);

                // Also factor in distance remaining to target
                let distanceFactor = 1.0;
                if (distanceRemaining > 0 && distanceRemaining < 200) {
                    // Close to target - slow down more based on proximity
                    distanceFactor = Math.max(0.4, distanceRemaining / 200);
                } else if (distanceRemaining <= 0) {
                    // Past target - maintain minimum speed
                    distanceFactor = 0.3;
                }

                // Combine factors and ensure minimum speed
                const finalSpeedMultiplier = Math.max(0.3, speedMultiplier * distanceFactor);
                this.velocity = this.baseSpeed * finalSpeedMultiplier;
                movement = this.velocity * cappedDeltaTime;
            }
        }

        // Apply the movement - always move forward
        this.position += movement;

        // Ensure winner finishes
        if (this.isWinner && elapsedTime >= this.totalDuration * 0.95) {
            const targetPosition = 50 + this.raceDistance;
            if (this.position < targetPosition) {
                this.position = targetPosition;
            }
        }
    }
}

const Race = {
    // State
    isRacing: false,
    users: [],
    horses: [], // HorseState instances
    finishLineX: 950,
    startLineX: 50,
    raceDistance: 900,
    animationFrameId: null,
    startTime: null,
    lastFrameTime: null,
    duration: 7000,
    selectedUser: null,
    selectedIndex: -1,
    raceTimeoutId: null,

    // Commentary state
    lastCommentaryUpdate: 0,
    commentaryUpdateInterval: 2500, // Update commentary every 2500ms (allows voice to finish naturally)
    previousLeader: null,
    previousPositions: [],
    britishMaleVoice: null,

    // Fall state
    fallenHorseUserId: null,  // userId of the horse that will fall (null = none)
    fallTime: -1,             // elapsed ms when the fall triggers
    hasFallen: false,         // true once fall has been triggered this race

    /**
     * Initialize race module
     */
    init() {
        this.users = Storage.getUsers();
        this.render();
        this.loadBritishVoice();
    },

    /**
     * Cache the British male voice once voices are available
     */
    loadBritishVoice() {
        const pickVoice = () => {
            const voices = window.speechSynthesis.getVoices();
            if (!voices.length) return false;

            const saved = Storage.getSetting('selectedVoice');

            if (saved) {
                // Use the user's chosen voice if available
                this.britishMaleVoice = voices.find(v => v.name === saved) || null;
            } else {
                // Auto-select best British male voice
                this.britishMaleVoice =
                    voices.find(v => v.name === 'Google UK English Male') ||
                    voices.find(v => /^en.GB$/i.test(v.lang) && /male/i.test(v.name)) ||
                    voices.find(v => /^en.GB$/i.test(v.lang) && /ryan|george|oliver|james|daniel/i.test(v.name)) ||
                    voices.find(v => /^en.GB$/i.test(v.lang)) ||
                    null;
            }

            return true;
        };

        if (!pickVoice()) {
            window.speechSynthesis.onvoiceschanged = () => {
                pickVoice();
                window.speechSynthesis.onvoiceschanged = null;
            };
        }
    },

    /**
     * Render the race track with current users
     */
    render() {
        const raceTrack = document.getElementById('race-track');
        if (!raceTrack) return;

        // Only render enabled users
        this.users = Storage.getEnabledUsers();

        // Clear existing content
        const lanesGroup = raceTrack.querySelector('#lanes');
        const horsesGroup = raceTrack.querySelector('#horses');

        if (lanesGroup) lanesGroup.innerHTML = '';
        if (horsesGroup) horsesGroup.innerHTML = '';

        if (this.users.length === 0) return;

        // Calculate lane height and positions
        const trackHeight = 600;
        const laneHeight = trackHeight / this.users.length;

        // Draw lanes
        this.users.forEach((user, index) => {
            const laneY = (index + 0.5) * laneHeight;

            // Lane divider line (except for last lane)
            if (index < this.users.length - 1) {
                const laneLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                laneLine.setAttribute('class', 'race-lane');
                laneLine.setAttribute('x1', '0');
                laneLine.setAttribute('y1', (index + 1) * laneHeight);
                laneLine.setAttribute('x2', '1000');
                laneLine.setAttribute('y2', (index + 1) * laneHeight);
                lanesGroup.appendChild(laneLine);
            }

            // User name label at start of lane
            const nameLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            nameLabel.setAttribute('class', 'race-name-label');
            nameLabel.setAttribute('x', '10');
            nameLabel.setAttribute('y', laneY);
            nameLabel.setAttribute('text-anchor', 'start');
            nameLabel.setAttribute('dominant-baseline', 'middle');

            let displayName = user.name;
            if (displayName.length > 15) {
                displayName = displayName.substring(0, 13) + '...';
            }
            nameLabel.textContent = displayName;
            lanesGroup.appendChild(nameLabel);
        });

        // Create horse SVGs
        this.users.forEach((user, index) => {
            const laneY = (index + 0.5) * laneHeight;
            const horseGroup = this.createHorseSVG(user, this.startLineX, laneY, index);
            horsesGroup.appendChild(horseGroup);
        });
    },

    /**
     * Create horse graphic using SVG shapes with animated parts
     */
    createHorseSVG(user, x, y, index) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'race-horse-container');
        group.setAttribute('id', `horse-${user.id}`);
        group.setAttribute('data-user-id', user.id);
        group.setAttribute('data-index', index);
        group.setAttribute('transform', `translate(${x}, ${y})`);

        // Create inner group for galloping animation (separate from positioning)
        const innerGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        innerGroup.setAttribute('class', 'race-horse');

        const uc = user.color; // horse body color = user color
        const dk = '#1a1a1a'; // dark accents: mane, tail, hooves, nostril
        const hf = '#111111'; // hooves

        // Horse is colored entirely in the user's color.
        // Dark accents (mane, tail, hooves, eye) provide contrast regardless of user color.
        //
        // IMPORTANT - two-group wrapper pattern for animated parts:
        //   Outer <g transform="translate(x,y)"> handles position via SVG attribute only.
        //   Inner <g class="horse-..."> is the CSS animation target and has NO SVG transform
        //   attribute. This prevents the CSS animation from overriding the position translate.
        const horseSVG = `
            <g class="horse-figure">

                <!-- Tail: outer <g> positions; inner <g> is CSS-animated -->
                <g transform="translate(-15, 3)">
                    <g class="horse-tail-group">
                        <path d="M0,0 C-2,5 -4,10 -2,14 C-1,17 2,15 1,11 C0,8 1,3 3,0"
                              fill="none" stroke="${dk}" stroke-width="3.5" stroke-linecap="round"/>
                    </g>
                </g>

                <!-- Back legs: outer <g> positions; inner <g> is CSS-animated -->
                <g transform="translate(-13, 9)">
                    <g class="horse-back-leg-b">
                        <rect x="-2.5" y="0" width="5" height="13" rx="1.5" fill="${uc}"/>
                        <rect x="-3" y="12" width="6" height="3.5" rx="1" fill="${hf}"/>
                    </g>
                </g>
                <g transform="translate(-8, 9)">
                    <g class="horse-back-leg-a">
                        <rect x="-2.5" y="0" width="5" height="13" rx="1.5" fill="${uc}"/>
                        <rect x="-3" y="12" width="6" height="3.5" rx="1" fill="${hf}"/>
                    </g>
                </g>

                <!-- Horse body -->
                <ellipse cx="0" cy="2" rx="16" ry="8" fill="${uc}"/>

                <!-- Front legs: outer <g> positions; inner <g> is CSS-animated -->
                <g transform="translate(8, 9)">
                    <g class="horse-front-leg-b">
                        <rect x="-2.5" y="0" width="5" height="13" rx="1.5" fill="${uc}"/>
                        <rect x="-3" y="12" width="6" height="3.5" rx="1" fill="${hf}"/>
                    </g>
                </g>
                <g transform="translate(13, 9)">
                    <g class="horse-front-leg-a">
                        <rect x="-2.5" y="0" width="5" height="13" rx="1.5" fill="${uc}"/>
                        <rect x="-3" y="12" width="6" height="3.5" rx="1" fill="${hf}"/>
                    </g>
                </g>

                <!-- Neck -->
                <polygon points="8,-1 15,1 18,-8 12,-9" fill="${uc}"/>

                <!-- Mane -->
                <path d="M9,-2 C8,-5 11,-7 14,-8 C12,-9 8,-7 8,-5 C7,-4 7,-2 9,-2" fill="${dk}"/>

                <!-- Head: outer <g> positions; inner <g> is CSS-animated -->
                <g transform="translate(13, -9)">
                    <g class="horse-head-group">
                        <ellipse cx="7" cy="0" rx="9" ry="5" fill="${uc}" transform="rotate(-20, 7, 0)"/>
                        <!-- Ear outer -->
                        <polygon points="3,-3 5,-8 8,-3" fill="${uc}"/>
                        <!-- Ear inner line -->
                        <line x1="4" y1="-4" x2="5" y2="-6.5" stroke="${dk}" stroke-width="1.5" stroke-linecap="round"/>
                        <!-- Eye -->
                        <circle cx="11" cy="-1" r="2" fill="${dk}"/>
                        <circle cx="11.7" cy="-1.7" r="0.7" fill="white"/>
                        <!-- Nostril -->
                        <ellipse cx="16" cy="3" rx="1.8" ry="1.2" fill="${dk}"/>
                    </g>
                </g>

            </g>
        `;

        innerGroup.innerHTML = horseSVG;
        group.appendChild(innerGroup);
        return group;
    },

    /**
     * Start the race
     */
    race(onComplete) {
        if (this.isRacing || this.users.length < 2) return;

        // Clean up any previous race state
        this.cleanup();

        // Refresh users to ensure we're working with current data
        this.users = Storage.getEnabledUsers();

        if (this.users.length < 2) return;

        // Clear any active winner effects from previous race
        if (typeof Effects !== 'undefined') {
            Effects.clearEffects();
        }

        // Hide the previous winner display
        const resultDisplay = document.getElementById('result-display');
        if (resultDisplay) {
            resultDisplay.classList.add('hidden');
        }

        // Show and clear commentary display (if enabled)
        const commentaryEnabled = Storage.getSetting('commentaryEnabled');
        const commentaryDisplay = document.getElementById('race-commentary');
        if (commentaryDisplay && commentaryEnabled) {
            commentaryDisplay.classList.remove('hidden');
            const commentaryText = document.getElementById('commentary-text');
            if (commentaryText) {
                commentaryText.textContent = 'And they\'re off!';
            }
            this.speakCommentary("And they're off!");
        }

        // Reset commentary state
        this.lastCommentaryUpdate = 0;
        this.previousLeader = null;
        this.previousPositions = [];

        // Clear any previous winner highlights and animations
        const horsesGroup = document.querySelector('#horses');
        if (horsesGroup) {
            horsesGroup.querySelectorAll('.race-horse').forEach(horse => {
                horse.classList.remove('winner', 'racing');
            });
        }

        this.isRacing = true;
        const raceButton = document.getElementById('race-button');
        if (raceButton) {
            raceButton.disabled = true;
        }

        const settings = Storage.getSettings();
        this.duration = settings.spinDuration * 1000; // Convert to milliseconds


        // Select random winner (preventing same user as last race)
        this.selectedIndex = this.getRandomUserIndex();
        this.selectedUser = this.users[this.selectedIndex];

        // Calculate lane positions
        const trackHeight = 600;
        const laneHeight = trackHeight / this.users.length;

        // Create HorseState instances for all horses
        this.horses = this.users.map((user, index) => {
            const isWinner = index === this.selectedIndex;
            return new HorseState(
                index,
                user.id,
                user.name,
                user.color,
                isWinner,
                this.duration,
                this.raceDistance
            );
        });

        // Determine if a horse will fall this race
        this.fallenHorseUserId = null;
        this.fallTime = -1;
        this.hasFallen = false;
        if (Storage.getSetting('horseCanFall') && this.users.length >= 2) {
            // ~40% chance any given race has a fall
            if (Math.random() < 0.4) {
                const nonWinners = this.horses.filter(h => !h.isWinner);
                const victim = nonWinners[Math.floor(Math.random() * nonWinners.length)];
                this.fallenHorseUserId = victim.userId;
                // Fall happens between 20% and 65% through the race
                this.fallTime = this.duration * (0.2 + Math.random() * 0.45);
            }
        }

        // Reset all horse positions and add racing animation
        this.horses.forEach((horse, index) => {
            const horseContainer = document.getElementById(`horse-${horse.userId}`);
            if (horseContainer) {
                const laneY = (index + 0.5) * laneHeight;
                horseContainer.setAttribute('transform', `translate(${this.startLineX}, ${laneY})`);

                // Add galloping animation to inner horse element
                const innerHorse = horseContainer.querySelector('.race-horse');
                if (innerHorse) {
                    innerHorse.classList.remove('fallen');
                    innerHorse.classList.add('racing');
                }
            }
        });

        // Start animation
        this.startTime = performance.now();
        this.lastFrameTime = null; // Reset for new race
        this.animate(this.startTime, onComplete);

        // Safety timeout in case animation doesn't complete
        this.raceTimeoutId = setTimeout(() => {
            if (this.isRacing) {
                this.completeRace(onComplete);
            }
        }, this.duration + 1000);
    },

    /**
     * Animation loop using requestAnimationFrame
     */
    animate(currentTime, onComplete) {
        if (!this.isRacing) return;

        const elapsedTime = currentTime - this.startTime;

        // Calculate delta time from last frame (defaults to 16ms on first frame)
        const deltaTime = this.lastFrameTime ? currentTime - this.lastFrameTime : 16;
        this.lastFrameTime = currentTime;

        // Check if race should complete
        if (elapsedTime >= this.duration) {
            this.completeRace(onComplete);
            return;
        }

        // Trigger horse fall if the time has come
        if (!this.hasFallen && this.fallenHorseUserId !== null && elapsedTime >= this.fallTime) {
            this.triggerHorseFall(this.fallenHorseUserId);
            this.hasFallen = true;
        }

        // Update all horse positions
        const trackHeight = 600;
        const laneHeight = trackHeight / this.users.length;

        this.horses.forEach((horse, index) => {
            if (horse.hasFallen) return; // fallen horses don't move

            horse.update(elapsedTime, deltaTime);

            const horseElement = document.getElementById(`horse-${horse.userId}`);
            if (horseElement) {
                const laneY = (index + 0.5) * laneHeight;
                // Use translate3d for hardware acceleration
                horseElement.setAttribute('transform', `translate(${horse.position}, ${laneY})`);
            }
        });

        // Update racing commentary
        this.updateCommentary(elapsedTime);

        // Continue animation
        this.animationFrameId = requestAnimationFrame((time) => this.animate(time, onComplete));
    },

    /**
     * Update racing commentary based on current positions
     */
    updateCommentary(elapsedTime) {
        // Check if commentary is enabled
        const commentaryEnabled = Storage.getSetting('commentaryEnabled');
        if (!commentaryEnabled) {
            return;
        }

        // Only update at intervals to avoid flickering
        if (elapsedTime - this.lastCommentaryUpdate < this.commentaryUpdateInterval) {
            return;
        }

        this.lastCommentaryUpdate = elapsedTime;

        // Sort horses by position to find leaders
        const sortedHorses = [...this.horses].sort((a, b) => b.position - a.position);
        const leader = sortedHorses[0];
        const secondPlace = sortedHorses.length > 1 ? sortedHorses[1] : null;

        // Calculate race progress
        const progress = elapsedTime / this.duration;

        const commentaryText = document.getElementById('commentary-text');
        if (!commentaryText) return;

        let commentary = '';

        // Generate commentary based on race state
        if (progress < 0.25) {
            // Early race
            if (secondPlace && Math.abs(leader.position - secondPlace.position) < 30) {
                commentary = `${leader.userName} and ${secondPlace.userName} neck and neck!`;
            } else {
                commentary = `${leader.userName} takes the early lead!`;
            }
        } else if (progress < 0.5) {
            // Mid race
            if (this.previousLeader && this.previousLeader !== leader.userName) {
                commentary = `${leader.userName} moves to the front!`;
            } else if (secondPlace && Math.abs(leader.position - secondPlace.position) < 40) {
                commentary = `${secondPlace.userName} closing in fast!`;
            } else {
                commentary = `${leader.userName} out in front!`;
            }
        } else if (progress < 0.75) {
            // Late mid race
            const gap = secondPlace ? leader.position - secondPlace.position : 100;
            if (gap < 30) {
                commentary = `Too close to call!`;
            } else if (gap < 60) {
                commentary = `${secondPlace.userName} is gaining ground!`;
            } else {
                commentary = `${leader.userName} pulling away!`;
            }
        } else {
            // Final stretch
            if (secondPlace && Math.abs(leader.position - secondPlace.position) < 35) {
                commentary = `Photo finish! ${leader.userName} and ${secondPlace.userName}!`;
            } else if (leader.isWinner) {
                commentary = `${leader.userName} for the line!`;
            } else {
                commentary = `Anyone's race now!`;
            }
        }

        // Store current leader for next update
        this.previousLeader = leader.userName;

        // Update the commentary text with smooth crossfade
        // Only update if text has actually changed
        if (commentaryText.textContent !== commentary) {
            // Fade out
            commentaryText.style.opacity = '0';

            // Change text and fade back in
            setTimeout(() => {
                commentaryText.textContent = commentary;
                commentaryText.style.opacity = '1';
            }, 200);

            this.speakCommentary(commentary);
        }
    },

    /**
     * Speak commentary text using Web Speech API
     */
    speakCommentary(text) {
        if (!Storage.getSetting('voiceCommentaryEnabled')) return;
        if (!window.speechSynthesis) return;

        // Strip emojis for cleaner speech
        const cleanText = text.replace(/[\u{1F000}-\u{1FFFF}]/gu, '').trim();
        if (!cleanText) return;

        // If already speaking, only queue if nothing else is pending (avoid backlog)
        if (window.speechSynthesis.pending) return;

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Use selected/cached voice
        if (this.britishMaleVoice) utterance.voice = this.britishMaleVoice;

        window.speechSynthesis.speak(utterance);
    },

    /**
     * Complete the race and show winner
     */
    completeRace(onComplete) {
        if (!this.isRacing) return;

        // CRITICAL: Stop racing flag FIRST to prevent animate() from continuing
        this.isRacing = false;

        // Clean up animation
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        if (this.raceTimeoutId) {
            clearTimeout(this.raceTimeoutId);
            this.raceTimeoutId = null;
        }

        const raceButton = document.getElementById('race-button');
        if (raceButton) {
            raceButton.disabled = false;
        }

        // Remove racing animation from all horses
        const horsesGroup = document.querySelector('#horses');
        if (horsesGroup) {
            horsesGroup.querySelectorAll('.race-horse').forEach(horse => {
                horse.classList.remove('racing');
            });
        }

        // Update commentary with winner announcement (if enabled)
        const commentaryEnabled = Storage.getSetting('commentaryEnabled');
        if (commentaryEnabled) {
            const commentaryText = document.getElementById('commentary-text');
            if (commentaryText) {
                // Smooth fade to winner announcement
                commentaryText.style.opacity = '0';

                setTimeout(() => {
                    commentaryText.textContent = `🏆 ${this.selectedUser.name} wins the race! 🏆`;
                    commentaryText.style.fontSize = '26px';
                    commentaryText.style.fontWeight = '900';
                    commentaryText.style.opacity = '1';
                    this.speakCommentary(`${this.selectedUser.name} wins the race!`);
                }, 200);
            }
        }

        // Play finish sound
        setTimeout(() => {
            Sounds.playFanfare();
        }, 300);

        // Highlight the winner
        this.highlightWinner(this.selectedUser.id);

        // Record in history
        Storage.addSpinEntry(this.selectedUser.id, this.selectedUser.name);

        // Update browser tab title with winner
        const appTitle = Storage.getSetting('appTitle') || 'Team Horse Racing';
        document.title = `${this.selectedUser.name} | ${appTitle}`;

        // Call completion callback with result
        if (onComplete) {
            onComplete(this.selectedUser);
        }
    },

    /**
     * Trigger a horse fall: stop the horse and play the fall-over animation
     */
    triggerHorseFall(userId) {
        // Mark the HorseState as fallen so it stops moving
        const horseState = this.horses.find(h => h.userId === userId);
        if (horseState) horseState.hasFallen = true;

        // Switch CSS classes: remove 'racing', add 'fallen'
        const horseContainer = document.getElementById(`horse-${userId}`);
        if (horseContainer) {
            const innerHorse = horseContainer.querySelector('.race-horse');
            if (innerHorse) {
                innerHorse.classList.remove('racing');
                innerHorse.classList.add('fallen');
            }
        }

        // Optional commentary mention
        if (Storage.getSetting('commentaryEnabled') && horseState) {
            const commentaryText = document.getElementById('commentary-text');
            if (commentaryText) {
                commentaryText.style.opacity = '0';
                setTimeout(() => {
                    commentaryText.textContent = `Oh no! ${horseState.userName} is down!`;
                    commentaryText.style.opacity = '1';
                }, 200);
            }
            this.speakCommentary(`Oh no! ${horseState.userName} is down!`);
        }
    },

    /**
     * Get random user index, preventing same as last selection
     * COPIED EXACTLY from wheel.js:363-381
     */
    getRandomUserIndex() {
        let index = Math.floor(Math.random() * this.users.length);

        // Check if we need to prevent same user as last spin
        const lastSelectedId = Storage.getLastSelected();
        if (lastSelectedId) {
            const lastIndex = this.users.findIndex(u => u.id === lastSelectedId);
            if (lastIndex !== -1) {
                // Re-roll if same user
                let attempts = 0;
                while (index === lastIndex && attempts < 10) {
                    index = Math.floor(Math.random() * this.users.length);
                    attempts++;
                }
            }
        }

        return index;
    },

    /**
     * Highlight the winning horse
     */
    highlightWinner(userId) {
        const horsesGroup = document.querySelector('#horses');
        if (horsesGroup) {
            // Remove previous highlights
            horsesGroup.querySelectorAll('.race-horse').forEach(horse => {
                horse.classList.remove('winner');
            });

            // Add winner class to winning horse's inner element
            const winnerContainer = document.getElementById(`horse-${userId}`);
            if (winnerContainer) {
                const winnerHorse = winnerContainer.querySelector('.race-horse');
                if (winnerHorse) {
                    winnerHorse.classList.add('winner');
                }
            }
        }
    },

    /**
     * Clean up race state
     */
    cleanup() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        if (this.raceTimeoutId) {
            clearTimeout(this.raceTimeoutId);
            this.raceTimeoutId = null;
        }

        this.isRacing = false;
        this.horses = [];

        // Reset fall state
        this.fallenHorseUserId = null;
        this.fallTime = -1;
        this.hasFallen = false;

        // Stop any voice commentary
        if (window.speechSynthesis) window.speechSynthesis.cancel();

        // Reset commentary state
        this.lastCommentaryUpdate = 0;
        this.previousLeader = null;
        this.previousPositions = [];

        // Hide commentary when not racing
        const commentaryDisplay = document.getElementById('race-commentary');
        if (commentaryDisplay) {
            commentaryDisplay.classList.add('hidden');
        }

        // Remove racing/fallen animation from all horses
        const horsesGroup = document.querySelector('#horses');
        if (horsesGroup) {
            horsesGroup.querySelectorAll('.race-horse').forEach(horse => {
                horse.classList.remove('racing', 'fallen');
            });
        }

        const raceButton = document.getElementById('race-button');
        if (raceButton) {
            raceButton.disabled = false;
        }
    },

    /**
     * Update race title (wheel title equivalent)
     */
    updateTitle(title) {
        // Race doesn't have a center label like wheel
        // This method exists for API compatibility
    },

    /**
     * Update slice animation effect (no-op for race)
     */
    updateSliceAnimation(animation) {
        // No slice animation in race mode
        // This method exists for API compatibility
    },

    /**
     * Validate race can start
     */
    canRace() {
        const enabledUsers = Storage.getEnabledUsers();
        return enabledUsers.length >= 2 && !this.isRacing;
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        Race.init();
    });
} else {
    Race.init();
}
