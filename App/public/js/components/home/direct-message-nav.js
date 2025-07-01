class DirectMessageNavigation {
    constructor() {
        this.activeDmId = null;
    }

    init() {
        this.bindFriendsLinkEvent();
        this.bindDmItemEvents();
        this.bindNewDmEvent();
        this.setInitialState();
    }

    bindFriendsLinkEvent() {
        document.addEventListener('click', (e) => {
            const friendsLink = e.target.closest('a[href="/home/friends?tab=online"]') ||
                               e.target.closest('a[href*="/home/friends"]');
            
            if (friendsLink && friendsLink.getAttribute('href')?.includes('/home/friends')) {
                e.preventDefault();
                e.stopPropagation();
                
                this.switchToFriends();
                return false;
            }
        });
    }

    bindDmItemEvents() {
        document.addEventListener('click', (e) => {
            const dmItem = e.target.closest('.dm-friend-item');
            if (dmItem) {
                e.preventDefault();
                e.stopPropagation();
                
                const chatRoomId = dmItem.dataset.chatRoomId;
                const friendId = dmItem.dataset.friendId;
                const username = dmItem.dataset.username;
                const roomType = dmItem.dataset.roomType || 'direct';
                
                if (chatRoomId) {
                    this.switchToChat(chatRoomId, username, roomType);
                } else if (friendId && roomType === 'direct') {
                    this.createAndSwitchToDirectMessage(friendId, username);
                }
                return false;
            }
        });
    }

    bindNewDmEvent() {
        document.addEventListener('click', (e) => {
            if (e.target && e.target.id === 'new-direct-message-btn') {
                e.preventDefault();
                
                const modal = document.getElementById('new-direct-modal');
                if (modal) {
                    modal.style.display = 'flex';
                }
            }
        });
    }

    setInitialState() {
        const currentPath = window.location.pathname;
        const dmMatch = currentPath.match(/\/home\/channels\/dm\/(\d+)/);
        
        if (dmMatch) {
            const dmId = dmMatch[1];
            this.activeDmId = dmId;
            this.updateActiveDmDisplay();
            
            const dmElement = document.querySelector(`[data-chat-room-id="${dmId}"]`);
            const username = dmElement ? dmElement.dataset.username : 'Chat';
            const roomType = dmElement ? dmElement.dataset.roomType : 'direct';
            
            this.showChatContent(dmId, username, roomType);
        } else if (currentPath.includes('/home/friends')) {
            this.showFriendsContent();
            this.initializeFriendsTabs();
        } else {
            this.showFriendsContent();
            this.initializeFriendsTabs();
        }
    }

    switchToFriends() {
        this.clearActiveDm();
        this.showFriendsContent();
        this.initializeFriendsTabs();
        
        history.replaceState(
            { pageType: 'home', contentType: 'friends' }, 
            'misvord - Friends', 
            '/home/friends?tab=online'
        );
    }

    initializeFriendsTabs() {
        setTimeout(() => {
            if (window.FriendsTabManager) {
                const tabManager = window.FriendsTabManager.getInstance();
                if (tabManager) {
                    tabManager.setInitialTab();
                }
            }
            
            const urlParams = new URLSearchParams(window.location.search);
            const tab = urlParams.get('tab') || 'online';
            
            const activeTab = document.querySelector(`[data-tab="${tab}"]`);
            if (activeTab) {
                activeTab.click();
            }
            

        }, 100);
    }

    switchToChat(dmId, chatName, roomType) {
        this.activeDmId = dmId;
        this.updateActiveDmDisplay();
        this.showChatContent(dmId, chatName, roomType);
        
        history.replaceState(
            { pageType: 'home', contentType: 'dm', dmId: dmId }, 
            `misvord - ${chatName}`, 
            `/home/channels/dm/${dmId}`
        );
    }

    createAndSwitchToDirectMessage(friendId, username) {
        if (window.createDirectMessage) {
            window.createDirectMessage(friendId);
        }
    }

    showChatContent(dmId, chatName, roomType) {
        const mainContent = document.querySelector('#main-content');
        if (!mainContent) {
            return;
        }
        
        this.hideFriendsContent();
        
        let chatSection = document.querySelector('.chat-section');
        
        if (!chatSection) {
            chatSection = document.createElement('div');
            chatSection.className = 'chat-section flex-1 flex flex-col bg-[#313338] h-screen overflow-hidden';
            chatSection.setAttribute('data-channel-id', dmId);
            
            const headerIcon = roomType === 'group' ? 'fas fa-users' : 'fas fa-user';
            const headerPrefix = roomType === 'group' ? '' : '@ ';
            
            chatSection.innerHTML = `
                <div class="h-12 min-h-[48px] px-4 border-b border-[#2d2f32] flex items-center shadow-sm z-10 bg-[#313338]">
                    <i class="${headerIcon} text-[#949ba4] mr-2"></i>
                    <span class="font-semibold text-white">${headerPrefix}${chatName}</span>
                </div>
                <div class="flex-1 flex flex-col overflow-hidden" id="chat-container-${dmId}">
                    <div class="flex-1 flex flex-col justify-end p-4 overflow-y-auto" id="messages-container-${dmId}">
                    </div>
                    <div class="p-4 border-t border-[#2d2f32]">
                        <div class="flex items-center space-x-3">
                            <div class="flex-1 relative">
                                <input type="text" 
                                       class="w-full bg-[#383a40] text-white rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-discord-primary"
                                       placeholder="Message ${headerPrefix}${chatName}"
                                       id="message-input-${dmId}">
                            </div>
                            <button class="text-[#949ba4] hover:text-white p-2 rounded-md hover:bg-[#404249] transition-colors">
                                <i class="fas fa-smile text-xl"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            mainContent.appendChild(chatSection);
        } else {
            chatSection.style.display = 'flex';
            chatSection.classList.remove('hidden');
            chatSection.setAttribute('data-channel-id', dmId);
        }
        
        if (window.chatManager && window.chatManager.loadChat) {
            window.chatManager.loadChat(dmId, 'direct');
        }
    }

    updateActiveDmDisplay() {
        document.querySelectorAll('.dm-friend-item').forEach(item => {
            item.classList.remove('bg-discord-light');
            item.classList.add('hover:bg-discord-light');
        });
        
        if (this.activeDmId) {
            const activeItem = document.querySelector(`[data-chat-room-id="${this.activeDmId}"]`);
            if (activeItem) {
                activeItem.classList.add('bg-discord-light');
                activeItem.classList.remove('hover:bg-discord-light');
            }
        }
    }

    clearActiveDm() {
        this.activeDmId = null;
        this.updateActiveDmDisplay();
    }

    showFriendsContent() {
        const friendsContainer = document.querySelector('.flex-1.bg-discord-background.flex.flex-col');
        if (friendsContainer) {
            friendsContainer.style.display = 'flex';
            friendsContainer.classList.remove('hidden');
        }
        
        const chatSection = document.querySelector('.chat-section');
        if (chatSection) {
            chatSection.style.display = 'none';
            chatSection.classList.add('hidden');
        }
        
        this.clearActiveDm();
    }

    hideFriendsContent() {
        const friendsContainer = document.querySelector('.flex-1.bg-discord-background.flex.flex-col');
        if (friendsContainer) {
            friendsContainer.style.display = 'none';
            friendsContainer.classList.add('hidden');
        }
    }
}

let directMessageNavigation;

function initDirectMessageNavigation() {
    if (document.querySelector('.dm-friend-item') || document.querySelector('#new-direct-message-btn')) {
        directMessageNavigation = new DirectMessageNavigation();
        directMessageNavigation.init();
        window.directMessageNavigation = directMessageNavigation;
    }
}

window.initDirectMessageNavigation = initDirectMessageNavigation;

window.addEventListener('popstate', (event) => {
    if (event.state) {
        if (event.state.contentType === 'friends' && window.directMessageNavigation) {
            window.directMessageNavigation.switchToFriends();
        } else if (event.state.contentType === 'dm' && event.state.dmId && window.directMessageNavigation) {
            const dmElement = document.querySelector(`[data-chat-room-id="${event.state.dmId}"]`);
            const chatName = dmElement ? dmElement.dataset.username : 'Chat';
            const roomType = dmElement ? dmElement.dataset.roomType : 'direct';
            window.directMessageNavigation.switchToChat(event.state.dmId, chatName, roomType);
        }
    } else {
        const currentPath = window.location.pathname;
        const dmMatch = currentPath.match(/\/home\/channels\/dm\/(\d+)/);
        
        if (dmMatch && window.directMessageNavigation) {
            const dmId = dmMatch[1];
            const dmElement = document.querySelector(`[data-chat-room-id="${dmId}"]`);
            const chatName = dmElement ? dmElement.dataset.username : 'Chat';
            const roomType = dmElement ? dmElement.dataset.roomType : 'direct';
            window.directMessageNavigation.switchToChat(dmId, chatName, roomType);
        } else if (currentPath.includes('/home/friends') && window.directMessageNavigation) {
            window.directMessageNavigation.switchToFriends();
        }
    }
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDirectMessageNavigation);
} else {
    initDirectMessageNavigation();
}

export { DirectMessageNavigation, initDirectMessageNavigation }; 