import { showToast } from '../../core/ui/toast.js';
import socketApi from '../../utils/socket-api.js';

class MisVordMessaging {
    constructor() {
        this.config = {
            socketPort: 1002,
            socketPath: '/socket.io',
            reconnectAttempts: 5,
            reconnectDelay: 1000,
            heartbeatInterval: 20000,
            debug: true
        };

        // Use global socket manager instead of creating own socket
        this.socket = null;
        this.connected = false;
        this.authenticated = false;
        this.reconnectAttempts = 0;
        this.isSubmitting = false;
        this.initialized = false;
        this.lastSubmitTime = 0;

        this.activeChannel = null;
        this.activeChatRoom = null;
        this.chatType = null; // 'channel' or 'direct'
        this.userId = null;
        this.username = null;

        this.typingUsers = new Map();
        this.typingTimeout = null;

        this.debug = this.config.debug;

        this.errors = [];
        this.connectionHistory = [];
        this.messageHistory = [];

        // Wait for global socket manager to be ready
        this.globalSocketManager = null;
        this.waitingForGlobalSocket = false;
        this.syncInterval = null;

        window.MisVordMessaging = this;
        window.logger.debug('messaging', 'MisVordMessaging instance created and registered globally (using global socket manager)');
        
        // Add debugging methods
        this.debugConnection = () => {
            return {
                messaging: {
                    connected: this.connected,
                    authenticated: this.authenticated,
                    socket: !!this.socket,
                    socketId: this.socket ? this.socket.id : 'none',
                    globalSocketManager: !!this.globalSocketManager,
                    initialized: this.initialized
                },
                globalManager: window.globalSocketManager ? {
                    connected: window.globalSocketManager.connected,
                    authenticated: window.globalSocketManager.authenticated,
                    initialized: window.globalSocketManager.initialized,
                    isGuest: window.globalSocketManager.isGuest,
                    socket: !!window.globalSocketManager.socket,
                    socketId: window.globalSocketManager.socket ? window.globalSocketManager.socket.id : 'none',
                    isReady: window.globalSocketManager.isReady ? window.globalSocketManager.isReady() : false
                } : null
            };
        };
        
        // Add manual reconnection method
        this.forceReconnect = () => {
            this.log('🔄 Forcing reconnection to global socket manager...');
            this.connected = false;
            this.authenticated = false;
            this.socket = null;
            this.connectToGlobalSocketManager();
        };
        
        // Add manual sync trigger
        this.manualSync = () => {
            this.log('🔧 Manual sync triggered');
            if (this.globalSocketManager) {
                this.syncWithGlobalManager();
            } else {
                this.log('❌ No global socket manager available for sync');
            }
        };
        
        // Add status check method
        this.checkStatus = () => {
            return {
                hasGlobalManager: !!this.globalSocketManager,
                globalManagerReady: this.globalSocketManager ? this.globalSocketManager.isReady() : false,
                messagingConnected: this.connected,
                messagingAuthenticated: this.authenticated,
                socketExists: !!this.socket,
                socketId: this.socket ? this.socket.id : 'none',
                activeChatType: this.chatType,
                activeChatRoom: this.activeChatRoom,
                activeChannel: this.activeChannel
            };
        };
    }

    log(...args) {
        window.logger.debug('messaging', ...args);
    }

    error(...args) {
        window.logger.error('messaging', ...args);
    }    init() {        if (this.initialized) {
            window.logger.debug('messaging', 'Already initialized, skipping duplicate initialization');
            return;
        }
        
        if (this.isVoiceChannel()) {
            window.logger.debug('messaging', 'Voice channel detected, skipping messaging initialization');
            return;
        }

        const messageContainer = document.getElementById('chat-messages');
        const messageForm = document.getElementById('message-form');
        const messageInput = document.getElementById('message-input');
        
        if (!messageContainer && !messageForm && !messageInput) {
            window.logger.debug('messaging', 'No messaging elements found, skipping messaging initialization (this is normal for server pages without selected channels)');
            return;
        }

        window.logger.info('messaging', 'Initializing messaging system with global socket manager...');
        this.logSystemInfo();

        try {
            // Use global socket manager instead of creating own socket
            this.connectToGlobalSocketManager();
            this.initMessageForm();
            this.initMessageContainer();

            this.log('✅ Messaging system initialized successfully');
            this.initialized = true;

            this.dispatchEvent('misVordReady', { messaging: this });

        } catch (error) {
            this.error('❌ Failed to initialize messaging system:', error);
            this.trackError('INIT_FAILED', error);
        }
    }

