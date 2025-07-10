class ChannelVoiceParticipants {
    constructor() {
        this.externalParticipants = new Map(); 
        this.debugPanel = null; 
        this.updateTimers = new Map(); // Debounce timers for updates
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadInitialState();
        this.initializeVoiceState();
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.createDebugPanel());
        } else {
            this.createDebugPanel();
        }
    }
    
    setupEventListeners() {
        window.addEventListener('participantJoined', (e) => this.updateSidebar());
        window.addEventListener('participantLeft', (e) => this.updateSidebar());
        window.addEventListener('voiceConnect', (e) => this.handleVoiceConnect(e));
        window.addEventListener('voiceDisconnect', () => this.handleVoiceDisconnect());
        
        window.addEventListener('bot-voice-participant-joined', (e) => this.handleBotJoined(e));
        window.addEventListener('bot-voice-participant-left', (e) => this.handleBotLeft(e));
        
        window.addEventListener('voiceStateChanged', (e) => this.handleVoiceStateChanged(e));
        
        if (window.globalSocketManager?.io) {
            this.attachSocketEvents();
        } else {
            window.addEventListener('globalSocketReady', () => this.attachSocketEvents());
        }

        // Re-request participant lists once socket is authenticated (ensures data after reload)
        window.addEventListener('socketAuthenticated', () => {
            this.requestAllChannelStatus();
        });
        
        if (window.localStorageManager) {
            window.localStorageManager.addVoiceStateListener((state) => {
                this.syncWithVoiceState(state);
            });
        }
    }
    
    handleVoiceStateChanged(event) {
        const { state, source } = event.detail;
        this.syncWithVoiceState(state);
    }
    
    syncWithVoiceState(state) {
        if (!state) return;
        
        if (state.isConnected && state.channelId) {
            this.updateChannelCount(state.channelId, null);
            this.updateSidebarForChannel(state.channelId);
        } else {
            this.clearCurrentUserParticipantCounts();
        }
    }
    
    initializeVoiceState() {
        if (window.localStorageManager) {
            const voiceState = window.localStorageManager.getUnifiedVoiceState();
            this.syncWithVoiceState(voiceState);
        }
        
        setTimeout(() => {
            this.validateCurrentState();
        }, 1000);
    }
    
    validateCurrentState() {
        if (!window.localStorageManager || !window.globalSocketManager?.io) return;
        
        const voiceState = window.localStorageManager.getUnifiedVoiceState();
        if (voiceState.isConnected && voiceState.channelId) {
            window.globalSocketManager.io.emit('check-voice-meeting', { 
                channel_id: voiceState.channelId 
            });
        }
    }
    
    clearCurrentUserParticipantCounts() {
        const currentVoiceState = window.localStorageManager?.getUnifiedVoiceState();
        const currentUserChannelId = currentVoiceState?.channelId;
        
        if (currentUserChannelId) {
            const currentChannelCountEl = document.querySelector(`[data-channel-id="${currentUserChannelId}"] .voice-user-count`);
            const currentChannelContainer = document.querySelector(`.voice-participants[data-channel-id="${currentUserChannelId}"]`);
            
            if (currentChannelCountEl) {
                currentChannelCountEl.textContent = '0';
                currentChannelCountEl.classList.add('hidden');
            }
            
            if (currentChannelContainer) {
                currentChannelContainer.classList.add('hidden');
                currentChannelContainer.innerHTML = '';
            }
        }
    }
    
    clearAllParticipantCounts() {
        document.querySelectorAll('.voice-user-count').forEach(count => {
            count.textContent = '0';
            count.classList.add('hidden');
        });
        
        document.querySelectorAll('.voice-participants').forEach(container => {
            container.classList.add('hidden');
            container.innerHTML = '';
        });
    }
    
    attachSocketEvents() {
        const socket = window.globalSocketManager?.io;
        if (!socket) {
            console.warn('[ChannelVoiceParticipants] Socket not available');
            return;
        }
        
        socket.on('voice-meeting-update', (data) => {
            if (data.channel_id && data.user_id) {
                const chan = data.channel_id;
                if (!this.externalParticipants.has(chan)) {
                    this.externalParticipants.set(chan, new Map());
                }
                const map = this.externalParticipants.get(chan);
                if (data.action === 'join' || data.action === 'registered' || data.action === 'already_registered') {
                    map.set(data.user_id, {
                        user_id: data.user_id,
                        username: data.username || 'Unknown',
                        avatar_url: data.avatar_url || '/public/assets/common/default-profile-picture.png'
                    });
                } else if (data.action === 'leave') {
                    map.delete(data.user_id);
                }
            }
            // update counts + sidebar for all actions that reflect an existing participant
            if (data.channel_id && (
                data.action === 'join' ||
                data.action === 'leave' ||
                data.action === 'registered' ||
                data.action === 'already_registered'
            )) {
                this.updateChannelCount(data.channel_id, data.participant_count);
                this.updateSidebarForChannel(data.channel_id);
                this.updateAllChannelCounts();

                // Persist meeting ID on DOM element
                if (data.meeting_id) {
                    const channelEl = document.querySelector(`[data-channel-id="${data.channel_id}"]`);
                    if (channelEl) {
                        channelEl.setAttribute('data-meeting-id', data.meeting_id);
                    }
                }
            }
            // sync unified voice state ... (existing)
            const currentUserId = document.querySelector('meta[name="user-id"]')?.content;
            if (data.user_id === currentUserId && window.localStorageManager) {
                const currentState = window.localStorageManager.getUnifiedVoiceState();
                
                if (data.action === 'join' || data.action === 'registered') {
                    window.localStorageManager.setUnifiedVoiceState({
                        ...currentState,
                        isConnected: true,
                        channelId: data.channel_id,
                        meetingId: data.meeting_id,
                        connectionTime: data.timestamp || Date.now()
                    });
                } else if (data.action === 'leave') {
                    window.localStorageManager.setUnifiedVoiceState({
                        ...currentState,
                        isConnected: false,
                        channelId: null,
                        meetingId: null,
                        connectionTime: null
                    });
                }
            }
        });
        
        socket.on('voice-meeting-status', (data) => {
            if (!data || !data.channel_id) return;

            // hydrate external participant map from full status payload
            if (data.participants && Array.isArray(data.participants)) {
                if (!this.externalParticipants.has(data.channel_id)) {
                    this.externalParticipants.set(data.channel_id, new Map());
                }
                const map = this.externalParticipants.get(data.channel_id);
                data.participants.forEach(p => {
                    if (!p || !p.user_id) return;
                    map.set(p.user_id, {
                        user_id: p.user_id,
                        username: p.username || 'Unknown',
                        avatar_url: p.avatar_url || '/public/assets/common/default-profile-picture.png'
                    });
                });
            }

            // update count & sidebar visibility
            this.updateChannelCount(data.channel_id, data.participant_count || 0);
            this.updateSidebarForChannel(data.channel_id);

            // Persist meeting ID on DOM element for future joins
            if (data.meeting_id) {
                const channelEl = document.querySelector(`[data-channel-id="${data.channel_id}"]`);
                if (channelEl) {
                    channelEl.setAttribute('data-meeting-id', data.meeting_id);
                }
            }
        });
        
        socket.on('bot-voice-participant-joined', (data) => {
            if (data.participant && data.channelId) {
                this.updateChannelCount(data.channelId, null);
                this.updateSidebarForChannel(data.channelId);
            }
        });
        
        socket.on('bot-voice-participant-left', (data) => {
            if (data.participant && data.channelId) {
                this.updateChannelCount(data.channelId, null);
                this.updateSidebarForChannel(data.channelId);
            }
        });
    }
    
    handleVoiceConnect(event) {
        const { channelId } = event.detail;
        if (!channelId) return;

        const container = document.querySelector(`.voice-participants[data-channel-id="${channelId}"]`);
        if (!container) return;

        container.classList.remove('hidden');

        // Show skeleton loader while we wait for participant data
        this.showSkeletonLoader(channelId);
        
        // Set a timeout to ensure we eventually render even if no events arrive
        setTimeout(() => {
            this.updateSidebarForChannel(channelId);
        }, 1500);
    }
    
    /**
     * Shows a skeleton loading animation in the voice participants sidebar
     * @param {string} channelId - The channel to show loading for
     */
    showSkeletonLoader(channelId) {
        const container = document.querySelector(`.voice-participants[data-channel-id="${channelId}"]`);
        if (!container) return;
        
        // Mark this channel as in loading state
        this.loadingState.set(channelId, true);
        
        // Clear existing content
        container.innerHTML = '';
        
        // Add 1-2 skeleton loaders
        for (let i = 0; i < 2; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = 'voice-participant-card skeleton-loader bg-[#2f3136] rounded-lg p-2 flex items-center space-x-3 border border-[#40444b]';
            skeleton.innerHTML = `
                <div class="skeleton-circle w-8 h-8 rounded-full bg-[#202225] animate-pulse"></div>
                <div class="flex flex-col flex-grow">
                    <div class="skeleton-text h-4 w-24 bg-[#202225] rounded animate-pulse mb-1"></div>
                    <div class="skeleton-text h-3 w-16 bg-[#202225] rounded animate-pulse"></div>
                </div>
            `;
            container.appendChild(skeleton);
        }
    }
    
    handleVoiceDisconnect() {
        this.clearCurrentUserParticipantCounts();
    }
    
    handleBotJoined(event) {
        const { participant } = event.detail;
        if (participant && participant.channelId) {
            this.updateChannelCount(participant.channelId, null);
            this.updateSidebarForChannel(participant.channelId);
        }
    }
    
    handleBotLeft(event) {
        const { participant } = event.detail;
        if (participant && participant.channelId) {
            this.updateChannelCount(participant.channelId, null);
            this.updateSidebarForChannel(participant.channelId);
        }
    }
    
    updateSidebar() {
        if (window.voiceManager && window.voiceManager.currentChannelId) {
            this.debouncedUpdateSidebar(window.voiceManager.currentChannelId);
        }
    }
    
    debouncedUpdateSidebar(channelId) {
        // Debounce rapid updates to prevent flicker
        const debounceKey = `sidebar-${channelId}`;
        
        if (this.updateTimers.has(debounceKey)) {
            clearTimeout(this.updateTimers.get(debounceKey));
        }
        
        this.updateTimers.set(debounceKey, setTimeout(() => {
            this.updateSidebarForChannel(channelId);
            this.updateTimers.delete(debounceKey);
        }, 100)); // 100ms debounce to prevent excessive updates
    }
    
    updateSidebarForChannel(channelId) {
        if (!channelId) return;
        
        const container = document.querySelector(`.voice-participants[data-channel-id="${channelId}"]`);
        if (!container) return;
        
        // Remove loading state
        this.loadingState.delete(channelId);
        
        // Build a list first so we know if clearing is safe
        const renderList = [];

        const useLocalList = window.voiceManager &&
            window.voiceManager.currentChannelId === channelId &&
            window.voiceManager.isConnected &&
            window.voiceManager.getAllParticipants &&
            window.voiceManager.getAllParticipants().size > 0;

        if (useLocalList) {
            window.voiceManager.getAllParticipants().forEach(data => {
                renderList.push(data);
            });
        } else {
            const map = this.externalParticipants.get(channelId);
            if (map) {
                map.forEach((pData, uid) => {
                    renderList.push({
                        id: uid,
                        user_id: uid,
                        name: pData.username,
                        username: pData.username,
                        avatar_url: pData.avatar_url,
                        isBot: false,
                        isLocal: false
                    });
                });
            }
        }

        // merge in bots
        if (window.BotComponent && window.BotComponent.voiceBots) {
            window.BotComponent.voiceBots.forEach((botData, botId) => {
                if (botData.channel_id === channelId) {
                    renderList.push({
                        id: botId,
                        user_id: botData.bot_id,
                        name: botData.username || 'TitiBot',
                        username: botData.username || 'TitiBot',
                        avatar_url: '/public/assets/landing-page/robot.webp',
                        isBot: true,
                        isLocal: false
                    });
                }
            });
        }

        // Check if content actually changed before updating to prevent flicker
        const currentParticipants = Array.from(container.querySelectorAll('.voice-participant-card:not(.skeleton-loader)'));
        const currentIds = currentParticipants.map(el => el.getAttribute('data-user-id')).filter(id => id);
        const newIds = renderList.map(p => String(p.user_id || p.id));
        
        // Compare arrays to see if anything actually changed
        const hasChanges = currentIds.length !== newIds.length || 
                          !currentIds.every(id => newIds.includes(id)) ||
                          !newIds.every(id => currentIds.includes(id));

        // If nothing to render and nothing is currently shown, do nothing
        if (renderList.length === 0 && currentIds.length === 0) {
            return;
        }

        // Only update if there are actual changes
        if (hasChanges || renderList.length === 0) {
            // Safe to refresh UI
            // Incremental DOM diff – avoid full clear to eliminate flicker
            this.updateParticipantContainer(container, renderList);
        }

        const participantCount = renderList.length;
        
        this.updateChannelCount(channelId, participantCount);
        
        if (participantCount > 0) {
            if (container.classList.contains('hidden')) {
                container.classList.remove('hidden');
            }
        } else {
            if (!container.classList.contains('hidden')) {
                container.classList.add('hidden');
            }
        }

        // Refresh debug panel each time sidebar updates
        this.updateDebugPanel();
    }
    
    createParticipantElement(participant) {
        const div = document.createElement('div');
        div.className = 'voice-participant-card bg-[#2f3136] rounded-lg p-2 flex items-center space-x-3 border border-[#40444b] hover:border-[#5865f2] transition-all duration-200';
        div.setAttribute('data-user-id', participant.user_id || participant.id);

        const avatarUrl = participant.avatar_url || '/public/assets/common/default-profile-picture.png';
        const displayName = participant.name || participant.username || 'Unknown';
        const isBot = participant.isBot || false;
        const isSelf = participant.isSelf || false;

        const avatarHTML = `
            <div class="relative">
                <img src="${avatarUrl}"
                     alt="${displayName}"
                     class="w-8 h-8 rounded-full object-cover bg-[#5865f2]"
                     onerror="this.src='/public/assets/common/default-profile-picture.png'">
                ${isBot ? `<div class="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#5865f2] rounded-full flex items-center justify-center"><i class="fas fa-robot text-white" style="font-size: 6px;"></i></div>` : ''}
            </div>`;

        const nameHTML = `
            <div class="flex flex-col min-w-0">
                <span class="participant-name text-white text-sm font-medium truncate max-w-[140px]">${displayName}${isSelf ? ' (You)' : ''}${isBot ? ' (Bot)' : ''}</span>
                ${isBot ? '<span class="text-xs text-[#5865f2] flex items-center"><i class="fas fa-music mr-1"></i>Ready to play music</span>' : ''}
            </div>`;

        div.innerHTML = avatarHTML + nameHTML;

        return div;
    }
    
    updateChannelCount(channelId, count) {
        const channelItem = document.querySelector(`[data-channel-id="${channelId}"]`);
        if (!channelItem) return;
        
        if (count === null) {
            count = this.calculateChannelParticipantCount(channelId);
        }
        
        const countEl = channelItem.querySelector('.voice-user-count');
        if (countEl) {
            countEl.textContent = count.toString();
            if (count > 0) {
                countEl.classList.remove('hidden');
            } else {
                countEl.classList.add('hidden');
            }
        }
    }
    
    calculateChannelParticipantCount(channelId) {
        let count = 0;
        
        const localListReady = window.voiceManager &&
            window.voiceManager.currentChannelId === channelId &&
            window.voiceManager.isConnected &&
            window.voiceManager.getAllParticipants &&
            window.voiceManager.getAllParticipants().size > 0;

        if (localListReady) {
            count = window.voiceManager.getAllParticipants().size;
        }
        
        if (window.BotComponent && window.BotComponent.voiceBots) {
            window.BotComponent.voiceBots.forEach((botData, botId) => {
                if (botData.channel_id === channelId) {
                    if (!window.voiceManager || window.voiceManager.currentChannelId !== channelId) {
                        count++;
                    }
                }
            });
        }
        
        return count;
    }
    
    updateAllChannelCounts() {
        document.querySelectorAll('[data-channel-type="voice"]').forEach(channel => {
            const channelId = channel.getAttribute('data-channel-id');
            if (channelId) {
                this.updateChannelCount(channelId, null);
            }
        });
    }
    
    loadInitialState() {
        this.requestAllChannelStatus();
        
        setTimeout(() => {
            this.loadExistingBotParticipants();
        }, 1000);
    }

    requestAllChannelStatus() {
        if (!window.globalSocketManager?.io || !window.globalSocketManager.isAuthenticated) {
            return;
        }
        document.querySelectorAll('[data-channel-type="voice"]').forEach(channel => {
            const channelId = channel.getAttribute('data-channel-id');
            if (channelId) {
                window.globalSocketManager.io.emit('check-voice-meeting', { channel_id: channelId });
            }
        });
    }
    
    loadExistingBotParticipants() {
        if (window.BotComponent && window.BotComponent.voiceBots) {
            window.BotComponent.voiceBots.forEach((botData, botId) => {
                if (botData.channel_id) {
                    this.updateChannelCount(botData.channel_id, null);
                }
            });
        }
    }

    // ------------------------
    // Debug panel helpers (temporary)
    // ------------------------

    createDebugPanel() {
        if (this.debugPanel) return;
        this.debugPanel = document.createElement('div');
        this.debugPanel.id = 'voice-debug-panel';
        Object.assign(this.debugPanel.style, {
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            maxWidth: '300px',
            maxHeight: '200px',
            overflowY: 'auto',
            background: 'rgba(0,0,0,0.7)',
            color: '#fff',
            fontSize: '12px',
            padding: '8px',
            borderRadius: '4px',
            zIndex: '9999',
            whiteSpace: 'pre-line'
        });
        this.debugPanel.textContent = 'Voice Debug Panel';
        document.body.appendChild(this.debugPanel);
        this.updateDebugPanel();
    }

    updateDebugPanel() {
        if (!this.debugPanel) return;
        const lines = [];
        this.externalParticipants.forEach((map, chan) => {
            const names = Array.from(map.values()).map(p => p.username || 'Unknown').join(', ');
            lines.push(`Channel ${chan}: ${names}`);
        });
        if (window.voiceManager && window.voiceManager.isConnected) {
            const chanId = window.voiceManager.currentChannelId;
            if (chanId) {
                const localNames = [];
                window.voiceManager.getAllParticipants().forEach(p => {
                    localNames.push(p.username || p.name || 'Unknown');
                });
                lines.push(`Local Chan ${chanId}: ${localNames.join(', ')}`);
            }
        }
        this.debugPanel.innerHTML = lines.length ? lines.join('<br>') : 'No participants';
    }
    
    static getInstance() {
        if (!window._channelVoiceParticipants) {
            window._channelVoiceParticipants = new ChannelVoiceParticipants();
        }
        return window._channelVoiceParticipants;
    }

    updateParticipantContainer(container, renderList) {
        if (!container) return;
        
        // Remove any skeleton loaders first
        container.querySelectorAll('.skeleton-loader').forEach(el => el.remove());
        
        // Collect current DOM state
        const existingElements = Array.from(container.querySelectorAll('.voice-participant-card:not(.skeleton-loader)'));
        const str = (v) => v != null ? String(v) : '';
        const existingMap = new Map(); // id -> element
        
        existingElements.forEach(el => {
            const userId = str(el.getAttribute('data-user-id'));
            if (userId) {
                existingMap.set(userId, el);
            }
        });

        // Build a map of desired state keyed by participant id (as string)
        const desiredIds = renderList.map(p => str(p.user_id || p.id));
        const desiredSet = new Set(desiredIds);

        // Only remove elements that are definitely not in the new list
        // Use smooth fade-out animation to reduce flicker
        existingMap.forEach((el, id) => {
            if (!desiredSet.has(id)) {
                console.log(`🗑️ [CHANNEL-VOICE-PARTICIPANTS] Removing participant ${id} from sidebar`);
                el.style.transition = 'opacity 0.2s ease-out';
                el.style.opacity = '0';
                setTimeout(() => {
                    if (el.parentNode) {
                        el.remove();
                    }
                }, 200);
                existingMap.delete(id);
            }
        });

        // Add missing participants with smooth fade-in animation
        renderList.forEach((p, index) => {
            const pid = str(p.user_id || p.id);
            if (!existingMap.has(pid)) {
                console.log(`➕ [CHANNEL-VOICE-PARTICIPANTS] Adding participant ${pid} to sidebar`);
                const el = this.createParticipantElement(p);
                
                // Start with invisible element
                el.style.opacity = '0';
                el.style.transition = 'opacity 0.3s ease-in';
                
                // Insert in correct position to maintain order
                if (index < container.children.length) {
                    container.insertBefore(el, container.children[index]);
                } else {
                    container.appendChild(el);
                }
                
                // Trigger smooth fade-in after a brief delay
                setTimeout(() => {
                    el.style.opacity = '1';
                }, 10);
                
                existingMap.set(pid, el);
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    ChannelVoiceParticipants.getInstance();
});

window.ChannelVoiceParticipants = ChannelVoiceParticipants;