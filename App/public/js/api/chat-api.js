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
    }    async makeRequest(url, options = {}) {
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
                console.error('API Request failed:', {
                    url: url,
                    status: response.status,
                    statusText: response.statusText,
                    data: data,
                    requestBody: options.body
                });
                throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }    async getMessages(chatType, targetId, limit = 20, offset = 0) {
        const apiChatType = chatType === 'direct' ? 'dm' : chatType;
        const url = `${this.baseURL}/${apiChatType}/${targetId}/messages?limit=${limit}&offset=${offset}`;
        
        console.log(`🔍 Fetching messages for ${apiChatType} ${targetId} from ${url}`);
        
        try {
            const response = await this.makeRequest(url);
            console.log('🔍 API response for getMessages:', response);
            
            if (response) {
                console.log('🔍 Response structure:', {
                    hasData: !!response.data,
                    dataType: response.data ? typeof response.data : 'N/A',
                    hasMessages: response.data && Array.isArray(response.data.messages),
                    messagesCount: response.data && response.data.messages ? response.data.messages.length : 0
                });
            }
            
            return response;
        } catch (error) {
            console.error(`❌ Failed to fetch messages for ${apiChatType} ${targetId}:`, error);
            throw error;
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
            
            if (options.replyToMessageId) {
                requestData.reply_message_id = options.replyToMessageId;
            }
            
            const response = await this.makeRequest(url, {
                method: 'POST',
                body: JSON.stringify(requestData)
            });
            
            if (response && response.success !== false) {
                this.sendDirectSocketMessage(targetId, content, chatType, options);
            }
            
            return response;
        } catch (error) {
            console.error('Error sending message to database:', error);
            throw error;
        }
    }

    sendDirectSocketMessage(targetId, content, chatType = 'channel', options = {}) {
        if (!window.globalSocketManager || !window.globalSocketManager.isReady() || !window.globalSocketManager.io) {
            console.warn('⚠️ Socket not ready, cannot send direct socket message');
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
                    messageType: 'text',
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
                    messageType: 'text',
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
                console.log(`Emitting ${eventName} with ID ${messageId}`);
            }
            
            return true;
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
            console.warn('⚠️ Socket not ready, cannot send direct socket update');
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
                timestamp: Date.now(),
                _debug: {
                    timestamp: new Date().toISOString(),
                    clientId: window.globalSocketManager.io.id,
                    emittedBy: username || 'Unknown',
                    type: 'direct-socket-path'
                }
            });
            console.log(`🔌 Direct socket message update for ${messageId}: "${content}"`);
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
            }
            
            return response;
        } catch (error) {
            console.error('Error deleting message from database:', error);
            throw error;
        }
    }
    
    sendDirectSocketDelete(messageId, targetType, targetId) {
        if (!window.globalSocketManager || !window.globalSocketManager.isReady() || !window.globalSocketManager.io) {
            console.warn('⚠️ Socket not ready, cannot send direct socket delete');
            return false;
        }
        
        const userId = window.globalSocketManager.userId;
        const username = window.globalSocketManager.username;
        
        try {
            window.globalSocketManager.io.emit('message-deleted', {
                message_id: messageId,
                target_type: targetType,
                target_id: targetId,
                user_id: userId,
                username: username,
                timestamp: Date.now(),
                _debug: {
                    timestamp: new Date().toISOString(),
                    clientId: window.globalSocketManager.io.id,
                    emittedBy: username || 'Unknown',
                    type: 'direct-socket-path'
                }
            });
            console.log(`🔌 Direct socket message deletion for ${messageId}`);
            return true;
        } catch (e) {
            console.error('Failed to send direct socket delete:', e);
            return false;
        }
    }

    async addReaction(messageId, emoji) {
        const url = `/api/messages/${messageId}/reactions`;
        
        try {
            const response = await this.makeRequest(url, {
                method: 'POST',
                body: JSON.stringify({
                    emoji: emoji
                })
            });
            
            const userId = window.globalSocketManager?.userId;
            this.sendDirectSocketReaction(messageId, emoji, 'add', userId);
            
            return response;
        } catch (error) {
            console.error('Error adding reaction in database:', error);
            throw error;
        }
    }
    
    async removeReaction(messageId, emoji) {
        const url = `/api/messages/${messageId}/reactions`;
        
        try {
            const response = await this.makeRequest(url, {
                method: 'DELETE',
                body: JSON.stringify({
                    emoji: emoji
                })
            });
            
            const userId = window.globalSocketManager?.userId;
            this.sendDirectSocketReaction(messageId, emoji, 'remove', userId);
            
            return response;
        } catch (error) {
            console.error('Error removing reaction from database:', error);
            throw error;
        }
    }
    
    sendDirectSocketReaction(messageId, emoji, action, userId) {
        if (!window.globalSocketManager || !window.globalSocketManager.isReady() || !window.globalSocketManager.io) {
            console.warn('⚠️ Socket not ready, cannot send direct socket reaction');
            return false;
        }
        
        const username = window.globalSocketManager.username;
        const eventName = action === 'add' ? 'reaction-added' : 'reaction-removed';
        
        try {
            window.globalSocketManager.io.emit(eventName, {
                message_id: messageId,
                emoji: emoji,
                user_id: userId,
                username: username,
                timestamp: Date.now(),
                _debug: {
                    timestamp: new Date().toISOString(),
                    clientId: window.globalSocketManager.io.id,
                    emittedBy: username || 'Unknown',
                    type: 'direct-socket-path'
                }
            });
            console.log(`🔌 Direct socket ${action} reaction ${emoji} for message ${messageId}`);
            return true;
        } catch (e) {
            console.error(`Failed to send direct socket ${action} reaction:`, e);
            return false;
        }
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
            socketConnected: window.globalSocketManager?.socket?.connected || false,
            socketId: window.globalSocketManager?.socket?.id || 'none',
            userId: window.globalSocketManager?.userId || 'none',
            username: window.globalSocketManager?.username || 'none',
            targetId: targetId,
            chatType: chatType
        };
        
        console.log('Socket connection debug info:', status);
        
        if (status.socketReady) {
            const testContent = `Socket test message at ${new Date().toISOString()}`;
            this.sendDirectSocketMessage(targetId, testContent, chatType);
            return { ...status, testSent: true, testContent };
        }
        
        return { ...status, testSent: false };
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
}

const chatAPI = new ChatAPI();
window.ChatAPI = chatAPI;

