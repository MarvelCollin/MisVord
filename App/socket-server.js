/**
 * MiscVord Socket Server
 * WebRTC Signaling Server for Video Chat with Docker Support
 */

require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// =====================================
// ENVIRONMENT CONFIGURATION
// =====================================

const PORT = process.env.PORT || 1002;
const SECURE_PORT = process.env.SECURE_PORT || 1443;
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_VPS = process.env.IS_VPS === 'true';
const SOCKET_BASE_PATH = process.env.SOCKET_BASE_PATH || '/socket.io';
const SOCKET_SUBPATH = process.env.SOCKET_SUBPATH || 'misvord/socket';
const DEBUG_MODE = process.env.DEBUG === 'true';
const VIDEO_CHAT_ROOM = process.env.VIDEO_CHAT_ROOM || 'global-video-chat';

// Construct full socket path
const SOCKET_PATH = IS_VPS ? `/${SOCKET_SUBPATH}/socket.io` : SOCKET_BASE_PATH;

// CORS configuration
const CORS_ALLOWED_ORIGINS = process.env.CORS_ALLOWED_ORIGINS 
    ? process.env.CORS_ALLOWED_ORIGINS.split(',')
    : ['http://localhost:1001', 'https://marvelcollin.my.id', 'http://localhost:3000'];

console.log('🚀 Starting MiscVord Socket Server');
console.log('📊 Configuration:');
console.log(`   • Port: ${PORT}`);
console.log(`   • Environment: ${NODE_ENV}`);
console.log(`   • VPS Mode: ${IS_VPS}`);
console.log(`   • Socket Path: ${SOCKET_PATH}`);
console.log(`   • CORS Origins: ${CORS_ALLOWED_ORIGINS.join(', ')}`);

// =====================================
// EXPRESS SERVER SETUP
// =====================================

const app = express();
const server = createServer(app);

// Middleware
app.use(cors({
    origin: CORS_ALLOWED_ORIGINS,
    credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: NODE_ENV,
        isVPS: IS_VPS,
        socketPath: SOCKET_PATH,
        videoChatUserCount: getVideoUserCount(),
        rooms: Object.keys(videoRooms).length
    });
});

// Socket.IO static files (for development)
if (!IS_VPS) {
    app.get('/socket.io/socket.io.js', (req, res) => {
        res.sendFile(require.resolve('socket.io/client-dist/socket.io.js'));
    });
}

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'MiscVord Socket Server',
        version: '1.0.0',
        socketPath: SOCKET_PATH,
        status: 'running'
    });
});

// =====================================
// SOCKET.IO SERVER SETUP
// =====================================

