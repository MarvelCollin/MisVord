class ChannelSwitchManager {
    constructor() {
        this.isLoading = false;
        this.currentChannelId = null;
        this.currentServerId = null;
        this.init();
    }

    init() {
        this.currentServerId = this.getServerIdFromURL();
        this.currentChannelId = this.getChannelIdFromURL();
        window.channelSwitchManager = this;
    }

    getServerIdFromURL() {
        const match = window.location.pathname.match(/\/server\/(\d+)/);
        return match ? match[1] : null;
    }

    getChannelIdFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('channel');
    }

    async switchToChannel(serverId, channelId, clickedElement = null) {
        if (this.isLoading || !serverId || !channelId) return;
        if (this.currentChannelId === channelId) return;

        this.isLoading = true;
        window.channelSwitching = true;

        try {
            this.updateChannelUI(clickedElement);
            this.updateURL(serverId, channelId);
            this.updateMetaTags(channelId, 'channel');
            
            await this.loadChannelContent(channelId);
            
            this.currentChannelId = channelId;
            this.currentServerId = serverId;

            this.dispatchChannelSwitchEvent(channelId, serverId);
            
        } catch (error) {
            console.error('Channel switch failed:', error);
            window.location.reload();
        } finally {
            this.isLoading = false;
            window.channelSwitching = false;
        }
    }

    updateChannelUI(clickedElement) {
        document.querySelectorAll('.channel-item').forEach(el => {
            el.classList.remove('bg-gray-700', 'text-white', 'active-channel', 'bg-discord-lighten');
        });

        if (clickedElement) {
            clickedElement.classList.add('bg-gray-700', 'text-white', 'active-channel');
        }
    }

    updateURL(serverId, channelId) {
        const newUrl = `/server/${serverId}?channel=${channelId}`;
        window.history.replaceState({ serverId, channelId }, '', newUrl);
    }

    updateMetaTags(channelId, chatType) {
        let chatIdMeta = document.querySelector('meta[name="chat-id"]');
        if (chatIdMeta) {
            chatIdMeta.content = channelId;
        } else {
            chatIdMeta = document.createElement('meta');
            chatIdMeta.name = 'chat-id';
            chatIdMeta.content = channelId;
            document.head.appendChild(chatIdMeta);
        }

        let chatTypeMeta = document.querySelector('meta[name="chat-type"]');
        if (chatTypeMeta) {
            chatTypeMeta.content = chatType;
        } else {
            chatTypeMeta = document.createElement('meta');
            chatTypeMeta.name = 'chat-type';
            chatTypeMeta.content = chatType;
            document.head.appendChild(chatTypeMeta);
        }
    }

    async loadChannelContent(channelId) {
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            chatMessages.innerHTML = `
                <div class="flex items-center justify-center h-full">
                    <div class="text-center">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                        <p class="text-gray-400">Loading messages...</p>
                    </div>
                </div>
            `;
        }

        if (window.chatSection) {
            window.chatSection.targetId = channelId;
            window.chatSection.chatType = 'channel';
            window.chatSection.processedMessageIds.clear();
            await window.chatSection.loadMessages();
        } else {
            const response = await fetch(`/api/chat/channel/${channelId}/messages`);
            const data = await response.json();
            
            if (data.success && data.data && data.data.messages) {
                this.renderMessagesFallback(data.data.messages);
            }
        }

        if (window.globalSocketManager && window.globalSocketManager.isReady()) {
            window.globalSocketManager.joinRoom('channel', channelId);
        }
    }

    renderMessagesFallback(messages) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;

        if (!messages || messages.length === 0) {
            chatMessages.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full text-gray-400">
                    <i class="fas fa-comments text-6xl mb-4 opacity-50"></i>
                    <p class="text-lg font-medium">No messages yet</p>
                    <p class="text-sm mt-2">Start the conversation!</p>
                </div>
            `;
            return;
        }

        const messagesHTML = messages.map(message => `
            <div class="message-group flex items-start p-4 hover:bg-gray-700" data-user-id="${message.user_id}">
                <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                    <span class="text-white text-sm font-bold">${(message.username || 'U').charAt(0).toUpperCase()}</span>
                </div>
                <div class="flex-1">
                    <div class="flex items-center mb-1">
                        <span class="message-username font-semibold text-white mr-2">${message.username || 'Unknown'}</span>
                        <span class="message-timestamp text-xs text-gray-400">${this.formatTimestamp(message.sent_at)}</span>
                    </div>
                    <div class="message-content text-gray-300" data-message-id="${message.id}">
                        <div class="message-main-text">${message.content}</div>
                    </div>
                </div>
            </div>
        `).join('');

        chatMessages.innerHTML = messagesHTML;
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    formatTimestamp(timestamp) {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    dispatchChannelSwitchEvent(channelId, serverId) {
        document.dispatchEvent(new CustomEvent('ChannelSwitched', { 
            detail: { channelId, serverId } 
        }));
    }

    setupChannelClickHandlers(container) {
        if (!container) return;

        const channelItems = container.querySelectorAll('.channel-item');
        channelItems.forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.channel-actions')) return;

                const channelId = item.dataset.channelId;
                const serverId = this.currentServerId || this.getServerIdFromURL();

                if (channelId && serverId) {
                    this.switchToChannel(serverId, channelId, item);
                }
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('/server/')) {
        new ChannelSwitchManager();
    }
});

export default ChannelSwitchManager; 