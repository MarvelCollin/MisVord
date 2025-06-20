const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config({ path: '../.env' });

// Import configuration and services
const socketConfig = require('./config/socket');
const db = require('./config/database');
const socketController = require('./controllers/socketController');

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: socketConfig.corsAllowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["my-custom-header"]
  },
  path: socketConfig.basePath + socketConfig.subPath,
  pingTimeout: socketConfig.pingTimeout,
  pingInterval: socketConfig.pingInterval,
  transports: socketConfig.transports,
  allowEIO3: true
});

// Set up API routes
const apiRoutes = require('./routes/api')(io);
app.use('/api', apiRoutes);

// Set up socket event handlers
socketController.setupSocketHandlers(io);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    connections: io.engine.clientsCount
  });
});

// Start the server
const PORT = process.env.SOCKET_PORT || socketConfig.port;
server.listen(PORT, async () => {
  console.log(`🚀 Socket server running on port ${PORT}`);
  console.log(`🔌 Socket.IO path: ${socketConfig.basePath}${socketConfig.subPath}`);
  
  try {
    // Initialize database connection
    const dbConnected = await db.initDatabase();
    if (dbConnected) {
      console.log('📊 Database connected successfully');
    } else {
      console.warn('⚠️ Running without database connectivity - some features may be limited');
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    console.warn('⚠️ Running without database connectivity - some features may be limited');
  }
});

// Handle graceful shutdown
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

function shutdown() {
  console.log('🛑 Shutting down socket server...');
  server.close(() => {
    console.log('✅ Socket server closed');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('⚠️ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}