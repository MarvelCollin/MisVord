class BotComponent {
    constructor() {
        this.initialized = false;
        this.activeBots = new Map();
        this.voiceBots = new Map();
    }

    init() {
        if (this.initialized) return;
        
        console.log('🤖 Initializing bot component...');
        this.setupSocketListeners();
        this.initialized = true;
        console.log('✅ Bot component initialized');
    }

    setupSocketListeners() {
        if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {
            console.log('⏳ Socket not ready, retrying in 1s...');
            setTimeout(() => this.setupSocketListeners(), 1000);
            return;
        }

        const io = window.globalSocketManager.io;

        io.on('bot-init-success', (data) => {
            console.log('🎉 Bot initialized successfully:', data);
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
            console.log('🚪 Bot joined channel successfully:', data);
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
            console.log('🤖🎵 Bot joined voice channel:', data);
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
                }
            }
        });

        io.on('bot-voice-participant-left', (data) => {
            console.log('🤖👋 Bot left voice channel:', data);
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

        console.log('🔌 Socket listeners set up successfully');
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
        console.log('🔧 [BOT-DEBUG] === VOICE CONTEXT DEBUG ===');
        
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
        
        console.log('=================================');
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

console.log('🤖 Bot component loaded');

window.debugTitiBotVoiceContext = function() {
    console.log('🎤 [TITIBOT-DEBUG] === VOICE CONTEXT DEBUG ===');
    
    if (window.BotComponent) {
        window.BotComponent.debugVoiceContext();
    }
    
    console.log('6. Testing Voice Detection Methods:');
    
    let voiceChannelId = null;
    let userInVoice = false;
    let detectionMethod = 'none';
    
    if (window.unifiedVoiceStateManager) {
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

console.log('🎤 [TITIBOT-DEBUG] Debug function loaded. Run debugTitiBotVoiceContext() to test voice detection.');
