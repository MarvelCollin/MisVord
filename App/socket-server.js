const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const { Server } = require('socket.io');
const cors = require('cors');
// const path = require('path'); // Not used in this simplified version
require('dotenv').config();

const app = express();
app.use(cors({
  origin: process.env.CORS_ALLOWED_ORIGINS || '*', // Use env variable in production
  methods: ['GET', 'POST'],
  credentials: true
})); 

// Create HTTP server
const httpServer = http.createServer(app);

// Try to create HTTPS server if cert files exist
let httpsServer = null;
let server = httpServer; // Default to HTTP server

// Check if we can enable HTTPS/WSS
try {
  if (fs.existsSync('./docker/certs/server.key') && fs.existsSync('./docker/certs/server.crt')) {
    console.log('🔒 SSL certificates found! Enabling secure WebSockets (WSS)');
    const options = {
      key: fs.readFileSync('./docker/certs/server.key'),
      cert: fs.readFileSync('./docker/certs/server.crt')
    };
    httpsServer = https.createServer(options, app);
    // Use HTTPS server if available
    server = httpsServer;
    console.log('🔒 HTTPS/WSS server created successfully');
  } else {
    console.log('⚠️ SSL certificates not found. Running in HTTP/WS mode only.');
  }
} catch (err) {
  console.log('⚠️ Error setting up HTTPS server:', err.message);
  console.log('⚠️ Running in HTTP/WS mode only.');
}

// Get allowed origins from env or use default wildcard
const corsAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS || '*';
console.log(`CORS allowed origins: ${corsAllowedOrigins}`);

// Get Socket.IO path from environment variable or use default
const socketPath = process.env.SOCKET_PATH || '/socket.io';
console.log(`Using Socket.IO path: ${socketPath}`);

// Setup Socket.IO with enhanced CORS and path support for Nginx subpath
const io = new Server(server, {
  cors: {
    origin: corsAllowedOrigins, // Use environment variable or allow all
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  // Allow Socket.IO to work behind Nginx with path prefix
  path: socketPath,
  allowEIO3: true,
  // Trust proxies for secure WebSocket connections
  handlePreflightRequest: (req, res) => {
    const headers = {
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Origin': req.headers.origin || '*',
      'Access-Control-Allow-Credentials': true,
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,PUT,DELETE'
    };
    res.writeHead(200, headers);
    res.end();
  }
});

// Enhanced debugging configuration
const DEBUG_MODE = process.env.NODE_ENV !== 'production';
const DEBUG_CONNECTION = true;
const DEBUG_SIGNALING = true;
const DEBUG_USERS = true;

// Enhanced logging function with timestamps and color formatting
function debugLog(...args) {
  const timestamp = new Date().toISOString();
  
    // Support log levels: info, error, success, warn, debug
    let level = 'info';
    if (typeof args[0] === 'string') {
      const msg = args[0].toLowerCase();
      if (msg.includes('error')) level = 'error';
      else if (msg.includes('success')) level = 'success';
      else if (msg.includes('warn')) level = 'warn';
      else if (msg.includes('debug')) level = 'debug';
      else if (msg.includes('fail')) level = 'error';
    else if (msg.includes('[user]')) level = 'user';
    else if (msg.includes('[signal]')) level = 'signal';
    }
  
    const color = {
      info: '\x1b[36m', // cyan
      error: '\x1b[31m', // red
      success: '\x1b[32m', // green
      warn: '\x1b[33m', // yellow
    debug: '\x1b[35m', // magenta,
    user: '\x1b[33m\x1b[1m', // bright yellow (bold)
    signal: '\x1b[36m\x1b[1m', // bright cyan (bold)
    }[level] || '\x1b[0m';
  
    const reset = '\x1b[0m';
  
  if (DEBUG_MODE) {
    console.log(`${color}[${level.toUpperCase()} ${timestamp}]${reset}`, ...args);
  }
}

// Log active connections every minute
let activeConnections = 0;
setInterval(() => {
  const roomCount = io.sockets.adapter.rooms.size;
  const clientCount = io.engine.clientsCount;
  debugLog(`Server status: ${clientCount} clients connected, ${Object.keys(videoChatUsers).length} video users, ${roomCount} active rooms`);
  
  // Detailed room info
  if (DEBUG_USERS && io.sockets.adapter.rooms.get(VIDEO_CHAT_ROOM)) {
    const roomSize = io.sockets.adapter.rooms.get(VIDEO_CHAT_ROOM).size;
    debugLog(`Video chat room has ${roomSize} socket connections and ${Object.keys(videoChatUsers).length} registered users`);
    
    // Log all users in the video chat room
    if (Object.keys(videoChatUsers).length > 0) {
      console.table(Object.values(videoChatUsers).map(u => ({
        socketId: u.socketId,
        userName: u.userName,
        connectionQuality: u.connectionQuality || 'unknown'
      })));
    }
  }
}, 60000);

// VPS detection - helps with automatic protocol detection
const isVpsEnvironment = process.env.NODE_ENV === 'production' || process.env.IS_VPS === 'true';
if (isVpsEnvironment) {
  console.log('🌐 Running in VPS environment - enabling production optimizations');
}

const VIDEO_CHAT_ROOM = 'global-video-chat';
const videoChatUsers = {}; // Store users in the video chat { socketId: { userId, userName, socketId } }

// Endpoint to get current video chat users
app.get('/video-users', (req, res) => {
  res.json({
    users: Object.values(videoChatUsers),
    count: Object.keys(videoChatUsers).length,
    timestamp: new Date().toISOString()
  });
});

// Basic health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    videoChatUserCount: Object.keys(videoChatUsers).length,
    port: PORT,
    socketPath: socketPath,
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      PORT: process.env.PORT || 'not set',
      SOCKET_URL: process.env.SOCKET_URL || 'not set',
      CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS || 'not set',
      SOCKET_PATH: process.env.SOCKET_PATH || 'not set (using default /socket.io)'
    }
  });
});

