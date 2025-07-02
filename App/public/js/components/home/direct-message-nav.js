class DirectMessageNavigation {
    constructor() {
        console.log('🔄 [DM-NAV] DirectMessageNavigation initialized - delegating to SimpleDMSwitcher');
        this.activeDmId = null;
    }

    init() {
        console.log('🔄 [DM-NAV] DirectMessageNavigation init - SimpleDMSwitcher will handle everything');
        
        if (window.SimpleDMSwitcher) {
            this.dmSwitcher = new window.SimpleDMSwitcher();
        } else {
            console.warn('⚠️ [DM-NAV] SimpleDMSwitcher not available, loading it...');
            this.loadDMSwitcher();
        }
        
        this.setInitialState();
    }
    
    async loadDMSwitcher() {
        try {
            const { default: SimpleDMSwitcher } = await import('/public/js/utils/dm-switch-manager.js');
            window.SimpleDMSwitcher = SimpleDMSwitcher;
            this.dmSwitcher = new SimpleDMSwitcher();
            console.log('✅ [DM-NAV] SimpleDMSwitcher loaded successfully');
        } catch (error) {
            console.error('❌ [DM-NAV] Failed to load SimpleDMSwitcher:', error);
        }
    }

    setInitialState() {
        const currentPath = window.location.pathname;
        const dmMatch = currentPath.match(/\/home\/channels\/dm\/(\d+)/);
        
        if (dmMatch) {
            const dmId = dmMatch[1];
            this.activeDmId = dmId;
            console.log('🎯 [DM-NAV] Initial DM state:', dmId);
        } else if (currentPath.includes('/home/friends')) {
            console.log('🎯 [DM-NAV] Initial friends state');
        }
    }

    switchToFriends() {
        console.log('🔄 [DM-NAV] switchToFriends() called - delegating to SimpleDMSwitcher');
        if (this.dmSwitcher) {
            this.dmSwitcher.switchToFriends();
        } else {
            window.location.href = '/home/friends?tab=online';
        }
    }

    switchToChat(dmId, chatName, roomType) {
        console.log('🔄 [DM-NAV] switchToChat() called - delegating to SimpleDMSwitcher');
        if (this.dmSwitcher) {
            this.dmSwitcher.switchToDM(dmId, roomType, chatName);
        } else {
            window.location.href = `/home/channels/dm/${dmId}`;
        }
    }

    updateActiveDmDisplay() {
        console.log('🔄 [DM-NAV] updateActiveDmDisplay() called - SimpleDMSwitcher handles this');
        if (this.dmSwitcher && this.activeDmId) {
            this.dmSwitcher.highlightActiveDM(this.activeDmId);
        }
    }

    clearActiveDm() {
        console.log('🔄 [DM-NAV] clearActiveDm() called - delegating to SimpleDMSwitcher');
        this.activeDmId = null;
        if (this.dmSwitcher) {
            this.dmSwitcher.clearActiveDM();
        }
    }
}

let directMessageNavigation;

function initDirectMessageNavigation() {
    if (document.querySelector('.dm-friend-item') || document.querySelector('#new-direct-message-btn')) {
        directMessageNavigation = new DirectMessageNavigation();
        directMessageNavigation.init();
        window.directMessageNavigation = directMessageNavigation;
        console.log('✅ [DM-NAV] DirectMessageNavigation initialized');
    }
}

window.initDirectMessageNavigation = initDirectMessageNavigation;

window.addEventListener('popstate', (event) => {
    console.log('🔄 [DM-NAV] Popstate event - reloading page for proper state');
    window.location.reload();
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDirectMessageNavigation);
} else {
    initDirectMessageNavigation();
}

export { DirectMessageNavigation, initDirectMessageNavigation }; 