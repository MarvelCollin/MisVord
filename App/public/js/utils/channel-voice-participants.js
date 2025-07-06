class ChannelVoiceParticipants {
    constructor() {
        this.participants = new Map();
        this.coordinator = null;
        this.init();
    }

    init() {
        this.setupCoordinator();
        this.setupSocketListeners();
        this.setupVideoSDKListeners();
        this.loadExistingMeetings();
        this.attachVoiceEvents();
        this.setupChannelSwitchListeners();
        this.setupPresenceValidation();
        this.startGlobalParticipantSync();
        this.setupCoordinationListeners();
    }

    setupCoordinator() {
        if (window.participantCoordinator) {
            this.coordinator = window.participantCoordinator;
            this.coordinator.registerSystem('ChannelVoiceParticipants');
        } else {
            setTimeout(() => this.setupCoordinator(), 100);
        }
    }

    setupPresenceValidation() {
        window.addEventListener('presenceForceReset', () => {

            this.validateAllParticipants();
        });
        
        setInterval(() => {
            this.validateCurrentUserPresence();
        }, 3000);
    }

    validateCurrentUserPresence() {
        if (!window.videoSDKManager || !window.globalSocketManager) return;
        
        const isVideoSDKConnected = window.videoSDKManager.isConnected && 
                                   window.videoSDKManager.isMeetingJoined;
        const currentActivity = window.globalSocketManager.currentActivityDetails?.type || '';
        const isPresenceInVoice = currentActivity.startsWith('In Voice');
        const currentChannelId = window.voiceManager?.currentChannelId;
        
        if (!isVideoSDKConnected && isPresenceInVoice && currentChannelId) {

            this.removeParticipant(currentChannelId, window.currentUserId);
        }
    }

    validateAllParticipants() {

        
        for (const [channelId, channelParticipants] of this.participants.entries()) {
            this.updateParticipantContainer(channelId);
        }
    }

    setupSocketListeners() {
        if (window.globalSocketManager?.io) {
            this.attachSocketEvents();
        } else {
            window.addEventListener('globalSocketReady', () => {
                this.attachSocketEvents();
            });
        }
    }

    setupVideoSDKListeners() {
        // DISABLED: No longer listen to VideoSDK events to prevent conflicts
        // VoiceCallSection now handles VideoSDK participants exclusively
        // This system focuses only on socket-based channel indicators
        
        // Keep the sync for current user's presence validation only
        this.startPresenceSync();
    }

    attachSocketEvents() {
        if (!window.globalSocketManager || !window.globalSocketManager.io) {
            console.warn('[VOICE-PARTICIPANT] GlobalSocketManager or socket not available, retrying in 1 second...');
            setTimeout(() => {
                this.attachSocketEvents();
            }, 1000);
            return;
        }
        
        const socket = window.globalSocketManager.io;
        

        
        socket.on('voice-meeting-update', (data) => {

            this.handleVoiceMeetingUpdate(data);
        });

        socket.on('voice-meeting-status', (data) => {
            if (data.has_meeting && data.participants && data.participants.length > 0) {
                data.participants.forEach(participant => {
                    this.addParticipant(data.channel_id, participant.user_id, participant.username);
                });
                this.updateParticipantContainer(data.channel_id);
                this.forceRefreshAllContainers();
            } else if (!data.has_meeting) {
                this.clearChannelParticipants(data.channel_id);
                this.updateParticipantContainer(data.channel_id);
                this.forceRefreshAllContainers();
            }
        });

        socket.on('user-presence-update', (data) => {
            if (data.activity_details?.type === 'In Voice Call') {
                this.updateParticipantPresence(data);
            }
        });
        

    }

    setupChannelSwitchListeners() {
        window.addEventListener('preserveVoiceParticipants', (event) => {

            this.preserveCurrentState(event.detail);
        });
    }

    startPresenceSync() {
        // Sync only for presence validation, not participant management
        setInterval(() => {
            this.validateCurrentUserPresence();
        }, 5000);
    }

    // VideoSDK-specific methods removed to prevent conflicts
    // VoiceCallSection now handles all VideoSDK participants

    attachVoiceEvents() {
        let voiceConnectHandled = false;
        
        window.addEventListener('voiceConnect', (event) => {
            const channelId = event.detail?.channelId;
            if (channelId && !voiceConnectHandled) {
                const container = document.querySelector(`.voice-participants[data-channel-id="${channelId}"]`);
                if (container) {
                    container.classList.remove('hidden');
                    container.style.display = 'block';
                }
                voiceConnectHandled = true;
                
                setTimeout(() => {
                    this.addCurrentUserToChannel(channelId);
                    voiceConnectHandled = false;
                }, 1000);
            } else if (voiceConnectHandled) {

            }
        });
    }

    async handleVoiceMeetingUpdate(data) {
        const { channel_id, action, user_id, username, participant_count } = data;
        
        if (!channel_id) return;

        if (participant_count !== undefined) {
            this.updateChannelCount(channel_id, participant_count);
        }

        const isOwnEvent = user_id === window.currentUserId || user_id === window.globalSocketManager?.userId;
        if (isOwnEvent && window.videoSDKManager?.isReady()) {
            return;
        }

        const channelParticipants = this.participants.get(channel_id);
        const participantExists = channelParticipants && channelParticipants.has(user_id?.toString());

        if (action === 'join' && user_id && !participantExists) {
            await this.addParticipant(channel_id, user_id, username);
        } else if (action === 'already_registered' && user_id && !participantExists) {
            await this.addParticipant(channel_id, user_id, username);
        }

        this.updateParticipantContainer(channel_id);
        this.forceRefreshAllContainers();
    }

    async addCurrentUserToChannel(channelId) {
        if (!window.currentUserId || !window.currentUsername) {
            console.warn('[VOICE-PARTICIPANT] Current user info not available');
            return;
        }

        console.log('[VOICE-PARTICIPANT] Adding current user to channel:', {
            channelId,
            userId: window.currentUserId,
            username: window.currentUsername
        });

        await this.addParticipant(channelId, window.currentUserId, window.currentUsername);
        this.updateParticipantContainer(channelId);
    }    
    async addParticipant(channelId, userId, username) {
        if (!this.participants.has(channelId)) {
            this.participants.set(channelId, new Map());
        }

        const channelParticipants = this.participants.get(channelId);
        const normalizedUserId = userId.toString();
        
        // Use coordinator to prevent conflicts with VoiceCallSection
        if (this.coordinator) {
            if (this.coordinator.hasParticipant(channelId, normalizedUserId)) {
                const existingSystem = this.coordinator.getParticipantSystem(normalizedUserId);
                const isCurrentUser = normalizedUserId === window.currentUserId;
                if (existingSystem === 'VoiceCallSection' && isCurrentUser) {
                    // VoiceCallSection has priority for the current user, don't add to channel indicators
                    return;
                }
            }
        }
        
        if (channelParticipants.has(normalizedUserId)) {
            return;
        }


        if (!window.userDataHelper) {
            await this.waitForUserDataHelper();
        }

        let participantData;
        if (window.userDataHelper) {
            try {
                participantData = await window.userDataHelper.getUserData(normalizedUserId, username);
            } catch (error) {
                participantData = {
                    id: normalizedUserId,
                    username: username || 'Unknown',
                    display_name: window.userDataHelper.getCleanDisplayName(username || normalizedUserId),
                    avatar_url: '/public/assets/common/default-profile-picture.png'
                };
            }
        } else {
            participantData = {
                id: normalizedUserId,
                username: username || 'Unknown',
                display_name: this.cleanDisplayName(username || normalizedUserId),
                avatar_url: '/public/assets/common/default-profile-picture.png'
            };
        }


        if (this.coordinator) {
            const added = this.coordinator.addParticipant(channelId, normalizedUserId, participantData, 'ChannelVoiceParticipants');
            if (!added) {
                return; // Already exists in coordinator
            }
        }

        channelParticipants.set(normalizedUserId, participantData);
    }

    removeParticipant(channelId, userId) {
        const normalizedUserId = userId.toString();
        

        if (this.coordinator) {
            this.coordinator.removeParticipant(channelId, normalizedUserId, 'ChannelVoiceParticipants');
        }
        
        if (!this.participants.has(channelId)) {
            return;
        }

        const channelParticipants = this.participants.get(channelId);
        const participant = channelParticipants.get(normalizedUserId);
        
        if (participant) {
            channelParticipants.delete(normalizedUserId);
            

            this.updateParticipantContainer(channelId);
            this.updateChannelCount(channelId, channelParticipants.size);
        }

        if (channelParticipants.size === 0) {
            this.participants.delete(channelId);
        }
    }

    clearChannelParticipants(channelId) {
        if (this.coordinator) {
            this.coordinator.clearChannel(channelId);
        }
        
        this.participants.delete(channelId);
    }

    updateParticipantContainer(channelId) {
        const container = document.querySelector(`.voice-participants[data-channel-id="${channelId}"]`);
        if (!container) return;

        const channelParticipants = this.participants.get(channelId) || new Map();
        
        if (channelParticipants.size > 0) {
            container.classList.remove('hidden');
        } else {
            container.classList.add('hidden');
        }

        const activeParticipantIds = new Set(Array.from(channelParticipants.keys()));
        const renderedParticipantElements = container.querySelectorAll('.participant-profile');
        const renderedParticipantIds = new Set(
            Array.from(renderedParticipantElements).map(el => el.getAttribute('data-user-id'))
        );

        container.innerHTML = '';

        const addedParticipants = new Set();

        channelParticipants.forEach(participant => {
            if (addedParticipants.has(participant.id)) {
                return;
            }
            
            addedParticipants.add(participant.id);
            const participantEl = this.createParticipantElement(participant);
            container.appendChild(participantEl);
        });

        this.updateChannelCount(channelId, channelParticipants.size);
    }

    createParticipantElement(participant) {
        const div = document.createElement('div');
        div.className = 'flex items-center py-1 px-2 text-gray-300 hover:text-white transition-colors duration-200';
        div.setAttribute('data-user-id', participant.id);
        

        const avatarUrl = participant.avatar_url || '/public/assets/common/default-profile-picture.png';
        const displayName = participant.display_name || participant.username || 'Unknown';
        
        div.innerHTML = `
            <div class="relative mr-2">
                <img src="${avatarUrl}" 
                     alt="${displayName}" 
                     class="w-5 h-5 rounded-full bg-gray-600 user-avatar object-cover"
                     onerror="this.src='/public/assets/common/default-profile-picture.png'">
                <div class="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-discord-green rounded-full border border-discord-dark"></div>
            </div>
            <span class="text-sm truncate">${displayName}</span>
        `;


        if (window.fallbackImageHandler) {
            const img = div.querySelector('img.user-avatar');
            if (img) {
                window.fallbackImageHandler.processImage(img);
            }
        }

        return div;
    }



    loadParticipantAvatar(participantElement, userId) {


    }

    updateChannelCount(channelId, count) {
        const channelItem = document.querySelector(`[data-channel-id="${channelId}"]`);
        if (!channelItem) return;

        const countEl = channelItem.querySelector('.voice-user-count');
        if (countEl) {
            if (count > 0) {
                countEl.textContent = count.toString();
                countEl.style.display = 'inline-block';
                countEl.classList.remove('hidden');
            } else {
                countEl.style.display = 'none';
                countEl.classList.add('hidden');
            }
        }

        const channelElement = channelItem.querySelector('.channel-item, .voice-channel');
        if (channelElement) {
            if (count > 0) {
                channelElement.classList.add('has-participants');
                channelElement.classList.remove('no-participants');
            } else {
                channelElement.classList.remove('has-participants');
                channelElement.classList.add('no-participants');
            }
        }
    }

    updateParticipantPresence(data) {
        for (const [channelId, channelParticipants] of this.participants.entries()) {
            const normalizedUserId = data.user_id.toString();
            if (channelParticipants.has(normalizedUserId)) {
                const participant = channelParticipants.get(normalizedUserId);
                participant.status = data.status;
                participant.activity_details = data.activity_details;
                this.updateParticipantContainer(channelId);
                break;
            }
        }
    }    async loadExistingMeetings() {
        if (!window.globalSocketManager?.isReady()) {
            setTimeout(() => this.loadExistingMeetings(), 1000);
            return;
        }

        const voiceChannels = document.querySelectorAll('[data-channel-type="voice"]');
        
        voiceChannels.forEach(channel => {
            const channelId = channel.getAttribute('data-channel-id');
            const channelName = channel.getAttribute('data-channel-name');

            if (channelId) {
                window.globalSocketManager.io.emit('check-voice-meeting', { channel_id: channelId });
            }
        });

        setTimeout(() => {
            this.forceRefreshAllContainers();
        }, 2000);
    }

    getParticipants(channelId) {
        return this.participants.get(channelId) || new Map();
    }

    cleanDisplayName(name) {
        if (!name) return 'Unknown';
        
        const nameStr = String(name);
        

        if (nameStr.includes('_') && !isNaN(nameStr.split('_').pop())) {
            return nameStr.substring(0, nameStr.lastIndexOf('_'));
        }
        
        return nameStr;
    }

    async waitForUserDataHelper(maxWaitTime = 5000) {
        if (window.userDataHelper) return window.userDataHelper;
        
        const startTime = Date.now();
        while (!window.userDataHelper && (Date.now() - startTime) < maxWaitTime) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        return window.userDataHelper || null;
    }

    async waitForUserAPI(maxWaitTime = 5000) {
        if (window.userAPI) return;
        
        const startTime = Date.now();
        while (!window.userAPI && (Date.now() - startTime) < maxWaitTime) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        if (!window.userAPI) {
            console.warn('[VOICE-PARTICIPANT] UserAPI not available after waiting', maxWaitTime, 'ms');
        }
    }

    startGlobalParticipantSync() {
        setInterval(() => {
            if (window.globalSocketManager?.isReady()) {
                this.requestAllVoiceChannelUpdates();
            }
        }, 10000);
    }

    requestAllVoiceChannelUpdates() {
        const voiceChannels = document.querySelectorAll('[data-channel-type="voice"]');
        voiceChannels.forEach(channel => {
            const channelId = channel.getAttribute('data-channel-id');
            if (channelId) {
                window.globalSocketManager.io.emit('check-voice-meeting', { channel_id: channelId });
            }
        });
    }



    static getInstance() {
        if (!window._channelVoiceParticipants) {
            window._channelVoiceParticipants = new ChannelVoiceParticipants();
        }
        return window._channelVoiceParticipants;
    }

    refreshAllChannelParticipants() {
        if (window.videoSDKManager?.isReady()) {
            this.syncWithVideoSDK();
        }

        this.forceRefreshAllContainers();
        
        this.loadExistingMeetings();
    }

    preserveCurrentState(voiceState) {
        if (!voiceState.isConnected || !voiceState.channelId) {
            return;
        }


        

        this.preservedChannelId = voiceState.channelId;
        this.preservedMeetingId = voiceState.meetingId;
    }

    forceRefreshAllContainers() {
        document.querySelectorAll('.voice-participants').forEach(container => {
            const channelId = container.getAttribute('data-channel-id');
            if (channelId) {
                const channelParticipants = this.participants.get(channelId);
                if (channelParticipants && channelParticipants.size > 0) {
                    this.updateParticipantContainer(channelId);
                }
            }
        });
    }

    onChannelSwitch() {
        setTimeout(() => {
            this.forceRefreshAllContainers();
            this.requestAllVoiceChannelUpdates();
        }, 500);
    }

    syncParticipantsFromPresence(voiceChannelsData) {
        if (!voiceChannelsData) return;
    
        const newParticipantsState = new Map();
    
        for (const channelId in voiceChannelsData) {
            const channelData = voiceChannelsData[channelId];
            if (channelData && channelData.participants && channelData.participants.length > 0) {
                
                const newChannelParticipantsMap = new Map();
                const uniqueParticipants = new Map();
                
                channelData.participants.forEach(p => {
                    if (p && p.id && !uniqueParticipants.has(p.id.toString())) {
                        uniqueParticipants.set(p.id.toString(), p);
                    }
                });
    
                uniqueParticipants.forEach(participant => {
                    const participantIdStr = participant.id.toString();
                    newChannelParticipantsMap.set(participantIdStr, {
                        id: participantIdStr,
                        username: participant.username,
                        display_name: participant.username,
                        avatar_url: participant.avatar_url || '/public/assets/common/default-profile-picture.png'
                    });
                });
    
                newParticipantsState.set(channelId.toString(), newChannelParticipantsMap);
            }
        }
    
        this.participants = newParticipantsState;
        
        this.forceRefreshAllContainers();
    }
}

