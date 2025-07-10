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
        
        if (window.voiceManager) {
            window.voiceManager.currentChannelId = channelId;
            window.voiceManager.currentChannelName = channelName;
        }
        
        if (window.localStorageManager) {
            const currentState = window.localStorageManager.getUnifiedVoiceState();
            
            // Don't clear voice state during channel switches - only update channel info
            // Only clear if user is genuinely not connected
            if (!currentState.isConnected && !window.voiceManager?.isConnected) {
                window.localStorageManager.clearVoiceState();
            } else {
                // Preserve connection state when switching channels
                window.localStorageManager.setUnifiedVoiceState({
                    ...currentState,
                    channelId: channelId,
                    channelName: channelName,
                    // Preserve isConnected if VoiceManager says we're connected
                    isConnected: window.voiceManager?.isConnected || currentState.isConnected
                });
            }
        }
        
        // Check if user is already connected to voice before deciding which UI to show
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
            storageConnected: voiceState?.isConnected,
            participantCount: window.voiceManager?.getAllParticipants?.()?.size || 0
        });
        
        if (isConnectedToVoice || isConnectedInStorage) {
            // User is already connected to this voice channel - show call interface
            console.log(`✅ [CHANNEL-SWITCHER] User already connected - showing call interface`);
            document.getElementById('voice-not-join-container')?.classList.add('hidden');
            document.getElementById('voice-call-container')?.classList.remove('hidden');
        } else {
            // User is not connected - show join interface
            console.log(`🔌 [CHANNEL-SWITCHER] User not connected - showing join interface`);
            document.getElementById('voice-not-join-container')?.classList.remove('hidden');
            document.getElementById('voice-call-container')?.classList.add('hidden');
        }
        
        await this.ensureVoiceCallSectionReady();
        if (window.voiceCallSection && typeof window.voiceCallSection.ensureChannelSync === 'function') {
            window.voiceCallSection.ensureChannelSync();
        }
        
        // If user is already connected, ensure the voice call section is properly initialized
        if (isConnectedToVoice || isConnectedInStorage) {
            console.log(`🔄 [CHANNEL-SWITCHER] User already connected - syncing UI without sidebar refresh`);
            
            // Trigger a voiceConnect event to ensure all components are in sync
            if (window.voiceManager?.currentMeetingId) {
                window.dispatchEvent(new CustomEvent('voiceConnect', {
                    detail: {
                        channelId: channelId,
                        channelName: channelName,
                        meetingId: window.voiceManager.currentMeetingId,
                        skipJoinSound: true,
                        skipSidebarRefresh: true, // Don't refresh sidebar on channel switch
                        source: 'channelSwitch'
                    }
                }));
            }
            
            // Update voice call section connection status (but skip sidebar refresh)
            if (window.voiceCallSection && typeof window.voiceCallSection.updateConnectionStatus === 'function') {
                // Call with skipSidebarRefresh flag
                window.voiceCallSection.updateConnectionStatus(true, true);
            }
            
            // Ensure participant container is visible for this channel
            if (window.ChannelVoiceParticipants) {
                const instance = window.ChannelVoiceParticipants.getInstance();
                instance.ensureParticipantsVisible(channelId);
            }
        }
    }
    
    async ensureChatSectionReady() {
        // Guarantee that window.chatSection exists and is initialized before we try to switch
        if (window.chatSection) return;
        if (typeof window.initializeChatSection === 'function') {
            try {
                await window.initializeChatSection();
            } catch (e) {
                console.warn('[SimpleChannelSwitcher] initializeChatSection failed:', e);
            }
        }
        let tries = 0;
        while (!window.chatSection && tries < 40) { // wait up to ~4s
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