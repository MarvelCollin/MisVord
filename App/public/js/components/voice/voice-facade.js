/**
 * VoiceFacade - Centralized voice control system
 * 
 * IMPORTANT: Never call voiceManager.joinVoice or leaveVoice directly.
 * Always use this facade to ensure proper state synchronization.
 */
class VoiceFacade {
    constructor() {
        if (window.voiceFacade) {
            return window.voiceFacade;
        }
        window.voiceFacade = this;
        this._isConnectEventDispatched = false;
    }

    async join(channelId, channelName, options = {}) {
        if (!channelId) throw new Error('join() requires channelId');
        if (!channelName) channelName = 'Voice Channel';

        if (!window.voiceManager) {
            console.error('[VoiceFacade] not available');
            return false;
        }
        await window.voiceManager.ensureInitialized();

        const currentState = this.getCurrentState();
        if (currentState.isConnected && currentState.channelId === channelId) {
            
            return true;
        }

        this._isConnectEventDispatched = false;
        await window.voiceManager._joinVoice(channelId, channelName, options);
        this._isConnectEventDispatched = true;
        await this.validateAndSyncState(channelId, channelName);
        return true;
    }

    async leave() {
        if (!window.voiceManager) {
            console.warn('[VoiceFacade] voiceManager not available');
            return false;
        }
        const channelId = window.voiceManager.currentChannelId;
        await window.voiceManager._leaveVoice();
        this._isConnectEventDispatched = true;
        await this.validateAndSyncState(null, null);
        return true;
    }

    getCurrentState() {
        const voiceManagerState = {
            channelId: window.voiceManager?.currentChannelId || null,
            channelName: window.voiceManager?.currentChannelName || null,
            meetingId: window.voiceManager?.currentMeetingId || null,
            isConnected: window.voiceManager?.isConnected || false
        };

        const localStorageState = window.localStorageManager?.getUnifiedVoiceState() || {};

        return {
            ...voiceManagerState,
            localStorageChannelId: localStorageState.channelId,
            localStorageConnected: localStorageState.isConnected
        };
    }

    async validateAndSyncState(channelId, channelName) {
        const meetingId = window.voiceManager?.currentMeetingId;
        const isConnected = channelId !== null;

        if (window.voiceManager) {
            window.voiceManager.currentChannelId = channelId;
            window.voiceManager.currentChannelName = channelName;
        }

        const channelEl = document.querySelector(`[data-channel-id="${channelId}"]`);
        if (channelEl && meetingId) {
            channelEl.setAttribute('data-meeting-id', meetingId);
        }

        if (window.localStorageManager) {
            if (isConnected) {
                const currentState = window.localStorageManager.getUnifiedVoiceState();
                window.localStorageManager.setUnifiedVoiceState({
                    ...currentState,
                    isConnected: true,
                    channelId,
                    channelName,
                    meetingId,
                    connectionTime: Date.now(),
                    videoOn: window.voiceManager?._videoOn || currentState.videoOn || false,
                    screenShareOn: window.voiceManager?._screenShareOn || currentState.screenShareOn || false
                });
            } else {
                window.localStorageManager.clearVoiceState();
            }
        }

        if (window.voiceCallSection) {
            window.voiceCallSection.currentChannelId = channelId;
            window.voiceCallSection.currentChannelName = channelName;
            window.voiceCallSection.currentMeetingId = meetingId;
            if (typeof window.voiceCallSection.updateConnectionStatus === 'function') {
                window.voiceCallSection.updateConnectionStatus(isConnected);
            }
            if (typeof window.voiceCallSection.ensureChannelSync === 'function') {
                window.voiceCallSection.ensureChannelSync();
            }
        }

        if (window.ChannelVoiceParticipants && channelId) {
            const instance = window.ChannelVoiceParticipants.getInstance();
            instance.updateSidebarForChannel(channelId);
        }

        if (!this._isConnectEventDispatched) {
            window.dispatchEvent(new CustomEvent(isConnected ? 'voiceConnect' : 'voiceDisconnect', {
                detail: {
                    channelId,
                    channelName,
                    meetingId,
                    source: 'voiceFacade'
                }
            }));
            this._isConnectEventDispatched = true;
        }
    }
}


new VoiceFacade();

export default window.voiceFacade; 