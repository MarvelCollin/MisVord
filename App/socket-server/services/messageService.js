class MessageService {
    constructor() {
        this.recentMessages = new Map();
        this.maxRecentMessages = 100;
        this.messageTTL = 5000; // 5 seconds
    }
    
    isDuplicate(messageSignature) {
        return this.recentMessages.has(messageSignature);
    }
    
    markAsProcessed(messageSignature) {
        this.recentMessages.set(messageSignature, Date.now());
        this.cleanOldMessages();
    }
    
    generateSignature(eventName, userId, messageId, content) {
        return `${eventName}_${userId}_${messageId}_${content?.substring(0, 20) || ''}`;
    }
    
    cleanOldMessages() {
        if (this.recentMessages.size >= this.maxRecentMessages) {
            const oldestKey = this.recentMessages.keys().next().value;
            this.recentMessages.delete(oldestKey);
        }
        
        const now = Date.now();
        for (const [key, timestamp] of this.recentMessages.entries()) {
            if (now - timestamp > this.messageTTL) {
                this.recentMessages.delete(key);
            }
        }
    }
}

module.exports = new MessageService();
