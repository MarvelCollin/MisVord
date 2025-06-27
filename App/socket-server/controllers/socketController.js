const AuthHandler = require('../handlers/authHandler');
const RoomHandler = require('../handlers/roomHandler');
const MessageHandler = require('../handlers/messageHandler');
const roomManager = require('../services/roomManager');
const userService = require('../services/userService');
const messageService = require('../services/messageService');

const userSockets = new Map();
const userStatus = new Map();
const recentMessages = new Map();
const voiceMeetings = new Map();

function setup(io) {
    io.on('connection', (client) => {
        console.log(`Client connected: ${client.id}`);
        
        client.on('authenticate', (data) => AuthHandler.handle(io, client, data));
        
        client.on('join-channel', (data) => RoomHandler.joinChannel(io, client, data));
        client.on('leave-channel', (data) => RoomHandler.leaveChannel(io, client, data));
        client.on('join-dm-room', (data) => RoomHandler.joinDMRoom(io, client, data));
        
        client.on('new-channel-message', (data) => {
            if (!AuthHandler.requireAuth(client)) return;
            
            if (data.source !== 'server-originated') {
                console.warn('Rejecting client-originated message, should come from server:', data);
                return;
            }
            
            const signature = messageService.generateSignature('new-channel-message', client.data?.userId, data.id, data.content, data.timestamp);
            if (!messageService.isDuplicate(signature)) {
                messageService.markAsProcessed(signature);
                if (!data.channelId && !data.channel_id) {
                    console.warn('Channel message missing channelId:', data);
                    return;
                }
                const channelId = data.channelId || data.channel_id;
                data.channelId = channelId;
                data.userId = data.userId || data.user_id || client.data.userId;
                data.username = data.username || client.data.username;
                MessageHandler.forwardMessage(io, client, 'new-channel-message', data);
            }
        });
        
        client.on('user-message-dm', (data) => {
            if (!AuthHandler.requireAuth(client)) return;
            
            if (data.source !== 'server-originated') {
                console.warn('Rejecting client-originated DM message, should come from server:', data);
                return;
            }
            
            const signature = messageService.generateSignature('user-message-dm', client.data?.userId, data.id, data.content, data.timestamp);
            if (!messageService.isDuplicate(signature)) {
                messageService.markAsProcessed(signature);
                if (!data.roomId && !data.chatRoomId) {
                    console.warn('DM message missing roomId:', data);
                    return;
                }
                const roomId = data.roomId || data.chatRoomId;
                data.roomId = roomId;
                data.userId = data.userId || data.user_id || client.data.userId;
                data.username = data.username || client.data.username;
                MessageHandler.forwardMessage(io, client, 'user-message-dm', data);
            }
        });
        
        client.on('message-updated', (data) => {
            if (!AuthHandler.requireAuth(client)) return;
            
            if (!data.message_id) {
                console.warn('Message update missing message_id:', data);
                return;
            }
            data.userId = data.userId || data.user_id || client.data.userId;
            data.username = data.username || client.data.username;
            MessageHandler.forwardMessage(io, client, 'message-updated', data);
        });
        
        client.on('message-deleted', (data) => {
            if (!AuthHandler.requireAuth(client)) return;
            
            if (!data.message_id) {
                console.warn('Message deletion missing message_id:', data);
                return;
            }
            data.userId = data.userId || data.user_id || client.data.userId;
            data.username = data.username || client.data.username;
            MessageHandler.forwardMessage(io, client, 'message-deleted', data);
        });
        
        client.on('reaction-added', (data) => MessageHandler.handleReaction(io, client, 'reaction-added', data));
        client.on('reaction-removed', (data) => MessageHandler.handleReaction(io, client, 'reaction-removed', data));
        
        client.on('message-pinned', (data) => MessageHandler.handlePin(io, client, 'message-pinned', data));
        client.on('message-unpinned', (data) => MessageHandler.handlePin(io, client, 'message-unpinned', data));
        
        client.on('typing', (data) => MessageHandler.handleTyping(io, client, data, true));
        client.on('stop-typing', (data) => MessageHandler.handleTyping(io, client, data, false));
        
        client.on('update-presence', (data) => handlePresence(io, client, data));
        
        client.on('check-voice-meeting', (data) => handleCheckVoiceMeeting(io, client, data));
        client.on('register-voice-meeting', (data) => handleRegisterVoiceMeeting(io, client, data));
        client.on('unregister-voice-meeting', (data) => handleUnregisterVoiceMeeting(io, client, data));
        
        client.on('get-online-users', () => handleGetOnlineUsers(io, client));
        client.on('debug-rooms', () => handleDebugRooms(io, client));
        client.on('heartbeat', () => client.emit('heartbeat-response', { time: Date.now() }));
        
        client.on('disconnect', () => handleDisconnect(io, client));
    });
}

