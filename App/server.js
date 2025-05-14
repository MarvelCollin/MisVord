
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());

const server = http.createServer(app);


const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["*"]
  },
  
  transports: ['websocket', 'polling']
});


app.use(express.static(path.join(__dirname, 'public')));


app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    service: 'web-server',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});


const globalVideoUsers = {};


io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  
  socket.on('join-global-room', (data) => {
    const { roomId, userId, userName } = data;
    console.log(`User ${userName || socket.id} joined global room: ${roomId}`);
    
    
    socket.join(roomId);
    
    
    globalVideoUsers[socket.id] = {
      userId: userId || socket.id,
      userName: userName || `User_${socket.id.substring(0, 4)}`,
      roomId: roomId
    };
    
    
    socket.to(roomId).emit('user-joined', {
      userId: socket.id,
      userName: userName || `User_${socket.id.substring(0, 4)}`
    });
  });
  
  
  socket.on('get-global-users', (data) => {
    const { roomId } = data;
    console.log(`Sending global users list to ${socket.id}`);
    const users = Object.keys(globalVideoUsers).map(id => ({
      userId: id,
      userName: globalVideoUsers[id].userName
    }));
    socket.emit('global-users', { users });
  });
  
  
  socket.on('ping-all-users', (data) => {
    console.log(`User ${socket.id} pinged all users in global room`);
    
    
    const pingData = {
      from: socket.id,
      userName: globalVideoUsers[socket.id] ? globalVideoUsers[socket.id].userName : 'Unknown User',
      fromUserName: data.fromUserName || (globalVideoUsers[socket.id] ? globalVideoUsers[socket.id].userName : 'Unknown User'),
      timestamp: Date.now()
    };
    
    
    if (data) {
      if (data.roomId) pingData.roomId = data.roomId;
      if (data.message) pingData.message = data.message;
    }
    
    
    socket.to('global-video-chat').emit('user-ping', pingData);
    
    
    socket.emit('ping-sent', {
      success: true,
      timestamp: Date.now(),
      recipients: Object.keys(globalVideoUsers).length - 1 
    });
  });
  
  
  socket.on('ping-ack', (data) => {
    const { to, from, userName } = data;
    console.log(`User ${from} acknowledged ping from ${to}`);
    
    
    io.to(to).emit('ping-ack', {
      from: from,
      userName: userName || globalVideoUsers[from]?.userName || 'Unknown User'
    });
  });
  
  
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
  
  
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    
    const userData = globalVideoUsers[socket.id];
    if (userData && userData.roomId) {
      socket.to(userData.roomId).emit('user-left', {
        userId: socket.id,
        userName: userData.userName
      });
    }
    
    
    delete globalVideoUsers[socket.id];
  });
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http:
}); 
