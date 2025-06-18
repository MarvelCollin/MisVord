const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
let mysql;

try {
  mysql = require('mysql2/promise');
  console.log('✓ MySQL2 loaded successfully');
} catch (error) {
  console.error('⚠️ Could not load mysql2/promise module:', error.message);
  console.log('⚠️ Running without database connectivity - messages will not be persistent');
  mysql = null;
}

const dotenv = require('dotenv');

dotenv.config({ path: '../.env' });

const app = express();
app.use(cors());
app.use(express.json()); 


app.post('/emit', (req, res) => {
  try {
    const { event, data } = req.body;
    
    if (!event) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing event parameter' 
      });
    }
    
    console.log(`📤 Server-to-socket event: ${event}`, data);
    
    
    if (event === 'notify-user') {
      const { userId, event: userEvent, data: userData } = data;
      
      if (!userId || !userEvent) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required parameters for notify-user' 
        });
      }
      
      
      const userSockets = Array.from(connectedUsers.entries())
        .filter(([socketId, user]) => user.userId === userId.toString())
        .map(([socketId]) => socketId);
      
      if (userSockets.length === 0) {
        console.log(`⚠️ No active sockets found for user ${userId}`);
      } else {
        console.log(`🔔 Notifying user ${userId} on ${userSockets.length} socket(s)`);
        
        userSockets.forEach(socketId => {
          io.to(socketId).emit(userEvent, userData);
        });
      }
      
      return res.json({ success: true, notified: userSockets.length });
    }
    
    
    if (event === 'broadcast-to-room') {
      const { room, event: roomEvent, data: roomData } = data;
      
      if (!room || !roomEvent) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required parameters for broadcast-to-room' 
        });
      }
      
      console.log(`📢 Broadcasting to room ${room}: ${roomEvent}`);
      io.to(room).emit(roomEvent, roomData);
      
      return res.json({ success: true, room });
    }
    
    
    if (event === 'broadcast') {
      const { event: broadcastEvent, data: broadcastData } = data;
      
      if (!broadcastEvent) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required parameters for broadcast' 
        });
      }
      
      console.log(`📢 Broadcasting to all: ${broadcastEvent}`);
      io.emit(broadcastEvent, broadcastData);
      
      return res.json({ success: true });
    }
    
    
    if (event === 'emoji-created') {
      console.log(`😀 Emoji created event`);
      io.to(`server-${data.server_id}`).emit('emoji-created', data);
      return res.json({ success: true });
    }
    
    if (event === 'emoji-updated') {
      console.log(`😀 Emoji updated event`);
      io.to(`server-${data.server_id}`).emit('emoji-updated', data);
      return res.json({ success: true });
    }
    
    if (event === 'emoji-deleted') {
      console.log(`😀 Emoji deleted event`);
      io.to(`server-${data.server_id}`).emit('emoji-deleted', data);
      return res.json({ success: true });
    }
    
    if (event === 'reaction-added') {
      console.log(`👍 Reaction added event`);
      io.to(`channel-${data.channel_id}`).emit('reaction-added', data);
      return res.json({ success: true });
    }
    
    if (event === 'reaction-removed') {
      console.log(`👎 Reaction removed event`);
      io.to(`channel-${data.channel_id}`).emit('reaction-removed', data);
      return res.json({ success: true });
    }
    
    
    if (event === 'friend-request-received') {
      console.log(`👋 Friend request received event for user: ${data.recipient_id}`);
      
      const recipientSockets = Array.from(connectedUsers.entries())
        .filter(([socketId, user]) => user.userId === data.recipient_id.toString())
        .map(([socketId]) => socketId);
        
      recipientSockets.forEach(socketId => {
        io.to(socketId).emit('friend-request-received', data);
      });
      
      return res.json({ success: true });
    }
    
    if (event === 'friend-request-accepted') {
      console.log(`✅ Friend request accepted event for user: ${data.sender_id}`);
      
      const senderSockets = Array.from(connectedUsers.entries())
        .filter(([socketId, user]) => user.userId === data.sender_id.toString())
        .map(([socketId]) => socketId);
        
      senderSockets.forEach(socketId => {
        io.to(socketId).emit('friend-request-accepted', data);
      });
      
      return res.json({ success: true });
    }
    
    if (event === 'friend-request-declined') {
      console.log(`❌ Friend request declined event for user: ${data.sender_id}`);
      
      const senderSockets = Array.from(connectedUsers.entries())
        .filter(([socketId, user]) => user.userId === data.sender_id.toString())
        .map(([socketId]) => socketId);
        
      senderSockets.forEach(socketId => {
        io.to(socketId).emit('friend-request-declined', data);
      });
      
      return res.json({ success: true });
    }
    
    if (event === 'friend-removed') {
      console.log(`💔 Friend removed event for user: ${data.user_id}`);
      
      const userSockets = Array.from(connectedUsers.entries())
        .filter(([socketId, user]) => user.userId === data.user_id.toString())
        .map(([socketId]) => socketId);
        
      userSockets.forEach(socketId => {
        io.to(socketId).emit('friend-removed', data);
      });
      
      return res.json({ success: true });
    }
    
    
    io.emit(event, data);
    res.json({ success: true });
    
  } catch (error) {
    console.error('❌ Error processing emit request:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});


app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    connections: io.engine.clientsCount
  });
});

