class GlobalSocketManager {
    constructor() {
        this.io = null;
        this.isConnected = false;
        this.isAuthenticated = false;
        this.isConnecting = false;
        this.connectionAttempts = 0;
        this.maxConnectionAttempts = 5;
        this.connectionTimeout = null;
        this.userId = null;
        this.username = null;
        this.avatarUrl = null;
        this.eventListeners = new Map();
        this.joinedRooms = new Set();
        this.pendingRoomJoins = new Set();
        this.socketHost = null;
        this.socketPort = null;
        this.socketSecure = false;
        this.lastError = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = Infinity;
        this.reconnectDelay = 3000;
        this.joinedChannels = new Set();
        this.joinedDMRooms = new Set();
        this.socketListenersSetup = false;
        this.presenceInterval = null;
        this.currentPresenceStatus = 'online';
        this.currentActivityDetails = null;
        this.lastActivityTime = Date.now();
        this.activityCheckInterval = null;
        this.isUserActive = true;
        this.afkTimeout = 20000;
        this.activityTracking = true;
        this.lastPresenceSource = null;

        const inVoice = sessionStorage.getItem('isInVoiceCall');
        if (inVoice === 'true') {
            const channelName = sessionStorage.getItem('voiceChannelName') || 'Voice';
            this.currentPresenceStatus = 'online';
            this.currentActivityDetails = { type: `In Voice - ${channelName}` };
            this.lastPresenceSource = 'restored-from-session';
        }
    }
    
    async initialize() {
        try {
            this.userId = this.getUserId();
            this.username = this.getUsername();
            this.avatarUrl = this.getAvatarUrl();
            
            if (!this.userId || !this.username) {
                throw new Error('User not authenticated - missing user data');
            }
            
            this.log('Initializing socket connection for user:', {
                userId: this.userId,
                username: this.username,
                avatarUrl: this.avatarUrl
            });
            
            this.connect();
            
            // 
            this.setupUnloadHandler();
            
            if (this.io) {
                this.setupActivityTracking();
                return true;
            }
            
            return false;
        } catch (error) {
            this.error('Failed to initialize socket connection:', error);
            return false;
        }
    }
    
    setupUnloadHandler() {
        window.addEventListener('beforeunload', (event) => {
            // 
            if (this.isConnected && this.isAuthenticated) {
                console.log('🔄 [SOCKET] Page unloading - cleaning up socket connections');
                
                // 
                const voiceState = window.localStorageManager?.getUnifiedVoiceState();
                if (voiceState && voiceState.isConnected && voiceState.channelId) {
                    try {
                        this.io.emit('unregister-voice-meeting', {
                            channel_id: voiceState.channelId,
                            force_disconnect: true,
                            reason: 'page_reload'
                        });
                    } catch (error) {
                        console.error('Error notifying about voice disconnect during unload:', error);
                    }
                }
                
                // 
                try {
                    this.io.emit('update-presence', {
                        status: 'offline',
                        user_id: this.userId,
                        activity_details: { type: 'offline' },
                        reason: 'page_reload'
                    });
                } catch (error) {
                    console.error('Error updating presence during unload:', error);
                }
                
                // 
                try {
                    this.io.disconnect();
                } catch (error) {
                    console.error('Error disconnecting socket during unload:', error);
                }
            }
        });
    }
    
    getAvatarUrl() {
        return document.querySelector('meta[name="user-avatar"]')?.content || 
               sessionStorage.getItem('user_avatar_url') ||
               window.currentUserAvatar ||
               '/public/assets/common/default-profile-picture.png';
    }
    
    getUserId() {
        return document.querySelector('meta[name="user-id"]')?.content ||
               document.body?.getAttribute('data-user-id') ||
               window.currentUserId;
    }
    
    getUsername() {
        return document.querySelector('meta[name="username"]')?.content ||
               document.body?.getAttribute('data-username') ||
               window.currentUsername;
    }
    
    init(userData = null) {
        if (window.__SOCKET_INITIALISED__ && this.isConnected) {
            this.log('Socket already initialized and connected');
            return false;
        }

        if (userData) {
            this.userId = userData.user_id;
            this.username = userData.username;
            this.log(`Initializing socket with user data: ${userData.username} (${userData.user_id})`);
        }

        this.loadConnectionDetails();

        if (!this.socketHost || !this.socketPort || this.socketHost === 'null' || this.socketHost === 'undefined') {
            this.log('Socket connection details not found or invalid, skipping initialization');
            return false;
        }

        const isAuthPage = document.body && document.body.getAttribute('data-page') === 'auth';
        if (isAuthPage) {
            this.log('Auth page detected, socket initialization skipped');
            return false;
        }

        if (typeof io === 'undefined') {
            this.error('Socket.io library not loaded - cannot initialize socket');
            return false;
        }

        try {
            const connected = this.connect();
            if (connected !== false) {
                window.__SOCKET_INITIALISED__ = true;
                this.log('Socket initialization completed successfully');
                
                setTimeout(() => {
                    if (!this.isConnected) {
                        this.log('Connection taking longer than expected, but initialization marked complete');
                    }
                }, 2000);
            }
            return true;
        } catch (e) {
            this.error('Failed to initialize socket', e);
            return false;
        }
    }
    
