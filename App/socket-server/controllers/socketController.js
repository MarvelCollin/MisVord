const eventController = require('./eventController');

const userSockets = new Map();
const userStatus = new Map();
const recentMessages = new Map(); // Track recent messages to prevent duplicates

function setup(io) {
    eventController.setIO(io);
    
    io.on('connection', (client) => {
        console.log(`Client connected: ${client.id}`);
        
        // Debug all incoming events
        const originalOnEvent = client.onevent;
        client.onevent = function(packet) {
            const args = packet.data || [];
            const eventName = args[0];
            console.log(`📥 RECEIVED EVENT: ${eventName}`, client.id, args.length > 1 ? `args: ${JSON.stringify(args[1]).substring(0, 100)}...` : 'no args');
            originalOnEvent.call(this, packet);
        };
        
        client.on('authenticate', (data) => handleAuthenticate(io, client, data));
        client.on('join-channel', (data) => handleJoinChannel(io, client, data));
        client.on('leave-channel', (data) => handleLeaveChannel(io, client, data));
        client.on('join-dm-room', (data) => handleJoinDMRoom(io, client, data));
        client.on('channel-message', (data) => handleChannelMessage(io, client, data));
        client.on('typing', (data) => handleTyping(io, client, data));
        client.on('stop-typing', (data) => handleStopTyping(io, client, data));
        client.on('update-presence', (data) => handleUpdatePresence(io, client, data));
        
        // Direct socket events for messaging
        client.on('new-channel-message', (data) => forwardEvent(io, client, 'new-channel-message', data, `channel-${data.channelId}`));
        client.on('user-message-dm', (data) => forwardEvent(io, client, 'user-message-dm', data, `dm-room-${data.roomId}`));
        client.on('message-updated', (data) => forwardEvent(io, client, 'message-updated', data, getTargetRoom(data)));
        client.on('message-deleted', (data) => forwardEvent(io, client, 'message-deleted', data, getTargetRoom(data)));
        client.on('reaction-added', (data) => forwardEvent(io, client, 'reaction-added', data, null));
        client.on('reaction-removed', (data) => forwardEvent(io, client, 'reaction-removed', data, null));
        client.on('message-pinned', (data) => forwardEvent(io, client, 'message-pinned', data, null));
        
        client.on('debug-rooms', () => handleDebugRooms(io, client));
        client.on('get-room-info', () => handleGetRoomInfo(io, client));
        client.on('heartbeat', () => client.emit('heartbeat-response', { time: Date.now() }));
        
        client.on('disconnect', () => handleDisconnect(io, client));
    });
}

function handleAuthenticate(io, client, data) {
    const { userId, username } = data;
    
    if (!userId) {
        client.emit('auth-error', { message: 'User ID is required' });
        return;
    }
    
    client.data = client.data || {};
    client.data.userId = userId;
    client.data.username = username || `User-${userId}`;
    client.data.authenticated = true;
    
    const userRoom = `user-${userId}`;
    client.join(userRoom);
    
    if (userSockets.has(userId)) {
        userSockets.get(userId).add(client.id);
    } else {
        userSockets.set(userId, new Set([client.id]));
    }
    
    client.emit('auth-success', { 
        userId, 
        socketId: client.id,
        message: 'Authentication successful'
    });
    
    console.log(`User ${userId} (${username}) authenticated on client ${client.id}`);
}

function handleJoinChannel(io, client, data) {
    if (!client.data?.authenticated) {
        client.emit('error', { message: 'Authentication required' });
        return;
    }
    
    const channelId = data.channelId;
    if (!channelId) {
        client.emit('error', { message: 'Channel ID is required' });
        return;
    }
    
    const room = `channel-${channelId}`;
    client.join(room);
    
    client.emit('channel-joined', { 
        channelId,
        room, 
        message: `Joined channel ${channelId}`
    });
    
    console.log(`User ${client.data.userId} joined channel ${channelId}`);
}

function handleLeaveChannel(io, client, data) {
    if (!data.channelId) {
        client.emit('error', { message: 'Channel ID is required' });
        return;
    }
    
    const room = `channel-${data.channelId}`;
    client.leave(room);
    
    client.emit('channel-left', { 
        channelId: data.channelId,
        message: `Left channel ${data.channelId}`
    });
}

function handleJoinDMRoom(io, client, data) {
    if (!client.data?.authenticated) {
        client.emit('error', { message: 'Authentication required' });
        return;
    }
    
    const roomId = data.roomId;
    if (!roomId) {
        client.emit('error', { message: 'Room ID is required' });
        return;
    }
    
    const room = `dm-room-${roomId}`;
    client.join(room);
    
    client.emit('dm-room-joined', { 
        roomId,
        room, 
        message: `Joined DM room ${roomId}`
    });
    
    console.log(`User ${client.data.userId} joined DM room ${roomId}`);
}

function handleChannelMessage(io, client, data) {
    if (!client.data?.authenticated) {
        client.emit('error', { message: 'Authentication required' });
        return;
    }
    
    const { channelId, content, messageType = 'text' } = data;
    
    if (!channelId || !content) {
        client.emit('error', { message: 'Channel ID and content are required' });
        return;
    }
    
    const room = `channel-${channelId}`;
    const message = {
        id: Date.now().toString(),
        content,
        messageType,
        userId: client.data.userId,
        username: client.data.username,
        timestamp: Date.now(),
        channelId: channelId
    };
    
    // Emit only to other clients in the room, not back to the sender
    client.to(room).emit('new-channel-message', message);
    
    // Send confirmation back to sender with the final message ID
    client.emit('message-sent', {
        id: message.id,
        channelId: channelId,
        localMessageId: data.localMessageId || null
    });
    
    console.log(`📢 Sent channel message to others in room ${room} (excluding sender)`);
}

