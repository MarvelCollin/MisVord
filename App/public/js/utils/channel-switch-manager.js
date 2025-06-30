class SimpleChannelSwitcher {
    constructor() {
        if (window.simpleChannelSwitcher) {
            return window.simpleChannelSwitcher;
        }
        
        this.currentChannelId = null;
        this.currentChannelType = 'text';
        this.isLoading = false;
        
        window.simpleChannelSwitcher = this;
        this.init();
        
        console.log('[SimpleChannelSwitcher] Initialized');
    }
    
    init() {
        this.setupChannelClicks();
        this.initFromURL();
    }
    
    setupChannelClicks() {
        document.addEventListener('click', (e) => {
            const channelItem = e.target.closest('.channel-item');
            if (!channelItem || this.isLoading) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            const channelId = channelItem.getAttribute('data-channel-id');
            const channelType = channelItem.getAttribute('data-channel-type') || 'text';
            
            if (channelId) {
                this.switchToChannel(channelId, channelType);
            }
        });
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
            await this.loadChatMessages(channelId);
        }
    }
    
    async loadChatMessages(channelId) {
        const chatMessagesContainer = document.getElementById('chat-messages');
        if (!chatMessagesContainer) return;
        
        const messagesContainer = chatMessagesContainer.querySelector('.messages-container');
        if (messagesContainer) {
            messagesContainer.innerHTML = '<div class="flex justify-center p-4"><div class="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div></div>';
        }
        
        this.updateChannelHeader(channelId);
        
        try {
            const response = await fetch(`/api/chat/channel/${channelId}/messages?limit=50`, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            
            if (response.ok) {
                const data = await response.json();
                await this.renderMessages(data.data?.messages || []);
                this.joinSocketRoom(channelId);
            }
        } catch (error) {
            console.error('[SimpleChannelSwitcher] Error loading messages:', error);
            if (messagesContainer) {
                messagesContainer.innerHTML = '<div class="text-center p-4 text-red-400">Failed to load messages</div>';
            }
        }
    }
    
    updateChannelHeader(channelId) {
        const channelIcon = document.getElementById('channel-icon');
        const channelName = document.getElementById('channel-name');
        
        const channelElement = document.querySelector(`[data-channel-id="${channelId}"]`);
        if (channelElement && channelIcon && channelName) {
            const nameText = channelElement.querySelector('.channel-name')?.textContent || 'Channel';
            const iconElement = channelElement.querySelector('i');
            
            channelName.textContent = nameText;
            if (iconElement) {
                channelIcon.className = iconElement.className;
            }
        }
    }
    
    async renderMessages(messages) {
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
        
        const messagesHTML = [];
        for (const message of messages) {
            try {
                const html = await this.renderSingleMessage(message);
                if (html) {
                    messagesHTML.push(html);
                }
            } catch (error) {
                console.error('[SimpleChannelSwitcher] Error rendering message:', message.id, error);
                messagesHTML.push(this.createFallbackMessageHTML(message));
            }
        }
        
        messagesContainer.innerHTML = messagesHTML.join('');
        this.scrollToBottom();
    }
    
    async renderSingleMessage(message) {
        const formattedMessage = {
            id: message.id,
            user_id: message.user_id,
            username: message.username,
            avatar_url: message.avatar_url || '/public/assets/common/default-profile-picture.png',
            content: message.content || '',
            sent_at: message.created_at,
            edited_at: message.edited_at,
            message_type: 'text',
            attachments: message.attachments || [],
            reactions: message.reactions || [],
            reply_message_id: message.reply_message_id,
            reply_data: message.reply_data
        };
        
        try {
            const response = await fetch('/api/messages/render-bubble', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message_data: formattedMessage
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.html) {
                    return result.html;
                }
            }
        } catch (error) {
            console.error('[SimpleChannelSwitcher] Bubble render API error:', error);
        }
        
        return null;
    }
    
    createFallbackMessageHTML(message) {
        const avatar = message.avatar_url || '/public/assets/common/default-profile-picture.png';
        const timestamp = new Date(message.created_at).toLocaleTimeString();
        
        return `
            <div class="bubble-message-group" data-user-id="${message.user_id}" data-timestamp="${new Date(message.created_at).getTime()}">
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