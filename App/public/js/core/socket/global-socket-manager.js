import socketClient from './socket-client.js';
import socketApi from '../../utils/socket-api.js';
import { showToast } from '../ui/toast.js';

/**
 * GlobalSocketManager
 * Manages WebSocket connections and events for the MisVord application
 */
class GlobalSocketManager {
    constructor() {
        this.config = {
            socketPort: 1002,
            socketPath: '/socket.io',
            reconnectAttempts: 5,
            reconnectDelay: 1000,
            heartbeatInterval: 20000,
            debug: true
        };

        this.socket = null;
        this.connected = false;
        this.authenticated = false;
        this.reconnectAttempts = 0;
        this.initialized = false;

        this.userId = null;
        this.username = null;
        this.currentPage = window.location.pathname;
        this.sessionStartTime = Date.now();

        this.activityLog = [];
        this.connectionHistory = [];
        this.presenceData = {
            status: 'online',
            activity: null,
            lastSeen: Date.now()
        };
        this.debug = this.config.debug;
        this.isGuest = false;

        this.eventHandlers = {};
        
        this.currentUser = null;
        this.activeChannels = new Set();

        // Register globally for legacy code
        if (!window.GlobalSocketManager) {
            try {
                window.GlobalSocketManager = this;
            } catch (error) {
                this.error('Could not assign to window.GlobalSocketManager:', error);
            }
        }
    }

    /**
     * Initialize the socket manager
     * @param {Object} userData - User data for authentication
     * @returns {Promise} - Resolves when initialization is complete
     */
    init(userData = null) {
        if (this.initialized) {
            this.log('Already initialized, skipping duplicate initialization');
            return Promise.resolve();
        }
        if (!userData || !userData.user_id) {
            this.log('Guest user detected, socket connection disabled');
            this.isGuest = true;
            return Promise.resolve();
        }

        this.userId = userData.user_id;
        this.username = userData.username;

        this.log('Initializing global WebSocket connection for user:', this.username);
        this.logSystemInfo();

        return this.initSocket()
            .then(() => {
                this.initPresenceTracking();
                this.initActivityTracking();

                setInterval(() => this.sendHeartbeat(), this.config.heartbeatInterval);

                this.log('✅ Global socket manager initialized successfully');
                this.initialized = true;

                this.dispatchEvent('globalSocketReady', { manager: this });

                return this.initialized;
            })
            .catch(error => {
                this.error('❌ Failed to initialize global socket manager:', error);
                this.trackError('GLOBAL_INIT_FAILED', error);
                throw error;
            });
    }

    initSocket() {
        if (typeof io === 'undefined') {
            throw new Error('Socket.IO not available');
        }

        this.log('🔌 Connecting to WebSocket server...');

        this.socket = io(`http://localhost:${this.config.socketPort}`, {
            path: this.config.socketPath,
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: this.config.reconnectAttempts,
            reconnectionDelay: this.config.reconnectDelay,
            timeout: 20000
        });

        this.setupSocketEventHandlers();

        return Promise.resolve();
    }

