const dotenv = require('dotenv');

dotenv.config({ path: '../../.env' });

const socketConfig = {
  port: process.env.SOCKET_PORT || 1002,
  host: process.env.SOCKET_HOST || '0.0.0.0', 
  basePath: process.env.SOCKET_BASE_PATH || '/socket.io',
  subPath: process.env.SOCKET_SUBPATH || '',
  corsAllowedOrigins: process.env.CORS_ALLOWED_ORIGINS 
    ? process.env.CORS_ALLOWED_ORIGINS.split(',')
    : ['http://localhost:1001', 'http://127.0.0.1:1001', 'http://misvord_php:1001'],
  pingTimeout: parseInt(process.env.SOCKET_PING_TIMEOUT) || 30000,
  pingInterval: parseInt(process.env.SOCKET_PING_INTERVAL) || 10000,    transports: ['polling', 'websocket'],// Allow both for connection testing
  debug: process.env.APP_ENV !== 'production'
};

module.exports = socketConfig;