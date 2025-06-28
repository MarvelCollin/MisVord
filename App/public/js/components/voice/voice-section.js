class VoiceSection {
    constructor() {
        this.elements = {
            joinBtn: document.getElementById('joinBtn'),
            joinView: document.getElementById('joinView'),
            connectingView: document.getElementById('connectingView'),
            connectedView: document.getElementById('connectedView'),
            voiceControls: document.getElementById('voiceControls'),
            voiceIndicator: document.getElementById('voice-indicator')
        };
        
        this.durationInterval = null;
        this.connectionStartTime = null;
        
        this.init();
    }
    
    init() {
        if (!this.elements.joinBtn) {
            setTimeout(() => this.init(), 200);
            return;
        }
        
        if (!window.voiceState) {
            window.voiceState = { isConnected: false };
        }
        
        this.setupEventListeners();
        this.checkExistingConnection();
        
        // Check for saved connection state
        const savedState = localStorage.getItem("voiceConnectionState");
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                const currentChannelId = document.querySelector('meta[name="channel-id"]')?.content;
                
                if (state.isConnected && state.currentChannelId === currentChannelId) {
                    // Update UI immediately
                    this.elements.joinView.classList.add('hidden');
                    this.elements.connectingView.classList.remove('hidden');
                    this.elements.joinBtn.disabled = true;
                    this.elements.joinBtn.textContent = 'Connecting...';
                    
                    // Update channel names and show voice indicator
                    if (state.channelName) {
                        this.updateChannelNames(state.channelName);
                        
                        if (this.elements.voiceIndicator) {
                            this.elements.voiceIndicator.classList.remove('scale-0', 'opacity-0');
                            
                            // Update connection duration
                            const durationEl = this.elements.voiceIndicator.querySelector('.connection-duration');
                            if (durationEl && state.connectionTime) {
                                const duration = Math.floor((Date.now() - state.connectionTime) / 1000);
                                const minutes = Math.floor(duration / 60);
                                const seconds = duration % 60;
                                durationEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                            }
                        }
                    }
                    
                    // Try to reconnect
                    this.connectToVoice().catch(error => {
                        console.error('Error auto-connecting to voice:', error);
                        this.handleConnectionError();
                    });
                }
            } catch (error) {
                console.error('Error parsing saved voice connection state:', error);
                localStorage.removeItem("voiceConnectionState");
            }
        }
    }
    
    setupEventListeners() {
        if (!this.elements.joinBtn) return;
        
        this.elements.joinBtn.onclick = async () => {
            this.elements.joinBtn.disabled = true;
            this.elements.joinBtn.textContent = 'Connecting...';
            this.elements.joinView.classList.add('hidden');
            this.elements.connectingView.classList.remove('hidden');
            
            try {
                await this.connectToVoice();
            } catch (error) {
                console.error('Error connecting to voice:', error);
                this.handleConnectionError();
            }
        };
        
        window.addEventListener('voiceConnect', (event) => {
            const details = event.detail || {};
            
            if (!window.videosdkMeeting) {
                console.log('No VideoSDK meeting found, skipping UI update');
                return;
            }
            
            const localParticipant = window.videosdkMeeting.localParticipant;
            if (!localParticipant) {
                console.log('No local participant found, skipping UI update');
                return;
            }
            
            const status = localParticipant.connectionStatus;
            console.log('Connection status:', status);
            
            if (status !== 'connected') {
                console.log('Participant not fully connected, waiting...');
                return;
            }
            
            console.log('Participant fully connected, updating UI');
            this.elements.connectingView.classList.add('hidden');
            this.elements.joinView.classList.add('hidden');
            this.elements.connectedView.classList.remove('hidden');
            this.elements.voiceControls.classList.remove('hidden');
            window.voiceState.isConnected = true;
            this.elements.joinBtn.disabled = false;
            this.elements.joinBtn.textContent = 'Connected';
            
            if (details.channelName) {
                this.updateChannelNames(details.channelName);
            }
            
            if (details.meetingId && details.channelName) {
                localStorage.setItem("voiceConnectionState", JSON.stringify({
                    isConnected: true,
                    channelName: details.channelName,
                    meetingId: details.meetingId,
                    currentChannelId: details.channelId,
                    connectionTime: Date.now()
                }));
            }
            
            setTimeout(() => {
                if (window.initializeVoiceTools) {
                    window.initializeVoiceTools();
                }
                if (window.voiceStateManager) {
                    window.voiceStateManager.updateAllControls();
                }
            }, 100);
        });
        
        window.addEventListener('voiceDisconnect', () => {
            window.voiceState.isConnected = false;
            
            if (window.videosdkMeeting) {
                try {
                    window.videoSDKManager?.leaveMeeting();
                    window.videosdkMeeting = null;
                } catch (e) {
                    console.error("Error when leaving VideoSDK meeting:", e);
                }
            }
            
            localStorage.removeItem("voiceConnectionState");
            
            this.elements.connectedView.classList.add('hidden');
            this.elements.connectingView.classList.add('hidden');
            this.elements.voiceControls.classList.add('hidden');
            this.elements.joinView.classList.remove('hidden');
            this.elements.joinBtn.disabled = false;
            this.elements.joinBtn.textContent = 'Join Voice';
            
            // Reset voice indicator
            if (this.elements.voiceIndicator) {
                this.elements.voiceIndicator.classList.add('scale-0', 'opacity-0');
            }
            
            if (window.voiceStateManager) {
                window.voiceStateManager.reset();
            }
        });
    }
    
    async connectToVoice() {
        const activeChannelId = document.querySelector('meta[name="channel-id"]')?.content;
        if (!activeChannelId) {
            throw new Error('No active channel ID found');
        }
        
        if (!window.autoJoinVoiceChannel) {
            throw new Error('Voice channel join function not available');
        }
        
        await window.autoJoinVoiceChannel(activeChannelId);
    }
    
    handleConnectionError() {
        this.elements.joinBtn.disabled = false;
        this.elements.joinBtn.textContent = 'Join Voice';
        this.elements.joinView.classList.remove('hidden');
        this.elements.connectingView.classList.add('hidden');
        window.showToast?.('Failed to connect to voice', 'error', 3000);
        
        // Clean up any saved state
        localStorage.removeItem("voiceConnectionState");
        
        // Reset voice indicator
        if (this.elements.voiceIndicator) {
            this.elements.voiceIndicator.classList.add('scale-0', 'opacity-0');
        }
    }
    
    checkExistingConnection() {
        if (window.voiceState?.isConnected && window.videosdkMeeting?.localParticipant?.connectionStatus === 'connected') {
            this.elements.joinView.classList.add('hidden');
            this.elements.connectingView.classList.add('hidden');
            this.elements.connectedView.classList.remove('hidden');
            this.elements.voiceControls.classList.remove('hidden');
            this.elements.joinBtn.disabled = false;
            this.elements.joinBtn.textContent = 'Connected';
            
            // Check for saved connection state
            const savedState = localStorage.getItem("voiceConnectionState");
            if (savedState) {
                try {
                    const state = JSON.parse(savedState);
                    if (state.channelName) {
                        this.updateChannelNames(state.channelName);
                    }
                    
                    // Update voice indicator
                    if (this.elements.voiceIndicator) {
                        this.elements.voiceIndicator.classList.remove('scale-0', 'opacity-0');
                    }
                } catch (error) {
                    console.error('Error parsing saved voice connection state:', error);
                    localStorage.removeItem("voiceConnectionState");
                }
            }
        }
    }
    
    updateChannelNames(channelName) {
        const channelNameElements = document.querySelectorAll('.channel-name, .voice-ind-title');
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
}

document.addEventListener('DOMContentLoaded', function() {
    window.voiceSection = new VoiceSection();
});

window.initializeVoiceUI = function() {
    if (window.voiceSection) {
        window.voiceSection.init();
    } else {
        window.voiceSection = new VoiceSection();
    }
}; 