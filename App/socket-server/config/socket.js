const dotenv = require('dotenv');

dotenv.config({ path: '../../.env' });

const socketConfig = {
  port: process.env.SOCKET_PORT || 1002,
  host: process.env.SOCKET_HOST || 'localhost', 
  basePath: process.env.SOCKET_BASE_PATH || '/socket.io',
  subPath: process.env.SOCKET_SUBPATH || '',
  corsAllowedOrigins: (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:1001').split(','),
  pingTimeout: parseInt(process.env.SOCKET_PING_TIMEOUT) || 30000,
  pingInterval: parseInt(process.env.SOCKET_PING_INTERVAL) || 10000,
  transports: ['websocket', 'polling'],
  debug: process.env.APP_ENV !== 'production'
};

module.exports = socketConfig;