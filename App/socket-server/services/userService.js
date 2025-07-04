class UserService {
    constructor() {
        this.userPresence = new Map();
        this.afkTimeout = 20 * 1000;
        this.cleanupInterval = 15 * 1000;
        this.disconnectGracePeriod = 30 * 1000;
        this.disconnectingUsers = new Map();
        this.io = null;
        this.usernames = new Map();
        this.startCleanupTimer();
    }

    setIO(io) {
        this.io = io;

    }

    updatePresence(userId, status, activityDetails = null, username = null) {
        if (username) {
            this.usernames.set(userId, username);
        }
        
        if (this.disconnectingUsers.has(userId)) {

            clearTimeout(this.disconnectingUsers.get(userId).timeout);
            this.disconnectingUsers.delete(userId);
        }
        
        this.userPresence.set(userId, {
            user_id: userId,
            status,
            activity_details: activityDetails,
            last_seen: Date.now()
        });

    }

    markUserDisconnecting(userId, username = null) {
        if (username) {
            this.usernames.set(userId, username);
        }
        
        const currentPresence = this.userPresence.get(userId);
        if (!currentPresence) return;
        
        if (this.disconnectingUsers.has(userId)) {
            clearTimeout(this.disconnectingUsers.get(userId).timeout);
        }
        

        
        const timeout = setTimeout(() => {

            this.forceUserOffline(userId);
        }, this.disconnectGracePeriod);
        
        this.disconnectingUsers.set(userId, {
            timeout: timeout,
            originalPresence: { ...currentPresence },
            disconnectedAt: Date.now()
        });
    }
    
    forceUserOffline(userId) {
        this.userPresence.delete(userId);
        this.disconnectingUsers.delete(userId);
        
        if (this.io) {
            const username = this.usernames.get(userId) || 'Unknown';
            this.io.emit('user-offline', {
                user_id: userId,
                username: username,
                status: 'offline',
                activity_details: null,
                timestamp: Date.now()
            });

        }
    }

    getPresence(userId) {
        const presence = this.userPresence.get(userId);
        if (!presence) return null;
        
        const timeSinceUpdate = Date.now() - presence.last_seen;
        
        if (timeSinceUpdate > this.afkTimeout && presence.status === 'online') {

            const oldStatus = presence.status;
            presence.status = 'afk';
            if (!presence.activity_details || presence.activity_details.type === 'idle') {
                presence.activity_details = { type: 'afk' };
            }
            this.userPresence.set(userId, presence);
            
            if (this.io && oldStatus !== 'afk') {
                const username = this.usernames.get(userId) || 'Unknown';
                this.io.emit('user-presence-update', {
                    user_id: userId,
                    username: username,
                    status: 'afk',
                    activity_details: presence.activity_details
                });

            }
        }
        
        return presence;
    }

    removePresence(userId) {
        const presence = this.userPresence.get(userId);
        if (presence) {

            this.userPresence.delete(userId);
            this.usernames.delete(userId);
            
            if (this.disconnectingUsers.has(userId)) {
                clearTimeout(this.disconnectingUsers.get(userId).timeout);
                this.disconnectingUsers.delete(userId);
            }
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
        
        this.disconnectingUsers.forEach((disconnectData, userId) => {
            if (!presence[userId]) {
                presence[userId] = {
                    ...disconnectData.originalPresence,
                    last_seen: disconnectData.disconnectedAt
                };
            }
        });
        
        return presence;
    }

    cleanOldPresence(maxAge = 300000) {
        const now = Date.now();
        const toRemove = [];
        
        for (const [userId, data] of this.userPresence.entries()) {
            if (data.status === 'offline' && now - data.last_seen > maxAge) {
                toRemove.push(userId);
            }
        }
        
        toRemove.forEach(userId => {

            this.userPresence.delete(userId);
            this.usernames.delete(userId);
        });
        
        const expiredDisconnecting = [];
        for (const [userId, disconnectData] of this.disconnectingUsers.entries()) {
            if (now - disconnectData.disconnectedAt > this.disconnectGracePeriod + 60000) {
                expiredDisconnecting.push(userId);
            }
        }
        
        expiredDisconnecting.forEach(userId => {

            const disconnectData = this.disconnectingUsers.get(userId);
            if (disconnectData?.timeout) {
                clearTimeout(disconnectData.timeout);
            }
            this.disconnectingUsers.delete(userId);
        });
        
        if (toRemove.length > 0 || expiredDisconnecting.length > 0) {

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
            
            if (timeSinceUpdate > this.afkTimeout && data.status === 'online') {
                data.status = 'afk';
                if (!data.activity_details || data.activity_details.type === 'idle') {
                    data.activity_details = { type: 'afk' };
                }
                this.userPresence.set(userId, data);
                statusChanges++;

                
                if (this.io) {
                    const username = this.usernames.get(userId) || 'Unknown';
                    this.io.emit('user-presence-update', {
                        user_id: userId,
                        username: username,
                        status: 'afk',
                        activity_details: data.activity_details
                    });

                }
            }
        }
        
        if (statusChanges > 0) {

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

    getAfkCount() {
        let count = 0;
        this.userPresence.forEach(data => {
            if (data.status === 'afk') count++;
        });
        return count;
    }

    isUserOnline(userId) {
        const presence = this.getPresence(userId);
        return presence && presence.status !== 'offline';
    }
}

module.exports = new UserService();
