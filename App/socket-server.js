const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const socketIo = require('socket.io');
const cors = require('cors');
// const path = require('path'); // Not used in this simplified version

// Only load dotenv if not explicitly disabled
if (process.env.DISABLE_DOTENV !== 'true') {
  console.log('Loading environment from .env file');
  require('dotenv').config();
} else {
  console.log('Bypassing .env file, using provided environment variables');
}

// Environment variables and configuration
const DEBUG_MODE = process.env.DEBUG === 'true' || false;
const DEBUG_CONNECT = process.env.DEBUG_CONNECT === 'true' || false;
const DEBUG_CONNECTION = process.env.DEBUG_CONNECTION === 'true' || false;
const DEBUG_USERS = process.env.DEBUG_USERS === 'true' || false;

// For local testing, always ensure these are defined with fallback values
if (process.env.DEBUG_USERS === undefined) {
  process.env.DEBUG_USERS = 'false';
  console.log('DEBUG_USERS was undefined. Setting to false as fallback.');
}

// Check for explicit command-line environment configuration
const envFromCommandLine = process.env.SOCKET_PATH && process.env.DOMAIN && process.env.IS_VPS;

// Add VPS configuration to ensure consistent settings across page reloads
if (process.env.IS_VPS === 'true') {
    // Default VPS environment variables if not explicitly set and not from command line
    if (!envFromCommandLine) {
        process.env.SOCKET_PATH = process.env.SOCKET_PATH || '/misvord/socket/socket.io';
        process.env.SUBPATH = process.env.SUBPATH || 'misvord';
        console.log('VPS environment detected. Using socket path:', process.env.SOCKET_PATH);
    } else {
        console.log('Using command-line provided environment for VPS mode:', process.env.SOCKET_PATH);
    }
} else if (process.env.IS_VPS === 'false') {
    if (envFromCommandLine) {
        console.log('Using command-line provided environment for development mode:', process.env.SOCKET_PATH);
    }
}

// Log environment variables at startup
console.log('===== ENVIRONMENT VARIABLES AT STARTUP =====');
console.log('IS_VPS:', process.env.IS_VPS);
console.log('DOMAIN:', process.env.DOMAIN);
console.log('SUBPATH:', process.env.SUBPATH);
console.log('SOCKET_PATH:', process.env.SOCKET_PATH);
console.log('USE_HTTPS:', process.env.USE_HTTPS);
console.log('SOCKET_SECURE_PORT:', process.env.SOCKET_SECURE_PORT);
console.log('===========================================');

const app = express();

// --- TEMPORARY: Extremely permissive CORS for debugging ---
app.use(cors({ origin: '*' }));
console.log('⚠️ Express CORS set to origin: * for debugging.');
// --- END TEMPORARY CORS ---

const httpServer = http.createServer(app);
let httpsServer = null;
let server = httpServer;

const certKeyPath = './docker/certs/server.key';
const certCrtPath = './docker/certs/server.crt';

try {
  if (fs.existsSync(certKeyPath) && fs.existsSync(certCrtPath)) {
    console.log('🔒 SSL certificates found! Attempting to enable secure WebSockets (WSS).');
    const options = {
      key: fs.readFileSync(certKeyPath),
      cert: fs.readFileSync(certCrtPath)
    };
    httpsServer = https.createServer(options, app);
    server = httpsServer;
    console.log('🔒 HTTPS/WSS server created. It will be used if USE_HTTPS is not false.');
  } else {
    console.log(`⚠️ SSL certificates not found (checked for ${certKeyPath} & ${certCrtPath}). HTTP/WS only.`);
  }
} catch (err) {
  console.error('⚠️ Error setting up HTTPS server:', err.message);
  server = httpServer; // Fallback to HTTP
}

const corsAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS || '*';
const socketPath = process.env.SOCKET_PATH || '/socket.io';
const isVpsEnvironment = process.env.IS_VPS === 'true';
const domain = process.env.DOMAIN || 'localhost';
const subpath = process.env.SUBPATH || 'misvord';

let effectivePath = socketPath;