const server = http.createServer(app);

const PORT = process.env.SOCKET_PORT || 1002;
const BASE_PATH = process.env.SOCKET_BASE_PATH || '/socket.io';
const SUBPATH = process.env.SOCKET_SUBPATH || '';
const CORS_ALLOWED_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS || 'http:

const dbConfig = {
  host: process.env.DB_HOST || 'localhost', 
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'kolin123',
  database: process.env.DB_NAME || 'misvord',
  port: parseInt(process.env.DB_PORT) || 1003,

  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  charset: process.env.DB_CHARSET || 'utf8mb4'
};

const io = new Server(server, {
  cors: {
    origin: CORS_ALLOWED_ORIGINS,
    methods: ["GET", "POST"],
    credentials: true
  },
  path: BASE_PATH + SUBPATH,

  pingTimeout: 30000,
  pingInterval: 10000,
  transports: ['websocket', 'polling']
});

const connectedUsers = new Map();

const userStatus = new Map();

const recentMessages = new Map(); 
function trackMessageProcessing(userId, timestamp, messageId, content) {

  if (!recentMessages.has(userId)) {
    recentMessages.set(userId, new Map());
  }

  const userMessages = recentMessages.get(userId);
  userMessages.set(timestamp, { messageId, content: content.substring(0, 20) });

  if (userMessages.size > 20) {

    const oldestKey = Array.from(userMessages.keys())[0];
    userMessages.delete(oldestKey);
  }
}

function checkRecentDuplicate(userId, timestamp, content) {

  if (!recentMessages.has(userId)) return false;

  const userMessages = recentMessages.get(userId);

  const now = new Date().getTime();
  const checkTimeMillis = new Date(timestamp).getTime();

  for (const [msgTime, msgData] of userMessages.entries()) {
    const msgTimeMillis = new Date(msgTime).getTime();

    if (Math.abs(msgTimeMillis - checkTimeMillis) < 2000) {

      const existingContent = msgData.content;
      const newContent = content.substring(0, 20);
      if (existingContent === newContent) {
        console.log(`⚠️ Potential duplicate message detected for user ${userId}:`, {
          existing: existingContent,
          new: newContent,
          timeDiff: Math.abs(msgTimeMillis - checkTimeMillis) + 'ms'
        });
        return true;
      }
    }
  }
  return false;
}

let pool;

