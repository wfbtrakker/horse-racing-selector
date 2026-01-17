/**
 * Wheel Module - Handles wheel rendering and spin logic
 * Manages wheel display, animations, and result calculation
 */

const Wheel = {
    // State
    isSpinning: false,
    currentRotation: 0,
    users: [],
    sliceAngle: 0,
    spinTimeoutId: null,
    transitionHandler: null,

    /**
     * Initialize wheel
     */
    init() {
        this.users = Storage.getUsers();
        this.render();
    },

    /**
     * Render the wheel with current users using SVG
     */
    render() {
        const wheelElement = document.getElementById('wheel');
        // Only render enabled users on the wheel
        this.users = Storage.getEnabledUsers();

        // Clear existing SVG
        const existingSvg = wheelElement.querySelector('svg');
        if (existingSvg) {
            existingSvg.remove();
        }

        if (this.users.length === 0) return;

        this.sliceAngle = 360 / this.users.length;

        // Create SVG element
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', '0 0 200 200');
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.zIndex = '5';

        // Draw wheel slices
        this.users.forEach((user, index) => {
            const startAngle = index * this.sliceAngle;
            const endAngle = (index + 1) * this.sliceAngle;
            const midAngle = (startAngle + endAngle) / 2;

            // Create path for pie slice
            const path = this.createPieSlicePath(100, 100, 95, startAngle, endAngle);

            const sliceElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            sliceElement.setAttribute('d', path);
            sliceElement.setAttribute('fill', user.color);
            sliceElement.setAttribute('stroke', 'white');
            sliceElement.setAttribute('stroke-width', '2');
            sliceElement.setAttribute('data-user-id', user.id);
            sliceElement.setAttribute('data-user-name', user.name);
            sliceElement.id = `slice-${user.id}`;

            svg.appendChild(sliceElement);

            // Add text label
            const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            const midRad = (midAngle * Math.PI) / 180;
            const textDistance = 65;
            const textX = 100 + Math.cos(midRad - Math.PI / 2) * textDistance;
            const textY = 100 + Math.sin(midRad - Math.PI / 2) * textDistance;

            let displayName = user.name;
            if (displayName.length > 10) {
                displayName = displayName.substring(0, 8) + '...';
            }

            textElement.setAttribute('x', textX);
            textElement.setAttribute('y', textY);
            textElement.setAttribute('text-anchor', 'middle');
            textElement.setAttribute('dominant-baseline', 'middle');
            textElement.setAttribute('fill', 'white');
            textElement.setAttribute('font-weight', 'bold');
            textElement.setAttribute('font-size', '10');
            textElement.setAttribute('text-shadow', '2px 2px 4px rgba(0, 0, 0, 0.7)');
            textElement.setAttribute('pointer-events', 'none');
            textElement.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.7)';

            // Rotate text to align with the slice radially
            // All text reads left-to-right when on the right side of the wheel
            let rotation = midAngle - 90;

            textElement.setAttribute('transform', `rotate(${rotation} ${textX} ${textY})`);

            textElement.textContent = displayName;
            svg.appendChild(textElement);
        });

        // Insert SVG into wheel element
        wheelElement.insertBefore(svg, wheelElement.firstChild);

        // Apply saved slice animation
        const sliceAnimation = Storage.getSetting('sliceAnimation') || 'none';
        if (sliceAnimation !== 'none') {
            svg.querySelectorAll('path').forEach(path => {
                path.classList.add(sliceAnimation);
            });
        }

        // Update or create center label
        let center = wheelElement.querySelector('.wheel-center');
        if (!center) {
            center = document.createElement('div');
            center.className = 'wheel-center';
            wheelElement.appendChild(center);
        }
        center.textContent = Storage.getSetting('wheelTitle');
        center.style.zIndex = '15';
    },

    /**
     * Create SVG path for a pie slice
     */
    createPieSlicePath(centerX, centerY, radius, startAngle, endAngle) {
        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;

        const x1 = centerX + Math.cos(startRad - Math.PI / 2) * radius;
        const y1 = centerY + Math.sin(startRad - Math.PI / 2) * radius;

        const x2 = centerX + Math.cos(endRad - Math.PI / 2) * radius;
        const y2 = centerY + Math.sin(endRad - Math.PI / 2) * radius;

        const largeArc = endAngle - startAngle > 180 ? 1 : 0;

        return `
            M ${centerX} ${centerY}
            L ${x1} ${y1}
            A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
            Z
        `;
    },

    /**
     * Spin the wheel
     */
    spin(onComplete) {
        if (this.isSpinning || this.users.length < 2) return;

        // Clean up any previous spin state
        const wheelElement = document.getElementById('wheel');
        if (this.transitionHandler) {
            wheelElement.removeEventListener('transitionend', this.transitionHandler);
            this.transitionHandler = null;
        }
        if (this.spinTimeoutId) {
            clearTimeout(this.spinTimeoutId);
            this.spinTimeoutId = null;
        }

        // Refresh users and slice angle to ensure we're working with current data
        // Only get enabled users for the wheel
        this.users = Storage.getEnabledUsers();
        this.sliceAngle = 360 / this.users.length;

        // Clear any active winner effects from previous spin
        if (typeof Effects !== 'undefined') {
            Effects.clearEffects();
        }

        // Hide the previous winner display
        const resultDisplay = document.getElementById('result-display');
        if (resultDisplay) {
            resultDisplay.classList.add('hidden');
        }

        // Clear any previous highlights when starting a new spin
        const svg = document.querySelector('#wheel svg');
        if (svg) {
            svg.querySelectorAll('path').forEach(path => {
                path.style.filter = '';
                path.style.strokeWidth = '2';
                path.style.stroke = 'white';
            });
        }

        this.isSpinning = true;
        const spinButton = document.getElementById('spin-button');
        if (spinButton) {
            spinButton.disabled = true;
        }

        const settings = Storage.getSettings();
        const duration = settings.spinDuration;
        const speedMultiplier = settings.animationSpeed;

        // Play spinning sound
        Sounds.playSpinning();

        // Calculate random result (preventing same user as last spin)
        const selectedIndex = this.getRandomUserIndex();
        const selectedUser = this.users[selectedIndex];

        // Calculate final rotation
        // We want the selected slice to land on the pointer (at right side, 90 degrees)
        // Add random offset within the slice so it doesn't always stop at exact center
        const sliceStart = selectedIndex * this.sliceAngle;
        const sliceEnd = (selectedIndex + 1) * this.sliceAngle;

        // Random position within the slice (avoid the very edges for clarity)
        const edgeBuffer = this.sliceAngle * 0.15; // 15% buffer from edges
        const randomOffsetWithinSlice = (Math.random() * (this.sliceAngle - 2 * edgeBuffer)) + edgeBuffer;
        const randomSlicePosition = sliceStart + randomOffsetWithinSlice;

        const fullRotations = 5;

        // Calculate target position (where the wheel needs to end up to align random position with pointer)
        // The pointer is at the right side (3 o'clock position)
        // In the SVG drawing code, slices use (angle - 90°) transformation
        // So to align a slice position with the right-side pointer, we need:
        // rotation + (randomSlicePosition - 90°) = 0° (right side in standard coords)
        // Therefore: rotation = 90° - randomSlicePosition
        let targetPosition = 90 - randomSlicePosition;

        // Normalize target position to 0-360 range
        while (targetPosition < 0) targetPosition += 360;
        while (targetPosition >= 360) targetPosition -= 360;

        // Get current position normalized to 0-360 range
        let currentPosition = this.currentRotation % 360;
        while (currentPosition < 0) currentPosition += 360;
        while (currentPosition >= 360) currentPosition -= 360;

        // Get rotation direction
        const direction = settings.rotationDirection === 'counter-clockwise' ? -1 : 1;

        // Calculate how much to rotate from current position to target position
        let rotationDelta;
        if (direction === 1) { // clockwise
            rotationDelta = targetPosition - currentPosition;
            if (rotationDelta <= 0) rotationDelta += 360;
            rotationDelta += fullRotations * 360;
        } else { // counter-clockwise
            rotationDelta = targetPosition - currentPosition;
            if (rotationDelta >= 0) rotationDelta -= 360;
            rotationDelta -= fullRotations * 360;
        }

        const finalRotation = this.currentRotation + rotationDelta;

        // Create custom animation duration based on settings and speed multiplier
        const animationDuration = duration * speedMultiplier;

        // Apply spin animation
        wheelElement.style.transition = `none`;
        wheelElement.style.transform = `rotate(${this.currentRotation}deg)`;

        // Force reflow to restart animation
        void wheelElement.offsetWidth;

        // Set the animation with custom easing for gradual deceleration
        // This cubic-bezier creates a more dramatic slowdown in the final 10% of the spin
        wheelElement.style.transition = `transform ${animationDuration}s cubic-bezier(0.33, 0.66, 0.35, 0.99)`;
        wheelElement.style.transform = `rotate(${finalRotation}deg)`;

        // Create completion handler
        this.transitionHandler = (e) => {
            // Only handle transform transitions, ignore others
            if (e && e.propertyName !== 'transform') {
                return;
            }

            // Check if already processed (prevent double-firing)
            if (!this.isSpinning) {
                return;
            }

            // Clean up
            this.cleanupSpin();

            try {
                Sounds.stopSpinning();
                Sounds.playStop();
                setTimeout(() => {
                    Sounds.playFanfare();
                }, 300);

                // Normalize the final rotation to 0-360 range to prevent huge numbers
                const normalizedRotation = ((finalRotation % 360) + 360) % 360;

                // Ensure wheel stays at final position (lock in the transform)
                wheelElement.style.transition = 'none';
                wheelElement.style.transform = `rotate(${normalizedRotation}deg)`;

                // Update current rotation after animation completes (normalized)
                this.currentRotation = normalizedRotation;

                // Highlight the selected slice
                this.highlightSlice(selectedUser.id);

                // Record in history
                Storage.addSpinEntry(selectedUser.id, selectedUser.name);

                // Update browser tab title with winner
                const appTitle = Storage.getSetting('appTitle') || 'Spinning Wheel';
                document.title = `${selectedUser.name} | ${appTitle}`;

                // Call completion callback with result
                if (onComplete) {
                    onComplete(selectedUser);
                }
            } catch (error) {
                // Silently handle errors
            }
        };

        wheelElement.addEventListener('transitionend', this.transitionHandler);

        // Fallback timeout in case transitionend doesn't fire
        this.spinTimeoutId = setTimeout(() => {
            if (this.isSpinning) {
                // Call with fake event object to bypass property check
                this.transitionHandler({ propertyName: 'transform' });
            }
        }, (animationDuration * 1000) + 500);
    },

    /**
     * Clean up spin state and re-enable button
     */
    cleanupSpin() {
        const wheelElement = document.getElementById('wheel');
        const spinButton = document.getElementById('spin-button');

        // Remove event listener
        if (this.transitionHandler) {
            wheelElement.removeEventListener('transitionend', this.transitionHandler);
            this.transitionHandler = null;
        }

        // Clear timeout
        if (this.spinTimeoutId) {
            clearTimeout(this.spinTimeoutId);
            this.spinTimeoutId = null;
        }

        // Reset spinning flag and enable button
        this.isSpinning = false;

        if (spinButton) {
            spinButton.disabled = false;
        }
    },

    /**
     * Get random user index, preventing same as last selection
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
     * Highlight the selected slice
     */
    highlightSlice(userId) {
        // Remove previous highlights
        const svg = document.querySelector('#wheel svg');
        if (svg) {
            svg.querySelectorAll('path').forEach(path => {
                path.style.filter = '';
                path.style.strokeWidth = '2';
                path.style.stroke = 'white';
            });

            // Add glow highlight to selected slice
            const sliceElement = svg.querySelector(`#slice-${userId}`);
            if (sliceElement) {
                // Smaller, more contained glow effect
                sliceElement.style.filter = 'brightness(1.3) drop-shadow(0 0 4px rgba(255, 215, 0, 1)) drop-shadow(0 0 8px rgba(255, 215, 0, 0.7))';
                sliceElement.style.strokeWidth = '5';
                sliceElement.style.stroke = '#FFD700';
            }
        }
    },

    /**
     * Update wheel title
     */
    updateTitle(title) {
        const center = document.querySelector('.wheel-center');
        if (center) {
            center.textContent = title;
        }
    },

    /**
     * Update slice animation effect
     */
    updateSliceAnimation(animation) {
        const svg = document.querySelector('#wheel svg');
        if (svg) {
            svg.querySelectorAll('path').forEach(path => {
                path.classList.remove('pulse', 'glow');
                if (animation !== 'none') {
                    path.classList.add(animation);
                }
            });
        }
    },

    /**
     * Validate wheel can spin
     */
    canSpin() {
        const enabledUsers = Storage.getEnabledUsers();
        return enabledUsers.length >= 2 && !this.isSpinning;
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        Wheel.init();
    });
} else {
    Wheel.init();
}
