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
    methods: ["GET", "POST"]
  }
});

// Store active users and channels
const activeUsers = {};
const channels = {};

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
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
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
  });
});

// Start the server
const PORT = process.env.SOCKET_PORT || 3000;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