// Add an endpoint specifically for the /misvord/socket/ path to verify it's working
app.get('/socket-test', (req, res) => {
  res.json({
    message: "Socket server path test endpoint reached successfully",
    serverTime: new Date().toISOString(),
    socketPath: socketPath,
    activeUsers: Object.keys(videoChatUsers).length,
    clientInfo: {
      ip: req.ip,
      headers: req.headers
    }
  });
});

// Endpoint to get socket server info for debugging
app.get('/info', (req, res) => {
  res.json({
    serverVersion: '1.0.0',
    socketIO: {
      version: require('socket.io/package.json').version,
      connections: io.engine.clientsCount,
      transports: io.engine.opts.transports
    },
    serverUptime: process.uptime(),
    activeRooms: Array.from(io.sockets.adapter.rooms.keys()).filter(room => !room.startsWith('/')),
    activeUsers: Object.keys(videoChatUsers).length,
    port: PORT,
    env: {
      NODE_ENV: process.env.NODE_ENV || 'development',
      SOCKET_URL: process.env.SOCKET_URL || 'not set',
      IS_VPS: process.env.IS_VPS || 'false'
    }
  });
});

// Helper to get detailed room member information
function getRoomMembers(roomName) {
  try {
    const roomMembers = io.sockets.adapter.rooms.get(roomName);
    if (!roomMembers) return [];
    
    const detailedMembers = [];
    for (const memberId of roomMembers) {
      detailedMembers.push({
        socketId: memberId,
        userName: videoChatUsers[memberId]?.userName || 'Unknown',
        connectionQuality: videoChatUsers[memberId]?.connectionQuality || 'unknown',
        isRegistered: !!videoChatUsers[memberId]
      });
    }
    return detailedMembers;
  } catch (err) {
    console.error(`Error getting room members: ${err.message}`);
    return [];
  }
}

