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
        document.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button) return;

            if (button.id === 'micBtn' || button.classList.contains('mic-btn')) {
                e.preventDefault();
                this.toggleMic();
            } else if (button.id === 'deafenBtn' || button.classList.contains('deafen-btn')) {
                e.preventDefault();
                this.toggleDeafen();
            } else if (button.id === 'joinVideoBtn' || button.classList.contains('video-btn')) {
                e.preventDefault();
                this.toggleVideo();
            } else if (button.id === 'screenBtn' || button.classList.contains('screen-btn')) {
                e.preventDefault();
                this.toggleScreenShare();
            } else if (button.id === 'leaveBtn' || button.classList.contains('disconnect-btn')) {
                e.preventDefault();
                this.disconnectVoice();
            }
        });
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

    toggleVideo() {
        if (window.videoSDKManager && window.videosdkMeeting) {
            try {
                const newVideoState = window.videoSDKManager.toggleWebcam();
                this.state.isVideoOn = newVideoState;
            } catch (error) {
                console.error('Error toggling VideoSDK webcam:', error);
                this.state.isVideoOn = !this.state.isVideoOn;
            }
        } else {
            this.state.isVideoOn = !this.state.isVideoOn;
        }
        
        this.saveState();
        this.updateAllControls();
        this.notifyListeners();
        this.showToast(this.state.isVideoOn ? 'Camera enabled' : 'Camera disabled');
    }

    toggleScreenShare() {
        if (window.videoSDKManager && window.videosdkMeeting) {
            try {
                const newScreenShareState = window.videoSDKManager.toggleScreenShare();
                this.state.isScreenSharing = newScreenShareState;
            } catch (error) {
                console.error('Error toggling VideoSDK screen share:', error);
                this.state.isScreenSharing = !this.state.isScreenSharing;
            }
        } else {
            this.state.isScreenSharing = !this.state.isScreenSharing;
        }
        
        this.saveState();
        this.updateAllControls();
        this.notifyListeners();
        this.showToast(this.state.isScreenSharing ? 'Screen sharing started' : 'Screen sharing stopped');
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
        videoButtons.forEach(btn => {
            const icon = btn.querySelector('i');
            if (!icon) return;

            if (this.state.isVideoOn) {
                icon.className = 'fas fa-video text-lg';
                btn.classList.add('bg-[#3ba55c]', 'text-white');
                btn.classList.remove('bg-[#2f3136]', 'text-gray-300');
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
        const screenButtons = document.querySelectorAll('#screenBtn, .screen-btn, button[title*="Screen"], button[title*="screen"]');
        screenButtons.forEach(btn => {
            const icon = btn.querySelector('i');
            if (!icon) return;

            if (this.state.isScreenSharing) {
                btn.classList.add('bg-[#5865F2]', 'text-white');
                btn.classList.remove('bg-[#2f3136]', 'text-gray-300');
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
        
        if (window.globalVoiceIndicator) {
            window.globalVoiceIndicator.handleDisconnect();
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

    showToast(message) {
        if (window.showToast) {
            window.showToast(message, 'info', 2000);
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