async function initDB() {
  if (!mysql) {
    console.log('⚠️ Database connectivity disabled - mysql2 module not loaded');
    return false;
  }

  try {
    console.log('🔗 Attempting database connection with config:', {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user,
      charset: dbConfig.charset
    });

    let testConnection;
    try {
      testConnection = await mysql.createConnection({
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        password: dbConfig.password
      });

      console.log('✓ Basic MySQL connection successful');
      await testConnection.end();
    } catch (basicError) {
      console.error('❌ Basic MySQL connection failed:', basicError.message);
      console.error('❌ Please ensure MySQL is running on localhost:1003');
      return false;
    }

    pool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,

      reconnect: true,
      idleTimeout: 300000,
      acquireTimeout: 60000
    });
    console.log('✓ Database connection pool created');

    const connection = await pool.getConnection();
    console.log('✓ Successfully connected to the database');

    const [dbCheck] = await connection.execute('SELECT DATABASE() as current_db');
    console.log('✓ Current database:', dbCheck[0].current_db);

    if (dbCheck[0].current_db !== dbConfig.database) {
      console.error(`❌ Connected to wrong database: ${dbCheck[0].current_db}, expected: ${dbConfig.database}`);
      connection.release();
      return false;
    }

    connection.release();

    try {
      console.log('🔍 Checking for required tables...');

      const [messageTableResult] = await pool.execute('SHOW TABLES LIKE "messages"');
      const [channelMessagesTableResult] = await pool.execute('SHOW TABLES LIKE "channel_messages"');
      const [usersTableResult] = await pool.execute('SHOW TABLES LIKE "users"');
      const [channelsTableResult] = await pool.execute('SHOW TABLES LIKE "channels"');

      console.log('📊 Table check results:', {
        messages: messageTableResult.length > 0 ? 'EXISTS' : 'MISSING',
        channel_messages: channelMessagesTableResult.length > 0 ? 'EXISTS' : 'MISSING',
        users: usersTableResult.length > 0 ? 'EXISTS' : 'MISSING',
        channels: channelsTableResult.length > 0 ? 'EXISTS' : 'MISSING'
      });

      if (messageTableResult.length === 0) {
        console.warn('⚠️ "messages" table not found in database');
        console.log('🔧 Attempting to create messages table...');
        await createMessagesTable();
      } else {
        console.log('✓ Messages table exists');

        const [messageColumns] = await pool.execute('DESCRIBE messages');
        console.log('📋 Messages table structure:', messageColumns.map(col => col.Field));
      }

      if (channelMessagesTableResult.length === 0) {
        console.warn('⚠️ "channel_messages" table not found in database');
        console.log('🔧 Attempting to create channel_messages table...');
        await createChannelMessagesTable();
      } else {
        console.log('✓ Channel messages table exists');
      }

      if (usersTableResult.length === 0) {
        console.error('❌ "users" table not found - this is required for message functionality');
      }

      if (channelsTableResult.length === 0) {
        console.error('❌ "channels" table not found - this is required for message functionality');
      }

    } catch (tableError) {
      console.error('⚠️ Error checking tables:', tableError.message);
    }

    try {
      const [testQuery] = await pool.execute('SELECT COUNT(*) as message_count FROM messages');
      console.log('✓ Database test query successful. Messages in database:', testQuery[0].message_count);
    } catch (queryError) {
      console.error('❌ Database test query failed:', queryError.message);
    }

    return true;
  } catch (error) {
    console.error('❌ Error connecting to the database:', error);
    console.error('❌ Connection details:', {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user,
      error: error.message,
      errno: error.errno,
      code: error.code
    });

    if (error.code === 'ECONNREFUSED') {
      console.error('💡 SOLUTION: Make sure MySQL is running on localhost:1003');
      console.error('💡 Check if Docker MySQL container is accessible: docker ps');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('💡 SOLUTION: Check database credentials');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('💡 SOLUTION: Database "misvord" does not exist');
    }

    return false;
  }
}