    /**
     * Connect to the global socket manager instead of creating own socket
     */    connectToGlobalSocketManager() {
        this.log('🔌 Connecting to global socket manager...');

        // First, try to connect immediately if available and ready
        if (window.globalSocketManager) {
            this.log('✅ Global socket manager found immediately');
            
            if (window.globalSocketManager.isReady && window.globalSocketManager.isReady()) {
                this.log('✅ Global socket manager is ready immediately');
                this.setupGlobalSocketManager(window.globalSocketManager);
                return;
            } else {
                this.log('⏳ Global socket manager found but not ready, waiting...');
            }
        } else {
            this.log('⏳ Global socket manager not found, waiting...');
        }

        // Set up comprehensive event listening to catch the global socket manager when it's ready
        this.waitingForGlobalSocket = true;
        
        // Listen for the ready event (dispatched when authentication completes)
        const readyHandler = (event) => {
            if (this.waitingForGlobalSocket) {
                this.log('📡 Global socket ready event received');
                if (window.globalSocketManager && window.globalSocketManager.isReady()) {
                    this.setupGlobalSocketManager(window.globalSocketManager);
                    this.waitingForGlobalSocket = false;
                    window.removeEventListener('globalSocketReady', readyHandler);
                    window.removeEventListener('globalSocketConnected', connectedHandler);
                    window.removeEventListener('misVordGlobalReady', misVordReadyHandler);
                }
            }
        };
        
        // Listen for connection event (dispatched when socket connects and authenticates)
        const connectedHandler = (event) => {
            if (this.waitingForGlobalSocket) {
                this.log('🟢 Global socket connected event received', event.detail);
                if (window.globalSocketManager && window.globalSocketManager.isReady()) {
                    this.setupGlobalSocketManager(window.globalSocketManager);
                    this.waitingForGlobalSocket = false;
                    window.removeEventListener('globalSocketReady', readyHandler);
                    window.removeEventListener('globalSocketConnected', connectedHandler);
                    window.removeEventListener('misVordGlobalReady', misVordReadyHandler);
                }
            }
        };
        
        // Listen for misVord global ready (alternative event name)
        const misVordReadyHandler = (event) => {
            if (this.waitingForGlobalSocket) {
                this.log('📡 MisVord global ready event received', event.detail);
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
        
        // Polling fallback - check every 500ms for up to 30 seconds
        let pollCount = 0;
        const maxPolls = 60; // 30 seconds
        
        const pollForManager = () => {
            pollCount++;
            
            if (!this.waitingForGlobalSocket) {
                return; // Already connected
            }
            
            if (window.globalSocketManager && window.globalSocketManager.isReady && window.globalSocketManager.isReady()) {
                this.log('✅ Global socket manager found via polling (attempt ' + pollCount + ')');
                this.setupGlobalSocketManager(window.globalSocketManager);
                this.waitingForGlobalSocket = false;
                window.removeEventListener('globalSocketReady', readyHandler);
                window.removeEventListener('globalSocketConnected', connectedHandler);
                window.removeEventListener('misVordGlobalReady', misVordReadyHandler);
                return;
            }
            
            if (pollCount < maxPolls) {
                this.log('⏳ Still waiting for global socket manager... (attempt ' + pollCount + '/' + maxPolls + ')');
                setTimeout(pollForManager, 500);
            } else {
                this.log('❌ Timeout waiting for global socket manager after ' + (maxPolls * 500 / 1000) + ' seconds');
                this.waitingForGlobalSocket = false;
                this.updateStatus('error', 'Failed to connect to socket manager');
                window.removeEventListener('globalSocketReady', readyHandler);
                window.removeEventListener('globalSocketConnected', connectedHandler);
                window.removeEventListener('misVordGlobalReady', misVordReadyHandler);
            }
        };
        
        // Start polling
        setTimeout(pollForManager, 500);
    }
      waitForGlobalSocketReady() {
        const checkReady = () => {
            if (window.globalSocketManager && window.globalSocketManager.isReady && window.globalSocketManager.isReady()) {
                this.log('✅ Global socket manager is now ready');
                this.setupGlobalSocketManager(window.globalSocketManager);
                this.waitingForGlobalSocket = false;
            } else {
                this.log('⏳ Still waiting for global socket manager to be ready...', {
                    exists: !!window.globalSocketManager,
                    hasIsReady: window.globalSocketManager ? !!window.globalSocketManager.isReady : false,
                    isReady: window.globalSocketManager && window.globalSocketManager.isReady ? window.globalSocketManager.isReady() : false
                });
                setTimeout(checkReady, 500);
            }
        };
        
        // Listen for the ready event
        window.addEventListener('globalSocketReady', (event) => {
            this.log('📡 Global socket ready event received');
            if (window.globalSocketManager && window.globalSocketManager.isReady()) {
                this.setupGlobalSocketManager(window.globalSocketManager);
                this.waitingForGlobalSocket = false;
            }
        });
        
        // Listen for connection event
        window.addEventListener('globalSocketConnected', (event) => {
            this.log('🟢 Global socket connected event received', event.detail);
            if (window.globalSocketManager && window.globalSocketManager.isReady()) {
                this.setupGlobalSocketManager(window.globalSocketManager);
                this.waitingForGlobalSocket = false;
            }
        });
        
        checkReady();
    }/**
     * Setup connection with global socket manager
     */
    setupGlobalSocketManager(globalManager) {
        this.log('🔗 Setting up connection with global socket manager');
        this.log('📊 Global manager status:', {
            isGuest: globalManager.isGuest,
            connected: globalManager.connected,
            authenticated: globalManager.authenticated,
            initialized: globalManager.initialized,
            userId: globalManager.userId,
            username: globalManager.username,
            socketId: globalManager.socket ? globalManager.socket.id : 'none'
        });
        
        this.globalSocketManager = globalManager;
        
        if (globalManager.isGuest) {
            this.log('👤 Guest user detected, messaging disabled');
            this.updateStatus('error', 'Login required for messaging');
            return;
        }

        // Use the global socket connection and sync states
        this.syncWithGlobalManager();

        // Listen for global socket events that we care about for messaging
        this.setupGlobalSocketEventListeners();        // Join active channel if we have one
        this.joinActiveChannel();
        
        // Also check if we need to initialize based on URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const dmParam = urlParams.get('dm');
        if (dmParam && (!this.activeChatRoom || this.activeChatRoom != dmParam)) {
            this.log('🔄 Initializing direct message context from URL:', dmParam);
            this.setChatContext(dmParam, 'direct');
        }

        this.log('✅ Successfully connected to global socket manager');
        this.updateStatus('connected');
        
        // Trigger a status update event for socket status monitoring
        window.dispatchEvent(new CustomEvent('messagingSystemReady', {
            detail: { 
                messaging: this,
                connected: this.connected,
                authenticated: this.authenticated 
            }
        }));
    }

    /**
     * Sync messaging system state with global socket manager
     */
    syncWithGlobalManager() {
        if (!this.globalSocketManager) {
            this.log('⚠️ No global socket manager to sync with');
            return;
        }

        // Update connection state
        this.socket = this.globalSocketManager.socket;
        this.connected = this.globalSocketManager.connected;
        this.authenticated = this.globalSocketManager.authenticated;
        this.userId = this.globalSocketManager.userId;
        this.username = this.globalSocketManager.username;

        this.log('🔄 Synced messaging state with global manager:', {
            connected: this.connected,
            authenticated: this.authenticated,
            socket: !!this.socket,
            socketId: this.socket ? this.socket.id : 'none',
            isReady: this.globalSocketManager.isReady ? this.globalSocketManager.isReady() : false
        });

        // Periodically sync state to catch any updates
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        this.syncInterval = setInterval(() => {
            const wasConnected = this.connected;
            const wasAuthenticated = this.authenticated;
            
            this.connected = this.globalSocketManager.connected;
            this.authenticated = this.globalSocketManager.authenticated;
            this.socket = this.globalSocketManager.socket;
            
            if (wasConnected !== this.connected || wasAuthenticated !== this.authenticated) {
                this.log('🔄 State changed, updating status:', {
                    wasConnected, nowConnected: this.connected,
                    wasAuthenticated, nowAuthenticated: this.authenticated
                });
                
                if (this.connected && this.authenticated) {
                    this.updateStatus('connected');
                } else {
                    this.updateStatus('disconnected');
                }
            }
        }, 1000);
    }

    /**
     * Setup event listeners for global socket events
     */
    setupGlobalSocketEventListeners() {
        // Listen for global socket connection state changes
        window.addEventListener('globalSocketReady', () => {
            this.log('🟢 Global socket ready event received');
            this.syncWithGlobalManager();
            this.updateStatus('connected');
        });

        // Listen for messaging-specific events
        window.addEventListener('messageReceived', (event) => {
            this.onNewMessage(event.detail);
        });

        window.addEventListener('typingStart', (event) => {
            this.onUserTyping(event.detail);
        });

        window.addEventListener('typingStop', (event) => {
            this.onUserStopTyping(event.detail);
        });

        window.addEventListener('userStatusChanged', (event) => {
            this.onUserStatusChange(event.detail);
        });

        // Also listen directly on the socket for compatibility
        if (this.socket) {
            this.registerSocketEvents();
        }
        
        // Listen for socket connection/disconnection to update our status
        window.addEventListener('globalSocketConnected', () => {
            this.log('🟢 Global socket connected');
            this.syncWithGlobalManager();
            this.updateStatus('connected');
        });
        
        window.addEventListener('globalSocketDisconnected', () => {
            this.log('🔴 Global socket disconnected');
            this.connected = false;
            this.updateStatus('disconnected');
        });
    }

    dispatchEvent(eventName, detail = {}) {
        try {
            const event = new CustomEvent(eventName, { detail });
            window.dispatchEvent(event);
            this.log(`📡 Dispatched event: ${eventName}`, detail);
        } catch (error) {
            this.error('Failed to dispatch event:', error);
        }
    }

    logSystemInfo() {
        this.log('📊 System Information:', {
            userAgent: navigator.userAgent,
            location: window.location.href,
            socketIOAvailable: typeof io !== 'undefined',
            userId: this.getUserId(),
            username: this.getUsername(),
            activeChannel: this.getActiveChannelId(),
            timestamp: new Date().toISOString()
        });
    }

    trackError(type, error) {
        const errorInfo = {
            type: type,
            message: error.message || error,
            stack: error.stack || 'No stack trace',
            timestamp: new Date().toISOString(),
            connected: this.connected,
            authenticated: this.authenticated,
            activeChannel: this.activeChannel,
            userId: this.userId
        };

        this.errors.push(errorInfo);
        this.error('🔴 Error tracked:', errorInfo);

        if (this.errors.length > 20) {
            this.errors.shift();
        }
    }

    trackConnection(event, data = {}) {
        const connectionInfo = {
            event: event,
            timestamp: new Date().toISOString(),
            socketId: this.socket?.id || 'none',
            connected: this.connected,
            authenticated: this.authenticated,
            data: data
        };

        this.connectionHistory.push(connectionInfo);
        this.log('🔗 Connection event:', connectionInfo);

        if (this.connectionHistory.length > 50) {
            this.connectionHistory.shift();
        }
    }

    trackMessage(event, data = {}) {
        const messageInfo = {
            event: event,
            timestamp: new Date().toISOString(),
            channelId: data.channelId || this.activeChannel,
            messageId: data.id || data.messageId,
            tempId: data.tempId,
            content: data.content ? data.content.substring(0, 50) + '...' : 'no content'
        };

        this.messageHistory.push(messageInfo);
        this.log('💬 Message event:', messageInfo);

        if (this.messageHistory.length > 30) {
            this.messageHistory.shift();
        }
    }

    authenticate() {
        this.log('🔐 Authenticating user...');

        const userId = this.getUserId();
        const username = this.getUsername();

        if (!userId || !username) {
            this.error('❌ Cannot authenticate: missing user data', { userId, username });
            return;
        }

        const authData = {
            userId: userId,
            username: username
        };

        this.log('📤 Sending authentication data:', authData);
        this.socket.emit('authenticate', authData);
    }    joinActiveChannel() {
        this.log('🏠 Joining active channel or chat room...');

        const channelId = this.getActiveChannelId();
        const chatRoomId = this.getActiveChatId();
        
        if (this.chatType === 'direct' && chatRoomId) {
            this.joinDMRoom(chatRoomId);
        } else if (channelId) {
            // Use global socket manager if available
            if (this.globalSocketManager && this.globalSocketManager.isReady()) {
                this.globalSocketManager.joinChannel(channelId);
                this.activeChannel = channelId;
                this.log('🏠 Joined channel via global manager:', channelId);
            } else if (this.socket && this.connected) {
                this.socket.emit('join-channel', channelId);
                this.activeChannel = channelId;
                this.log('🏠 Joined channel via direct socket:', channelId);
            }
        }
    }    joinDMRoom(chatRoomId) {
        this.log('💬 Joining DM room:', chatRoomId);
        
        if (this.socket && this.connected) {
            this.socket.emit('join-dm-room', { roomId: chatRoomId });
            this.activeChatRoom = chatRoomId;
            this.log('💬 Joined DM room via socket:', chatRoomId);
        } else {
            this.log('⚠️ Cannot join DM room - socket not connected');
        }
    }

    leaveDMRoom(chatRoomId) {
        this.log('👋 Leaving DM room:', chatRoomId);
        
        if (this.socket && this.connected && this.activeChatRoom === chatRoomId) {
            this.socket.emit('leave-dm-room', { roomId: chatRoomId });
            this.activeChatRoom = null;
            this.log('👋 Left DM room via socket:', chatRoomId);
        }
    }async sendMessage(chatId, content, chatType = 'channel') {
        this.log('📤 Attempting to send message...');
        
        // Detailed status check
        const statusCheck = {
            chatId: !!chatId,
            content: !!content,
            chatType: chatType,
            connected: this.connected,
            socket: !!this.socket,
            userId: this.getUserId(),
            authenticated: this.authenticated,
            globalSocketManager: !!this.globalSocketManager,
            globalManagerReady: this.globalSocketManager ? this.globalSocketManager.isReady() : false,
            socketId: this.socket ? this.socket.id : 'none'
        };
        
        this.log('📊 Send conditions check:', statusCheck);

        if (!chatId || !content) {
            const error = new Error('Missing required data: chatId=' + !!chatId + ', content=' + !!content);
            this.trackError('SEND_MISSING_DATA', error);
            return false;
        }

        const tempId = 'temp_' + Date.now();

        try {
            // Create and display temp message immediately
            const tempMessage = this.createTempMessage(content, tempId);
            this.appendMessage(tempMessage);            // Send message via ChatAPI
            const response = await window.ChatAPI.sendMessage(chatId, content, chatType);
              if (response.success) {
                // Remove temp message
                this.removeTempMessage(tempId);
                
                // Display the real message immediately
                if (response.data && response.data.message) {
                    this.appendMessage(response.data.message);
                    this.log('✅ Message displayed:', response.data.message);
                } else {
                    this.log('⚠️ No message data in response to display', response);
                }
                  // Send socket event for real-time updates to other users
                if (this.globalSocketManager && this.globalSocketManager.isReady()) {
                    if (chatType === 'direct') {
                        // For direct messages, send to DM room
                        this.globalSocketManager.socket.emit('direct-message', {
                            roomId: chatId,
                            content: content,
                            messageType: 'text',
                            timestamp: new Date().toISOString(),
                            tempId: tempId
                        });
                        this.log('📡 Direct message socket event sent for room:', chatId);
                    } else {
                        // For channel messages
                        this.globalSocketManager.socket.emit('channel-message', {
                            channelId: chatId,
                            content: content,
                            messageType: 'text',
                            timestamp: new Date().toISOString(),
                            tempId: tempId
                        });
                        this.log('📡 Channel message socket event sent for channel:', chatId);
                    }
                } else {
                    this.log('⚠️ Socket not ready, real-time updates disabled');
                }
                
                this.trackMessage('MESSAGE_SENT', { chatId, content, chatType, tempId });
                return true;
            } else {
                // Remove temp message on failure
                this.removeTempMessage(tempId);
                this.showToast(response.error || 'Failed to send message. Please try again.', 'error');
                return false;
            }        } catch (error) {
            // Remove temp message on error
            this.removeTempMessage(tempId);
            this.error('Error sending message:', error);
            this.trackError('SEND_API_ERROR', error);
            this.showToast('Failed to send message. Please try again.', 'error');
            return false;
        }
    }

    async sendRichMessage(messageData) {
        this.log('📤 Attempting to send rich message...', messageData);
        
        const chatId = this.getActiveChatId();
        const chatType = this.getChatType() || 'channel';
        
        if (!chatId) {
            throw new Error('No active chat selected');
        }

        // Handle file uploads first if present
        let attachmentUrl = null;
        if (messageData.attachments && messageData.attachments.length > 0) {
            // Files should already be uploaded by the composer
            const attachment = messageData.attachments[0]; // Take first attachment
            attachmentUrl = attachment.file_url;
        }

        // Prepare the message payload
        const payload = {
            target_type: chatType,
            target_id: chatId,
            content: messageData.content || '',
            message_type: messageData.type || 'text',
            attachment_url: attachmentUrl,
            mentions: messageData.mentions || []
        };

        const tempId = 'temp_' + Date.now();

        try {
            // Create and display temp message immediately
            const tempMessage = this.createTempRichMessage(messageData, tempId);
            this.appendMessage(tempMessage);

            // Send via API
            const response = await fetch('/api/chat/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.success) {
                // Remove temp message
                this.removeTempMessage(tempId);
                
                // Display the real message
                if (result.data && result.data.message) {
                    this.appendMessage(result.data.message);
                    this.log('✅ Rich message displayed:', result.data.message);
                }

                // Send socket event for real-time updates
                if (this.globalSocketManager && this.globalSocketManager.isReady()) {
                    const socketData = {
                        content: messageData.content || '',
                        messageType: messageData.type || 'text',
                        attachmentUrl: attachmentUrl,
                        mentions: messageData.mentions || [],
                        timestamp: new Date().toISOString(),
                        tempId: tempId
                    };

                    if (chatType === 'direct') {
                        this.globalSocketManager.socket.emit('direct-message', {
                            roomId: chatId,
                            ...socketData
                        });
                    } else {
                        this.globalSocketManager.socket.emit('channel-message', {
                            channelId: chatId,
                            ...socketData
                        });
                    }
                }

                return true;
            } else {
                this.removeTempMessage(tempId);
                throw new Error(result.error || 'Failed to send rich message');
            }

        } catch (error) {
            this.removeTempMessage(tempId);
            this.error('Error sending rich message:', error);
            throw error;
        }
    }

    createTempRichMessage(messageData, tempId) {
        const user = this.getCurrentUser();
        const now = new Date();
        
        let tempMessage = {
            id: tempId,
            user_id: user.id,
            username: user.username,
            avatar_url: user.avatar_url || '/assets/images/default-avatar.png',
            content: messageData.content || '',
            message_type: messageData.type || 'text',
            attachment_url: messageData.attachments && messageData.attachments.length > 0 ? messageData.attachments[0].file_url : null,
            mentions: messageData.mentions || [],
            sent_at: now.toISOString(),
            is_temp: true
        };

        return tempMessage;
    }

    initSocket() {
        this.log('🔌 Setting up WebSocket connection...');

        try {
            if (typeof io === 'undefined') {
                const error = new Error('Socket.IO not available - messaging disabled');
                this.trackError('SOCKET_IO_UNAVAILABLE', error);
                this.updateStatus('error', 'WebSocket required but not available');
                this.showToast('Real-time messaging unavailable. Please refresh the page.', 'error');
                return;
            }

            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = window.location.hostname;
            const socketUrl = protocol + '//' + host + ':' + this.config.socketPort + this.config.socketPath;

            this.log('🔗 Connecting to:', socketUrl, 'with path:', this.config.socketPath);

            this.socket = io(socketUrl, {
                path: this.config.socketPath,
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionDelay: this.config.reconnectDelay,
                reconnectionAttempts: this.config.reconnectAttempts,
                timeout: 20000,
                forceNew: true
            });            this.registerSocketEvents();
            this.trackConnection('SOCKET_CREATED', { url: socketUrl });
            this.updateStatus('connecting');
        } catch (error) {
            this.trackError('SOCKET_INIT_FAILED', error);
            this.updateStatus('error', error.message);
            this.showToast('Failed to connect to chat server', 'error');
        }
    }

    registerSocketEvents() {
        if (!this.socket) {
            this.error('❌ Cannot register socket events - no socket available');
            return;
        }

        this.log('📡 Registering socket events...');

        this.socket.on('connect', () => this.onSocketConnect());
        this.socket.on('disconnect', (reason) => this.onSocketDisconnect(reason));
        this.socket.on('connect_error', error => this.onSocketError(error));
        this.socket.on('reconnect', (attemptNumber) => this.onSocketReconnect(attemptNumber));
        this.socket.on('reconnect_error', error => this.onSocketReconnectError(error));
        this.socket.on('reconnect_failed', () => this.onSocketReconnectFailed());        this.socket.on('new-channel-message', data => this.onNewMessage(data));
        this.socket.on('new-direct-message', data => this.onNewDirectMessage(data));
        this.socket.on('message_error', data => this.onMessageError(data));
        this.socket.on('message-sent-confirmation', data => this.onMessageSentConfirmation(data));

        this.socket.on('auth_success', data => this.onAuthSuccess(data));
        this.socket.on('auth_error', data => this.onAuthError(data));
        this.socket.on('connection_established', data => this.onConnectionEstablished(data));

        this.socket.on('channel-joined', data => this.onChannelJoined(data));
        this.socket.on('channel-left', data => this.onChannelLeft(data));
        this.socket.on('dm-room-joined', data => this.onDMRoomJoined(data));
        this.socket.on('dm-room-left', data => this.onDMRoomLeft(data));

        this.socket.on('user-status-change', data => this.onUserStatusChange(data));
        this.socket.on('user-typing', data => this.onUserTyping(data));
        this.socket.on('user-stop-typing', data => this.onUserStopTyping(data));
        this.socket.on('heartbeat-response', () => this.onHeartbeatResponse());

        this.log('✅ Socket events registered successfully');
    }

    onUserStatusChange(data) { 
        this.log('👤 User status change:', data);

        if (data.userId && data.status) {
            const userElements = document.querySelectorAll('[data-user-id="' + data.userId + '"]');
            userElements.forEach(element => {

                const statusIndicator = element.querySelector('.user-status') || document.createElement('div');
                statusIndicator.className = 'user-status';
                statusIndicator.textContent = data.status;

                statusIndicator.classList.remove('text-green-500', 'text-yellow-500', 'text-gray-500', 'text-red-500');
                switch (data.status) {
                    case 'online':
                        statusIndicator.classList.add('text-green-500');
                        break;
                    case 'away':
                        statusIndicator.classList.add('text-yellow-500');
                        break;
                    case 'dnd':
                        statusIndicator.classList.add('text-red-500');
                        break;
                    case 'offline':
                        statusIndicator.classList.add('text-gray-500');
                        break;
                }

                if (!element.querySelector('.user-status')) {
                    element.appendChild(statusIndicator);
                }
            });
        }
    }

    onUserTyping(data) { 
        this.log('⌨️ User typing:', data);

        const { userId, username, channelId } = data;

        if (channelId === this.getActiveChannelId() && userId !== this.getUserId()) {
            this.typingUsers.set(userId, {
                username: username || 'User ' + userId,
                timestamp: Date.now()
            });

            this.updateTypingIndicator();
        }
    }

    onUserStopTyping(data) { 
        this.log('⌨️ User stop typing:', data);

        const { userId, channelId } = data;

        if (channelId === this.getActiveChannelId()) {
            this.typingUsers.delete(userId);
            this.updateTypingIndicator();
        }
    }

    onHeartbeatResponse() { 
        this.log('💓 Heartbeat response received');

    }

    updateTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (!typingIndicator) return;

        const now = Date.now();
        for (const [userId, userData] of this.typingUsers.entries()) {
            if (now - userData.timestamp > 5000) {
                this.typingUsers.delete(userId);
            }
        }

        const typingCount = this.typingUsers.size;

        if (typingCount === 0) {
            typingIndicator.classList.add('hidden');
        } else {
            const typingText = this.formatTypingText();
            const textElement = typingIndicator.querySelector('span:last-child');
            if (textElement) {
                textElement.textContent = typingText;
            }
            typingIndicator.classList.remove('hidden');
        }
    }

    formatTypingText() {
        const typingArray = Array.from(this.typingUsers.values());
        const count = typingArray.length;

        if (count === 1) {
            return typingArray[0].username + " is typing...";
        } else if (count === 2) {
            return typingArray[0].username + " and " + typingArray[1].username + " are typing...";
        } else if (count === 3) {
            return typingArray[0].username + ", " + typingArray[1].username + ", and " + typingArray[2].username + " are typing...";
        } else {
            return typingArray[0].username + " and " + (count - 1) + " others are typing...";
        }
    }

    onSocketConnect() {
        this.log('🟢 WebSocket connected with ID:', this.socket.id);
        this.connected = true;
        this.reconnectAttempts = 0;
        this.trackConnection('CONNECTED', { socketId: this.socket.id });
        this.updateStatus('connected');
        this.authenticate();
    }

    onSocketDisconnect(reason) {
        this.log('🔴 WebSocket disconnected. Reason:', reason);
        this.connected = false;
        this.authenticated = false;
        this.trackConnection('DISCONNECTED', { reason });
        this.updateStatus('disconnected');

        this.typingUsers.clear();
        this.updateTypingIndicator();
    }

    onSocketError(error) {
        this.error('💥 WebSocket connection error:', error);
        this.trackError('SOCKET_ERROR', error);
        this.updateStatus('error', error.message);

        if (++this.reconnectAttempts >= this.config.reconnectAttempts) {
            this.error('❌ Max reconnection attempts reached');
            this.trackError('MAX_RECONNECT_REACHED', { attempts: this.reconnectAttempts });
            this.updateStatus('error', 'Connection failed - please refresh');
            this.showToast('Unable to connect to chat server. Please refresh the page.', 'error');
        }
    }

    onSocketReconnect(attemptNumber) {
        this.log('🔄 WebSocket reconnected after', attemptNumber, 'attempts');
        this.trackConnection('RECONNECTED', { attemptNumber });
    }

    onSocketReconnectError(error) {
        this.error('🔄❌ WebSocket reconnection error:', error);
        this.trackError('RECONNECT_ERROR', error);
    }

    onSocketReconnectFailed() {
        this.error('❌ WebSocket reconnection failed completely');
        this.trackError('RECONNECT_FAILED', { attempts: this.reconnectAttempts });
    }

    onAuthSuccess(data) {
        this.log('✅ Authentication successful:', data);
        this.authenticated = true;
        this.trackConnection('AUTHENTICATED', data);
        this.joinActiveChannel();
    }

    onAuthError(data) {
        this.error('❌ Authentication failed:', data);
        this.trackError('AUTH_FAILED', data);
        this.showToast('Failed to authenticate: ' + (data.message || 'Unknown error'), 'error');
    }

    onConnectionEstablished(data) {
        this.log('🤝 Connection established, socket ID:', data.socketId);
        this.trackConnection('CONNECTION_ESTABLISHED', data);
        this.authenticate();
    }

    onChannelJoined(data) {
        this.log('🏠 Joined channel:', data.channelId);
        this.activeChannel = data.channelId;
        this.trackConnection('CHANNEL_JOINED', data);
        this.updateStatus('joined', 'Connected to chat');
    }

    onChannelLeft(data) {
        this.log('👋 Left channel:', data.channelId);
        this.trackConnection('CHANNEL_LEFT', data);
    }    onNewMessage(data) {
        this.log('📨 Received new message:', data);
        this.trackMessage('MESSAGE_RECEIVED', data);

        // Check if message is for current chat room (works for both channels and DMs)
        const currentChatId = this.getActiveChatId();
        const messageChatId = data.chatRoomId || data.channelId;
        
        if (messageChatId && messageChatId != currentChatId) {
            this.log('⚠️ Ignoring message for different chat:', messageChatId, 'vs current:', currentChatId);
            return;
        }

        if (data.id && document.getElementById('msg-' + data.id)) {
            this.log('⚠️ Message already displayed, ignoring duplicate:', data.id);
            return;
        }

        if (data.user_id) {
            this.removeTempMessagesByUserId(data.user_id);
        }

        this.appendMessage(data);

        if (data.user_id) {
            this.removeUserFromTyping(data.user_id);
        }
    }

    onMessageError(data) {
        this.error('❌ Message error:', data);
        this.trackError('MESSAGE_ERROR', data);
        this.showToast('Error sending message: ' + (data.message || 'Unknown error'), 'error');
        this.removeTempMessages();
    }

    onMessageSentConfirmation(data) {
        this.log('✅ Message sent confirmation received:', data);
        this.trackMessage('MESSAGE_CONFIRMED', data);

        if (data.isDuplicate) {
            this.log('⚠️ Server detected a duplicate message:', data);

            if (data.tempId) {
                const tempMsg = document.getElementById('msg-' + data.tempId);
                if (tempMsg) {
                    this.log('🗑️ Removing temp message that was flagged as duplicate:', data.tempId);
                    tempMsg.remove();
                }
            }
            return;
        }

        if (data.tempId) {
            const tempMsg = document.getElementById('msg-' + data.tempId);
            if (tempMsg) {
                this.log('🗑️ Removing temp message with ID:', data.tempId);
                tempMsg.remove();
            }
        }
    }

    removeTempMessagesByUserId(userId) {
        const tempUserMessages = document.querySelectorAll('.temp-message[data-user-id="' + userId + '"]');
        if (tempUserMessages.length > 0) {
            this.log('🗑️ Removing ' + tempUserMessages.length + ' temporary messages for user ' + userId);
            tempUserMessages.forEach(msg => msg.remove());
        }
    }    initMessageForm() {
        const form = document.getElementById('message-form');
        if (!form) {
            this.log('ℹ️ Message form not found - skipping message form initialization');
            return;
        }        form.addEventListener('submit', async e => {
            e.preventDefault();
            e.stopPropagation();
            await this.handleSubmit(form);
            return false;
        });

        const textarea = document.getElementById('message-input');
        if (textarea) {

            textarea.addEventListener('input', (e) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
                this.handleTyping();
            });            textarea.addEventListener('keydown', async e => {
                if (e.key === 'Enter') {
                    if (e.shiftKey) {
                        return;
                    } else {
                        e.preventDefault();
                        e.stopPropagation();

                        const content = e.target.value.trim();
                        if (content) {
                            await this.handleSubmit(form);
                        }
                        return false;
                    }
                }
            });

            textarea.addEventListener('blur', () => this.stopTyping());
            setTimeout(() => textarea.focus(), 100);            } else {
                this.log('ℹ️ Message textarea not found - skipping textarea initialization');
            }

        this.log('Message form initialized');
    }

