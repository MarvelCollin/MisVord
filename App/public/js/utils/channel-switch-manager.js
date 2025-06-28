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
        console.log(`🎯 CHANNEL SWITCH: Server ${serverId} → Channel ${channelId}`);
        console.log(`   Current state: Server ${this.currentServerId} → Channel ${this.currentChannelId}`);
        
        if (this.isLoading || !serverId || !channelId) {
            console.log(`⏹️ Switch cancelled: loading=${this.isLoading}, serverId=${serverId}, channelId=${channelId}`);
            return;
        }
        
        if (this.currentChannelId === channelId && this.currentServerId === serverId) {
            console.log(`⏹️ Already on server ${serverId}, channel ${channelId}`);
            return;
        }

        this.isLoading = true;
        window.channelSwitching = true;

        console.log(`🔄 Starting channel switch process...`);

        try {
            console.log(`1️⃣ Updating UI...`);
            this.updateChannelUI(clickedElement);
            
            console.log(`2️⃣ Updating URL...`);
            this.updateURL(serverId, channelId);
            
            console.log(`3️⃣ Updating meta tags...`);
            this.updateMetaTags(channelId, 'channel');
            
            console.log(`4️⃣ Loading channel content...`);
            await this.loadChannelContent(channelId);
            
            console.log(`5️⃣ Updating state...`);
            this.currentChannelId = channelId;
            this.currentServerId = serverId;

            console.log(`6️⃣ Dispatching event...`);
            this.dispatchChannelSwitchEvent(channelId, serverId);
            
            console.log(`✅ CHANNEL SWITCH COMPLETE: ${serverId} → ${channelId}`);
            
        } catch (error) {
            console.error(`❌ CHANNEL SWITCH FAILED:`, error);
            console.error(`   Server: ${serverId}, Channel: ${channelId}`);
            console.error(`   Error details:`, error.stack);
            window.location.reload();
        } finally {
            this.isLoading = false;
            window.channelSwitching = false;
            console.log(`🔓 Channel switch locks released`);
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
        console.log(`🔄 Loading content for channel ${channelId}`);
        
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
            console.log(`📱 Using ChatSection for channel ${channelId}`);
            console.log(`   Current targetId: ${window.chatSection.targetId}`);
            console.log(`   Current chatType: ${window.chatSection.chatType}`);
            
            window.chatSection.targetId = channelId;
            window.chatSection.chatType = 'channel';
            window.chatSection.processedMessageIds.clear();
            
            console.log(`   Updated targetId: ${window.chatSection.targetId}`);
            console.log(`   Updated chatType: ${window.chatSection.chatType}`);
            
            try {
                await window.chatSection.loadMessages();
                console.log(`✅ ChatSection loaded messages for channel ${channelId}`);
            } catch (error) {
                console.error(`❌ ChatSection failed to load messages:`, error);
                throw error;
            }
        } else {
            console.log(`🔄 Using fallback API for channel ${channelId}`);
            
            try {
                const response = await fetch(`/api/chat/channel/${channelId}/messages`);
                console.log(`📡 API Response status: ${response.status}`);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                console.log(`📦 API Response data:`, data);
                
                if (data.success && data.data && data.data.messages) {
                    console.log(`✅ Got ${data.data.messages.length} messages from API`);
                    this.renderMessagesFallback(data.data.messages);
                } else {
                    console.warn(`⚠️ API returned no messages or invalid format:`, data);
                    this.renderMessagesFallback([]);
                }
            } catch (error) {
                console.error(`❌ Fallback API failed:`, error);
                throw error;
            }
        }

        if (window.globalSocketManager && window.globalSocketManager.isReady()) {
            console.log(`🔌 Joining socket room for channel ${channelId}`);
            window.globalSocketManager.joinRoom('channel', channelId);
        } else {
            console.warn(`⚠️ Socket manager not ready`);
        }
        
        console.log(`🎉 Channel ${channelId} content loading complete`);
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