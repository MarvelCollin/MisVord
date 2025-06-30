/**
 * Local Storage Manager for Server Groups
 */
class LocalStorageManager {
    constructor() {
        this.keys = {
            USER_PREFERENCES: 'misvord_user_preferences',
            THEME_SETTINGS: 'misvord_theme_settings',
            SERVER_GROUPS: 'misvord_server_groups',
            COLLAPSED_CATEGORIES: 'misvord_collapsed_categories',
            DRAFT_MESSAGES: 'misvord_draft_messages'
        };
        
        this.voiceStateListeners = new Set();
        this.debounceTimers = new Map();
        
        this.setupVoiceStateListener();
    }

    setupVoiceStateListener() {
        window.addEventListener('voiceStateChanged', (event) => {
            const { type, state } = event.detail;
            console.log('[LocalStorageManager] Voice state changed:', { type, state });
            
            const currentVoiceState = this.getVoiceState();
            let updatedState = { ...currentVoiceState };
            
            if (type === 'mic') {
                updatedState.isMuted = !state;
            } else if (type === 'deafen') {
                updatedState.isDeafened = state;
                if (state) {
                    updatedState.isMuted = true;
                }
            }
            
            this.setVoiceState(updatedState);
        });
    }

    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            if (item === null) return defaultValue;
            return JSON.parse(item);
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    }

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error writing to localStorage:', error);
            return false;
        }
    }

    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    }

    clear() {
        try {
            Object.values(this.keys).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }

    getUserPreferences() {
        return this.get(this.keys.USER_PREFERENCES, {
            notifications: true,
            soundEnabled: true,
            compactMode: false,
            showTimestamps: true
        });
    }

    setUserPreferences(preferences) {
        const current = this.getUserPreferences();
        const updated = { ...current, ...preferences };
        return this.set(this.keys.USER_PREFERENCES, updated);
    }

    getThemeSettings() {
        return this.get(this.keys.THEME_SETTINGS, {
            theme: 'dark',
            fontSize: 'medium',
            accentColor: 'blue'
        });
    }

    setThemeSettings(settings) {
        const current = this.getThemeSettings();
        const updated = { ...current, ...settings };
        return this.set(this.keys.THEME_SETTINGS, updated);
    }

    getServerGroups() {
        return this.get(this.keys.SERVER_GROUPS, {});
    }

    setServerGroups(groups) {
        return this.set(this.keys.SERVER_GROUPS, groups);
    }

    addServerToGroup(serverId, groupName) {
        const groups = this.getServerGroups();
        if (!groups[groupName]) {
            groups[groupName] = [];
        }
        if (!groups[groupName].includes(serverId)) {
            groups[groupName].push(serverId);
            return this.setServerGroups(groups);
        }
        return true;
    }

    removeServerFromGroup(serverId, groupName) {
        const groups = this.getServerGroups();
        if (groups[groupName]) {
            groups[groupName] = groups[groupName].filter(id => id !== serverId);
            if (groups[groupName].length === 0) {
                delete groups[groupName];
            }
            return this.setServerGroups(groups);
        }
        return true;
    }

    getCollapsedCategories() {
        return this.get(this.keys.COLLAPSED_CATEGORIES, []);
    }

    setCollapsedCategories(categories) {
        return this.set(this.keys.COLLAPSED_CATEGORIES, categories);
    }

    toggleCategoryCollapsed(categoryId) {
        const collapsed = this.getCollapsedCategories();
        const index = collapsed.indexOf(categoryId);
        
        if (index > -1) {
            collapsed.splice(index, 1);
        } else {
            collapsed.push(categoryId);
        }
        
        return this.setCollapsedCategories(collapsed);
    }

    getDraftMessage(channelId) {
        const drafts = this.get(this.keys.DRAFT_MESSAGES, {});
        return drafts[channelId] || '';
    }

    setDraftMessage(channelId, content) {
        const drafts = this.get(this.keys.DRAFT_MESSAGES, {});
        if (content.trim()) {
            drafts[channelId] = content;
        } else {
            delete drafts[channelId];
        }
        return this.set(this.keys.DRAFT_MESSAGES, drafts);
    }

    clearDraftMessage(channelId) {
        return this.setDraftMessage(channelId, '');
    }

    getVoiceState() {
        return this.get('misvord_voice_state', {
            isMuted: false,
            isDeafened: false,
            volume: 100,
            channelId: null,
            channelName: null
        });
    }

    setVoiceState(state) {
        const current = this.getVoiceState();
        const updated = { ...current, ...state };
        const success = this.set('misvord_voice_state', updated);
        
        if (success) {
            this.dispatchVoiceStateChange(updated);
            this.updateAllVoiceControls(updated);
        }
        return success;
    }

    dispatchVoiceStateChange(state) {
        const debounceKey = 'voiceStateChange';
        
        if (this.debounceTimers.has(debounceKey)) {
            clearTimeout(this.debounceTimers.get(debounceKey));
        }
        
        this.debounceTimers.set(debounceKey, setTimeout(() => {
            window.dispatchEvent(new CustomEvent('voiceStateChanged', { 
                detail: state 
            }));
            
            this.voiceStateListeners.forEach(callback => {
                try {
                    callback(state);
                } catch (error) {
                    console.error('Error in voice state listener:', error);
                }
            });
            
            this.debounceTimers.delete(debounceKey);
        }, 50));
    }

    addVoiceStateListener(callback) {
        this.voiceStateListeners.add(callback);
    }

    removeVoiceStateListener(callback) {
        this.voiceStateListeners.delete(callback);
    }

    updateAllVoiceControls(state) {
        this.updateMicControls(state);
        this.updateDeafenControls(state);
    }

    updateMicControls(state) {
        const micButtons = document.querySelectorAll('.mic-btn, #micBtn, button[title*="Mute"], button[title*="mute"]');
        micButtons.forEach(btn => {
            const icon = btn.querySelector('i');
            if (!icon) return;

            if (state.isMuted || state.isDeafened) {
                icon.className = 'fas fa-microphone-slash text-lg';
                btn.classList.add('text-[#ed4245]');
                btn.classList.remove('text-discord-lighter', 'text-[#b9bbbe]', 'text-gray-300');
                btn.title = 'Unmute';
            } else {
                icon.className = 'fas fa-microphone text-lg';
                btn.classList.remove('text-[#ed4245]');
                btn.classList.add('text-discord-lighter');
                btn.title = 'Mute';
            }
        });
    }

    updateDeafenControls(state) {
        const deafenButtons = document.querySelectorAll('.deafen-btn, #deafenBtn, button[title*="Deafen"], button[title*="deafen"]');
        deafenButtons.forEach(btn => {
            const icon = btn.querySelector('i');
            if (!icon) return;

            if (state.isDeafened) {
                icon.className = 'fas fa-volume-xmark text-lg';
                btn.classList.add('text-[#ed4245]');
                btn.classList.remove('text-discord-lighter', 'text-[#b9bbbe]', 'text-gray-300');
                btn.title = 'Undeafen';
            } else {
                icon.className = 'fas fa-headphones text-lg';
                btn.classList.remove('text-[#ed4245]');
                btn.classList.add('text-discord-lighter');
                btn.title = 'Deafen';
            }
        });
    }







    showToast(message, type = 'info') {
        if (window.showToast) {
            window.showToast(message, type, 3000);
        } else {
            console.log(`Toast (${type}): ${message}`);
        }
    }

    static getServerGroups() {
        const manager = new LocalStorageManager();
        return manager.get('misvord_server_groups_v2', []);
    }

    static setServerGroups(groups) {
        const manager = new LocalStorageManager();
        return manager.set('misvord_server_groups_v2', groups);
    }

    static addServerGroup(name) {
        const groups = this.getServerGroups();
        const groupId = Date.now().toString();
        const newGroup = {
            id: groupId,
            name: name,
            servers: [],
            collapsed: false
        };
        groups.push(newGroup);
        this.setServerGroups(groups);
        return groupId;
    }

    static removeServerGroup(groupId) {
        const groups = this.getServerGroups();
        const updatedGroups = groups.filter(group => group.id !== groupId);
        return this.setServerGroups(updatedGroups);
    }

    static renameServerGroup(groupId, newName) {
        const groups = this.getServerGroups();
        const group = groups.find(g => g.id === groupId);
        if (group) {
            group.name = newName;
            return this.setServerGroups(groups);
        }
        return false;
    }

    static addServerToGroup(groupId, serverId) {
        const groups = this.getServerGroups();
        const group = groups.find(g => g.id === groupId);
        if (group && !group.servers.includes(serverId)) {
            group.servers.push(serverId);
            return this.setServerGroups(groups);
        }
        return false;
    }

    static removeServerFromGroup(groupId, serverId) {
        const groups = this.getServerGroups();
        const group = groups.find(g => g.id === groupId);
        if (group) {
            group.servers = group.servers.filter(id => id !== serverId);
            return this.setServerGroups(groups);
        }
        return false;
    }

    static removeServerFromAllGroups(serverId) {
        const groups = this.getServerGroups();
        let updated = false;
        groups.forEach(group => {
            const originalLength = group.servers.length;
            group.servers = group.servers.filter(id => id !== serverId);
            if (group.servers.length !== originalLength) {
                updated = true;
            }
        });
        if (updated) {
            return this.setServerGroups(groups);
        }
        return false;
    }

    static getServerGroup(serverId) {
        const groups = this.getServerGroups();
        return groups.find(group => group.servers.includes(serverId));
    }

    static setGroupCollapsed(groupId, collapsed) {
        const groups = this.getServerGroups();
        const group = groups.find(g => g.id === groupId);
        if (group) {
            group.collapsed = collapsed;
            return this.setServerGroups(groups);
        }
        return false;
    }

    static toggleGroupCollapsed(groupId) {
        const groups = this.getServerGroups();
        const group = groups.find(g => g.id === groupId);
        if (group) {
            group.collapsed = !group.collapsed;
            return this.setServerGroups(groups);
        }
        return false;
    }
}

const localStorageManager = new LocalStorageManager();

export { LocalStorageManager };
export default localStorageManager;