    async handleSubmit(form) {
        this.log('📝 handleSubmit called', { isSubmitting: this.isSubmitting });

        if (this.isSubmitting) {
            this.log('Already submitting, ignoring duplicate submission');
            return;
        }

        this.isSubmitting = true;

        const currentTime = Date.now();
        if (this.lastSubmitTime && (currentTime - this.lastSubmitTime < 500)) {
            this.log('Duplicate submission detected (too soon after previous submit), ignoring');
            setTimeout(() => { this.isSubmitting = false; }, 500);
            return;
        }
        this.lastSubmitTime = currentTime;        try {
            const textarea = document.getElementById('message-input');
            if (!textarea) {
                this.error('Cannot submit: Message textarea not found');
                return;
            }

            const rawContent = textarea.value;
            const content = rawContent.trim();

            this.log('Raw textarea value: "' + rawContent + '"');
            this.log('Trimmed content: "' + content + '"');

            if (!content) {
                this.log('Empty message after trim, not sending');
                return;
            }

            // Get chat information from form data
            const chatId = textarea.getAttribute('data-chat-id') || textarea.getAttribute('data-channel-id') || this.getActiveChatId();
            const chatType = textarea.getAttribute('data-chat-type') || this.getChatType() || 'channel';

            if (!chatId) {
                this.error('Cannot submit: No chat ID found');
                this.showToast('Error: No chat selected', 'error');
                return;
            }

            this.log('Sending message to chat', chatId, 'Type:', chatType, 'Content:', content);

            const success = await this.sendMessage(chatId, content, chatType);

            if (success) {
                textarea.value = '';
                textarea.style.height = 'auto';
                this.stopTyping();
                setTimeout(() => textarea.focus(), 50);
            }

        } catch (error) {
            this.error('Error in handleSubmit:', error);
            this.trackError('SUBMIT_ERROR', error);
        } finally {
            setTimeout(() => {
                this.isSubmitting = false;
            }, 500);
        }
    }    async loadMessages(chatId, chatType = 'channel') {
        this.log('📥 Loading messages for chat:', chatId, 'Type:', chatType);
        
        try {
            const response = await window.ChatAPI.getMessages(chatType, chatId);
            
            const messages = response.success ? 
                (response.data?.messages || response.messages || []) : [];
            
            if (response.success && messages.length >= 0) {
                this.log('✅ Loaded', messages.length, 'messages');
                
                // Clear existing messages
                const messagesContainer = document.getElementById('chat-messages');
                if (messagesContainer) {
                    messagesContainer.innerHTML = '';
                    
                    // Display messages
                    messages.forEach(message => {
                        this.appendMessage(message, false); // Don't scroll for bulk loading
                    });
                    
                    // Scroll to bottom after all messages are loaded
                    setTimeout(() => {
                        messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    }, 100);
                }
                
                return true;
            } else {
                this.error('Failed to load messages:', response.error || response.message);
                return false;
            }
        } catch (error) {
            this.error('Error loading messages:', error);
            this.trackError('LOAD_MESSAGES_ERROR', error);
            return false;
        }
    }

