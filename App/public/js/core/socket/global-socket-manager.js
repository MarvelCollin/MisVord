class GlobalSocketManager {
    constructor() {
        this.io = null;
        this.connected = false;
        this.authenticated = false;
        this.userId = null;
        this.username = null;
        this.socketHost = null;
        this.socketPort = null;
        this.lastError = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
        this.joinedChannels = new Set();
        this.joinedDMRooms = new Set();
    }
    
    init(userData = null) {
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
        this.socketHost = document.querySelector('meta[name="socket-host"]')?.content || 'localhost';
        this.socketPort = document.querySelector('meta[name="socket-port"]')?.content || '1002';
        this.userId = document.querySelector('meta[name="user-id"]')?.content;
        this.username = document.querySelector('meta[name="username"]')?.content;
        
        this.log(`Socket details loaded - Host: ${this.socketHost}, Port: ${this.socketPort}`);
    }
    
    connect() {
        if (this.io && this.connected) {
            this.log('Socket already connected');
            return;
        }
        
        const socketUrl = `http://${this.socketHost}:${this.socketPort}`;
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
                reconnectionAttempts: 5
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
            
            const event = new CustomEvent('globalSocketReady', {
                detail: {
                    manager: this,
                    socketId: this.io.id
                }
            });
            
            window.dispatchEvent(event);
            
            if (this.userId && this.username) {
                this.authenticate();
            }
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
        
        this.io.on('auth-success', (data) => {
            this.authenticated = true;
            this.log('Authentication successful', data);
            
            window.dispatchEvent(new CustomEvent('socketAuthenticated', {
                detail: {
                    manager: this,
                    userId: data.userId,
                    socketId: data.socketId
                }
            }));
        });
        
        this.io.on('auth-error', (error) => {
            this.authenticated = false;
            this.error('Authentication error', error);
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
    
    authenticate() {
        if (!this.connected || !this.io) {
            this.error('Cannot authenticate: socket not connected');
            return false;
        }
        
        if (!this.userId) {
            this.error('Cannot authenticate: user ID not available');
            return false;
        }
        
        this.log(`Authenticating user: ${this.userId} (${this.username || 'Unknown'})`);
        
        this.io.emit('authenticate', {
            userId: this.userId,
            username: this.username || `User-${this.userId}`
        });
        
        return true;
    }
    
    joinChannel(channelId) {
        if (!this.isReady()) {
            this.error('Cannot join channel: socket not ready');
            return false;
        }
        
        if (this.joinedChannels.has(channelId)) {
            this.log(`Already joined channel: ${channelId}`);
            return true;
        }
        
        this.log(`Joining channel: ${channelId}`);
        this.io.emit('join-channel', { channelId });
        this.joinedChannels.add(channelId);
        return true;
    }
    
    leaveChannel(channelId) {
        if (!this.isReady()) return false;
        
        this.log(`Leaving channel: ${channelId}`);
        this.io.emit('leave-channel', { channelId });
        this.joinedChannels.delete(channelId);
        return true;
    }
    
    joinDMRoom(roomId) {
        if (!this.isReady()) {
            this.error('Cannot join DM room: socket not ready');
            return false;
        }
        
        if (this.joinedDMRooms.has(roomId)) {
            this.log(`Already joined DM room: ${roomId}`);
            return true;
        }
        
        this.log(`Joining DM room: ${roomId}`);
        this.io.emit('join-dm-room', { roomId });
        this.joinedDMRooms.add(roomId);
        return true;
    }
    
    sendTyping(channelId = null, roomId = null) {
        if (!this.isReady()) return false;
        
        if (channelId) {
            this.io.emit('typing', { channelId });
        } else if (roomId) {
            this.io.emit('typing', { roomId });
        }
        
        return true;
    }
    
    sendStopTyping(channelId = null, roomId = null) {
        if (!this.isReady()) return false;
        
        if (channelId) {
            this.io.emit('stop-typing', { channelId });
        } else if (roomId) {
            this.io.emit('stop-typing', { roomId });
        }
        
        return true;
    }
    
    updatePresence(status, activityDetails = null) {
        if (!this.isReady()) return false;
        
        this.io.emit('update-presence', { 
            status, 
            activityDetails 
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
        this.log('Socket manually disconnected');
    }
    
    isReady() {
        return this.connected && this.authenticated && this.io !== null;
    }
    
    setupChannelListeners(channelId) {
        if (!this.isReady()) {
            console.warn('Socket not ready, cannot setup channel listeners');
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
            if (messageData && messageData.channelId === channelId) {
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
            if (data.channelId === channelId) {
                const event = new CustomEvent('userTyping', {
                    detail: data
                });
                window.dispatchEvent(event);
                
                if (window.chatSection && typeof window.chatSection.showTypingIndicator === 'function') {
                    window.chatSection.showTypingIndicator(data.userId, data.username);
                }
            }
        });
        
        this.io.on('user-stop-typing', (data) => {
            if (data.channelId === channelId) {
                const event = new CustomEvent('userStopTyping', {
                    detail: data
                });
                window.dispatchEvent(event);
                
                if (window.chatSection && typeof window.chatSection.removeTypingIndicator === 'function') {
                    window.chatSection.removeTypingIndicator(data.userId);
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
            joinedDMRooms: Array.from(this.joinedDMRooms)
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
}

const globalSocketManager = new GlobalSocketManager();

document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('meta[name="user-authenticated"]')?.content === 'true') {
        setTimeout(() => {
            if (!globalSocketManager.connected) {
                globalSocketManager.init();
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