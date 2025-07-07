const AuthHandler = require('../handlers/authHandler');
const RoomHandler = require('../handlers/roomHandler');
const MessageHandler = require('../handlers/messageHandler');
const BotHandler = require('../handlers/botHandler');
const ActivityHandler = require('../handlers/activityHandler');
const VoiceConnectionTracker = require('../services/voiceConnectionTracker');
const roomManager = require('../services/roomManager');
const userService = require('../services/userService');
const messageService = require('../services/messageService');

const eventController = require('./eventController');
const userSockets = new Map();
const userStatus = new Map();
const recentMessages = new Map();
const voiceMeetings = new Map();

function setup(io) {
    eventController.setIO(io);
    userService.setIO(io);
    
    setupStaleConnectionChecker(io);
    io.on('connection', (client) => {

        
        client.on('authenticate', (data) => {

            AuthHandler.handle(io, client, data);
        });
        
        client.on('debug-test', (username) => {

            console.log(`👤 [DEBUG-TEST] User details: ${JSON.stringify({
                socketId: client.id,
                username: username,
                authenticated: client.data?.authenticated || false,
                userId: client.data?.user_id || 'not authenticated'
            }, null, 2)}`);
            
            client.emit('debug-test-response', {
                received: true,
                timestamp: new Date().toISOString(),
                server_id: process.pid
            });
        });
        
        client.on('join-room', (data) => {

            if (!data || !data.room_type || !data.room_id) {
                console.warn(`⚠️ [ROOM] Invalid join room data:`, data);
                return;
            }
            
            if (data.room_type === 'channel' && data.room_id) {
                const roomName = `channel-${data.room_id}`;
                roomManager.joinRoom(client, roomName);
                client.emit('room-joined', { room_id: data.room_id, room_type: 'channel', room_name: roomName });

                

                const roomClients = io.sockets.adapter.rooms.get(roomName);
                if (roomClients) {

                    roomClients.forEach(clientId => {

                    });
                }
                

                setTimeout(() => {

                    io.to(roomName).emit('room-debug', { 
                        message: 'Room join test message',
                        room: roomName,
                        timestamp: Date.now()
                    });
                }, 1000);
            } else if (data.room_type === 'dm' && data.room_id) {
                const roomName = data.room_id.startsWith('dm-room-') ? data.room_id : `dm-room-${data.room_id}`;
                roomManager.joinRoom(client, roomName);
                client.emit('room-joined', { room_id: data.room_id, room_type: 'dm', room_name: roomName });

                

                const roomClients = io.sockets.adapter.rooms.get(roomName);
                if (roomClients) {

                    roomClients.forEach(clientId => {

                    });
                }
                
                setTimeout(() => {

                    io.to(roomName).emit('room-debug', { 
                        message: 'Room join test message',
                        room: roomName,
                        timestamp: Date.now()
                    });
                }, 1000);
            } else {
                console.warn('⚠️ [ROOM] Invalid room join request:', data);
            }
        });
        
        client.on('join-channel', (data) => {

            RoomHandler.joinChannel(io, client, data);
        });
        
        client.on('leave-channel', (data) => {

            RoomHandler.leaveChannel(io, client, data);
        });
        
        client.on('join-dm-room', (data) => {

            RoomHandler.joinDMRoom(io, client, data);
        });
        
        client.on('new-channel-message', (data) => {
            console.log(`📨 [MESSAGE-CHANNEL] New channel message from ${client.id}:`, {
                messageId: data.id || data.message_id,
                channelId: data.channel_id,
                userId: data.user_id,
                username: data.username,
                content: data.content,
                messageType: data.message_type,
                source: data.source
            });
            


            
            const messageId = data.id || data.message_id;
            const signature = messageService.generateSignature('new-channel-message', client.data?.user_id, messageId, data.content, data.timestamp);
            if (!messageService.isDuplicate(signature)) {
                messageService.markAsProcessed(signature);
                const channel_id = data.channel_id;
                if (!channel_id) {
                    console.warn('⚠️ [MESSAGE-CHANNEL] Channel message missing channel_id:', data);
                    return;
                }
                data.channel_id = channel_id;
                data.user_id = data.user_id || client.data.user_id;
                data.username = data.username || client.data.username;
                

                if (!data.id && data.message_id) {
                    data.id = data.message_id;
                }
                
                console.log(`✅ [MESSAGE-CHANNEL] Processing new channel message for channel ${channel_id}:`, {
                    messageId: data.id,
                    content: data.content,
                    userId: data.user_id,
                    username: data.username
                });
                MessageHandler.forwardMessage(io, client, 'new-channel-message', data);
            } else {

            }
        });
        
        client.on('user-message-dm', (data) => {
            console.log(`📨 [MESSAGE-DM] New DM message from ${client.id}:`, {
                messageId: data.id || data.message_id,
                roomId: data.room_id,
                userId: data.user_id,
                username: data.username,
                content: data.content,
                messageType: data.message_type,
                source: data.source
            });
            


            
            const messageId = data.id || data.message_id;
            const signature = messageService.generateSignature('user-message-dm', client.data?.user_id, messageId, data.content, data.timestamp);
            if (!messageService.isDuplicate(signature)) {
                messageService.markAsProcessed(signature);
                const room_id = data.room_id;
                if (!room_id) {
                    console.warn('⚠️ [MESSAGE-DM] DM message missing room_id:', data);
                    return;
                }
                data.room_id = room_id;
                data.user_id = data.user_id || client.data.user_id;
                data.username = data.username || client.data.username;
                

                if (!data.id && data.message_id) {
                    data.id = data.message_id;
                }
                
                console.log(`✅ [MESSAGE-DM] Processing new DM message for room ${room_id}:`, {
                    messageId: data.id,
                    content: data.content,
                    userId: data.user_id,
                    username: data.username
                });
                MessageHandler.forwardMessage(io, client, 'user-message-dm', data);
            } else {

            }
        });
        

        client.on('save-and-send-message', async (data) => {
            console.log(`💾 [SAVE-SEND] WebSocket-only message from ${client.id}:`, {
                targetType: data.target_type,
                targetId: data.target_id,
                content: data.content?.substring(0, 50) + (data.content?.length > 50 ? '...' : ''),
                messageType: data.message_type || 'text'
            });
            

            await MessageHandler.saveAndSendMessage(io, client, data);
        });
        

        client.on('message-database-saved', (data) => {
            console.log(`💾 [DATABASE-SAVED] Database save confirmation from ${client.id}:`, {
                tempMessageId: data.temp_message_id,
                realMessageId: data.real_message_id
            });
            

            MessageHandler.handleMessageDatabaseSaved(io, client, data);
        });
        
        client.on('message-updated', (data) => {
            console.log(`✏️ [MESSAGE-EDIT] Message update from ${client.id}:`, {
                messageId: data.message_id,
                userId: data.user_id,
                username: data.username,
                newContent: data.message?.content?.substring(0, 50) + (data.message?.content?.length > 50 ? '...' : ''),
                targetType: data.target_type,
                targetId: data.target_id
            });
            
            if (!data.message_id) {
                console.warn('⚠️ [MESSAGE-EDIT] Message update missing message_id:', data);
                return;
            }
            data.user_id = data.user_id || client.data.user_id;
            data.username = data.username || client.data.username;

            MessageHandler.forwardMessage(io, client, 'message-updated', data);
        });
        
        client.on('message-edit-temp', (data) => {
            console.log(`✏️ [MESSAGE-EDIT-TEMP] Temp edit from ${client.id}:`, {
                messageId: data.message_id,
                tempEditId: data.temp_edit_id,
                userId: data.user_id,
                username: data.username,
                newContent: data.content?.substring(0, 50) + (data.content?.length > 50 ? '...' : ''),
                targetType: data.target_type,
                targetId: data.target_id
            });
            
            if (!data.message_id) {
                console.warn('⚠️ [MESSAGE-EDIT-TEMP] Temp edit missing message_id:', data);
                return;
            }
            
            data.user_id = data.user_id || client.data.user_id;
            data.username = data.username || client.data.username;
            

            MessageHandler.handleTempEdit(io, client, data);
        });
        
        client.on('message-deleted', (data) => {
            console.log(`🗑️ [MESSAGE-DELETE] Message deletion from ${client.id}:`, {
                messageId: data.message_id,
                userId: data.user_id,
                username: data.username,
                targetType: data.target_type,
                targetId: data.target_id
            });
            
            if (!client.data?.authenticated || !client.data?.user_id) {
                console.error(`❌ [MESSAGE-DELETE] Unauthenticated deletion attempt`);
                return;
            }
            
            if (!data.message_id) {
                console.warn('⚠️ [MESSAGE-DELETE] Missing message_id');
                return;
            }
            
            data.user_id = data.user_id || client.data.user_id;
            data.username = data.username || client.data.username;
            
            MessageHandler.handleDeletion(io, client, 'message-deleted', data);
        });
        
        client.on('reaction-added', (data) => {
            console.log(`😊 [REACTION-ADD] Reaction added from ${client.id}:`, {
                messageId: data.message_id,
                emoji: data.emoji,
                userId: data.user_id,
                username: data.username,
                targetType: data.target_type,
                targetId: data.target_id
            });
            
            data.user_id = data.user_id || client.data.user_id;
            data.username = data.username || client.data.username;

            MessageHandler.handleReaction(io, client, 'reaction-added', data);
        });
        
        client.on('reaction-removed', (data) => {
            console.log(`😐 [REACTION-REMOVE] Reaction removed from ${client.id}:`, {
                messageId: data.message_id,
                emoji: data.emoji,
                userId: data.user_id,
                username: data.username,
                targetType: data.target_type,
                targetId: data.target_id
            });
            
            data.user_id = data.user_id || client.data.user_id;
            data.username = data.username || client.data.username;

            MessageHandler.handleReaction(io, client, 'reaction-removed', data);
        });
        
        client.on('message-pinned', (data) => {
            console.log(`📌 [MESSAGE-PIN] Message pinned from ${client.id}:`, {
                messageId: data.message_id,
                userId: data.user_id,
                username: data.username,
                targetType: data.target_type,
                targetId: data.target_id
            });
            
            data.user_id = data.user_id || client.data.user_id;
            data.username = data.username || client.data.username;

            MessageHandler.handlePin(io, client, 'message-pinned', data);
        });
        
        client.on('message-unpinned', (data) => {
            console.log(`📌 [MESSAGE-UNPIN] Message unpinned from ${client.id}:`, {
                messageId: data.message_id,
                userId: data.user_id,
                username: data.username,
                targetType: data.target_type,
                targetId: data.target_id
            });
            
            data.user_id = data.user_id || client.data.user_id;
            data.username = data.username || client.data.username;

            MessageHandler.handlePin(io, client, 'message-unpinned', data);
        });
        
        client.on('jump-to-message', (data) => {
            console.log(`🎯 [JUMP-TO-MESSAGE] Jump to message request from ${client.id}:`, {
                messageId: data.message_id,
                userId: data.user_id
            });
            
            data.user_id = data.user_id || client.data.user_id;

            MessageHandler.handleJumpToMessage(io, client, data);
        });
        
        client.on('typing', (data) => {
            console.log(`⌨️ [TYPING-START] User started typing from ${client.id}:`, {
                userId: client.data?.user_id,
                username: client.data?.username,
                channelId: data.channel_id,
                roomId: data.room_id
            });
            MessageHandler.handleTyping(io, client, data, true);
        });
        
        client.on('stop-typing', (data) => {
            console.log(`⌨️ [TYPING-STOP] User stopped typing from ${client.id}:`, {
                userId: client.data?.user_id,
                username: client.data?.username,
                channelId: data.channel_id,
                roomId: data.room_id
            });
            MessageHandler.handleTyping(io, client, data, false);
        });
        
        client.on('update-presence', (data) => {
            console.log(`👤 [PRESENCE] Presence update from ${client.id}:`, {
                userId: client.data?.user_id,
                username: client.data?.username,
                status: data.status,
                activityDetails: data.activity_details
            });
            handlePresence(io, client, data);
        });
        
        client.on('check-voice-meeting', (data) => {
            console.log(`🎤 [VOICE-CHECK] Voice meeting check from ${client.id}:`, {
                channelId: data.channel_id,
                userId: client.data?.user_id
            });
            handleCheckVoiceMeeting(io, client, data);
        });
        
        client.on('register-voice-meeting', async (data) => {
            const { channel_id, meeting_id, server_id, username, broadcast } = data;
            const userId = client.data?.user_id;
            
            if (!userId || !channel_id || !meeting_id) {
                client.emit('voice-meeting-error', {
                    error: 'Missing required data for voice meeting registration',
                    timestamp: Date.now()
                });
                return;
            }

            console.log(`🎤 [VOICE-PARTICIPANT] Registering voice meeting:`, {
                userId,
                username: username || client.data?.username,
                channelId: channel_id,
                meetingId: meeting_id,
                serverId: server_id,
                broadcast: !!broadcast
            });

            const voiceChannelRoom = `voice_channel_${channel_id}`;
            
            try {
                await client.join(voiceChannelRoom);
                
                VoiceConnectionTracker.addUserToVoice(userId, channel_id, meeting_id, username || client.data?.username);
                

                roomManager.addVoiceMeeting(channel_id, meeting_id, client.id);

                
                const participants = VoiceConnectionTracker.getChannelParticipants(channel_id);
                const participantCount = participants.length;
                
                const updateData = {
                    channel_id: channel_id,
                    action: 'join',
                    user_id: userId,
                    username: username || client.data?.username,
                    meeting_id: meeting_id,
                    server_id: server_id,
                    participant_count: participantCount,
                    timestamp: Date.now()
                };
                
                console.log(`📢 [VOICE-PARTICIPANT] Broadcasting voice participant join:`, {
                    channelId: channel_id,
                    serverId: server_id,
                    userId,
                    participantCount,
                    broadcast: !!broadcast
                });
                
                // Always emit to the voice channel room
                io.to(voiceChannelRoom).emit('voice-meeting-update', updateData);

                // If broadcast flag is set or this is a fresh join, emit globally to ensure visibility
                if (broadcast || participantCount === 1) {
                    console.log(`📣 [VOICE-PARTICIPANT] Broadcasting globally for visibility`);
                    io.emit('voice-meeting-update', updateData);
                    
                    // Also broadcast to all server channels to ensure visibility
                    if (server_id) {
                        const serverRoom = `server_${server_id}`;
                        io.to(serverRoom).emit('voice-meeting-update', updateData);
                    }
                }
                
                // Confirm registration to the client
                client.emit('voice-meeting-update', {
                    ...updateData,
                    action: 'registered',
                    message: 'Successfully registered to voice meeting'
                });

                // Force refresh all clients to see the updated participant list
                setTimeout(() => {
                    io.emit('force-refresh-voice-participants', {
                        channel_id: channel_id,
                        timestamp: Date.now()
                    });
                }, 500);
            } catch (error) {
                console.error(`❌ [VOICE-PARTICIPANT] Error registering voice meeting:`, error);
                if (!client.data?.errorSent) {
                    client.emit('voice-meeting-error', {
                        error: 'Failed to register voice meeting',
                        details: error.message,
                        timestamp: Date.now()
                    });
                    client.data = client.data || {};
                    client.data.errorSent = true;
                    setTimeout(() => {
                        if (client.data) client.data.errorSent = false;
                    }, 3000);
                }
            }
        });
        
        client.on('unregister-voice-meeting', (data) => {
            console.log(`🎤 [VOICE-PARTICIPANT] Voice meeting unregistration from ${client.id}:`, {
                channelId: data.channel_id,
                userId: client.data?.user_id,
                username: client.data?.username
            });
            
            if (!client.data?.authenticated) {
                console.warn('⚠️ [VOICE-PARTICIPANT] Proceeding without authentication');
            }
            handleUnregisterVoiceMeeting(io, client, data);
        });
        
        client.on('get-online-users', () => {

            handleGetOnlineUsers(io, client);
        });
        
        client.on('debug-rooms', () => {

            handleDebugRooms(io, client);
        });
        
        client.on('heartbeat', () => {

            client.emit('heartbeat-response', { time: Date.now() });
            
            if (client.data?.user_id) {
                client.data.lastHeartbeat = Date.now();
            }
        });
        
        client.on('diagnostic-ping', (data) => {

            client.emit('diagnostic-pong', { clientTime: data.startTime, serverTime: Date.now() });
        });

        client.on('debug-broadcast-test', (data) => {

            const room = roomManager.getChannelRoom(data.room);
            if (room) {

                io.to(room).emit('debug-broadcast-received', { 
                    message: 'This is a broadcast test message.',
                    room: room,
                    sourceSocket: client.id 
                });
            } else {
                console.warn(`⚠️ [DEBUG-BROADCAST] Room not found: ${data.room}`);
            }
        });

        client.on('bot-init', (data) => {

            handleBotInit(io, client, data);
        });

        client.on('bot-join-channel', (data) => {

            handleBotJoinChannel(io, client, data);
        });

        client.on('bot-left-voice', (data) => {
            if (data && data.channel_id && data.bot_id) {
                const voiceChannelRoom = `voice_channel_${data.channel_id}`;
                const participant = { user_id: data.bot_id };
                
                io.to(voiceChannelRoom).emit('bot-voice-participant-left', {
                    participant: participant,
                    channelId: data.channel_id
                });
            }
        });

        client.on('join-tic-tac-toe', (data) => {

            ActivityHandler.handleTicTacToeJoin(io, client, data);
        });

        client.on('tic-tac-toe-ready', (data) => {

            ActivityHandler.handleTicTacToeReady(io, client, data);
        });

        client.on('tic-tac-toe-move', (data) => {

            ActivityHandler.handleTicTacToeMove(io, client, data);
        });

        client.on('leave-tic-tac-toe', (data) => {

            ActivityHandler.handleTicTacToeLeave(io, client, data);
        });

        client.on('tic-tac-toe-play-again-request', (data) => {

            ActivityHandler.handleTicTacToePlayAgainRequest(io, client, data);
        });

        client.on('tic-tac-toe-play-again-response', (data) => {

            ActivityHandler.handleTicTacToePlayAgainResponse(io, client, data);
        });
        
        client.on('disconnect', () => {

            if (client.data?.ticTacToeServerId) {
                ActivityHandler.handleTicTacToeLeave(io, client, { 
                    server_id: client.data.ticTacToeServerId 
                });
            }
            handleDisconnect(io, client);
        });
    });
}

