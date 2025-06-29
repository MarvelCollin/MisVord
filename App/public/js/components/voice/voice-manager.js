class VoiceManager {
    constructor() {
        this.isConnected = false;
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

            // 🎯 STEP 1: Check if meeting already exists for this channel
            console.log(`🔍 [VOICE-MANAGER] Checking for existing meeting in channel ${channelId}...`);
            const existingMeeting = await this.checkExistingMeeting(channelId);
            
            let meetingId;
            if (existingMeeting) {
                // 🎯 STEP 2: Join existing meeting
                console.log(`✅ [VOICE-MANAGER] Found existing meeting: ${existingMeeting.meeting_id}`);
                meetingId = existingMeeting.meeting_id;
            } else {
                // 🎯 STEP 3: Create new meeting
                console.log(`🆕 [VOICE-MANAGER] No existing meeting, creating new one...`);
                const customMeetingId = `voice_channel_${channelId}`;
                meetingId = await this.videoSDKManager.createMeetingRoom(customMeetingId);
                
                if (!meetingId) {
                    throw new Error('Failed to create meeting room');
                }
            }
            
            // 🎯 STEP 3b: ALWAYS register with socket (whether joining existing or created new)
            console.log(`📝 [VOICE-MANAGER] Registering with socket for meeting: ${meetingId}...`);
            await this.registerMeetingWithSocket(channelId, meetingId);
            
            // 🎯 STEP 4: Join the VideoSDK meeting (existing or new)
            console.log(`🚪 [VOICE-MANAGER] Joining VideoSDK meeting: ${meetingId}`);
            // Get proper username from multiple sources
            const userName = this.getUsernameFromMultipleSources();
            console.log(`🏷️ [VOICE-MANAGER] Using username: ${userName}`);
            
            await this.videoSDKManager.initMeeting({
                meetingId: meetingId,
                name: userName,
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
            
            this.currentMeetingId = meetingId;
            this.isConnected = true;
            
            const channelName = this.currentChannelName || 
                               document.querySelector('meta[name="channel-name"]')?.content ||
                               document.querySelector('.channel-name')?.textContent?.trim() ||
                               document.querySelector('h2')?.textContent?.trim() ||
                               'Voice Channel';
            
            this.dispatchEvent(window.VOICE_EVENTS?.VOICE_CONNECT || 'voiceConnect', {
                channelId: this.currentChannelId,
                channelName: channelName,
                meetingId: meetingId
            });

            console.log(`🎉 [VOICE-MANAGER] Successfully joined voice!`, {
                meetingId: meetingId,
                channelId: channelId,
                wasExistingMeeting: !!existingMeeting,
                action: existingMeeting ? 'JOINED_EXISTING' : 'CREATED_NEW'
            });
            return Promise.resolve();
        } catch (error) {
            console.error('❌ [VOICE-MANAGER] Failed to join voice:', error);
            
            window.videoSDKJoiningInProgress = false;
            this.isConnected = false;
            this.showToast('Failed to connect to voice', 'error');
            return Promise.reject(error);
        }
    }
    
    async checkExistingMeeting(channelId) {
        return new Promise((resolve) => {
            console.log(`🔍 [VOICE-MANAGER] Sending check-voice-meeting for channel ${channelId}`);
            
            // Set up one-time listener for response
            const handleResponse = (data) => {
                if (data.channel_id === channelId) {
                    window.globalSocketManager?.io?.off('voice-meeting-status', handleResponse);
                    
                    if (data.has_meeting) {
                        console.log(`✅ [VOICE-MANAGER] Existing meeting found:`, data);
                        resolve({
                            meeting_id: data.meeting_id,
                            participant_count: data.participant_count
                        });
                    } else {
                        console.log(`📭 [VOICE-MANAGER] No existing meeting found for channel ${channelId}`);
                        resolve(null);
                    }
                }
            };
            
            // Listen for response
            window.globalSocketManager?.io?.on('voice-meeting-status', handleResponse);
            
            // Send check request
            window.globalSocketManager?.io?.emit('check-voice-meeting', {
                channel_id: channelId
            });
            
            // Timeout after 5 seconds
            setTimeout(() => {
                window.globalSocketManager?.io?.off('voice-meeting-status', handleResponse);
                console.log(`⏰ [VOICE-MANAGER] Timeout checking meeting for channel ${channelId}, assuming no meeting`);
                resolve(null);
            }, 5000);
        });
    }

    async registerMeetingWithSocket(channelId, meetingId) {
        return new Promise((resolve, reject) => {
            console.log(`📝 [VOICE-MANAGER] Registering meeting ${meetingId} for channel ${channelId} with socket`);
            
            // Check if socket is ready
            if (!window.globalSocketManager?.io || !window.globalSocketManager?.isReady()) {
                console.warn(`⚠️ [VOICE-MANAGER] Socket not ready, proceeding without registration`);
                resolve({ meeting_id: meetingId, channel_id: channelId });
                return;
            }
            
            // Set up one-time listener for confirmation
            const handleUpdate = (data) => {
                if (data.channel_id === channelId && data.action === 'join') {
                    window.globalSocketManager.io.off('voice-meeting-update', handleUpdate);
                    console.log(`✅ [VOICE-MANAGER] Meeting registration confirmed:`, data);
                    resolve(data);
                }
            };
            
            // Listen for confirmation
            window.globalSocketManager.io.on('voice-meeting-update', handleUpdate);
            
            // Register meeting
            window.globalSocketManager.io.emit('register-voice-meeting', {
                channel_id: channelId,
                meeting_id: meetingId
            });
            
            // Timeout after 3 seconds
            setTimeout(() => {
                window.globalSocketManager.io.off('voice-meeting-update', handleUpdate);
                console.log(`✅ [VOICE-MANAGER] Meeting registration timeout, assuming success for ${meetingId}`);
                resolve({ meeting_id: meetingId, channel_id: channelId });
            }, 3000);
        });
    }

    leaveVoice() {
        if (!this.isConnected) return;
        
        if (window.videoSDKJoiningInProgress) {
            console.log('Ignoring disconnect request - joining in progress');
            return;
        }
        
        // Unregister from socket meeting before leaving VideoSDK
        if (this.currentChannelId) {
            console.log(`📤 [VOICE-MANAGER] Unregistering from socket meeting for channel ${this.currentChannelId}`);
            window.globalSocketManager?.io?.emit('unregister-voice-meeting', {
                channel_id: this.currentChannelId
            });
        }
        
        if (this.videoSDKManager) {
            this.videoSDKManager.leaveMeeting();
        }
        
        this.isConnected = false;
        this.currentChannelId = null;
        this.currentChannelName = null;
        this.currentMeetingId = null;
        this.participants.clear();
        this.dispatchEvent(window.VOICE_EVENTS?.VOICE_DISCONNECT || 'voiceDisconnect');
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

    getUsernameFromMultipleSources() {
        // Priority order: window.currentUsername > meta tag > session storage > app container data > fallback
        let username = null;
        
        // 1. Check window.currentUsername (set on home page)
        if (window.currentUsername && window.currentUsername !== 'Anonymous') {
            username = window.currentUsername;
            console.log(`🏷️ [USERNAME] Got from window.currentUsername: ${username}`);
        }
        
        // 2. Check meta tag (available on most pages)
        if (!username) {
            const metaUsername = document.querySelector('meta[name="username"]')?.content;
            if (metaUsername && metaUsername !== 'Anonymous' && metaUsername.trim() !== '') {
                username = metaUsername;
                console.log(`🏷️ [USERNAME] Got from meta tag: ${username}`);
            }
        }
        
        // 3. Check app container data attributes
        if (!username) {
            const appContainer = document.getElementById('app-container');
            const dataUsername = appContainer?.getAttribute('data-username');
            if (dataUsername && dataUsername !== 'Anonymous' && dataUsername.trim() !== '') {
                username = dataUsername;
                console.log(`🏷️ [USERNAME] Got from app-container data: ${username}`);
            }
        }
        
        // 4. Check socket data div
        if (!username) {
            const socketData = document.getElementById('socket-data');
            const socketUsername = socketData?.getAttribute('data-username');
            if (socketUsername && socketUsername !== 'Anonymous' && socketUsername.trim() !== '') {
                username = socketUsername;
                console.log(`🏷️ [USERNAME] Got from socket-data: ${username}`);
            }
        }
        
        // 5. Fallback - but make it unique to avoid collisions
        if (!username) {
            const timestamp = Date.now().toString().slice(-4);
            username = `User${timestamp}`;
            console.log(`🏷️ [USERNAME] Using fallback: ${username}`);
        }
        
        return username;
    }

    resetState() {
        this.isConnected = false;
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

window.addEventListener(window.VOICE_EVENTS?.VOICE_UI_READY || 'voiceUIReady', function() {
    if (window.voiceManager) {
        window.voiceManager.preloadResources();
    }
});

window.addEventListener(window.VOICE_EVENTS?.VOICE_DISCONNECT || 'voiceDisconnect', function() {
    if (window.voiceManager) {
        window.voiceManager.leaveVoice();
    }
});

