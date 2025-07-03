class SimpleDMSwitcher {
    constructor() {
        if (window.simpleDMSwitcher) {
            return window.simpleDMSwitcher;
        }
        
        this.currentDMId = null;
        this.currentDMType = 'direct';
        this.isLoading = false;
        
        window.simpleDMSwitcher = this;
        this.init();
    }
    
    init() {
        this.setupDMClicks();
        this.setupFriendsClick();
        this.initFromURL();
        this.highlightInitialActiveDM();
    }
    
    setupDMClicks() {
        document.addEventListener('click', (e) => {
            const dmItem = e.target.closest('.dm-friend-item');
            if (!dmItem) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            const chatRoomId = dmItem.getAttribute('data-chat-room-id');
            const roomType = dmItem.getAttribute('data-room-type') || 'direct';
            const username = dmItem.getAttribute('data-username') || 'Chat';
            
            if (chatRoomId) {
                this.switchToDM(chatRoomId, roomType, username);
            }
        });
    }
    
    setupFriendsClick() {
        document.addEventListener('click', (e) => {
            const friendsLink = e.target.closest('a[href*="/home/friends"]');
            if (!friendsLink) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            this.switchToFriends();
        });
    }
    
    initFromURL() {
        const currentPath = window.location.pathname;
        const dmMatch = currentPath.match(/\/home\/channels\/dm\/(\d+)/);
        
        if (dmMatch) {
            const dmId = dmMatch[1];
            this.currentDMId = dmId;
            this.highlightActiveDM(dmId);
        }
    }
    
    highlightInitialActiveDM() {
        const currentPath = window.location.pathname;
        const dmMatch = currentPath.match(/\/home\/channels\/dm\/(\d+)/);
        
        if (dmMatch) {
            const dmId = dmMatch[1];
            console.log('🎯 [DM-SWITCH] Highlighting initial active DM:', dmId);
            this.highlightActiveDM(dmId);
        }
    }
    
    async switchToDM(dmId, roomType = 'direct', username = 'Chat') {
        if (this.isLoading) return;
        
        this.isLoading = true;
        
        console.log('🔄 [DM-SWITCH] Switching to DM:', dmId, roomType, username);
        
        this.currentDMId = dmId;
        this.currentDMType = roomType;
        
        this.highlightActiveDM(dmId);
        this.updateURL(dmId);
        this.updateMetaTags(dmId, roomType);
        this.updatePageTitle(username, roomType);
        
        if (window.chatSection && typeof window.chatSection.switchToDM === 'function') {
            console.log('🔄 [DM-SWITCH] Using SPA navigation via ChatSection');
            try {
                await window.chatSection.switchToDM(dmId, roomType, true);
                console.log('✅ [DM-SWITCH] SPA navigation completed');
                this.isLoading = false;
                return;
            } catch (error) {
                console.error('❌ [DM-SWITCH] SPA navigation failed, falling back to page reload:', error);
            }
        } else if (typeof window.initializeChatSection === 'function') {
            console.log('🔄 [DM-SWITCH] ChatSection not ready, trying to initialize...');
            try {
                await window.initializeChatSection();
                if (window.chatSection && typeof window.chatSection.switchToDM === 'function') {
                    await window.chatSection.switchToDM(dmId, roomType, true);
                    console.log('✅ [DM-SWITCH] SPA navigation completed after initialization');
                    this.isLoading = false;
                    return;
                } else {
                    throw new Error('ChatSection still not available after initialization');
                }
            } catch (error) {
                console.error('❌ [DM-SWITCH] Initialization failed, falling back to page reload:', error);
            }
        }
        
        console.log('🔄 [DM-SWITCH] Falling back to page navigation');
        window.location.href = `/home/channels/dm/${dmId}`;
        this.isLoading = false;
    }
    
    async switchToFriends() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        
        console.log('🔄 [DM-SWITCH] Switching to friends');
        
        this.clearActiveDM();
        this.updateFriendsURL();
        this.updateMetaTags(null, 'friends');
        this.updatePageTitle('Friends', 'friends');
        
        console.log('🔄 [DM-SWITCH] Navigating to friends URL...');
        
        window.location.href = '/home/friends?tab=online';
        
        this.isLoading = false;
    }
    
    highlightActiveDM(dmId) {
        console.log('🎯 [DM-SWITCH] Highlighting active DM:', dmId);
        
        document.querySelectorAll('.dm-friend-item').forEach(item => {
            item.classList.remove('bg-discord-light');
            item.classList.add('hover:bg-discord-light');
        });
        
        const targetDM = document.querySelector(`[data-chat-room-id="${dmId}"]`);
        if (targetDM) {
            targetDM.classList.add('bg-discord-light');
            targetDM.classList.remove('hover:bg-discord-light');
            
            console.log('✅ [DM-SWITCH] Active DM highlighted:', dmId, targetDM);
        } else {
            console.warn('⚠️ [DM-SWITCH] Target DM not found for ID:', dmId);
        }
    }
    
    clearActiveDM() {
        console.log('🧹 [DM-SWITCH] Clearing active DM');
        
        this.currentDMId = null;
        
        document.querySelectorAll('.dm-friend-item').forEach(item => {
            item.classList.remove('bg-discord-light');
            item.classList.add('hover:bg-discord-light');
        });
    }
    
    updateURL(dmId) {
        const url = `/home/channels/dm/${dmId}`;
        console.log('🔗 [DM-SWITCH] Updating URL to:', url);
        if (window.history && window.history.pushState) {
            window.history.pushState({ dmId: dmId, type: 'dm' }, '', url);
        }
    }
    
    updateFriendsURL() {
        const url = '/home/friends?tab=online';
        console.log('🔗 [DM-SWITCH] Updating URL to:', url);
        if (window.history && window.history.pushState) {
            window.history.pushState({ type: 'friends' }, '', url);
        }
    }
    
    updateMetaTags(dmId, type) {
        let metaChatId = document.querySelector('meta[name="chat-id"]');
        let metaChatType = document.querySelector('meta[name="chat-type"]');
        let metaChannelId = document.querySelector('meta[name="channel-id"]');
        
        if (!metaChatId) {
            metaChatId = document.createElement('meta');
            metaChatId.name = 'chat-id';
            document.head.appendChild(metaChatId);
        }
        
        if (!metaChatType) {
            metaChatType = document.createElement('meta');
            metaChatType.name = 'chat-type';
            document.head.appendChild(metaChatType);
        }
        
        if (!metaChannelId) {
            metaChannelId = document.createElement('meta');
            metaChannelId.name = 'channel-id';
            document.head.appendChild(metaChannelId);
        }
        
        if (type === 'friends') {
            metaChatId.content = '';
            metaChatType.content = 'friends';
            metaChannelId.content = '';
        } else {
            metaChatId.content = dmId;
            metaChatType.content = 'direct';
            metaChannelId.content = dmId;
        }
        
        console.log('✅ [DM-SWITCH] Meta tags updated:', {
            chatId: metaChatId.content,
            chatType: metaChatType.content,
            channelId: metaChannelId.content
        });
    }
    
    updatePageTitle(name, type) {
        const title = type === 'friends' ? 'misvord - Friends' : `misvord - ${name}`;
        document.title = title;
        console.log('✅ [DM-SWITCH] Page title updated:', title);
    }
    
    getCurrentDMId() {
        return this.currentDMId;
    }
    
    getCurrentDMType() {
        return this.currentDMType;
    }
}

if (typeof window !== 'undefined') {
    window.SimpleDMSwitcher = SimpleDMSwitcher;
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            new SimpleDMSwitcher();
        });
    } else {
        new SimpleDMSwitcher();
    }
}

export default SimpleDMSwitcher; 