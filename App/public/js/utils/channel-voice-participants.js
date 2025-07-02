class ChannelVoiceParticipants {
    constructor() {
        this.participants = new Map();
        this.init();
    }

    init() {
        this.setupSocketListeners();
        this.loadExistingMeetings();
        this.attachVoiceEvents();
        console.log('[VOICE-PARTICIPANT] Voice participants manager initialized');
        
        setTimeout(() => {
            this.testVoiceParticipantsDisplay();
        }, 2000);
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

    attachVoiceEvents() {
        window.addEventListener('voiceConnect', (event) => {
            const channelId = event.detail?.channelId;
            if (channelId) {
                console.log('[VOICE-PARTICIPANT] Voice connect event received, adding current user to channel:', channelId);
                setTimeout(() => {
                    this.addCurrentUserToChannel(channelId);
                }, 1000);
            }
        });
    }

    async handleVoiceMeetingUpdate(data) {
        const { channel_id, action, user_id, username, participant_count } = data;
        
        if (!channel_id) return;

        console.log('[VOICE-PARTICIPANT] Processing voice meeting update:', {
            action,
            user_id,
            username,
            current_user_id: window.currentUserId,
            current_username: window.currentUsername
        });

        this.updateChannelCount(channel_id, participant_count || 0);

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
        
        if (channelParticipants.has(userId)) {
            console.log('[VOICE-PARTICIPANT] Participant already exists:', userId);
            return;
        }

        let participantData = {
            id: userId,
            username: username || 'Unknown',
            display_name: username || 'Unknown',
            avatar_url: '/public/assets/common/default-profile-picture.png'
        };

        const isValidUserId = /^\d+$/.test(userId);
        
        if (isValidUserId) {
            try {
                if (window.userAPI) {
                    const userData = await window.userAPI.getUserProfile(userId);
                    if (userData && userData.success && userData.data && userData.data.user) {
                        participantData.display_name = userData.data.user.display_name || userData.data.user.username || participantData.username;
                        participantData.avatar_url = userData.data.user.avatar_url || participantData.avatar_url;
                    }
                } else {
                    await this.waitForUserAPI();
                    if (window.userAPI) {
                        const userData = await window.userAPI.getUserProfile(userId);
                        if (userData && userData.success && userData.data && userData.data.user) {
                            participantData.display_name = userData.data.user.display_name || userData.data.user.username || participantData.username;
                            participantData.avatar_url = userData.data.user.avatar_url || participantData.avatar_url;
                        }
                    } else {
                        const response = await fetch(`/api/users/${userId}/profile`, {
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
        console.log('[VOICE-PARTICIPANT] Using session ID for participant:', userId, 'username:', username);
    }

    channelParticipants.set(userId, participantData);
    console.log('[VOICE-PARTICIPANT] Added participant:', participantData.display_name, 'to channel', channelId);
    }

    removeParticipant(channelId, userId) {
        if (!this.participants.has(channelId)) return;

        const channelParticipants = this.participants.get(channelId);
        const participant = channelParticipants.get(userId);
        
        if (participant) {
            channelParticipants.delete(userId);
            console.log('[VOICE-PARTICIPANT] Removed participant:', participant.display_name, 'from channel', channelId);
        }

        if (channelParticipants.size === 0) {
            this.participants.delete(channelId);
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
        
        div.innerHTML = `
            <div class="relative mr-2">
                <img src="${participant.avatar_url}" 
                     alt="${participant.display_name}" 
                     class="w-5 h-5 rounded-full bg-gray-600 user-avatar">
                <div class="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-discord-green rounded-full border border-discord-dark"></div>
            </div>
            <span class="text-sm truncate">${participant.display_name}</span>
        `;

        if (window.fallbackImageHandler) {
            const img = div.querySelector('img.user-avatar');
            if (img) {
                window.fallbackImageHandler.processImage(img);
            }
        }

        return div;
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
            if (channelParticipants.has(data.user_id)) {
                const participant = channelParticipants.get(data.user_id);
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

    testVoiceParticipantsDisplay() {
        console.log('[VOICE-PARTICIPANT] Testing voice participants display...');
        
        const voiceChannels = document.querySelectorAll('[data-channel-type="voice"]');
        if (voiceChannels.length === 0) {
            console.log('[VOICE-PARTICIPANT] No voice channels found for testing');
            return;
        }
        
        const firstVoiceChannel = voiceChannels[0];
        const channelId = firstVoiceChannel.getAttribute('data-channel-id');
        const channelName = firstVoiceChannel.getAttribute('data-channel-name');
        
        console.log('[VOICE-PARTICIPANT] Testing with channel:', channelName, 'ID:', channelId);
        
        this.addParticipant(channelId, 'test-user-1', 'Test User 1');
        this.addParticipant(channelId, 'test-user-2', 'Test User 2');
        
        if (window.currentUserId && window.currentUsername) {
            console.log('[VOICE-PARTICIPANT] Adding current user to test:', window.currentUserId, window.currentUsername);
            this.addParticipant(channelId, window.currentUserId, window.currentUsername);
        }
        
        this.updateParticipantContainer(channelId);
        
        console.log('[VOICE-PARTICIPANT] Test participants added. Check channel list.');
    }

    static getInstance() {
        if (!window._channelVoiceParticipants) {
            window._channelVoiceParticipants = new ChannelVoiceParticipants();
        }
        return window._channelVoiceParticipants;
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