function handlePresence(io, client, data) {
    const { status, activity_details } = data;
    const user_id = client.data?.user_id;
    const username = client.data?.username;
    
    if (!user_id || !username) return;
    
    const previousPresence = userService.getPresence(user_id);
    userService.updatePresence(user_id, status, activity_details, username);
    
    const broadcastData = {
        user_id,
        username,
        status,
        activity_details
    };
    
    if (!previousPresence || previousPresence.status !== status) {

        
        if (status === 'online' && (!previousPresence || previousPresence.status === 'offline')) {
            io.emit('user-online', broadcastData);
        } else {
            io.emit('user-presence-update', broadcastData);
        }
    } else {
        io.emit('user-presence-update', broadcastData);
    }
}

function handleGetOnlineUsers(io, client) {
    const onlineUsers = {};
    
    for (const [socketId, socket] of io.sockets.sockets.entries()) {
        if (socket.data?.user_id && socket.data?.authenticated) {
            const user_id = socket.data.user_id;
            const presence = userService.getPresence(user_id);
            
            onlineUsers[user_id] = {
                user_id,
                username: socket.data.username || 'Unknown',
                status: presence?.status || 'online',
                activity_details: presence?.activity_details || { type: 'idle' },
                last_seen: Date.now()
            };
        }
    }
    
    client.emit('online-users-response', { users: onlineUsers });
}

