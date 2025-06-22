const eventController = require('./eventController');

const userSockets = new Map();
const userStatus = new Map();

function setup(io) {
    eventController.setIO(io);
    
    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);
        
        // Debug all incoming events
        const originalOnEvent = socket.onevent;
        socket.onevent = function(packet) {
            const args = packet.data || [];
            const eventName = args[0];
            console.log(`📥 RECEIVED EVENT: ${eventName}`, socket.id, args.length > 1 ? `args: ${JSON.stringify(args[1]).substring(0, 100)}...` : 'no args');
            originalOnEvent.call(this, packet);
        };
        
        socket.on('authenticate', (data) => handleAuthenticate(socket, data));
        socket.on('join-channel', (data) => handleJoinChannel(socket, data));
        socket.on('leave-channel', (data) => handleLeaveChannel(socket, data));
        socket.on('join-dm-room', (data) => handleJoinDMRoom(socket, data));
        socket.on('channel-message', (data) => handleChannelMessage(io, socket, data));
        socket.on('typing', (data) => handleTyping(socket, data, io));
        socket.on('stop-typing', (data) => handleStopTyping(socket, data, io));
        socket.on('update-presence', (data) => handleUpdatePresence(socket, data));
        
        // Direct socket events for messaging
        socket.on('new-channel-message', (data) => forwardEvent(socket, 'new-channel-message', data, `channel-${data.channelId}`, io));
        socket.on('user-message-dm', (data) => forwardEvent(socket, 'user-message-dm', data, `dm-room-${data.roomId}`, io));
        socket.on('message-updated', (data) => forwardEvent(socket, 'message-updated', data, getTargetRoom(data), io));
        socket.on('message-deleted', (data) => forwardEvent(socket, 'message-deleted', data, getTargetRoom(data), io));
        socket.on('reaction-added', (data) => forwardEvent(socket, 'reaction-added', data, null, io));
        socket.on('reaction-removed', (data) => forwardEvent(socket, 'reaction-removed', data, null, io));
        socket.on('message-pinned', (data) => forwardEvent(socket, 'message-pinned', data, null, io));
        
        socket.on('debug-rooms', () => handleDebugRooms(io, socket));
        socket.on('get-room-info', () => handleGetRoomInfo(io, socket));
        socket.on('heartbeat', () => socket.emit('heartbeat-response', { time: Date.now() }));
        
        socket.on('disconnect', () => handleDisconnect(io, socket));
    });
}

function handleAuthenticate(socket, data) {
    const { userId, username } = data;
    
    if (!userId) {
        socket.emit('auth-error', { message: 'User ID is required' });
        return;
    }
    
    socket.data.userId = userId;
    socket.data.username = username || `User-${userId}`;
    socket.data.authenticated = true;
    
    const userRoom = `user-${userId}`;
    socket.join(userRoom);
    
    if (userSockets.has(userId)) {
        userSockets.get(userId).add(socket.id);
    } else {
        userSockets.set(userId, new Set([socket.id]));
    }
    
    socket.emit('auth-success', { 
        userId, 
        socketId: socket.id,
        message: 'Authentication successful'
    });
    
    console.log(`User ${userId} (${username}) authenticated on socket ${socket.id}`);
}

function handleJoinChannel(socket, data) {
    if (!socket.data.authenticated) {
        socket.emit('error', { message: 'Authentication required' });
        return;
    }
    
    const channelId = data.channelId;
    if (!channelId) {
        socket.emit('error', { message: 'Channel ID is required' });
        return;
    }
    
    const room = `channel-${channelId}`;
    socket.join(room);
    
    socket.emit('channel-joined', { 
        channelId,
        room, 
        message: `Joined channel ${channelId}`
    });
    
    console.log(`User ${socket.data.userId} joined channel ${channelId}`);
}

function handleLeaveChannel(socket, data) {
    if (!data.channelId) {
        socket.emit('error', { message: 'Channel ID is required' });
        return;
    }
    
    const room = `channel-${data.channelId}`;
    socket.leave(room);
    
    socket.emit('channel-left', { 
        channelId: data.channelId,
        message: `Left channel ${data.channelId}`
    });
}

function handleJoinDMRoom(socket, data) {
    if (!socket.data.authenticated) {
        socket.emit('error', { message: 'Authentication required' });
        return;
    }
    
    const roomId = data.roomId;
    if (!roomId) {
        socket.emit('error', { message: 'Room ID is required' });
        return;
    }
    
    const room = `dm-room-${roomId}`;
    socket.join(room);
    
    socket.emit('dm-room-joined', { 
        roomId,
        room, 
        message: `Joined DM room ${roomId}`
    });
    
    console.log(`User ${socket.data.userId} joined DM room ${roomId}`);
}

