const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const socketIo = require('socket.io');
const cors = require('cors');

// Only load dotenv if not explicitly disabled
if (process.env.DISABLE_DOTENV !== 'true') {
  console.log('Loading environment from .env file');
  require('dotenv').config();
} else {
  console.log('Bypassing .env file, using provided environment variables');
}

// Environment variables and configuration
const DEBUG_MODE = process.env.DEBUG === 'true' || false;

// Unified Socket Configuration
const isVpsEnvironment = process.env.IS_VPS === 'true';
const useHttps = process.env.USE_HTTPS === 'true';
const domain = process.env.DOMAIN || 'localhost';
const socketPort = process.env.PORT || process.env.SOCKET_PORT || 1002;
const socketSecurePort = process.env.SOCKET_SECURE_PORT || 1443;

// Simplified path construction
const socketPath = isVpsEnvironment 
  ? '/misvord/socket/socket.io'  // Production path
  : '/socket.io';               // Development path

// Log configuration
console.log('===== SOCKET SERVER CONFIGURATION =====');
console.log('Environment:', isVpsEnvironment ? 'Production/VPS' : 'Development');
console.log('Domain:', domain);
console.log('Socket Path:', socketPath);
console.log('Using HTTPS:', useHttps);
console.log('Socket Port:', socketPort);
console.log('Socket Secure Port:', socketSecurePort);
console.log('=====================================');

const app = express();

// CORS configuration
const corsAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS || '*';
app.use(cors({ origin: corsAllowedOrigins }));
console.log('CORS configured with origin:', corsAllowedOrigins);

const httpServer = http.createServer(app);
let httpsServer = null;
let server = httpServer;

// SSL configuration if needed
const certKeyPath = './docker/certs/server.key';
const certCrtPath = './docker/certs/server.crt';

try {
  if (useHttps && fs.existsSync(certKeyPath) && fs.existsSync(certCrtPath)) {
    console.log('🔒 SSL certificates found! Enabling secure WebSockets (WSS).');
    const options = {
      key: fs.readFileSync(certKeyPath),
      cert: fs.readFileSync(certCrtPath)
    };
    httpsServer = https.createServer(options, app);
    server = httpsServer;
    console.log('🔒 HTTPS/WSS server created successfully.');
  } else if (useHttps) {
    console.log(`⚠️ SSL certificates not found but HTTPS was requested. Using HTTP fallback.`);
    server = httpServer;
  } else {
    console.log(`ℹ️ Using HTTP/WS as configured.`);
    server = httpServer;
  }
} catch (err) {
  console.error('⚠️ Error setting up HTTPS server:', err.message);
  server = httpServer; // Fallback to HTTP
}

// Safeguard against potential multiple server.handleUpgrade calls
process.on('uncaughtException', (err) => {
  if (err.message && err.message.includes('server.handleUpgrade() was called more than once with the same socket')) {
    console.warn('⚠️ Caught WebSocket upgrade conflict. This is expected during restart: ', err.message);
  } else {
    console.error('Uncaught exception:', err);
  }
});

const io = socketIo(server, {
  cors: {
    origin: corsAllowedOrigins,
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
  },
  transports: ['websocket', 'polling'],
  path: socketPath,
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 30000
});

// Enhanced debugging function
function debugLog(...args) {
  if (DEBUG_MODE) {
    console.log(`[DEBUG ${new Date().toISOString()}]`, ...args);
  }
}

// Log active connections every minute
let activeConnections = 0;
setInterval(() => {
  const roomCount = io.sockets.adapter.rooms ? io.sockets.adapter.rooms.size : 0;
  const clientCount = io.engine ? io.engine.clientsCount : 0;
  console.log(`Server status: ${clientCount} clients connected, ${Object.keys(videoChatUsers).length} video users, ${roomCount} active rooms`);
}, 60000);

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
    port: server === httpsServer ? socketSecurePort : socketPort,
    socketPath: socketPath,
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV || 'development',
      domain: domain,
      isVps: isVpsEnvironment,
      corsAllowedOrigins: corsAllowedOrigins
    }
  });
});

