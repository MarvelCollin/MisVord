class PresenceManager {
    constructor() {
        this.userPresence = new Map();
        this.activityTimeout = 5 * 60 * 1000;
        this.heartbeatInterval = 30 * 1000;
        this.lastActivity = Date.now();
        this.heartbeatTimer = null;
        this.idleTimer = null;
        this.currentStatus = 'online';
        this.isInitialized = false;
    }

    initialize() {
        if (this.isInitialized) {
            return;
        }

        this.isInitialized = true;
        this.setupActivityListeners();
        this.startHeartbeat();
        this.startIdleDetection();
        
        console.log('🎯 [PRESENCE-MANAGER] Initialized successfully');
    }

    setupActivityListeners() {
        const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        const handleActivity = () => {
            this.updateActivity();
        };

        activityEvents.forEach(event => {
            document.addEventListener(event, handleActivity, { passive: true });
        });

        window.addEventListener('focus', handleActivity);
        window.addEventListener('blur', () => {
            setTimeout(() => this.checkIdleStatus(), 1000);
        });
    }

    updateActivity() {
        this.lastActivity = Date.now();
        
        if (this.currentStatus === 'idle') {
            this.setStatus('online');
        }
        
        this.resetIdleTimer();
    }

    startHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
        }

        this.heartbeatTimer = setInterval(() => {
            if (window.globalSocketManager && window.globalSocketManager.isReady()) {
                window.globalSocketManager.io.emit('heartbeat');
            }
        }, this.heartbeatInterval);
    }

    startIdleDetection() {
        this.resetIdleTimer();
    }

    resetIdleTimer() {
        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
        }

        this.idleTimer = setTimeout(() => {
            this.checkIdleStatus();
        }, this.activityTimeout);
    }

    checkIdleStatus() {
        const timeSinceActivity = Date.now() - this.lastActivity;
        
        if (timeSinceActivity >= this.activityTimeout && this.currentStatus !== 'idle') {
            this.setStatus('idle');
        }
    }

    setStatus(status, activityDetails = null) {
        if (this.currentStatus === status) {
            return;
        }

        const oldStatus = this.currentStatus;
        this.currentStatus = status;

        console.log(`👤 [PRESENCE-MANAGER] Status changed: ${oldStatus} → ${status}`);

        if (window.globalSocketManager && window.globalSocketManager.isReady()) {
            window.globalSocketManager.updatePresence(status, activityDetails);
        }

        window.dispatchEvent(new CustomEvent('userStatusChanged', {
            detail: {
                oldStatus,
                newStatus: status,
                activityDetails
            }
        }));
    }

    handleUserOnline(data) {
        console.log('👥 [PRESENCE-MANAGER] User came online:', data);
        
        if (data.user_id) {
            this.userPresence.set(data.user_id, {
                status: data.status || 'online',
                username: data.username,
                timestamp: Date.now()
            });

            window.dispatchEvent(new CustomEvent('presenceUserOnline', {
                detail: data
            }));
        }
    }

    handleUserOffline(data) {
        console.log('👥 [PRESENCE-MANAGER] User went offline:', data);
        
        if (data.user_id) {
            this.userPresence.delete(data.user_id);

            window.dispatchEvent(new CustomEvent('presenceUserOffline', {
                detail: data
            }));
        }
    }

    handlePresenceUpdate(data) {
        console.log('👥 [PRESENCE-MANAGER] User presence updated:', data);
        
        if (data.user_id) {
            this.userPresence.set(data.user_id, {
                status: data.status,
                username: data.username,
                activityDetails: data.activity_details,
                timestamp: Date.now()
            });

            window.dispatchEvent(new CustomEvent('presenceUpdate', {
                detail: data
            }));
        }
    }

    getUserPresence(userId) {
        return this.userPresence.get(userId) || null;
    }

    getAllPresence() {
        const presence = {};
        this.userPresence.forEach((data, userId) => {
            presence[userId] = data;
        });
        return presence;
    }

    isUserOnline(userId) {
        const presence = this.getUserPresence(userId);
        return presence && presence.status !== 'offline';
    }

    getOnlineUsers() {
        const onlineUsers = {};
        this.userPresence.forEach((data, userId) => {
            if (data.status !== 'offline') {
                onlineUsers[userId] = data;
            }
        });
        return onlineUsers;
    }

    getCurrentStatus() {
        return this.currentStatus;
    }

    destroy() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }

        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
            this.idleTimer = null;
        }

        this.userPresence.clear();
        this.isInitialized = false;
        
        console.log('🎯 [PRESENCE-MANAGER] Destroyed');
    }
}

if (typeof window !== 'undefined') {
    window.presenceManager = new PresenceManager();
    
    window.addEventListener('globalSocketReady', () => {
        console.log('🎯 [PRESENCE-MANAGER] Socket ready, initializing presence manager');
        window.presenceManager.initialize();
    });

    window.addEventListener('socketAuthenticated', () => {
        console.log('🎯 [PRESENCE-MANAGER] Socket authenticated, setting initial status');
        window.presenceManager.setStatus('online');
    });
} 