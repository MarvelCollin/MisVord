class ChatBot {
    constructor(chatSection) {
        this.chatSection = chatSection;
        this.initialized = false;
        this.socketListenersSetup = false;
        this.botReady = false;
        
        console.log('🤖 [CHAT-BOT] ChatBot component initialized');
    }

    init() {
        if (this.initialized) return;
        
        this.setupEventListeners();
        this.setupSocketListeners();
        this.ensureBotActive();
        this.initialized = true;
        
        console.log('✅ [CHAT-BOT] ChatBot component ready');
    }

    setupEventListeners() {
        if (!this.chatSection.messageInput) return;

        const originalInputHandler = this.chatSection.messageInput.oninput;
        this.chatSection.messageInput.addEventListener('input', () => {
            this.handleTitiBotAutocomplete();
        });

        const originalKeyHandler = this.chatSection.messageInput.onkeypress;
        this.chatSection.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Escape') {
                this.hideTitiBotSuggestions();
            }
        });

        console.log('🎧 [CHAT-BOT] Event listeners attached');
    }

    setupSocketListeners() {
        if (this.socketListenersSetup) return;

        const setupBotSocketHandlers = () => {
            if (!window.globalSocketManager?.io) {
                setTimeout(setupBotSocketHandlers, 200);
                return;
            }

            const io = window.globalSocketManager.io;

            io.on('bot-init-success', (data) => {
                console.log('🤖 [TITIBOT] Bot initialization success:', data);
                this.botReady = true;
            });

            io.on('bot-init-error', (data) => {
                console.error('🤖 [TITIBOT] Bot initialization error:', data);
            });

            io.on('bot-join-success', (data) => {
                console.log('🤖 [TITIBOT] Bot join success:', data);
                this.botReady = true;
            });

            io.on('bot-join-error', (data) => {
                console.error('🤖 [TITIBOT] Bot join error:', data);
            });

            io.on('bot-music-command', (data) => {
                console.log('🎵 [TITIBOT] Received music command:', data);
                this.handleMusicCommand(data);
            });

            this.socketListenersSetup = true;
            console.log('🔌 [CHAT-BOT] Socket listeners setup complete');
        };

        setupBotSocketHandlers();

        // Trigger ensureBotActive once socket is authenticated
        window.addEventListener('socketAuthenticated', () => {
            console.log('🔑 [CHAT-BOT] Socket authenticated event received');
            this.ensureBotActive();
        });
    }

    async handleTitiBotCommand(content) {
        if (!content.startsWith('/titibot ')) {
            return false;
        }

        if (this.chatSection.chatType !== 'channel') {
            console.log('🤖 TitiBot commands only work in channels, not DMs');
            if (window.showToast) {
                window.showToast('🤖 TitiBot commands only work in server channels', 'warning');
            }
            return true;
        }

        console.log('🤖 [CHAT-BOT] TitiBot command detected, ensuring bot is active...');
        this.ensureBotActive();

        return false;
    }

    getServerId() {
        if (this.chatSection.serverId) return this.chatSection.serverId;
        
        const urlMatch = window.location.pathname.match(/\/server\/(\d+)/);
        if (urlMatch) {
            this.chatSection.serverId = urlMatch[1];
            return this.chatSection.serverId;
        }
        
        if (window.GLOBALS && window.GLOBALS.server && window.GLOBALS.server.id) {
            this.chatSection.serverId = window.GLOBALS.server.id;
            return this.chatSection.serverId;
        }
        
        return null;
    }

    handleTitiBotAutocomplete() {
        if (!this.chatSection.messageInput || this.chatSection.chatType !== 'channel') {
            this.hideTitiBotSuggestions();
            return;
        }

        const content = this.chatSection.messageInput.value;
        
        if (content.startsWith('/titibot') && content.length > 8) {
            const afterSlash = content.substring(8).trim();
            const allCommands = ['ping', 'play', 'stop', 'next', 'prev', 'queue'];
            
            if (afterSlash === '') {
                this.showTitiBotSuggestions(allCommands);
            } else {
                const words = afterSlash.split(' ');
                const firstWord = words[0].toLowerCase();
                
                const matchingCommands = allCommands.filter(cmd => 
                    cmd.toLowerCase().startsWith(firstWord)
                );
                
                if (matchingCommands.length > 0) {
                    this.showTitiBotSuggestions(matchingCommands);
                } else if (firstWord === 'play' || firstWord === 'queue') {
                    this.hideTitiBotSuggestions();
                } else {
                    this.hideTitiBotSuggestions();
                }
            }
        } else {
            this.hideTitiBotSuggestions();
        }
    }

    showTitiBotSuggestions(commands) {
        let suggestionContainer = document.getElementById('titibot-suggestions');
        
        if (!suggestionContainer) {
            suggestionContainer = document.createElement('div');
            suggestionContainer.id = 'titibot-suggestions';
            suggestionContainer.className = 'absolute bottom-full left-0 right-0 bg-[#2b2d31] border border-[#3c3f45] rounded-t-lg shadow-lg p-2 mb-1 z-50';
            
            if (this.chatSection.messageInput && this.chatSection.messageInput.parentNode) {
                this.chatSection.messageInput.parentNode.style.position = 'relative';
                this.chatSection.messageInput.parentNode.appendChild(suggestionContainer);
            }
        }

        suggestionContainer.innerHTML = '';

        const header = document.createElement('div');
        header.className = 'text-xs text-[#b5bac1] font-semibold mb-2';
        header.innerHTML = '<i class="fas fa-robot mr-1"></i>TitiBot Commands';
        suggestionContainer.appendChild(header);

        commands.forEach(command => {
            const commandItem = document.createElement('div');
            commandItem.className = 'flex items-center p-2 hover:bg-[#36393f] rounded cursor-pointer text-[#dcddde]';
            commandItem.innerHTML = `
                <i class="fas fa-terminal mr-3 text-[#5865f2]"></i>
                <div>
                    <div class="font-medium">/titibot ${command}</div>
                    <div class="text-xs text-[#b5bac1]">${this.getTitiBotCommandDescription(command)}</div>
                </div>
            `;
            
            commandItem.addEventListener('click', () => {
                if (command === 'play' || command === 'queue') {
                    this.chatSection.messageInput.value = `/titibot ${command} `;
                } else {
                    this.chatSection.messageInput.value = `/titibot ${command}`;
                }
                this.chatSection.messageInput.focus();
                this.hideTitiBotSuggestions();
                this.chatSection.resizeTextarea();
                this.chatSection.updateSendButton();
            });
            
            suggestionContainer.appendChild(commandItem);
        });
    }

    hideTitiBotSuggestions() {
        const suggestionContainer = document.getElementById('titibot-suggestions');
        if (suggestionContainer) {
            suggestionContainer.remove();
        }
    }

    getTitiBotCommandDescription(command) {
        const descriptions = {
            'ping': 'Test if TitiBot is online and responsive',
            'play': 'Play music from iTunes (e.g., /titibot play never gonna give you up)',
            'stop': 'Stop the currently playing music',
            'next': 'Play the next song in the queue',
            'prev': 'Play the previous song in the queue',
            'queue': 'Add a song to the music queue (e.g., /titibot queue bohemian rhapsody)'
        };
        return descriptions[command] || 'TitiBot command';
    }

    async fetchTitiBotData() {
        try {
            console.log('🤖 [CHAT-BOT] Fetching TitiBot data from server...');
            console.log('🌐 [CHAT-BOT] Making request to: /api/bots/public-check/titibot');
            
            const response = await fetch('/api/bots/public-check/titibot');
            console.log('📡 [CHAT-BOT] Response received:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
            });
            
            if (!response.ok) {
                console.warn('⚠️ [CHAT-BOT] Failed to check TitiBot status:', response.status, response.statusText);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            console.log('📄 [CHAT-BOT] Parsing response as JSON...');
            const data = await response.json();
            console.log('🤖 [CHAT-BOT] Server response parsed successfully:', data);
            
            const botExists = data.exists && data.is_bot;
            const botInfo = data.bot;
            
            console.log('🔍 [CHAT-BOT] Bot validation:', {
                exists: data.exists,
                is_bot: data.is_bot,
                botExists: botExists,
                hasBotInfo: !!botInfo
            });
            
            if (botExists && botInfo) {
                window.titiBotData = botInfo;
                console.log('✅ [CHAT-BOT] TitiBot data loaded automatically:', botInfo);
                
                this.initializeTitiBotInSocket(botInfo);
            } else {
                console.log('⚠️ [CHAT-BOT] TitiBot not found on server or not a bot');
                // Trigger fallback
                throw new Error('TitiBot not found or invalid');
            }
        } catch (error) {
            console.error('❌ [CHAT-BOT] Error fetching TitiBot data:', error);
            console.log('🔄 [CHAT-BOT] Triggering fallback initialization...');
            
            // Fallback: Use hardcoded bot data
            const fallbackBotData = {
                id: 4,
                username: 'titibot',
                display_name: 'TitiBot',
                avatar_url: '/public/assets/common/default-profile-picture.png'
            };
            
            console.log('🔄 [CHAT-BOT] Using fallback bot data:', fallbackBotData);
            window.titiBotData = fallbackBotData;
            this.initializeTitiBotInSocket(fallbackBotData);
        }
    }

    initializeTitiBotInSocket(botInfo) {
        if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {
            console.log('⚠️ [CHAT-BOT] Socket not ready for TitiBot initialization, will retry...');
            setTimeout(() => {
                this.initializeTitiBotInSocket(botInfo);
            }, 1000);
            return;
        }

        console.log('🚀 [CHAT-BOT] Initializing TitiBot in socket server...');
        
        window.globalSocketManager.io.emit('bot-init', {
            bot_id: botInfo.id,
            username: botInfo.username
        });

        const serverId = this.getServerId();
        if (serverId) {
            window.globalSocketManager.io.emit('bot-join-channel', {
                bot_id: botInfo.id,
                channel_id: this.chatSection.targetId
            });
            console.log('🤖 [CHAT-BOT] TitiBot initialization and channel join events sent');
        }
    }

    handleMusicCommand(data) {
        if (!window.musicPlayer) {
            console.error('❌ [CHAT-BOT] Music player not available');
            return;
        }

        const { music_data, channel_id } = data;
        if (!music_data) {
            console.warn('⚠️ [CHAT-BOT] No music data in command');
            return;
        }

        const { action, track } = music_data;

        switch (action) {
            case 'play':
                if (track) {
                    window.musicPlayer.playTrack(track);
                }
                break;

            case 'stop':
                window.musicPlayer.stop();
                break;

            case 'next':
                window.musicPlayer.playNext();
                break;

            case 'prev':
                window.musicPlayer.playPrevious();
                break;

            case 'queue':
                if (track) {
                    window.musicPlayer.queue.push(track);
                    console.log('🎵 [CHAT-BOT] Track added to queue:', track.title);
                }
                break;

            default:
                console.warn('⚠️ [CHAT-BOT] Unknown music action:', action);
        }
    }

    cleanup() {
        this.hideTitiBotSuggestions();
        this.initialized = false;
        this.socketListenersSetup = false;
        console.log('🧹 [CHAT-BOT] ChatBot component cleaned up');
    }

    ensureBotActive() {
        if (this.botReady) return;

        // Wait until socket is ready and authenticated
        if (!window.globalSocketManager ||
            !window.globalSocketManager.isReady() ||
            !window.globalSocketManager.authenticated) {
            setTimeout(() => this.ensureBotActive(), 500);
            return;
        }

        if (window.titiBotData && window.titiBotData.id) {
            this.initializeTitiBotInSocket(window.titiBotData);
        } else {
            console.log('🤖 [CHAT-BOT] No cached TitiBot data, fetching from server...');
            this.fetchTitiBotData().catch(error => {
                console.warn('⚠️ [CHAT-BOT] API fetch failed, using fallback initialization:', error);
                // Fallback: Try to initialize with hardcoded bot data
                const fallbackBotData = {
                    id: 4, // From the debug output we saw earlier
                    username: 'titibot'
                };
                console.log('🔄 [CHAT-BOT] Attempting fallback initialization with hardcoded data');
                window.titiBotData = fallbackBotData;
                this.initializeTitiBotInSocket(fallbackBotData);
            });
        }
    }
}

if (typeof window !== 'undefined') {
    window.ChatBot = ChatBot;
}
export default ChatBot;