// Add a test endpoint for the socket path
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

// Rest of your existing socket server code...
// ... existing code ...

function getRoomMembers(roomName) {
  if (!io.sockets.adapter.rooms.get(roomName)) {
    return [];
  }
  
  return Array.from(io.sockets.adapter.rooms.get(roomName) || []);
}

io.on('connection', (socket) => {
  debugLog(`New socket connected: ${socket.id}`);
  activeConnections++;
  
  // User join handler
  socket.on('join', (data) => {
    // Handle user joining
    socket.userId = data.userId;
    socket.userName = data.username;
    debugLog(`User joined: ${socket.userName || 'Anonymous'} (${socket.userId || 'unknown'})`);
  });

  // Diagnostic tools support
  socket.on('ping-test', (data) => {
    debugLog(`Received ping-test from ${socket.id}`);
    // Respond with the original timestamp and server timestamp for round-trip calculation
    socket.emit('ping-test-response', {
      clientTimestamp: data.timestamp || Date.now(),
      serverTimestamp: Date.now(),
      socketId: socket.id,
      path: socketPath
    });
  });
  
  // Video chat specific handlers
  socket.on('joinVideoChat', (data) => {
    socket.join(VIDEO_CHAT_ROOM);
    
    // Store user data
    videoChatUsers[socket.id] = {
      socketId: socket.id,
      userId: data.userId || socket.id,
      userName: data.userName || 'Anonymous'
    };
    
    // Let everyone know about the new user
    socket.to(VIDEO_CHAT_ROOM).emit('userJoined', {
      socketId: socket.id,
      userId: data.userId || socket.id,
      userName: data.userName || 'Anonymous'
    });
    
    // Send current users to the new user
    socket.emit('currentUsers', Object.values(videoChatUsers));
    
    debugLog(`User joined video chat: ${data.userName || 'Anonymous'}`);
  });
  
  // WebRTC signaling
  socket.on('signal', (data) => {
    debugLog(`Signal from ${socket.id} to ${data.to}`);
    
    // Forward the WebRTC signal to the intended recipient
    if (data.to && io.sockets.sockets.get(data.to)) {
      socket.to(data.to).emit('signal', {
        from: socket.id,
        signal: data.signal,
        userId: videoChatUsers[socket.id]?.userId,
        userName: videoChatUsers[socket.id]?.userName
      });
    }
  });
  
  // Handle user disconnection
  socket.on('disconnect', () => {
    handleUserLeaveVideoRoom(socket);
    activeConnections--;
    debugLog(`Socket disconnected: ${socket.id}`);
  });
  
  // Explicit leave video chat
  socket.on('leaveVideoChat', () => {
    handleUserLeaveVideoRoom(socket);
  });
});

function handleUserLeaveVideoRoom(socketInstance) {
  if (videoChatUsers[socketInstance.id]) {
    // Remove user from video chat users
    const userData = videoChatUsers[socketInstance.id];
    delete videoChatUsers[socketInstance.id];
    
    // Notify other users
    socketInstance.to(VIDEO_CHAT_ROOM).emit('userLeft', {
      socketId: socketInstance.id,
      userId: userData.userId
    });
    
    debugLog(`User left video chat: ${userData.userName || 'Anonymous'}`);
  }
  
  // Leave room regardless
  socketInstance.leave(VIDEO_CHAT_ROOM);
}

// Start the server
const activeServer = server === httpsServer ? 
  httpsServer.listen(socketSecurePort, () => {
    console.log(`🚀 HTTPS Socket server running on port ${socketSecurePort} with path ${socketPath}`);
  }) : 
  httpServer.listen(socketPort, () => {
    console.log(`🚀 HTTP Socket server running on port ${socketPort} with path ${socketPath}`);
  });

// Provide a clean shutdown
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

function shutdown() {
  console.log('🛑 Shutting down socket server...');
  activeServer.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
  
  // Force close if graceful shutdown fails
  setTimeout(() => {
    console.error('⚠️ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}