    setupSocketEventHandlers() {
        this.socket.on('connect', () => {
            this.log('🟢 Connected to WebSocket server');
            this.connected = true;
            this.reconnectAttempts = 0;
            this.trackConnection('CONNECTED');
            this.authenticate();
            this.updatePresence('online');
        });

        this.socket.on('disconnect', (reason) => {
            this.log('🔴 Disconnected from WebSocket server:', reason);
            this.connected = false;
            this.authenticated = false;
            this.trackConnection('DISCONNECTED', { reason });
        });

        this.socket.on('connect_error', (error) => {
            this.error('🔴 Connection error:', error);
            this.trackConnection('CONNECTION_ERROR', { error: error.message });
        });

        this.socket.on('authenticated', (data) => {
            this.log('✅ User authenticated:', data);
            this.authenticated = true;
            this.trackConnection('AUTHENTICATED', data);
        });

        this.socket.on('authentication-failed', (data) => {
            this.error('❌ Authentication failed:', data);
            this.authenticated = false;
            this.trackConnection('AUTH_FAILED', data);
        });        this.socket.on('user-presence-changed', (data) => {
            this.log('👤 User presence changed:', data);
            this.dispatchEvent('userPresenceChanged', data);
        });

        this.socket.on('user-activity-changed', (data) => {
            this.log('🏃 User activity changed:', data);
            this.dispatchEvent('userActivityChanged', data);
            
            if (data.user_id !== this.userId) {
                const activityText = data.activity_details ? `is ${data.activity_details}` : 'changed activity';
                showToast(`${data.username} ${activityText}`);
            }
        });

        this.socket.on('user-activity', (data) => {
            this.log('🏃 User activity:', data);
            this.dispatchEvent('userActivity', data);
        });

        this.socket.on('message-received', (data) => {
            this.log('💬 Message received:', data);
            this.dispatchEvent('messageReceived', data);
        });

        this.socket.on('typing-start', (data) => {
            this.dispatchEvent('typingStart', data);
        });

        this.socket.on('typing-stop', (data) => {
            this.dispatchEvent('typingStop', data);
        });

        this.socket.on('group-server-created', (data) => {
            this.log('📁 Group server created:', data);
            this.dispatchEvent('groupServerCreated', data);
            showToast(`New server created: ${data.server_name}`);
        });

        this.socket.on('group-server-updated', (data) => {
            this.log('📝 Group server updated:', data);
            this.dispatchEvent('groupServerUpdated', data);
            showToast(`Server updated: ${data.server_name}`);
        });

        this.socket.on('group-server-deleted', (data) => {
            this.log('🗑️ Group server deleted:', data);
            this.dispatchEvent('groupServerDeleted', data);
            showToast(`Server deleted: ${data.server_name}`);
        });

        this.socket.on('role-created', (data) => {
            this.log('👑 Role created:', data);
            this.dispatchEvent('roleCreated', data);
            showToast(`New role created: ${data.role.name}`);
        });

        this.socket.on('role-updated', (data) => {
            this.log('👑 Role updated:', data);
            this.dispatchEvent('roleUpdated', data);
            showToast(`Role updated: ${data.role.name}`);
        });

        this.socket.on('role-deleted', (data) => {
            this.log('👑 Role deleted:', data);
            this.dispatchEvent('roleDeleted', data);
            showToast(`Role deleted: ${data.role_name}`);
        });

        this.socket.on('user-role-assigned', (data) => {
            this.log('👤 User role assigned:', data);
            this.dispatchEvent('userRoleAssigned', data);
            
            if (data.user_id === this.userId) {
                showToast(`You received the ${data.role_name} role`);
            }
        });

        this.socket.on('user-role-removed', (data) => {
            this.log('👤 User role removed:', data);
            this.dispatchEvent('userRoleRemoved', data);
            
            if (data.user_id === this.userId) {
                showToast(`Your ${data.role_name} role was removed`);
            }
        });

        this.socket.on('emoji-created', (data) => {
            this.log('😀 Emoji created:', data);
            this.dispatchEvent('emojiCreated', data);
            showToast(`New emoji added: ${data.emoji.name}`);
        });

        this.socket.on('emoji-updated', (data) => {
            this.log('😀 Emoji updated:', data);
            this.dispatchEvent('emojiUpdated', data);
        });

        this.socket.on('emoji-deleted', (data) => {
            this.log('😀 Emoji deleted:', data);
            this.dispatchEvent('emojiDeleted', data);
        });

        this.socket.on('reaction-added', (data) => {
            this.log('👍 Reaction added:', data);
            this.dispatchEvent('reactionAdded', data);
        });

        this.socket.on('reaction-removed', (data) => {
            this.log('👎 Reaction removed:', data);
            this.dispatchEvent('reactionRemoved', data);
        });

        // Friend events
        this.socket.on('friend-request-received', (data) => {
            this.log('👋 Friend request received:', data);
            this.dispatchEvent('friendRequestReceived', data);
            showToast(`${data.sender_username} sent you a friend request!`);
        });

        this.socket.on('friend-request-accepted', (data) => {
            this.log('✅ Friend request accepted:', data);
            this.dispatchEvent('friendRequestAccepted', data);
            showToast(`${data.recipient_username} accepted your friend request!`);
        });

        this.socket.on('friend-request-declined', (data) => {
            this.log('❌ Friend request declined:', data);
            this.dispatchEvent('friendRequestDeclined', data);
        });

        this.socket.on('friend-removed', (data) => {
            this.log('💔 Friend removed:', data);
            this.dispatchEvent('friendRemoved', data);
        });

        // User presence events 
        this.socket.on('user-status-changed', (data) => {
            this.log('👤 User status changed:', data);
            this.dispatchEvent('userStatusChanged', data);
            
            if (data.user_id !== this.userId && data.status === 'online') {
                showToast(`${data.username} is now online`);
            }
        });
    }

