class ChatBot {
    constructor() {
        this.chatSection = null;
        this.botActive = false;
        this.setupBotListeners();
        this.ensureBotActive();
        console.log('🤖 [CHAT-BOT] ChatBot initialized');
    }

    setupBotListeners() {
        // Set up socket listeners for bot events
        if (window.globalSocketManager?.io) {
            const io = window.globalSocketManager.io;
            
            // Listen for bot messages
            io.on('new-channel-message', (data) => {
                if (data.is_bot && data.bot_id) {
                    console.log('🤖 [CHAT-BOT] Bot message received:', data);
                }
            });
            
            // Listen for bot music commands
            io.on('bot-music-command', (data) => {
                console.log('🤖 [CHAT-BOT] Bot music command received:', data);
                if (!data || !data.music_data) {
                    console.warn('⚠️ [CHAT-BOT] Invalid bot-music-command data:', data);
                    return;
                }
                
                // Forward to music player
                if (window.musicPlayer) {
                    window.musicPlayer.processBotMusicCommand(data);
                } else {
                    console.warn('⚠️ [CHAT-BOT] Music player not available');
                }
            });
            
            console.log('🤖 [CHAT-BOT] Bot listeners set up');
        } else {
            console.log('🤖 [CHAT-BOT] Socket not ready, will retry...');
            setTimeout(() => this.setupBotListeners(), 1000);
        }
    }

    ensureBotActive() {
        this.botActive = true;
        console.log('🤖 [CHAT-BOT] Bot activated');
    }

    setChatSection(chatSection) {
        this.chatSection = chatSection;
        console.log('🤖 [CHAT-BOT] Chat section set:', chatSection?.chatType);
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
        console.log('🎵 [CHAT-BOT] Executing music command:', musicData);
        
        // Try the music player first
        if (window.musicPlayer) {
            console.log('🎵 [CHAT-BOT] Using global music player');
            try {
                await this.processWithMusicPlayer(musicData);
                return;
            } catch (error) {
                console.error('❌ [CHAT-BOT] Global music player failed:', error);
            }
        }
        
        // Fallback to voice call section music player if available
        if (window.voiceCallSection && window.voiceCallSection.musicPlayer) {
            console.log('🎵 [CHAT-BOT] Using voice call section music player');
            try {
                await window.voiceCallSection.musicPlayer.executeMusicCommand?.(musicData);
                return;
            } catch (error) {
                console.error('❌ [CHAT-BOT] Voice call music player failed:', error);
            }
        }
        
        console.error('❌ [CHAT-BOT] No music player available');
        this.updateBotParticipantStatus('❌ Music player not available');
    }

