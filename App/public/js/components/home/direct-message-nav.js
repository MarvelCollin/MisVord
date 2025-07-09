class DirectMessageNavigation {
    constructor() {

        this.activeDmId = null;
    }

    init() {

        
        this.waitForSimpleDMSwitcher();
        this.setInitialState();
    }
    
    async waitForSimpleDMSwitcher() {
        let attempts = 0;
        const maxAttempts = 50;
        
        while (!window.SimpleDMSwitcher && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (window.SimpleDMSwitcher) {
            this.dmSwitcher = new window.SimpleDMSwitcher();

        } else {
            console.warn('⚠️ [DM-NAV] SimpleDMSwitcher not available after waiting, trying dynamic import...');
            await this.loadDMSwitcher();
        }
    }
    
    async loadDMSwitcher() {
        try {
            const { default: SimpleDMSwitcher } = await import('/public/js/utils/dm-switch-manager.js');
            window.SimpleDMSwitcher = SimpleDMSwitcher;
            this.dmSwitcher = new SimpleDMSwitcher();

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

        } else if (currentPath.includes('/home/friends')) {

        }
    }

    switchToFriends() {

        if (this.dmSwitcher) {
            this.dmSwitcher.switchToFriends();
        } else {
            window.location.href = '/home/friends?tab=online';
        }
    }

    switchToChat(dmId, chatName, roomType) {
        console.log('🔄 [DM-NAV] switchToChat called:', {
            dmId, 
            chatName, 
            roomType,
            hasDmSwitcher: !!this.dmSwitcher
        });

        if (this.dmSwitcher) {
            this.dmSwitcher.switchToDM(dmId, roomType, chatName);
        } else {
            window.location.href = `/home/channels/dm/${dmId}`;
        }
    }

    updateActiveDmDisplay() {

        if (this.dmSwitcher && this.activeDmId) {
            this.dmSwitcher.highlightActiveDM(this.activeDmId);
        }
    }

    clearActiveDm() {

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

    }
}

window.initDirectMessageNavigation = initDirectMessageNavigation;

window.addEventListener('popstate', (event) => {

    window.location.reload();
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDirectMessageNavigation);
} else {
    initDirectMessageNavigation();
}

export { DirectMessageNavigation, initDirectMessageNavigation }; 