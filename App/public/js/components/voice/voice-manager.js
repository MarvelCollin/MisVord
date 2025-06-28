class VoiceManager {
    constructor() {
        this.isConnected = false;
        this.isMuted = false;
        this.isDeafened = false;
        this.isVideoOn = false;
        this.isScreenSharing = false;
        this.participants = new Map();
        this.currentChannelId = null;
        this.currentChannelName = null;
        
        this.init();
    }
    
    init() {
        this.attachEventListeners();
    }
    
    attachEventListeners() {
        const joinBtn = document.getElementById('joinBtn');
        const leaveBtn = document.getElementById('leaveBtn');
        
        if (joinBtn) {
            joinBtn.addEventListener('click', () => this.joinVoice());
        }
        
        if (leaveBtn) {
            leaveBtn.addEventListener('click', () => this.leaveVoice());
        }
    }
    
    setupVoice(channelId) {
        if (this.currentChannelId === channelId) return;
        
        if (this.isConnected) {
            this.leaveVoice();
        }
        
        this.currentChannelId = channelId;
        
        // Update channel metadata
        const channelNameElements = document.querySelectorAll('.channel-name, .voice-ind-title');
        const channelElement = document.querySelector(`[data-channel-id="${channelId}"]`);
        const channelName = channelElement?.textContent?.trim() || 'Voice Channel';
        this.currentChannelName = channelName;
        
        channelNameElements.forEach(el => {
            if (el.classList.contains('channel-name')) {
                el.textContent = channelName.length > 10 
                    ? channelName.substring(0, 8) + '...' 
                    : channelName;
            } else {
                el.textContent = channelName;
            }
        });
    }
    
    async joinVoice() {
        if (this.isConnected) return Promise.resolve();
        
        const channelId = this.currentChannelId || document.querySelector('meta[name="channel-id"]')?.content;
        if (channelId && window.autoJoinVoiceChannel) {
            try {
                await window.autoJoinVoiceChannel(channelId);
                this.isConnected = true;
                this.dispatchEvent('voiceConnect', {
                    channelId: this.currentChannelId,
                    channelName: this.currentChannelName,
                    meetingId: window.videosdkMeeting?.id
                });
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
        this.currentChannelId = null;
        this.currentChannelName = null;
        this.participants.clear();
        this.dispatchEvent('voiceDisconnect');
        this.showToast('Disconnected from voice', 'info');
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

