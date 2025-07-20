class ChannelVoiceParticipants {
    constructor() {
        this.externalParticipants = new Map(); 
        this.debugPanel = null; 
        this.updateTimers = new Map(); 
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.initializeVoiceState();
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.createDebugPanel());
        } else {
            this.createDebugPanel();
        }
        
        setInterval(() => {
            this.cleanupStaleParticipants();
        }, 30000);
        
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && window.globalSocketManager?.isAuthenticated) {
                this.requestAllChannelStatusImmediate();
                const voiceState = window.localStorageManager?.getUnifiedVoiceState();
                if (voiceState?.isConnected && voiceState?.channelId) {
                    this.updateSidebarForChannel(voiceState.channelId, 'append');
                    if (window.voiceCallSection && window.voiceManager?.participants?.size > 0) {
                        window.voiceCallSection.syncWithExistingParticipants();
                    }
                }
            }
        });
    }
    
    setupEventListeners() {
        window.addEventListener('participantJoined', (e) => this.handleParticipantJoined(e));
        window.addEventListener('participantLeft', (e) => this.handleParticipantLeft(e));
        window.addEventListener('voiceConnect', (e) => this.handleVoiceConnect(e));
        window.addEventListener('voiceDisconnect', () => this.handleVoiceDisconnect());
        
        window.addEventListener('bot-voice-participant-joined', (e) => this.handleBotJoined(e));
        window.addEventListener('bot-voice-participant-left', (e) => this.handleBotLeft(e));
        
        window.addEventListener('voiceStateChanged', (e) => this.handleVoiceStateChanged(e));
        window.addEventListener('localVoiceStateChanged', (e) => this.handleLocalVoiceStateChanged(e));
        
        if (window.globalSocketManager?.io) {
            this.attachSocketEvents();
            this.requestAllChannelStatusImmediate();
        } else {
            window.addEventListener('globalSocketReady', () => {
                this.attachSocketEvents();
                this.requestAllChannelStatusImmediate();
            });
        }

        window.addEventListener('socketAuthenticated', () => {
            this.requestAllChannelStatusImmediate();
            const voiceState = window.localStorageManager?.getUnifiedVoiceState();
            if (voiceState?.isConnected && voiceState?.channelId) {
                this.updateSidebarForChannel(voiceState.channelId, 'full');
            }
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
    
    handleLocalVoiceStateChanged(event) {
        const { userId, channelId, type, state } = event.detail;
        this.updateParticipantVoiceState(userId, channelId, type, state);
        
        if (type === 'deafen' && state === true && window.voiceManager) {
            const currentUserId = document.querySelector('meta[name="user-id"]')?.content;
            if (userId === currentUserId) {
                this.updateParticipantVoiceState(userId, channelId, 'mic', false);
            }
        }
    }
    
    handleParticipantJoined(event) {
        if (window.voiceManager && window.voiceManager.currentChannelId) {
            this.updateSidebarForChannel(window.voiceManager.currentChannelId, 'append');
        }
    }
    
    handleParticipantLeft(event) {
        if (window.voiceManager && window.voiceManager.currentChannelId) {
            this.updateSidebarForChannel(window.voiceManager.currentChannelId, 'full');
        }
    }
    
    ensureParticipantsVisible(channelId) {
        if (!channelId) return;
        
        const container = document.querySelector(`.voice-participants[data-channel-id="${channelId}"]`);
        if (!container) return;
        

        const hasLocalParticipants = window.voiceManager &&
            window.voiceManager.currentChannelId === channelId &&
            window.voiceManager.isConnected &&
            window.voiceManager.getAllParticipants &&
            window.voiceManager.getAllParticipants().size > 0;
            
        const hasExternalParticipants = this.externalParticipants.has(channelId) &&
            this.externalParticipants.get(channelId).size > 0;
            
        const hasBotParticipants = window.BotComponent && 
            window.BotComponent.voiceBots &&
            Array.from(window.BotComponent.voiceBots.values()).some(bot => bot.channel_id === channelId);
        
        const hasAnyParticipants = hasLocalParticipants || hasExternalParticipants || hasBotParticipants;
        
        console.log(`👀 [CHANNEL-VOICE-PARTICIPANTS] Ensuring participants visible for channel ${channelId}:`, {
            hasLocalParticipants,
            hasExternalParticipants, 
            hasBotParticipants,
            containerEmpty: container.children.length === 0,
            containerHidden: container.classList.contains('hidden')
        });
        

        if (hasAnyParticipants && container.children.length === 0) {
            
            this.updateSidebarForChannel(channelId, 'append');
        }
        

        if (hasAnyParticipants) {
            container.classList.remove('hidden');
        } else {
            container.classList.add('hidden');
        }
        

        this.updateChannelCount(channelId, null);
    }
    
    syncWithVoiceState(state) {
        if (!state) return;
        


        const isActuallyConnected = state.isConnected && state.channelId;
        const isVoiceManagerConnected = window.voiceManager?.isConnected && window.voiceManager?.currentChannelId;
        
        if (isActuallyConnected || isVoiceManagerConnected) {
            const activeChannelId = state.channelId || window.voiceManager?.currentChannelId;
            if (activeChannelId) {
                this.updateChannelCount(activeChannelId, null);
                this.ensureParticipantsVisible(activeChannelId);
                this.updateSidebarForChannel(activeChannelId, 'full');

            }
        } else if (!isVoiceManagerConnected && !state.isConnected) {

            this.clearCurrentUserParticipantCounts();
        }
    }
    
    initializeVoiceState() {
        if (window.localStorageManager) {
            const voiceState = window.localStorageManager.getUnifiedVoiceState();
            this.syncWithVoiceState(voiceState);
            
            if (voiceState.isConnected && voiceState.channelId) {
                this.updateSidebarForChannel(voiceState.channelId, 'full');
            }
        }
        
        this.validateCurrentState();
    }
    
    validateCurrentState() {
        if (!window.localStorageManager || !window.globalSocketManager?.io) return;
        
        const voiceState = window.localStorageManager.getUnifiedVoiceState();
        if (voiceState.isConnected && voiceState.channelId) {
            
            

            if (window.globalSocketManager.isReady()) {
                window.globalSocketManager.joinRoom('channel', voiceState.channelId);
            }
            

            window.globalSocketManager.io.emit('check-voice-meeting', { 
                channel_id: voiceState.channelId 
            });
        }
        

        document.querySelectorAll('[data-channel-type="voice"]').forEach(channel => {
            const channelId = channel.getAttribute('data-channel-id');
            if (channelId && window.globalSocketManager?.isReady()) {
                window.globalSocketManager.joinRoom('channel', channelId);
            }
        });
    }
    
    clearCurrentUserParticipantCounts() {

        if (window.voiceManager?.isConnected) {
            
            return;
        }
        
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
                    const removed = map.delete(data.user_id);
                    

                    this.updateSidebarForChannel(chan, 'full');
                    this.updateChannelCount(chan, null);
                }
            }

            if (data.channel_id && (
                data.action === 'join' ||
                data.action === 'leave' ||
                data.action === 'registered' ||
                data.action === 'already_registered'
            )) {
                this.updateChannelCount(data.channel_id, data.participant_count);
                this.updateSidebarForChannel(data.channel_id);
                this.updateAllChannelCounts();


                if (data.meeting_id) {
                    const channelEl = document.querySelector(`[data-channel-id="${data.channel_id}"]`);
                    if (channelEl) {
                        channelEl.setAttribute('data-meeting-id', data.meeting_id);
                    }
                }
            }

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
        
        socket.on('voice-state-update', (data) => {
            
            
            if (!data.user_id || !data.channel_id || !data.type) return;
            
            const currentUserId = document.querySelector('meta[name="user-id"]')?.content;
            if (data.user_id === currentUserId) {
                return;
            }
            
            
            this.updateParticipantVoiceState(data.user_id, data.channel_id, data.type, data.state);
        });

        socket.on('voice-activity-update', (data) => {
            
            
            if (!data.user_id || !data.channel_id) return;
            
            const currentUserId = document.querySelector('meta[name="user-id"]')?.content;
            if (data.user_id === currentUserId) return;
            
            this.updateSpeakingIndicator(data.user_id, data.channel_id, data.is_speaking);
        });
        
        socket.on('voice-meeting-status', (data) => {
            if (!data || !data.channel_id) return;

            if (data.participants && Array.isArray(data.participants)) {
                if (!this.externalParticipants.has(data.channel_id)) {
                    this.externalParticipants.set(data.channel_id, new Map());
                }
                const map = this.externalParticipants.get(data.channel_id);
                map.clear();
                data.participants.forEach(p => {
                    if (!p || !p.user_id) return;
                    map.set(p.user_id, {
                        user_id: p.user_id,
                        username: p.username || 'Unknown',
                        avatar_url: p.avatar_url || '/public/assets/common/default-profile-picture.png'
                    });
                });
            }

            this.updateChannelCount(data.channel_id, data.participant_count || 0);
            this.updateSidebarForChannel(data.channel_id, 'full');
            this.ensureParticipantsVisible(data.channel_id);

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
        const { channelId, skipSidebarRefresh } = event.detail;
        if (!channelId) return;

        const container = document.querySelector(`.voice-participants[data-channel-id="${channelId}"]`);
        if (!container) return;

        container.classList.remove('hidden');
        
        if (!skipSidebarRefresh) {
            setTimeout(() => {
                this.updateSidebarForChannel(channelId);
                
                const currentUserId = document.querySelector('meta[name="user-id"]')?.content;
                if (currentUserId && window.voiceManager) {
                    setTimeout(() => {
                        this.updateParticipantVoiceState(currentUserId, channelId, 'mic', window.voiceManager.getMicState());
                        this.updateParticipantVoiceState(currentUserId, channelId, 'deafen', window.voiceManager.getDeafenState());
                    }, 200);
                }
            }, 1500);
        } else {
            this.ensureParticipantsVisible(channelId);
            
            const currentUserId = document.querySelector('meta[name="user-id"]')?.content;
            if (currentUserId && window.voiceManager) {
                setTimeout(() => {
                    this.updateParticipantVoiceState(currentUserId, channelId, 'mic', window.voiceManager.getMicState());
                    this.updateParticipantVoiceState(currentUserId, channelId, 'deafen', window.voiceManager.getDeafenState());
                }, 500);
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
            this.updateSidebarForChannel(participant.channelId, 'append');
        }
    }
    
    handleBotLeft(event) {
        const { participant } = event.detail;
        if (participant && participant.channelId) {
            this.updateChannelCount(participant.channelId, null);
            this.updateSidebarForChannel(participant.channelId, 'full');
        }
    }
    
    updateSidebar(mode = 'full') {
        if (window.voiceManager && window.voiceManager.currentChannelId) {
            this.debouncedUpdateSidebar(window.voiceManager.currentChannelId, mode);
        }
    }
    
    debouncedUpdateSidebar(channelId, mode = 'full') {
        const debounceKey = `sidebar-${channelId}-${mode}`;
        
        if (this.updateTimers.has(debounceKey)) {
            clearTimeout(this.updateTimers.get(debounceKey));
        }
        
        this.updateTimers.set(debounceKey, setTimeout(() => {
            this.updateSidebarForChannel(channelId, mode);
            this.updateTimers.delete(debounceKey);
        }, mode === 'append' ? 50 : 100)); 
    }
    
    updateSidebarForChannel(channelId, mode = 'full') {
        if (!channelId) return;
        
        const container = document.querySelector(`.voice-participants[data-channel-id="${channelId}"]`);
        if (!container) return;
        

        const renderList = [];
        const participantIds = new Set(); 

        


        const isConnectedToChannel = window.voiceManager &&
            window.voiceManager.currentChannelId === channelId &&
            window.voiceManager.isConnected &&
            window.voiceManager.getAllParticipants;

        const voiceState = window.localStorageManager?.getUnifiedVoiceState();
        const isRestoringConnection = voiceState?.isConnected && voiceState?.channelId === channelId;

        if (isConnectedToChannel) {
            window.voiceManager.getAllParticipants().forEach(data => {
                const participantId = String(data.user_id || data.id);
                if (!participantIds.has(participantId)) {
                    renderList.push(data);
                    participantIds.add(participantId);
                }
            });
        }

        if (isRestoringConnection && !isConnectedToChannel) {
            const currentUserId = document.querySelector('meta[name="user-id"]')?.content;
            const currentUsername = document.querySelector('meta[name="username"]')?.content;
            const currentUserAvatar = document.querySelector('meta[name="user-avatar"]')?.content;
            
            if (currentUserId && !participantIds.has(currentUserId)) {
                renderList.push({
                    id: currentUserId,
                    user_id: currentUserId,
                    name: currentUsername || 'You',
                    username: currentUsername || 'You', 
                    avatar_url: currentUserAvatar || '/public/assets/common/default-profile-picture.png',
                    isBot: false,
                    isLocal: true,
                    isSelf: true
                });
                participantIds.add(currentUserId);
            }
        }


        const map = this.externalParticipants.get(channelId);
        if (map) {
            map.forEach((pData, uid) => {
                const participantId = String(uid);
                if (!participantIds.has(participantId)) {
                    renderList.push({
                        id: uid,
                        user_id: uid,
                        name: pData.username,
                        username: pData.username,
                        avatar_url: pData.avatar_url,
                        isBot: false,
                        isLocal: false
                    });
                    participantIds.add(participantId);
                }
            });
        }

        


        if (window.BotComponent && window.BotComponent.voiceBots) {
            window.BotComponent.voiceBots.forEach((botData, botId) => {
                if (botData.channel_id === channelId) {
                    renderList.push({
                        id: botId,
                        user_id: botData.user_id || botData.bot_id,
                        name: botData.username || 'TitiBot',
                        username: botData.username || 'TitiBot',
                        avatar_url: botData.avatar_url || '/public/assets/landing-page/robot.webp',
                        isBot: true,
                        isLocal: false,
                        status: botData.status || 'Ready to play music'
                    });
                }
            });
        }


        const currentParticipants = Array.from(container.querySelectorAll('.voice-participant-card'));
        const currentIds = currentParticipants.map(el => el.getAttribute('data-user-id')).filter(id => id);
        const newIds = renderList.map(p => String(p.user_id || p.id));
        

        if (mode === 'append') {

            this.appendNewParticipants(container, renderList, currentIds);
        } else {

            const hasChanges = currentIds.length !== newIds.length || 
                              !currentIds.every(id => newIds.includes(id)) ||
                              !newIds.every(id => currentIds.includes(id));


            if (renderList.length === 0 && currentIds.length === 0) {
                return;
            }


            if (hasChanges || renderList.length === 0) {


                this.updateParticipantContainer(container, renderList);
            }
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

        setTimeout(() => {
            this.restoreVoiceStateIndicators(channelId);
        }, 150);

        this.updateDebugPanel();
    }
    
    createParticipantElement(participant) {
        const div = document.createElement('div');
        div.className = 'voice-participant-card rounded-lg p-2 flex items-center space-x-3 transition-all duration-200';
        div.setAttribute('data-user-id', participant.user_id || participant.id);


        let avatarUrl = participant.avatar_url || '/public/assets/common/default-profile-picture.png';
        if (participant.isBot && (!avatarUrl || avatarUrl === '/public/assets/common/default-profile-picture.png')) {
            avatarUrl = '/public/assets/landing-page/robot.webp';
        }
        
        const displayName = participant.name || participant.username || 'Unknown';
        const isBot = participant.isBot || false;
        const currentUserId = document.querySelector('meta[name="user-id"]')?.content;
        const isSelf = !isBot && currentUserId && (String(participant.user_id) === currentUserId || String(participant.id) === currentUserId);
        const botStatus = participant.status || 'Ready to play music'; 

        const avatarHTML = `
            <div class="relative">
                <img src="${avatarUrl}"
                     alt="${displayName}"
                     class="w-8 h-8 rounded-full object-cover bg-[#5865f2]"
                     onerror="this.src='${isBot ? '/public/assets/landing-page/robot.webp' : '/public/assets/common/default-profile-picture.png'}'">
                ${isBot ? `<div class="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#5865f2] rounded-full flex items-center justify-center"><i class="fas fa-robot text-white" style="font-size: 6px;"></i></div>` : ''}
            </div>`;

        const nameHTML = `
            <div class="flex flex-col min-w-0 flex-1">
                <span class="participant-name text-white text-sm font-medium truncate max-w-[140px]">${displayName}${isSelf ? ' (You)' : ''}${isBot ? ' (Bot)' : ''}</span>
                ${isBot ? `<span class="text-xs text-[#5865f2] flex items-center"><i class="fas fa-music mr-1"></i>${botStatus}</span>` : ''}
            </div>`;
        
        const indicatorsHTML = !isBot ? `
            <div class="flex space-x-1">
                <div class="mute-indicator w-4 h-4 rounded-full flex items-center justify-center bg-red-500 hidden">
                    <i class="fas fa-microphone-slash text-white text-xs"></i>
                </div>
                <div class="deafen-indicator w-4 h-4 rounded-full flex items-center justify-center bg-red-600 hidden">
                    <i class="fas fa-deaf text-white text-xs"></i>
                </div>
            </div>` : '';

        div.innerHTML = avatarHTML + nameHTML + indicatorsHTML;

        if (!isBot) {
            setTimeout(() => {
                this.updateParticipantIndicators(div, participant, isSelf);
            }, 100);
        }

        return div;
    }
    
    updateParticipantIndicators(element, participant, isSelf) {
        const muteIndicator = element.querySelector('.mute-indicator');
        const deafenIndicator = element.querySelector('.deafen-indicator');
        
        if (isSelf && window.voiceManager) {
            const micState = window.voiceManager.getMicState();
            const deafenState = window.voiceManager.getDeafenState();
            
            if (muteIndicator) {
                const isMuted = !micState;
                muteIndicator.classList.toggle('hidden', !isMuted);
            }
            
            if (deafenIndicator) {
                deafenIndicator.classList.toggle('hidden', !deafenState);
            }
        } else if (!isSelf && window.voiceManager?.meeting) {
            if (muteIndicator) {
                const participantId = participant.id || participant.user_id;
                const sdkParticipant = window.voiceManager.meeting.participants.get(participantId);
                if (sdkParticipant) {
                    const isMuted = !sdkParticipant.micOn;
                    muteIndicator.classList.toggle('hidden', !isMuted);
                }
            }
        }
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
        const participantIds = new Set();
        let count = 0;
        

        const isConnectedToChannel = window.voiceManager &&
            window.voiceManager.currentChannelId === channelId &&
            window.voiceManager.isConnected &&
            window.voiceManager.getAllParticipants;

        if (isConnectedToChannel) {
            window.voiceManager.getAllParticipants().forEach(data => {
                const participantId = String(data.user_id || data.id);
                if (!participantIds.has(participantId)) {
                    participantIds.add(participantId);
                    count++;
                }
            });
        } else {

            const externalMap = this.externalParticipants.get(channelId);
            if (externalMap) {
                externalMap.forEach((pData, uid) => {
                    const participantId = String(uid);
                    if (!participantIds.has(participantId)) {
                        participantIds.add(participantId);
                        count++;
                    }
                });
            }
        }
        

        if (window.BotComponent && window.BotComponent.voiceBots) {
            let botCount = 0;
            window.BotComponent.voiceBots.forEach((botData, botId) => {
                if (botData.channel_id === channelId) {
                    const botParticipantId = `bot-${botData.bot_id || botId}`;
                    if (!participantIds.has(botParticipantId)) {
                        botCount++;
                    }
                }
            });
            
            if (botCount > 0) {
                count = Math.max(0, count - 1);
            }
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
        this.requestAllChannelStatusImmediate();
        this.loadExistingBotParticipants();
    }

    requestAllChannelStatusImmediate() {
        if (!window.globalSocketManager?.io || !window.globalSocketManager.isAuthenticated) {
            return;
        }
        document.querySelectorAll('[data-channel-type="voice"]').forEach(channel => {
            const channelId = channel.getAttribute('data-channel-id');
            if (channelId) {
                window.globalSocketManager.joinRoom('channel', channelId);
                window.globalSocketManager.io.emit('check-voice-meeting', { channel_id: channelId });
            }
        });
    }

    requestAllChannelStatusWithRetry(attempt = 0) {
        if (window.globalSocketManager?.io && window.globalSocketManager.isAuthenticated) {
            this.requestAllChannelStatusImmediate();
            return;
        }
        
        if (attempt < 10) {
            setTimeout(() => {
                this.requestAllChannelStatusWithRetry(attempt + 1);
            }, 200 + (attempt * 100));
        }
    }

    requestAllChannelStatus() {
        this.requestAllChannelStatusImmediate();
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





    createDebugPanel() {






















    }

    updateDebugPanel() {

        return;

















    }
    
    restoreVoiceStateIndicators(channelId) {
        if (!channelId || !window.voiceManager) return;
        
        const currentUserId = document.querySelector('meta[name="user-id"]')?.content;
        if (!currentUserId) return;
        
        const container = document.querySelector(`.voice-participants[data-channel-id="${channelId}"]`);
        if (!container) return;
        
        const userCard = container.querySelector(`[data-user-id="${currentUserId}"]`);
        if (!userCard) return;
        
        const micState = window.voiceManager.getMicState();
        const deafenState = window.voiceManager.getDeafenState();
        
        const muteIndicator = userCard.querySelector('.mute-indicator');
        const deafenIndicator = userCard.querySelector('.deafen-indicator');
        
        if (muteIndicator) {
            const isMuted = !micState;
            muteIndicator.classList.toggle('hidden', !isMuted);
            muteIndicator.classList.remove('bg-red-600', 'bg-green-600');
            muteIndicator.classList.add(isMuted ? 'bg-red-600' : 'bg-green-600');
        }
        
        if (deafenIndicator) {
            deafenIndicator.classList.toggle('hidden', !deafenState);
            deafenIndicator.classList.remove('bg-red-600', 'bg-green-600');
            deafenIndicator.classList.add(deafenState ? 'bg-red-600' : 'bg-green-600');
        }
    }
    
    static getInstance() {
        if (!window._channelVoiceParticipants) {
            window._channelVoiceParticipants = new ChannelVoiceParticipants();
        }
        return window._channelVoiceParticipants;
    }
    
    updateParticipantVoiceState(userId, channelId, type, state) {
        console.log(`🔊 [CHANNEL-VOICE-PARTICIPANTS] Updating participant voice state:`, {
            userId, channelId, type, state
        });
        
        const container = document.querySelector(`.voice-participants[data-channel-id="${channelId}"]`);
        if (!container) {
            console.warn(`⚠️ [CHANNEL-VOICE-PARTICIPANTS] No container found for channel ${channelId}`);
            return;
        }
        
        const participantCard = container.querySelector(`[data-user-id="${userId}"]`);
        if (!participantCard) {
            console.warn(`⚠️ [CHANNEL-VOICE-PARTICIPANTS] No participant card found for user ${userId} in channel ${channelId}`);
            return;
        }
        
        if (type === 'mic') {
            const muteIndicator = participantCard.querySelector('.mute-indicator');
            if (muteIndicator) {
                const isMuted = !state;
                muteIndicator.classList.toggle('hidden', !isMuted);
                
                muteIndicator.classList.remove('bg-red-500', 'bg-red-600', 'bg-green-600');
                muteIndicator.classList.add('bg-red-500');
                
                
            } else {
                console.warn(`⚠️ [CHANNEL-VOICE-PARTICIPANTS] No mute indicator found for user ${userId}`);
            }
        } else if (type === 'deafen') {
            const deafenIndicator = participantCard.querySelector('.deafen-indicator');
            if (deafenIndicator) {
                deafenIndicator.classList.toggle('hidden', !state);
                
                deafenIndicator.classList.remove('bg-red-600', 'bg-green-600');
                deafenIndicator.classList.add('bg-red-600');
                
                
            } else {
                console.warn(`⚠️ [CHANNEL-VOICE-PARTICIPANTS] No deafen indicator found for user ${userId}`);
            }
        }
        
        if (window.voiceCallSection && window.voiceManager?.currentChannelId === channelId) {
            let participantElement = window.voiceCallSection.participantElements?.get(userId);
            
            if (!participantElement) {
                for (const [participantId, element] of window.voiceCallSection.participantElements.entries()) {
                    const elementUserId = element.getAttribute('data-user-id');
                    if (elementUserId === String(userId)) {
                        participantElement = element;
                        break;
                    }
                }
            }
            
            if (participantElement) {
                if (type === 'mic') {
                    const muteIndicator = participantElement.querySelector('.mute-indicator');
                    if (muteIndicator) {
                        const isMuted = !state;
                        muteIndicator.classList.toggle('hidden', !isMuted);
                        
                        muteIndicator.classList.remove('bg-red-500', 'bg-green-500');
                        muteIndicator.classList.add('bg-red-500');
                        
                        
                    }
                } else if (type === 'deafen') {
                    const deafenIndicator = participantElement.querySelector('.deafen-indicator');
                    if (deafenIndicator) {
                        deafenIndicator.classList.toggle('hidden', !state);
                        
                        deafenIndicator.classList.remove('bg-red-600', 'bg-green-600');
                        deafenIndicator.classList.add('bg-red-600');
                        
                        
                    }
                }
            }
        }
    }

    
    forceRefreshChannel(channelId) {
        if (!channelId || !window.globalSocketManager?.io) return;
        
        
        

        window.globalSocketManager.io.emit('force-refresh-voice-participants', {
            channel_id: channelId
        });
        

        if (this.externalParticipants.has(channelId)) {
            
            this.externalParticipants.delete(channelId);
        }
        

        setTimeout(() => {
            this.updateSidebarForChannel(channelId, 'full');
        }, 100);
    }

    
    cleanupStaleParticipants() {
        
        

        this.externalParticipants.forEach((participantMap, channelId) => {
            if (participantMap.size > 0) {

                const container = document.querySelector(`.voice-participants[data-channel-id="${channelId}"]`);
                if (!container) {
                    console.warn(`⚠️ [CHANNEL-VOICE-PARTICIPANTS] Found external participants for channel ${channelId} but no container - clearing`);
                    this.externalParticipants.delete(channelId);
                    return;
                }
                

                if (container.children.length === 0) {
                    console.warn(`⚠️ [CHANNEL-VOICE-PARTICIPANTS] Empty container despite external participants for channel ${channelId} - forcing refresh`);
                    this.forceRefreshChannel(channelId);
                }
            }
        });
        

        if (window.voiceManager?.isConnected && window.voiceManager?.currentChannelId) {
            const currentChannelId = window.voiceManager.currentChannelId;
            const container = document.querySelector(`.voice-participants[data-channel-id="${currentChannelId}"]`);
            
            if (container && container.children.length === 0) {
                const hasLocalParticipants = window.voiceManager.getAllParticipants().size > 0;
                const hasExternalParticipants = this.externalParticipants.has(currentChannelId) && 
                                                this.externalParticipants.get(currentChannelId).size > 0;
                
                if (hasLocalParticipants || hasExternalParticipants) {
                    console.warn(`⚠️ [CHANNEL-VOICE-PARTICIPANTS] Connected to voice but no participants showing - forcing refresh`);
                    this.forceRefreshChannel(currentChannelId);
                }
            }
        }
        

        document.querySelectorAll('[data-channel-type="voice"]').forEach(channel => {
            const channelId = channel.getAttribute('data-channel-id');
            if (channelId && window.globalSocketManager?.isReady()) {
                window.globalSocketManager.joinRoom('channel', channelId);
            }
        });
    }

    updateParticipantContainer(container, renderList) {
        if (!container) return;
        

        const existingElements = Array.from(container.querySelectorAll('.voice-participant-card'));
        const str = (v) => v != null ? String(v) : '';
        const existingMap = new Map(); 
        
        existingElements.forEach(el => {
            const userId = str(el.getAttribute('data-user-id'));
            if (userId) {
                existingMap.set(userId, el);
            }
        });


        const desiredIds = renderList.map(p => str(p.user_id || p.id));
        const desiredSet = new Set(desiredIds);



        existingMap.forEach((el, id) => {
            if (!desiredSet.has(id)) {
                
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


        renderList.forEach((p, index) => {
            const pid = str(p.user_id || p.id);
            if (!existingMap.has(pid)) {
                
                const el = this.createParticipantElement(p);
                

                el.style.opacity = '0';
                el.style.transition = 'opacity 0.3s ease-in';
                

                if (index < container.children.length) {
                    container.insertBefore(el, container.children[index]);
                } else {
                    container.appendChild(el);
                }
                

                setTimeout(() => {
                    el.style.opacity = '1';
                }, 10);
                
                existingMap.set(pid, el);
            }
        });
    }

    appendNewParticipants(container, renderList, currentIds) {
        if (!container) return;
        
        
        
        const currentIdsSet = new Set(currentIds);
        let newParticipantsAdded = 0;
        

        renderList.forEach(participant => {
            const participantId = String(participant.user_id || participant.id);
            
            if (!currentIdsSet.has(participantId)) {
                
                
                const element = this.createParticipantElement(participant);
                

                element.style.opacity = '0';
                element.style.transform = 'translateY(10px)';
                element.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out';
                

                container.appendChild(element);
                

                setTimeout(() => {
                    element.style.opacity = '1';
                    element.style.transform = 'translateY(0)';
                }, 50);
                
                newParticipantsAdded++;
            }
        });
        
        if (newParticipantsAdded > 0) {
            
        }
    }

    updateSpeakingIndicator(userId, channelId, isSpeaking) {
        
        
        const container = document.querySelector(`.voice-participants[data-channel-id="${channelId}"]`);
        if (!container) {
            console.warn(`⚠️ [CHANNEL-VOICE-PARTICIPANTS] No container found for channel ${channelId}`);
            return;
        }
        
        const userElement = container.querySelector(`[data-user-id="${userId}"]`);
        if (!userElement) {
            console.warn(`⚠️ [CHANNEL-VOICE-PARTICIPANTS] No participant element found for user ${userId} in channel ${channelId}`);
            return;
        }
        
        const avatarContainer = userElement.querySelector('.relative');
        if (avatarContainer) {
            if (isSpeaking) {
                avatarContainer.classList.add('speaking-indicator');
            } else {
                avatarContainer.classList.remove('speaking-indicator');
            }
            
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    ChannelVoiceParticipants.getInstance();
});

window.ChannelVoiceParticipants = ChannelVoiceParticipants;


window.forceRefreshVoiceParticipants = (channelId) => {
    const instance = ChannelVoiceParticipants.getInstance();
    if (channelId) {
        instance.forceRefreshChannel(channelId);
    } else {
        instance.cleanupStaleParticipants();
    }
};

window.cleanupAllVoiceParticipants = () => {
    const instance = ChannelVoiceParticipants.getInstance();
    instance.cleanupStaleParticipants();
};