async function createMessagesTable() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        content TEXT NOT NULL,
        sent_at DATETIME NOT NULL,
        edited_at DATETIME NULL,
        message_type VARCHAR(50) NOT NULL DEFAULT 'text',
        attachment_url VARCHAR(255) NULL,
        reply_message_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (reply_message_id) REFERENCES messages(id) ON DELETE SET NULL
      )
    `);
    console.log('✓ Messages table created successfully');
  } catch (error) {
    console.error('❌ Error creating messages table:', error.message);
  }
}

async function createChannelMessagesTable() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS channel_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        channel_id INT NOT NULL,
        message_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_channel_message (channel_id, message_id),
        FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ Channel messages table created successfully');
  } catch (error) {
    console.error('❌ Error creating channel_messages table:', error.message);
  }
}

io.on('connection', async (socket) => {
  console.log(`👤 User connected: ${socket.id}`);
  socket.emit('connection_established', { socketId: socket.id });

  socket.on('authenticate', async (data) => {
    try {
      const { userId, username } = data;

      if (!userId) {
        socket.emit('auth_error', { message: 'Authentication failed: Invalid user ID' });
        return;
      }

      connectedUsers.set(userId, socket.id);
      socket.userId = userId;
      socket.username = username;

      console.log(`👤 User authenticated: ${username} (${userId})`);

      if (pool) {
        try {
          await pool.execute('UPDATE users SET status = ? WHERE id = ?', ['online', userId]);
          userStatus.set(userId, 'online');
        } catch (dbError) {
          console.error('❌ Error updating user status:', dbError);
        }
      }

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
            console.log(`🔄 User ${username} joined channel ${channel.id}`);
          });
          
          
          const [userServers] = await pool.execute(`
            SELECT server_id 
            FROM user_server_memberships
            WHERE user_id = ?
          `, [userId]);
          
          userServers.forEach(server => {
            socket.join(`server-${server.server_id}`);
            console.log(`🔄 User ${username} joined server ${server.server_id}`);
          });
        } catch (err) {
          console.error('❌ Error joining user channels and servers:', err);
        }
      }

      socket.broadcast.emit('user-status-change', { userId, status: 'online' });

      socket.emit('auth_success', { message: 'Authentication successful' });
    } catch (error) {
      console.error('❌ Authentication error:', error);
      socket.emit('auth_error', { message: 'Authentication failed: Server error' });
    }
  });

  socket.on('channel-message', async (data) => {
    try {
      const { channelId, content, message_type = 'text', timestamp = new Date().toISOString(), tempId } = data;
      const userId = socket.userId;

      console.log(`📩 Raw message data received:`, JSON.stringify(data, null, 2));
      console.log(`📊 Message processing conditions:`, {
        userId: !!userId,
        channelId: !!channelId,
        content: !!content,
        contentLength: content ? content.length : 0,
        hasPool: !!pool,
        socketId: socket.id
      });

      if (!userId || !channelId || !content) {
        const errorMsg = `Invalid message data: userId=${userId}, channelId=${channelId}, content=${content ? 'present' : 'missing'}`;
        console.error(`❌ ${errorMsg}`);
        socket.emit('message_error', { message: errorMsg });
        return;
      }

      if (checkRecentDuplicate(userId, timestamp, content)) {
        console.log(`🚫 Rejected duplicate message from user ${userId}`);
        socket.emit('message-sent-confirmation', {
          tempId: tempId || null,
          isDuplicate: true,
          message: 'Message appears to be a duplicate'
        });
        return;
      }

      console.log(`📩 Processing message from user ${userId} in channel ${channelId}:`, { content, message_type, tempId });

      if (!pool) {
        console.error('❌ No database pool available');
        socket.emit('message_error', { message: 'Database not available' });
        return;
      }

      let connection;
      try {
        console.log(`🔗 Getting database connection...`);
        connection = await pool.getConnection();
        console.log(`✓ Got database connection for message save`);

        const [dbCheck] = await connection.execute('SELECT DATABASE() as current_db');
        console.log(`✓ Using database: ${dbCheck[0].current_db}`);

        const [messagesTable] = await connection.execute('SHOW TABLES LIKE "messages"');
        const [channelMessagesTable] = await connection.execute('SHOW TABLES LIKE "channel_messages"');

        if (messagesTable.length === 0) {
          throw new Error('messages table does not exist');
        }
        if (channelMessagesTable.length === 0) {
          throw new Error('channel_messages table does not exist');
        }

        console.log(`✓ Required tables verified`);

        await connection.beginTransaction();
        console.log(`✓ Transaction started for message from user ${userId}`);

        const mysqlDateTime = new Date(timestamp).toISOString().slice(0, 19).replace('T', ' ');

        const insertQuery = `
          INSERT INTO messages 
          (user_id, content, sent_at, message_type, created_at, updated_at) 
          VALUES (?, ?, ?, ?, NOW(), NOW())
        `;

        console.log(`📝 Executing insert query:`, insertQuery);
        console.log(`📝 With values:`, [userId, content, mysqlDateTime, message_type]);

        const [result] = await connection.execute(insertQuery, [
          userId, 
          content, 
          mysqlDateTime,
          message_type
        ]);

        const messageId = result.insertId;
        console.log(`✅ Message inserted with ID ${messageId}`);

        if (!messageId || messageId <= 0) {
          throw new Error('Failed to get valid message ID from insert');
        }

        const linkQuery = 'INSERT INTO channel_messages (channel_id, message_id, created_at, updated_at) VALUES (?, ?, NOW(), NOW())';
        console.log(`🔗 Linking message to channel:`, linkQuery);
        console.log(`🔗 With values:`, [channelId, messageId]);

        await connection.execute(linkQuery, [channelId, messageId]);
        console.log(`✅ Message ${messageId} linked to channel ${channelId}`);

        const [userData] = await connection.execute(
          'SELECT username, avatar_url FROM users WHERE id = ?',
          [userId]
        );

        await connection.commit();
        console.log(`✅ Transaction committed for message ${messageId}`);

        const messageData = {
          id: messageId,
          user_id: userId,
          username: userData[0]?.username || socket.username,
          avatar: userData[0]?.avatar_url || null,
          content,
          message_type,
          timestamp: mysqlDateTime,
          channelId,
          sent_at: mysqlDateTime
        };

        console.log(`📡 Broadcasting message to channel:${channelId}:`, messageData);

        io.to(`channel:${channelId}`).emit('new-channel-message', messageData);
        console.log(`📡 Broadcast sent to ${io.sockets.adapter.rooms.get(`channel:${channelId}`)?.size || 0} clients`);

        socket.emit('message-sent-confirmation', {
          tempId: tempId || null,
          messageId: messageId,
          timestamp: mysqlDateTime,
          success: true
        });
        console.log(`✅ Confirmation sent to sender for message ${messageId}`);

        trackMessageProcessing(userId, mysqlDateTime, messageId, content);

        console.log(`🎉 Message ${messageId} successfully processed and broadcast`);

      } catch (error) {
        if (connection) {
          await connection.rollback();
          console.log(`🔄 Transaction rolled back due to error`);
        }

        console.error(`💥 Database error during message save:`, {
          error: error.message,
          code: error.code,
          errno: error.errno,
          sqlState: error.sqlState,
          sqlMessage: error.sqlMessage,
          stack: error.stack,
          userId,
          channelId,
          content: content.substring(0, 50) + '...'
        });

        socket.emit('message_error', { 
          message: 'Failed to save message: ' + error.message,
          tempId: tempId || null,
          error_code: error.code || 'UNKNOWN'
        });
      } finally {
        if (connection) {
          connection.release();
          console.log(`🔓 Database connection released`);
        }
      }
    } catch (error) {
      console.error('💥 Message handling error:', {
        message: error.message,
        stack: error.stack,
        userId: socket.userId,
        socketId: socket.id
      });
      socket.emit('message_error', { 
        message: 'Server error processing message: ' + error.message,
        tempId: data.tempId || null
      });
    }
  });

  socket.on('join-channel', (channelId) => {
    if (channelId) {
      socket.join(`channel:${channelId}`);
      console.log(`🔄 User ${socket.username || socket.id} joined channel ${channelId}`);
      socket.emit('channel-joined', { channelId });
    }
  });

  socket.on('leave-channel', (channelId) => {
    if (channelId) {
      socket.leave(`channel:${channelId}`);
      console.log(`🔄 User ${socket.username || socket.id} left channel ${channelId}`);
      socket.emit('channel-left', { channelId });
    }
  });

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

  socket.on('status-change', async (data) => {
    try {
      const { status, activity_details } = data;
      const userId = socket.userId;

      if (!userId || !status) return;

      const validStatuses = ['online', 'away', 'dnd', 'offline'];
      if (!validStatuses.includes(status)) return;

      if (pool) {
        try {
          await pool.execute('UPDATE users SET status = ? WHERE id = ?', [status, userId]);
          userStatus.set(userId, status);

          const statusData = {
            user_id: userId,
            username: socket.username,
            status,
            activity_details,
            timestamp: new Date().toISOString()
          };
          
          io.emit('user-status-changed', statusData);
          console.log(`👤 User ${socket.username} status changed to ${status}`);
        } catch (dbError) {
          console.error('❌ Error updating user status:', dbError);
        }
      }
    } catch (error) {
      console.error('❌ Status change error:', error);
    }
  });

  socket.on('heartbeat', () => {
    socket.emit('heartbeat-response', { timestamp: Date.now() });
  });

  socket.on('disconnect', async () => {
    try {
      const userId = socket.userId;
      console.log(`👤 User disconnected: ${socket.username || socket.id}`);

      if (userId) {

        connectedUsers.delete(userId);

        setTimeout(async () => {

          if (!connectedUsers.has(userId) && pool) {
            try {
              await pool.execute('UPDATE users SET status = ? WHERE id = ?', ['offline', userId]);
              userStatus.set(userId, 'offline');

              io.emit('user-status-change', { userId, status: 'offline' });
            } catch (dbError) {
              console.error('❌ Error updating user status to offline:', dbError);
            }
          }
        }, 10000); 
      }
    } catch (error) {
      console.error('❌ Disconnection error:', error);
    }
  });

  
  socket.on('set-activity', async (data) => {
    try {
      const { activity_details } = data;
      const userId = socket.userId;

      if (!userId || !activity_details) return;

      if (pool) {
        try {
          await pool.execute('UPDATE user_presence SET activity_details = ? WHERE user_id = ?', [activity_details, userId]);
          
          const activityData = {
            user_id: userId,
            username: socket.username,
            status: userStatus.get(userId) || 'online',
            activity_details,
            timestamp: new Date().toISOString()
          };
          
          io.emit('user-activity-changed', activityData);
          console.log(`🎮 User ${socket.username} activity changed to: ${activity_details}`);
        } catch (dbError) {
          console.error('❌ Error updating user activity:', dbError);
        }
      }
    } catch (error) {
      console.error('❌ Activity change error:', error);
    }
  });
  
  
  socket.on('clear-activity', async () => {
    try {
      const userId = socket.userId;

      if (!userId) return;

      if (pool) {
        try {
          await pool.execute('UPDATE user_presence SET activity_details = NULL WHERE user_id = ?', [userId]);
          
          const activityData = {
            user_id: userId,
            username: socket.username,
            status: userStatus.get(userId) || 'online',
            activity_details: null,
            timestamp: new Date().toISOString()
          };
          
          io.emit('user-activity-changed', activityData);
          console.log(`🎮 User ${socket.username} cleared activity`);
        } catch (dbError) {
          console.error('❌ Error clearing user activity:', dbError);
        }
      }
    } catch (error) {
      console.error('❌ Activity clearing error:', error);
    }
  });
});

app.get('/health', (req, res) => {
  res.send({ 
    status: 'ok',
    connections: io.engine.clientsCount,
    uptime: process.uptime()
  });
});

app.post('/broadcast', (req, res) => {
  try {
    const { event, data } = req.body;
    const apiKey = req.headers['x-api-key'];

    if (!apiKey || apiKey !== (process.env.SOCKET_API_KEY || 'kolin123')) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    console.log(`📡 Broadcasting event "${event}" from PHP:`, data);

    io.emit(event, data);

    res.json({ 
      success: true, 
      event, 
      timestamp: new Date().toISOString(),
      clients: io.engine.clientsCount 
    });
  } catch (error) {
    console.error('❌ Broadcast endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

server.listen(PORT, async () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   🚀 MisVord Socket.IO server running on ${PORT}     ║
║   📡 Socket.IO path: ${BASE_PATH}${SUBPATH}                     ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `);

  const dbConnected = await initDB();
  if (dbConnected) {
    console.log('✓ Database connection successful - messages will be saved');
  } else {
    console.log('⚠️ No database connection - messages will NOT be saved');
  }
});