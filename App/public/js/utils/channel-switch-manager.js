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
    }
    
    init() {
        this.setupChannelClicks();
        this.initFromURL();
    }
    
    setupChannelClicks() {
        document.addEventListener('click', (e) => {
            const channelItem = e.target.closest('.channel-item');
            if (!channelItem) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            if (this.isLoading) return;
            
            const channelId = channelItem.getAttribute('data-channel-id');
            let channelType = channelItem.getAttribute('data-channel-type') || 'text';
            
            if (channelItem.querySelector('.fa-volume-up, .fa-volume-high, .fa-microphone')) {
                channelType = 'voice';
            }
            
            if (channelId) {
                this.switchToChannel(channelId, channelType, true);
            }
        });
    }
    
    async switchToChannel(channelId, channelType = 'text', forceFresh = false) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showChannelSwitchLoading(channelId);
        
        try {
            this.currentChannelId = channelId;
            this.currentChannelType = channelType;
            
            this.updateActiveChannel(channelId);
            this.showSection(channelType, channelId);
            this.updateURL(channelId, channelType);
            this.updateMetaTags(channelId, channelType);
            this.updateChannelHeader(channelId, channelType);
            
            if (channelType === 'text') {
                await this.initializeTextChannel(channelId, forceFresh);
            } else if (channelType === 'voice') {
                await this.initializeVoiceChannel(channelId, forceFresh);
            }
        } finally {
            this.hideChannelSwitchLoading(channelId);
            this.isLoading = false;
        }
    }
    
    showChannelSwitchLoading(channelId) {
        const channelItem = document.querySelector(`[data-channel-id="${channelId}"]`);
        if (channelItem) {
            channelItem.classList.add('switching');
            
            let loadingIndicator = channelItem.querySelector('.channel-switch-indicator');
            if (!loadingIndicator) {
                loadingIndicator = document.createElement('span');
                loadingIndicator.className = 'channel-switch-indicator';
                channelItem.appendChild(loadingIndicator);
            }
        }
    }
    
    hideChannelSwitchLoading(channelId) {
        const channelItem = document.querySelector(`[data-channel-id="${channelId}"]`);
        if (channelItem) {
            channelItem.classList.remove('switching');
            const loadingIndicator = channelItem.querySelector('.channel-switch-indicator');
            if (loadingIndicator) {
                loadingIndicator.remove();
            }
        }
    }
    
    async initializeTextChannel(channelId, forceFresh = false) {
        if (window.chatSection) {
            await window.chatSection.resetForNewChannel();
            await window.chatSection.switchToChannel(channelId, 'text', forceFresh);
        } else {
            setTimeout(async () => {
                if (window.chatSection) {
                    await window.chatSection.resetForNewChannel();
                    await window.chatSection.switchToChannel(channelId, 'text', forceFresh);
                }
            }, 100);
        }
    }
    
    async initializeVoiceChannel(channelId, forceFresh = false) {
        if (window.voiceSection) {
            await window.voiceSection.updateChannelId(channelId, forceFresh);
        }
        
        if (window.chatSection) {
            window.chatSection.leaveCurrentSocketRoom();
        }
        
        await this.fetchVoiceChannelData(channelId);
    }
    
    async fetchVoiceChannelData(channelId) {
        try {
            const response = await fetch(`/api/channels/${channelId}`, {
                method: 'GET',
                credentials: 'include',
                headers: { 'Accept': 'application/json' }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    window.currentChannelData = data.data.channel;
                }
            }
        } catch (error) {
            console.error('Failed to fetch voice channel data:', error);
        }
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
    
    showSection(channelType, channelId) {
        const chatSection = document.querySelector('.chat-section');
        const voiceSection = document.querySelector('.voice-section');
        
        if (channelType === 'voice') {
            if (chatSection) chatSection.classList.add('hidden');
            if (voiceSection) {
                voiceSection.classList.remove('hidden');
                voiceSection.setAttribute('data-channel-id', channelId);
            }
        } else {
            if (voiceSection) voiceSection.classList.add('hidden');
            if (chatSection) {
                chatSection.classList.remove('hidden');
                chatSection.setAttribute('data-channel-id', channelId);
            }
        }
    }
    
    updateChannelHeader(channelId, channelType) {
        const channelElement = document.querySelector(`[data-channel-id="${channelId}"].channel-item`);
        if (!channelElement) return;
        
        const channelName = channelElement.querySelector('.channel-name')?.textContent || 
                           channelElement.getAttribute('data-channel-name') || 
                           `Channel ${channelId}`;
        
        const channelNameEl = document.querySelector('#channel-name');
        const channelIconEl = document.querySelector('#channel-icon');
        const messageInputEl = document.querySelector('#message-input');
        
        if (channelNameEl) {
            channelNameEl.textContent = channelName;
        }
        
        if (channelIconEl) {
            channelIconEl.className = channelType === 'voice' 
                ? 'fas fa-volume-up text-[#949ba4] mr-2' 
                : 'fas fa-hashtag text-[#949ba4] mr-2';
        }
        
        if (messageInputEl) {
            messageInputEl.placeholder = channelType === 'voice' 
                ? `Voice channel: ${channelName}` 
                : `Message #${channelName}`;
        }
    }
    
    updateMetaTags(channelId, channelType) {
        const metaTags = [
            { name: 'channel-id', content: channelId },
            { name: 'chat-type', content: 'channel' },
            { name: 'chat-id', content: channelId }
        ];
        
        metaTags.forEach(({ name, content }) => {
            let metaEl = document.querySelector(`meta[name="${name}"]`);
            if (!metaEl) {
                metaEl = document.createElement('meta');
                metaEl.name = name;
                document.head.appendChild(metaEl);
            }
            metaEl.content = content;
        });
        
        const activeChannelInput = document.getElementById('active-channel-id');
        if (activeChannelInput) {
            activeChannelInput.value = channelId;
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
                this.switchToChannel(channelId, channelType, true);
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