    loadConnectionDetails() {
        let socketHost = 'localhost';
        let socketPort = '1002';
        let socketSecure = false;
        
        const currentHost = window.location.hostname;
        const currentPort = window.location.port;
        const currentProtocol = window.location.protocol;
        
        if (currentHost && currentHost !== 'localhost' && currentHost !== '127.0.0.1' && currentHost !== 'null') {
            socketHost = currentHost;
            socketSecure = currentProtocol === 'https:';
        }
        
        if (currentPort && currentPort !== '80' && currentPort !== '443') {
            const basePort = parseInt(currentPort);
            if (basePort === 1001) {
                socketPort = '1002';
            } else {
                socketPort = (basePort + 1).toString();
            }
        }
        
        this.socketHost = socketHost;
        this.socketPort = socketPort;
        this.socketSecure = socketSecure;
        
        console.log('🔧 [SOCKET] Connection details loaded:', {
            host: this.socketHost,
            port: this.socketPort,
            secure: this.socketSecure,
            url: `${this.socketSecure ? 'https' : 'http'}://${this.socketHost}:${this.socketPort}`,
            detectedFrom: {
                currentHost,
                currentPort,
                currentProtocol
            }
        });
        
        let metaUserId = document.querySelector('meta[name="user-id"]')?.content;
        let metaUsername = document.querySelector('meta[name="username"]')?.content;
        
        if (!metaUserId) {
            metaUserId = document.body?.getAttribute('data-user-id');
        }
        if (!metaUsername) {
            metaUsername = document.body?.getAttribute('data-username');
        }
        
        if (!metaUserId && window.currentUserId) {
            metaUserId = window.currentUserId;
        }
        if (!metaUsername && window.currentUsername) {
            metaUsername = window.currentUsername;
        }
        
        if (metaUserId && metaUsername) {
            this.userId = metaUserId;
            this.username = metaUsername;
            this.log(`User data loaded - ID: ${this.userId}, Username: ${this.username}`);
        } else {
            this.error('No user data found! Checking all sources:', {
                metaUserId: document.querySelector('meta[name="user-id"]')?.content,
                metaUsername: document.querySelector('meta[name="username"]')?.content,
                bodyUserId: document.body?.getAttribute('data-user-id'),
                bodyUsername: document.body?.getAttribute('data-username'),
                windowUserId: window.currentUserId,
                windowUsername: window.currentUsername,
                isAuthenticated: document.querySelector('meta[name="user-authenticated"]')?.content
            });
        }
        
        this.log(`Socket details loaded - Host: ${this.socketHost}, Port: ${this.socketPort}, Secure: ${this.socketSecure}`);
    }
    
