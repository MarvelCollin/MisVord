const dotenv = require('dotenv');

dotenv.config({ path: '../../.env' });

const socketConfig = {
  port: process.env.SOCKET_PORT || 1002,
  basePath: process.env.SOCKET_BASE_PATH || '/socket.io',
  subPath: process.env.SOCKET_SUBPATH || '',
  corsAllowedOrigins: (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:1001'),
  pingTimeout: 30000,
  pingInterval: 10000,
  transports: ['websocket', 'polling']
};

module.exports = socketConfig; 