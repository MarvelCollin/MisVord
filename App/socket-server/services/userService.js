const userService = {
    // Track online users
    onlineUsers: new Map(),
    
    // Add user to online users
    addUser: function(userId, userData) {
        this.onlineUsers.set(userId, {
            ...userData,
            lastActivity: Date.now()
        });
        return true;
    },
    
    // Remove user from online users
    removeUser: function(userId) {
        if (this.onlineUsers.has(userId)) {
            this.onlineUsers.delete(userId);
            return true;
        }
        return false;
    },
    
    // Check if user is online
    isUserOnline: function(userId) {
        return this.onlineUsers.has(userId);
    },
    
    // Get online user data
    getUserData: function(userId) {
        return this.onlineUsers.get(userId) || null;
    },
    
    // Get all online users
    getAllOnlineUsers: function() {
        const users = {};
        this.onlineUsers.forEach((data, userId) => {
            users[userId] = data;
        });
        return users;
    },
    
    // Update user presence
    updatePresence: function(userId, status, activityDetails = null) {
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