    async switchToChat(chatId, chatType = 'channel') {
        this.log('🔄 Switching to chat:', chatId, 'Type:', chatType);
        
        // Set the new chat context
        this.setChatContext(chatId, chatType);
        
        // Load messages for the new chat
        await this.loadMessages(chatId, chatType);
        
        // Update UI elements
        this.updateChatUI(chatId, chatType);
    }

    updateChatUI(chatId, chatType) {
        // Update message input attributes
        const messageInput = document.getElementById('message-input');
        if (messageInput) {
            messageInput.setAttribute('data-chat-id', chatId);
            messageInput.setAttribute('data-chat-type', chatType);
            
            // Update placeholder based on chat type
            if (chatType === 'direct') {
                messageInput.placeholder = 'Type a direct message...';
            } else {
                messageInput.placeholder = 'Type a message...';
            }
        }
        
        // Update any other UI elements as needed
        this.log('✅ Chat UI updated for:', chatType, chatId);
    }

    getUserId() {
        const socketData = document.getElementById('socket-data');
        return socketData?.getAttribute('data-user-id') || this.userId;
    }

    getUsername() {
        const socketData = document.getElementById('socket-data');
        return socketData?.getAttribute('data-username') || this.username;
    }

    getActiveChannelId() {
        const socketData = document.getElementById('socket-data');
        return socketData?.getAttribute('data-channel-id') || this.activeChannel;
    }

