const userService = require('../services/userService');
const messageService = require('../services/messageService');

function handleEmitRequest(io, req, res) {
  try {
    const { event, data } = req.body;
    
    if (!event) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing event parameter' 
      });
    }
    
    console.log(`📤 Server-to-socket event: ${event}`, data);
    
    switch (event) {
      case 'notify-user':
        return handleNotifyUser(io, data, res);
      
      case 'broadcast-to-room':
        return handleBroadcastToRoom(io, data, res);
      
      case 'broadcast':
        return handleBroadcast(io, data, res);
      
      case 'emoji-created':
      case 'emoji-updated':
      case 'emoji-deleted':
        return handleEmojiEvent(io, event, data, res);
        case 'channel-message':
        return handleChannelMessageEvent(io, data, res);
      
      case 'direct-message':
        return handleDirectMessageEvent(io, data, res);
      
      case 'reaction-added':
      case 'reaction-removed':
        return handleReactionEvent(io, event, data, res);
      
      case 'friend-request-received':
      case 'friend-request-accepted':
      case 'friend-request-declined':
      case 'friend-removed':
        return handleFriendEvent(io, event, data, res);
      
      default:
        io.emit(event, data);
        return res.json({ success: true });
    }
  } catch (error) {
    console.error('❌ Error processing emit request:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}

function handleNotifyUser(io, data, res) {
  const { userId, event: userEvent, data: userData } = data;
  
  if (!userId || !userEvent) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required parameters for notify-user' 
    });
  }
  
  const userSockets = userService.getUserSockets(userId);
  
  if (userSockets.length === 0) {
    console.log(`⚠️ No active sockets found for user ${userId}`);
  } else {
    console.log(`🔔 Notifying user ${userId} on ${userSockets.length} socket(s)`);
    
    userSockets.forEach(socketId => {
      io.to(socketId).emit(userEvent, userData);
    });
  }
  
  return res.json({ success: true, notified: userSockets.length });
}

function handleBroadcastToRoom(io, data, res) {
  const { room, event: roomEvent, data: roomData } = data;
  
  if (!room || !roomEvent) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required parameters for broadcast-to-room' 
    });
  }
  
  console.log(`📢 Broadcasting to room ${room}: ${roomEvent}`);
  io.to(room).emit(roomEvent, roomData);
  
  return res.json({ success: true, room });
}

function handleBroadcast(io, data, res) {
  const { event: broadcastEvent, data: broadcastData } = data;
  
  if (!broadcastEvent) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required parameters for broadcast' 
    });
  }
  
  console.log(`📢 Broadcasting to all: ${broadcastEvent}`);
  io.emit(broadcastEvent, broadcastData);
  
  return res.json({ success: true });
}

function handleEmojiEvent(io, event, data, res) {
  console.log(`😀 ${event} event`);
  io.to(`server-${data.server_id}`).emit(event, data);
  return res.json({ success: true });
}

function handleReactionEvent(io, event, data, res) {
  console.log(`👍 ${event} event`);
  io.to(`channel-${data.channel_id}`).emit(event, data);
  return res.json({ success: true });
}

function handleFriendEvent(io, event, data, res) {
  let targetUserId;
  
  switch (event) {
    case 'friend-request-received':
      targetUserId = data.recipient_id;
      break;
    case 'friend-request-accepted':
    case 'friend-request-declined':
      targetUserId = data.sender_id;
      break;
    case 'friend-removed':
      targetUserId = data.user_id;
      break;
  }
  
  console.log(`👥 ${event} event for user: ${targetUserId}`);
  
  const targetSockets = userService.getUserSockets(targetUserId);
  
  targetSockets.forEach(socketId => {
    io.to(socketId).emit(event, data);
  });
  
  return res.json({ success: true });
}

function handleChannelMessageEvent(io, data, res) {
  console.log('\n=== 📨 PHP BACKEND MESSAGE EVENT ===');
  console.log(`💬 Channel message event from PHP backend:`, JSON.stringify(data, null, 2));
  
  const { channelId, content, messageType, timestamp, message, user_id, username } = data;
  
  if (!channelId || !content) {
    console.log('❌ Missing required parameters:', { channelId: !!channelId, content: !!content });
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required parameters for channel-message' 
    });
  }
  
  const messageData = {
    channelId,
    content,
    messageType: messageType || 'text',
    timestamp: timestamp || Date.now(),
    source: 'php-backend',
    user_id,
    username,
    ...message
  };
  
  console.log(`📤 Broadcasting to channel-${channelId}:`, JSON.stringify(messageData, null, 2));
  
  // Get room info
  const roomName = `channel-${channelId}`;
  const clientsInRoom = io.sockets.adapter.rooms.get(roomName);
  console.log(`👥 Clients in room ${roomName}:`, clientsInRoom ? Array.from(clientsInRoom) : 'No clients');
  
  io.to(`channel-${channelId}`).emit('new-channel-message', messageData);
  
  console.log('✅ PHP message broadcast completed');
  console.log('=== END PHP BACKEND MESSAGE ===\n');
  
  return res.json({ success: true, channelId });
}

function handleDirectMessageEvent(io, data, res) {
  console.log(`💬 Direct message event from PHP backend:`, data);
  
  const { roomId, content, messageType, timestamp, message, user_id, username } = data;
  
  if (!roomId || !content) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required parameters for direct-message' 
    });
  }
  
  const messageData = {
    roomId,
    content,
    messageType: messageType || 'text',
    timestamp: timestamp || Date.now(),
    source: 'php-backend',
    chatRoomId: roomId,
    user_id,
    username,
    ...message
  };
  
  const roomName = `dm-room-${roomId}`;
  const room = io.sockets.adapter.rooms.get(roomName);
  const clientCount = room ? room.size : 0;
  
  console.log(`📤 Broadcasting to ${roomName} (${clientCount} clients):`, messageData);
  console.log(`${username} direct message to room ${roomId} : ${content}`);
  
  io.to(roomName).emit('new-direct-message', messageData);
  
  return res.json({ success: true, roomId });
}

module.exports = {
  handleEmitRequest
};