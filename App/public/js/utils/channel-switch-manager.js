class SimpleChannelSwitcher {
    constructor() {
        if (window.simpleChannelSwitcher) {
            return window.simpleChannelSwitcher;
        }
        
        this.currentChannelId = null;
        this.currentChannelType = 'text';
        
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
            
            const channelId = channelItem.getAttribute('data-channel-id');
            let channelType = channelItem.getAttribute('data-channel-type') || 'text';
            
            if (channelItem.querySelector('.fa-volume-up, .fa-volume-high, .fa-microphone')) {
                channelType = 'voice';
            }
            
            if (channelId) {
                this.switchToChannel(channelId, channelType);
            }
        });
    }
    
    switchToChannel(channelId, channelType = 'text') {
        if (this.currentChannelId === channelId) return;
        
        this.currentChannelId = channelId;
        this.currentChannelType = channelType;
        
        this.updateActiveChannel(channelId);
        this.showSection(channelType, channelId);
        this.updateURL(channelId, channelType);
        this.updateMetaTags(channelId, channelType);
        this.updateChannelHeader(channelId, channelType);
        
        if (channelType === 'text') {
            this.initializeTextChannel(channelId);
        } else if (channelType === 'voice') {
            this.initializeVoiceChannel(channelId);
        }
    }
    
    initializeTextChannel(channelId) {
        if (window.chatSection) {
            window.chatSection.resetForNewChannel();
            window.chatSection.switchToChannel(channelId, 'text');
        } else {
            setTimeout(() => {
                if (window.chatSection) {
                    window.chatSection.resetForNewChannel();
                    window.chatSection.switchToChannel(channelId, 'text');
                }
            }, 100);
        }
    }
    
    initializeVoiceChannel(channelId) {
        if (window.voiceSection) {
            window.voiceSection.updateChannelId(channelId);
        }
        
        if (window.chatSection) {
            window.chatSection.leaveCurrentSocketRoom();
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