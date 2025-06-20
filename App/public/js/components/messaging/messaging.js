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
        this.lastSubmitTime = 0;        this.activeChannel = null;
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
        this.waitingForGlobalSocket = false;        window.MisVordMessaging = this;
        window.logger.debug('messaging', 'MisVordMessaging instance created and registered globally (using global socket manager)');
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
     */
    connectToGlobalSocketManager() {
        this.log('🔌 Connecting to global socket manager...');

        // Check if global socket manager is available
        if (window.globalSocketManager) {
            this.setupGlobalSocketManager(window.globalSocketManager);
            return;
        }

        // Wait for global socket manager to be ready
        this.waitingForGlobalSocket = true;
        this.log('⏳ Waiting for global socket manager to be ready...');

        const checkGlobalSocket = () => {
            if (window.globalSocketManager) {
                this.setupGlobalSocketManager(window.globalSocketManager);
                this.waitingForGlobalSocket = false;
                return;
            }

            // Keep checking for a reasonable amount of time
            setTimeout(checkGlobalSocket, 100);
        };

        // Listen for global socket ready event
        window.addEventListener('misVordGlobalReady', (event) => {
            if (this.waitingForGlobalSocket) {
                this.log('📡 Global socket manager ready event received');
                this.setupGlobalSocketManager(event.detail.socketManager);
                this.waitingForGlobalSocket = false;
            }
        });

        // Start checking
        checkGlobalSocket();
    }

    /**
     * Setup connection with global socket manager
     */
    setupGlobalSocketManager(globalManager) {
        this.log('🔗 Setting up connection with global socket manager');
        
        this.globalSocketManager = globalManager;
        
        if (globalManager.isGuest) {
            this.log('👤 Guest user detected, messaging disabled');
            this.updateStatus('error', 'Login required for messaging');
            return;
        }

        // Use the global socket connection
        this.socket = globalManager.socket;
        this.connected = globalManager.connected;
        this.authenticated = globalManager.authenticated;
        this.userId = globalManager.userId;
        this.username = globalManager.username;

        // Listen for global socket events that we care about for messaging
        this.setupGlobalSocketEventListeners();

        // Join active channel if we have one
        this.joinActiveChannel();

        this.log('✅ Successfully connected to global socket manager');
        this.updateStatus('connected');
    }

    /**
     * Setup event listeners for global socket events
     */
    setupGlobalSocketEventListeners() {
        // Listen for global socket connection state changes
        window.addEventListener('globalSocketReady', () => {
            this.connected = true;
            this.authenticated = true;
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
    }

    joinActiveChannel() {
        this.log('🏠 Joining active channel...');

        const channelId = this.getActiveChannelId();
        if (channelId) {
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
    }    async sendMessage(chatId, content, chatType = 'channel') {
        this.log('📤 Attempting to send message...');
        this.log('📊 Send conditions check:', {
            chatId: !!chatId,
            content: !!content,
            chatType: chatType,
            connected: this.connected,
            socket: !!this.socket,
            userId: this.getUserId(),
            authenticated: this.authenticated,
            globalSocketManager: !!this.globalSocketManager
        });

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
                // Remove temp message and let socket handle the real message
                this.removeTempMessage(tempId);
                
                // Send socket event for real-time updates
                if (this.globalSocketManager && this.globalSocketManager.isReady()) {
                    const socketEvent = chatType === 'direct' ? 'direct-message' : 'channel-message';
                    this.globalSocketManager.socket.emit(socketEvent, {
                        chatId: chatId,
                        content: content,
                        message: response.message
                    });
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
    }

    async loadMessages(chatId, chatType = 'channel') {
        this.log('📥 Loading messages for chat:', chatId, 'Type:', chatType);
        
        try {
            const response = await window.ChatAPI.getMessages(chatId, chatType);
            
            if (response.success && response.messages) {
                this.log('✅ Loaded', response.messages.length, 'messages');
                
                // Clear existing messages
                const messagesContainer = document.getElementById('chat-messages');
                if (messagesContainer) {
                    messagesContainer.innerHTML = '';
                    
                    // Display messages
                    response.messages.forEach(message => {
                        this.appendMessage(message, false); // Don't scroll for bulk loading
                    });
                    
                    // Scroll to bottom after all messages are loaded
                    setTimeout(() => {
                        messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    }, 100);
                }
                
                return true;
            } else {
                this.error('Failed to load messages:', response.error);
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
        }
        
        // Join appropriate socket rooms
        if (this.globalSocketManager && this.globalSocketManager.isReady()) {
            if (chatType === 'direct') {
                this.globalSocketManager.socket.emit('join-dm-room', chatId);
            } else {
                this.globalSocketManager.socket.emit('join-channel', chatId);
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
    }

    createMessageElement(messageData) {
        const messageDiv = document.createElement('div');
        const messageId = messageData.id || messageData.tempId;
        messageDiv.id = 'msg-' + messageId;
        messageDiv.className = 'mb-4 group hover:bg-discord-dark/30 p-1 rounded -mx-1 ' + (messageData.temp ? 'temp-message opacity-75' : '');
        messageDiv.setAttribute('data-user-id', messageData.user_id);

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
        messageHTML += '<div class="text-gray-300 select-text break-words">';
        messageHTML += this.formatMessageContent(messageData.content);
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
    }

    onNewDirectMessage(data) {
        this.log('📨 Received new direct message:', data);
        this.trackMessage('DIRECT_MESSAGE_RECEIVED', data);

        // Check if this is for the current active direct message room
        if (this.chatType === 'direct' && data.chatRoomId && data.chatRoomId == this.getActiveChatId()) {
            this.onNewMessage(data);
        } else {
            this.log('⚠️ Ignoring direct message for different room:', data.chatRoomId, 'vs current:', this.getActiveChatId());
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