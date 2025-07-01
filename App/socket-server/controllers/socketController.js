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
    io.on('connection', (client) => {
        console.log(`🔌 [CONNECTION] Client connected: ${client.id}`);
        
        client.on('authenticate', (data) => {
            console.log(`🔐 [AUTH] Authentication request from ${client.id}:`, data);
            AuthHandler.handle(io, client, data);
        });
        
        client.on('debug-test', (username) => {
            console.log(`🧪 [DEBUG-TEST] Debug ping received from ${username || 'unknown'} (${client.id})`);
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
            console.log(`🚪 [ROOM] Client ${client.id} joining room:`, data);
            if (!data || !data.room_type || !data.room_id) {
                console.warn(`⚠️ [ROOM] Invalid join room data:`, data);
                return;
            }
            
            if (data.room_type === 'channel' && data.room_id) {
                const roomName = `channel-${data.room_id}`;
                roomManager.joinRoom(client, roomName);
                client.emit('room-joined', { room_id: data.room_id, room_type: 'channel', room_name: roomName });
                console.log(`✅ [ROOM] Client ${client.id} joined channel room: ${roomName}`);
                
                // Log all clients in this room
                const roomClients = io.sockets.adapter.rooms.get(roomName);
                if (roomClients) {
                    console.log(`👥 [ROOM] Clients in room ${roomName}: ${roomClients.size}`);
                    roomClients.forEach(clientId => {
                        console.log(`  - Client: ${clientId}`);
                    });
                }
                
                // Debug: Send a test message to the room to verify connectivity
                setTimeout(() => {
                    console.log(`🔍 [ROOM] Sending test message to room ${roomName}`);
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
                console.log(`✅ [ROOM] Client ${client.id} joined DM room: ${roomName}`);
                
                // Log all clients in this room
                const roomClients = io.sockets.adapter.rooms.get(roomName);
                if (roomClients) {
                    console.log(`👥 [ROOM] Clients in room ${roomName}: ${roomClients.size}`);
                    roomClients.forEach(clientId => {
                        console.log(`  - Client: ${clientId}`);
                    });
                }
                
                setTimeout(() => {
                    console.log(`🔍 [ROOM] Sending test message to room ${roomName}`);
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
            console.log(`📺 [CHANNEL] Join channel request from ${client.id}:`, data);
            RoomHandler.joinChannel(io, client, data);
        });
        
        client.on('leave-channel', (data) => {
            console.log(`🚪 [CHANNEL] Leave channel request from ${client.id}:`, data);
            RoomHandler.leaveChannel(io, client, data);
        });
        
        client.on('join-dm-room', (data) => {
            console.log(`💬 [DM] Join DM room request from ${client.id}:`, data);
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
            
            // Log the complete message data
            console.log(`📦 [MESSAGE-CHANNEL] Complete message data:`, JSON.stringify(data, null, 2));
            
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
                
                // Ensure the message has an ID
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
                console.log(`🔄 [MESSAGE-CHANNEL] Duplicate message detected, skipping: ${messageId}`);
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
            
            // Log the complete message data
            console.log(`📦 [MESSAGE-DM] Complete message data:`, JSON.stringify(data, null, 2));
            
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
                
                // Ensure the message has an ID
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
                console.log(`🔄 [MESSAGE-DM] Duplicate message detected, skipping: ${messageId}`);
            }
        });
        
        // WebSocket-only message sending (saves to database and broadcasts)
        client.on('save-and-send-message', async (data) => {
            console.log(`💾 [SAVE-SEND] WebSocket-only message from ${client.id}:`, {
                targetType: data.target_type,
                targetId: data.target_id,
                content: data.content?.substring(0, 50) + (data.content?.length > 50 ? '...' : ''),
                messageType: data.message_type || 'text'
            });
            
            // Use the new saveAndSendMessage method for WebSocket-only messaging
            await MessageHandler.saveAndSendMessage(io, client, data);
        });
        
        // Handle database save confirmation and broadcast permanent ID
        client.on('message-database-saved', (data) => {
            console.log(`💾 [DATABASE-SAVED] Database save confirmation from ${client.id}:`, {
                tempMessageId: data.temp_message_id,
                realMessageId: data.real_message_id
            });
            
            // Broadcast the permanent ID to all clients
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
            console.log(`✅ [MESSAGE-EDIT] Processing message update for message ${data.message_id}`);
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
            
            console.log(`✅ [MESSAGE-EDIT-TEMP] Processing temp edit for message ${data.message_id}`);
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
            
            if (!data.message_id) {
                console.warn('⚠️ [MESSAGE-DELETE] Message deletion missing message_id:', data);
                return;
            }
            data.user_id = data.user_id || client.data.user_id;
            data.username = data.username || client.data.username;
            console.log(`✅ [MESSAGE-DELETE] Processing message deletion for message ${data.message_id}`);
            MessageHandler.forwardMessage(io, client, 'message-deleted', data);
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
            console.log(`✅ [REACTION-ADD] Processing reaction add: ${data.emoji} on message ${data.message_id}`);
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
            console.log(`✅ [REACTION-REMOVE] Processing reaction removal: ${data.emoji} from message ${data.message_id}`);
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
            console.log(`✅ [MESSAGE-PIN] Processing message pin for message ${data.message_id}`);
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
            console.log(`✅ [MESSAGE-UNPIN] Processing message unpin for message ${data.message_id}`);
            MessageHandler.handlePin(io, client, 'message-unpinned', data);
        });
        
        client.on('jump-to-message', (data) => {
            console.log(`🎯 [JUMP-TO-MESSAGE] Jump to message request from ${client.id}:`, {
                messageId: data.message_id,
                userId: data.user_id
            });
            
            data.user_id = data.user_id || client.data.user_id;
            console.log(`✅ [JUMP-TO-MESSAGE] Processing jump to message ${data.message_id}`);
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
            try {
                const { channel_id, meeting_id } = data;
                const userKey = client.data?.user_id || client.id;
                const username = client.data?.username;
                
                console.log(`📝 [VOICE-REGISTER] User ${userKey} registering for meeting ${meeting_id} in channel ${channel_id}`);
                
                if (VoiceConnectionTracker.getUserVoiceStatus(userKey)) {
                    console.log(`⚠️ [VOICE-REGISTER] User ${userKey} already registered in voice, preventing duplicate registration`);
                    client.emit('voice-meeting-update', {
                        action: 'already_registered',
                        channel_id: channel_id,
                        meeting_id: meeting_id,
                        user_id: userKey
                    });
                    return;
                }
                
                const currentPresence = userService.getPresence(userKey);
                if (!currentPresence || currentPresence.activity_details?.type !== 'playing Tic Tac Toe') {
                    userService.updatePresence(userKey, 'online', { type: 'In Voice Call' });
                    io.emit('user-presence-update', {
                        user_id: userKey,
                        username: username,
                        status: 'online',
                        activity_details: { type: 'In Voice Call' }
                    });
                }
                
                VoiceConnectionTracker.addUserToVoice(userKey, channel_id, meeting_id);
                roomManager.addUserToVoiceMeeting(channel_id, client.id, userKey);
                
                await client.join(`voice_channel_${channel_id}`);
                
                const voiceChannelRoom = `voice_channel_${channel_id}`;
                const meeting = roomManager.getVoiceMeeting(channel_id);
                
                console.log(`📡 [VOICE-REGISTER] Broadcasting join to room: ${voiceChannelRoom}`);
                io.to(voiceChannelRoom).emit('voice-meeting-update', {
                    action: 'join',
                    channel_id: channel_id,
                    meeting_id: meeting_id,
                    user_id: userKey,
                    participant_count: meeting?.participants?.size || 1
                });
                
                client.emit('voice-meeting-update', {
                    action: 'registered',
                    channel_id: channel_id,
                    meeting_id: meeting_id,
                    user_id: userKey,
                    participant_count: meeting?.participants?.size || 1
                });
                
                console.log(`✅ [VOICE-REGISTER] Successfully registered user ${userKey} in meeting ${meeting_id}`);
            } catch (error) {
                console.error('[VOICE-REGISTER] Error:', error);
                client.emit('voice-meeting-error', { 
                    message: 'Failed to register for voice meeting',
                    error: error.message 
                });
            }
        });
        
        client.on('unregister-voice-meeting', (data) => {
            console.log(`🎤 [VOICE-UNREGISTER] Voice meeting unregistration from ${client.id}:`, {
                channelId: data.channel_id,
                userId: client.data?.user_id,
                username: client.data?.username
            });
            
            if (!client.data?.authenticated) {
                console.warn('⚠️ [VOICE-UNREGISTER] Proceeding without authentication');
            }
            handleUnregisterVoiceMeeting(io, client, data);
        });
        
        client.on('get-online-users', () => {
            console.log(`👥 [USERS] Online users request from ${client.id}`);
            handleGetOnlineUsers(io, client);
        });
        
        client.on('debug-rooms', () => {
            console.log(`🔍 [DEBUG] Debug rooms request from ${client.id}`);
            handleDebugRooms(io, client);
        });
        
        client.on('heartbeat', () => {
            console.log(`💓 [HEARTBEAT] Heartbeat from ${client.id}`);
            client.emit('heartbeat-response', { time: Date.now() });
        });
        
        client.on('diagnostic-ping', (data) => {
            console.log(`🏓 [DIAGNOSTIC] Diagnostic ping from ${client.id}:`, data);
            client.emit('diagnostic-pong', { clientTime: data.startTime, serverTime: Date.now() });
        });

        client.on('debug-broadcast-test', (data) => {
            console.log(`🧪 [DEBUG-BROADCAST] Broadcast test from ${client.id}:`, data);
            const room = roomManager.getChannelRoom(data.room);
            if (room) {
                console.log(`📡 [DEBUG-BROADCAST] Broadcasting test message to room: ${room}`);
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
            console.log(`🤖 [BOT-INIT] Bot initialization request from ${client.id}:`, data);
            handleBotInit(io, client, data);
        });

        client.on('bot-join-channel', (data) => {
            console.log(`🤖 [BOT-JOIN] Bot join channel request from ${client.id}:`, data);
            handleBotJoinChannel(io, client, data);
        });

        client.on('titibot-command', (data) => {
            console.log(`🤖 [TITIBOT-CMD] TitiBot command from ${client.id}:`, data);
            handleTitiBotCommand(io, client, data);
        });

        client.on('join-tic-tac-toe', (data) => {
            console.log(`🎯 [TIC-TAC-TOE] Join game request from ${client.id}:`, data);
            ActivityHandler.handleTicTacToeJoin(io, client, data);
        });

        client.on('tic-tac-toe-ready', (data) => {
            console.log(`🎯 [TIC-TAC-TOE] Ready state change from ${client.id}:`, data);
            ActivityHandler.handleTicTacToeReady(io, client, data);
        });

        client.on('tic-tac-toe-move', (data) => {
            console.log(`🎯 [TIC-TAC-TOE] Move from ${client.id}:`, data);
            ActivityHandler.handleTicTacToeMove(io, client, data);
        });

        client.on('leave-tic-tac-toe', (data) => {
            console.log(`🎯 [TIC-TAC-TOE] Leave game from ${client.id}:`, data);
            ActivityHandler.handleTicTacToeLeave(io, client, data);
        });

        client.on('tic-tac-toe-play-again-request', (data) => {
            console.log(`🎯 [TIC-TAC-TOE] Play again request from ${client.id}:`, data);
            ActivityHandler.handleTicTacToePlayAgainRequest(io, client, data);
        });

        client.on('tic-tac-toe-play-again-response', (data) => {
            console.log(`🎯 [TIC-TAC-TOE] Play again response from ${client.id}:`, data);
            ActivityHandler.handleTicTacToePlayAgainResponse(io, client, data);
        });
        
        client.on('disconnect', () => {
            console.log(`❌ [DISCONNECT] Client disconnected: ${client.id}`);
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
        console.log(`📡 [PRESENCE] Broadcasting presence change for ${username}: ${previousPresence?.status || 'none'} -> ${status}`);
        
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
    console.log(`🎤 [VOICE-CHECK-HANDLER] Processing voice meeting check:`, {
        channelId: data.channel_id,
        userId: client.data?.user_id
    });
    
    const { channel_id } = data;
    if (!channel_id) {
        console.warn(`⚠️ [VOICE-CHECK-HANDLER] Channel ID is required`);
        client.emit('error', { message: 'Channel ID is required' });
        return;
    }

    const meeting = voiceMeetings.get(channel_id);
    if (meeting) {
        console.log(`✅ [VOICE-CHECK-HANDLER] Voice meeting found for channel ${channel_id}:`, {
            meetingId: meeting.meeting_id,
            participantCount: meeting.participants.size
        });
        client.emit('voice-meeting-status', {
            channel_id,
            has_meeting: true,
            meeting_id: meeting.meeting_id,
            participant_count: meeting.participants.size
        });
    } else {
        console.log(`📭 [VOICE-CHECK-HANDLER] No voice meeting found for channel ${channel_id}`);
        client.emit('voice-meeting-status', {
            channel_id,
            has_meeting: false,
            participant_count: 0
        });
    }
}

function handleUnregisterVoiceMeeting(io, client, data) {
    console.log(`🎤 [VOICE-UNREGISTER-HANDLER] Processing voice meeting unregistration:`, {
        channelId: data.channel_id,
        userId: client.data?.user_id,
        username: client.data?.username
    });
    
    const { channel_id } = data;
    const user_id = client.data?.user_id;
    const username = client.data?.username;
    
    if (!channel_id) {
        console.warn(`⚠️ [VOICE-UNREGISTER-HANDLER] Channel ID is required`);
        client.emit('error', { message: 'Channel ID is required' });
        return;
    }

    const meeting = voiceMeetings.get(channel_id);
    if (meeting) {
        if (!meeting.participants.has(client.id)) {
            console.log(`⚠️ [VOICE-UNREGISTER-HANDLER] Client ${client.id} not found in voice meeting for channel ${channel_id}`);
            return;
        }
        
        meeting.participants.delete(client.id);
        console.log(`👤 [VOICE-UNREGISTER-HANDLER] Removed participant ${client.id} from voice meeting in channel ${channel_id}`);
        
        if (user_id) {
            const currentPresence = userService.getPresence(user_id);
            if (currentPresence && currentPresence.activity_details?.type === 'In Voice Call') {
                userService.updatePresence(user_id, 'online', { type: 'idle' });
                io.emit('user-presence-update', {
                    user_id: user_id,
                    username: username,
                    status: 'online',
                    activity_details: { type: 'idle' }
                });
            }
            
            VoiceConnectionTracker.removeUserFromVoice(user_id);
            console.log(`🔇 [VOICE-UNREGISTER-HANDLER] Removed user ${user_id} from voice connection tracker`);
            
            client.leave(`voice-channel-${channel_id}`);
            console.log(`🚪 [VOICE-UNREGISTER-HANDLER] User ${user_id} left voice channel room: voice-channel-${channel_id}`);
            
            const titiBotId = BotHandler.getTitiBotId();
            if (titiBotId && meeting.participants.size === 0) {
                BotHandler.removeBotFromVoiceChannel(io, titiBotId, channel_id);
                console.log(`🤖 [VOICE-UNREGISTER-HANDLER] Removed bot from voice channel ${channel_id}`);
            }
        }
        
        const participantCount = meeting.participants.size;
        
        if (participantCount === 0) {
            voiceMeetings.delete(channel_id);
            console.log(`🗑️ [VOICE-UNREGISTER-HANDLER] Removed empty voice meeting for channel ${channel_id}`);
        }
        
        console.log(`📡 [VOICE-UNREGISTER-HANDLER] Broadcasting voice meeting update for channel ${channel_id}, participants: ${participantCount}`);
        
        io.emit('voice-meeting-update', {
            channel_id,
            meeting_id: meeting.meeting_id,
            participant_count: participantCount,
            action: 'leave',
            user_id: user_id,
            username: client.data?.username
        });
    } else {
        console.warn(`⚠️ [VOICE-UNREGISTER-HANDLER] No voice meeting found for channel ${channel_id}`);
    }
}

function handleDebugRooms(io, client) {
    console.log(`🔍 [DEBUG-ROOMS-HANDLER] Processing debug rooms request from ${client.id}`);
    
    const roomInfo = {
        clientId: client.id,
        userId: client.data?.user_id,
        username: client.data?.username,
        authenticated: client.data?.authenticated,
        rooms: Array.from(client.rooms),
        totalSockets: io.sockets.sockets.size,
        voiceMeetings: Array.from(voiceMeetings.keys())
    };
    
    console.log(`📊 [DEBUG-ROOMS-HANDLER] Room info for client ${client.id}:`, roomInfo);
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
        
        console.log(`🔌 [DISCONNECT] User ${username} (${user_id}) disconnected, socket: ${client.id}`);
        
        if (userOffline) {
            console.log(`⏰ [DISCONNECT] User ${username} has no more active sockets, letting presence system handle offline status`);
        } else {
            console.log(`🔌 [DISCONNECT] User ${username} still has other active sockets, keeping online`);
        }
        
        let voiceMeetingsUpdated = [];
        for (const [channel_id, meeting] of voiceMeetings.entries()) {
            if (meeting.participants.has(client.id)) {
                meeting.participants.delete(client.id);
                
                VoiceConnectionTracker.removeUserFromVoice(user_id);
                
                const titiBotId = BotHandler.getTitiBotId();
                if (titiBotId) {
                    BotHandler.removeBotFromVoiceChannel(io, titiBotId, channel_id);
                }
                
                if (meeting.participants.size === 0) {
                    voiceMeetings.delete(channel_id);
                }
                
                voiceMeetingsUpdated.push({
                    channel_id,
                    meeting_id: meeting.meeting_id,
                    participant_count: meeting.participants.size
                });
            }
        }
        
        voiceMeetingsUpdated.forEach(update => {
            io.emit('voice-meeting-update', {
                ...update,
                action: 'leave'
            });
        });
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
        console.log(`✅ [BOT-INIT-HANDLER] Bot ${username} initialized successfully`);
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
            console.log(`✅ [BOT-JOIN-HANDLER] Bot ${bot_id} joined channel ${channel_id}`);
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

function handleTitiBotCommand(io, client, data) {
    console.log(`🤖 [TITIBOT-CMD-HANDLER] Processing TitiBot command:`, {
        command: data.command,
        channelId: data.channel_id,
        serverId: data.server_id,
        userId: data.user_id,
        username: data.username,
        requestingUser: client.data?.user_id
    });
    
    if (!client.data?.authenticated) {
        console.warn('⚠️ [TITIBOT-CMD-HANDLER] Proceeding without authentication');
    }
    
    const { command, channel_id, server_id, user_id, username } = data;
    
    if (!command || !channel_id || !user_id || !username) {
        console.warn('⚠️ [TITIBOT-CMD-HANDLER] Missing required fields');
        client.emit('titibot-command-error', { message: 'Missing required command data' });
        return;
    }
    
    try {
        BotHandler.handleCommand(io, data);
        console.log(`✅ [TITIBOT-CMD-HANDLER] Command forwarded to BotHandler: ${command}`);
    } catch (error) {
        console.error(`❌ [TITIBOT-CMD-HANDLER] Error processing command:`, error);
        client.emit('titibot-command-error', { message: 'Failed to process command' });
    }
}

module.exports = { setup };
