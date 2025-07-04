class FriendsManager {
    constructor() {
        this.cache = {
            friends: null,
            pendingRequests: null,
            onlineUsers: {}
        };
        this.lastUpdated = {
            friends: 0,
            pending: 0,
            online: 0
        };
        this.CACHE_DURATION = 30000;
        this.observers = new Set();
        this.socketListenersSetup = false;
        this.initialDataLoaded = false;
        this.setupSocketListeners();
        this.loadInitialServerData();
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

    loadInitialServerData() {
        if (this.initialDataLoaded) return;
        

        
        if (typeof window.initialFriendsData !== 'undefined') {
            this.cache.friends = window.initialFriendsData || [];
            this.lastUpdated.friends = Date.now();
            this.initialDataLoaded = true;

        }
        else if (typeof friends !== 'undefined' && Array.isArray(friends)) {
            this.cache.friends = friends;
            this.lastUpdated.friends = Date.now();
            this.initialDataLoaded = true;

        }
        else {
            const friendsScript = document.querySelector('script');
            if (friendsScript && friendsScript.textContent.includes('const friends = ')) {
                try {
                    const match = friendsScript.textContent.match(/const friends = (\[.*?\]);/s);
                    if (match) {
                        this.cache.friends = JSON.parse(match[1]);
                        this.lastUpdated.friends = Date.now();
                        this.initialDataLoaded = true;

                    }
                } catch (e) {
                    console.warn('⚠️ [FRIENDS-MANAGER] Failed to extract friends from script:', e);
                }
            }
        }
        
        if (!this.initialDataLoaded) {
            this.cache.friends = [];
            this.lastUpdated.friends = Date.now();
            this.initialDataLoaded = true;

        }
    }

    setupSocketListeners() {
        if (this.socketListenersSetup) return;
        
        const setupListeners = () => {
            if (window.globalSocketManager && window.globalSocketManager.io) {
                const socket = window.globalSocketManager.io;
                
                socket.on('user-online', (data) => {

                    this.handleUserOnline(data);
                });
                
                socket.on('user-offline', (data) => {

                    this.handleUserOffline(data);
                });
                
                socket.on('user-presence-update', (data) => {
                    this.handlePresenceUpdate(data);
                });
                
                socket.on('friend-request-received', (data) => {

                    this.notify('friend-request-received', data);
                });
                
                socket.on('friend-request-accepted', (data) => {

                    this.notify('friend-request-accepted', data);
                    this.refreshFriendsFromSocket(data);
                });
                
                socket.on('friend-request-declined', (data) => {

                    this.notify('friend-request-declined', data);
                });
                
                socket.on('online-users-list', (data) => {

                    this.handleOnlineUsersList(data);
                });
                
                socket.on('online-users-response', (data) => {

                    this.handleOnlineUsersList(data.users || data);
                });
                
                this.socketListenersSetup = true;

            }
        };
        
        if (window.globalSocketManager && window.globalSocketManager.isReady()) {
            setupListeners();
        } else {
            window.addEventListener('globalSocketReady', setupListeners);
            window.addEventListener('socketAuthenticated', setupListeners);
        }
    }

    refreshFriendsFromSocket(data) {
        if (data.friend && this.cache.friends) {
            const existingFriend = this.cache.friends.find(f => f.id === data.friend.id);
            if (!existingFriend) {
                this.cache.friends.push({
                    id: data.friend.id,
                    username: data.friend.username,
                    avatar_url: data.friend.avatar_url || null
                });
                this.notify('friends-updated', this.cache.friends);

            }
        }
    }

    handleUserOnline(data) {
        const standardizedData = this.standardizePresenceData(data);
        if (standardizedData.user_id && standardizedData.username) {
            this.cache.onlineUsers[standardizedData.user_id] = standardizedData;
            this.notify('user-online', standardizedData);
        }
    }

    handleUserOffline(data) {
        const standardizedData = this.standardizePresenceData(data);
        if (standardizedData.user_id && this.cache.onlineUsers[standardizedData.user_id]) {
            delete this.cache.onlineUsers[standardizedData.user_id];
            this.notify('user-offline', standardizedData);
        }
    }

    handlePresenceUpdate(data) {
        const standardizedData = this.standardizePresenceData(data);
        if (standardizedData.user_id && standardizedData.username) {
            if (standardizedData.status === 'offline' || standardizedData.status === 'invisible') {
                if (this.cache.onlineUsers[standardizedData.user_id]) {
                    delete this.cache.onlineUsers[standardizedData.user_id];
                }
            } else {
                this.cache.onlineUsers[standardizedData.user_id] = standardizedData;
            }
            this.notify('user-presence-update', standardizedData);
        }
    }

    handleOnlineUsersList(data) {
        if (data && typeof data === 'object') {
            const standardizedUsers = {};
            Object.keys(data).forEach(userId => {
                standardizedUsers[userId] = this.standardizePresenceData(data[userId]);
            });
            this.cache.onlineUsers = standardizedUsers;
            this.lastUpdated.online = Date.now();

            this.notify('online-users-updated', standardizedUsers);
        }
    }

    standardizePresenceData(data) {
        return {
            user_id: data.user_id || data.userId || data.id,
            username: data.username || data.name,
            status: data.status || 'online',
            last_seen: data.last_seen || data.lastUpdated || Date.now(),
            activity_details: data.activity_details || data.activityDetails || null
        };
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

    async getFriends(forceRefresh = false) {
        if (!forceRefresh && this.cache.friends && this.cache.friends.length > 0) {

            return this.cache.friends;
        }

        if (!this.initialDataLoaded) {
            this.loadInitialServerData();
        }
        

        return this.cache.friends || [];
    }

    async getPendingRequests(forceRefresh = false) {
        if (!forceRefresh && this.cache.pendingRequests) {
            return this.cache.pendingRequests;
        }

        try {
            const response = await fetch('/api/friends/pending', {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });
            
            const data = await response.json();
            
            let pending = { incoming: [], outgoing: [] };
            
            if (data && data.success && data.data) {
                pending = {
                    incoming: Array.isArray(data.data.incoming) ? data.data.incoming : [],
                    outgoing: Array.isArray(data.data.outgoing) ? data.data.outgoing : [],
                    count: data.data.count || 0,
                    total_count: data.data.total_count || 0
                };
            } else if (data && data.data) {
                pending = {
                    incoming: Array.isArray(data.data.incoming) ? data.data.incoming : [],
                    outgoing: Array.isArray(data.data.outgoing) ? data.data.outgoing : [],
                    count: data.data.count || 0,
                    total_count: data.data.total_count || 0
                };
            } else if (data && data.incoming !== undefined && data.outgoing !== undefined) {
                pending = {
                    incoming: Array.isArray(data.incoming) ? data.incoming : [],
                    outgoing: Array.isArray(data.outgoing) ? data.outgoing : [],
                    count: data.count || 0,
                    total_count: data.total_count || 0
                };
            } else if (data && data.success === false) {
                console.warn('Pending requests API returned error:', data.error || data.message);
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
        if (!forceRefresh && this.cache.onlineUsers) {
            return this.cache.onlineUsers;
        }

        try {
            if (window.globalSocketManager && window.globalSocketManager.io) {
                window.globalSocketManager.io.emit('get-online-users');
                
                setTimeout(() => {
                    if (!this.cache.onlineUsers) {
                        this.cache.onlineUsers = {};
                    }
                }, 1000);
            }
            
            return this.cache.onlineUsers || {};
        } catch (error) {
            console.error('Error getting online users:', error);
            return this.cache.onlineUsers || {};
        }
    }

    async sendFriendRequest(username) {
        try {
            const response = await fetch('/api/friends', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ username })
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error sending friend request:', error);
            throw error;
        }
    }

    async acceptFriendRequest(friendshipId) {
        try {
            const response = await fetch(`/api/friends/accept?id=${friendshipId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error accepting friend request:', error);
            throw error;
        }
    }

    async declineFriendRequest(friendshipId) {
        try {
            const response = await fetch(`/api/friends/decline?id=${friendshipId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error declining friend request:', error);
            throw error;
        }
    }

    async removeFriend(userId) {
        try {
            const response = await fetch('/api/friends', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ user_id: userId })
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error removing friend:', error);
            throw error;
        }
    }

    getStatusColor(status) {
        const statusColors = {
            'online': 'bg-discord-green',
            'appear': 'bg-discord-green',
            'invisible': 'bg-gray-500',
            'away': 'bg-discord-yellow',
            'afk': 'bg-yellow-500',
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
            'afk': 'Away',
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