const eventController = require('./eventController');

const userSockets = new Map();
const userStatus = new Map();

function setup(io) {
    eventController.setIO(io);
    
    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);
        
        socket.on('authenticate', (data) => handleAuthenticate(socket, data));
        socket.on('join-channel', (data) => handleJoinChannel(socket, data));
        socket.on('leave-channel', (data) => handleLeaveChannel(socket, data));
        socket.on('join-dm-room', (data) => handleJoinDMRoom(socket, data));
        socket.on('channel-message', (data) => handleChannelMessage(io, socket, data));
        socket.on('typing', (data) => handleTyping(socket, data));
        socket.on('stop-typing', (data) => handleStopTyping(socket, data));
        socket.on('update-presence', (data) => handleUpdatePresence(socket, data));
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
    
    io.to(room).emit('new-channel-message', message);
}

function handleTyping(socket, data) {
    if (!socket.data.authenticated) return;
    
    const { channelId, roomId } = data;
    const userId = socket.data.userId;
    const username = socket.data.username;
    
    if (channelId) {
        const room = `channel-${channelId}`;
        socket.to(room).emit('user-typing', { 
            userId, 
            username, 
            channelId 
        });
    } else if (roomId) {
        const room = `dm-room-${roomId}`;
        socket.to(room).emit('user-typing-dm', { 
            userId, 
            username, 
            roomId 
        });
    }
}

function handleStopTyping(socket, data) {
    if (!socket.data.authenticated) return;
    
    const { channelId, roomId } = data;
    const userId = socket.data.userId;
    const username = socket.data.username;
    
    if (channelId) {
        const room = `channel-${channelId}`;
        socket.to(room).emit('user-stop-typing', { 
            userId, 
            username, 
            channelId 
        });
    } else if (roomId) {
        const room = `dm-room-${roomId}`;
        socket.to(room).emit('user-stop-typing-dm', { 
            userId, 
            username, 
            roomId 
        });
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

module.exports = {
    setup
};