function handleCheckVoiceMeeting(io, client, data) {
    const { channel_id } = data;
    
    if (!channel_id) {
        client.emit('voice-meeting-error', { 
            error: 'Missing channel_id',
            timestamp: Date.now()
        });
        return;
    }


    

    const participants = VoiceConnectionTracker.getChannelParticipants(channel_id);
    const roomManagerMeeting = roomManager.getVoiceMeeting(channel_id);
    
    const participantCount = participants.length;
    const hasMeeting = participantCount > 0 || (roomManagerMeeting && roomManagerMeeting.participants.size > 0);
    
    const meetingId = hasMeeting ? (participants[0]?.meetingId || roomManagerMeeting?.meeting_id) : null;
    

    console.log(`🔍 [VOICE-PARTICIPANT] Voice check debug:`, {
        channel_id,
        trackerParticipants: participantCount,
        roomManagerParticipants: roomManagerMeeting?.participants.size || 0,
        hasMeeting,
        meetingId
    });
    
    const response = {
        channel_id: channel_id,
        has_meeting: hasMeeting,
        meeting_id: meetingId,
        participant_count: participantCount,
        participants: participants.map(p => ({
            user_id: p.userId,
            username: p.username || 'Unknown',
            meeting_id: p.meetingId,
            joined_at: p.joinedAt
        })),
        timestamp: Date.now()
    };

    console.log(`📊 [VOICE-PARTICIPANT] Voice meeting status for channel ${channel_id}:`, {
        hasMeeting,
        participantCount,
        meetingId
    });

    client.emit('voice-meeting-status', response);
    
    if (hasMeeting && participantCount > 0) {
        participants.forEach(participant => {
            client.emit('voice-meeting-update', {
                channel_id: channel_id,
                action: 'already_registered',
                user_id: participant.userId,
                username: participant.username,
                meeting_id: participant.meetingId,
                participant_count: participantCount,
                timestamp: Date.now()
            });
        });
    }
}

