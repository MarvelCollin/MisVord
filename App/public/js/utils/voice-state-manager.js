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

        if (window.globalVoiceIndicator && state.isConnected && state.channelName) {
            window.globalVoiceIndicator.channelName = state.channelName;
            window.globalVoiceIndicator.meetingId = state.meetingId;
            window.globalVoiceIndicator.connectionTime = state.connectionTime;
            window.globalVoiceIndicator.updateVisibility();
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

const unifiedVoiceStateManager = new UnifiedVoiceStateManager();

window.voiceStateManager = unifiedVoiceStateManager;
window.unifiedVoiceStateManager = unifiedVoiceStateManager;

export { UnifiedVoiceStateManager };
export default unifiedVoiceStateManager;