function handlePresence(io, client, data) {
    if (!AuthHandler.requireAuth(client)) return;
    
    const { status, activityDetails } = data;
    const userId = client.data.userId;
    const username = client.data.username;
    
    userService.updatePresence(userId, status, activityDetails);
    
    io.emit('user-presence-update', {
        userId,
        username,
        status,
        activityDetails
    });
}

function handleGetOnlineUsers(io, client) {
    if (!AuthHandler.requireAuth(client)) {
        client.emit('error', { message: 'Authentication required' });
        return;
    }
    
    const onlineUsers = {};
    
    for (const [socketId, socket] of io.sockets.sockets.entries()) {
        if (socket.data?.userId && socket.data?.authenticated) {
            const userId = socket.data.userId;
            const presence = userService.getPresence(userId);
            
            onlineUsers[userId] = {
                userId,
                username: socket.data.username || 'Unknown',
                status: presence?.status || 'online',
                lastSeen: Date.now()
            };
        }
    }
    
    client.emit('online-users-response', { users: onlineUsers });
    console.log(`Sent ${Object.keys(onlineUsers).length} online users to client ${client.id}`);
}

function handleCheckVoiceMeeting(io, client, data) {
    if (!AuthHandler.requireAuth(client)) {
        client.emit('error', { message: 'Authentication required' });
        return;
    }
    
    const { channelId } = data;
    if (!channelId) {
        client.emit('error', { message: 'Channel ID is required' });
        return;
    }
    
    const meeting = roomManager.getVoiceMeeting(channelId);
    
    client.emit('voice-meeting-info', {
        channelId,
        meetingId: meeting?.meetingId || null,
        participantCount: meeting?.participants.size || 0
    });
}

function handleRegisterVoiceMeeting(io, client, data) {
    if (!AuthHandler.requireAuth(client)) {
        client.emit('error', { message: 'Authentication required' });
        return;
    }
    
    const { channelId, meetingId, username } = data;
    if (!channelId || !meetingId) {
        client.emit('error', { message: 'Channel ID and Meeting ID are required' });
        return;
    }
    
    roomManager.addVoiceMeeting(channelId, meetingId, client.id);
    
    const roomName = roomManager.getChannelRoom(channelId);
    roomManager.broadcastToRoom(io, roomName, 'voice-participant-joined', {
        channelId,
        meetingId,
        username: username || client.data.username,
        userId: client.data.userId,
        participantCount: roomManager.getVoiceMeeting(channelId).participants.size
    });
}

function handleUnregisterVoiceMeeting(io, client, data) {
    if (!AuthHandler.requireAuth(client)) {
        client.emit('error', { message: 'Authentication required' });
        return;
    }
    
    const { channelId, meetingId, username } = data;
    if (!channelId || !meetingId) {
        client.emit('error', { message: 'Channel ID and Meeting ID are required' });
        return;
    }
    
    const result = roomManager.removeVoiceMeeting(channelId, client.id);
    
    const roomName = roomManager.getChannelRoom(channelId);
    roomManager.broadcastToRoom(io, roomName, 'voice-participant-left', {
        channelId,
        meetingId,
        username: username || client.data.username,
        userId: client.data.userId,
        participantCount: result.participantCount
    });
}

function handleDebugRooms(io, client) {
    if (!AuthHandler.requireAuth(client)) {
        client.emit('error', { message: 'Authentication required' });
        return;
    }
    
    const clientRooms = Array.from(client.rooms).filter(room => room !== client.id);
    const roomData = {};
    
    if (io.sockets?.adapter?.rooms) {
        for (const [roomId, room] of io.sockets.adapter.rooms.entries()) {
            if (roomId.includes('channel-') || roomId.includes('dm-room-')) {
                roomData[roomId] = {
                    size: room.size,
                    sockets: Array.from(room)
                };
            }
        }
    }
    
    client.emit('debug-rooms-info', {
        yourSocketId: client.id,
        yourUserId: client.data.userId,
        yourRooms: clientRooms,
        allRooms: roomData
    });
}

function handleDisconnect(io, client) {
    const userId = client.data?.userId;
    console.log(`Client disconnected: ${client.id}, User: ${userId}`);
    
    if (userId) {
        const isOffline = roomManager.removeUserSocket(userId, client.id);
        
        if (isOffline) {
            userService.removePresence(userId);
            io.emit('user-offline', {
                userId,
                username: client.data.username,
                timestamp: Date.now()
            });
        }
        
        const allMeetings = roomManager.getAllVoiceMeetings();
        for (const meeting of allMeetings) {
            const result = roomManager.removeVoiceMeeting(meeting.channelId, client.id);
            if (result.removed || result.participantCount !== meeting.participantCount) {
                const roomName = roomManager.getChannelRoom(meeting.channelId);
                roomManager.broadcastToRoom(io, roomName, 'voice-participant-left', {
                    channelId: meeting.channelId,
                    meetingId: meeting.meetingId,
                    username: client.data?.username || 'Unknown',
                    userId: client.data?.userId,
                    participantCount: result.participantCount
                });
            }
        }
    }
}

module.exports = { setup };
