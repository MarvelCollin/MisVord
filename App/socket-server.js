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
  transports: ['websocket', 'polling']
});

app.use(express.static(path.join(__dirname, 'public')));

const activeUsers = {};
const channels = {};
const webrtcRooms = {};
const globalVideoUsers = {};

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

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

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
    
    console.log(`User ${userName} (${socket.id}) joined global room: ${roomId}`);
    
    socket.join(roomId);
    
    globalVideoUsers[socket.id] = {
      userId: socket.id,
      userName: userName,
      roomId: roomId
    };
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Unified Socket.IO server running on port ${PORT}`);
  console.log(`Socket.IO server available at http://localhost:${PORT}`);
});
