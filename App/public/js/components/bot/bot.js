class BotComponent {
    constructor() {
        this.initialized = false;
        this.activeBots = new Map();
        this.voiceBots = new Map();
        this._eventListeners = [];
        this._destroyed = false;
    }

    init() {
        if (this.initialized || this._destroyed) return;
        
        this.setupSocketListeners();
        this.initialized = true;
    }

    setupSocketListeners() {
        if (this._destroyed) return;
        
        if (!window.globalSocketManager?.isReady()) {
            const retryHandler = () => {
                if (!this._destroyed) {
                    this.setupSocketListeners();
                }
            };
            setTimeout(retryHandler, 1000);
            return;
        }

        const io = window.globalSocketManager.io;

        const botInitSuccessHandler = (data) => {
            if (this._destroyed) return;
            this.activeBots.set(data.bot_id, {
                id: data.bot_id,
                username: data.username,
                status: 'active',
                joinedAt: Date.now()
            });
        };

        const botInitErrorHandler = (data) => {
            if (this._destroyed) return;
            console.error('❌ Bot initialization failed:', data);
        };

        const botJoinSuccessHandler = (data) => {
            if (this._destroyed) return;
            const bot = this.activeBots.get(data.bot_id);
            if (bot) {
                if (!bot.channels) bot.channels = new Set();
                bot.channels.add(data.channel_id);
            }
        };

        const botJoinErrorHandler = (data) => {
            if (this._destroyed) return;
            console.error('❌ Bot join channel failed:', data);
        };

        const botVoiceParticipantJoinedHandler = (data) => {
            if (this._destroyed) return;
            const { participant } = data;
            
            if (participant?.user_id && participant?.username) {
                this.voiceBots.set(participant.user_id, {
                    user_id: participant.user_id,
                    username: participant.username,
                    channel_id: participant.channelId || participant.channel_id,
                    joinedAt: Date.now()
                });
            }
        };

        const botVoiceParticipantLeftHandler = (data) => {
            if (this._destroyed) return;
            const { participant } = data;
            
            if (participant?.user_id) {
                this.voiceBots.delete(participant.user_id);
            }
        };

        const voiceMeetingUpdateHandler = (data) => {
            if (this._destroyed) return;
            if (data.isBot && data.user_id) {
                if (data.action === 'join') {
                    this.voiceBots.set(data.user_id, {
                        user_id: data.user_id,
                        username: data.username,
                        channel_id: data.channel_id,
                        joinedAt: data.timestamp || Date.now()
                    });
                } else if (data.action === 'leave') {
                    this.voiceBots.delete(data.user_id);
                }
            }
        };

        io.on('bot-init-success', botInitSuccessHandler);
        io.on('bot-init-error', botInitErrorHandler);
        io.on('bot-join-success', botJoinSuccessHandler);
        io.on('bot-join-error', botJoinErrorHandler);
        io.on('bot-voice-participant-joined', botVoiceParticipantJoinedHandler);
        io.on('bot-voice-participant-left', botVoiceParticipantLeftHandler);
        io.on('voice-meeting-update', voiceMeetingUpdateHandler);
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
    
    destroy() {
        if (this._destroyed) return;
        
        this._destroyed = true;
        this.initialized = false;
        
        this.activeBots.clear();
        this.voiceBots.clear();
        
        this._eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this._eventListeners = [];
    }
}

if (typeof window !== 'undefined') {
    if (window.BotComponent) {
        window.BotComponent.destroy();
    }
    window.BotComponent = new BotComponent();
}

document.addEventListener('DOMContentLoaded', function() {
    if (window.globalSocketManager && window.globalSocketManager.isReady()) {
        window.BotComponent.init();
    } else {
        window.addEventListener('globalSocketReady', function() {
            window.BotComponent.init();
        });
    }
});




