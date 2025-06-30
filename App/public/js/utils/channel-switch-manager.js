class ChannelSwitchManager {
    constructor() {
        if (window.channelSwitchManager) {
            console.log('[ChannelSwitchManager] Using existing instance');
            return window.channelSwitchManager;
        }
        
        this.isDestroyed = false;
        this.isLoading = false;
        this.currentChannelId = null;
        this.currentChannelType = null;
        this.currentServerId = null;
        this.isInitialized = false;
        
        window.channelSwitchManager = this;
        this.init();
    }
    
    init() {
        if (this.isDestroyed || this.isInitialized) return;
        
        this.waitForDOM().then(() => {
            this.setupEventHandlers();
            this.injectCSS();
            this.initializeCurrentChannel();
            this.isInitialized = true;
            
            console.log('[ChannelSwitchManager] Initialized successfully');
        }).catch(error => {
            console.error('[ChannelSwitchManager] Initialization failed:', error);
        });
    }
    
    waitForDOM() {
        return new Promise((resolve) => {
            const checkDOM = () => {
                const hasChannels = document.querySelectorAll('.channel-item').length > 0;
                const hasSections = document.querySelector('.chat-section') || document.querySelector('.voice-section');
                
                if (hasChannels && hasSections) {
                    resolve();
                } else {
                    setTimeout(checkDOM, 200);
                }
            };
            checkDOM();
        });
    }
    
    setupEventHandlers() {
        this.removeEventHandlers();
        
        this.clickHandler = (e) => {
            const channelItem = e.target.closest('.channel-item');
            if (!channelItem || this.isLoading || this.isDestroyed) return;
            
            const channelId = channelItem.getAttribute('data-channel-id');
            const channelType = channelItem.getAttribute('data-channel-type') || 'text';
            const serverId = this.getServerIdFromURL();
            
            if (channelId && serverId) {
                e.preventDefault();
                e.stopPropagation();
                this.switchToChannel(serverId, channelId, channelType);
            }
        };
        
        this.popstateHandler = (event) => {
            if (this.isDestroyed) return;
            if (event.state?.channelId) {
                const { serverId, channelId, channelType } = event.state;
                this.switchToChannel(serverId, channelId, channelType || 'text', false);
            }
        };
        
        document.addEventListener('click', this.clickHandler, true);
        window.addEventListener('popstate', this.popstateHandler);
    }
    
    removeEventHandlers() {
        if (this.clickHandler) {
            document.removeEventListener('click', this.clickHandler, true);
            this.clickHandler = null;
        }
        
        if (this.popstateHandler) {
            window.removeEventListener('popstate', this.popstateHandler);
            this.popstateHandler = null;
        }
    }
    
    injectCSS() {
        if (document.getElementById('channel-switch-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'channel-switch-styles';
        style.textContent = `
            .channel-item.switching {
                opacity: 0.7;
                pointer-events: none;
            }
            .channel-item.active-channel {
                background-color: #5865f2;
            }
        `;
        document.head.appendChild(style);
    }
    
    async switchToChannel(serverId, channelId, channelType = 'text', updateHistory = true) {
        if (this.isDestroyed) {
            console.warn('[ChannelSwitchManager] Instance destroyed, ignoring switch request');
            return;
        }
        
        if (this.isLoading) {
            console.log('[ChannelSwitchManager] Already switching, ignoring request');
            return;
        }
        
        if (this.currentChannelId === channelId && this.currentChannelType === channelType) {
            console.log('[ChannelSwitchManager] Already on this channel');
            return;
        }
        
        this.isLoading = true;
        console.log('[ChannelSwitchManager] Switching to channel:', { serverId, channelId, channelType });
        
        try {
            this.updateActiveChannelUI(channelId);
            this.updateSections(channelType);
            await this.initializeChannelSystems(channelId, channelType);
            
            if (updateHistory) {
                this.updateURL(serverId, channelId, channelType);
            }
            
            this.currentChannelId = channelId;
            this.currentChannelType = channelType;
            this.currentServerId = serverId;
            
            console.log('[ChannelSwitchManager] Channel switch completed');
            
        } catch (error) {
            console.error('[ChannelSwitchManager] Error switching channel:', error);
        } finally {
            this.isLoading = false;
        }
    }
    
    updateActiveChannelUI(channelId) {
        document.querySelectorAll('.channel-item').forEach(item => {
            item.classList.remove('active-channel');
        });
        
        const activeChannel = document.querySelector(`[data-channel-id="${channelId}"]`);
        if (activeChannel) {
            activeChannel.classList.add('active-channel');
        }
    }
    
    updateSections(channelType) {
        const chatSection = document.querySelector('.chat-section');
        const voiceSection = document.querySelector('.voice-section');
        
        if (!chatSection && !voiceSection) {
            console.warn('[ChannelSwitchManager] No sections found in DOM');
            return;
        }
        
        if (channelType === 'voice') {
            if (chatSection) {
                chatSection.classList.add('hidden');
                chatSection.style.display = 'none';
            }
            if (voiceSection) {
                voiceSection.classList.remove('hidden');
                voiceSection.style.display = 'flex';
            }
        } else {
            if (voiceSection) {
                voiceSection.classList.add('hidden');
                voiceSection.style.display = 'none';
            }
            if (chatSection) {
                chatSection.classList.remove('hidden');
                chatSection.style.display = 'flex';
            }
        }
    }
    
    async initializeChannelSystems(channelId, channelType) {
        if (channelType === 'voice') {
            this.initializeVoiceSection(channelId);
        } else {
            this.initializeChatSection(channelId);
        }
    }
    
    initializeVoiceSection(channelId) {
        if (window.voiceManager) {
            window.voiceManager.setupVoice(channelId);
        }
        
        if (window.globalVoiceIndicator) {
            window.globalVoiceIndicator.updateVisibility();
        }
    }
    
    initializeChatSection(channelId) {
        if (window.chatSection) {
            if (typeof window.chatSection.switchTarget === 'function') {
                window.chatSection.switchTarget('channel', channelId);
            }
        } else if (typeof window.initializeChatSection === 'function') {
            window.initializeChatSection();
        }
    }
    
    getServerIdFromURL() {
        const match = window.location.pathname.match(/\/server\/(\d+)/);
        return match ? match[1] : null;
    }
    
    updateURL(serverId, channelId, channelType) {
        const newURL = `/server/${serverId}?channel=${channelId}${channelType === 'voice' ? '&type=voice' : ''}`;
        window.history.pushState(
            { serverId, channelId, channelType }, 
            '', 
            newURL
        );
    }
    
    initializeCurrentChannel() {
        const urlParams = new URLSearchParams(window.location.search);
        const channelId = urlParams.get('channel');
        const channelType = urlParams.get('type') || 'text';
        
        if (channelId) {
            this.currentChannelId = channelId;
            this.currentChannelType = channelType;
            this.updateActiveChannelUI(channelId);
            this.updateSections(channelType);
            this.initializeChannelSystems(channelId, channelType);
        } else {
            const firstChannel = document.querySelector('.channel-item[data-channel-type="text"]');
            if (firstChannel) {
                const firstChannelId = firstChannel.getAttribute('data-channel-id');
                const serverId = this.getServerIdFromURL();
                if (firstChannelId && serverId) {
                    setTimeout(() => {
                        this.switchToChannel(serverId, firstChannelId, 'text');
                    }, 100);
                }
            }
        }
    }
    
    cleanup() {
        console.log('[ChannelSwitchManager] Cleaning up');
        
        this.isDestroyed = true;
        this.isLoading = false;
        
        this.removeEventHandlers();
        
        document.querySelectorAll('.channel-item').forEach(item => {
            item.classList.remove('switching', 'active-channel');
        });
        
        const styles = document.getElementById('channel-switch-styles');
        if (styles) {
            styles.remove();
        }
        
        console.log('[ChannelSwitchManager] Cleanup completed');
    }
    
    static getInstance() {
        if (!window.channelSwitchManager && window.location.pathname.includes('/server/')) {
            return new ChannelSwitchManager();
        }
        return window.channelSwitchManager;
    }
}

window.ChannelSwitchManager = ChannelSwitchManager;

function ensureChannelSwitchManager() {
    if (window.location.pathname.includes('/server/') && !window.channelSwitchManager) {
        new ChannelSwitchManager();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureChannelSwitchManager);
} else {
    ensureChannelSwitchManager();
}

window.addEventListener('load', () => {
    setTimeout(ensureChannelSwitchManager, 100);
}); 