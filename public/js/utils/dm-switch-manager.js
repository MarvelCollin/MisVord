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

    
    showChatSection() {
        const chatSection  = document.querySelector('.chat-section');
        const voiceSection = document.querySelector('.voice-section');

        if (voiceSection) {
            voiceSection.classList.add('hidden');
            voiceSection.style.display = 'none';
        }
        if (chatSection) {
            chatSection.classList.remove('hidden');
            chatSection.style.display = 'flex';
            chatSection.setAttribute('data-channel-id', this.currentDMId || '');
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
            this.currentDMId = dmId;
            this.highlightActiveDM(dmId);
            this.showChatSection();
        }
    }
    
    async switchToDM(dmId, roomType = 'direct', username = 'Chat') {
        if (this.isLoading) return;
        
        this.isLoading = true;
        
        window.location.href = `/home/channels/dm/${dmId}`;
    }
    
    async switchToFriends() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        
        window.location.href = '/home/friends?tab=online';
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
        this.currentDMId = null;
        
        document.querySelectorAll('.dm-friend-item').forEach(item => {
            item.classList.remove('bg-discord-light');
            item.classList.add('hover:bg-discord-light');
        });
        this.showChatSection();
    }
    
    updateMetaTags() {
        // No longer needed since we use page reloads
        // This stub prevents errors from cached code
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