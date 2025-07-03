class ChannelVoiceParticipants {
    constructor() {
        this.participants = new Map();
        this.init();
    }

    init() {
        this.setupSocketListeners();
        this.setupVideoSDKListeners();
        this.loadExistingMeetings();
        this.attachVoiceEvents();
        this.setupChannelSwitchListeners();
        this.setupPresenceValidation();
        console.log('[VOICE-PARTICIPANT] Voice participants manager initialized');
    }

    setupPresenceValidation() {
        window.addEventListener('presenceForceReset', () => {
            console.log('[VOICE-PARTICIPANT] Presence force reset detected, updating participants');
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
            console.log('[VOICE-PARTICIPANT] Removing current user from voice channel due to VideoSDK disconnect');
            this.removeParticipant(currentChannelId, window.currentUserId);
        }
    }

    validateAllParticipants() {
        console.log('[VOICE-PARTICIPANT] Validating all participants against actual voice state');
        
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
        console.log('[VOICE-PARTICIPANT] Setting up VideoSDK listeners for real-time participants');
        
        // Listen for VideoSDK participant events
        window.addEventListener('videosdkParticipantJoined', (event) => {
            const { participant, participantObj } = event.detail;
            console.log('[VOICE-PARTICIPANT] VideoSDK participant joined:', participant);
            this.handleVideoSDKParticipantJoined(participantObj || { id: participant });
        });

        window.addEventListener('videosdkParticipantLeft', (event) => {
            const { participant } = event.detail;
            console.log('[VOICE-PARTICIPANT] VideoSDK participant left:', participant);
            this.handleVideoSDKParticipantLeft(participant);
        });

        // Periodically sync with VideoSDK participants
        this.startVideoSDKSync();
    }

    attachSocketEvents() {
        const socket = window.globalSocketManager.io;
        
        console.log('[VOICE-PARTICIPANT] Attaching socket events...');
        
        socket.on('voice-meeting-update', (data) => {
            console.log('[VOICE-PARTICIPANT] Voice meeting update received:', data);
            this.handleVoiceMeetingUpdate(data);
        });

        socket.on('voice-meeting-status', (data) => {
            console.log('[VOICE-PARTICIPANT] Voice meeting status received:', data);
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
        
        console.log('[VOICE-PARTICIPANT] Socket events attached successfully');
    }

    setupChannelSwitchListeners() {
        window.addEventListener('preserveVoiceParticipants', (event) => {
            console.log('[VOICE-PARTICIPANT] Preserving voice participants during channel switch');
            this.preserveCurrentState(event.detail);
        });
    }

    startVideoSDKSync() {
        // Sync every 5 seconds to ensure participants are up to date
        // Reduced frequency to prevent conflicts with socket events
        setInterval(() => {
            this.syncWithVideoSDK();
        }, 5000);
    }

    syncWithVideoSDK() {
        if (!window.videoSDKManager?.isReady() || !window.videoSDKManager?.meeting) {
            return;
        }

        const currentVoiceChannelId = window.voiceManager?.currentChannelId;
        if (!currentVoiceChannelId) {
            return;
        }

        console.log('[VOICE-PARTICIPANT] Syncing with VideoSDK participants');
        
        const videoSDKParticipants = new Map();
        
        // Collect all VideoSDK participants
        if (window.videoSDKManager.meeting.participants) {
            window.videoSDKManager.meeting.participants.forEach((participant, participantId) => {
                videoSDKParticipants.set(participantId, {
                    id: participantId,
                    username: participant.displayName || participant.name || 'Unknown',
                    display_name: participant.displayName || participant.name || 'Unknown',
                    avatar_url: '/public/assets/common/default-profile-picture.png'
                });
            });
        }

        // Add local participant
        if (window.videoSDKManager.meeting.localParticipant) {
            const localParticipant = window.videoSDKManager.meeting.localParticipant;
            videoSDKParticipants.set(localParticipant.id, {
                id: localParticipant.id,
                username: localParticipant.displayName || localParticipant.name || 'You',
                display_name: localParticipant.displayName || localParticipant.name || 'You',
                avatar_url: '/public/assets/common/default-profile-picture.png'
            });
        }

        // Update UI with VideoSDK participants
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

        console.log('[VOICE-PARTICIPANT] Adding VideoSDK participant to UI:', participant.id);
        this.addParticipant(currentVoiceChannelId, participant.id, participant.displayName || participant.name);
        this.updateParticipantContainer(currentVoiceChannelId);
    }

    handleVideoSDKParticipantLeft(participantId) {
        const currentVoiceChannelId = window.voiceManager?.currentChannelId;
        if (!currentVoiceChannelId) {
            return;
        }

        console.log('[VOICE-PARTICIPANT] Removing VideoSDK participant from UI:', participantId);
        this.removeParticipant(currentVoiceChannelId, participantId);
        this.updateParticipantContainer(currentVoiceChannelId);
    }

    attachVoiceEvents() {
        let voiceConnectHandled = false;
        
        window.addEventListener('voiceConnect', (event) => {
            const channelId = event.detail?.channelId;
            if (channelId && !voiceConnectHandled) {
                console.log('[VOICE-PARTICIPANT] Voice connect event received, adding current user to channel:', channelId);
                voiceConnectHandled = true;
                
                setTimeout(() => {
                    this.addCurrentUserToChannel(channelId);
                    voiceConnectHandled = false;
                }, 1000);
            } else if (voiceConnectHandled) {
                console.log('[VOICE-PARTICIPANT] Voice connect event already handled, skipping');
            }
        });
    }

    async handleVoiceMeetingUpdate(data) {
        const { channel_id, action, user_id, username, participant_count } = data;
        
        if (!channel_id) return;

        console.log('[VOICE-PARTICIPANT] Voice meeting update:', action, user_id, username);

        // Always update channel count regardless of action
        if (participant_count !== undefined) {
            this.updateChannelCount(channel_id, participant_count);
        }

        // Don't process our own events if VideoSDK is managing our connection
        const isOwnEvent = user_id === window.currentUserId || user_id === window.globalSocketManager?.userId;
        if (isOwnEvent && window.videoSDKManager?.isReady()) {
            console.log('[VOICE-PARTICIPANT] Skipping own event, VideoSDK managing our connection');
            return;
        }

        if (action === 'join' && user_id) {
            await this.addParticipant(channel_id, user_id, username);
        } else if (action === 'leave' && user_id) {
            this.removeParticipant(channel_id, user_id);
        } else if (action === 'already_registered' && user_id) {
            console.log('[VOICE-PARTICIPANT] User already registered, adding to participants:', user_id);
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
    }

    async addParticipant(channelId, userId, username) {
        if (!this.participants.has(channelId)) {
            this.participants.set(channelId, new Map());
        }

        const channelParticipants = this.participants.get(channelId);
        
        const normalizedUserId = userId.toString();
        
        if (channelParticipants.has(normalizedUserId)) {
            console.log('[VOICE-PARTICIPANT] Participant already exists:', normalizedUserId, 'username:', username);
            return;
        }

        console.log('[VOICE-PARTICIPANT] Adding participant:', normalizedUserId, username);

        let participantData = {
            id: normalizedUserId,
            username: username || 'Unknown',
            display_name: username || 'Unknown',
            avatar_url: '/public/assets/common/default-profile-picture.png'
        };

        const isValidUserId = /^\d+$/.test(normalizedUserId);
        
        if (isValidUserId) {
            try {
                if (window.userAPI) {
                    const userData = await window.userAPI.getUserProfile(normalizedUserId);
                    if (userData && userData.success && userData.data && userData.data.user) {
                        participantData.display_name = userData.data.user.display_name || userData.data.user.username || participantData.username;
                        participantData.avatar_url = userData.data.user.avatar_url || participantData.avatar_url;
                    }
                } else {
                    await this.waitForUserAPI();
                    if (window.userAPI) {
                        const userData = await window.userAPI.getUserProfile(normalizedUserId);
                        if (userData && userData.success && userData.data && userData.data.user) {
                            participantData.display_name = userData.data.user.display_name || userData.data.user.username || participantData.username;
                            participantData.avatar_url = userData.data.user.avatar_url || participantData.avatar_url;
                        }
                    } else {
                        const response = await fetch(`/api/users/${normalizedUserId}/profile`, {
                            method: 'GET',
                            credentials: 'same-origin'
                        });
                        
                        if (response.ok) {
                            const userData = await response.json();
                            if (userData.success && userData.data && userData.data.user) {
                                participantData.display_name = userData.data.user.display_name || userData.data.user.username || participantData.username;
                                participantData.avatar_url = userData.data.user.avatar_url || participantData.avatar_url;
                            }
                        }
                    }
                }
            } catch (error) {
                console.warn('[VOICE-PARTICIPANT] Failed to fetch user profile:', error);
            }
        } else {
            console.log('[VOICE-PARTICIPANT] Using session ID for participant:', normalizedUserId, 'username:', username);
        }

        channelParticipants.set(normalizedUserId, participantData);
        console.log('[VOICE-PARTICIPANT] Successfully added participant:', participantData.display_name, 'to channel', channelId);
    }

    removeParticipant(channelId, userId) {
        if (!this.participants.has(channelId)) {
            console.log('[VOICE-PARTICIPANT] No participants found for channel:', channelId);
            return;
        }

        const channelParticipants = this.participants.get(channelId);
        const normalizedUserId = userId.toString();
        const participant = channelParticipants.get(normalizedUserId);
        
        if (participant) {
            channelParticipants.delete(normalizedUserId);
            console.log('[VOICE-PARTICIPANT] Removed participant:', participant.display_name, 'from channel', channelId);
            
            // Update UI immediately
            this.updateParticipantContainer(channelId);
            this.updateChannelCount(channelId, channelParticipants.size);
        } else {
            console.log('[VOICE-PARTICIPANT] Participant not found for removal:', normalizedUserId, 'in channel', channelId);
        }

        if (channelParticipants.size === 0) {
            this.participants.delete(channelId);
            console.log('[VOICE-PARTICIPANT] Removed empty channel participants for channel:', channelId);
        }
    }

    updateParticipantContainer(channelId) {
        console.log('[VOICE-PARTICIPANT] Updating participant container for channel:', channelId);
        
        const container = document.querySelector(`.voice-participants[data-channel-id="${channelId}"]`);
        if (!container) {
            console.warn('[VOICE-PARTICIPANT] Container not found for channel:', channelId);
            return;
        }

        const channelParticipants = this.participants.get(channelId);
        console.log('[VOICE-PARTICIPANT] Channel participants:', channelParticipants ? channelParticipants.size : 0);
        

        
        if (!channelParticipants || channelParticipants.size === 0) {
            console.log('[VOICE-PARTICIPANT] No participants, hiding container');
            container.classList.add('hidden');
            container.style.display = 'none';
            container.innerHTML = '';
            return;
        }

        console.log('[VOICE-PARTICIPANT] Showing container with', channelParticipants.size, 'participants');
        container.classList.remove('hidden');
        container.style.display = 'block';
        container.style.visibility = 'visible';
        container.innerHTML = '';

        channelParticipants.forEach(participant => {
            const participantEl = this.createParticipantElement(participant);
            container.appendChild(participantEl);
        });
    }

    createParticipantElement(participant) {
        const div = document.createElement('div');
        div.className = 'flex items-center py-1 px-2 text-gray-300 hover:text-white transition-colors duration-200';
        div.setAttribute('data-user-id', participant.id);
        
        // Create a placeholder for the avatar that will be loaded
        const fallbackUrl = '/public/assets/common/default-profile-picture.png';
        
        div.innerHTML = `
            <div class="relative mr-2">
                <img src="${fallbackUrl}" 
                     alt="${participant.display_name}" 
                     class="w-5 h-5 rounded-full bg-gray-600 user-avatar object-cover"
                     onerror="this.src='/public/assets/common/default-profile-picture.png'">
                <div class="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-discord-green rounded-full border border-discord-dark"></div>
            </div>
            <span class="text-sm truncate">${participant.display_name}</span>
        `;

        // Load the real avatar from the API
        this.loadParticipantAvatar(div, participant.id);

        if (window.fallbackImageHandler) {
            const img = div.querySelector('img.user-avatar');
            if (img) {
                window.fallbackImageHandler.processImage(img);
            }
        }

        return div;
    }

    loadParticipantAvatar(participantElement, userId) {
        if (!window.userAPI) {
            console.warn('[VOICE-PARTICIPANT] UserAPI not available for fetching participant avatar');
            return;
        }

        const avatarImg = participantElement.querySelector('img.user-avatar');
        if (!avatarImg) return;

        // Fetch user profile to get real avatar
        window.userAPI.getUserProfile(userId)
            .then(response => {
                if (response.success && response.data && response.data.user) {
                    const user = response.data.user;
                    if (user.avatar_url && user.avatar_url !== '/public/assets/common/default-profile-picture.png') {
                        avatarImg.src = user.avatar_url;
                    }
                }
            })
            .catch(error => {
                console.warn('[VOICE-PARTICIPANT] Failed to fetch user profile for avatar:', error);
                // Keep fallback avatar if API call fails
            });
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
        console.log('[VOICE-PARTICIPANT] Loading existing meetings...');
        
        if (!window.globalSocketManager?.isReady()) {
            console.log('[VOICE-PARTICIPANT] Socket not ready, retrying in 1s...');
            setTimeout(() => this.loadExistingMeetings(), 1000);
            return;
        }

        const voiceChannels = document.querySelectorAll('[data-channel-type="voice"]');
        console.log('[VOICE-PARTICIPANT] Found voice channels:', voiceChannels.length);
        
        voiceChannels.forEach(channel => {
            const channelId = channel.getAttribute('data-channel-id');
            const channelName = channel.getAttribute('data-channel-name');
            console.log('[VOICE-PARTICIPANT] Checking voice meeting for channel:', channelName, 'ID:', channelId);
            
            if (channelId) {
                window.globalSocketManager.io.emit('check-voice-meeting', { channel_id: channelId });
            }
        });
    }

    getParticipants(channelId) {
        return this.participants.get(channelId) || new Map();
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
        console.log('[VOICE-PARTICIPANT] Refreshing all channel participants');
        
        // Refresh current voice channel participants from VideoSDK
        if (window.videoSDKManager?.isReady()) {
            this.syncWithVideoSDK();
        }

        // Update all visible participant containers
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

        console.log('[VOICE-PARTICIPANT] Preserving voice state for channel:', voiceState.channelId);
        
        // Keep the current participants data intact during channel switch
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