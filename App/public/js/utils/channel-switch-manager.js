class SimpleChannelSwitcher {
    constructor() {
        if (window.simpleChannelSwitcher) {
            return window.simpleChannelSwitcher;
        }
        
        this.currentChannelId = null;
        this.currentChannelType = 'text';
        this.isLoading = false;
        
        window.simpleChannelSwitcher = this;
        this.init();
        
        console.log('[SimpleChannelSwitcher] Initialized - ONLY handles section switching');
    }
    
    init() {
        this.setupChannelClicks();
        this.initFromURL();
    }
    
    setupChannelClicks() {
        document.addEventListener('click', (e) => {
            const channelItem = e.target.closest('.channel-item');
            if (!channelItem || this.isLoading) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            const channelId = channelItem.getAttribute('data-channel-id');
            const channelType = channelItem.getAttribute('data-channel-type') || 'text';
            
            if (channelId) {
                this.switchToChannel(channelId, channelType);
            }
        });
        
        console.log('[SimpleChannelSwitcher] Channel click handler setup');
    }
    
    switchToChannel(channelId, channelType = 'text') {
        if (this.isLoading || this.currentChannelId === channelId) return;
        
        console.log('[SimpleChannelSwitcher] Switching to:', channelId, channelType);
        
        this.isLoading = true;
        this.currentChannelId = channelId;
        this.currentChannelType = channelType;
        
        this.updateActiveChannel(channelId);
        this.showSection(channelType);
        this.updateURL(channelId, channelType);
        
        if (channelType === 'text' && window.chatSection) {
            window.chatSection.switchToChannel(channelId, channelType);
        }
        
        this.isLoading = false;
    }
    
    updateActiveChannel(channelId) {
        document.querySelectorAll('.channel-item').forEach(item => {
            item.classList.remove('active-channel');
        });
        
        const activeChannel = document.querySelector(`[data-channel-id="${channelId}"]`);
        if (activeChannel) {
            activeChannel.classList.add('active-channel');
        }
    }
    
    showSection(channelType) {
        const chatSection = document.querySelector('.chat-section');
        const voiceSection = document.querySelector('.voice-section');
        
        if (channelType === 'voice') {
            if (chatSection) chatSection.style.display = 'none';
            if (voiceSection) voiceSection.style.display = 'flex';
        } else {
            if (voiceSection) voiceSection.style.display = 'none';
            if (chatSection) chatSection.style.display = 'flex';
        }
    }
    
    updateURL(channelId, channelType) {
        const serverId = this.getServerIdFromURL();
        const newURL = `/server/${serverId}?channel=${channelId}${channelType === 'voice' ? '&type=voice' : ''}`;
        window.history.pushState({ channelId, channelType }, '', newURL);
    }
    
    getServerIdFromURL() {
        const match = window.location.pathname.match(/\/server\/(\d+)/);
        return match ? match[1] : null;
    }
    
    initFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const channelId = urlParams.get('channel');
        const channelType = urlParams.get('type') || 'text';
        
        if (channelId) {
            setTimeout(() => {
                this.switchToChannel(channelId, channelType);
            }, 100);
        }
    }
}

window.SimpleChannelSwitcher = SimpleChannelSwitcher;

function initSimpleChannelSwitcher() {
    if (window.location.pathname.includes('/server/') && !window.simpleChannelSwitcher) {
        new SimpleChannelSwitcher();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSimpleChannelSwitcher);
} else {
    initSimpleChannelSwitcher();
}

window.ChannelSwitchManager = SimpleChannelSwitcher; 