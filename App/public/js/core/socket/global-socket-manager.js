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
        if (window.__SOCKET_INITIALISED__) {
            return false;
        }
        window.__SOCKET_INITIALISED__ = true;
        
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
        
        if (typeof io === 'undefined') {
            this.error('Socket.io library not available, skipping connection');
            return false;
        }
        
        try {
            this.connect();
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
            return;
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
            this.log(`Socket connected: ${this.io.id}`);
            
            this.sendAuthentication();
        });
        
        this.io.on('auth-success', (data) => {
            this.authenticated = true;
            this.log(`Socket authenticated successfully:`, data);
            
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
            this.authenticated = false;
            this.error('Socket authentication failed:', data);
        });
        
        this.io.on('channel-joined', (data) => {
            this.log(`Channel joined confirmation: ${data.channel_id}`);
            this.joinedChannels.add(data.channel_id);
            this.joinedRooms.add(`channel-${data.channel_id}`);
        });
        
        this.io.on('dm-room-joined', (data) => {
            this.log(`DM room joined confirmation: ${data.room_id}`);
            this.joinedDMRooms.add(data.room_id);
            this.joinedRooms.add(`dm-room-${data.room_id}`);
        });
        
        this.io.on('room-joined', (data) => {
            this.log(`Room joined confirmation: ${data.room_type} - ${data.room_id}`);
            
            const roomPrefix = data.room_type === 'channel' ? 'channel-' : 'dm-room-';
            const roomId = `${roomPrefix}${data.room_id}`;
            
            if (data.room_type === 'channel') {
                this.joinedChannels.add(data.room_id);
            } else if (data.room_type === 'dm') {
                this.joinedDMRooms.add(data.room_id);
            }
            
            this.joinedRooms.add(roomId);
        });
        
        this.io.on('disconnect', () => {
            this.connected = false;
            this.authenticated = false;
            this.log('Socket disconnected');
            
            window.dispatchEvent(new Event('globalSocketDisconnected'));
        });
        
        this.io.on('connect_error', (error) => {
            this.error('Socket connection error', error);
            this.lastError = error;
            this.reconnectAttempts++;
            
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
        
        this.io.on('user-message-dm', (data) => {
            this.log(`💬 GlobalSocketManager: Received DM message:`, data);
            
            const event = new CustomEvent('newDMMessage', {
                detail: data
            });
            window.dispatchEvent(event);
        });
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
        console.log(`📺 [SOCKET] Joining channel ${channelId}`);
        
        if (!this.isReady()) {
            console.warn('⚠️ [SOCKET] Cannot join channel - socket not ready');
            return false;
        }
        
        if (!channelId) {
            console.warn('⚠️ [SOCKET] Cannot join channel - no channel ID provided');
            return false;
        }
        
        const roomName = `channel-${channelId}`;
        this.io.emit('join-room', { room_type: 'channel', room_id: channelId });
        this.joinedChannels.add(roomName);
        
        console.log(`✅ [SOCKET] Joined channel ${channelId}`);
        return true;
    }
    
    leaveChannel(channelId) {
        if (!this.connected || !this.io || !this.authenticated) return false;
        
        this.log(`Leaving channel: ${channelId}`);
        this.io.emit('leave-channel', { channel_id: channelId });
        this.joinedChannels.delete(channelId);
        return true;
    }
    
    joinDMRoom(roomId) {
        if (!this.connected || !this.io || !this.authenticated) {
            this.error('Cannot join DM room: socket not connected or not authenticated', {
                connected: this.connected,
                authenticated: this.authenticated,
                hasSocket: !!this.io
            });
            return false;
        }
        
        if (this.joinedDMRooms.has(roomId)) {
            this.log(`Already joined DM room: ${roomId}`);
            return true;
        }
        
        this.log(`Joining DM room: ${roomId}`);
        this.io.emit('join-dm-room', { room_id: roomId });
        this.joinedDMRooms.add(roomId);
        return true;
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
        this.io.emit('join-room', { room_type: roomType, room_id: roomId });
        
        // Track joined rooms consistently
        this.joinedRooms.add(roomName);
        
        console.log(`✅ [SOCKET] Joined ${roomType} room: ${roomName}`);
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
        if (!this.connected || !this.io) {
            console.error('❌ [SOCKET] Cannot emit - socket not connected:', {
                connected: this.connected,
                ioExists: !!this.io,
                authenticated: this.authenticated,
                socketId: this.io?.id
            });
            return false;
        }

        console.log(`📤 [SOCKET] Preparing to emit ${eventName}:`, {
            roomType,
            roomId,
            eventName,
            dataId: data.id,
            messageId: data.message_id,
            userId: data.user_id,
            timestamp: Date.now(),
            socketState: {
                connected: this.connected,
                authenticated: this.authenticated,
                socketId: this.io.id,
                joinedRooms: Array.from(this.joinedRooms)
            }
        });

        // Validate room format
        const roomPrefix = roomType === 'channel' ? 'channel-' : 'dm-room-';
        const targetRoom = `${roomPrefix}${roomId}`;

        // Ensure we're in the room
        if (!this.isInRoom(targetRoom)) {
            console.warn(`⚠️ [SOCKET] Not in room ${targetRoom}, attempting to join...`);
            this.joinRoom(roomType, roomId);
        }

        // Add room information to data
        const enrichedData = {
            ...data,
            room_type: roomType,
            room_id: roomId,
            source: data.source || 'client-originated',
            timestamp: data.timestamp || Date.now()
        };

        // Add type-specific fields
        if (roomType === 'channel') {
            enrichedData.channel_id = roomId;
        }

        console.log(`📤 [SOCKET] Emitting ${eventName} to ${roomType} room ${targetRoom}:`, {
            id: enrichedData.id,
            messageId: enrichedData.message_id,
            content: enrichedData.content?.substring(0, 50) + (enrichedData.content?.length > 50 ? '...' : ''),
            userId: enrichedData.user_id,
            username: enrichedData.username,
            source: enrichedData.source,
            timestamp: enrichedData.timestamp
        });

        try {
            this.io.emit(eventName, enrichedData);
            
            console.log(`✅ [SOCKET] Successfully emitted ${eventName}:`, {
                room: targetRoom,
                eventName,
                dataId: enrichedData.id,
                messageId: enrichedData.message_id,
                timestamp: Date.now()
            });
            
            return true;
        } catch (error) {
            console.error(`❌ [SOCKET] Error emitting ${eventName}:`, {
                error: error.message,
                stack: error.stack,
                room: targetRoom,
                eventName,
                timestamp: Date.now()
            });
            return false;
        }
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
                
                if (window.chatSection && typeof window.chatSection.addMessage === 'function') {
                    window.chatSection.addMessage(messageData);
                }
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
        if (typeof window !== 'undefined' && window.logger) {
            window.logger.info('socket', ...args);
        } else {
            console.log('[SOCKET]', ...args);
        }
    }
    
    error(...args) {
        if (typeof window !== 'undefined' && window.logger) {
            window.logger.error('socket', ...args);
        } else {
            console.error('[SOCKET ERROR]', ...args);
        }
    }
    
    isInRoom(roomId) {
        return this.joinedRooms.has(roomId);
    }
}

