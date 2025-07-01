class FriendsTabManager {
    constructor() {
        this.activeTab = 'online';
        this.initialized = false;
        this.isLoading = false;
    }

    static getInstance() {
        if (!window._friendsTabManager) {
            window._friendsTabManager = new FriendsTabManager();
        }
        return window._friendsTabManager;
    }

    init() {
        if (this.initialized) return;
        
        this.setupEventListeners();
        this.setInitialTab();
        this.initialized = true;
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            const tabButton = e.target.closest('[data-tab]');
            if (tabButton) {
                e.preventDefault();
                const tabName = tabButton.getAttribute('data-tab');
                this.switchTab(tabName);
            }
        });

        document.addEventListener('click', (e) => {
            const mobileToggle = e.target.closest('#friends-menu-toggle');
            if (mobileToggle) {
                this.toggleMobileMenu();
            }
        });
    }

    setInitialTab() {
        const urlParams = new URLSearchParams(window.location.search);
        const urlTab = urlParams.get('tab');
        
        if (urlTab && ['online', 'all', 'pending', 'add-friend'].includes(urlTab)) {
            this.activeTab = urlTab;
        } else {
            this.activeTab = 'online';
        }
        
        this.updateTabDisplay();
        this.updateTabContent();
        this.loadTabData(this.activeTab);
    }

    switchTab(tabName) {
        if (!['online', 'all', 'pending', 'add-friend'].includes(tabName)) {
            return;
        }

        if (this.activeTab === tabName) return;

        this.activeTab = tabName;
        
        this.clearSearchInputs();
        this.updateTabDisplay();
        this.updateTabContent();
        this.updateURL(tabName);
        this.hideMobileMenu();
        
        this.loadTabData(tabName);
    }

    clearSearchInputs() {
        const searchInputs = ['online-search', 'all-search', 'pending-search'];
        searchInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            
            if (input) {
                input.value = '';
            }
        });
        
        if (window.searchFriends) {
            window.searchFriends('online', '');
            window.searchFriends('all', '');
            window.searchFriends('pending', '');
        }
        
        if (window.hideNoResultsMessage) {
            const containers = ['online-friends-container', 'all-friends-container', 'pending-friends-container'];
            containers.forEach(containerId => {
                const container = document.getElementById(containerId);
                if (container) {
                    window.hideNoResultsMessage(container);
                }
            });
        }
    }

    getTabContainers(tabName) {
        const containers = {
            'online': {
                main: document.getElementById('online-friends-container'),
                count: document.getElementById('online-count')
            },
            'all': {
                main: document.getElementById('all-friends-container'),
                count: null
            },
            'pending': {
                main: document.getElementById('pending-friends-container'),
                count: null
            }
        };
        
        return containers[tabName] || { main: null, count: null };
    }

    loadTabData(tabName) {
        console.log(`📊 [FRIENDS-TABS] Loading data for ${tabName} tab`);
        
        switch (tabName) {
            case 'online':
                if (window.loadOnlineFriends) {
                    window.loadOnlineFriends(true);
                } else if (window.checkAndUpdateOnlineTab) {
                    window.checkAndUpdateOnlineTab();
                }
                break;
            case 'all':
                if (window.loadAllFriends) {
                    window.loadAllFriends(true);
                }
                break;
            case 'pending':
                if (window.loadPendingRequests) {
                    window.loadPendingRequests(true);
                }
                break;
        }
    }

    updateTabDisplay() {
        const desktopTabs = document.querySelectorAll('.friends-desktop-tabs [data-tab]');
        const mobileTabs = document.querySelectorAll('#friends-mobile-menu [data-tab]');
        
        [...desktopTabs, ...mobileTabs].forEach(tab => {
            const tabName = tab.getAttribute('data-tab');
            
            if (tabName === this.activeTab) {
                if (tabName === 'add-friend') {
                    tab.className = 'bg-discord-green hover:bg-discord-green/90 text-white px-3 py-1 rounded';
                } else {
                    tab.className = 'text-white bg-discord-primary hover:bg-discord-primary/90 px-3 py-1 rounded';
                }
            } else {
                if (tabName === 'add-friend') {
                    tab.className = 'bg-discord-green hover:bg-discord-green/90 text-white px-3 py-1 rounded';
                } else {
                    tab.className = 'text-gray-300 hover:text-white hover:bg-discord-light px-3 py-1 rounded';
                }
            }
        });
    }

    updateTabContent() {
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
                } else {
                    element.classList.add('hidden');
                }
            }
        });
    }

    updateURL(tabName) {
        const newUrl = `/home/friends?tab=${tabName}`;
        history.replaceState(
            { pageType: 'home', contentType: 'friends', tab: tabName }, 
            `misvord - Friends - ${tabName}`, 
            newUrl
        );
    }

    toggleMobileMenu() {
        const mobileMenu = document.getElementById('friends-mobile-menu');
        if (mobileMenu) {
            mobileMenu.classList.toggle('hidden');
        }
    }

    hideMobileMenu() {
        const mobileMenu = document.getElementById('friends-mobile-menu');
        if (mobileMenu) {
            mobileMenu.classList.add('hidden');
        }
    }
}

window.FriendsTabManager = FriendsTabManager;

function initFriendsTabManager() {
    if (document.querySelector('.friends-desktop-tabs') || document.querySelector('#friends-mobile-menu')) {
        const tabManager = FriendsTabManager.getInstance();
        tabManager.init();
        window.friendsTabManager = tabManager;
        return tabManager;
    }
    return null;
}

window.initFriendsTabManager = initFriendsTabManager;

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('/home')) {
        setTimeout(() => {
            initFriendsTabManager();
        }, 100);
    }
}); 