// Determine the effective Socket.IO path based on environment
if (isVpsEnvironment) {
  // VPS/Production environment
  if (domain === 'localhost' || domain === '127.0.0.1') {
    // Special case: VPS=true but on localhost - use the standardized path
    effectivePath = `/${subpath}/socket/socket.io`;
    console.log(`VPS mode on localhost: Using standardized Socket.IO path: ${effectivePath}`);
  } else if (socketPath && socketPath.includes(`/${subpath}/`)) {
    // Use configured socket path
    effectivePath = socketPath;
    console.log(`VPS Mode: Using configured Socket.IO path: ${effectivePath}`);
  } else {
    // Default VPS path
    effectivePath = `/${subpath}/socket/socket.io`;
    console.log(`VPS Mode: Using default VPS Socket.IO path: ${effectivePath}`);
  }
} else {
  // Local development environment - use standardized path for consistency
  effectivePath = `/${subpath}/socket/socket.io`;
  console.log(`Local Mode: Using standardized Socket.IO path (for consistency): ${effectivePath}`);
}

// For localhost, always use the standardized socket path
if (domain === 'localhost' || domain === '127.0.0.1') {
  // Always use the standardized path for localhost
  effectivePath = `/${subpath}/socket/socket.io`;
  console.log(`Using standardized Socket.IO path for localhost development: ${effectivePath}`);
  
  // Set CORS to allow all origins for local development
  console.log('Setting CORS to allow all origins for localhost development');
  // Don't try to reassign corsAllowedOrigins as it's a constant
}

// Make sure path doesn't have double slashes
effectivePath = effectivePath.replace(/\/+/g, '/');
console.log(`Final effective path: ${effectivePath}`);

// Safeguard against potential multiple server.handleUpgrade calls for the same socket
process.on('uncaughtException', (err) => {
  if (err.message && err.message.includes('server.handleUpgrade() was called more than once with the same socket')) {
    console.warn('⚠️ Caught WebSocket upgrade conflict. This is expected during restart: ', err.message);
  } else {
    console.error('Uncaught exception:', err);
  }
});

const io = socketIo(server, {
  // --- TEMPORARY: Extremely permissive CORS for Socket.IO debugging ---
  cors: {
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
  },
  // --- END TEMPORARY CORS ---
  transports: ['websocket', 'polling'],
  path: effectivePath,
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 30000,
  handlePreflightRequest: (req, res) => {
    const headers = {
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Allow-Origin': req.headers.origin || '*',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,PUT,DELETE'
    };
    res.writeHead(200, headers);
    res.end();
  }
});
console.log('⚠️ Socket.IO CORS set to origin: * for debugging.');

// Enhanced debugging function
function debugLog(...args) {
  if (DEBUG_MODE) {
    console.log(`[DEBUG ${new Date().toISOString()}]`, ...args);
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

// VPS detection - already initialized earlierif (isVpsEnvironment) {  console.log('🌐 Running in VPS environment - enabling production optimizations');}

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

const PORT = parseInt(process.env.PORT, 10) || 1002;
const SECURE_PORT = parseInt(process.env.SOCKET_SECURE_PORT, 10) || 1443;

// Basic health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    videoChatUserCount: Object.keys(videoChatUsers).length,
    http_port: PORT, // Actual HTTP port it might be listening on
    https_port: SECURE_PORT, // Actual HTTPS port it might be listening on
    socketPath: effectivePath,
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      PORT_ENV: process.env.PORT || 'not set (defaulted to 1002)',
      SECURE_PORT_ENV: process.env.SOCKET_SECURE_PORT || 'not set (defaulted to 1443)',
      SOCKET_URL: process.env.SOCKET_URL || 'not set',
      CORS_ALLOWED_ORIGINS: corsAllowedOrigins, // Reflects temporary '*' if active
      SOCKET_PATH_ENV: process.env.SOCKET_PATH || 'not set (using default /socket.io)' // Renamed to avoid conflict
    }
  });
});