function handleUnregisterVoiceMeeting(io, client, data) {
    console.log(`🎤 [VOICE-PARTICIPANT] Voice meeting unregistration from ${client.id}:`, {
        channelId: data.channel_id,
        userId: client.data?.user_id,
        username: client.data?.username
    });
    
    if (!client.data?.authenticated) {
        console.warn('⚠️ [VOICE-PARTICIPANT] Proceeding without authentication');
    }
    
    const { channel_id } = data;
    const user_id = client.data?.user_id;
    const username = client.data?.username;
    
    if (!channel_id) {
        console.warn(`⚠️ [VOICE-PARTICIPANT] Channel ID is required`);
        client.emit('error', { message: 'Channel ID is required' });
        return;
    }

    const roomManagerMeeting = roomManager.getVoiceMeeting(channel_id);
    if (roomManagerMeeting) {
        if (!roomManagerMeeting.participants.has(client.id)) {

            return;
        }
        
        const result = roomManager.removeVoiceMeeting(channel_id, client.id);

        
        if (user_id) {
            const currentPresence = userService.getPresence(user_id);
            if (currentPresence && currentPresence.activity_details?.type && currentPresence.activity_details.type.startsWith('In Voice - ')) {
                userService.updatePresence(user_id, 'online', { type: 'idle' }, username);
                io.emit('user-presence-update', {
                    user_id: user_id,
                    username: username,
                    status: 'online',
                    activity_details: { type: 'idle' }
                });
            }
            
            VoiceConnectionTracker.removeUserFromVoice(user_id);

            
            client.leave(`voice_channel_${channel_id}`);

            
            const titiBotId = BotHandler.getTitiBotId();
            if (titiBotId && result.participant_count === 0) {
                BotHandler.removeBotFromVoiceChannel(io, titiBotId, channel_id);

            }
        }
        

        

        io.emit('voice-meeting-update', {
            channel_id,
            meeting_id: roomManagerMeeting.meeting_id,
            participant_count: result.participant_count,
            action: 'leave',
            user_id: user_id,
            username: username
        });
    } else {
        console.warn(`⚠️ [VOICE-PARTICIPANT] No voice meeting found for channel ${channel_id}`);
    }
}

