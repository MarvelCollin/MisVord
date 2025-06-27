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
            } else if (response.status === 413) {
                errorMessage = 'File too large - please choose a smaller file';
            }
            
            throw new Error(errorMessage);
        }
        
        try {
            const cleanedText = text.trim().replace(/^\uFEFF/, '');
            const parsed = JSON.parse(cleanedText);
            
            if (parsed.success === false) {
                throw new Error(parsed.message || 'Request failed');
            }
            
            return parsed;
        } catch (e) {
            if (e.message.includes('Request failed') || e.message.includes('File too large')) {
                throw e;
            }
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
        return true; // Always return true, authentication handled server-side
    }    async sendMessage(targetId, content, chatType = 'channel', options = {}) {
        const url = `${this.baseURL}/send`;
        const apiChatType = chatType === 'direct' ? 'dm' : chatType;
        
        try {
            const requestData = {
                target_type: apiChatType,
                target_id: targetId,
                content: content
            };
            
            if (options.message_type) {
                requestData.message_type = options.message_type;
            }
            
            if (options.attachment_url) {
                requestData.attachment_url = options.attachment_url;
            }
            
            if (options.reply_message_id) {
                requestData.reply_message_id = options.reply_message_id;
            }
            
            const response = await this.makeRequest(url, {
                method: 'POST',
                body: JSON.stringify(requestData)
            });
            
            if (response && response.success !== false) {
                if (response.client_should_emit_socket === true) {
                    if (response.socket_data && response.socket_data.message) {
                        this.sendDirectSocketMessageWithServerData(targetId, chatType, response.socket_data);
                    } else {
                        this.sendDirectSocketMessage(targetId, content, chatType, options);
                    }
                }
            }
            
            return response;
        } catch (error) {
            console.error('Error sending message to database:', error);
            throw error;
        }
    }

    sendDirectSocketMessageWithServerData(targetId, chatType, socketData) {
        if (!window.globalSocketManager?.isReady() || !window.globalSocketManager.io) {
            console.error('Socket not ready for message transmission');
            return false;
        }
        
        const io = window.globalSocketManager.io;
        
        try {
            const baseMessageData = {
                id: socketData.message.id,
                user_id: socketData.message.user_id,
                username: socketData.message.username || socketData.username,
                timestamp: socketData.timestamp,
                content: socketData.message.content,
                message_type: socketData.message.message_type || socketData.message_type,
                avatar_url: socketData.message.avatar_url,
                sent_at: socketData.message.sent_at,
                source: 'api-relay'
            };
            
            if (chatType === 'channel') {
                const messageData = {
                    ...baseMessageData,
                    channel_id: targetId
                };
                io.emit('new-channel-message', messageData);
            } 
            else if (chatType === 'direct' || chatType === 'dm') {
                const messageData = {
                    ...baseMessageData,
                    room_id: targetId
                };
                io.emit('user-message-dm', messageData);
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
                channel_id: targetId,
                content: content,
                message_type: options.message_type || 'text',
                attachment_url: options.attachment_url || null,
                timestamp: timestamp,
                user_id: userId,
                username: username
                };
                
                if (options.reply_message_id) {
                    messageData.reply_message_id = options.reply_message_id;
                    
                    if (options.reply_data) {
                        messageData.reply_data = options.reply_data;
                    }
                }
            } 
            else if (chatType === 'direct' || chatType === 'dm') {
                eventName = 'user-message-dm';
                messageData = {
                                    id: messageId,
                room_id: targetId,
                content: content,
                message_type: options.message_type || 'text',
                attachment_url: options.attachment_url || null,
                timestamp: timestamp,
                user_id: userId,
                username: username
                };
                
                if (options.reply_message_id) {
                    messageData.reply_message_id = options.reply_message_id;
                    
                    if (options.reply_data) {
                        messageData.reply_data = options.reply_data;
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
            
            if (response && response.client_should_emit_socket === true && response.socket_data) {
                this.sendDirectSocketUpdate(messageId, content, response.socket_data.target_type, response.socket_data.target_id);
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
            
            if (response && response.client_should_emit_socket === true && response.socket_data) {
                this.sendDirectSocketDelete(messageId, response.socket_data.target_type, response.socket_data.target_id);
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

    async pinMessage(messageId) {
        if (!messageId) {
            throw new Error('Message ID is required');
        }
        
        const url = `/api/messages/${messageId}/pin`;
        
        try {
            const response = await this.makeRequest(url, {
                method: 'POST'
            });
            
            return response;
        } catch (error) {
            throw error;
        }
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
            user_id: window.globalSocketManager?.userId || 'none',
            username: window.globalSocketManager?.username || 'none',
            target_id: targetId,
            chat_type: chatType,
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
            avatar_url: message.avatar_url || '/public/assets/common/default-profile-picture.png',
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
        try {
            const response = await this.makeRequest('/api/chat/dm/create', {
                method: 'POST',
                body: JSON.stringify({ friend_id: userId })
            });
            
            if (response && response.success && response.data) {
                return {
                    success: true,
                    room_id: response.data.room_id || response.data.chat_room?.id,
                    data: response.data
                };
            }
            
            throw new Error(response?.message || 'Failed to create DM room');
        } catch (error) {
            console.error('Error creating DM room:', error);
            throw error;
        }
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
                const errorMessage = response?.error?.message || response?.message || 'Upload failed';
                if (errorMessage.includes('too large') || errorMessage.includes('413')) {
                    throw new Error('File is too large. Please choose a smaller file.');
                }
                throw new Error(errorMessage);
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
            if (error.message.includes('too large')) {
                throw new Error('File is too large. Please choose a smaller file.');
            }
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

    async addReaction(messageId, emoji) {
        if (!messageId || !emoji) {
            throw new Error('Message ID and emoji are required');
        }
        
        const url = `/api/messages/${messageId}/reactions`;
        
        try {
            const response = await this.makeRequest(url, {
                method: 'POST',
                body: JSON.stringify({
                    emoji: emoji
                })
            });
            
            return response;
        } catch (error) {
            console.error('Error adding reaction:', error);
            throw error;
        }
    }

    async removeReaction(messageId, emoji) {
        if (!messageId || !emoji) {
            throw new Error('Message ID and emoji are required');
        }
        
        const url = `/api/messages/${messageId}/reactions`;
        
        try {
            const response = await this.makeRequest(url, {
                method: 'DELETE',
                body: JSON.stringify({
                    emoji: emoji
                })
            });
            
            return response;
        } catch (error) {
            console.error('Error removing reaction:', error);
            throw error;
        }
    }
}

const chatAPI = new ChatAPI();
window.ChatAPI = chatAPI;
window.chatAPI = chatAPI; // Also expose as lowercase for consistency

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