io.on('connection', (socket) => {
  activeConnections++;
  const clientIp = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
  const clientPath = socket.handshake.query.path || 'Not provided';
  const clientEnv = socket.handshake.query.envType || 'Not provided';
  const protocol = socket.handshake.headers['x-forwarded-proto'] || 'http';
  const isSecure = protocol === 'https' || socket.handshake.secure;
  
  console.log(`[CONNECTION] Socket connected: ${socket.id} from ${clientIp} (Total: ${activeConnections})`);
  console.log(`[CONNECTION] Client info: Environment=${clientEnv}, Path=${clientPath}, Protocol=${protocol}, Secure=${isSecure}`);
  
  debugLog(`User connected: ${socket.id}`);

  // Track connection quality
  let connectionQuality = 'unknown';
  let lastPingTime = Date.now();

  // Send periodic pings to check connection quality
  const pingInterval = setInterval(() => {
    if (!videoChatUsers[socket.id]) {
      clearInterval(pingInterval);
      return;
    }
    
    lastPingTime = Date.now();
    socket.emit('connection-ping', { timestamp: lastPingTime });
  }, 30000); // every 30 seconds

  socket.on('connection-pong', (data) => {
    const latency = Date.now() - data.timestamp;
    
    // Update connection quality based on latency
    if (latency < 100) {
      connectionQuality = 'excellent';
    } else if (latency < 300) {
      connectionQuality = 'good';
    } else if (latency < 500) {
      connectionQuality = 'fair';
    } else {
      connectionQuality = 'poor';
    }
    
    // Let client know about their connection quality
    socket.emit('connection-quality', { 
      quality: connectionQuality, 
      latency: latency 
    });
  });

  socket.on('join-video-room', (data) => {
    const { userName } = data || {};
    if (!userName) {
      debugLog(`User ${socket.id} tried to join video room without userName.`);
      socket.emit('video-room-error', { message: 'User name is required to join the video room.' });
      return;
    }

    console.log(`[USER-JOIN] ${userName} (${socket.id}) joining video room: ${VIDEO_CHAT_ROOM}`);
    debugLog(`[JOIN] User ${userName} (${socket.id}) joining video room: ${VIDEO_CHAT_ROOM}`);
    
    // Check if socket is already in the room
    const isAlreadyInRoom = socket.rooms.has(VIDEO_CHAT_ROOM);
    if (isAlreadyInRoom) {
      console.log(`[USER-JOIN] Warning: ${userName} (${socket.id}) is already in the room`);
    }
    
    // Get room members before join
    const membersBeforeJoin = getRoomMembers(VIDEO_CHAT_ROOM);
    console.log(`[USER-JOIN] Room members before join: ${membersBeforeJoin.length}`);
    if (membersBeforeJoin.length > 0) {
      console.table(membersBeforeJoin);
    }
    
    socket.join(VIDEO_CHAT_ROOM);

    videoChatUsers[socket.id] = {
      userId: socket.id,
      userName: userName,
      socketId: socket.id,
      connectionQuality: 'unknown',
      joinTime: new Date().toISOString()
    };

    // Get all sockets in the room after joining
    const roomSockets = io.sockets.adapter.rooms.get(VIDEO_CHAT_ROOM);
    const roomSize = roomSockets ? roomSockets.size : 0;
    console.log(`[USER-JOIN] Room size after join: ${roomSize}, registered users: ${Object.keys(videoChatUsers).length}`);

    // Get detailed member list after join
    const membersAfterJoin = getRoomMembers(VIDEO_CHAT_ROOM);
    console.log(`[USER-JOIN] Room members after join: ${membersAfterJoin.length}`);
    if (membersAfterJoin.length > 0) {
      console.table(membersAfterJoin);
    }

    // Notify others in the room
    socket.to(VIDEO_CHAT_ROOM).emit('user-joined-video-room', videoChatUsers[socket.id]);
    console.log(`[USER-JOIN] Notified others about ${userName} joining`);

    // Send the current list of users in the room to the new joiner
    const usersInRoom = Object.values(videoChatUsers).filter(u => 
      // Verify the user is actually in the room by checking socket.rooms
      roomSockets && roomSockets.has(u.socketId)
    );
    
    socket.emit('video-room-users', { users: usersInRoom });
    
    console.log(`[USER-JOIN] Current users in room: ${usersInRoom.map(u => u.userName).join(', ')}`);
    debugLog(`[JOIN] User ${userName} (${socket.id}) added. Current video room users:`, Object.keys(videoChatUsers).length);
    debugLog(`[JOIN] Sent user list to ${userName}:`, usersInRoom.map(u=>u.userName));
  });

  socket.on('leave-video-room', () => {
    handleUserLeaveVideoRoom(socket);
  });

  socket.on('disconnect', (reason) => {
    activeConnections--;
    console.log(`[DISCONNECT] User ${socket.id} disconnected: ${reason} (Total: ${activeConnections})`);
    debugLog(`User disconnected: ${socket.id}, reason: ${reason}`);
    clearInterval(pingInterval);
    handleUserLeaveVideoRoom(socket);
  });

  function handleUserLeaveVideoRoom(socketInstance) {
    if (videoChatUsers[socketInstance.id]) {
      const leavingUser = videoChatUsers[socketInstance.id];
      console.log(`[USER-LEAVE] ${leavingUser.userName} (${socketInstance.id}) leaving video room`);
      debugLog(`User ${leavingUser.userName} (${socketInstance.id}) leaving video room: ${VIDEO_CHAT_ROOM}`);
      
      // Get room members before leave
      const membersBeforeLeave = getRoomMembers(VIDEO_CHAT_ROOM);
      console.log(`[USER-LEAVE] Room members before leave: ${membersBeforeLeave.length}`);
      if (membersBeforeLeave.length > 0) {
        console.table(membersBeforeLeave);
      }
      
      socketInstance.leave(VIDEO_CHAT_ROOM);
      delete videoChatUsers[socketInstance.id];

      // Notify others in the room
      io.to(VIDEO_CHAT_ROOM).emit('user-left-video-room', { 
        userId: socketInstance.id, 
        userName: leavingUser.userName 
      });
      
      // Log the remaining users
      const remainingUsers = Object.values(videoChatUsers).map(u => u.userName);
      console.log(`[USER-LEAVE] After ${leavingUser.userName} left, remaining users: ${remainingUsers.join(', ') || 'None'}`);
      
      // Log room size and members after leave
      const roomSockets = io.sockets.adapter.rooms.get(VIDEO_CHAT_ROOM);
      const roomSize = roomSockets ? roomSockets.size : 0;
      console.log(`[USER-LEAVE] Room size after user left: ${roomSize}, registered users: ${Object.keys(videoChatUsers).length}`);
      
      // Get detailed member list after leave
      const membersAfterLeave = getRoomMembers(VIDEO_CHAT_ROOM);
      console.log(`[USER-LEAVE] Room members after leave: ${membersAfterLeave.length}`);
      if (membersAfterLeave.length > 0) {
        console.table(membersAfterLeave);
      }
      
      debugLog(`User ${leavingUser.userName} (${socketInstance.id}) removed. Current video room users:`, Object.keys(videoChatUsers).length);
    }
  }

  // WebRTC Signaling
  socket.on('webrtc-offer', (data) => {
    const { to, offer, fromUserName } = data;
    if (!to || !offer) {
      debugLog(`Invalid WebRTC offer from ${socket.id}. Missing 'to' or 'offer'.`);
      return;
    }

    console.log(`[SIGNAL] Offer from ${fromUserName} (${socket.id}) to ${to}`);
    
    // Get the target socket directly
    const targetSocket = io.sockets.sockets.get(to);
    if (!targetSocket) {
      console.log(`[SIGNAL] WARNING: Target socket ${to} not found for offer from ${fromUserName}`);
      
      // Notify sender that the target is not available
      socket.emit('user-left-video-room', { 
        userId: to,
        userName: videoChatUsers[to]?.userName || 'Unknown User'
      });
      
      return;
    }
    
    // Simply relay the offer to the target
    debugLog(`Relaying WebRTC offer from ${fromUserName} (${socket.id}) to ${to}`);
    targetSocket.emit('webrtc-offer', { 
      from: socket.id, 
      offer,
      fromUserName: fromUserName || videoChatUsers[socket.id]?.userName || 'Unknown'
    });
    
    // Send acknowledgment to sender that the offer was delivered
    socket.emit('webrtc-signal-status', {
      type: 'offer',
      to: to,
      status: 'delivered'
    });
  });

  socket.on('webrtc-answer', (data) => {
    const { to, answer, fromUserName } = data;
     if (!to || !answer) {
      debugLog(`Invalid WebRTC answer from ${socket.id}. Missing 'to' or 'answer'.`);
      return;
    }
    
    // Get the target socket directly
    const targetSocket = io.sockets.sockets.get(to);
    if (!targetSocket) {
      console.log(`[SIGNAL] WARNING: Target socket ${to} not found for answer from ${fromUserName}`);
      
      // Notify sender that the target is not available
      socket.emit('user-left-video-room', { 
        userId: to,
        userName: videoChatUsers[to]?.userName || 'Unknown User'
      });
      
      return;
    }
    
    console.log(`[SIGNAL] Answer from ${fromUserName} (${socket.id}) to ${to}`);
    
    // Relay the answer to the target
    targetSocket.emit('webrtc-answer', { 
      from: socket.id, 
      answer,
      fromUserName: fromUserName || videoChatUsers[socket.id]?.userName || 'Unknown'
    });
    
    // Send acknowledgment to sender that the answer was delivered
    socket.emit('webrtc-signal-status', {
      type: 'answer',
      to: to,
      status: 'delivered'
    });
  });

  socket.on('webrtc-ice-candidate', (data) => {
    const { to, candidate } = data;
    if (!to || !candidate) {
      debugLog(`Invalid WebRTC ICE candidate from ${socket.id}. Missing 'to' or 'candidate'.`);
      return;
    }
    
    // Get target socket directly
    const targetSocket = io.sockets.sockets.get(to);
    if (!targetSocket) {
      // Less verbose for ICE candidates as there can be many
      if (DEBUG_SIGNALING) {
        console.log(`[SIGNAL] Target socket ${to} not found for ICE candidate from ${socket.id}`);
      }
      return;
    }
    
    // Relay the ICE candidate to the target
    targetSocket.emit('webrtc-ice-candidate', { 
      from: socket.id, 
      candidate
    });
  });

  // Handle reconnection attempts
  socket.on('webrtc-reconnect-request', (data) => {
    const { to, fromUserName } = data;
    if (!to) return;
    
    const targetSocket = io.sockets.sockets.get(to);
    if (!targetSocket) {
      console.log(`[SIGNAL] Target socket ${to} not found for reconnection from ${fromUserName}`);
      return;
    }
    
    console.log(`[SIGNAL] Reconnection request from ${fromUserName} (${socket.id}) to ${to}`);
    debugLog(`Reconnection request from ${fromUserName} (${socket.id}) to ${to}`);
    targetSocket.emit('webrtc-reconnect-request', { 
      from: socket.id, 
      fromUserName, 
      timestamp: Date.now() 
    });
  });

  // Connection diagnostic events
  socket.on('webrtc-connection-stats', (data) => {
    const { stats } = data;
    if (!stats) return;

    if (videoChatUsers[socket.id]) {
      videoChatUsers[socket.id].connectionQuality = stats.quality || 'unknown';
    }
  });

  // Ping system for connection verification
  socket.on('ping-server', (data, callback) => {
    const timestamp = Date.now();
    const pingTime = timestamp - (data.timestamp || timestamp);
    
    // Log the ping event
    console.log(`[PING] Server received ping from ${socket.id}, latency: ${pingTime}ms`);
    
    // If callback is provided (using socket.io acknowledgements), respond with server data
    if (typeof callback === 'function') {
      callback({
        serverTime: timestamp,
        latency: pingTime,
        serverUsers: Object.keys(videoChatUsers).length,
        yourId: socket.id
      });
    }
  });
  
  socket.on('ping-user', (data) => {
    const { targetId, echo, timestamp } = data;
    
    // Log the ping event
    console.log(`[PING] User ${socket.id} is pinging ${targetId}`);
    
    if (!targetId) return;
    
    // Check if target user exists
    const targetSocket = io.sockets.sockets.get(targetId);
    if (!targetSocket) {
      // Notify sender that target is not found
      socket.emit('ping-response', {
        targetId,
        status: 'not-found',
        message: `User with ID ${targetId} not found`,
        timestamp: Date.now(),
        originalTimestamp: timestamp
      });
      return;
    }
    
    // Send ping to target user
    targetSocket.emit('ping-request', {
      from: socket.id,
      fromUserName: videoChatUsers[socket.id]?.userName || 'Unknown',
      timestamp: Date.now(),
      originalTimestamp: timestamp,
      echo: echo
    });
    
    // If echo is false, immediately respond to sender instead of waiting for target to respond
    if (echo === false) {
      socket.emit('ping-response', {
        targetId,
        status: 'delivered',
        message: `Ping delivered to ${targetId}`,
        timestamp: Date.now(),
        originalTimestamp: timestamp
      });
    }
  });
  
  socket.on('ping-response', (data) => {
    const { to, status, latency, timestamp, originalTimestamp } = data;
    
    // Log the ping response
    console.log(`[PING] User ${socket.id} is responding to ping from ${to} with status: ${status}`);
    
    if (!to) return;
    
    // Check if target user exists
    const targetSocket = io.sockets.sockets.get(to);
    if (!targetSocket) {
      console.log(`[PING] Cannot deliver ping response to ${to} - user not found`);
      return;
    }
    
    // Relay the response to the original sender
    targetSocket.emit('ping-response', {
      targetId: socket.id,
      status: status,
      latency: latency,
      timestamp: Date.now(),
      originalTimestamp: originalTimestamp
    });
  });
  
  socket.on('ping-all', (data) => {
    // Only allow if the user is in the video chat room
    if (!videoChatUsers[socket.id]) {
      socket.emit('ping-all-response', {
        status: 'error',
        message: 'You must be in a video room to ping all users',
        timestamp: Date.now()
      });
      return;
    }
    
    const timestamp = Date.now();
    const fromUserName = videoChatUsers[socket.id]?.userName || 'Unknown';
    
    console.log(`[PING] ${fromUserName} (${socket.id}) is pinging all users in the room`);
    
    // Get all users in the room
    const roomSockets = [...(io.sockets.adapter.rooms.get(VIDEO_CHAT_ROOM) || [])];
    const pingResults = {};
    
    // Track whether user is actually in the room despite being in videoChatUsers
    const isActuallyInRoom = roomSockets.includes(socket.id);
    
    if (!isActuallyInRoom) {
      socket.emit('ping-all-response', {
        status: 'error',
        message: 'You appear to be in users list but not in the room. Try reconnecting.',
        timestamp: Date.now()
      });
      return;
    }
    
    // Initialize results for all users
    roomSockets.forEach(socketId => {
      if (socketId !== socket.id) {
        pingResults[socketId] = {
          userName: videoChatUsers[socketId]?.userName || 'Unknown',
          status: 'pending',
          latency: null
        };
      }
    });
    
    // Send initial response with all users that will be pinged
    socket.emit('ping-all-response', {
      status: 'initiated',
      users: pingResults,
      roomSize: roomSockets.length,
      timestamp
    });
    
    // Ping each user individually
    roomSockets.forEach(targetId => {
      if (targetId === socket.id) return; // Skip self
      
      const targetSocket = io.sockets.sockets.get(targetId);
      if (!targetSocket) {
        // Update result for this user
        pingResults[targetId] = {
          ...pingResults[targetId],
          status: 'not-found',
          error: 'Socket not found'
        };
        return;
      }
      
      // Send ping to this user
      targetSocket.emit('ping-request', {
        from: socket.id,
        fromUserName,
        timestamp: Date.now(),
        originalTimestamp: timestamp,
        isPingAll: true
      });
    });
    
    // Send immediate response to show deliveries
    socket.emit('ping-all-update', {
      users: pingResults,
      timestamp: Date.now(),
      originalTimestamp: timestamp
    });
  });

  // Support for backward compatibility with old 'offer'/'answer' events
  socket.on('offer', (data) => {
    const { to } = data;
    if (!to) return;
    
    debugLog(`[LEGACY] Converting 'offer' to 'webrtc-offer' from ${socket.id} to ${to}`);
    io.to(to).emit('webrtc-offer', { 
      from: socket.id, 
      offer: data.offer || data.sdp,
      fromUserName: data.fromUserName || (videoChatUsers[socket.id]?.userName || 'Unknown user')
    });
  });

  socket.on('answer', (data) => {
    const { to } = data;
    if (!to) return;
    
    debugLog(`[LEGACY] Converting 'answer' to 'webrtc-answer' from ${socket.id} to ${to}`);
    io.to(to).emit('webrtc-answer', { 
      from: socket.id, 
      answer: data.answer || data.sdp,
      fromUserName: data.fromUserName || (videoChatUsers[socket.id]?.userName || 'Unknown user')
    });
  });

  socket.on('ice-candidate', (data) => {
    const { to } = data;
    if (!to) return;
    
    debugLog(`[LEGACY] Converting 'ice-candidate' to 'webrtc-ice-candidate' from ${socket.id} to ${to}`);
    io.to(to).emit('webrtc-ice-candidate', { 
      from: socket.id, 
      candidate: data.candidate
    });
  });
});