    async processWithMusicPlayer(musicData) {
        const { action, query, track } = musicData;

        switch (action) {
            case 'play':
                if (query && query.trim()) {
                    console.log('🎵 [CHAT-BOT] Searching and playing:', query);
                    const searchResult = await window.musicPlayer.searchMusic(query.trim());
                    if (searchResult && searchResult.previewUrl) {
                        const result = await window.musicPlayer.playTrack(searchResult);
                        console.log('✅ [CHAT-BOT] Successfully started playing:', searchResult.title);
                        
                        window.musicPlayer.showNowPlaying(searchResult);
                        this.updateBotParticipantStatus('🎵 Playing: ' + searchResult.title);
                    } else {
                        console.warn('⚠️ [CHAT-BOT] No playable track found for:', query);
                        this.updateBotParticipantStatus('❌ Track not found');
                    }
                } else if (track && track.previewUrl) {
                    console.log('🎵 [CHAT-BOT] Playing provided track:', track.title);
                    const result = await window.musicPlayer.playTrack(track);
                    console.log('✅ [CHAT-BOT] Successfully started playing:', track.title);
                    
                    window.musicPlayer.showNowPlaying(track);
                    this.updateBotParticipantStatus('🎵 Playing: ' + track.title);
                } else {
                    console.warn('⚠️ [CHAT-BOT] Play command missing query or track parameter');
                    this.updateBotParticipantStatus('❌ Invalid play command');
                }
                break;

            case 'queue':
                if (query && query.trim()) {
                    console.log('🎵 [CHAT-BOT] Searching and queueing:', query);
                    const result = await window.musicPlayer.addToQueue(query.trim());
                    console.log('✅ [CHAT-BOT] Queue operation result:', result);
                    this.updateBotParticipantStatus('➕ Added to queue');
                } else {
                    console.warn('⚠️ [CHAT-BOT] Queue command missing query parameter');
                    this.updateBotParticipantStatus('❌ Invalid queue command');
                }
                break;

            case 'stop':
                console.log('🎵 [CHAT-BOT] Stopping music');
                await window.musicPlayer.stop();
                window.musicPlayer.hideNowPlaying();
                this.updateBotParticipantStatus('⏹️ Music stopped');
                break;

            case 'next':
                console.log('🎵 [CHAT-BOT] Playing next track');
                await window.musicPlayer.playNext();
                this.updateBotParticipantStatus('⏭️ Next track');
                break;

            case 'prev':
                console.log('🎵 [CHAT-BOT] Playing previous track');
                await window.musicPlayer.playPrevious();
                this.updateBotParticipantStatus('⏮️ Previous track');
                break;

            default:
                console.warn('⚠️ [CHAT-BOT] Unknown music action:', action);
                this.updateBotParticipantStatus('❌ Unknown command');
        }
    }

    updateBotParticipantStatus(statusText) {
        // Update bot participant card status if visible in voice call
        const botCard = document.querySelector('[data-participant-id="bot-4"]');
        if (botCard) {
            const statusElement = botCard.querySelector('.music-status');
            if (statusElement) {
                statusElement.innerHTML = `<i class="fas fa-music mr-1"></i>${statusText}`;
                console.log('🤖 [CHAT-BOT] Updated bot participant status:', statusText);
            }
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

    // Debug function to test voice context detection and message sending
    debugSendTitiBotCommand(command = 'play test song') {
        console.log('🧪 [CHAT-BOT-DEBUG] Testing TitiBot command sending...');
        
        // Step 1: Test voice context detection
        console.log('🔍 [DEBUG] Step 1: Voice context detection');
        if (typeof window.debugTitiBotVoiceContext === 'function') {
            const voiceContext = window.debugTitiBotVoiceContext();
            console.log('Voice detection result:', voiceContext);
        }
        
        // Step 2: Test message input
        if (!this.chatSection || !this.chatSection.messageInput) {
            console.error('❌ [DEBUG] Chat section or message input not available');
            return;
        }
        
        // Step 3: Set command in input
        const fullCommand = `/titibot ${command}`;
        console.log('📝 [DEBUG] Step 2: Setting command:', fullCommand);
        this.chatSection.messageInput.value = fullCommand;
        
        // Step 4: Trigger send
        console.log('🚀 [DEBUG] Step 3: Triggering send...');
        if (this.chatSection.sendReceiveHandler?.sendMessage) {
            this.chatSection.sendReceiveHandler.sendMessage();
            console.log('✅ [DEBUG] Send triggered successfully');
        } else {
            console.error('❌ [DEBUG] Send handler not available');
        }
    }
}

// Make ChatBot available globally for non-module contexts
if (typeof window !== 'undefined') {
    window.ChatBot = ChatBot;
    
    // Add global debug function for TitiBot command testing
    window.debugSendTitiBotCommand = function(command = 'play test song') {
        if (window.chatBot && typeof window.chatBot.debugSendTitiBotCommand === 'function') {
            window.chatBot.debugSendTitiBotCommand(command);
        } else {
            console.error('❌ ChatBot not available for debugging');
        }
    };
}

// Export for module contexts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatBot;
}

export default ChatBot;