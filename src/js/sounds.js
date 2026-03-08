/**
 * Sounds Module - Manages audio playback
 * Only fanfare is used; spinning and stop files have been removed.
 */

const Sounds = {
    // Audio elements
    audioElements: {
        fanfare: null
    },

    // Audio file paths
    AUDIO_PATHS: {
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

        // Create audio element with error handling
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
                this.audioElements[name] = null;
            });

            this.audioElements[name] = audio;
        } catch (e) {
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
