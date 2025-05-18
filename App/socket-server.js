const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["*"]
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

app.use(express.static(path.join(__dirname, 'public')));

const activeUsers = {};
const channels = {};
const webrtcRooms = {};
const globalVideoUsers = {};

// Add enhanced debugging and logging at the top
const DEBUG_MODE = true;

function debugLog(...args) {
  if (DEBUG_MODE) {
    console.log(`[DEBUG ${new Date().toISOString()}]`, ...args);
  }
}

app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    service: 'unified-socket-server',
    uptime: process.uptime(),
    connections: Object.keys(activeUsers).length,
    channels: Object.keys(channels).length,
    globalVideoUsers: Object.keys(globalVideoUsers).length,
    webrtcRooms: Object.keys(webrtcRooms).length,
    timestamp: new Date().toISOString()
  });
});

app.post('/broadcast', express.json(), (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== (process.env.SOCKET_API_KEY || 'kolin123')) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { event, data } = req.body;
  
  if (!event) {
    return res.status(400).json({ error: 'Event name is required' });
  }

  if (data && data.channelId) {
    io.to(`channel_${data.channelId}`).emit(event, data);
    console.log(`Broadcasted ${event} to channel ${data.channelId}`);
    return res.json({ success: true, event, channel: data.channelId });
  } 
  
  io.emit(event, data);
  console.log(`Broadcasted ${event} to all clients`);
  return res.json({ success: true, event });
});

