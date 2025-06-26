class VoiceManager {
    constructor() {
        this.isConnected = false;
        this.isMuted = false;
        this.isDeafened = false;
        this.isVideoOn = false;
        this.isScreenSharing = false;
        this.participants = new Map();
        
        this.init();
    }
    
    init() {
        this.attachEventListeners();
    }
    
    attachEventListeners() {
        const joinBtn = document.getElementById('joinBtn');
        const leaveBtn = document.getElementById('leaveBtn');
        const micBtn = document.getElementById('micBtn');
        const deafenBtn = document.getElementById('deafenBtn');
        const joinVideoBtn = document.getElementById('joinVideoBtn');
        const screenBtn = document.getElementById('screenBtn');
        
        if (joinBtn) {
            joinBtn.addEventListener('click', () => this.joinVoice());
        }
        
        if (leaveBtn) {
            leaveBtn.addEventListener('click', () => this.leaveVoice());
        }
        
        if (micBtn) {
            micBtn.addEventListener('click', () => this.toggleMic());
        }
        
        if (deafenBtn) {
            deafenBtn.addEventListener('click', () => this.toggleDeafen());
        }
        
        if (joinVideoBtn) {
            joinVideoBtn.addEventListener('click', () => this.toggleVideo());
        }
        
        if (screenBtn) {
            screenBtn.addEventListener('click', () => this.toggleScreenShare());
        }
    }
    
    async joinVoice() {
        if (this.isConnected) return Promise.resolve();
        
        const channelId = document.querySelector('meta[name="channel-id"]')?.content;
        if (channelId && window.autoJoinVoiceChannel) {
            try {
                await window.autoJoinVoiceChannel(channelId);
                this.isConnected = true;
                return Promise.resolve();
            } catch (error) {
                this.showToast('Failed to connect to voice', 'error');
                return Promise.reject(error);
            }
        } else {
            this.showToast('Channel not available', 'error');
            return Promise.reject(new Error('Channel not available'));
        }
    }
    
    leaveVoice() {
        if (!this.isConnected) return;
        
        if (window.videosdkMeeting && window.videoSDKManager) {
            window.videoSDKManager.leaveMeeting();
            window.videosdkMeeting = null;
        }
        
        this.isConnected = false;
        this.participants.clear();
        this.dispatchEvent('voiceDisconnect');
        this.showToast('Disconnected from voice', 'info');
    }
    
    toggleMic() {
        this.isMuted = !this.isMuted;
        const micBtn = document.getElementById('micBtn');
        
        if (micBtn) {
            if (this.isMuted) {
                micBtn.innerHTML = '<i class="fas fa-microphone-slash text-sm"></i>';
                micBtn.classList.add('bg-[#ED4245]', 'text-white');
                micBtn.classList.remove('bg-[#2f3136]', 'text-gray-300');
                micBtn.title = 'Unmute';
            } else {
                micBtn.innerHTML = '<i class="fas fa-microphone text-sm"></i>';
                micBtn.classList.remove('bg-[#ED4245]', 'text-white');
                micBtn.classList.add('bg-[#2f3136]', 'text-gray-300');
                micBtn.title = 'Mute';
            }
        }
        
        this.showToast(this.isMuted ? 'Muted' : 'Unmuted', 'info');
    }
    
    toggleDeafen() {
        this.isDeafened = !this.isDeafened;
        const deafenBtn = document.getElementById('deafenBtn');
        
        if (deafenBtn) {
            if (this.isDeafened) {
                deafenBtn.innerHTML = '<i class="fas fa-volume-xmark text-sm"></i>';
                deafenBtn.classList.add('bg-[#ED4245]', 'text-white');
                deafenBtn.classList.remove('bg-[#2f3136]', 'text-gray-300');
                deafenBtn.title = 'Undeafen';
            } else {
                deafenBtn.innerHTML = '<i class="fas fa-headphones text-sm"></i>';
                deafenBtn.classList.remove('bg-[#ED4245]', 'text-white');
                deafenBtn.classList.add('bg-[#2f3136]', 'text-gray-300');
                deafenBtn.title = 'Deafen';
            }
        }
        
        this.showToast(this.isDeafened ? 'Deafened' : 'Undeafened', 'info');
    }
    
    toggleVideo() {
        this.isVideoOn = !this.isVideoOn;
        const joinVideoBtn = document.getElementById('joinVideoBtn');
        
        if (joinVideoBtn) {
            if (this.isVideoOn) {
                joinVideoBtn.innerHTML = '<i class="fas fa-video text-sm"></i>';
                joinVideoBtn.classList.add('bg-[#3ba55c]', 'text-white');
                joinVideoBtn.classList.remove('bg-[#2f3136]', 'text-gray-300');
                joinVideoBtn.title = 'Turn Off Camera';
            } else {
                joinVideoBtn.innerHTML = '<i class="fas fa-video-slash text-sm"></i>';
                joinVideoBtn.classList.remove('bg-[#3ba55c]', 'text-white');
                joinVideoBtn.classList.add('bg-[#2f3136]', 'text-gray-300');
                joinVideoBtn.title = 'Turn On Camera';
            }
        }
        
        this.showToast(this.isVideoOn ? 'Camera enabled' : 'Camera disabled', 'info');
    }
    
    toggleScreenShare() {
        this.isScreenSharing = !this.isScreenSharing;
        const screenBtn = document.getElementById('screenBtn');
        
        if (screenBtn) {
            if (this.isScreenSharing) {
                screenBtn.classList.add('bg-[#5865F2]', 'text-white');
                screenBtn.classList.remove('bg-[#2f3136]', 'text-gray-300');
                screenBtn.title = 'Stop Sharing';
            } else {
                screenBtn.classList.remove('bg-[#5865F2]', 'text-white');
                screenBtn.classList.add('bg-[#2f3136]', 'text-gray-300');
                screenBtn.title = 'Share Your Screen';
            }
        }
        
        this.showToast(this.isScreenSharing ? 'Screen sharing started' : 'Screen sharing stopped', 'info');
    }
    
    addParticipant(participant) {
        this.participants.set(participant.id, participant);
    }
    
    removeParticipant(participantId) {
        this.participants.delete(participantId);
    }
    
    dispatchEvent(eventName, detail = {}) {
        window.dispatchEvent(new CustomEvent(eventName, { detail }));
    }
    
    showToast(message, type = 'info') {
        window.showToast?.(message, type, 3000);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    window.voiceManager = new VoiceManager();
});

window.addEventListener('voiceDisconnect', function() {
    if (window.voiceManager) {
        window.voiceManager.leaveVoice();
    }
});

