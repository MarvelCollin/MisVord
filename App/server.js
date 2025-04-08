const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const channels = {};

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  let currentUser = null;
  let currentChannel = null;

  socket.on('register', (user) => {
    console.log(`User registered: ${user.username} (${user.id})`);
    currentUser = user;
  });

  socket.on('join-channel', (channelId, user) => {
    console.log(`${user.username} joining channel ${channelId}`);
    
    if (currentChannel) {
      leaveCurrentChannel();
    }
    
    socket.join(channelId);
    currentChannel = channelId;
    currentUser = user;
    
    if (!channels[channelId]) {
      channels[channelId] = {};
    }
    
    channels[channelId][user.id] = {
      id: user.id,
      username: user.username,
      socketId: socket.id,
      isMuted: false,
      isDeafened: false
    };
    
    socket.to(channelId).emit('user-joined', user, channelId);
    
    const channelUsers = Object.values(channels[channelId]);
    socket.emit('channel-users', channelUsers);
  });

  socket.on('leave-channel', (channelId, userId) => {
    leaveChannel(channelId, userId);
  });

  socket.on('offer', (offer, to, from) => {
    console.log(`Relaying offer from ${from} to ${to}`);
    socket.to(findSocketIdByUserId(to)).emit('offer', offer, from);
  });

  socket.on('answer', (answer, to, from) => {
    console.log(`Relaying answer from ${from} to ${to}`);
    socket.to(findSocketIdByUserId(to)).emit('answer', answer, from);
  });

  socket.on('ice-candidate', (candidate, to, from) => {
    console.log(`Relaying ICE candidate from ${from} to ${to}`);
    socket.to(findSocketIdByUserId(to)).emit('ice-candidate', candidate, from);
  });

  socket.on('user-mute-change', (channelId, userId, isMuted) => {
    if (channels[channelId] && channels[channelId][userId]) {
      channels[channelId][userId].isMuted = isMuted;
      socket.to(channelId).emit('user-mute-update', userId, isMuted);
    }
  });

  socket.on('user-deafen-change', (channelId, userId, isDeafened) => {
    if (channels[channelId] && channels[channelId][userId]) {
      channels[channelId][userId].isDeafened = isDeafened;
      socket.to(channelId).emit('user-deafen-update', userId, isDeafened);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    leaveCurrentChannel();
  });

  function leaveCurrentChannel() {
    if (currentChannel && currentUser) {
      leaveChannel(currentChannel, currentUser.id);
    }
  }

  function leaveChannel(channelId, userId) {
    if (channels[channelId] && channels[channelId][userId]) {
      console.log(`${channels[channelId][userId].username} leaving channel ${channelId}`);
      
      delete channels[channelId][userId];
      
      socket.to(channelId).emit('user-left', userId);
      
      socket.leave(channelId);
      
      if (Object.keys(channels[channelId]).length === 0) {
        delete channels[channelId];
      }
      
      if (userId === currentUser?.id) {
        currentChannel = null;
      }
    }
  }

  function findSocketIdByUserId(userId) {
    for (const channelId in channels) {
      if (channels[channelId][userId]) {
        return channels[channelId][userId].socketId;
      }
    }
    return null;
  }
});

const PORT = process.env.SOCKET_PORT || 3000;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
