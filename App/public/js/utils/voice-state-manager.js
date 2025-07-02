import { LocalStorageManager } from './local-storage-manager.js';

class UnifiedVoiceStateManager {
    constructor() {
        this.storageManager = window.localStorageManager || new LocalStorageManager();
        this.isProcessingEvent = false;
        this.eventQueue = [];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.cleanupConflictingStorage();
        this.validateStoredConnection();
    }

    async validateStoredConnection() {
        setTimeout(async () => {
            const storedState = this.storageManager.getUnifiedVoiceState();
            
            if (!storedState.isConnected) {
                return;
            }

            console.log('🔍 [UNIFIED-VOICE] Validating stored connection:', storedState);
            
            const isReallyConnected = await this.verifyActiveConnection();
            
            if (!isReallyConnected) {
                console.log('❌ [UNIFIED-VOICE] Stored connection is stale, clearing...');
                this.clearStaleConnection();
                
                if (window.globalVoiceIndicator) {
                    window.globalVoiceIndicator.handleDisconnect();
                }
                
                if (window.showToast) {
                    window.showToast('Previous voice connection expired', 'info');
                }
            } else {
                console.log('✅ [UNIFIED-VOICE] Stored connection is valid');
            }
        }, 1000);
    }

    async verifyActiveConnection() {
        const videoSDKConnected = window.videoSDKManager?.isConnected;
        const voiceManagerConnected = window.voiceManager?.isConnected;
        
        if (videoSDKConnected && window.videoSDKManager?.meeting?.id) {
            console.log('✅ [UNIFIED-VOICE] VideoSDK connection verified');
            return true;
        }
        
        if (voiceManagerConnected && window.voiceManager?.currentMeetingId) {
            console.log('✅ [UNIFIED-VOICE] VoiceManager connection verified');
            return true;
        }
        
        if (window.globalSocketManager?.isReady()) {
            const socketVerified = await this.verifySocketConnection();
            if (socketVerified) {
                console.log('✅ [UNIFIED-VOICE] Socket connection verified');
                return true;
            }
        }
        
        console.log('❌ [UNIFIED-VOICE] No active connection found');
        return false;
    }

    async verifySocketConnection() {
        return new Promise((resolve) => {
            const storedState = this.storageManager.getUnifiedVoiceState();
            
            if (!storedState.channelId || !storedState.meetingId) {
                resolve(false);
                return;
            }
            
            const timeout = setTimeout(() => {
                if (window.globalSocketManager?.io) {
                    window.globalSocketManager.io.off('voice-meeting-status', handleResponse);
                }
                resolve(false);
            }, 3000);
            
            const handleResponse = (data) => {
                if (data.channel_id === storedState.channelId) {
                    clearTimeout(timeout);
                    window.globalSocketManager.io.off('voice-meeting-status', handleResponse);
                    resolve(data.has_meeting && data.meeting_id === storedState.meetingId);
                }
            };
            
            if (window.globalSocketManager?.io) {
                window.globalSocketManager.io.on('voice-meeting-status', handleResponse);
                window.globalSocketManager.io.emit('check-voice-meeting', { 
                    channel_id: storedState.channelId 
                });
            } else {
                clearTimeout(timeout);
                resolve(false);
            }
        });
    }

    clearStaleConnection() {
        this.storageManager.setUnifiedVoiceState({
            isMuted: false,
            isDeafened: false,
            volume: 100,
            isConnected: false,
            channelId: null,
            channelName: null,
            meetingId: null,
            connectionTime: null
        });
        
        console.log('🧹 [UNIFIED-VOICE] Cleared stale connection state');
    }

    cleanupConflictingStorage() {
        try {
            localStorage.removeItem('misvord_voice_state');
            localStorage.removeItem('voiceConnectionState');
        } catch (error) {
            console.warn('Could not clean up old voice storage:', error);
        }
    }

    setupEventListeners() {
        window.addEventListener('voiceConnect', (event) => {
            this.queueEvent('connect', event.detail);
        });

        window.addEventListener('voiceDisconnect', () => {
            this.queueEvent('disconnect');
        });

        window.addEventListener('voiceStateChanged', (event) => {
            if (event.detail && typeof event.detail === 'object') {
                this.queueEvent('stateChange', event.detail);
            }
        });

        window.addEventListener('storage', (e) => {
            if (e.key === 'misvord_unified_voice_state' && e.newValue) {
                try {
                    const state = JSON.parse(e.newValue);
                    this.syncAcrossTabs(state);
                } catch (error) {
                    console.error('Error parsing unified voice state from storage:', error);
                }
            }
        });

        window.addEventListener('beforeunload', () => {
            const state = this.getState();
            if (state.isConnected) {
                console.log('🔄 [UNIFIED-VOICE] Page unloading, voice state preserved');
            }
        });

        window.addEventListener('popstate', (event) => {
            console.log('🔄 [UNIFIED-VOICE] Navigation detected:', event.state);
            
            // Check if voice should be preserved during navigation
            if (event.state?.preserveVoice) {
                console.log('🔄 [UNIFIED-VOICE] Voice preservation requested during navigation');
                
                // Validate connection is still active after navigation
                setTimeout(() => {
                    this.validateStoredConnection();
                }, 1000);
            }
        });
    }

    queueEvent(type, data = null) {
        this.eventQueue.push({ type, data, timestamp: Date.now() });
        this.processEventQueue();
    }