    getActiveChatId() {
        // First check for data attributes on the socket data element
        const socketData = document.getElementById('socket-data');
        if (socketData) {
            return socketData.getAttribute('data-chat-id') || 
                   socketData.getAttribute('data-channel-id') || 
                   this.activeChatRoom || 
                   this.activeChannel;
        }
        return this.activeChatRoom || this.activeChannel;
    }

    getChatType() {
        const socketData = document.getElementById('socket-data');
        if (socketData) {
            return socketData.getAttribute('data-chat-type') || this.chatType || 'channel';
        }
        return this.chatType || 'channel';
    }

    setChatContext(chatId, chatType) {
        this.log('Setting chat context:', { chatId, chatType });
        
        if (chatType === 'direct') {
            this.activeChatRoom = chatId;
            this.activeChannel = null;
        } else {
            this.activeChannel = chatId;
            this.activeChatRoom = null;
        }
        
        this.chatType = chatType;
        
        // Update socket data element
        const socketData = document.getElementById('socket-data');
        if (socketData) {
            socketData.setAttribute('data-chat-id', chatId);
            socketData.setAttribute('data-chat-type', chatType);
            if (chatType === 'channel') {
                socketData.setAttribute('data-channel-id', chatId);
            }
        }          // Join appropriate socket rooms
        if (this.globalSocketManager && this.globalSocketManager.isReady()) {
            if (chatType === 'direct') {
                this.globalSocketManager.socket.emit('join-dm-room', { roomId: chatId });
                this.log('💬 Joining DM room via global manager:', chatId);
            } else {
                this.globalSocketManager.socket.emit('join-channel', chatId);
                this.log('🏠 Joining channel via global manager:', chatId);
            }
        } else {
            this.log('⚠️ Cannot join room - global socket manager not ready', {
                hasManager: !!this.globalSocketManager,
                isReady: this.globalSocketManager ? this.globalSocketManager.isReady() : false,
                chatType,
                chatId
            });
            
            // Try to join after socket is ready
            if (this.globalSocketManager) {
                this.globalSocketManager.waitForReady().then(() => {
                    this.log('✅ Socket manager now ready, joining room');
                    if (chatType === 'direct') {
                        this.globalSocketManager.socket.emit('join-dm-room', { roomId: chatId });
                        this.log('💬 Joining DM room after wait:', chatId);
                    } else {
                        this.globalSocketManager.socket.emit('join-channel', chatId);
                        this.log('🏠 Joining channel after wait:', chatId);
                    }
                }).catch(error => {
                    this.log('❌ Failed to wait for socket manager:', error);
                });
            }
        }
    }

