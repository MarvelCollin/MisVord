class ChatBot {
    constructor(chatSection) {
        this.chatSection = chatSection;
        this.initialized = false;
        this.socketListenersSetup = false;
        this.botReady = false;
        
        console.log('🤖 [CHAT-BOT] ChatBot component initialized');
        this.init();
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

            io.on('bot-music-command', (data) => {
                console.log('🎵 [TITIBOT] Received music command:', data);
                if (data && data.music_data) {
                    this.executeMusicCommand(data.music_data);
                } else {
                    console.warn('⚠️ [CHAT-BOT] Invalid bot-music-command data:', data);
                }
            });

            io.on('new-channel-message', (data) => {
                this.handleBotMessage(data);
            });

            io.on('user-message-dm', (data) => {
                this.handleBotMessage(data);
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
            const allCommands = ['ping', 'help', 'play', 'stop', 'next', 'prev', 'queue'];
            
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
            'ping': 'Check if TitiBot is alive and responding',
            'help': 'Show all available TitiBot commands',
            'play': 'Play music from iTunes (e.g., /titibot play never gonna give you up)',
            'stop': 'Stop the currently playing music',
            'next': 'Play the next song in the queue',
            'prev': 'Play the previous song in the queue',
            'queue': 'Add a song to the music queue (e.g., /titibot queue bohemian rhapsody)'
        };
        return descriptions[command] || 'TitiBot command';
    }

    handleBotMessage(data) {
        if (!data || !data.is_bot || !data.music_data) {
            return;
        }

        console.log('🤖 [CHAT-BOT] Bot message with music data received:', {
            content: data.content,
            action: data.music_data.action,
            query: data.music_data.query
        });

        this.executeMusicCommand(data.music_data);
    }

    async executeMusicCommand(musicData) {
        if (!window.musicPlayer) {
            console.error('❌ [CHAT-BOT] Music player not available');
            return;
        }

        console.log('🎵 [CHAT-BOT] Executing music command:', musicData);
        const { action, query, track } = musicData;

        try {
            switch (action) {
                case 'play':
                    if (query && query.trim()) {
                        console.log('🎵 [CHAT-BOT] Searching and playing:', query);
                        const searchResult = await window.musicPlayer.searchMusic(query.trim());
                        if (searchResult && searchResult.previewUrl) {
                            const result = await window.musicPlayer.playTrack(searchResult);
                            console.log('✅ [CHAT-BOT] Successfully started playing:', searchResult.title);
                        } else {
                            console.warn('⚠️ [CHAT-BOT] No playable track found for:', query);
                        }
                    } else {
                        console.warn('⚠️ [CHAT-BOT] Play command missing query parameter');
                    }
                    break;

                case 'queue':
                    if (query && query.trim()) {
                        console.log('🎵 [CHAT-BOT] Searching and queueing:', query);
                        const result = await window.musicPlayer.addToQueue(query.trim());
                        console.log('✅ [CHAT-BOT] Queue operation result:', result);
                    } else {
                        console.warn('⚠️ [CHAT-BOT] Queue command missing query parameter');
                    }
                    break;

                case 'stop':
                    console.log('🎵 [CHAT-BOT] Stopping music');
                    await window.musicPlayer.stop();
                    window.musicPlayer.hideNowPlaying();
                    break;

                case 'next':
                    console.log('🎵 [CHAT-BOT] Playing next song');
                    const nextResult = await window.musicPlayer.playNext();
                    console.log('✅ [CHAT-BOT] Next song result:', nextResult);
                    break;

                case 'prev':
                    console.log('🎵 [CHAT-BOT] Playing previous song');
                    const prevResult = await window.musicPlayer.playPrevious();
                    console.log('✅ [CHAT-BOT] Previous song result:', prevResult);
                    break;

                default:
                    console.warn('⚠️ [CHAT-BOT] Unknown music action:', action);
            }
        } catch (error) {
            console.error('❌ [CHAT-BOT] Error executing music command:', error);
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

        if (!window.globalSocketManager?.isReady()) {
            setTimeout(() => this.ensureBotActive(), 500);
            return;
        }

        if (window.BotComponent && !window.BotComponent.isInitialized()) {
            window.BotComponent.init();
        }

        const titiBotId = '4';
        const titiBotUsername = 'titibot';
        
        if (!window.BotComponent.getBotStatus(titiBotId)) {
            console.log('🤖 [CHAT-BOT] Initializing TitiBot on server...');
            window.globalSocketManager.io.emit('bot-init', {
                bot_id: titiBotId,
                username: titiBotUsername
            });
        }

        this.botReady = true;
    }
}

if (typeof window !== 'undefined') {
    window.ChatBot = ChatBot;
}
export default ChatBot;