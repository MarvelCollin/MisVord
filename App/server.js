// Simple Express server with Socket.IO for WebRTC signaling
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());

const server = http.createServer(app);

// Set up Socket.IO with more permissive CORS support
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins during development
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["*"]
  },
  // Explicitly configure transport options
  transports: ['websocket', 'polling']
});

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Add status endpoint
app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    service: 'web-server',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Store connected users
const globalVideoUsers = {};

// Handle Socket.IO connections
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Handle joining global room
  socket.on('join-global-room', (data) => {
    const { roomId, userId, userName } = data;
    console.log(`User ${userName || socket.id} joined global room: ${roomId}`);
    
    // Join the room
    socket.join(roomId);
    
    // Store user info
    globalVideoUsers[socket.id] = {
      userId: userId || socket.id,
      userName: userName || `User_${socket.id.substring(0, 4)}`,
      roomId: roomId
    };
    
    // Notify others
    socket.to(roomId).emit('user-joined', {
      userId: socket.id,
      userName: userName || `User_${socket.id.substring(0, 4)}`
    });
  });
  
  // Handle getting global users
  socket.on('get-global-users', (data) => {
    const { roomId } = data;
    console.log(`Sending global users list to ${socket.id}`);
    const users = Object.keys(globalVideoUsers).map(id => ({
      userId: id,
      userName: globalVideoUsers[id].userName
    }));
    socket.emit('global-users', { users });
  });
  
  // Handle ping requests
  socket.on('ping-all-users', (data) => {
    console.log(`User ${socket.id} pinged all users in global room`);
    
    // Add the user info if not provided
    const pingData = {
      from: socket.id,
      userName: globalVideoUsers[socket.id] ? globalVideoUsers[socket.id].userName : 'Unknown User',
      fromUserName: data.fromUserName || (globalVideoUsers[socket.id] ? globalVideoUsers[socket.id].userName : 'Unknown User'),
      timestamp: Date.now()
    };
    
    // Add any additional data from the request
    if (data) {
      if (data.roomId) pingData.roomId = data.roomId;
      if (data.message) pingData.message = data.message;
    }
    
    // Relay the ping to all users in the global room except the sender
    socket.to('global-video-chat').emit('user-ping', pingData);
    
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
    
    // Relay acknowledgment to the original pinger
    io.to(to).emit('ping-ack', {
      from: from,
      userName: userName || globalVideoUsers[from]?.userName || 'Unknown User'
    });
  });
  
  // Handle WebRTC signaling
  socket.on('offer', (data) => {
    const { to } = data;
    console.log(`Relaying offer from ${socket.id} to ${to}`);
    socket.to(to).emit('offer', data);
  });
  
  socket.on('answer', (data) => {
    const { to } = data;
    console.log(`Relaying answer from ${socket.id} to ${to}`);
    socket.to(to).emit('answer', data);
  });
  
  socket.on('ice-candidate', (data) => {
    const { to } = data;
    console.log(`Relaying ICE candidate from ${socket.id} to ${to}`);
    socket.to(to).emit('ice-candidate', data);
  });
  
  // Handle disconnections
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Notify others in the room
    const userData = globalVideoUsers[socket.id];
    if (userData && userData.roomId) {
      socket.to(userData.roomId).emit('user-left', {
        userId: socket.id,
        userName: userData.userName
      });
    }
    
    // Remove from global users
    delete globalVideoUsers[socket.id];
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to test`);
}); 