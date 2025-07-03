class ChatAPI {
    constructor() {
        this.baseURL = '/api/chat';
    }

    async makeRequest(url, options = {}) {
        try {
            const defaultHeaders = {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            };

            const config = {
                credentials: 'include',
                headers: { ...defaultHeaders, ...options.headers },
                ...options
            };

            console.log(`Making request to: ${url}`);
            const response = await fetch(url, config);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`API Error (${response.status}):`, errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log(`Response from ${url}:`, data);
            return data;
        } catch (error) {
            console.error(`Request failed for ${url}:`, error);
            throw error;
        }
    }

    normalizeApiChatType(chatType) {
        if (chatType === 'channel') return 'channel';
        if (chatType === 'direct' || chatType === 'dm') return 'dm';
        return chatType;
    }

    async getMessages(targetId, chatType, options = {}) {
        if (!targetId) {
            throw new Error('Target ID is required');
        }

        const apiChatType = this.normalizeApiChatType(chatType);
        
        const limit = options.limit || 20;
        const before = options.before || null;
        const offset = options.offset || 0;
        
        let url = `${this.baseURL}/${apiChatType}/${targetId}/messages?limit=${limit}&offset=${offset}&t=${Date.now()}`;
        if (before) {
            url += `&before=${before}`;
        }
        
        console.log(`📡 [CHAT-API] Loading messages from:`, url);
        const response = await this.makeRequest(url);
        
        // Debug the response structure and check for bot messages
        console.log(`📨 [CHAT-API] Raw response:`, response);
        
        let messages = [];
        if (response.success && response.data && response.data.messages) {
            messages = response.data.messages;
        } else if (response.success && response.data && Array.isArray(response.data)) {
            messages = response.data;
        } else if (Array.isArray(response)) {
            messages = response;
        }
        
        console.log(`📋 [CHAT-API] Processed ${messages.length} messages:`, messages);
        
        // Check for bot messages specifically
        const botMessages = messages.filter(msg => {
            // Check various ways a message could be from a bot
            const isBotUser = msg.user_status === 'bot' || msg.status === 'bot';
            const isBotUsername = msg.username && (msg.username.toLowerCase().includes('bot') || msg.username.toLowerCase() === 'titibot');
            const isBotUserId = msg.user_id === '4' || msg.user_id === 4; // TitiBot has ID 4
            
            return isBotUser || isBotUsername || isBotUserId;
        });
        
        console.log(`🤖 [CHAT-API] Found ${botMessages.length} bot messages:`, botMessages);
        
        if (botMessages.length > 0) {
            console.log(`🤖 [CHAT-API] Bot message details:`, botMessages.map(msg => ({
                id: msg.id,
                user_id: msg.user_id,
                username: msg.username,
                content: msg.content?.substring(0, 50) + '...',
                user_status: msg.user_status,
                status: msg.status,
                sent_at: msg.sent_at
            })));
        } else {
            console.log(`❌ [CHAT-API] No bot messages found in response`);
            
            // Debug user information to see what users are in the messages
            const users = messages.map(msg => ({
                user_id: msg.user_id,
                username: msg.username,
                user_status: msg.user_status,
                status: msg.status
            }));
            console.log(`👥 [CHAT-API] All users in messages:`, users);
        }
        
        return response;
    }

    async sendMessage(targetId, chatType, content, options = {}) {
        if (!targetId || !content) {
            throw new Error('Target ID and content are required');
        }

        const apiChatType = this.normalizeApiChatType(chatType);
        
        const payload = {
            content: content,
            message_type: options.messageType || 'text',
            attachments: options.attachments || [],
            mentions: options.mentions || [],
            reply_message_id: options.replyMessageId || null
        };

        const response = await this.makeRequest(
            `${this.baseURL}/${apiChatType}/${targetId}/messages`,
            {
                method: 'POST',
                body: JSON.stringify(payload)
            }
        );
        
        return response;
    }

    async updateMessage(messageId, content) {
        if (!messageId || !content) {
            throw new Error('Message ID and content are required');
        }

        const response = await this.makeRequest(
            `${this.baseURL}/messages/${messageId}`,
            {
                method: 'PUT',
                body: JSON.stringify({ content })
            }
        );
        
        return response;
    }

    async deleteMessage(messageId) {
        if (!messageId) {
            throw new Error('Message ID is required');
        }

        const response = await this.makeRequest(
            `${this.baseURL}/messages/${messageId}`,
            { method: 'DELETE' }
        );
        
        return response;
    }

    async createDirectMessage(friendId, content, options = {}) {
        if (!friendId || !content) {
            throw new Error('Friend ID and content are required');
        }

        const payload = {
            friend_id: friendId,
            content: content,
            message_type: options.messageType || 'text',
            attachments: options.attachments || [],
            mentions: options.mentions || [],
            reply_message_id: options.replyMessageId || null
        };

        const response = await this.makeRequest(
            `${this.baseURL}/direct/create`,
            {
                method: 'POST',
                body: JSON.stringify(payload)
            }
        );
        
        return response;
    }

    async getDirectMessageRooms() {
        const response = await this.makeRequest(`${this.baseURL}/direct/rooms?t=${Date.now()}`);
        return response;
    }

    async getDirectMessageRoom(roomId) {
        if (!roomId) {
            throw new Error('Room ID is required');
        }

        const response = await this.makeRequest(`${this.baseURL}/direct/rooms/${roomId}?t=${Date.now()}`);
        return response;
    }

    async searchMessages(channelId, query) {
        if (!channelId || !query) {
            throw new Error('Channel ID and search query are required');
        }

        const response = await this.makeRequest(
            `${this.baseURL}/channels/${channelId}/search?q=${encodeURIComponent(query)}&t=${Date.now()}`
        );
        
        return response;
    }
    
    async searchServerMessages(serverId, query) {
        if (!serverId || !query) {
            throw new Error('Server ID and search query are required');
        }

        if (typeof serverId !== 'number' && !Number.isInteger(parseInt(serverId))) {
            throw new Error('Invalid server ID');
        }

        if (typeof query !== 'string' || query.trim().length < 1) {
            throw new Error('Search query must be at least 1 character');
        }

        const trimmedQuery = query.trim();
        if (trimmedQuery.length > 255) {
            throw new Error('Search query is too long');
        }

        try {
            const response = await this.makeRequest(
                `/api/servers/${serverId}/search?q=${encodeURIComponent(trimmedQuery)}&t=${Date.now()}`
            );
            
            return response.data?.messages || response.messages || [];
        } catch (error) {
            console.error('Server search error:', error);
            throw error;
        }
    }

    async getMessageReactions(messageId) {
        if (!messageId) {
            throw new Error('Message ID is required');
        }

        const response = await this.makeRequest(
            `/api/messages/${messageId}/reactions?t=${Date.now()}`
        );
        
        return response.reactions || [];
    }
}

const chatAPI = new ChatAPI();
window.ChatAPI = chatAPI;

export { ChatAPI };
export default chatAPI;

