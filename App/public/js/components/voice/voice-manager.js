class VoiceManager {
    constructor() {
        this.isConnected = false;
        this.currentChannelId = null;
        this.currentChannelName = null;
        this.videoSDKManager = null;
        this.initializationPromise = null;
        this.initialized = false;
        this.currentMeetingId = null;
        this.preloadStarted = false;
        this.preloadComplete = false;
        
        this.validateExistingState();
    }
    
    validateExistingState() {
        setTimeout(() => {
            if (window.unifiedVoiceStateManager) {
                const storedState = window.unifiedVoiceStateManager.getState();
                if (storedState.isConnected && !this.isConnected) {

                    
                    const hasVideoSDK = window.videoSDKManager?.isConnected;
                    if (!hasVideoSDK) {

                        window.unifiedVoiceStateManager.clearStaleConnection();
                    }
                }
            }
        }, 500);
    }
    
    async init() {
        if (this.initialized) return;
        
        try {
            await this.loadVideoSDKScript();
            await this.initVideoSDK();
            this.attachEventListeners();
            this.setupErrorHandling();
            this.initialized = true;

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

                resolve();
                return;
            }


            const script = document.createElement('script');
            script.src = 'https://sdk.videosdk.live/js-sdk/0.2.7/videosdk.js';
            script.async = true;
            
            script.onload = () => {

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

            return true;
        } catch (error) {
            console.error('❌ Failed to initialize VideoSDK:', error);
            throw error;
        }
    }
    
    attachEventListeners() {
        const joinBtn = document.getElementById('joinBtn');
        const leaveBtn = document.getElementById('leaveBtn');
        const disconnectBtn = document.getElementById('disconnectBtn');
        
        if (joinBtn) {
            joinBtn.addEventListener('click', () => this.joinVoice());
        }
        
        const bindLeave = (btn) => {
            if (btn) {
                btn.addEventListener('click', () => this.leaveVoice());
            }
        };

        bindLeave(leaveBtn);
        bindLeave(disconnectBtn);
        
        window.addEventListener('beforeunload', () => {
            if (this.isConnected) {

                this.cleanup();
            }
        });
        
        window.addEventListener('unload', () => {
            if (this.isConnected) {

                this.cleanup();
            }
        });
        
        window.addEventListener('pagehide', () => {
            if (this.isConnected) {

                this.cleanup();
            }
        });
        
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden' && this.isConnected) {

            } else if (document.visibilityState === 'visible' && this.isConnected) {

            }
        });
    }
    
    setupErrorHandling() {

    }
    
    setupVoice(channelId) {
        if (this.currentChannelId === channelId) return;
        
        if (this.isConnected) {
            this.leaveVoice();
        }
        
        this.currentChannelId = channelId;
        
        const channelNameElements = document.querySelectorAll('.voice-ind-title, .voice-channel-title, .voice-section .channel-name');
        const channelElement = document.querySelector(`[data-channel-id="${channelId}"]`);
        const channelName = channelElement?.querySelector('.channel-name')?.textContent?.trim() || 
                           channelElement?.textContent?.trim() || 'Voice Channel';
        this.currentChannelName = channelName;
        

        if (window.unifiedVoiceStateManager) {
            const currentState = window.unifiedVoiceStateManager.getState();
            if (currentState.isConnected) {
                console.log('🔄 [VOICE-MANAGER] Updating unified voice state for voice setup:', {
                    channelId,
                    channelName,
                    previousChannelId: currentState.channelId
                });
                
                window.unifiedVoiceStateManager.setState({
                    ...currentState,
                    channelId: channelId,
                    channelName: channelName
                });
            }
        }
        
        channelNameElements.forEach(el => {
            if (el.classList.contains('channel-name') || el.classList.contains('voice-channel-title')) {
                el.textContent = channelName.length > 10 
                    ? channelName.substring(0, 8) + '...' 
                    : channelName;
            } else {
                el.textContent = channelName;
            }
        });
    }
    
    async joinVoice() {
        const metaChannelId = document.querySelector('meta[name="channel-id"]')?.content;
        const targetChannelId = this.currentChannelId || metaChannelId;


        if (this.isConnected) {
            if (this.currentChannelId === targetChannelId) {

                return Promise.resolve();
            }

            this.leaveVoice();
        }
        
        if (window.voiceJoinInProgress) {

            window.voiceJoinInProgress = false;
        }
        
        if (window.videoSDKJoiningInProgress) {

            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        if (window.voiceJoinInProgress) {

            return Promise.resolve();
        }
        
        window.voiceJoinInProgress = true;
        
        if (!targetChannelId) {
            window.voiceJoinInProgress = false;
            this.showToast('Channel not available', 'error');
            return Promise.reject(new Error('Channel not available'));
        }

        try {
            this.setupVoice(targetChannelId);

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



            const existingMeeting = await this.checkExistingMeeting(targetChannelId);
            
            let meetingId;
            if (existingMeeting && existingMeeting.meeting_id) {

                meetingId = existingMeeting.meeting_id;
            } else {

                const customMeetingId = `voice_channel_${targetChannelId}`;
                meetingId = await this.videoSDKManager.createMeetingRoom(customMeetingId);
                if (!meetingId) {
                    throw new Error('Failed to create meeting room');
                }

            }

            


            

            const userName = this.getUsernameFromMultipleSources();

            

            this.currentMeetingId = meetingId;
            this.currentChannelId = targetChannelId;
            


            await this.registerMeetingWithSocket(targetChannelId, meetingId);
            


            console.log(`� [VOICE-MANAGER] Meeting prepared for external joining`, {
                meetingId: meetingId,
                channelId: targetChannelId,
                wasExistingMeeting: !!existingMeeting,
                action: existingMeeting ? 'PREPARED_EXISTING' : 'PREPARED_NEW'
            });


            return Promise.resolve();
        } catch (error) {
            console.error('❌ [VOICE-MANAGER] Failed to join voice:', error);
            
            window.videoSDKJoiningInProgress = false;
            window.voiceJoinInProgress = false;
            this.isConnected = false;
            this.showToast('Failed to connect to voice', 'error');
            return Promise.reject(error);
        }
    }
    
    async checkExistingMeeting(channelId) {
        return new Promise((resolve) => {
            if (!window.globalSocketManager?.io) {

                resolve(null);
                return;
            }
            
            const handleResponse = (data) => {
                if (data.channel_id === channelId) {
                    window.globalSocketManager.io.off('voice-meeting-status', handleResponse);
                    console.log(`📡 [VOICE-MANAGER] Voice meeting status received for channel ${channelId}:`, {
                        has_meeting: data.has_meeting,
                        meeting_id: data.meeting_id,
                        participant_count: data.participant_count,
                        full_data: data
                    });
                    
                    if (data.has_meeting && data.meeting_id) {

                        resolve({
                        meeting_id: data.meeting_id,
                        participant_count: data.participant_count
                        });
                    } else {

                        resolve(null);
                    }
                }
            };
            
            window.globalSocketManager.io.on('voice-meeting-status', handleResponse);

            window.globalSocketManager.io.emit('check-voice-meeting', { channel_id: channelId });
            
            setTimeout(() => {
                window.globalSocketManager.io.off('voice-meeting-status', handleResponse);

                resolve(null);
            }, 3000);
        });
    }

    async registerMeetingWithSocket(channelId, meetingId) {
        return new Promise((resolve) => {
            if (!window.globalSocketManager?.io || !window.globalSocketManager.isReady()) {
                resolve({ meeting_id: meetingId, channel_id: channelId });
                return;
            }
            
            const handleUpdate = (data) => {
                if (data.channel_id === channelId && (data.action === 'join' || data.action === 'already_registered')) {
                    window.globalSocketManager.io.off('voice-meeting-update', handleUpdate);

                    resolve(data);
                }
            };
            
            window.globalSocketManager.io.on('voice-meeting-update', handleUpdate);
            window.globalSocketManager.io.emit('register-voice-meeting', {
                channel_id: channelId,
                meeting_id: meetingId
            });
            
            setTimeout(() => {
                window.globalSocketManager.io.off('voice-meeting-update', handleUpdate);
                resolve({ meeting_id: meetingId, channel_id: channelId });
            }, 2000);
        });
    }

    leaveVoice() {
        if (!this.isConnected) {

            return;
        }
        
        if (window.videoSDKJoiningInProgress) {

            return;
        }
        
        console.log('🚪 [VOICE-MANAGER] Leaving voice channel:', {
            channelId: this.currentChannelId,
            meetingId: this.currentMeetingId
        });
        

        this.isConnected = false;
        window.voiceJoinInProgress = false;
        

        if (this.currentChannelId && window.globalSocketManager?.io) {
            window.globalSocketManager.io.emit('unregister-voice-meeting', {
                channel_id: this.currentChannelId
            });
        }
        

        if (this.videoSDKManager) {
            this.videoSDKManager.leaveMeeting();
        }
        

        const previousChannelId = this.currentChannelId;
        this.currentChannelId = null;
        this.currentChannelName = null;
        this.currentMeetingId = null;
        

        if (window.unifiedVoiceStateManager) {
            window.unifiedVoiceStateManager.handleDisconnect();
        }
        

        if (previousChannelId && window.ChannelVoiceParticipants) {
            const instance = window.ChannelVoiceParticipants.getInstance();
            const currentUserId = window.currentUserId || window.globalSocketManager?.userId;
            if (currentUserId) {
                instance.removeParticipant(previousChannelId, currentUserId);
                instance.updateParticipantContainer(previousChannelId);
            }
        }
        
        this.dispatchEvent(window.VOICE_EVENTS?.VOICE_DISCONNECT || 'voiceDisconnect');
        this.showToast('Disconnected from voice', 'info');

        if (window.MusicLoaderStatic?.playDisconnectVoiceSound) {
            window.MusicLoaderStatic.playDisconnectVoiceSound();
        }
    }
    
    cleanup() {

        
        if (this.currentChannelId && window.globalSocketManager?.io && window.globalSocketManager.isReady()) {
            try {
                window.globalSocketManager.io.emit('unregister-voice-meeting', {
                    channel_id: this.currentChannelId
                });

            } catch (error) {
                console.warn('🧹 [VOICE-MANAGER] Failed to send unregister to socket:', error);
            }
        }
        
        if (this.videoSDKManager) {
            try {
                this.videoSDKManager.leaveMeeting();

            } catch (error) {
                console.warn('🧹 [VOICE-MANAGER] Failed to leave VideoSDK meeting:', error);
            }
        }
        
        this.isConnected = false;
        this.currentChannelId = null;
        this.currentChannelName = null;
        this.currentMeetingId = null;
        window.voiceJoinInProgress = false;
        
        if (window.unifiedVoiceStateManager) {
            try {
                window.unifiedVoiceStateManager.handleDisconnect();

            } catch (error) {
                console.warn('🧹 [VOICE-MANAGER] Failed to reset unified voice state:', error);
            }
        }
        

    }
    
    refreshParticipantsUI() {

        
        if (this.videoSDKManager && typeof this.videoSDKManager.refreshExistingParticipants === 'function') {
            this.videoSDKManager.refreshExistingParticipants();
        }
        

        window.dispatchEvent(new CustomEvent('voiceParticipantsRefresh'));
    }

    dispatchEvent(eventName, detail = {}) {
        window.dispatchEvent(new CustomEvent(eventName, { detail }));
    }
    
    showToast(message, type = 'info') {
        window.showToast?.(message, type, 3000);
    }

    getUsernameFromMultipleSources() {

        let username = null;
        

        if (window.currentUsername && window.currentUsername !== 'Anonymous') {
            username = window.currentUsername;

        }
        

        if (!username) {
            const metaUsername = document.querySelector('meta[name="username"]')?.content;
            if (metaUsername && metaUsername !== 'Anonymous' && metaUsername.trim() !== '') {
                username = metaUsername;

            }
        }
        

        if (!username) {
            const appContainer = document.getElementById('app-container');
            const dataUsername = appContainer?.getAttribute('data-username');
            if (dataUsername && dataUsername !== 'Anonymous' && dataUsername.trim() !== '') {
                username = dataUsername;

            }
        }
        

        if (!username) {
            const socketData = document.getElementById('socket-data');
            const socketUsername = socketData?.getAttribute('data-username');
            if (socketUsername && socketUsername !== 'Anonymous' && socketUsername.trim() !== '') {
                username = socketUsername;

            }
        }
        

        if (!username) {
            const timestamp = Date.now().toString().slice(-4);
            username = `User${timestamp}`;

        }
        
        return username;
    }

    resetState() {

        
        this.isConnected = false;
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
        
        if (window.unifiedVoiceStateManager) {
            window.unifiedVoiceStateManager.reset();
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


});

