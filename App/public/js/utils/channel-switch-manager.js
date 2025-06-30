class SimpleChannelSwitcher {
    constructor() {
        if (window.simpleChannelSwitcher) {
            return window.simpleChannelSwitcher;
        }
        
        this.currentChannelId = null;
        this.currentChannelType = 'text';
        this.isLoading = false;
        this.clickHandlerSetup = false;
        this.channelClickHandler = null;
        
        window.simpleChannelSwitcher = this;
        this.init();
        
        console.log('[SimpleChannelSwitcher] Initialized');
    }
    
    init() {
        this.setupChannelClicks();
        this.initFromURL();
    }
    
    setupChannelClicks() {
        if (this.clickHandlerSetup) return;
        
        this.channelClickHandler = (e) => {
            const channelItem = e.target.closest('.channel-item');
            if (!channelItem || this.isLoading) return;
            
            if (channelItem.dataset.handledBy === 'SimpleChannelSwitcher') return;
            
            e.preventDefault();
            e.stopPropagation();
            
            const channelId = channelItem.getAttribute('data-channel-id');
            const channelType = channelItem.getAttribute('data-channel-type') || 'text';
            
            if (channelId) {
                channelItem.dataset.handledBy = 'SimpleChannelSwitcher';
                this.switchToChannel(channelId, channelType);
                setTimeout(() => {
                    delete channelItem.dataset.handledBy;
                }, 500);
            }
        };
        
        document.addEventListener('click', this.channelClickHandler);
        this.clickHandlerSetup = true;
        console.log('[SimpleChannelSwitcher] Channel click handler setup');
    }
    
    switchToChannel(channelId, channelType = 'text') {
        if (this.isLoading || this.currentChannelId === channelId) return;
        
        console.log('[SimpleChannelSwitcher] Switching to:', channelId, channelType);
        
        this.isLoading = true;
        this.currentChannelId = channelId;
        this.currentChannelType = channelType;
        
        this.updateActiveChannel(channelId);
        this.showSection(channelType);
        this.loadChannelContent(channelId, channelType);
        this.updateURL(channelId, channelType);
        
        this.isLoading = false;
    }
    
    updateActiveChannel(channelId) {
        document.querySelectorAll('.channel-item').forEach(item => {
            item.classList.remove('active-channel');
        });
        
        const activeChannel = document.querySelector(`[data-channel-id="${channelId}"]`);
        if (activeChannel) {
            activeChannel.classList.add('active-channel');
        }
    }
    
    showSection(channelType) {
        const chatSection = document.querySelector('.chat-section');
        const voiceSection = document.querySelector('.voice-section');
        
        if (channelType === 'voice') {
            if (chatSection) chatSection.style.display = 'none';
            if (voiceSection) voiceSection.style.display = 'flex';
        } else {
            if (voiceSection) voiceSection.style.display = 'none';
            if (chatSection) chatSection.style.display = 'flex';
        }
    }
    
        async loadChannelContent(channelId, channelType) {
        if (channelType === 'text') {
            await this.loadChannelData(channelId);
        }
    }

    async loadChannelData(channelId) {
        console.log('[SimpleChannelSwitcher] Loading channel data for:', channelId);
        
        if (window.chatSection && typeof window.chatSection.switchToChannel === 'function') {
            console.log('[SimpleChannelSwitcher] Using ChatSection to switch channel');
            
            try {
                await window.chatSection.switchToChannel(channelId, this.currentChannelType);
                this.updateChannelMetaTags(channelId);
                this.joinSocketRoom(channelId);
                console.log('[SimpleChannelSwitcher] Channel switch completed via ChatSection');
            } catch (error) {
                console.error('[SimpleChannelSwitcher] Error switching via ChatSection:', error);
                await this.fallbackLoadChannelData(channelId);
            }
        } else {
            console.log('[SimpleChannelSwitcher] ChatSection not available, using fallback');
            await this.fallbackLoadChannelData(channelId);
        }
    }

    async fallbackLoadChannelData(channelId) {
        const chatMessagesContainer = document.getElementById('chat-messages');
        if (!chatMessagesContainer) return;

        const messagesContainer = chatMessagesContainer.querySelector('.messages-container');
        if (messagesContainer) {
            messagesContainer.innerHTML = '<div class="flex justify-center p-4"><div class="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div></div>';
        }

        try {
            const response = await fetch(`/api/channels/${channelId}/switch?limit=50`, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    this.updateChannelHeaderFromData(data.data.channel, data.data.server);
                    this.updateChannelMetaTags(channelId, data.data.channel);
                    this.renderMessages(data.data.messages || []);
                    this.joinSocketRoom(channelId);
                } else {
                    throw new Error(data.message || 'Failed to load channel data');
                }
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('[SimpleChannelSwitcher] Error loading channel:', error);
            if (messagesContainer) {
                messagesContainer.innerHTML = '<div class="text-center p-4 text-red-400">Failed to load channel: ' + error.message + '</div>';
            }
        }
    }

    updateChannelMetaTags(channelId, channelData = null) {
        console.log('[SimpleChannelSwitcher] Updating meta tags for channel:', channelId);
        
        let channelIdMeta = document.querySelector('meta[name="channel-id"]');
        if (!channelIdMeta) {
            channelIdMeta = document.createElement('meta');
            channelIdMeta.name = 'channel-id';
            document.head.appendChild(channelIdMeta);
        }
        channelIdMeta.content = channelId;

        let chatIdMeta = document.querySelector('meta[name="chat-id"]');
        if (!chatIdMeta) {
            chatIdMeta = document.createElement('meta');
            chatIdMeta.name = 'chat-id';
            document.head.appendChild(chatIdMeta);
        }
        chatIdMeta.content = channelId;

        if (channelData && channelData.name) {
            let chatTitleMeta = document.querySelector('meta[name="chat-title"]');
            if (!chatTitleMeta) {
                chatTitleMeta = document.createElement('meta');
                chatTitleMeta.name = 'chat-title';
                document.head.appendChild(chatTitleMeta);
            }
            chatTitleMeta.content = channelData.name;
        }

        console.log('[SimpleChannelSwitcher] Meta tags updated successfully');
    }
    
    updateChannelHeaderFromData(channel, server) {
        const channelIcon = document.getElementById('channel-icon');
        const channelName = document.getElementById('channel-name');
        
        if (channelIcon && channelName && channel) {
            channelName.textContent = channel.name || 'Channel';
            
            const iconClass = this.getChannelIconClass(channel.type);
            channelIcon.className = iconClass;
            
            if (server) {
                const serverNameElement = document.querySelector('.server-name');
                if (serverNameElement) {
                    serverNameElement.textContent = server.name;
                }
            }
        }
        
        if (window.chatSection && typeof window.chatSection.updateChannelHeader === 'function') {
            window.chatSection.updateChannelHeader();
        }
    }
    
    getChannelIconClass(channelType) {
        switch(channelType) {
            case 'voice':
            case '2':
            case 2:
                return 'fas fa-volume-up text-gray-400';
            case 'announcement':
            case '4':
            case 4:
                return 'fas fa-bullhorn text-gray-400';
            case 'forum':
            case '5':
            case 5:
                return 'fas fa-comments text-gray-400';
            case 'text':
            case '1':
            case 1:
            default:
                return 'fas fa-hashtag text-gray-400';
        }
    }

    updateChannelHeader(channelId) {
        const channelIcon = document.getElementById('channel-icon');
        const channelName = document.getElementById('channel-name');
        
        const channelElement = document.querySelector(`[data-channel-id="${channelId}"]`);
        if (channelElement && channelIcon && channelName) {
            let nameText = channelElement.querySelector('.channel-name')?.textContent?.trim() ||
                          channelElement.getAttribute('data-channel-name') ||
                          'Channel';
            
            nameText = this.cleanChannelName(nameText);
            
            const iconElement = channelElement.querySelector('i.fas');
            
            channelName.textContent = nameText;
            if (iconElement) {
                channelIcon.className = iconElement.className;
            }
        }
        
        if (window.chatSection && typeof window.chatSection.updateChannelHeader === 'function') {
            window.chatSection.updateChannelHeader();
        }
    }
    
    cleanChannelName(name) {
        if (!name) return 'Channel';
        
        let cleanName = name.toString()
            .replace(/=+/g, '')
            .replace(/Edit\s*Delete?/gi, '')
            .replace(/Delete\s*Edit?/gi, '')
            .replace(/Edit/gi, '')
            .replace(/Delete/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
        
        if (!cleanName || cleanName.length === 0) {
            return 'Channel';
        }
        
        return cleanName;
    }
    
    renderMessages(messages) {
        const messagesContainer = document.querySelector('#chat-messages .messages-container');
        if (!messagesContainer) return;
        
        if (messages.length === 0) {
            messagesContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full text-[#dcddde]">
                    <i class="fas fa-comments text-6xl mb-4 text-[#4f545c]"></i>
                    <p class="text-lg">No messages yet</p>
                    <p class="text-sm text-[#a3a6aa]">Be the first to send a message!</p>
                </div>
            `;
            return;
        }
        
        const messagesHTML = messages.map(message => this.createMessageHTML(message)).join('');
        messagesContainer.innerHTML = messagesHTML;
        
        this.scrollToBottom();
    }
    
    createMessageHTML(message) {
        const avatar = message.avatar_url || '/public/assets/common/default-profile-picture.png';
        const timestamp = new Date(message.created_at).toLocaleTimeString();
        
        return `
            <div class="bubble-message-group" data-user-id="${message.user_id}" data-timestamp="${message.created_at}">
                <div class="bubble-avatar">
                    <img src="${avatar}" alt="${message.username}" onerror="this.src='/public/assets/common/default-profile-picture.png';">
                </div>
                <div class="bubble-content-wrapper">
                    <div class="bubble-header">
                        <span class="bubble-username">${message.username}</span>
                        <span class="bubble-timestamp">${timestamp}</span>
                    </div>
                    <div class="bubble-contents">
                        <div class="bubble-message-content" data-message-id="${message.id}" data-user-id="${message.user_id}">
                            <div class="bubble-message-text">${message.content}</div>
                            <div class="bubble-message-actions">
                                <button class="bubble-action-button" data-action="reply" data-message-id="${message.id}" title="Reply">
                                    <i class="fas fa-reply"></i>
                                </button>
                                <button class="bubble-action-button" data-action="react" data-message-id="${message.id}" title="Add Reaction">
                                    <i class="fas fa-smile"></i>
                                </button>
                                <button class="bubble-action-button" data-action="more" data-message-id="${message.id}" title="More Actions">
                                    <i class="fas fa-ellipsis-v"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    scrollToBottom() {
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
    
    joinSocketRoom(channelId) {
        if (window.globalSocketManager?.isReady()) {
            const roomName = `channel-${channelId}`;
            if (!window.globalSocketManager.joinedRooms?.has(roomName)) {
                window.globalSocketManager.joinChannel(channelId);
            }
        }
    }
    
    updateURL(channelId, channelType) {
        const serverId = this.getServerIdFromURL();
        const newURL = `/server/${serverId}?channel=${channelId}${channelType === 'voice' ? '&type=voice' : ''}`;
        window.history.pushState({ channelId, channelType }, '', newURL);
    }
    
    getServerIdFromURL() {
        const match = window.location.pathname.match(/\/server\/(\d+)/);
        return match ? match[1] : null;
    }
    
    initFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const channelId = urlParams.get('channel');
        const channelType = urlParams.get('type') || 'text';
        
        if (channelId) {
            setTimeout(() => {
                this.switchToChannel(channelId, channelType);
            }, 100);
        }
    }
}

window.SimpleChannelSwitcher = SimpleChannelSwitcher;

function initSimpleChannelSwitcher() {
    if (window.location.pathname.includes('/server/') && !window.simpleChannelSwitcher) {
        new SimpleChannelSwitcher();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSimpleChannelSwitcher);
} else {
    initSimpleChannelSwitcher();
}

document.addEventListener('ServerChanged', () => {
    setTimeout(initSimpleChannelSwitcher, 100);
});

window.ChannelSwitchManager = SimpleChannelSwitcher; 