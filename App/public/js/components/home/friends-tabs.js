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
}

let friendsTabManager;

function initFriendsTabManager() {
    if (document.querySelector('.friends-desktop-tabs') || document.querySelector('#friends-mobile-menu')) {
        console.log('[Friends Tabs] Initializing friends tab manager');
        friendsTabManager = new FriendsTabManager();
        window.friendsTabManager = friendsTabManager;
    }
}

window.initFriendsTabManager = initFriendsTabManager;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFriendsTabManager);
} else {
    initFriendsTabManager();
}

export { FriendsTabManager, initFriendsTabManager }; 