import { showToast } from '../../core/ui/toast.js';
import socketApi from '../../utils/socket-api.js';
import SocketManager from './socket-manager.js';
import MessageHandler from './message-handler.js';
import TypingManager from './typing-manager.js';
import DebugUtils from './debug-utils.js';
import FormHandler from './form-handler.js';

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

        this.initialized = false;
        this.activeChannel = null;
        this.activeChatRoom = null;
        this.chatType = null;
        this.userId = null;
        this.username = null;

        this.hasMoreMessages = true;
        this.loadingMessages = false;
        this.currentOffset = 0;

        this.debugUtils = new DebugUtils(this);
        this.socketManager = new SocketManager(this);
        this.messageHandler = new MessageHandler(this);
        this.typingManager = new TypingManager(this);
        this.formHandler = new FormHandler(this);

        window.MisVordMessaging = this;
        this.debugUtils.log('MisVordMessaging instance created and registered globally (using global socket manager)');
        
        this.debugUtils.setupDebugCommands();
    }

    log(...args) {
        this.debugUtils.log(...args);
    }

    error(...args) {
        this.debugUtils.error(...args);
    }

    trackError(type, error) {
        this.debugUtils.trackError(type, error);
    }

    trackConnection(event, data = {}) {
        this.debugUtils.trackConnection(event, data);
    }

    trackMessage(event, data = {}) {
        this.messageHandler.trackMessage(event, data);
    }

    isVoiceChannel() {
        const url = window.location.pathname;
        return url.includes('/voice/') || url.includes('voice-channel');
    }

    init() {
        if (this.initialized) {
            this.log('Already initialized, skipping duplicate initialization');
            return;
        }
        
        if (this.isVoiceChannel()) {
            this.log('Voice channel detected, skipping messaging initialization');
            return;
        }

        const messageContainer = document.getElementById('chat-messages');
        const messageForm = document.getElementById('message-form');
        const messageInput = document.getElementById('message-input');
        
        if (!messageContainer && !messageForm && !messageInput) {
            this.log('No messaging elements found, skipping messaging initialization (this is normal for server pages without selected channels)');
            return;
        }

        this.log('Initializing messaging system with global socket manager...');
        this.debugUtils.logSystemInfo();

        try {
            this.socketManager.connectToGlobalSocketManager();
            this.formHandler.initMessageForm();
            this.typingManager.setupTypingEvents();
            this.initMessageContainer();

            this.log('✅ Messaging system initialized successfully');
            this.initialized = true;

            this.debugUtils.dispatchEvent('misVordReady', { messaging: this });

        } catch (error) {
            this.error('❌ Failed to initialize messaging system:', error);
            this.trackError('INIT_FAILED', error);
        }
    }

    initMessageContainer() {
        const messageContainer = document.getElementById('chat-messages');
        if (!messageContainer) {
            this.log('⚠️ Message container not found');
            return;
        }

        this.log('📦 Setting up message container...');
        
        messageContainer.addEventListener('scroll', () => {
            if (messageContainer.scrollTop === 0 && this.messageHandler.hasMoreMessages && !this.messageHandler.loadingMessages) {
                this.loadMoreMessages();
            }
        });

        this.log('✅ Message container initialized');
    }

    async loadMoreMessages() {
        const chatId = this.getCurrentChatId();
        const chatType = this.chatType;

        if (!chatId || !chatType) {
            return;
        }

        await this.messageHandler.loadMessages(chatType, chatId, this.messageHandler.currentOffset);
    }

    getCurrentChatId() {
        return this.chatType === 'channel' ? this.activeChannel : this.activeChatRoom;
    }

    authenticate() {
        this.socketManager.authenticate();
    }

    joinChannel(channelId) {
        this.socketManager.joinChannel(channelId);
    }

    joinDMRoom(chatRoomId) {
        this.socketManager.joinDMRoom(chatRoomId);
    }    leaveDMRoom(chatRoomId) {
        this.socketManager.leaveDMRoom(chatRoomId);
    }

    initMessageForm() {
        this.formHandler.initMessageForm();
    }

    async sendMessage(chatType, chatId, content, messageType = 'text', attachments = [], mentions = []) {
        return await this.messageHandler.sendMessage(chatType, chatId, content, messageType, attachments, mentions);
    }

    async sendRichMessage(chatType, chatId, messageData) {
        return await this.messageHandler.sendRichMessage(chatType, chatId, messageData);
    }

    onNewMessage(data) {
        this.messageHandler.onNewMessage(data);
    }

    onUserTyping(data) {
        this.typingManager.onUserTyping(data);
    }

    onUserStopTyping(data) {
        this.typingManager.onUserStopTyping(data);
    }

    startTyping(chatType, chatId) {
        this.typingManager.startTyping(chatType, chatId);
    }

    stopTyping(chatType, chatId) {
        this.typingManager.stopTyping(chatType, chatId);
    }    onUserStatusChange(data) { 
        this.log('👤 User status changed:', data);
    }

    onChannelJoined(data) {
        this.log('🏠 Joined channel:', data.channelId);
        this.activeChannel = data.channelId;
        this.chatType = 'channel';
        this.trackConnection('CHANNEL_JOINED', data);
        this.updateStatus('joined');
    }

    onChannelLeft(data) {
        this.log('👋 Left channel:', data.channelId);
        this.activeChannel = null;
        this.trackConnection('CHANNEL_LEFT', data);
    }

    onDMRoomJoined(data) {
        this.log('💬 Joined DM room:', data.chatRoomId || data.roomId);
        this.activeChatRoom = data.chatRoomId || data.roomId;
        this.chatType = 'direct';
        this.trackConnection('DM_ROOM_JOINED', data);
        this.updateStatus('joined');
    }

    onDMRoomLeft(data) {
        this.log('👋 Left DM room:', data.chatRoomId || data.roomId);
        this.activeChatRoom = null;
        this.trackConnection('DM_ROOM_LEFT', data);
    }

    updateStatus(status) {
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            statusElement.textContent = status;
            statusElement.className = `connection-status ${status}`;
        }
    }

    getUserId() {
        if (this.userId) return this.userId;
        
        const userIdElement = document.querySelector('[data-user-id]');
        if (userIdElement) {
            return userIdElement.dataset.userId;
        }
        
        if (window.globalUser && window.globalUser.id) {
            return window.globalUser.id;
        }
        
        return null;
    }

    getUsername() {
        if (this.username) return this.username;
        
        const usernameElement = document.querySelector('[data-username]');
        if (usernameElement) {
            return usernameElement.dataset.username;
        }
        
        if (window.globalUser && window.globalUser.username) {
            return window.globalUser.username;
        }
        
        return null;
    }

    getActiveChannelId() {
        if (this.activeChannel) return this.activeChannel;
        
        const channelElement = document.querySelector('[data-channel-id]');
        if (channelElement) {
            return channelElement.dataset.channelId;
        }
        
        const urlMatch = window.location.pathname.match(/\/channels\/(\d+)/);
        if (urlMatch) {
            return urlMatch[1];
        }
        
        return null;
    }

    getActiveChatRoomId() {
        if (this.activeChatRoom) return this.activeChatRoom;
        
        const chatRoomElement = document.querySelector('[data-chat-room-id]');
        if (chatRoomElement) {
            return chatRoomElement.dataset.chatRoomId;
        }
        
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('dm');
    }

    cleanup() {
        this.log('🧹 Cleaning up messaging system...');
        
        if (this.socketManager.syncInterval) {
            clearInterval(this.socketManager.syncInterval);
        }
        
        this.typingManager.clearTypingUsers();
        this.socketManager.waitingForGlobalSocket = false;
        
        this.log('✅ Messaging system cleaned up');
    }

    reconnect() {
        this.log('🔄 Attempting to reconnect...');
        if (this.socketManager.globalSocketManager) {
            this.socketManager.globalSocketManager.reconnect();
        }
    }

    getDebugInfo() {
        return this.debugUtils.getDebugInfo();
    }

    async switchToChat(chatId, chatType = 'channel') {
        this.log('🔄 Switching to chat:', chatId, 'Type:', chatType);
        
        this.setChatContext(chatId, chatType);
        
        this.hasMoreMessages = true;
        this.loadingMessages = false;
        this.currentOffset = 0;
        
        await this.loadMessages(chatId, chatType);
        
        this.updateChatUI(chatId, chatType);
    }

    setChatContext(chatId, chatType) {
        this.activeChannel = chatType === 'channel' ? chatId : null;
        this.activeChatRoom = chatType === 'direct' || chatType === 'dm' ? chatId : null;
        this.chatType = chatType;
        
        this.log('📍 Chat context set:', {
            activeChannel: this.activeChannel,
            activeChatRoom: this.activeChatRoom,
            chatType: this.chatType
        });
    }    async loadMessages(chatId, chatType) {
        if (this.loadingMessages) {
            this.log('Already loading messages, skipping...');
            return;
        }

        this.loadingMessages = true;
        this.messageHandler.showSkeletonLoader();
        
        try {
            const routeChatType = chatType === 'direct' ? 'dm' : chatType;
            const endpoint = `/api/chat/${routeChatType}/${chatId}/messages`;
            const response = await fetch(endpoint);
            
            if (!response.ok) {
                throw new Error(`Failed to load messages: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.data && data.data.messages) {
                this.messageHandler.displayMessages(data.data.messages, true);
                this.log(`📥 Loaded ${data.data.messages.length} messages for ${chatType} ${chatId}`);
            } else {
                this.messageHandler.hideSkeletonLoader();
            }
        } catch (error) {
            this.error('Failed to load messages:', error);
            this.trackError('load_messages', error);
            this.messageHandler.hideSkeletonLoader();
        } finally {
            this.loadingMessages = false;
        }
    }

    updateChatUI(chatId, chatType) {
        const messageInput = document.getElementById('message-input');
        if (messageInput) {
            messageInput.setAttribute('data-chat-id', chatId);
            messageInput.setAttribute('data-chat-type', chatType);
        }

        const chatContainer = document.getElementById('chat-messages');
        if (chatContainer) {
            chatContainer.setAttribute('data-chat-id', chatId);
            chatContainer.setAttribute('data-chat-type', chatType);
        }        this.log('🎨 Chat UI updated for:', chatType, chatId);
    }

    // Debug method to test message sending
    testMessageSending(content = 'Test message from debug') {
        if (!this.activeChannel && !this.activeChatRoom) {
            this.error('❌ No active chat to send test message to');
            return;
        }

        const chatId = this.activeChannel || this.activeChatRoom;
        const chatType = this.activeChannel ? 'channel' : 'direct';
        
        this.log('🧪 Testing message sending:', { chatId, chatType, content });
        
        return this.messageHandler.sendMessage(chatType, chatId, content)
            .then(() => {
                this.log('✅ Test message sent successfully');
            })
            .catch(error => {
                this.error('❌ Test message failed:', error);
            });
    }

    // Debug method to simulate receiving a message
    simulateIncomingMessage(content = 'Simulated incoming message') {
        const simulatedMessage = {
            id: 'sim-' + Date.now(),
            content: content,
            user_id: 'other-user',
            username: 'Test User',
            avatar_url: '/assets/default-avatar.png',
            created_at: new Date().toISOString(),
            channelId: this.activeChannel,
            chatRoomId: this.activeChatRoom
        };

        this.log('🎭 Simulating incoming message:', simulatedMessage);
        this.onNewMessage(simulatedMessage);
    }

    get socket() {
        return this.socketManager.socket;
    }

    get connected() {        return this.socketManager.connected;
    }

    get authenticated() {
        return this.socketManager.authenticated;
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if we're not already initialized and we have the necessary elements
    if (!window.MisVordMessaging) {
        const messaging = new MisVordMessaging();
        messaging.init();
    }
});

// Also initialize when MainModulesReady event is fired (for compatibility)
window.addEventListener('MainModulesReady', () => {
    if (!window.MisVordMessaging || !window.MisVordMessaging.initialized) {
        const messaging = window.MisVordMessaging || new MisVordMessaging();
        messaging.init();
    }
});

export default MisVordMessaging;
