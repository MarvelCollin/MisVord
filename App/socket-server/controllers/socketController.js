const AuthHandler = require('../handlers/authHandler');
const RoomHandler = require('../handlers/roomHandler');
const MessageHandler = require('../handlers/messageHandler');
const BotHandler = require('../handlers/botHandler');
const roomManager = require('../services/roomManager');
const userService = require('../services/userService');
const messageService = require('../services/messageService');

const userSockets = new Map();
const userStatus = new Map();
const recentMessages = new Map();
const voiceMeetings = new Map();

function setup(io) {
    io.on('connection', (client) => {
        console.log(`🔌 [CONNECTION] Client connected: ${client.id}`);
        
        client.on('authenticate', (data) => {
            console.log(`🔐 [AUTH] Authentication request from ${client.id}:`, data);
            AuthHandler.handle(io, client, data);
        });
        
        client.on('join-room', (data) => {
            console.log(`🚪 [ROOM] Client ${client.id} joining room:`, data);
            if (data.room_type === 'channel' && data.room_id) {
                const roomName = `channel-${data.room_id}`;
                roomManager.joinRoom(client, roomName);
                client.emit('room-joined', { room_id: roomName, room_type: 'channel' });
                console.log(`✅ [ROOM] Client ${client.id} joined channel room: ${roomName}`);
            } else if (data.room_type === 'dm' && data.room_id) {
                const roomName = data.room_id.startsWith('dm-room-') ? data.room_id : `dm-room-${data.room_id}`;
                roomManager.joinRoom(client, roomName);
                client.emit('room-joined', { room_id: roomName, room_type: 'dm' });
                console.log(`✅ [ROOM] Client ${client.id} joined DM room: ${roomName}`);
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
                content: data.content?.substring(0, 50) + (data.content?.length > 50 ? '...' : ''),
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
                
                console.log(`✅ [MESSAGE-CHANNEL] Processing new channel message for channel ${channel_id}`);
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
                content: data.content?.substring(0, 50) + (data.content?.length > 50 ? '...' : ''),
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
                
                // Ensure the message has an ID
                if (!data.id && data.message_id) {
                    data.id = data.message_id;
                }
                
                console.log(`✅ [MESSAGE-DM] Processing new DM message for room ${room_id}`);
                MessageHandler.forwardMessage(io, client, 'user-message-dm', data);
            } else {
                console.log(`🔄 [MESSAGE-DM] Duplicate message detected, skipping: ${messageId}`);
            }
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
        
        client.on('register-voice-meeting', (data) => {
            console.log(`🎤 [VOICE-REGISTER] Voice meeting registration from ${client.id}:`, {
                channelId: data.channel_id,
                meetingId: data.meeting_id,
                userId: client.data?.user_id,
                username: client.data?.username
            });
            
            if (!client.data?.authenticated) {
                console.warn('⚠️ [VOICE-REGISTER] Rejecting voice meeting registration from unauthenticated client');
                return;
            }
            handleRegisterVoiceMeeting(io, client, data);
        });
        
        client.on('unregister-voice-meeting', (data) => {
            console.log(`🎤 [VOICE-UNREGISTER] Voice meeting unregistration from ${client.id}:`, {
                channelId: data.channel_id,
                userId: client.data?.user_id,
                username: client.data?.username
            });
            
            if (!client.data?.authenticated) {
                console.warn('⚠️ [VOICE-UNREGISTER] Rejecting voice meeting unregistration from unauthenticated client');
                return;
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
        
        client.on('disconnect', () => {
            console.log(`❌ [DISCONNECT] Client disconnected: ${client.id}`);
            handleDisconnect(io, client);
        });
    });
}

function handlePresence(io, client, data) {
    console.log(`👤 [PRESENCE-HANDLER] Processing presence update:`, {
        userId: client.data?.user_id,
        username: client.data?.username,
        status: data.status,
        activityDetails: data.activity_details
    });
    
    const { status, activity_details } = data;
    const user_id = client.data.user_id;
    const username = client.data.username;
    
    userService.updatePresence(user_id, status, activity_details);
    
    console.log(`📡 [PRESENCE-HANDLER] Broadcasting presence update for user ${user_id}`);
    io.emit('user-presence-update', {
        user_id,
        username,
        status,
        activity_details
    });
}

function handleGetOnlineUsers(io, client) {
    console.log(`👥 [USERS-HANDLER] Processing online users request from ${client.id}`);
    
    const onlineUsers = {};
    
    for (const [socketId, socket] of io.sockets.sockets.entries()) {
        if (socket.data?.user_id && socket.data?.authenticated) {
            const user_id = socket.data.user_id;
            const presence = userService.getPresence(user_id);
            
            onlineUsers[user_id] = {
                user_id,
                username: socket.data.username || 'Unknown',
                status: presence?.status || 'online',
                last_seen: Date.now()
            };
        }
    }
    
    console.log(`✅ [USERS-HANDLER] Sending ${Object.keys(onlineUsers).length} online users to client ${client.id}`);
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

function handleRegisterVoiceMeeting(io, client, data) {
    console.log(`🎤 [VOICE-REGISTER-HANDLER] Processing voice meeting registration:`, {
        channelId: data.channel_id,
        meetingId: data.meeting_id,
        userId: client.data?.user_id,
        username: client.data?.username
    });
    
    const { channel_id, meeting_id } = data;
    
    if (!channel_id || !meeting_id) {
        console.warn(`⚠️ [VOICE-REGISTER-HANDLER] Channel ID and Meeting ID are required`);
        client.emit('error', { message: 'Channel ID and Meeting ID are required' });
        return;
    }

    if (!voiceMeetings.has(channel_id)) {
        voiceMeetings.set(channel_id, {
            meeting_id,
            channel_id,
            participants: new Set()
        });
        console.log(`✅ [VOICE-REGISTER-HANDLER] Created new voice meeting for channel ${channel_id}`);
    }

    voiceMeetings.get(channel_id).participants.add(client.id);
    console.log(`👤 [VOICE-REGISTER-HANDLER] Added participant ${client.id} to voice meeting in channel ${channel_id}`);
    
    const participantCount = voiceMeetings.get(channel_id).participants.size;
    console.log(`📡 [VOICE-REGISTER-HANDLER] Broadcasting voice meeting update for channel ${channel_id}, participants: ${participantCount}`);
    
    io.emit('voice-meeting-update', {
        channel_id,
        meeting_id,
        participant_count: participantCount,
        action: 'join'
    });
}

function handleUnregisterVoiceMeeting(io, client, data) {
    console.log(`🎤 [VOICE-UNREGISTER-HANDLER] Processing voice meeting unregistration:`, {
        channelId: data.channel_id,
        userId: client.data?.user_id,
        username: client.data?.username
    });
    
    const { channel_id } = data;
    
    if (!channel_id) {
        console.warn(`⚠️ [VOICE-UNREGISTER-HANDLER] Channel ID is required`);
        client.emit('error', { message: 'Channel ID is required' });
        return;
    }

    const meeting = voiceMeetings.get(channel_id);
    if (meeting) {
        meeting.participants.delete(client.id);
        console.log(`👤 [VOICE-UNREGISTER-HANDLER] Removed participant ${client.id} from voice meeting in channel ${channel_id}`);
        
        if (meeting.participants.size === 0) {
            voiceMeetings.delete(channel_id);
            console.log(`🗑️ [VOICE-UNREGISTER-HANDLER] Removed empty voice meeting for channel ${channel_id}`);
        }
        
        const participantCount = meeting.participants.size;
        console.log(`📡 [VOICE-UNREGISTER-HANDLER] Broadcasting voice meeting update for channel ${channel_id}, participants: ${participantCount}`);
        
        io.emit('voice-meeting-update', {
            channel_id,
            meeting_id: meeting.meeting_id,
            participant_count: participantCount,
            action: 'leave'
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
    console.log(`❌ [DISCONNECT-HANDLER] Processing disconnect for client ${client.id}`);
    
    if (client.data?.user_id) {
        const user_id = client.data.user_id;
        const username = client.data.username;
        
        console.log(`👤 [DISCONNECT-HANDLER] User disconnecting:`, {
            userId: user_id,
            username: username,
            socketId: client.id
        });
        
        userSockets.delete(client.id);
        
        // Clean up voice meetings
        let voiceMeetingsUpdated = [];
        for (const [channel_id, meeting] of voiceMeetings.entries()) {
            if (meeting.participants.has(client.id)) {
                meeting.participants.delete(client.id);
                console.log(`🎤 [DISCONNECT-HANDLER] Removed ${client.id} from voice meeting in channel ${channel_id}`);
                
                if (meeting.participants.size === 0) {
                    voiceMeetings.delete(channel_id);
                    console.log(`🗑️ [DISCONNECT-HANDLER] Removed empty voice meeting for channel ${channel_id}`);
                }
                
                voiceMeetingsUpdated.push({
                    channel_id,
                    meeting_id: meeting.meeting_id,
                    participant_count: meeting.participants.size
                });
            }
        }
        
        // Broadcast voice meeting updates
        voiceMeetingsUpdated.forEach(update => {
            console.log(`📡 [DISCONNECT-HANDLER] Broadcasting voice meeting update for channel ${update.channel_id}`);
            io.emit('voice-meeting-update', {
                ...update,
                action: 'leave'
            });
        });
        
        console.log(`✅ [DISCONNECT-HANDLER] Cleanup completed for user ${user_id}`);
    } else {
        console.log(`❓ [DISCONNECT-HANDLER] Unauthenticated client disconnected: ${client.id}`);
    }
}

function handleBotInit(io, client, data) {
    console.log(`🤖 [BOT-INIT-HANDLER] Processing bot initialization:`, {
        botId: data.bot_id,
        username: data.username,
        requestingUser: client.data?.user_id
    });
    
    if (!client.data?.authenticated) {
        console.warn('⚠️ [BOT-INIT-HANDLER] Rejecting bot init from unauthenticated client');
        client.emit('bot-init-error', { message: 'Authentication required' });
        return;
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
        console.warn('⚠️ [BOT-JOIN-HANDLER] Rejecting bot join from unauthenticated client');
        client.emit('bot-join-error', { message: 'Authentication required' });
        return;
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
        console.warn('⚠️ [TITIBOT-CMD-HANDLER] Rejecting command from unauthenticated client');
        client.emit('titibot-command-error', { message: 'Authentication required' });
        return;
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