window.ChannelVoiceParticipants = ChannelVoiceParticipants;

window.addCurrentUserToVoiceChannel = function(channelId) {
    const instance = ChannelVoiceParticipants.getInstance();
    instance.addCurrentUserToChannel(channelId);
};

window.refreshAllVoiceParticipants = function() {
    if (window.ChannelVoiceParticipants) {
        const instance = window.ChannelVoiceParticipants.getInstance();
        if (instance) {
            instance.refreshAllChannelParticipants();
            instance.forceRefreshAllContainers();
        }
    }
};

window.updateVoiceChannelCount = function(channelId, count) {
    if (window.ChannelVoiceParticipants) {
        const instance = window.ChannelVoiceParticipants.getInstance();
        if (instance && typeof instance.updateChannelCount === 'function') {
            instance.updateChannelCount(channelId, count);
        }
    }
};

window.debugVoiceParticipants = function() {
    const instance = window.ChannelVoiceParticipants?.getInstance();
    if (!instance) {
        console.log('❌ No ChannelVoiceParticipants instance found');
        return;
    }
    
    console.log('🔍 Voice Participants Debug Info:');
    console.log('Participants by Channel:', Array.from(instance.participants.entries()));
    
    document.querySelectorAll('.voice-participants').forEach(container => {
        const channelId = container.getAttribute('data-channel-id');
        const isHidden = container.classList.contains('hidden');
        const participantCount = container.children.length;
        
        console.log(`Channel ${channelId}: Hidden=${isHidden}, Participants=${participantCount}`);
    });
    
    if (window.participantCoordinator) {
        console.log('Coordinator Active Participants:', Array.from(window.participantCoordinator.activeParticipants.entries()));
    }
    
    instance.forceRefreshAllContainers();
    instance.requestAllVoiceChannelUpdates();
};

window.testVoiceParticipantSync = function() {
    console.log('🧪 Testing voice participant synchronization...');
    window.debugVoiceParticipants();
    
    setTimeout(() => {
        console.log('🔄 Refreshing after 2 seconds...');
        window.refreshAllVoiceParticipants();
    }, 2000);
};

document.addEventListener('DOMContentLoaded', () => {
    ChannelVoiceParticipants.getInstance();
});

window.ChannelVoiceParticipants.prototype.setupCoordinationListeners = function() {
        window.addEventListener('voiceParticipantUpdate', (event) => {
            if (event.detail.voiceParticipants) {
                this.syncParticipantsFromPresence(event.detail.voiceParticipants);
            } else if (event.detail.channelId) {
                this.updateParticipantContainer(event.detail.channelId);
                this.forceRefreshAllContainers();
            }
        });
    }