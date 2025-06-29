class HomeWrapper {
    constructor() {
        this.currentTab = 'online';
        this.initialized = false;
        
        this.init();
    }

    async init() {
        if (this.initialized) return;
        
        console.log('[HomeWrapper] Initializing simple home page wrapper');
        
        this.extractInitialData();
        this.setupEventListeners();
        this.initializeComponents();
        
        this.initialized = true;
        console.log('[HomeWrapper] Home wrapper initialized successfully');
    }

    extractInitialData() {
        this.currentTab = this.getActiveTabFromURL();
        
        console.log('[HomeWrapper] Extracted initial data:', {
            currentTab: this.currentTab
        });
    }

    getActiveTabFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab') || 'online';
        return ['online', 'all', 'pending', 'add-friend'].includes(tab) ? tab : 'online';
    }

    setupEventListeners() {
        this.setupTabHandlers();
        this.setupFriendRequestHandlers();
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
        const input = document.getElementById('friend-username-input');
        const sendButton = document.getElementById('send-friend-request');
        
        if (input && sendButton) {
            input.addEventListener('input', () => {
                const isValid = input.value.trim().length > 0;
                sendButton.disabled = !isValid;
                sendButton.classList.toggle('opacity-50', !isValid);
                sendButton.classList.toggle('cursor-not-allowed', !isValid);
            });
            
            sendButton.addEventListener('click', () => {
                this.sendFriendRequest();
            });
        }
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
        const searches = ['online-search', 'all-search', 'pending-search'];
        
        searches.forEach(searchId => {
            const searchInput = document.getElementById(searchId);
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    this.handleSearch(e.target.value, e.target);
                });
            }
        });
    }

    initializeComponents() {
        console.log('[HomeWrapper] Initializing components');
        
        if (this.currentTab !== 'online') {
            this.switchToTab(this.currentTab);
        }
    }

    switchToTab(tabName) {
        console.log('[HomeWrapper] Switching to tab:', tabName);
        
        this.updateTabUI(tabName);
        this.updateURL(tabName);
        this.currentTab = tabName;
        
        if (tabName === 'add-friend') {
            this.focusAddFriendInput();
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
                this.refreshPendingCount();
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
                this.refreshPage();
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
                this.refreshPage();
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
                this.refreshPage();
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

    handleSearch(query, inputElement) {
        const container = inputElement.closest('.tab-content');
        if (!container) return;
        
        const items = container.querySelectorAll('.friend-item');
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
                    dataType: 'json',
                    success: (response) => {
                        if (response && typeof response === 'object' && response.success !== undefined) {
                            resolve(response);
                        } else {
                            resolve({
                                success: true,
                                data: response,
                                message: 'Request completed successfully'
                            });
                        }
                    },
                    error: (error) => {
                        console.error('[HomeWrapper] AJAX Error:', error);
                        reject(new Error(error.message || 'Request failed'));
                    }
                });
            });
        } else {
            throw new Error('Ajax function not available');
        }
    }

    refreshPage() {
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }

    refreshPendingCount() {
        setTimeout(() => {
            window.location.reload();
        }, 500);
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

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    destroy() {
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
        
        window.acceptFriendRequest = (requestId) => homeWrapper.acceptFriendRequest(requestId);
        window.declineFriendRequest = (requestId) => homeWrapper.declineFriendRequest(requestId);
        window.cancelFriendRequest = (userId) => homeWrapper.cancelFriendRequest(userId);
        window.createDirectMessage = (friendId) => homeWrapper.createDirectMessage(friendId);
    }
});

window.addEventListener('beforeunload', function() {
    if (homeWrapper) {
        homeWrapper.destroy();
    }
});

export default HomeWrapper;
