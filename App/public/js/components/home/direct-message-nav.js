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
            
            // Find the username for this DM
            const dmElement = document.querySelector(`[data-chat-room-id="${dmId}"]`);
            const username = dmElement ? dmElement.dataset.username : 'User';
            
            // Show the DM chat section
            this.showDirectMessageContent(dmId, username);
        } else {
            console.log('[DM Navigation] No initial DM detected');
            // Make sure friends content is visible
            this.showFriendsContent();
        }
    }

    switchToFriends() {
        console.log('[DM Navigation] Switching to friends tab');
        
        this.clearActiveDm();
        
        // Show friends content and hide chat section
        this.showFriendsContent();
        
        if (window.friendsTabManager) {
            window.friendsTabManager.switchTab('online');
        } else {
            // If friends tab manager is not available, ensure the online tab is visible
            const onlineTab = document.querySelector('#online-tab');
            if (onlineTab) {
                onlineTab.classList.remove('hidden');
            }
            
            // Hide other tabs
            ['#all-tab', '#pending-tab', '#add-friend-tab'].forEach(selector => {
                const tab = document.querySelector(selector);
                if (tab) {
                    tab.classList.add('hidden');
                }
            });
        }
        
        history.replaceState(
            { pageType: 'home', contentType: 'friends' }, 
            'misvord - Friends', 
            '/home/friends?tab=online'
        );
        
        console.log('[DM Navigation] Successfully switched to friends');
    }

    switchToDirectMessage(dmId, username) {
        console.log('[DM Navigation] Switching to DM:', { dmId, username });
        
        this.activeDmId = dmId;
        this.updateActiveDmDisplay();
        
        // Simple DOM manipulation instead of AJAX
        this.hideFriendsContent();
        this.showDirectMessageContent(dmId, username);
        
        history.pushState(
            { pageType: 'home', contentType: 'dm', dmId: dmId }, 
            `misvord - ${username}`, 
            `/home/channels/dm/${dmId}`
        );
    }

    createAndSwitchToDirectMessage(friendId, username) {
        console.log('[DM Navigation] Creating new DM with friend:', { friendId, username });

        $.ajax({
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
    
    showDirectMessageContent(dmId, username) {
        console.log('[DM Navigation] Showing DM content for:', dmId, username);
        
        const mainContent = document.querySelector('#main-content');
        if (!mainContent) {
            console.error('[DM Navigation] Main content container not found');
            return;
        }
        
        // Hide friends content
        this.hideFriendsContent();
        
        // Look for existing chat section or create it
        let chatSection = document.querySelector('.chat-section');
        
        if (!chatSection) {
            // Create chat section if it doesn't exist
            console.log('[DM Navigation] Creating new chat section for DM');
            
            chatSection = document.createElement('div');
            chatSection.className = 'chat-section flex-1 flex flex-col bg-[#313338] h-screen overflow-hidden';
            chatSection.setAttribute('data-channel-id', dmId);
            
            // Create the chat section HTML structure
            chatSection.innerHTML = `
                <div class="h-12 min-h-[48px] px-4 border-b border-[#2d2f32] flex items-center shadow-sm z-10 bg-[#313338]">
                    <i class="fas fa-user text-[#949ba4] mr-2"></i>
                    <span class="font-semibold text-white">@ ${username}</span>
                </div>

                <div id="chat-messages" class="flex-1 overflow-y-auto overflow-x-hidden">
                    <div class="messages-container flex flex-col min-h-full">
                        <div class="flex flex-col items-center justify-center h-full text-[#dcddde]">
                            <i class="fas fa-comments text-6xl mb-4 text-[#4f545c]"></i>
                            <p class="text-lg">No messages yet</p>
                            <p class="text-sm text-[#a3a6aa]">Be the first to send a message!</p>
                        </div>
                    </div>
                </div>

                <div class="px-4 py-[10px] bg-[#313338] border-t border-[#3f4147]">
                    <div id="reply-container" class="hidden"></div>

                    <form id="message-form" class="flex items-center bg-[#383a40] rounded-lg h-11 relative">
                        <div class="flex items-center pr-[2px] gap-1">
                            <button
                                type="button"
                                class="hover:text-[#dcddde] text-[#b9bbbe] w-[32px] h-[32px] flex items-center justify-center rounded hover:bg-[#404249] transition-all mx-1"
                            >
                            +
                                </button>
                            </div>

                        <div class="flex-1 flex items-center">
                            <textarea
                                id="message-input"
                                class="block w-full bg-transparent text-[#dcddde] placeholder-[#6d6f78] border-none resize-none py-[11px] px-0 focus:outline-none min-h-[22px] max-h-[50vh] text-[16px] leading-[22px]"
                                rows="1"
                                placeholder="Message @${username}"
                                maxlength="2000"
                            ></textarea>
                        </div>

                        <div class="flex items-center pr-[2px] gap-1">
                            <button
                                type="button"
                                class="hover:text-[#dcddde] text-[#b9bbbe] w-[32px] h-[32px] flex items-center justify-center rounded hover:bg-[#404249] transition-all mx-1"
                            >
                                <i class="fas fa-gift text-[20px]"></i>
                            </button>
                            <button
                                type="button"
                                class="hover:text-[#dcddde] text-[#b9bbbe] w-[32px] h-[32px] flex items-center justify-center rounded hover:bg-[#404249] transition-all mr-1"
                            >
                                <i class="fas fa-face-smile text-[20px]"></i>
                            </button>
                            <button
                                id="send-button"
                                type="submit"
                                class="hover:text-[#dcddde] text-[#b9bbbe] w-[32px] h-[32px] flex items-center justify-center rounded hover:bg-[#404249] transition-all mr-1 opacity-50 cursor-not-allowed"
                                disabled
                            >
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </form>
                    </div>
                `;
            
            mainContent.appendChild(chatSection);
        } else {
            // Update existing chat section
            console.log('[DM Navigation] Updating existing chat section for DM');
            
            // Update the header
            const chatHeader = chatSection.querySelector('.h-12 span');
            if (chatHeader) {
                chatHeader.textContent = `@ ${username}`;
            }
            
            // Update the icon
            const chatIcon = chatSection.querySelector('.h-12 i');
            if (chatIcon) {
                chatIcon.className = 'fas fa-user text-[#949ba4] mr-2';
            }
            
            // Update the placeholder
            const messageInput = chatSection.querySelector('#message-input');
            if (messageInput) {
                messageInput.placeholder = `Message @${username}`;
            }
            
            // Update data attributes
            chatSection.setAttribute('data-channel-id', dmId);
            
            // Show the chat section
            chatSection.style.display = 'flex';
            chatSection.classList.remove('hidden');
        }
        
        // Update meta tags for chat section initialization
        this.updateChatMetaTags(dmId, username);
        
        // Initialize or reinitialize chat section (with small delay to ensure DOM is ready)
        setTimeout(() => {
            this.initializeChatSection(dmId, username);
        }, 50);
        
        console.log('[DM Navigation] DM chat section displayed successfully');
    }
    
    updateChatMetaTags(dmId, username) {
        // Update meta tags for the chat section
        let metaTag;
        
        // Chat type
        metaTag = document.querySelector('meta[name="chat-type"]');
        if (metaTag) {
            metaTag.setAttribute('content', 'direct');
        } else {
            metaTag = document.createElement('meta');
            metaTag.setAttribute('name', 'chat-type');
            metaTag.setAttribute('content', 'direct');
            document.head.appendChild(metaTag);
        }
        
        // Chat ID
        metaTag = document.querySelector('meta[name="chat-id"]');
        if (metaTag) {
            metaTag.setAttribute('content', dmId);
        } else {
            metaTag = document.createElement('meta');
            metaTag.setAttribute('name', 'chat-id');
            metaTag.setAttribute('content', dmId);
            document.head.appendChild(metaTag);
        }
        
        // Channel ID (for compatibility)
        metaTag = document.querySelector('meta[name="channel-id"]');
        if (metaTag) {
            metaTag.setAttribute('content', dmId);
        } else {
            metaTag = document.createElement('meta');
            metaTag.setAttribute('name', 'channel-id');
            metaTag.setAttribute('content', dmId);
            document.head.appendChild(metaTag);
        }
        
        // Chat title
        metaTag = document.querySelector('meta[name="chat-title"]');
        if (metaTag) {
            metaTag.setAttribute('content', username);
        } else {
            metaTag = document.createElement('meta');
            metaTag.setAttribute('name', 'chat-title');
            metaTag.setAttribute('content', username);
            document.head.appendChild(metaTag);
        }
        
        // Chat placeholder
        metaTag = document.querySelector('meta[name="chat-placeholder"]');
        if (metaTag) {
            metaTag.setAttribute('content', `Message @${username}`);
        } else {
            metaTag = document.createElement('meta');
            metaTag.setAttribute('name', 'chat-placeholder');
            metaTag.setAttribute('content', `Message @${username}`);
            document.head.appendChild(metaTag);
        }
        
        console.log('[DM Navigation] Updated meta tags for DM chat');
    }
    
    initializeChatSection(dmId, username) {
        console.log('[DM Navigation] Initializing chat section for DM:', dmId, username);
        
        // Check if chat section is already initialized
        if (window.chatSection && typeof window.chatSection.switchTarget === 'function') {
            console.log('[DM Navigation] Switching existing chat section to DM');
            // Switch the existing chat section to this DM
            window.chatSection.switchTarget('direct', dmId);
            return;
        }
        
        // Function to ensure all dependencies are loaded
        const ensureDependencies = () => {
            return new Promise((resolve) => {
                const checkDependencies = () => {
                    const hasJQuery = typeof $ !== 'undefined';
                    const hasChatAPI = typeof window.ChatAPI !== 'undefined';
                    const hasChatSection = typeof window.ChatSection === 'function';
                    const hasInitFunction = typeof window.initializeChatSection === 'function';
                    const hasSocketManager = typeof window.globalSocketManager !== 'undefined';
                    
                    console.log('[DM Navigation] Dependencies check:', {
                        jQuery: hasJQuery,
                        ChatAPI: hasChatAPI,
                        ChatSection: hasChatSection,
                        initFunction: hasInitFunction,
                        socketManager: hasSocketManager
                    });
                    
                    if (hasJQuery && hasChatAPI && (hasChatSection || hasInitFunction)) {
                        console.log('[DM Navigation] All dependencies ready');
                        resolve();
                        return true;
                    }
                    return false;
                };
                
                if (checkDependencies()) {
                    return;
                }
                
                console.log('[DM Navigation] Waiting for dependencies...');
                let attempts = 0;
                const checkInterval = setInterval(() => {
                    attempts++;
                    if (checkDependencies()) {
                        clearInterval(checkInterval);
                    } else if (attempts > 100) { // 10 seconds timeout
                        clearInterval(checkInterval);
                        console.warn('[DM Navigation] Dependencies not loaded after timeout, attempting anyway');
                        resolve();
                    }
                }, 100);
            });
        };
        
        // Function to create new chat section instance
        const createChatSection = () => {
            if (typeof window.ChatSection === 'function') {
                console.log('[DM Navigation] Creating new ChatSection instance');
                const chatSection = new window.ChatSection({
                    chatType: 'direct',
                    targetId: dmId,
                    userId: window.currentUserId || document.querySelector('meta[name="user-id"]')?.getAttribute('content'),
                    username: window.currentUsername || document.querySelector('meta[name="username"]')?.getAttribute('content')
                });
                window.chatSection = chatSection;
                return true;
            }
            return false;
        };
        
        // Ensure dependencies and then initialize
        ensureDependencies().then(() => {
            // Try to create chat section directly
            if (createChatSection()) {
                console.log('[DM Navigation] Chat section initialized directly');
                return;
            }
            
            // Try using global initialization function
            if (typeof window.initializeChatSection === 'function') {
                console.log('[DM Navigation] Using global initializeChatSection function');
                window.initializeChatSection();
                return;
            }
            
            console.error('[DM Navigation] Failed to initialize chat section - no available methods');
        });
    }

    showFriendsContent() {
        console.log('[DM Navigation] Showing friends content');
        
        const friendsContainer = document.querySelector('.flex-1.bg-discord-background.flex.flex-col');
        if (friendsContainer) {
            friendsContainer.style.display = 'flex';
            friendsContainer.classList.remove('hidden');
        }
        
        // Hide chat section
        const chatSection = document.querySelector('.chat-section');
        if (chatSection) {
            chatSection.style.display = 'none';
            chatSection.classList.add('hidden');
        }
        
        // Clear active DM
        this.clearActiveDm();
        
        console.log('[DM Navigation] Friends content is now visible');
    }

    hideFriendsContent() {
        console.log('[DM Navigation] Hiding friends content');
        
        const friendsContainer = document.querySelector('.flex-1.bg-discord-background.flex.flex-col');
        if (friendsContainer) {
            friendsContainer.style.display = 'none';
            friendsContainer.classList.add('hidden');
        }
        
        console.log('[DM Navigation] Friends content is now hidden');
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
    } else {
        // Handle case where there's no state (e.g., direct URL navigation)
        const currentPath = window.location.pathname;
        const dmMatch = currentPath.match(/\/home\/channels\/dm\/(\d+)/);
        
        if (dmMatch && window.directMessageNavigation) {
            const dmId = dmMatch[1];
            const dmElement = document.querySelector(`[data-chat-room-id="${dmId}"]`);
            const username = dmElement ? dmElement.dataset.username : 'User';
            window.directMessageNavigation.switchToDirectMessage(dmId, username);
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