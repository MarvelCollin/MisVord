const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
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
  }
});

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
    uptime: process.uptime(),
    connections: Object.keys(activeUsers).length,
    timestamp: new Date().toISOString()
  });
});

// API endpoint to broadcast events from PHP
app.post('/broadcast', express.json(), (req, res) => {
  // Simple API key check
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== (process.env.SOCKET_API_KEY || 'miscvord-secret')) {
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
  
  // WebRTC signaling - Handle offers, answers and ICE candidates  socket.on('offer', (data) => {
    console.log(`Received offer from ${socket.id} to ${data.to} for room: ${data.roomId || 'global'}`);
    
    // Add the 'from' field if it's not present
    if (!data.from) {
      data.from = socket.id;
    }
    
    // Forward the offer to the specific peer
    if (data.to) {
      io.to(data.to).emit('offer', data);
    } else {
      // Backward compatibility - broadcast to the room except sender
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
      // Backward compatibility - broadcast to the room except sender
      socket.to(`webrtc_${data.roomId}`).emit('answer', data);
    }
  });
    socket.on('ice_candidate', (data) => {
    console.log(`Received ICE candidate from ${socket.id} to ${data.to} for room: ${data.roomId}`);
    
    // Forward the ICE candidate to the specific peer
    if (data.to) {
      io.to(data.to).emit('ice_candidate', data);
    } else {
      // Backward compatibility - broadcast to the room except sender
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
  // Global video chat handlers
  socket.on('join-global-room', (data) => {
    console.log(`User joining global video chat: ${socket.id} (${data.userName})`);
    
    // Add to global room
    socket.join('global-video-chat');
    
    // Store user info
    globalVideoUsers[socket.id] = {
      userId: socket.id,
      userName: data.userName || `User_${socket.id.substring(0, 5)}`
    };
    
    // Notify other users in the room
    socket.to('global-video-chat').emit('user-joined', {
      userId: socket.id,
      userName: globalVideoUsers[socket.id].userName
    });
    
    console.log(`Current global video users: ${Object.keys(globalVideoUsers).length}`);
  });
  
  socket.on('leave-global-room', () => {
    console.log(`User leaving global video chat: ${socket.id}`);
    socket.leave('global-video-chat');
    delete globalVideoUsers[socket.id];
    
    // Notify others
    io.to('global-video-chat').emit('user-left', {
      userId: socket.id
    });
  });
  
  socket.on('get-global-users', () => {
    console.log(`Sending global users list to ${socket.id}`);
    const users = Object.keys(globalVideoUsers).map(id => ({
      userId: id,
      userName: globalVideoUsers[id].userName
    }));
    socket.emit('global-users', { users });
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Handle global video chat
    if (globalVideoUsers[socket.id]) {
      // Notify other users in global video chat
      socket.to('global-video-chat').emit('user-left', {
        userId: socket.id
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
const PORT = process.env.SOCKET_PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
