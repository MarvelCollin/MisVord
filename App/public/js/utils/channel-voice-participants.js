class ChannelVoiceParticipants {
    constructor() {
        this.participants = new Map();
        this.containers = new Map();
        console.log('[VOICE-PARTICIPANT] VideoSDK-based participant system initialized');
        this.setupEventListeners();
    }

    static getInstance() {
        if (!window._channelVoiceParticipantsInstance) {
            window._channelVoiceParticipantsInstance = new ChannelVoiceParticipants();
        }
        return window._channelVoiceParticipantsInstance;
    }

    setupEventListeners() {
        console.log('[VOICE-PARTICIPANT] Setting up VideoSDK-based event listeners');
        
        // Listen to VideoSDK participant events directly (local source of truth)
        window.addEventListener('videosdkParticipantJoined', (event) => {
            const { participant, participantObj } = event.detail;
            const currentVoiceChannelId = window.voiceManager?.currentChannelId;
            
            if (currentVoiceChannelId && participant) {
                console.log('[VOICE-PARTICIPANT] VideoSDK participant joined, updating channel list:', {
                    participant,
                    channelId: currentVoiceChannelId,
                    name: participantObj?.displayName || participantObj?.name || 'Unknown'
                });
                
                this.addParticipant(
                    currentVoiceChannelId, 
                    participant, 
                    participantObj?.displayName || participantObj?.name || 'Unknown'
                );
                this.updateParticipantContainer(currentVoiceChannelId);
            }
        });

        window.addEventListener('videosdkParticipantLeft', (event) => {
            const { participant } = event.detail;
            const currentVoiceChannelId = window.voiceManager?.currentChannelId;
            
            if (currentVoiceChannelId && participant) {
                console.log('[VOICE-PARTICIPANT] VideoSDK participant left, updating channel list:', {
                    participant,
                    channelId: currentVoiceChannelId
                });
                
                this.removeParticipant(currentVoiceChannelId, participant);
                this.updateParticipantContainer(currentVoiceChannelId);
            }
        });

        // Listen to global socket events for other users' participants
        this.setupGlobalSocketListeners();

        // Also listen to the legacy voiceParticipantUpdate events for backward compatibility
        window.addEventListener('voiceParticipantUpdate', (event) => {
            const { action, channelId, participantId, participantName } = event.detail;
            console.log('[VOICE-PARTICIPANT] Legacy participant update:', { action, channelId, participantId });
            
            if (action === 'join' && channelId && participantId) {
                this.addParticipant(channelId, participantId, participantName);
                this.updateParticipantContainer(channelId);
            } else if (action === 'leave' && channelId && participantId) {
                this.removeParticipant(channelId, participantId);
                this.updateParticipantContainer(channelId);
            }
        });

        // Handle voice disconnection
        window.addEventListener('voiceDisconnect', (event) => {
            console.log('[VOICE-PARTICIPANT] Voice disconnect - clearing all participants');
            this.clearAllParticipants();
        });

        this.setupChannelSwitchListeners();
    }

    setupGlobalSocketListeners() {
        const setupSocket = () => {
            if (!window.globalSocketManager?.isReady()) {
                setTimeout(setupSocket, 500);
                return;
            }

            const socket = window.globalSocketManager.io;
            console.log('[VOICE-PARTICIPANT] Setting up global socket listeners for other users');

            socket.on('voice-meeting-update', (data) => {
                const { channel_id, action, user_id, username, participant_count } = data;
                const currentUserId = window.currentUserId || window.globalSocketManager?.userId;
                
                // Skip our own updates (handled by VideoSDK locally)
                if (user_id === currentUserId || user_id === currentUserId?.toString()) {
                    console.log('[VOICE-PARTICIPANT] Skipping own update from socket:', { user_id, currentUserId });
                    return;
                }

                if (!channel_id || !user_id) return;

                console.log('[VOICE-PARTICIPANT] Global participant update from socket:', {
                    action, channel_id, user_id, username, participant_count
                });

                if (action === 'join' || action === 'already_registered') {
                    this.addParticipant(channel_id, user_id, username || 'Unknown');
                    this.updateParticipantContainer(channel_id);
                } else if (action === 'leave') {
                    this.removeParticipant(channel_id, user_id);
                    this.updateParticipantContainer(channel_id);
                }

                if (participant_count !== undefined) {
                    this.updateChannelCount(channel_id, participant_count);
                }
            });

            socket.on('voice-meeting-status', (data) => {
                const { channel_id, has_meeting, participants } = data;
                
                if (!channel_id) return;

                console.log('[VOICE-PARTICIPANT] Voice meeting status from socket:', {
                    channel_id, has_meeting, participantCount: participants?.length || 0
                });

                if (has_meeting && participants && participants.length > 0) {
                    participants.forEach(participant => {
                        this.addParticipant(channel_id, participant.user_id, participant.username || 'Unknown');
                    });
                    this.updateParticipantContainer(channel_id);
                } else {
                    if (this.participants.has(channel_id)) {
                        const currentUserId = window.currentUserId || window.globalSocketManager?.userId;
                        const channelParticipants = this.participants.get(channel_id);
                        
                        // Keep our own participant if we're in voice, remove others
                        const ownParticipant = channelParticipants.get(currentUserId?.toString());
                        channelParticipants.clear();
                        if (ownParticipant && window.voiceManager?.isConnected) {
                            channelParticipants.set(currentUserId.toString(), ownParticipant);
                        }
                        this.updateParticipantContainer(channel_id);
                    }
                }
            });
        };

        setupSocket();
    }

    setupChannelSwitchListeners() {
        window.addEventListener('preserveVoiceParticipants', (event) => {
            console.log('[VOICE-PARTICIPANT] Preserving participants during channel switch');
        });
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
            const countElement = channelElement.querySelector('.voice-user-count');
            if (countElement) {
                countElement.textContent = count;
            }
            
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

    syncVideoSDKParticipants() {
        console.log('[VOICE-PARTICIPANT] Syncing VideoSDK participants with channel display');
        
        const videoSDK = window.videoSDKManager;
        const currentVoiceChannelId = window.voiceManager?.currentChannelId;
        
        if (!videoSDK?.meeting?.participants || !currentVoiceChannelId) {
            console.log('[VOICE-PARTICIPANT] No VideoSDK meeting or channel ID for sync');
            return;
        }

        // Clear existing participants for this channel first
        if (this.participants.has(currentVoiceChannelId)) {
            this.participants.get(currentVoiceChannelId).clear();
        }

        // Add all current VideoSDK participants
        videoSDK.meeting.participants.forEach((participant, participantId) => {
            const participantName = participant.displayName || participant.name || 'Unknown';
            console.log('[VOICE-PARTICIPANT] Syncing participant:', { participantId, participantName });
            this.addParticipant(currentVoiceChannelId, participantId, participantName);
        });

        // Add local participant if present
        if (videoSDK.meeting.localParticipant) {
            const localParticipant = videoSDK.meeting.localParticipant;
            const localName = localParticipant.displayName || localParticipant.name || 'You';
            console.log('[VOICE-PARTICIPANT] Syncing local participant:', { 
                participantId: localParticipant.id, 
                participantName: localName 
            });
            this.addParticipant(currentVoiceChannelId, localParticipant.id, localName);
        }

        this.updateParticipantContainer(currentVoiceChannelId);
        console.log('[VOICE-PARTICIPANT] VideoSDK participant sync completed');
    }

    clearAllParticipants() {
        console.log('[VOICE-PARTICIPANT] Clearing all participants from all channels');
        this.participants.forEach((participantMap, channelId) => {
            participantMap.clear();
            this.updateParticipantContainer(channelId);
        });
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

    getChannelParticipants(channelId) {
        return this.participants.get(channelId) || new Map();
    }

    getParticipantCount(channelId) {
        const participants = this.getChannelParticipants(channelId);
        return participants.size;
    }

    refreshChannelDisplay(channelId = null) {
        if (channelId) {
            this.updateParticipantContainer(channelId);
        } else {
            this.updateAllParticipantContainers();
        }
    }

    loadAllVoiceChannels() {
        if (!window.globalSocketManager?.isReady()) return;

        console.log('[VOICE-PARTICIPANT] Loading all voice channels from server...');
        document.querySelectorAll('[data-channel-type="voice"]').forEach(channel => {
            const channelId = channel.getAttribute('data-channel-id');
            if (channelId) {
                window.globalSocketManager.io.emit('check-voice-meeting', { channel_id: channelId });
            }
        });
    }

    refreshAllChannelParticipants() {
        console.log('[VOICE-PARTICIPANT] Refreshing all channel participants');
        this.updateAllParticipantContainers();
        this.loadAllVoiceChannels();
        
        // Sync VideoSDK if we're in voice
        if (window.voiceManager?.isConnected) {
            this.syncVideoSDKParticipants();
        }
    }

    refreshAllChannelCounts() {
        console.log('[VOICE-PARTICIPANT] Refreshing all channel counts');
        document.querySelectorAll('[data-channel-type="voice"]').forEach(channel => {
            const channelId = channel.getAttribute('data-channel-id');
            if (channelId) {
                const participantCount = this.getParticipantCount(channelId);
                this.updateChannelCount(channelId, participantCount);
            }
        });
    }
}

// Initialize the global instance immediately
if (typeof window !== 'undefined') {
    window.ChannelVoiceParticipants = ChannelVoiceParticipants;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            ChannelVoiceParticipants.getInstance();
            console.log('[VOICE-PARTICIPANT] Auto-initialized on DOMContentLoaded');
        });
    } else {
        // DOM already loaded
        ChannelVoiceParticipants.getInstance();
        console.log('[VOICE-PARTICIPANT] Auto-initialized immediately');
    }
}