function handleDebugRooms(io, client) {

    
    const allVoiceMeetings = roomManager.getAllVoiceMeetings();
    const voiceMeetingKeys = allVoiceMeetings.map(meeting => meeting.channel_id);
    
    const roomInfo = {
        clientId: client.id,
        userId: client.data?.user_id,
        username: client.data?.username,
        authenticated: client.data?.authenticated,
        rooms: Array.from(client.rooms),
        totalSockets: io.sockets.sockets.size,
        voiceMeetings: voiceMeetingKeys
    };
    

    client.emit('debug-rooms-info', roomInfo);
}

function handleDisconnect(io, client) {
    if (client.data?.user_id) {
        const user_id = client.data.user_id;
        const username = client.data.username;
        

        
        userSockets.delete(client.id);
        
        const roomManager = require('../services/roomManager');
        const userService = require('../services/userService');
        
        const userOffline = roomManager.removeUserSocket(user_id, client.id);
        
        if (userOffline) {

            userService.markUserDisconnecting(user_id, username);
        } else {

        }
        
        const allVoiceMeetings = roomManager.getAllVoiceMeetings();
        for (const meeting of allVoiceMeetings) {
            if (meeting.participants.has(client.id)) {

                // Skip automatic removal; rely on explicit leave action
                /*
                const result = roomManager.removeVoiceMeeting(meeting.channel_id, client.id);
                // ... remainder of cleanup code commented ...
                */
            }
        }
        // Automatic broadcast removed; explicit leave covers removals
    } else {

    }
}

