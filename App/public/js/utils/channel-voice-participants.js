class ChannelVoiceParticipants {
    constructor() {
        this.participants = new Map();
        this.socketListenersAttached = false;
        this.syncInterval = null;
        this.eventQueue = [];
        this.processing = false;
        
        this.init();
    }

    static getInstance() {
        if (!window.channelVoiceParticipantsInstance) {
            window.channelVoiceParticipantsInstance = new ChannelVoiceParticipants();
        }
        return window.channelVoiceParticipantsInstance;
    }

    init() {
        this.setupSocketListeners();
        this.setupChannelSwitchListeners();
        this.startPeriodicSync();
        console.log('[VOICE-PARTICIPANT] Channel voice participants manager initialized (Socket events only)');
    }

    setupSocketListeners() {
        if (this.socketListenersAttached) return;
        
        const waitForSocket = () => {
            if (window.globalSocketManager?.isReady()) {
                this.attachSocketEvents();
                this.socketListenersAttached = true;
            } else {
                setTimeout(waitForSocket, 500);
            }
        };
        waitForSocket();
    }

    attachSocketEvents() {
        const socket = window.globalSocketManager.io;
        
        socket.on('voice-meeting-update', (data) => {
            this.queueEvent('voice-meeting-update', data);
        });

        socket.on('voice-meeting-status', (data) => {
            this.queueEvent('voice-meeting-status', data);
        });

        socket.on('user-presence-update', (data) => {
            if (data.activity_details?.type === 'In Voice Call') {
                this.queueEvent('presence-update', data);
            }
        });
        
        console.log('[VOICE-PARTICIPANT] Socket events attached');
    }

    setupChannelSwitchListeners() {
        window.addEventListener('preserveVoiceParticipants', (event) => {
            console.log('[VOICE-PARTICIPANT] Preserving participants during channel switch');
        });
    }

    startPeriodicSync() {
        if (this.syncInterval) return;
        
        this.syncInterval = setInterval(() => {
            this.loadAllVoiceChannels();
        }, 5000);
    }

    queueEvent(type, data) {
        this.eventQueue.push({ type, data, timestamp: Date.now() });
        this.processEventQueue();
    }

    async processEventQueue() {
        if (this.processing) return;
        this.processing = true;

        while (this.eventQueue.length > 0) {
            const event = this.eventQueue.shift();
            await this.handleEvent(event);
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        this.processing = false;
    }

    async handleEvent(event) {
        const { type, data } = event;

        switch (type) {
            case 'voice-meeting-update':
                await this.handleVoiceMeetingUpdate(data);
                break;
            case 'voice-meeting-status':
                await this.handleVoiceMeetingStatus(data);
                break;
            case 'presence-update':
                await this.handlePresenceUpdate(data);
                break;
        }
    }

    async handleVoiceMeetingUpdate(data) {
        const { channel_id, action, user_id, username, participant_count } = data;
        
        if (!channel_id) return;

        if (participant_count !== undefined) {
            this.updateChannelCount(channel_id, participant_count);
        }

        const isOwnEvent = user_id === window.currentUserId || user_id === window.globalSocketManager?.userId;
        
        if (action === 'join' && user_id) {
            await this.addParticipant(channel_id, user_id, username);
        } else if (action === 'leave' && user_id) {
            this.removeParticipant(channel_id, user_id);
        } else if (action === 'already_registered' && user_id) {
            await this.addParticipant(channel_id, user_id, username);
        }

        this.updateAllParticipantContainers();
    }

    async handleVoiceMeetingStatus(data) {
        const { channel_id, has_meeting, participants } = data;
        
        if (!channel_id) return;

        if (has_meeting && participants && participants.length > 0) {
            for (const participant of participants) {
                await this.addParticipant(channel_id, participant.user_id, participant.username);
            }
            this.updateParticipantContainer(channel_id);
        } else {
            this.clearChannelParticipants(channel_id);
        }
    }

    async handlePresenceUpdate(data) {
        console.log('[VOICE-PARTICIPANT] User presence update for voice call:', data);
    }

    async addParticipant(channelId, userId, username) {
        if (!this.participants.has(channelId)) {
            this.participants.set(channelId, new Map());
        }

        const channelParticipants = this.participants.get(channelId);
        const normalizedUserId = userId.toString();
        
        if (channelParticipants.has(normalizedUserId)) {
            return;
        }

        let participantData = {
            id: normalizedUserId,
            username: username || 'Unknown',
            display_name: username || 'Unknown',
            avatar_url: '/public/assets/common/default-profile-picture.png'
        };

        const isValidUserId = /^\d+$/.test(normalizedUserId);
        
        if (isValidUserId && !participantData.display_name.includes('Unknown')) {
            try {
                if (window.userAPI) {
                    const userData = await window.userAPI.getUserProfile(normalizedUserId);
                    if (userData?.success && userData.data?.user) {
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
                        if (userData.success && userData.data?.user) {
                            participantData.display_name = userData.data.user.display_name || userData.data.user.username || participantData.username;
                            participantData.avatar_url = userData.data.user.avatar_url || participantData.avatar_url;
                        }
                    }
                }
            } catch (error) {
                console.warn('[VOICE-PARTICIPANT] Failed to fetch user profile:', error);
            }
        }

        channelParticipants.set(normalizedUserId, participantData);
        console.log('[VOICE-PARTICIPANT] Added participant:', participantData.display_name, 'to channel', channelId);
    }

    removeParticipant(channelId, userId) {
        if (!this.participants.has(channelId)) return;

        const channelParticipants = this.participants.get(channelId);
        const normalizedUserId = userId.toString();
        const participant = channelParticipants.get(normalizedUserId);
        
        if (participant) {
            channelParticipants.delete(normalizedUserId);
            console.log('[VOICE-PARTICIPANT] Removed participant:', participant.display_name, 'from channel', channelId);
        }

        if (channelParticipants.size === 0) {
            this.participants.delete(channelId);
        }
    }

    clearChannelParticipants(channelId) {
        this.participants.delete(channelId);
        this.updateParticipantContainer(channelId);
        this.updateChannelCount(channelId, 0);
    }

    updateParticipantContainer(channelId) {
        const container = document.querySelector(`.voice-participants[data-channel-id="${channelId}"]`);
        if (!container) return;

        const channelParticipants = this.participants.get(channelId);
        
        if (!channelParticipants || channelParticipants.size === 0) {
            container.classList.add('hidden');
            container.style.display = 'none';
            container.innerHTML = '';
            return;
        }

        container.classList.remove('hidden');
        container.style.display = 'block';
        container.innerHTML = '';

        channelParticipants.forEach(participant => {
            const participantEl = this.createParticipantElement(participant);
            container.appendChild(participantEl);
        });

        this.updateChannelCount(channelId, channelParticipants.size);
    }

    updateAllParticipantContainers() {
        this.participants.forEach((participants, channelId) => {
            this.updateParticipantContainer(channelId);
        });
        
        document.querySelectorAll('.voice-participants').forEach(container => {
            const channelId = container.getAttribute('data-channel-id');
            if (channelId && !this.participants.has(channelId)) {
                container.classList.add('hidden');
                container.style.display = 'none';
                container.innerHTML = '';
                this.updateChannelCount(channelId, 0);
            }
        });
    }

    createParticipantElement(participant) {
        const element = document.createElement('div');
        element.className = 'flex items-center p-1 hover:bg-discord-lighter/20 rounded cursor-pointer transition-colors';
        element.dataset.userId = participant.id;

        const avatarUrl = participant.avatar_url || '/public/assets/common/default-profile-picture.png';
        const isCurrentUser = participant.id === window.currentUserId?.toString();

        element.innerHTML = `
            <div class="relative mr-2">
                <div class="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden user-avatar">
                    <img src="${avatarUrl}" alt="Avatar" class="w-full h-full object-cover" 
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center; color: white; font-size: 8px; font-weight: 600;">
                        ${participant.display_name.charAt(0).toUpperCase()}
                    </div>
                </div>
                <div class="absolute bottom-0 right-0 w-2 h-2 bg-discord-green rounded-full border border-discord-dark"></div>
            </div>
            <span class="text-sm text-white truncate user-profile-trigger" data-user-id="${participant.id}">
                ${participant.display_name}${isCurrentUser ? ' (You)' : ''}
            </span>
        `;

        return element;
    }

    updateChannelCount(channelId, count) {
        const channelElement = document.querySelector(`[data-channel-id="${channelId}"]`);
        if (channelElement) {
            const container = channelElement.querySelector('.voice-participants');
            if (container) {
                if (count > 0) {
                    container.classList.remove('hidden');
                    container.style.display = 'block';
                } else {
                    container.classList.add('hidden');
                    container.style.display = 'none';
                }
            }
        }
    }

    loadAllVoiceChannels() {
        if (!window.globalSocketManager?.isReady()) return;

        document.querySelectorAll('[data-channel-type="voice"]').forEach(channel => {
            const channelId = channel.getAttribute('data-channel-id');
            if (channelId) {
                window.globalSocketManager.io.emit('check-voice-meeting', { channel_id: channelId });
            }
        });
    }

    refreshAllChannelParticipants() {
        this.updateAllParticipantContainers();
        this.loadAllVoiceChannels();
    }

    getChannelParticipants(channelId) {
        return this.participants.get(channelId) || new Map();
    }

    getParticipantCount(channelId) {
        const participants = this.getChannelParticipants(channelId);
        return participants.size;
    }
}

if (!window.ChannelVoiceParticipants) {
    window.ChannelVoiceParticipants = ChannelVoiceParticipants;
    
    document.addEventListener('DOMContentLoaded', () => {
        ChannelVoiceParticipants.getInstance();
    });
    
    if (document.readyState !== 'loading') {
        ChannelVoiceParticipants.getInstance();
    }
}