// Add an endpoint specifically for the /misvord/socket/ path to verify it's working
app.get('/socket-test', (req, res) => {
  res.json({
    message: "Socket server path test endpoint reached successfully",
    serverTime: new Date().toISOString(),
    socketPath: effectivePath,
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
    activeRooms: Array.from(io.sockets.adapter.rooms.keys()).filter(room => !io.sockets.sockets.get(room)), // More accurate room list
    activeUsers: Object.keys(videoChatUsers).length,
    listening_http_port: (server === httpServer && activeServer === httpServer) ? PORT : null,
    listening_https_port: (server === httpsServer && activeServer === httpsServer) ? SECURE_PORT : null,
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
  
  const clientIP = socket.handshake.headers['x-forwarded-for'] || 
                 socket.handshake.headers['x-real-ip'] || 
                 socket.handshake.address;
  const clientProtocol = socket.handshake.headers['x-forwarded-proto'] || (socket.handshake.secure ? 'https' : 'http');
  const clientHost = socket.handshake.headers['x-forwarded-host'] || socket.handshake.headers.host || 'unknown';
  const clientPath = socket.handshake.query.path || 'Not provided';
  
  console.log(`[CONNECT] New connection from ${clientIP} via ${clientProtocol}://${clientHost}${socket.handshake.url}`);
  debugLog(`Client environment data: Path=${clientPath}, Transport=${socket.conn.transport.name}`);
  
  if (DEBUG_CONNECTION) {
    console.log(`[CONNECT] Socket ${socket.id} connected - Active: ${activeConnections}`);
    console.log(`[CONNECT] Client headers:`, JSON.stringify({
      'x-forwarded-for': socket.handshake.headers['x-forwarded-for'],
      'x-forwarded-host': socket.handshake.headers['x-forwarded-host'],
      'x-forwarded-proto': socket.handshake.headers['x-forwarded-proto'],
      'host': socket.handshake.headers.host,
      'origin': socket.handshake.headers.origin // Log origin for CORS checks
    }));
  }

  // Track connection quality
  let connectionQuality = 'unknown';
  let lastPingTime = Date.now();

  // Send periodic pings to check connection quality
  const pingInterval = setInterval(() => {
    if (!videoChatUsers[socket.id] && !socket.connected) { // Check if socket still connected
      clearInterval(pingInterval);
      return;
    }
    
    lastPingTime = Date.now();
    socket.emit('connection-ping', { timestamp: lastPingTime });
  }, 30000); // every 30 seconds

  socket.on('connection-pong', (data) => {
    const latency = Date.now() - (data.timestamp || lastPingTime) ; // ensure data.timestamp exists
    
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
    if(videoChatUsers[socket.id]) videoChatUsers[socket.id].connectionQuality = connectionQuality;
    
    // Let client know about their connection quality
    socket.emit('connection-quality', { 
      quality: connectionQuality, 
      latency: latency 
    });
  });

  socket.on('join-video-room', (data) => {
    const { roomId, userName } = data || {}; // Use roomId from data, not global VIDEO_CHAT_ROOM directly
    if (!userName) {
      debugLog(`User ${socket.id} tried to join video room without userName.`);
      socket.emit('video-room-error', { message: 'User name is required to join the video room.' });
      return;
    }
    if (!roomId) {
        debugLog(`User ${userName} (${socket.id}) tried to join video room without roomId.`);
        socket.emit('video-room-error', { message: 'Room ID is required to join the video room.' });
      return;
    }

    console.log(`[USER-JOIN] ${userName} (${socket.id}) joining video room: ${roomId}`);
    debugLog(`[JOIN] User ${userName} (${socket.id}) joining video room: ${roomId}`);
    
    const isAlreadyInRoom = socket.rooms.has(roomId);
    if (isAlreadyInRoom) {
      console.log(`[USER-JOIN] Warning: ${userName} (${socket.id}) is already in the room ${roomId}`);
    }
    
    socket.join(roomId); // Join the specific room ID from client

    videoChatUsers[socket.id] = {
      userId: socket.id,
      userName: userName,
      socketId: socket.id,
      currentRoom: roomId, // Track user's current room
      connectionQuality: 'unknown',
      joinTime: new Date().toISOString()
    };

    const roomSockets = io.sockets.adapter.rooms.get(roomId);
    const roomSize = roomSockets ? roomSockets.size : 0;
    console.log(`[USER-JOIN] Room ${roomId} size after join: ${roomSize}, registered users in any room: ${Object.keys(videoChatUsers).length}`);

    // Notify others in THE SAME room
    socket.to(roomId).emit('user-joined-video-room', videoChatUsers[socket.id]);
    console.log(`[USER-JOIN] Notified others in room ${roomId} about ${userName} joining`);

    const usersInThisRoom = Object.values(videoChatUsers).filter(u => u.currentRoom === roomId && roomSockets && roomSockets.has(u.socketId));
    
    socket.emit('video-room-users', { users: usersInThisRoom, roomId: roomId });
    
    console.log(`[USER-JOIN] Current users in room ${roomId}: ${usersInThisRoom.map(u => u.userName).join(', ')}`);
    debugLog(`[JOIN] User ${userName} (${socket.id}) added to room ${roomId}. Total video users: ${Object.keys(videoChatUsers).length}`);
  });

  socket.on('leave-video-room', () => {
    handleUserLeaveVideoRoom(socket);
  });

  socket.on('disconnect', (reason) => {
    activeConnections--;
    console.log(`[DISCONNECT] User ${socket.id} disconnected: ${reason} (Total active: ${activeConnections})`);
    debugLog(`User disconnected: ${socket.id}, reason: ${reason}`);
    clearInterval(pingInterval);
    handleUserLeaveVideoRoom(socket); // This will handle removing user and notifying room
  });

  function handleUserLeaveVideoRoom(socketInstance) {
    const leavingUserData = videoChatUsers[socketInstance.id];
    if (leavingUserData) {
      const { userName, currentRoom } = leavingUserData;
      console.log(`[USER-LEAVE] ${userName} (${socketInstance.id}) leaving video room ${currentRoom}`);
      debugLog(`User ${userName} (${socketInstance.id}) leaving video room: ${currentRoom}`);
      
      if(currentRoom) {
          socketInstance.leave(currentRoom);
          // Notify others in THAT specific room
          io.to(currentRoom).emit('user-left-video-room', { 
            userId: socketInstance.id, 
            userName: userName,
            roomId: currentRoom
          });
          console.log(`[USER-LEAVE] Notified room ${currentRoom} about ${userName} leaving.`);
      } else {
          console.log(`[USER-LEAVE] User ${userName} was not in a specific room, or room info missing.`);
      }
      
      delete videoChatUsers[socketInstance.id];

      const remainingUsersInAnyRoom = Object.keys(videoChatUsers).length;
      console.log(`[USER-LEAVE] After ${userName} left. Total registered video users: ${remainingUsersInAnyRoom}`);
      debugLog(`User ${userName} (${socketInstance.id}) removed. Total video users: ${remainingUsersInAnyRoom}`);
    } else {
        console.log(`[USER-LEAVE] Attempted to handle leave for socket ${socketInstance.id}, but no user data found.`);
    }
  }

  // WebRTC Signaling
  socket.on('webrtc-offer', (data) => {
    const { to, offer, fromUserName } = data;
    if (!to || !offer) {
      debugLog(`[SIGNAL] Invalid WebRTC offer from ${socket.id}. Missing 'to' or 'offer'. Data:`, data);
      return;
    }
    const senderUserName = fromUserName || videoChatUsers[socket.id]?.userName || 'Unknown Sender';
    console.log(`[SIGNAL] Offer from ${senderUserName} (${socket.id}) to ${to}`);
    
    const targetSocket = io.sockets.sockets.get(to);
    if (!targetSocket) {
      console.log(`[SIGNAL] WARNING: Target socket ${to} not found for offer from ${senderUserName}`);
      socket.emit('video-room-error', { message: `User ${videoChatUsers[to]?.userName || to} not found or offline for offer.`});
      // Optionally, emit 'user-left-video-room' if that's how client handles it
      // socket.emit('user-left-video-room', { userId: to, userName: videoChatUsers[to]?.userName || 'Unknown User' });
      return;
    }
    
    debugLog(`Relaying WebRTC offer from ${senderUserName} (${socket.id}) to ${to}`);
    targetSocket.emit('webrtc-offer', { 
      from: socket.id, 
      offer,
      fromUserName: senderUserName
    });
    socket.emit('webrtc-signal-status', { type: 'offer', to: to, status: 'delivered' });
  });

  socket.on('webrtc-answer', (data) => {
    const { to, answer, fromUserName } = data;
     if (!to || !answer) {
      debugLog(`[SIGNAL] Invalid WebRTC answer from ${socket.id}. Missing 'to' or 'answer'. Data:`, data);
      return;
    }
    const senderUserName = fromUserName || videoChatUsers[socket.id]?.userName || 'Unknown Sender';
    const targetSocket = io.sockets.sockets.get(to);
    if (!targetSocket) {
      console.log(`[SIGNAL] WARNING: Target socket ${to} not found for answer from ${senderUserName}`);
      socket.emit('video-room-error', { message: `User ${videoChatUsers[to]?.userName || to} not found or offline for answer.`});
      return;
    }
    
    console.log(`[SIGNAL] Answer from ${senderUserName} (${socket.id}) to ${to}`);
    targetSocket.emit('webrtc-answer', { 
      from: socket.id, 
      answer,
      fromUserName: senderUserName
    });
    socket.emit('webrtc-signal-status', { type: 'answer', to: to, status: 'delivered' });
  });

  socket.on('webrtc-ice-candidate', (data) => {
    const { to, candidate } = data;
    if (!to || !candidate) {
      if(DEBUG_SIGNALING) debugLog(`[SIGNAL] Invalid WebRTC ICE candidate from ${socket.id}. Missing 'to' or 'candidate'. Data:`, data);
      return;
    }
    const targetSocket = io.sockets.sockets.get(to);
    if (!targetSocket) {
      if (DEBUG_SIGNALING) console.log(`[SIGNAL] Target socket ${to} not found for ICE candidate from ${socket.id}`);
      return;
    }
    targetSocket.emit('webrtc-ice-candidate', { from: socket.id, candidate });
  });

  socket.on('webrtc-reconnect-request', (data) => {
    const { to, fromUserName } = data;
    if (!to) return;
    const senderUserName = fromUserName || videoChatUsers[socket.id]?.userName || 'Unknown Sender';
    const targetSocket = io.sockets.sockets.get(to);
    if (!targetSocket) {
      console.log(`[SIGNAL] Target socket ${to} not found for reconnection from ${senderUserName}`);
      return;
    }
    console.log(`[SIGNAL] Reconnection request from ${senderUserName} (${socket.id}) to ${to}`);
    targetSocket.emit('webrtc-reconnect-request', { from: socket.id, fromUserName: senderUserName, timestamp: Date.now() });
  });

  socket.on('webrtc-connection-stats', (data) => {
    const { stats } = data;
    if (!stats) return;
    if (videoChatUsers[socket.id]) {
      videoChatUsers[socket.id].connectionQuality = stats.quality || 'unknown';
    }
  });

  socket.on('ping-server', (data, callback) => {
    const timestamp = Date.now();
    const pingTime = timestamp - (data?.timestamp || timestamp);
    if(DEBUG_CONNECTION) console.log(`[PING] Server received ping from ${socket.id}, latency: ${pingTime}ms`);
    if (typeof callback === 'function') {
      callback({ serverTime: timestamp, latency: pingTime, serverUsers: Object.keys(videoChatUsers).length, yourId: socket.id });
    }
  });
  
  socket.on('ping-user', (data) => {
    const { targetId, echo, timestamp } = data;
    const senderUserName = videoChatUsers[socket.id]?.userName || 'Unknown Sender';
    if(DEBUG_CONNECTION) console.log(`[PING] User ${senderUserName} (${socket.id}) is pinging ${targetId}`);
    if (!targetId) return;
    
    const targetSocket = io.sockets.sockets.get(targetId);
    if (!targetSocket) {
      socket.emit('ping-response', { targetId, status: 'not-found', message: `User ${targetId} not found`, timestamp: Date.now(), originalTimestamp: timestamp });
      return;
    }
    targetSocket.emit('ping-request', { from: socket.id, fromUserName: senderUserName, timestamp: Date.now(), originalTimestamp: timestamp, echo: echo });
    if (echo === false) {
      socket.emit('ping-response', { targetId, status: 'delivered', message: `Ping delivered to ${targetId}`, timestamp: Date.now(), originalTimestamp: timestamp });
    }
  });
  
  socket.on('ping-response', (data) => {
    const { to, status, latency, timestamp, originalTimestamp } = data;
    const senderUserName = videoChatUsers[socket.id]?.userName || 'Unknown Sender';
    if(DEBUG_CONNECTION) console.log(`[PING] User ${senderUserName} (${socket.id}) is responding to ping from ${to} with status: ${status}`);
    if (!to) return;
    const targetSocket = io.sockets.sockets.get(to);
    if (!targetSocket) {
      if(DEBUG_CONNECTION) console.log(`[PING] Cannot deliver ping response to ${to} - user not found`);
      return;
    }
    targetSocket.emit('ping-response', { targetId: socket.id, status: status, latency: latency, timestamp: Date.now(), originalTimestamp: originalTimestamp });
  });
  
  socket.on('ping-all', (data) => {
    if (!videoChatUsers[socket.id] || !videoChatUsers[socket.id].currentRoom) {
      socket.emit('ping-all-response', { status: 'error', message: 'You must be in a video room to ping all users', timestamp: Date.now() });
      return;
    }
    const timestamp = Date.now();
    const fromUserName = videoChatUsers[socket.id]?.userName || 'Unknown';
    const currentRoom = videoChatUsers[socket.id].currentRoom;
    
    if(DEBUG_CONNECTION) console.log(`[PING] ${fromUserName} (${socket.id}) is pinging all users in room ${currentRoom}`);
    
    const roomSocketsSet = io.sockets.adapter.rooms.get(currentRoom);
    if (!roomSocketsSet) {
        socket.emit('ping-all-response', { status: 'error', message: `Room ${currentRoom} not found or empty.`, timestamp: Date.now() });
        return;
    }
    const roomSocketsArray = [...roomSocketsSet];
    const pingResults = {};
    
    if (!roomSocketsArray.includes(socket.id)) {
      socket.emit('ping-all-response', { status: 'error', message: 'You appear to not be in the room you are pinging. Try rejoining.', timestamp: Date.now() });
      return;
    }
    roomSocketsArray.forEach(socketIdInRoom => {
      if (socketIdInRoom !== socket.id) {
        pingResults[socketIdInRoom] = { userName: videoChatUsers[socketIdInRoom]?.userName || 'Unknown', status: 'pending', latency: null };
      }
    });
    socket.emit('ping-all-response', { status: 'initiated', users: pingResults, roomSize: roomSocketsArray.length, timestamp });
    
    roomSocketsArray.forEach(targetId => {
      if (targetId === socket.id) return;
      const targetSocket = io.sockets.sockets.get(targetId);
      if (!targetSocket) {
        pingResults[targetId] = { ...pingResults[targetId], status: 'not-found', error: 'Socket not found' };
        return;
      }
      targetSocket.emit('ping-request', { from: socket.id, fromUserName, timestamp: Date.now(), originalTimestamp: timestamp, isPingAll: true });
    });
    socket.emit('ping-all-update', { users: pingResults, timestamp: Date.now(), originalTimestamp: timestamp });
  });

  // Legacy event support (should be phased out)
  socket.on('offer', (data) => {
    const { to } = data;
    if (!to) return;
    debugLog(`[LEGACY] Converting 'offer' to 'webrtc-offer' from ${socket.id} to ${to}`);
    io.to(to).emit('webrtc-offer', { from: socket.id, offer: data.offer || data.sdp, fromUserName: data.fromUserName || (videoChatUsers[socket.id]?.userName || 'Unknown user') });
  });
  socket.on('answer', (data) => {
    const { to } = data;
    if (!to) return;
    debugLog(`[LEGACY] Converting 'answer' to 'webrtc-answer' from ${socket.id} to ${to}`);
    io.to(to).emit('webrtc-answer', { from: socket.id, answer: data.answer || data.sdp, fromUserName: data.fromUserName || (videoChatUsers[socket.id]?.userName || 'Unknown user') });
  });
  socket.on('ice-candidate', (data) => {
    const { to } = data;
    if (!to) return;
    debugLog(`[LEGACY] Converting 'ice-candidate' to 'webrtc-ice-candidate' from ${socket.id} to ${to}`);
    io.to(to).emit('webrtc-ice-candidate', { from: socket.id, candidate: data.candidate });
  });
});

let activeServer = server; // By default, this is httpServer or httpsServer if certs were found
let finalListenPort = PORT;

// If httpsServer exists and USE_HTTPS is true (or not explicitly false), prioritize HTTPS
if (httpsServer && process.env.USE_HTTPS !== 'false') {
    console.log(`Attempting to use HTTPS on port ${SECURE_PORT}.`);
    activeServer = httpsServer;
    finalListenPort = SECURE_PORT;
    if(io.server !== activeServer) io.attach(activeServer); // Ensure IO is on the active server
} else {
    console.log(`Using HTTP on port ${PORT}.`);
    activeServer = httpServer;
    finalListenPort = PORT;
    if(io.server !== activeServer) io.attach(activeServer); // Ensure IO is on the active server
}

activeServer.listen(finalListenPort, '0.0.0.0', () => {
  const protocol = activeServer === httpsServer ? 'WSS/HTTPS' : 'WS/HTTP';
  console.log(`🚀 Socket.IO server (${protocol}) running on port ${finalListenPort}, path: ${effectivePath}`);
  if (isVpsEnvironment) {
    // Simplified Nginx log for clarity
    console.log("NGINX: Ensure proxy_pass to http://localhost:" + finalListenPort + effectivePath);
  }
});

// Add a diagnostic endpoint that will help test the WebSocket connection
app.get('/socket-status', (req, res) => {
  const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const clientOrigin = req.headers.origin || 'Unknown';
  const userAgent = req.headers['user-agent'] || 'Unknown';
  
  res.json({
    server: {
      status: 'running',
      listening_port: finalListenPort,
      protocol: (activeServer === httpsServer ? 'wss/https' : 'ws/http'),
      socketPath: effectivePath,
      timestamp: new Date().toISOString(),
      corsSettings: {
        allowedOrigins: (io.opts.cors.origin === "*") ? "* (DEBUG MODE - ALL ALLOWED)" : corsAllowedOrigins,
        allowCredentials: io.opts.cors.credentials
      },
      connections: {
        total: io.engine?.clientsCount || 0,
        activeSockets: Object.keys(io.sockets.sockets).length,
        videoRoomUsers: Object.keys(videoChatUsers).length
      }
    },
    client: {
      ip: clientIP,
      origin: clientOrigin,
      userAgent: userAgent
    },
    websocketTest: {
      attemptUrl: `${activeServer === httpsServer ? 'wss' : 'ws'}://localhost:${finalListenPort}${effectivePath}`,
      directWsUrl: `ws://localhost:${PORT}${effectivePath.replace(/\/socket.io$/, '')}/socket.io`,
      directWssUrl: `wss://localhost:${SECURE_PORT}${effectivePath.replace(/\/socket.io$/, '')}/socket.io`,
      testCommand: `wscat -c ${activeServer === httpsServer ? 'wss' : 'ws'}://localhost:${finalListenPort}${effectivePath}`,
      curlPollingTest: `curl -v http://localhost:${PORT}${effectivePath.replace(/\/socket.io$/, '')}?EIO=4&transport=polling`
    }
  });
});

// Add a plain-text response for /socket.io path to help troubleshoot connection issues
// COMMENTED OUT to avoid conflict with Socket.IO's built-in handlers
// app.get(effectivePath, (req, res) => { // Listen on the effectivePath for socket.io polling
//   if (req.query.transport === 'polling' && req.query.sid === undefined) {
//     const sid = "s-" + Date.now();
//     const bodyObject = {
//         sid: sid,
//         upgrades: ["websocket"],
//         pingInterval: 25000,
//         pingTimeout: 60000
//     };
//     const body = `0${JSON.stringify(bodyObject)}`;
//     res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
//     return res.send(body);
//   }
//   res.status(200).send(`Socket.IO endpoint. Port: ${finalListenPort}. Path: ${effectivePath}`);
// });

// Fallback CORS middleware (less critical now with '*' but good for future)
app.use((req, res, next) => {
  if (isVpsEnvironment && domain === 'marvelcollin.my.id' && req.headers.origin === 'https://marvelcollin.my.id') {
    res.header('Access-Control-Allow-Origin', 'https://marvelcollin.my.id');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Credentials', 'true');
}
  next();
});

// Serve Socket.IO client library directly from this server
// This helps with localhost development where browsers can't reach /socket.io/socket.io.js on port 1001
let socketIoPath;
try {
  socketIoPath = require.resolve('socket.io-client/dist/socket.io.js');
  console.log(`Socket.IO client library path: ${socketIoPath}`);
} catch (error) {
  console.error(`Error loading Socket.IO client library: ${error.message}`);
  // Provide a fallback using CDN path or other mechanism
  socketIoPath = null;
}

app.get('/socket.io/socket.io.js', (req, res) => {
  if (socketIoPath) {
    res.sendFile(socketIoPath);
    console.log('Served Socket.IO client library');
  } else {
    // If local file not available, redirect to CDN
    console.log('Redirecting to Socket.IO CDN');
    res.redirect('https://cdn.socket.io/4.6.0/socket.io.js');
  }
});

// Also serve the minified version for compatibility - use CDN redirect
app.get('/socket.io/socket.io.min.js', (req, res) => {
  console.log('Redirecting to Socket.IO min.js CDN');
  res.redirect('https://cdn.socket.io/4.6.0/socket.io.min.js');
});