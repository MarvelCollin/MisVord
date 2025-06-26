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
        this.setupAudioContext();
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
        
        const joinBtn = document.getElementById('joinBtn');
        if (joinBtn) {
            joinBtn.disabled = true;
            joinBtn.textContent = 'Connecting...';
        }
        
        try {
            console.log('VoiceManager: Starting voice connection...');
            await this.requestPermissions();
            
            const meetingId = document.querySelector('meta[name="meeting-id"]')?.content;
            const username = document.querySelector('meta[name="username"]')?.content || 'Anonymous';
            const channelId = document.querySelector('meta[name="channel-id"]')?.content;
            
            if (!meetingId || !window.videoSDKManager) {
                throw new Error('Missing requirements for voice connection');
            }
            
            const authToken = await window.videoSDKManager.getAuthToken();
            window.videoSDKManager.init(authToken);
            
            const meeting = window.videoSDKManager.initMeeting({
                meetingId: meetingId,
                name: username,
                micEnabled: true,
                webcamEnabled: false
            });
            
            window.videosdkMeeting = meeting;
            await window.videoSDKManager.joinMeeting();
            
            this.dispatchEvent('voiceConnect', {
                channelName: 'Voice Channel',
                meetingId: meetingId,
                channelId: channelId
            });
            
            this.isConnected = true;
            this.showToast('Connected to voice channel', 'success');
            
            console.log('VoiceManager: Voice connection successful');
            return Promise.resolve();
        } catch (error) {
            console.error('Failed to join voice:', error);
            this.showToast('Failed to connect to voice', 'error');
            if (joinBtn) {
                joinBtn.disabled = false;
                joinBtn.textContent = 'Join Voice';
            }
            return Promise.reject(error);
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
    
    async requestPermissions() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: true, 
                video: false 
            });
            
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                return true;
            }
        } catch (error) {
            throw new Error('Microphone permission denied');
        }
    }
    
    setupAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
            console.warn('AudioContext not supported');
        }
    }
    
    addParticipant(participant) {
        this.participants.set(participant.id, participant);
        this.renderParticipant(participant);
        this.updateEmptyState();
    }
    
    removeParticipant(participantId) {
        this.participants.delete(participantId);
        const element = document.getElementById(`participant-${participantId}`);
        if (element) {
            element.remove();
        }
        this.updateEmptyState();
    }
    
    renderParticipant(participant) {
        const participantsContainer = document.getElementById('participants');
        if (!participantsContainer) return;
        
        const participantDiv = document.createElement('div');
        participantDiv.id = `participant-${participant.id}`;
        participantDiv.className = 'user-voice-item w-full bg-[#313338] rounded-md overflow-hidden mb-2';
        participantDiv.innerHTML = `
            <div class="px-3 py-2 flex items-center justify-between">
                <div class="flex items-center">
                    <div class="relative w-8 h-8 rounded-full bg-[#3ba55c] flex items-center justify-center overflow-hidden mr-2">
                        <span class="text-white text-sm font-semibold">${participant.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div class="flex flex-col">
                        <div class="flex items-center">
                            <span class="text-white text-sm font-medium">${participant.name}</span>
                        </div>
                        <div class="text-xs text-gray-400">
                            <span class="text-[#3ba55c]">Connected</span>
                        </div>
                    </div>
                </div>
                <div class="text-gray-400">
                    <div class="flex items-center space-x-1">
                        <div class="w-4 h-4 flex items-center justify-center">
                            <i class="fas fa-microphone text-xs"></i>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        participantsContainer.appendChild(participantDiv);
    }
    
    updateEmptyState() {
        const emptyMessage = document.getElementById('emptyMessage');
        if (!emptyMessage) return;
        
        if (this.participants.size === 0) {
            emptyMessage.style.display = 'flex';
        } else {
            emptyMessage.style.display = 'none';
        }
    }
    
    dispatchEvent(eventName, detail = {}) {
        window.dispatchEvent(new CustomEvent(eventName, { detail }));
    }
    
    showToast(message, type = 'info') {
        if (window.showToast) {
            window.showToast(message, type, 3000);
                } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
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

