class NavigationManager {
    constructor() {
        this.isNavigating = false;
        this.lastNavigationTime = 0;
        this.navigationDelay = 300;
        this.currentPageType = null;
        this.currentServerId = null;
        this.currentChannelId = null;
        this.skeletonStartTime = 0;
        this.minSkeletonTime = 800;
    }

    async navigateToHome(pageType = 'friends') {
        if (!this.canNavigate()) return false;
        
        this.startNavigation();
        this.showLoadingIndicator('home');
        
        try {
            await this.performNavigation({
                type: 'home',
                url: '/home/layout',
                pageType: pageType,
                onSuccess: (html) => this.handleHomeSuccess(html, pageType),
                onCleanup: () => this.cleanupForHome()
            });
            return true;
        } catch (error) {
            console.error('[Navigation] Home navigation failed:', error);
            return false;
        } finally {
            this.endNavigation();
            this.hideLoadingIndicator('home');
        }
    }

    async getDefaultChannelForServer(serverId) {
        try {
            const response = await fetch(`/api/servers/${serverId}/channels`);
            const data = await response.json();
            
            if (data.success && data.data && data.data.channels && data.data.channels.length > 0) {
                const textChannel = data.data.channels.find(channel => 
                    channel.type === 'text' || channel.type === 0 || channel.type_name === 'text'
                );
                return textChannel ? textChannel.id : data.data.channels[0].id;
            }
            return null;
        } catch (error) {
            console.error('[Navigation] Error getting default channel:', error);
            return null;
        }
    }

    async navigateToServer(serverId, channelId = null) {
        if (!this.canNavigate() || !serverId) return false;
        
        this.startNavigation();
        this.showLoadingIndicator('server', serverId);
        
        try {
            if (!channelId) {
                console.log('[Navigation] Getting default channel for server:', serverId);
                channelId = await this.getDefaultChannelForServer(serverId);
            }
            
            const url = `/server/${serverId}/layout` + (channelId ? `?channel=${channelId}` : '');
            
            await this.performNavigation({
                type: 'server',
                url: url,
                serverId: serverId,
                channelId: channelId,
                onSuccess: (html) => this.handleServerSuccess(html, serverId, channelId),
                onCleanup: () => this.cleanupForServer()
            });
            return true;
        } catch (error) {
            console.error('[Navigation] Server navigation failed:', error);
            return false;
        } finally {
            this.endNavigation();
            this.hideLoadingIndicator('server', serverId);
        }
    }

    async navigateToExplore() {
        if (!this.canNavigate()) return false;
        
        this.startNavigation();
        this.showLoadingIndicator('explore');
        
        try {
            await this.performNavigation({
                type: 'explore',
                url: '/explore-servers/layout',
                onSuccess: (html) => this.handleExploreSuccess(html),
                onCleanup: () => this.cleanupForExplore()
            });
            return true;
        } catch (error) {
            console.error('[Navigation] Explore navigation failed:', error);
            return false;
        } finally {
            this.endNavigation();
            this.hideLoadingIndicator('explore');
        }
    }

    canNavigate() {
        const currentTime = Date.now();
        const timeSinceLastNav = currentTime - this.lastNavigationTime;
        
        if (this.isNavigating && timeSinceLastNav > 10000) {
            console.warn('[Navigation] Clearing stuck navigation state');
            this.isNavigating = false;
        }
        
        if (this.isNavigating) {
            console.log('[Navigation] Already navigating, blocking request');
            return false;
        }
        
        if (timeSinceLastNav < this.navigationDelay) {
            console.log('[Navigation] Too soon since last navigation, blocking');
            return false;
        }
        
        return true;
    }

    startNavigation() {
        this.isNavigating = true;
        this.lastNavigationTime = Date.now();
        this.skeletonStartTime = Date.now();
        console.log('[Navigation] Navigation started');
    }

    endNavigation() {
        this.isNavigating = false;
        console.log('[Navigation] Navigation ended');
    }

