class ChannelVoiceParticipants {
    constructor() {
        this.presenceBasedParticipants = new Map();
        this.socketListenersAttached = false;
        this.updateInterval = null;
        
        this.init();
    }

    static getInstance() {
        if (!window.channelVoiceParticipantsInstance) {
            window.channelVoiceParticipantsInstance = new ChannelVoiceParticipants();
        }
        return window.channelVoiceParticipantsInstance;
    }

    init() {
        this.setupPresenceListeners();
        this.startPresenceSync();
        console.log('[VOICE-PARTICIPANT] Presence-based voice participants manager initialized');
    }

    setupPresenceListeners() {
        if (this.socketListenersAttached) return;
        
        const waitForSocket = () => {
            if (window.globalSocketManager?.isReady()) {
                this.attachPresenceEvents();
                this.socketListenersAttached = true;
            } else {
                setTimeout(waitForSocket, 500);
            }
        };
        waitForSocket();
    }

    attachPresenceEvents() {
        const socket = window.globalSocketManager.io;
        
        socket.on('user-presence-update', (data) => {
            if (data.activity_details?.type === 'In Voice Call') {
                this.handleVoicePresenceUpdate(data);
            }
        });
        
        console.log('[VOICE-PARTICIPANT] Presence events attached');
    }

    startPresenceSync() {
        if (this.updateInterval) return;
        
        this.updateInterval = setInterval(() => {
            this.syncWithFriendsManager();
            this.updateAllChannelDisplays();
        }, 2000);
    }

    handleVoicePresenceUpdate(data) {
        console.log('[VOICE-PARTICIPANT] Voice presence update:', data);
        
        const userId = data.user_id;
        const channelId = data.activity_details?.channel_id;
        const channelName = data.activity_details?.channel;
        const username = data.username;
        
        if (userId && channelId) {
            this.addPresenceParticipant(channelId, userId, username, channelName);
        }
        
        this.updateChannelDisplay(channelId);
    }

    syncWithFriendsManager() {
        if (!window.FriendsManager) return;
        
        const friendsManager = window.FriendsManager.getInstance();
        const onlineUsers = friendsManager.cache.onlineUsers || {};
        
        this.presenceBasedParticipants.clear();
        
        Object.values(onlineUsers).forEach(userData => {
            if (userData.activity_details?.type === 'In Voice Call') {
                const channelId = userData.activity_details.channel_id;
                const userId = userData.user_id;
                const username = userData.username;
                const channelName = userData.activity_details.channel;
                
                if (channelId && userId) {
                    this.addPresenceParticipant(channelId, userId, username, channelName);
                }
            }
        });
    }

    addPresenceParticipant(channelId, userId, username, channelName) {
        if (!this.presenceBasedParticipants.has(channelId)) {
            this.presenceBasedParticipants.set(channelId, new Map());
        }
        
        const channelParticipants = this.presenceBasedParticipants.get(channelId);
        channelParticipants.set(userId, {
            id: userId,
            username: username || 'Unknown',
            channel_name: channelName,
            joined_at: Date.now()
        });
    }

    updateAllChannelDisplays() {
        this.presenceBasedParticipants.forEach((participants, channelId) => {
            this.updateChannelDisplay(channelId);
        });
        
        document.querySelectorAll('.voice-participants').forEach(container => {
            const channelId = container.getAttribute('data-channel-id');
            if (!this.presenceBasedParticipants.has(channelId)) {
                this.clearChannelDisplay(channelId);
            }
        });
    }

    updateChannelDisplay(channelId) {
        const container = document.querySelector(`.voice-participants[data-channel-id="${channelId}"]`);
        if (!container) return;
        
        const participants = this.presenceBasedParticipants.get(channelId);
        
        if (!participants || participants.size === 0) {
            this.clearChannelDisplay(channelId);
            return;
        }
        
        container.classList.remove('hidden');
        container.style.display = 'flex';
        container.innerHTML = '';
        
        participants.forEach(participant => {
            const participantEl = this.createParticipantElement(participant);
            container.appendChild(participantEl);
        });
        
        this.updateChannelCount(channelId, participants.size);
    }

    clearChannelDisplay(channelId) {
        const container = document.querySelector(`.voice-participants[data-channel-id="${channelId}"]`);
        if (!container) return;
        
        container.classList.add('hidden');
        container.style.display = 'none';
        container.innerHTML = '';
        
        this.updateChannelCount(channelId, 0);
    }

    createParticipantElement(participant) {
        const element = document.createElement('div');
        element.className = 'relative group cursor-pointer';
        element.title = `${participant.username} - In Voice`;
        
        element.innerHTML = `
            <div class="w-7 h-7 rounded-full bg-discord-green border-2 border-discord-dark flex items-center justify-center text-white text-xs font-bold relative overflow-hidden">
                <img src="/public/assets/common/default-profile-picture.png" 
                     alt="${participant.username}" 
                     class="w-full h-full object-cover">
                <div class="absolute bottom-0 right-0 w-2 h-2 bg-green-400 rounded-full border border-discord-dark"></div>
            </div>
        `;
        
        return element;
    }

    updateChannelCount(channelId, count) {
        const channelElement = document.querySelector(`[data-channel-id="${channelId}"]`);
        if (!channelElement) return;
        
        const countElement = channelElement.querySelector('.voice-participant-count');
        if (countElement) {
            if (count > 0) {
                countElement.textContent = count;
                countElement.style.display = 'inline';
            } else {
                countElement.style.display = 'none';
            }
        }
    }

    getChannelParticipants(channelId) {
        return this.presenceBasedParticipants.get(channelId) || new Map();
    }

    getParticipantCount(channelId) {
        const participants = this.presenceBasedParticipants.get(channelId);
        return participants ? participants.size : 0;
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

