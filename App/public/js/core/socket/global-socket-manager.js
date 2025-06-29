class GlobalSocketManager {
    constructor() {
        this.io = null;
        this.connected = false;
        this.authenticated = false;
        this.userId = null;
        this.username = null;
        this.socketHost = null;
        this.socketPort = null;
        this.socketSecure = false;
        this.lastError = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = Infinity;
        this.reconnectDelay = 3000;
        this.joinedChannels = new Set();
        this.joinedDMRooms = new Set();
        this.joinedRooms = new Set();
    }
    
    init(userData = null) {
        // Avoid double-initialization *only* if we already have an active socket
        if (window.__SOCKET_INITIALISED__ && this.connected) {
            return false;
        }

        if (userData) {
            this.userId = userData.user_id;
            this.username = userData.username;
        }

        this.loadConnectionDetails();

        if (!this.socketHost || !this.socketPort) {
            this.error('Socket connection details not found');
            return false;
        }

        const isAuthPage = document.body && document.body.getAttribute('data-page') === 'auth';
        if (isAuthPage) {
            this.log('Auth page detected, socket initialization skipped');
            return false;
        }

        // Make sure socket.io library is present; if not we'll let the caller try again later
        if (typeof io === 'undefined') {
            this.error('Socket.io library not yet loaded (io undefined) – deferring initialization');
            return false;
        }

        try {
            const connected = this.connect();
            if (connected !== false) {
                window.__SOCKET_INITIALISED__ = true;
            }
            return true;
        } catch (e) {
            this.error('Failed to initialize socket', e);
            return false;
        }
    }
    
    loadConnectionDetails() {
        // Force connection details to localhost:1002
        this.socketHost = 'localhost';
        this.socketPort = '1002';
        this.socketSecure = false;
        
        // Try multiple sources for user data
        let metaUserId = document.querySelector('meta[name="user-id"]')?.content;
        let metaUsername = document.querySelector('meta[name="username"]')?.content;
        
        // Fallback to body attributes if meta tags don't exist
        if (!metaUserId) {
            metaUserId = document.body?.getAttribute('data-user-id');
        }
        if (!metaUsername) {
            metaUsername = document.body?.getAttribute('data-username');
        }
        
        // Additional fallback to window globals if they exist
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
        if (this.io && this.connected) {
            this.log('Socket already connected');
            return true;
        }
        
        // Simple hardcoded connection
        const socketUrl = 'http://localhost:1002';
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
                reconnectionAttempts: 10
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
            this.connected = true;
            this.reconnectAttempts = 0;
            this.debug(`Socket connected with ID: ${this.io.id}`, { 
                userId: this.userId,
                socketId: this.io.id,
                reconnectAttempts: this.reconnectAttempts
            });
            
            // Send authentication immediately after connection
            this.sendAuthentication();
        });
        
        // Add debug-test-response handler
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
        
        // Handle authentication success
        this.io.on('auth-success', (data) => {
            this.authenticated = true;
            this.debug(`Socket authenticated successfully`, {
                userId: this.userId,
                username: this.username,
                socketId: this.io.id,
                data: data
            });
            
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
        
        // Handle authentication error
        this.io.on('auth-error', (data) => {
            this.authenticated = false;
            this.error('Socket authentication failed:', data);
            this.debug('Authentication error details', {
                userId: this.userId,
                username: this.username,
                socketId: this.io.id,
                errorData: data
            });
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
            this.connected = false;
            this.authenticated = false;
            this.debug('Socket disconnected', {
                previousSocketId: this.io.id,
                wasAuthenticated: this.authenticated,
                joinedRooms: Array.from(this.joinedRooms)
            });
            
            window.dispatchEvent(new Event('globalSocketDisconnected'));
        });
        
        this.io.on('connect_error', (error) => {
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
        
        // NOTE: Message events are now handled by individual component socket-handlers
        // Removed duplicate listeners for 'user-message-dm' and 'new-channel-message'
        // to prevent double message processing
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
        
        const authData = {
            user_id: this.userId,
            username: this.username
        };
        
        this.log('Sending authentication to socket server:', authData);
        this.io.emit('authenticate', authData);
        return true;
    }
    
    authenticate() {
        return this.sendAuthentication();
    }
    
    joinChannel(channelId) {
        if (!this.io || !this.connected || !this.authenticated) {
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
        if (!this.connected || !this.io || !this.authenticated) return false;
        
        this.log(`Leaving channel: ${channelId}`);
        this.io.emit('leave-channel', { channel_id: channelId });
        this.joinedChannels.delete(channelId);
        return true;
    }
    
    joinDMRoom(roomId) {
        if (!this.io || !this.connected || !this.authenticated) {
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
        if (!this.connected || !this.io) return false;
        
        this.io.emit('update-presence', { 
            status, 
            activity_details: activityDetails 
        });
        
        return true;
    }
    
    disconnect() {
        if (this.io) {
            this.io.disconnect();
            this.io = null;
        }
        
        this.connected = false;
        this.authenticated = false;
        this.joinedChannels.clear();
        this.joinedDMRooms.clear();
        this.joinedRooms.clear();
        this.log('Socket manually disconnected');
    }
    
    isReady() {
        return this.connected && this.authenticated && this.io !== null;
    }
    
    setupChannelListeners(channelId) {
        if (!this.connected || !this.io) {
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
            connected: this.connected,
            authenticated: this.authenticated,
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
            console.error(`%c[SOCKET ERROR ${timestamp}]`, 'color: #F44336; font-weight: bold;', ...args);
        }
    }
}

const globalSocketManager = new GlobalSocketManager();

document.addEventListener('DOMContentLoaded', function() {
    // Always attempt socket initialization, even for guests or unauthenticated pages.
    setTimeout(() => {
        if (globalSocketManager.connected) return;

        // Gather any user data we may have (may be null for guests)
        let userId = document.querySelector('meta[name="user-id"]')?.content ||
                     document.body?.getAttribute('data-user-id') ||
                     document.querySelector('[data-user-id]')?.getAttribute('data-user-id');

        let username = document.querySelector('meta[name="username"]')?.content ||
                       document.body?.getAttribute('data-username') ||
                       document.querySelector('[data-username]')?.getAttribute('data-username');

        const hasAuthData = userId && username;
        const userData = hasAuthData ? { user_id: userId, username: username } : null;

        if (hasAuthData) {
            console.log('🔌 Initializing socket with user data:', userData);
        } else {
            console.log('🔌 Initializing socket in guest mode (no auth data found)');
        }

        globalSocketManager.init(userData);
    }, 500);
});

window.GlobalSocketManager = GlobalSocketManager;
window.globalSocketManager = globalSocketManager;

export { GlobalSocketManager, globalSocketManager };
export default globalSocketManager; 