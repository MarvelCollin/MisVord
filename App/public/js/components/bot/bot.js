class BotComponent {
    constructor() {
        this.initialized = false;
        this.activeBots = new Map();
        this.voiceBots = new Map();
    }

    init() {
        if (this.initialized) return;
        

        this.setupSocketListeners();
        this.initialized = true;

    }

    setupSocketListeners() {
        if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {

            setTimeout(() => this.setupSocketListeners(), 1000);
            return;
        }

        const io = window.globalSocketManager.io;

        io.on('bot-init-success', (data) => {

            this.activeBots.set(data.bot_id, {
                id: data.bot_id,
                username: data.username,
                status: 'active',
                joinedAt: Date.now()
            });
        });

        io.on('bot-init-error', (data) => {
            console.error('❌ Bot initialization failed:', data);
        });

        io.on('bot-join-success', (data) => {

            const bot = this.activeBots.get(data.bot_id);
            if (bot) {
                if (!bot.channels) bot.channels = new Set();
                bot.channels.add(data.channel_id);
            }
        });

        io.on('bot-join-error', (data) => {
            console.error('❌ Bot join channel failed:', data);
        });

        io.on('bot-voice-participant-joined', (data) => {
            const { participant } = data;
            
            if (participant && participant.user_id && participant.username) {
                this.voiceBots.set(participant.user_id, {
                    user_id: participant.user_id,
                    username: participant.username,
                    channel_id: participant.channel_id,
                    joinedAt: Date.now()
                });

                window.dispatchEvent(new CustomEvent('bot-voice-participant-joined', {
                    detail: { participant }
                }));

                if (window.voiceCallSection) {
                    window.voiceCallSection.addBotParticipant(participant);
                } else {
                    console.warn('⚠️ [BOT] voiceCallSection not found, retrying in 1 second...');
                    setTimeout(() => {
                        if (window.voiceCallSection) {
                            window.voiceCallSection.addBotParticipant(participant);
                        } else {
                            console.error('❌ [BOT] voiceCallSection still not found after retry');
                        }
                    }, 1000);
                }
            }
        });

        io.on('bot-voice-participant-left', (data) => {

            const { participant } = data;
            
            if (participant && participant.user_id) {
                this.voiceBots.delete(participant.user_id);

                window.dispatchEvent(new CustomEvent('bot-voice-participant-left', {
                    detail: { participant }
                }));

                if (window.voiceCallSection) {
                    window.voiceCallSection.removeBotParticipant(participant.user_id);
                }
            }
        });


    }

    getBotStatus(botId) {
        return this.activeBots.get(botId) || null;
    }

    getActiveBots() {
        return Array.from(this.activeBots.values());
    }

    getVoiceBots() {
        return Array.from(this.voiceBots.values());
    }

    isBotInVoice(botId) {
        return this.voiceBots.has(botId);
    }

    isInitialized() {
        return this.initialized;
    }

    debugVoiceContext() {

        
        console.log('1. VideoSDK Manager:', {
            exists: !!window.videoSDKManager,
            isConnected: window.videoSDKManager?.isConnected,
            isMeetingJoined: window.videoSDKManager?.isMeetingJoined,
            meetingId: window.videoSDKManager?.meetingId
        });
        
        console.log('2. Global Socket Manager:', {
            exists: !!window.globalSocketManager,
            currentActivityDetails: window.globalSocketManager?.currentActivityDetails,
            currentPresenceStatus: window.globalSocketManager?.currentPresenceStatus
        });
        
        console.log('3. Unified Voice State Manager:', {
            exists: !!window.unifiedVoiceStateManager,
            state: window.unifiedVoiceStateManager?.getState?.()
        });
        
        console.log('4. URL Info:', {
            pathname: window.location.pathname,
            search: window.location.search,
            channelParam: new URLSearchParams(window.location.search).get('channel')
        });
        
        console.log('5. Voice Channel Elements:', {
            voiceChannels: document.querySelectorAll('[data-channel-type="voice"]').length,
            activeVoiceChannel: document.querySelector('[data-channel-type="voice"].active')?.getAttribute('data-channel-id')
        });
        

    }
}

window.BotComponent = new BotComponent();

document.addEventListener('DOMContentLoaded', function() {
    if (window.globalSocketManager && window.globalSocketManager.isReady()) {
        window.BotComponent.init();
    } else {
        window.addEventListener('globalSocketReady', function() {
            window.BotComponent.init();
        });
    }
});



