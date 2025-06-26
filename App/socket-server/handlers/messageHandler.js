const roomManager = require('../services/roomManager');
const AuthHandler = require('./authHandler');

class MessageHandler {
    static forwardMessage(io, client, eventName, data) {
        if (!AuthHandler.requireAuth(client)) {
            client.emit('error', { message: 'Authentication required' });
            return;
        }
        
        const targetRoom = roomManager.getTargetRoom(data);
        const cleanData = { ...data };
        
        delete cleanData._debug;
        delete cleanData._serverDebug;
        
        if (targetRoom) {
            client.to(targetRoom).emit(eventName, cleanData);
            console.log(`Forwarded ${eventName} to room: ${targetRoom}`);
        } else {
            client.broadcast.emit(eventName, cleanData);
            console.log(`Broadcasted ${eventName} to all clients`);
        }
    }

    static handleReaction(io, client, eventName, data) {
        if (!AuthHandler.requireAuth(client)) {
            client.emit('error', { message: 'Authentication required' });
            return;
        }
        
        console.log(`📡 [REACTION] Handling ${eventName}:`, {
            messageId: data.message_id,
            emoji: data.emoji,
            userId: data.user_id,
            targetType: data.target_type,
            targetId: data.target_id
        });
        
        const targetRoom = roomManager.getTargetRoom(data);
        if (targetRoom) {
            console.log(`📡 [REACTION] Broadcasting ${eventName} to room: ${targetRoom}`);
            roomManager.broadcastToRoom(io, targetRoom, eventName, data);
        } else {
            console.warn(`⚠️ [REACTION] No target room found for ${eventName}:`, data);
        }
    }

    static handleTyping(io, client, data, isTyping = true) {
        if (!AuthHandler.requireAuth(client)) return;
        
        const { channelId, roomId } = data;
        const userId = client.data.userId;
        const username = client.data.username;
        
        const eventName = isTyping ? 'user-typing' : 'user-stop-typing';
        const dmEventName = isTyping ? 'user-typing-dm' : 'user-stop-typing-dm';
        
        if (channelId) {
            const room = roomManager.getChannelRoom(channelId);
            client.to(room).emit(eventName, { userId, username, channelId });
        } else if (roomId) {
            const room = roomManager.getDMRoom(roomId);
            client.to(room).emit(dmEventName, { userId, username, roomId });
        }
    }
}

module.exports = MessageHandler; 