class GlobalPresenceManager {
    constructor() {
        this.friendsManager = null;
        this.isInitialized = false;
        this.activePagesWithActiveNow = ['home', 'server', 'admin', 'nitro', 'accept-invite'];
        this.currentPage = this.detectCurrentPage();
        this.lastRenderedState = null;
        
        console.log('🌐 [GLOBAL-PRESENCE] Initializing for page:', this.currentPage);
    }

    detectCurrentPage() {
        const path = window.location.pathname;
        
        if (path === '/home' || path.startsWith('/home/')) return 'home';
        if (path.startsWith('/server/')) return 'server';
        if (path === '/explore-servers') return 'explore';
        if (path === '/admin') return 'admin';
        if (path === '/nitro') return 'nitro';
        if (path.startsWith('/join/')) return 'accept-invite';
        if (path.startsWith('/settings/')) return 'settings';
        
        return 'other';
    }

    shouldShowActiveNow() {
        return this.activePagesWithActiveNow.includes(this.currentPage);
    }

    async initialize() {
        if (this.isInitialized) return;
        
        console.log('🚀 [GLOBAL-PRESENCE] Starting global presence initialization...');
        
        await this.waitForDependencies();
        await this.initializeFriendsManager();
        await this.setupActiveNowSection();
        
        this.isInitialized = true;
        console.log('✅ [GLOBAL-PRESENCE] Global presence system initialized');
    }

