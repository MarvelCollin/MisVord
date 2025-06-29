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
        this.preloadStarted = false;
        this.preloadComplete = false;
        
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

    async preloadResources() {
        if (this.preloadStarted) return;
        
        this.preloadStarted = true;
        
        try {
            await this.loadVideoSDKScript();
            await this.initVideoSDK();
            this.preloadComplete = true;
        } catch (error) {
            console.warn('Voice preload failed:', error);
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
            await this.videoSDKManager.init(config.authToken);
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
        // DISABLED: Stream handling moved to DiscordVoiceManager
        console.log('[VoiceManager] Stream handling disabled - using DiscordVoiceManager instead');
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
        if (this.isConnected) {
            return Promise.resolve();
        }
        
        const channelId = this.currentChannelId || document.querySelector('meta[name="channel-id"]')?.content;
        if (!channelId) {
            this.showToast('Channel not available', 'error');
            return Promise.reject(new Error('Channel not available'));
        }

        try {
            this.setupVoice(channelId);

            if (!this.preloadComplete) {
                await this.init();
            }

            if (!this.videoSDKManager) {
                await this.initializationPromise;
            }

            if (!this.videoSDKManager) {
                throw new Error('VideoSDK initialization failed');
            }
            
            window.videoSDKJoiningInProgress = true;

            const meetingId = `voice_channel_${channelId}`;

            const meeting = await this.videoSDKManager.createMeetingRoom(meetingId);
            if (!meeting) {
                throw new Error('Failed to create meeting room');
            }
            
            await this.videoSDKManager.initMeeting({
                meetingId: meeting,
                name: window.currentUsername || 'Anonymous',
                micEnabled: true,
                webcamEnabled: false
            });
            
            await this.videoSDKManager.joinMeeting();
            
            await new Promise((resolve) => {
                const checkReady = () => {
                    if (this.videoSDKManager.isReady()) {
                        resolve();
                    } else {
                        setTimeout(checkReady, 200);
                    }
                };
                
                if (this.videoSDKManager.isReady()) {
                    resolve();
                } else {
                    const onMeetingReady = () => {
                        window.removeEventListener('videosdkMeetingFullyJoined', onMeetingReady);
                        setTimeout(() => {
                            if (this.videoSDKManager.isReady()) {
                                resolve();
                            } else {
                                checkReady();
                            }
                        }, 300);
                    };
                    
                    window.addEventListener('videosdkMeetingFullyJoined', onMeetingReady);
                    checkReady();
                }
            });
            
            this.currentMeetingId = meeting;
            this.isConnected = true;
            
            const channelName = this.currentChannelName || 
                               document.querySelector('meta[name="channel-name"]')?.content ||
                               document.querySelector('.channel-name')?.textContent?.trim() ||
                               document.querySelector('h2')?.textContent?.trim() ||
                               'Voice Channel';
            
            this.dispatchEvent('voiceConnect', {
                channelId: this.currentChannelId,
                channelName: channelName,
                meetingId: meeting
            });

            return Promise.resolve();
        } catch (error) {
            console.error('Failed to join voice:', error);
            
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
        
        if (this.videoSDKManager && this.videoSDKManager.meeting) {
            this.videoSDKManager.leaveMeeting();
        }
        
        if (this.videoSDKManager) {
            this.videoSDKManager = null;
            this.initialized = false;
            this.initializationPromise = null;
        }
        
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
            console.log('Voice manager instance created');
        } catch (error) {
            console.error('Failed to initialize voice manager:', error);
        }
    }, 1000);
});

window.addEventListener('voiceUIReady', function() {
    if (window.voiceManager) {
        window.voiceManager.preloadResources();
    }
});

window.addEventListener('voiceDisconnect', function() {
    if (window.voiceManager) {
        window.voiceManager.leaveVoice();
    }
});

