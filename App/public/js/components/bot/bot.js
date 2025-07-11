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
                    channel_id: participant.channelId || participant.channel_id,
                    joinedAt: Date.now()
                });
                console.log(`🤖 [BOT-COMPONENT] Bot joined voice:`, participant.username, 'in channel', participant.channelId);
            }
        });

        io.on('bot-voice-participant-left', (data) => {
            const { participant } = data;
            
            if (participant && participant.user_id) {
                this.voiceBots.delete(participant.user_id);
                console.log(`🤖 [BOT-COMPONENT] Bot left voice:`, participant.username);
            }
        });

        // 
        io.on('voice-meeting-update', (data) => {
            if (data.isBot && data.user_id) {
                if (data.action === 'join') {
                    this.voiceBots.set(data.user_id, {
                        user_id: data.user_id,
                        username: data.username,
                        channel_id: data.channel_id,
                        joinedAt: data.timestamp || Date.now()
                    });
                    console.log(`🤖 [BOT-COMPONENT] Bot joined via meeting update:`, data.username, 'in channel', data.channel_id);
                } else if (data.action === 'leave') {
                    this.voiceBots.delete(data.user_id);
                    console.log(`🤖 [BOT-COMPONENT] Bot left via meeting update:`, data.username);
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





