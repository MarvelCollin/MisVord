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
            if (!channelItem || e.target.closest('.channel-menu')) return;
            
            e.preventDefault();
            
            const channelId = channelItem.getAttribute('data-channel-id');
            const channelType = channelItem.getAttribute('data-channel-type') || 'text';
            
            if (channelId) {
                this.switchToChannel(channelId, channelType);
            }
        });
    }
    
    initFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const channelId = urlParams.get('channel');
        const channelType = urlParams.get('type') || 'text';
        
        if (channelId) {
            this.switchToChannel(channelId, channelType, false);
        }
    }
    
    async switchToChannel(channelId, channelType = 'text', updateHistory = true) {
        if (this.isLoading || this.currentChannelId === channelId) return;
        
        this.isLoading = true;
        this.currentChannelId = channelId;
        this.currentChannelType = channelType;
        
        this.updateActiveChannel(channelId);
        this.showSection(channelType);
        
        if (updateHistory) {
            this.updateURL(channelId, channelType);
        }
        
        this.updateMetaTags(channelId, channelType);
        this.updateChannelHeader(channelId, channelType);
        
        if (channelType === 'text') {
            await this.initializeTextChannel(channelId);
        } else if (channelType === 'voice') {
            await this.initializeVoiceChannel(channelId);
        }
        
        this.isLoading = false;
    }
    
    updateActiveChannel(channelId) {
        document.querySelectorAll('.channel-item').forEach(item => {
            item.classList.remove('active', 'bg-[#5865f2]', 'text-white');
            item.classList.add('text-gray-400', 'hover:text-gray-300');
            
            const icon = item.querySelector('i');
            if (icon) {
                icon.classList.remove('text-white');
                icon.classList.add('text-gray-500');
            }
        });
        
        const targetChannel = document.querySelector(`[data-channel-id="${channelId}"]`);
        if (targetChannel) {
            targetChannel.classList.add('active', 'bg-[#5865f2]', 'text-white');
            targetChannel.classList.remove('text-gray-400');
            
            const icon = targetChannel.querySelector('i');
            if (icon) {
                icon.classList.add('text-white');
                icon.classList.remove('text-gray-500');
            }
        }
    }
    
    showSection(channelType) {
        const chatSections = document.querySelectorAll('.chat-section');
        const voiceSections = document.querySelectorAll('.voice-section');
        
        if (channelType === 'voice') {
            chatSections.forEach(section => {
                section.classList.add('hidden');
                section.style.display = 'none';
            });
            
            voiceSections.forEach(section => {
                section.classList.remove('hidden');
                section.style.display = 'flex';
            });
        } else {
            voiceSections.forEach(section => {
                section.classList.add('hidden');
                section.style.display = 'none';
            });
            
            chatSections.forEach(section => {
                section.classList.remove('hidden');
                section.style.display = 'flex';
            });
        }
    }
    
    updateURL(channelId, channelType) {
        const url = new URL(window.location);
        url.searchParams.set('channel', channelId);
        url.searchParams.set('type', channelType);
        window.history.pushState({}, '', url);
    }
    
    updateMetaTags(channelId, channelType) {
        this.setMeta('channel-id', channelId);
        this.setMeta('channel-type', channelType);
        this.setMeta('chat-id', channelId);
        this.setMeta('chat-type', 'channel');
    }
    
    setMeta(name, content) {
        let meta = document.querySelector(`meta[name="${name}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = name;
            document.head.appendChild(meta);
        }
        meta.content = content;
    }
    
    updateChannelHeader(channelId, channelType) {
        const channelElement = document.querySelector(`[data-channel-id="${channelId}"]`);
        const channelName = channelElement?.querySelector('.channel-name')?.textContent?.trim() || 
                           channelElement?.getAttribute('data-channel-name') || 
                           `Channel ${channelId}`;
        
        const headerTitle = document.querySelector('.channel-name-header, .chat-header-title');
        const headerIcon = document.querySelector('.channel-icon-header, .chat-header-icon');
        
        if (headerTitle) {
            headerTitle.textContent = channelName;
        }
        
        if (headerIcon) {
            const iconClass = channelType === 'voice' ? 'fas fa-volume-high' : 'fas fa-hashtag';
            headerIcon.className = `${iconClass} text-[#949ba4] mr-2`;
        }
    }
    
    async initializeTextChannel(channelId) {
        this.showSkeleton();
        
        try {
            if (window.chatSection) {
                await window.chatSection.switchToChannel(channelId, 'text');
            }
        } catch (error) {
            console.error('Failed to initialize text channel:', error);
        } finally {
            this.hideSkeleton();
        }
    }
    
    async initializeVoiceChannel(channelId) {
        const channelElement = document.querySelector(`[data-channel-id="${channelId}"]`);
        const channelName = channelElement?.querySelector('.channel-name')?.textContent?.trim() || 'Voice Channel';
        
        // Update current channel context but DO NOT auto-join the voice call.
        if (window.voiceManager) {
            window.voiceManager.currentChannelId = channelId;
            window.voiceManager.currentChannelName = channelName;
            // Intentionally not calling joinVoice here to let the user decide when to join.
        }
        
        if (window.unifiedVoiceStateManager) {
            window.unifiedVoiceStateManager.setState({
                channelId: channelId,
                channelName: channelName,
                isViewingDifferentChannel: false
            });
        }
        
        // Also update the localStorage directly to ensure consistency
        if (window.localStorageManager) {
            const currentState = window.localStorageManager.getUnifiedVoiceState();
            window.localStorageManager.setUnifiedVoiceState({
                ...currentState,
                channelId: channelId,
                channelName: channelName
            });
        }
        
        // Ensure the "join" view is visible (in case we navigated from another voice channel)
        document.getElementById('voice-not-join-container')?.classList.remove('hidden');
        document.getElementById('voice-call-container')?.classList.add('hidden');
    }
    
    showSkeleton() {
        const skeleton = document.getElementById('chat-skeleton-loading');
        const content = document.getElementById('chat-real-content');
        
        if (skeleton) skeleton.style.display = 'block';
        if (content) content.style.display = 'none';
    }
    
    hideSkeleton() {
        const skeleton = document.getElementById('chat-skeleton-loading');
        const content = document.getElementById('chat-real-content');
        
        if (skeleton) skeleton.style.display = 'none';
        if (content) content.style.display = 'block';
    }
}

if (typeof window !== 'undefined') {
    window.SimpleChannelSwitcher = SimpleChannelSwitcher;
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            new SimpleChannelSwitcher();
        });
    } else {
        new SimpleChannelSwitcher();
    }
}