function handleChannelMessage(io, socket, data) {
    if (!socket.data.authenticated) {
        socket.emit('error', { message: 'Authentication required' });
        return;
    }
    
    const { channelId, content, messageType = 'text' } = data;
    
    if (!channelId || !content) {
        socket.emit('error', { message: 'Channel ID and content are required' });
        return;
    }
    
    const room = `channel-${channelId}`;
    const message = {
        id: Date.now().toString(),
        content,
        messageType,
        userId: socket.data.userId,
        username: socket.data.username,
        timestamp: Date.now(),
    };
    
    // Emit to all clients in the room including the sender
    io.to(room).emit('new-channel-message', message);
    
    console.log(`📢 Sent channel message to ALL in room ${room} (including sender)`);
}

function handleTyping(socket, data, io) {
    if (!socket.data.authenticated) return;
    
    const { channelId, roomId } = data;
    const userId = socket.data.userId;
    const username = socket.data.username;
    
    if (channelId) {
        const room = `channel-${channelId}`;
        if (io) {
            io.to(room).emit('user-typing', { 
                userId, 
                username, 
                channelId 
            });
        } else if (socket.nsp) {
            socket.nsp.to(room).emit('user-typing', { 
                userId, 
                username, 
                channelId 
            });
        } else {
            socket.to(room).emit('user-typing', { 
                userId, 
                username, 
                channelId 
            });
        }
    } else if (roomId) {
        const room = `dm-room-${roomId}`;
        if (io) {
            io.to(room).emit('user-typing-dm', { 
                userId, 
                username, 
                roomId 
            });
        } else if (socket.nsp) {
            socket.nsp.to(room).emit('user-typing-dm', { 
                userId, 
                username, 
                roomId 
            });
        } else {
            socket.to(room).emit('user-typing-dm', { 
                userId, 
                username, 
                roomId 
            });
        }
    }
}

function handleStopTyping(socket, data, io) {
    if (!socket.data.authenticated) return;
    
    const { channelId, roomId } = data;
    const userId = socket.data.userId;
    const username = socket.data.username;
    
    if (channelId) {
        const room = `channel-${channelId}`;
        if (io) {
            io.to(room).emit('user-stop-typing', { 
                userId, 
                username, 
                channelId 
            });
        } else if (socket.nsp) {
            socket.nsp.to(room).emit('user-stop-typing', { 
                userId, 
                username, 
                channelId 
            });
        } else {
            socket.to(room).emit('user-stop-typing', { 
                userId, 
                username, 
                channelId 
            });
        }
    } else if (roomId) {
        const room = `dm-room-${roomId}`;
        if (io) {
            io.to(room).emit('user-stop-typing-dm', { 
                userId, 
                username, 
                roomId 
            });
        } else if (socket.nsp) {
            socket.nsp.to(room).emit('user-stop-typing-dm', { 
                userId, 
                username, 
                roomId 
            });
        } else {
            socket.to(room).emit('user-stop-typing-dm', { 
                userId, 
                username, 
                roomId 
            });
        }
    }
}

function handleUpdatePresence(socket, data) {
    if (!socket.data.authenticated || !socket.data.userId) return;
    
    const { status, activityDetails } = data;
    const userId = socket.data.userId;
    
    socket.data.status = status;
    socket.data.activityDetails = activityDetails;
    
    userStatus.set(userId, { 
        status, 
        activityDetails, 
        lastUpdated: Date.now() 
    });
    
    socket.broadcast.emit('user-presence-update', {
        userId,
        username: socket.data.username,
        status,
        activityDetails
    });
}

function handleDisconnect(io, socket) {
    const userId = socket.data.userId;
    
    console.log(`Socket disconnected: ${socket.id}, User: ${userId}`);
    
    if (userId && userSockets.has(userId)) {
        userSockets.get(userId).delete(socket.id);
        
        if (userSockets.get(userId).size === 0) {
            userSockets.delete(userId);
            
            io.emit('user-offline', {
                userId,
                username: socket.data.username,
                timestamp: Date.now()
            });
        }
    }
}

function handleDebugRooms(io, socket) {
    if (!socket.data.authenticated) {
        socket.emit('error', { message: 'Authentication required' });
        return;
    }
    
    const socketRooms = Array.from(socket.rooms).filter(room => room !== socket.id);
    
    const roomData = {};
    if (io.sockets && io.sockets.adapter && io.sockets.adapter.rooms) {
        for (const [roomId, room] of io.sockets.adapter.rooms.entries()) {
            if (roomId.includes('channel-') || roomId.includes('dm-room-')) {
                roomData[roomId] = {
                    size: room.size,
                    sockets: Array.from(room)
                };
            }
        }
    }
    
    socket.emit('debug-rooms-info', {
        yourSocketId: socket.id,
        yourUserId: socket.data.userId,
        yourRooms: socketRooms,
        allRooms: roomData
    });
}

