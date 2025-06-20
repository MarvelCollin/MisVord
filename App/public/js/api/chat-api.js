class ChatAPI {
    constructor() {
        this.baseURL = '/api/chat';
        this.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    async parseResponse(response) {
        const text = await response.text();
        
        if (text.trim().startsWith('<') || text.includes('<br />') || text.includes('</html>') || text.includes('<!DOCTYPE')) {
            console.error('Server returned HTML instead of JSON:', text.substring(0, 200));
            throw new Error('Server configuration error. Please contact support.');
        }
        
        try {
            return JSON.parse(text);
        } catch (e) {
            console.error('Failed to parse JSON response:', text);
            throw new Error('Invalid server response');
        }
    }

    async makeRequest(url, options = {}) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...this.headers,
                    ...options.headers
                }
            });

            const data = await this.parseResponse(response);
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    async getMessages(chatType, targetId, limit = 50, offset = 0) {
        const url = `${this.baseURL}/${chatType}/${targetId}/messages?limit=${limit}&offset=${offset}`;
        return await this.makeRequest(url);
    }

    async sendMessage(chatType, targetId, content) {
        const url = `${this.baseURL}/send`;
        return await this.makeRequest(url, {
            method: 'POST',
            body: JSON.stringify({
                target_type: chatType,
                target_id: targetId,
                content: content
            })
        });
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

    formatMessage(message) {
        return {
            id: message.id,
            content: message.content,
            user_id: message.user_id,
            username: message.username,
            avatar_url: message.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.username)}&background=random`,
            sent_at: message.sent_at,
            edited_at: message.edited_at,
            type: message.type || 'text'
        };
    }
}

// Expose globally for backward compatibility
window.ChatAPI = new ChatAPI();

// Export for module usage (commented out for regular script loading)
// export { ChatAPI };
// export default ChatAPI;