function handleBotInit(io, client, data) {
    console.log(`🤖 [BOT-INIT-HANDLER] Processing bot initialization:`, {
        botId: data.bot_id,
        username: data.username,
        requestingUser: client.data?.user_id
    });
    
    if (!client.data?.authenticated) {
        console.warn('⚠️ [BOT-INIT-HANDLER] Proceeding without authentication');
    }
    
    const { bot_id, username } = data;
    
    if (!bot_id || !username) {
        console.warn('⚠️ [BOT-INIT-HANDLER] Bot ID and username are required');
        client.emit('bot-init-error', { message: 'Bot ID and username are required' });
        return;
    }
    
    try {
        BotHandler.connectBot(io, bot_id, username);

        client.emit('bot-init-success', { 
            bot_id, 
            username,
            message: `Bot ${username} is now active and listening for messages`
        });
    } catch (error) {
        console.error(`❌ [BOT-INIT-HANDLER] Error initializing bot:`, error);
        client.emit('bot-init-error', { message: 'Failed to initialize bot' });
    }
}

function handleBotJoinChannel(io, client, data) {
    console.log(`🤖 [BOT-JOIN-HANDLER] Processing bot join channel:`, {
        botId: data.bot_id,
        channelId: data.channel_id,
        requestingUser: client.data?.user_id
    });
    
    if (!client.data?.authenticated) {
        console.warn('⚠️ [BOT-JOIN-HANDLER] Proceeding without authentication');
    }
    
    const { bot_id, channel_id } = data;
    
    if (!bot_id || !channel_id) {
        console.warn('⚠️ [BOT-JOIN-HANDLER] Bot ID and channel ID are required');
        client.emit('bot-join-error', { message: 'Bot ID and channel ID are required' });
        return;
    }
    
    try {
        const success = BotHandler.joinBotToRoom(bot_id, 'channel', channel_id);
        if (success) {

            client.emit('bot-join-success', { 
                bot_id, 
                channel_id,
                message: `Bot joined channel ${channel_id} successfully`
            });
        } else {
            console.warn(`⚠️ [BOT-JOIN-HANDLER] Failed to join bot to channel`);
            client.emit('bot-join-error', { message: 'Bot not found or failed to join channel' });
        }
    } catch (error) {
        console.error(`❌ [BOT-JOIN-HANDLER] Error joining bot to channel:`, error);
        client.emit('bot-join-error', { message: 'Failed to join bot to channel' });
    }
}

