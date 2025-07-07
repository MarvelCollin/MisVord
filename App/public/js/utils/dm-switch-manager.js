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

    /**
     * Ensure the correct main section is displayed for DM views.
     * Mirrors the behaviour in SimpleChannelSwitcher.showSection()
     * so that the chat pane is visible and any voice pane is hidden.
     */
    showChatSection() {
        const chatSection  = document.querySelector('.chat-section');
        const voiceSection = document.querySelector('.voice-section');

        console.log('🔍 [DM-SWITCH] showChatSection called:', {
            chatSectionFound: !!chatSection,
            voiceSectionFound: !!voiceSection,
            currentDMId: this.currentDMId
        });

        if (voiceSection) {
            voiceSection.classList.add('hidden');
            voiceSection.style.display = 'none';
        }
        if (chatSection) {
            chatSection.classList.remove('hidden');
            chatSection.style.display = 'flex';
            chatSection.setAttribute('data-channel-id', this.currentDMId || '');
            
            // Force visibility by adding a specific class
            chatSection.classList.add('dm-chat-visible');
            
            console.log('✅ [DM-SWITCH] Chat section visibility updated:', {
                hasHiddenClass: chatSection.classList.contains('hidden'),
                display: chatSection.style.display,
                classList: Array.from(chatSection.classList)
            });
        }
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
            this.showChatSection();
        }
    }
    
    highlightInitialActiveDM() {
        const currentPath = window.location.pathname;
        const dmMatch = currentPath.match(/\/home\/channels\/dm\/(\d+)/);
        
        if (dmMatch) {
            const dmId = dmMatch[1];

            this.highlightActiveDM(dmId);
            this.showChatSection();
        }
    }
    
    async switchToDM(dmId, roomType = 'direct', username = 'Chat') {
        if (this.isLoading) return;
        
        this.isLoading = true;
        
        console.log('🔄 [DM-SWITCH] Switching to DM:', {
            dmId,
            roomType,
            username,
            previousDmId: this.currentDMId
        });
        
        this.currentDMId = dmId;
        this.currentDMType = roomType;
        
        this.highlightActiveDM(dmId);
        this.updateURL(dmId);
        this.updateMetaTags(dmId, roomType);
        this.updatePageTitle(username, roomType);
        this.showChatSection();
        
        if (window.chatSection && typeof window.chatSection.switchToDM === 'function') {

            try {
                await window.chatSection.switchToDM(dmId, roomType, true);

                this.isLoading = false;
                return;
            } catch (error) {
                console.error('❌ [DM-SWITCH] SPA navigation failed, falling back to page reload:', error);
            }
        } else if (typeof window.initializeChatSection === 'function') {

            try {
                await window.initializeChatSection();
                if (window.chatSection && typeof window.chatSection.switchToDM === 'function') {
                    await window.chatSection.switchToDM(dmId, roomType, true);

                    this.isLoading = false;
                    return;
                } else {
                    throw new Error('ChatSection still not available after initialization');
                }
            } catch (error) {
                console.error('❌ [DM-SWITCH] Initialization failed, falling back to page reload:', error);
            }
        }
        

        window.location.href = `/home/channels/dm/${dmId}`;
        this.isLoading = false;
    }
    
    async switchToFriends() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        

        
        this.clearActiveDM();
        this.updateFriendsURL();
        this.updateMetaTags(null, 'friends');
        this.updatePageTitle('Friends', 'friends');
        

        
        window.location.href = '/home/friends?tab=online';
        
        this.isLoading = false;
    }
    
    highlightActiveDM(dmId) {

        
        document.querySelectorAll('.dm-friend-item').forEach(item => {
            item.classList.remove('bg-discord-light');
            item.classList.add('hover:bg-discord-light');
        });
        
        const targetDM = document.querySelector(`[data-chat-room-id="${dmId}"]`);
        if (targetDM) {
            targetDM.classList.add('bg-discord-light');
            targetDM.classList.remove('hover:bg-discord-light');
            

        } else {
            console.warn('⚠️ [DM-SWITCH] Target DM not found for ID:', dmId);
        }
    }
    
    clearActiveDM() {
        console.log('🔍 [DM-SWITCH] clearActiveDM called');
        
        this.currentDMId = null;
        
        document.querySelectorAll('.dm-friend-item').forEach(item => {
            item.classList.remove('bg-discord-light');
            item.classList.add('hover:bg-discord-light');
        });
        
        // Ensure chat section is visible when clearing active DM
        this.showChatSection();
        
        // Additional check to ensure chat section visibility
        const chatSection = document.querySelector('.chat-section');
        if (chatSection) {
            chatSection.classList.add('dm-chat-visible');
            console.log('✅ [DM-SWITCH] Added dm-chat-visible class in clearActiveDM');
        }
    }
    
    updateURL(dmId) {
        const url = `/home/channels/dm/${dmId}`;

        if (window.history && window.history.pushState) {
            window.history.pushState({ dmId: dmId, type: 'dm' }, '', url);
        }
    }
    
    updateFriendsURL() {
        const url = '/home/friends?tab=online';

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