const messageService = {
    recentMessages: new Map(),
    maxRecentMessages: 100,
    
    storeMessage: function(messageId, messageData) {
        if (this.recentMessages.size >= this.maxRecentMessages) {
            const oldestKey = this.recentMessages.keys().next().value;
            this.recentMessages.delete(oldestKey);
        }
        
        this.recentMessages.set(messageId, {
            ...messageData,
            timestamp: Date.now()
        });
        
        return true;
    },
    
    getMessage: function(messageId) {
        return this.recentMessages.get(messageId) || null;
    },
    
    messageExists: function(messageId) {
        return this.recentMessages.has(messageId);
    },
    
    prepareMessage: function(userId, username, content, channelId = null, roomId = null) {
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const messageData = {
            id: messageId,
            content,
            userId,
            username,
            timestamp: Date.now(),
            messageType: 'text'
        };
        
        if (channelId) {
            messageData.channelId = channelId;
            messageData.target_type = 'channel';
            messageData.target_id = channelId;
        } else if (roomId) {
            messageData.roomId = roomId;
            messageData.target_type = 'dm';
            messageData.target_id = roomId;
        }
        
        this.storeMessage(messageId, messageData);
        
        return messageData;
    },
    
    getMessageRoom: function(message) {
        if (message.channelId) {
            return `channel-${message.channelId}`;
        } else if (message.roomId) {
            return `dm-room-${message.roomId}`;
        } else if (message.target_type === 'channel' && message.target_id) {
            return `channel-${message.target_id}`;
        } else if ((message.target_type === 'dm' || message.target_type === 'direct') && message.target_id) {
            return `dm-room-${message.target_id}`;
        }
        
        return null;
    }
};

module.exports = messageService;