const io = new Server(server, {
    path: SOCKET_PATH,
    cors: {
        origin: CORS_ALLOWED_ORIGINS,
        methods: ['GET', 'POST'],
        credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000
});

// =====================================
// VIDEO CHAT MANAGEMENT
// =====================================

// Data structures for managing users and rooms
const videoRooms = new Map();
const userSocketMap = new Map(); // socketId -> userInfo
const socketUserMap = new Map(); // userId -> socketId

// Room management functions
function createRoom(roomId) {
    if (!videoRooms.has(roomId)) {
        videoRooms.set(roomId, {
            id: roomId,
            users: new Map(),
            created: new Date(),
            lastActivity: new Date()
        });
        console.log(`📹 Created video room: ${roomId}`);
    }
    return videoRooms.get(roomId);
}

function joinRoom(socket, roomId, userInfo) {
    const room = createRoom(roomId);
    
    // Store user information
    const user = {
        socketId: socket.id,
        userId: userInfo.userId,
        username: userInfo.username || userInfo.userName,
        joinedAt: new Date()
    };
    
    // Add to room and maps
    room.users.set(socket.id, user);
    userSocketMap.set(socket.id, user);
    if (user.userId) {
        socketUserMap.set(user.userId, socket.id);
    }
    
    // Join socket room
    socket.join(roomId);
    
    room.lastActivity = new Date();
    
    console.log(`👤 User ${user.username} (${socket.id}) joined room ${roomId}`);
    
    // Notify others in the room
    socket.to(roomId).emit('userJoined', {
        socketId: socket.id,
        userId: user.userId,
        userName: user.username
    });
    
    // Send current room users to the new user
    const currentUsers = Array.from(room.users.values())
        .filter(u => u.socketId !== socket.id)
        .map(u => ({
            socketId: u.socketId,
            userId: u.userId,
            userName: u.username
        }));
    
    socket.emit('roomUsers', currentUsers);
    
    return room;
}

function leaveRoom(socket, roomId) {
    const room = videoRooms.get(roomId);
    if (!room) return;
    
    const user = room.users.get(socket.id);
    if (!user) return;
    
    // Remove from data structures
    room.users.delete(socket.id);
    userSocketMap.delete(socket.id);
    if (user.userId) {
        socketUserMap.delete(user.userId);
    }
    
    // Leave socket room
    socket.leave(roomId);
    
    room.lastActivity = new Date();
    
    console.log(`👤 User ${user.username} (${socket.id}) left room ${roomId}`);
    
    // Notify others in the room
    socket.to(roomId).emit('userLeft', {
        socketId: socket.id,
        userId: user.userId,
        userName: user.username
    });
    
    // Clean up empty rooms
    if (room.users.size === 0) {
        videoRooms.delete(roomId);
        console.log(`🗑️ Removed empty room: ${roomId}`);
    }
}

function getVideoUserCount() {
    return Array.from(videoRooms.values())
        .reduce((total, room) => total + room.users.size, 0);
}

// =====================================
// SOCKET.IO EVENT HANDLERS
// =====================================

io.on('connection', (socket) => {
    if (DEBUG_MODE) {
        console.log(`🔌 Client connected: ${socket.id}`);
    }
    
    // Handle joining video chat room
    socket.on('joinRoom', (data) => {
        try {
            const { roomId = VIDEO_CHAT_ROOM, userId, username, userName } = data;
            const userInfo = {
                userId: userId || `user_${Date.now()}`,
                username: username || userName || `User_${Math.floor(Math.random() * 10000)}`
            };
            
            console.log(`🎯 Join room request: ${roomId} by ${userInfo.username}`);
            joinRoom(socket, roomId, userInfo);
            
            socket.emit('joinedRoom', {
                roomId,
                userId: userInfo.userId,
                userName: userInfo.username
            });
            
        } catch (error) {
            console.error('❌ Error joining room:', error);
            socket.emit('error', { message: 'Failed to join room' });
        }
    });
    
    // Handle legacy join event
    socket.on('join', (data) => {
        socket.emit('joinRoom', {
            roomId: VIDEO_CHAT_ROOM,
            ...data
        });
    });
    
    // WebRTC Signaling Events
    socket.on('offer', (data) => {
        if (DEBUG_MODE) {
            console.log(`📤 Relaying offer: ${socket.id} -> ${data.to}`);
        }
        socket.to(data.to).emit('offer', {
            from: socket.id,
            offer: data.offer,
            userName: userSocketMap.get(socket.id)?.username
        });
    });
    
    socket.on('answer', (data) => {
        if (DEBUG_MODE) {
            console.log(`📤 Relaying answer: ${socket.id} -> ${data.to}`);
        }
        socket.to(data.to).emit('answer', {
            from: socket.id,
            answer: data.answer
        });
    });
    
    socket.on('ice-candidate', (data) => {
        if (DEBUG_MODE) {
            console.log(`📤 Relaying ICE candidate: ${socket.id} -> ${data.to}`);
        }
        socket.to(data.to).emit('ice-candidate', {
            from: socket.id,
            candidate: data.candidate
        });
    });
    
    // Chat message handling
    socket.on('message', (data) => {
        const user = userSocketMap.get(socket.id);
        if (user) {
            const message = {
                user: {
                    userId: user.userId,
                    username: user.username
                },
                content: data.content || data.message,
                sent_at: new Date().toISOString()
            };
            
            // Broadcast to room
            socket.broadcast.emit('message', message);
        }
    });
    
    // Typing indicator
    socket.on('typing', (data) => {
        const user = userSocketMap.get(socket.id);
        if (user) {
            socket.broadcast.emit('user_typing', {
                user: {
                    userId: user.userId,
                    username: user.username
                }
            });
        }
    });
    
    // Test events for diagnostics
    socket.on('test-message', (data) => {
        console.log('🧪 Test message received:', data);
        socket.emit('test-response', {
            message: 'Test successful',
            timestamp: new Date().toISOString(),
            originalData: data
        });
    });
    
    socket.on('ping-test', (data) => {
        socket.emit('pong-test', {
            clientTimestamp: data.timestamp,
            serverTimestamp: Date.now()
        });
    });
    
    // Handle disconnection
    socket.on('disconnect', (reason) => {
        if (DEBUG_MODE) {
            console.log(`🔌 Client disconnected: ${socket.id} (${reason})`);
        }
        
        // Remove from all rooms
        const user = userSocketMap.get(socket.id);
        if (user) {
            // Find rooms this socket was in and clean up
            for (const [roomId, room] of videoRooms.entries()) {
                if (room.users.has(socket.id)) {
                    leaveRoom(socket, roomId);
                }
            }
        }
    });
    
    // Error handling
    socket.on('error', (error) => {
        console.error(`❌ Socket error for ${socket.id}:`, error);
    });
});

// =====================================
// SERVER STARTUP
// =====================================

// Graceful shutdown handling
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
    console.log('🎉 MiscVord Socket Server started successfully!');
    console.log(`🌐 HTTP Server listening on port ${PORT}`);
    console.log(`🔌 Socket.IO server ready on path: ${SOCKET_PATH}`);
    console.log(`📹 Default video chat room: ${VIDEO_CHAT_ROOM}`);
    console.log('✅ Server is ready to handle WebRTC connections\n');
});

// Export for testing
module.exports = { app, server, io };