    async waitForDependencies() {
        console.log('⏳ [GLOBAL-PRESENCE] Waiting for dependencies...');
        
        const maxWait = 10000;
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWait) {
            if (window.FriendsManager && window.globalSocketManager) {
                console.log('✅ [GLOBAL-PRESENCE] All dependencies loaded');
                return;
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.warn('⚠️ [GLOBAL-PRESENCE] Timeout waiting for dependencies');
    }

    async initializeFriendsManager() {
        if (!window.FriendsManager) {
            console.error('❌ [GLOBAL-PRESENCE] FriendsManager not available');
            return;
        }
        
        console.log('🤝 [GLOBAL-PRESENCE] Initializing FriendsManager...');
        
        this.friendsManager = window.FriendsManager.getInstance();
        
        if (window.globalSocketManager && window.globalSocketManager.isReady()) {
            console.log('🔌 [GLOBAL-PRESENCE] Socket ready, loading initial data...');
            await this.friendsManager.getOnlineUsers(true);
        } else {
            console.log('⏳ [GLOBAL-PRESENCE] Socket not ready, will load data when connected');
            
            window.addEventListener('globalSocketReady', async () => {
                console.log('🔌 [GLOBAL-PRESENCE] Socket connected, loading data...');
                await this.friendsManager.getOnlineUsers(true);
            });
        }
    }

    async setupActiveNowSection() {
        if (!this.shouldShowActiveNow()) {
            console.log('ℹ️ [GLOBAL-PRESENCE] Active Now section not needed for this page');
            return;
        }
        
        console.log('📋 [GLOBAL-PRESENCE] Setting up Active Now section...');
        
        await this.createActiveNowSection();
        this.setupActiveNowLogic();
    }

    async createActiveNowSection() {
        let targetContainer = this.findActiveNowContainer();
        
        if (!targetContainer) {
            targetContainer = this.createActiveNowContainer();
        }
        
        if (!targetContainer) {
            console.warn('⚠️ [GLOBAL-PRESENCE] Could not create Active Now container');
            return;
        }
        
        const activeNowHTML = await this.generateActiveNowHTML();
        targetContainer.innerHTML = activeNowHTML;
        
        console.log('✅ [GLOBAL-PRESENCE] Active Now section created');
    }

    findActiveNowContainer() {
        return document.querySelector('.active-now-section') || 
               document.querySelector('#active-now-section') ||
               document.querySelector('[data-component="active-now"]');
    }

    createActiveNowContainer() {
        const mainLayout = document.querySelector('.flex.h-screen') || 
                          document.querySelector('.app-layout') ||
                          document.querySelector('body > div:first-child');
        
        if (!mainLayout) return null;
        
        const container = document.createElement('div');
        container.className = 'w-60 bg-discord-dark border-l border-gray-800 flex flex-col h-full max-h-screen active-now-section';
        container.id = 'global-active-now-section';
        
        mainLayout.appendChild(container);
        return container;
    }

    async generateActiveNowHTML() {
        try {
            const friends = await this.friendsManager.getFriends();
            
            return `
                <div class="h-12 border-b border-gray-800 flex items-center px-4">
                    <h2 class="font-semibold text-white">Active Now</h2>
                </div>
                <div class="flex-1 overflow-y-auto p-4" id="global-active-now-container">
                    <div class="rounded-lg bg-discord-background p-6 text-center" id="global-no-active-friends">
                        <h3 class="font-semibold text-white mb-2 text-lg">It's quiet for now...</h3>
                        <p class="text-gray-400 text-sm">When friends start an activity, like playing a game or hanging out on voice, we'll show it here!</p>
                    </div>
                    <div id="global-active-friends-list" class="hidden"></div>
                </div>
            `;
        } catch (error) {
            console.error('❌ [GLOBAL-PRESENCE] Error generating Active Now HTML:', error);
            return '<div class="p-4 text-gray-400">Error loading Active Now</div>';
        }
    }

    setupActiveNowLogic() {
        if (!this.friendsManager) return;
        
        console.log('⚙️ [GLOBAL-PRESENCE] Setting up Active Now logic...');
        
        this.friendsManager.subscribe((type, data) => {
            console.log(`🔄 [GLOBAL-PRESENCE] Event: ${type}`, data);
            
            switch (type) {
                case 'user-online':
                case 'user-offline':
                case 'user-presence-update':
                case 'online-users-updated':
                    this.updateActiveNow();
                    break;
            }
        });
        
        this.updateActiveNow();
    }

    async updateActiveNow() {
        const container = document.getElementById('global-active-friends-list');
        const emptyState = document.getElementById('global-no-active-friends');
        
        if (!container || !emptyState) return;
        
        try {
            const friends = await this.friendsManager.getFriends();
            const onlineUsers = this.friendsManager.cache.onlineUsers || {};
            
            const activeFriends = friends.filter(friend => {
                const userData = onlineUsers[friend.id];
                return userData && (userData.status === 'online' || userData.status === 'afk');
            });
            
            const newState = this.createFriendStateSignature(activeFriends, onlineUsers);
            
            if (this.statesAreEqual(this.lastRenderedState, newState)) {
                return;
            }
            
            if (activeFriends.length > 0) {
                this.smartRenderActiveFriends(container, activeFriends, onlineUsers);
                container.classList.remove('hidden');
                emptyState.classList.add('hidden');
            } else {
                container.classList.add('hidden');
                emptyState.classList.remove('hidden');
            }
            
            this.lastRenderedState = newState;
        } catch (error) {
            console.error('❌ [GLOBAL-PRESENCE] Error updating Active Now:', error);
        }
    }

    createFriendStateSignature(activeFriends, onlineUsers) {
        return activeFriends.map(friend => {
            const userData = onlineUsers[friend.id];
            return {
                id: friend.id,
                username: friend.username,
                avatar_url: friend.avatar_url,
                status: userData?.status || 'offline',
                activity_type: userData?.activity_details?.type || 'idle'
            };
        }).sort((a, b) => a.username.localeCompare(b.username));
    }
    
    statesAreEqual(state1, state2) {
        if (!state1 || !state2) return false;
        if (state1.length !== state2.length) return false;
        
        return state1.every((friend1, index) => {
            const friend2 = state2[index];
            return friend1.id === friend2.id &&
                   friend1.username === friend2.username &&
                   friend1.status === friend2.status &&
                   friend1.activity_type === friend2.activity_type;
        });
    }
    
    updateExistingFriend(friendEl, friend, userData) {
        const status = userData?.status || 'offline';
        const statusClass = this.getStatusClass(status);
        const activityDetails = userData?.activity_details;
        const activityText = this.getActivityText(activityDetails);
        const activityIcon = this.getActivityIcon(activityDetails);
        
        const currentStatus = friendEl.getAttribute('data-status');
        if (currentStatus !== status) {
            const statusIndicator = friendEl.querySelector('.w-3.h-3.rounded-full');
            if (statusIndicator) {
                statusIndicator.className = `absolute bottom-0 right-0 w-3 h-3 rounded-full ${statusClass} border-2 border-discord-dark transition-colors duration-300`;
            }
            friendEl.setAttribute('data-status', status);
        }
        
        const activityEl = friendEl.querySelector('.text-xs.text-gray-400');
        if (activityEl) {
            const currentActivity = activityEl.textContent.trim();
            const newActivity = activityText;
            if (currentActivity !== newActivity) {
                activityEl.innerHTML = `<i class="${activityIcon} mr-1"></i>${activityText}`;
            }
        }
    }
    
    createFriendElement(friend, userData) {
        const status = userData?.status || 'offline';
        const statusClass = this.getStatusClass(status);
        const activityText = this.getActivityText(userData?.activity_details);
        const activityIcon = this.getActivityIcon(userData?.activity_details);
        
        const friendEl = document.createElement('div');
        friendEl.className = 'flex items-center mb-4 p-3 bg-discord-background rounded-md hover:bg-discord-darker cursor-pointer transition-all duration-200';
        friendEl.innerHTML = `
            <div class="relative mr-3">
                <div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                    <img src="${friend.avatar_url || ''}" 
                         alt="${friend.username}" 
                         class="w-full h-full object-cover user-avatar">
                </div>
                <div class="absolute bottom-0 right-0 w-3 h-3 rounded-full ${statusClass} border-2 border-discord-dark transition-colors duration-300"></div>
            </div>
            <div class="flex-1">
                <div class="font-semibold text-white">${friend.username}</div>
                <div class="text-xs text-gray-400 transition-all duration-200 flex items-center">
                    <i class="${activityIcon} mr-1"></i>
                    ${activityText}
                </div>
            </div>
        `;
        
        friendEl.setAttribute('data-user-id', friend.id);
        friendEl.setAttribute('data-status', status);
        
        if (window.fallbackImageHandler) {
            const img = friendEl.querySelector('img.user-avatar');
            if (img) {
                window.fallbackImageHandler.processImage(img);
            }
        }
        
        return friendEl;
    }

    smartRenderActiveFriends(container, activeFriends, onlineUsers) {
        const existingFriends = new Map();
        Array.from(container.children).forEach(child => {
            const userId = child.getAttribute('data-user-id');
            if (userId) {
                existingFriends.set(userId, child);
            }
        });
        
        const newFriendsMap = new Map();
        activeFriends.forEach(friend => {
            newFriendsMap.set(friend.id, friend);
        });
        
        existingFriends.forEach((element, userId) => {
            if (!newFriendsMap.has(userId)) {
                element.remove();
            }
        });
        
        const sortedActiveFriends = activeFriends.sort((a, b) => a.username.localeCompare(b.username));
        
        sortedActiveFriends.forEach((friend, index) => {
            const existingEl = existingFriends.get(friend.id);
            
            if (existingEl) {
                this.updateExistingFriend(existingEl, friend, onlineUsers[friend.id]);
                
                const currentIndex = Array.from(container.children).indexOf(existingEl);
                if (currentIndex !== index) {
                    if (index === 0) {
                        container.prepend(existingEl);
                    } else {
                        const referenceEl = container.children[index];
                        container.insertBefore(existingEl, referenceEl);
                    }
                }
            } else {
                const newEl = this.createFriendElement(friend, onlineUsers[friend.id]);
                
                if (index === 0) {
                    container.prepend(newEl);
                } else if (index >= container.children.length) {
                    container.appendChild(newEl);
                } else {
                    const referenceEl = container.children[index];
                    container.insertBefore(newEl, referenceEl);
                }
            }
        });
    }

    renderActiveFriends(container, activeFriends, onlineUsers) {
        this.smartRenderActiveFriends(container, activeFriends, onlineUsers);
    }

    getStatusClass(status) {
        switch (status) {
            case 'online': return 'bg-discord-green';
            case 'afk': return 'bg-yellow-500';
            case 'offline':
            default: return 'bg-gray-500';
        }
    }

    getActivityText(activityDetails) {
        if (!activityDetails || !activityDetails.type) {
            return 'Online';
        }
        
        switch (activityDetails.type) {
            case 'playing Tic Tac Toe': return 'Playing Tic Tac Toe';
            case 'In Voice Call': return 'In Voice Call';
            case 'afk': return 'Away';
            case 'idle':
            default: return 'Online';
        }
    }

    getActivityIcon(activityDetails) {
        if (!activityDetails || !activityDetails.type) {
            return 'fa-solid fa-circle';
        }
        
        switch (activityDetails.type) {
            case 'playing Tic Tac Toe': return 'fa-solid fa-gamepad';
            case 'In Voice Call': return 'fa-solid fa-microphone';
            case 'afk': return 'fa-solid fa-clock';
            case 'idle':
            default: return 'fa-solid fa-circle';
        }
    }

    handlePresenceUpdate(data) {
        console.log('🔄 [GLOBAL-PRESENCE] Handling presence update:', data);
        
        if (this.friendsManager) {
            this.friendsManager.handlePresenceUpdate(data);
        }
        
        this.updateActiveNow();
    }

    static getInstance() {
        if (!window.globalPresenceManager) {
            window.globalPresenceManager = new GlobalPresenceManager();
        }
        return window.globalPresenceManager;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const isAuthPage = window.location.pathname.includes('/login') || 
                      window.location.pathname.includes('/register') ||
                      window.location.pathname === '/';
    
    if (!isAuthPage) {
        console.log('🌐 [GLOBAL-PRESENCE] Starting global presence system...');
        const presenceManager = GlobalPresenceManager.getInstance();
        await presenceManager.initialize();
    } else {
        console.log('🚫 [GLOBAL-PRESENCE] Skipping presence system on auth page');
    }
});

window.GlobalPresenceManager = GlobalPresenceManager; 