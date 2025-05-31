const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
let mysql;

try {
  // Try to load mysql2
  mysql = require('mysql2/promise');
  console.log('MySQL2 loaded successfully');
} catch (error) {
  console.error('Could not load mysql2/promise module:', error.message);
  console.log('Running without database connectivity');
  mysql = null;
}

// Load environment variables from .env file
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(cors());

// Create HTTP server
const server = http.createServer(app);

// Get port from environment or use default
const PORT = process.env.SOCKET_PORT || 1002;
const BASE_PATH = process.env.SOCKET_BASE_PATH || '/socket.io';
const SUBPATH = process.env.SOCKET_SUBPATH || '';
const CORS_ALLOWED_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:1001').split(',');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'kolin123',
  database: process.env.DB_NAME || 'misvord',
  port: process.env.DB_PORT || 1003
};

// Create socket.io server
const io = new Server(server, {
  cors: {
    origin: CORS_ALLOWED_ORIGINS,
    methods: ["GET", "POST"],
    credentials: true
  },
  path: BASE_PATH + SUBPATH
});

// Store connected users
const connectedUsers = new Map();

// Track user statuses
const userStatus = new Map();

// Create a connection pool
let pool;

// Initialize database connection
async function initDB() {
  if (!mysql) {
    console.log('Database connectivity disabled - mysql2 module not loaded');
    return false;
  }
  
  try {
    pool = mysql.createPool(dbConfig);
    console.log('Database connection pool created');
    
    // Test the connection
    const connection = await pool.getConnection();
    console.log('Successfully connected to the database');
    connection.release();
    return true;
  } catch (error) {
    console.error('Error connecting to the database:', error);
    return false;
  }
}

