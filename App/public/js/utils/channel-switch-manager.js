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
    
    async switchToChannel(channelId, channelType = 'text') {
        if (this.isLoading || this.currentChannelId === channelId) return;
        
        console.log('[SimpleChannelSwitcher] Switching to:', channelId, channelType);
        
        this.isLoading = true;
        this.currentChannelId = channelId;
        this.currentChannelType = channelType;
        
        try {
            this.updateActiveChannel(channelId);
            this.showSection(channelType);
            
            if (channelType === 'text') {
                await this.initializeChatSection(channelId);
            }
            
            this.updateURL(channelId, channelType);
        } catch (error) {
            console.error('[SimpleChannelSwitcher] Error switching channel:', error);
        } finally {
            this.isLoading = false;
        }
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
    
    async initializeChatSection(channelId) {
        console.log('[SimpleChannelSwitcher] Initializing chat section for channel:', channelId);
        
        this.updateChannelHeader(channelId);
        
        if (window.chatSection) {
            console.log('[SimpleChannelSwitcher] Cleaning up existing chat section');
            if (typeof window.chatSection.cleanup === 'function') {
                window.chatSection.cleanup();
            }
            window.chatSection = null;
        }
        
        if (window.globalSocketManager?.isReady()) {
            console.log('[SimpleChannelSwitcher] Leaving previous socket rooms');
            const previousRooms = Array.from(window.globalSocketManager.joinedRooms || []);
            previousRooms.forEach(room => {
                if (room.startsWith('channel-')) {
                    window.globalSocketManager.leaveRoom(room);
                }
            });
        }
        
        const chatTypeMeta = document.querySelector('meta[name="chat-type"]');
        const chatIdMeta = document.querySelector('meta[name="chat-id"]');
        
        if (chatTypeMeta) chatTypeMeta.setAttribute('content', 'channel');
        if (chatIdMeta) chatIdMeta.setAttribute('content', channelId);
        
        await this.waitForChatElements();
        
        if (typeof window.initializeChatSection === 'function') {
            console.log('[SimpleChannelSwitcher] Calling initializeChatSection');
            await window.initializeChatSection();
        } else if (typeof window.ChatSection === 'function') {
            console.log('[SimpleChannelSwitcher] Creating new ChatSection instance');
            try {
                window.chatSection = new window.ChatSection({
                    chatType: 'channel',
                    targetId: channelId
                });
                await window.chatSection.init();
            } catch (error) {
                console.error('[SimpleChannelSwitcher] Error creating chat section:', error);
            }
        }
        
        setTimeout(() => {
            if (window.chatSection && window.chatSection.targetId !== channelId) {
                console.log('[SimpleChannelSwitcher] Updating chat section target ID');
                window.chatSection.targetId = channelId;
                window.chatSection.chatType = 'channel';
                window.chatSection.currentOffset = 0;
                window.chatSection.hasMoreMessages = true;
                
                if (window.chatSection.loadMessages) {
                    console.log('[SimpleChannelSwitcher] Loading messages for new channel');
                    window.chatSection.loadMessages();
                }
            }
        }, 100);
    }
    
    async waitForChatElements() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 20;
            
            const checkElements = () => {
                const chatMessages = document.getElementById('chat-messages');
                const messageForm = document.getElementById('message-form');
                const messageInput = document.getElementById('message-input');
                
                if (chatMessages && messageForm && messageInput) {
                    console.log('[SimpleChannelSwitcher] Chat elements ready');
                    resolve();
                    return;
                }
                
                attempts++;
                if (attempts >= maxAttempts) {
                    console.warn('[SimpleChannelSwitcher] Chat elements not ready after', maxAttempts, 'attempts');
                    resolve();
                    return;
                }
                
                setTimeout(checkElements, 50);
            };
            
            checkElements();
        });
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