// Auto-join middleware
io.use((socket, next) => {
  socket.autoJoinTimer = setTimeout(() => {
    if (socket.connected && !globalVideoUsers[socket.id]) {
      const defaultRoom = 'global-video-chat';
      const userName = `User_${socket.id.substring(0, 4)}`;
      
      debugLog(`Auto-joining user ${socket.id} to ${defaultRoom}`);
      socket.join(defaultRoom);
      
      globalVideoUsers[socket.id] = {
        userId: socket.id,
        userName: userName,
        roomId: defaultRoom,
        joinedAt: new Date().toISOString(),
        autoJoined: true
      };
      
      socket.emit('auto-joined', { roomId: defaultRoom, userName });
      logActiveUsers(defaultRoom);
    }
  }, 5000);
  
  next();
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  debugLog(`New socket connection from client ${socket.id}`);
  
  // Store creation timestamp to help identify connection issues
  socket.connectionTime = new Date().toISOString();
  
  // Set up user data structure for easier organization
  socket.userData = {
    userId: socket.id,
    joinedRooms: new Set(),
    isInGlobalRoom: false
  };

  socket.on('join', (userData) => {
    console.log(`User ${userData.username} (ID: ${userData.userId}) joined`);
    
    activeUsers[socket.id] = {
      userId: userData.userId,
      username: userData.username,
      socketId: socket.id
    };
    
    socket.emit('joined', {
      success: true,
      message: `Welcome ${userData.username}!`,
      activeUsers: Object.values(activeUsers).map(user => ({
        userId: user.userId,
        username: user.username
      }))
    });
  });
  
  socket.on('subscribe', (data) => {
    const channelId = data.channelId;
    console.log(`User ${socket.id} subscribing to channel ${channelId}`);
    
    socket.join(`channel_${channelId}`);
    
    if (!channels[channelId]) {
      channels[channelId] = new Set();
    }
    channels[channelId].add(socket.id);
    
    socket.emit('subscribed', {
      success: true,
      channelId: channelId
    });
    
    if (activeUsers[socket.id]) {
      io.to(`channel_${channelId}`).emit('user_joined_channel', {
        channelId: channelId,
        user: {
          userId: activeUsers[socket.id].userId,
          username: activeUsers[socket.id].username
        }
      });
    }
  });
  
  socket.on('unsubscribe', (data) => {
    const channelId = data.channelId;
    console.log(`User ${socket.id} unsubscribing from channel ${channelId}`);
    
    socket.leave(`channel_${channelId}`);
    
    if (channels[channelId]) {
      channels[channelId].delete(socket.id);
    }
  });
  
  socket.on('message', (messageData) => {
    console.log(`New message in channel ${messageData.channelId}: ${messageData.content}`);
    
    if (!activeUsers[socket.id]) {
      socket.emit('error', {
        message: 'Not authenticated'
      });
      return;
    }
    
    io.to(`channel_${messageData.channelId}`).emit('message', messageData);
  });
  
  socket.on('typing', (data) => {
    if (!activeUsers[socket.id]) return;
    
    socket.to(`channel_${data.channelId}`).emit('user_typing', {
      channelId: data.channelId,
      user: {
        userId: activeUsers[socket.id].userId,
        username: activeUsers[socket.id].username
      }
    });
  });
  
  socket.on('join-global-room', (data) => {
    const roomId = data.roomId || 'global-video-chat';
    const userName = data.userName || (activeUsers[socket.id] ? activeUsers[socket.id].username : `User_${socket.id.substring(0, 4)}`);
    
    debugLog(`JOIN REQUEST: User ${userName} (${socket.id}) joining ${roomId}`);
    
    // Check if this socket is already in the room to prevent duplicates
    const socketRooms = Array.from(socket.rooms || []);
    const alreadyInRoom = socketRooms.includes(roomId);
    
    // Check if this user is already registered in globalVideoUsers
    const alreadyRegistered = globalVideoUsers[socket.id] !== undefined;
    
    if (alreadyInRoom && alreadyRegistered) {
      debugLog(`User ${socket.id} already in room ${roomId}, not adding again`);
      
      // Send the current user list immediately to ensure they have up-to-date data
      const roomUsers = {};
      Object.keys(globalVideoUsers).forEach(id => {
        if (globalVideoUsers[id].roomId === roomId) {
          roomUsers[id] = globalVideoUsers[id];
        }
      });
      
      socket.emit('global-users', {
        users: roomUsers,
        roomId: roomId
      });
      
      return;
    }
    
    // Join the room
    socket.join(roomId);
    
    // Register the user in our global list
    globalVideoUsers[socket.id] = {
      userId: socket.id,
      userName: userName,
      roomId: roomId,
      joinedAt: new Date().toISOString()
    };
    
    debugLog(`ADDED USER: ${userName} (${socket.id}) to room ${roomId}`);
    
    // Log all current users for debugging
    logActiveUsers(roomId);
    
    // Emit to all others that this user has joined
    socket.to(roomId).emit('user-joined', {
      userId: socket.id,
      userName: userName,
      roomId: roomId,
      timestamp: Date.now()
    });
    
    // Send the current user list to the newly joined user
    const roomUsers = {};
    Object.keys(globalVideoUsers).forEach(id => {
      if (globalVideoUsers[id].roomId === roomId) {
        roomUsers[id] = globalVideoUsers[id];
      }
    });
    
    debugLog(`Sending user list with ${Object.keys(roomUsers).length} users to newly joined user ${socket.id}`);
    
    // Send the user list to the client
    socket.emit('global-users', {
      users: roomUsers,
      roomId: roomId
    });
  });
  
  socket.on('get-global-users', (data) => {
    const roomId = data.roomId || 'global-video-chat';
    
    debugLog(`GET-GLOBAL-USERS: ${socket.id} requesting users for room ${roomId}`);
    
    // Make sure the requester is in the room
    if (!globalVideoUsers[socket.id]) {
      debugLog(`User ${socket.id} not found in global users when requesting global list`);
      
      // Force join them to the room
      const userName = data.userName || (activeUsers[socket.id] ? 
        activeUsers[socket.id].username : `User_${socket.id.substring(0, 4)}`);
      
      debugLog(`Auto-adding requesting user ${socket.id} (${userName}) to room ${roomId}`);
      
      // Add them to the global video users
      globalVideoUsers[socket.id] = {
        userId: socket.id,
        userName: userName,
        roomId: roomId,
        joinedAt: new Date().toISOString(),
        autoAdded: true
      };
      
      // Join them to the Socket.IO room
      socket.join(roomId);
      
      // Notify others
      socket.to(roomId).emit('user-joined', {
        userId: socket.id,
        userName: userName,
        roomId: roomId,
        timestamp: Date.now()
      });
    }
    
    // Collect all room users
    const roomUsers = {};
    Object.keys(globalVideoUsers).forEach(userId => {
      if (globalVideoUsers[userId].roomId === roomId) {
        roomUsers[userId] = globalVideoUsers[userId];
      }
    });
    
    // Log the results
    const userCount = Object.keys(roomUsers).length;
    debugLog(`Responding with ${userCount} users in room ${roomId} to client ${socket.id}`);
    
    if (userCount > 0) {
      debugLog(`Users in room: ${Object.values(roomUsers).map(u => u.userName).join(', ')}`);
    } else {
      debugLog(`WARNING: No users found in room ${roomId} (including requesting user)`);
    }
    
    // Send back user list
    socket.emit('global-users', {
      users: roomUsers,
      roomId: roomId,
      totalCount: userCount,
      requesterIncluded: roomUsers[socket.id] !== undefined
    });
  });
  
  socket.on('offer', (data) => {
    console.log(`Offer from ${socket.id} to ${data.to}`);
    
    // Validate target user exists
    if (!data.to) {
      console.error(`Invalid offer: missing target user ID`);
      socket.emit('error', { message: 'Invalid offer: missing target user' });
      return;
    }
    
    // Check if target user is connected
    const targetSocket = io.sockets.sockets.get(data.to);
    if (!targetSocket) {
      console.warn(`Target user ${data.to} not found or disconnected`);
      socket.emit('error', { message: 'Target user not connected' });
      return;
    }
    
    // Forward the offer to target
    io.to(data.to).emit('offer', {
      offer: data.offer,
      from: socket.id,
      fromUserName: globalVideoUsers[socket.id] ? globalVideoUsers[socket.id].userName : 'Unknown User'
    });
    
    console.log(`Successfully forwarded offer from ${socket.id} to ${data.to}`);
  });
  
  socket.on('answer', (data) => {
    console.log(`Answer from ${socket.id} to ${data.to}`);
    
    // Validate target user exists
    if (!data.to) {
      console.error(`Invalid answer: missing target user ID`);
      socket.emit('error', { message: 'Invalid answer: missing target user' });
      return;
    }
    
    // Check if target user is connected
    const targetSocket = io.sockets.sockets.get(data.to);
    if (!targetSocket) {
      console.warn(`Target user ${data.to} not found or disconnected`);
      return;
    }
    
    // Forward the answer to target
    io.to(data.to).emit('answer', {
      answer: data.answer,
      from: socket.id
    });
  });
  
  socket.on('ice-candidate', (data) => {
    console.log(`ICE candidate from ${socket.id} to ${data.to}`);
    
    // Validate target user exists
    if (!data.to) {
      console.error(`Invalid ICE candidate: missing target user ID`);
      return;
    }
    
    // Forward the ICE candidate to target
    io.to(data.to).emit('ice-candidate', {
      candidate: data.candidate,
      from: socket.id
    });
  });
  
  socket.on('ping-all-users', (data) => {
    const roomId = data.roomId || 'global-video-chat';
    console.log(`User ${socket.id} pinging all users in room ${roomId}`);
    
    socket.to(roomId).emit('user-ping', {
      fromUserId: socket.id,
      fromUserName: data.fromUserName || 'Unknown User',
      message: data.message || 'Ping!',
      timestamp: Date.now()
    });
  });
  
  socket.on('disconnect', () => {
    debugLog(`User disconnected: ${socket.id}`);
    
    // Check if this user was in video chat
    if (globalVideoUsers[socket.id]) {
      const roomId = globalVideoUsers[socket.id].roomId;
      const userName = globalVideoUsers[socket.id].userName;
      
      debugLog(`Removing user ${userName} (${socket.id}) from room ${roomId}`);
      
      // Notify others in the room that this user has left
      socket.to(roomId).emit('user-left', {
        userId: socket.id,
        userName: userName,
        roomId: roomId,
        timestamp: Date.now()
      });
      
      // Remove from global users
      delete globalVideoUsers[socket.id];
      
      // Log remaining users
      debugLog(`After disconnect, remaining users in ${roomId}:`);
      logActiveUsers(roomId);
    }
    
    // Remove from active users
    if (activeUsers[socket.id]) {
      debugLog(`Removing user from active users list: ${socket.id}`);
      delete activeUsers[socket.id];
    }
    
    // Remove from all channels
    let channelsLeft = 0;
    Object.keys(channels).forEach(channelId => {
      if (channels[channelId].has(socket.id)) {
        channels[channelId].delete(socket.id);
        channelsLeft++;
      }
    });
    
    if (channelsLeft > 0) {
      debugLog(`User ${socket.id} removed from ${channelsLeft} channels`);
    }
  });
});

// Add better health check endpoint
app.get('/health', (req, res) => {
  console.log('Health check endpoint called');
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    socketServer: {
      connections: Object.keys(io.sockets.sockets).length,
      rooms: io.sockets.adapter.rooms ? Object.keys(io.sockets.adapter.rooms).length : 0,
      users: Object.keys(globalVideoUsers).length
    }
  });
});

// Add function to get and log all active users
function logActiveUsers(roomId) {
  const room = roomId || 'global-video-chat';
  const users = Object.keys(globalVideoUsers)
    .filter(id => globalVideoUsers[id].roomId === room)
    .map(id => ({
      id,
      name: globalVideoUsers[id].userName
    }));
  
  debugLog(`Active users in ${room}: ${users.length}`);
  users.forEach(user => {
    debugLog(`- ${user.name} (${user.id})`);
  });
  
  return users;
}

const PORT = process.env.PORT || 1002;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Unified Socket.IO server running on port ${PORT}`);
  console.log(`Socket.IO server available at http://localhost:${PORT}`);
});
