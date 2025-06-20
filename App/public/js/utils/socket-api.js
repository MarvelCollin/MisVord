class SocketApi {
    constructor() {
        // Use the global socket manager instead of HTTP requests
        this.globalSocketManager = null;
        this.socket = null;
        this.isReady = false;
        
        // Initialize connection to global socket manager
        this.initializeConnection();
    }    initializeConnection() {
        // Check if global socket manager is available and ready, or if we're in guest mode
        if (window.globalSocketManager) {
            if (window.globalSocketManager.isGuest) {
                // Skip socket initialization for guest users
                this.isReady = false;
                return;
            }
            if (window.globalSocketManager.isReady()) {
                this.globalSocketManager = window.globalSocketManager;
                this.socket = this.globalSocketManager.socket;
                this.isReady = true;
                return;
            }
        }        // Wait for global socket manager to be ready
        window.addEventListener('misVordGlobalReady', (event) => {
            if (event.detail.socketManager.isGuest) {
                // Skip for guest users
                this.isReady = false;
                return;
            }
            this.globalSocketManager = event.detail.socketManager;
            this.socket = this.globalSocketManager.socket;
            this.isReady = true;
        });        // Fallback: check periodically
        const checkConnection = () => {
            if (window.globalSocketManager) {
                if (window.globalSocketManager.isGuest) {
                    // Stop checking for guest users
                    this.isReady = false;
                    return;
                }
                if (window.globalSocketManager.isReady()) {
                    this.globalSocketManager = window.globalSocketManager;
                    this.socket = this.globalSocketManager.socket;
                    this.isReady = true;
                    return;
                }
            }
            setTimeout(checkConnection, 100);
        };
        
        setTimeout(checkConnection, 100);
    }    async emit(event, data, room = null) {
        try {
            if (!this.isReady || !this.socket) {
                console.warn('Socket API not ready, queuing event:', event);
                return { success: false, error: 'Socket not ready' };
            }

            if (room) {
                // For room-specific events, emit to the room
                const payload = {
                    ...data,
                    room,
                    timestamp: new Date().toISOString()
                };
                
                // Emit to specific room via the server
                this.socket.emit('room-event', {
                    room,
                    event,
                    data: payload
                });
            } else {
                // For general events, emit directly
                const payload = {
                    ...data,
                    timestamp: new Date().toISOString()
                };
                
                this.socket.emit(event, payload);
            }
            
            return { success: true };
        } catch (error) {
            console.error('Socket API emit error:', error);
            return { success: false, error: error.message };
        }
    }

    async notifyUser(userId, event, data) {
        try {
            if (!this.isReady || !this.socket) {
                console.warn('Socket API not ready, queuing notify user:', event);
                return { success: false, error: 'Socket not ready' };
            }

            const payload = {
                user_id: userId,
                event,
                data,
                timestamp: new Date().toISOString()
            };

            // Use WebSocket to notify specific user
            this.socket.emit('notify-user', payload);
            
            return { success: true };
        } catch (error) {
            console.error('Socket API notify user error:', error);
            return { success: false, error: error.message };
        }
    }

    async broadcast(event, data) {
        try {
            if (!this.isReady || !this.socket) {
                console.warn('Socket API not ready, queuing broadcast:', event);
                return { success: false, error: 'Socket not ready' };
            }

            const payload = {
                event,
                data,
                timestamp: new Date().toISOString()
            };

            // Use WebSocket to broadcast to all connected users
            this.socket.emit('broadcast', payload);
            
            return { success: true };
        } catch (error) {
            console.error('Socket API broadcast error:', error);
            return { success: false, error: error.message };
        }
    }

    async broadcastToServer(serverId, event, data) {
        return this.emit(event, data, `server-${serverId}`);
    }

    async broadcastToChannel(channelId, event, data) {
        return this.emit(event, data, `channel-${channelId}`);
    }

    async updateUserStatus(userId, status, activityDetails = null) {
        const data = {
            user_id: userId,
            status,
            timestamp: new Date().toISOString()
        };

        if (activityDetails !== null) {
            data.activity_details = activityDetails;
        }

        return this.broadcast('user-presence-changed', data);
    }

    async notifyTyping(channelId, userId, username, isTyping = true) {
        const event = isTyping ? 'typing-start' : 'typing-stop';
        
        return this.broadcastToChannel(channelId, event, {
            user_id: userId,
            username,
            channel_id: channelId,
            timestamp: new Date().toISOString()
        });
    }

    async notifyReaction(channelId, messageId, userId, username, reaction) {
        return this.broadcastToChannel(channelId, 'reaction-added', {
            message_id: messageId,
            user_id: userId,
            username,
            reaction,
            channel_id: channelId,
            timestamp: new Date().toISOString()
        });
    }
}

const socketApi = new SocketApi();
export default socketApi; 