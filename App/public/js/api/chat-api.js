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
        
        console.log(`📤 [CHAT-API] Starting sendMessage:`, {
            targetId,
            content: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
            chatType,
            apiChatType,
            options
        });
        
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
            
            console.log(`📡 [CHAT-API] Sending to database:`, {
                url,
                requestData: {
                    ...requestData,
                    content: requestData.content.substring(0, 50) + (requestData.content.length > 50 ? '...' : '')
                }
            });
            
            const response = await this.makeRequest(url, {
                method: 'POST',
                body: JSON.stringify(requestData)
            });
            
            console.log(`✅ [CHAT-API] Database response received:`, {
                success: response?.success,
                hasData: !!response?.data,
                hasNestedData: !!(response?.data?.data),
                hasMessage: !!(response?.data?.data?.message),
                messageId: response?.data?.data?.message?.id,
                fullResponse: response
            });
            
            // Check for nested data structure (response.data.data.message)
            if (response && response.success && response.data && response.data.data && response.data.data.message) {
                const message = response.data.data.message;
                console.log(`🚀 [CHAT-API] Preparing socket emission:`, {
                    messageId: message.id,
                    userId: message.user_id,
                    username: message.username,
                    chatType,
                    targetId,
                    socketManagerReady: window.globalSocketManager?.isReady()
                });
                
                const socketData = {
                    id: message.id,
                    content: message.content,
                    message_type: message.message_type || options.message_type || 'text',
                    timestamp: message.sent_at ? new Date(message.sent_at).getTime() : Date.now(),
                    user_id: message.user_id,
                    username: message.username,
                    avatar_url: message.avatar_url,
                    attachment_url: message.attachment_url || options.attachment_url,
                    reply_message_id: message.reply_message_id || options.reply_message_id,
                    reply_data: message.reply_data,
                    message: message
                };
                
                console.log(`📡 [CHAT-API] Socket data prepared:`, {
                    id: socketData.id,
                    userId: socketData.user_id,
                    username: socketData.username,
                    contentLength: socketData.content?.length,
                    messageType: socketData.message_type,
                    hasMessage: !!socketData.message
                });
                
                this.emitSocketEvent(chatType, targetId, 'new-message', socketData);
            } else {
                console.warn(`⚠️ [CHAT-API] No valid message in response:`, {
                    success: response?.success,
                    hasData: !!response?.data,
                    hasNestedData: !!(response?.data?.data),
                    hasMessage: !!(response?.data?.data?.message),
                    responseStructure: response?.data ? Object.keys(response.data) : 'No data'
                });
            }
            
            return response;
        } catch (error) {
            console.error('❌ [CHAT-API] Error sending message to database:', error);
            throw error;
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
            
            console.log(`✅ [CHAT-API] Update message response:`, {
                success: response?.success,
                hasData: !!response?.data,
                hasNestedData: !!(response?.data?.data),
                hasMessage: !!(response?.data?.data?.message || response?.data?.message)
            });
            
            // Handle both nested and non-nested response structures
            const messageData = response?.data?.data?.message || response?.data?.message;
            const targetType = response?.data?.data?.target_type || response?.data?.target_type;
            const targetId = response?.data?.data?.target_id || response?.data?.target_id;
            
            if (response && response.success && messageData) {
                this.emitSocketEventForMessage(targetType, targetId, 'message-updated', {
                    message_id: messageId,
                    message: messageData,
                    user_id: messageData.user_id,
                    username: messageData.username
                });
            }
            
            return response;
        } catch (error) {
            console.error('❌ [CHAT-API] Error updating message in database:', error);
            throw error;
        }
    }
    


    async deleteMessage(messageId) {
        const url = `/api/messages/${messageId}`;
        
        try {
            const response = await this.makeRequest(url, {
                method: 'DELETE'
            });
            
            console.log(`✅ [CHAT-API] Delete message response:`, {
                success: response?.success,
                hasData: !!response?.data,
                hasNestedData: !!(response?.data?.data)
            });
            
            // Handle both nested and non-nested response structures
            const targetType = response?.data?.data?.target_type || response?.data?.target_type;
            const targetId = response?.data?.data?.target_id || response?.data?.target_id;
            const userId = response?.data?.data?.user_id || response?.data?.user_id;
            const username = response?.data?.data?.username || response?.data?.username;
            
            if (response && response.success && targetType && targetId) {
                this.emitSocketEventForMessage(targetType, targetId, 'message-deleted', {
                    message_id: messageId,
                    user_id: userId,
                    username: username || 'Unknown'
                });
            }
            
            return response;
        } catch (error) {
            console.error('❌ [CHAT-API] Error deleting message:', error);
            throw error;
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
            
            if (response && response.success && response.data && response.data.target_type) {
                const eventName = response.data.action === 'pinned' ? 'message-pinned' : 'message-unpinned';
                this.emitSocketEventForMessage(response.data.target_type, response.data.target_id, eventName, {
                    message_id: messageId,
                    action: response.data.action,
                    message: response.data.message,
                    user_id: window.globalSocketManager?.userId || null,
                    username: window.globalSocketManager?.username || 'Unknown'
                });
            }
            
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
            
            console.log(`✅ [CHAT-API] Add reaction response:`, {
                success: response?.success,
                hasData: !!response?.data,
                hasNestedData: !!(response?.data?.data)
            });
            
            // Handle both nested and non-nested response structures
            const targetType = response?.data?.data?.target_type || response?.data?.target_type;
            const targetId = response?.data?.data?.target_id || response?.data?.target_id;
            const userId = response?.data?.data?.user_id || response?.data?.user_id;
            const username = response?.data?.data?.username || response?.data?.username;
            
            if (response && response.success && targetType && targetId) {
                this.emitSocketEventForMessage(targetType, targetId, 'reaction-added', {
                    message_id: messageId,
                    user_id: userId,
                    username: username,
                    emoji: emoji,
                    action: 'added'
                });
            }
            
            return response;
        } catch (error) {
            console.error('❌ [CHAT-API] Error adding reaction:', error);
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
            
            console.log(`✅ [CHAT-API] Remove reaction response:`, {
                success: response?.success,
                hasData: !!response?.data,
                hasNestedData: !!(response?.data?.data)
            });
            
            // Handle both nested and non-nested response structures
            const targetType = response?.data?.data?.target_type || response?.data?.target_type;
            const targetId = response?.data?.data?.target_id || response?.data?.target_id;
            const userId = response?.data?.data?.user_id || response?.data?.user_id;
            const username = response?.data?.data?.username || response?.data?.username;
            
            if (response && response.success && targetType && targetId) {
                this.emitSocketEventForMessage(targetType, targetId, 'reaction-removed', {
                    message_id: messageId,
                    user_id: userId,
                    username: username,
                    emoji: emoji,
                    action: 'removed'
                });
            }
            
            return response;
        } catch (error) {
            console.error('❌ [CHAT-API] Error removing reaction:', error);
            throw error;
        }
    }
    emitSocketEvent(chatType, targetId, eventName, data) {
        console.log(`🔌 [CHAT-API] emitSocketEvent called:`, {
            chatType,
            targetId,
            eventName,
            userId: data.user_id,
            messageId: data.id,
            hasGlobalSocketManager: !!window.globalSocketManager,
            socketManagerReady: window.globalSocketManager?.isReady(),
            socketConnected: window.globalSocketManager?.connected,
            socketAuthenticated: window.globalSocketManager?.authenticated
        });
        
        if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {
            console.warn('⚠️ [CHAT-API] Socket not ready for event emission:', {
                hasManager: !!window.globalSocketManager,
                isReady: window.globalSocketManager?.isReady(),
                connected: window.globalSocketManager?.connected,
                authenticated: window.globalSocketManager?.authenticated
            });
            return;
        }
        
        const socketEventName = chatType === 'channel' ? 'new-channel-message' : 'user-message-dm';
        if (eventName === 'new-message') {
            eventName = socketEventName;
        }
        
        console.log(`🔄 [CHAT-API] Event name determined:`, {
            originalEventName: 'new-message',
            finalEventName: eventName,
            socketEventName,
            chatType
        });
        
        const socketData = {
            id: data.id || data.message_id,
            content: data.content,
            user_id: data.user_id,
            username: data.username,
            message_type: data.message_type || 'text',
            timestamp: data.timestamp || Date.now(),
            source: 'client-originated'
        };
        
        if (chatType === 'channel') {
            socketData.channel_id = targetId;
        } else {
            socketData.room_id = targetId;
        }
        
        if (data.attachment_url) {
            socketData.attachment_url = data.attachment_url;
        }
        
        if (data.reply_message_id) {
            socketData.reply_message_id = data.reply_message_id;
            socketData.reply_data = data.reply_data;
        }
        
        if (data.message) {
            socketData.message = data.message;
        }
        
        console.log(`📡 [CHAT-API] Final socket data prepared:`, {
            event: eventName,
            id: socketData.id,
            userId: socketData.user_id,
            username: socketData.username,
            channelId: socketData.channel_id,
            roomId: socketData.room_id,
            contentLength: socketData.content?.length,
            source: socketData.source,
            hasAllRequiredFields: !!(socketData.id && socketData.user_id && socketData.username && socketData.content && socketData.source)
        });
        
        console.log(`🚀 [CHAT-API] Emitting socket event...`);
        
        try {
            window.globalSocketManager.io.emit(eventName, socketData);
            console.log(`✅ [CHAT-API] Socket event emitted successfully:`, {
                event: eventName,
                messageId: socketData.id,
                targetRoom: socketData.channel_id ? `channel-${socketData.channel_id}` : `dm-room-${socketData.room_id}`
            });
        } catch (error) {
            console.error(`❌ [CHAT-API] Error emitting socket event:`, error);
        }
    }
    
    emitSocketEventForMessage(targetType, targetId, eventName, data) {
        if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {
            console.warn('Socket not ready for event emission');
            return;
        }
        
        const roomData = {
            ...data,
            target_type: targetType,
            target_id: targetId,
            source: 'client-originated'
        };
        
        if (targetType === 'channel') {
            roomData.channel_id = targetId;
        } else if (targetType === 'dm') {
            roomData.room_id = targetId;
        }
        
        window.globalSocketManager.io.emit(eventName, roomData);
    }

    debugSocketStatus() {
        console.log(`🔍 [CHAT-API] Socket Status Debug:`, {
            hasGlobalSocketManager: !!window.globalSocketManager,
            socketReady: window.globalSocketManager?.isReady(),
            socketConnected: window.globalSocketManager?.connected,
            socketAuthenticated: window.globalSocketManager?.authenticated,
            socketId: window.globalSocketManager?.io?.id,
            userId: window.globalSocketManager?.userId,
            username: window.globalSocketManager?.username,
            joinedChannels: Array.from(window.globalSocketManager?.joinedChannels || []),
            joinedDMRooms: Array.from(window.globalSocketManager?.joinedDMRooms || [])
        });
        
        if (window.globalSocketManager?.io) {
            console.log(`📊 [CHAT-API] Socket IO Status:`, {
                connected: window.globalSocketManager.io.connected,
                disconnected: window.globalSocketManager.io.disconnected,
                id: window.globalSocketManager.io.id
            });
        }
        
        return {
            ready: window.globalSocketManager?.isReady(),
            connected: window.globalSocketManager?.connected,
            authenticated: window.globalSocketManager?.authenticated
        };
    }
}

