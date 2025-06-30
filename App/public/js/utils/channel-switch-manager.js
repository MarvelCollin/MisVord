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
                this.renderMessages(data.data?.messages || []);
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
            <div class="bubble-message-group flex items-start p-2 hover:bg-[#2e3035]" data-user-id="${message.user_id}" data-timestamp="${message.created_at}">
                <div class="w-10 h-10 rounded-full overflow-hidden mr-3 flex-shrink-0">
                    <img src="${avatar}" alt="${message.username}" class="w-full h-full object-cover">
                </div>
                <div class="flex-1">
                    <div class="flex items-center mb-1">
                        <span class="font-semibold text-white mr-2">${message.username}</span>
                        <span class="text-xs text-[#a3a6aa]">${timestamp}</span>
                    </div>
                    <div class="message-content text-[#dcddde]" data-message-id="${message.id}">
                        ${message.content}
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