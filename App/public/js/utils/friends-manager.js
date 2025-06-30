class FriendsManager {
    constructor() {
        this.cache = {
            friends: null,
            pendingRequests: null,
            onlineUsers: null
        };
        this.lastUpdated = {
            friends: 0,
            pending: 0,
            online: 0
        };
        this.CACHE_DURATION = 30000;
        this.observers = new Set();
    }

    static getInstance() {
        if (!window._friendsManager) {
            window._friendsManager = new FriendsManager();
        }
        return window._friendsManager;
    }

    static resetInstance() {
        window._friendsManager = null;
    }

    subscribe(callback) {
        this.observers.add(callback);
        return () => this.observers.delete(callback);
    }

    notify(type, data) {
        this.observers.forEach(callback => {
            try {
                callback(type, data);
            } catch (error) {
                console.error('Observer error:', error);
            }
        });
    }

    isCacheValid(type) {
        if (!this.lastUpdated || !this.cache) {
            return false;
        }
        
        const keyMap = {
            'friends': 'friends',
            'pending': 'pendingRequests', 
            'online': 'onlineUsers'
        };
        
        const cacheKey = keyMap[type] || type;
        const age = Date.now() - (this.lastUpdated[type] || 0);
        return age < this.CACHE_DURATION && this.cache[cacheKey] !== null && this.cache[cacheKey] !== undefined;
    }

    async getFriends(forceRefresh = false) {
        if (!forceRefresh && this.isCacheValid('friends')) {
            return this.cache.friends;
        }

        try {
            const response = await window.FriendAPI.getFriends();
            
            let friends = [];
            
            if (Array.isArray(response)) {
                friends = response;
            } else if (response && response.success && response.data) {
                friends = Array.isArray(response.data) ? response.data : [];
            } else if (response && response.data) {
                friends = Array.isArray(response.data) ? response.data : [];
            } else if (response && Array.isArray(response.friends)) {
                friends = response.friends;
            } else if (response && response.success === false) {
                console.warn('Friends API returned error:', response.error || response.message);
                friends = [];
            } else {
                console.warn('Unexpected friends API response format:', response);
                friends = [];
            }
            
            this.cache.friends = friends;
            this.lastUpdated.friends = Date.now();
            this.notify('friends-updated', friends);
            return friends;
        } catch (error) {
            console.error('Error loading friends:', error);
            return this.cache.friends || [];
        }
    }

    async getPendingRequests(forceRefresh = false) {
        if (!forceRefresh && this.isCacheValid('pending')) {
            return this.cache.pendingRequests;
        }

        try {
            const response = await window.FriendAPI.getPendingRequests();
            
            let pending = { incoming: [], outgoing: [] };
            
            if (response && typeof response === 'object') {
                if (response.success && response.data) {
                    pending = {
                        incoming: Array.isArray(response.data.incoming) ? response.data.incoming : [],
                        outgoing: Array.isArray(response.data.outgoing) ? response.data.outgoing : []
                    };
                } else if (response.data) {
                    pending = {
                        incoming: Array.isArray(response.data.incoming) ? response.data.incoming : [],
                        outgoing: Array.isArray(response.data.outgoing) ? response.data.outgoing : []
                    };
                } else if (response.incoming !== undefined && response.outgoing !== undefined) {
                    pending = {
                        incoming: Array.isArray(response.incoming) ? response.incoming : [],
                        outgoing: Array.isArray(response.outgoing) ? response.outgoing : []
                    };
                } else if (response.success === false) {
                    console.warn('Pending requests API returned error:', response.error || response.message);
                }
            }
            
            this.cache.pendingRequests = pending;
            this.lastUpdated.pending = Date.now();
            this.notify('pending-updated', pending);
            return pending;
        } catch (error) {
            console.error('Error loading pending requests:', error);
            return this.cache.pendingRequests || { incoming: [], outgoing: [] };
        }
    }

    async getOnlineUsers(forceRefresh = false) {
        if (!forceRefresh && this.isCacheValid('online')) {
            return this.cache.onlineUsers;
        }

        try {
            let onlineUsers = {};
            if (window.ChatAPI && typeof window.ChatAPI.getOnlineUsers === 'function') {
                onlineUsers = await window.ChatAPI.getOnlineUsers();
            }
            this.cache.onlineUsers = onlineUsers || {};
            this.lastUpdated.online = Date.now();
            return onlineUsers || {};
        } catch (error) {
            console.error('Error getting online users:', error);
            return this.cache.onlineUsers || {};
        }
    }

    async sendFriendRequest(username) {
        const result = await window.FriendAPI.sendFriendRequest(username);
        this.invalidateCache('pending');
        return result;
    }

    async acceptFriendRequest(friendshipId) {
        const result = await window.FriendAPI.acceptFriendRequest(friendshipId);
        this.invalidateCache(['friends', 'pending']);
        return result;
    }

    async declineFriendRequest(friendshipId) {
        const result = await window.FriendAPI.declineFriendRequest(friendshipId);
        this.invalidateCache('pending');
        return result;
    }

    async removeFriend(userId) {
        const result = await window.FriendAPI.removeFriend(userId);
        this.invalidateCache('friends');
        return result;
    }

    invalidateCache(types) {
        const typeArray = Array.isArray(types) ? types : [types];
        const keyMap = {
            'friends': 'friends',
            'pending': 'pendingRequests',
            'online': 'onlineUsers'
        };
        
        typeArray.forEach(type => {
            const cacheKey = keyMap[type] || type;
            if (this.cache && this.lastUpdated) {
                this.cache[cacheKey] = null;
                this.lastUpdated[type] = 0;
            }
        });
    }

    getStatusColor(status) {
        const statusColors = {
            'online': 'bg-discord-green',
            'appear': 'bg-discord-green',
            'invisible': 'bg-gray-500',
            'away': 'bg-discord-yellow',
            'idle': 'bg-discord-yellow',
            'dnd': 'bg-discord-red',
            'do_not_disturb': 'bg-discord-red',
            'offline': 'bg-[#747f8d]',
            'banned': 'bg-black'
        };
        return statusColors[status] || 'bg-gray-500';
    }

    getStatusText(status) {
        const statusTexts = {
            'online': 'Online',
            'appear': 'Online',
            'invisible': 'Invisible',
            'away': 'Away',
            'idle': 'Away',
            'dnd': 'Do Not Disturb',
            'do_not_disturb': 'Do Not Disturb',
            'offline': 'Offline',
            'banned': 'Banned'
        };
        return statusTexts[status] || 'Offline';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

window.FriendsManager = FriendsManager;
export default FriendsManager; 