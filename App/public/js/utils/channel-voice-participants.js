class ChannelVoiceParticipants {
    constructor() {
        this.externalParticipants = new Map(); 
        this.debugPanel = null; 
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
        if (channelId) {
            const container = document.querySelector(`.voice-participants[data-channel-id="${channelId}"]`);
            if (container) {
                container.classList.remove('hidden');
                this.updateSidebarForChannel(channelId);
            }
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
            this.updateSidebarForChannel(window.voiceManager.currentChannelId);
        }
    }
    
    updateSidebarForChannel(channelId) {
        if (!channelId) return;
        
        const container = document.querySelector(`.voice-participants[data-channel-id="${channelId}"]`);
        if (!container) return;
        
        container.innerHTML = '';
        
        let participantCount = 0;
        
        // participants from voiceManager ONLY when this tab is actually connected to the call
        if (window.voiceManager && window.voiceManager.currentChannelId === channelId && window.voiceManager.isConnected) {
            const allParticipants = window.voiceManager.getAllParticipants();
            allParticipants.forEach((data, id) => {
                const element = this.createParticipantElement(data);
                container.appendChild(element);
                participantCount++;
            });
        } else {
            // external participants map
            const map = this.externalParticipants.get(channelId);
            if (map) {
                map.forEach((pData, uid) => {
                    const element = this.createParticipantElement({
                        id: uid,
                        user_id: uid,
                        name: pData.username,
                        username: pData.username,
                        avatar_url: pData.avatar_url,
                        isBot: false,
                        isLocal: false
                    });
                    container.appendChild(element);
                    participantCount++;
                });
            }
        }
        
        // include bots
        if (window.BotComponent && window.BotComponent.voiceBots) {
            window.BotComponent.voiceBots.forEach((botData, botId) => {
                if (botData.channel_id === channelId) {
                    const element = this.createParticipantElement({
                        id: botId,
                        user_id: botData.bot_id,
                        name: botData.username || 'TitiBot',
                        username: botData.username || 'TitiBot',
                        avatar_url: '/public/assets/landing-page/robot.webp',
                        isBot: true,
                        isLocal: false
                    });
                    container.appendChild(element);
                    participantCount++;
                }
            });
        }
        
        this.updateChannelCount(channelId, participantCount);
        
        if (participantCount > 0) {
            container.classList.remove('hidden');
        } else {
            container.classList.add('hidden');
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
        
        if (window.voiceManager && window.voiceManager.currentChannelId === channelId && window.voiceManager.isConnected) {
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
}

document.addEventListener('DOMContentLoaded', () => {
    ChannelVoiceParticipants.getInstance();
});

window.ChannelVoiceParticipants = ChannelVoiceParticipants;