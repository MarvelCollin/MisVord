const userService = require('../services/userService');
const messageService = require('../services/messageService');

function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`\n🔌 New socket connection: ${socket.id} at ${new Date().toISOString()}`);
    
    socket.on('authenticate', (data) => {
      console.log(`📞 authenticate event from ${socket.id}`);
      handleAuthentication(io, socket, data);
    });
    socket.on('disconnect', () => {
      console.log(`📞 disconnect event from ${socket.id}`);
      handleDisconnect(io, socket);
    });
    socket.on('join-channel', (data) => {
      console.log(`📞 join-channel event from ${socket.id}:`, data);
      handleJoinChannel(io, socket, data);
    });
    socket.on('leave-channel', (data) => {
      console.log(`📞 leave-channel event from ${socket.id}:`, data);
      handleLeaveChannel(io, socket, data);
    });
    socket.on('channel-message', (data) => {
      console.log(`📞 channel-message event from ${socket.id}`);
      handleChannelMessage(io, socket, data);
    });
    socket.on('direct-message', (data) => {
      console.log(`📞 direct-message event from ${socket.id}`);
      handleDirectMessage(io, socket, data);
    });
    socket.on('join-dm-room', (data) => handleJoinDMRoom(io, socket, data));
    socket.on('leave-dm-room', (data) => handleLeaveDMRoom(io, socket, data));
    socket.on('typing', (data) => handleTyping(io, socket, data));
    socket.on('stop-typing', (data) => handleStopTyping(io, socket, data));
    socket.on('user_typing_dm', (data) => handleTypingDM(io, socket, data));
    socket.on('user_stop_typing_dm', (data) => handleStopTypingDM(io, socket, data));
    socket.on('heartbeat', () => handleHeartbeat(socket));
    socket.on('update-presence', (data) => handleUpdatePresence(io, socket, data));
    socket.on('update-activity', (data) => handleUpdateActivity(io, socket, data));
    socket.on('get-online-users', () => handleGetOnlineUsers(socket));
    socket.on('get-user-presence', (data) => handleGetUserPresence(socket, data));
    socket.on('notify-user', (data) => handleNotifyUser(io, socket, data));
    socket.on('broadcast', (data) => handleBroadcast(io, socket, data));
    socket.on('room-event', (data) => handleRoomEvent(io, socket, data));
    socket.on('typing-start', (data) => handleTypingStart(io, socket, data));
    socket.on('typing-stop', (data) => handleTypingStop(io, socket, data));
    socket.on('reaction-added', (data) => handleReactionAdded(io, socket, data));    socket.on('user-presence-changed', (data) => handleUserPresenceChanged(io, socket, data));
    socket.on('debug-test', (data) => handleDebugTest(io, socket, data));
    socket.on('test-message', (data) => handleTestMessage(io, socket, data));
    socket.on('debug-rooms', () => handleDebugRooms(io, socket));
    socket.on('get-room-info', () => handleGetRoomInfo(io, socket));
    
    // Debug command to show current room status
    socket.on('debug-rooms', () => {
      console.log('\n=== 🔍 ROOM DEBUG INFO ===');
      const rooms = io.sockets.adapter.rooms;
      console.log('All rooms:', Array.from(rooms.keys()));
      rooms.forEach((clients, roomName) => {
        if (roomName.startsWith('channel-') || roomName.startsWith('dm-')) {
          console.log(`Room ${roomName}: ${clients.size} clients - ${Array.from(clients)}`);
        }
      });
      console.log('=== END ROOM DEBUG ===\n');
    });
  });
  
  // Log room status every 30 seconds for debugging
  setInterval(() => {
    const rooms = io.sockets.adapter.rooms;
    const channelRooms = Array.from(rooms.keys()).filter(name => name.startsWith('channel-'));
    if (channelRooms.length > 0) {
      console.log('\n📊 Room Status Update:');
      channelRooms.forEach(roomName => {
        const clients = rooms.get(roomName);
        console.log(`  ${roomName}: ${clients ? clients.size : 0} clients`);
      });
      console.log('');
    }
  }, 30000);
}

