const roomManager = require('../services/roomManager');
const AuthHandler = require('./authHandler');
const eventValidator = require('../services/eventValidator');

class MessageHandler {
    static forwardMessage(io, client, eventName, data) {
        console.log(`📤 [MESSAGE-FORWARD] Starting message forward for ${eventName} from client ${client.id}`);
        
        const validation = eventValidator.validateAndLog(eventName, data, 'in forwardMessage');
        if (!validation.valid) {
            console.error(`❌ [MESSAGE-FORWARD] Validation failed for ${eventName}:`, validation.errors);
            return;
        }
        
        console.log(`📨 [MESSAGE-FORWARD] Valid ${eventName} received:`, {
            messageId: data.id || data.message_id,
            userId: data.user_id,
            username: data.username,
            targetType: data.target_type,
            targetId: data.target_id,
            channelId: data.channel_id,
            roomId: data.room_id,
            content: data.content ? data.content.substring(0, 50) + (data.content.length > 50 ? '...' : '') : 'N/A'
        });
        
        console.log(`📦 [MESSAGE-FORWARD] Complete incoming message data:`, JSON.stringify(data, null, 2));
        
        let targetRoom;
        if (eventName === 'new-channel-message' && data.channel_id) {
            targetRoom = roomManager.getChannelRoom(data.channel_id);
            console.log(`🏠 [MESSAGE-FORWARD] Using channel room: ${targetRoom} for channel ${data.channel_id}`);
        } else if (eventName === 'user-message-dm' && data.room_id) {
            targetRoom = roomManager.getDMRoom(data.room_id);
            console.log(`🏠 [MESSAGE-FORWARD] Using DM room: ${targetRoom} for room ${data.room_id}`);
        } else if (data.target_type && data.target_id) {
            if (data.target_type === 'channel') {
                targetRoom = roomManager.getChannelRoom(data.target_id);
                console.log(`🏠 [MESSAGE-FORWARD] Using channel room: ${targetRoom} for update/delete in channel ${data.target_id}`);
            } else if (data.target_type === 'dm') {
                targetRoom = roomManager.getDMRoom(data.target_id);
                console.log(`🏠 [MESSAGE-FORWARD] Using DM room: ${targetRoom} for update/delete in DM ${data.target_id}`);
            }
        }
        
        if (targetRoom) {
            console.log(`📡 [MESSAGE-FORWARD] Broadcasting ${eventName} to room: ${targetRoom}`);
            
            const broadcastData = {
                id: data.id || data.message_id,
                content: data.content,
                user_id: data.user_id,
                username: data.username,
                avatar_url: data.avatar_url,
                channel_id: data.channel_id,
                room_id: data.room_id,
                target_type: data.target_type,
                target_id: data.target_id,
                message_type: data.message_type || 'text',
                attachments: data.attachments || [],
                reply_message_id: data.reply_message_id,
                reply_data: data.reply_data,
                timestamp: data.timestamp || Date.now(),
                source: data.source || 'server-originated'
            };
            
            console.log(`📤 [MESSAGE-FORWARD] Broadcast data prepared:`, {
                event: eventName,
                room: targetRoom,
                messageId: broadcastData.id,
                userId: broadcastData.user_id,
                timestamp: broadcastData.timestamp,
                source: broadcastData.source
            });
            
            console.log(`📦 [MESSAGE-FORWARD] Complete broadcast data:`, JSON.stringify(broadcastData, null, 2));
            
            // Make sure the client is in the room before broadcasting
            if (!client.rooms.has(targetRoom)) {
                console.log(`🔄 [MESSAGE-FORWARD] Client not in room, joining: ${targetRoom}`);
                client.join(targetRoom);
            }
            
            // Broadcast to the room including the sender
            io.to(targetRoom).emit(eventName, broadcastData);
            console.log(`✅ [MESSAGE-FORWARD] Successfully broadcasted ${eventName} to ${targetRoom} (including sender)`);
        } else {
            console.warn(`⚠️ [MESSAGE-FORWARD] No target room found for ${eventName}:`, {
                channelId: data.channel_id,
                roomId: data.room_id,
                targetType: data.target_type,
                targetId: data.target_id
            });
        }
    }

