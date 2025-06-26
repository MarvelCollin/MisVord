class ChatAPI {
    constructor() {
        this.baseURL = '/api/chat';
        this.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    async parseResponse(response) {
        if (!response) {
            throw new Error('Empty response received from server');
        }
        
        let text;
        try {
            text = await response.text();
        } catch (error) {
            throw new Error('Failed to extract text from server response');
        }
        
        if (!text || text.trim() === '') {
            throw new Error('Empty response content');
        }
        
        if (text.trim().startsWith('<') || 
            text.includes('<br />') || 
            text.includes('</html>') || 
            text.includes('<!DOCTYPE')) {
            
            let errorMessage = 'Invalid response format';
            
            if (text.includes('Not Found') || response.status === 404) {
                errorMessage = 'Endpoint not found (404)';
            } else if (text.includes('Internal Server Error') || response.status === 500) {
                errorMessage = 'Server error (500)';
            } else if (response.status === 401 || response.status === 403) {
                errorMessage = 'Authentication error';
                window.location.href = '/login';
            }
            
            throw new Error(errorMessage);
        }
        
        try {
            const cleanedText = text.trim().replace(/^\uFEFF/, '');
            return JSON.parse(cleanedText);
        } catch (e) {
            throw new Error('JSON parsing failed');
        }
    }    async makeRequest(url, options = {}) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...this.headers,
                    ...options.headers
                }
            });
            
            if (!response.ok) {
                console.error('API Request failed with status:', {
                    url: url,
                    status: response.status,
                    statusText: response.statusText
                });
                
                try {
                    const errorData = await this.parseResponse(response);
                    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
                } catch (parseError) {
                    throw new Error(`Request failed with status ${response.status}: ${response.statusText}`);
                }
            }

            const data = await this.parseResponse(response);
            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }    async getMessages(chatType, targetId, limit = 20, offset = 0) {
        if (!targetId) {
            throw new Error('Target ID is required');
        }

        const apiChatType = chatType === 'direct' ? 'dm' : chatType;
        const url = `${this.baseURL}/${apiChatType}/${targetId}/messages?limit=${limit}&offset=${offset}`;
        
        try {
            const response = await this.makeRequest(url);
            
            if (!response) {
                throw new Error('Empty response');
            }
            
            return response;
        } catch (error) {
            throw error;
        }
    }
    
    async checkAuthentication() {
        try {
            const response = await fetch('/api/auth/check');
            const data = await response.json();
            
            if (!data.authenticated) {
                console.error('User is not authenticated');
                throw new Error('Authentication required. Please refresh the page and log in.');
            }
            
            return true;
        } catch (error) {
            console.error('Failed to check authentication status:', error);
            return false;
        }
    }    async sendMessage(targetId, content, chatType = 'channel', options = {}) {
        const url = `${this.baseURL}/send`;
        const apiChatType = chatType === 'direct' ? 'dm' : chatType;
        
        try {
            const requestData = {
                target_type: apiChatType,
                target_id: targetId,
                content: content
            };
            
            if (options.messageType) {
                requestData.message_type = options.messageType;
            }
            
            if (options.attachmentUrl) {
                requestData.attachment_url = options.attachmentUrl;
            }
            
            if (options.replyToMessageId) {
                requestData.reply_message_id = options.replyToMessageId;
            }
            
            const response = await this.makeRequest(url, {
                method: 'POST',
                body: JSON.stringify(requestData)
            });
            
            if (response && response.success !== false) {
                // Use the server message data without reactions (reactions only from database)
                if (response.socket_data && response.socket_data.message) {
                    this.sendDirectSocketMessageWithServerData(targetId, chatType, response.socket_data);
                } else {
                    // Fallback to old method if no server data
                    this.sendDirectSocketMessage(targetId, content, chatType, options);
                }
            }
            
            return response;
        } catch (error) {
            console.error('Error sending message to database:', error);
            throw error;
        }
    }

    sendDirectSocketMessageWithServerData(targetId, chatType, socketData) {
        if (!window.globalSocketManager) {
            console.error('globalSocketManager not available');
            return false;
        }
        
        if (!window.globalSocketManager.isReady()) {
            console.error('Socket not ready');
            return false;
        }
        
        if (!window.globalSocketManager.io) {
            console.error('Socket IO not available');
            return false;
        }
        
        const io = window.globalSocketManager.io;
        
        try {
            let eventName;
            
            if (chatType === 'channel') {
                eventName = 'new-channel-message';
                // Send message data WITHOUT reactions - only from database
                const messageData = {
                    id: socketData.message.id,
                    channelId: targetId,
                    userId: socketData.message.user_id,
                    user_id: socketData.message.user_id,
                    username: socketData.message.username || socketData.username,
                    timestamp: socketData.timestamp,
                    content: socketData.message.content,
                    messageType: socketData.message.message_type || socketData.messageType,
                    avatar_url: socketData.message.avatar_url,
                    sent_at: socketData.message.sent_at
                    // Deliberately excluding reactions - only get from database
                };
                
                io.emit(eventName, messageData);
            } 
            else if (chatType === 'direct' || chatType === 'dm') {
                eventName = 'user-message-dm';
                // Send message data WITHOUT reactions - only from database
                const messageData = {
                    id: socketData.message.id,
                    roomId: targetId,
                    userId: socketData.message.user_id,
                    user_id: socketData.message.user_id,
                    username: socketData.message.username || socketData.username,
                    timestamp: socketData.timestamp,
                    content: socketData.message.content,
                    messageType: socketData.message.message_type || socketData.messageType,
                    avatar_url: socketData.message.avatar_url,
                    sent_at: socketData.message.sent_at
                    // Deliberately excluding reactions - only get from database
                };
                
                io.emit(eventName, messageData);
            }
            
            return true;
        } catch (e) {
            console.error('Failed to send socket message with server data:', e);
            return false;
        }
    }

    sendDirectSocketMessage(targetId, content, chatType = 'channel', options = {}) {
        if (!window.globalSocketManager) {
            console.error('globalSocketManager not available');
            return false;
        }
        
        if (!window.globalSocketManager.isReady()) {
            console.error('Socket not ready');
            return false;
        }
        
        if (!window.globalSocketManager.io) {
            console.error('Socket IO not available');
            return false;
        }
        
        const userId = window.globalSocketManager.userId;
        const username = window.globalSocketManager.username;
        const timestamp = Date.now();
        const messageId = `msg_${timestamp}_${Math.random().toString(36).substring(2, 9)}`;
        const io = window.globalSocketManager.io;
        
        try {
            let eventName, messageData;
            
            if (chatType === 'channel') {
                eventName = 'new-channel-message';
                messageData = {
                    id: messageId,
                    channelId: targetId,
                    content: content,
                    messageType: options.messageType || 'text',
                    attachment_url: options.attachmentUrl || null,
                    timestamp: timestamp,
                    userId: userId,
                    username: username
                };
                
                if (options.replyToMessageId) {
                    messageData.reply_message_id = options.replyToMessageId;
                    
                    if (options.replyData) {
                        messageData.reply_data = options.replyData;
                    }
                }
            } 
            else if (chatType === 'direct' || chatType === 'dm') {
                eventName = 'user-message-dm';
                messageData = {
                    id: messageId,
                    roomId: targetId,
                    content: content,
                    messageType: options.messageType || 'text',
                    attachment_url: options.attachmentUrl || null,
                    timestamp: timestamp,
                    userId: userId,
                    username: username
                };
                
                if (options.replyToMessageId) {
                    messageData.reply_message_id = options.replyToMessageId;
                    
                    if (options.replyData) {
                        messageData.reply_data = options.replyData;
                    }
                }
            }
            
            if (eventName && messageData) {
                io.emit(eventName, messageData);
                return true;
            } else {
                console.error('Could not determine event name or message data');
                return false;
            }
        } catch (e) {
            console.error('Failed to send direct socket message:', e);
            return false;
        }
    }

    async updateMessage(messageId, content) {
        const url = `/api/messages/${messageId}`;
        
        try {
            const response = await this.makeRequest(url, {
                method: 'PUT',
                body: JSON.stringify({
                    content: content
                })
            });
            
            if (response && response.data) {
                const messageData = response.data;
                this.sendDirectSocketUpdate(messageId, content, messageData.target_type, messageData.target_id);
            }
            
            return response;
        } catch (error) {
            console.error('Error updating message in database:', error);
            throw error;
        }
    }
    
    sendDirectSocketUpdate(messageId, content, targetType, targetId) {
        if (!window.globalSocketManager || !window.globalSocketManager.isReady() || !window.globalSocketManager.io) {
            return false;
        }
        
        const userId = window.globalSocketManager.userId;
        const username = window.globalSocketManager.username;
        
        try {
            window.globalSocketManager.io.emit('message-updated', {
                message_id: messageId,
                content: content,
                target_type: targetType,
                target_id: targetId,
                user_id: userId,
                username: username,
                timestamp: Date.now()
            });
            return true;
        } catch (e) {
            console.error('Failed to send direct socket update:', e);
            return false;
        }
    }

    async deleteMessage(messageId) {
        const url = `/api/messages/${messageId}`;
        
        try {
            const response = await this.makeRequest(url, {
                method: 'DELETE'
            });
            
            if (response && response.data) {
                const messageData = response.data;
                this.sendDirectSocketDelete(messageId, messageData.target_type, messageData.target_id);
            } else if (response && response.socket_data) {
                this.sendDirectSocketDelete(messageId, response.socket_data.target_type, response.socket_data.target_id);
            } else {
                console.error('No target info found in delete response');
            }
            
            return response;
        } catch (error) {
            console.error('Error deleting message from database:', error);
            throw error;
        }
    }
    
    sendDirectSocketDelete(messageId, targetType, targetId) {
        if (!window.globalSocketManager || !window.globalSocketManager.isReady() || !window.globalSocketManager.io) {
            return false;
        }
        
        const userId = window.globalSocketManager.userId;
        const username = window.globalSocketManager.username;
        
        const socketData = {
            message_id: messageId,
            target_type: targetType,
            target_id: targetId,
            user_id: userId,
            username: username,
            timestamp: Date.now()
        };
        
        try {
            window.globalSocketManager.io.emit('message-deleted', socketData);
            return true;
        } catch (e) {
            console.error('Failed to send direct socket delete:', e);
            return false;
        }
    }

    emitReaction(socketData) {
        if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {
            return false;
        }
        
        const eventName = socketData.action === 'added' ? 'reaction-added' : 'reaction-removed';
        let targetRoom = null;
        
        if (socketData.target_type === 'channel') {
            targetRoom = `channel-${socketData.target_id}`;
        } else if (socketData.target_type === 'dm' || socketData.target_type === 'direct') {
            targetRoom = `dm-room-${socketData.target_id}`;
        }
        
        try {
            if (targetRoom) {
                window.globalSocketManager.io.to(targetRoom).emit(eventName, socketData);
            } else {
                window.globalSocketManager.io.emit(eventName, socketData);
            }
            return true;
        } catch (e) {
            return false;
        }
    }
    
    async addReaction(messageId, emoji) {
        if (!messageId || !emoji) {
            throw new Error('Message ID and emoji are required');
        }
        
        const url = `/api/messages/${messageId}/reactions`;
        
        try {
            const response = await this.makeRequest(url, {
                method: 'POST',
                body: JSON.stringify({ emoji })
            });
            
            if (response && response.socket_data) {
                response.socket_data.action = response.action;
                this.emitReaction(response.socket_data);
            } else {
                throw new Error('No socket data in response');
            }
            
            return response;
        } catch (error) {
            throw error;
        }
    }
    
    async removeReaction(messageId, emoji) {
        return this.addReaction(messageId, emoji);
    }

    async getMessageTarget(messageId) {
        try {
            const response = await this.makeRequest(`/api/messages/${messageId}`);
            if (response && response.data && response.data.message) {
                // Extract target info from message response
                return {
                    target_type: 'channel', // Default, would need backend enhancement
                    target_id: null
                };
            }
        } catch (error) {
            console.warn('Failed to get message target:', error);
        }
        return null;
    }

    emitSocketEvent(eventName, data) {
        console.warn('⚠️ DEPRECATED: emitSocketEvent is deprecated. Use direct socket emission instead.');
        console.warn('This method will be removed in a future update.');
        
        if (window.globalSocketManager && window.globalSocketManager.isReady() && window.globalSocketManager.io) {
            const userId = window.globalSocketManager.userId;
            const username = window.globalSocketManager.username;
            
            const enhancedData = {
                ...data,
                _debug: {
                    timestamp: new Date().toISOString(),
                    clientId: window.globalSocketManager.io.id,
                    emittedBy: username || 'Unknown',
                    type: 'api-relay-deprecated'
                }
            };
            
            window.globalSocketManager.io.emit(eventName, enhancedData);
            
            if (eventName === 'new-channel-message') {
                console.log(`📨 API-relayed message to channel ${data.channelId}: "${data.content}"`);
            } else if (eventName === 'user-message-dm') {
                console.log(`📨 API-relayed DM to room ${data.roomId || data.chatRoomId}: "${data.content}"`);
            } else if (eventName === 'message-updated') {
                console.log(`📝 API-relayed message update: "${data.content}"`);
            } else if (eventName === 'message-deleted') {
                console.log(`🗑️ API-relayed message deletion`);
            } else if (eventName === 'reaction-added' || eventName === 'reaction-removed') {
                console.log(`${eventName === 'reaction-added' ? '👍' : '👎'} API-relayed reaction ${data.emoji}`);
            } else {
                console.log(`📤 API-relayed socket event: ${eventName}`, data);
            }
            
            return true;
        } else {
            console.warn(`⚠️ Could not emit socket event "${eventName}": Socket manager not ready`, { eventName, data });
            return false;
        }
    }

    async createDirectMessage(friendId) {
        const url = `${this.baseURL}/dm/create`;
        return await this.makeRequest(url, {
            method: 'POST',
            body: JSON.stringify({
                friend_id: friendId
            })
        });
    }

    async getDirectMessageRooms() {
        const url = `${this.baseURL}/dm/rooms`;
        return await this.makeRequest(url);
    }
    
    debugSocketConnection(targetId, chatType = 'channel') {
        const status = {
            socketManagerExists: !!window.globalSocketManager,
            socketReady: window.globalSocketManager?.isReady() || false,
            socketConnected: window.globalSocketManager?.connected || false,
            socketAuthenticated: window.globalSocketManager?.authenticated || false,
            socketId: window.globalSocketManager?.io?.id || 'none',
            userId: window.globalSocketManager?.userId || 'none',
            username: window.globalSocketManager?.username || 'none',
            targetId: targetId,
            chatType: chatType,
            chatAPIExists: !!window.ChatAPI,
            chatSectionExists: !!window.chatSection
        };
        
        console.log('🔍 Socket & Chat Debug Info:', status);
        
        if (status.socketReady && window.globalSocketManager?.io) {
            console.log('🔍 Testing room debug...');
            window.globalSocketManager.io.emit('debug-rooms');
            
            window.globalSocketManager.io.once('debug-rooms-info', (roomInfo) => {
                console.log('🔍 Room debug response:', roomInfo);
            });
        }
        
        if (status.socketReady) {
            const testContent = `Socket test message at ${new Date().toISOString()}`;
            this.sendDirectSocketMessage(targetId, testContent, chatType);
            return { ...status, testSent: true, testContent };
        }
        
        return { ...status, testSent: false };
    }
    
    testMessageSend(content = 'Test message') {
        console.log('🧪 Testing message send functionality...');
        
        if (!window.chatSection) {
            console.error('❌ ChatSection not available');
            return false;
        }
        
        if (!window.chatSection.targetId) {
            console.error('❌ No target ID set in ChatSection');
            return false;
        }
        
        console.log('✅ Calling chatSection.sendMessage with test content');
        
        const originalValue = window.chatSection.messageInput?.value || '';
        if (window.chatSection.messageInput) {
            window.chatSection.messageInput.value = content;
        }
        
        try {
            window.chatSection.sendMessage();
            return true;
        } catch (error) {
            console.error('❌ Test message send failed:', error);
            return false;
        } finally {
            if (window.chatSection.messageInput) {
                window.chatSection.messageInput.value = originalValue;
            }
        }
    }

    formatMessage(message) {
        return {
            id: message.id,
            content: message.content,
            user_id: message.user_id,
            username: message.username,
            avatar_url: message.avatar_url || '/public/assets/main-logo.png',
            sent_at: message.sent_at,
            edited_at: message.edited_at,
            type: message.type || 'text'
        };
    }

    async getOnlineUsers() {
        if (!window.globalSocketManager || !window.globalSocketManager.isReady() || !window.globalSocketManager.io) {
            console.warn('⚠️ Socket not ready, cannot get online users');
            return {};
        }
        
        return new Promise((resolve) => {
            window.globalSocketManager.io.emit('get-online-users', {});
            
            const onlineUsersHandler = (data) => {
                window.globalSocketManager.io.off('online-users-response', onlineUsersHandler);
                resolve(data.users || {});
            };
            
            window.globalSocketManager.io.on('online-users-response', onlineUsersHandler);
            
            setTimeout(() => {
                window.globalSocketManager.io.off('online-users-response', onlineUsersHandler);
                resolve({});
            }, 5000);
        });
    }

    async createDirectMessageRoom(userId) {
        return await this.makeRequest('/api/chat/dm/create', {
            method: 'POST',
            body: JSON.stringify({ user_id: userId })
        });
    }

    async sendMessageToServer(messageData) {
        try {
            return await this.makeRequest(`${this.baseURL}/send`, {
                method: 'POST',
                body: JSON.stringify(messageData)
            });
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }

    async uploadFile(formData) {
        try {
            if (!window.MediaAPI) {
                throw new Error('MediaAPI not available');
            }
            
            const response = await window.MediaAPI.uploadFile(formData);
            
            if (!response || !response.success) {
                throw new Error(response?.error?.message || response?.message || 'Upload failed');
            }
            
            const data = response.data || response;
            
            return {
                url: data.file_url,
                name: data.file_name,
                size: data.file_size,
                type: data.mime_type
            };
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    }
    
    async getMessageReactions(messageId) {
        if (!messageId) {
            throw new Error('Message ID is required');
        }
        
        const url = `/api/messages/${messageId}/reactions`;
        
        try {
            const response = await this.makeRequest(url);
            const reactions = response.data?.reactions || response.reactions || [];
            return reactions;
        } catch (error) {
            console.error(`Error fetching reactions for message ${messageId}:`, error);
            return [];
        }
    }
}

const chatAPI = new ChatAPI();
window.ChatAPI = chatAPI;

window.debugMessageSend = function() {
    console.log('🔧 Running message send diagnostics...');
    
    if (!window.ChatAPI) {
        console.error('❌ ChatAPI not available');
        return;
    }
    
    const targetId = document.querySelector('meta[name="chat-id"]')?.content;
    const chatType = document.querySelector('meta[name="chat-type"]')?.content;
    
    if (!targetId) {
        console.error('❌ No chat target ID found');
        return;
    }
    
    window.ChatAPI.debugSocketConnection(targetId, chatType);
    
    setTimeout(() => {
        console.log('🧪 Testing actual message send...');
        window.ChatAPI.testMessageSend('Debug test message from console');
    }, 1000);
};

window.debugMessageDeletion = function() {
    console.log('🔧 Running COMPREHENSIVE message deletion diagnostics...');
    
    if (!window.ChatAPI) {
        console.error('❌ ChatAPI not available');
        return;
    }
    
    const targetId = document.querySelector('meta[name="chat-id"]')?.content;
    const chatType = document.querySelector('meta[name="chat-type"]')?.content;
    const userId = document.querySelector('meta[name="user-id"]')?.content;
    
    console.log('🔍 Current context:', { targetId, chatType, userId });
    
    console.log('🔍 1. Checking socket connection...');
    const socketStatus = window.globalSocketManager?.getStatus();
    console.log('Socket status:', socketStatus);
    
    console.log('🔍 2. Checking joined rooms...');
    if (window.globalSocketManager?.io) {
        window.globalSocketManager.io.emit('debug-rooms');
        
        window.globalSocketManager.io.once('debug-rooms-info', (roomInfo) => {
            console.log('Room membership:', roomInfo);
        });
    }
    
    console.log('🔍 3. Testing message-deleted event emission...');
    if (window.globalSocketManager?.isReady()) {
        const testData = {
            message_id: 'test-123',
            target_type: chatType,
            target_id: targetId,
            user_id: userId,
            username: window.globalSocketManager.username,
            timestamp: Date.now(),
            _test: true
        };
        
        console.log('🧪 Emitting test message-deleted event:', testData);
        window.globalSocketManager.io.emit('message-deleted', testData);
    }
    
    console.log('🔍 4. Checking for real messages to test with...');
    const messages = document.querySelectorAll('.message-content[data-message-id]');
    console.log(`Found ${messages.length} messages on page`);
    
    if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        const messageId = lastMessage.getAttribute('data-message-id');
        const messageUserId = lastMessage.getAttribute('data-user-id');
        
        console.log('Last message info:', {
            messageId,
            messageUserId,
            currentUserId: userId,
            isOwnMessage: messageUserId === userId
        });
        
        if (messageUserId === userId) {
            console.log('✅ You can test deletion of this message');
        } else {
            console.log('⚠️ This message belongs to another user - real-time deletion should work when they delete it');
        }
    }
    
    console.log('🔍 5. Testing event listeners...');
    console.log('ChatSection exists:', !!window.chatSection);
    console.log('ChatSection handleMessageDeleted exists:', typeof window.chatSection?.handleMessageDeleted);
    console.log('ChatSection handleMessageUpdated exists:', typeof window.chatSection?.handleMessageUpdated);
    
    return {
        socketReady: window.globalSocketManager?.isReady(),
        roomsJoined: socketStatus?.joinedChannels?.length + socketStatus?.joinedDMRooms?.length,
        messagesOnPage: messages.length,
        canTestDeletion: true
    };
};

