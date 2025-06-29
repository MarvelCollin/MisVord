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
            content: data.content // Log full content
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
                content: broadcastData.content, // Log full content
                timestamp: broadcastData.timestamp,
                source: broadcastData.source
            });
            
            console.log(`📦 [MESSAGE-FORWARD] Complete broadcast data:`, JSON.stringify(broadcastData, null, 2));
            
            // Make sure the client is in the room before broadcasting
            if (!client.rooms.has(targetRoom)) {
                console.log(`🔄 [MESSAGE-FORWARD] Client not in room, joining: ${targetRoom}`);
                client.join(targetRoom);
            }
            
            // Send to all clients in the room (this is the most reliable method)
            io.to(targetRoom).emit(eventName, broadcastData);
            console.log(`✅ [MESSAGE-FORWARD] Successfully broadcasted ${eventName} to room ${targetRoom}`);
            
            // Log room statistics for debugging
            const roomClients = io.sockets.adapter.rooms.get(targetRoom);
            if (roomClients) {
                console.log(`👥 [MESSAGE-FORWARD] Message delivered to ${roomClients.size} clients in room ${targetRoom}`);
            } else {
                console.warn(`⚠️ [MESSAGE-FORWARD] No clients found in room ${targetRoom}`);
                
                // As fallback, send to all authenticated clients
                console.log(`🔄 [MESSAGE-FORWARD] Fallback: Broadcasting to all authenticated clients`);
                io.emit(eventName, broadcastData);
            }
        } else {
            console.warn(`⚠️ [MESSAGE-FORWARD] No target room found for ${eventName}:`, {
                channelId: data.channel_id,
                roomId: data.room_id,
                targetType: data.target_type,
                targetId: data.target_id
            });
            
            // If no room found, broadcast to all clients as fallback
            console.log(`🔄 [MESSAGE-FORWARD] Fallback: Broadcasting to all clients`);
            const fallbackData = {
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
            io.emit(eventName, fallbackData);
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

    static async saveAndSendMessage(io, client, data) {
        console.log(`💾 [SAVE-AND-SEND] Starting save and send for message from client ${client.id}`);
        
        if (!client.data?.authenticated || !client.data?.user_id) {
            console.error(`❌ [SAVE-AND-SEND] Unauthenticated client attempted to send message`);
            client.emit('message_error', { error: 'Authentication required' });
            return;
        }
        
        // Validate required fields
        if (!data.content || !data.target_type || !data.target_id) {
            console.error(`❌ [SAVE-AND-SEND] Missing required fields:`, data);
            client.emit('message_error', { error: 'Missing required fields: content, target_type, target_id' });
            return;
        }
        
        console.log(`📝 [SAVE-AND-SEND] Processing new message:`, {
            userId: client.data.user_id,
            username: client.data.username,
            targetType: data.target_type,
            targetId: data.target_id,
            content: data.content.substring(0, 50) + (data.content.length > 50 ? '...' : ''),
            messageType: data.message_type || 'text'
        });
        
        try {
            // Generate a temporary ID for immediate display
            const temp_message_id = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            const currentTimestamp = Date.now();
            
            // Prepare data for immediate broadcast with underscores
            const broadcastData = {
                id: temp_message_id,
                content: data.content,
                user_id: client.data.user_id,
                username: client.data.username,
                avatar_url: client.data.avatar_url || '/public/assets/common/default-profile-picture.png',
                sent_at: new Date().toISOString(),
                message_type: data.message_type || 'text',
                attachments: data.attachments || [],
                reply_message_id: data.reply_message_id,
                reply_data: data.reply_data,
                timestamp: currentTimestamp,
                temp_message_id: temp_message_id,
                source: 'websocket-originated',
                is_temporary: true
            };
            
            // Add target-specific fields using underscores
            if (data.target_type === 'channel') {
                broadcastData.channel_id = data.target_id;
                broadcastData.target_type = 'channel';
                broadcastData.target_id = data.target_id;
            } else if (data.target_type === 'dm') {
                broadcastData.room_id = data.target_id;
                broadcastData.target_type = 'dm';
                broadcastData.target_id = data.target_id;
            }
            
            // Determine event name and room
            const eventName = data.target_type === 'channel' ? 'new-channel-message' : 'user-message-dm';
            const targetRoom = data.target_type === 'channel' 
                ? roomManager.getChannelRoom(data.target_id)
                : roomManager.getDMRoom(data.target_id);
            
            // Broadcast temporary message immediately
            if (targetRoom) {
                io.to(targetRoom).emit(eventName, broadcastData);
                console.log(`✅ [SAVE-AND-SEND] Temporary message broadcasted to room ${targetRoom}`);
            } else {
                io.emit(eventName, broadcastData);
                console.log(`⚠️ [SAVE-AND-SEND] No room found, broadcasted to all clients`);
            }
            
            // Now save to database via direct HTTP call to PHP
            console.log(`💾 [SAVE-AND-SEND] Saving message to database via HTTP call...`);
            
            try {
                const response = await fetch('http://localhost:1001/api/chat/save-message', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Socket-User-ID': client.data.user_id.toString(),
                        'X-Socket-Username': client.data.username,
                        'X-Socket-Session-ID': client.data.session_id || '',
                        'X-Socket-Avatar-URL': client.data.avatar_url || '/public/assets/common/default-profile-picture.png',
                        'User-Agent': 'SocketServer/1.0'
                    },
                    body: JSON.stringify({
                        content: data.content,
                        target_type: data.target_type,
                        target_id: data.target_id,
                        message_type: data.message_type || 'text',
                        attachments: data.attachments || [],
                        mentions: data.mentions || [],
                        reply_message_id: data.reply_message_id
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const saveResult = await response.json();
                console.log(`✅ [SAVE-AND-SEND] Message saved to database:`, saveResult);
                
                if (saveResult.success) {
                    // Broadcast the permanent ID update using underscores
                    const updateData = {
                        temp_message_id: temp_message_id,
                        real_message_id: saveResult.message_id,
                        message_data: saveResult,
                        timestamp: Date.now()
                    };
                    
                    if (targetRoom) {
                        io.to(targetRoom).emit('message_id_updated', updateData);
                    } else {
                        io.emit('message_id_updated', updateData);
                    }
                    
                    console.log(`✅ [SAVE-AND-SEND] Message ID update broadcasted: ${temp_message_id} → ${saveResult.message_id}`);
                    
                    // Send success response to sender
                    client.emit('message_sent', {
                        success: true,
                        message_id: saveResult.message_id,
                        temp_message_id: temp_message_id,
                        timestamp: currentTimestamp
                    });
                } else {
                    throw new Error(saveResult.message || 'Database save failed');
                }
                
            } catch (error) {
                console.error(`❌ [SAVE-AND-SEND] Database save failed:`, error);
                
                // Mark temporary message as failed
                const errorData = {
                    temp_message_id: temp_message_id,
                    error: error.message || 'Failed to save to database'
                };
                
                if (targetRoom) {
                    io.to(targetRoom).emit('message_save_failed', errorData);
                } else {
                    io.emit('message_save_failed', errorData);
                }
                
                client.emit('message_error', {
                    error: error.message || 'Failed to save message',
                    temp_message_id: temp_message_id,
                    timestamp: Date.now()
                });
            }
            
        } catch (error) {
            console.error(`❌ [SAVE-AND-SEND] Error in save and send:`, error);
            
            client.emit('message_error', {
                error: error.message || 'Failed to send message',
                timestamp: Date.now()
            });
        }
    }

    static handleMessageDatabaseSaved(io, client, data) {
        console.log(`💾 [DATABASE-SAVED] Message database save confirmation from client ${client.id}`);
        
        if (!data.temp_message_id || !data.real_message_id) {
            console.error(`❌ [DATABASE-SAVED] Missing required fields:`, data);
            return;
        }
        
        console.log(`🔄 [DATABASE-SAVED] Updating message ID from ${data.temp_message_id} to ${data.real_message_id}`);
        
        // Determine target room based on message data
        let targetRoom;
        const messageData = data.message_data;
        
        if (messageData.target_type === 'channel') {
            targetRoom = roomManager.getChannelRoom(messageData.target_id);
        } else if (messageData.target_type === 'dm') {
            targetRoom = roomManager.getDMRoom(messageData.target_id);
        }
        
        if (targetRoom) {
            // Broadcast the ID update to all clients in the room
            const updateData = {
                temp_message_id: data.temp_message_id,
                real_message_id: data.real_message_id,
                message_data: messageData,
                timestamp: Date.now()
            };
            
            console.log(`