    authenticate() {
        if (!this.socket || !this.connected) {
            this.error('❌ Cannot authenticate: not connected');
            return Promise.resolve();
        }

        this.log('🔐 Authenticating user...');

        const authData = {
            userId: this.userId,
            username: this.username,
            sessionStartTime: this.sessionStartTime,
            currentPage: this.currentPage
        };

        this.log('📤 Sending authentication data:', authData);
        this.socket.emit('authenticate', authData);

        return Promise.resolve();
    }    initPresenceTracking() {
        socketClient.on('presence-changed', (data) => {
            this.handlePresenceUpdate(data);
        });

        socketClient.on('presence-update-success', (data) => {
            this.presenceData.status = data.status;
            if (data.activityDetails !== undefined) {
                this.presenceData.activity = data.activityDetails;
            }
            this.log('✅ Presence updated successfully:', data);
        });

        socketClient.on('activity-update-success', (data) => {
            this.presenceData.activity = data.activityDetails;
            this.log('✅ Activity updated successfully:', data);
        });

        socketClient.on('online-users-received', (data) => {
            this.handleOnlineUsersUpdate(data.users);
        });

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.updatePresence('online');
                this.trackActivity('PAGE_VISIBLE');
            } else {
                this.updatePresence('away');
                this.trackActivity('PAGE_HIDDEN');
            }
        });

        let activityTimeout;
        const resetActivityTimer = () => {
            clearTimeout(activityTimeout);
            this.updatePresence('online');
            
            activityTimeout = setTimeout(() => {
                this.updatePresence('idle');
            }, 300000); 
        };

        document.addEventListener('mousemove', resetActivityTimer);
        document.addEventListener('keypress', resetActivityTimer);
        document.addEventListener('click', resetActivityTimer);

        resetActivityTimer();
        this.updatePresence('online');
        this.getOnlineUsers();
    }

    initActivityTracking() {
        this.trackActivity('PAGE_LOAD', { page: this.currentPage });

        window.addEventListener('beforeunload', () => {
            this.trackActivity('PAGE_UNLOAD', { page: this.currentPage });
            this.updatePresence('offline');
        });

        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;

        history.pushState = (...args) => {
            originalPushState.apply(history, args);
            this.onRouteChange();
        };

        history.replaceState = (...args) => {
            originalReplaceState.apply(history, args);
            this.onRouteChange();
        };

        window.addEventListener('popstate', () => {
            this.onRouteChange();
        });
    }

    onRouteChange() {
        const newPage = window.location.pathname;
        if (newPage !== this.currentPage) {
            this.trackActivity('ROUTE_CHANGE', { 
                from: this.currentPage, 
                to: newPage 
            });
            this.currentPage = newPage;
        }
    }    updatePresence(status, activity = null) {
        if (!socketClient || !socketClient.connected || !socketClient.authenticated) {
            this.log('⚠️ Cannot update presence: socket not ready');
            return Promise.resolve();
        }

        const result = socketClient.updatePresence(status, activity);
        if (result) {
            this.presenceData.status = status;
            this.presenceData.activity = activity;
            this.presenceData.lastSeen = Date.now();
            this.log('👤 Presence update sent:', { status, activity });
        }

        return Promise.resolve();
    }

    setActivity(activityDetails) {
        if (!socketClient || !socketClient.connected || !socketClient.authenticated) {
            this.log('⚠️ Cannot set activity: socket not ready');
            return Promise.resolve(false);
        }
        
        const result = socketClient.updateActivity(activityDetails);
        if (result) {
            this.presenceData.activity = activityDetails;
            this.log('🎮 Activity update sent:', activityDetails);
        }
        
        return Promise.resolve(result);
    }
    
    clearActivity() {
        return this.setActivity(null);
    }

    getOnlineUsers() {
        if (!socketClient || !socketClient.connected || !socketClient.authenticated) {
            this.log('⚠️ Cannot get online users: socket not ready');
            return Promise.resolve([]);
        }

        const result = socketClient.getOnlineUsers();
        if (result) {
            this.log('👥 Requested online users list');
        }

        return Promise.resolve(result);
    }

    getUserPresence(userId) {
        if (!socketClient || !socketClient.connected || !socketClient.authenticated) {
            this.log('⚠️ Cannot get user presence: socket not ready');
            return Promise.resolve(null);
        }

        const result = socketClient.getUserPresence(userId);
        if (result) {
            this.log('👤 Requested presence for user:', userId);
        }

        return Promise.resolve(result);
    }

    handlePresenceUpdate(data) {
        this.log('👤 Received presence update:', data);
        this.dispatchEvent('presenceChanged', data);
    }    handleOnlineUsersUpdate(users) {
        this.log('👥 Received online users update:', users);
        this.dispatchEvent('onlineUsersChanged', { users });
    }

    trackActivity(action, data = {}) {
        const activityData = {
            action,
            data,
            timestamp: Date.now(),
            page: this.currentPage,
            userId: this.userId
        };

        this.activityLog.push(activityData);
        this.log('🏃 Activity tracked:', activityData);

        if (this.activityLog.length > 100) {
            this.activityLog.shift();
        }

        if (this.socket && this.connected && this.authenticated) {
            this.socket.emit('user-activity', activityData);
        }
    }

    sendHeartbeat() {
        if (this.socket && this.connected && this.authenticated) {
            this.socket.emit('heartbeat', {
                userId: this.userId,
                timestamp: Date.now(),
                page: this.currentPage
            });
        }
    }

    joinChannel(channelId) {
        if (!this.socket || !this.connected || !this.authenticated) {
            this.error('❌ Cannot join channel: not connected or authenticated');
            return Promise.resolve(false);
        }

        this.socket.emit('join-channel', channelId);
        this.trackActivity('CHANNEL_JOIN', { channelId });
        this.log('🏠 Joined channel:', channelId);
        this.activeChannels.add(channelId);
        return Promise.resolve(true);
    }
    
    leaveChannel(channelId) {
        if (!this.socket || !this.connected || !this.authenticated) {
            return Promise.resolve(false);
        }

        this.socket.emit('leave-channel', channelId);
        this.trackActivity('CHANNEL_LEAVE', { channelId });
        this.log('🚪 Left channel:', channelId);
        this.activeChannels.delete(channelId);
        return Promise.resolve(true);
    }

    sendMessage(channelId, content, messageType = 'text') {
        if (!this.socket || !this.connected || !this.authenticated) {
            this.error('❌ Cannot send message: not connected or authenticated');
            return Promise.resolve(false);
        }

        const messageData = {
            channelId,
            content,
            message_type: messageType,
            timestamp: new Date().toISOString(),
            tempId: 'temp_' + Date.now()
        };

        this.socket.emit('channel-message', messageData);
        this.trackActivity('MESSAGE_SENT', { channelId, messageType });
        this.log('📤 Message sent:', messageData);
        return Promise.resolve(messageData.tempId);
    }

    dispatchEvent(eventName, detail = {}) {
        try {
            const event = new CustomEvent(eventName, { detail });
            window.dispatchEvent(event);
            this.log(`📡 Dispatched event: ${eventName}`, detail);
        } catch (error) {
            this.error('Failed to dispatch event:', error);
        }
    }

    trackConnection(event, data = {}) {
        const connectionInfo = {
            event: event,
            timestamp: new Date().toISOString(),
            socketId: this.socket?.id || 'none',
            connected: this.connected,
            authenticated: this.authenticated,
            data: data
        };

        this.connectionHistory.push(connectionInfo);
        this.log('🔗 Connection event:', connectionInfo);

        if (this.connectionHistory.length > 50) {
            this.connectionHistory.shift();
        }
    }

    trackError(type, error) {
        const errorInfo = {
            type: type,
            message: error.message || error,
            stack: error.stack || 'No stack trace',
            timestamp: new Date().toISOString(),
            connected: this.connected,
            authenticated: this.authenticated,
            userId: this.userId
        };

        this.error('🔴 Error tracked:', errorInfo);
    }

    logSystemInfo() {
        this.log('📊 System Information:', {
            userAgent: navigator.userAgent,
            location: window.location.href,
            socketIOAvailable: typeof io !== 'undefined',
            userId: this.userId,
            username: this.username,
            timestamp: new Date().toISOString()
        });
    }

    getStatus() {
        return {
            initialized: this.initialized,
            connected: this.connected,
            authenticated: this.authenticated,
            isGuest: this.isGuest,
            userId: this.userId,
            username: this.username,
            currentPage: this.currentPage,
            presenceData: this.presenceData,
            recentActivity: this.activityLog.slice(-10),
            connectionHistory: this.connectionHistory.slice(-10)
        };
    }

    isReady() {
        return this.initialized && this.connected && this.authenticated && !this.isGuest;
    }

    disconnect() {
        if (this.socket) {
            this.updatePresence('offline');
            this.trackActivity('MANUAL_DISCONNECT');
            this.socket.disconnect();
            this.log('👋 Manually disconnected from WebSocket server');
        }
        this.initialized = false;
        this.currentUser = null;
        this.activeChannels.clear();
    }

    on(event, callback) {
        if (!this.eventHandlers[event]) {
            this.eventHandlers[event] = [];
        }
        
        this.eventHandlers[event].push(callback);
        return this;
    }

    off(event, callback) {
        if (!this.eventHandlers[event]) {
            return this;
        }
        
        if (!callback) {
            delete this.eventHandlers[event];
        } else {
            const index = this.eventHandlers[event].indexOf(callback);
            
            if (index !== -1) {
                this.eventHandlers[event].splice(index, 1);
            }
            
            if (this.eventHandlers[event].length === 0) {
                delete this.eventHandlers[event];
            }
        }
        
        return this;
    }

    triggerEvent(event, data) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    this.error(`Error in event handler for ${event}:`, error);
                }
            });
        }
        
        return this;
    }
}

// Create and export a singleton instance
const globalSocketManager = new GlobalSocketManager();

// Export both named and default exports for compatibility
export { GlobalSocketManager };
export default globalSocketManager;
