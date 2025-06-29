import { LocalStorageManager } from './local-storage-manager.js';

class VoiceStateManager {
    constructor() {
        this.storageManager = new LocalStorageManager();
        this.listeners = new Set();
        
        this.init();
    }

    init() {
        this.setupStorageListener();
        this.setupVideoSDKListeners();
    }

    setupStorageListener() {
        window.addEventListener('voiceStateChanged', (e) => {
            this.notifyListeners(e.detail);
        });

        window.addEventListener('storage', (e) => {
            if (e.key === 'misvord_voice_state' && e.newValue) {
                try {
                    const state = JSON.parse(e.newValue);
                    this.notifyListeners(state);
                } catch (error) {
                    console.error('Error parsing voice state from storage:', error);
                }
            }
        });
    }

    setupVideoSDKListeners() {
        window.addEventListener('voiceConnect', () => {
            this.syncWithVideoSDK();
        });

        window.addEventListener('voiceDisconnect', () => {
            this.reset();
        });
    }

    syncWithVideoSDK() {
        if (window.videoSDKManager && window.videosdkMeeting && window.videosdkMeeting.localParticipant) {
            try {
                const currentState = this.storageManager.getVoiceState();
                const updatedState = {
                    ...currentState,
                    isMuted: !window.videoSDKManager.getMicState(),
                    isDeafened: window.videoSDKManager.getDeafenState ? window.videoSDKManager.getDeafenState() : currentState.isDeafened
                };
                
                this.storageManager.setVoiceState(updatedState);
                console.log('[VoiceStateManager] Synced with VideoSDK:', updatedState);
            } catch (error) {
                console.error('Error syncing with VideoSDK:', error);
            }
        }
    }

    toggleMic() {
        return this.storageManager.toggleVoiceMute();
    }

    toggleDeafen() {
        return this.storageManager.toggleVoiceDeafen();
    }



    getState() {
        return this.storageManager.getVoiceState();
    }

    setState(newState) {
        return this.storageManager.setVoiceState(newState);
    }

    disconnectVoice() {
        if (window.videoSDKManager && window.videosdkMeeting) {
            try {
                window.videoSDKManager.leaveMeeting();
                window.videosdkMeeting = null;
            } catch (error) {
                console.error('Error disconnecting from VideoSDK:', error);
            }
        }
        
        window.dispatchEvent(new CustomEvent('voiceDisconnect'));
        this.showToast('Disconnected from voice channel');
    }

    addListener(callback) {
        this.listeners.add(callback);
    }

    removeListener(callback) {
        this.listeners.delete(callback);
    }

    notifyListeners(state) {
        this.listeners.forEach(callback => {
            try {
                callback(state);
            } catch (error) {
                console.error('Error in voice state listener:', error);
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

    reset() {
        this.storageManager.setVoiceState({
            isMuted: false,
            isDeafened: false,
            volume: 100
        });
    }
}

const voiceStateManager = new VoiceStateManager();

window.voiceStateManager = voiceStateManager;

export { VoiceStateManager };
export default voiceStateManager;
