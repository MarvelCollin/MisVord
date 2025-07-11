const roomManager = require('../services/roomManager');
const AuthHandler = require('./authHandler');
const eventValidator = require('../services/eventValidator');

class MessageHandler {
    static forwardMessage(io, client, eventName, data) {

        
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
        

        
        let targetRoom;
        if (eventName === 'new-channel-message' && data.channel_id) {
            targetRoom = roomManager.getChannelRoom(data.channel_id);

        } else if (eventName === 'user-message-dm' && data.room_id) {
            targetRoom = roomManager.getDMRoom(data.room_id);

        } else if (data.target_type && data.target_id) {
            if (data.target_type === 'channel') {
                targetRoom = roomManager.getChannelRoom(data.target_id);

            } else if (data.target_type === 'dm') {
                targetRoom = roomManager.getDMRoom(data.target_id);

            }
        }
        
        const broadcastData = {
            id: data.id || data.message_id,
            message_id: data.message_id || data.id,
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
            messageId: broadcastData.message_id,
            userId: broadcastData.user_id,
            content: broadcastData.content,
            timestamp: broadcastData.timestamp,
            source: broadcastData.source
        });
        

        
        let broadcastSuccess = false;
        
        if (targetRoom) {

            
            if (!client.rooms.has(targetRoom)) {

                client.join(targetRoom);
            }
        
            io.to(targetRoom).emit(eventName, broadcastData);

        
            const roomClients = io.sockets.adapter.rooms.get(targetRoom);
            if (roomClients) {

                broadcastSuccess = roomClients.size > 0;
            } else {
                console.warn(`⚠️ [MESSAGE-FORWARD] No clients found in room ${targetRoom}`);
                broadcastSuccess = false;
            }
        } else {
            console.warn(`⚠️ [MESSAGE-FORWARD] No target room found for ${eventName}:`, {
                channelId: data.channel_id,
                roomId: data.room_id,
                targetType: data.target_type,
                targetId: data.target_id
            });
            broadcastSuccess = false;
        }
        
