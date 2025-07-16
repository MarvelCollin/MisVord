class VoiceFacade {
    constructor() {
        if (window.voiceFacade) {
            return window.voiceFacade;
        }
        window.voiceFacade = this;
        this._isConnectEventDispatched = false;
        this.init();
    }

    init() {
        if (window.globalSocketManager?.io) {
            this.setupInitialState();
        } else {
            window.addEventListener('globalSocketReady', () => this.setupInitialState());
        }
        
        if (window.localStorageManager) {
            const voiceState = window.localStorageManager.getUnifiedVoiceState();
            if (voiceState.isConnected && voiceState.needsRestoration && voiceState.channelId) {
                console.log('🔄 [VOICE-FACADE] Detected voice state that needs restoration:', voiceState);
                this.restoreVoiceConnection(voiceState);
            }
        }
    }

    setupInitialState() {
        document.querySelectorAll('[data-channel-type="voice"]').forEach(channel => {
            const channelId = channel.getAttribute('data-channel-id');
            if (channelId && window.globalSocketManager?.isReady()) {
                window.globalSocketManager.joinRoom('channel', channelId);
                window.globalSocketManager.io.emit('check-voice-meeting', { 
                    channel_id: channelId 
                });
            }
        });
    }

    async join(channelId, channelName, options = {}) {
        if (!channelId) throw new Error('join() requires channelId');
        if (!channelName) channelName = 'Voice Channel';

        if (!window.voiceManager) {
            console.error('[VoiceFacade] VoiceManager not available');
            return false;
        }
        
        const isReady = await window.voiceManager.ensureInitialized();
        if (!isReady) {
            console.error('[VoiceFacade] VoiceManager failed to initialize');
            return false;
        }

        const currentState = this.getCurrentState();
        if (currentState.isConnected && currentState.channelId === channelId) {
            if (window.voiceManager && typeof window.voiceManager.refreshAllParticipants === 'function') {
                window.voiceManager.refreshAllParticipants();
            }
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

        if (window.globalSocketManager?.isReady()) {
            document.querySelectorAll('[data-channel-type="voice"]').forEach(channel => {
                const chId = channel.getAttribute('data-channel-id');
                if (chId) {
                    window.globalSocketManager.joinRoom('channel', chId);
                    window.globalSocketManager.io.emit('check-voice-meeting', { 
                        channel_id: chId 
                    });
                }
            });
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

    async restoreVoiceConnection(voiceState) {
        if (!window.voiceManager) {
            console.warn('[VoiceFacade] VoiceManager not available for restoration');
            return false;
        }
        
        const isReady = await window.voiceManager.ensureInitialized();
        if (!isReady) {
            console.error('[VoiceFacade] VoiceManager failed to initialize for restoration');
            return false;
        }
        
        try {
            console.log('🔄 [VOICE-FACADE] Restoring voice connection:', {
                channelId: voiceState.channelId,
                channelName: voiceState.channelName,
                meetingId: voiceState.meetingId
            });
            
            window.voiceManager.currentChannelId = voiceState.channelId;
            window.voiceManager.currentChannelName = voiceState.channelName;
            window.voiceManager.currentMeetingId = voiceState.meetingId;
            window.voiceManager.isConnected = true;
            
            if (window.localStorageManager) {
                window.localStorageManager.setUnifiedVoiceState({
                    ...voiceState,
                    needsRestoration: false,
                    restoredAt: Date.now()
                });
            }
            
            await this.validateAndSyncState(voiceState.channelId, voiceState.channelName);
            
            console.log('✅ [VOICE-FACADE] Voice connection restored successfully');
            return true;
        } catch (error) {
            console.error('❌ [VOICE-FACADE] Failed to restore voice connection:', error);
            return false;
        }
    }
}


new VoiceFacade();

export default window.voiceFacade;