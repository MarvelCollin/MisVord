const userService = {

    onlineUsers: new Map(),


    addUser: function (userId, userData) {
        this.onlineUsers.set(userId, {
            ...userData,
            lastActivity: Date.now()
        });
        return true;
    },


    removeUser: function (userId) {
        if (this.onlineUsers.has(userId)) {
            this.onlineUsers.delete(userId);
            return true;
        }
        return false;
    },


    isUserOnline: function (userId) {
        return this.onlineUsers.has(userId);
    },


    getUserData: function (userId) {
        return this.onlineUsers.get(userId) || null;
    },


    getAllOnlineUsers: function () {
        const users = {};
        this.onlineUsers.forEach((data, userId) => {
            users[userId] = data;
        });
        return users;
    },


    updatePresence: function (userId, status, activityDetails = null) {
        if (!this.onlineUsers.has(userId)) return false;

        const userData = this.onlineUsers.get(userId);
        userData.status = status;

        if (activityDetails) {
            userData.activityDetails = activityDetails;
        }

        userData.lastUpdated = Date.now();
        this.onlineUsers.set(userId, userData);
        return true;
    }
};

module.exports = userService;