// Always use port 1002 by default instead of 3000
// Since we saw 3000 was already in use in the error logs
const PORT = process.env.PORT || 1002;
const SECURE_PORT = process.env.SECURE_PORT || 1443;

// Safety check to avoid port 3000 that's already in use
const FINAL_PORT = PORT === 3000 ? 1002 : PORT;
if (FINAL_PORT !== PORT) {
  console.log(`⚠️ Port ${PORT} (possibly from environment) cannot be used. Using port ${FINAL_PORT} instead.`);
}

// Start the HTTP server
server.listen(FINAL_PORT, '0.0.0.0', () => {
  console.log(`🚀 Socket.IO server for video calls running on port ${FINAL_PORT}`);
  console.log(`Socket.IO server available at http://localhost:${FINAL_PORT}`);
  console.log(`Socket.IO path: ${socketPath}`);
});

// If HTTPS is enabled and we have a secure server instance, start it too
if (httpsServer && process.env.USE_HTTPS === 'true') {
  httpsServer.listen(SECURE_PORT, '0.0.0.0', () => {
    console.log(`🔒 SECURE Socket.IO server (WSS) running on port ${SECURE_PORT}`);
    console.log(`Secure Socket.IO server available at https://localhost:${SECURE_PORT}`);
  });
}
  
if (isVpsEnvironment) {
  console.log(`
======================= VPS DEPLOYMENT NOTES ========================
This socket server is configured to work with Nginx reverse proxy.
Make sure you have the following in your Nginx config:

location /socket.io/ {
    proxy_pass http://localhost:${FINAL_PORT};
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

For path-based deployment (like /misvord/socket/), use:

location /misvord/socket/ {
    rewrite ^/misvord/socket/(.*) /$1 break;
    proxy_pass http://localhost:${FINAL_PORT};
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

===================================================================
`);
}