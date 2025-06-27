const roomManager = require('../services/roomManager');
const AuthHandler = require('./authHandler');
const eventValidator = require('../services/eventValidator');

class MessageHandler {
    static forwardMessage(io, client, eventName, data) {
        
        const validation = eventValidator.validateAndLog(eventName, data, 'in forwardMessage');
        if (!validation.valid) {
            return;
        }
        
        console.log(`📡 [MESSAGE] Handling ${eventName}:`, {
            messageId: data.id || data.message_id,
            userId: data.user_id,
            targetType: data.target_type,
            targetId: data.target_id,
            channelId: data.channel_id,
            roomId: data.room_id
        });
        
        // Determine the target room based on message type
        let targetRoom;
        if (eventName === 'new-channel-message' && data.channel_id) {
            targetRoom = roomManager.getChannelRoom(data.channel_id);
        } else if (eventName === 'user-message-dm' && data.room_id) {
            targetRoom = roomManager.getDMRoom(data.room_id);
        } else if (data.target_type && data.target_id) {
            // For update/delete events that have target_type/target_id
            if (data.target_type === 'channel') {
                targetRoom = roomManager.getChannelRoom(data.target_id);
            } else if (data.target_type === 'dm') {
                targetRoom = roomManager.getDMRoom(data.target_id);
            }
        }
        
        if (targetRoom) {
            console.log(`📡 [MESSAGE] Broadcasting ${eventName} to room: ${targetRoom}`);
            
            // Ensure consistent data structure
            const broadcastData = {
                ...data,
                timestamp: data.timestamp || Date.now(),
                source: data.source || 'server-originated'
            };
            
            roomManager.broadcastToRoom(io, targetRoom, eventName, broadcastData);
        } else {
            console.warn(`⚠️ [MESSAGE] No target room found for ${eventName}:`, data);
        }
    }

    static handleReaction(io, client, eventName, data) {
        
        const validation = eventValidator.validateAndLog(eventName, data, 'in handleReaction');
        if (!validation.valid) {
            return;
        }
        
        console.log(`📡 [REACTION] Handling ${eventName}:`, {
            messageId: data.message_id,
            emoji: data.emoji,
            userId: data.user_id,
            targetType: data.target_type,
            targetId: data.target_id
        });
        
        // Determine target room
        let targetRoom;
        if (data.target_type === 'channel' && data.target_id) {
            targetRoom = roomManager.getChannelRoom(data.target_id);
        } else if (data.target_type === 'dm' && data.target_id) {
            targetRoom = roomManager.getDMRoom(data.target_id);
        }
        
        if (targetRoom) {
            console.log(`📡 [REACTION] Broadcasting ${eventName} to room: ${targetRoom}`);
            
            // Ensure consistent data structure for reactions
            const reactionData = {
                message_id: data.message_id,
                emoji: data.emoji,
                user_id: data.user_id,
                username: data.username,
                target_type: data.target_type,
                target_id: data.target_id,
                action: data.action,
                timestamp: Date.now(),
                source: data.source || 'server-originated'
            };
            
            roomManager.broadcastToRoom(io, targetRoom, eventName, reactionData);
        } else {
            console.warn(`⚠️ [REACTION] No target room found for ${eventName}:`, data);
        }
    }

    static handlePin(io, client, eventName, data) {
        
        const validation = eventValidator.validateAndLog(eventName, data, 'in handlePin');
        if (!validation.valid) {
            return;
        }
        
        console.log(`📡 [PIN] Handling ${eventName}:`, {
            messageId: data.message_id,
            userId: data.user_id,
            targetType: data.target_type,
            targetId: data.target_id
        });
        
        // Determine target room
        let targetRoom;
        if (data.target_type === 'channel' && data.target_id) {
            targetRoom = roomManager.getChannelRoom(data.target_id);
        } else if (data.target_type === 'dm' && data.target_id) {
            targetRoom = roomManager.getDMRoom(data.target_id);
        }
        
        if (targetRoom) {
            console.log(`📡 [PIN] Broadcasting ${eventName} to room: ${targetRoom}`);
            
            // Ensure consistent data structure for pin events
            const pinData = {
                message_id: data.message_id,
                user_id: data.user_id,
                username: data.username,
                target_type: data.target_type,
                target_id: data.target_id,
                action: data.action,
                message: data.message,
                timestamp: Date.now(),
                source: data.source || 'server-originated'
            };
            
            roomManager.broadcastToRoom(io, targetRoom, eventName, pinData);
        } else {
            console.warn(`⚠️ [PIN] No target room found for ${eventName}:`, data);
        }
    }

    static handleTyping(io, client, data, isTyping = true) {
        
        const channelId = data.channel_id || data.channelId;
        const roomId = data.room_id || data.roomId;
        const user_id = client.data.user_id;
        const username = client.data.username;
        
        const eventName = isTyping ? 'user-typing' : 'user-stop-typing';
        const dmEventName = isTyping ? 'user-typing-dm' : 'user-stop-typing-dm';
        
        if (channelId) {
            const room = roomManager.getChannelRoom(channelId);
            client.to(room).emit(eventName, { user_id, username, channel_id: channelId });
        } else if (roomId) {
            const room = roomManager.getDMRoom(roomId);
            client.to(room).emit(dmEventName, { user_id, username, room_id: roomId });
        }
    }
}

module.exports = MessageHandler; 