console.log('🔄 Creating ChatAPI instance...');
const chatAPI = new ChatAPI();
console.log('✅ ChatAPI instance created:', chatAPI);

window.ChatAPI = chatAPI;
window.chatAPI = chatAPI;

console.log('✅ ChatAPI attached to window:', {
    ChatAPI: !!window.ChatAPI,
    chatAPI: !!window.chatAPI,
    readyForChatSection: true
});

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

window.debugSocket = function() {
    console.log('🔧 [DEBUG] Running socket diagnostics...');
    if (window.ChatAPI) {
        return window.ChatAPI.debugSocketStatus();
    } else {
        console.error('❌ [DEBUG] ChatAPI not available');
        return null;
    }
};

window.testSocketMessage = function(content = 'Test socket message') {
    console.log('🧪 [DEBUG] Testing socket message emission...');
    
    const targetId = document.querySelector('meta[name="chat-id"]')?.content;
    const chatType = document.querySelector('meta[name="chat-type"]')?.content;
    
    if (!targetId || !chatType) {
        console.error('❌ [DEBUG] No chat context found');
        return;
    }
    
    console.log('📋 [DEBUG] Chat context:', { targetId, chatType });
    
    if (window.ChatAPI) {
        return window.ChatAPI.sendMessage(targetId, content, chatType);
    } else {
        console.error('❌ [DEBUG] ChatAPI not available');
    }
};

