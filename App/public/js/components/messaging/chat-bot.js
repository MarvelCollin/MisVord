class ChatBot {
    constructor() {
        this.chatSection = null;
        this.botActive = false;
        this.setupBotListeners();
        this.ensureBotActive();

    }

    setupBotListeners() {
        if (window.globalSocketManager?.io) {
            const io = window.globalSocketManager.io;
            
            io.on('new-channel-message', (data) => {
                if (data.is_bot && data.bot_id) {

                }
            });
            

            io.on('bot-music-command', (data) => {
                if (!data || !data.music_data) return;

                if (window.musicPlayer) {
                    window.musicPlayer.processBotMusicCommand(data);
                }
            });
            

        } else {
            setTimeout(() => this.setupBotListeners(), 500);
        }
    }

    ensureBotActive() {
        this.botActive = true;

    }

    setChatSection(chatSection) {
        this.chatSection = chatSection;

    }

    async handleTitiBotCommand(content) {
        if (!content.startsWith('/titibot ')) {
            return false;
        }

        if (this.chatSection.chatType !== 'channel') {

            return true;
        }


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
            const allCommands = ['ping', 'help', 'play', 'stop', 'next', 'prev', 'queue', 'list'];
            
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
            'stop': 'Stop the currently playing music and leave voice channel',
            'next': 'Play the next song in the queue',
            'prev': 'Play the previous song in the queue',
            'queue': 'Add a song to the music queue (e.g., /titibot queue bohemian rhapsody)',
            'list': 'Show the current music queue list'
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
        if (window.musicPlayer) {
            try {
                await this.processWithMusicPlayer(musicData);
                return;
            } catch (error) {
                console.error('❌ [CHAT-BOT] Global music player failed:', error);
            }
        }
        

        if (window.voiceCallSection && window.voiceCallSection.musicPlayer) {
            try {
                await window.voiceCallSection.musicPlayer.executeMusicCommand?.(musicData);
                return;
            } catch (error) {
                console.error('❌ [CHAT-BOT] Voice call music player failed:', error);
            }
        }
        
        this.updateBotParticipantStatus('❌ Music player not available');
    }

    async processWithMusicPlayer(musicData) {
        const { action, query, track } = musicData;

        switch (action) {
            case 'play':
                if (query && query.trim()) {
                    const searchResult = await window.musicPlayer.searchMusic(query.trim());
                    if (searchResult && searchResult.previewUrl) {
                        const result = await window.musicPlayer.playTrack(searchResult);
                        window.musicPlayer.showNowPlaying(searchResult);
                        this.updateBotParticipantStatus('🎵 Playing: ' + searchResult.title);
                    } else {
                        this.updateBotParticipantStatus('❌ Track not found');
                    }
                } else if (track && track.previewUrl) {
                    const result = await window.musicPlayer.playTrack(track);
                    window.musicPlayer.showNowPlaying(track);
                    this.updateBotParticipantStatus('🎵 Playing: ' + track.title);
                } else {
                    this.updateBotParticipantStatus('❌ Invalid play command');
                }
                break;

            case 'queue':
                if (query && query.trim()) {
                    const result = await window.musicPlayer.addToQueue(query.trim());
                    this.updateBotParticipantStatus('➕ Added to queue');
                } else {
                    this.updateBotParticipantStatus('❌ Invalid queue command');
                }
                break;

            case 'stop':
                await window.musicPlayer.stop();
                window.musicPlayer.hideNowPlaying();
                this.updateBotParticipantStatus('⏹️ Music stopped');
                break;

            case 'next':
                await window.musicPlayer.playNext();
                this.updateBotParticipantStatus('⏭️ Next track');
                break;

            case 'prev':
                await window.musicPlayer.playPrevious();
                this.updateBotParticipantStatus('⏮️ Previous track');
                break;

            case 'list':
                this.updateBotParticipantStatus('📋 Queue list displayed in chat');
                break;

            default:
                this.updateBotParticipantStatus('❌ Unknown command');
        }
    }

    updateBotParticipantStatus(statusText) {
        if (window.voiceCallSection && typeof window.voiceCallSection.updateBotParticipantStatus === 'function') {
            const titiBotId = this.titiBotId || '4';
            window.voiceCallSection.updateBotParticipantStatus(titiBotId, statusText);
        }
    }

    cleanup() {
        this.hideTitiBotSuggestions();
        this.initialized = false;
        this.socketListenersSetup = false;

    }

    ensureBotActive() {
        if (this.botReady) return;

        if (!window.globalSocketManager?.isReady()) {
            setTimeout(() => this.ensureBotActive(), 250);
            return;
        }

        if (window.BotComponent && !window.BotComponent.isInitialized()) {
            window.BotComponent.init();
        }

        const titiBotUsername = 'titibot';

        if (!this.titiBotId) {
            fetch(`/api/bots/public-check/${titiBotUsername}`)
                .then(res => res.ok ? res.json() : null)
                .then(json => {
                    if (json && json.success && json.is_bot && json.bot && json.bot.id) {
                        this.titiBotId = json.bot.id.toString();
                    }
                })
                .catch(e => {});
        }

        const titiBotId = this.titiBotId || '4';

        if (!window.BotComponent.getBotStatus(titiBotId)) {
            window.globalSocketManager.io.emit('bot-init', {
                bot_id: titiBotId,
                username: titiBotUsername
            });
        }

        this.botReady = true;
    }


    debugSendTitiBotCommand(command = 'play test song') {

        


        if (typeof window.debugTitiBotVoiceContext === 'function') {
            const voiceContext = window.debugTitiBotVoiceContext();

        }
        

        if (!this.chatSection || !this.chatSection.messageInput) {
            console.error('❌ [DEBUG] Chat section or message input not available');
            return;
        }
        

        const fullCommand = `/titibot ${command}`;

        this.chatSection.messageInput.value = fullCommand;
        


        if (this.chatSection.sendReceiveHandler?.sendMessage) {
            this.chatSection.sendReceiveHandler.sendMessage();

        } else {
            console.error('❌ [DEBUG] Send handler not available');
        }
    }
}


if (typeof window !== 'undefined') {
    window.ChatBot = ChatBot;
    

    window.debugSendTitiBotCommand = function(command = 'play test song') {
        if (window.chatBot && typeof window.chatBot.debugSendTitiBotCommand === 'function') {
            window.chatBot.debugSendTitiBotCommand(command);
        } else {
            console.error('❌ ChatBot not available for debugging');
        }
    };
}


if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatBot;
}

export default ChatBot;