function handleTyping(io, client, data) {
    if (!client.data?.authenticated) return;
    
    const { channelId, roomId } = data;
    const userId = client.data.userId;
    const username = client.data.username;
    
    if (channelId) {
        const room = `channel-${channelId}`;
        // Only broadcast to others, not back to sender
        client.to(room).emit('user-typing', { 
            userId, 
            username, 
            channelId 
        });
    } else if (roomId) {
        const room = `dm-room-${roomId}`;
        // Only broadcast to others, not back to sender
        client.to(room).emit('user-typing-dm', { 
            userId, 
            username, 
            roomId 
        });
    }
}

function handleStopTyping(io, client, data) {
    if (!client.data?.authenticated) return;
    
    const { channelId, roomId } = data;
    const userId = client.data.userId;
    const username = client.data.username;
    
    if (channelId) {
        const room = `channel-${channelId}`;
        // Only broadcast to others, not back to sender
        client.to(room).emit('user-stop-typing', { 
            userId, 
            username, 
            channelId 
        });
    } else if (roomId) {
        const room = `dm-room-${roomId}`;
        // Only broadcast to others, not back to sender
        client.to(room).emit('user-stop-typing-dm', { 
            userId, 
            username, 
            roomId 
        });
    }
}

function handleUpdatePresence(io, client, data) {
    if (!client.data?.authenticated || !client.data.userId) return;
    
    const { status, activityDetails } = data;
    const userId = client.data.userId;
    
    client.data.status = status;
    client.data.activityDetails = activityDetails;
    
    userStatus.set(userId, { 
        status, 
        activityDetails, 
        lastUpdated: Date.now() 
    });
    
    io.emit('user-presence-update', {
        userId,
        username: client.data.username,
        status,
        activityDetails
    });
}

function handleDisconnect(io, client) {
    const userId = client.data?.userId;
    
    console.log(`Client disconnected: ${client.id}, User: ${userId}`);
    
    if (userId && userSockets.has(userId)) {
        userSockets.get(userId).delete(client.id);
        
        if (userSockets.get(userId).size === 0) {
            userSockets.delete(userId);
            
            io.emit('user-offline', {
                userId,
                username: client.data.username,
                timestamp: Date.now()
            });
        }
    }
}

function handleDebugRooms(io, client) {
    if (!client.data?.authenticated) {
        client.emit('error', { message: 'Authentication required' });
        return;
    }
    
    const clientRooms = Array.from(client.rooms).filter(room => room !== client.id);
    
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
    
    client.emit('debug-rooms-info', {
        yourSocketId: client.id,
        yourUserId: client.data.userId,
        yourRooms: clientRooms,
        allRooms: roomData
    });
}

function handleGetRoomInfo(io, client) {
    if (!client.data?.authenticated) {
        client.emit('error', { message: 'Authentication required' });
        return;
    }
    
    const clientRooms = Array.from(client.rooms).filter(room => room !== client.id);
    
    client.emit('room-info', {
        rooms: clientRooms
    });
}

function forwardEvent(io, client, eventName, data, specificRoom = null) {
    if (!client.data?.authenticated) {
        client.emit('error', { message: 'Authentication required' });
        return;
    }
    
    // Figure out the target room if not specified
    if (!specificRoom) {
        specificRoom = getTargetRoom(data);
    }
    
    // Clean the message data
    const cleanData = { ...data };
    if (cleanData._debug) delete cleanData._debug;
    if (cleanData._serverDebug) delete cleanData._serverDebug;
    
    // Generate a message signature to detect duplicates
    let messageSignature = null;
    if (eventName === 'new-channel-message' || eventName === 'user-message-dm') {
        messageSignature = `${eventName}_${client.data.userId}_${cleanData.id || Date.now().toString()}_${cleanData.content?.substring(0, 20)}`;
        
        const exactDuplicate = recentMessages.has(messageSignature);
        
        if (exactDuplicate) {
            console.log(`Dropping exact duplicate message: ${messageSignature}`);
            return;
        }
        
        recentMessages.set(messageSignature, Date.now());
        
        const now = Date.now();
        for (const [key, timestamp] of recentMessages.entries()) {
            if (now - timestamp > 5000) {
                recentMessages.delete(key);
            }
        }
    }
    
    // Log event info
    const username = client.data.username || 'Unknown';
    const userId = client.data.userId || 'unknown';
    
    if (eventName === 'new-channel-message') {
        const channelId = cleanData.channelId || 'unknown';
        console.log(`Message from ${username} (${userId}) in channel ${channelId}: "${cleanData.content}"`);
    } else if (eventName === 'user-message-dm') {
        const roomId = cleanData.roomId || 'unknown';
        console.log(`Message from ${username} (${userId}) in DM room ${roomId}: "${cleanData.content}"`);
    }
    
    // For messaging events, only send to others in the room to avoid duplicates
    if (specificRoom) {
        // Use client.to() to send only to other clients in the room, not back to the sender
        client.to(specificRoom).emit(eventName, cleanData);
        console.log(`Event ${eventName} sent to others in room: ${specificRoom}`);
    } else {
        // For non-room-specific events, broadcast to all except sender
        client.broadcast.emit(eventName, cleanData);
        console.log(`Event ${eventName} broadcast to all clients except sender`);
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
