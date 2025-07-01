class UserService {
    constructor() {
        this.userPresence = new Map();
        this.idleTimeout = 30 * 1000;
        this.offlineTimeout = 20 * 1000;
        this.cleanupInterval = 15 * 1000;
        this.io = null;
        this.usernames = new Map();
        this.startCleanupTimer();
    }

    setIO(io) {
        this.io = io;
        console.log('📡 [USER-SERVICE] IO instance set for broadcasting events');
    }

    updatePresence(userId, status, activityDetails = null, username = null) {
        if (username) {
            this.usernames.set(userId, username);
        }
        
        this.userPresence.set(userId, {
            user_id: userId,
            status,
            activity_details: activityDetails,
            last_seen: Date.now()
        });
        console.log(`💓 [USER-SERVICE] Presence updated for user ${userId}: ${status}`);
    }

    getPresence(userId) {
        const presence = this.userPresence.get(userId);
        if (!presence) return null;
        
        const timeSinceUpdate = Date.now() - presence.last_seen;
        
        if (timeSinceUpdate > this.offlineTimeout && presence.status !== 'offline') {
            console.log(`⏰ [USER-SERVICE] User ${userId} marked offline after ${Math.round(timeSinceUpdate / 1000)}s of inactivity`);
            const oldStatus = presence.status;
            presence.status = 'offline';
            presence.activity_details = null;
            this.userPresence.set(userId, presence);
            
            if (this.io && oldStatus !== 'offline') {
                const username = this.usernames.get(userId) || 'Unknown';
                this.io.emit('user-offline', {
                    user_id: userId,
                    username: username,
                    status: 'offline',
                    activity_details: null,
                    timestamp: Date.now()
                });
                console.log(`📡 [USER-SERVICE] Broadcasted offline event for user ${username} (${userId})`);
            }
        } else if (timeSinceUpdate > this.idleTimeout && presence.status === 'online') {
            console.log(`⏰ [USER-SERVICE] User ${userId} marked idle after ${Math.round(timeSinceUpdate / 1000)}s of inactivity`);
            const oldStatus = presence.status;
            presence.status = 'idle';
            if (!presence.activity_details || presence.activity_details.type === 'idle') {
                presence.activity_details = { type: 'idle' };
            }
            this.userPresence.set(userId, presence);
            
            if (this.io && oldStatus !== 'idle') {
                const username = this.usernames.get(userId) || 'Unknown';
                this.io.emit('user-presence-update', {
                    user_id: userId,
                    username: username,
                    status: 'idle',
                    activity_details: presence.activity_details
                });
                console.log(`📡 [USER-SERVICE] Broadcasted idle event for user ${username} (${userId})`);
            }
        }
        
        return presence;
    }

    removePresence(userId) {
        const presence = this.userPresence.get(userId);
        if (presence) {
            console.log(`❌ [USER-SERVICE] Removing presence for user ${userId}`);
        this.userPresence.delete(userId);
            this.usernames.delete(userId);
        }
    }

    getAllPresence() {
        const presence = {};
        this.userPresence.forEach((data, userId) => {
            const updatedPresence = this.getPresence(userId);
            if (updatedPresence && updatedPresence.status !== 'offline') {
                presence[userId] = updatedPresence;
            }
        });
        return presence;
    }

    cleanOldPresence(maxAge = 60000) {
        const now = Date.now();
        const toRemove = [];
        
        for (const [userId, data] of this.userPresence.entries()) {
            if (now - data.last_seen > maxAge) {
                toRemove.push(userId);
            }
        }
        
        toRemove.forEach(userId => {
            console.log(`🧹 [USER-SERVICE] Cleaning old presence for user ${userId}`);
                this.userPresence.delete(userId);
            this.usernames.delete(userId);
        });
        
        if (toRemove.length > 0) {
            console.log(`🧹 [USER-SERVICE] Cleaned ${toRemove.length} old presence entries`);
        }
    }

    startCleanupTimer() {
        setInterval(() => {
            this.cleanOldPresence();
            this.updateUserStatuses();
        }, this.cleanupInterval);
    }

    updateUserStatuses() {
        const now = Date.now();
        let statusChanges = 0;
        
        for (const [userId, data] of this.userPresence.entries()) {
            const timeSinceUpdate = now - data.last_seen;
            const oldStatus = data.status;
            
            if (timeSinceUpdate > this.offlineTimeout && data.status !== 'offline') {
                data.status = 'offline';
                data.activity_details = null;
                this.userPresence.set(userId, data);
                statusChanges++;
                console.log(`⏰ [USER-SERVICE] User ${userId} changed from ${oldStatus} to offline after ${Math.round(timeSinceUpdate / 1000)}s`);
                
                if (this.io) {
                    const username = this.usernames.get(userId) || 'Unknown';
                    this.io.emit('user-offline', {
                        user_id: userId,
                        username: username,
                        status: 'offline',
                        activity_details: null,
                        timestamp: Date.now()
                    });
                    console.log(`📡 [USER-SERVICE] Broadcasted offline event for user ${username} (${userId})`);
                }
            } else if (timeSinceUpdate > this.idleTimeout && data.status === 'online') {
                data.status = 'idle';
                if (!data.activity_details || data.activity_details.type === 'idle') {
                    data.activity_details = { type: 'idle' };
                }
                    this.userPresence.set(userId, data);
                statusChanges++;
                console.log(`⏰ [USER-SERVICE] User ${userId} changed from ${oldStatus} to idle after ${Math.round(timeSinceUpdate / 1000)}s`);
                
                if (this.io) {
                    const username = this.usernames.get(userId) || 'Unknown';
                    this.io.emit('user-presence-update', {
                        user_id: userId,
                        username: username,
                        status: 'idle',
                        activity_details: data.activity_details
                    });
                    console.log(`📡 [USER-SERVICE] Broadcasted idle event for user ${username} (${userId})`);
                }
            }
        }
        
        if (statusChanges > 0) {
            console.log(`📊 [USER-SERVICE] Updated ${statusChanges} user statuses`);
        }
    }

    getUserCount() {
        return this.userPresence.size;
    }

    getOnlineCount() {
        let count = 0;
        this.userPresence.forEach(data => {
            if (data.status === 'online') count++;
        });
        return count;
    }

    getIdleCount() {
        let count = 0;
        this.userPresence.forEach(data => {
            if (data.status === 'idle') count++;
        });
        return count;
    }

    isUserOnline(userId) {
        const presence = this.getPresence(userId);
        return presence && presence.status !== 'offline';
    }
}

module.exports = new UserService();