    async processEventQueue() {
        if (this.isProcessingEvent || this.eventQueue.length === 0) {
            return;
        }

        this.isProcessingEvent = true;

        try {
            while (this.eventQueue.length > 0) {
                const event = this.eventQueue.shift();
                await this.handleEvent(event);
                
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        } finally {
            this.isProcessingEvent = false;
        }
    }

    async handleEvent(event) {
        const { type, data } = event;

        switch (type) {
            case 'connect':
                await this.handleConnect(data);
                break;
            case 'disconnect':
                await this.handleDisconnect();
                break;
            case 'stateChange':
                await this.handleStateChange(data);
                break;
        }
    }

    async handleConnect(detail) {
        const currentState = this.storageManager.getUnifiedVoiceState();
        
        const updatedState = {
            ...currentState,
            isConnected: true,
            channelId: detail?.channelId || currentState.channelId,
            channelName: detail?.channelName || currentState.channelName,
            meetingId: detail?.meetingId || currentState.meetingId,
            connectionTime: Date.now()
        };

        this.storageManager.setUnifiedVoiceState(updatedState);
        console.log('✅ [UNIFIED-VOICE] Connected:', updatedState);
    }

    async handleDisconnect() {
        const currentState = this.storageManager.getUnifiedVoiceState();
        
        const updatedState = {
            ...currentState,
            isConnected: false,
            channelId: null,
            channelName: null,
            meetingId: null,
            connectionTime: null
        };

        this.storageManager.setUnifiedVoiceState(updatedState);
        console.log('✅ [UNIFIED-VOICE] Disconnected');
    }

    async handleStateChange(detail) {
        const currentState = this.storageManager.getUnifiedVoiceState();
        let updatedState = { ...currentState };

        if (detail.type === 'mic') {
            updatedState.isMuted = !detail.state;
        } else if (detail.type === 'deafen') {
            updatedState.isDeafened = detail.state;
            if (detail.state) {
                updatedState.isMuted = true;
            }
        } else if (detail.type === 'video') {
            updatedState.isVideoOn = detail.state;
        } else if (detail.type === 'screenShare') {
            updatedState.isScreenSharing = detail.state;
        }

        this.storageManager.setUnifiedVoiceState(updatedState);
    }

    syncAcrossTabs(state) {
        if (window.voiceCallManager) {
            window.voiceCallManager.isMuted = state.isMuted || false;
            window.voiceCallManager.isDeafened = state.isDeafened || false;
            window.voiceCallManager.isConnected = state.isConnected || false;
        }

        if (window.globalVoiceIndicator) {
            if (state.isConnected && state.channelName) {
                window.globalVoiceIndicator.channelName = state.channelName;
                window.globalVoiceIndicator.meetingId = state.meetingId;
                window.globalVoiceIndicator.connectionTime = state.connectionTime;
                window.globalVoiceIndicator.updateVisibility();
            } else {
                window.globalVoiceIndicator.handleDisconnect();
            }
        }
    }

    getState() {
        return this.storageManager.getUnifiedVoiceState();
    }

    setState(newState) {
        return this.storageManager.setUnifiedVoiceState(newState);
    }

    isConnected() {
        const state = this.getState();
        return state.isConnected || false;
    }

    disconnectVoice() {
        if (window.videoSDKManager && window.videoSDKManager.isConnected) {
            try {
                window.videoSDKManager.leaveMeeting();
            } catch (error) {
                console.error('Error disconnecting from VideoSDK:', error);
            }
        }
        
        if (window.voiceManager && window.voiceManager.isConnected) {
            try {
                window.voiceManager.leaveVoice();
            } catch (error) {
                console.error('Error disconnecting from VoiceManager:', error);
            }
        }
        
        this.handleDisconnect();
        window.dispatchEvent(new CustomEvent('voiceDisconnect'));
    }

    toggleMute() {
        if (this.storageManager.toggleVoiceMute) {
            return this.storageManager.toggleVoiceMute();
        }
        
        const currentState = this.getState();
        const newMutedState = !currentState.isMuted;
        
        this.setState({
            ...currentState,
            isMuted: newMutedState
        });
        
        return newMutedState;
    }

    toggleDeafen() {
        if (this.storageManager.toggleVoiceDeafen) {
            return this.storageManager.toggleVoiceDeafen();
        }
        
        const currentState = this.getState();
        const newDeafenedState = !currentState.isDeafened;
        
        this.setState({
            ...currentState,
            isDeafened: newDeafenedState,
            isMuted: newDeafenedState ? true : currentState.isMuted
        });
        
        return newDeafenedState;
    }

    reset() {
        this.storageManager.setUnifiedVoiceState({
            isMuted: false,
            isDeafened: false,
            volume: 100,
            isConnected: false,
            channelId: null,
            channelName: null,
            meetingId: null,
            connectionTime: null
        });
    }
}

if (!window.unifiedVoiceStateManager) {
    const unifiedVoiceStateManager = new UnifiedVoiceStateManager();
    window.voiceStateManager = unifiedVoiceStateManager;
    window.unifiedVoiceStateManager = unifiedVoiceStateManager;
    console.log('✅ [VOICE-STATE] Unified voice state manager initialized');
} else {
    console.log('✅ [VOICE-STATE] Unified voice state manager already exists');
}

export { UnifiedVoiceStateManager };
export default unifiedVoiceStateManager;