    static handleReaction(io, client, eventName, data) {
        console.log(`😊 [REACTION-HANDLER] Starting reaction handling for ${eventName} from client ${client.id}`);
        
        const validation = eventValidator.validateAndLog(eventName, data, 'in handleReaction');
        if (!validation.valid) {
            console.error(`❌ [REACTION-HANDLER] Validation failed for ${eventName}:`, validation.errors);
            return;
        }
        
        console.log(`😊 [REACTION-HANDLER] Valid ${eventName} received:`, {
            messageId: data.message_id,
            emoji: data.emoji,
            userId: data.user_id,
            username: data.username,
            targetType: data.target_type,
            targetId: data.target_id,
            action: data.action
        });
        
        let targetRoom;
        if (data.target_type === 'channel' && data.target_id) {
            targetRoom = roomManager.getChannelRoom(data.target_id);
            console.log(`🏠 [REACTION-HANDLER] Using channel room: ${targetRoom} for channel ${data.target_id}`);
        } else if (data.target_type === 'dm' && data.target_id) {
            targetRoom = roomManager.getDMRoom(data.target_id);
            console.log(`🏠 [REACTION-HANDLER] Using DM room: ${targetRoom} for DM ${data.target_id}`);
        }
        
        if (targetRoom) {
            console.log(`📡 [REACTION-HANDLER] Broadcasting ${eventName} to room: ${targetRoom}`);
            
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
            
            console.log(`📤 [REACTION-HANDLER] Reaction data prepared:`, {
                event: eventName,
                room: targetRoom,
                messageId: reactionData.message_id,
                emoji: reactionData.emoji,
                userId: reactionData.user_id,
                action: reactionData.action
            });
            
            client.to(targetRoom).emit(eventName, reactionData);
            console.log(`✅ [REACTION-HANDLER] Successfully broadcasted ${eventName} to ${targetRoom} (excluding sender)`);
        } else {
            console.warn(`⚠️ [REACTION-HANDLER] No target room found for ${eventName}:`, {
                targetType: data.target_type,
                targetId: data.target_id
            });
        }
    }

    static handlePin(io, client, eventName, data) {
        console.log(`📌 [PIN-HANDLER] Starting pin handling for ${eventName} from client ${client.id}`);
        
        const validation = eventValidator.validateAndLog(eventName, data, 'in handlePin');
        if (!validation.valid) {
            console.error(`❌ [PIN-HANDLER] Validation failed for ${eventName}:`, validation.errors);
            return;
        }
        
        console.log(`📌 [PIN-HANDLER] Valid ${eventName} received:`, {
            messageId: data.message_id,
            userId: data.user_id,
            username: data.username,
            targetType: data.target_type,
            targetId: data.target_id,
            action: data.action
        });
        
        let targetRoom;
        if (data.target_type === 'channel' && data.target_id) {
            targetRoom = roomManager.getChannelRoom(data.target_id);
            console.log(`🏠 [PIN-HANDLER] Using channel room: ${targetRoom} for channel ${data.target_id}`);
        } else if (data.target_type === 'dm' && data.target_id) {
            targetRoom = roomManager.getDMRoom(data.target_id);
            console.log(`🏠 [PIN-HANDLER] Using DM room: ${targetRoom} for DM ${data.target_id}`);
        }
        
        if (targetRoom) {
            console.log(`📡 [PIN-HANDLER] Broadcasting ${eventName} to room: ${targetRoom}`);
            
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
            
            console.log(`📤 [PIN-HANDLER] Pin data prepared:`, {
                event: eventName,
                room: targetRoom,
                messageId: pinData.message_id,
                userId: pinData.user_id,
                action: pinData.action
            });
            
            client.to(targetRoom).emit(eventName, pinData);
            console.log(`✅ [PIN-HANDLER] Successfully broadcasted ${eventName} to ${targetRoom} (excluding sender)`);
        } else {
            console.warn(`⚠️ [PIN-HANDLER] No target room found for ${eventName}:`, {
                targetType: data.target_type,
                targetId: data.target_id
            });
        }
    }

    static handleTyping(io, client, data, isTyping = true) {
        console.log(`⌨️ [TYPING-HANDLER] ${isTyping ? 'Start' : 'Stop'} typing from client ${client.id}`);
        
        const channelId = data.channel_id || data.channelId;
        const roomId = data.room_id || data.roomId;
        const user_id = client.data.user_id;
        const username = client.data.username;
        
        console.log(`⌨️ [TYPING-HANDLER] Typing data:`, {
            userId: user_id,
            username: username,
            channelId: channelId,
            roomId: roomId,
            isTyping: isTyping
        });
        
        const eventName = isTyping ? 'user-typing' : 'user-stop-typing';
        const dmEventName = isTyping ? 'user-typing-dm' : 'user-stop-typing-dm';
        
        if (channelId) {
            const room = roomManager.getChannelRoom(channelId);
            console.log(`📡 [TYPING-HANDLER] Broadcasting ${eventName} to channel room: ${room}`);
            client.to(room).emit(eventName, { user_id, username, channel_id: channelId });
            console.log(`✅ [TYPING-HANDLER] Typing event sent to channel ${channelId}`);
        } else if (roomId) {
            const room = roomManager.getDMRoom(roomId);
            console.log(`📡 [TYPING-HANDLER] Broadcasting ${dmEventName} to DM room: ${room}`);
            client.to(room).emit(dmEventName, { user_id, username, room_id: roomId });
            console.log(`✅ [TYPING-HANDLER] Typing event sent to DM room ${roomId}`);
        } else {
            console.warn(`⚠️ [TYPING-HANDLER] No channel_id or room_id provided in typing data`);
        }
    }
}

module.exports = MessageHandler; 