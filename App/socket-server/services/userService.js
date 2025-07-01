class UserService {
    constructor() {
        this.userPresence = new Map();
        this.idleTimeout = 5 * 60 * 1000;
        this.cleanupInterval = 60 * 1000;
        this.startCleanupTimer();
    }

    updatePresence(userId, status, activityDetails = null) {
        const defaultActivity = activityDetails || { type: 'idle', name: 'Idle' };
        this.userPresence.set(userId, {
            user_id: userId,
            status,
            activity_details: defaultActivity,
            last_seen: Date.now()
        });
    }

    getPresence(userId) {
        const presence = this.userPresence.get(userId);
        if (!presence) return null;
        
        const timeSinceUpdate = Date.now() - presence.last_seen;
        if (timeSinceUpdate > this.idleTimeout && presence.activity_details?.type !== 'idle') {
            presence.activity_details = { type: 'idle', name: 'Idle' };
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
            this.updateIdleUsers();
        }, this.cleanupInterval);
    }

    updateIdleUsers() {
        const now = Date.now();
        for (const [userId, data] of this.userPresence.entries()) {
            const timeSinceUpdate = now - data.last_seen;
            if (timeSinceUpdate > this.idleTimeout && data.activity_details?.type !== 'idle') {
                data.activity_details = { type: 'idle', name: 'Idle' };
                this.userPresence.set(userId, data);
                console.log(`⏰ [USER-SERVICE] User ${userId} activity set to idle after ${Math.round(timeSinceUpdate / 1000)}s inactivity`);
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
            if (data.activity_details?.type === 'idle') count++;
        });
        return count;
    }

    getActivityTypes() {
        const activityTypes = {
            'idle': 'Idle',
            'playing': 'Playing a game',
            'listening': 'Listening to music',
            'watching': 'Watching',
            'streaming': 'Streaming',
            'custom': 'Custom Status'
        };
        return activityTypes;
    }
}

module.exports = new UserService();
