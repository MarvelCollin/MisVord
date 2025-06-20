/**
 * Unified Chat Manager
 * Handles both channel and direct message chat functionality
 * Works with the existing MisVordMessaging system
 */

class UnifiedChatManager {
    constructor() {
        this.currentChatId = null;
        this.currentChatType = 'channel';
        this.initialized = false;
        
        this.log('🚀 UnifiedChatManager created');
    }

    log(...args) {
        console.log('[UnifiedChat]', ...args);
    }

    error(...args) {
        console.error('[UnifiedChat]', ...args);
    }

    init() {
        if (this.initialized) {
            this.log('Already initialized');
            return;
        }

        this.log('Initializing unified chat manager...');
        
        // Wait for MisVordMessaging to be ready
        this.waitForMessaging();
        
        this.initialized = true;
        this.log('✅ Unified chat manager initialized');
    }    waitForMessaging() {
        if (window.MisVordMessaging && window.MisVordMessaging.initialized && window.ChatAPI) {
            this.setupIntegration();
        } else {
            this.log('Waiting for MisVordMessaging and ChatAPI...');
            setTimeout(() => this.waitForMessaging(), 100);
        }
    }

    setupIntegration() {
        this.log('🔗 Setting up integration with MisVordMessaging');
        this.messagingSystem = window.MisVordMessaging;
        
        // Add our methods to the messaging system for backwards compatibility
        if (this.messagingSystem) {
            this.messagingSystem.switchToChat = this.switchToChat.bind(this);
            this.messagingSystem.loadMessages = this.loadMessages.bind(this);
            this.messagingSystem.setChatContext = this.setChatContext.bind(this);
            this.log('✅ Integration complete');
        }
    }

    async switchToChat(chatId, chatType = 'channel') {
        this.log('🔄 Switching to chat:', chatId, 'Type:', chatType);
        
        try {
            // Update current chat info
            this.currentChatId = chatId;
            this.currentChatType = chatType;
            
            // Set context in messaging system
            if (this.messagingSystem) {
                this.messagingSystem.setChatContext(chatId, chatType);
            }
            
            // Load messages
            await this.loadMessages(chatId, chatType);
            
            // Update UI
            this.updateChatUI(chatId, chatType);
            
            this.log('✅ Successfully switched to chat:', chatType, chatId);
            return true;
            
        } catch (error) {
            this.error('Failed to switch chat:', error);
            return false;
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
                    
                    // Display messages using the messaging system
                    if (this.messagingSystem) {
                        response.messages.forEach(message => {
                            this.messagingSystem.appendMessage(message, false);
                        });
                        
                        // Scroll to bottom after all messages are loaded
                        setTimeout(() => {
                            messagesContainer.scrollTop = messagesContainer.scrollHeight;
                        }, 100);
                    }
                }
                
                return true;
            } else {
                this.error('Failed to load messages:', response.error);
                return false;
            }
        } catch (error) {
            this.error('Error loading messages:', error);
            return false;
        }
    }

    setChatContext(chatId, chatType) {
        this.log('Setting chat context:', { chatId, chatType });
        
        this.currentChatId = chatId;
        this.currentChatType = chatType;
        
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
        if (window.globalSocketManager && window.globalSocketManager.isReady()) {
            if (chatType === 'direct') {
                window.globalSocketManager.socket.emit('join-dm-room', chatId);
            } else {
                window.globalSocketManager.socket.emit('join-channel', chatId);
            }
        }
    }

    updateChatUI(chatId, chatType) {
        // Update message input attributes
        const messageInput = document.getElementById('message-input');
        if (messageInput) {
            messageInput.setAttribute('data-chat-id', chatId);
            messageInput.setAttribute('data-chat-type', chatType);
            
            // Also set legacy attributes for backwards compatibility
            if (chatType === 'channel') {
                messageInput.setAttribute('data-channel-id', chatId);
            }
        }
        
        // Update chat section title and info
        this.updateChatHeader(chatId, chatType);
        
        this.log('✅ Chat UI updated for:', chatType, chatId);
    }

    updateChatHeader(chatId, chatType) {
        // Update the chat header to show current chat info
        const chatTitle = document.querySelector('.chat-header-title');
        const chatIcon = document.querySelector('.chat-header-icon');
        
        if (chatType === 'direct') {
            if (chatTitle) chatTitle.textContent = 'Direct Message';
            if (chatIcon) chatIcon.className = 'chat-header-icon fas fa-user';
        } else {
            if (chatTitle) chatTitle.textContent = 'Channel Chat';
            if (chatIcon) chatIcon.className = 'chat-header-icon fas fa-hashtag';
        }
    }

    getCurrentChatId() {
        return this.currentChatId;
    }

    getCurrentChatType() {
        return this.currentChatType;
    }

    async createDirectMessage(targetUserId) {
        this.log('💬 Creating direct message with user:', targetUserId);
        
        try {
            const response = await window.ChatAPI.createDirectMessage(targetUserId);
            
            if (response.success && response.chatRoom) {
                this.log('✅ Direct message created:', response.chatRoom.id);
                
                // Switch to the new direct message
                await this.switchToChat(response.chatRoom.id, 'direct');
                
                return response.chatRoom;
            } else {
                this.error('Failed to create direct message:', response.error);
                return null;
            }
        } catch (error) {
            this.error('Error creating direct message:', error);
            return null;
        }
    }

    async getDirectMessageRooms() {
        this.log('📋 Getting direct message rooms...');
        
        try {
            const response = await window.ChatAPI.getDirectMessageRooms();
            
            if (response.success) {
                this.log('✅ Got', response.rooms.length, 'DM rooms');
                return response.rooms;
            } else {
                this.error('Failed to get DM rooms:', response.error);
                return [];
            }
        } catch (error) {
            this.error('Error getting DM rooms:', error);
            return [];
        }
    }
}

// Initialize and expose globally
document.addEventListener('DOMContentLoaded', function() {
    if (!window.unifiedChatManager) {
        window.unifiedChatManager = new UnifiedChatManager();
        window.unifiedChatManager.init();
    }
});

// Also expose the class for manual instantiation
window.UnifiedChatManager = UnifiedChatManager;

export { UnifiedChatManager };
