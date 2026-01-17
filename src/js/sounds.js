/**
 * Sounds Module - Manages audio playback
 * Handles spinning, stop, and fanfare sounds with graceful degradation
 */

const Sounds = {
    // Audio elements
    audioElements: {
        spinning: null,
        stop: null,
        fanfare: null
    },

    // Audio file paths
    AUDIO_PATHS: {
        spinning: 'src/audio/spinning.mp3',
        stop: 'src/audio/stop.mp3',
        fanfare: 'src/audio/fanfare.mp3'
    },

    // Sound enabled state
    enabled: true,

    /**
     * Initialize sounds
     */
    init() {
        // Load enabled state from settings
        this.enabled = Storage.getSetting('soundEnabled');

        // Create audio elements with error handling
        this.createAudioElement('spinning', true); // Loop this one
        this.createAudioElement('stop', false);
        this.createAudioElement('fanfare', false);
    },

    /**
     * Create audio element with error handling
     */
    createAudioElement(name, loop = false) {
        try {
            const audio = new Audio();
            audio.src = this.AUDIO_PATHS[name];
            audio.loop = loop;
            audio.volume = 0.7;

            // Handle load errors silently
            audio.addEventListener('error', () => {
                // Silently disable this audio element if file doesn't exist
                this.audioElements[name] = null;
            });

            this.audioElements[name] = audio;
        } catch (e) {
            // Silently handle missing audio files
            this.audioElements[name] = null;
        }
    },

    /**
     * Set sound enabled state
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        Storage.setSetting('soundEnabled', enabled);
        if (!enabled) {
            this.stopAll();
        }
    },

    /**
     * Get sound enabled state
     */
    isEnabled() {
        return this.enabled;
    },

    /**
     * Play spinning sound (loop during spin)
     */
    playSpinning() {
        if (!this.enabled || !this.audioElements.spinning) return;

        try {
            // Reset to beginning if already playing
            this.audioElements.spinning.currentTime = 0;
            // Create promise to handle potential autoplay restrictions
            const playPromise = this.audioElements.spinning.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        // Audio started playing
                    })
                    .catch(() => {
                        // Autoplay prevented or file missing - silently ignore
                    });
            }
        } catch (e) {
            // Silently handle errors (file missing, etc.)
        }
    },

    /**
     * Stop spinning sound
     */
    stopSpinning() {
        if (!this.audioElements.spinning) return;

        try {
            this.audioElements.spinning.pause();
            this.audioElements.spinning.currentTime = 0;
        } catch (e) {
            // Silently handle errors
        }
    },

    /**
     * Play stop/click sound
     */
    playStop() {
        if (!this.enabled || !this.audioElements.stop) return;

        try {
            this.audioElements.stop.currentTime = 0;
            const playPromise = this.audioElements.stop.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    // Autoplay prevented or file missing - silently ignore
                });
            }
        } catch (e) {
            // Silently handle errors
        }
    },

    /**
     * Play fanfare/celebration sound
     */
    playFanfare() {
        if (!this.enabled || !this.audioElements.fanfare) return;

        try {
            this.audioElements.fanfare.currentTime = 0;
            const playPromise = this.audioElements.fanfare.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    // Autoplay prevented or file missing - silently ignore
                });
            }
        } catch (e) {
            // Silently handle errors
        }
    },

    /**
     * Stop all sounds
     */
    stopAll() {
        Object.values(this.audioElements).forEach(audio => {
            if (audio) {
                try {
                    audio.pause();
                    audio.currentTime = 0;
                } catch (e) {
                    // Ignore errors
                }
            }
        });
    }
};

// Initialize sounds when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        Sounds.init();
    });
} else {
    Sounds.init();
}
