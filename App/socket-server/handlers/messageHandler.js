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
        
        cleanData.userId = cleanData.userId || cleanData.user_id || client.data.userId;
        cleanData.username = cleanData.username || client.data.username;
        cleanData.timestamp = cleanData.timestamp || Date.now();
        
        if (targetRoom) {
            const isInRoom = client.rooms.has(targetRoom);
            if (isInRoom) {
                client.to(targetRoom).emit(eventName, cleanData);
                console.log(`✅ Forwarded ${eventName} to room: ${targetRoom} (user in room)`);
            } else {
                console.warn(`⚠️ User ${client.data.userId} not in room ${targetRoom}, skipping forward`);
            }
        } else {
            console.warn(`⚠️ No target room found for ${eventName}, data:`, data);
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

    static handlePin(io, client, eventName, data) {
        if (!AuthHandler.requireAuth(client)) {
            client.emit('error', { message: 'Authentication required' });
            return;
        }
        
        // Only accept server-originated pin events
        if (data.source !== 'server-originated') {
            console.warn('Rejecting client-originated pin event, should come from server:', data);
            return;
        }
        
        console.log(`📌 [PIN] Handling ${eventName}:`, {
            messageId: data.message_id,
            userId: data.user_id,
            targetType: data.target_type,
            targetId: data.target_id,
            action: data.action
        });
        
        const targetRoom = roomManager.getTargetRoom(data);
        if (targetRoom) {
            console.log(`📌 [PIN] Broadcasting ${eventName} to room: ${targetRoom}`);
            roomManager.broadcastToRoom(io, targetRoom, eventName, data);
        } else {
            console.warn(`⚠️ [PIN] No target room found for ${eventName}:`, data);
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