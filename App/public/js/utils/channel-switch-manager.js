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
            const channelData = this.extractChannelData(channelId);
            
            this.updateActiveChannel(channelId);
            this.showSection(channelType);
            this.updateChannelHeader(channelData);
            this.updateMetaTags(channelData);
            
            if (channelType === 'text') {
                await this.reinitializeChatSection(channelData);
            }
            
            this.updateURL(channelId, channelType);
            
            this.dispatchChannelChangeEvent(channelData);
            
        } catch (error) {
            console.error('[SimpleChannelSwitcher] Error switching channel:', error);
        } finally {
            this.isLoading = false;
        }
    }
    
    extractChannelData(channelId) {
        const channelElement = document.querySelector(`[data-channel-id="${channelId}"]`);
        if (!channelElement) {
            console.warn('[SimpleChannelSwitcher] Channel element not found for ID:', channelId);
            return {
                id: channelId,
                name: 'Unknown Channel',
                type: 'text',
                description: '',
                server_id: this.getServerIdFromURL()
            };
        }
        
        const channelData = {
            id: channelId,
            name: channelElement.getAttribute('data-channel-name') || 'Channel',
            type: channelElement.getAttribute('data-channel-type') || 'text',
            server_id: channelElement.getAttribute('data-server-id') || this.getServerIdFromURL(),
            description: channelElement.getAttribute('data-channel-description') || ''
        };
        
        console.log('[SimpleChannelSwitcher] Extracted channel data:', channelData);
        return channelData;
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
    
    updateChannelHeader(channelData) {
        const channelIcon = document.getElementById('channel-icon');
        const channelName = document.getElementById('channel-name');
        
        if (channelIcon && channelName) {
            const iconMap = {
                'text': 'fas fa-hashtag',
                'voice': 'fas fa-volume-high',
                'announcement': 'fas fa-bullhorn',
                'forum': 'fas fa-users'
            };
            
            channelIcon.className = iconMap[channelData.type] || 'fas fa-hashtag';
            channelName.textContent = channelData.name;
            
            const chatTitle = channelData.type === 'voice' ? channelData.name : `# ${channelData.name}`;
            document.title = `${chatTitle} - MisVord`;
            
            console.log('[SimpleChannelSwitcher] Updated channel header:', {
                name: channelData.name,
                type: channelData.type,
                icon: channelIcon.className
            });
        }
    }
    
    updateMetaTags(channelData) {
        const chatTypeMeta = document.querySelector('meta[name="chat-type"]');
        const chatIdMeta = document.querySelector('meta[name="chat-id"]');
        const channelIdMeta = document.querySelector('meta[name="channel-id"]');
        const chatTitleMeta = document.querySelector('meta[name="chat-title"]');
        const chatPlaceholderMeta = document.querySelector('meta[name="chat-placeholder"]');
        
        if (chatTypeMeta) chatTypeMeta.setAttribute('content', 'channel');
        if (chatIdMeta) chatIdMeta.setAttribute('content', channelData.id);
        if (channelIdMeta) channelIdMeta.setAttribute('content', channelData.id);
        if (chatTitleMeta) chatTitleMeta.setAttribute('content', channelData.name);
        
        const placeholder = `Message #${channelData.name}`;
        if (chatPlaceholderMeta) chatPlaceholderMeta.setAttribute('content', placeholder);
        
        const messageInput = document.getElementById('message-input');
        if (messageInput) {
            messageInput.setAttribute('placeholder', placeholder);
        }
        
        console.log('[SimpleChannelSwitcher] Updated meta tags for channel:', channelData.name);
    }
    
    async reinitializeChatSection(channelData) {
        console.log('[SimpleChannelSwitcher] Reinitializing chat section for channel:', channelData.id);
        
        await this.cleanupChatSection();
        await this.cleanupSocketRooms();
        this.removeExistingLoadMoreButtons();
        
        await this.waitForChatElements();
        
        await this.initializeNewChatSection(channelData);
    }
    
    async cleanupChatSection() {
        if (window.chatSection) {
            console.log('[SimpleChannelSwitcher] Cleaning up existing chat section');
            if (typeof window.chatSection.cleanup === 'function') {
                window.chatSection.cleanup();
            }
            window.chatSection = null;
        }
    }
    
    async cleanupSocketRooms() {
        if (window.globalSocketManager?.isReady()) {
            console.log('[SimpleChannelSwitcher] Leaving previous socket rooms');
            const previousRooms = Array.from(window.globalSocketManager.joinedRooms || []);
            previousRooms.forEach(room => {
                if (room.startsWith('channel-')) {
                    window.globalSocketManager.leaveRoom(room);
                }
            });
        }
    }
    
    removeExistingLoadMoreButtons() {
        const existingButtons = document.querySelectorAll('#load-more-messages, .load-more-messages');
        existingButtons.forEach(button => {
            console.log('[SimpleChannelSwitcher] Removing existing load more button');
            button.remove();
        });
    }
    
    async initializeNewChatSection(channelData) {
        if (typeof window.initializeChatSection === 'function') {
            console.log('[SimpleChannelSwitcher] Calling global initializeChatSection');
            await window.initializeChatSection();
        } else if (typeof window.ChatSection === 'function') {
            console.log('[SimpleChannelSwitcher] Creating new ChatSection instance');
            try {
                window.chatSection = new window.ChatSection({
                    chatType: 'channel',
                    targetId: channelData.id,
                    channelData: channelData
                });
                await window.chatSection.init();
            } catch (error) {
                console.error('[SimpleChannelSwitcher] Error creating chat section:', error);
            }
        }
        
        setTimeout(() => {
            if (window.chatSection && window.chatSection.targetId !== channelData.id) {
                console.log('[SimpleChannelSwitcher] Updating chat section properties');
                window.chatSection.targetId = channelData.id;
                window.chatSection.chatType = 'channel';
                window.chatSection.currentOffset = 0;
                window.chatSection.hasMoreMessages = true;
                
                if (window.chatSection.removeExistingLoadMoreButtons) {
                    window.chatSection.removeExistingLoadMoreButtons();
                }
                
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
    
    dispatchChannelChangeEvent(channelData) {
        const event = new CustomEvent('channelChanged', {
            detail: {
                channelId: channelData.id,
                channelData: channelData,
                channelType: channelData.type,
                timestamp: Date.now()
            }
        });
        document.dispatchEvent(event);
        console.log('[SimpleChannelSwitcher] Dispatched channelChanged event');
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