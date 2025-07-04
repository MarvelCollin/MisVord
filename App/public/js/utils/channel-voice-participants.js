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

        

        window.addEventListener('videosdkParticipantJoined', (event) => {
            const { participant, participantObj } = event.detail;

            this.handleVideoSDKParticipantJoined(participantObj || { id: participant });
        });

        window.addEventListener('videosdkParticipantLeft', (event) => {
            const { participant } = event.detail;

            this.handleVideoSDKParticipantLeft(participant);
        });


        this.startVideoSDKSync();
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

    startVideoSDKSync() {


        setInterval(async () => {
            await this.syncWithVideoSDK();
        }, 5000);
    }

    async syncWithVideoSDK() {
        if (!window.videoSDKManager?.isReady() || !window.videoSDKManager?.meeting) {
            return;
        }

        const currentVoiceChannelId = window.voiceManager?.currentChannelId;
        if (!currentVoiceChannelId) {
            return;
        }


        
        const videoSDKParticipants = new Map();
        const existingParticipants = this.participants.get(currentVoiceChannelId) || new Map();
        

        if (window.videoSDKManager.meeting.participants) {
            for (const [participantId, participant] of window.videoSDKManager.meeting.participants.entries()) {
                const username = participant.displayName || participant.name || 'Unknown';
                

                const existingData = existingParticipants.get(participantId);
                if (existingData && existingData.avatar_url !== '/public/assets/common/default-profile-picture.png') {
                    videoSDKParticipants.set(participantId, existingData);
                    continue;
                }
                
                try {

                    const userData = await window.userDataHelper?.getUserData(username, username);
                    if (userData) {
                        videoSDKParticipants.set(participantId, userData);
                    } else {

                        videoSDKParticipants.set(participantId, {
                            id: participantId,
                            username: username,
                            display_name: username,
                            avatar_url: '/public/assets/common/default-profile-picture.png'
                        });
                    }
                } catch (error) {
                    console.warn('[VOICE-PARTICIPANT] Failed to fetch user data for:', username, error);

                    videoSDKParticipants.set(participantId, {
                        id: participantId,
                        username: username,
                        display_name: username,
                        avatar_url: '/public/assets/common/default-profile-picture.png'
                    });
                }
            }
        }


        if (window.videoSDKManager.meeting.localParticipant) {
            const localParticipant = window.videoSDKManager.meeting.localParticipant;
            const currentUserData = window.userDataHelper?.getCurrentUserData();
            
            videoSDKParticipants.set(localParticipant.id, {
                id: localParticipant.id,
                username: currentUserData?.username || localParticipant.displayName || localParticipant.name || 'You',
                display_name: currentUserData?.display_name || localParticipant.displayName || localParticipant.name || 'You',
                avatar_url: currentUserData?.avatar_url || '/public/assets/common/default-profile-picture.png'
            });
        }


        if (videoSDKParticipants.size > 0) {
            this.participants.set(currentVoiceChannelId, videoSDKParticipants);
            this.updateParticipantContainer(currentVoiceChannelId);
            this.updateChannelCount(currentVoiceChannelId, videoSDKParticipants.size);
        }
    }

    handleVideoSDKParticipantJoined(participant) {
        const currentVoiceChannelId = window.voiceManager?.currentChannelId;
        if (!currentVoiceChannelId) {
            return;
        }


        const channelParticipants = this.participants.get(currentVoiceChannelId);
        if (channelParticipants && channelParticipants.has(participant.id)) {
            return;
        }

        this.addParticipant(currentVoiceChannelId, participant.id, participant.displayName || participant.name);
        this.updateParticipantContainer(currentVoiceChannelId);
    }

    handleVideoSDKParticipantLeft(participantId) {
        const currentVoiceChannelId = window.voiceManager?.currentChannelId;
        if (!currentVoiceChannelId) {
            return;
        }


        this.removeParticipant(currentVoiceChannelId, participantId);
        this.updateParticipantContainer(currentVoiceChannelId);
    }

    attachVoiceEvents() {
        let voiceConnectHandled = false;
        
        window.addEventListener('voiceConnect', (event) => {
            const channelId = event.detail?.channelId;
            if (channelId && !voiceConnectHandled) {

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
        } else if (action === 'leave' && user_id) {
            this.removeParticipant(channel_id, user_id);
        } else if (action === 'already_registered' && user_id && !participantExists) {
            await this.addParticipant(channel_id, user_id, username);
        }

        this.updateParticipantContainer(channel_id);
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
    }    async addParticipant(channelId, userId, username) {
        if (!this.participants.has(channelId)) {
            this.participants.set(channelId, new Map());
        }

        const channelParticipants = this.participants.get(channelId);
        const normalizedUserId = userId.toString();
        

        if (this.coordinator && this.coordinator.hasParticipant(channelId, normalizedUserId)) {
            return;
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

    updateParticipantContainer(channelId) {
        const container = document.querySelector(`.voice-participants[data-channel-id="${channelId}"]`);
        if (!container) {
            return;
        }

        const channelParticipants = this.participants.get(channelId);
        
        if (!channelParticipants || channelParticipants.size === 0) {
            container.classList.add('hidden');
            container.style.display = 'none';
            container.innerHTML = '';
            return;
        }

        container.classList.remove('hidden');
        container.style.display = 'block';
        container.style.visibility = 'visible';
        

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
            countEl.textContent = count.toString();
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
    }

    async loadExistingMeetings() {

        
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


        document.querySelectorAll('.voice-participants').forEach(container => {
            const channelId = container.getAttribute('data-channel-id');
            if (channelId) {
                this.updateParticipantContainer(channelId);
            }
        });
    }

    preserveCurrentState(voiceState) {
        if (!voiceState.isConnected || !voiceState.channelId) {
            return;
        }


        

        this.preservedChannelId = voiceState.channelId;
        this.preservedMeetingId = voiceState.meetingId;
    }
}

window.ChannelVoiceParticipants = ChannelVoiceParticipants;

window.addCurrentUserToVoiceChannel = function(channelId) {
    const instance = ChannelVoiceParticipants.getInstance();
    instance.addCurrentUserToChannel(channelId);
};

document.addEventListener('DOMContentLoaded', () => {
    ChannelVoiceParticipants.getInstance();
});