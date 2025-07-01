class UserService {
    constructor() {
        this.userPresence = new Map();
        this.idleTimeout = 5 * 60 * 1000;
        this.cleanupInterval = 60 * 1000;
        this.startCleanupTimer();
    }

    updatePresence(userId, status, activityDetails = null) {
        this.userPresence.set(userId, {
            user_id: userId,
            status,
            activity_details: activityDetails,
            last_seen: Date.now()
        });
    }

    getPresence(userId) {
        const presence = this.userPresence.get(userId);
        if (!presence) return null;
        
        const timeSinceUpdate = Date.now() - presence.last_seen;
        if (timeSinceUpdate > this.idleTimeout && presence.status === 'online') {
            presence.status = 'idle';
            this.userPresence.set(userId, presence);
        }
        
        return presence;
    }

    removePresence(userId) {
        this.userPresence.delete(userId);
    }

    getAllPresence() {
        const presence = {};
        this.userPresence.forEach((data, userId) => {
            const updatedPresence = this.getPresence(userId);
            if (updatedPresence) {
                presence[userId] = updatedPresence;
            }
        });
        return presence;
    }

    cleanOldPresence(maxAge = 300000) {
        const now = Date.now();
        for (const [userId, data] of this.userPresence.entries()) {
            if (now - data.last_seen > maxAge) {
                this.userPresence.delete(userId);
            }
        }
    }

    startCleanupTimer() {
        setInterval(() => {
            this.cleanOldPresence();
            this.updateIdleUsers();
        }, this.cleanupInterval);
    }

    updateIdleUsers() {
        const now = Date.now();
        for (const [userId, data] of this.userPresence.entries()) {
            const timeSinceUpdate = now - data.last_seen;
            if (timeSinceUpdate > this.idleTimeout && data.status === 'online') {
                if (!data.activity_details || data.activity_details.type === 'idle') {
                    data.activity_details = { type: 'idle' };
                    this.userPresence.set(userId, data);
                    console.log(`⏰ [USER-SERVICE] User ${userId} activity set to idle after ${Math.round(timeSinceUpdate / 1000)}s inactivity`);
                }
            }
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
}

module.exports = new UserService();