const globalSocketManager = new GlobalSocketManager();

document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('meta[name="user-authenticated"]')?.content === 'true') {
        setTimeout(() => {
            if (!globalSocketManager.connected) {
                // Try multiple sources for user data
                let userId = document.querySelector('meta[name="user-id"]')?.content;
                let username = document.querySelector('meta[name="username"]')?.content;
                
                // Fallback to body/container attributes
                if (!userId) {
                    userId = document.body?.getAttribute('data-user-id') || 
                             document.querySelector('[data-user-id]')?.getAttribute('data-user-id');
                }
                if (!username) {
                    username = document.body?.getAttribute('data-username') || 
                               document.querySelector('[data-username]')?.getAttribute('data-username');
                }
                
                const userData = { user_id: userId, username: username };
                
                if (userData.user_id && userData.username) {
                    console.log('🔌 Initializing socket with user data:', userData);
                    globalSocketManager.init(userData);
                } else {
                    console.error('❌ No user data found for socket initialization:', {
                        metaUserId: document.querySelector('meta[name="user-id"]')?.content,
                        metaUsername: document.querySelector('meta[name="username"]')?.content,
                        bodyUserId: document.body?.getAttribute('data-user-id'),
                        bodyUsername: document.body?.getAttribute('data-username'),
                        containerUserId: document.querySelector('[data-user-id]')?.getAttribute('data-user-id'),
                        containerUsername: document.querySelector('[data-username]')?.getAttribute('data-username')
                    });
                    globalSocketManager.init();
                }
            }
        }, 500);
    } else if (localStorage.getItem('connect_socket_on_login') === 'true') {
        localStorage.removeItem('connect_socket_on_login');
        
        const checkAuthenticated = setInterval(() => {
            if (document.querySelector('meta[name="user-authenticated"]')?.content === 'true') {
                clearInterval(checkAuthenticated);
                globalSocketManager.init();
            }
        }, 500);
        
        setTimeout(() => {
            clearInterval(checkAuthenticated);
        }, 10000);
    }
});

window.GlobalSocketManager = GlobalSocketManager;
window.globalSocketManager = globalSocketManager;

export { GlobalSocketManager, globalSocketManager };
export default globalSocketManager; 