        if (!broadcastSuccess) {

            const authenticatedClients = Array.from(io.sockets.sockets.values())
                .filter(socket => socket.data?.authenticated && socket.data?.user_id);
            

            
            authenticatedClients.forEach(socket => {
                if (socket.id !== client.id) {
                    socket.emit(eventName, broadcastData);
                }
            });
            

        }
    }

    static handleReaction(io, client, eventName, data) {

        
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

        } else if (data.target_type === 'dm' && data.target_id) {
            targetRoom = roomManager.getDMRoom(data.target_id);

        }
        
        if (targetRoom) {

            
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

                } else {
                    io.emit('reaction-confirmed', confirmationData);

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

            } else {
                io.emit('reaction-failed', failureData);

            }
        }
    }

    static handlePin(io, client, eventName, data) {

        
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

        } else if (data.target_type === 'dm' && data.target_id) {
            targetRoom = roomManager.getDMRoom(data.target_id);

        }
        
        if (targetRoom) {

            
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

        } else {
            console.warn(`⚠️ [PIN-HANDLER] No target room found for ${eventName}:`, {
                targetType: data.target_type,
                targetId: data.target_id
            });
        }
    }

    static handleTyping(io, client, data, isTyping = true) {

        
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

            client.to(room).emit(eventName, { user_id, username, channel_id: channelId });

        } else if (roomId) {
            const room = roomManager.getDMRoom(roomId);

            client.to(room).emit(dmEventName, { user_id, username, room_id: roomId });

        } else {
            console.warn(`⚠️ [TYPING-HANDLER] No channel_id or room_id provided in typing data`);
        }
    }

    static async saveAndSendMessage(io, client, data) {



        

        const isLikelyBotCommand = data.content && data.content.toLowerCase().includes('/titibot');

        
        if (!client.data?.user_id) {
            console.error(`❌ [SAVE-AND-SEND] No authenticated user found`);
            return;
        }

        if (!data.target_type || !data.target_id || !data.content) {
            console.error(`❌ [SAVE-AND-SEND] Missing required data:`, {
                target_type: data.target_type,
                target_id: data.target_id,
                has_content: !!data.content
            });
            console.error(`❌ [SAVE-AND-SEND] Full data object:`, JSON.stringify(data, null, 2));
            return;
        }
        

        console.log(`📋 [SAVE-AND-SEND] Validated data:`, {
            target_type: data.target_type,
            target_id: data.target_id,
            content_preview: data.content?.substring(0, 50) + '...'
        });
        
        console.log(`📝 [SAVE-AND-SEND] Processing new message:`, {
            userId: client.data.user_id,
            username: client.data.username,
            targetType: data.target_type,
            targetId: data.target_id,
            content: data.content.substring(0, 50) + (data.content.length > 50 ? '...' : ''),
            messageType: data.message_type || 'text'
        });
        
        try {    
            const temp_message_id = data.temp_message_id || `temp-${Date.now()}`;
            const indonesiaTime = new Date(new Date().getTime() + (7 * 60 * 60 * 1000));
            const currentTimestamp = indonesiaTime.toISOString();

            let broadcastData = {
                id: temp_message_id,
                temp_message_id: temp_message_id,
                user_id: client.data.user_id,
                username: client.data.username,
                avatar_url: client.data.avatar_url || '/public/assets/common/default-profile-picture.png',
                content: data.content,
                attachments: data.attachments || [],
                mentions: data.mentions || [],
                reply_message_id: data.reply_message_id,
                sent_at: currentTimestamp,
                timestamp: Date.parse(currentTimestamp),
                message_type: data.message_type || 'text',
                is_temporary: true,
                source: `websocket-temp-${client.id}`
            };

            if (data.target_type === 'channel') {
                broadcastData.channel_id = data.target_id;
                broadcastData.target_type = 'channel';
                broadcastData.target_id = data.target_id;
            } else if (data.target_type === 'dm') {
                broadcastData.room_id = data.target_id;
                broadcastData.target_type = 'dm';
                broadcastData.target_id = data.target_id;
            }

            if (data.context) {
                broadcastData.context = data.context;
            }


            if (data.reply_message_id) {

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
                        if (replyResult.success && replyResult.data && replyResult.data.message) {
                            const messageData = replyResult.data.message;
                            broadcastData.reply_data = {
                                message_id: data.reply_message_id,
                                content: messageData.content,
                                user_id: messageData.user_id,
                                username: messageData.username,
                                avatar_url: messageData.avatar_url || '/public/assets/common/default-profile-picture.png'
                            };
                            console.log(`✅ [SAVE-AND-SEND] Reply data fetched for temporary broadcast: ${data.reply_message_id}`, {
                                username: messageData.username,
                                content: messageData.content?.substring(0, 50)
                            });
                        }
                    } else {
                        console.warn(`⚠️ [SAVE-AND-SEND] Failed to fetch reply data for temp broadcast: ${replyResponse.status}`);
                    }
                } catch (replyError) {
                    console.error(`❌ [SAVE-AND-SEND] Error fetching reply data for temp broadcast:`, replyError);
                }
            }
                    
            const eventName = data.target_type === 'channel' ? 'new-channel-message' : 'user-message-dm';
            const targetRoom = data.target_type === 'channel' 
                ? roomManager.getChannelRoom(data.target_id)
                : roomManager.getDMRoom(data.target_id);
            

            if (targetRoom) {
                console.log(`📡 [SAVE-AND-SEND] About to emit bot-message-intercept with data:`, JSON.stringify({
                    id: broadcastData.id,
                    user_id: broadcastData.user_id,
                    username: broadcastData.username,
                    content: broadcastData.content,
                    target_type: broadcastData.target_type,
                    target_id: broadcastData.target_id,
                    channel_id: broadcastData.channel_id,
                    room_id: broadcastData.room_id
                }, null, 2));
                
                const BotHandler = require('./botHandler');
                const VoiceConnectionTracker = require('../services/voiceConnectionTracker');
                
                const isTitiBotCommand = broadcastData.content && broadcastData.content.toLowerCase().includes('/titibot');
                let voiceChannelData = null;
                
                if (isTitiBotCommand) {
                    if (data.voice_context) {
                        voiceChannelData = data.voice_context;

                        
                        if (voiceChannelData.user_in_voice && voiceChannelData.voice_channel_id) {
                            VoiceConnectionTracker.addUserToVoice(
                                broadcastData.user_id, 
                                voiceChannelData.voice_channel_id, 
                                `voice_channel_${voiceChannelData.voice_channel_id}`,
                                broadcastData.username,
                                client.data?.avatar_url
                            );

                        }
                    } else {
                        const userVoiceConnection = VoiceConnectionTracker.getUserVoiceConnection(broadcastData.user_id);
                        if (userVoiceConnection) {
                            voiceChannelData = {
                                voice_channel_id: userVoiceConnection.channelId,
                                meeting_id: userVoiceConnection.meetingId,
                                user_in_voice: true
                            };

                        } else {

                            voiceChannelData = {
                                voice_channel_id: null,
                                meeting_id: null,
                                user_in_voice: false
                            };
                        }
                    }
                    
                    broadcastData.voice_context = voiceChannelData;
                }
                

                console.log(`🤖 [SAVE-AND-SEND] Emitting bot-message-intercept for bot processing:`, {
                    messageId: broadcastData.id,
                    content: broadcastData.content?.substring(0, 50) + '...',
                    userId: broadcastData.user_id,
                    username: broadcastData.username,
                    channelId: broadcastData.channel_id,
                    voiceChannelId: voiceChannelData?.voice_channel_id,
                    isTitiBotCommand: isTitiBotCommand
                });
                BotHandler.emitBotMessageIntercept(broadcastData);
                

            if (targetRoom) {

                this.handleMentionNotifications(io, client, broadcastData, targetRoom);
                
                client.to(targetRoom).emit(eventName, broadcastData);
                console.log(`✅ [SAVE-AND-SEND] Message sent to room ${targetRoom}`, {
                    messageId: broadcastData.id,
                    hasReplyData: !!broadcastData.reply_data,
                    replyMessageId: broadcastData.reply_message_id
                });
            } else {
                console.log(`⚠️ [SAVE-AND-SEND] No room found for message, broadcasting to all`, {
                    messageId: broadcastData.id,
                    content: broadcastData.content?.substring(0, 50) + '...',
                    userId: broadcastData.user_id,
                    username: broadcastData.username
                });

                
                this.handleMentionNotifications(io, client, broadcastData, null);
                
                io.emit(eventName, broadcastData);
                console.log(`⚠️ [SAVE-AND-SEND] No room found, broadcasted to all clients`, {
                    messageId: broadcastData.id,
                    hasReplyData: !!broadcastData.reply_data,
                    replyMessageId: broadcastData.reply_message_id
                });
            }
            
            } // 

            
            try {


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

                } else {
                    console.error(`❌ [SAVE-AND-SEND] Debug endpoint failed: ${debugResponse.status} ${debugResponse.statusText}`);
                }
                

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
                        reply_message_id: data.reply_message_id,
                        temp_message_id: data.temp_message_id || temp_message_id
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const saveResult = await response.json();

                console.log(`✅ [SAVE-AND-SEND] Response structure analysis:`, {
                    hasSuccess: !!saveResult.success,
                    successValue: saveResult.success,
                    hasMessageId: !!saveResult.message_id,
                    messageIdValue: saveResult.message_id,
                    hasData: !!saveResult.data,
                    hasNestedMessage: !!(saveResult.data?.message),
                    nestedMessageId: saveResult.data?.message?.id,
                    fullDataKeys: saveResult.data ? Object.keys(saveResult.data) : 'NO_DATA'
                });
                
                if (saveResult.success) {
                    let realMessageId = null;
                    

                    if (saveResult.data && saveResult.data.message_id) {
                        realMessageId = saveResult.data.message_id;
                    } else if (saveResult.message_id) {
                        realMessageId = saveResult.message_id;
                    } else if (saveResult.data && saveResult.data.data && saveResult.data.data.message && saveResult.data.data.message.id) {
                        realMessageId = saveResult.data.data.message.id;
                    } else if (saveResult.data && saveResult.data.message && saveResult.data.message.id) {
                        realMessageId = saveResult.data.message.id;
                    }
                    
                    console.log(`🔍 [SAVE-AND-SEND] Message ID extraction:`, {
                        dataMessageId: saveResult.data?.message_id || 'NOT_FOUND',
                        topLevelId: saveResult.message_id || 'NOT_FOUND',
                        deepNestedId: saveResult.data?.data?.message?.id || 'NOT_FOUND',
                        nestedId: saveResult.data?.message?.id || 'NOT_FOUND',
                        finalMessageId: realMessageId
                    });
                    
                    if (!realMessageId) {
                        console.error(`❌ [SAVE-AND-SEND] No message_id found. Full response:`, JSON.stringify(saveResult, null, 2));
                        throw new Error('No message_id found in server response');
                    }
                    

                    let completeMessageData = null;
                    if (saveResult.data && saveResult.data.data && saveResult.data.data.message) {
                        completeMessageData = saveResult.data.data.message;
                    } else if (saveResult.data && saveResult.data.message) {
                        completeMessageData = saveResult.data.message;
                    }
                    
                    console.log(`🔍 [SAVE-AND-SEND] Extracted message data:`, {
                        hasCompleteData: !!completeMessageData,
                        hasReplyData: !!(completeMessageData?.reply_data),
                        replyMessageId: completeMessageData?.reply_message_id
                    });
                    

                    const updateData = {
                        temp_message_id: data.temp_message_id || temp_message_id,
                        real_message_id: realMessageId,
                        message_data: completeMessageData || saveResult,
                        timestamp: Date.now()
                    };
                    
                    if (targetRoom) {
                        io.to(targetRoom).emit('message_id_updated', updateData);
                        client.emit('message_id_updated', updateData);
                    } else {
                        io.emit('message_id_updated', updateData);
                    }
                    

                    
                    client.emit('message_sent', {
                        success: true,
                        message_id: realMessageId,
                        temp_message_id: data.temp_message_id || temp_message_id,
                        timestamp: Date.now()
                    });
                } else {
                    throw new Error(saveResult.message || 'Database save failed');
                }
                
            } catch (error) {
                console.error(`❌ [SAVE-AND-SEND] Database save failed:`, error);
                

                const errorData = {
                    temp_message_id: data.temp_message_id || temp_message_id,
                    error: error.message || 'Failed to save to database'
                };
                
                if (targetRoom) {
                    io.to(targetRoom).emit('message_save_failed', errorData);
                } else {
                    io.emit('message_save_failed', errorData);
                }
                
                client.emit('message_error', {
                    error: error.message || 'Failed to save message',
                    temp_message_id: data.temp_message_id || temp_message_id,
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
        

    }
    
    static handleMessageDatabaseSaved(io, client, data) {

        
        if (!data.temp_message_id || !data.real_message_id) {
            console.error(`❌ [DATABASE-SAVED] Missing required fields:`, data);
            return;
        }
        

        

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
            


            io.to(targetRoom).emit('message_id_updated', updateData);

            client.emit('message_id_updated', updateData);
            

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
    
    static async handleTempEdit(io, client, data) {

        
        if (!client.data?.authenticated || !client.data?.user_id) {
            console.error(`❌ [TEMP-EDIT] Unauthenticated client attempted to edit message`);
            client.emit('message-edit-failed', { 
                message_id: data.message_id,
                error: 'Authentication required' 
            });
            return;
        }
        
        if (!data.message_id || !data.content || !data.target_type || !data.target_id) {
            console.error(`❌ [TEMP-EDIT] Missing required fields:`, data);
            client.emit('message-edit-failed', { 
                message_id: data.message_id,
                error: 'Missing required fields' 
            });
            return;
        }
        
        console.log(`✏️ [TEMP-EDIT] Processing edit:`, {
            messageId: data.message_id,
            userId: client.data.user_id,
            username: client.data.username,
            targetType: data.target_type,
            targetId: data.target_id,
            content: data.content.substring(0, 50) + (data.content.length > 50 ? '...' : '')
        });
        
        try {
            const targetRoom = data.target_type === 'channel' 
                ? roomManager.getChannelRoom(data.target_id)
                : roomManager.getDMRoom(data.target_id);
            
            const broadcastData = {
                message_id: data.message_id,
                content: data.content,
                user_id: client.data.user_id,
                username: client.data.username,
                target_type: data.target_type,
                target_id: data.target_id,
                timestamp: Date.now()
            };
            
            if (targetRoom) {

                client.to(targetRoom).emit('message-edit-temp', broadcastData);
            } else {

                client.broadcast.emit('message-edit-temp', broadcastData);
            }
            

            
        } catch (error) {
            console.error(`❌ [TEMP-EDIT] Error broadcasting edit:`, error);
            
            const failureData = {
                message_id: data.message_id,
                user_id: client.data.user_id,
                username: client.data.username,
                target_type: data.target_type,
                target_id: data.target_id,
                error: error.message || 'Failed to broadcast edit',
                timestamp: Date.now()
            };
            
            const targetRoom = data.target_type === 'channel' 
                ? roomManager.getChannelRoom(data.target_id)
                : roomManager.getDMRoom(data.target_id);
            
            if (targetRoom) {
                io.to(targetRoom).emit('message-edit-failed', failureData);
            } else {
                io.emit('message-edit-failed', failureData);
            }
        }
    }
    
    static async handleMentionNotifications(io, client, messageData, targetRoom) {
        if (!messageData.mentions || messageData.mentions.length === 0) {
            return;
        }
    
        const context = await this.fetchNotificationContext(messageData, client);
        
        const notificationPayload = {
            message_id: messageData.id,
            content: messageData.content,
            user_id: messageData.user_id,
            username: messageData.username,
            avatar_url: messageData.avatar_url,
            channel_id: messageData.channel_id,
            room_id: messageData.room_id,
            target_type: messageData.target_type,
            target_id: messageData.target_id,
            server_id: context.server_id,
            timestamp: Date.now(),
            context: context
        };
    
        console.log('📧 [MENTION-NOTIFICATIONS] Processing mentions with context:', {
            server_id: context.server_id,
            server_name: context.server_name,
            server_icon: context.server_icon,
            channel_name: context.channel_name,
            mentions: messageData.mentions.map(m => ({ type: m.type, username: m.username }))
        });

        for (const mention of messageData.mentions) {
            if (mention.type === 'all') {
                const allMentionPayload = { ...notificationPayload, type: 'all' };

                if (notificationPayload.target_type === 'channel' && context.server_id) {
                    console.log('📧 [MENTION-NOTIFICATIONS] Processing @all mention for server:', context.server_id);
                    
                    try {
                        const response = await fetch(`http://app:1001/api/socket/servers/${context.server_id}/members`, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                                'User-Agent': 'SocketServer/1.0',
                                'X-Socket-Token': 'socket-server-internal-auth-2025'
                            }
                        });

                        if (response.ok) {
                            const result = await response.json();
                            if (result.success && result.data) {
                                const serverMembers = result.data;
                                let notificationsSent = 0;
                                
                                for (const socket of io.sockets.sockets.values()) {
                                    const socketUserId = socket.data?.user_id;
                                    if (socketUserId && socketUserId.toString() !== messageData.user_id.toString()) {
                                        const isMember = serverMembers.some(member => 
                                            member.user_id?.toString() === socketUserId.toString()
                                        );
                                        if (isMember) {
                                            socket.emit('mention_notification', allMentionPayload);
                                            notificationsSent++;
                                        }
                                    }
                                }
                                console.log(`📧 [MENTION-NOTIFICATIONS] Sent @all notification to ${notificationsSent} server members`);
                            } else {
                                console.error('❌ [MENTION-NOTIFICATIONS] Failed to fetch server members:', result.message);
                                if (targetRoom) {
                                    client.to(targetRoom).emit('mention_notification', allMentionPayload);
                                }
                            }
                        } else {
                            console.error('❌ [MENTION-NOTIFICATIONS] Server members API error:', response.status);
                            if (targetRoom) {
                                client.to(targetRoom).emit('mention_notification', allMentionPayload);
                            }
                        }
                    } catch (error) {
                        console.error('❌ [MENTION-NOTIFICATIONS] Error fetching server members:', error);
                        if (targetRoom) {
                            client.to(targetRoom).emit('mention_notification', allMentionPayload);
                        }
                    }
                } else {
                    if (targetRoom) {
                        client.to(targetRoom).emit('mention_notification', allMentionPayload);
                    } else {
                        io.emit('mention_notification', allMentionPayload);
                    }
                }
            } else if (mention.type === 'role') {
                await this.handleRoleMention(io, client, notificationPayload, mention, targetRoom);
            } else if (mention.type === 'user' && mention.user_id && mention.user_id.toString() !== messageData.user_id.toString()) {
                const userMentionPayload = {
                    ...notificationPayload,
                    type: 'user',
                    mentioned_user_id: mention.user_id,
                    mentioned_username: mention.username
                };
                
                console.log('📧 [MENTION-NOTIFICATIONS] Sending user mention notification:', {
                    mentioned_user_id: mention.user_id,
                    server_id: context.server_id
                });
                
                for (const socket of io.sockets.sockets.values()) {
                    if (socket.data?.user_id?.toString() === mention.user_id.toString()) {
                        socket.emit('mention_notification', userMentionPayload);
                    }
                }
            }
        }
    }

    static async handleRoleMention(io, client, notificationPayload, mention, targetRoom) {
        const role = mention.username;


        try {
            if (notificationPayload.target_type === 'channel' && notificationPayload.target_id) {
                const headers = {
                    'Content-Type': 'application/json',
                    'User-Agent': 'SocketServer/1.0',
                    'X-Socket-Token': 'socket-server-internal-auth-2025'
                };

                const response = await fetch(`http://app:1001/api/socket/channels/${notificationPayload.target_id}/users-by-role`, {
                    method: 'GET',
                    headers: headers
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data.users_by_role) {
                        const users = result.data.users_by_role[role] || [];


                        users.forEach(user => {
                            const roleMentionPayload = {
                                ...notificationPayload,
                                type: 'role',
                                role: role,
                                mentioned_user_id: user.id,
                                mentioned_username: user.username
                            };

                            for (const socket of io.sockets.sockets.values()) {
                                if (socket.data?.user_id?.toString() === user.id.toString()) {
                                    socket.emit('mention_notification', roleMentionPayload);

                                }
                            }
                        });
                    }
                } else {
                    console.error(`❌ [ROLE-MENTION] API failed: ${response.status}`);
                }
            }
        } catch (error) {
            console.error('❌ [ROLE-MENTION] Error processing role mention:', error);
        }
    }

    static handleDeletion(io, client, eventName, data) {

        
        if (!client.data?.authenticated || !client.data?.user_id) {
            console.error(`❌ [DELETION-HANDLER] Unauthenticated deletion attempt`);
            return;
        }
        
        if (!data.message_id || !data.target_type || !data.target_id) {
            console.error(`❌ [DELETION-HANDLER] Missing required fields:`, data);
            return;
        }
        
        console.log(`🗑️ [DELETION-HANDLER] Processing deletion:`, {
            messageId: data.message_id,
            userId: client.data.user_id,
            username: client.data.username,
            targetType: data.target_type,
            targetId: data.target_id
        });
        
        try {
            const targetRoom = data.target_type === 'channel' 
                ? roomManager.getChannelRoom(data.target_id)
                : roomManager.getDMRoom(data.target_id);
            
            const deletionData = {
                message_id: data.message_id,
                user_id: client.data.user_id,
                username: client.data.username,
                avatar_url: client.data.avatar_url || '/public/assets/common/default-profile-picture.png',
                target_type: data.target_type,
                target_id: data.target_id,
                timestamp: Date.now(),
                source: data.source || 'server-originated'
            };
            
            if (targetRoom) {

                client.to(targetRoom).emit('message-deleted', deletionData);

            } else {

                client.broadcast.emit('message-deleted', deletionData);

            }
            
        } catch (error) {
            console.error(`❌ [DELETION-HANDLER] Error broadcasting deletion:`, error);
        }
    }

    static async fetchNotificationContext(messageData, client) {
        const context = {
            server_name: null,
            server_icon: null,
            channel_name: null,
            server_id: null
        };

        console.log('🔍 [MENTION-CONTEXT] Starting context fetch for:', {
            target_type: messageData.target_type,
            target_id: messageData.target_id,
            channel_id: messageData.channel_id,
            user_id: messageData.user_id
        });

        try {
            if (messageData.target_type === 'channel' && messageData.target_id) {
                const channelId = messageData.target_id;
                
                const headers = {
                    'Content-Type': 'application/json',
                    'User-Agent': 'SocketServer/1.0',
                    'X-Socket-Token': 'socket-server-internal-auth-2025'
                };
                
                if (client && client.data) {
                    headers['X-Socket-User-ID'] = client.data.user_id.toString();
                    headers['X-Socket-Username'] = client.data.username;
                }
                


                
                const channelResponse = await fetch(`http://app:1001/api/socket/channels/${channelId}`, {
                    method: 'GET',
                    headers: headers
                });



                if (channelResponse.ok) {
                    const channelResult = await channelResponse.json();

                    
                    if (channelResult.success && channelResult.data) {
                        const data = channelResult.data;
                        const channel = data.channel;
                        const server = data.server;
                        


                        
                        if (channel && channel.name) {
                            context.channel_name = channel.name;

                            
                            if (server && server.name && server.id) {
                                context.server_name = server.name;
                                context.server_id = server.id;
                                context.server_icon = server.image_url || '/public/assets/common/main-logo.png';

                            } else {

                                if (!server) {

                                } else if (!server.name) {

                                } else if (!server.id) {

                                }
                            }
                        } else {
                            console.warn(`⚠️ [MENTION-CONTEXT] No valid channel data found - channel object:`, channel);
                        }
                    } else {
                        console.warn(`⚠️ [MENTION-CONTEXT] API response unsuccessful:`, channelResult);
                    }
                } else {
                    const errorText = await channelResponse.text();
                    console.error(`❌ [MENTION-CONTEXT] Channel API failed: ${channelResponse.status}`, errorText);
                }
            } else if (messageData.target_type === 'dm') {
                context.channel_name = 'Direct Message';

            }
        } catch (error) {
            console.error('❌ [MENTION-CONTEXT] Error fetching notification context:', error);
            context.channel_name = messageData.target_type === 'dm' ? 'Direct Message' : 'Channel';
        }


        return context;
    }
}

module.exports = MessageHandler;