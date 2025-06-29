class VoiceStateManager {
    constructor() {
        this.storageKey = 'misvord_voice_state';
        this.listeners = new Set();
        this.defaultState = {
            isMuted: false,
            isDeafened: false,
            isVideoOn: false,
            isScreenSharing: false,
            volume: 100
        };
        
        this.init();
    }

    init() {
        this.loadState();
        this.setupStorageListener();
        this.setupVoiceControlListeners();
        this.setupVideoSDKListeners();
    }

    loadState() {
        try {
            const savedState = localStorage.getItem(this.storageKey);
            this.state = savedState ? JSON.parse(savedState) : { ...this.defaultState };
        } catch (error) {
            console.error('Error loading voice state:', error);
            this.state = { ...this.defaultState };
        }
        
        this.updateAllControls();
    }

    saveState() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.state));
        } catch (error) {
            console.error('Error saving voice state:', error);
        }
    }

    setupStorageListener() {
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey && e.newValue) {
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
                
                if (window.videoSDKManager.sdkVersion === "0.2.x") {
                    this.state.isMuted = !participant.isMicEnabled;
                    this.state.isVideoOn = participant.isWebcamEnabled;
                    this.state.isScreenSharing = participant.isScreenShareEnabled;
                } else {
                    this.state.isMuted = !participant.streams.has("audio");
                    this.state.isVideoOn = participant.streams.has("video");
                    this.state.isScreenSharing = participant.streams.has("share");
                }
                
                this.saveState();
                this.updateAllControls();
                this.notifyListeners();
            } catch (error) {
                console.error('Error syncing with VideoSDK:', error);
            }
        }
    }

    setupVoiceControlListeners() {
        console.log('VoiceStateManager: Skipping duplicate control listeners - handled by voice-tool.php');
    }

    toggleMic() {
        if (window.videoSDKManager && window.videosdkMeeting) {
            try {
                const newMutedState = window.videoSDKManager.toggleMic();
                this.state.isMuted = newMutedState;
            } catch (error) {
                console.error('Error toggling VideoSDK mic:', error);
                this.state.isMuted = !this.state.isMuted;
            }
        } else {
            this.state.isMuted = !this.state.isMuted;
        }
        
        this.saveState();
        this.updateAllControls();
        this.notifyListeners();
        this.showToast(this.state.isMuted ? 'Muted' : 'Unmuted');
    }

    toggleDeafen() {
        if (window.videoSDKManager && window.videosdkMeeting) {
            try {
                const newDeafenState = window.videoSDKManager.toggleDeafen();
                this.state.isDeafened = newDeafenState;
                if (newDeafenState) {
                    this.state.isMuted = true;
                }
            } catch (error) {
                console.error('Error toggling VideoSDK deafen:', error);
                this.state.isDeafened = !this.state.isDeafened;
                if (this.state.isDeafened) {
                    this.state.isMuted = true;
                }
            }
        } else {
            this.state.isDeafened = !this.state.isDeafened;
            if (this.state.isDeafened) {
                this.state.isMuted = true;
            }
        }
        
        this.saveState();
        this.updateAllControls();
        this.notifyListeners();
        this.showToast(this.state.isDeafened ? 'Deafened' : 'Undeafened');
    }

    async toggleVideo() {
        if (!window.videoSDKManager || !window.videosdkMeeting) {
            this.showToast('Voice not connected', 'error');
            return;
        }

        const videoButton = document.getElementById('joinVideoBtn');
        if (videoButton) videoButton.disabled = true;

        try {
            const localParticipant = window.videosdkMeeting.localParticipant;
            if (!localParticipant || localParticipant.connectionStatus !== 'connected') {
                throw new Error('Please wait for connection to establish');
            }

            const isVideoOn = await window.videoSDKManager.toggleWebcam();
            this.state.isVideoOn = isVideoOn;
            
            console.log(`[VoiceManager] Video toggled. New SDK state: ${isVideoOn}`);
            this.saveState();
            this.updateVideoControls(); 
            this.notifyListeners();
            this.showToast(isVideoOn ? 'Camera enabled' : 'Camera disabled');
        } catch (error) {
            console.error('Error toggling VideoSDK webcam:', error);
            this.showToast(error.message || 'Failed to toggle camera', 'error');
            this.state.isVideoOn = window.videoSDKManager.getWebcamState();
            this.updateVideoControls();
        } finally {
            if (videoButton) videoButton.disabled = false;
        }
    }

    async toggleScreenShare() {
        if (!window.videoSDKManager || !window.videosdkMeeting) {
            this.showToast('Voice not connected', 'error');
            return;
        }
        
        const screenButton = document.getElementById('screenBtn');
        if (screenButton) screenButton.disabled = true;

        try {
            const localParticipant = window.videosdkMeeting.localParticipant;
            if (!localParticipant || localParticipant.connectionStatus !== 'connected') {
                throw new Error('Please wait for connection to establish');
            }

            const isScreenSharing = await window.videoSDKManager.toggleScreenShare();
            this.state.isScreenSharing = isScreenSharing;

            console.log(`[VoiceManager] Screen share toggled. New SDK state: ${isScreenSharing}`);
            this.saveState();
            this.updateScreenControls();
            this.notifyListeners();
            this.showToast(isScreenSharing ? 'Screen sharing started' : 'Screen sharing stopped');
        } catch (error) {
            console.error('Error toggling screen share:', error);
            this.showToast(error.message || 'Failed to start screen share', 'error');
            this.state.isScreenSharing = window.videoSDKManager.getScreenShareState();
            this.updateScreenControls();
        } finally {
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
        const videoButtons = document.querySelectorAll('#joinVideoBtn, .video-btn, button[title*="Camera"], button[title*="camera"]');
        console.log('VoiceStateManager: Updating video controls, found buttons:', videoButtons.length, 'isVideoOn:', this.state.isVideoOn);
        
        videoButtons.forEach(btn => {
            const icon = btn.querySelector('i');
            if (!icon) return;

            if (this.state.isVideoOn) {
                icon.className = 'fas fa-video text-lg';
                btn.classList.add('bg-[#3ba55c]', 'text-white');
                btn.classList.remove('bg-[#2f3136]', 'text-gray-300', 'bg-transparent');
                btn.title = 'Turn Off Camera';
                console.log('VoiceStateManager: Video button set to ON state');
            } else {
                icon.className = 'fas fa-video-slash text-lg';
                btn.classList.remove('bg-[#3ba55c]', 'text-white');
                btn.classList.add('bg-[#2f3136]', 'text-gray-300');
                btn.title = 'Turn On Camera';
                console.log('VoiceStateManager: Video button set to OFF state');
            }
        });
    }

    updateScreenControls() {
        const screenButtons = document.querySelectorAll('#screenBtn, .screen-btn, button[title*="Screen"], button[title*="screen"]');
        console.log('VoiceStateManager: Updating screen controls, found buttons:', screenButtons.length, 'isScreenSharing:', this.state.isScreenSharing);
        
        screenButtons.forEach(btn => {
            const icon = btn.querySelector('i');
            if (!icon) return;

            if (this.state.isScreenSharing) {
                btn.classList.add('bg-[#5865F2]', 'text-white');
                btn.classList.remove('bg-[#2f3136]', 'text-gray-300', 'bg-transparent');
                btn.title = 'Stop Sharing';
                console.log('VoiceStateManager: Screen button set to SHARING state');
            } else {
                btn.classList.remove('bg-[#5865F2]', 'text-white');
                btn.classList.add('bg-[#2f3136]', 'text-gray-300');
                btn.title = 'Share Your Screen';
                console.log('VoiceStateManager: Screen button set to NOT SHARING state');
            }
        });
    }

    getState() {
        return { ...this.state };
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.saveState();
        this.updateAllControls();
        this.notifyListeners();
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
        this.state = { ...this.defaultState };
        this.saveState();
        this.updateAllControls();
        this.notifyListeners();
    }
}

const voiceStateManager = new VoiceStateManager();

window.voiceStateManager = voiceStateManager;

export { VoiceStateManager };
export default voiceStateManager;
