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
    socket.on('typing', (data) => handleTyping(io, socket, data));
    socket.on('stop-typing', (data) => handleStopTyping(io, socket, data));
    socket.on('heartbeat', () => handleHeartbeat(socket));
    socket.on('update-presence', (data) => handleUpdatePresence(io, socket, data));
    socket.on('update-activity', (data) => handleUpdateActivity(io, socket, data));
    socket.on('get-online-users', () => handleGetOnlineUsers(socket));
    socket.on('get-user-presence', (data) => handleGetUserPresence(socket, data));
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

module.exports = {
  setupSocketHandlers
}; 