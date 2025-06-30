class ChannelSwitchManager {
    constructor() {
        this.isLoading = false;
        this.currentChannelId = null;
        this.currentServerId = null;
        this.currentChannelType = null;
        this.switchQueue = [];
        this.init();
        this.injectSwitchingCSS();
    }

    init() {
        console.log('[ChannelSwitchManager] Initializing channel switch manager');
        this.currentServerId = this.getServerIdFromURL();
        this.bindChannelClickEvents();
        this.setupPopstateListener();
        this.initializeCurrentChannel();
    }

    injectSwitchingCSS() {
        if (document.getElementById('channel-switch-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'channel-switch-styles';
        style.textContent = `
            .channel-item.switching {
                opacity: 0.7;
                pointer-events: none;
                position: relative;
            }
            
            .channel-item.switching::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 12px;
                height: 12px;
                margin: -6px 0 0 -6px;
                border: 2px solid transparent;
                border-top: 2px solid #ffffff;
                border-radius: 50%;
                animation: channel-switch-spin 0.8s linear infinite;
            }
            
            @keyframes channel-switch-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .chat-section, .voice-section {
                transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
            }
            
            .chat-section.hidden, .voice-section.hidden {
                opacity: 0;
                transform: translateY(10px);
            }
            
            .section-loading {
                position: relative;
                overflow: hidden;
            }
            
            .section-loading::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 2px;
                background: linear-gradient(90deg, transparent, #5865f2, transparent);
                animation: loading-bar 1.5s linear infinite;
                z-index: 1000;
            }
            
            @keyframes loading-bar {
                0% { left: -100%; }
                100% { left: 100%; }
            }
        `;
        document.head.appendChild(style);
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
        
        if (this.currentChannelId === channelId && this.currentChannelType === channelType) {
            console.log('[ChannelSwitchManager] Already on this channel');
            return;
        }

        this.isLoading = true;
        this.showChannelSwitchingState(clickedElement);

        try {
            this.leaveCurrentChannel();
            
            this.updateActiveChannelUI(channelId);
            
            this.updateSections(channelType);
            
            await new Promise(resolve => setTimeout(resolve, 100));
            
            if (channelType === 'text') {
                this.updateChatMetaTags(channelId, serverId);
                
                const messageInput = document.querySelector('#message-input');
                if (messageInput) {
                    messageInput.placeholder = `Message #${channelName}`;
                    console.log('[ChannelSwitchManager] ✅ Updated message input placeholder to:', messageInput.placeholder);
                } else {
                    console.warn('[ChannelSwitchManager] ⚠️ Message input element not found');
                }
                
                await new Promise(resolve => setTimeout(resolve, 100));
                this.initializeChatSection(channelId);
                
                await new Promise(resolve => setTimeout(resolve, 200));
                if (window.chatSection && window.chatSection.isLoading) {
                    await new Promise(resolve => {
                        const checkLoading = () => {
                            if (!window.chatSection.isLoading) {
                                resolve();
                            } else {
                                setTimeout(checkLoading, 100);
                            }
                        };
                        checkLoading();
                    });
                }
            } else if (channelType === 'voice') {
                this.initializeVoiceSection(channelId);
            }
            
            if (updateHistory) {
                this.updateURL(serverId, channelId, channelType);
            }
            
            this.currentChannelId = channelId;
            this.currentChannelType = channelType;
            this.currentServerId = serverId;
            
            console.log('[ChannelSwitchManager] Channel switch completed successfully');

        } catch (error) {
            console.error('[ChannelSwitchManager] Error switching channel:', error);
            this.showNotification?.('Failed to switch channel. Please try again.', 'error');
        } finally {
            this.isLoading = false;
            this.hideChannelSwitchingState(clickedElement);
            
            setTimeout(() => {
                this.processQueue();
            }, 100);
        }
    }

    leaveCurrentChannel() {
        if (this.currentChannelId && window.globalSocketManager) {
            console.log('[ChannelSwitchManager] Leaving current channel:', this.currentChannelId);
            window.globalSocketManager.leaveChannel(this.currentChannelId);
        }
        
        // DON'T cleanup voice manager when switching channels - keep voice alive!
        // Voice should only disconnect when explicitly requested by user
        if (this.currentChannelType === 'voice' && window.voiceManager) {
            console.log('[ChannelSwitchManager] Keeping voice connection alive during channel switch');
            // Just update the voice state to reflect we're no longer on the voice channel page
            if (window.globalVoiceIndicator) {
                setTimeout(() => {
                    window.globalVoiceIndicator.ensureIndicatorVisible();
                }, 200);
            }
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
            
            // Hide chat section
            if (chatSection) {
                chatSection.classList.add('hidden');
                chatSection.style.display = 'none';
                console.log('[ChannelSwitchManager] Chat section hidden');
            }
            
            // Show voice section
            if (voiceSection) {
                voiceSection.classList.remove('hidden');
                voiceSection.style.display = 'flex';
                console.log('[ChannelSwitchManager] Voice section shown');
            } else {
                console.log('[ChannelSwitchManager] Voice section not found - will be created');
            }
            
            // Cleanup chat section instance
            if (window.chatSection) {
                console.log('[ChannelSwitchManager] Cleaning up chat section instance');
                if (typeof window.chatSection.cleanup === 'function') {
                    window.chatSection.cleanup();
                }
                window.chatSection = null;
            }
            
            // Reset chat messages to ensure clean state
            const chatMessages = document.getElementById('chat-messages');
            if (chatMessages) {
                chatMessages.innerHTML = `
                    <div class="flex flex-col items-center justify-center h-full text-gray-400">
                        <i class="fas fa-comments text-6xl mb-4"></i>
                        <p class="text-lg">Switch to a text channel to see messages</p>
                    </div>
                `;
            }
            
        } else {
            console.log('[ChannelSwitchManager] Switching to chat section');
            
            // Hide voice section
            if (voiceSection) {
                voiceSection.classList.add('hidden');
                voiceSection.style.display = 'none';
                console.log('[ChannelSwitchManager] Voice section hidden');
            }
            
            // Show chat section
            if (chatSection) {
                chatSection.classList.remove('hidden');
                chatSection.style.display = 'flex';
                console.log('[ChannelSwitchManager] Chat section shown');
            } else {
                console.log('[ChannelSwitchManager] Chat section not found - will be created');
            }
            
            // DON'T cleanup voice manager - keep voice alive across channel switches!
            // Just clean up the voice section UI components
            if (window.voiceSection) {
                console.log('[ChannelSwitchManager] Cleaning up voice section UI only');
                if (typeof window.voiceSection.cleanup === 'function') {
                    window.voiceSection.cleanup();
                }
                window.voiceSection = null;
            }
            
            // Show global voice indicator if voice is still connected
            if (window.voiceManager && window.voiceManager.isConnected && window.globalVoiceIndicator) {
                console.log('[ChannelSwitchManager] Voice still connected, showing global indicator');
                setTimeout(() => {
                    window.globalVoiceIndicator.ensureIndicatorVisible();
                }, 300);
            }
            
            // Reset voice section UI to initial state
            const joinView = document.getElementById('joinView');
            const connectingView = document.getElementById('connectingView');
            const connectedView = document.getElementById('connectedView');
            
            if (joinView) joinView.classList.remove('hidden');
            if (connectingView) connectingView.classList.add('hidden');
            if (connectedView) connectedView.classList.add('hidden');
        }
        
        // Add transition effects
        this.addSectionTransitions();
    }
    
    addSectionTransitions() {
        const sections = document.querySelectorAll('.chat-section, .voice-section');
        sections.forEach(section => {
            if (!section.style.transition) {
                section.style.transition = 'opacity 0.2s ease-in-out';
            }
        });
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
        
        const channelElement = document.querySelector(`[data-channel-id="${channelId}"]`);
        const channelName = channelElement ? channelElement.textContent.trim().replace('#', '') : 'channel';
        const channelType = channelElement ? (channelElement.getAttribute('data-channel-type') || 'text') : 'text';
        
        console.log('[ChannelSwitchManager] Channel details:', { channelId, channelName, channelType });
        
        const channelNameElement = document.querySelector('#channel-name');
        const channelIconElement = document.querySelector('#channel-icon');
        
        if (channelNameElement) {
            channelNameElement.textContent = channelName;
            console.log('[ChannelSwitchManager] ✅ Updated channel name to:', channelName);
        } else {
            console.warn('[ChannelSwitchManager] ⚠️ Channel name element not found');
        }
        
        if (channelIconElement) {
            const iconClass = channelType === 'voice' ? 'fas fa-volume-high' : 'fas fa-hashtag';
            channelIconElement.className = `${iconClass} text-[#949ba4] mr-2`;
            console.log('[ChannelSwitchManager] ✅ Updated channel icon to:', iconClass);
        } else {
            console.warn('[ChannelSwitchManager] ⚠️ Channel icon element not found');
        }
        
        this.updateChatMetaTags(channelId, this.currentServerId);
        
        const messageInput = document.querySelector('#message-input');
        if (messageInput) {
            messageInput.placeholder = `Message #${channelName}`;
            console.log('[ChannelSwitchManager] ✅ Updated message input placeholder to:', messageInput.placeholder);
        } else {
            console.warn('[ChannelSwitchManager] ⚠️ Message input element not found');
        }
        
        if (window.chatSection && typeof window.chatSection.switchTarget === 'function') {
            console.log('[ChannelSwitchManager] Switching existing chat section to channel:', channelId);
            
            try {
                const previousTargetId = window.chatSection.targetId;
                const previousChatType = window.chatSection.chatType;
                
                console.log('[ChannelSwitchManager] Previous target:', { previousChatType, previousTargetId });
                console.log('[ChannelSwitchManager] New target:', { chatType: 'channel', targetId: channelId });
                
                window.chatSection.switchTarget('channel', channelId);
                
                console.log('[ChannelSwitchManager] ✅ Successfully called switchTarget for channel:', channelId);
                
            } catch (error) {
                console.error('[ChannelSwitchManager] ❌ Error switching chat section target:', error);
                console.log('[ChannelSwitchManager] Falling back to creating new chat section instance');
                this.createChatSectionInstance(channelId);
            }
        } else {
            console.log('[ChannelSwitchManager] Chat section not found or switchTarget not available, creating new instance');
            this.createChatSectionInstance(channelId);
        }
        
        if (window.globalSocketManager && window.globalSocketManager.isReady()) {
            console.log('[ChannelSwitchManager] Joining channel socket room:', channelId);
            window.globalSocketManager.joinChannel(channelId);
        }
    }
    
    createChatSectionInstance(channelId) {
        if (typeof window.initializeChatSection === 'function') {
            console.log('[ChannelSwitchManager] Using global initializeChatSection function');
            window.initializeChatSection();
        } else if (typeof window.ChatSection === 'function') {
            console.log('[ChannelSwitchManager] Creating ChatSection instance manually');
            const chatSection = new window.ChatSection({
                chatType: 'channel',
                targetId: channelId,
                userId: window.currentUserId || document.querySelector('meta[name="user-id"]')?.getAttribute('content'),
                username: window.currentUsername || document.querySelector('meta[name="username"]')?.getAttribute('content')
            });
            window.chatSection = chatSection;
            
            // Initialize the chat section
            if (typeof chatSection.init === 'function') {
                chatSection.init();
            }
        } else {
            console.log('[ChannelSwitchManager] Loading chat section script dynamically');
            this.loadChatSectionScript().then(() => {
                this.createChatSectionInstance(channelId);
            });
        }
    }
    
    loadChatSectionScript() {
        return new Promise((resolve, reject) => {
            if (document.querySelector('script[src*="chat-section.js"]')) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = '/public/js/components/messaging/chat-section.js?v=' + Date.now();
            script.onload = () => {
                console.log('[ChannelSwitchManager] Chat section script loaded');
                resolve();
            };
            script.onerror = () => {
                console.error('[ChannelSwitchManager] Failed to load chat section script');
                reject();
            };
            document.head.appendChild(script);
        });
    }

    initializeVoiceSection(channelId) {
        console.log('[ChannelSwitchManager] Initializing voice section for channel:', channelId);
        
        let voiceSection = document.querySelector('.voice-section');
        if (!voiceSection) {
            console.log('[ChannelSwitchManager] Voice section element not found, creating it');
            const mainContent = document.querySelector('#main-content');
            if (mainContent) {
                voiceSection = document.createElement('div');
                voiceSection.className = 'voice-section flex flex-col h-screen bg-[#313338] text-white';
                voiceSection.innerHTML = `
                    <div class="flex flex-col flex-1">
                        <div class="h-12 border-b border-gray-600 px-4 flex items-center">
                            <div class="flex items-center">
                                <i class="fas fa-volume-high text-gray-500 mr-2"></i>
                                <span class="text-white font-semibold" id="voice-channel-name">Loading...</span>
                            </div>
                        </div>
                        <div class="flex-1 flex flex-col items-center justify-center p-8">
                            <div id="joinView" class="text-center">
                                <i class="fas fa-microphone text-6xl mb-4 text-gray-400"></i>
                                <h2 class="text-2xl font-bold mb-4">Join Voice Channel</h2>
                                <p class="text-gray-400 mb-6">Connect to start talking with others in this channel</p>
                                <button id="joinBtn" class="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors" data-channel-id="${channelId}">
                                    <i class="fas fa-microphone mr-2"></i>
                                    Join Voice
                                </button>
                            </div>
                            <div id="connectingView" class="text-center hidden">
                                <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500 mb-4"></div>
                                <p class="text-lg">Connecting to voice channel...</p>
                            </div>
                            <div id="connectedView" class="w-full hidden">
                                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div class="text-center">
                                        <div class="bg-gray-700 rounded-lg p-4">
                                            <div class="w-16 h-16 bg-gray-600 rounded-full mx-auto mb-2"></div>
                                            <p class="text-sm">You</p>
                                            <div class="flex items-center justify-center mt-2 space-x-2">
                                                <button class="text-gray-400 hover:text-white">
                                                    <i class="fas fa-microphone"></i>
                                                </button>
                                                <button class="text-gray-400 hover:text-white">
                                                    <i class="fas fa-video"></i>
                                                </button>
                                                <button class="text-red-400 hover:text-red-300" id="leaveBtn">
                                                    <i class="fas fa-phone-slash"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                mainContent.appendChild(voiceSection);
            }
        }
        
        const voiceChannelNameElement = document.querySelector('#voice-channel-name');
        const channelElement = document.querySelector(`[data-channel-id="${channelId}"]`);
        const channelName = channelElement ? channelElement.textContent.trim() : 'Voice Channel';
        if (voiceChannelNameElement) {
            voiceChannelNameElement.textContent = channelName;
        }
        
        const joinBtn = document.getElementById('joinBtn');
        if (joinBtn) {
            joinBtn.setAttribute('data-channel-id', channelId);
        }
        
        if (window.voiceSection) {
            console.log('[ChannelSwitchManager] Updating existing voice section for channel:', channelId);
            if (typeof window.voiceSection.updateChannelId === 'function') {
                window.voiceSection.updateChannelId(channelId);
            } else {
                window.voiceSection.resetState();
            }
        } else {
            console.log('[ChannelSwitchManager] Loading voice scripts and initializing voice section');
            this.loadVoiceScripts().then(() => {
                console.log('[ChannelSwitchManager] Voice scripts loaded, initializing voice components');
                this.initializeVoiceComponents(channelId);
            }).catch(error => {
                console.error('[ChannelSwitchManager] Failed to load voice scripts:', error);
            });
        }
        
        if (window.globalSocketManager && window.globalSocketManager.isReady()) {
            console.log('[ChannelSwitchManager] Joining voice channel socket room:', channelId);
            setTimeout(() => {
                window.globalSocketManager.joinChannel(channelId);
            }, 300);
        }
    }
    
    loadVoiceScripts() {
        return new Promise(async (resolve, reject) => {
            try {
                // Load VideoSDK if not already loaded
                if (!window.VideoSDK) {
                    console.log('[ChannelSwitchManager] Loading VideoSDK');
                    await this.loadScript('https://sdk.videosdk.live/js-sdk/0.2.7/videosdk.js');
                }
                
                // Load VideoSDK manager if not already loaded
                if (!window.videoSDKManager) {
                    console.log('[ChannelSwitchManager] Loading VideoSDK manager');
                    await this.loadScript('/public/js/components/videosdk/videosdk.js?v=' + Date.now());
                }
                
                // Load voice manager if not already loaded
                if (!window.VoiceManager && !document.querySelector('script[src*="voice-manager.js"]')) {
                    console.log('[ChannelSwitchManager] Loading voice manager');
                    await this.loadScript('/public/js/components/voice/voice-manager.js?v=' + Date.now());
                }
                
                // Load voice section if not already loaded
                if (!window.VoiceSection && !document.querySelector('script[src*="voice-section.js"]')) {
                    console.log('[ChannelSwitchManager] Loading voice section');
                    await this.loadScript('/public/js/components/voice/voice-section.js?v=' + Date.now());
                }
                
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }
    
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const existingScript = document.querySelector(`script[src="${src}"]`);
            if (existingScript) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    initializeVoiceComponents(channelId) {
        console.log('[ChannelSwitchManager] Initializing voice components for channel:', channelId);
        
        // Initialize join button functionality
        const joinBtn = document.getElementById('joinBtn');
        if (joinBtn) {
            // Remove existing event listeners
            const newJoinBtn = joinBtn.cloneNode(true);
            joinBtn.parentNode.replaceChild(newJoinBtn, joinBtn);
            
            newJoinBtn.addEventListener('click', () => {
                console.log('[ChannelSwitchManager] Join voice button clicked');
                this.handleVoiceJoin(channelId);
            });
        }
        
        // Initialize leave button functionality
        const leaveBtn = document.getElementById('leaveBtn');
        if (leaveBtn) {
            const newLeaveBtn = leaveBtn.cloneNode(true);
            leaveBtn.parentNode.replaceChild(newLeaveBtn, leaveBtn);
            
            newLeaveBtn.addEventListener('click', () => {
                console.log('[ChannelSwitchManager] Leave voice button clicked');
                this.handleVoiceLeave();
            });
        }
        
        // Initialize VoiceSection if available
        if (typeof window.VoiceSection === 'function') {
            console.log('[ChannelSwitchManager] Creating VoiceSection instance');
            window.voiceSection = new window.VoiceSection();
        }
        
        // Dispatch voice section loaded event
        const event = new CustomEvent('voiceSectionLoaded', {
            detail: { channelId }
        });
        document.dispatchEvent(event);
    }
    
    handleVoiceJoin(channelId) {
        console.log('[ChannelSwitchManager] Handling voice join for channel:', channelId);
        
        const joinView = document.getElementById('joinView');
        const connectingView = document.getElementById('connectingView');
        
        if (joinView) joinView.classList.add('hidden');
        if (connectingView) connectingView.classList.remove('hidden');
        
        // Initialize voice manager if available
        if (window.voiceManager && typeof window.voiceManager.joinVoice === 'function') {
            window.voiceManager.joinVoice();
        } else if (window.voiceSection && typeof window.voiceSection.autoJoin === 'function') {
            window.voiceSection.autoJoin();
        } else {
            console.warn('[ChannelSwitchManager] No voice manager available for joining');
            setTimeout(() => {
                if (joinView) joinView.classList.remove('hidden');
                if (connectingView) connectingView.classList.add('hidden');
            }, 2000);
        }
    }
    
    handleVoiceLeave() {
        console.log('[ChannelSwitchManager] Handling voice leave');
        
        if (window.voiceManager && typeof window.voiceManager.leaveVoice === 'function') {
            window.voiceManager.leaveVoice();
        }
        
        const joinView = document.getElementById('joinView');
        const connectedView = document.getElementById('connectedView');
        const connectingView = document.getElementById('connectingView');
        
        if (connectedView) connectedView.classList.add('hidden');
        if (connectingView) connectingView.classList.add('hidden');
        if (joinView) joinView.classList.remove('hidden');
    }

    showChannelSwitchingState(element) {
        if (element) {
            element.classList.add('switching');
        }
        
        // Add loading state to current section
        const currentSection = this.currentChannelType === 'voice' 
            ? document.querySelector('.voice-section')
            : document.querySelector('.chat-section');
            
        if (currentSection) {
            currentSection.classList.add('section-loading');
        }
        
        // Disable all channel items during switch
        document.querySelectorAll('.channel-item').forEach(item => {
            item.style.pointerEvents = 'none';
        });
    }

    hideChannelSwitchingState(element) {
        if (element) {
            element.classList.remove('switching');
        }
        
        // Remove loading state from all sections
        document.querySelectorAll('.chat-section, .voice-section').forEach(section => {
            section.classList.remove('section-loading');
        });
        
        // Re-enable all channel items
        document.querySelectorAll('.channel-item').forEach(item => {
            item.style.pointerEvents = '';
        });
        
        // Add a brief delay to ensure UI is properly updated
        setTimeout(() => {
            this.validateSectionState();
        }, 100);
    }
    
    validateSectionState() {
        const chatSection = document.querySelector('.chat-section');
        const voiceSection = document.querySelector('.voice-section');
        
        console.log('[ChannelSwitchManager] Validating section state:', {
            currentChannelType: this.currentChannelType,
            chatSectionVisible: chatSection && !chatSection.classList.contains('hidden'),
            voiceSectionVisible: voiceSection && !voiceSection.classList.contains('hidden')
        });
        
        // Ensure only the correct section is visible
        if (this.currentChannelType === 'voice') {
            if (chatSection && !chatSection.classList.contains('hidden')) {
                console.warn('[ChannelSwitchManager] Chat section still visible, hiding it');
                chatSection.classList.add('hidden');
                chatSection.style.display = 'none';
            }
            if (voiceSection && voiceSection.classList.contains('hidden')) {
                console.warn('[ChannelSwitchManager] Voice section hidden, showing it');
                voiceSection.classList.remove('hidden');
                voiceSection.style.display = 'flex';
            }
        } else {
            if (voiceSection && !voiceSection.classList.contains('hidden')) {
                console.warn('[ChannelSwitchManager] Voice section still visible, hiding it');
                voiceSection.classList.add('hidden');
                voiceSection.style.display = 'none';
            }
            if (chatSection && chatSection.classList.contains('hidden')) {
                console.warn('[ChannelSwitchManager] Chat section hidden, showing it');
                chatSection.classList.remove('hidden');
                chatSection.style.display = 'flex';
            }
        }
    }

    processQueue() {
        if (this.switchQueue.length > 0 && !this.isLoading) {
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

    initializeCurrentChannel() {
        // Get current channel from URL
        const urlParams = new URLSearchParams(window.location.search);
        const channelId = urlParams.get('channel');
        const channelType = urlParams.get('type') || 'text';
        
        if (channelId) {
            console.log('[ChannelSwitchManager] Initializing current channel from URL:', { channelId, channelType });
            
            // Set current state without switching (since we're already on this channel)
            this.currentChannelId = channelId;
            this.currentChannelType = channelType;
            
            // Update UI to reflect current state
            this.updateActiveChannelUI(channelId);
            
            // Initialize appropriate section
            setTimeout(() => {
                if (channelType === 'voice') {
                    this.ensureVoiceSectionVisible();
                    this.initializeVoiceSection(channelId);
                } else {
                    this.ensureChatSectionVisible();
                    this.updateChatMetaTags(channelId, this.currentServerId);
                    this.initializeChatSection(channelId);
                }
            }, 200);
        } else {
            // No channel specified, find and initialize first text channel
            const firstTextChannel = document.querySelector('.channel-item[data-channel-type="text"]');
            if (firstTextChannel) {
                const firstChannelId = firstTextChannel.getAttribute('data-channel-id');
                console.log('[ChannelSwitchManager] No channel in URL, initializing first text channel:', firstChannelId);
                
                setTimeout(() => {
                    this.switchToChannel(this.currentServerId, firstChannelId, 'text', null, true);
                }, 300);
            }
        }
    }
    
    ensureChatSectionVisible() {
        const chatSection = document.querySelector('.chat-section');
        const voiceSection = document.querySelector('.voice-section');
        
        if (voiceSection) {
            voiceSection.classList.add('hidden');
            voiceSection.style.display = 'none';
        }
        
        if (chatSection) {
            chatSection.classList.remove('hidden');
            chatSection.style.display = 'flex';
        }
    }
    
    ensureVoiceSectionVisible() {
        const chatSection = document.querySelector('.chat-section');
        const voiceSection = document.querySelector('.voice-section');
        
        if (chatSection) {
            chatSection.classList.add('hidden');
            chatSection.style.display = 'none';
        }
        
        if (voiceSection) {
            voiceSection.classList.remove('hidden');
            voiceSection.style.display = 'flex';
        }
    }

    showNotification(message, type = 'info', duration = 3000) {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type, duration);
        } else {
            console.log(`[ChannelSwitchManager] ${type.toUpperCase()}: ${message}`);
            
            const notification = document.createElement('div');
            notification.className = `fixed bottom-4 right-4 p-3 rounded shadow-lg z-50 ${
                type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-blue-500'
            } text-white`;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.classList.add('opacity-0');
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }, duration);
        }
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