// Socket.IO connection handler
io.on('connection', async (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Handle authentication
  socket.on('authenticate', async (data) => {
    try {
      const { userId, username } = data;
      
      if (!userId) {
        socket.emit('auth_error', { message: 'Authentication failed: Invalid user ID' });
        return;
      }
      
      // Store user connection
      connectedUsers.set(userId, socket.id);
      socket.userId = userId;
      socket.username = username;
      
      console.log(`User authenticated: ${username} (${userId})`);
      
      // Set user as online in the database
      if (pool) {
        try {
          await pool.execute('UPDATE users SET status = ? WHERE id = ?', ['online', userId]);
          userStatus.set(userId, 'online');
        } catch (dbError) {
          console.error('Error updating user status:', dbError);
        }
      }
      
      // Join user to their channels
      if (pool) {
        try {
          const [userChannels] = await pool.execute(`
            SELECT c.id 
            FROM channels c
            INNER JOIN user_server_memberships usm ON c.server_id = usm.server_id
            WHERE usm.user_id = ?
          `, [userId]);
          
          userChannels.forEach(channel => {
            socket.join(`channel:${channel.id}`);
            console.log(`User ${username} joined channel ${channel.id}`);
          });
        } catch (err) {
          console.error('Error joining user channels:', err);
        }
      }
      
      // Notify friends that user is online
      socket.broadcast.emit('user-status-change', { userId, status: 'online' });
      
      socket.emit('auth_success', { message: 'Authentication successful' });
    } catch (error) {
      console.error('Authentication error:', error);
      socket.emit('auth_error', { message: 'Authentication failed: Server error' });
    }
  });
  
  // Handle channel messages
  socket.on('channel-message', async (data) => {
    try {
      const { channelId, content, timestamp = new Date().toISOString() } = data;
      const userId = socket.userId;
      
      if (!userId || !channelId || !content) {
        socket.emit('message_error', { message: 'Invalid message data' });
        return;
      }
      
      // Save message to database
      if (pool) {
        try {
          const [result] = await pool.execute(
            'INSERT INTO messages (user_id, content, timestamp) VALUES (?, ?, ?)',
            [userId, content, timestamp]
          );
          
          const messageId = result.insertId;
          
          // Link message to channel
          await pool.execute(
            'INSERT INTO channel_messages (channel_id, message_id) VALUES (?, ?)',
            [channelId, messageId]
          );
          
          // Get user data for the message
          const [userData] = await pool.execute(
            'SELECT username, avatar_url FROM users WHERE id = ?',
            [userId]
          );
          
          const messageData = {
            id: messageId,
            user_id: userId,
            username: userData[0]?.username || socket.username,
            avatar: userData[0]?.avatar_url || null,
            content,
            timestamp,
            channelId
          };
          
          // Broadcast message to channel
          io.to(`channel:${channelId}`).emit('new-channel-message', messageData);
          
        } catch (dbError) {
          console.error('Error saving message:', dbError);
          socket.emit('message_error', { message: 'Failed to save message' });
        }
      } else {
        // If no database connection, just broadcast without saving
        const messageData = {
          id: Date.now(),
          user_id: userId,
          username: socket.username,
          avatar: null,
          content,
          timestamp,
          channelId
        };
        
        io.to(`channel:${channelId}`).emit('new-channel-message', messageData);
      }
    } catch (error) {
      console.error('Message handling error:', error);
      socket.emit('message_error', { message: 'Server error processing message' });
    }
  });
  
  // Join a channel
  socket.on('join-channel', (channelId) => {
    if (channelId) {
      socket.join(`channel:${channelId}`);
      console.log(`User ${socket.username || socket.id} joined channel ${channelId}`);
    }
  });
  
  // Leave a channel
  socket.on('leave-channel', (channelId) => {
    if (channelId) {
      socket.leave(`channel:${channelId}`);
      console.log(`User ${socket.username || socket.id} left channel ${channelId}`);
    }
  });
  
  // Typing indicators
  socket.on('typing', (data) => {
    const { channelId } = data;
    
    if (channelId && socket.userId) {
      socket.to(`channel:${channelId}`).emit('user-typing', {
        userId: socket.userId,
        username: socket.username,
        channelId
      });
    }
  });
  
  socket.on('stop-typing', (data) => {
    const { channelId } = data;
    
    if (channelId && socket.userId) {
      socket.to(`channel:${channelId}`).emit('user-stop-typing', {
        userId: socket.userId,
        channelId
      });
    }
  });
  
  // Status updates
  socket.on('status-change', async (data) => {
    try {
      const { status } = data;
      const userId = socket.userId;
      
      if (!userId || !status) return;
      
      const validStatuses = ['online', 'away', 'dnd', 'offline'];
      if (!validStatuses.includes(status)) return;
      
      // Update in database
      if (pool) {
        try {
          await pool.execute('UPDATE users SET status = ? WHERE id = ?', [status, userId]);
          userStatus.set(userId, status);
          
          // Broadcast status change to all users
          io.emit('user-status-change', { userId, status });
        } catch (dbError) {
          console.error('Error updating user status:', dbError);
        }
      }
    } catch (error) {
      console.error('Status change error:', error);
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', async () => {
    try {
      const userId = socket.userId;
      console.log(`User disconnected: ${socket.username || socket.id}`);
      
      if (userId) {
        // Remove from connected users
        connectedUsers.delete(userId);
        
        // Set as offline in database after a delay (in case of reconnection)
        setTimeout(async () => {
          // Check if the user has reconnected
          if (!connectedUsers.has(userId) && pool) {
            try {
              await pool.execute('UPDATE users SET status = ? WHERE id = ?', ['offline', userId]);
              userStatus.set(userId, 'offline');
              
              // Broadcast offline status
              io.emit('user-status-change', { userId, status: 'offline' });
            } catch (dbError) {
              console.error('Error updating user status to offline:', dbError);
            }
          }
        }, 10000); // 10 second delay
      }
    } catch (error) {
      console.error('Disconnection error:', error);
    }
  });
});

// Simple health check route
app.get('/health', (req, res) => {
  res.send({ status: 'ok' });
});

// Start the server
server.listen(PORT, async () => {
  console.log(`Socket.IO server running on port ${PORT}`);
  console.log(`Socket.IO path: ${BASE_PATH}${SUBPATH}`);
  
  // Initialize database connection
  await initDB();
}); 