class FriendsTabManager {
    constructor() {
        this.activeTab = 'online';
        this.init();
    }

    init() {
        console.log('[Friends Tabs] Initializing friends tab manager');
        this.bindTabEvents();
        this.bindMobileToggle();
        this.setInitialTab();
    }

    bindTabEvents() {
        console.log('[Friends Tabs] Binding tab click events');
        
        document.addEventListener('click', (e) => {
            const tabLink = e.target.closest('[data-tab]');
            if (tabLink) {
                console.log('[Friends Tabs] Tab clicked:', tabLink.dataset.tab);
                e.preventDefault();
                e.stopPropagation();
                
                const tabName = tabLink.dataset.tab;
                this.switchTab(tabName);
                return false;
            }
        });
    }

    bindMobileToggle() {
        const mobileToggle = document.getElementById('friends-menu-toggle');
        const mobileMenu = document.getElementById('friends-mobile-menu');
        
        if (mobileToggle && mobileMenu) {
            console.log('[Friends Tabs] Binding mobile menu toggle');
            mobileToggle.addEventListener('click', (e) => {
                e.preventDefault();
                mobileMenu.classList.toggle('hidden');
                console.log('[Friends Tabs] Mobile menu toggled');
            });
        }
    }

    setInitialTab() {
        const urlParams = new URLSearchParams(window.location.search);
        const urlTab = urlParams.get('tab');
        
        if (urlTab && ['online', 'all', 'pending', 'add-friend'].includes(urlTab)) {
            console.log('[Friends Tabs] Setting initial tab from URL:', urlTab);
            this.activeTab = urlTab;
        } else {
            console.log('[Friends Tabs] Using default tab: online');
            this.activeTab = 'online';
        }
        
        this.updateTabDisplay();
    }

    switchTab(tabName) {
        if (!['online', 'all', 'pending', 'add-friend'].includes(tabName)) {
            console.error('[Friends Tabs] Invalid tab name:', tabName);
            return;
        }

        console.log('[Friends Tabs] Switching to tab:', tabName);
        this.activeTab = tabName;
        
        this.updateTabDisplay();
        this.updateTabContent();
        this.updateURL(tabName);
        
        this.hideMobileMenu();
    }

    updateTabDisplay() {
        console.log('[Friends Tabs] Updating tab display for:', this.activeTab);
        
        const desktopTabs = document.querySelectorAll('.friends-desktop-tabs [data-tab]');
        const mobileTabs = document.querySelectorAll('#friends-mobile-menu [data-tab]');
        
        [...desktopTabs, ...mobileTabs].forEach(tab => {
            const tabName = tab.dataset.tab;
            const isActive = tabName === this.activeTab;
            
            tab.classList.remove(
                'text-white', 'bg-discord-primary', 'hover:bg-discord-primary/90',
                'text-gray-300', 'hover:text-white', 'hover:bg-discord-light',
                'bg-discord-green', 'hover:bg-discord-green/90'
            );
            
            if (tabName === 'add-friend') {
                tab.classList.add('bg-discord-green', 'hover:bg-discord-green/90', 'text-white');
            } else if (isActive) {
                tab.classList.add('text-white', 'bg-discord-primary', 'hover:bg-discord-primary/90');
            } else {
                tab.classList.add('text-gray-300', 'hover:text-white', 'hover:bg-discord-light');
            }
        });
    }

    updateTabContent() {
        console.log('[Friends Tabs] Updating tab content visibility');
        
        const tabContents = {
            'online': '#online-tab',
            'all': '#all-tab', 
            'pending': '#pending-tab',
            'add-friend': '#add-friend-tab'
        };
        
        Object.entries(tabContents).forEach(([tabName, selector]) => {
            const element = document.querySelector(selector);
            if (element) {
                if (tabName === this.activeTab) {
                    element.classList.remove('hidden');
                    console.log('[Friends Tabs] Showing tab content:', selector);
                } else {
                    element.classList.add('hidden');
                }
            }
        });
        
        if (this.activeTab === 'all') {
            this.loadAllFriends();
        } else if (this.activeTab === 'pending') {
            this.loadPendingRequests();
        }
    }

    updateURL(tabName) {
        const newUrl = `/home/friends?tab=${tabName}`;
        console.log('[Friends Tabs] Updating URL to:', newUrl);
        
        history.replaceState(
            { pageType: 'home', friendsTab: tabName }, 
            `misvord - Friends - ${tabName}`, 
            newUrl
        );
    }

