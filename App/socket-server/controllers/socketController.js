const userService = require('../services/userService');
const messageService = require('../services/messageService');

function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 New socket connection: ${socket.id}`);
    
    socket.on('authenticate', (data) => handleAuthentication(io, socket, data));
    socket.on('disconnect', () => handleDisconnect(io, socket));
    socket.on('join-channel', (data) => handleJoinChannel(io, socket, data));
    socket.on('leave-channel', (data) => handleLeaveChannel(io, socket, data));
    socket.on('channel-message', (data) => handleChannelMessage(io, socket, data));
    socket.on('direct-message', (data) => handleDirectMessage(io, socket, data));
    socket.on('join-dm-room', (data) => handleJoinDMRoom(io, socket, data));
    socket.on('leave-dm-room', (data) => handleLeaveDMRoom(io, socket, data));
    socket.on('typing', (data) => handleTyping(io, socket, data));
    socket.on('stop-typing', (data) => handleStopTyping(io, socket, data));
    socket.on('heartbeat', () => handleHeartbeat(socket));
    socket.on('update-presence', (data) => handleUpdatePresence(io, socket, data));
    socket.on('update-activity', (data) => handleUpdateActivity(io, socket, data));
    socket.on('get-online-users', () => handleGetOnlineUsers(socket));
    socket.on('get-user-presence', (data) => handleGetUserPresence(socket, data));
    socket.on('notify-user', (data) => handleNotifyUser(io, socket, data));
    socket.on('broadcast', (data) => handleBroadcast(io, socket, data));
    socket.on('room-event', (data) => handleRoomEvent(io, socket, data));
    socket.on('typing-start', (data) => handleTypingStart(io, socket, data));    socket.on('typing-stop', (data) => handleTypingStop(io, socket, data));
    socket.on('reaction-added', (data) => handleReactionAdded(io, socket, data));
    socket.on('user-presence-changed', (data) => handleUserPresenceChanged(io, socket, data));
    socket.on('debug-test', (data) => handleDebugTest(io, socket, data));
  });
}

function handleAuthentication(io, socket, data) {
  try {
    const { userId, username, token } = data;
    
    if (!userId || !username) {
      socket.emit('authentication-failed', { error: 'Missing required authentication parameters' });
      return;
    }
    
    const user = userService.addConnectedUser(socket.id, { userId, username });
    
    console.log(`🔐 User authenticated: ${username} (${userId})`);
    
    socket.emit('authenticated', { 
      success: true, 
      userId, 
      username,
      socketId: socket.id 
    });
    
    broadcastUserPresenceUpdate(io, userId, 'online', username);
  } catch (error) {
    console.error('❌ Authentication error:', error);
    socket.emit('authentication-failed', { error: 'Authentication failed' });
  }
}

function handleDisconnect(io, socket) {
  try {
    const user = userService.removeConnectedUser(socket.id);
    
    if (user) {
      console.log(`👋 User disconnected: ${user.username} (${user.userId})`);
      
      const userStillConnected = Array.from(userService.connectedUsers.values())
        .some(u => u.userId === user.userId);
      
      if (!userStillConnected) {
        broadcastUserPresenceUpdate(io, user.userId, 'offline', user.username);
      }
    } else {
      console.log(`👋 Socket disconnected: ${socket.id}`);
    }
  } catch (error) {
    console.error('❌ Disconnect error:', error);
  }
}

function handleJoinChannel(io, socket, data) {
  try {
    const { channelId } = data;
    const user = userService.getConnectedUser(socket.id);
    
    if (!user || !channelId) {
      socket.emit('channel-join-failed', { error: 'Invalid request' });
      return;
    }
    
    const roomName = `channel-${channelId}`;
    socket.join(roomName);
    
    console.log(`👥 User ${user.username} (${user.userId}) joined channel ${channelId}`);
    
    socket.emit('channel-joined', { 
      channelId, 
      success: true 
    });
    
    socket.to(roomName).emit('user-joined-channel', {
      channelId,
      userId: user.userId,
      username: user.username
    });
    
    messageService.getChannelMessages(channelId)
      .then(messages => {
        if (messages && messages.length > 0) {
          socket.emit('channel-history', { 
            channelId, 
            messages 
          });
        }
      })
      .catch(error => {
        console.error(`❌ Error fetching channel history: ${error.message}`);
      });
  } catch (error) {
    console.error('❌ Join channel error:', error);
    socket.emit('channel-join-failed', { error: 'Failed to join channel' });
  }
}

function handleLeaveChannel(io, socket, data) {
  try {
    const { channelId } = data;
    const user = userService.getConnectedUser(socket.id);
    
    if (!user || !channelId) {
      return;
    }
    
    const roomName = `channel-${channelId}`;
    socket.leave(roomName);
    
    console.log(`👋 User ${user.username} (${user.userId}) left channel ${channelId}`);
    
    socket.emit('channel-left', { channelId });
    
    socket.to(roomName).emit('user-left-channel', {
      channelId,
      userId: user.userId,
      username: user.username
    });
  } catch (error) {
    console.error('❌ Leave channel error:', error);
  }
}

function handleChannelMessage(io, socket, data) {
  try {
    const { channelId, content, messageType = 'text', timestamp } = data;
    const user = userService.getConnectedUser(socket.id);
    
    if (!user || !channelId || !content) {
      socket.emit('message_error', { error: 'Invalid message data' });
      return;
    }
    
    const duplicateId = messageService.checkRecentDuplicate(user.userId, timestamp, content);
    if (duplicateId) {
      console.log(`🔄 Duplicate message detected, using existing ID: ${duplicateId}`);
      socket.emit('message-sent-confirmation', { 
        tempId: data.tempId, 
        messageId: duplicateId,
        channelId
      });
      return;
    }
    
    messageService.saveMessage(channelId, user.userId, content, messageType)
      .then(message => {
        const messageData = {
          ...message,
          username: user.username,
          tempId: data.tempId
        };
        
        messageService.trackMessageProcessing(user.userId, timestamp, message.id, content);
        
        io.to(`channel-${channelId}`).emit('new-channel-message', messageData);
        
        socket.emit('message-sent-confirmation', { 
          tempId: data.tempId, 
          messageId: message.id,
          channelId
        });
      })
      .catch(error => {
        console.error('❌ Error saving message:', error);
        socket.emit('message_error', { 
          error: 'Failed to save message',
          tempId: data.tempId
        });
      });
  } catch (error) {
    console.error('❌ Channel message error:', error);
    socket.emit('message_error', { 
      error: 'Message processing failed',
      tempId: data.tempId
    });
  }
}

function handleDirectMessage(io, socket, data) {
  try {
    const { roomId, content, messageType = 'text', timestamp } = data;
    const user = userService.getConnectedUser(socket.id);
    
    if (!user || !roomId || !content) {
      socket.emit('message_error', { error: 'Invalid direct message data' });
      return;
    }
    
    const duplicateId = messageService.checkRecentDuplicate(user.userId, timestamp, content);
    if (duplicateId) {
      console.log(`🔄 Duplicate direct message detected, using existing ID: ${duplicateId}`);
      socket.emit('message-sent-confirmation', { 
        tempId: data.tempId, 
        messageId: duplicateId,
        roomId
      });
      return;
    }
    
    messageService.saveDirectMessage(roomId, user.userId, content, messageType)
      .then(message => {
        const messageData = {
          ...message,
          username: user.username,
          tempId: data.tempId
        };
        
        messageService.trackMessageProcessing(user.userId, timestamp, message.id, content);
        
        io.to(`dm-room-${roomId}`).emit('new-direct-message', messageData);
        
        socket.emit('message-sent-confirmation', { 
          tempId: data.tempId, 
          messageId: message.id,
          roomId
        });
      })
      .catch(error => {
        console.error('❌ Error saving direct message:', error);
        socket.emit('message_error', { 
          error: 'Failed to save direct message',
          tempId: data.tempId
        });
      });
  } catch (error) {
    console.error('❌ Direct message error:', error);
    socket.emit('message_error', { 
      error: 'Direct message processing failed',
      tempId: data.tempId
    });
  }
}

function handleJoinDMRoom(io, socket, data) {
  try {
    const { roomId } = data;
    const user = userService.getConnectedUser(socket.id);
    
    if (!user || !roomId) {
      socket.emit('dm-room-join-failed', { error: 'Invalid request' });
      return;
    }
    
    const roomName = `dm-room-${roomId}`;
    socket.join(roomName);
    
    console.log(`💬 User ${user.username} (${user.userId}) joined DM room ${roomId}`);
    
    socket.emit('dm-room-joined', { 
      roomId, 
      success: true 
    });
    
    socket.to(roomName).emit('user-joined-dm-room', {
      roomId,
      userId: user.userId,
      username: user.username
    });
  } catch (error) {
    console.error('❌ Join DM room error:', error);
    socket.emit('dm-room-join-failed', { error: 'Failed to join DM room' });
  }
}

function handleLeaveDMRoom(io, socket, data) {
  try {
    const { roomId } = data;
    const user = userService.getConnectedUser(socket.id);
    
    if (!user || !roomId) {
      return;
    }
    
    const roomName = `dm-room-${roomId}`;
    socket.leave(roomName);
    
    console.log(`💬 User ${user.username} (${user.userId}) left DM room ${roomId}`);
    
    socket.to(roomName).emit('user-left-dm-room', {
      roomId,
      userId: user.userId,
      username: user.username
    });
  } catch (error) {
    console.error('❌ Leave DM room error:', error);
  }
}

function handleTyping(io, socket, data) {
  try {
    const { channelId } = data;
    const user = userService.getConnectedUser(socket.id);
    
    if (!user || !channelId) {
      return;
    }
    
    socket.to(`channel-${channelId}`).emit('user-typing', {
      channelId,
      userId: user.userId,
      username: user.username
    });
  } catch (error) {
    console.error('❌ Typing notification error:', error);
  }
}

function handleStopTyping(io, socket, data) {
  try {
    const { channelId } = data;
    const user = userService.getConnectedUser(socket.id);
    
    if (!user || !channelId) {
      return;
    }
    
    socket.to(`channel-${channelId}`).emit('user-stop-typing', {
      channelId,
      userId: user.userId,
      username: user.username
    });
  } catch (error) {
    console.error('❌ Stop typing notification error:', error);
  }
}

function handleHeartbeat(socket) {
  socket.emit('heartbeat-response');
}

function handleUpdatePresence(io, socket, data) {
  try {
    const { status, activityDetails } = data;
    const user = userService.getConnectedUser(socket.id);
    
    if (!user || !status) {
      socket.emit('presence-update-failed', { error: 'Invalid presence data' });
      return;
    }
    
    if (!['online', 'away', 'dnd', 'offline'].includes(status)) {
      socket.emit('presence-update-failed', { error: 'Invalid status value' });
      return;
    }
    
    userService.updateUserPresence(user.userId, status, user.username, activityDetails);
    
    broadcastUserPresenceUpdate(io, user.userId, status, user.username, activityDetails);
    
    socket.emit('presence-updated', {
      status,
      activityDetails,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('❌ Update presence error:', error);
    socket.emit('presence-update-failed', { error: 'Failed to update presence' });
  }
}

function handleUpdateActivity(io, socket, data) {
  try {
    const { activityDetails } = data;
    const user = userService.getConnectedUser(socket.id);
    
    if (!user) {
      socket.emit('activity-update-failed', { error: 'User not found' });
      return;
    }
    
    userService.updateUserActivity(user.userId, activityDetails);
    
    const presence = userService.getUserPresence(user.userId);
    
    broadcastUserPresenceUpdate(io, user.userId, presence.status, user.username, activityDetails);
    
    socket.emit('activity-updated', {
      activityDetails,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('❌ Update activity error:', error);
    socket.emit('activity-update-failed', { error: 'Failed to update activity' });
  }
}

function handleGetOnlineUsers(socket) {
  try {
    const onlineUsers = userService.getAllOnlineUsers();
    socket.emit('online-users', { users: onlineUsers });
  } catch (error) {
    console.error('❌ Get online users error:', error);
    socket.emit('online-users-failed', { error: 'Failed to get online users' });
  }
}

function handleGetUserPresence(socket, data) {
  try {
    const { userId } = data;
    
    if (!userId) {
      socket.emit('user-presence-failed', { error: 'User ID required' });
      return;
    }
    
    const presence = userService.getUserPresence(userId);
    socket.emit('user-presence', { userId, ...presence });
  } catch (error) {
    console.error('❌ Get user presence error:', error);
    socket.emit('user-presence-failed', { error: 'Failed to get user presence' });
  }
}

function broadcastUserPresenceUpdate(io, userId, status, username = null, activityDetails = null) {
  const timestamp = new Date().toISOString();
  
  const presenceData = {
    user_id: userId,
    status,
    timestamp
  };
  
  if (username) {
    presenceData.username = username;
  }
  
  if (activityDetails !== null && activityDetails !== undefined) {
    presenceData.activity_details = activityDetails;
  }
    io.emit('user-presence-changed', presenceData);
  console.log(`📡 Broadcasting presence update for user ${userId}: ${status}`);
}

// New handlers for refactored socket-api.js
function handleNotifyUser(io, socket, data) {
  try {
    const { user_id, event, data: eventData } = data;
    
    if (!user_id || !event) {
      console.error('❌ Invalid notify-user request - missing user_id or event');
      return;
    }
    
    // Find the target user's socket(s)
    const targetSockets = Array.from(userService.connectedUsers.entries())
      .filter(([socketId, user]) => user.userId === user_id)
      .map(([socketId, user]) => socketId);
    
    if (targetSockets.length === 0) {
      console.log(`📤 User ${user_id} not connected - cannot notify`);
      return;
    }
    
    // Send event to all target user's sockets
    targetSockets.forEach(socketId => {
      io.to(socketId).emit(event, eventData);
    });
    
    console.log(`📨 Notified user ${user_id} with event ${event}`);
  } catch (error) {
    console.error('❌ Notify user error:', error);
  }
}

function handleBroadcast(io, socket, data) {
  try {
    const { event, data: eventData } = data;
    
    if (!event) {
      console.error('❌ Invalid broadcast request - missing event');
      return;
    }
    
    // Broadcast to all connected sockets
    io.emit(event, eventData);
    console.log(`📡 Broadcast event ${event} to all connected users`);
  } catch (error) {
    console.error('❌ Broadcast error:', error);
  }
}

function handleRoomEvent(io, socket, data) {
  try {
    const { room, event, data: eventData } = data;
    
    if (!room || !event) {
      console.error('❌ Invalid room-event request - missing room or event');
      return;
    }
    
    // Emit to specific room
    io.to(room).emit(event, eventData);
    console.log(`📡 Broadcast event ${event} to room ${room}`);
  } catch (error) {
    console.error('❌ Room event error:', error);
  }
}

function handleTypingStart(io, socket, data) {
  try {
    const { channel_id, user_id, username } = data;
    
    if (!channel_id || !user_id) {
      console.error('❌ Invalid typing-start request');
      return;
    }
    
    const roomName = `channel-${channel_id}`;
    
    // Send typing indicator to channel except sender
    socket.to(roomName).emit('typing-start', {
      channel_id,
      user_id,
      username,
      timestamp: new Date().toISOString()
    });
    
    console.log(`⌨️ User ${username} started typing in channel ${channel_id}`);
  } catch (error) {
    console.error('❌ Typing start error:', error);
  }
}

function handleTypingStop(io, socket, data) {
  try {
    const { channel_id, user_id, username } = data;
    
    if (!channel_id || !user_id) {
      console.error('❌ Invalid typing-stop request');
      return;
    }
    
    const roomName = `channel-${channel_id}`;
    
    // Send typing stop to channel except sender
    socket.to(roomName).emit('typing-stop', {
      channel_id,
      user_id,
      username,
      timestamp: new Date().toISOString()
    });
    
    console.log(`⌨️ User ${username} stopped typing in channel ${channel_id}`);
  } catch (error) {
    console.error('❌ Typing stop error:', error);
  }
}

function handleReactionAdded(io, socket, data) {
  try {
    const { channel_id, message_id, user_id, username, reaction } = data;
    
    if (!channel_id || !message_id || !user_id || !reaction) {
      console.error('❌ Invalid reaction-added request');
      return;
    }
    
    const roomName = `channel-${channel_id}`;
    
    // Broadcast reaction to channel
    io.to(roomName).emit('reaction-added', {
      channel_id,
      message_id,
      user_id,
      username,
      reaction,
      timestamp: new Date().toISOString()
    });
    
    console.log(`😄 User ${username} added reaction ${reaction} to message ${message_id}`);
  } catch (error) {
    console.error('❌ Reaction added error:', error);
  }
}

function handleUserPresenceChanged(io, socket, data) {
  try {
    const { user_id, status, activity_details } = data;
    
    if (!user_id || !status) {
      console.error('❌ Invalid user-presence-changed request');
      return;
    }
    
    const user = userService.getUserById(user_id);
    const username = user ? user.username : null;
    
    // Use existing broadcast function
    broadcastUserPresenceUpdate(io, user_id, status, username, activity_details);  } catch (error) {
    console.error('❌ User presence changed error:', error);
  }
}

function handleDebugTest(io, socket, username) {
  try {
    console.log(`ping from ${username}`);
    
    socket.emit('debug-test-response', {
      success: true,
      message: `ping from ${username}`
    });
  } catch (error) {
    console.error('❌ Debug test error:', error);
    socket.emit('debug-test-response', {
      success: false,
      error: error.message
    });
  }
}

module.exports = {
  setupSocketHandlers
};