function handleGetRoomInfo(io, socket) {
    if (!socket.data.authenticated) {
        socket.emit('error', { message: 'Authentication required' });
        return;
    }
    
    const socketRooms = Array.from(socket.rooms).filter(room => room !== socket.id);
    
    socket.emit('room-info', {
        rooms: socketRooms
    });
}

function forwardEvent(socket, eventName, data, specificRoom = null, io) {
    if (!socket.data.authenticated) {
        socket.emit('error', { message: 'Authentication required' });
        return;
    }
    
    // Figure out the target room if not specified
    if (!specificRoom) {
        specificRoom = getTargetRoom(data);
    }
    
    // Basic event logging
    console.log(`Forwarding event ${eventName}${specificRoom ? ' to room: ' + specificRoom : ''}`);
    
    // Get username from debug data or from socket data
    const username = data._debug?.emittedBy || socket.data.username || 'Unknown';
    const userId = socket.data.userId || data.user_id || data.userId || 'unknown';
    const source = data._debug?.type || 'direct-socket';
    
    // Detailed message logging based on event type
    if (eventName === 'new-channel-message') {
        const channelId = data.channelId || data.channel_id;
        console.log(`👤 ${username} (${userId}) chat in channel ${channelId} : "${data.content}"`);
    } else if (eventName === 'user-message-dm') {
        const roomId = data.roomId || data.chatRoomId || data.room_id;
        console.log(`👤 ${username} (${userId}) chat in room ${roomId} : "${data.content}"`);
    } else if (eventName === 'message-updated') {
        const targetType = data.target_type || 'unknown';
        const roomId = data.target_id || data.roomId || data.channelId;
        console.log(`👤 ${username} (${userId}) edited message in ${targetType} ${roomId} : "${data.message?.content || data.content || 'unknown content'}"`);
    } else if (eventName === 'message-deleted') {
        const targetType = data.target_type || 'unknown';
        const roomId = data.target_id || data.roomId || data.channelId;
        console.log(`👤 ${username} (${userId}) deleted message ${data.message_id} in ${targetType} ${roomId}`);
    } else if (eventName === 'reaction-added' || eventName === 'reaction-removed') {
        console.log(`👤 ${username} (${userId}) ${eventName.replace('-', ' ')} ${data.emoji} to message ${data.message_id}`);
    }
    
    // Add debug info to track message flow
    const enhancedData = {
        ...data,
        _serverDebug: {
            timestamp: new Date().toISOString(),
            emittedTo: specificRoom || 'all',
            emittedBy: username,
            userId: userId,
            socketId: socket.id,
            includingSender: true
        }
    };
    
    // Remove client debug properties before forwarding
    if (enhancedData._debug) {
        delete enhancedData._debug;
    }
    
    // Forward the event
    if (specificRoom) {
        // Use io.to to send to all clients in the room including the sender
        if (io) {
            io.to(specificRoom).emit(eventName, enhancedData);
            
            // Log room size for debugging
            const roomSize = socket.adapter.rooms && socket.adapter.rooms.get(specificRoom)?.size || 0;
            console.log(`📢 Sent to ALL in room ${specificRoom} (${roomSize} clients connected, including sender)`);
        } else {
            // Fallback if io is not available
            socket.to(specificRoom).emit(eventName, enhancedData);
            socket.emit(eventName, enhancedData);
            console.log(`📢 Sent to room ${specificRoom} (including sender via direct emit)`);
        }
    } else {
        // Broadcast to everyone including the sender
        if (io) {
            io.emit(eventName, enhancedData);
            console.log(`📢 Broadcasted to all clients including sender`);
        } else {
            // Fallback
            socket.broadcast.emit(eventName, enhancedData);
            socket.emit(eventName, enhancedData);
            console.log(`📢 Broadcasted to all clients (including sender via direct emit)`);
        }
    }
}

function getTargetRoom(data) {
    // Handle channel type messages
    if (data.target_type === 'channel' && data.target_id) {
        return `channel-${data.target_id}`;
    }
    // Handle DM/direct type messages - normalize to 'dm'
    else if ((data.target_type === 'dm' || data.target_type === 'direct') && data.target_id) {
        return `dm-room-${data.target_id}`;
    }
    // Handle legacy direct format with roomId
    else if (data.roomId) {
        return `dm-room-${data.roomId}`;
    }
    // Handle legacy channel format with channelId
    else if (data.channelId) {
        return `channel-${data.channelId}`;
    }
    // Handle less common key formats
    else if (data.chatRoomId) {
        return `dm-room-${data.chatRoomId}`;
    }
    else if (data.channel_id) {
        return `channel-${data.channel_id}`;
    }
    
    // If no room identifier found, return null
    return null;
}

module.exports = {
    setup
};