    async performNavigation(config) {
        console.log(`[Navigation] Starting ${config.type} navigation to:`, config.url);
        
        if (config.onCleanup) {
            config.onCleanup();
        }

        this.showSkeleton(config.type);

        try {
            const response = await fetch(config.url, {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                throw new Error(`Navigation failed: ${response.status} ${response.statusText}`);
            }

            const html = await response.text();
            
            await this.ensureMinimumSkeletonTime();
            
            this.hideSkeleton(config.type);
            
            if (config.onSuccess) {
                config.onSuccess(html);
            }
            
            this.updateBrowserState(config);
            this.initializeComponents(config);
            
            return true;
        } catch (error) {
            console.error(`[Navigation] ${config.type} navigation failed:`, error);
            this.hideSkeleton(config.type);
            return false;
        }
    }

    showSkeleton(type) {
        const mainContainer = document.querySelector('#app-container .flex.flex-1.overflow-hidden');
        if (!mainContainer) return;

        const skeletonHTML = this.getSkeletonHTML(type);
        mainContainer.innerHTML = skeletonHTML;
        mainContainer.setAttribute('data-skeleton', type);
    }

    hideSkeleton(type) {
        const mainContainer = document.querySelector('#app-container .flex.flex-1.overflow-hidden');
        if (mainContainer) {
            mainContainer.removeAttribute('data-skeleton');
        }
    }

    getSkeletonHTML(type) {
        if (type === 'server') {
            return `
                <div class="flex h-full animate-pulse">
                    <div class="w-60 bg-gray-800 p-4">
                        <div class="h-4 bg-gray-700 rounded mb-4"></div>
                        <div class="space-y-3">
                            <div class="h-3 bg-gray-700 rounded"></div>
                            <div class="h-3 bg-gray-700 rounded"></div>
                            <div class="h-3 bg-gray-700 rounded"></div>
                        </div>
                    </div>
                    <div class="flex-1 bg-gray-900 p-4">
                        <div class="h-6 bg-gray-800 rounded mb-4"></div>
                        <div class="space-y-3">
                            <div class="h-4 bg-gray-800 rounded"></div>
                            <div class="h-4 bg-gray-800 rounded w-3/4"></div>
                            <div class="h-4 bg-gray-800 rounded w-1/2"></div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="flex h-full animate-pulse">
                    <div class="w-60 bg-gray-800 p-4">
                        <div class="h-4 bg-gray-700 rounded mb-4"></div>
                        <div class="space-y-2">
                            <div class="h-3 bg-gray-700 rounded"></div>
                            <div class="h-3 bg-gray-700 rounded"></div>
                        </div>
                    </div>
                    <div class="flex-1 bg-gray-900 p-4">
                        <div class="h-8 bg-gray-800 rounded mb-4"></div>
                        <div class="grid grid-cols-3 gap-4">
                            <div class="h-32 bg-gray-800 rounded"></div>
                            <div class="h-32 bg-gray-800 rounded"></div>
                            <div class="h-32 bg-gray-800 rounded"></div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    async ensureMinimumSkeletonTime() {
        const elapsed = Date.now() - this.skeletonStartTime;
        const remaining = Math.max(0, this.minSkeletonTime - elapsed);
        
        if (remaining > 0) {
            await new Promise(resolve => setTimeout(resolve, remaining));
        }
    }

    handleHomeSuccess(html, pageType) {
        const mainContainer = document.querySelector('#app-container .flex.flex-1.overflow-hidden');
        if (mainContainer) {
            mainContainer.innerHTML = html;
            this.currentPageType = 'home';
            this.currentServerId = null;
            this.currentChannelId = null;
        }
    }

    handleServerSuccess(html, serverId, channelId) {
        const mainContainer = document.querySelector('#app-container .flex.flex-1.overflow-hidden');
        if (mainContainer) {
            mainContainer.innerHTML = html;
            this.currentPageType = 'server';
            this.currentServerId = serverId;
            this.currentChannelId = channelId;
        }
    }

    handleExploreSuccess(html) {
        const mainContainer = document.querySelector('#app-container .flex.flex-1.overflow-hidden');
        if (mainContainer) {
            mainContainer.innerHTML = html;
            this.currentPageType = 'explore';
            this.currentServerId = null;
            this.currentChannelId = null;
        }
    }

    updateBrowserState(config) {
        let url, title;
        
        switch (config.type) {
            case 'home':
                url = '/home';
                title = 'misvord - Home';
                break;
            case 'server':
                url = `/server/${config.serverId}`;
                if (config.channelId) {
                    url += `?channel=${config.channelId}`;
                }
                title = `Server ${config.serverId} - misvord`;
                break;
            case 'explore':
                url = '/explore-servers';
                title = 'Explore Servers - misvord';
                break;
        }
        
        if (url && title) {
            history.pushState(
                { type: config.type, serverId: config.serverId, channelId: config.channelId },
                title,
                url
            );
        }
    }

    cleanupForHome() {
        this.cleanupVoiceConnections();
        this.cleanupSocketConnections();
        this.cleanupComponents();
    }

    cleanupForServer() {
        this.cleanupSocketConnections();
        this.cleanupComponents();
    }

    cleanupForExplore() {
        this.cleanupVoiceConnections();
        this.cleanupSocketConnections();
        this.cleanupComponents();
    }

    cleanupVoiceConnections() {
        if (window.voiceManager && window.voiceManager.isConnected) {
            console.log('[Navigation] Preserving voice connection during navigation');
            if (window.globalVoiceIndicator) {
                setTimeout(() => {
                    window.globalVoiceIndicator.ensureIndicatorVisible();
                }, 300);
            }
        }
    }

    cleanupSocketConnections() {
        if (this.currentChannelId && window.globalSocketManager) {
            console.log('[Navigation] Leaving current channel socket:', this.currentChannelId);
            window.globalSocketManager.leaveChannel(this.currentChannelId);
        }
    }

    cleanupComponents() {
        console.log('[Navigation] Cleaning up components');
        
        if (window.simpleChannelSwitcher) {
            window.simpleChannelSwitcher = null;
        }
        
        if (window.chatSection && typeof window.chatSection.cleanup === 'function') {
            console.log('[Navigation] Cleaning up existing chat section');
            window.chatSection.cleanup();
            window.chatSection = null;
        }
        
        console.log('[Navigation] Component cleanup completed');
    }

    initializeComponents(config) {
        setTimeout(() => {
            switch (config.type) {
                case 'home':
                    this.initializeHomeComponents();
                    break;
                case 'server':
                    this.initializeServerComponents(config.serverId, config.channelId);
                    break;
                case 'explore':
                    this.initializeExploreComponents();
                    break;
            }
        }, 100);
    }

    initializeHomeComponents() {
        console.log('[Navigation] Initializing home components');
        
        if (typeof window.initHomePage === 'function') {
            window.initHomePage();
        }
        
        if (typeof window.initFriendsTabManager === 'function') {
            window.initFriendsTabManager();
        }
        
        if (typeof window.initDirectMessageNavigation === 'function') {
            window.initDirectMessageNavigation();
        }
        
        if (typeof window.updateActiveServer === 'function') {
            window.updateActiveServer('home');
        }
        
        document.dispatchEvent(new CustomEvent('HomePageChanged', {
            detail: { pageType: 'friends' }
        }));
    }

    initializeServerComponents(serverId, channelId) {
        console.log('[Navigation] Initializing server components:', { serverId, channelId });
        
        this.cleanupComponents();
        
        setTimeout(() => {
            if (window.SimpleChannelSwitcher) {
                if (!window.simpleChannelSwitcher) {
                    new window.SimpleChannelSwitcher();
                    console.log('[Navigation] SimpleChannelSwitcher created successfully');
                } else {
                    console.log('[Navigation] SimpleChannelSwitcher already exists');
                }
            }
            
            console.log('[Navigation] Chat section initialization is handled by SimpleChannelSwitcher');
            
            if (typeof window.updateActiveServer === 'function') {
                window.updateActiveServer('server', serverId);
            }
            
            document.dispatchEvent(new CustomEvent('ServerPageChanged', {
                detail: { serverId, channelId }
            }));
            
            console.log('[Navigation] Server components initialized');
        }, 200);
    }

    initializeExploreComponents() {
        console.log('[Navigation] Initializing explore components');
        
        if (typeof window.updateActiveServer === 'function') {
            window.updateActiveServer('explore');
        }
        
        document.dispatchEvent(new CustomEvent('ExplorePageChanged'));
    }

    showLoadingIndicator(type, id = null) {
        switch (type) {
            case 'home':
                this.showHomeLoadingIndicator();
                break;
            case 'server':
                this.showServerLoadingIndicator(id);
                break;
            case 'explore':
                this.showExploreLoadingIndicator();
                break;
        }
    }

    hideLoadingIndicator(type, id = null) {
        switch (type) {
            case 'home':
                this.hideHomeLoadingIndicator();
                break;
            case 'server':
                this.hideServerLoadingIndicator(id);
                break;
            case 'explore':
                this.hideExploreLoadingIndicator();
                break;
        }
    }

    showHomeLoadingIndicator() {
        const homeButton = document.querySelector('.discord-home-server-button');
        if (homeButton) {
            this.addLoadingOverlay(homeButton);
        }
    }

    hideHomeLoadingIndicator() {
        const homeButton = document.querySelector('.discord-home-server-button');
        if (homeButton) {
            this.removeLoadingOverlay(homeButton);
        }
    }

    showServerLoadingIndicator(serverId) {
        const serverIcon = document.querySelector(`a[data-server-id="${serverId}"]`)?.closest('.server-icon');
        if (serverIcon) {
            const serverButton = serverIcon.querySelector('.server-button');
            if (serverButton) {
                this.addLoadingOverlay(serverButton);
            }
        }
    }

    hideServerLoadingIndicator(serverId) {
        const serverIcon = document.querySelector(`a[data-server-id="${serverId}"]`)?.closest('.server-icon');
        if (serverIcon) {
            const serverButton = serverIcon.querySelector('.server-button');
            if (serverButton) {
                this.removeLoadingOverlay(serverButton);
            }
        }
    }

    showExploreLoadingIndicator() {
        const exploreButton = document.querySelector('.discord-explore-server-button');
        if (exploreButton) {
            this.addLoadingOverlay(exploreButton);
        }
    }

    hideExploreLoadingIndicator() {
        const exploreButton = document.querySelector('.discord-explore-server-button');
        if (exploreButton) {
            this.removeLoadingOverlay(exploreButton);
        }
    }

    addLoadingOverlay(button) {
        let overlay = button.querySelector('.server-loading-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'server-loading-overlay';
            overlay.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            button.appendChild(overlay);
        }
        overlay.style.display = 'flex';
        button.style.opacity = '0.7';
    }

    removeLoadingOverlay(button) {
        const overlay = button.querySelector('.server-loading-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
        button.style.opacity = '1';
    }
}

window.navigationManager = new NavigationManager();
window.NavigationManager = NavigationManager;

export { NavigationManager };
export default NavigationManager; 