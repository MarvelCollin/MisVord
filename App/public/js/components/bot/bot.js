class BotComponent {
    constructor() {
        this.initialized = false;
        this.activeBots = new Map();
    }

    init() {
        if (this.initialized) return;
        
        console.log('🤖 [BOT-COMPONENT] Initializing bot component...');
        this.setupSocketListeners();
        this.initialized = true;
        console.log('✅ [BOT-COMPONENT] Bot component initialized');
    }

    setupSocketListeners() {
        if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {
            console.log('⏳ [BOT-COMPONENT] Socket not ready, retrying in 1s...');
            setTimeout(() => this.setupSocketListeners(), 1000);
            return;
        }

        const io = window.globalSocketManager.io;

        io.on('bot-init-success', (data) => {
            console.log('🎉 [BOT-COMPONENT] Bot initialized successfully:', data);
            this.activeBots.set(data.bot_id, {
                id: data.bot_id,
                username: data.username,
                status: 'active',
                joinedAt: Date.now()
            });

            if (window.showToast) {
                window.showToast(`🤖 ${data.username} is now active!`, 'success');
            }
        });

        io.on('bot-init-error', (data) => {
            console.error('❌ [BOT-COMPONENT] Bot initialization failed:', data);
            if (window.showToast) {
                window.showToast(`❌ Bot initialization failed: ${data.message}`, 'error');
            }
        });

        io.on('bot-join-success', (data) => {
            console.log('🚪 [BOT-COMPONENT] Bot joined channel successfully:', data);
            const bot = this.activeBots.get(data.bot_id);
            if (bot) {
                if (!bot.channels) bot.channels = new Set();
                bot.channels.add(data.channel_id);
            }

            if (window.showToast) {
                window.showToast(`🤖 Bot joined channel successfully!`, 'success');
            }
        });

        io.on('bot-join-error', (data) => {
            console.error('❌ [BOT-COMPONENT] Bot join channel failed:', data);
            if (window.showToast) {
                window.showToast(`❌ Bot join failed: ${data.message}`, 'error');
            }
        });

        console.log('🔌 [BOT-COMPONENT] Socket listeners set up successfully');
    }

    getBotStatus(botId) {
        return this.activeBots.get(botId) || null;
    }

    getActiveBots() {
        return Array.from(this.activeBots.values());
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

console.log('🤖 [BOT-COMPONENT] Bot component loaded');
