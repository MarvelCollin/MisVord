class SocketManager {
    constructor(messaging) {
        this.messaging = messaging;
        this.socket = null;
        this.connected = false;
        this.authenticated = false;
        this.globalSocketManager = null;
        this.waitingForGlobalSocket = false;
        this.syncInterval = null;
    }

    connectToGlobalSocketManager() {
        this.messaging.log('🔌 Connecting to global socket manager...');

        if (window.globalSocketManager) {
            this.messaging.log('✅ Global socket manager found immediately');
            
            if (window.globalSocketManager.isReady && window.globalSocketManager.isReady()) {
                this.messaging.log('✅ Global socket manager is ready immediately');
                this.setupGlobalSocketManager(window.globalSocketManager);
                return;
            } else {
                this.messaging.log('⏳ Global socket manager found but not ready, waiting...');
            }
        } else {
            this.messaging.log('⏳ Global socket manager not found, waiting...');
        }

        this.waitingForGlobalSocket = true;
        
        const readyHandler = (event) => {
            if (this.waitingForGlobalSocket) {
                this.messaging.log('📡 Global socket ready event received');
                if (window.globalSocketManager && window.globalSocketManager.isReady()) {
                    this.setupGlobalSocketManager(window.globalSocketManager);
                    this.waitingForGlobalSocket = false;
                    window.removeEventListener('globalSocketReady', readyHandler);
                    window.removeEventListener('globalSocketConnected', connectedHandler);
                    window.removeEventListener('misVordGlobalReady', misVordReadyHandler);
                }
            }
        };
        
        const connectedHandler = (event) => {
            if (this.waitingForGlobalSocket) {
                this.messaging.log('🟢 Global socket connected event received', event.detail);
                if (window.globalSocketManager && window.globalSocketManager.isReady()) {
                    this.setupGlobalSocketManager(window.globalSocketManager);
                    this.waitingForGlobalSocket = false;
                    window.removeEventListener('globalSocketReady', readyHandler);
                    window.removeEventListener('globalSocketConnected', connectedHandler);
                    window.removeEventListener('misVordGlobalReady', misVordReadyHandler);
                }
            }
        };
        
        const misVordReadyHandler = (event) => {
            if (this.waitingForGlobalSocket) {
                this.messaging.log('🚀 MisVord global ready event received', event.detail);
                if (event.detail && event.detail.socketManager) {
                    this.setupGlobalSocketManager(event.detail.socketManager);
                    this.waitingForGlobalSocket = false;
                    window.removeEventListener('globalSocketReady', readyHandler);
                    window.removeEventListener('globalSocketConnected', connectedHandler);
                    window.removeEventListener('misVordGlobalReady', misVordReadyHandler);
                }
            }
        };

        window.addEventListener('globalSocketReady', readyHandler);
        window.addEventListener('globalSocketConnected', connectedHandler);
        window.addEventListener('misVordGlobalReady', misVordReadyHandler);

        const pollForManager = () => {
            if (!this.waitingForGlobalSocket) {
                return;
            }

            if (window.globalSocketManager && window.globalSocketManager.isReady && window.globalSocketManager.isReady()) {
                this.messaging.log('✅ Global socket manager found via polling');
                this.setupGlobalSocketManager(window.globalSocketManager);
                this.waitingForGlobalSocket = false;
                window.removeEventListener('globalSocketReady', readyHandler);
                window.removeEventListener('globalSocketConnected', connectedHandler);
                window.removeEventListener('misVordGlobalReady', misVordReadyHandler);
                return;
            }

            if (pollCount < maxPolls) {
                pollCount++;
                setTimeout(pollForManager, 500);
            } else {
                this.messaging.log('⚠️ Timeout waiting for global socket manager');
                this.waitingForGlobalSocket = false;
            }
        };

        let pollCount = 0;
        const maxPolls = 20;
        setTimeout(pollForManager, 500);
    }

    waitForGlobalSocketReady() {
        const checkReady = () => {
            if (window.globalSocketManager && window.globalSocketManager.isReady && window.globalSocketManager.isReady()) {
                this.messaging.log('✅ Global socket manager is now ready');
                this.setupGlobalSocketManager(window.globalSocketManager);
                return;
            }

            this.messaging.log('⏳ Still waiting for global socket manager to be ready...');
            setTimeout(checkReady, 500);
        };

        const immediateCheck = () => {
            if (window.globalSocketManager && window.globalSocketManager.isReady()) {
                this.messaging.log('✅ Global socket manager ready immediately');
                this.setupGlobalSocketManager(window.globalSocketManager);
                return;
            }

            this.messaging.log('⏳ Global socket manager exists but not ready, waiting...');
            
            if (window.globalSocketManager && window.globalSocketManager.isReady()) {
                this.setupGlobalSocketManager(window.globalSocketManager);
                return;
            }
        };

        checkReady();
    }

    setupGlobalSocketManager(globalManager) {
        this.messaging.log('🔧 Setting up global socket manager connection...');
        
        this.globalSocketManager = globalManager;
        this.socket = globalManager.socket;
        this.connected = globalManager.socket ? globalManager.socket.connected : false;
        this.authenticated = globalManager.authenticated || false;
        
        this.messaging.log('📊 Global socket manager setup complete:', {
            hasSocket: !!this.socket,
            connected: this.connected,
            authenticated: this.authenticated
        });

        if (globalManager.isGuest) {
            this.messaging.log('👤 Guest mode detected - messaging will be limited');
            return;
        }

        this.messaging.userId = globalManager.userId;
        this.messaging.username = globalManager.username;

        this.setupGlobalSocketEventListeners();
        this.syncWithGlobalManager();

        const urlParams = new URLSearchParams(window.location.search);
        const dmParam = urlParams.get('dm');
        
        if (dmParam && (!this.messaging.activeChatRoom || this.messaging.activeChatRoom != dmParam)) {
            this.messaging.log('🔄 DM parameter detected, joining chat room:', dmParam);
            this.messaging.activeChatRoom = dmParam;
            this.messaging.chatType = 'direct';
            this.messaging.joinDMRoom(dmParam);
        }

        this.messaging.authenticate();
        this.messaging.trackConnection('GLOBAL_MANAGER_SETUP', {
            userId: this.messaging.userId,
            username: this.messaging.username,
            connected: this.connected,
            authenticated: this.authenticated
        });
    }

    syncWithGlobalManager() {
        if (!this.globalSocketManager) {
            return;
        }

        const wasConnected = this.connected;
        const wasAuthenticated = this.authenticated;
        
        this.socket = this.globalSocketManager.socket;
        this.connected = this.globalSocketManager.socket ? this.globalSocketManager.socket.connected : false;
        this.authenticated = this.globalSocketManager.authenticated || false;
        this.messaging.userId = this.globalSocketManager.userId;
        this.messaging.username = this.globalSocketManager.username;

        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        this.syncInterval = setInterval(() => {
            const newConnected = this.globalSocketManager.socket ? this.globalSocketManager.socket.connected : false;
            const newAuthenticated = this.globalSocketManager.authenticated || false;
            
            if (wasConnected !== this.connected || wasAuthenticated !== this.authenticated) {
                this.messaging.log('🔄 Connection state changed:', {
                    connected: this.connected,
                    authenticated: this.authenticated
                });
                
                if (this.connected && this.authenticated) {
                    this.messaging.authenticate();
                }
            }
        }, 1000);
    }

    setupGlobalSocketEventListeners() {
        window.addEventListener('globalSocketReady', () => {
            this.messaging.log('🟢 Global socket ready event received');
            this.syncWithGlobalManager();
            this.messaging.updateStatus('connected');
        });

        window.addEventListener('messageReceived', (event) => {
            this.messaging.onNewMessage(event.detail);
        });

        window.addEventListener('typingStart', (event) => {
            this.messaging.onUserTyping(event.detail);
        });

        window.addEventListener('typingStop', (event) => {
            this.messaging.onUserStopTyping(event.detail);
        });

        window.addEventListener('userStatusChanged', (event) => {
            this.messaging.onUserStatusChange(event.detail);
        });

        if (this.socket) {
            this.registerSocketEvents();
        }
        
        window.addEventListener('globalSocketConnected', () => {
            this.messaging.log('🟢 Global socket connected');
            this.syncWithGlobalManager();
            this.messaging.updateStatus('connected');
        });
        
        window.addEventListener('globalSocketDisconnected', () => {
            this.messaging.log('🔴 Global socket disconnected');
            this.connected = false;
            this.messaging.updateStatus('disconnected');
        });
    }

    registerSocketEvents() {
        if (!this.socket) {
            this.messaging.error('❌ Cannot register socket events: socket is null');
            return;
        }

        this.messaging.log('📡 Registering socket event listeners...');        this.socket.on('message', (data) => {
            this.messaging.log('📨 Received socket message:', data);
            this.messaging.onNewMessage(data);
        });

        this.socket.on('new-channel-message', (data) => {
            this.messaging.log('📨 Received new channel message:', data);
            this.messaging.onNewMessage(data);
        });

        this.socket.on('new-direct-message', (data) => {
            this.messaging.log('📨 Received new direct message:', data);
            this.messaging.onNewMessage(data);
        });this.socket.on('user-typing', (data) => {
            this.messaging.onUserTyping(data);
        });

        this.socket.on('user-stop-typing', (data) => {
            this.messaging.onUserStopTyping(data);
        });

        this.socket.on('user-typing-dm', (data) => {
            this.messaging.onUserTyping(data);
        });

        this.socket.on('user-stop-typing-dm', (data) => {
            this.messaging.onUserStopTyping(data);
        });        this.socket.on('user_status_change', (data) => {
            this.messaging.onUserStatusChange(data);
        });

        this.socket.on('channel-joined', (data) => {
            this.messaging.onChannelJoined(data);
        });

        this.socket.on('channel-left', (data) => {
            this.messaging.onChannelLeft(data);
        });

        this.socket.on('dm-room-joined', (data) => {
            this.messaging.onDMRoomJoined(data);
        });

        this.socket.on('dm-room-left', (data) => {
            this.messaging.onDMRoomLeft(data);
        });

        this.socket.on('connect', () => {
            this.messaging.log('🟢 Socket connected');
            this.connected = true;
            this.messaging.trackConnection('SOCKET_CONNECTED');
        });

        this.socket.on('disconnect', () => {
            this.messaging.log('🔴 Socket disconnected');
            this.connected = false;
            this.messaging.trackConnection('SOCKET_DISCONNECTED');
        });

        this.messaging.log('✅ Socket event listeners registered');
    }

    authenticate() {
        const userId = this.messaging.getUserId();
        const username = this.messaging.getUsername();
        
        if (!userId || !username) {
            this.messaging.error('❌ Cannot authenticate: missing user data');
            return;
        }

        this.messaging.log('🔐 Authenticating with socket...', { userId, username });
        
        this.messaging.userId = userId;
        this.messaging.username = username;
        this.authenticated = true;
        
        const channelId = this.messaging.getActiveChannelId();
        const chatRoomId = this.messaging.getActiveChatRoomId();        if (this.messaging.chatType === 'direct' && chatRoomId) {
            this.joinDMRoom(chatRoomId);
        } else if (this.messaging.chatType === 'channel' && channelId) {
            this.joinChannel(channelId);
        }

        this.messaging.trackConnection('AUTHENTICATED', {
            userId: userId,
            username: username,
            channelId: channelId,
            chatRoomId: chatRoomId
        });
    }

    joinChannel(channelId) {
        if (this.socket && this.connected) {
            this.messaging.log('🏠 Joining channel:', channelId);
            this.socket.emit('join_channel', { channelId: channelId });
            this.messaging.activeChannel = channelId;
            this.messaging.chatType = 'channel';
        }
    }

    leaveDMRoom(chatRoomId) {
        this.messaging.log('🚪 Leaving DM room:', chatRoomId);
        
        if (this.socket && this.connected && this.messaging.activeChatRoom === chatRoomId) {
            this.socket.emit('leave_dm_room', { chatRoomId: chatRoomId });
            this.messaging.activeChatRoom = null;
            this.messaging.chatType = null;
        }
    }

    joinDMRoom(chatRoomId) {
        if (this.socket && this.connected) {
            this.messaging.log('💬 Joining DM room:', chatRoomId);
            this.socket.emit('join_dm_room', { chatRoomId: chatRoomId });
            this.messaging.activeChatRoom = chatRoomId;
            this.messaging.chatType = 'direct';
        }
    }
}

export default SocketManager;
