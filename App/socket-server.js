const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server with CORS configuration
const io = new Server(server, {
  cors: {
    origin: "*", // In production, restrict to your domain
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["*"]
  },
  // Explicitly configure transport options
  transports: ['websocket', 'polling']
});

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Store active users and channels
const activeUsers = {};
const channels = {};
// Store WebRTC rooms
const webrtcRooms = {};
// Store global video chat users
const globalVideoUsers = {};

// API endpoint to check server status
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

// API endpoint to broadcast events from PHP
app.post('/broadcast', express.json(), (req, res) => {
  // Simple API key check
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== (process.env.SOCKET_API_KEY || 'kolin123')) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { event, data } = req.body;
  
  if (!event) {
    return res.status(400).json({ error: 'Event name is required' });
  }

  // Broadcast to the appropriate channel if specified
  if (data && data.channelId) {
    io.to(`channel_${data.channelId}`).emit(event, data);
    console.log(`Broadcasted ${event} to channel ${data.channelId}`);
    return res.json({ success: true, event, channel: data.channelId });
  } 
  
  // Otherwise broadcast to all clients
  io.emit(event, data);
  console.log(`Broadcasted ${event} to all clients`);
  return res.json({ success: true, event });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // =====================================================
  // Text Chat & Channel Functionality 
  // =====================================================
  
  // Handle user joining with authentication
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
  
  // Handle channel subscription
  socket.on('subscribe', (data) => {
    const channelId = data.channelId;
    console.log(`User ${socket.id} subscribing to channel ${channelId}`);
    
    // Join socket.io room for this channel
    socket.join(`channel_${channelId}`);
    
    // Track channel subscription
    if (!channels[channelId]) {
      channels[channelId] = new Set();
    }
    channels[channelId].add(socket.id);
    
    // Notify user of successful subscription
    socket.emit('subscribed', {
      success: true,
      channelId: channelId
    });
    
    // Notify channel members about the new user
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
  
  // Handle channel unsubscription
  socket.on('unsubscribe', (data) => {
    const channelId = data.channelId;
    console.log(`User ${socket.id} unsubscribing from channel ${channelId}`);
    
    socket.leave(`channel_${channelId}`);
    
    // Remove from tracked subscriptions
    if (channels[channelId]) {
      channels[channelId].delete(socket.id);
    }
  });
  
  // Handle new messages
  socket.on('message', (messageData) => {
    console.log(`New message in channel ${messageData.channelId}: ${messageData.content}`);
    
    // Check if user is authenticated
    if (!activeUsers[socket.id]) {
      socket.emit('error', {
        message: 'Not authenticated'
      });
      return;
    }
    
    // Broadcast message to all subscribers
    io.to(`channel_${messageData.channelId}`).emit('message', messageData);
  });
  
  // Handle typing indicator
  socket.on('typing', (data) => {
    // Only broadcast if user is authenticated
    if (!activeUsers[socket.id]) return;
    
    socket.to(`channel_${data.channelId}`).emit('user_typing', {
      channelId: data.channelId,
      user: {
        userId: activeUsers[socket.id].userId,
        username: activeUsers[socket.id].username
      }
    });
  });
  
  // =====================================================
  // Voice/Video & WebRTC Functionality 
  // =====================================================

  // Handle joining global room for video chat
  socket.on('join-global-room', (data) => {
    const roomId = data.roomId || 'global-video-chat';
    const userName = data.userName || (activeUsers[socket.id] ? activeUsers[socket.id].username : `User_${socket.id.substring(0, 4)}`);
    
    console.log(`User ${userName} (${socket.id}) joined global room: ${roomId}`);
    
    // Join the room
    socket.join(roomId);
    
    // Store user info in global video users
    globalVideoUsers[socket.id] = {
      userId: socket.id,
      userName: userName,
      roomId: roomId
    };
    
    // Notify others in the room
    socket.to(roomId).emit('user-joined', {
      userId: socket.id,
      userName: userName
    });
    
    console.log(`Current global video users: ${Object.keys(globalVideoUsers).length}`);
  });
  
  // Handle getting global users list
  socket.on('get-global-users', (data) => {
    const roomId = data ? data.roomId : null;
    console.log(`Sending global users list to ${socket.id}`);
    
    const users = Object.keys(globalVideoUsers)
      .filter(id => !roomId || globalVideoUsers[id].roomId === roomId)
      .map(id => ({
        userId: id,
        userName: globalVideoUsers[id].userName
      }));
    
    socket.emit('global-users', { users });
  });
  
  // Handle user leaving global room
  socket.on('leave-global-room', () => {
    if (globalVideoUsers[socket.id]) {
      const roomId = globalVideoUsers[socket.id].roomId;
      console.log(`User ${socket.id} leaving global video chat room: ${roomId}`);
      
      socket.leave(roomId);
      
      // Notify others in the room
      socket.to(roomId).emit('user-left', {
        userId: socket.id,
        userName: globalVideoUsers[socket.id].userName
      });
      
      // Remove from global users
      delete globalVideoUsers[socket.id];
    }
  });
  
  // Handle ping requests
  socket.on('ping-all-users', (data) => {
    console.log(`User ${socket.id} pinged all users in global room`);
    
    const roomId = data && data.roomId ? data.roomId : 'global-video-chat';
    
    // Get user name from different possible sources
    const userName = 
      (data && data.fromUserName) || 
      (globalVideoUsers[socket.id] ? globalVideoUsers[socket.id].userName : null) ||
      (activeUsers[socket.id] ? activeUsers[socket.id].username : null) ||
      `User_${socket.id.substring(0, 4)}`;
    
    // Add the user info if not provided
    const pingData = {
      from: socket.id,
      userName: userName,
      fromUserName: userName,
      timestamp: Date.now()
    };
    
    // Add any additional data from the request
    if (data) {
      if (data.roomId) pingData.roomId = data.roomId;
      if (data.message) pingData.message = data.message;
    }
    
    // Relay the ping to all users in the specified room except the sender
    socket.to(roomId).emit('user-ping', pingData);
    
    // Also send a receipt confirmation back to the sender
    socket.emit('ping-sent', {
      success: true,
      timestamp: Date.now(),
      recipients: Object.keys(globalVideoUsers).length - 1 // Number of users who received the ping (excluding sender)
    });
  });
  
  // Handle ping acknowledgment
  socket.on('ping-ack', (data) => {
    const { to, from, userName } = data;
    console.log(`User ${from} acknowledged ping from ${to}`);
    
    // Determine the userName to send back
    const userNameToSend = userName || 
      (globalVideoUsers[from] ? globalVideoUsers[from].userName : null) ||
      (activeUsers[from] ? activeUsers[from].username : null) ||
      'Unknown User';
    
    // Relay acknowledgment to the original pinger
    io.to(to).emit('ping-ack', {
      from: from,
      userName: userNameToSend
    });
  });
  
  // WebRTC signaling - Create room
  socket.on('create_room', (data) => {
    // Generate a random room ID or use provided one
    const roomId = (data && data.roomId) ? data.roomId : Math.random().toString(36).substring(2, 8);
    console.log(`Creating WebRTC room: ${roomId}`);
    
    // Store room info
    webrtcRooms[roomId] = {
      creator: socket.id,
      participants: [socket.id]
    };
    
    // Join the Socket.IO room
    socket.join(`webrtc_${roomId}`);
    
    // Send room ID back to client
    socket.emit('room_created', { roomId });
  });
  
  // WebRTC signaling - Join room
  socket.on('join_room', (data) => {
    const roomId = data.roomId;
    console.log(`User ${socket.id} joining WebRTC room: ${roomId}`);
    
    // Check if room exists
    if (!webrtcRooms[roomId]) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    
    // Join the Socket.IO room
    socket.join(`webrtc_${roomId}`);
    
    // Add to participants
    webrtcRooms[roomId].participants.push(socket.id);
    
    // Notify client
    socket.emit('room_joined', { roomId });
    
    // Notify other participants
    socket.to(`webrtc_${roomId}`).emit('user_joined', { userId: socket.id });
  });
  
  // WebRTC signaling - Handle offers, answers and ICE candidates
  socket.on('offer', (data) => {
    console.log(`Received offer from ${socket.id} to ${data.to} for room: ${data.roomId || 'global'}`);
    
    // Add the 'from' field if it's not present
    if (!data.from) {
      data.from = socket.id;
    }
    
    // Forward the offer to the specific peer
    if (data.to) {
      io.to(data.to).emit('offer', data);
    } else {
      // Broadcast to the room except sender
      socket.to(`webrtc_${data.roomId}`).emit('offer', data);
    }
  });
  
  socket.on('answer', (data) => {
    console.log(`Received answer from ${socket.id} to ${data.to} for room: ${data.roomId || 'global'}`);
    
    // Add the 'from' field if it's not present
    if (!data.from) {
      data.from = socket.id;
    }
    
    // Forward the answer to the specific peer
    if (data.to) {
      io.to(data.to).emit('answer', data);
    } else {
      // Broadcast to the room except sender
      socket.to(`webrtc_${data.roomId}`).emit('answer', data);
    }
  });
  
  socket.on('ice_candidate', (data) => {
    console.log(`Received ICE candidate from ${socket.id} to ${data.to} for room: ${data.roomId}`);
    
    // Forward the ICE candidate to the specific peer
    if (data.to) {
      io.to(data.to).emit('ice_candidate', data);
    } else {
      // Broadcast to the room except sender
      socket.to(`webrtc_${data.roomId}`).emit('ice_candidate', data);
    }
  });
  
  // Also support the ice-candidate event name format from client
  socket.on('ice-candidate', (data) => {
    console.log(`Received ICE candidate from ${socket.id} to ${data.to}`);
    
    // Add from field if not present
    if (!data.from) {
      data.from = socket.id;
    }
    
    // Forward the ICE candidate to the specific peer
    if (data.to) {
      io.to(data.to).emit('ice-candidate', data);
    }
  });
  
  // Handle disconnect room
  socket.on('disconnect_room', (data) => {
    const roomId = data.roomId;
    if (roomId && webrtcRooms[roomId]) {
      leaveWebRTCRoom(socket.id, roomId);
    }
  });
  
  // Helper function to handle leaving a WebRTC room
  function leaveWebRTCRoom(socketId, roomId) {
    console.log(`User ${socketId} leaving WebRTC room: ${roomId}`);
    
    // Notify others in the room
    io.to(`webrtc_${roomId}`).emit('user_disconnected', { userId: socketId });
    
    // Remove from participants array
    if (webrtcRooms[roomId]) {
      webrtcRooms[roomId].participants = webrtcRooms[roomId].participants.filter(id => id !== socketId);
      
      // Delete room if empty
      if (webrtcRooms[roomId].participants.length === 0) {
        delete webrtcRooms[roomId];
        console.log(`Deleted empty WebRTC room: ${roomId}`);
      }
    }
  }
  
  // =====================================================
  // Handle disconnection
  // =====================================================
  
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Handle global video chat
    if (globalVideoUsers[socket.id]) {
      // Notify other users in global video chat
      const roomId = globalVideoUsers[socket.id].roomId;
      socket.to(roomId).emit('user-left', {
        userId: socket.id,
        userName: globalVideoUsers[socket.id].userName
      });
      
      // Remove from global users
      delete globalVideoUsers[socket.id];
    }
    
    // Remove user from active users
    const user = activeUsers[socket.id];
    if (user) {
      // Notify all channels this user was in
      for (const channelId in channels) {
        if (channels[channelId].has(socket.id)) {
          // Remove from channel
          channels[channelId].delete(socket.id);
          
          // Notify channel members
          io.to(`channel_${channelId}`).emit('user_left_channel', {
            channelId: channelId,
            user: {
              userId: user.userId,
              username: user.username
            }
          });
        }
      }
      
      // Delete user from active users
      delete activeUsers[socket.id];
    }
    
    // Handle WebRTC room cleanup
    for (const roomId in webrtcRooms) {
      const room = webrtcRooms[roomId];
      
      // Check if user was in this room
      if (room.participants.includes(socket.id)) {
        leaveWebRTCRoom(socket.id, roomId);
      }
    }
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Unified Socket.IO server running on port ${PORT}`);
  console.log(`Socket.IO server available at http://localhost:${PORT}`);
});
