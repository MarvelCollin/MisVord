import { LocalStorageManager } from './local-storage-manager.js';

class VoiceStateManager {
    constructor() {
        this.storageManager = new LocalStorageManager();
        this.listeners = new Set();
        this.state = null;
        
        this.init();
    }

    init() {
        this.loadState();
        this.setupStorageListener();
        this.setupVideoSDKListeners();
    }

    loadState() {
        this.state = this.storageManager.getVoiceState();
        this.updateAllControls();
    }

    saveState() {
        if (this.state) {
            this.storageManager.setVoiceState(this.state);
        }
    }

    setupStorageListener() {
        window.addEventListener('voiceStateChanged', (e) => {
            this.state = e.detail;
            this.updateAllControls();
            this.notifyListeners();
        });

        window.addEventListener('storage', (e) => {
            if (e.key === 'misvord_voice_state' && e.newValue) {
                try {
                    this.state = JSON.parse(e.newValue);
                    this.updateAllControls();
                    this.notifyListeners();
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
                const participant = window.videosdkMeeting.localParticipant;
                
                this.state.isMuted = !window.videoSDKManager.getMicState();
                this.state.isVideoOn = window.videoSDKManager.getWebcamState();
                this.state.isScreenSharing = window.videoSDKManager.getScreenShareState();
                
                this.saveState();
                this.updateAllControls();
                this.notifyListeners();
            } catch (error) {
                console.error('Error syncing with VideoSDK:', error);
            }
        }
    }

    toggleMic() {
        let newMutedState;
        
        if (window.videoSDKManager && window.videosdkMeeting) {
            try {
                newMutedState = !window.videoSDKManager.toggleMic();
            } catch (error) {
                console.error('Error toggling VideoSDK mic:', error);
                newMutedState = !this.state.isMuted;
            }
        } else {
            newMutedState = !this.state.isMuted;
        }
        
        this.storageManager.setVoiceState({ isMuted: newMutedState });
        this.showToast(newMutedState ? 'Muted' : 'Unmuted');
    }

    toggleDeafen() {
        let newDeafenState;
        
        if (window.videoSDKManager && window.videosdkMeeting) {
            try {
                newDeafenState = window.videoSDKManager.toggleDeafen();
            } catch (error) {
                console.error('Error toggling VideoSDK deafen:', error);
                newDeafenState = !this.state.isDeafened;
            }
        } else {
            newDeafenState = !this.state.isDeafened;
        }
        
        this.storageManager.setVoiceState({ 
            isDeafened: newDeafenState,
            isMuted: newDeafenState ? true : this.state.isMuted
        });
        this.showToast(newDeafenState ? 'Deafened' : 'Undeafened');
    }

    toggleVideo() {
        if (!window.videoSDKManager || !window.videosdkMeeting) {
            this.showToast('Voice not connected', 'error');
            return;
        }

        if (!window.videoSDKManager.isReady()) {
            this.showToast('Please wait for voice connection to complete', 'error');
            return;
        }

        const videoButton = document.getElementById('voiceVideoBtn');
        if (videoButton) videoButton.disabled = true;

        try {
            window.videoSDKManager.toggleWebcam().then(isVideoOn => {
                this.storageManager.setVoiceState({ isVideoOn });
                this.showToast(isVideoOn ? 'Camera enabled' : 'Camera disabled');
            }).catch(error => {
                console.error('Error toggling camera:', error);
                this.showToast('Failed to toggle camera', 'error');
                const currentVideoState = window.videoSDKManager.getWebcamState();
                this.storageManager.setVoiceState({ isVideoOn: currentVideoState });
            }).finally(() => {
                if (videoButton) videoButton.disabled = false;
            });
        } catch (error) {
            console.error('Error in toggleVideo wrapper:', error);
            this.showToast('Failed to toggle camera', 'error');
            if (videoButton) videoButton.disabled = false;
        }
    }

    toggleScreenShare() {
        if (!window.videoSDKManager || !window.videosdkMeeting) {
            this.showToast('Voice not connected', 'error');
            return;
        }
        
        if (!window.videoSDKManager.isReady()) {
            this.showToast('Please wait for voice connection to complete', 'error');
            return;
        }
        
        const screenButton = document.getElementById('voiceScreenBtn');
        if (screenButton) screenButton.disabled = true;

        try {
            window.videoSDKManager.toggleScreenShare().then(isScreenSharing => {
                console.log(`Screen share toggled. New state: ${isScreenSharing}`);
                this.storageManager.setVoiceState({ isScreenSharing });
                this.showToast(isScreenSharing ? 'Screen sharing started' : 'Screen sharing stopped');
            }).catch(error => {
                console.error('Error toggling screen share:', error);
                this.showToast('Failed to start screen share', 'error');
                const currentScreenState = window.videoSDKManager.getScreenShareState();
                this.storageManager.setVoiceState({ isScreenSharing: currentScreenState });
            }).finally(() => {
                if (screenButton) screenButton.disabled = false;
            });
        } catch (error) {
            console.error('Error toggling screen share:', error);
            this.showToast('Failed to start screen share', 'error');
            if (screenButton) screenButton.disabled = false;
        }
    }

    updateAllControls() {
        this.updateMicControls();
        this.updateDeafenControls();
        this.updateVideoControls();
        this.updateScreenControls();
    }

    updateMicControls() {
        const micButtons = document.querySelectorAll('#micBtn, .mic-btn, button[title*="Mute"], button[title*="mute"]');
        micButtons.forEach(btn => {
            const icon = btn.querySelector('i');
            if (!icon) return;

            if (this.state.isMuted || this.state.isDeafened) {
                icon.className = 'fas fa-microphone-slash text-lg';
                btn.classList.add('bg-[#ED4245]', 'text-white');
                btn.classList.remove('bg-[#2f3136]', 'text-gray-300', 'text-discord-lighter');
                btn.title = 'Unmute';
            } else {
                icon.className = 'fas fa-microphone text-lg';
                btn.classList.remove('bg-[#ED4245]', 'text-white');
                btn.classList.add('bg-[#2f3136]', 'text-gray-300');
                btn.title = 'Mute';
            }
        });
    }

    updateDeafenControls() {
        const deafenButtons = document.querySelectorAll('#deafenBtn, .deafen-btn, button[title*="Deafen"], button[title*="deafen"]');
        deafenButtons.forEach(btn => {
            const icon = btn.querySelector('i');
            if (!icon) return;

            if (this.state.isDeafened) {
                icon.className = 'fas fa-volume-xmark text-lg';
                btn.classList.add('bg-[#ED4245]', 'text-white');
                btn.classList.remove('bg-[#2f3136]', 'text-gray-300', 'text-discord-lighter');
                btn.title = 'Undeafen';
            } else {
                icon.className = 'fas fa-headphones text-lg';
                btn.classList.remove('bg-[#ED4245]', 'text-white');
                btn.classList.add('bg-[#2f3136]', 'text-gray-300');
                btn.title = 'Deafen';
            }
        });
    }

    updateVideoControls() {
        const videoButtons = document.querySelectorAll('#voiceVideoBtn, .video-btn, button[title*="Camera"], button[title*="camera"]');
        
        videoButtons.forEach(btn => {
            const icon = btn.querySelector('i');
            if (!icon) return;

            if (this.state.isVideoOn) {
                icon.className = 'fas fa-video text-lg';
                btn.classList.add('bg-[#3ba55c]', 'text-white');
                btn.classList.remove('bg-[#2f3136]', 'text-gray-300', 'bg-transparent');
                btn.title = 'Turn Off Camera';
            } else {
                icon.className = 'fas fa-video-slash text-lg';
                btn.classList.remove('bg-[#3ba55c]', 'text-white');
                btn.classList.add('bg-[#2f3136]', 'text-gray-300');
                btn.title = 'Turn On Camera';
            }
        });
    }

    updateScreenControls() {
        const screenButtons = document.querySelectorAll('#voiceScreenBtn, .screen-btn');
        
        screenButtons.forEach(btn => {
            const icon = btn.querySelector('i');
            if (!icon) return;

            if (this.state.isScreenSharing) {
                btn.classList.add('bg-[#5865F2]', 'text-white');
                btn.classList.remove('bg-[#2f3136]', 'text-gray-300', 'bg-transparent');
                btn.title = 'Stop Sharing';
            } else {
                btn.classList.remove('bg-[#5865F2]', 'text-white');
                btn.classList.add('bg-[#2f3136]', 'text-gray-300');
                btn.title = 'Share Your Screen';
            }
        });
    }

    getState() {
        return { ...this.state };
    }

    setState(newState) {
        this.storageManager.setVoiceState(newState);
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

    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback(this.state);
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
            isVideoOn: false,
            isScreenSharing: false,
            volume: 100
        });
    }


}

const voiceStateManager = new VoiceStateManager();

window.voiceStateManager = voiceStateManager;

export { VoiceStateManager };
export default voiceStateManager;
