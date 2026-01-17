/**
 * Effects Module - Handles all winner celebration effects
 * Includes confetti, fireworks, balloons, sparkles, and more
 */

const Effects = {
    activeIntervals: [],

    /**
     * Clear all active winner effects
     */
    clearEffects() {
        // Remove all effect elements from DOM
        const effectClasses = [
            'confetti',
            'firework-particle',
            'balloon',
            'sparkle',
            'light-pulse',
            'ticker-tape',
            'screen-flash',
            'winner-popup'
        ];

        effectClasses.forEach(className => {
            const elements = document.querySelectorAll(`.${className}`);
            elements.forEach(el => el.remove());
        });

        // Clear any active intervals
        this.activeIntervals.forEach(interval => clearInterval(interval));
        this.activeIntervals = [];

        // Remove effect classes from result display
        const resultDisplay = document.getElementById('result-display');
        if (resultDisplay) {
            resultDisplay.classList.remove('glow-pulse-effect');
            const resultContent = resultDisplay.querySelector('.result-content');
            if (resultContent) {
                resultContent.style.backgroundColor = '';
            }
        }

        // Remove bounce effect from result name
        const resultName = document.getElementById('result-name');
        if (resultName) {
            resultName.classList.remove('bounce-effect');
        }
    },

    /**
     * Trigger winner effect based on setting
     */
    triggerWinnerEffect(winnerName) {
        const effectType = Storage.getSetting('winnerEffect');

        switch(effectType) {
            case 'confetti':
                this.confettiBurst();
                break;
            case 'fireworks':
                this.fireworks();
                break;
            case 'balloons':
                this.balloonsRise();
                break;
            case 'sparkles':
                this.sparkles();
                break;
            case 'rainbow':
                this.rainbowFlash();
                break;
            case 'glow':
                this.glowPulse();
                break;
            case 'bounce':
                this.bounceAnimation();
                break;
            case 'lightshow':
                this.lightShow();
                break;
            case 'tickertape':
                this.tickerTape();
                break;
            case 'screenflash':
                this.screenFlash();
                break;
            case 'popup':
                this.popupWinner(winnerName);
                break;
            case 'celebration':
                this.celebrationPack(winnerName);
                break;
            case 'none':
                // No effect
                break;
        }
    },

    /**
     * Confetti Burst - colorful confetti pieces fall down
     */
    confettiBurst() {
        const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#C7CEEA', '#FF8C42'];
        const confettiCount = 50;

        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 0.5 + 's';
            document.body.appendChild(confetti);

            setTimeout(() => confetti.remove(), 10000);
        }
    },

    /**
     * Fireworks - explosive particle effects
     */
    fireworks() {
        const wheelElement = document.getElementById('wheel');
        const rect = wheelElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Create multiple bursts
        for (let burst = 0; burst < 3; burst++) {
            setTimeout(() => {
                for (let i = 0; i < 50; i++) {
                    const particle = document.createElement('div');
                    particle.className = 'firework-particle';
                    particle.style.left = centerX + 'px';
                    particle.style.top = centerY + 'px';
                    particle.style.backgroundColor = ['#FF6B6B', '#FFE66D', '#FF8C42', '#4ECDC4', '#C7CEEA'][Math.floor(Math.random() * 5)];
                    document.body.appendChild(particle);

                    const angle = (Math.PI * 2 * i) / 50 + (Math.random() * 0.2);
                    const velocity = 3 + Math.random() * 8;
                    const vx = Math.cos(angle) * velocity;
                    const vy = Math.sin(angle) * velocity;

                    let x = centerX;
                    let y = centerY;
                    let frame = 0;

                    const animate = () => {
                        frame++;
                        x += vx;
                        y += vy + (frame * 0.1); // accelerating downward

                        particle.style.left = x + 'px';
                        particle.style.top = y + 'px';
                        particle.style.opacity = 1 - (frame / 80);

                        if (frame < 80) {
                            requestAnimationFrame(animate);
                        } else {
                            particle.remove();
                        }
                    };

                    animate();
                }
            }, burst * 300);
        }
    },

    /**
     * Balloons Rise - floating balloons rise up
     */
    balloonsRise() {
        const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#C7CEEA', '#FF8C42'];
        const balloonCount = 20;

        for (let i = 0; i < balloonCount; i++) {
            const balloon = document.createElement('div');
            balloon.className = 'balloon';
            balloon.style.left = Math.random() * 100 + '%';
            balloon.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            balloon.style.animationDelay = Math.random() * 0.5 + 's';
            document.body.appendChild(balloon);

            setTimeout(() => balloon.remove(), 10000);
        }
    },

    /**
     * Sparkles - twinkling stars around result
     */
    sparkles() {
        const resultDisplay = document.getElementById('result-display');
        if (!resultDisplay || resultDisplay.classList.contains('hidden')) return;

        const rect = resultDisplay.getBoundingClientRect();

        for (let i = 0; i < 20; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            sparkle.style.left = (rect.left + Math.random() * rect.width) + 'px';
            sparkle.style.top = (rect.top + Math.random() * rect.height) + 'px';
            sparkle.style.animationDelay = Math.random() * 0.5 + 's';
            document.body.appendChild(sparkle);

            setTimeout(() => sparkle.remove(), 10000);
        }
    },

    /**
     * Rainbow Flash - result area cycles through rainbow colors
     */
    rainbowFlash() {
        const resultDisplay = document.getElementById('result-display');
        if (!resultDisplay || resultDisplay.classList.contains('hidden')) return;

        const resultContent = resultDisplay.querySelector('.result-content');
        const colors = ['#FF6B6B', '#FF8C42', '#FFE66D', '#95E1D3', '#4ECDC4', '#C7CEEA', '#EF476F'];

        let colorIndex = 0;
        const colorInterval = setInterval(() => {
            resultContent.style.backgroundColor = colors[colorIndex % colors.length];
            colorIndex++;

            if (colorIndex >= colors.length * 3) {
                clearInterval(colorInterval);
                const idx = this.activeIntervals.indexOf(colorInterval);
                if (idx > -1) this.activeIntervals.splice(idx, 1);
                resultContent.style.backgroundColor = '';
            }
        }, 100);

        // Track interval so it can be cleared
        this.activeIntervals.push(colorInterval);
    },

    /**
     * Glow Pulse - winner's slice and name glow intensely
     */
    glowPulse() {
        const resultDisplay = document.getElementById('result-display');
        if (!resultDisplay || resultDisplay.classList.contains('hidden')) return;

        resultDisplay.classList.add('glow-pulse-effect');

        setTimeout(() => {
            resultDisplay.classList.remove('glow-pulse-effect');
        }, 2000);
    },

    /**
     * Bounce Animation - result text bounces
     */
    bounceAnimation() {
        const resultName = document.getElementById('result-name');
        if (!resultName) return;

        resultName.classList.add('bounce-effect');

        setTimeout(() => {
            resultName.classList.remove('bounce-effect');
        }, 1000);
    },

    /**
     * Light Show - lights pulse around wheel perimeter
     */
    lightShow() {
        const wheel = document.getElementById('wheel');
        const rect = wheel.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const radius = rect.width / 2;

        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;

            const light = document.createElement('div');
            light.className = 'light-pulse';
            light.style.left = x + 'px';
            light.style.top = y + 'px';
            light.style.animationDelay = (i * 0.1) + 's';
            document.body.appendChild(light);

            setTimeout(() => light.remove(), 10000);
        }
    },

    /**
     * Ticker Tape - falling ribbon/tape strips
     */
    tickerTape() {
        const stripCount = 30;

        for (let i = 0; i < stripCount; i++) {
            const tape = document.createElement('div');
            tape.className = 'ticker-tape';
            tape.style.left = Math.random() * 100 + '%';
            tape.style.animationDelay = Math.random() * 0.5 + 's';
            tape.textContent = '🎉';
            document.body.appendChild(tape);

            setTimeout(() => tape.remove(), 10000);
        }
    },

    /**
     * Screen Flash - bright white flash across screen
     */
    screenFlash() {
        const flash = document.createElement('div');
        flash.className = 'screen-flash';
        document.body.appendChild(flash);

        setTimeout(() => flash.remove(), 10000);
    },

    /**
     * Popup Winner - "WINNER!" text pops up
     */
    popupWinner(winnerName) {
        const popup = document.createElement('div');
        popup.className = 'winner-popup';
        popup.textContent = '🏆 WINNER! 🏆';
        document.body.appendChild(popup);

        setTimeout(() => {
            popup.classList.add('pop-animate');
        }, 50);

        setTimeout(() => popup.remove(), 10000);
    },

    /**
     * Celebration Pack - multiple effects together
     */
    celebrationPack(winnerName) {
        this.screenFlash();
        setTimeout(() => this.confettiBurst(), 200);
        setTimeout(() => this.fireworks(), 300);
        setTimeout(() => this.popupWinner(winnerName), 400);
    }
};