    connect() {
        if (this.io && this.isConnected) {
            this.log('Socket already connected');
            return true;
        }
        
        if (!this.socketHost || this.socketHost === 'null' || this.socketHost === 'undefined') {
            this.log('Invalid socket host detected, skipping connection');
            return false;
        }
        
        const socketUrl = `${this.socketSecure ? 'https' : 'http'}://${this.socketHost}:${this.socketPort}`;
        this.log(`Connecting to socket: ${socketUrl}`);
        
        try {
            if (typeof io === 'undefined') {
                throw new Error('Socket.io library (io) is not defined. This is normal on authentication pages.');
            }
            
            this.io = io(socketUrl, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: 15,
                timeout: 20000,
                forceNew: true
            });
            
            this.setupEventHandlers();
            return true;
        } catch (e) {
            this.error('Failed to connect to socket', e);
            throw e;
        }
    }
    
    setupEventHandlers() {
        if (!this.io) return;
        
        this.io.on('connect', () => {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.debug(`Socket connected with ID: ${this.io.id}`, { 
                userId: this.userId,
                socketId: this.io.id,
                reconnectAttempts: this.reconnectAttempts
            });
            

            this.setupActivityTracking();
            this.setupVoiceStateListeners();
            

            this.sendAuthentication();
        });
        
        this.io.on('debug-test-response', (data) => {
            this.debug('Debug ping response received from server', {
                response: data,
                timestamp: new Date().toISOString(),
                roundTripTime: new Date() - new Date(data.timestamp)
            });
            
            if (window.showToast) {
                window.showToast(`Debug ping confirmed by server: ${data.server_id}`, 'success');
            }
        });
        
        this.io.on('auth-success', (data) => {
            this.isAuthenticated = true;
            console.log('🔐 [SOCKET] Authentication successful!', {
                userId: this.userId,
                username: this.username,
                socketId: this.io.id,
                responseData: data
            });
            
            this.debug(`Socket authenticated successfully`, {
                userId: this.userId,
                username: this.username,
                socketId: this.io.id,
                data: data
            });
            
            this.log('Sending immediate presence update after authentication');
            this.lastActivityTime = Date.now();
            this.isUserActive = true;
            


            const isInVoiceCall = this.isUserInVoiceCall();
            
            if (isInVoiceCall) {


                this.updatePresence(this.currentPresenceStatus, this.currentActivityDetails, 'authentication');
            } else {

                this.currentPresenceStatus = 'online';
                this.updatePresence('online', { type: 'active' }, 'authentication');
            }
            
            this.startPresenceHeartbeat();
            
            setTimeout(() => {

                const stillInVoiceCall = this.isUserInVoiceCall();
                
                if (stillInVoiceCall) {

                    this.updatePresence(this.currentPresenceStatus, this.currentActivityDetails, 'authentication');
                } else {
                    this.updatePresence('online', { type: 'active' }, 'authentication');

                }
                
                // 
                this.syncUnifiedVoiceState();
            }, 500);
            

            const event = new CustomEvent('globalSocketReady', {
                detail: {
                    manager: this,
                    socketId: this.io.id
                }
            });
            
            window.dispatchEvent(event);
            

            const authEvent = new CustomEvent('socketAuthenticated', {
                detail: {
                    manager: this,
                    user_id: this.userId,
                    socket_id: this.io.id
                }
            });
            
            window.dispatchEvent(authEvent);
            

        });
        
        this.io.on('auth-error', (data) => {
            this.isAuthenticated = false;
            this.error('Socket authentication failed:', data);
            this.debug('Authentication error details', {
                userId: this.userId,
                username: this.username,
                socketId: this.io.id,
                errorData: data
            });
            
            setTimeout(() => {

                this.sendAuthentication();
            }, 2000);
        });
        
        this.io.on('channel-joined', (data) => {
            this.log(`Channel joined confirmation: ${data.channel_id}`);
        });
        
        this.io.on('dm-room-joined', (data) => {
            this.log(`DM room joined confirmation: ${data.room_id}`);
        });
        
        this.io.on('room-joined', (data) => {
            this.log(`Room joined confirmation: ${data.room_type} - ${data.room_id}`);
            
            if (data.room_type === 'channel') {
                this.joinedChannels.add(data.room_id);
            } else if (data.room_type === 'dm') {
                this.joinedDMRooms.add(data.room_id);
            }
        });
        
        this.io.on('disconnect', () => {
            this.isConnected = false;
            this.isAuthenticated = false;
            this.stopPresenceHeartbeat();
            this.stopActivityCheck();
            this.debug('Socket disconnected', {
                previousSocketId: this.io.id,
                wasAuthenticated: this.isAuthenticated,
                joinedRooms: Array.from(this.joinedRooms)
            });
            
            window.dispatchEvent(new Event('globalSocketDisconnected'));
        });
        
        this.io.on('connect_error', (error) => {
            if (!this.socketHost || this.socketHost === 'null' || this.socketHost === 'undefined') {
                this.log('Socket host is invalid, skipping connection attempts');
                return;
            }
            
            this.error('Socket connection error', error);
            this.lastError = error;
            this.reconnectAttempts++;
            
            this.debug('Connection error details', {
                error: error.message,
                reconnectAttempt: this.reconnectAttempts,
                maxAttempts: this.maxReconnectAttempts
            });
            
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                this.log('Max reconnection attempts reached');
                
                setTimeout(() => {
                    this.reconnectAttempts = 0;
                    this.connect();
                }, this.reconnectDelay);
            }
        });
        
        this.io.on('error', (error) => {
            this.error('Socket error', error);
        });
        
        this.io.on('user-online', (data) => {
            if (window.FriendsManager) {
                const friendsManager = window.FriendsManager.getInstance();
                friendsManager.handleUserOnline(data);
            }
        });
        
        this.io.on('user-offline', (data) => {
            if (window.FriendsManager) {
                const friendsManager = window.FriendsManager.getInstance();
                friendsManager.handleUserOffline(data);
            }
        });
        
        this.io.on('user-presence-update', (data) => {

            
            if (data.user_id === this.userId) {

                this.currentPresenceStatus = data.status;
                this.currentActivityDetails = data.activity_details;
                
                window.dispatchEvent(new CustomEvent('ownPresenceUpdate', {
                    detail: data
                }));
            }
            
            if (window.FriendsManager) {
                const friendsManager = window.FriendsManager.getInstance();
                friendsManager.handlePresenceUpdate(data);
            }
            
            if (window.globalPresenceManager) {
                window.globalPresenceManager.handlePresenceUpdate(data);
            }
        });
        
        this.io.on('jump-to-message-response', (data) => {
            if (window.jumpToMessage) {
                window.jumpToMessage(data.message_id);
            } else if (window.messageHandler?.jumpToMessage) {
                window.messageHandler.jumpToMessage(data.message_id);
            }
        });
        
        this.io.on('jump-to-message-failed', (data) => {
            if (window.showToast) {
                window.showToast('Message not found or not accessible', 'error');
            }
        });
        
        this.io.on('voice-meeting-status', (data) => {
            console.log(`🎤 [SOCKET] Voice meeting status received:`, {
                channelId: data.channel_id,
                hasMeeting: data.has_meeting,
                meetingId: data.meeting_id,
                participantCount: data.participant_count
            });
            
            // 
            if (window.localStorageManager) {
                const currentState = window.localStorageManager.getUnifiedVoiceState();
                if (currentState && currentState.channelId === data.channel_id) {
                    if (data.has_meeting && data.meeting_id) {
                        // 
                        if (currentState.meetingId !== data.meeting_id) {
                            window.localStorageManager.setUnifiedVoiceState({
                                ...currentState,
                                meetingId: data.meeting_id
                            });
                        }
                    } else if (currentState.isConnected && !data.has_meeting) {
                        // 
                        window.localStorageManager.setUnifiedVoiceState({
                            ...currentState,
                            isConnected: false,
                            meetingId: null
                        });
                    }
                }
            }

            this.handleVoiceMeetingStatus(data);
        });
        
        this.io.on('voice-meeting-update', (data) => {
            console.log(`🎤 [SOCKET] Voice meeting update received:`, {
                channelId: data.channel_id,
                action: data.action,
                userId: data.user_id,
                meetingId: data.meeting_id,
                participantCount: data.participant_count,
                isNewMeeting: data.is_new_meeting
            });
            
            // 
            if (window.localStorageManager && data.user_id === this.userId) {
                const currentState = window.localStorageManager.getUnifiedVoiceState();
                
                if (data.action === 'join' || data.action === 'registered') {
                    // 
                    window.localStorageManager.setUnifiedVoiceState({
                        ...currentState,
                        isConnected: true,
                        channelId: data.channel_id,
                        meetingId: data.meeting_id,
                        connectionTime: data.timestamp || Date.now()
                    });
                } else if (data.action === 'leave') {
                    // 
                    window.localStorageManager.setUnifiedVoiceState({
                        ...currentState,
                        isConnected: false,
                        channelId: null,
                        meetingId: null,
                        connectionTime: null
                    });
                }
            }

            this.handleVoiceMeetingUpdate(data);
            
            // 
            const isOwnConnection = data.user_id === this.userId;
            if (isOwnConnection && window.voiceManager?.sdkLoaded) {
                return;
            }
        });
        
        this.io.on('voice-meeting-registered', (data) => {
            console.log(`✅ [SOCKET] Voice meeting registration confirmed:`, {
                channelId: data.channel_id,
                meetingId: data.meeting_id,
                participantCount: data.participant_count
            });
            
            // 
            if (window.localStorageManager && data.user_id === this.userId) {
                const currentState = window.localStorageManager.getUnifiedVoiceState();
                window.localStorageManager.setUnifiedVoiceState({
                    ...currentState,
                    isConnected: true,
                    channelId: data.channel_id,
                    meetingId: data.meeting_id,
                    connectionTime: data.timestamp || Date.now()
                });
            }
            
            window.dispatchEvent(new CustomEvent('voiceMeetingRegistered', {
                detail: data
            }));
        });
        
        this.io.on('stop-typing', this.handleStopTyping.bind(this));
        this.io.on('mention_notification', this.handleMentionNotification.bind(this));
        
        this.socketListenersSetup = true;

    }
    
    sendAuthentication() {
        if (!this.io || !this.userId || !this.username) {
            this.error('Cannot authenticate: missing socket or user data', {
                hasSocket: !!this.io,
                userId: this.userId,
                username: this.username
            });
            return false;
        }
        
        const sessionId = this.getSessionId();
        
        this.avatarUrl = this.getAvatarUrl();
        
        const authData = {
            user_id: this.userId,
            username: this.username,
            session_id: sessionId,
            avatar_url: this.avatarUrl
        };
        
        this.log('Sending authentication to socket server:', {
            ...authData,
            session_id: sessionId ? '[PRESENT]' : '[MISSING]'
        });
        
        this.io.emit('authenticate', authData);
        return true;
    }
    
    getSessionId() {

        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'PHPSESSID') {
                return value;
            }
        }
        

        return document.querySelector('meta[name="session-id"]')?.content || 
               sessionStorage.getItem('session_id') || 
               null;
    }
    
    authenticate() {
        this.sendAuthentication();
        this.setupActivityTracking();
        this.startPresenceHeartbeat();
        
        setTimeout(() => {
            if (this.isConnected && this.isAuthenticated) {
                this.updatePresence(this.currentPresenceStatus, this.currentActivityDetails);

            }
        }, 100);
    }
    
    joinChannel(channelId) {
        if (!this.io || !this.isConnected || !this.isAuthenticated) {
            this.error('Cannot join channel - socket not ready');
            return;
        }
        
        const roomName = `channel-${channelId}`;
        this.log(`Joining channel room: ${roomName}`);
        
        this.io.emit('join-room', {
            room_type: 'channel',
            room_id: channelId
        });
        
        this.joinedChannels.add(roomName);
        this.joinedRooms.add(roomName);
        

        this.io.emit('join-channel', {
            channel_id: channelId
        });
    }
    
    leaveChannel(channelId) {
        if (!this.isConnected || !this.io || !this.isAuthenticated) return false;
        
        this.log(`Leaving channel: ${channelId}`);
        this.io.emit('leave-channel', { channel_id: channelId });
        this.joinedChannels.delete(channelId);
        return true;
    }
    
    joinDMRoom(roomId) {
        if (!this.io || !this.isConnected || !this.isAuthenticated) {
            this.error('Cannot join DM room - socket not ready');
            return;
        }
        
        const roomName = `dm-room-${roomId}`;
        this.log(`Joining DM room: ${roomName}`);
        
        this.io.emit('join-room', {
            room_type: 'dm',
            room_id: roomId
        });
        
        this.joinedDMRooms.add(roomName);
        this.joinedRooms.add(roomName);
        

        this.io.emit('join-dm-room', {
            room_id: roomId
        });
    }
    
    joinRoom(roomType, roomId) {

        
        if (!this.isReady()) {
            console.warn('⚠️ [SOCKET] Cannot join room - socket not ready');
            return false;
        }
        
        if (!roomId) {
            console.warn('⚠️ [SOCKET] Cannot join room - no room ID provided');
            return false;
        }
        

        const roomName = roomType === 'channel' ? `channel-${roomId}` : `dm-room-${roomId}`;
        

        this.io.emit('join-room', { 
            room_type: roomType, 
            room_id: roomId 
        });
        

        if (roomType === 'channel') {
            this.joinedChannels.add(roomId);
            this.joinedRooms.add(roomName);
        } else if (roomType === 'dm') {
            this.joinedDMRooms.add(roomId);
            this.joinedRooms.add(roomName);
        }
        

        

        console.log(`🏠 [SOCKET] Currently joined rooms:`, {
            channels: Array.from(this.joinedChannels),
            dms: Array.from(this.joinedDMRooms),
            all: Array.from(this.joinedRooms)
        });        
        window.dispatchEvent(new CustomEvent('socketRoomJoined', {
            detail: {
                roomType: roomType,
                roomId: roomId,
                roomName: roomName
            }
        }));
        
        // 
        setTimeout(() => {
            console.log(`📡 [SOCKET] Requesting fresh online users after joining room: ${roomName}`);
            this.io.emit('get-online-users');
        }, 200);
        
        return true;
    }
    
    leaveRoom(roomType, roomId) {

        
        if (!this.isReady()) {
            console.warn('⚠️ [SOCKET] Cannot leave room - socket not ready');
            return false;
        }
        
        if (!roomId) {
            console.warn('⚠️ [SOCKET] Cannot leave room - no room ID provided');
            return false;
        }
        

        const roomName = roomType === 'channel' ? `channel-${roomId}` : `dm-room-${roomId}`;
        

        this.io.emit('leave-room', { room_type: roomType, room_id: roomId });
        

        this.joinedRooms.delete(roomName);
        

        return true;
    }
    
    emitToRoom(eventName, data, roomType, roomId) {
        if (!this.isReady()) {
            console.warn('⚠️ [SOCKET] Cannot emit to room - socket not ready');
            return false;
        }
        

        let normalizedRoomId = roomId;
        if (roomType === 'dm' && typeof roomId === 'string' && roomId.startsWith('dm-room-')) {
            normalizedRoomId = roomId.replace('dm-room-', '');

        }
        

        const roomName = roomType === 'channel' ? `channel-${normalizedRoomId}` : `dm-room-${normalizedRoomId}`;
        

        if (!this.joinedRooms.has(roomName)) {

            this.joinRoom(roomType, normalizedRoomId);
            

            setTimeout(() => {

                this.emitToRoomDirect(eventName, data, roomType, normalizedRoomId);
            }, 500);
            
            return true;
        }
        
        return this.emitToRoomDirect(eventName, data, roomType, normalizedRoomId);
    }
    
    emitToRoomDirect(eventName, data, roomType, roomId) {

        const roomName = roomType === 'channel' ? `channel-${roomId}` : `dm-room-${roomId}`;
        

        const roomData = {
            ...data,
            room_type: roomType,
                room_id: roomId,
                source: 'client-originated'
        };
        

        

        this.io.emit(eventName, roomData);
        return true;
    }
    
    sendMessage(messageData, roomType, roomId) {
        if (!this.isReady()) {
            console.warn('⚠️ [SOCKET] Cannot send message - socket not ready');
            return false;
        }

        const eventName = roomType === 'channel' ? 'new-channel-message' : 'user-message-dm';
        return this.emitToRoom(eventName, messageData, roomType, roomId);
    }
    
    sendTyping(channelId = null, roomId = null) {
        if (!this.isReady()) {
            console.warn('⚠️ [SOCKET] Cannot send typing - socket not ready');
            return false;
        }

        const data = channelId 
            ? { channel_id: channelId, source: 'client-originated' }
            : { room_id: roomId, source: 'client-originated' };

        const roomType = channelId ? 'channel' : 'dm';
        const targetId = channelId || roomId;

        return this.emitToRoom('typing', data, roomType, targetId);
    }
    
    sendStopTyping(channelId = null, roomId = null) {
        if (!this.isReady()) {
            console.warn('⚠️ [SOCKET] Cannot send stop typing - socket not ready');
            return false;
        }

        const data = channelId 
            ? { channel_id: channelId, source: 'client-originated' }
            : { room_id: roomId, source: 'client-originated' };

        const roomType = channelId ? 'channel' : 'dm';
        const targetId = channelId || roomId;

        return this.emitToRoom('stop-typing', data, roomType, targetId);
    }
    
    updatePresence(status, activityDetails = null, source = 'unknown') {


        const inVoice = (this.isUserInVoiceCall && typeof this.isUserInVoiceCall === 'function')
            ? this.isUserInVoiceCall()
            : (sessionStorage.getItem('isInVoiceCall') === 'true');

        if (inVoice && (!activityDetails || !activityDetails.type || !activityDetails.type.toLowerCase().includes('in voice'))) {
            return false;
        }

        if (!this.isAuthenticated || !this.io) {
            console.warn(`[SOCKET] Presence update blocked: socket not ready. Source: ${source}`);
            return false;
        }


        if (window.globalPresenceManager) {
            const isValidChange = window.globalPresenceManager.canUpdatePresence(status, activityDetails);
            
            if (!isValidChange) {

                

                window.dispatchEvent(new CustomEvent('presenceUpdateBlocked', {
                    detail: {
                        newStatus: status,
                        newActivity: activityDetails,
                        source: source,
                        currentStatus: this.currentPresenceStatus,
                        currentActivity: this.currentActivityDetails
                    }
                }));
                
                return false;
            }
        }
        


        this.currentPresenceStatus = status;
        this.currentActivityDetails = activityDetails;
        this.lastPresenceSource = source; // 

        const presenceData = {
            status: this.currentPresenceStatus,
            activity_details: this.currentActivityDetails,
            user_id: this.userId,
            username: this.username,
            avatar: this.avatarUrl,
            session_id: this.getSessionId(),
            socket_id: this.io.id
        };
        
        this.io.emit('update-presence', presenceData);
        

        window.dispatchEvent(new CustomEvent('ownPresenceUpdate', {
            detail: {
                user_id: this.userId,
                status: this.currentPresenceStatus,
                activity_details: this.currentActivityDetails,
                source: source // 
            }
        }));
        
        return true;
    }
    
    startPresenceHeartbeat() {
        this.stopPresenceHeartbeat();
        
        this.presenceInterval = setInterval(() => {
            if (this.isConnected && this.isAuthenticated && this.io) {
                this.io.emit('update-presence', {
                    status: this.currentPresenceStatus,
                    activity_details: this.currentActivityDetails
                });

            }
        }, 5000);
        

    }
    
    stopPresenceHeartbeat() {
        if (this.presenceInterval) {
            clearInterval(this.presenceInterval);
            this.presenceInterval = null;

        }
    }
    
    disconnect() {
        this.stopPresenceHeartbeat();
        this.stopActivityCheck();
        if (this.io) {
            this.io.disconnect();
            this.io = null;
        }
        
        this.isConnected = false;
        this.isAuthenticated = false;
        this.joinedChannels.clear();
        this.joinedDMRooms.clear();
        this.joinedRooms.clear();
        this.log('Socket manually disconnected');
    }
    
    isReady() {
        return this.isConnected && this.isAuthenticated && this.io !== null;
    }
    
    setupChannelListeners(channelId) {
        if (!this.isConnected || !this.io) {
            console.warn('Socket not connected, cannot setup channel listeners');
            return false;
        }
        
        this.joinedChannels.forEach(oldChannelId => {
            if (oldChannelId !== channelId) {
                this.leaveChannel(oldChannelId);
            }
        });
        
        this.joinChannel(channelId);
        
        this.io.off('new-channel-message'); 
        this.io.off('user-typing');
        this.io.off('user-stop-typing');
        
        this.io.on('new-channel-message', (messageData) => {
            if (messageData && messageData.channel_id === channelId) {
                this.log(`Received message in channel ${channelId}`);
                
                const event = new CustomEvent('newChannelMessage', {
                    detail: messageData
                });
                window.dispatchEvent(event);
            }
        });
        
        this.io.on('user-typing', (data) => {
            if (data.channel_id === channelId) {
                const event = new CustomEvent('userTyping', {
                    detail: data
                });
                window.dispatchEvent(event);
                
                if (window.chatSection && typeof window.chatSection.showTypingIndicator === 'function') {
                    window.chatSection.showTypingIndicator(data.user_id, data.username);
                }
            }
        });
        
        this.io.on('user-stop-typing', (data) => {
            if (data.channel_id === channelId) {
                const event = new CustomEvent('userStopTyping', {
                    detail: data
                });
                window.dispatchEvent(event);
                
                if (window.chatSection && typeof window.chatSection.removeTypingIndicator === 'function') {
                    window.chatSection.removeTypingIndicator(data.user_id);
                }
            }
        });
        
        this.log(`Channel listeners set up for channel: ${channelId}`);
        return true;
    }
    
    getStatus() {
        return {
            connected: this.isConnected,
            authenticated: this.isAuthenticated,
            socketId: this.io ? this.io.id : null,
            userId: this.userId,
            username: this.username,
            lastError: this.lastError,
            joinedChannels: Array.from(this.joinedChannels),
            joinedDMRooms: Array.from(this.joinedDMRooms),
            joinedRooms: Array.from(this.joinedRooms)
        };
    }
    
    log(...args) {
        const timestamp = new Date().toISOString();
        
        if (typeof window !== 'undefined' && window.logger) {
            window.logger.info('socket', ...args);
        } else {

        }
    }
    
    debug(...args) {
        const timestamp = new Date().toISOString();
        const stack = new Error().stack?.split('\n')[2]?.trim() || '';
        
        if (typeof window !== 'undefined' && window.logger) {
            window.logger.debug('socket', ...args);
        } else {
            console.debug(
                `%c[SOCKET DEBUG ${timestamp}]`, 
                'color: #2196F3; font-weight: bold;', 
                ...args,
                '\n',
                `%c${stack}`, 
                'color: #607D8B; font-size: 0.8em;'
            );
        }
    }
    
    error(...args) {
        const timestamp = new Date().toISOString();
        
        if (typeof window !== 'undefined' && window.logger) {
            window.logger.error('socket', ...args);
        } else {
            console.warn(`%c[SOCKET]`, 'color: #FF9800; font-weight: bold;', ...args);
        }
    }
    
    handleChannelMessage(data) {

    }
    
    handleGlobalMentionNotification(data) {
        try {
            const currentUserId = this.userId;
            if (!currentUserId) {
                console.warn('⚠️ [GLOBAL-SOCKET] No current user ID for mention notification');
                return;
            }
            

            
            let shouldNotify = false;
            let mentionType = '';
            
            if (data.type === 'all') {
                shouldNotify = true;
                mentionType = '@all';

            } else if (data.type === 'user' && data.mentioned_user_id === currentUserId) {
                shouldNotify = true;
                mentionType = `@${this.username}`;

            }
            
            if (shouldNotify) {
                this.showGlobalMentionNotification(data, mentionType);
                this.playGlobalMentionSound();
                
                window.dispatchEvent(new CustomEvent('globalMentionReceived', {
                    detail: {
                        data: data,
                        mentionType: mentionType,
                        timestamp: Date.now()
                    }
                }));
            }
        } catch (error) {
            console.error('❌ [GLOBAL-SOCKET] Error handling global mention notification:', error);
        }
    }
    
    showGlobalMentionNotification(data, mentionType) {
        try {
            const isCurrentChat = this.isCurrentlyViewingChat(data);
            
            if (isCurrentChat) {

                return;
            }
            
            const channelName = data.channel_name || `Channel ${data.channel_id || data.room_id}`;
            const notificationText = `${data.username} mentioned you with ${mentionType} in ${channelName}`;
            const avatarUrl = data.avatar_url || '/public/assets/common/default-profile-picture.png';
            

            
            if (window.showToast) {
                if (window.notificationToast && typeof window.notificationToast.mention === 'function') {
                    window.notificationToast.mention(notificationText, {
                        avatar: avatarUrl,
                        title: 'New Mention',
                        duration: 8000
                    });
                } else {
                    window.showToast(notificationText, 'mention', 8000);
                }
            }
            
            if (document.hidden && 'Notification' in window) {
                if (Notification.permission === 'granted') {
                    const notification = new Notification('New Mention', {
                        body: notificationText,
                        icon: avatarUrl,
                        tag: `mention-${data.message_id || Date.now()}`,
                        requireInteraction: false
                    });
                    
                    notification.onclick = () => {
                        window.focus();
                        this.navigateToMention(data);
                        notification.close();
                    };
                    
                    setTimeout(() => notification.close(), 10000);
                } else if (Notification.permission === 'default') {
                    Notification.requestPermission().then(permission => {
                        if (permission === 'granted') {
                            this.showGlobalMentionNotification(data, mentionType);
                        }
                    });
                }
            }
        } catch (error) {
            console.error('❌ [GLOBAL-SOCKET] Error showing global mention notification:', error);
        }
    }
    
    isCurrentlyViewingChat(data) {
        try {
            if (!window.chatSection || !window.chatSection.targetId) {
                return false;
            }
            
            const currentChatType = window.chatSection.chatType;
            const currentTargetId = String(window.chatSection.targetId);
            
            if (data.channel_id) {
                return currentChatType === 'channel' && currentTargetId === String(data.channel_id);
            } else if (data.room_id) {
                return (currentChatType === 'dm' || currentChatType === 'direct') && currentTargetId === String(data.room_id);
            }
            
            return false;
        } catch (error) {
            console.error('❌ [GLOBAL-SOCKET] Error checking current chat:', error);
            return false;
        }
    }
    
    navigateToMention(data) {
        try {

            
            let targetUrl = '';
            
            if (data.channel_id && data.server_id) {
                targetUrl = `/server/${data.server_id}?channel=${data.channel_id}`;
            } else if (data.room_id) {
                targetUrl = `/home/channels/dm/${data.room_id}`;
            }
            
            if (targetUrl) {
                if (data.message_id) {
                    targetUrl += `#message-${data.message_id}`;
                }
                

                window.location.href = targetUrl;
            } else {
                console.warn('⚠️ [GLOBAL-SOCKET] Could not determine navigation URL for mention');
            }
        } catch (error) {
            console.error('❌ [GLOBAL-SOCKET] Error navigating to mention:', error);
        }
    }
    
    playGlobalMentionSound() {
        try {
            const audio = new Audio('/public/assets/sound/discordo_sound.mp3');
            audio.volume = 0.7;
            audio.play().catch(e => {

            });
        } catch (error) {

        }
    }
    
    handleMentionNotification(data) {
        this.handleGlobalMentionNotification(data);
    }
    
    handleStopTyping(data) {

    }

    setupActivityTracking() {
        if (!this.activityTracking) return;
        
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        const updateActivity = () => {
            this.lastActivityTime = Date.now();
            if (!this.isUserActive || this.currentPresenceStatus === 'afk') {
                this.isUserActive = true;
                


                const isInVoiceCall = this.isUserInVoiceCall();
                
                if (isInVoiceCall) {


                    return;
                }
                


                this.currentPresenceStatus = 'online';
                this.updatePresence('online', { type: 'active' }, 'activity');
            }
        };
        
        events.forEach(event => {
            document.addEventListener(event, updateActivity, true);
        });
        
        window.addEventListener('focus', () => {

            updateActivity();
        });
        
        window.addEventListener('blur', () => {

        });
        
        this.startActivityCheck();

    }
    

    isUserInVoiceCall() {

        const activityType = this.currentActivityDetails?.type;
        

        const voiceCallPatterns = [
            'In Voice Call',
            'In Voice -',
            'playing Tic Tac Toe'  // 
        ];
        
        if (activityType) {
            return voiceCallPatterns.some(pattern => activityType.includes(pattern));
        }
        

        if (window.videoSDKManager?.isConnected || window.voiceManager?.isConnected) {
            return true;
        }
        
        return false;
    }
    
    startActivityCheck() {
        this.stopActivityCheck();
        
        this.activityCheckInterval = setInterval(() => {
            const timeSinceActivity = Date.now() - this.lastActivityTime;
            
            if (timeSinceActivity >= this.afkTimeout && this.isUserActive) {
                this.isUserActive = false;
                


                const isInVoiceCall = this.isUserInVoiceCall();
                
                if (isInVoiceCall) {

                    return;
                }
                

                this.currentPresenceStatus = 'afk';
                this.updatePresence('afk', { type: 'afk' }, 'afk');
            }
        }, 10000);
        

    }
    
    stopActivityCheck() {
        if (this.activityCheckInterval) {
            clearInterval(this.activityCheckInterval);
            this.activityCheckInterval = null;

        }
    }
    
    handleVoiceMeetingStatus(data) {
        if (window.ChannelVoiceParticipants) {
            const instance = window.ChannelVoiceParticipants.getInstance();
            if (data.channel_id) {
                instance.updateChannelCount(data.channel_id, data.participant_count);
                instance.updateSidebarForChannel(data.channel_id);
            }
        }
    }

    handleVoiceMeetingUpdate(data) {
        if (window.ChannelVoiceParticipants) {
            const instance = window.ChannelVoiceParticipants.getInstance();
            if (data.channel_id) {
                if (data.action === 'join' || data.action === 'leave' || data.action === 'registered') {
                    instance.updateChannelCount(data.channel_id, data.participant_count);
                    instance.updateSidebarForChannel(data.channel_id);
                    
                    if (data.action === 'leave' || data.action === 'join') {
                        instance.updateAllChannelCounts();
                    }
                }
            }
        }
    }

    setupVoiceStateListeners() {
        // 
        window.addEventListener('voiceStateChanged', (event) => {
            const { state } = event.detail;
            this.syncVoiceStateWithPresence(state);
        });
        
        // 
        window.addEventListener('voiceConnect', (event) => {
            const { channelId, channelName, meetingId } = event.detail;
            this.handleVoiceConnect(channelId, channelName, meetingId);
        });
        
        window.addEventListener('voiceDisconnect', (event) => {
            this.handleVoiceDisconnect();
        });
        
        // 
        if (window.localStorageManager) {
            window.localStorageManager.addVoiceStateListener((state) => {
                this.syncVoiceStateWithPresence(state);
            });
        }
    }
    
    syncUnifiedVoiceState() {
        if (!window.localStorageManager) return;
        
        const voiceState = window.localStorageManager.getUnifiedVoiceState();
        
        if (voiceState.isConnected && voiceState.channelId && voiceState.meetingId) {
            // 
            this.validateVoiceState(voiceState);
        }
    }
    
    validateVoiceState(voiceState) {
        if (!this.isReady()) return;
        
        // 
        this.io.emit('check-voice-meeting', { channel_id: voiceState.channelId });
        
        // 
        const timeout = setTimeout(() => {
            this.io.off('voice-meeting-status', validationHandler);
        }, 5000);
        
        const validationHandler = (data) => {
            if (data.channel_id === voiceState.channelId) {
                clearTimeout(timeout);
                this.io.off('voice-meeting-status', validationHandler);
                
                if (!data.has_meeting || data.meeting_id !== voiceState.meetingId) {
                    console.log(`🔄 [SOCKET] Voice state validation failed, clearing state:`, {
                        channelId: voiceState.channelId,
                        storedMeetingId: voiceState.meetingId,
                        serverMeetingId: data.meeting_id,
                        serverHasMeeting: data.has_meeting
                    });
                    
                    // 
                    window.localStorageManager.setUnifiedVoiceState({
                        ...voiceState,
                        isConnected: false,
                        channelId: null,
                        meetingId: null,
                        connectionTime: null
                    });
                } else {
                    console.log(`✅ [SOCKET] Voice state validation successful:`, {
                        channelId: voiceState.channelId,
                        meetingId: voiceState.meetingId
                    });
                }
            }
        };
        
        this.io.on('voice-meeting-status', validationHandler);
    }
    
    handleVoiceConnect(channelId, channelName, meetingId) {
        // 
        this.updatePresence('online', { 
            type: `In Voice - ${channelName}` 
        }, 'voice-connect');
        
        // 
        if (window.localStorageManager) {
            const currentState = window.localStorageManager.getUnifiedVoiceState();
            window.localStorageManager.setUnifiedVoiceState({
                ...currentState,
                isConnected: true,
                channelId: channelId,
                channelName: channelName,
                meetingId: meetingId,
                connectionTime: Date.now()
            });
        }
    }
    
    handleVoiceDisconnect() {
        // 
        this.updatePresence('online', { type: 'active' }, 'voice-disconnect');
        
        // 
        if (window.localStorageManager) {
            const currentState = window.localStorageManager.getUnifiedVoiceState();
            window.localStorageManager.setUnifiedVoiceState({
                ...currentState,
                isConnected: false,
                channelId: null,
                channelName: null,
                meetingId: null,
                connectionTime: null
            });
        }
    }
    
    syncVoiceStateWithPresence(voiceState) {
        if (!voiceState) return;
        
        if (voiceState.isConnected && voiceState.channelName) {
            this.updatePresence('online', { 
                type: `In Voice - ${voiceState.channelName}` 
            }, 'voice-state-sync');
        } else {
            this.updatePresence('online', { type: 'active' }, 'voice-state-sync');
        }
    }
}

const globalSocketManager = new GlobalSocketManager();

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (globalSocketManager.isConnected || window.__SOCKET_INITIALISED__) {

            return;
        }

        let userId = document.querySelector('meta[name="user-id"]')?.content ||
                     document.body?.getAttribute('data-user-id');

        let username = document.querySelector('meta[name="username"]')?.content ||
                       document.body?.getAttribute('data-username');

        const hasAuthData = userId && username;
        const userData = hasAuthData ? { user_id: userId, username: username } : null;

        if (hasAuthData) {

        } else {

        }

        globalSocketManager.init(userData);
    }, 100);
});

window.GlobalSocketManager = GlobalSocketManager;
window.globalSocketManager = globalSocketManager;

export { GlobalSocketManager, globalSocketManager };
export default globalSocketManager;