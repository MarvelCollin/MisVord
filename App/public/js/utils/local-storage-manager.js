
class LocalStorageManager {
    constructor() {
        this.keys = {
            USER_PREFERENCES: 'misvord_user_preferences',
            THEME_SETTINGS: 'misvord_theme_settings',
            SERVER_GROUPS: 'misvord_server_groups',
            COLLAPSED_CATEGORIES: 'misvord_collapsed_categories',
            DRAFT_MESSAGES: 'misvord_draft_messages',
            UNIFIED_VOICE_STATE: 'misvord_unified_voice_state'
        };
        
        this.voiceStateListeners = new Set();
        this.debounceTimers = new Map();
        
        this.migrateOldVoiceState();
        this.cleanupStaleVoiceConnections();
    }

    migrateOldVoiceState() {
        const oldState = this.get('misvord_voice_state');
        const oldConnectionState = this.get('voiceConnectionState');
        
        if (oldState || oldConnectionState) {
            const unified = {
                isMuted: oldState?.isMuted || false,
                isDeafened: oldState?.isDeafened || false,
                volume: oldState?.volume || 100,
                isConnected: oldConnectionState?.isConnected || false,
                channelId: oldConnectionState?.currentChannelId || oldState?.channelId || null,
                channelName: oldConnectionState?.channelName || oldState?.channelName || null,
                meetingId: oldConnectionState?.meetingId || null,
                connectionTime: oldConnectionState?.connectionTime || Date.now()
            };
            
            this.set(this.keys.UNIFIED_VOICE_STATE, unified);
            this.remove('misvord_voice_state');
            this.remove('voiceConnectionState');
        }
    }
    