function handleAuthentication(io, socket, data) {
  console.log('\n=== 🔐 AUTHENTICATION REQUEST ===');
  console.log('Socket ID:', socket.id);
  console.log('Auth data:', JSON.stringify(data, null, 2));
  
  try {
    const { userId, username, token } = data;
    
    if (!userId || !username) {
      console.log('❌ Missing authentication parameters:', { userId: !!userId, username: !!username });
      socket.emit('authentication-failed', { error: 'Missing required authentication parameters' });
      return;
    }
    
    const user = userService.addConnectedUser(socket.id, { userId, username });
    
    console.log(`🔐 User authenticated: ${username} (${userId})`);
    console.log('User object:', user);
    
    socket.emit('authenticated', { 
      success: true, 
      userId, 
      username,
      socketId: socket.id 
    });
    
    broadcastUserPresenceUpdate(io, userId, 'online', username);
    console.log('=== END AUTHENTICATION ===\n');
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
  console.log('\n=== 🏠 JOIN CHANNEL REQUEST ===');
  console.log('Socket ID:', socket.id);
  console.log('Join data:', JSON.stringify(data, null, 2));
  
  try {
    const { channelId } = data;
    const user = userService.getConnectedUser(socket.id);
    
    console.log('User trying to join:', user);
    console.log('Channel ID:', channelId);
    
    if (!user || !channelId) {
      console.log('❌ Invalid join request:', { user: !!user, channelId: !!channelId });
      socket.emit('channel-join-failed', { error: 'Invalid request' });
      return;
    }
    
    const roomName = `channel-${channelId}`;
    socket.join(roomName);
    
    // Get updated room info
    const clientsInRoom = io.sockets.adapter.rooms.get(roomName);
    console.log(`✅ User ${user.username} (${user.userId}) joined channel ${channelId}`);
    console.log(`👥 Total clients in room ${roomName}:`, clientsInRoom ? clientsInRoom.size : 0);
    console.log(`👥 Client IDs in room:`, clientsInRoom ? Array.from(clientsInRoom) : []);
    
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
    
    console.log('=== END JOIN CHANNEL ===\n');
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
  console.log('\n=== 📨 CHANNEL MESSAGE RECEIVED ===');
  console.log('Socket ID:', socket.id);
  console.log('Raw Data:', JSON.stringify(data, null, 2));
  
  // 🐳 DOCKER SOCKET LOGS: User sent a message
  console.log(`\n🐳 [DOCKER-SOCKET-LOG] Message send event:`);
  console.log(`🐳 [DOCKER-SOCKET-LOG] Socket ID: ${socket.id}`);
  console.log(`🐳 [DOCKER-SOCKET-LOG] Timestamp: ${new Date().toISOString()}`);
  console.log(`🐳 [DOCKER-SOCKET-LOG] Event: channel-message`);
  console.log(`🐳 [DOCKER-SOCKET-LOG] Channel ID: ${data.channelId}`);
  console.log(`🐳 [DOCKER-SOCKET-LOG] Content Length: ${data.content ? data.content.length : 0}`);
  console.log(`🐳 [DOCKER-SOCKET-LOG] Message Type: ${data.messageType || 'text'}`);
  
  try {
    const { channelId, content, messageType = 'text', timestamp } = data;
    const user = userService.getConnectedUser(socket.id);
    
    console.log('User from socket:', user);
    console.log('Channel ID:', channelId);
    console.log('Content:', content);
    console.log('Message Type:', messageType);
    
    if (!user || !channelId || !content) {
      console.log('❌ Missing required data:', { user: !!user, channelId: !!channelId, content: !!content });
      
      // 🐳 DOCKER SOCKET LOGS: Message send failed
      console.log(`🐳 [DOCKER-SOCKET-LOG] Message send FAILED - Missing required data`);
      console.log(`🐳 [DOCKER-SOCKET-LOG] User: ${!!user}, Channel: ${!!channelId}, Content: ${!!content}`);
      
      socket.emit('message_error', { 
        error: 'Missing required data',
        tempId: data.tempId
      });
      return;
    }
    
    console.log(`🐳 [DOCKER-SOCKET-LOG] Message validation PASSED for user: ${user.username} (${user.userId})`);
    
    const duplicateId = messageService.checkRecentDuplicate(user.userId, timestamp, content);
    if (duplicateId) {
      console.log('⚠️ Duplicate message detected, skipping...');
      
      console.log(`🐳 [DOCKER-SOCKET-LOG] DUPLICATE message detected - Skipping save`);
      console.log(`🐳 [DOCKER-SOCKET-LOG] Duplicate ID: ${duplicateId}`);
      
      socket.emit('message_sent', { 
        success: true,
        messageId: duplicateId,
        tempId: data.tempId,
        duplicate: true
      });
      return;
    }
    
    console.log(`🐳 [DOCKER-SOCKET-LOG] Saving message to database...`);
    
    messageService.saveMessage(channelId, user.userId, content, messageType)
      .then(message => {
        console.log('✅ Message saved successfully:', message);
        
        // Create a standardized message object with consistent property names
        const messageData = {
          id: message.id,
          channelId: channelId,
          channel_id: channelId,
          user_id: user.userId,
          userId: user.userId,
          username: user.username,
          content: content,
          message_type: messageType,
          messageType: messageType,
          sent_at: message.created_at || new Date().toISOString(),
          created_at: message.created_at || new Date().toISOString(),
          timestamp: message.created_at || new Date().toISOString(),
          tempId: data.tempId,
          chatType: 'channel'
        };
        
        messageService.trackMessageProcessing(user.userId, timestamp, message.id, content);
        
        console.log(`📤 Broadcasting to channel-${channelId}`);
        console.log('Message data being broadcast:', JSON.stringify(messageData, null, 2));
        
        // Get room info
        const roomName = `channel-${channelId}`;
        const clientsInRoom = io.sockets.adapter.rooms.get(roomName);
        console.log(`👥 Clients in room ${roomName}:`, clientsInRoom ? Array.from(clientsInRoom) : 'No clients');
        console.log(`${user.username} to #channel-${channelId} : ${content}`);
        
        // Send to all users in the channel except the sender (like typing system)
        socket.to(`channel-${channelId}`).emit('new-channel-message', messageData);
        
        // Send confirmation to sender with standardized property names
        socket.emit('message-sent-confirmation', { 
          tempId: data.tempId, 
          messageId: message.id,
          id: message.id,
          channelId: channelId,
          channel_id: channelId,
          chatType: 'channel',
          success: true
        });
        
        console.log('✅ Message broadcast completed');
        console.log('=== END CHANNEL MESSAGE ===\n');
      })
      .catch(error => {
        console.error('❌ Error saving message:', error);
        socket.emit('message_error', { 
          error: 'Failed to save message',
          tempId: data.tempId,
          channelId: channelId
        });
      });
  } catch (error) {
    console.error('❌ Channel message error:', error);
    
    // 🐳 DOCKER SOCKET LOGS: Message processing error
    console.log(`🐳 [DOCKER-SOCKET-LOG] Message processing ERROR: ${error.message}`);
    console.log(`🐳 [DOCKER-SOCKET-LOG] Error stack: ${error.stack}`);
    
    socket.emit('message_error', { 
      error: 'Message processing failed',
      tempId: data.tempId
    });
  }
}

function handleDirectMessage(io, socket, data) {
  console.log('\n=== 💬 DIRECT MESSAGE RECEIVED ===');
  console.log('Socket ID:', socket.id);
  console.log('Raw Data:', JSON.stringify(data, null, 2));
  
  // 🐳 DOCKER SOCKET LOGS: User sent a direct message
  console.log(`\n🐳 [DOCKER-SOCKET-LOG] Direct message send event:`);
  console.log(`🐳 [DOCKER-SOCKET-LOG] Socket ID: ${socket.id}`);
  console.log(`🐳 [DOCKER-SOCKET-LOG] Timestamp: ${new Date().toISOString()}`);
  console.log(`🐳 [DOCKER-SOCKET-LOG] Event: direct-message`);
  console.log(`🐳 [DOCKER-SOCKET-LOG] Room ID: ${data.roomId}`);
  console.log(`🐳 [DOCKER-SOCKET-LOG] Content Length: ${data.content ? data.content.length : 0}`);
  console.log(`🐳 [DOCKER-SOCKET-LOG] Message Type: ${data.messageType || 'text'}`);
  
  try {
    const { roomId, content, messageType = 'text', timestamp } = data;
    const user = userService.getConnectedUser(socket.id);
    
    console.log('User from socket:', user);
    console.log('Room ID:', roomId);
    console.log('Content:', content);
    console.log('Message Type:', messageType);
    
    if (!user || !roomId || !content) {
      console.log('❌ Missing required data:', { user: !!user, roomId: !!roomId, content: !!content });
      
      // 🐳 DOCKER SOCKET LOGS: Direct message send failed
      console.log(`🐳 [DOCKER-SOCKET-LOG] Direct message send FAILED - Missing required data`);
      console.log(`🐳 [DOCKER-SOCKET-LOG] User: ${!!user}, Room: ${!!roomId}, Content: ${!!content}`);
      
      socket.emit('message_error', { 
        error: 'Invalid direct message data',
        tempId: data.tempId,
        roomId: roomId
      });
      return;
    }
    
    // 🐳 DOCKER SOCKET LOGS: Direct message validation passed
    console.log(`🐳 [DOCKER-SOCKET-LOG] Direct message validation PASSED for user: ${user.username} (${user.userId})`);
    
    const duplicateId = messageService.checkRecentDuplicate(user.userId, timestamp, content);
    if (duplicateId) {
      console.log('⚠️ Duplicate direct message detected, skipping...');
      
      // 🐳 DOCKER SOCKET LOGS: Duplicate direct message detected
      console.log(`🐳 [DOCKER-SOCKET-LOG] DUPLICATE direct message detected - Skipping save`);
      console.log(`🐳 [DOCKER-SOCKET-LOG] Duplicate ID: ${duplicateId}`);
      
      socket.emit('message-sent-confirmation', { 
        tempId: data.tempId, 
        messageId: duplicateId,
        id: duplicateId,
        roomId: roomId,
        chatRoomId: roomId,
        chatType: 'direct',
        duplicate: true,
        success: true
      });
      return;
    }

    // 🐳 DOCKER SOCKET LOGS: Saving direct message to database
    console.log(`🐳 [DOCKER-SOCKET-LOG] Saving direct message to database...`);
    
    messageService.saveDirectMessage(roomId, user.userId, content, messageType)
      .then(message => {
        console.log('✅ Direct message saved successfully:', message);
        
        // Create a standardized message object with consistent property names
        const messageData = {
          id: message.id,
          messageId: message.id,
          content: content,
          user_id: user.userId,
          userId: user.userId,
          username: user.username,
          chatRoomId: roomId,
          roomId: roomId,
          message_type: messageType,
          messageType: messageType,
          created_at: message.created_at || message.sent_at,
          sent_at: message.sent_at || message.created_at,
          timestamp: message.created_at || message.sent_at || new Date().toISOString(),
          tempId: data.tempId,
          chatType: 'direct'
        };
        
        messageService.trackMessageProcessing(user.userId, timestamp, message.id, content);
        
        console.log(`📤 Broadcasting to dm-room-${roomId}`);
        console.log('Direct message data being broadcast:', JSON.stringify(messageData, null, 2));
        
        // Get room info
        const roomName = `dm-room-${roomId}`;
        const clientsInRoom = io.sockets.adapter.rooms.get(roomName);        
        console.log(`👥 Clients in room ${roomName}:`, clientsInRoom ? Array.from(clientsInRoom) : 'No clients');
        
        // Broadcast to all clients in room except sender (like typing system)
        socket.to(roomName).emit('user-message-dm', messageData);
        
        // Send confirmation to sender with standardized property names
        socket.emit('message-sent-confirmation', { 
          tempId: data.tempId, 
          messageId: message.id,
          id: message.id,
          roomId: roomId,
          chatRoomId: roomId,
          chatType: 'direct',
          success: true
        });
        
        console.log(`💬 ${user.username} sent message to DM room ${roomId}: ${content}`);
        
        // 🐳 DOCKER SOCKET LOGS: Direct message broadcast completed
        console.log(`🐳 [DOCKER-SOCKET-LOG] Direct message broadcast completed successfully`);
        console.log(`🐳 [DOCKER-SOCKET-LOG] Message ID: ${message.id}`);
        console.log('=== END DIRECT MESSAGE ===\n');
      })
      .catch(error => {
        console.error('❌ Error saving direct message:', error);
        
        // 🐳 DOCKER SOCKET LOGS: Direct message save error
        console.log(`🐳 [DOCKER-SOCKET-LOG] Direct message save ERROR: ${error.message}`);
        console.log(`🐳 [DOCKER-SOCKET-LOG] Error stack: ${error.stack}`);
        
        socket.emit('message_error', { 
          error: 'Failed to save direct message',
          tempId: data.tempId,
          roomId: roomId
        });
      });
  } catch (error) {
    console.error('❌ Direct message error:', error);
    
    // 🐳 DOCKER SOCKET LOGS: Direct message processing error
    console.log(`🐳 [DOCKER-SOCKET-LOG] Direct message processing ERROR: ${error.message}`);
    console.log(`🐳 [DOCKER-SOCKET-LOG] Error stack: ${error.stack}`);
    
    socket.emit('message_error', { 
      error: 'Message processing failed',
      tempId: data.tempId
    });
  }
}

function handleJoinDMRoom(io, socket, data) {
  console.log('\n=== 🏠 DM ROOM JOIN REQUEST ===');
  console.log('Socket ID:', socket.id);
  console.log('Join data:', JSON.stringify(data, null, 2));
  
  try {
    const { roomId } = data;
    const user = userService.getConnectedUser(socket.id);
    
    console.log('🔍 User from socket:', user);
    console.log('🔍 Room ID:', roomId);
    
    if (!user || !roomId) {
      console.log('❌ Invalid request - user or roomId missing');
      socket.emit('dm-room-join-failed', { error: 'Invalid request' });
      return;
    }
    
    const roomName = `dm-room-${roomId}`;
    
    // Check current room membership before joining
    const currentRooms = Array.from(socket.rooms);
    console.log('📋 Current rooms for socket before join:', currentRooms);
    
    // Join the room
    socket.join(roomName);
    
    console.log(`💬 User ${user.username} (${user.userId}) joined DM room ${roomId}`);
    console.log(`💬 Socket ${socket.id} joined room: ${roomName}`);
    
    // Verify the join worked
    const roomSockets = io.sockets.adapter.rooms.get(roomName);
    const roomMembers = roomSockets ? Array.from(roomSockets) : [];
    console.log(`💬 Room ${roomName} now has ${roomMembers.length} members:`, roomMembers);
    
    // List all users in the room
    roomMembers.forEach(socketId => {
      const memberUser = userService.getConnectedUser(socketId);
      console.log(`  👤 Socket ${socketId}: ${memberUser ? `${memberUser.username} (${memberUser.userId})` : 'Unknown user'}`);
    });
    
    // Check final room membership
    const finalRooms = Array.from(socket.rooms);
    console.log('📋 Final rooms for socket after join:', finalRooms);
    
    socket.emit('dm-room-joined', { 
      roomId, 
      roomName,
      success: true,
      memberCount: roomMembers.length
    });
    
    socket.to(roomName).emit('user-joined-dm-room', {
      roomId,
      userId: user.userId,
      username: user.username
    });
    
    console.log('✅ DM room join completed successfully');
    console.log('=== END DM ROOM JOIN ===\n');
    
  } catch (error) {
    console.error('❌ Error in handleJoinDMRoom:', error);
    socket.emit('dm-room-join-failed', { error: 'Failed to join room' });
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

function handleTypingDM(io, socket, data) {
  try {
    const { chatRoomId } = data;
    const user = userService.getConnectedUser(socket.id);
    
    if (!user || !chatRoomId) {
      return;
    }
    
    socket.to(`dm-room-${chatRoomId}`).emit('user-typing-dm', {
      chatRoomId,
      userId: user.userId,
      username: user.username
    });
    
    console.log(`⌨️ User ${user.username} started typing in DM room ${chatRoomId}`);
  } catch (error) {
    console.error('❌ DM typing notification error:', error);
  }
}

function handleStopTypingDM(io, socket, data) {
  try {
    const { chatRoomId } = data;
    const user = userService.getConnectedUser(socket.id);
    
    if (!user || !chatRoomId) {
      return;
    }
    
    socket.to(`dm-room-${chatRoomId}`).emit('user-stop-typing-dm', {
      chatRoomId,
      userId: user.userId,
      username: user.username
    });
    
    console.log(`✋ User ${user.username} stopped typing in DM room ${chatRoomId}`);
  } catch (error) {
    console.error('❌ DM stop typing notification error:', error);
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
      // Emit to specific room except sender (like typing and messaging)
    socket.to(room).emit(event, eventData);
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
    
    // Broadcast reaction to channel except sender (like typing and messaging)
    socket.to(roomName).emit('reaction-added', {
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

function handleTestMessage(io, socket, data) {
  try {
    console.log(`📨 Test message received from ${socket.id}:`, data);
    
    // Send response back to the sender
    socket.emit('test-response', {
      success: true,
      message: 'Test message received successfully!',
      original: data,
      timestamp: new Date().toISOString(),
      socketId: socket.id
    });
    
    // Optional: broadcast to all clients for testing
    socket.broadcast.emit('test-broadcast', {
      message: 'Another client sent a test message',
      original: data,
      from: socket.id,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Test message error:', error);
    socket.emit('test-response', {
      success: false,
      error: error.message
    });
  }
}

function handleDebugRooms(io, socket) {
  try {
    console.log('\n=== 🔍 ROOM DEBUG INFO REQUESTED ===');
    const user = userService.getConnectedUser(socket.id);
    console.log(`Debug requested by: ${user ? `${user.username} (${user.userId})` : 'Unknown'}`);
    
    const rooms = io.sockets.adapter.rooms;
    const allRooms = Array.from(rooms.keys());
    
    console.log('All rooms in server:', allRooms);
    
    const roomInfo = [];
    rooms.forEach((clients, roomName) => {
      if (roomName.startsWith('channel-') || roomName.startsWith('dm-room-')) {
        const clientList = Array.from(clients);
        const userList = clientList.map(clientId => {
          const user = userService.getConnectedUser(clientId);
          return user ? `${user.username} (${user.userId})` : 'Unknown';
        });
        
        roomInfo.push({
          roomName,
          clientCount: clients.size,
          clients: clientList,
          users: userList
        });
        
        console.log(`📊 ${roomName}: ${clients.size} clients`);
        console.log(`   Clients: ${clientList.join(', ')}`);
        console.log(`   Users: ${userList.join(', ')}`);
      }
    });
    
    // Send room info back to client
    socket.emit('room-debug-info', {
      totalRooms: allRooms.length,
      chatRooms: roomInfo,
      socketId: socket.id,
      user: user
    });
    
    console.log('=== END ROOM DEBUG ===\n');
    
  } catch (error) {
    console.error('❌ Error in handleDebugRooms:', error);
    socket.emit('room-debug-error', { error: error.message });
  }
}

function handleGetRoomInfo(io, socket) {
  try {
    const user = userService.getConnectedUser(socket.id);
    const socketRooms = Array.from(socket.rooms);
    
    console.log(`📊 Room info requested by: ${user ? `${user.username} (${user.userId})` : 'Unknown'}`);
    console.log(`📊 Socket rooms: ${socketRooms.join(', ')}`);
    
    socket.emit('room-info', {
      socketId: socket.id,
      user: user,
      rooms: socketRooms,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error in handleGetRoomInfo:', error);
    socket.emit('room-info-error', { error: error.message });
  }
}

module.exports = {
  setupSocketHandlers
};