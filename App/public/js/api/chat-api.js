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
        
        const limit = options.limit || 50;
        const before = options.before || null;
        const offset = options.offset || 0;
        
        let url = `${this.baseURL}/${apiChatType}/${targetId}/messages?limit=${limit}&offset=${offset}&t=${Date.now()}`;
        if (before) {
            url += `&before=${before}`;
        }
        
        const response = await this.makeRequest(url);
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
}

const chatAPI = new ChatAPI();
window.ChatAPI = chatAPI;

export { ChatAPI };
export default chatAPI;

