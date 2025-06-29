class HomeWrapper {
    constructor() {
        this.currentTab = 'online';
        this.friends = [];
        this.onlineFriends = [];
        this.currentUser = null;
        this.chatRooms = [];
        this.isLoading = false;
        this.statusUpdateInterval = null;
        this.initialized = false;
        
        this.init();
    }

    async init() {
        if (this.initialized) return;
        
        console.log('[HomeWrapper] Initializing home page wrapper');
        
        await this.waitForDependencies();
        this.extractInitialData();
        this.setupEventListeners();
        this.initializeComponents();
        this.startStatusUpdates();
        
        this.initialized = true;
        console.log('[HomeWrapper] Home wrapper initialized successfully');
    }

    async waitForDependencies() {
        const maxAttempts = 50;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            if (window.ajax && window.showToast && document.readyState === 'complete') {
                console.log('[HomeWrapper] Dependencies ready');
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        console.warn('[HomeWrapper] Some dependencies may not be ready');
    }

    extractInitialData() {
        this.currentUser = window.currentUser || null;
        this.currentTab = this.getActiveTabFromURL();
        
        console.log('[HomeWrapper] Extracted initial data:', {
            currentUser: this.currentUser,
            currentTab: this.currentTab
        });
    }

    getActiveTabFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        return ['online', 'all', 'pending', 'add-friend'].includes(tab) ? tab : 'online';
    }

    setupEventListeners() {
        this.setupTabHandlers();
        this.setupFriendRequestHandlers();
        this.setupDirectMessageHandlers();
        this.setupMobileMenuHandlers();
        this.setupSearchHandlers();
    }

    setupTabHandlers() {
        document.addEventListener('click', (e) => {
            const tabElement = e.target.closest('[data-tab]');
            if (tabElement) {
                e.preventDefault();
                const tab = tabElement.getAttribute('data-tab');
                this.switchToTab(tab);
            }
        });
    }

    setupFriendRequestHandlers() {
        const friendInput = document.getElementById('friend-username-input');
        const sendButton = document.getElementById('send-friend-request');
        
        if (friendInput && sendButton) {
            friendInput.addEventListener('input', (e) => {
                const value = e.target.value.trim();
                sendButton.disabled = value.length === 0;
                sendButton.classList.toggle('opacity-50', value.length === 0);
                sendButton.classList.toggle('cursor-not-allowed', value.length === 0);
            });

            sendButton.addEventListener('click', () => {
                this.sendFriendRequest();
            });

            friendInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !sendButton.disabled) {
                    this.sendFriendRequest();
                }
            });
        }
    }

    setupDirectMessageHandlers() {
        const newDMBtn = document.getElementById('new-direct-message-btn');
        if (newDMBtn) {
            newDMBtn.addEventListener('click', () => {
                this.openNewDirectMessageModal();
            });
        }

        document.addEventListener('click', (e) => {
            const dmItem = e.target.closest('.dm-friend-item');
            if (dmItem) {
                const friendId = dmItem.dataset.friendId;
                const chatRoomId = dmItem.dataset.chatRoomId;
                this.openDirectMessage(friendId, chatRoomId);
            }
        });
    }

    setupMobileMenuHandlers() {
        const menuToggle = document.getElementById('friends-menu-toggle');
        const mobileMenu = document.getElementById('friends-mobile-menu');
        
        if (menuToggle && mobileMenu) {
            menuToggle.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }
    }

    setupSearchHandlers() {
        const searchInputs = document.querySelectorAll('input[placeholder="Search"]');
        searchInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                this.handleSearch(e.target.value, e.target);
            });
        });
    }

    initializeComponents() {
        this.initializeModals();
        this.initializeLazyLoading();
        this.setupTooltips();
    }

    initializeModals() {
        const createServerModal = document.getElementById('create-server-modal');
        const newDirectModal = document.getElementById('new-direct-modal');
        
        if (createServerModal) {
            this.setupModal(createServerModal, 'close-server-modal');
        }
        
        if (newDirectModal) {
            this.setupModal(newDirectModal, 'close-new-direct-modal', 'cancel-new-direct');
        }
    }

    setupModal(modal, ...closeButtonIds) {
        closeButtonIds.forEach(buttonId => {
            const closeBtn = document.getElementById(buttonId);
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    modal.classList.add('hidden');
                });
            }
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    }

    initializeLazyLoading() {
        setTimeout(() => {
            if (window.LazyLoader && typeof window.LazyLoader.triggerDataLoaded === 'function') {
                window.LazyLoader.triggerDataLoaded('friend-list', this.friends.length === 0);
                this.showContent();
            }
        }, 750);
    }

    showContent() {
        const skeletonContent = document.querySelector('.skeleton-content');
        const friendContent = document.querySelector('.friend-content');
        
        if (skeletonContent) skeletonContent.classList.add('hidden');
        if (friendContent) friendContent.classList.remove('hidden');
    }

    setupTooltips() {
        document.querySelectorAll('[title]').forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                this.showTooltip(e.target, e.target.getAttribute('title'));
            });
            
            element.addEventListener('mouseleave', (e) => {
                this.hideTooltip();
            });
        });
    }

    async switchToTab(tabName) {
        if (this.isLoading || this.currentTab === tabName) return;
        
        console.log('[HomeWrapper] Switching to tab:', tabName);
        this.isLoading = true;
        
        this.updateTabUI(tabName);
        this.updateURL(tabName);
        
        try {
            await this.loadTabContent(tabName);
            this.currentTab = tabName;
        } catch (error) {
            console.error('[HomeWrapper] Error switching tab:', error);
            this.showError('Failed to load tab content');
        } finally {
            this.isLoading = false;
        }
    }

    updateTabUI(tabName) {
        const tabs = document.querySelectorAll('[data-tab]');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabs.forEach(tab => {
            const isActive = tab.getAttribute('data-tab') === tabName;
            
            tab.classList.toggle('text-white', isActive);
            tab.classList.toggle('text-gray-300', !isActive);
            
            if (tabName === 'add-friend' || tab.getAttribute('data-tab') === 'add-friend') {
                tab.classList.toggle('bg-discord-green', isActive && tabName === 'add-friend');
            } else {
                tab.classList.toggle('bg-discord-primary', isActive);
                tab.classList.toggle('hover:bg-discord-light', !isActive);
            }
        });
        
        tabContents.forEach(content => {
            const contentId = content.id;
            const shouldShow = contentId === `${tabName}-tab`;
            content.classList.toggle('hidden', !shouldShow);
        });
    }

    updateURL(tabName) {
        const url = new URL(window.location);
        url.searchParams.set('tab', tabName);
        window.history.pushState({}, '', url);
    }

    async loadTabContent(tabName) {
        switch (tabName) {
            case 'all':
                await this.loadAllFriends();
                break;
            case 'pending':
                await this.loadPendingRequests();
                break;
            case 'online':
                await this.loadOnlineFriends();
                break;
            case 'add-friend':
                this.focusAddFriendInput();
                break;
        }
    }

    async loadAllFriends() {
        const container = document.getElementById('all-friends-container');
        if (!container) return;
        
        container.innerHTML = this.generateSkeletonFriends(5);
        
        try {
            const response = await this.makeAjaxRequest('/ajax/friends/all');
            
            if (response.success && response.data.friends) {
                this.friends = response.data.friends;
                await this.renderAllFriends(container);
            } else {
                this.renderEmptyFriends(container);
            }
        } catch (error) {
            console.error('[HomeWrapper] Error loading all friends:', error);
            container.innerHTML = '<div class="text-gray-400 p-4">Failed to load friends</div>';
        }
    }

    async renderAllFriends(container) {
        const onlineUsers = await this.getOnlineUsers();
        
        if (this.friends.length === 0) {
            this.renderEmptyFriends(container);
            return;
        }
        
        let friendsHtml = '';
        this.friends.forEach(friend => {
            const isOnline = onlineUsers[friend.id] !== undefined;
            const status = isOnline ? (onlineUsers[friend.id].status || 'online') : 'offline';
            const statusColor = this.getStatusColor(status);
            const statusText = this.getStatusText(status);
            
            friendsHtml += `
                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 sm:p-3 rounded hover:bg-discord-light group friend-item gap-2 sm:gap-0" data-user-id="${friend.id}">
                    <div class="flex items-center">
                        <div class="relative mr-3">
                            <div class="w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                <img src="${friend.avatar_url || '/public/assets/common/default-profile-picture.png'}" 
                                     alt="Avatar" class="w-full h-full object-cover">
                            </div>
                            <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-background ${statusColor}"></span>
                        </div>
                        <div>
                            <div class="font-medium text-white friend-name text-sm sm:text-base">${this.escapeHtml(friend.username)}</div>
                            <div class="text-xs text-gray-400 friend-status">${statusText}</div>
                        </div>
                    </div>
                    <div class="flex space-x-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity self-end sm:self-auto">
                        <button class="p-2 text-gray-400 hover:text-white hover:bg-discord-background rounded-full text-sm" title="Message" onclick="homeWrapper.createDirectMessage('${friend.id}')">
                            <i class="fa-solid fa-message"></i>
                        </button>
                        <button class="p-2 text-gray-400 hover:text-white hover:bg-discord-background rounded-full text-sm" title="More">
                            <i class="fa-solid fa-ellipsis-vertical"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = friendsHtml;
    }

    renderEmptyFriends(container) {
        container.innerHTML = `
            <div class="p-4 bg-discord-dark rounded text-center">
                <div class="mb-2 text-gray-400">
                    <i class="fa-solid fa-user-group text-3xl"></i>
                </div>
                <p class="text-gray-300 mb-1">No friends found</p>
                <p class="text-gray-500 text-sm">Add some friends to get started!</p>
            </div>
        `;
    }

    async loadPendingRequests() {
        const container = document.getElementById('pending-requests');
        if (!container) return;
        
        container.innerHTML = this.generateSkeletonPending();
        
        try {
            const response = await this.makeAjaxRequest('/ajax/friends/pending');
            
            if (response.success && response.data) {
                this.renderPendingRequests(container, response.data);
            } else {
                this.renderNoPendingRequests(container);
            }
        } catch (error) {
            console.error('[HomeWrapper] Error loading pending requests:', error);
            container.innerHTML = '<div class="text-gray-400 p-4">Failed to load pending requests</div>';
        }
    }

    renderPendingRequests(container, data) {
        const { incoming, outgoing } = data;
        let html = '';
        
        if (incoming && incoming.length > 0) {
            html += `
                <h3 class="text-xs uppercase font-semibold text-gray-400 mb-2">Incoming Friend Requests — ${incoming.length}</h3>
                <div class="space-y-2">
                    ${incoming.map(user => `
                        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-discord-dark rounded gap-3 sm:gap-0">
                            <div class="flex items-center">
                                <div class="w-12 h-12 sm:w-10 sm:h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden mr-3">
                                    <img src="${user.avatar_url || '/public/assets/common/default-profile-picture.png'}" 
                                         alt="Avatar" class="w-full h-full object-cover">
                                </div>
                                <div>
                                    <div class="font-medium text-white text-sm sm:text-base">${this.escapeHtml(user.username)}</div>
                                    <div class="text-xs text-gray-400">Incoming Friend Request</div>
                                </div>
                            </div>
                            <div class="flex flex-col sm:flex-row gap-2 sm:space-x-2 sm:gap-0">
                                <button class="bg-discord-green hover:bg-discord-green/90 text-white rounded-md px-3 py-2 sm:py-1 text-sm order-1 sm:order-none"
                                        onclick="homeWrapper.acceptFriendRequest('${user.friendship_id}')">Accept</button>
                                <button class="bg-discord-dark hover:bg-discord-light text-white rounded-md px-3 py-2 sm:py-1 text-sm border border-gray-600 order-2 sm:order-none"
                                        onclick="homeWrapper.declineFriendRequest('${user.friendship_id}')">Ignore</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        if (outgoing && outgoing.length > 0) {
            html += `
                <h3 class="text-xs uppercase font-semibold text-gray-400 mt-4 mb-2">Outgoing Friend Requests — ${outgoing.length}</h3>
                <div class="space-y-2">
                    ${outgoing.map(user => `
                        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-discord-dark rounded gap-3 sm:gap-0">
                            <div class="flex items-center">
                                <div class="w-12 h-12 sm:w-10 sm:h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden mr-3">
                                    <img src="${user.avatar_url || '/public/assets/common/default-profile-picture.png'}" 
                                         alt="Avatar" class="w-full h-full object-cover">
                                </div>
                                <div>
                                    <div class="font-medium text-white text-sm sm:text-base">${this.escapeHtml(user.username)}</div>
                                    <div class="text-xs text-gray-400">Outgoing Friend Request</div>
                                </div>
                            </div>
                            <div class="self-start sm:self-auto">
                                <button class="bg-discord-red hover:bg-discord-red/90 text-white rounded-md px-3 py-2 sm:py-1 text-sm w-full sm:w-auto"
                                        onclick="homeWrapper.cancelFriendRequest('${user.id}')">Cancel</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        if ((!incoming || incoming.length === 0) && (!outgoing || outgoing.length === 0)) {
            this.renderNoPendingRequests(container);
        } else {
            container.innerHTML = html;
        }
    }

    renderNoPendingRequests(container) {
        container.innerHTML = `
            <div class="p-4 bg-discord-dark rounded text-center">
                <div class="mb-2 text-gray-400">
                    <i class="fa-solid fa-clock text-3xl"></i>
                </div>
                <p class="text-gray-300 mb-1">No pending friend requests</p>
                <p class="text-gray-500 text-sm">Friend requests will appear here</p>
            </div>
        `;
    }

    async loadOnlineFriends() {
        const container = document.querySelector('.online-friends-container');
        if (!container) return;
        
        try {
            await this.updateFriendStatus();
        } catch (error) {
            console.error('[HomeWrapper] Error loading online friends:', error);
        }
    }

    focusAddFriendInput() {
        const input = document.getElementById('friend-username-input');
        if (input) {
            setTimeout(() => input.focus(), 100);
        }
    }

    async sendFriendRequest() {
        const input = document.getElementById('friend-username-input');
        const errorDiv = document.getElementById('friend-request-error');
        const successDiv = document.getElementById('friend-request-success');
        
        if (!input) return;
        
        const username = input.value.trim();
        if (!username) return;
        
        this.clearMessages(errorDiv, successDiv);
        
        try {
            const response = await this.makeAjaxRequest('/ajax/friends/send', {
                method: 'POST',
                data: { username }
            });
            
            if (response.success) {
                this.showSuccess(successDiv, 'Friend request sent successfully!');
                input.value = '';
                this.updateSendButton(true);
            } else {
                this.showError(errorDiv, response.message || 'Failed to send friend request');
            }
        } catch (error) {
            console.error('[HomeWrapper] Error sending friend request:', error);
            this.showError(errorDiv, 'Error sending friend request. Please try again.');
        }
    }

    async acceptFriendRequest(requestId) {
        try {
            const response = await this.makeAjaxRequest('/ajax/friends/accept', {
                method: 'POST',
                data: { id: requestId }
            });
            
            if (response.success) {
                this.showToast('Friend request accepted!', 'success');
                await this.loadPendingRequests();
                this.updatePendingCount();
            } else {
                this.showToast('Failed to accept friend request', 'error');
            }
        } catch (error) {
            console.error('[HomeWrapper] Error accepting friend request:', error);
            this.showToast('Error accepting friend request', 'error');
        }
    }

    async declineFriendRequest(requestId) {
        try {
            const response = await this.makeAjaxRequest('/ajax/friends/decline', {
                method: 'POST',
                data: { id: requestId }
            });
            
            if (response.success) {
                this.showToast('Friend request declined', 'info');
                await this.loadPendingRequests();
                this.updatePendingCount();
            } else {
                this.showToast('Failed to decline friend request', 'error');
            }
        } catch (error) {
            console.error('[HomeWrapper] Error declining friend request:', error);
            this.showToast('Error declining friend request', 'error');
        }
    }

    async cancelFriendRequest(userId) {
        try {
            const response = await this.makeAjaxRequest('/ajax/friends/cancel', {
                method: 'POST',
                data: { user_id: userId }
            });
            
            if (response.success) {
                this.showToast('Friend request cancelled', 'info');
                await this.loadPendingRequests();
            } else {
                this.showToast('Failed to cancel friend request', 'error');
            }
        } catch (error) {
            console.error('[HomeWrapper] Error cancelling friend request:', error);
            this.showToast('Error cancelling friend request', 'error');
        }
    }

    async createDirectMessage(friendId) {
        try {
            const response = await this.makeAjaxRequest('/ajax/chat/create-dm', {
                method: 'POST',
                data: { friend_id: friendId }
            });
            
            if (response.success && response.data) {
                const roomId = response.data.room_id || response.data.channel_id;
                if (roomId) {
                    window.location.href = `/home/channels/dm/${roomId}`;
                } else {
                    this.showToast('Failed to create conversation: Invalid room ID', 'error');
                }
            } else {
                this.showToast('Failed to create conversation: ' + (response.message || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('[HomeWrapper] Error creating direct message:', error);
            this.showToast('Failed to create conversation. Please try again.', 'error');
        }
    }

    async openDirectMessage(friendId, chatRoomId) {
        if (chatRoomId) {
            window.location.href = `/home/channels/dm/${chatRoomId}`;
        } else {
            await this.createDirectMessage(friendId);
        }
    }

    openNewDirectMessageModal() {
        const modal = document.getElementById('new-direct-modal');
        if (modal) {
            modal.classList.remove('hidden');
            this.loadFriendsForDM();
        }
    }

    async loadFriendsForDM() {
        const friendsList = document.getElementById('dm-friends-list');
        if (!friendsList) return;
        
        friendsList.innerHTML = this.generateSkeletonItems(5);
        
        try {
            const response = await this.makeAjaxRequest('/ajax/friends/all');
            
            if (response.success && response.data.friends) {
                this.renderDMFriends(friendsList, response.data.friends);
            } else {
                this.renderNoDMFriends(friendsList);
            }
        } catch (error) {
            console.error('[HomeWrapper] Error loading friends for DM:', error);
            friendsList.innerHTML = '<div class="text-gray-400 text-center py-2">Failed to load friends</div>';
        }
    }

    renderDMFriends(container, friends) {
        if (friends.length === 0) {
            this.renderNoDMFriends(container);
            return;
        }
        
        container.innerHTML = '';
        
        friends.forEach(friend => {
            const statusColor = this.getStatusColor('offline');
            
            const friendItem = document.createElement('div');
            friendItem.className = 'dm-friend-item flex items-center p-2 rounded hover:bg-discord-dark cursor-pointer';
            friendItem.setAttribute('data-username', friend.username);
            friendItem.setAttribute('data-user-id', friend.id);
            
            friendItem.innerHTML = `
                <div class="relative mr-3">
                    <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                        <img src="${friend.avatar_url || '/public/assets/common/default-profile-picture.png'}" 
                             alt="Avatar" class="w-full h-full object-cover">
                    </div>
                    <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-darker ${statusColor}"></span>
                </div>
                <span class="font-medium text-white">${this.escapeHtml(friend.username)}</span>
            `;
            
            friendItem.addEventListener('click', () => {
                this.selectFriendForDM(friendItem);
            });
            
            container.appendChild(friendItem);
        });
    }

    renderNoDMFriends(container) {
        container.innerHTML = '<div class="text-gray-400 text-center py-2">No friends available</div>';
    }

    selectFriendForDM(element) {
        const createButton = document.getElementById('create-new-direct');
        const allFriends = document.querySelectorAll('.dm-friend-item');
        
        allFriends.forEach(friend => {
            friend.classList.remove('bg-discord-light');
            friend.classList.add('hover:bg-discord-dark');
        });
        
        element.classList.add('bg-discord-light');
        element.classList.remove('hover:bg-discord-dark');
        
        if (createButton) {
            createButton.disabled = false;
            createButton.classList.remove('opacity-50', 'cursor-not-allowed');
            
            createButton.onclick = () => {
                const userId = element.getAttribute('data-user-id');
                this.createDirectMessage(userId);
            };
        }
    }

    startStatusUpdates() {
        this.updateFriendStatus();
        this.statusUpdateInterval = setInterval(() => {
            this.updateFriendStatus();
        }, 30000);
        
        if (window.globalSocketManager && window.globalSocketManager.io) {
            window.globalSocketManager.io.on('user-presence-update', () => {
                this.updateFriendStatus();
            });
        }
    }

    async updateFriendStatus() {
        const onlineUsers = await this.getOnlineUsers();
        
        const statusIndicators = document.querySelectorAll('.friend-status-indicator');
        const statusTexts = document.querySelectorAll('.friend-status-text');
        let onlineCount = 0;
        
        const allFriendItems = document.querySelectorAll('.friend-item');
        allFriendItems.forEach(item => {
            item.style.display = 'flex';
        });
        
        statusIndicators.forEach(indicator => {
            const userId = indicator.getAttribute('data-user-id');
            
            if (onlineUsers[userId]) {
                onlineCount++;
                const status = onlineUsers[userId].status || 'online';
                const statusColor = this.getStatusColor(status);
                
                indicator.className = `absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-background ${statusColor}`;
                
                const statusText = document.querySelector(`.friend-status-text[data-user-id="${userId}"]`);
                if (statusText) {
                    statusText.textContent = this.getStatusText(status);
                }
            } else {
                indicator.className = 'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-background bg-gray-500';
                
                const statusText = document.querySelector(`.friend-status-text[data-user-id="${userId}"]`);
                if (statusText) {
                    statusText.textContent = 'Offline';
                }
                
                const friendItem = document.querySelector(`.friend-item[data-user-id="${userId}"]`);
                if (friendItem && this.currentTab === 'online') {
                    friendItem.style.display = 'none';
                }
            }
        });
        
        const onlineCountEl = document.getElementById('online-count');
        if (onlineCountEl) {
            onlineCountEl.textContent = onlineCount;
        }
    }

    async getOnlineUsers() {
        try {
            if (window.ChatAPI && typeof window.ChatAPI.getOnlineUsers === 'function') {
                return await window.ChatAPI.getOnlineUsers();
            }
        } catch (error) {
            console.error('[HomeWrapper] Error getting online users:', error);
        }
        return {};
    }

    async updatePendingCount() {
        try {
            const response = await this.makeAjaxRequest('/ajax/friends/pending-count');
            if (response.success && typeof response.data.count === 'number') {
                this.updatePendingBadge(response.data.count);
            }
        } catch (error) {
            console.error('[HomeWrapper] Error updating pending count:', error);
        }
    }

    updatePendingBadge(count) {
        const pendingTabs = document.querySelectorAll('[data-tab="pending"]');
        pendingTabs.forEach(tab => {
            let badge = tab.querySelector('.pending-badge');
            if (count > 0) {
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'pending-badge bg-discord-red text-white text-xs rounded-full px-1.5 py-0.5 ml-1';
                    tab.appendChild(badge);
                }
                badge.textContent = count;
            } else if (badge) {
                badge.remove();
            }
        });
    }

    handleSearch(query, inputElement) {
        const container = inputElement.closest('.tab-content') || inputElement.closest('[id$="-tab"]');
        if (!container) return;
        
        const items = container.querySelectorAll('.friend-item, .dm-friend-item');
        const searchQuery = query.toLowerCase();
        
        items.forEach(item => {
            const username = item.dataset.username || item.querySelector('.friend-name')?.textContent || '';
            const matches = username.toLowerCase().includes(searchQuery);
            item.style.display = matches ? 'flex' : 'none';
        });
    }

    async makeAjaxRequest(url, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        };
        
        const finalOptions = { ...defaultOptions, ...options };
        
        if (window.ajax) {
            return new Promise((resolve, reject) => {
                window.ajax({
                    url,
                    method: finalOptions.method,
                    data: finalOptions.data,
                    headers: finalOptions.headers,
                    success: resolve,
                    error: reject
                });
            });
        } else {
            throw new Error('Ajax function not available');
        }
    }

    getStatusColor(status) {
        switch (status) {
            case 'online':
            case 'appear':
                return 'bg-discord-green';
            case 'idle':
            case 'away':
                return 'bg-discord-yellow';
            case 'dnd':
            case 'do_not_disturb':
                return 'bg-discord-red';
            case 'invisible':
            case 'offline':
            default:
                return 'bg-gray-500';
        }
    }

    getStatusText(status) {
        switch (status) {
            case 'online':
            case 'appear':
                return 'Online';
            case 'idle':
            case 'away':
                return 'Away';
            case 'dnd':
            case 'do_not_disturb':
                return 'Do Not Disturb';
            case 'invisible':
                return 'Invisible';
            case 'offline':
            default:
                return 'Offline';
        }
    }

    generateSkeletonFriends(count) {
        let html = '';
        for (let i = 0; i < count; i++) {
            html += `
                <div class="skeleton-item flex justify-between items-center p-2">
                    <div class="flex items-center">
                        <div class="skeleton skeleton-avatar mr-3"></div>
                        <div>
                            <div class="skeleton skeleton-text mb-1"></div>
                            <div class="skeleton skeleton-text-sm"></div>
                        </div>
                    </div>
                    <div class="flex space-x-2">
                        <div class="skeleton w-8 h-8 rounded-full"></div>
                        <div class="skeleton w-8 h-8 rounded-full"></div>
                    </div>
                </div>
            `;
        }
        return html;
    }

    generateSkeletonPending() {
        let html = '';
        for (let i = 0; i < 3; i++) {
            html += `
                <div class="skeleton-item flex justify-between items-center p-3 bg-discord-dark rounded">
                    <div class="flex items-center">
                        <div class="skeleton skeleton-avatar mr-3"></div>
                        <div>
                            <div class="skeleton skeleton-text mb-1"></div>
                            <div class="skeleton skeleton-text-sm"></div>
                        </div>
                    </div>
                    <div class="flex space-x-2">
                        <div class="skeleton w-16 h-8 rounded"></div>
                        <div class="skeleton w-16 h-8 rounded"></div>
                    </div>
                </div>
            `;
        }
        return html;
    }

    generateSkeletonItems(count) {
        let html = '';
        for (let i = 0; i < count; i++) {
            html += `
                <div class="skeleton-item flex items-center">
                    <div class="skeleton skeleton-avatar mr-3"></div>
                    <div class="flex-1">
                        <div class="skeleton skeleton-text"></div>
                    </div>
                </div>
            `;
        }
        return html;
    }

    clearMessages(errorDiv, successDiv) {
        if (errorDiv) {
            errorDiv.classList.add('hidden');
            errorDiv.textContent = '';
        }
        if (successDiv) {
            successDiv.classList.add('hidden');
            successDiv.textContent = '';
        }
    }

    showError(errorDiv, message) {
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.remove('hidden');
        }
    }

    showSuccess(successDiv, message) {
        if (successDiv) {
            successDiv.textContent = message;
            successDiv.classList.remove('hidden');
        }
    }

    updateSendButton(disabled) {
        const sendButton = document.getElementById('send-friend-request');
        if (sendButton) {
            sendButton.disabled = disabled;
            sendButton.classList.toggle('opacity-50', disabled);
            sendButton.classList.toggle('cursor-not-allowed', disabled);
        }
    }

    showToast(message, type = 'info') {
        if (window.showToast) {
            window.showToast(message, type);
        } else {
            console.log(`[Toast ${type.toUpperCase()}] ${message}`);
        }
    }

    showTooltip(element, text) {
        // Tooltip implementation
    }

    hideTooltip() {
        // Hide tooltip implementation
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    destroy() {
        if (this.statusUpdateInterval) {
            clearInterval(this.statusUpdateInterval);
        }
        
        if (window.globalSocketManager && window.globalSocketManager.io) {
            window.globalSocketManager.io.off('user-presence-update');
        }
        
        this.initialized = false;
        console.log('[HomeWrapper] Home wrapper destroyed');
    }
}

let homeWrapper;

document.addEventListener('DOMContentLoaded', function() {
    const currentPath = window.location.pathname;
    const isHomePage = currentPath === '/home' || currentPath === '/home/' || currentPath.startsWith('/home/friends');
    
    if (isHomePage) {
        console.log('[HomeWrapper] Initializing for home page');
        homeWrapper = new HomeWrapper();
        window.homeWrapper = homeWrapper;
    }
});

window.addEventListener('beforeunload', function() {
    if (homeWrapper) {
        homeWrapper.destroy();
    }
});

export default HomeWrapper;
