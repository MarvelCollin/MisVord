class ChatBot {
    constructor(chatSection) {
        this.chatSection = chatSection;
        this.initialized = false;
        this.socketListenersSetup = false;
        
        console.log('🤖 [CHAT-BOT] ChatBot component initialized');
    }

    init() {
        if (this.initialized) return;
        
        this.setupEventListeners();
        this.setupSocketListeners();
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

            io.on('titibot-command-error', (data) => {
                console.error('🤖 [TITIBOT] Command error:', data);
                if (window.showToast) {
                    window.showToast(`🤖 TitiBot error: ${data.message}`, 'error');
                }
            });

            io.on('titibot-command-success', (data) => {
                console.log('🤖 [TITIBOT] Command success:', data);
                if (window.showToast) {
                    window.showToast('🤖 TitiBot command processed', 'success');
                }
            });

            this.socketListenersSetup = true;
            console.log('🔌 [CHAT-BOT] Socket listeners setup complete');
        };

        setupBotSocketHandlers();
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

        if (!window.titiBotData || !window.titiBotData.id) {
            console.log('🤖 TitiBot data not available, attempting to fetch...');
            if (window.showToast) {
                window.showToast('🤖 Loading TitiBot data...', 'info');
            }
            
            this.fetchTitiBotData().then(() => {
                if (window.titiBotData && window.titiBotData.id) {
                    console.log('🤖 TitiBot data loaded, retrying command...');
                    this.handleTitiBotCommand(content);
                } else {
                    console.log('🤖 TitiBot not available after fetch attempt');
                    if (window.showToast) {
                        window.showToast('🤖 TitiBot is not available. Use Ctrl+9 to manage TitiBot', 'warning');
                    }
                }
            });
            return true;
        }

        const serverMembers = window.GLOBALS?.serverMembers || window.serverMembers || [];
        console.log('🔍 [CHAT-BOT] Server membership check:', {
            titiBotId: window.titiBotData.id,
            serverMembers: serverMembers,
            serverMembersCount: serverMembers.length,
            serverId: this.getServerId()
        });
        
        const isTitiBotInServer = serverMembers.some(member => member.id == window.titiBotData.id);
        
        if (!isTitiBotInServer) {
            console.log('🤖 TitiBot is not found in current server members, fetching fresh data...');
            
            const serverId = this.getServerId();
            if (serverId) {
                try {
                    const response = await fetch(`/api/servers/${serverId}/members`);
                    if (response.ok) {
                        const data = await response.json();
                        const freshMembers = data.data?.members || data.members || [];
                        console.log('🔄 [CHAT-BOT] Fresh server members:', freshMembers);
                        
                        const isTitiBotInFreshData = freshMembers.some(member => member.id == window.titiBotData.id);
                        
                        if (!isTitiBotInFreshData) {
                            console.log('🤖 TitiBot confirmed not in server after fresh check');
                            if (window.showToast) {
                                window.showToast('🤖 TitiBot is not active in this server. Use Ctrl+9 to add TitiBot to this server.', 'warning');
                            }
                            return true;
                        } else {
                            console.log('✅ TitiBot found in fresh server data, updating cache');
                            window.GLOBALS = window.GLOBALS || {};
                            window.GLOBALS.serverMembers = freshMembers;
                            window.serverMembers = freshMembers;
                        }
                    } else {
                        console.warn('Failed to fetch fresh server members:', response.status);
                    }
                } catch (error) {
                    console.error('Error fetching server members:', error);
                }
            }
            
            if (!isTitiBotInServer) {
                if (window.showToast) {
                    window.showToast('🤖 TitiBot is not active in this server', 'warning');
                }
                return true;
            }
        }

        const args = content.trim().split(/\s+/);
        const command = args[1]?.toLowerCase();
        
        if (!command) {
            if (window.showToast) {
                window.showToast('🤖 Available commands: ping', 'info');
            }
            return true;
        }

        console.log(`🤖 [TITIBOT] Processing command: ${command} in channel ${this.chatSection.targetId}`);
        
        if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {
            console.error('🤖 Socket not ready for TitiBot command');
            if (window.showToast) {
                window.showToast('🤖 Connection not ready. Please try again.', 'error');
            }
            return true;
        }

        const serverId = this.getServerId();
        
        window.globalSocketManager.io.emit('titibot-command', {
            command: command,
            channel_id: this.chatSection.targetId,
            server_id: serverId,
            user_id: this.chatSection.userId,
            username: this.chatSection.username
        });

        console.log(`🤖 [TITIBOT] Command sent to socket server: ${command}`);
        
        if (window.showToast) {
            window.showToast(`🤖 TitiBot command sent: ${command}`, 'success');
        }
        
        return true;
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
            
            if (afterSlash === '' || 'ping'.startsWith(afterSlash.toLowerCase())) {
                this.showTitiBotSuggestions(['ping']);
            } else {
                this.hideTitiBotSuggestions();
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
                this.chatSection.messageInput.value = `/titibot ${command}`;
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
            'ping': 'Test if TitiBot is online and responsive'
        };
        return descriptions[command] || 'TitiBot command';
    }

    async fetchTitiBotData() {
        try {
            console.log('🤖 [CHAT-BOT] Fetching TitiBot data from server...');
            const response = await fetch('/api/bots/check/titibot');
            
            if (!response.ok) {
                console.warn('⚠️ [CHAT-BOT] Failed to check TitiBot status:', response.status, response.statusText);
                return;
            }
            
            const data = await response.json();
            console.log('🤖 [CHAT-BOT] Server response:', data);
            
            const botExists = data.data ? (data.data.exists && data.data.is_bot) : (data.exists && data.is_bot);
            const botInfo = data.data ? data.data.bot : data.bot;
            
            if (botExists && botInfo) {
                window.titiBotData = botInfo;
                console.log('✅ [CHAT-BOT] TitiBot data loaded automatically:', botInfo);
            } else {
                console.log('⚠️ [CHAT-BOT] TitiBot not found on server or not a bot');
            }
        } catch (error) {
            console.error('❌ [CHAT-BOT] Error fetching TitiBot data:', error);
        }
    }

    cleanup() {
        this.hideTitiBotSuggestions();
        this.initialized = false;
        this.socketListenersSetup = false;
        console.log('🧹 [CHAT-BOT] ChatBot component cleaned up');
    }
}

if (typeof window !== 'undefined') {
    window.ChatBot = ChatBot;
}