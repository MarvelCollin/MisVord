class ChannelVoiceParticipants {
    constructor() {
        this.participants = new Map();
        console.log('[VOICE-PARTICIPANT] Presence-based participant system initialized');
        this.setupEventListeners();
    }

    static getInstance() {
        if (!window._channelVoiceParticipantsInstance) {
            window._channelVoiceParticipantsInstance = new ChannelVoiceParticipants();
        }
        return window._channelVoiceParticipantsInstance;
    }

    setupEventListeners() {
        console.log('[VOICE-PARTICIPANT] Setting up presence-based event listeners');
        
        const setupFriendsManagerListeners = () => {
            if (!window.FriendsManager) {
                setTimeout(setupFriendsManagerListeners, 500);
                return;
            }

            const friendsManager = window.FriendsManager.getInstance();
            
            friendsManager.subscribe((type, data) => {
                console.log('[VOICE-PARTICIPANT] FriendsManager event:', type, data);
                
                switch (type) {
                    case 'user-online':
                    case 'user-offline':
                    case 'user-presence-update':
                    case 'online-users-updated':
                        this.updateAllChannelsFromPresence();
                        break;
                }
            });

            this.updateAllChannelsFromPresence();
        };

        setupFriendsManagerListeners();

        window.addEventListener('ownPresenceUpdate', (event) => {
            if (window.DEBUG_VOICE_PARTICIPANTS) {
                console.log('[VOICE-PARTICIPANT] Own presence update:', event.detail);
            }
            // Debounce rapid presence updates to prevent blinking
            if (this._updateTimeout) {
                clearTimeout(this._updateTimeout);
            }
            this._updateTimeout = setTimeout(() => {
                this.updateAllChannelsFromPresence();
                this._updateTimeout = null;
            }, 150);
        });

        // Removed periodic refresh - presence updates are immediate
        // setInterval(() => {
        //     this.updateAllChannelsFromPresence();
        // }, 10000);
    }

    updateAllChannelsFromPresence() {
        if (!window.FriendsManager) {
            console.log('[VOICE-PARTICIPANT] FriendsManager not available');
            return;
        }

        const friendsManager = window.FriendsManager.getInstance();
        const onlineUsers = friendsManager.cache.onlineUsers || {};
        const currentUserId = window.currentUserId || window.globalSocketManager?.userId;
        const currentUserActivityDetails = window.globalSocketManager?.currentActivityDetails;
        
        // Debug only when enabled
        if (window.DEBUG_VOICE_PARTICIPANTS) {
            console.log('[VOICE-PARTICIPANT] DEBUG: Checking online users for voice activity:', {
                totalOnlineUsers: Object.keys(onlineUsers).length,
                onlineUserIds: Object.keys(onlineUsers),
                currentUserId: currentUserId,
                currentUserActivity: currentUserActivityDetails?.type
            });
        }

        this.participants.clear();

        // First, check if current user is in voice (even if not in FriendsManager cache)
        if (currentUserId && currentUserActivityDetails && 
            currentUserActivityDetails.type && 
            currentUserActivityDetails.type.startsWith('In Voice - ') &&
            currentUserActivityDetails.channel_id) {
            
            const channelId = currentUserActivityDetails.channel_id;
            const username = window.globalSocketManager?.username || 'You';
            
            if (window.DEBUG_VOICE_PARTICIPANTS) {
                console.log('[VOICE-PARTICIPANT] Found current user in voice:', {
                    userId: currentUserId,
                    username: username,
                    channelId: channelId,
                    activity: currentUserActivityDetails.type
                });
            }

            this.addParticipant(channelId, currentUserId, username);
        }

        // Then check all other users from FriendsManager cache
        Object.values(onlineUsers).forEach(userData => {
            // Skip current user if already processed above
            if (userData.user_id === currentUserId) {
                console.log('[VOICE-PARTICIPANT] DEBUG: Skipping current user (already processed):', userData.user_id);
                return;
            }

            if (window.DEBUG_VOICE_PARTICIPANTS) {
                console.log('[VOICE-PARTICIPANT] DEBUG: Checking user:', {
                    userId: userData.user_id,
                    username: userData.username,
                    status: userData.status,
                    hasActivityDetails: !!userData.activity_details,
                    activityType: userData.activity_details?.type,
                    channelId: userData.activity_details?.channel_id
                });
            }

            if (userData.activity_details && 
                userData.activity_details.type && 
                userData.activity_details.type.startsWith('In Voice - ') &&
                userData.activity_details.channel_id) {
                
                const channelId = userData.activity_details.channel_id;
                const userId = userData.user_id;
                const username = userData.username;
                
                if (window.DEBUG_VOICE_PARTICIPANTS) {
                    console.log('[VOICE-PARTICIPANT] Found user in voice:', {
                        userId,
                        username, 
                        channelId,
                        activity: userData.activity_details.type
                    });
                }

                this.addParticipant(channelId, userId, username, userData);
            }
        });

        this.updateAllChannelContainers();
        
        if (window.DEBUG_VOICE_PARTICIPANTS) {
            console.log('[VOICE-PARTICIPANT] DEBUG: Update complete:', {
                totalChannelsWithParticipants: this.participants.size,
                channelParticipantCounts: Array.from(this.participants.entries()).map(([channelId, participants]) => ({
                    channelId,
                    count: participants.size
                }))
            });
        }
    }

    async addParticipant(channelId, userId, username, userData = null) {
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
        
        if (isValidUserId) {
            try {
                if (window.userAPI) {
                    const userProfile = await window.userAPI.getUserProfile(normalizedUserId);
                    if (userProfile?.success && userProfile.data?.user) {
                        participantData.display_name = userProfile.data.user.display_name || userProfile.data.user.username || participantData.username;
                        participantData.avatar_url = userProfile.data.user.avatar_url || participantData.avatar_url;
                    }
                } else {
                    const response = await fetch(`/api/users/${normalizedUserId}/profile`, {
                        method: 'GET',
                        credentials: 'same-origin'
                    });
                    
                    if (response.ok) {
                        const userProfile = await response.json();
                        if (userProfile.success && userProfile.data?.user) {
                            participantData.display_name = userProfile.data.user.display_name || userProfile.data.user.username || participantData.username;
                            participantData.avatar_url = userProfile.data.user.avatar_url || participantData.avatar_url;
                        }
                    }
                }
            } catch (error) {
                console.warn('[VOICE-PARTICIPANT] Failed to fetch user profile:', error);
            }
        }

        channelParticipants.set(normalizedUserId, participantData);
        if (window.DEBUG_VOICE_PARTICIPANTS) {
            console.log('[VOICE-PARTICIPANT] Added participant:', participantData.display_name, 'to channel', channelId);
        }
    }

    updateAllChannelContainers() {
        document.querySelectorAll('.voice-participants').forEach(container => {
            const channelId = container.getAttribute('data-channel-id');
            if (channelId) {
                this.updateParticipantContainer(channelId, 0);
            }
        });
    }

    updateParticipantContainer(channelId, retryCount = 0) {
        const container = document.querySelector(`.voice-participants[data-channel-id="${channelId}"]`);
        if (!container) {
            if (retryCount < 5) {
                if (window.DEBUG_VOICE_PARTICIPANTS) {
                    console.warn(`[VOICE-PARTICIPANT] Container not found for channel ${channelId}. Retrying (${retryCount + 1})...`);
                }
                // Retry after a short delay in case DOM isn't ready yet
                setTimeout(() => this.updateParticipantContainer(channelId, retryCount + 1), 300 * (retryCount + 1));
            } else {
                if (window.DEBUG_VOICE_PARTICIPANTS) {
                    console.error(`[VOICE-PARTICIPANT] Failed to find container for channel ${channelId} after multiple retries.`);
                }
            }
            return;
        }

        const channelParticipants = this.participants.get(channelId);
        
        if (!channelParticipants || channelParticipants.size === 0) {
            container.classList.add('hidden');
            container.style.display = 'none';
            container.innerHTML = '';
            this.updateChannelCount(channelId, 0);
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
            this.updateAllChannelsFromPresence();
        }
    }

    refreshAllChannelParticipants() {
        console.log('[VOICE-PARTICIPANT] Refreshing all channel participants from presence');
        this.updateAllChannelsFromPresence();
    }

    debugVoiceParticipantFlow() {
        console.log('=== VOICE PARTICIPANT DEBUG ===');
        
        const friendsManager = window.FriendsManager?.getInstance();
        const globalSocket = window.globalSocketManager;
        const currentUserId = globalSocket?.userId;
        
        console.log('1. System Status:', {
            hasFriendsManager: !!friendsManager,
            hasGlobalSocket: !!globalSocket,
            socketReady: globalSocket?.isReady(),
            currentUserId: currentUserId
        });
        
        if (friendsManager) {
            const onlineUsers = friendsManager.cache.onlineUsers || {};
            console.log('2. FriendsManager Cache:', {
                totalOnlineUsers: Object.keys(onlineUsers).length,
                onlineUsers: onlineUsers
            });
            
            const voiceUsers = Object.values(onlineUsers).filter(user => 
                user.activity_details?.type?.startsWith('In Voice - ')
            );
            console.log('3. Users in Voice:', voiceUsers);
        }
        
        console.log('4. Current Participants by Channel:', {
            totalChannels: this.participants.size,
            participants: Array.from(this.participants.entries()).map(([channelId, participants]) => ({
                channelId,
                count: participants.size,
                users: Array.from(participants.values())
            }))
        });
        
        console.log('5. DOM Elements:', {
            voiceChannelElements: document.querySelectorAll('[data-channel-type="voice"]').length,
            participantContainers: document.querySelectorAll('.voice-participants').length,
            visibleContainers: document.querySelectorAll('.voice-participants:not(.hidden)').length
        });
        
        if (globalSocket?.currentActivityDetails) {
            console.log('6. Current User Activity:', globalSocket.currentActivityDetails);
        }
        
        console.log('=== END DEBUG ===');
    }

    testPresenceUpdate() {
        console.log('=== TESTING PRESENCE UPDATE ===');
        
        if (!window.globalSocketManager?.isReady()) {
            console.error('Socket not ready');
            return;
        }
        
        const testChannelId = document.querySelector('[data-channel-type="voice"]')?.getAttribute('data-channel-id');
        if (!testChannelId) {
            console.error('No voice channel found');
            return;
        }
        
        console.log('Updating presence to voice...');
        window.globalSocketManager.updatePresence('online', {
            type: 'In Voice - Test Channel',
            channel_id: testChannelId,
            server_id: document.querySelector('meta[name="server-id"]')?.content,
            channel_name: 'Test Channel'
        });
        
        setTimeout(() => {
            console.log('Checking if presence update worked...');
            this.debugVoiceParticipantFlow();
            
            setTimeout(() => {
                console.log('Resetting presence...');
                window.globalSocketManager.updatePresence('online', { type: 'idle' });
            }, 3000);
        }, 1000);
    }
}

if (typeof window !== 'undefined') {
    window.ChannelVoiceParticipants = ChannelVoiceParticipants;
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            const instance = ChannelVoiceParticipants.getInstance();
            console.log('[VOICE-PARTICIPANT] Auto-initialized on DOMContentLoaded');
            
            window.debugVoiceParticipants = () => instance.debugVoiceParticipantFlow();
            window.testVoicePresence = () => instance.testPresenceUpdate();
        });
    } else {
        const instance = ChannelVoiceParticipants.getInstance();
        console.log('[VOICE-PARTICIPANT] Auto-initialized immediately');
        
        window.debugVoiceParticipants = () => instance.debugVoiceParticipantFlow();
        window.testVoicePresence = () => instance.testPresenceUpdate();
        window.enableVoiceDebug = () => { window.DEBUG_VOICE_PARTICIPANTS = true; console.log('Voice participant debug enabled'); };
        window.disableVoiceDebug = () => { window.DEBUG_VOICE_PARTICIPANTS = false; console.log('Voice participant debug disabled'); };
    }
}

