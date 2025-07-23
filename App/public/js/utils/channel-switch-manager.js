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
        try {

            if (this.currentChannelId && this.currentChannelId !== channelId) {
                
                if (window.globalSocketManager && window.globalSocketManager.isReady()) {
                    window.globalSocketManager.leaveRoom('channel', this.currentChannelId);
                }
            }
            
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
        } finally {
            this.isLoading = false;
        }
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
            await this.ensureChatSectionReady();
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
        

        if (window.globalSocketManager && window.globalSocketManager.isReady()) {
            
            window.globalSocketManager.joinRoom('channel', channelId);
            

            setTimeout(async () => {
                
                

                if (window.globalSocketManager?.io) {
                    window.globalSocketManager.io.emit('get-online-users');
                    
                }
                

                setTimeout(async () => {

                    if (window.FriendsManager) {
                        const friendsManager = window.FriendsManager.getInstance();

                        friendsManager.cache.onlineUsers = null;
                        await friendsManager.getOnlineUsers(true);
                        
                    }
                    

                    if (window.globalPresenceManager) {
                        window.globalPresenceManager.updateActiveNow();
                        
                    }
                    

                    if (window.updateParticipantDisplay) {
                        window.updateParticipantDisplay();
                        
                    }
                    

                    window.dispatchEvent(new CustomEvent('presenceDataRefreshed', {
                        detail: { channelId: channelId, source: 'voiceChannelSwitch' }
                    }));
                    
                }, 800);
            }, 300);
        } else {
            console.warn('⚠️ [CHANNEL-SWITCHER] Socket not ready, will retry joining room after socket is ready');

            window.addEventListener('globalSocketReady', () => {
                if (window.globalSocketManager && window.globalSocketManager.isReady()) {
                    
                    window.globalSocketManager.joinRoom('channel', channelId);
                    

                    setTimeout(async () => {
                        if (window.FriendsManager) {
                            const friendsManager = window.FriendsManager.getInstance();
                            await friendsManager.getOnlineUsers(true);
                        }
                        if (window.globalPresenceManager) {
                            window.globalPresenceManager.updateActiveNow();
                        }
                        if (window.updateParticipantDisplay) {
                            window.updateParticipantDisplay();
                        }
                        if (window.globalSocketManager?.io) {
                            window.globalSocketManager.io.emit('get-online-users');
                        }
                    }, 500);
                }
            }, { once: true });
        }
        
        if (window.voiceManager) {
            window.voiceManager.currentChannelId = channelId;
            window.voiceManager.currentChannelName = channelName;
        }
        
        if (window.localStorageManager) {
            const currentState = window.localStorageManager.getUnifiedVoiceState();
            


            if (!currentState.isConnected && !window.voiceManager?.isConnected) {
                window.localStorageManager.clearVoiceState();
            }
        }
        

        const isConnectedToVoice = window.voiceManager?.isConnected && 
                                   window.voiceManager?.currentChannelId === channelId;
        const voiceState = window.localStorageManager?.getUnifiedVoiceState();
        const isConnectedInStorage = voiceState?.isConnected && voiceState?.channelId === channelId;
        
        console.log(`🔍 [CHANNEL-SWITCHER] Voice connection check for channel ${channelId}:`, {
            isConnectedToVoice,
            isConnectedInStorage,
            voiceManagerChannelId: window.voiceManager?.currentChannelId,
            voiceManagerConnected: window.voiceManager?.isConnected,
            storageChannelId: voiceState?.channelId,
            storageConnected: voiceState?.isConnected
        });
        
        if (isConnectedToVoice || isConnectedInStorage) {
            document.getElementById('voice-not-join-container')?.classList.add('hidden');
            document.getElementById('voice-call-container')?.classList.remove('hidden');
        } else {
            document.getElementById('voice-not-join-container')?.classList.remove('hidden');
            document.getElementById('voice-call-container')?.classList.add('hidden');
        }
        
        await this.ensureVoiceCallSectionReady();
    }
    
    async ensureChatSectionReady() {

        if (window.chatSection) return;
        if (typeof window.initializeChatSection === 'function') {
            try {
                await window.initializeChatSection();
            } catch (e) {
                console.warn('[SimpleChannelSwitcher] initializeChatSection failed:', e);
            }
        }
        let tries = 0;
        while (!window.chatSection && tries < 40) { 
            await new Promise(r => setTimeout(r, 100));
            tries++;
        }
    }
    
    async ensureVoiceCallSectionReady() {
        if (window.voiceCallSection) return;
        let tries = 0;
        while (!window.voiceCallSection && tries < 40) {
            await new Promise(r => setTimeout(r, 100));
            tries++;
        }
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