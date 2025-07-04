class GlobalPresenceManager {
    constructor() {
        this.friendsManager = null;
        this.isInitialized = false;
        this.activePagesWithActiveNow = ['home', 'server', 'admin', 'nitro', 'accept-invite'];
        this.currentPage = this.detectCurrentPage();
        this.lastRenderedState = null;
        

    }

    detectCurrentPage() {
        const path = window.location.pathname;
        
        if (path === '/home' || path.startsWith('/home/')) return 'home';
        if (path.startsWith('/server/')) return 'server';
        if (path === '/explore-servers') return 'explore';
        if (path === '/admin') return 'admin';
        if (path === '/nitro') return 'nitro';
        if (path.startsWith('/join/')) return 'accept-invite';
        if (path.startsWith('/settings/')) return 'settings';
        
        return 'other';
    }

    shouldShowActiveNow() {
        return this.activePagesWithActiveNow.includes(this.currentPage);
    }

    async initialize() {
        if (this.isInitialized) return;
        

        
        await this.waitForDependencies();
        await this.initializeFriendsManager();
        await this.setupActiveNowSection();
        this.setupVideoSDKPresenceSync();
        
        this.isInitialized = true;

    }

    setupVideoSDKPresenceSync() {

        
        window.addEventListener('voiceConnect', (event) => {

            this.updateActiveNow();
        });
        
        window.addEventListener('voiceDisconnect', (event) => {

            this.handleVoiceDisconnect();
        });
        
        window.addEventListener('presenceForceReset', (event) => {

            this.handlePresenceForceReset(event.detail);
        });
        
        setInterval(() => {
            this.validatePresenceWithVideoSDK();
        }, 5000);
    }

    validatePresenceWithVideoSDK() {
        if (!window.videoSDKManager) return;
        
        const isVideoSDKConnected = window.videoSDKManager.isConnected && 
                                   window.videoSDKManager.isMeetingJoined && 
                                   window.videoSDKManager.meeting;
        
        const currentActivity = window.globalSocketManager?.currentActivityDetails?.type || '';
        const isPresenceInVoice = currentActivity.startsWith('In Voice');
        
        if (!isVideoSDKConnected && isPresenceInVoice) {

            this.forcePresenceToActive();
        }
    }

    handleVoiceDisconnect() {

        this.forcePresenceToActive();
        this.updateActiveNow();
    }

    handlePresenceForceReset(detail) {

        this.forcePresenceToActive();
        this.updateActiveNow();
    }

    forcePresenceToActive() {
        if (window.globalSocketManager) {
            window.globalSocketManager.updatePresence('online', { type: 'active' }, 'global-presence-force-reset');

        }
    }

    async waitForDependencies() {

        
        const maxWait = 10000;
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWait) {
            if (window.FriendsManager && window.globalSocketManager) {

                return;
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.warn('⚠️ [GLOBAL-PRESENCE] Timeout waiting for dependencies');
    }

    async initializeFriendsManager() {
        if (!window.FriendsManager) {
            console.error('❌ [GLOBAL-PRESENCE] FriendsManager not available');
            return;
        }
        

        
        this.friendsManager = window.FriendsManager.getInstance();
        
        if (window.globalSocketManager && window.globalSocketManager.isReady()) {

            await this.friendsManager.getOnlineUsers(true);
        } else {

            
            window.addEventListener('globalSocketReady', async () => {

                await this.friendsManager.getOnlineUsers(true);
            });
        }
    }

    async setupActiveNowSection() {
        if (!this.shouldShowActiveNow()) {

            return;
        }
        

        
        await this.createActiveNowSection();
        this.setupActiveNowLogic();
    }

    async createActiveNowSection() {
        let targetContainer = this.findActiveNowContainer();
        
        if (!targetContainer) {
            targetContainer = this.createActiveNowContainer();
        }
        
        if (!targetContainer) {
            console.warn('⚠️ [GLOBAL-PRESENCE] Could not create Active Now container');
            return;
        }
        
        const activeNowHTML = await this.generateActiveNowHTML();
        targetContainer.innerHTML = activeNowHTML;
        

    }

    findActiveNowContainer() {
        return document.querySelector('.active-now-section') || 
               document.querySelector('#active-now-section') ||
               document.querySelector('[data-component="active-now"]');
    }

    createActiveNowContainer() {
        const mainLayout = document.querySelector('.flex.h-screen') || 
                          document.querySelector('.app-layout') ||
                          document.querySelector('body > div:first-child');
        
        if (!mainLayout) return null;
        
        const container = document.createElement('div');
        container.className = 'w-60 bg-discord-dark border-l border-gray-800 flex flex-col h-full max-h-screen active-now-section';
        container.id = 'global-active-now-section';
        
        mainLayout.appendChild(container);
        return container;
    }

    async generateActiveNowHTML() {
        try {
            const friends = await this.friendsManager.getFriends();
            
            return `
                <div class="h-12 border-b border-gray-800 flex items-center px-4">
                    <h2 class="font-semibold text-white">Active Now</h2>
                </div>
                <div class="flex-1 overflow-y-auto p-4" id="global-active-now-container">
                    <div id="global-voice-participants-section" class="mb-6"></div>
                    <div class="rounded-lg bg-discord-background p-6 text-center" id="global-no-active-friends">
                        <h3 class="font-semibold text-white mb-2 text-lg">It's quiet for now...</h3>
                        <p class="text-gray-400 text-sm">When friends start an activity, like playing a game or hanging out on voice, we'll show it here!</p>
                    </div>
                    <div id="global-active-friends-list" class="hidden"></div>
                </div>
            `;
        } catch (error) {
            console.error('❌ [GLOBAL-PRESENCE] Error generating Active Now HTML:', error);
            return '<div class="p-4 text-gray-400">Error loading Active Now</div>';
        }
    }

    setupActiveNowLogic() {
        if (!this.friendsManager) return;
        

        
        this.friendsManager.subscribe((type, data) => {

            
            switch (type) {
                case 'user-online':
                case 'user-offline':
                case 'user-presence-update':
                case 'online-users-updated':
                    this.updateActiveNow();
                    break;
            }
        });
        
        this.updateActiveNow();
    }

    async updateActiveNow() {
        const container = document.getElementById('global-active-friends-list');
        const emptyState = document.getElementById('global-no-active-friends');
        const voiceSection = document.getElementById('global-voice-participants-section');
        
        if (!container || !emptyState || !voiceSection) return;
        
        try {
            const friends = await this.friendsManager.getFriends();
            const onlineUsers = this.friendsManager.cache.onlineUsers || {};
            
            const activeFriends = friends.filter(friend => {
                const userData = onlineUsers[friend.id];
                return userData && (userData.status === 'online' || userData.status === 'afk');
            });
            
            const voiceParticipants = this.extractVoiceParticipants(friends, onlineUsers);
            this.updateVoiceParticipants(voiceSection, voiceParticipants);
            
            const newState = this.createFriendStateSignature(activeFriends, onlineUsers, voiceParticipants);
            
            if (this.statesAreEqual(this.lastRenderedState, newState)) {
                return;
            }
            
            if (activeFriends.length > 0) {
                this.smartRenderActiveFriends(container, activeFriends, onlineUsers);
                container.classList.remove('hidden');
                emptyState.classList.add('hidden');
            } else {
                container.classList.add('hidden');
                emptyState.classList.remove('hidden');
            }
            
            this.lastRenderedState = newState;
            
            this.notifyVoiceParticipantSystemUpdate(voiceParticipants);
        } catch (error) {
            console.error('❌ [GLOBAL-PRESENCE] Error updating Active Now:', error);
        }
    }

    notifyVoiceParticipantSystemUpdate(voiceParticipants) {
        if (window.ChannelVoiceParticipants) {
            const instance = window.ChannelVoiceParticipants.getInstance();
            if (instance && typeof instance.updateAllChannelsFromPresence === 'function') {
                setTimeout(() => {
                    instance.updateAllChannelsFromPresence();
                }, 100);
            }
        }
        
        window.dispatchEvent(new CustomEvent('voiceParticipantUpdate', {
            detail: { voiceParticipants }
        }));
    }

    extractVoiceParticipants(friends, onlineUsers) {
        const voiceChannels = {};
        
        friends.forEach(friend => {
            const userData = onlineUsers[friend.id];
            if (!userData || !userData.activity_details) return;
            
            const activity = userData.activity_details;
            if (activity.type && activity.type.startsWith('In Voice - ')) {
                const channelId = activity.channel_id;
                const channelName = activity.channel_name || activity.type.replace('In Voice - ', '');
                
                if (!voiceChannels[channelId]) {
                    voiceChannels[channelId] = {
                        channelName: channelName,
                        participants: []
                    };
                }
                
                voiceChannels[channelId].participants.push({
                    ...friend,
                    status: userData.status,
                    activity: activity
                });
            }
        });

        this.extractFromParticipantSection(voiceChannels, onlineUsers);
        
        return voiceChannels;
    }

    extractFromParticipantSection(voiceChannels, onlineUsers) {
        const participantElements = document.querySelectorAll('.user-presence-text[data-user-id]');
        
        participantElements.forEach(el => {
            const userId = el.getAttribute('data-user-id');
            const presenceText = el.textContent.trim();
            
            if (presenceText.startsWith('In Voice - ')) {
                const channelName = presenceText.replace('In Voice - ', '');
                const channelId = `voice_${channelName.toLowerCase().replace(/\s+/g, '_')}`;
                
                const userElement = el.closest('.user-profile-trigger');
                if (!userElement) return;
                
                const usernameEl = userElement.querySelector('.member-username');
                const avatarEl = userElement.querySelector('img');
                const statusEl = userElement.querySelector('.status-indicator');
                
                if (!usernameEl) return;
                
                const username = usernameEl.textContent.trim();
                const avatarUrl = avatarEl ? avatarEl.src : '';
                const status = userElement.getAttribute('data-status') || 'online';
                
                if (!voiceChannels[channelId]) {
                    voiceChannels[channelId] = {
                        channelName: channelName,
                        participants: []
                    };
                }
                
                const existingParticipant = voiceChannels[channelId].participants.find(p => p.id === userId);
                if (!existingParticipant) {
                    voiceChannels[channelId].participants.push({
                        id: userId,
                        username: username,
                        avatar_url: avatarUrl,
                        status: status,
                        activity: {
                            type: presenceText,
                            channel_id: channelId,
                            channel_name: channelName
                        }
                    });
                }
            }
        });
    }

    updateVoiceParticipants(voiceSection, voiceChannels) {
        const channelIds = Object.keys(voiceChannels);
        
        if (channelIds.length === 0) {
            voiceSection.innerHTML = '';
            return;
        }
        
        let html = '<div class="mb-4"><h3 class="text-sm font-semibold text-gray-400 uppercase mb-3">Voice Channels</h3>';
        
        channelIds.forEach(channelId => {
            const channel = voiceChannels[channelId];
            const participantCount = channel.participants.length;
            
            html += `
                <div class="mb-3 bg-discord-background rounded-lg p-3">
                    <div class="flex items-center mb-2">
                        <i class="fas fa-volume-up text-gray-400 mr-2"></i>
                        <span class="text-sm font-medium text-white">${channel.channelName}</span>
                        <span class="ml-auto text-xs text-gray-500">${participantCount}</span>
                    </div>
                    <div class="space-y-1">
            `;
            
            channel.participants.forEach(participant => {
                const statusColor = this.getStatusClass(participant.status);
                
                html += `
                    <div class="flex items-center p-2 rounded hover:bg-discord-darker cursor-pointer">
                        <div class="relative mr-3">
                            <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                <img src="${participant.avatar_url || ''}" 
                                     alt="${participant.username}" 
                                     class="w-full h-full object-cover user-avatar">
                            </div>
                            <div class="absolute bottom-0 right-0 w-3 h-3 rounded-full ${statusColor} border-2 border-discord-dark"></div>
                        </div>
                        <div class="flex-1">
                            <div class="font-medium text-white text-sm">${participant.username}</div>
                            <div class="text-xs text-gray-400 flex items-center">
                                <i class="fas fa-microphone mr-1"></i>
                                ${participant.activity.type}
                            </div>
                        </div>
                    </div>
                `;
            });
            
            html += '</div></div>';
        });
        
        html += '</div>';
        voiceSection.innerHTML = html;
        
        if (window.fallbackImageHandler) {
            const images = voiceSection.querySelectorAll('img.user-avatar');
            images.forEach(img => {
                window.fallbackImageHandler.processImage(img);
            });
        }
    }

    createFriendStateSignature(activeFriends, onlineUsers, voiceParticipants = {}) {
        const friendsState = activeFriends.map(friend => {
            const userData = onlineUsers[friend.id];
            return {
                id: friend.id,
                username: friend.username,
                avatar_url: friend.avatar_url,
                status: userData?.status || 'offline',
                activity_type: userData?.activity_details?.type || 'idle',
                channel_id: userData?.activity_details?.channel_id || null,
                server_id: userData?.activity_details?.server_id || null,
                channel_name: userData?.activity_details?.channel_name || null
            };
        }).sort((a, b) => a.username.localeCompare(b.username));

        const voiceState = Object.keys(voiceParticipants).map(channelId => ({
            channelId: channelId,
            channelName: voiceParticipants[channelId].channelName,
            participantCount: voiceParticipants[channelId].participants.length,
            participants: voiceParticipants[channelId].participants.map(p => p.id).sort()
        })).sort((a, b) => a.channelId.localeCompare(b.channelId));

        return {
            friends: friendsState,
            voice: voiceState
        };
    }
    
    statesAreEqual(state1, state2) {
        if (!state1 || !state2) return false;
        
        if (state1.friends.length !== state2.friends.length) return false;
        if (state1.voice.length !== state2.voice.length) return false;
        
        const friendsEqual = state1.friends.every((friend1, index) => {
            const friend2 = state2.friends[index];
            return friend1.id === friend2.id &&
                   friend1.username === friend2.username &&
                   friend1.status === friend2.status &&
                   friend1.activity_type === friend2.activity_type &&
                   friend1.channel_id === friend2.channel_id &&
                   friend1.server_id === friend2.server_id &&
                   friend1.channel_name === friend2.channel_name;
        });

        const voiceEqual = state1.voice.every((voice1, index) => {
            const voice2 = state2.voice[index];
            return voice1.channelId === voice2.channelId &&
                   voice1.channelName === voice2.channelName &&
                   voice1.participantCount === voice2.participantCount &&
                   JSON.stringify(voice1.participants) === JSON.stringify(voice2.participants);
        });

        return friendsEqual && voiceEqual;
    }
    
    updateExistingFriend(friendEl, friend, userData) {
        const status = userData?.status || 'offline';
        const statusClass = this.getStatusClass(status);
        const activityDetails = userData?.activity_details;
        const activityText = this.getActivityText(activityDetails);
        const activityIcon = this.getActivityIcon(activityDetails);
        
        const currentStatus = friendEl.getAttribute('data-status');
        if (currentStatus !== status) {
            const statusIndicator = friendEl.querySelector('.w-3.h-3.rounded-full');
            if (statusIndicator) {
                statusIndicator.className = `absolute bottom-0 right-0 w-3 h-3 rounded-full ${statusClass} border-2 border-discord-dark transition-colors duration-300`;
            }
            friendEl.setAttribute('data-status', status);
        }
        
        const activityEl = friendEl.querySelector('.text-xs.text-gray-400');
        if (activityEl) {
            const currentActivity = activityEl.textContent.trim();
            const newActivity = activityText;
            if (currentActivity !== newActivity) {
                activityEl.innerHTML = `<i class="${activityIcon} mr-1"></i>${activityText}`;
            }
        }
    }
    
    createFriendElement(friend, userData) {
        const status = userData?.status || 'offline';
        const statusClass = this.getStatusClass(status);
        const activityText = this.getActivityText(userData?.activity_details);
        const activityIcon = this.getActivityIcon(userData?.activity_details);
        
        const friendEl = document.createElement('div');
        friendEl.className = 'flex items-center mb-4 p-3 bg-discord-background rounded-md hover:bg-discord-darker cursor-pointer transition-all duration-200';
        friendEl.innerHTML = `
            <div class="relative mr-3">
                <div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                    <img src="${friend.avatar_url || ''}" 
                         alt="${friend.username}" 
                         class="w-full h-full object-cover user-avatar">
                </div>
                <div class="absolute bottom-0 right-0 w-3 h-3 rounded-full ${statusClass} border-2 border-discord-dark transition-colors duration-300"></div>
            </div>
            <div class="flex-1">
                <div class="font-semibold text-white">${friend.username}</div>
                <div class="text-xs text-gray-400 transition-all duration-200 flex items-center">
                    <i class="${activityIcon} mr-1"></i>
                    ${activityText}
                </div>
            </div>
        `;
        
        friendEl.setAttribute('data-user-id', friend.id);
        friendEl.setAttribute('data-status', status);
        
        if (window.fallbackImageHandler) {
            const img = friendEl.querySelector('img.user-avatar');
            if (img) {
                window.fallbackImageHandler.processImage(img);
            }
        }
        
        return friendEl;
    }

    smartRenderActiveFriends(container, activeFriends, onlineUsers) {
        const existingFriends = new Map();
        Array.from(container.children).forEach(child => {
            const userId = child.getAttribute('data-user-id');
            if (userId) {
                existingFriends.set(userId, child);
            }
        });
        
        const newFriendsMap = new Map();
        activeFriends.forEach(friend => {
            newFriendsMap.set(friend.id, friend);
        });
        
        existingFriends.forEach((element, userId) => {
            if (!newFriendsMap.has(userId)) {
                element.remove();
            }
        });
        
        const sortedActiveFriends = activeFriends.sort((a, b) => a.username.localeCompare(b.username));
        
        sortedActiveFriends.forEach((friend, index) => {
            const existingEl = existingFriends.get(friend.id);
            
            if (existingEl) {
                this.updateExistingFriend(existingEl, friend, onlineUsers[friend.id]);
                
                const currentIndex = Array.from(container.children).indexOf(existingEl);
                if (currentIndex !== index) {
                    if (index === 0) {
                        container.prepend(existingEl);
                    } else {
                        const referenceEl = container.children[index];
                        container.insertBefore(existingEl, referenceEl);
                    }
                }
            } else {
                const newEl = this.createFriendElement(friend, onlineUsers[friend.id]);
                
                if (index === 0) {
                    container.prepend(newEl);
                } else if (index >= container.children.length) {
                    container.appendChild(newEl);
                } else {
                    const referenceEl = container.children[index];
                    container.insertBefore(newEl, referenceEl);
                }
            }
        });
    }

    renderActiveFriends(container, activeFriends, onlineUsers) {
        this.smartRenderActiveFriends(container, activeFriends, onlineUsers);
    }

    getStatusClass(status) {
        switch (status) {
            case 'online': return 'bg-discord-green';
            case 'afk': return 'bg-yellow-500';
            case 'offline':
            default: return 'bg-gray-500';
        }
    }

    getActivityText(activityDetails) {
        if (!activityDetails || !activityDetails.type) {
            return 'Online';
        }
        

        
        switch (activityDetails.type) {
            case 'In Voice Call': 

                return 'In Voice';
            case 'afk': return 'Away';
            case 'idle':
            default: 
                if (activityDetails.type.startsWith('In Voice - ')) {
                    return activityDetails.type;
                }
                return 'Online';
        }
    }

    getActivityIcon(activityDetails) {
        if (!activityDetails || !activityDetails.type) {
            return 'fa-solid fa-circle';
        }
        
        switch (activityDetails.type) {
            case 'In Voice Call': return 'fa-solid fa-microphone';
            case 'afk': return 'fa-solid fa-clock';
            case 'idle':
            default: 
                if (activityDetails.type.startsWith('In Voice - ')) {
                    return 'fa-solid fa-microphone';
                }
                return 'fa-solid fa-circle';
        }
    }

    // 🎯 NEW: Centralized Presence Hierarchy System
    static PRESENCE_HIERARCHY = {
        'offline': 0,
        'online': 1,
        'afk': 2,
        'In Voice Call': 3,
        'In Voice -': 3,  // Any voice channel
        'playing Tic Tac Toe': 4
    };

    static getPresenceLevel(activityType) {
        if (!activityType) return this.PRESENCE_HIERARCHY['online'];
        
        // Check for exact matches first
        if (this.PRESENCE_HIERARCHY[activityType] !== undefined) {
            return this.PRESENCE_HIERARCHY[activityType];
        }
        
        // Check for pattern matches
        for (const [pattern, level] of Object.entries(this.PRESENCE_HIERARCHY)) {
            if (activityType.includes(pattern)) {
                return level;
            }
        }
        
        return this.PRESENCE_HIERARCHY['online'];
    }

    static canOverridePresence(currentActivity, newActivity) {
        const currentLevel = this.getPresenceLevel(currentActivity?.type);
        const newLevel = this.getPresenceLevel(newActivity?.type);
        
        // Higher level activities can override lower level ones
        // Same level activities can override each other
        return newLevel >= currentLevel;
    }

    static validatePresenceChange(currentStatus, currentActivity, newStatus, newActivity) {
        console.log('🎯 [PRESENCE-HIERARCHY] Validating presence change:', {
            from: { status: currentStatus, activity: currentActivity?.type },
            to: { status: newStatus, activity: newActivity?.type }
        });
        
        // Special case: AFK can only be overridden by user activity or higher priority activities
        if (currentStatus === 'afk' && newStatus === 'online') {
            if (!newActivity || newActivity.type === 'active') {

                return true;
            }
        }
        
        // Check activity hierarchy
        const canOverride = this.canOverridePresence(currentActivity, newActivity);
        
        if (canOverride) {

        } else {

        }
        
        return canOverride;
    }

    canUpdatePresence(newStatus, newActivityDetails) {
        const currentStatus = window.globalSocketManager?.currentPresenceStatus || 'online';
        const currentActivity = window.globalSocketManager?.currentActivityDetails || null;
        
        return GlobalPresenceManager.validatePresenceChange(
            currentStatus,
            currentActivity,
            newStatus,
            newActivityDetails
        );
    }

    handlePresenceUpdate(data) {

        
        if (data.user_id === window.globalSocketManager?.userId) {
            const currentActivity = window.globalSocketManager?.currentActivityDetails;
            const newActivity = data.activity_details;
            
            const isValidChange = GlobalPresenceManager.validatePresenceChange(
                window.globalSocketManager?.currentPresenceStatus,
                currentActivity,
                data.status,
                newActivity
            );
            
            if (!isValidChange) {

                return;
            }
        }
        
        if (this.friendsManager) {
            this.friendsManager.handlePresenceUpdate(data);
        }
        
        this.updateActiveNow();
    }

    static enableDebugMode() {
        window.globalPresenceDebug = true;

        
        const originalUpdate = GlobalPresenceManager.prototype.updateUserPresence;
        GlobalPresenceManager.prototype.updateUserPresence = function(userId, presenceData) {
            if (window.globalPresenceDebug) {
                console.log('🔄 [GLOBAL-PRESENCE-DEBUG] updateUserPresence called:', {
                    userId,
                    presenceData,
                    currentUser: window.GlobalSocketManager?.getCurrentUserId?.(),
                    isCurrentUser: userId === window.GlobalSocketManager?.getCurrentUserId?.()
                });
            }
            return originalUpdate.call(this, userId, presenceData);
        };
    }

    static getInstance() {
        if (!window.globalPresenceManager) {
            window.globalPresenceManager = new GlobalPresenceManager();
        }
        return window.globalPresenceManager;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const isAuthPage = window.location.pathname.includes('/login') || 
                      window.location.pathname.includes('/register') ||
                      window.location.pathname === '/';
    
    if (!isAuthPage) {

        const presenceManager = GlobalPresenceManager.getInstance();
        await presenceManager.initialize();
    } else {

    }
});

window.GlobalPresenceManager = GlobalPresenceManager;