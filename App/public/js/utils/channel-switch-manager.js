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
        console.log('[ChannelSwitchManager] Initializing');
        this.currentServerId = this.getServerIdFromURL();
        this.currentChannelId = this.getChannelIdFromURL();
        this.currentChannelType = this.getChannelTypeFromURL();
        window.channelSwitchManager = this;
        this.attachEventListeners();
        
        document.body.addEventListener('click', this.handleGlobalClick.bind(this), true);
        console.log('[ChannelSwitchManager] Global click handler attached to document.body');
        
        window.addEventListener('load', () => {
            if (this.currentChannelType === 'voice') {
                console.log('[ChannelSwitchManager] Current channel is voice, initializing voice components');
                this.initializeVoiceComponents();
            }
        });
    }
    
    handleGlobalClick(event) {
        const target = event.target;
        const joinBtn = target.id === 'joinBtn' ? target : target.closest('#joinBtn');
        
        if (joinBtn) {
            console.log('[ChannelSwitchManager] Join button clicked via global handler');
            event.stopPropagation();
            event.preventDefault();
            
            joinBtn.classList.add('clicked-btn');
            
            if (window.voiceManager) {
                console.log('[ChannelSwitchManager] Using existing voiceManager to join');
                window.voiceManager.joinVoice();
                return;
            }
            
            const voiceSection = document.querySelector('.voice-section') || document.querySelector('#voice-section');
            if (voiceSection) {
                console.log('[ChannelSwitchManager] Found voice section, updating UI');
                if (voiceSection.querySelector('#connectingView')) {
                    const connectingView = voiceSection.querySelector('#connectingView');
                    const joinView = voiceSection.querySelector('#joinView');
                    
                    if (joinView) joinView.classList.add('hidden');
                    if (connectingView) connectingView.classList.remove('hidden');
                }
            }
            
            console.log('[ChannelSwitchManager] Loading voice scripts');
            this.loadVoiceScripts().then(() => {
                console.log('[ChannelSwitchManager] Voice scripts loaded, trying to join');
                if (window.voiceSection && typeof window.voiceSection.autoJoin === 'function') {
                    console.log('[ChannelSwitchManager] Using voiceSection.autoJoin()');
                    window.voiceSection.autoJoin();
                } else if (window.triggerVoiceAutoJoin) {
                    console.log('[ChannelSwitchManager] Using triggerVoiceAutoJoin()');
                    window.triggerVoiceAutoJoin();
                } else if (window.handleAutoJoin) {
                    console.log('[ChannelSwitchManager] Using handleAutoJoin()');
                    window.handleAutoJoin();
                }
            });
        }
    }
    
    async loadVoiceScripts() {
        console.log('[ChannelSwitchManager] Starting to load voice scripts');
        if (!window.VideoSDK) {
            console.log('[ChannelSwitchManager] Loading VideoSDK');
            await this.loadScript('https://sdk.videosdk.live/js-sdk/0.2.7/videosdk.js');
        }
        
        if (!window.videoSDKManager) {
            console.log('[ChannelSwitchManager] Loading videoSDKManager');
            await this.loadScript('/public/js/components/videosdk/videosdk.js?v=' + Date.now());
        }
        
        console.log('[ChannelSwitchManager] Loading voice-manager.js');
        await this.loadScript('/public/js/components/voice/voice-manager.js?v=' + Date.now());
        
        if (!window.voiceSection) {
            console.log('[ChannelSwitchManager] Loading voice-section.js');
            await this.loadScript('/public/js/components/voice/voice-section.js?v=' + Date.now());
            console.log('[ChannelSwitchManager] Creating VoiceSection instance');
            window.voiceSection = new VoiceSection();
        }
        
        console.log('[ChannelSwitchManager] All voice scripts loaded');
        return true;
    }
    
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const existingScript = document.querySelector(`script[src="${src}"]`);
            if (existingScript) {
                console.log(`[ChannelSwitchManager] Script already loaded: ${src}`);
                resolve();
                return;
            }
            
            console.log(`[ChannelSwitchManager] Loading script: ${src}`);
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            
            script.onload = () => {
                console.log(`[ChannelSwitchManager] Script loaded: ${src}`);
                resolve();
            };
            
            script.onerror = (error) => {
                console.error(`[ChannelSwitchManager] Error loading script: ${src}`, error);
                reject(error);
            };
            
            document.head.appendChild(script);
        });
    }

    attachEventListeners() {
        document.addEventListener('click', (e) => {
            const channelItem = e.target.closest('.channel-item');
            if (channelItem) {
                const serverId = channelItem.dataset.serverId;
                const channelId = channelItem.dataset.channelId;
                const channelType = channelItem.dataset.channelType || 'text';
                
                console.log('[ChannelSwitchManager] Channel item clicked:', {
                    serverId,
                    channelId,
                    channelType
                });
                
                if (serverId && channelId) {
                    this.switchToChannel(serverId, channelId, channelItem);
                }
            }
        });
    }

    getServerIdFromURL() {
        const match = window.location.pathname.match(/\/server\/(\\d+)/);
        return match ? match[1] : null;
    }

    getChannelIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('channel');
    }

    getChannelTypeFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('type') || 'text';
    }

    async switchToChannel(serverId, channelId, clickedElement) {
        console.log('[ChannelSwitchManager] Switching to channel:', {
            serverId,
            channelId,
            type: clickedElement?.dataset?.channelType || 'text'
        });
        
        if (this.isLoading) {
            console.log('[ChannelSwitchManager] Channel switch in progress, queueing request');
            this.switchQueue.push({ serverId, channelId, clickedElement });
            return;
        }

        try {
            this.isLoading = true;
            clickedElement.classList.add('switching');
            
            const channelType = clickedElement?.dataset?.channelType || 'text';
            console.log('[ChannelSwitchManager] Channel type:', channelType);

            await this.updateSections(channelType);
            console.log('[ChannelSwitchManager] Sections updated');

            const response = await this.loadChannelContent(serverId, channelId, channelType);
            console.log('[ChannelSwitchManager] Channel content loaded');

            this.currentChannelId = channelId;
            this.currentServerId = serverId;
            this.currentChannelType = channelType;

            this.updateURL(serverId, channelId, channelType);
            this.updateActiveStates(clickedElement);

            if (window.socketManager) {
                console.log('[ChannelSwitchManager] Joining channel room:', channelId);
                window.socketManager.joinChannelRoom(channelId);
            }
            
            if (channelType === 'voice') {
                console.log('[ChannelSwitchManager] Voice channel detected, initializing voice components');
                setTimeout(() => {
                    this.initializeVoiceComponents();
                }, 300);
            }

        } catch (error) {
            console.error('[ChannelSwitchManager] Channel switch failed:', error);
        } finally {
            this.isLoading = false;
            clickedElement.classList.remove('switching');
            if (this.switchQueue.length > 0) {
                console.log('[ChannelSwitchManager] Processing next queued switch');
                const next = this.switchQueue.shift();
                this.switchToChannel(next.serverId, next.channelId, next.clickedElement);
            }
        }
    }

    async loadChannelContent(serverId, channelId, channelType) {
        console.log('[ChannelSwitchManager] Loading channel content:', {
            serverId,
            channelId,
            channelType
        });
        
        try {
            const response = await ajax({
                url: `/api/channels/content?server_id=${serverId}&channel_id=${channelId}&type=${channelType}&render_html=true`,
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            console.log('[ChannelSwitchManager] Channel content response:', response);

            if (response.success && response.data.html) {
                if (channelType === 'voice') {
                    console.log('[ChannelSwitchManager] Processing voice section HTML');
                    const voiceSection = document.querySelector('.voice-section');
                    if (voiceSection) {
                        console.log('[ChannelSwitchManager] Found voice section element, updating HTML');
                        voiceSection.innerHTML = response.data.html;
                        console.log('[ChannelSwitchManager] Voice section HTML updated');
                        setTimeout(() => {
                            console.log('[ChannelSwitchManager] Initializing voice components after HTML update');
                            this.initializeVoiceComponents();
                        }, 300);
                    } else {
                        console.log('[ChannelSwitchManager] Voice section element not found');
                    }
                } else {
                    const chatSection = document.querySelector('.chat-section');
                    if (chatSection) {
                        chatSection.innerHTML = response.data.html;
                    }
                }
            }

            return response;
        } catch (error) {
            console.error('[ChannelSwitchManager] Failed to load channel content:', error);
            throw error;
        }
    }
    
    initializeVoiceComponents() {
        console.log('[ChannelSwitchManager] Initializing voice components');
        
        const joinBtn = document.getElementById('joinBtn');
        console.log('[ChannelSwitchManager] Join button found:', !!joinBtn);
        
        if (joinBtn) {
            console.log('[ChannelSwitchManager] Setting up join button');
            joinBtn.disabled = false;
            
            console.log('[ChannelSwitchManager] Cloning join button to clear event listeners');
            const newBtn = joinBtn.cloneNode(true);
            joinBtn.parentNode.replaceChild(newBtn, joinBtn);
            
            console.log('[ChannelSwitchManager] Adding click event listener to join button');
            newBtn.addEventListener('click', (e) => {
                console.log('[ChannelSwitchManager] Join button clicked');
                e.preventDefault();
                e.stopPropagation();
                
                newBtn.classList.add('clicked-btn');
                
                if (window.voiceManager) {
                    console.log('[ChannelSwitchManager] Using voiceManager.joinVoice()');
                    window.voiceManager.joinVoice();
                    return;
                }
                
                console.log('[ChannelSwitchManager] No voiceManager found, loading voice scripts');
                this.loadVoiceScripts().then(() => {
                    console.log('[ChannelSwitchManager] Voice scripts loaded, trying to join');
                    if (window.voiceSection && typeof window.voiceSection.autoJoin === 'function') {
                        console.log('[ChannelSwitchManager] Using voiceSection.autoJoin()');
                        window.voiceSection.autoJoin();
                    } else if (window.triggerVoiceAutoJoin) {
                        console.log('[ChannelSwitchManager] Using triggerVoiceAutoJoin()');
                        window.triggerVoiceAutoJoin();
                    } else if (window.handleAutoJoin) {
                        console.log('[ChannelSwitchManager] Using handleAutoJoin()');
                        window.handleAutoJoin();
                    }
                });
            });
        }
        
        console.log('[ChannelSwitchManager] Checking for VoiceSection class');
        if (typeof VoiceSection !== 'undefined') {
            console.log('[ChannelSwitchManager] VoiceSection class found, creating instance');
            window.voiceSection = new VoiceSection();
        } else {
            console.log('[ChannelSwitchManager] VoiceSection class not found, loading script');
            const script = document.createElement('script');
            script.src = '/public/js/components/voice/voice-section.js?v=' + Date.now();
            script.onload = function() {
                console.log('[ChannelSwitchManager] Voice section script loaded, creating instance');
                window.voiceSection = new VoiceSection();
            };
            document.head.appendChild(script);
        }
    }

    updateSections(channelType) {
        console.log('[ChannelSwitchManager] Updating sections for type:', channelType);
        const chatSection = document.querySelector('.chat-section');
        const voiceSection = document.querySelector('.voice-section');

        if (channelType === 'voice') {
            console.log('[ChannelSwitchManager] Switching to voice section');
            if (chatSection) chatSection.classList.add('hidden');
            if (voiceSection) voiceSection.classList.remove('hidden');
            if (window.chatSection) {
                window.chatSection = null;
            }
        } else {
            console.log('[ChannelSwitchManager] Switching to chat section');
            if (voiceSection) voiceSection.classList.add('hidden');
            if (chatSection) chatSection.classList.remove('hidden');
            if (window.voiceManager && window.voiceManager.isConnected) {
                window.voiceManager.leaveVoice();
            }
            if (window.voiceManager) {
                window.voiceManager = null;
            }
        }
    }

    updateURL(serverId, channelId, channelType) {
        const newURL = `/server/${serverId}?channel=${channelId}${channelType === 'voice' ? '&type=voice' : ''}`;
        window.history.pushState({ path: newURL }, '', newURL);
        console.log('[ChannelSwitchManager] URL updated:', newURL);
    }

    updateActiveStates(clickedElement) {
        if (!clickedElement) return;

        const allChannels = document.querySelectorAll('.channel-item');
        allChannels.forEach(channel => {
            channel.classList.remove('active', 'bg-discord-500');
            channel.classList.add('hover:bg-discord-500');
        });

        clickedElement.classList.add('active', 'bg-discord-500');
        clickedElement.classList.remove('hover:bg-discord-500');
        console.log('[ChannelSwitchManager] Active states updated');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('[ChannelSwitchManager] DOM content loaded');
    if (window.location.pathname.includes('/server/')) {
        console.log('[ChannelSwitchManager] On server page, initializing channel switch manager');
        new ChannelSwitchManager();
    }
});

export default ChannelSwitchManager; 