window.debugTitiBotVoiceContext = function() {

    
    if (window.BotComponent) {
        window.BotComponent.debugVoiceContext();
    }
    
    console.log('🔍 [DEBUG] URL Info:', {
        pathname: window.location.pathname,
        search: window.location.search,
        channelParam: new URLSearchParams(window.location.search).get('channel'),
        typeParam: new URLSearchParams(window.location.search).get('type')
    });
    
    const metaChannelId = document.querySelector('meta[name="channel-id"]')?.content;
    const metaChannelType = document.querySelector('meta[name="channel-type"]')?.content;

    
    if (window.unifiedVoiceStateManager) {
        const voiceState = window.unifiedVoiceStateManager.getState();

    }
    
    if (window.simpleChannelSwitcher) {
        console.log('🔄 [DEBUG] Channel Switcher State:', {
            currentChannelId: window.simpleChannelSwitcher.currentChannelId,
            currentChannelType: window.simpleChannelSwitcher.currentChannelType
        });
    }
    

    
    let voiceChannelId = null;
    let userInVoice = false;
    let detectionMethod = 'none';
    
    const urlParams = new URLSearchParams(window.location.search);
    const currentChannelId = urlParams.get('channel');
    const currentChannelType = urlParams.get('type');
    const voiceMetaChannelType = document.querySelector('meta[name="channel-type"]')?.content;
    
    if ((currentChannelType === 'voice' || voiceMetaChannelType === 'voice') && currentChannelId) {
        const channelElement = document.querySelector(`[data-channel-id="${currentChannelId}"][data-channel-type="voice"]`);
        if (channelElement) {
            voiceChannelId = currentChannelId;
            
            const isActuallyConnected = (window.unifiedVoiceStateManager?.getState()?.isConnected) ||
                                      (window.videoSDKManager?.isConnected && window.videoSDKManager?.isMeetingJoined) ||
                                      (window.voiceManager?.isConnected);
            
            if (isActuallyConnected) {
                userInVoice = true;
                detectionMethod = 'currentVoiceChannel+connected';
            } else {
                userInVoice = true;
                detectionMethod = 'currentVoiceChannel+present';
            }
        }
    }
    
    if (!userInVoice && window.unifiedVoiceStateManager) {
        const voiceState = window.unifiedVoiceStateManager.getState();
        if (voiceState.isConnected && voiceState.channelId) {
            voiceChannelId = voiceState.channelId;
            userInVoice = true;
            detectionMethod = 'unifiedVoiceStateManager';
        }
    }
    
    if (!userInVoice && window.videoSDKManager) {
        if (window.videoSDKManager.isConnected && window.videoSDKManager.isMeetingJoined) {
            const meetingId = window.videoSDKManager.meetingId;
            if (meetingId && meetingId.includes('voice_channel_')) {
                voiceChannelId = meetingId.replace('voice_channel_', '');
                userInVoice = true;
                detectionMethod = 'videoSDKManager';
            }
        }
    }
    
    if (!userInVoice && window.globalSocketManager) {
        const currentActivity = window.globalSocketManager.currentActivityDetails;
        if (currentActivity && currentActivity.type) {
            if (currentActivity.type === 'In Voice Call' || currentActivity.type.startsWith('In Voice - ')) {
                if (currentActivity.channel_id) {
                    voiceChannelId = currentActivity.channel_id;
                    userInVoice = true;
                    detectionMethod = 'globalSocketManager';
                }
            }
        }
    }
    
    if (!userInVoice && window.location.pathname.includes('/server/')) {
        const urlMatch = window.location.pathname.match(/\/server\/(\d+)$/);
        const urlParams = new URLSearchParams(window.location.search);
        const channelParam = urlParams.get('channel');
        
        if (urlMatch && channelParam) {
            const channelElement = document.querySelector(`[data-channel-id="${channelParam}"][data-channel-type="voice"]`);
            if (channelElement) {
                voiceChannelId = channelParam;
                userInVoice = true;
                detectionMethod = 'URLParams';
            }
        }
    }
    
    console.log('🎯 [TITIBOT-DEBUG] Final Detection Result:', {
        userInVoice,
        voiceChannelId,
        detectionMethod
    });
    
    return { userInVoice, voiceChannelId, detectionMethod };
};

window.debugBotMusicIntegration = function() {

    
    console.log('1. Components Check:', {
        musicPlayer: !!window.musicPlayer,
        voiceCallSection: !!window.voiceCallSection,
        BotComponent: !!window.BotComponent,
        globalSocketManager: !!window.globalSocketManager
    });
    
    console.log('2. Music Player State:', {
        currentSong: window.musicPlayer?.currentSong,
        isPlaying: window.musicPlayer?.isPlaying,
        queueLength: window.musicPlayer?.queue?.length || 0
    });
    
    console.log('3. Voice Bots:', {
        voiceBots: window.BotComponent?.voiceBots,
        voiceBotsCount: window.BotComponent?.voiceBots?.size || 0
    });
    
    console.log('4. Voice Call Section:', {
        participantGrid: !!document.getElementById('participantGrid'),
        botParticipants: document.querySelectorAll('.bot-participant-card').length
    });
    
    return {
        canPlayMusic: !!window.musicPlayer,
        voiceBotsActive: (window.BotComponent?.voiceBots?.size || 0) > 0,
        participantGridExists: !!document.getElementById('participantGrid')
    };
};

window.testBotMusicCommand = async function(songName = 'never gonna give you up') {

    
    if (!window.musicPlayer) {
        console.error('❌ Music player not available');
        return;
    }
    
    try {
        const mockMusicData = {
            action: 'play',
            query: songName,
            track: null
        };
        

        
        const searchResult = await window.musicPlayer.searchMusic(songName);
        if (searchResult && searchResult.previewUrl) {

            const result = await window.musicPlayer.playTrack(searchResult);
            window.musicPlayer.showNowPlaying(searchResult);

        } else {
            console.warn('⚠️ [BOT-MUSIC-TEST] No playable track found');
        }
    } catch (error) {
        console.error('❌ [BOT-MUSIC-TEST] Error:', error);
    }
};

window.testBotVoiceJoin = function() {

    
    const mockBotData = {
        user_id: '4',
        username: 'titibot',
        avatar_url: '/public/assets/common/default-profile-picture.png',
        isBot: true,
        channelId: document.querySelector('meta[name="channel-id"]')?.content || '1',
        meetingId: document.querySelector('meta[name="meeting-id"]')?.content || 'voice_channel_1',
        joinedAt: Date.now()
    };
    

    
    if (window.voiceCallSection) {
        window.voiceCallSection.addBotParticipant(mockBotData);

    } else {
        console.error('❌ [BOT-VOICE-TEST] Voice call section not found');
    }
};





