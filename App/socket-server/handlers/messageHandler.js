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
            content: data.content
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
                content: broadcastData.content,
                timestamp: broadcastData.timestamp,
                source: broadcastData.source
            });
            
            console.log(`📦 [MESSAGE-FORWARD] Complete broadcast data:`, JSON.stringify(broadcastData, null, 2));
                    
            if (!client.rooms.has(targetRoom)) {
                console.log(`🔄 [MESSAGE-FORWARD] Client not in room, joining: ${targetRoom}`);
                            client.join(targetRoom);
        }
        
            io.to(targetRoom).emit(eventName, broadcastData);
                    console.log(`✅ [MESSAGE-FORWARD] Successfully broadcasted ${eventName} to room ${targetRoom}`);
        
            const roomClients = io.sockets.adapter.rooms.get(targetRoom);
            if (roomClients) {
                console.log(`👥 [MESSAGE-FORWARD] Message delivered to ${roomClients.size} clients in room ${targetRoom}`);
            } else {
                console.warn(`⚠️ [MESSAGE-FORWARD] No clients found in room ${targetRoom}`);
                
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
                avatar_url: client.data.avatar_url || '/public/assets/common/default-profile-picture.png',
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
            
            this.saveReactionToDatabase(io, client, targetRoom, data, eventName);
        } else {
            console.warn(`⚠️ [REACTION-HANDLER] No target room found for ${eventName}:`, {
                targetType: data.target_type,
                targetId: data.target_id
            });
        }
    }

    static async saveReactionToDatabase(io, client, targetRoom, data, eventName) {
        try {
            console.log(`💾 [REACTION-SAVE] Saving reaction to database:`, {
                messageId: data.message_id,
                emoji: data.emoji,
                userId: data.user_id,
                action: data.action,
                tempId: data.temp_reaction_id
            });
            
            const apiEndpoint = eventName === 'reaction-added' 
                ? `http://app:1001/api/messages/${data.message_id}/reactions`
                : `http://app:1001/api/messages/${data.message_id}/reactions`;
            
            const method = eventName === 'reaction-added' ? 'POST' : 'DELETE';
            
            const response = await fetch(apiEndpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Socket-User-ID': data.user_id.toString(),
                    'X-Socket-Username': data.username,
                    'User-Agent': 'SocketServer/1.0'
                },
                body: JSON.stringify({
                    emoji: data.emoji
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                console.log(`✅ [REACTION-SAVE] Reaction ${data.action} saved successfully, broadcasting confirmation`);
                
                const confirmationData = {
                    message_id: data.message_id,
                    emoji: data.emoji,
                    user_id: data.user_id,
                    username: data.username,
                    avatar_url: client.data.avatar_url || '/public/assets/common/default-profile-picture.png',
                    target_type: data.target_type,
                    target_id: data.target_id,
                    action: result.data?.action || data.action,
                    temp_reaction_id: data.temp_reaction_id,
                    is_permanent: true,
                    source: 'database-confirmed',
                    timestamp: Date.now()
                };
                
                if (targetRoom) {
                    io.to(targetRoom).emit('reaction-confirmed', confirmationData);
                    console.log(`📡 [REACTION-SAVE] Broadcasted reaction-confirmed to room: ${targetRoom}`);
                } else {
                    io.emit('reaction-confirmed', confirmationData);
                    console.log(`📡 [REACTION-SAVE] Broadcasted reaction-confirmed to all clients`);
                }
            } else {
                throw new Error(result.message || 'Database operation failed');
            }
            
        } catch (error) {
            console.error(`❌ [REACTION-SAVE] Failed to save reaction to database:`, {
                error: error.message,
                messageId: data.message_id,
                emoji: data.emoji,
                action: data.action
            });
            
            const failureData = {
                message_id: data.message_id,
                emoji: data.emoji,
                user_id: data.user_id,
                username: data.username,
                target_type: data.target_type,
                target_id: data.target_id,
                action: data.action,
                temp_reaction_id: data.temp_reaction_id,
                error: error.message || 'Database save failed',
                source: 'database-failed',
                timestamp: Date.now()
            };
            
            if (targetRoom) {
                io.to(targetRoom).emit('reaction-failed', failureData);
                console.log(`📡 [REACTION-SAVE] Broadcasted reaction-failed to room: ${targetRoom}`);
            } else {
                io.emit('reaction-failed', failureData);
                console.log(`📡 [REACTION-SAVE] Broadcasted reaction-failed to all clients`);
            }
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
            const temp_message_id = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                    const currentTimestamp = Date.now();
        
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
                reply_data: null,
                timestamp: currentTimestamp,
                temp_message_id: temp_message_id,
                source: 'websocket-originated',
                is_temporary: true
            };
            
            // IMPORTANT: Fetch reply data BEFORE broadcasting temporary message
            if (data.reply_message_id) {
                console.log(`📝 [SAVE-AND-SEND] Fetching reply data for temporary broadcast: ${data.reply_message_id}`);
                try {
                    const replyResponse = await fetch(`http://app:1001/api/messages/${data.reply_message_id}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Socket-User-ID': client.data.user_id.toString(),
                            'X-Socket-Username': client.data.username,
                            'User-Agent': 'SocketServer/1.0'
                        }
                    });
                    
                    if (replyResponse.ok) {
                        const replyResult = await replyResponse.json();
                        if (replyResult.success && replyResult.data) {
                            broadcastData.reply_data = {
                                message_id: data.reply_message_id,
                                content: replyResult.data.content,
                                user_id: replyResult.data.user_id,
                                username: replyResult.data.username,
                                avatar_url: replyResult.data.avatar_url || '/public/assets/common/default-profile-picture.png'
                            };
                            console.log(`✅ [SAVE-AND-SEND] Reply data fetched for temporary broadcast: ${data.reply_message_id}`);
                        }
                    } else {
                        console.warn(`⚠️ [SAVE-AND-SEND] Failed to fetch reply data for temp broadcast: ${replyResponse.status}`);
                    }
                } catch (replyError) {
                    console.error(`❌ [SAVE-AND-SEND] Error fetching reply data for temp broadcast:`, replyError);
                }
            }
                    
            if (data.target_type === 'channel') {
                broadcastData.channel_id = data.target_id;
                broadcastData.target_type = 'channel';
                broadcastData.target_id = data.target_id;
            } else if (data.target_type === 'dm') {
                broadcastData.room_id = data.target_id;
                broadcastData.target_type = 'dm';
                broadcastData.target_id = data.target_id;
                    }
        
            const eventName = data.target_type === 'channel' ? 'new-channel-message' : 'user-message-dm';
            const targetRoom = data.target_type === 'channel' 
                ? roomManager.getChannelRoom(data.target_id)
                : roomManager.getDMRoom(data.target_id);
            
            // Broadcast temporary message immediately (now with reply data if applicable)
            if (targetRoom) {
                // First emit to bot for processing (before room broadcast)
                io.emit('bot-message-intercept', broadcastData);
                
                io.to(targetRoom).emit(eventName, broadcastData);
                console.log(`✅ [SAVE-AND-SEND] Temporary message broadcasted to room ${targetRoom}`, {
                    messageId: broadcastData.id,
                    hasReplyData: !!broadcastData.reply_data,
                    replyMessageId: broadcastData.reply_message_id
                });
            } else {
                // First emit to bot for processing
                io.emit('bot-message-intercept', broadcastData);
                
                io.emit(eventName, broadcastData);
                console.log(`⚠️ [SAVE-AND-SEND] No room found, broadcasted to all clients`, {
                    messageId: broadcastData.id,
                    hasReplyData: !!broadcastData.reply_data,
                    replyMessageId: broadcastData.reply_message_id
                });
            }
            
            // Now save to database via direct HTTP call to PHP
            console.log(`💾 [SAVE-AND-SEND] Saving message to database via HTTP call...`);
            
            try {
                // First test the debug endpoint
                console.log(`🧪 [SAVE-AND-SEND] Testing debug endpoint first...`);
                const debugResponse = await fetch('http://app:1001/api/debug/test-socket-save', {
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
                        test: 'debug_test',
                        target_type: data.target_type,
                        target_id: data.target_id
                    })
                });
                
                if (debugResponse.ok) {
                    const debugResult = await debugResponse.json();
                    console.log(`✅ [SAVE-AND-SEND] Debug endpoint working:`, debugResult);
                } else {
                    console.error(`❌ [SAVE-AND-SEND] Debug endpoint failed: ${debugResponse.status} ${debugResponse.statusText}`);
                }
                
                // Now try the actual save endpoint
                const response = await fetch('http://app:1001/api/chat/save-message', {
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
                console.log(`✅ [SAVE-AND-SEND] Message saved to database:`, JSON.stringify(saveResult, null, 2));
                
                if (saveResult.success) {
                    // Extract message_id from the correct nested location in response
                    let realMessageId = null;
                    
                    if (saveResult.data && saveResult.data.data && saveResult.data.data.message && saveResult.data.data.message.id) {
                        realMessageId = saveResult.data.data.message.id;
                    } else if (saveResult.data && saveResult.data.message_id) {
                        realMessageId = saveResult.data.message_id;
                    } else if (saveResult.message_id) {
                        realMessageId = saveResult.message_id;
                    }
                    
                    console.log(`🔍 [SAVE-AND-SEND] Debug message ID extraction:`, {
                        deepNested: saveResult.data?.data?.message?.id || 'NO_DEEP_NESTED',
                        dataLevel: saveResult.data?.message_id || 'NO_DATA_LEVEL',
                        topLevel: saveResult.message_id || 'NO_TOP_LEVEL',
                        finalMessageId: realMessageId
                    });
                    
                    if (!realMessageId) {
                        console.error(`❌ [SAVE-AND-SEND] No message_id found. Full response:`, JSON.stringify(saveResult, null, 2));
                        throw new Error('No message_id found in server response');
                    }
                    
                    // Extract complete message data with reply_data from database response
                    let completeMessageData = null;
                    if (saveResult.data && saveResult.data.data && saveResult.data.data.message) {
                        completeMessageData = saveResult.data.data.message;
                    } else if (saveResult.data && saveResult.data.message) {
                        completeMessageData = saveResult.data.message;
                    } else if (saveResult.message) {
                        completeMessageData = saveResult.message;
                    }
                    
                    console.log(`🔍 [SAVE-AND-SEND] Extracted complete message data:`, {
                        hasCompleteData: !!completeMessageData,
                        hasReplyData: !!(completeMessageData?.reply_data),
                        replyMessageId: completeMessageData?.reply_message_id
                    });
                    
                    // Broadcast the permanent ID update with complete message data from database
                    const updateData = {
                        temp_message_id: temp_message_id,
                        real_message_id: realMessageId,
                        message_data: completeMessageData || saveResult,
                        timestamp: Date.now()
                    };
                    
                    if (targetRoom) {
                        // Broadcast to ALL users in the room (including sender) so everyone can react
                        io.to(targetRoom).emit('message_id_updated', updateData);
                        // Also send directly to sender to ensure they get it
                        client.emit('message_id_updated', updateData);
                    } else {
                        io.emit('message_id_updated', updateData);
                    }
                    
                    console.log(`✅ [SAVE-AND-SEND] Message ID update broadcasted to ALL users: ${temp_message_id} → ${realMessageId}`);
                    
                    // Send success response to sender
                    client.emit('message_sent', {
                        success: true,
                        message_id: realMessageId,
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

    static handleJumpToMessage(io, client, data) {
        console.log(`🎯 [JUMP-MESSAGE] Jump to message request from client ${client.id}`);
        
        if (!data.message_id) {
            console.error(`❌ [JUMP-MESSAGE] Missing message_id in jump request`);
            client.emit('jump-to-message-failed', { error: 'Message ID required' });
            return;
        }
        
        console.log(`🎯 [JUMP-MESSAGE] Processing jump to message:`, {
            messageId: data.message_id,
            userId: data.user_id,
            clientId: client.id
        });
        
        client.emit('jump-to-message-response', {
            message_id: data.message_id,
            user_id: data.user_id,
            action: 'scroll-and-highlight',
            timestamp: Date.now(),
            source: 'server-response'
        });
        
        console.log(`✅ [JUMP-MESSAGE] Jump response sent to client for message ${data.message_id}`);
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
            const updateData = {
                temp_message_id: data.temp_message_id,
                real_message_id: data.real_message_id,
                message_data: messageData,
                timestamp: Date.now()
            };
            
            console.log(`📡 [DATABASE-SAVED] Broadcasting message ID update to ALL users in room: ${targetRoom}`);
            // Broadcast to ALL users in the room (including sender) so everyone can react
            io.to(targetRoom).emit('message_id_updated', updateData);
            // Also send directly to sender to ensure they get it
            client.emit('message_id_updated', updateData);
            
            console.log(`✅ [DATABASE-SAVED] Message ID update broadcasted successfully to ALL users`);
        } else {
            console.warn(`⚠️ [DATABASE-SAVED] No target room found, broadcasting to all clients`);
            io.emit('message_id_updated', {
                temp_message_id: data.temp_message_id,
                real_message_id: data.real_message_id,
                message_data: messageData,
                timestamp: Date.now()
            });
        }
    }
}

module.exports = MessageHandler;