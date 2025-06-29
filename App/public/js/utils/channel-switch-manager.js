class ChannelSwitchManager {
    constructor() {
        this.isLoading = false;
        this.currentChannelId = null;
        this.currentServerId = null;
        this.currentChannelType = null;
        this.switchQueue = [];
        this.init();
    }

    init() {
        console.log('[ChannelSwitchManager] Initializing channel switch manager');
        this.currentServerId = this.getServerIdFromURL();
        this.bindChannelClickEvents();
        this.setupPopstateListener();
    }

    bindChannelClickEvents() {
        console.log('[ChannelSwitchManager] Binding channel click events');
        
        document.addEventListener('click', (e) => {
            const channelItem = e.target.closest('.channel-item');
            if (channelItem && !this.isLoading) {
                e.preventDefault();
                e.stopPropagation();
                
                const channelId = channelItem.getAttribute('data-channel-id');
                const channelType = channelItem.getAttribute('data-channel-type') || 'text';
                const serverId = this.getServerIdFromURL();
                
                if (channelId && serverId) {
                    console.log('[ChannelSwitchManager] Channel clicked:', { channelId, channelType, serverId });
                    this.switchToChannel(serverId, channelId, channelType, channelItem);
                }
            }
        });
    }

    setupPopstateListener() {
        window.addEventListener('popstate', (event) => {
            console.log('[ChannelSwitchManager] Popstate event:', event.state);
            
            if (event.state && event.state.channelId) {
                const { serverId, channelId, channelType } = event.state;
                this.switchToChannel(serverId, channelId, channelType || 'text', null, false);
            }
        });
    }

    async switchToChannel(serverId, channelId, channelType = 'text', clickedElement = null, updateHistory = true) {
        if (this.isLoading) {
            console.log('[ChannelSwitchManager] Already switching, queuing request');
            this.switchQueue.push({ serverId, channelId, channelType, clickedElement, updateHistory });
            return;
        }

        console.log('[ChannelSwitchManager] Switching to channel:', {
            serverId,
            channelId,
            channelType,
            currentChannelId: this.currentChannelId
        });

        if (this.currentChannelId === channelId) {
            console.log('[ChannelSwitchManager] Already on this channel');
            return;
        }

        this.isLoading = true;
        this.showChannelSwitchingState(clickedElement);

        try {
            // Leave current socket room
            this.leaveCurrentChannel();
            
            // Update active channel UI
            this.updateActiveChannelUI(channelId);
            
            // Update sections (chat vs voice)
            this.updateSections(channelType);
            
            // Update meta tags for chat section
            if (channelType === 'text') {
                this.updateChatMetaTags(channelId, serverId);
            }
            
            // Switch chat section target or initialize voice
            if (channelType === 'text') {
                this.initializeChatSection(channelId);
            } else if (channelType === 'voice') {
                this.initializeVoiceSection(channelId);
            }
            
            // Update URL
            if (updateHistory) {
                this.updateURL(serverId, channelId, channelType);
            }
            
            // Update current state
            this.currentChannelId = channelId;
            this.currentChannelType = channelType;
            this.currentServerId = serverId;
            
            console.log('[ChannelSwitchManager] Channel switch completed successfully');
            
        } catch (error) {
            console.error('[ChannelSwitchManager] Error switching channel:', error);
        } finally {
            this.isLoading = false;
            this.hideChannelSwitchingState(clickedElement);
            this.processQueue();
        }
    }

    leaveCurrentChannel() {
        if (this.currentChannelId && window.globalSocketManager) {
            console.log('[ChannelSwitchManager] Leaving current channel:', this.currentChannelId);
            window.globalSocketManager.leaveChannel(this.currentChannelId);
        }
        
        // Cleanup voice manager if switching from voice
        if (this.currentChannelType === 'voice' && window.voiceManager) {
            console.log('[ChannelSwitchManager] Cleaning up voice manager');
            if (typeof window.voiceManager.leaveVoice === 'function') {
                window.voiceManager.leaveVoice();
            }
            window.voiceManager = null;
        }
    }

    updateActiveChannelUI(channelId) {
        console.log('[ChannelSwitchManager] Updating active channel UI for:', channelId);
        
        // Remove active state from all channels
        document.querySelectorAll('.channel-item').forEach(item => {
            item.classList.remove('active-channel', 'bg-discord-light');
        });
        
        // Add active state to current channel
        const activeChannel = document.querySelector(`[data-channel-id="${channelId}"]`);
        if (activeChannel) {
            activeChannel.classList.add('active-channel', 'bg-discord-light');
            console.log('[ChannelSwitchManager] Active channel UI updated');
        }
    }

    updateSections(channelType) {
        console.log('[ChannelSwitchManager] Updating sections for type:', channelType);
        const chatSection = document.querySelector('.chat-section');
        const voiceSection = document.querySelector('.voice-section');

        if (channelType === 'voice') {
            console.log('[ChannelSwitchManager] Switching to voice section');
            if (chatSection) {
                chatSection.classList.add('hidden');
                chatSection.style.display = 'none';
            }
            if (voiceSection) {
                voiceSection.classList.remove('hidden');
                voiceSection.style.display = 'flex';
            }
            // Clear chat section instance
            if (window.chatSection) {
                window.chatSection = null;
            }
        } else {
            console.log('[ChannelSwitchManager] Switching to chat section');
            if (voiceSection) {
                voiceSection.classList.add('hidden');
                voiceSection.style.display = 'none';
            }
            if (chatSection) {
                chatSection.classList.remove('hidden');
                chatSection.style.display = 'flex';
            }
            // Cleanup voice manager
            if (window.voiceManager && window.voiceManager.isConnected) {
                window.voiceManager.leaveVoice();
            }
            if (window.voiceManager) {
                window.voiceManager = null;
            }
        }
    }

    updateChatMetaTags(channelId, serverId) {
        console.log('[ChannelSwitchManager] Updating chat meta tags for channel:', channelId);
        
        // Update meta tags for chat section
        this.updateMetaTag('chat-type', 'channel');
        this.updateMetaTag('chat-id', channelId);
        this.updateMetaTag('channel-id', channelId);
        
        // Get channel name for title
        const channelElement = document.querySelector(`[data-channel-id="${channelId}"]`);
        const channelName = channelElement ? channelElement.textContent.trim().replace('#', '') : 'channel';
        
        this.updateMetaTag('chat-title', channelName);
        this.updateMetaTag('chat-placeholder', `Message #${channelName}`);
        
        console.log('[ChannelSwitchManager] Meta tags updated for chat section');
    }

    updateMetaTag(name, content) {
        let metaTag = document.querySelector(`meta[name="${name}"]`);
        if (metaTag) {
            metaTag.setAttribute('content', content);
        } else {
            metaTag = document.createElement('meta');
            metaTag.setAttribute('name', name);
            metaTag.setAttribute('content', content);
            document.head.appendChild(metaTag);
        }
    }

    initializeChatSection(channelId) {
        console.log('[ChannelSwitchManager] Initializing chat section for channel:', channelId);
        
        // Check if chat section exists and switch target
        if (window.chatSection && typeof window.chatSection.switchTarget === 'function') {
            console.log('[ChannelSwitchManager] Switching existing chat section to channel:', channelId);
            window.chatSection.switchTarget('channel', channelId);
        } else {
            console.log('[ChannelSwitchManager] Creating new chat section instance');
            // Initialize new chat section
            setTimeout(() => {
                if (typeof window.initializeChatSection === 'function') {
                    window.initializeChatSection();
                } else if (typeof window.ChatSection === 'function') {
                    const chatSection = new window.ChatSection({
                        chatType: 'channel',
                        targetId: channelId,
                        userId: window.currentUserId || document.querySelector('meta[name="user-id"]')?.getAttribute('content'),
                        username: window.currentUsername || document.querySelector('meta[name="username"]')?.getAttribute('content')
                    });
                    window.chatSection = chatSection;
                }
            }, 100);
        }
    }

    initializeVoiceSection(channelId) {
        console.log('[ChannelSwitchManager] Initializing voice section for channel:', channelId);
        
        // Initialize voice components
        setTimeout(() => {
            if (typeof window.initializeVoiceComponents === 'function') {
                window.initializeVoiceComponents();
            }
            
            // Dispatch voice section loaded event
            const event = new CustomEvent('voiceSectionLoaded', {
                detail: { channelId }
            });
            document.dispatchEvent(event);
        }, 100);
    }

    showChannelSwitchingState(element) {
        if (element) {
            element.classList.add('switching');
        }
    }

    hideChannelSwitchingState(element) {
        if (element) {
            element.classList.remove('switching');
        }
    }

    processQueue() {
        if (this.switchQueue.length > 0) {
            const next = this.switchQueue.shift();
            console.log('[ChannelSwitchManager] Processing queued channel switch');
            this.switchToChannel(next.serverId, next.channelId, next.channelType, next.clickedElement, next.updateHistory);
        }
    }

    getServerIdFromURL() {
        const match = window.location.pathname.match(/\/server\/(\d+)/);
        return match ? match[1] : null;
    }

    updateURL(serverId, channelId, channelType) {
        const newURL = `/server/${serverId}?channel=${channelId}${channelType === 'voice' ? '&type=voice' : ''}`;
        window.history.pushState(
            { 
                path: newURL, 
                serverId, 
                channelId, 
                channelType 
            }, 
            '', 
            newURL
        );
        console.log('[ChannelSwitchManager] URL updated:', newURL);
    }

    getCurrentChannelId() {
        return this.currentChannelId;
    }

    getCurrentChannelType() {
        return this.currentChannelType;
    }
}

// Initialize when on server page
document.addEventListener('DOMContentLoaded', () => {
    console.log('[ChannelSwitchManager] DOM content loaded');
    if (window.location.pathname.includes('/server/')) {
        console.log('[ChannelSwitchManager] On server page, initializing channel switch manager');
        window.channelSwitchManager = new ChannelSwitchManager();
    }
});

// Make globally available
window.ChannelSwitchManager = ChannelSwitchManager; 