    updateStatus(status, message = null) {
        this.log('📊 Status update:', status, message);
        const statusElements = document.querySelectorAll('.socket-status');
        statusElements.forEach(el => {
            let statusText = '';
            let statusClass = '';

            switch(status) {
                case 'connecting':
                    statusText = '• Connecting...';
                    statusClass = 'text-yellow-500';
                    break;
                case 'connected':
                    statusText = '• Connected';
                    statusClass = 'text-green-500';
                    break;
                case 'disconnected':
                    statusText = '• Disconnected';
                    statusClass = 'text-red-500';
                    break;
                case 'error':
                    statusText = '• Error';
                    statusClass = 'text-red-500';
                    break;
                case 'joined':
                    statusText = '• Connected to chat';
                    statusClass = 'text-green-500';
                    break;
            }

            el.innerHTML = '<span class="' + statusClass + '">' + statusText + '</span>';
        });
    }    initMessageContainer() {
        this.log('💬 Initializing message container...');
        const container = document.getElementById('chat-messages');
        if (container) {
            this.log('✅ Message container found');
        } else {
            this.log('ℹ️ Message container not found - skipping message container initialization');
        }
    }

    sendHeartbeat() {
        // Let global socket manager handle heartbeats
        if (this.globalSocketManager) {
            // Global manager handles heartbeats automatically
            return;
        }
        
        // Fallback for direct socket connection
        if (this.socket && this.connected) {
            this.socket.emit('heartbeat');
        }
    }    appendMessage(messageData, shouldScroll = true) {
        this.log('📨 Appending message to UI:', messageData);

        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) {
            this.error('Messages container not found');
            return;
        }

