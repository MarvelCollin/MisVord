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
        console.log('[HomeWrapper] Friend request handlers disabled - using app-layout.js instead');
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

    sendFriendRequest() {
        console.log('[HomeWrapper] sendFriendRequest delegated to app-layout.js');
    }

    acceptFriendRequest(requestId) {
        console.log('[HomeWrapper] acceptFriendRequest delegated to app-layout.js');
    }

    declineFriendRequest(requestId) {
        console.log('[HomeWrapper] declineFriendRequest delegated to app-layout.js');
    }

    cancelFriendRequest(userId) {
        console.log('[HomeWrapper] cancelFriendRequest delegated to app-layout.js');
    }

    createDirectMessage(friendId) {
        console.log('[HomeWrapper] createDirectMessage delegated to app-layout.js');
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
        
        console.log('[HomeWrapper] Global friend functions delegated to app-layout.js');
    }
});

window.addEventListener('beforeunload', function() {
    if (homeWrapper) {
        homeWrapper.destroy();
    }
});

export default HomeWrapper;
