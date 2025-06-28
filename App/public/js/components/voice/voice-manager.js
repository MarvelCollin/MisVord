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
        this.videoSDKManager = null;
        this.initializationPromise = null;
        this.initialized = false;
        
        // Don't call init in constructor to avoid timing issues
        // Let the global initialization handle it
    }
    
    async init() {
        if (this.initialized) return;
        
        try {
            // First ensure VideoSDK is loaded
            await this.loadVideoSDKScript();
            await this.initVideoSDK();
            this.attachEventListeners();
            this.initialized = true;
            console.log('✅ Voice manager initialized');
        } catch (error) {
            console.error('❌ Failed to initialize voice manager:', error);
            throw error;
        }
    }

    async loadVideoSDKScript() {
        return new Promise((resolve, reject) => {
            if (typeof VideoSDK !== 'undefined') {
                console.log('VideoSDK already loaded');
                resolve();
                return;
            }

            console.log('Loading VideoSDK script...');
            const script = document.createElement('script');
            script.src = 'https://sdk.videosdk.live/js-sdk/0.2.7/videosdk.js';
            script.async = true;
            
            script.onload = () => {
                console.log('✅ VideoSDK script loaded successfully');
                resolve();
            };
            
            script.onerror = (error) => {
                console.error('❌ Failed to load VideoSDK script:', error);
                reject(new Error('Failed to load VideoSDK script'));
            };
            
            document.head.appendChild(script);
        });
    }

    async initVideoSDK() {
        // Wait for VideoSDK to be available
        await new Promise((resolve) => {
            const checkSDK = () => {
                if (window.videoSDKManager) {
                    resolve();
                } else {
                    console.warn('VideoSDK manager not available, waiting...');
                    setTimeout(checkSDK, 500);
                }
            };
            checkSDK();
        });

        try {
            // Use the global instance instead of creating a new one
            this.videoSDKManager = window.videoSDKManager;
            const config = this.videoSDKManager.getMetaConfig();
            await this.videoSDKManager.init(config.authToken || this.videoSDKManager.defaultToken);
            console.log('✅ VideoSDK initialized');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize VideoSDK:', error);
            throw error;
        }
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
        console.log('🎤 Attempting to join voice channel');
        if (this.isConnected) {
            console.log('Already connected to voice');
            return Promise.resolve();
        }
        
        const channelId = this.currentChannelId || document.querySelector('meta[name="channel-id"]')?.content;
        if (!channelId) {
            console.error('❌ No channel ID available');
            this.showToast('Channel not available', 'error');
            return Promise.reject(new Error('Channel not available'));
        }

        try {
            console.log('🔄 Setting up voice for channel:', channelId);
            this.setupVoice(channelId);

            // Make sure we're initialized
            if (!this.initialized) {
                console.log('⏳ Initializing voice manager...');
                await this.init();
            }

            // Wait for VideoSDK initialization if not already done
            if (!this.videoSDKManager) {
                console.log('⏳ Waiting for VideoSDK initialization...');
                await this.initializationPromise;
            }

            if (!this.videoSDKManager) {
                throw new Error('VideoSDK initialization failed');
            }

            const meetingId = `voice_channel_${channelId}`;
            console.log('🔄 Creating/joining meeting:', meetingId);

            const meeting = await this.videoSDKManager.createMeetingRoom(meetingId);
            if (!meeting) {
                throw new Error('Failed to create meeting room');
            }

            console.log('✅ Meeting room created:', meeting);
            await this.videoSDKManager.initMeeting({
                meetingId: meeting,
                name: window.currentUsername || 'Anonymous',
                micEnabled: true,
                webcamEnabled: false
            });

            await this.videoSDKManager.joinMeeting();

            this.isConnected = true;
            this.dispatchEvent('voiceConnect', {
                channelId: this.currentChannelId,
                channelName: this.currentChannelName,
                meetingId: meeting
            });

            console.log('✅ Successfully joined voice channel');
            return Promise.resolve();
        } catch (error) {
            console.error('❌ Failed to join voice:', error);
            this.showToast('Failed to connect to voice', 'error');
            return Promise.reject(error);
        }
    }
    
    leaveVoice() {
        if (!this.isConnected) return;
        
        if (this.videoSDKManager) {
            this.videoSDKManager.leaveMeeting();
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

// Initialize voice manager after DOM is loaded
window.addEventListener('DOMContentLoaded', async function() {
    window.voiceManager = new VoiceManager();
    // Initialize after a short delay to ensure other dependencies are loaded
    setTimeout(async () => {
        try {
            await window.voiceManager.init();
        } catch (error) {
            console.error('Failed to initialize voice manager:', error);
        }
    }, 1000);
});

window.addEventListener('voiceDisconnect', function() {
    if (window.voiceManager) {
        window.voiceManager.leaveVoice();
    }
});

