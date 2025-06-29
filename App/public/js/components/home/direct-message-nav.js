class DirectMessageNavigation {
    constructor() {
        this.activeDmId = null;
        this.init();
    }

    init() {
        console.log('[DM Navigation] Initializing direct message navigation');
        this.bindFriendsLinkEvent();
        this.bindDmItemEvents();
        this.bindNewDmEvent();
        this.setInitialState();
    }

    bindFriendsLinkEvent() {
        console.log('[DM Navigation] Binding friends link event');
        
        document.addEventListener('click', (e) => {
            const friendsLink = e.target.closest('a[href="/home/friends?tab=online"]') ||
                               e.target.closest('a[href*="/home/friends"]');
            
            if (friendsLink && friendsLink.getAttribute('href')?.includes('/home/friends')) {
                console.log('[DM Navigation] Friends link clicked');
                e.preventDefault();
                e.stopPropagation();
                
                this.switchToFriends();
                return false;
            }
        });
    }

    bindDmItemEvents() {
        console.log('[DM Navigation] Binding DM item events');
        
        document.addEventListener('click', (e) => {
            const dmItem = e.target.closest('.dm-friend-item');
            if (dmItem) {
                console.log('[DM Navigation] DM item clicked');
                e.preventDefault();
                e.stopPropagation();
                
                const chatRoomId = dmItem.dataset.chatRoomId;
                const friendId = dmItem.dataset.friendId;
                const username = dmItem.dataset.username;
                
                if (chatRoomId) {
                    this.switchToDirectMessage(chatRoomId, username);
                } else if (friendId) {
                    this.createAndSwitchToDirectMessage(friendId, username);
                }
                return false;
            }
        });
    }

    bindNewDmEvent() {
        const newDmBtn = document.getElementById('new-direct-message-btn');
        if (newDmBtn) {
            console.log('[DM Navigation] Binding new DM button');
            newDmBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openNewDirectMessageModal();
            });
        }
    }

    setInitialState() {
        const currentPath = window.location.pathname;
        const dmMatch = currentPath.match(/\/home\/channels\/dm\/(\d+)/);
        
        if (dmMatch) {
            const dmId = dmMatch[1];
            console.log('[DM Navigation] Initial DM detected:', dmId);
            this.activeDmId = dmId;
            this.updateActiveDmDisplay();
        } else {
            console.log('[DM Navigation] No initial DM detected');
        }
    }

    switchToFriends() {
        console.log('[DM Navigation] Switching to friends tab');
        
        this.clearActiveDm();
        
        if (window.friendsTabManager) {
            window.friendsTabManager.switchTab('online');
        } else {
            this.showFriendsContent();
        }
        
        history.replaceState(
            { pageType: 'home', contentType: 'friends' }, 
            'misvord - Friends', 
            '/home/friends?tab=online'
        );
    }

    switchToDirectMessage(dmId, username) {
        console.log('[DM Navigation] Switching to DM:', { dmId, username });
        
        this.activeDmId = dmId;
        this.updateActiveDmDisplay();
        this.loadDirectMessageContent(dmId, username);
        
        history.pushState(
            { pageType: 'home', contentType: 'dm', dmId: dmId }, 
            `misvord - ${username}`, 
            `/home/channels/dm/${dmId}`
        );
    }

    createAndSwitchToDirectMessage(friendId, username) {
        console.log('[DM Navigation] Creating new DM with friend:', { friendId, username });
        
        if (!window.ajax) {
            console.error('[DM Navigation] Ajax function not available');
            return;
        }

        window.ajax({
            url: '/api/chat/create',
            method: 'POST',
            dataType: 'json',
            data: JSON.stringify({ user_id: friendId }),
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            success: (response) => {
                console.log('[DM Navigation] DM created successfully:', response);
                if (response.success && response.data && response.data.channel_id) {
                    this.switchToDirectMessage(response.data.channel_id, username);
                } else {
                    console.error('[DM Navigation] Failed to create DM:', response.message);
                    if (window.showToast) {
                        window.showToast('Failed to create conversation: ' + (response.message || 'Unknown error'), 'error');
                    }
                }
            },
            error: (xhr, status, error) => {
                console.error('[DM Navigation] Error creating DM:', error);
                if (window.showToast) {
                    window.showToast('Error creating conversation. Please try again.', 'error');
                }
            }
        });
    }

    loadDirectMessageContent(dmId, username) {
        console.log('[DM Navigation] Loading DM content for:', dmId);
        
        const mainContent = document.querySelector('#main-content');
        if (!mainContent) {
            console.error('[DM Navigation] Main content container not found');
            return;
        }
        
        this.showLoadingState(mainContent);
        
        if (!window.ajax) {
            console.error('[DM Navigation] Ajax function not available');
            return;
        }

        window.ajax({
            url: `/api/chat/render/dm/${dmId}`,
            method: 'GET',
            dataType: 'text',
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
            success: (response) => {
                console.log('[DM Navigation] DM content loaded successfully');
                this.updateMainContentForDm(response, username);
            },
            error: (xhr, status, error) => {
                console.error('[DM Navigation] Error loading DM content:', error);
                this.showErrorState(mainContent, 'Failed to load conversation');
            }
        });
    }

    updateMainContentForDm(html, username) {
        const mainContent = document.querySelector('#main-content');
        if (!mainContent) return;
        
        console.log('[DM Navigation] Updating main content for DM');
        
        mainContent.innerHTML = `
            <div class="chat-section">
                ${html}
            </div>
        `;
        
        this.hideFriendsContent();
        
        if (typeof window.initializeChatSection === 'function') {
            window.initializeChatSection();
        }
    }

    showFriendsContent() {
        console.log('[DM Navigation] Showing friends content');
        
        const friendsContainer = document.querySelector('.flex-1.bg-discord-background.flex.flex-col');
        if (friendsContainer) {
            friendsContainer.style.display = 'flex';
        }
        
        const chatSection = document.querySelector('.chat-section');
        if (chatSection) {
            chatSection.style.display = 'none';
        }
    }

    hideFriendsContent() {
        console.log('[DM Navigation] Hiding friends content');
        
        const friendsContainer = document.querySelector('.flex-1.bg-discord-background.flex.flex-col');
        if (friendsContainer) {
            friendsContainer.style.display = 'none';
        }
    }

    updateActiveDmDisplay() {
        console.log('[DM Navigation] Updating active DM display');
        
        document.querySelectorAll('.dm-friend-item').forEach(item => {
            const itemDmId = item.dataset.chatRoomId;
            if (itemDmId === this.activeDmId) {
                item.classList.add('bg-discord-light');
                item.classList.remove('hover:bg-discord-light');
            } else {
                item.classList.remove('bg-discord-light');
                item.classList.add('hover:bg-discord-light');
            }
        });
    }

    clearActiveDm() {
        console.log('[DM Navigation] Clearing active DM');
        this.activeDmId = null;
        this.updateActiveDmDisplay();
    }

    showLoadingState(container) {
        container.innerHTML = `
            <div class="flex items-center justify-center h-full">
                <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        `;
    }

    showErrorState(container, message) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-gray-400">
                <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                <p>${message}</p>
            </div>
        `;
    }

    openNewDirectMessageModal() {
        console.log('[DM Navigation] Opening new DM modal');
        
        const modal = document.querySelector('#new-direct-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }
}

let directMessageNavigation;

function initDirectMessageNavigation() {
    if (document.querySelector('.dm-friend-item') || document.querySelector('#new-direct-message-btn')) {
        console.log('[DM Navigation] Initializing direct message navigation');
        directMessageNavigation = new DirectMessageNavigation();
        window.directMessageNavigation = directMessageNavigation;
    }
}

window.addEventListener('popstate', (event) => {
    if (event.state) {
        if (event.state.contentType === 'friends' && window.directMessageNavigation) {
            window.directMessageNavigation.switchToFriends();
        } else if (event.state.contentType === 'dm' && event.state.dmId && window.directMessageNavigation) {
            const dmElement = document.querySelector(`[data-chat-room-id="${event.state.dmId}"]`);
            const username = dmElement ? dmElement.dataset.username : 'User';
            window.directMessageNavigation.switchToDirectMessage(event.state.dmId, username);
        }
    }
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDirectMessageNavigation);
} else {
    initDirectMessageNavigation();
}

export { DirectMessageNavigation, initDirectMessageNavigation }; 