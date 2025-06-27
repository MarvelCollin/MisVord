class UserService {
    constructor() {
        this.userPresence = new Map();
    }

    updatePresence(userId, status, activityDetails = null) {
        this.userPresence.set(userId, {
            status,
            activityDetails,
            lastUpdated: Date.now()
        });
    }

    getPresence(userId) {
        return this.userPresence.get(userId) || null;
    }

    removePresence(userId) {
        this.userPresence.delete(userId);
    }

    getAllPresence() {
        const presence = {};
        this.userPresence.forEach((data, userId) => {
            presence[userId] = data;
        });
        return presence;
    }

    cleanOldPresence(maxAge = 300000) {
        const now = Date.now();
        for (const [userId, data] of this.userPresence.entries()) {
            if (now - data.lastUpdated > maxAge) {
                this.userPresence.delete(userId);
            }
        }
    }
}

module.exports = new UserService();
