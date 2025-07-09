class VoiceFacade {
    constructor() {
        if (window.voiceFacade) {
            return window.voiceFacade;
        }
        window.voiceFacade = this;
    }

    async join(channelId, channelName, options = {}) {
        if (!channelId) throw new Error('join() requires channelId');
        if (!channelName) channelName = 'Voice Channel';

        // Ensure voiceManager SDK is loaded
        if (!window.voiceManager) {
            console.error('[VoiceFacade not available');
            return false;
        }
        await window.voiceManager.ensureInitialized();

        await window.voiceManager.joinVoice(channelId, channelName, options);

        // Sync all other systems
        this.syncAfterJoin(channelId, channelName, window.voiceManager.currentMeetingId);
        return true;
    }

    async leave() {
        if (!window.voiceManager) {
            console.warn('[VoiceFacade] voiceManager not available');
            return false;
        }
        const channelId = window.voiceManager.currentChannelId;
        await window.voiceManager.leaveVoice();
        this.syncAfterLeave(channelId);
        return true;
    }

    syncAfterJoin(channelId, channelName, meetingId) {
        // DOM tag for debug tools
        const channelEl = document.querySelector(`[data-channel-id="${channelId}"]`);
        if (channelEl && meetingId) {
            channelEl.setAttribute('data-meeting-id', meetingId);
        }

        // LocalStorage unified state
        if (window.localStorageManager) {
            const currentState = window.localStorageManager.getUnifiedVoiceState();
            window.localStorageManager.setUnifiedVoiceState({
                ...currentState,
                isConnected: true,
                channelId: channelId,
                channelName: channelName,
                meetingId: meetingId,
                connectionTime: Date.now()
            });
        }

        // Legacy unifiedVoiceStateManager support
        if (window.unifiedVoiceStateManager?.setState) {
            const currentState = window.unifiedVoiceStateManager.getState() || {};
            window.unifiedVoiceStateManager.setState({
                ...currentState,
                isConnected: true,
                channelId: channelId,
                channelName: channelName,
                meetingId: meetingId
            });
        }

        // VoiceCallSection
        if (window.voiceCallSection) {
            window.voiceCallSection.currentChannelId = channelId;
            window.voiceCallSection.currentChannelName = channelName;
            window.voiceCallSection.currentMeetingId = meetingId;
            if (typeof window.voiceCallSection.updateConnectionStatus === 'function') {
                window.voiceCallSection.updateConnectionStatus(true);
            }
        }
    }

    syncAfterLeave(prevChannelId) {
        // Clear DOM meeting-id
        if (prevChannelId) {
            const channelEl = document.querySelector(`[data-channel-id="${prevChannelId}"]`);
            if (channelEl) channelEl.removeAttribute('data-meeting-id');
        }

        // LocalStorage unified state
        if (window.localStorageManager) {
            const currentState = window.localStorageManager.getUnifiedVoiceState();
            window.localStorageManager.setUnifiedVoiceState({
                ...currentState,
                isConnected: false,
                channelId: null,
                channelName: null,
                meetingId: null,
                connectionTime: null,
                disconnectionTime: Date.now()
            });
        }

        // Legacy manager
        if (window.unifiedVoiceStateManager?.setState) {
            const currentState = window.unifiedVoiceStateManager.getState() || {};
            window.unifiedVoiceStateManager.setState({
                ...currentState,
                isConnected: false,
                channelId: null,
                channelName: null,
                meetingId: null
            });
        }

        // VoiceCallSection UI
        if (window.voiceCallSection) {
            window.voiceCallSection.currentChannelId = null;
            window.voiceCallSection.currentChannelName = null;
            window.voiceCallSection.currentMeetingId = null;
            if (typeof window.voiceCallSection.updateConnectionStatus === 'function') {
                window.voiceCallSection.updateConnectionStatus(false);
            }
        }
    }
}

// Auto-instantiate so other modules can call window.voiceFacade.join/leave directly
new VoiceFacade();

export default window.voiceFacade; 