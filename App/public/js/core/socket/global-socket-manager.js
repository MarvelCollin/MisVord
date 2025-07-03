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
        if (window.__SOCKET_INITIALISED__ && this.isConnected && this.io) {
            this.log('Socket already initialized and connected with active instance');
            return false;
        }

        if (this.io && (this.isConnected || this.isConnecting)) {
            this.log('Socket connection already in progress or established');
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
            this.isConnecting = true;
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
            this.isConnecting = false;
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

        if (this.io && this.isConnecting) {
            this.log('Socket connection already in progress');
            return true;
        }
        
        if (!this.socketHost || this.socketHost === 'null' || this.socketHost === 'undefined') {
            this.log('Invalid socket host detected, skipping connection');
            return false;
        }

        // Disconnect any existing socket instance before creating new one
        if (this.io) {
            this.log('Cleaning up existing socket instance before reconnection');
            this.io.disconnect();
            this.io = null;
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
            this.isConnecting = false;
            this.error('Failed to connect to socket', e);
            throw e;
        }
    }
    
    setupEventHandlers() {
        if (!this.io) return;
        
        this.io.on('connect', () => {
            this.isConnected = true;
            this.isConnecting = false;
            this.reconnectAttempts = 0;
            this.debug(`Socket connected with ID: ${this.io.id}`, { 
                userId: this.userId,
                socketId: this.io.id,
                reconnectAttempts: this.reconnectAttempts
            });
            
            console.log('🔌 [SOCKET] Socket connected successfully, setting up activity tracking...');
            this.setupActivityTracking();
            
            console.log('🔌 [SOCKET] Sending authentication...');
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
            
            this.log('Sending immediate online presence update after authentication');
            this.lastActivityTime = Date.now();
            this.isUserActive = true;
            this.currentPresenceStatus = 'online';
            
            if (this.currentActivityDetails?.type?.startsWith('In Voice - ')) {
                console.log('🎯 [SOCKET] User authenticated while in voice call, preserving voice call status');
                this.updatePresence('online', this.currentActivityDetails);
            } else {
                this.updatePresence('online', { type: 'active' });
            }
            this.startPresenceHeartbeat();
            
            setTimeout(() => {
                if (this.currentActivityDetails?.type?.startsWith('In Voice - ')) {
                    console.log('🎯 [SOCKET] Secondary presence update - preserving voice call status');
                    this.updatePresence('online', this.currentActivityDetails);
                } else {
                    this.updatePresence('online', { type: 'active' });
                }
                console.log('✅ [SOCKET] Secondary presence update sent for reliability');
            }, 500);
            
            console.log('🔔 [SOCKET] Dispatching globalSocketReady event');
            const event = new CustomEvent('globalSocketReady', {
                detail: {
                    manager: this,
                    socketId: this.io.id
                }
            });
            
            window.dispatchEvent(event);
            
            console.log('🔔 [SOCKET] Dispatching socketAuthenticated event');
            const authEvent = new CustomEvent('socketAuthenticated', {
                detail: {
                    manager: this,
                    user_id: this.userId,
                    socket_id: this.io.id
                }
            });
            
            window.dispatchEvent(authEvent);
            
            console.log('✅ [SOCKET] All authentication events dispatched successfully');
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
                console.log('🔄 [SOCKET] Retrying authentication after error...');
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
            this.isConnecting = false;
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
            console.log('📡 [SOCKET] User presence update received:', data);
            
            if (data.user_id === this.userId) {
                console.log('👤 [SOCKET] Own presence updated:', data);
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
        
        this.io.on('voice-meeting-status', this.handleVoiceMeetingStatus.bind(this));
        this.io.on('voice-meeting-update', this.handleVoiceMeetingUpdate.bind(this));
        
        this.io.on('stop-typing', this.handleStopTyping.bind(this));
        
        this.socketListenersSetup = true;
        console.log('✅ Socket handlers setup complete');
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
        // Try to get session ID from cookie
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'PHPSESSID') {
                return value;
            }
        }
        
        // Fallback: try to get from meta tag or other sources
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
                console.log('✅ [SOCKET] Initial presence sent immediately after authentication');
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
        
        // Also join the channel via the channel-specific event
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
        
        // Also join via the DM-specific event
        this.io.emit('join-dm-room', {
            room_id: roomId
        });
    }
    
    joinRoom(roomType, roomId) {
        console.log(`📺 [SOCKET] Joining ${roomType} room ${roomId}`);
        
        if (!this.isReady()) {
            console.warn('⚠️ [SOCKET] Cannot join room - socket not ready');
            return false;
        }
        
        if (!roomId) {
            console.warn('⚠️ [SOCKET] Cannot join room - no room ID provided');
            return false;
        }
        
        // Use consistent room name format
        const roomName = roomType === 'channel' ? `channel-${roomId}` : `dm-room-${roomId}`;
        
        // Join the room with the server
        this.io.emit('join-room', { 
            room_type: roomType, 
            room_id: roomId 
        });
        
        // Add to our local tracking sets
        if (roomType === 'channel') {
            this.joinedChannels.add(roomId);
            this.joinedRooms.add(roomName);
        } else if (roomType === 'dm') {
            this.joinedDMRooms.add(roomId);
            this.joinedRooms.add(roomName);
        }
        
        console.log(`✅ [SOCKET] Joined ${roomType} room ${roomId} (${roomName})`);
        
        // For debugging purposes, log all rooms we're in
        console.log(`🏠 [SOCKET] Currently joined rooms:`, {
            channels: Array.from(this.joinedChannels),
            dms: Array.from(this.joinedDMRooms),
            all: Array.from(this.joinedRooms)
        });
        
        // Dispatch an event that we've joined the room
        window.dispatchEvent(new CustomEvent('socketRoomJoined', {
            detail: {
                roomType: roomType,
                roomId: roomId,
                roomName: roomName
            }
        }));
        
        return true;
    }
    
    leaveRoom(roomType, roomId) {
        console.log(`🚪 [SOCKET] Leaving ${roomType} room ${roomId}`);
        
        if (!this.isReady()) {
            console.warn('⚠️ [SOCKET] Cannot leave room - socket not ready');
            return false;
        }
        
        if (!roomId) {
            console.warn('⚠️ [SOCKET] Cannot leave room - no room ID provided');
            return false;
        }
        
        // Use consistent room name format
        const roomName = roomType === 'channel' ? `channel-${roomId}` : `dm-room-${roomId}`;
        
        // Leave the room with the server
        this.io.emit('leave-room', { room_type: roomType, room_id: roomId });
        
        // Remove from tracked rooms
        this.joinedRooms.delete(roomName);
        
        console.log(`✅ [SOCKET] Left ${roomType} room: ${roomName}`);
        return true;
    }
    
    emitToRoom(eventName, data, roomType, roomId) {
        if (!this.isReady()) {
            console.warn('⚠️ [SOCKET] Cannot emit to room - socket not ready');
            return false;
        }
        
        // Normalize roomId for DM rooms (strip prefix if present)
        let normalizedRoomId = roomId;
        if (roomType === 'dm' && typeof roomId === 'string' && roomId.startsWith('dm-room-')) {
            normalizedRoomId = roomId.replace('dm-room-', '');
            console.log(`🔄 [SOCKET] Normalized DM room ID from ${roomId} to ${normalizedRoomId}`);
        }
        
        // Use consistent room name format
        const roomName = roomType === 'channel' ? `channel-${normalizedRoomId}` : `dm-room-${normalizedRoomId}`;
        
        // First join the room if not already joined
        if (!this.joinedRooms.has(roomName)) {
            console.log(`🔄 [SOCKET] Not in room ${roomName}, joining now...`);
            this.joinRoom(roomType, normalizedRoomId);
            
            // Wait a moment to ensure room join completes
            setTimeout(() => {
                console.log(`🔄 [SOCKET] Delayed emit to ${roomName} after joining`);
                this.emitToRoomDirect(eventName, data, roomType, normalizedRoomId);
            }, 500);
            
            return true;
        }
        
        return this.emitToRoomDirect(eventName, data, roomType, normalizedRoomId);
    }
    
    emitToRoomDirect(eventName, data, roomType, roomId) {
        // Use consistent room name format
        const roomName = roomType === 'channel' ? `channel-${roomId}` : `dm-room-${roomId}`;
        
        // Add room information to data
        const roomData = {
            ...data,
            room_type: roomType,
                room_id: roomId,
                source: 'client-originated'
        };
        
        console.log(`📤 [SOCKET] Emitting ${eventName} to ${roomType} room ${roomName}:`, roomData);
        
        // Emit the event to the room
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
    
    updatePresence(status, activityDetails = null) {
        if (!this.isConnected || !this.io) return false;
        
        this.currentPresenceStatus = status;
        this.currentActivityDetails = activityDetails;
        
        this.io.emit('update-presence', { 
            status, 
            activity_details: activityDetails 
        });
        
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
                console.log('💓 [SOCKET] Presence heartbeat sent');
            }
        }, 5000);
        
        console.log('⏰ [SOCKET] Presence heartbeat started (5 second intervals)');
    }
    
    stopPresenceHeartbeat() {
        if (this.presenceInterval) {
            clearInterval(this.presenceInterval);
            this.presenceInterval = null;
            console.log('⏰ [SOCKET] Presence heartbeat stopped');
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
        this.isConnecting = false;
        this.isAuthenticated = false;
        this.joinedChannels.clear();
        this.joinedDMRooms.clear();
        this.joinedRooms.clear();
        this.reconnectAttempts = 0;
        window.__SOCKET_INITIALISED__ = false;
        this.log('Socket manually disconnected and state cleared');
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
            console.log(`%c[SOCKET ${timestamp}]`, 'color: #4CAF50; font-weight: bold;', ...args);
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
        // ... existing code ...
    }
    
    // handleGlobalMentionNotification(data) {
    //     // DISABLED: Now handled by GlobalNotificationHandler to prevent notification bursts
    //     try {
    //         const currentUserId = this.userId;
    //         if (!currentUserId) {
    //             console.warn('⚠️ [GLOBAL-SOCKET] No current user ID for mention notification');
    //             return;
    //         }
    //         
    //         console.log('💬 [GLOBAL-SOCKET] Global mention notification received:', data);
    //         
    //         let shouldNotify = false;
    //         let mentionType = '';
    //         
    //         if (data.type === 'all') {
    //             shouldNotify = true;
    //             mentionType = '@all';
    //             console.log('📢 [GLOBAL-SOCKET] @all mention detected globally');
    //         } else if (data.type === 'role' && data.mentioned_user_id === currentUserId) {
    //             shouldNotify = true;
    //             mentionType = `@${data.role}`;
    //             console.log(`👥 [GLOBAL-SOCKET] Role mention detected globally: @${data.role} for current user`);
    //         } else if (data.type === 'user' && data.mentioned_user_id === currentUserId) {
    //             shouldNotify = true;
    //             mentionType = `@${this.username}`;
    //             console.log('👤 [GLOBAL-SOCKET] User mention detected globally for current user');
    //         }
    //         
    //         if (shouldNotify) {
    //             this.showGlobalMentionNotification(data, mentionType);
    //             this.playGlobalMentionSound();
    //             
    //             window.dispatchEvent(new CustomEvent('globalMentionReceived', {
    //                 detail: {
    //                     data: data,
    //                     mentionType: mentionType,
    //                     timestamp: Date.now()
    //                 }
    //             }));
    //         }
    //     } catch (error) {
    //         console.error('❌ [GLOBAL-SOCKET] Error handling global mention notification:', error);
    //     }
    // }
    
    showGlobalMentionNotification(data, mentionType) {
        try {
            const isCurrentChat = this.isCurrentlyViewingChat(data);
            
            if (isCurrentChat) {
                console.log('🔄 [GLOBAL-SOCKET] User is viewing the mentioned chat, skipping global notification');
                return;
            }
            
            const channelName = data.channel_name || `Channel ${data.channel_id || data.room_id}`;
            const notificationText = `${data.username} mentioned you with ${mentionType} in ${channelName}`;
            
            console.log('🔔 [GLOBAL-SOCKET] Showing global mention notification:', notificationText);
            
            if (window.showToast) {
                window.showToast(notificationText, 'mention', 8000);
            }
            
            if (document.hidden && 'Notification' in window) {
                if (Notification.permission === 'granted') {
                    const notification = new Notification('New Mention', {
                        body: notificationText,
                        icon: '/public/assets/common/default-profile-picture.png',
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
    
    async navigateToMention(data) {
        try {
            console.log('🔗 [GLOBAL-SOCKET] Navigating to mention:', data);
            
            if (data.target_type === 'channel' && data.target_id) {
                let serverId = null;
                
                if (data.server_id) {
                    serverId = data.server_id;
                    console.log('✅ [GLOBAL-SOCKET] Using server_id from notification data:', serverId);
                } else if (data.context && data.context.server_id) {
                    serverId = data.context.server_id;
                    console.log('✅ [GLOBAL-SOCKET] Using server_id from context:', serverId);
                } else if (data.channel_id && data.server_id) {
                    serverId = data.server_id;
                    console.log('✅ [GLOBAL-SOCKET] Using server_id from data fields:', serverId);
                }
                
                if (serverId) {
                    const channelId = data.target_id || data.channel_id;
                    const targetUrl = `/server/${serverId}?channel=${channelId}`;
                    const currentPath = window.location.pathname;
                    const currentServerMatch = currentPath.match(/\/server\/(\d+)/);
                    const currentServerId = currentServerMatch ? currentServerMatch[1] : null;
                    
                    console.log('🔗 [GLOBAL-SOCKET] Navigation details:', {
                        targetUrl,
                        currentServerId,
                        targetServerId: serverId,
                        targetChannelId: channelId
                    });
                    
                    if (currentServerId === serverId) {
                        console.log('🔄 [GLOBAL-SOCKET] Same server, using channel switcher');
                        if (window.simpleChannelSwitcher) {
                            window.simpleChannelSwitcher.switchToChannel(channelId, 'text', true, data.message_id);
                        } else {
                            console.log('⚠️ [GLOBAL-SOCKET] Channel switcher not available, using URL navigation');
                            if (data.message_id) {
                                window.location.href = targetUrl + `#message-${data.message_id}`;
                            } else {
                                window.location.href = targetUrl;
                            }
                        }
                    } else {
                        console.log('🔄 [GLOBAL-SOCKET] Different server, using URL navigation');
                        if (data.message_id) {
                            window.location.href = targetUrl + `#message-${data.message_id}`;
                        } else {
                            window.location.href = targetUrl;
                        }
                    }
                } else {
                    console.warn('⚠️ [GLOBAL-SOCKET] No server ID found for channel navigation');
                    const targetUrl = `/home?channel=${data.target_id || data.channel_id}`;
                    if (data.message_id) {
                        window.location.href = targetUrl + `#message-${data.message_id}`;
                    } else {
                        window.location.href = targetUrl;
                    }
                }
            } else if (data.room_id) {
                const targetUrl = `/home/channels/dm/${data.room_id}`;
                if (data.message_id) {
                    window.location.href = targetUrl + `#message-${data.message_id}`;
                } else {
                    window.location.href = targetUrl;
                }
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
                console.log('🔊 [GLOBAL-SOCKET] Could not play mention sound:', e);
            });
        } catch (error) {
            console.log('🔊 [GLOBAL-SOCKET] Could not play mention sound:', error);
        }
    }
    
    // handleMentionNotification(data) {
    //     // DISABLED: Now handled by GlobalNotificationHandler to prevent notification bursts  
    //     this.handleGlobalMentionNotification(data);
    // }
    
    handleStopTyping(data) {
        console.log('⌨️ [GLOBAL-SOCKET] Stop typing event received:', data);
    }

    setupActivityTracking() {
        if (!this.activityTracking) return;
        
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        const updateActivity = () => {
            this.lastActivityTime = Date.now();
            if (!this.isUserActive || this.currentPresenceStatus === 'afk') {
                this.isUserActive = true;
                
                if (this.currentActivityDetails?.type?.startsWith('In Voice - ')) {
                    console.log('🎯 [VOICE-ACTIVITY] User activity detected while in voice call, preserving voice call status');
                    this.currentPresenceStatus = 'online';
                    this.updatePresence('online', this.currentActivityDetails);
                } else {
                    console.log('🎯 [SOCKET] User activity detected, setting status to online (no voice call)');
                    this.currentPresenceStatus = 'online';
                    this.updatePresence('online', { type: 'active' });
                }
            } else if (this.currentActivityDetails?.type?.startsWith('In Voice - ')) {
                this.lastActivityTime = Date.now();
            }
        };
        
        events.forEach(event => {
            document.addEventListener(event, updateActivity, true);
        });
        
        window.addEventListener('focus', () => {
            console.log('🎯 [SOCKET] Window focused, user is active');
            updateActivity();
        });
        
        window.addEventListener('blur', () => {
            console.log('🎯 [SOCKET] Window blurred, starting afk detection');
        });
        
        this.startActivityCheck();
        console.log('✅ [SOCKET] Activity tracking initialized');
    }
    
    startActivityCheck() {
        this.stopActivityCheck();
        
        this.activityCheckInterval = setInterval(() => {
            const timeSinceActivity = Date.now() - this.lastActivityTime;
            
            if (timeSinceActivity >= this.afkTimeout && this.isUserActive) {
                const isVideoSDKConnected = window.videoSDKManager?.isConnected || false;
                const isVoiceManagerConnected = window.voiceManager?.isConnected || false;
                const isUnifiedStateConnected = window.unifiedVoiceStateManager?.isConnected() || false;
                const isActuallyInVoice = isVideoSDKConnected || isVoiceManagerConnected || isUnifiedStateConnected;
                
                if (this.currentActivityDetails?.type?.startsWith('In Voice - ') || isActuallyInVoice) {
                    if (isActuallyInVoice) {
                        console.log('🎤 [VOICE-PROTECTION] User inactive but actually in voice call (verified), preserving voice call status');
                        
                        if (!this.currentActivityDetails?.type?.startsWith('In Voice - ')) {
                            console.log('🔧 [VOICE-PROTECTION] Presence data incorrect, restoring voice call status');
                            const channelName = window.voiceManager?.currentChannelName || 'Voice Channel';
                            const channelId = window.voiceManager?.currentChannelId;
                            const serverId = document.querySelector('meta[name="server-id"]')?.content;
                            
                            this.updatePresence('online', {
                                type: `In Voice - ${channelName}`,
                                channel_id: channelId,
                                server_id: serverId,
                                channel_name: channelName
                            });
                        }
                    } else {
                        console.log('🎤 [VOICE-PROTECTION] User inactive but in voice call, preserving voice call status (not changing to AFK)');
                    }
                    return;
                }
                
                this.isUserActive = false;
                console.log('😴 [VOICE-ACTIVITY] User inactive for 20 seconds, setting status to afk (verified not in voice call)');
                this.currentPresenceStatus = 'afk';
                this.updatePresence('afk', { type: 'afk' });
            }
        }, 10000);
        
        console.log('⏰ [VOICE-ACTIVITY] Activity check started (10 second intervals) with voice protection validation');
    }
    
    stopActivityCheck() {
        if (this.activityCheckInterval) {
            clearInterval(this.activityCheckInterval);
            this.activityCheckInterval = null;
            console.log('⏰ [SOCKET] Activity check stopped');
        }
    }
    
    handleVoiceMeetingStatus(data) {
        console.log('📊 [SOCKET] Voice meeting status received:', data);
        
        // ChannelVoiceParticipants now handles socket events directly
        // Only update the channel count if instance exists and method is available
        if (window.ChannelVoiceParticipants && data.participant_count !== undefined) {
            const instance = window.ChannelVoiceParticipants.getInstance();
            if (instance && typeof instance.updateChannelCount === 'function') {
                instance.updateChannelCount(data.channel_id, data.participant_count);
            }
        }
    }

    handleVoiceMeetingUpdate(data) {
        console.log('🔄 [VOICE-SOCKET] Voice meeting update received:', data);
        
        if (data.action === 'leave' && data.user_id == this.userId) {
            console.log('⚠️ [VOICE-VALIDATION] Received leave event for current user, validating actual connection state...');
            
            const isVideoSDKConnected = window.videoSDKManager?.isConnected || false;
            const isVoiceManagerConnected = window.voiceManager?.isConnected || false;
            const isUnifiedStateConnected = window.unifiedVoiceStateManager?.isConnected() || false;
            
            console.log('🔍 [VOICE-VALIDATION] Connection state check:', {
                videoSDK: isVideoSDKConnected,
                voiceManager: isVoiceManagerConnected,
                unifiedState: isUnifiedStateConnected,
                socketEvent: data.action
            });
            
            if (isVideoSDKConnected || isVoiceManagerConnected || isUnifiedStateConnected) {
                console.log('🛡️ [VOICE-PROTECTION] User is actually still connected to voice, ignoring spurious leave event');
                console.log('✅ [VOICE-PROTECTION] Maintaining voice call presence protection');
                
                if (!this.currentActivityDetails?.type?.startsWith('In Voice - ')) {
                    console.log('🔧 [VOICE-PROTECTION] Restoring voice call presence status');
                    const channelName = window.voiceManager?.currentChannelName || 
                                       data.channel_name || 
                                       document.querySelector('.voice-channel-title')?.textContent || 
                                       'Voice Channel';
                    
                    this.updatePresence('online', {
                        type: `In Voice - ${channelName}`,
                        channel_id: data.channel_id || window.voiceManager?.currentChannelId,
                        server_id: data.server_id,
                        channel_name: channelName
                    });
                }
                
                return;
            } else {
                console.log('✅ [VOICE-VALIDATION] Leave event confirmed - user is actually disconnected');
            }
        }
        
        console.log('✅ [VOICE-SOCKET] Voice update forwarded to ChannelVoiceParticipants via direct socket listeners');
    }
}

const globalSocketManager = new GlobalSocketManager();

window.GlobalSocketManager = GlobalSocketManager;
window.globalSocketManager = globalSocketManager;

export { GlobalSocketManager, globalSocketManager };
export default globalSocketManager;