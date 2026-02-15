/**
 * Storage Module - Manages all localStorage operations
 * Handles: users, colors, history, settings, and data persistence
 * All data is stored under a single 'RacingWinner' namespace in localStorage
 */

const Storage = {
    // Namespace for all localStorage data
    NAMESPACE: 'RacingWinner',

    // Storage keys (used internally within the namespace)
    STORAGE_KEYS: {
        USERS: 'users',
        HISTORY: 'history',
        SETTINGS: 'settings',
        LAST_VIEW: 'lastView',
        FIRST_VISIT: 'firstVisit',
        LAST_SELECTED: 'lastSelected'
    },

    // Default settings
    DEFAULT_SETTINGS: {
        spinDuration: 7,
        soundEnabled: true,
        darkMode: false,
        winnerEffect: 'confetti',
        commentaryEnabled: true
    },

    // Color palette
    COLOR_PALETTE: [
        '#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3',
        '#C7CEEA', '#FF8C42', '#FB5607', '#06D6A0',
        '#EF476F', '#FFD166', '#06FFA5', '#FF006E',
        '#9B59B6', '#3498DB', '#E74C3C', '#F39C12',
        '#1ABC9C', '#2ECC71', '#E91E63', '#00BCD4',
        '#FF5722', '#8E44AD'
    ],

    /**
     * Get the entire namespace data object from localStorage
     */
    _getNamespaceData() {
        try {
            const data = localStorage.getItem(this.NAMESPACE);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error('Error loading namespace data:', e);
            return {};
        }
    },

    /**
     * Save the entire namespace data object to localStorage
     */
    _setNamespaceData(data) {
        try {
            localStorage.setItem(this.NAMESPACE, JSON.stringify(data));
        } catch (e) {
            console.error('Error saving namespace data:', e);
        }
    },

    /**
     * Get a specific key from the namespace
     */
    _getNamespaceKey(key) {
        const data = this._getNamespaceData();
        return data[key];
    },

    /**
     * Set a specific key in the namespace
     */
    _setNamespaceKey(key, value) {
        const data = this._getNamespaceData();
        data[key] = value;
        this._setNamespaceData(data);
    },

    /**
     * Initialize storage - set up first visit flag
     */
    init() {
        const firstVisit = this._getNamespaceKey(this.STORAGE_KEYS.FIRST_VISIT);
        if (firstVisit === undefined) {
            this._setNamespaceKey(this.STORAGE_KEYS.FIRST_VISIT, 'false');
        }
    },

    /**
     * Check if this is the first visit
     */
    isFirstVisit() {
        return this._getNamespaceKey(this.STORAGE_KEYS.FIRST_VISIT) === 'false' &&
            this.getUsers().length === 0;
    },

    /**
     * Mark as not first visit
     */
    markFirstVisitDone() {
        this._setNamespaceKey(this.STORAGE_KEYS.FIRST_VISIT, 'true');
    },

    // ==================== USERS ====================

    /**
     * Get all users
     */
    getUsers() {
        try {
            const users = this._getNamespaceKey(this.STORAGE_KEYS.USERS);
            const parsedUsers = users ? users : [];
            // Ensure all users have an enabled property (default to true for existing users)
            return parsedUsers.map(user => ({
                ...user,
                enabled: user.enabled !== undefined ? user.enabled : true
            }));
        } catch (e) {
            console.error('Error loading users:', e);
            return [];
        }
    },

    /**
     * Add a new user
     */
    addUser(name, color) {
        const users = this.getUsers();
        const user = {
            id: Date.now().toString(),
            name: name.trim(),
            color: color,
            enabled: true,
            createdAt: new Date().toISOString()
        };
        users.push(user);
        this._setNamespaceKey(this.STORAGE_KEYS.USERS, users);
        return user;
    },

    /**
     * Get enabled users only (for wheel display and spinning)
     */
    getEnabledUsers() {
        const users = this.getUsers();
        return users.filter(user => user.enabled !== false);
    },

    /**
     * Toggle user enabled state
     */
    toggleUserEnabled(id) {
        const users = this.getUsers();
        const user = users.find(u => u.id === id);
        if (user) {
            user.enabled = user.enabled === false ? true : false;
            this._setNamespaceKey(this.STORAGE_KEYS.USERS, users);
            return user;
        }
        return null;
    },

    /**
     * Update user
     */
    updateUser(id, updates) {
        const users = this.getUsers();
        const user = users.find(u => u.id === id);
        if (user) {
            Object.assign(user, updates);
            this._setNamespaceKey(this.STORAGE_KEYS.USERS, users);
            return user;
        }
        return null;
    },

    /**
     * Delete user
     */
    deleteUser(id) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.id === id);
        if (index !== -1) {
            users.splice(index, 1);
            this._setNamespaceKey(this.STORAGE_KEYS.USERS, users);
            return true;
        }
        return false;
    },

    /**
     * Check if user exists by name
     */
    userExists(name) {
        const users = this.getUsers();
        return users.some(u => u.name.toLowerCase() === name.toLowerCase());
    },

    /**
     * Get user by ID
     */
    getUser(id) {
        const users = this.getUsers();
        return users.find(u => u.id === id) || null;
    },

    // ==================== HISTORY ====================

    /**
     * Get spin history
     */
    getHistory() {
        try {
            const history = this._getNamespaceKey(this.STORAGE_KEYS.HISTORY);
            return history ? history : [];
        } catch (e) {
            console.error('Error loading history:', e);
            return [];
        }
    },

    /**
     * Add spin to history
     */
    addSpinEntry(userId, userName) {
        const history = this.getHistory();
        const entry = {
            id: Date.now().toString(),
            userId: userId,
            userName: userName,
            timestamp: new Date().toISOString(),
            spinNumber: history.length + 1
        };
        history.push(entry);

        // Keep rolling window of last 500 spins
        if (history.length > 500) {
            history.shift();
        }

        this._setNamespaceKey(this.STORAGE_KEYS.HISTORY, history);
        this.setLastSelected(userId);
        return entry;
    },

    /**
     * Clear all history
     */
    clearHistory() {
        this._setNamespaceKey(this.STORAGE_KEYS.HISTORY, []);
    },

    /**
     * Get last selected user ID
     */
    getLastSelected() {
        return this._getNamespaceKey(this.STORAGE_KEYS.LAST_SELECTED);
    },

    /**
     * Set last selected user ID
     */
    setLastSelected(userId) {
        this._setNamespaceKey(this.STORAGE_KEYS.LAST_SELECTED, userId);
    },

    /**
     * Calculate statistics from history
     */
    calculateStatistics() {
        const history = this.getHistory();
        const users = this.getUsers();
        const stats = {};

        // Initialize stats for each user
        users.forEach(user => {
            stats[user.id] = {
                user: user,
                winCount: 0,
                selections: 0,
                currentStreak: 0,
                longestStreak: 0
            };
        });

        // Count selections
        let lastUserId = null;
        let currentStreak = null;

        history.forEach(entry => {
            if (stats[entry.userId]) {
                stats[entry.userId].winCount++;
                stats[entry.userId].selections++;

                // Calculate streaks
                if (entry.userId === lastUserId) {
                    if (currentStreak === null) {
                        currentStreak = { userId: entry.userId, count: 1 };
                    } else {
                        currentStreak.count++;
                    }
                } else {
                    if (currentStreak && stats[currentStreak.userId]) {
                        stats[currentStreak.userId].longestStreak =
                            Math.max(stats[currentStreak.userId].longestStreak, currentStreak.count);
                    }
                    currentStreak = { userId: entry.userId, count: 1 };
                }
                lastUserId = entry.userId;
            }
        });

        // Finalize current streak
        if (currentStreak && stats[currentStreak.userId]) {
            stats[currentStreak.userId].currentStreak = currentStreak.count;
            stats[currentStreak.userId].longestStreak =
                Math.max(stats[currentStreak.userId].longestStreak, currentStreak.count);
        }

        // Calculate percentages
        const totalSpins = history.length;
        Object.values(stats).forEach(stat => {
            stat.percentage = totalSpins > 0 ? ((stat.winCount / totalSpins) * 100).toFixed(1) : 0;
        });

        return stats;
    },

    // ==================== SETTINGS ====================

    /**
     * Get all settings
     */
    getSettings() {
        try {
            const settings = this._getNamespaceKey(this.STORAGE_KEYS.SETTINGS);
            return settings ? { ...this.DEFAULT_SETTINGS, ...settings } : this.DEFAULT_SETTINGS;
        } catch (e) {
            console.error('Error loading settings:', e);
            return this.DEFAULT_SETTINGS;
        }
    },

    /**
     * Update settings
     */
    updateSettings(updates) {
        const settings = this.getSettings();
        const updated = { ...settings, ...updates };
        this._setNamespaceKey(this.STORAGE_KEYS.SETTINGS, updated);
        return updated;
    },

    /**
     * Get single setting
     */
    getSetting(key) {
        const settings = this.getSettings();
        return settings[key] !== undefined ? settings[key] : this.DEFAULT_SETTINGS[key];
    },

    /**
     * Set single setting
     */
    setSetting(key, value) {
        const settings = this.getSettings();
        settings[key] = value;
        this._setNamespaceKey(this.STORAGE_KEYS.SETTINGS, settings);
    },

    // ==================== VIEW NAVIGATION ====================

    /**
     * Get last viewed section
     */
    getLastView() {
        return this._getNamespaceKey(this.STORAGE_KEYS.LAST_VIEW) || 'wheel';
    },

    /**
     * Set last viewed section
     */
    setLastView(viewName) {
        this._setNamespaceKey(this.STORAGE_KEYS.LAST_VIEW, viewName);
    },

    // ==================== EXPORT/IMPORT ====================

    /**
     * Export history as CSV
     */
    exportHistoryAsCSV() {
        const history = this.getHistory();
        if (history.length === 0) {
            alert('No history to export');
            return;
        }

        let csv = 'Race #,Date,Time,User Name\n';
        history.forEach(entry => {
            const date = new Date(entry.timestamp);
            const dateStr = date.toLocaleDateString();
            const timeStr = date.toLocaleTimeString();
            csv += `${entry.spinNumber},"${dateStr}","${timeStr}","${entry.userName}"\n`;
        });

        // Download CSV file
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `race-history-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
    },

    /**
     * Export history as JSON
     */
    exportHistoryAsJSON() {
        const data = {
            exportDate: new Date().toISOString(),
            users: this.getUsers(),
            history: this.getHistory(),
            statistics: this.calculateStatistics()
        };

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `race-data-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        window.URL.revokeObjectURL(url);
    },

    /**
     * Generate shareable link with encoded state
     */
    generateShareableLink() {
        const state = {
            users: this.getUsers(),
            settings: this.getSettings()
        };
        const encoded = btoa(JSON.stringify(state));
        const baseUrl = window.location.origin + window.location.pathname;
        return `${baseUrl}?share=${encoded}`;
    },

    /**
     * Load state from shared link
     */
    loadFromShareableLink(encodedState) {
        try {
            const state = JSON.parse(atob(encodedState));
            if (state.users && Array.isArray(state.users)) {
                return state;
            }
        } catch (e) {
            console.error('Error loading shared state:', e);
        }
        return null;
    },

    /**
     * Apply shared state (users and settings)
     */
    applySharedState(state) {
        if (state.users && Array.isArray(state.users)) {
            this._setNamespaceKey(this.STORAGE_KEYS.USERS, state.users);
        }
        if (state.settings && typeof state.settings === 'object') {
            this._setNamespaceKey(this.STORAGE_KEYS.SETTINGS, state.settings);
        }
    },

    // ==================== RESET ====================

    /**
     * Reset entire app (clear all data)
     */
    resetAll() {
        // Clear the entire namespace
        this._setNamespaceData({});
        // Re-initialize first visit flag
        this._setNamespaceKey(this.STORAGE_KEYS.FIRST_VISIT, 'false');
    },

    /**
     * Export all data to JSON
     */
    exportAllData() {
        const data = {
            users: this.getUsers(),
            history: this.getHistory(),
            settings: this.getSettings(),
            lastSelected: this._getNamespaceKey(this.STORAGE_KEYS.LAST_SELECTED),
            lastView: this._getNamespaceKey(this.STORAGE_KEYS.LAST_VIEW),
            firstVisit: this._getNamespaceKey(this.STORAGE_KEYS.FIRST_VISIT),
            appTitle: this.getSetting('appTitle'),
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        return data;
    },

    /**
     * Import all data from JSON
     */
    importAllData(data) {
        try {
            // Validate data structure
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid data format');
            }

            // Import users
            if (data.users && Array.isArray(data.users)) {
                this._setNamespaceKey(this.STORAGE_KEYS.USERS, data.users);
            }

            // Import history
            if (data.history && Array.isArray(data.history)) {
                this._setNamespaceKey(this.STORAGE_KEYS.HISTORY, data.history);
            }

            // Import settings
            if (data.settings && typeof data.settings === 'object') {
                this._setNamespaceKey(this.STORAGE_KEYS.SETTINGS, data.settings);
            }

            // Import other data
            if (data.lastSelected) {
                this._setNamespaceKey(this.STORAGE_KEYS.LAST_SELECTED, data.lastSelected);
            }

            if (data.lastView) {
                this._setNamespaceKey(this.STORAGE_KEYS.LAST_VIEW, data.lastView);
            }

            if (data.firstVisit) {
                this._setNamespaceKey(this.STORAGE_KEYS.FIRST_VISIT, data.firstVisit);
            }

            return true;
        } catch (e) {
            console.error('Error importing data:', e);
            return false;
        }
    },

    /**
     * Download data as JSON file
     */
    downloadDataAsJSON() {
        const data = this.exportAllData();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const appTitle = this.getSetting('appTitle') || 'SpinningWheel';
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `${appTitle.replace(/\s+/g, '_')}_backup_${timestamp}.json`;

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};

// Initialize storage on load
Storage.init();