    hideMobileMenu() {
        const mobileMenu = document.getElementById('friends-mobile-menu');
        if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.add('hidden');
            console.log('[Friends Tabs] Mobile menu hidden');
        }
    }

    loadAllFriends() {
        console.log('[Friends Tabs] Loading all friends data');
        
        if (!window.ajax) {
            console.error('[Friends Tabs] Ajax function not available');
            return;
        }

        window.ajax({
            url: '/api/friends',
            method: 'GET',
            dataType: 'json',
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
            success: (response) => {
                console.log('[Friends Tabs] All friends loaded:', response);
                if (response.success && response.data) {
                    this.renderAllFriends(response.data.friends || []);
                }
            },
            error: (xhr, status, error) => {
                console.error('[Friends Tabs] Error loading all friends:', error);
            }
        });
    }

    loadPendingRequests() {
        console.log('[Friends Tabs] Loading pending requests');
        
        if (!window.ajax) {
            console.error('[Friends Tabs] Ajax function not available');
            return;
        }

        window.ajax({
            url: '/api/friends/pending',
            method: 'GET', 
            dataType: 'json',
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
            success: (response) => {
                console.log('[Friends Tabs] Pending requests loaded:', response);
                if (response.success && response.data) {
                    this.renderPendingRequests(response.data.pending || []);
                }
            },
            error: (xhr, status, error) => {
                console.error('[Friends Tabs] Error loading pending requests:', error);
            }
        });
    }

    renderAllFriends(friends) {
        const container = document.getElementById('all-friends-container');
        if (!container) return;

        console.log('[Friends Tabs] Rendering', friends.length, 'friends');
        
        if (friends.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-400">
                    <p>No friends found</p>
                </div>
            `;
            return;
        }

        container.innerHTML = friends.map(friend => `
            <div class="flex items-center justify-between p-3 rounded hover:bg-discord-light">
                <div class="flex items-center">
                    <img src="${friend.avatar_url || '/public/assets/common/default-profile-picture.png'}" 
                         alt="${friend.username}" class="w-8 h-8 rounded-full mr-3">
                    <div>
                        <p class="text-white font-medium">${friend.username}</p>
                        <p class="text-gray-400 text-sm">${friend.status || 'Offline'}</p>
                    </div>
                </div>
                <div class="flex space-x-2">
                    <button class="text-gray-400 hover:text-white p-2 rounded hover:bg-discord-background">
                        <i class="fas fa-comment"></i>
                    </button>
                    <button class="text-gray-400 hover:text-white p-2 rounded hover:bg-discord-background">
                        <i class="fas fa-user-times"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderPendingRequests(requests) {
        const container = document.getElementById('pending-requests');
        if (!container) return;

        console.log('[Friends Tabs] Rendering', requests.length, 'pending requests');
        
        if (requests.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-400">
                    <p>No pending friend requests</p>
                </div>
            `;
            return;
        }

        container.innerHTML = requests.map(request => `
            <div class="flex items-center justify-between p-3 rounded bg-discord-dark">
                <div class="flex items-center">
                    <img src="${request.avatar_url || '/public/assets/common/default-profile-picture.png'}" 
                         alt="${request.username}" class="w-8 h-8 rounded-full mr-3">
                    <div>
                        <p class="text-white font-medium">${request.username}</p>
                        <p class="text-gray-400 text-sm">Incoming friend request</p>
                    </div>
                </div>
                <div class="flex space-x-2">
                    <button class="bg-discord-green text-white px-3 py-1 rounded text-sm hover:bg-discord-green/90" 
                            onclick="acceptFriendRequest(${request.id})">
                        Accept
                    </button>
                    <button class="bg-discord-red text-white px-3 py-1 rounded text-sm hover:bg-discord-red/90"
                            onclick="declineFriendRequest(${request.id})">
                        Decline
                    </button>
                </div>
            </div>
        `).join('');
    }
}

let friendsTabManager;

function initFriendsTabManager() {
    if (document.querySelector('.friends-desktop-tabs') || document.querySelector('#friends-mobile-menu')) {
        console.log('[Friends Tabs] Initializing friends tab manager');
        friendsTabManager = new FriendsTabManager();
        window.friendsTabManager = friendsTabManager;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFriendsTabManager);
} else {
    initFriendsTabManager();
}

export { FriendsTabManager, initFriendsTabManager }; 