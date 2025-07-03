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
        this.ensureCorrectInitialSection();
        this.initFromURL();
        this.highlightInitialActiveChannel();
    }
    
    ensureCorrectInitialSection() {
        const urlParams = new URLSearchParams(window.location.search);
        const channelId = urlParams.get('channel');
        let channelType = urlParams.get('type') || 'text';
        
        if (channelId) {
            const channelElement = document.querySelector(`[data-channel-id="${channelId}"]`);
            if (channelElement) {
                const domChannelType = channelElement.getAttribute('data-channel-type');
                if (domChannelType === 'voice') {
                    channelType = 'voice';
                }
            }
            
            const voiceSection = document.querySelector('.voice-section:not(.hidden)');
            if (voiceSection) {
                channelType = 'voice';
            }
            
            console.log('🎯 [SWITCH-MANAGER] Ensuring correct initial section:', channelType);
            this.showSection(channelType, channelId);
        }
    }
    
    setupChannelClicks() {
        document.addEventListener('click', (e) => {
            const channelItem = e.target.closest('.channel-item');
            if (!channelItem) return;
            
            if (e.target.closest('.channel-menu') || e.target.closest('.channel-dropdown')) {
                console.log('🚫 [SWITCH-MANAGER] Prevented click on menu elements');
                return;
            }
            
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
        let channelType = urlParams.get('type') || 'text';
        
        if (channelId) {
            const channelElement = document.querySelector(`[data-channel-id="${channelId}"]`);
            if (channelElement) {
                const domChannelType = channelElement.getAttribute('data-channel-type');
                if (domChannelType === 'voice' && channelType !== 'voice') {
                    console.log('🔄 [SWITCH-MANAGER] Correcting channel type from DOM: voice');
                    channelType = 'voice';
                }
            }
            
            const voiceSection = document.querySelector('.voice-section:not(.hidden)');
            const chatSection = document.querySelector('.chat-section:not(.hidden)');
            
            if (voiceSection && !chatSection && channelType !== 'voice') {
                console.log('🔄 [SWITCH-MANAGER] Voice section visible, correcting type to voice');
                channelType = 'voice';
            }
            
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
    
    async switchToChannel(channelId, channelType = 'text', forceFresh = false, highlightMessageId = null) {
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
        
        console.log('🔄 [SWITCH-MANAGER] Channel switch - type:', channelType, 'id:', channelId);
        
        if (window.emojiReactions && typeof window.emojiReactions.updateChannelContext === 'function') {
            console.log('🔄 [SWITCH-MANAGER] Updating emoji reactions context for channel switch');
            window.emojiReactions.updateChannelContext(channelId, 'channel');
        }

        // Preserve voice participants when switching channels
        this.preserveVoiceParticipants();
        
        if (channelType === 'text') {
            await this.initializeTextChannel(channelId, true);
            
            if (highlightMessageId) {
                setTimeout(() => {
                    this.highlightMessage(highlightMessageId);
                }, 1000);
            }
        } else if (channelType === 'voice') {
            await this.initializeVoiceChannel(channelId, true);
        }

        // Update voice participants after channel switch
        this.updateVoiceParticipantsAfterSwitch(channelId, channelType);
        
        this.isLoading = false;
    }
    
    highlightMessage(messageId) {
        if (typeof window.highlightMessage === 'function') {
            window.highlightMessage(messageId);
        } else {
            const waitForMessage = (retries = 0) => {
                const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
                
                if (messageElement) {
                    messageElement.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                    
                    setTimeout(() => {
                        messageElement.classList.add('highlight-message');
                        
                        setTimeout(() => {
                            messageElement.classList.remove('highlight-message');
                        }, 3000);
                    }, 300);
                    
                } else if (retries < 10) {
                    setTimeout(() => waitForMessage(retries + 1), 500);
                } else {
                    console.warn('Message not found for highlighting:', messageId);
                }
            };
            
            waitForMessage();
        }
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
        
        this.showChatSkeletonDirect();
        
        if (window.chatSection) {
            console.log('🔄 [SWITCH-MANAGER] Chat section exists, using it');
            await window.chatSection.resetForNewChannel();
            await new Promise(resolve => setTimeout(resolve, 100));
            await window.chatSection.switchToChannel(channelId, 'text', true);
        } else {
            console.log('🔄 [SWITCH-MANAGER] Chat section not ready, attempting to initialize...');
            
            // Try to initialize chat section
            try {
                if (typeof window.initializeChatSection === 'function') {
                    console.log('🔄 [SWITCH-MANAGER] Calling initializeChatSection function');
                    await window.initializeChatSection();
                } else if (typeof initializeChatSection === 'function') {
                    console.log('🔄 [SWITCH-MANAGER] Calling global initializeChatSection function');
                    await initializeChatSection();
                }
                
                // Now check if it's available
                if (window.chatSection) {
                    console.log('🔄 [SWITCH-MANAGER] Chat section initialized successfully');
                    await window.chatSection.resetForNewChannel();
                    await new Promise(resolve => setTimeout(resolve, 100));
                    await window.chatSection.switchToChannel(channelId, 'text', true);
                } else {
                    console.log('🔄 [SWITCH-MANAGER] Still waiting for chat section...');
                    let attempts = 0;
                    const maxAttempts = 15;
                    
                    while (!window.chatSection && attempts < maxAttempts) {
                        await new Promise(resolve => setTimeout(resolve, 300));
                        attempts++;
                        console.log(`🔄 [SWITCH-MANAGER] Waiting attempt ${attempts}/${maxAttempts}`);
                    }
                    
                    if (window.chatSection) {
                        console.log('🔄 [SWITCH-MANAGER] Chat section finally available');
                        await window.chatSection.resetForNewChannel();
                        await new Promise(resolve => setTimeout(resolve, 100));
                        await window.chatSection.switchToChannel(channelId, 'text', true);
                    } else {
                        console.error('❌ [SWITCH-MANAGER] Chat section never became available, using fallback');
                        this.fallbackTextChannelInit(channelId);
                    }
                }
            } catch (error) {
                console.error('❌ [SWITCH-MANAGER] Error initializing chat section:', error);
                this.fallbackTextChannelInit(channelId);
            }
        }
        
        console.log('✅ [SWITCH-MANAGER] Text channel initialization complete');
    }
    
    showChatSkeletonDirect() {
        const skeletonContainer = document.getElementById('chat-skeleton-loading');
        const realContent = document.getElementById('chat-real-content');
        
        if (skeletonContainer) {
            skeletonContainer.style.display = 'block';
        }
        
        if (realContent) {
            realContent.style.display = 'none';
        }
        
        console.log('🎨 [SWITCH-MANAGER] Chat skeleton shown directly');
    }
    
    fallbackTextChannelInit(channelId) {
        console.log('🔧 [SWITCH-MANAGER] Using fallback text channel initialization');
        
        // Update meta tags
        this.updateMetaTags(channelId, 'text');
        
        // Update header
        this.updateChannelHeader(channelId, 'text');
        
        // Hide skeleton after a short delay to simulate loading
        setTimeout(() => {
            const skeletonContainer = document.getElementById('chat-skeleton-loading');
            const realContent = document.getElementById('chat-real-content');
            
            if (skeletonContainer) {
                skeletonContainer.style.display = 'none';
            }
            
            if (realContent) {
                realContent.style.display = 'block';
            }
            
            console.log('🔧 [SWITCH-MANAGER] Fallback initialization complete');
        }, 1500);
    }
    
    async initializeVoiceChannel(channelId, forceFresh = false) {
        console.log('🔄 [SWITCH-MANAGER] Initializing voice channel:', channelId);
        
        // Store current participants before cleanup
        const currentParticipants = window.voiceManager?.getParticipants?.() || [];
        const wasConnected = window.voiceManager?.isConnected || false;
        const previousChannelId = window.voiceManager?.currentChannelId;
        
        if (window.chatSection) {
            console.log('🔄 [SWITCH-MANAGER] Ensuring chat section cleanup for voice channel');
            window.chatSection.leaveCurrentSocketRoom();
            window.chatSection.forceStopAllOperations();
        }
        
        // Only reset state if we're switching to a different channel
        if (window.voiceSection && (forceFresh || previousChannelId !== channelId)) {
            await window.voiceSection.resetState();
            await window.voiceSection.updateChannelId(channelId, true);
        }
        
        // Sync voice manager to the new channel
        if (window.voiceManager) {
            window.voiceManager.currentChannelId = channelId;
            
            try {
                // Only leave voice if switching to a different channel
                if (wasConnected && previousChannelId !== channelId) {
                    window.voiceManager.leaveVoice();
                }
                
                // Setup voice for the new channel
                await window.voiceManager.setupVoice(channelId);
                
                // If we were connected and have participants, restore them
                if (wasConnected && currentParticipants.length > 0) {
                    console.log('🔄 [SWITCH-MANAGER] Restoring voice participants:', currentParticipants.length);
                    
                    // Update participant grid
                    const participantGrid = document.getElementById('participantGrid');
                    if (participantGrid) {
                        participantGrid.innerHTML = ''; // Clear existing
                        currentParticipants.forEach(participant => {
                            if (window.voiceManager.addParticipantToGrid) {
                                window.voiceManager.addParticipantToGrid(participant);
                            }
                        });
                    }
                    
                    // Update participant count
                    const participantCount = document.getElementById('voiceParticipantCount');
                    if (participantCount) {
                        participantCount.textContent = currentParticipants.length.toString();
                    }
                }
            } catch (e) {
                console.warn('[SWITCH-MANAGER] Could not setup voiceManager for new channel:', e);
            }
        }
        
        // Ensure voice UI is properly shown
        const voiceCallApp = document.querySelector('.voice-call-app');
        if (voiceCallApp) {
            voiceCallApp.style.display = 'flex';
        }
        
        console.log('✅ [SWITCH-MANAGER] Voice channel initialization complete');
    }
    
    showSection(channelType, channelId) {
        const chatSection = document.querySelector('.chat-section');
        const voiceSection = document.querySelector('.voice-section');
        
        console.log('🎨 [SWITCH-MANAGER] Showing section:', channelType, 'for channel:', channelId);
        
        if (channelType === 'voice') {
            if (chatSection) {
                chatSection.classList.add('hidden');
                chatSection.style.display = 'none';
            }
            if (voiceSection) {
                voiceSection.classList.remove('hidden');
                voiceSection.style.display = 'flex';
                voiceSection.setAttribute('data-channel-id', channelId);
            }
            console.log('✅ [SWITCH-MANAGER] Voice section shown, chat section hidden');
        } else {
            if (voiceSection) {
                voiceSection.classList.add('hidden');
                voiceSection.style.display = 'none';
            }
            if (chatSection) {
                chatSection.classList.remove('hidden');
                chatSection.style.display = 'flex';
                chatSection.setAttribute('data-channel-id', channelId);
            }
            console.log('✅ [SWITCH-MANAGER] Chat section shown, voice section hidden');
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
        let metaChatId = document.querySelector('meta[name="chat-id"]');
        let metaChatType = document.querySelector('meta[name="chat-type"]');
        
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
        
        if (!metaChatId) {
            metaChatId = document.createElement('meta');
            metaChatId.name = 'chat-id';
            document.head.appendChild(metaChatId);
        }
        
        if (!metaChatType) {
            metaChatType = document.createElement('meta');
            metaChatType.name = 'chat-type';
            document.head.appendChild(metaChatType);
        }
        
        metaChannelId.content = channelId;
        metaChannelType.content = channelType;
        metaChatId.content = channelId;
        metaChatType.content = 'channel';
        
        console.log('✅ [SWITCH-MANAGER] Meta tags updated for reactions system:', {
            channelId,
            channelType,
            chatId: channelId,
            chatType: 'channel'
        });
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
    
    preserveVoiceParticipants() {
        // DISABLED: Voice participants now use presence-only system
        // Automatic presence updates handle channel switches without manual refresh
    }

    updateVoiceParticipantsAfterSwitch(channelId, channelType) {
        // DISABLED: Voice participants now use presence-only system  
        // Prevents blinking caused by manual refreshes during channel switches
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