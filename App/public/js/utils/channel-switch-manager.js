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
        this.highlightInitialActiveChannel();
    }
    
    setupChannelClicks() {
        document.addEventListener('click', (e) => {
            const channelItem = e.target.closest('.channel-item');
            if (!channelItem) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            const loadMoreContainer = document.querySelector('#load-more-container');
            if (loadMoreContainer) {
                loadMoreContainer.classList.add('hidden');
                console.log('🧹 [SWITCH-MANAGER] Load more container hidden on channel click');
            }
            
            const channelId = channelItem.getAttribute('data-channel-id');
            const channelType = channelItem.getAttribute('data-channel-type') || 'text';
            
            if (channelId) {
                this.switchToChannel(channelId, channelType, true);
            }
        });
    }
    
    initFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const channelId = urlParams.get('channel');
        const channelType = urlParams.get('type') || 'text';
        
        if (channelId) {
            this.switchToChannel(channelId, channelType, true);
        }
    }
    
    highlightInitialActiveChannel() {
        const activeChannelInput = document.getElementById('active-channel-id');
        if (activeChannelInput && activeChannelInput.value) {
            const activeChannelId = activeChannelInput.value;
            console.log('🎯 [SWITCH-MANAGER] Highlighting initial active channel:', activeChannelId);
            this.updateActiveChannel(activeChannelId);
        } else {
            const activeChannel = document.querySelector('.channel-item.active');
            if (activeChannel) {
                const channelId = activeChannel.getAttribute('data-channel-id');
                console.log('🎯 [SWITCH-MANAGER] Highlighting channel from DOM:', channelId);
                this.updateActiveChannel(channelId);
            }
        }
    }
    
    async switchToChannel(channelId, channelType = 'text', forceFresh = false) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        
        const loadMoreContainer = document.querySelector('#load-more-container');
        if (loadMoreContainer) {
            loadMoreContainer.classList.add('hidden');
            console.log('🧹 [SWITCH-MANAGER] Load more container hidden immediately at channel switch start');
        }
        
        this.currentChannelId = channelId;
        this.currentChannelType = channelType;
        
        this.updateActiveChannel(channelId);
        this.showSection(channelType, channelId);
        this.updateURL(channelId, channelType);
        this.updateMetaTags(channelId, channelType);
        this.updateChannelHeader(channelId, channelType);
        
        if (channelType === 'text') {
            await this.initializeTextChannel(channelId, true);
        } else if (channelType === 'voice') {
            await this.initializeVoiceChannel(channelId, true);
        }
        
        this.isLoading = false;
    }
    
    updateActiveChannel(channelId) {
        console.log('🎯 [SWITCH-MANAGER] Updating active channel to:', channelId);
        
        document.querySelectorAll('.channel-item').forEach(item => {
            item.classList.remove('active');
            item.removeAttribute('data-active');
            
            item.classList.remove('bg-[#5865f2]', 'text-white', 'hover:bg-[#4752c4]', 'hover:text-white');
            item.classList.add('text-gray-400', 'hover:text-gray-300', 'hover:bg-gray-700/30');
            
            const icon = item.querySelector('i');
            if (icon) {
                icon.classList.remove('text-white');
                icon.classList.add('text-gray-500');
            }
            
            const voiceCount = item.querySelector('.voice-user-count');
            if (voiceCount) {
                voiceCount.classList.remove('text-white/70');
                voiceCount.classList.add('text-gray-500');
            }
        });
        
        const targetChannel = document.querySelector(`[data-channel-id="${channelId}"]`);
        if (targetChannel) {
            targetChannel.classList.add('active');
            targetChannel.setAttribute('data-active', 'true');
            
            targetChannel.classList.remove('text-gray-400', 'hover:text-gray-300', 'hover:bg-gray-700/30');
            targetChannel.classList.add('bg-[#5865f2]', 'text-white', 'hover:bg-[#4752c4]', 'hover:text-white');
            
            const icon = targetChannel.querySelector('i');
            if (icon) {
                icon.classList.remove('text-gray-500');
                icon.classList.add('text-white');
            }
            
            const voiceCount = targetChannel.querySelector('.voice-user-count');
            if (voiceCount) {
                voiceCount.classList.remove('text-gray-500');
                voiceCount.classList.add('text-white/70');
            }
            
            console.log('✅ [SWITCH-MANAGER] Active channel set with styling:', channelId, targetChannel);
        } else {
            console.warn('⚠️ [SWITCH-MANAGER] Target channel not found for ID:', channelId);
        }
    }
    
    async initializeTextChannel(channelId, forceFresh = false) {
        console.log('🔄 [SWITCH-MANAGER] Initializing text channel:', channelId);
        
        const loadMoreContainer = document.querySelector('#load-more-container');
        if (loadMoreContainer) {
            loadMoreContainer.classList.add('hidden');
            console.log('🧹 [SWITCH-MANAGER] Load more container hidden during channel switch');
        }
        
        const messagesContainer = document.querySelector('#chat-messages .messages-container');
        console.log('🔄 [SWITCH-MANAGER] Messages container found:', !!messagesContainer);
        
        console.log('🔄 [SWITCH-MANAGER] Switching from voice to text - full reset needed');
        
        if (window.chatSection) {
            console.log('🔄 [SWITCH-MANAGER] Chat section exists, showing skeleton first');
            window.chatSection.showChatSkeleton();
            
            await window.chatSection.resetForNewChannel();
            await new Promise(resolve => setTimeout(resolve, 100));
            await window.chatSection.switchToChannel(channelId, 'text', true);
        } else {
            console.log('🔄 [SWITCH-MANAGER] Chat section not ready, waiting...');
            let attempts = 0;
            const maxAttempts = 10;
            
            while (!window.chatSection && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 200));
                attempts++;
            }
            
            if (window.chatSection) {
                console.log('🔄 [SWITCH-MANAGER] Chat section ready after wait, initializing');
                window.chatSection.showChatSkeleton();
                await window.chatSection.resetForNewChannel();
                await new Promise(resolve => setTimeout(resolve, 100));
                await window.chatSection.switchToChannel(channelId, 'text', true);
            } else {
                console.error('❌ [SWITCH-MANAGER] Chat section never became available');
            }
        }
        
        console.log('✅ [SWITCH-MANAGER] Text channel initialization complete');
    }
    
    async initializeVoiceChannel(channelId, forceFresh = false) {
        console.log('🔄 [SWITCH-MANAGER] Initializing voice channel:', channelId);
        
        if (window.chatSection) {
            console.log('🔄 [SWITCH-MANAGER] Ensuring chat section cleanup for voice channel');
            window.chatSection.leaveCurrentSocketRoom();
            window.chatSection.forceStopAllOperations();
        }
        
        if (window.voiceSection) {
            await window.voiceSection.resetState();
            await window.voiceSection.updateChannelId(channelId, true);
        }
        
        console.log('✅ [SWITCH-MANAGER] Voice channel initialization complete');
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
    
    updateURL(channelId, channelType) {
        const url = new URL(window.location);
        url.searchParams.set('channel', channelId);
        url.searchParams.set('type', channelType);
        window.history.pushState({}, '', url);
    }
    
    updateMetaTags(channelId, channelType) {
        let metaChannelId = document.querySelector('meta[name="channel-id"]');
        let metaChannelType = document.querySelector('meta[name="channel-type"]');
        
        if (!metaChannelId) {
            metaChannelId = document.createElement('meta');
            metaChannelId.name = 'channel-id';
            document.head.appendChild(metaChannelId);
        }
        
        if (!metaChannelType) {
            metaChannelType = document.createElement('meta');
            metaChannelType.name = 'channel-type';
            document.head.appendChild(metaChannelType);
        }
        
        metaChannelId.content = channelId;
        metaChannelType.content = channelType;
    }
    
    updateChannelHeader(channelId, channelType) {
        const channelElement = document.querySelector(`[data-channel-id="${channelId}"]`);
        const channelName = channelElement?.querySelector('.channel-name')?.textContent?.trim() || 
                           channelElement?.getAttribute('data-channel-name') || 
                           `Channel ${channelId}`;
        
        const headerTitle = document.querySelector('.channel-name-header, .chat-header-title, [data-channel-header]');
        const headerIcon = document.querySelector('.channel-icon-header, .chat-header-icon, [data-channel-icon]');
        
        if (headerTitle) {
            headerTitle.textContent = channelName;
        }
        
        if (headerIcon) {
            const iconClass = channelType === 'voice' ? 'fas fa-volume-high' : 'fas fa-hashtag';
            headerIcon.className = `${iconClass} text-[#949ba4] mr-2`;
        }
        
        window.currentChannelData = {
            id: channelId,
            name: channelName,
            type: channelType
        };
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

export default SimpleChannelSwitcher; 