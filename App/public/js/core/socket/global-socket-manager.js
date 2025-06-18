/**
 * Global WebSocket Manager for MisVord
 * This class manages the global WebSocket connection that tracks all user activity
 * across the entire application, regardless of which page or component is loaded.
 */

import { showToast } from './toast.js';

export class GlobalSocketManager {
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

        // Make this available globally
        window.GlobalSocketManager = this;
        this.log('✅ GlobalSocketManager instance created and registered globally');
    }

    log(...args) {
        if (this.debug) {
            console.log('[GlobalSocketManager]', ...args);
        }
    }

    error(...args) {
        console.error('[GlobalSocketManager]', ...args);
    }

    /**
     * Initialize the global socket connection
     * This should be called on every page load for authenticated users
     */
    init(userData = null) {
        if (this.initialized) {
            this.log('🔄 Already initialized, skipping duplicate initialization');
            return;
        }

        // Check if user is authenticated
        if (!userData || !userData.user_id) {
            this.log('👤 Guest user detected, socket connection disabled');
            this.isGuest = true;
            return;
        }

        this.userId = userData.user_id;
        this.username = userData.username;

        this.log('🚀 Initializing global WebSocket connection for user:', this.username);
        this.logSystemInfo();

        try {
            this.initSocket();
            this.initPresenceTracking();
            this.initActivityTracking();

            // Start heartbeat
            setInterval(() => this.sendHeartbeat(), this.config.heartbeatInterval);

            this.log('✅ Global socket manager initialized successfully');
            this.initialized = true;

            // Dispatch global event
            this.dispatchEvent('globalSocketReady', { manager: this });

        } catch (error) {
            this.error('❌ Failed to initialize global socket manager:', error);
            this.trackError('GLOBAL_INIT_FAILED', error);
        }
    }

    /**
     * Initialize the socket connection
     */
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
    }

    /**
     * Set up socket event handlers
     */
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
        });

        // Presence events
        this.socket.on('user-status-changed', (data) => {
            this.log('👤 User status changed:', data);
            this.dispatchEvent('userStatusChanged', data);
        });

        // Global activity events
        this.socket.on('user-activity', (data) => {
            this.log('🏃 User activity:', data);
            this.dispatchEvent('userActivity', data);
        });

        // Keep existing messaging events for compatibility
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

        // Group server events
        this.socket.on('group-server-created', (data) => {
            this.log('📁 Group server created:', data);
            this.dispatchEvent('groupServerCreated', data);
        });

        this.socket.on('group-server-updated', (data) => {
            this.log('📝 Group server updated:', data);
            this.dispatchEvent('groupServerUpdated', data);
        });

        this.socket.on('group-server-deleted', (data) => {
            this.log('🗑️ Group server deleted:', data);
            this.dispatchEvent('groupServerDeleted', data);
        });

        // Role events
        this.socket.on('role-created', (data) => {
            this.log('👑 Role created:', data);
            this.dispatchEvent('roleCreated', data);
        });

        this.socket.on('role-updated', (data) => {
            this.log('👑 Role updated:', data);
            this.dispatchEvent('roleUpdated', data);
        });

        this.socket.on('role-deleted', (data) => {
            this.log('👑 Role deleted:', data);
            this.dispatchEvent('roleDeleted', data);
        });

        this.socket.on('user-role-assigned', (data) => {
            this.log('�� User role assigned:', data);
            this.dispatchEvent('userRoleAssigned', data);
        });

        this.socket.on('user-role-removed', (data) => {
            this.log('👤 User role removed:', data);
            this.dispatchEvent('userRoleRemoved', data);
        });

        this.socket.on('role-received', (data) => {
            this.log('👑 Role received:', data);
            this.dispatchEvent('roleReceived', data);
        });

        this.socket.on('role-removed', (data) => {
            this.log('👑 Role removed:', data);
            this.dispatchEvent('roleRemoved', data);
        });

        this.socket.on('role-permissions-updated', (data) => {
            this.log('🔒 Role permissions updated:', data);
            this.dispatchEvent('rolePermissionsUpdated', data);
        });

        // Emoji events
        this.socket.on('emoji-created', (data) => {
            this.log('😀 Emoji created:', data);
            this.dispatchEvent('emojiCreated', data);
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
        });

        this.socket.on('friend-request-accepted', (data) => {
            this.log('✅ Friend request accepted:', data);
            this.dispatchEvent('friendRequestAccepted', data);
        });

        this.socket.on('friend-request-declined', (data) => {
            this.log('❌ Friend request declined:', data);
            this.dispatchEvent('friendRequestDeclined', data);
        });

        this.socket.on('friend-removed', (data) => {
            this.log('💔 Friend removed:', data);
            this.dispatchEvent('friendRemoved', data);
        });

        this.socket.on('user-blocked', (data) => {
            this.log('🚫 User blocked:', data);
            this.dispatchEvent('userBlocked', data);
        });

        this.socket.on('user-unblocked', (data) => {
            this.log('✅ User unblocked:', data);
            this.dispatchEvent('userUnblocked', data);
        });
    }

    /**
     * Authenticate the user with the socket server
     */
    authenticate() {
        if (!this.socket || !this.connected) {
            this.error('❌ Cannot authenticate: not connected');
            return;
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
    }

    /**
     * Initialize presence tracking
     */
    initPresenceTracking() {
        // Update presence on page visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.updatePresence('online');
                this.trackActivity('PAGE_VISIBLE');
            } else {
                this.updatePresence('away');
                this.trackActivity('PAGE_HIDDEN');
            }
        });

        // Update presence on mouse/keyboard activity
        let activityTimeout;
        const resetActivityTimer = () => {
            clearTimeout(activityTimeout);
            this.updatePresence('online');
            
            activityTimeout = setTimeout(() => {
                this.updatePresence('idle');
            }, 300000); // 5 minutes of inactivity = idle
        };

        document.addEventListener('mousemove', resetActivityTimer);
        document.addEventListener('keypress', resetActivityTimer);
        document.addEventListener('click', resetActivityTimer);

        // Initial activity timer
        resetActivityTimer();
    }

    /**
     * Initialize activity tracking
     */
    initActivityTracking() {
        // Track page navigation
        this.trackActivity('PAGE_LOAD', { page: this.currentPage });

        // Track page unload
        window.addEventListener('beforeunload', () => {
            this.trackActivity('PAGE_UNLOAD', { page: this.currentPage });
            this.updatePresence('offline');
        });

        // Track route changes for SPA behavior
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

    /**
     * Handle route changes
     */
    onRouteChange() {
        const newPage = window.location.pathname;
        if (newPage !== this.currentPage) {
            this.trackActivity('ROUTE_CHANGE', { 
                from: this.currentPage, 
                to: newPage 
            });
            this.currentPage = newPage;
        }
    }

    /**
     * Update user presence
     */
    updatePresence(status, activity = null) {
        if (!this.socket || !this.connected || !this.authenticated) {
            return;
        }

        this.presenceData.status = status;
        this.presenceData.activity = activity;
        this.presenceData.lastSeen = Date.now();

        this.socket.emit('update-presence', this.presenceData);
        this.log('👤 Presence updated:', this.presenceData);
    }

    /**
     * Track user activity
     */
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

        // Keep only last 100 activities
        if (this.activityLog.length > 100) {
            this.activityLog.shift();
        }

        // Send to server if connected
        if (this.socket && this.connected && this.authenticated) {
            this.socket.emit('user-activity', activityData);
        }
    }

    /**
     * Send heartbeat to maintain connection
     */
    sendHeartbeat() {
        if (this.socket && this.connected && this.authenticated) {
            this.socket.emit('heartbeat', {
                userId: this.userId,
                timestamp: Date.now(),
                page: this.currentPage
            });
        }
    }

    /**
     * Join a specific channel (for messaging)
     */
    joinChannel(channelId) {
        if (!this.socket || !this.connected || !this.authenticated) {
            this.error('❌ Cannot join channel: not connected or authenticated');
            return false;
        }

        this.socket.emit('join-channel', channelId);
        this.trackActivity('CHANNEL_JOIN', { channelId });
        this.log('🏠 Joined channel:', channelId);
        return true;
    }

    /**
     * Leave a specific channel
     */
    leaveChannel(channelId) {
        if (!this.socket || !this.connected || !this.authenticated) {
            return false;
        }

        this.socket.emit('leave-channel', channelId);
        this.trackActivity('CHANNEL_LEAVE', { channelId });
        this.log('🚪 Left channel:', channelId);
        return true;
    }

    /**
     * Send a message to a channel
     */
    sendMessage(channelId, content, messageType = 'text') {
        if (!this.socket || !this.connected || !this.authenticated) {
            this.error('❌ Cannot send message: not connected or authenticated');
            return false;
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
        return messageData.tempId;
    }

    /**
     * Dispatch custom events
     */
    dispatchEvent(eventName, detail = {}) {
        try {
            const event = new CustomEvent(eventName, { detail });
            window.dispatchEvent(event);
            this.log(`📡 Dispatched event: ${eventName}`, detail);
        } catch (error) {
            this.error('Failed to dispatch event:', error);
        }
    }

    /**
     * Track connection events
     */
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

    /**
     * Track errors
     */
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

    /**
     * Log system information
     */
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

    /**
     * Get current status
     */
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

    /**
     * Check if the socket manager is ready for messaging
     */
    isReady() {
        return this.initialized && this.connected && this.authenticated && !this.isGuest;
    }

    /**
     * Gracefully disconnect
     */
    disconnect() {
        if (this.socket) {
            this.updatePresence('offline');
            this.trackActivity('MANUAL_DISCONNECT');
            this.socket.disconnect();
            this.log('👋 Manually disconnected from WebSocket server');
        }
    }
}

export { GlobalSocketManager };
