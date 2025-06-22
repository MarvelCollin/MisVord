class GlobalSocketManager {
    constructor() {
        this.socket = null;
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
    }
    
    init() {
        this.loadConnectionDetails();
        
        if (!this.socketHost || !this.socketPort) {
            this.error('Socket connection details not found');
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
        if (this.socket && this.connected) {
            this.log('Socket already connected');
            return;
        }
        
        const socketUrl = `http://${this.socketHost}:${this.socketPort}`;
        this.log(`Connecting to socket: ${socketUrl}`);
        
        try {
            this.socket = io(socketUrl, {
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
        if (!this.socket) return;
        
        this.socket.on('connect', () => {
            this.connected = true;
            this.reconnectAttempts = 0;
            this.log(`Socket connected: ${this.socket.id}`);
            
            const event = new CustomEvent('globalSocketReady', {
                detail: {
                    manager: this,
                    socketId: this.socket.id
                }
            });
            
            window.dispatchEvent(event);
            
            if (this.userId && this.username) {
                this.authenticate();
            }
        });
        
        this.socket.on('disconnect', () => {
            this.connected = false;
            this.authenticated = false;
            this.log('Socket disconnected');
            
            window.dispatchEvent(new Event('globalSocketDisconnected'));
        });
        
        this.socket.on('connect_error', (error) => {
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
        
        this.socket.on('auth-success', (data) => {
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
        
        this.socket.on('auth-error', (error) => {
            this.authenticated = false;
            this.error('Authentication error', error);
        });
        
        this.socket.on('error', (error) => {
            this.error('Socket error', error);
        });
    }
    
    authenticate() {
        if (!this.connected || !this.socket) {
            this.error('Cannot authenticate: socket not connected');
            return false;
        }
        
        if (!this.userId) {
            this.error('Cannot authenticate: user ID not available');
            return false;
        }
        
        this.log(`Authenticating user: ${this.userId} (${this.username || 'Unknown'})`);
        
        this.socket.emit('authenticate', {
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
        
        this.log(`Joining channel: ${channelId}`);
        this.socket.emit('join-channel', { channelId });
        return true;
    }
    
    leaveChannel(channelId) {
        if (!this.isReady()) return false;
        
        this.log(`Leaving channel: ${channelId}`);
        this.socket.emit('leave-channel', { channelId });
        return true;
    }
    
    joinDMRoom(roomId) {
        if (!this.isReady()) {
            this.error('Cannot join DM room: socket not ready');
            return false;
        }
        
        this.log(`Joining DM room: ${roomId}`);
        this.socket.emit('join-dm-room', { roomId });
        return true;
    }
    
    sendTyping(channelId = null, roomId = null) {
        if (!this.isReady()) return false;
        
        if (channelId) {
            this.socket.emit('typing', { channelId });
        } else if (roomId) {
            this.socket.emit('typing', { roomId });
        }
        
        return true;
    }
    
    sendStopTyping(channelId = null, roomId = null) {
        if (!this.isReady()) return false;
        
        if (channelId) {
            this.socket.emit('stop-typing', { channelId });
        } else if (roomId) {
            this.socket.emit('stop-typing', { roomId });
        }
        
        return true;
    }
    
    updatePresence(status, activityDetails = null) {
        if (!this.isReady()) return false;
        
        this.socket.emit('update-presence', { 
            status, 
            activityDetails 
        });
        
        return true;
    }
    
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        
        this.connected = false;
        this.authenticated = false;
        this.log('Socket manually disconnected');
    }
    
    isReady() {
        return this.socket && this.connected && this.authenticated;
    }
    
    getStatus() {
        return {
            connected: this.connected,
            authenticated: this.authenticated,
            socketId: this.socket?.id,
            userId: this.userId,
            username: this.username,
            isGuest: !this.userId,
            lastError: this.lastError
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

export default globalSocketManager; 