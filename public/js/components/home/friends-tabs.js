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
                e.preventDefault();
                e.stopPropagation();
                this.toggleMobileMenu();
            }
        });

        document.addEventListener('click', (e) => {
            const friendsMenuToggle = document.getElementById('friends-menu-toggle');
            const friendsMobileMenu = document.getElementById('friends-mobile-menu');
            
            if (friendsMenuToggle && friendsMobileMenu && 
                !friendsMenuToggle.contains(e.target) && 
                !friendsMobileMenu.contains(e.target)) {
                this.hideMobileMenu();
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
            
            tab.style.transition = 'all 0.2s ease';
            
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
                    element.style.transition = 'opacity 0.2s ease-in';
                    element.classList.remove('hidden');
                    element.style.opacity = '0';
                    
                    requestAnimationFrame(() => {
                        element.style.opacity = '1';
                    });
                } else {
                    element.style.transition = 'opacity 0.15s ease-out';
                    element.style.opacity = '0';
                    
                    setTimeout(() => {
                        element.classList.add('hidden');
                        element.style.opacity = '';
                        element.style.transition = '';
                    }, 150);
                }
            }
        });
    }

    updateURL(tabName) {
        const newUrl = `/home/friends?tab=${tabName}`;
        history.replaceState(
            { pageType: 'home', contentType: 'friends', tab: tabName }, 
            `MisVord - Friends - ${tabName}`, 
            newUrl
        );
    }

    toggleMobileMenu() {
        const mobileMenu = document.getElementById('friends-mobile-menu');
        const friendsMenuToggle = document.getElementById('friends-menu-toggle');
        
        if (mobileMenu && friendsMenuToggle) {
            const isHidden = mobileMenu.classList.contains('hidden');
            const icon = friendsMenuToggle.querySelector('i');
            
            if (isHidden) {
                mobileMenu.classList.remove('hidden');
                mobileMenu.style.transform = 'translateY(-10px)';
                mobileMenu.style.opacity = '0';
                
                requestAnimationFrame(() => {
                    mobileMenu.style.transition = 'transform 0.2s ease-out, opacity 0.2s ease-out';
                    mobileMenu.style.transform = 'translateY(0)';
                    mobileMenu.style.opacity = '1';
                });
                
                if (icon) {
                    icon.classList.remove('fa-chevron-down');
                    icon.classList.add('fa-chevron-up');
                }
            } else {
                mobileMenu.style.transition = 'transform 0.2s ease-in, opacity 0.2s ease-in';
                mobileMenu.style.transform = 'translateY(-10px)';
                mobileMenu.style.opacity = '0';
                
                setTimeout(() => {
                    mobileMenu.classList.add('hidden');
                    mobileMenu.style.transform = '';
                    mobileMenu.style.opacity = '';
                    mobileMenu.style.transition = '';
                }, 200);
                
                if (icon) {
                    icon.classList.remove('fa-chevron-up');
                    icon.classList.add('fa-chevron-down');
                }
            }
        }
    }

    hideMobileMenu() {
        const mobileMenu = document.getElementById('friends-mobile-menu');
        const friendsMenuToggle = document.getElementById('friends-menu-toggle');
        
        if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
            const icon = friendsMenuToggle?.querySelector('i');
            
            mobileMenu.style.transition = 'transform 0.2s ease-in, opacity 0.2s ease-in';
            mobileMenu.style.transform = 'translateY(-10px)';
            mobileMenu.style.opacity = '0';
            
            setTimeout(() => {
                mobileMenu.classList.add('hidden');
                mobileMenu.style.transform = '';
                mobileMenu.style.opacity = '';
                mobileMenu.style.transition = '';
            }, 200);
            
            if (icon) {
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
            }
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