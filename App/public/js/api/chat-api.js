class ChatAPI {
    constructor() {
        this.baseURL = '/api/chat';
        this.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        if (!window._sentMessageIds) window._sentMessageIds = new Set();
        
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
            const defaultOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin'
            };
            
            const fetchOptions = { ...defaultOptions, ...options };
            
            const response = await fetch(url, fetchOptions);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Request failed with status ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            return data;
        } catch (error) {
            throw error;
        }
    }

    async getMessages(targetId, chatType, options = {}) {
        if (!targetId) {
            throw new Error('Target ID is required');
        }

        const apiChatType = this.normalizeApiChatType(chatType);
        
        const limit = options.limit || 50;
        const before = options.before || null;
        const offset = options.offset || 0;
        
        let url = `${this.baseURL}/${apiChatType}/${targetId}/messages?limit=${limit}&offset=${offset}`;
        if (before) {
            url += `&before=${before}`;
        }
        
        const response = await this.makeRequest(url);
        return response;
    }

    normalizeApiChatType(chatType) {
        if (chatType === 'direct' || chatType === 'dm') {
            return 'dm';
        }
        
        if (chatType === 'text' || chatType === 'voice' || chatType === 'channel') {
            return 'channel';
        }
        
        return chatType;
    }

    async uploadFiles(formData) {
        try {
            const response = await fetch('/api/media/upload-multiple', {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                throw new Error(`File upload failed with status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
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
                return {
                    target_type: 'channel',
                    target_id: null
                };
            }
        } catch (error) {
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
        
        if (status.socketReady && window.globalSocketManager?.io) {
            window.globalSocketManager.io.emit('debug-rooms');
            
            window.globalSocketManager.io.once('debug-rooms-info', (roomInfo) => {
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
        if (!window.chatSection) {
            return false;
        }
        
        if (!window.chatSection.targetId) {
            return false;
        }
        
        if (!window.chatSection.sendReceiveHandler) {
            return false;
        }
        
        const originalValue = window.chatSection.messageInput?.value || '';
        if (window.chatSection.messageInput) {
            window.chatSection.messageInput.value = content;
        }
        
        try {
            window.chatSection.sendReceiveHandler.sendMessage();
            return true;
        } catch (error) {
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
            throw error;
        }
    }

    async uploadFile(formData) {
        try {
            const response = await fetch('/api/media/upload', {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                throw new Error(`File upload failed with status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (!result || !result.success) {
                const errorMessage = result?.error?.message || result?.message || 'Upload failed';
                if (errorMessage.includes('too large') || errorMessage.includes('413')) {
                    throw new Error('File is too large. Please choose a smaller file.');
                }
                throw new Error(errorMessage);
            }
            
            return {
                url: result.file_url,
                name: result.file_name,
                size: result.file_size,
                type: result.mime_type
            };
        } catch (error) {
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
            return [];
        }
    }

    emitSocketEventForMessage(chatType, targetId, eventName, data) {
        const eventNameMap = {
            'new-message': {
                'channel': 'new-channel-message',
                'dm': 'user-message-dm'
            },
            'edit-message': {
                'channel': 'edit-channel-message',
                'dm': 'edit-message-dm'
            },
            'delete-message': {
                'channel': 'delete-channel-message',
                'dm': 'delete-message-dm'
            },
            'add-reaction': {
                'channel': 'add-reaction-channel',
                'dm': 'add-reaction-dm'
            },
            'remove-reaction': {
                'channel': 'remove-reaction-channel',
                'dm': 'remove-reaction-dm'
            }
        };

        const mappedEventName = eventNameMap[eventName]?.[chatType] || eventName;

        if (window.globalSocketManager?.io) {
            const socketData = {
                ...data,
                target_id: targetId,
                chat_type: chatType,
                user_id: data.user_id
            };

            window.globalSocketManager.io.emit(mappedEventName, socketData);
        }
    }

    sendDirectSocketMessage(targetId, content, chatType = 'channel') {
        if (!window.globalSocketManager || !window.globalSocketManager.io) {
            return false;
        }

        const eventName = chatType === 'dm' ? 'user-message-dm' : 'new-channel-message';
        
        const messageData = {
            content: content,
            target_id: targetId,
            chat_type: chatType,
            temporary_id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };

        window.globalSocketManager.io.emit(eventName, messageData);
        
        return true;
    }

    debugSocketStatus() {
        const socketManager = window.globalSocketManager;
        const status = {
            exists: !!socketManager,
            connected: socketManager?.connected || false,
            authenticated: socketManager?.authenticated || false,
            ready: socketManager?.isReady() || false,
            socketId: socketManager?.io?.id || null,
            userId: socketManager?.userId || null,
            username: socketManager?.username || null
        };
        
        return status;
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
            return null;
        }
    }

    cleanupSentMessageIds() {
        if (window._sentMessageIds && window._sentMessageIds.size > 1000) {
            const entries = Array.from(window._sentMessageIds);
            const toKeep = entries.slice(-500);
            window._sentMessageIds = new Set(toKeep);
        }
    }
}

const chatAPI = new ChatAPI();
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

