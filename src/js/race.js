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
    commentaryUpdateInterval: 600, // Update commentary every 600ms
    previousLeader: null,
    previousPositions: [],

    /**
     * Initialize race module
     */
    init() {
        this.users = Storage.getUsers();
        this.render();
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
     * Create horse graphic using emoji
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

        // Use racing horse emoji with colored circle background
        const horseSVG = `
            <!-- Colored circle background for user identification -->
            <circle cx="0" cy="0" r="20" fill="${user.color}" opacity="0.85" stroke="#fff" stroke-width="2"/>

            <!-- Horse emoji as text element -->
            <text x="0" y="0" font-size="38" text-anchor="middle" dominant-baseline="central">🐎</text>
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

        // Play racing sound
        Sounds.playSpinning();

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

        // Reset all horse positions and add racing animation
        this.horses.forEach((horse, index) => {
            const horseContainer = document.getElementById(`horse-${horse.userId}`);
            if (horseContainer) {
                const laneY = (index + 0.5) * laneHeight;
                horseContainer.setAttribute('transform', `translate(${this.startLineX}, ${laneY})`);

                // Add galloping animation to inner horse element
                const innerHorse = horseContainer.querySelector('.race-horse');
                if (innerHorse) {
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

        // Update all horse positions
        const trackHeight = 600;
        const laneHeight = trackHeight / this.users.length;

        this.horses.forEach((horse, index) => {
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
            // Early race - identify leader
            if (secondPlace && Math.abs(leader.position - secondPlace.position) < 30) {
                commentary = `It's ${leader.userName} and ${secondPlace.userName} neck and neck!`;
            } else {
                commentary = `${leader.userName} takes an early lead!`;
            }
        } else if (progress < 0.5) {
            // Mid race - track position changes
            if (this.previousLeader && this.previousLeader !== leader.userName) {
                commentary = `${leader.userName} surges ahead! ${this.previousLeader} falling back!`;
            } else if (secondPlace && Math.abs(leader.position - secondPlace.position) < 40) {
                commentary = `${secondPlace.userName} closing in on ${leader.userName}!`;
            } else {
                commentary = `${leader.userName} maintaining the lead!`;
            }
        } else if (progress < 0.75) {
            // Late mid race - building tension
            const gap = secondPlace ? leader.position - secondPlace.position : 100;
            if (gap < 30) {
                commentary = `This is a close race! ${leader.userName} barely ahead of ${secondPlace.userName}!`;
            } else if (gap < 60) {
                commentary = `${secondPlace.userName} is catching up to ${leader.userName}!`;
            } else {
                commentary = `${leader.userName} pulling away from the pack!`;
            }
        } else {
            // Final stretch - maximum drama
            if (secondPlace && Math.abs(leader.position - secondPlace.position) < 35) {
                commentary = `Coming down to the wire! ${leader.userName} and ${secondPlace.userName} in a photo finish!`;
            } else if (leader.isWinner) {
                commentary = `${leader.userName} charging to the finish line!`;
            } else {
                commentary = `It's anyone's race! Who will cross first?!`;
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
        }
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
                }, 200);
            }
        }

        // Stop racing sound and play finish sounds
        Sounds.stopSpinning();
        Sounds.playStop();
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

        // Reset commentary state
        this.lastCommentaryUpdate = 0;
        this.previousLeader = null;
        this.previousPositions = [];

        // Hide commentary when not racing
        const commentaryDisplay = document.getElementById('race-commentary');
        if (commentaryDisplay) {
            commentaryDisplay.classList.add('hidden');
        }

        // Remove racing animation from all horses
        const horsesGroup = document.querySelector('#horses');
        if (horsesGroup) {
            horsesGroup.querySelectorAll('.race-horse').forEach(horse => {
                horse.classList.remove('racing');
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