function setupStaleConnectionChecker(io) {
    setInterval(() => {
        const roomManager = require('../services/roomManager');
        const VoiceConnectionTracker = require('../services/voiceConnectionTracker');
        const userService = require('../services/userService');
        
        const staleTimeout = 60000;
        const now = Date.now();
        

        
        const allVoiceMeetings = roomManager.getAllVoiceMeetings();
        let cleanedConnections = 0;
        
        for (const meeting of allVoiceMeetings) {
            const staleParticipants = [];
            
            meeting.participants.forEach(socketId => {
                const socket = io.sockets.sockets.get(socketId);
                
                if (!socket) {

                    staleParticipants.push(socketId);
                } else if (socket.data?.lastHeartbeat && (now - socket.data.lastHeartbeat) > staleTimeout) {

                    staleParticipants.push(socketId);
                } else if (!socket.data?.lastHeartbeat && socket.data?.user_id) {

                    staleParticipants.push(socketId);
                }
            });
            
            staleParticipants.forEach(socketId => {

                // Skip automatic cleanup; rely on explicit leave
                /*
                const result = roomManager.removeVoiceMeeting(meeting.channel_id, socketId);
                ...
                io.emit('voice-meeting-update', {...});
                cleanedConnections++;
                */
            });
        }
        
        if (cleanedConnections > 0) {

        }
    }, 30000);
}

module.exports = { setup };