    cleanupStaleVoiceConnections() {
        const voiceState = this.getUnifiedVoiceState();
        
        if (voiceState.isConnected) {
            const now = Date.now();
            const connectionTime = voiceState.connectionTime || 0;
            const timeSinceConnection = now - connectionTime;
            
            if (timeSinceConnection > 300000) {
                console.log('🧹 [LOCAL-STORAGE] Detected very stale voice connection, cleaning up:', {
                    channelId: voiceState.channelId,
                    meetingId: voiceState.meetingId,
                    since: voiceState.connectionTime ? new Date(voiceState.connectionTime).toLocaleTimeString() : 'unknown',
                    timeSinceConnection: Math.round(timeSinceConnection / 1000) + 's'
                });
                
                this.setUnifiedVoiceState({
                    ...voiceState,
                    isConnected: false,
                    disconnectionReason: 'very_stale_connection_cleanup',
                    disconnectionTime: now
                });
            } else {
                console.log('🔄 [LOCAL-STORAGE] Voice connection detected, preserving for restoration:', {
                    channelId: voiceState.channelId,
                    meetingId: voiceState.meetingId,
                    since: voiceState.connectionTime ? new Date(voiceState.connectionTime).toLocaleTimeString() : 'unknown',
                    timeSinceConnection: Math.round(timeSinceConnection / 1000) + 's'
                });
                
                this.setUnifiedVoiceState({
                    ...voiceState,
                    needsRestoration: true,
                    lastActivity: now
                });
            }
        }
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

    getUnifiedVoiceState() {
        return this.get(this.keys.UNIFIED_VOICE_STATE, {
            isMuted: true,
            isDeafened: false,
            volume: 100,
            isConnected: false,
            channelId: null,
            channelName: null,
            meetingId: null,
            connectionTime: null,
            videoOn: false,
            screenShareOn: false,
            needsRestoration: false
        });
    }

    setUnifiedVoiceState(state) {
        const current = this.getUnifiedVoiceState();
        const updated = { ...current, ...state };

        const success = this.set(this.keys.UNIFIED_VOICE_STATE, updated);
        
        if (success) {
            this.notifyVoiceStateListeners(updated);
        }
        
        return success;
    }

    notifyVoiceStateListeners(state) {
        const debounceKey = 'unifiedVoiceStateChange';
        
        if (this.debounceTimers.has(debounceKey)) {
            clearTimeout(this.debounceTimers.get(debounceKey));
        }
        
        this.debounceTimers.set(debounceKey, setTimeout(() => {
            this.voiceStateListeners.forEach(callback => {
                try {
                    callback(state);
                } catch (error) {
                    console.error('Error in unified voice state listener:', error);
                }
            });
            

            if (window.ChannelVoiceParticipants && state.channelId && state.isConnected) {
                const instance = window.ChannelVoiceParticipants.getInstance();
                instance.updateSidebarForChannel(state.channelId, 'full');
            }
            
            this.debounceTimers.delete(debounceKey);
        }, 50));
    }

    addVoiceStateListener(callback) {
        this.voiceStateListeners.add(callback);
    }

    removeVoiceStateListener(callback) {
        this.voiceStateListeners.delete(callback);
    }

    getVoiceState() {
        return this.getUnifiedVoiceState();
    }

    setVoiceState(state) {
        return this.setUnifiedVoiceState(state);
    }

    clearVoiceState() {
        const currentState = this.getUnifiedVoiceState();
        return this.setUnifiedVoiceState({
            ...currentState,
            isConnected: false,
            channelId: null,
            channelName: null,
            meetingId: null,
            connectionTime: null,
            disconnectionTime: Date.now()
        });
    }

    toggleVoiceMute() {
        if (window.voiceManager) {
            return window.voiceManager.toggleMic();
        } else {
            const currentState = this.getUnifiedVoiceState();
            const newMutedState = !currentState.isMuted;
            
            this.setUnifiedVoiceState({
                ...currentState,
                isMuted: newMutedState
            });
            
            return !newMutedState;
        }
    }

    toggleVoiceDeafen() {
        if (window.voiceManager) {
            return window.voiceManager.toggleDeafen();
        } else {
            const currentState = this.getUnifiedVoiceState();
            const newDeafenedState = !currentState.isDeafened;
            
            this.setUnifiedVoiceState({
                ...currentState,
                isDeafened: newDeafenedState,
                isMuted: newDeafenedState ? true : currentState.isMuted
            });
            
            return newDeafenedState;
        }
    }

    setVideoState(isOn) {
        const currentState = this.getUnifiedVoiceState();
        return this.setUnifiedVoiceState({
            ...currentState,
            videoOn: isOn
        });
    }

    setScreenShareState(isOn) {
        const currentState = this.getUnifiedVoiceState();
        return this.setUnifiedVoiceState({
            ...currentState,
            screenShareOn: isOn
        });
    }

    showToast(message, type = 'info') {
        if (window.showToast) {
            window.showToast(message, type, 3000);
        } else {

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

    static getServerOrder() {
        const manager = new LocalStorageManager();
        return manager.get('misvord_server_order', []);
    }

    static setServerOrder(serverIds) {
        const manager = new LocalStorageManager();
        return manager.set('misvord_server_order', serverIds);
    }

    static initializeServerOrder() {
        const currentOrder = this.getServerOrder();
        if (currentOrder.length === 0) {
            const allServerElements = document.querySelectorAll('.server-sidebar-icon[data-server-id]');
            const serverIds = Array.from(allServerElements).map(el => el.getAttribute('data-server-id'));
            this.setServerOrder(serverIds);
            return serverIds;
        }
        return currentOrder;
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
        let groupsRemoved = false;
        const remainingGroups = [];
        groups.forEach(group => {
            const originalLength = group.servers.length;
            group.servers = group.servers.filter(id => id !== serverId);
            if (group.servers.length !== originalLength) {
                updated = true;
            }

            if (group.servers.length >= 2) {
                remainingGroups.push(group);
            } else {
                groupsRemoved = true;
            }
        });
        if (updated || groupsRemoved) {
            return this.setServerGroups(remainingGroups);
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

window.localStorageManager = localStorageManager;

export { LocalStorageManager };
export default localStorageManager;
