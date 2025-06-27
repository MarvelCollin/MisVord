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
            
            const signature = messageService.generateSignature('new-channel-message', client.data?.user_id, data.id, data.content, data.timestamp);
            if (!messageService.isDuplicate(signature)) {
                messageService.markAsProcessed(signature);
                const channel_id = data.channel_id;
                if (!channel_id) {
                    console.warn('Channel message missing channel_id:', data);
                    return;
                }
                data.channel_id = channel_id;
                data.user_id = data.user_id || client.data.user_id;
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
            
            const signature = messageService.generateSignature('user-message-dm', client.data?.user_id, data.id, data.content, data.timestamp);
            if (!messageService.isDuplicate(signature)) {
                messageService.markAsProcessed(signature);
                const room_id = data.room_id;
                if (!room_id) {
                    console.warn('DM message missing room_id:', data);
                    return;
                }
                data.room_id = room_id;
                data.user_id = data.user_id || client.data.user_id;
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
            data.user_id = data.user_id || client.data.user_id;
            data.username = data.username || client.data.username;
            MessageHandler.forwardMessage(io, client, 'message-updated', data);
        });
        
        client.on('message-deleted', (data) => {
            if (!AuthHandler.requireAuth(client)) return;
            
            if (!data.message_id) {
                console.warn('Message deletion missing message_id:', data);
                return;
            }
            data.user_id = data.user_id || client.data.user_id;
            data.username = data.username || client.data.username;
            MessageHandler.forwardMessage(io, client, 'message-deleted', data);
        });
        
        client.on('reaction-added', (data) => {
            if (!AuthHandler.requireAuth(client)) return;
            
            if (data.source !== 'server-originated') {
                console.warn('Rejecting client-originated reaction, should come from server:', data);
                return;
            }
            
            data.user_id = data.user_id || client.data.user_id;
            data.username = data.username || client.data.username;
            MessageHandler.handleReaction(io, client, 'reaction-added', data);
        });
        
        client.on('reaction-removed', (data) => {
            if (!AuthHandler.requireAuth(client)) return;
            
            if (data.source !== 'server-originated') {
                console.warn('Rejecting client-originated reaction, should come from server:', data);
                return;
            }
            
            data.user_id = data.user_id || client.data.user_id;
            data.username = data.username || client.data.username;
            MessageHandler.handleReaction(io, client, 'reaction-removed', data);
        });
        
        client.on('message-pinned', (data) => {
            if (!AuthHandler.requireAuth(client)) return;
            
            if (data.source !== 'server-originated') {
                console.warn('Rejecting client-originated pin event, should come from server:', data);
                return;
            }
            
            data.user_id = data.user_id || client.data.user_id;
            data.username = data.username || client.data.username;
            MessageHandler.handlePin(io, client, 'message-pinned', data);
        });
        
        client.on('message-unpinned', (data) => {
            if (!AuthHandler.requireAuth(client)) return;
            
            if (data.source !== 'server-originated') {
                console.warn('Rejecting client-originated pin event, should come from server:', data);
                return;
            }
            
            data.user_id = data.user_id || client.data.user_id;
            data.username = data.username || client.data.username;
            MessageHandler.handlePin(io, client, 'message-unpinned', data);
        });
        
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
    
    const { status, activity_details } = data;
    const user_id = client.data.user_id;
    const username = client.data.username;
    
    userService.updatePresence(user_id, status, activity_details);
    
    io.emit('user-presence-update', {
        user_id,
        username,
        status,
        activity_details
    });
}

function handleGetOnlineUsers(io, client) {
    if (!AuthHandler.requireAuth(client)) {
        client.emit('error', { message: 'Authentication required' });
        return;
    }
    
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
    
    client.emit('online-users-response', { users: onlineUsers });
    console.log(`Sent ${Object.keys(onlineUsers).length} online users to client ${client.id}`);
}

function handleCheckVoiceMeeting(io, client, data) {
    if (!AuthHandler.requireAuth(client)) {
        client.emit('error', { message: 'Authentication required' });
        return;
    }
    
    const { channel_id } = data;
    if (!channel_id) {
        client.emit('error', { message: 'Channel ID is required' });
        return;
    }
    
    const meeting = roomManager.getVoiceMeeting(channel_id);
    
    client.emit('voice-meeting-info', {
        channel_id,
        meeting_id: meeting?.meeting_id || null,
        participant_count: meeting?.participants.size || 0
    });
}

function handleRegisterVoiceMeeting(io, client, data) {
    if (!AuthHandler.requireAuth(client)) {
        client.emit('error', { message: 'Authentication required' });
        return;
    }
    
    const { channel_id, meeting_id, username } = data;
    if (!channel_id || !meeting_id) {
        client.emit('error', { message: 'Channel ID and Meeting ID are required' });
        return;
    }
    
    roomManager.addVoiceMeeting(channel_id, meeting_id, client.id);
    
    const roomName = roomManager.getChannelRoom(channel_id);
    roomManager.broadcastToRoom(io, roomName, 'voice-participant-joined', {
        channel_id,
        meeting_id,
        username: username || client.data.username,
        user_id: client.data.user_id,
        participant_count: roomManager.getVoiceMeeting(channel_id).participants.size
    });
}

function handleUnregisterVoiceMeeting(io, client, data) {
    if (!AuthHandler.requireAuth(client)) {
        client.emit('error', { message: 'Authentication required' });
        return;
    }
    
    const { channel_id, meeting_id, username } = data;
    if (!channel_id || !meeting_id) {
        client.emit('error', { message: 'Channel ID and Meeting ID are required' });
        return;
    }
    
    const result = roomManager.removeVoiceMeeting(channel_id, client.id);
    
    const roomName = roomManager.getChannelRoom(channel_id);
    roomManager.broadcastToRoom(io, roomName, 'voice-participant-left', {
        channel_id,
        meeting_id,
        username: username || client.data.username,
        user_id: client.data.user_id,
        participant_count: result.participant_count
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
        your_socket_id: client.id,
        your_user_id: client.data.user_id,
        your_rooms: clientRooms,
        all_rooms: roomData
    });
}

function handleDisconnect(io, client) {
    const user_id = client.data?.user_id;
    console.log(`Client disconnected: ${client.id}, User: ${user_id}`);
    
    if (user_id) {
        const isOffline = roomManager.removeUserSocket(user_id, client.id);
        
        if (isOffline) {
            userService.removePresence(user_id);
            io.emit('user-offline', {
                user_id,
                username: client.data.username,
                timestamp: Date.now()
            });
        }
        
        const allMeetings = roomManager.getAllVoiceMeetings();
        for (const meeting of allMeetings) {
            const result = roomManager.removeVoiceMeeting(meeting.channel_id, client.id);
            if (result.removed || result.participant_count !== meeting.participant_count) {
                const roomName = roomManager.getChannelRoom(meeting.channel_id);
                roomManager.broadcastToRoom(io, roomName, 'voice-participant-left', {
                    channel_id: meeting.channel_id,
                    meeting_id: meeting.meeting_id,
                    username: client.data?.username || 'Unknown',
                    user_id: client.data?.user_id,
                    participant_count: result.participant_count
                });
            }
        }
    }
}

module.exports = { setup };
