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
        this.currentMeetingId = null;
        
    }
    
    async init() {
        if (this.initialized) return;
        
        try {
            await this.loadVideoSDKScript();
            await this.initVideoSDK();
        this.attachEventListeners();
            this.setupErrorHandling();
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
    
    setupErrorHandling() {
        // Add global error handler for stream events
        window.addEventListener('error', (event) => {
            // Check if the error is related to VideoSDK streams
            if (event.error && event.error.message && (
                event.error.message.includes('Cannot read properties of undefined') ||
                event.error.message.includes('kind') ||
                event.error.message.includes('stream')
            )) {
                console.warn('Voice manager caught stream error:', event.error.message);
                event.preventDefault();
                event.stopPropagation();
                return true;
            }
        }, true);
        
        // Listen for custom stream events
        window.addEventListener('videosdkStreamEnabled', (event) => {
            console.log('Voice manager received stream enabled event:', event.detail);
        });
        
        window.addEventListener('videosdkStreamDisabled', (event) => {
            console.log('Voice manager received stream disabled event:', event.detail);
        });
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

            if (!this.initialized) {
                console.log('⏳ Initializing voice manager...');
                await this.init();
            }

            if (!this.videoSDKManager) {
                console.log('⏳ Waiting for VideoSDK initialization...');
                await this.initializationPromise;
            }

            if (!this.videoSDKManager) {
                throw new Error('VideoSDK initialization failed');
            }
            
            window.videoSDKJoiningInProgress = true;

            const meetingId = `voice_channel_${channelId}`;
            console.log('🔄 Creating/joining meeting:', meetingId);

            // Create meeting room
            const meeting = await this.videoSDKManager.createMeetingRoom(meetingId);
            if (!meeting) {
                throw new Error('Failed to create meeting room');
            }
            console.log('✅ Meeting room created:', meeting);
            
            // Initialize meeting
            await this.videoSDKManager.initMeeting({
                meetingId: meeting,
                name: window.currentUsername || 'Anonymous',
                micEnabled: true,
                webcamEnabled: false
            });
            
            // Join meeting with simplified approach
            await this.videoSDKManager.joinMeeting();
            
            this.currentMeetingId = meeting;
                this.isConnected = true;
            
            // Dispatch event
                this.dispatchEvent('voiceConnect', {
                    channelId: this.currentChannelId,
                    channelName: this.currentChannelName,
                meetingId: meeting
                });

            console.log('✅ Successfully joined voice channel');
                return Promise.resolve();
            } catch (error) {
            console.error('❌ Failed to join voice:', error);
            
            window.videoSDKJoiningInProgress = false;
            this.isConnected = false;
                this.showToast('Failed to connect to voice', 'error');
                return Promise.reject(error);
        }
    }
    
    leaveVoice() {
        if (!this.isConnected) return;
        
        if (window.videoSDKJoiningInProgress) {
            console.log('Ignoring disconnect request - joining in progress');
            return;
        }
        
        if (this.videoSDKManager) {
            this.videoSDKManager.leaveMeeting();
        }
        
        this.isConnected = false;
        this.currentChannelId = null;
        this.currentChannelName = null;
        this.currentMeetingId = null;
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

    resetState() {
        this.isConnected = false;
        this.isMuted = false;
        this.isDeafened = false;
        this.isVideoOn = false;
        this.isScreenSharing = false;
        this.participants.clear();
        this.currentChannelId = null;
        this.currentChannelName = null;
        this.currentMeetingId = null;
        
        // Leave any existing meeting
        if (this.videoSDKManager && this.videoSDKManager.meeting) {
            this.videoSDKManager.leaveMeeting();
        }
        
        // Reset VideoSDK state
        if (this.videoSDKManager) {
            this.videoSDKManager = null;
            this.initialized = false;
            this.initializationPromise = null;
        }
        
        // Re-initialize after reset
        setTimeout(() => {
            this.init().catch(error => {
                console.error('Failed to reinitialize voice manager:', error);
            });
        }, 100);
    }
}

window.addEventListener('DOMContentLoaded', async function() {
    window.voiceManager = new VoiceManager();
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

