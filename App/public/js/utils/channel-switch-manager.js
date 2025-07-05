

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
            

            this.showSection(channelType, channelId);
        }
    }
    
    setupChannelClicks() {
        document.addEventListener('click', (e) => {
            const channelItem = e.target.closest('.channel-item');
            if (!channelItem) return;
            
            if (e.target.closest('.channel-menu') || e.target.closest('.channel-dropdown')) {

                return;
            }
            
            e.preventDefault();
            e.stopPropagation();
            
            const loadMoreContainer = document.querySelector('#load-more-container');
            if (loadMoreContainer) {
                loadMoreContainer.classList.add('hidden');

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

                    channelType = 'voice';
                }
            }
            
            const voiceSection = document.querySelector('.voice-section:not(.hidden)');
            const chatSection = document.querySelector('.chat-section:not(.hidden)');
            
            if (voiceSection && !chatSection && channelType !== 'voice') {

                channelType = 'voice';
            }
            
            this.switchToChannel(channelId, channelType, true);
        }
    }
    
    highlightInitialActiveChannel() {
        const activeChannelInput = document.getElementById('active-channel-id');
        if (activeChannelInput && activeChannelInput.value) {
            const activeChannelId = activeChannelInput.value;

            this.updateActiveChannel(activeChannelId);
        } else {
            const activeChannel = document.querySelector('.channel-item.active');
            if (activeChannel) {
                const channelId = activeChannel.getAttribute('data-channel-id');

                this.updateActiveChannel(channelId);
            }
        }
    }
    
    async switchToChannel(channelId, channelType = 'text', forceFresh = false, highlightMessageId = null) {
        if (this.isLoading) return;
        

        const previousChannelId = this.currentChannelId;
        const previousChannelType = this.currentChannelType;
        const isSameVoiceChannel = previousChannelType === 'voice' && channelType === 'voice' && previousChannelId === channelId;
        

        const wasInVoiceCall = window.unifiedVoiceStateManager?.getState()?.isConnected || false;
        const voiceChannelId = wasInVoiceCall ? (window.unifiedVoiceStateManager?.getState()?.channelId || window.voiceManager?.currentChannelId) : null;
        const voiceChannelName = wasInVoiceCall ? (window.unifiedVoiceStateManager?.getState()?.channelName || 'Voice Channel') : null;
        
        console.log('🔄 [SWITCH-MANAGER] Voice state preservation check:', {
            wasInVoiceCall,
            voiceChannelId,
            voiceChannelName,
            switchingFromVoiceToText: previousChannelType === 'voice' && channelType === 'text'
        });
        
        this.isLoading = true;
        
        const loadMoreContainer = document.querySelector('#load-more-container');
        if (loadMoreContainer) {
            loadMoreContainer.classList.add('hidden');

        }
        

        this.currentChannelId = channelId;
        this.currentChannelType = channelType;
        
        this.updateActiveChannel(channelId);
        this.showSection(channelType, channelId);
        this.updateURL(channelId, channelType);
        this.updateMetaTags(channelId, channelType);
        this.updateChannelHeader(channelId, channelType);
        

        

        if (wasInVoiceCall && channelType === 'text' && voiceChannelId) {

            

            if (window.unifiedVoiceStateManager) {
                const currentState = window.unifiedVoiceStateManager.getState();
                window.unifiedVoiceStateManager.setState({
                    ...currentState,
                    isConnected: true,
                    channelId: voiceChannelId,
                    channelName: voiceChannelName,

                    isViewingDifferentChannel: true,
                    originalVoiceChannelId: voiceChannelId
                });

            }
            

            if (window.voiceManager) {
                window.voiceManager.currentChannelId = voiceChannelId;
                window.voiceManager.currentChannelName = voiceChannelName;

            }
            

            window.dispatchEvent(new CustomEvent('voiceContextPreserved', {
                detail: { 
                    voiceChannelId, 
                    voiceChannelName, 
                    currentViewChannelId: channelId,
                    currentViewChannelType: channelType
                }
            }));
        }
        

        if (channelType === 'voice') {
            const channelElement = document.querySelector(`[data-channel-id="${channelId}"]`);
            const channelName = channelElement?.querySelector('.channel-name')?.textContent?.trim() || 
                               channelElement?.getAttribute('data-channel-name') || 
                               'Voice Channel';
            

            this.forceSyncVoiceContext(channelId, channelName);
        }
        
        if (window.emojiReactions && typeof window.emojiReactions.updateChannelContext === 'function') {

            window.emojiReactions.updateChannelContext(channelId, 'channel');
        }


        this.preserveVoiceParticipants();
        
        if (channelType === 'text') {
            await this.initializeTextChannel(channelId, true);
            
            if (highlightMessageId) {
                setTimeout(() => {
                    this.highlightMessage(highlightMessageId);
                }, 1000);
            }
        } else if (channelType === 'voice') {

            await this.initializeVoiceChannel(channelId, !isSameVoiceChannel);
        }


        this.updateVoiceParticipantsAfterSwitch(channelId, channelType);
        

        if (channelType === 'voice') {
            const channelElement = document.querySelector(`[data-channel-id="${channelId}"]`);
            const channelName = channelElement?.querySelector('.channel-name')?.textContent?.trim() || 
                               channelElement?.getAttribute('data-channel-name') || 
                               'Voice Channel';
            this.forceSyncVoiceContext(channelId, channelName);
        }
        

        if (channelType === 'text' && wasInVoiceCall && voiceChannelId) {

            setTimeout(() => {
                const finalState = window.unifiedVoiceStateManager?.getState();
                if (finalState && finalState.isConnected && finalState.channelId === voiceChannelId) {

                } else {
                    console.warn('⚠️ [SWITCH-MANAGER] Voice context may not be properly preserved, attempting fix...');
                    if (window.unifiedVoiceStateManager) {
                        window.unifiedVoiceStateManager.setState({
                            isConnected: true,
                            channelId: voiceChannelId,
                            channelName: voiceChannelName,
                            isViewingDifferentChannel: true,
                            originalVoiceChannelId: voiceChannelId
                        });
                    }
                }
            }, 500);
        }
        
        if (window.ChannelVoiceParticipants) {
            const instance = window.ChannelVoiceParticipants.getInstance();
            if (instance && typeof instance.onChannelSwitch === 'function') {
                instance.onChannelSwitch();
            }
        }
        
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
            

        } else {
            console.warn('⚠️ [SWITCH-MANAGER] Target channel not found for ID:', channelId);
        }
    }
    
    async initializeTextChannel(channelId, forceFresh = false) {

        
        const loadMoreContainer = document.querySelector('#load-more-container');
        if (loadMoreContainer) {
            loadMoreContainer.classList.add('hidden');

        }
        
        const messagesContainer = document.querySelector('#chat-messages .messages-container');

        

        
        this.showChatSkeletonDirect();
        
        if (window.chatSection) {

            await window.chatSection.resetForNewChannel();
            await new Promise(resolve => setTimeout(resolve, 100));
            await window.chatSection.switchToChannel(channelId, 'text', true);
        } else {

            

            try {
                if (typeof window.initializeChatSection === 'function') {

                    await window.initializeChatSection();
                } else if (typeof initializeChatSection === 'function') {

                    await initializeChatSection();
                }
                

                if (window.chatSection) {

                    await window.chatSection.resetForNewChannel();
                    await new Promise(resolve => setTimeout(resolve, 100));
                    await window.chatSection.switchToChannel(channelId, 'text', true);
                } else {

                    let attempts = 0;
                    const maxAttempts = 15;
                    
                    while (!window.chatSection && attempts < maxAttempts) {
                        await new Promise(resolve => setTimeout(resolve, 300));
                        attempts++;

                    }
                    
                    if (window.chatSection) {

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
        

    }
    
    fallbackTextChannelInit(channelId) {

        

        this.updateMetaTags(channelId, 'text');
        

        this.updateChannelHeader(channelId, 'text');
        

        setTimeout(() => {
            const skeletonContainer = document.getElementById('chat-skeleton-loading');
            const realContent = document.getElementById('chat-real-content');
            
            if (skeletonContainer) {
                skeletonContainer.style.display = 'none';
            }
            
            if (realContent) {
                realContent.style.display = 'block';
            }
            

        }, 1500);
    }
    
    async initializeVoiceChannel(channelId, forceFresh = false) {

        

        const currentParticipants = window.voiceManager?.getParticipants?.() || [];
        const wasConnected = window.voiceManager?.isConnected || false;
        const previousChannelId = window.voiceManager?.currentChannelId;
        
        if (window.chatSection) {

            window.chatSection.leaveCurrentSocketRoom();
            window.chatSection.forceStopAllOperations();
        }
        

        if (window.voiceSection && (forceFresh || previousChannelId !== channelId)) {
            await window.voiceSection.resetState();
            await window.voiceSection.updateChannelId(channelId, true);
        } else if (window.voiceSection && previousChannelId === channelId) {


            

            if (wasConnected && window.voiceManager && window.voiceManager.isConnected) {
                if (typeof window.voiceSection.restoreConnectedState === 'function') {
                    window.voiceSection.restoreConnectedState();
                } else {

                    if (window.voiceSection.elements.joinView) {
                        window.voiceSection.elements.joinView.classList.add('hidden');
                    }
                    if (window.voiceSection.elements.connectingView) {
                        window.voiceSection.elements.connectingView.classList.add('hidden');
                    }
                    if (window.voiceSection.elements.voiceControls) {
                        window.voiceSection.elements.voiceControls.classList.remove('hidden');
                    }
                }
                

                if (typeof window.voiceManager.refreshParticipantsUI === 'function') {
                    window.voiceManager.refreshParticipantsUI();
                }
            }
        }
        

        if (window.voiceManager) {
            window.voiceManager.currentChannelId = channelId;
            

            if (window.unifiedVoiceStateManager) {

                const currentState = window.unifiedVoiceStateManager.getState();
                window.unifiedVoiceStateManager.setState({
                    channelId: channelId,
                    isConnected: currentState.isConnected || wasConnected,
                    isMuted: currentState.isMuted || false,
                    isDeafened: currentState.isDeafened || false
                });
            }
            
            try {

                if (wasConnected && previousChannelId !== channelId) {
                    window.voiceManager.leaveVoice();
                }
                

                await window.voiceManager.setupVoice(channelId);
                

                if (wasConnected && currentParticipants.length > 0) {

                    

                    const participantGrid = document.getElementById('participantGrid');
                    if (participantGrid) {
                        participantGrid.innerHTML = ''; // Clear existing
                        currentParticipants.forEach(participant => {
                            if (window.voiceManager.addParticipantToGrid) {
                                window.voiceManager.addParticipantToGrid(participant);
                            }
                        });
                    }
                    

                    const participantCount = document.getElementById('voiceParticipantCount');
                    if (participantCount) {
                        participantCount.textContent = currentParticipants.length.toString();
                    }
                }
            } catch (e) {
                console.warn('[SWITCH-MANAGER] Could not setup voiceManager for new channel:', e);
            }
        }
        

        if (window.unifiedVoiceStateManager && wasConnected) {
            const currentState = window.unifiedVoiceStateManager.getState();
            if (currentState.isConnected && previousChannelId !== channelId) {
                const channelElement = document.querySelector(`[data-channel-id="${channelId}"]`);
                const channelName = channelElement?.querySelector('.channel-name')?.textContent?.trim() || 
                                   channelElement?.getAttribute('data-channel-name') || 
                                   'Voice Channel';
                
                console.log('🔄 [SWITCH-MANAGER] Updating unified voice state for channel switch:', {
                    fromChannel: previousChannelId,
                    toChannel: channelId,
                    channelName
                });
                
                window.unifiedVoiceStateManager.setState({
                    ...currentState,
                    channelId: channelId,
                    channelName: channelName
                });
            }
        }
        

        const voiceCallApp = document.querySelector('.voice-call-app');
        if (voiceCallApp) {
            voiceCallApp.style.display = 'flex';
        }
        

        if (previousChannelId === channelId && wasConnected) {
            setTimeout(() => {

                if (window.voiceManager && typeof window.voiceManager.refreshParticipantsUI === 'function') {
                    window.voiceManager.refreshParticipantsUI();
                } else if (window.videoSDKManager && window.videoSDKManager.refreshExistingParticipants) {
                    window.videoSDKManager.refreshExistingParticipants();
                }
            }, 500);
        }
        

    }
    
    showSection(channelType, channelId) {
        const chatSection = document.querySelector('.chat-section');
        const voiceSection = document.querySelector('.voice-section');
        

        
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


    }

    updateVoiceParticipantsAfterSwitch(channelId, channelType) {


    }


    forceSyncVoiceContext(channelId, channelName) {

        

        this.updateMetaTags(channelId, 'voice');
        this.updateURL(channelId, 'voice');
        

        if (window.unifiedVoiceStateManager) {
            const currentState = window.unifiedVoiceStateManager.getState();
            


            window.unifiedVoiceStateManager.setState({
                ...currentState,
                channelId: channelId,
                channelName: channelName
            });
        }
        

        if (window.voiceManager) {
            window.voiceManager.currentChannelId = channelId;
            window.voiceManager.currentChannelName = channelName;

        }
        

        this.currentChannelId = channelId;
        this.currentChannelType = 'voice';
        

        this.updateChannelHeader(channelId, 'voice');
        

        window.dispatchEvent(new CustomEvent('voiceContextChanged', {
            detail: { channelId, channelName, channelType: 'voice' }
        }));
        

    }


    debugVoiceContext() {

        
        const urlParams = new URLSearchParams(window.location.search);
        const urlChannelId = urlParams.get('channel');
        const urlChannelType = urlParams.get('type');
        
        const metaChannelId = document.querySelector('meta[name="channel-id"]')?.content;
        const metaChannelType = document.querySelector('meta[name="channel-type"]')?.content;
        
        const unifiedState = window.unifiedVoiceStateManager?.getState();
        const voiceManagerChannel = window.voiceManager?.currentChannelId;
        const switcherChannel = this.currentChannelId;
        
        console.log('🔍 Voice Context Sources:', {
            url: { channelId: urlChannelId, channelType: urlChannelType },
            meta: { channelId: metaChannelId, channelType: metaChannelType },
            unifiedState: unifiedState,
            voiceManager: { channelId: voiceManagerChannel, isConnected: window.voiceManager?.isConnected },
            switcher: { channelId: switcherChannel, channelType: this.currentChannelType }
        });
        

        const allChannelIds = [urlChannelId, metaChannelId, unifiedState?.channelId, voiceManagerChannel, switcherChannel].filter(Boolean);
        const uniqueChannelIds = [...new Set(allChannelIds)];
        
        if (uniqueChannelIds.length > 1) {
            console.warn('⚠️ [SWITCH-MANAGER] Voice context inconsistency detected!', uniqueChannelIds);
            return false;
        } else {

            return true;
        }
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


window.debugAllVoiceContext = function() {

    

    if (typeof window.debugTitiBotVoiceContext === 'function') {
        window.debugTitiBotVoiceContext();
    }
    

    if (window.simpleChannelSwitcher && typeof window.simpleChannelSwitcher.debugVoiceContext === 'function') {

        const isConsistent = window.simpleChannelSwitcher.debugVoiceContext();
        
        if (!isConsistent) {

        }
    }
};

window.fixVoiceContextInconsistency = function() {

    
    if (window.simpleChannelSwitcher) {
        const currentChannelId = window.simpleChannelSwitcher.currentChannelId;
        const currentChannelType = window.simpleChannelSwitcher.currentChannelType;
        
        if (currentChannelType === 'voice' && currentChannelId) {
            const channelElement = document.querySelector(`[data-channel-id="${currentChannelId}"]`);
            const channelName = channelElement?.querySelector('.channel-name')?.textContent?.trim() || 
                               channelElement?.getAttribute('data-channel-name') || 
                               'Voice Channel';
            
            window.simpleChannelSwitcher.forceSyncVoiceContext(currentChannelId, channelName);
            

            setTimeout(() => {

                window.debugAllVoiceContext();
            }, 1000);
        } else {

        }
    }
};


window.testVoiceContextAfterSwitch = function() {

    
    const urlParams = new URLSearchParams(window.location.search);
    const currentChannelId = urlParams.get('channel');
    const currentChannelType = urlParams.get('type');
    

    
    if (currentChannelType === 'voice') {

        

        let voiceChannelId = null;
        let userInVoice = false;
        let detectionMethod = 'none';
        
        const metaChannelType = document.querySelector('meta[name="channel-type"]')?.content;
        
        if ((currentChannelType === 'voice' || metaChannelType === 'voice') && currentChannelId) {
            const channelElement = document.querySelector(`[data-channel-id="${currentChannelId}"][data-channel-type="voice"]`);
            if (channelElement) {
                voiceChannelId = currentChannelId;
                userInVoice = true;
                detectionMethod = 'currentVoiceChannel+present';
            }
        }
        
        console.log('🎤 [TEST] Voice Detection Result:', {
            voiceChannelId,
            userInVoice,
            detectionMethod,
            expectedChannelId: currentChannelId
        });
        
        if (voiceChannelId === currentChannelId && userInVoice) {

            return true;
        } else {


            return false;
        }
    } else {

        return null;
    }
};

export default SimpleChannelSwitcher;