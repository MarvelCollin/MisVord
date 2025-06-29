class ChatAPI {
    constructor() {
        this.baseURL = '/api/chat';
        this.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        // Initialize tracking of sent messages
        if (!window._sentMessageIds) window._sentMessageIds = new Set();
        
        // Set up periodic cleanup of sent message IDs (every 5 minutes)
        setInterval(() => this.cleanupSentMessageIds(), 5 * 60 * 1000);
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
    }

    async makeRequest(url, options = {}) {
        try {
            // Log the request
            console.log('📡 API Request:', url);
            
            const defaultOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            };
            
            // Merge options
            const fetchOptions = { ...defaultOptions, ...options };
            
            // Make request
            const response = await fetch(url, fetchOptions);
            console.log('📡 Response received:', {
                url,
                status: response.status,
                statusText: response.statusText
            });
            
            // Handle response
            if (!response.ok) {
                console.error('API Request failed with status:', {
                    url,
                    status: response.status, 
                    statusText: response.statusText
                });
                
                throw new Error(`Request failed with status ${response.status}: ${response.statusText}`);
            }
            
            // Parse JSON response
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    async getMessages(targetId, chatType, options = {}) {
        if (!targetId) {
            throw new Error('Target ID is required');
        }

        // Normalize chat type
        const apiChatType = chatType === 'direct' ? 'dm' : chatType;
        
        // Set up query parameters
        const limit = options.limit || 50;
        const before = options.before || null;
        const offset = options.offset || 0;
        
        // Use the primary endpoint format
        let url = `${this.baseURL}/${apiChatType}/${targetId}/messages?limit=${limit}&offset=${offset}`;
        if (before) {
            url += `&before=${before}`;
        }
        
        console.log('🔍 Getting messages from:', url);
        
        // Fetch messages from primary endpoint
        const response = await this.makeRequest(url);
        return response;
    }



    async uploadFiles(formData) {
        try {
            const response = await fetch('/api/media/upload', {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                throw new Error(`File upload failed with status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error uploading files:', error);
            throw error;
        }
    }

    async getPinnedMessages(targetId, chatType) {
        if (!targetId) {
            throw new Error('Target ID is required');
        }
        
        const apiChatType = chatType === 'direct' ? 'dm' : chatType;
        const url = `${this.baseURL}/${apiChatType}/${targetId}/pins`;
        
        return await this.makeRequest(url);
    }

    async pinMessage(messageId) {
        if (!messageId) {
            throw new Error('Message ID is required');
        }
        
        const url = `/api/messages/${messageId}/pin`;
        
        return await this.makeRequest(url, { method: 'POST' });
    }

    async unpinMessage(messageId) {
        if (!messageId) {
            throw new Error('Message ID is required');
        }
        
        const url = `/api/messages/${messageId}/unpin`;
        
        return await this.makeRequest(url, { method: 'POST' });
    }

    async editMessage(messageId, content) {
        if (!messageId) {
            throw new Error('Message ID is required');
        }
        
        if (!content) {
            throw new Error('Message content is required');
        }
        
        const url = `/api/messages/${messageId}`;
        const options = {
            method: 'PUT',
            body: JSON.stringify({
                content: content
            })
        };
        
        return await this.makeRequest(url, options);
    }

    async deleteMessage(messageId) {
        if (!messageId) {
            throw new Error('Message ID is required');
        }
        
        const url = `/api/messages/${messageId}`;
        
        return await this.makeRequest(url, { method: 'DELETE' });
    }

    async addReaction(messageId, emoji) {
        if (!messageId || !emoji) {
            throw new Error('Message ID and emoji are required');
        }
        
        const url = `/api/messages/${messageId}/reactions`;
        const options = {
            method: 'POST',
            body: JSON.stringify({
                emoji: emoji
            })
        };
        
        return await this.makeRequest(url, options);
    }

    async removeReaction(messageId, emoji) {
        if (!messageId || !emoji) {
            throw new Error('Message ID and emoji are required');
        }
        
        const url = `/api/messages/${messageId}/reactions`;
        
        return await this.makeRequest(url, { 
            method: 'DELETE',
            body: JSON.stringify({ emoji: emoji })
        });
    }

    async searchMessages(targetId, chatType, query) {
        if (!targetId || !query) {
            throw new Error('Target ID and search query are required');
        }
        
        const apiChatType = chatType === 'direct' ? 'dm' : chatType;
        const url = `${this.baseURL}/${apiChatType}/${targetId}/search?q=${encodeURIComponent(query)}`;
        
        return await this.makeRequest(url);
    }

    async checkAuthentication() {
        return true; 
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
        
        if (!window.chatSection.sendReceiveHandler) {
            console.error('❌ SendReceiveHandler not available');
            return false;
        }
        
        console.log('✅ Calling sendReceiveHandler.sendMessage with test content');
        
        const originalValue = window.chatSection.messageInput?.value || '';
        if (window.chatSection.messageInput) {
            window.chatSection.messageInput.value = content;
        }
        
        try {
            window.chatSection.sendReceiveHandler.sendMessage();
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


    
    emitSocketEventForMessage(chatType, targetId, eventName, data) {
        console.log(`🔌 [CHAT-API] emitSocketEvent called:`, {
            chatType,
            targetId,
            eventName,
            userId: data.user_id,
            messageId: data.id || data.message_id
        });

        // Determine the correct event name based on chat type and original event
        const eventNameMap = {
            'new-message': {
                'channel': 'new-channel-message',
                'dm': 'user-message-dm'
            },
            'message-updated': 'message-updated',
            'message-deleted': 'message-deleted',
            'reaction-added': 'reaction-added',
            'reaction-removed': 'reaction-removed',
            'message-pinned': 'message-pinned',
            'message-unpinned': 'message-unpinned'
        };

        const finalEventName = eventNameMap[eventName]?.[chatType] || eventNameMap[eventName] || eventName;

        console.log(`🔄 [CHAT-API] Event name determined:`, {
            originalEventName: eventName,
            finalEventName,
            socketEventName: finalEventName,
            chatType
        });

        // Normalize targetId for DM rooms (strip prefix if present)
        let normalizedTargetId = targetId;
        if (chatType === 'dm' && typeof targetId === 'string') {
            // Always use plain ID without prefix for socket communication
            normalizedTargetId = targetId.replace('dm-room-', '');
            console.log(`🔄 [CHAT-API] Normalized DM room ID from ${targetId} to ${normalizedTargetId}`);
        }
        
        // Prepare the socket data
        const socketData = {
            ...data,
            event: finalEventName
        };

        // Add chat type specific fields
        if (chatType === 'channel') {
            socketData.channel_id = normalizedTargetId;
        } else if (chatType === 'dm') {
            socketData.room_id = normalizedTargetId;
        }
        
        console.log(`📡 [CHAT-API] Final socket data prepared:`, {
            event: socketData.event,
            id: socketData.id,
            userId: socketData.user_id,
            username: socketData.username,
            channelId: socketData.channel_id,
            roomId: socketData.room_id
        });

        // Emit the event
        if (window.globalSocketManager && window.globalSocketManager.isReady()) {
            console.log(`🚀 [CHAT-API] Emitting socket event...`);
            window.globalSocketManager.emitToRoom(finalEventName, socketData, chatType, normalizedTargetId);
            console.log(`✅ [CHAT-API] Socket event emitted successfully:`, {
                event: finalEventName,
                messageId: socketData.id || socketData.message_id,
                targetRoom: chatType === 'channel' ? `channel-${normalizedTargetId}` : `dm-room-${normalizedTargetId}`
            });
        } else {
            console.warn(`⚠️ [CHAT-API] Socket manager not ready, skipping event emission`);
        }
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

    async getMessage(messageId) {
        if (!messageId) {
            throw new Error('Message ID is required');
        }
        const url = `/api/messages/${messageId}`;
        try {
            const response = await this.makeRequest(url);
            return response.data?.message || response.message || null;
        } catch (error) {
            console.error('Error fetching message:', error);
            return null;
        }
    }

    // Helper to prevent memory leaks by cleaning up sent message tracking
    cleanupSentMessageIds() {
        if (window._sentMessageIds && window._sentMessageIds.size > 1000) {
            console.log(`%c[CHAT-API CLEANUP]`, 'color: #607D8B; font-weight: bold;', 
                `Cleaning up sent message tracking (${window._sentMessageIds.size} ids)`);
            window._sentMessageIds.clear();
        }
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