        const messageElement = this.createMessageElement(messageData);

        if (messageData.temp) {
            const existingTemp = document.getElementById('msg-' + messageData.tempId);
            if (existingTemp) {
                existingTemp.remove();
            }
        }

        const welcomeMessage = messagesContainer.querySelector('.flex.flex-col.items-center.justify-center');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }

        messagesContainer.appendChild(messageElement);

        if (shouldScroll) {
            this.scrollToBottom();
        }

        this.log('✅ Message appended to UI successfully');
    }    createMessageElement(messageData) {
        const messageDiv = document.createElement('div');
        const messageId = messageData.id || messageData.tempId;
        messageDiv.id = 'msg-' + messageId;
        messageDiv.className = 'mb-4 group hover:bg-discord-dark/30 p-1 rounded -mx-1 ' + (messageData.temp ? 'temp-message opacity-75' : '');
        messageDiv.setAttribute('data-user-id', messageData.user_id);
        
        // Add temp-id attribute for temp messages
        if (messageData.temp && messageData.tempId) {
            messageDiv.setAttribute('data-temp-id', messageData.tempId);
        }

        const username = messageData.username || messageData.user?.username || 'Unknown User';
        const avatarUrl = messageData.avatar || messageData.user?.avatar_url || 
                         'https://www.gravatar.com/avatar/' + messageData.user_id + '?d=mp';

        const timestamp = this.formatMessageTime(messageData.timestamp || messageData.sent_at);

        let messageHTML = '<div class="flex items-start">';
        messageHTML += '<div class="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center overflow-hidden mr-3">';
        messageHTML += '<img src="' + avatarUrl + '" alt="Avatar" class="w-full h-full object-cover">';
        messageHTML += '</div>';
        messageHTML += '<div class="flex-1">';
        messageHTML += '<div class="flex items-center">';
        messageHTML += '<span class="font-medium text-white mr-2">' + this.escapeHtml(username) + '</span>';
        messageHTML += '<span class="text-xs text-gray-400">' + timestamp + '</span>';
        messageHTML += messageData.temp ? '<span class="text-xs text-yellow-400 ml-2">Sending...</span>' : '';
        messageHTML += '</div>';
        
        // Handle rich message content
        messageHTML += '<div class="text-gray-300 select-text break-words">';
        if (messageData.content) {
            messageHTML += this.formatMessageContent(messageData.content);
        }
        
        // Handle attachments based on message type
        if (messageData.attachment_url) {
            messageHTML += this.renderRichMessageAttachment(messageData);
        }
        
        // Handle mentions
        if (messageData.mentions && messageData.mentions.length > 0) {
            messageHTML += this.renderMentions(messageData.mentions);
        }
        
        messageHTML += '</div>';
        messageHTML += '</div>';
        messageHTML += '</div>';
        messageHTML += '<div class="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity mt-1 ml-12">';
        messageHTML += '<button class="p-1 text-gray-400 hover:text-white hover:bg-discord-light rounded-sm">';
        messageHTML += '<i class="fas fa-face-smile text-xs"></i>';
        messageHTML += '</button>';
        messageHTML += '<button class="p-1 text-gray-400 hover:text-white hover:bg-discord-light rounded-sm">';
        messageHTML += '<i class="fas fa-pen-to-square text-xs"></i>';
        messageHTML += '</button>';
        messageHTML += '<button class="p-1 text-gray-400 hover:text-white hover:bg-discord-light rounded-sm">';
        messageHTML += '<i class="fas fa-reply text-xs"></i>';
        messageHTML += '</button>';
        messageHTML += '<button class="p-1 text-gray-400 hover:text-white hover:bg-discord-light rounded-sm">';
        messageHTML += '<i class="fas fa-ellipsis text-xs"></i>';
        messageHTML += '</button>';
        messageHTML += '</div>';

        messageDiv.innerHTML = messageHTML;

        return messageDiv;
    }

    renderRichMessageAttachment(messageData) {
        const messageType = messageData.message_type || 'text';
        const attachmentUrl = messageData.attachment_url;
        
        let attachmentHTML = '<div class="mt-2">';
        
        switch (messageType) {
            case 'image':
                attachmentHTML += `<div class="max-w-md">
                    <img src="${this.escapeHtml(attachmentUrl)}" alt="Uploaded image" 
                         class="rounded-lg cursor-pointer hover:opacity-90 transition-opacity max-w-full h-auto"
                         onclick="this.openImageModal('${this.escapeHtml(attachmentUrl)}')">
                </div>`;
                break;
                
            case 'gif':
                attachmentHTML += `<div class="max-w-md">
                    <img src="${this.escapeHtml(attachmentUrl)}" alt="GIF" 
                         class="rounded-lg cursor-pointer hover:opacity-90 transition-opacity max-w-full h-auto">
                </div>`;
                break;
                
            case 'audio':
                attachmentHTML += `<div class="max-w-md bg-gray-800 rounded-lg p-3">
                    <div class="flex items-center space-x-3">
                        <i class="fas fa-music text-blue-400"></i>
                        <div class="flex-1">
                            <audio controls class="w-full">
                                <source src="${this.escapeHtml(attachmentUrl)}" type="audio/mpeg">
                                Your browser does not support the audio element.
                            </audio>
                        </div>
                    </div>
                </div>`;
                break;
                
            default:
                // Handle other file types
                const fileName = attachmentUrl.split('/').pop();
                attachmentHTML += `<div class="max-w-md bg-gray-800 rounded-lg p-3">
                    <div class="flex items-center space-x-3">
                        <i class="fas fa-file text-gray-400"></i>
                        <div class="flex-1">
                            <a href="${this.escapeHtml(attachmentUrl)}" target="_blank" 
                               class="text-blue-400 hover:text-blue-300 underline">
                                ${this.escapeHtml(fileName)}
                            </a>
                        </div>
                    </div>
                </div>`;
        }
        
        attachmentHTML += '</div>';
        return attachmentHTML;
    }

    renderMentions(mentions) {
        if (!mentions || mentions.length === 0) return '';
        
        let mentionsHTML = '<div class="mt-1 text-xs text-gray-400">';
        mentionsHTML += '<i class="fas fa-at mr-1"></i>';
        mentionsHTML += 'Mentioned: ';
        mentionsHTML += mentions.map(mention => 
            `<span class="text-blue-400">@${this.escapeHtml(mention.username)}</span>`
        ).join(', ');
        mentionsHTML += '</div>';
        
        return mentionsHTML;
    }

    openImageModal(imageUrl) {
        // Create a simple image modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="relative max-w-4xl max-h-full p-4">
                <img src="${this.escapeHtml(imageUrl)}" alt="Full size image" 
                     class="max-w-full max-h-full object-contain">
                <button class="absolute top-2 right-2 text-white hover:text-gray-300 text-2xl" 
                        onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Close on click outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        document.body.appendChild(modal);
    }

    createTempMessage(content, tempId) {
        return { 
            content, 
            tempId, 
            temp: true,
            user_id: this.getUserId(),
            username: this.getUsername(),
            timestamp: new Date().toISOString(),
            sent_at: new Date().toISOString()
        };
    }

    formatMessageTime(timestamp) {
        if (!timestamp) return 'Just now';

        const messageDate = new Date(timestamp);
        const now = new Date();

        if (messageDate.toDateString() === now.toDateString()) {
            return messageDate.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
            });
        }

        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (messageDate.toDateString() === yesterday.toDateString()) {
            return 'Yesterday at ' + messageDate.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
            });
        }

        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        if (messageDate > weekAgo) {
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            return days[messageDate.getDay()] + ' at ' + messageDate.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
            });
        }

        return messageDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        }) + ' at ' + messageDate.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    }

    formatMessageContent(content) {
        if (!content) return '';

        return this.escapeHtml(content).replace(/\n/g, '<br>');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    removeTempMessages() {
        const tempMessages = document.querySelectorAll('.temp-message');
        tempMessages.forEach(msg => {
            msg.remove();
            this.log('🗑️ Removed temp message:', msg.id);
        });
    }

    removeTempMessage(tempId) {
        const tempMessage = document.querySelector(`[data-temp-id="${tempId}"]`);
        if (tempMessage) {
            tempMessage.remove();
            this.log('🗑️ Removed temp message:', tempId);
        }
    }

    removeUserFromTyping(userId) {
        if (this.typingUsers.has(userId)) {
            this.typingUsers.delete(userId);
            this.updateTypingIndicator();
        }
    }

    handleTyping() {
        if (!this.typingTimeout) {
            const channelId = this.getActiveChannelId();
            const userId = this.getUserId();
            const username = this.getUsername();
            
            if (channelId && userId && username) {
                socketApi.notifyTyping(channelId, userId, username, true)
                    .then(response => {
                        if (!response.success) {
                            this.log('Failed to send typing notification:', response.error);
                        }
                    })
                    .catch(error => {
                        this.error('Error sending typing notification:', error);
                    });
                
                this.typingTimeout = setTimeout(() => {
                    this.stopTyping();
                    this.typingTimeout = null;
                }, 5000);
            }
        } else {
            clearTimeout(this.typingTimeout);
            this.typingTimeout = setTimeout(() => {
                this.stopTyping();
                this.typingTimeout = null;
            }, 5000);
        }
    }
    
    stopTyping() {
        const channelId = this.getActiveChannelId();
        const userId = this.getUserId();
        const username = this.getUsername();
        
        if (channelId && userId && username) {
            socketApi.notifyTyping(channelId, userId, username, false)
                .then(response => {
                    if (!response.success) {
                        this.log('Failed to send stop typing notification:', response.error);
                    }
                })
                .catch(error => {
                    this.error('Error sending stop typing notification:', error);
                });
        }
        
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
            this.typingTimeout = null;
        }
    }

    showToast(message, type = 'info') {
        showToast(message, type);
    }

    // Utility method to check if current page is a voice channel
    isVoiceChannel() {
        // Look for voice channel indicators in the DOM
        const voiceContainer = document.querySelector('#video-grid');
        const voiceControls = document.querySelectorAll('.voice-control-btn');
        const channelTypeElements = document.querySelectorAll('[data-channel-type="voice"]');
        
        // Check URL for voice channel query parameter
        const urlParams = new URLSearchParams(window.location.search);
        const channelId = urlParams.get('channel');
        
        // Check if the active channel is a voice channel
        const activeChannel = document.querySelector('.channel-item.bg-discord-lighten');
        const isActiveVoice = activeChannel && activeChannel.getAttribute('data-channel-type') === 'voice';
        
        return voiceContainer || voiceControls.length > 0 || channelTypeElements.length > 0 || isActiveVoice;
    }    onNewDirectMessage(data) {
        this.log('📨 Received new direct message:', data);
        this.trackMessage('DIRECT_MESSAGE_RECEIVED', data);

        const currentChatId = this.getActiveChatId();
        const messageRoomId = data.chatRoomId || data.room_id;
        
        this.log('📨 Direct message room check:', {
            chatType: this.chatType,
            currentChatId: currentChatId,
            messageRoomId: messageRoomId,
            match: messageRoomId == currentChatId
        });

        if (this.chatType === 'direct' && messageRoomId && messageRoomId == currentChatId) {
            this.onNewMessage(data);
        } else {
            this.log('⚠️ Ignoring direct message for different room:', messageRoomId, 'vs current:', currentChatId);
        }
    }

    onDMRoomJoined(data) {
        this.log('🏠 Joined DM room:', data.chatRoomId);
        this.trackConnection('DM_ROOM_JOINED', data);
    }

    onDMRoomLeft(data) {
        this.log('👋 Left DM room:', data.chatRoomId);
        this.trackConnection('DM_ROOM_LEFT', data);
    }

}

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Document ready - checking messaging initialization...');

    // Wait for global socket manager to be available before initializing messaging
    const waitForGlobalSocket = () => {
        if (window.globalSocketManager || window.globalSocketManager === null) {
            console.log('Global socket manager available, initializing messaging...');
            initializeMessaging();
        } else {
            console.log('Waiting for global socket manager...');
            setTimeout(waitForGlobalSocket, 100);
        }
    };

    const initializeMessaging = () => {
        try {
            if (!window.MisVordMessaging || !window.MisVordMessaging.initialized) {
                console.log('Creating new MisVordMessaging instance or initializing existing one');
                if (!window.MisVordMessaging) {
                    window.MisVordMessaging = new MisVordMessaging();
                }
                window.MisVordMessaging.init();
                window.MisVordMessaging.initialized = true;
                console.log('✅ MisVordMessaging initialized');
            } else {
                console.log('✅ MisVordMessaging already initialized - skipping');
            }
        } catch (error) {
            console.error('❌ Failed to initialize MisVordMessaging:', error);
        }
    };

    // Listen for global socket ready event
    window.addEventListener('misVordGlobalReady', () => {
        console.log('📡 Global socket ready, ensuring messaging is initialized');
        initializeMessaging();
    });

    // Start waiting for global socket manager
    waitForGlobalSocket();
});

if (document.readyState !== 'loading') {
    console.log('📄 Document already ready, checking immediate initialization');
    setTimeout(() => {
        if (!window.MisVordMessaging || !window.MisVordMessaging.initialized) {
            try {
                console.log('Immediate initialization required');
                if (!window.MisVordMessaging) {
                    window.MisVordMessaging = new MisVordMessaging();
                }
                window.MisVordMessaging.init();
                window.MisVordMessaging.initialized = true;
                console.log('✅ MisVordMessaging initialized immediately');
            } catch (error) {
                console.error('❌ Failed immediate initialization:', error);
            }
        }
    }, 500); // Give more time for global socket manager to be ready
}

export { MisVordMessaging };