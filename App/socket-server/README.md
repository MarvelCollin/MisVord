# MisVord Socket Server

This is the WebSocket server for the MisVord chat application. It handles real-time communication between users, including messaging, presence updates, and notifications.

## Architecture

The socket server is built with a modular architecture:

```
socket-server/
├── config/               # Configuration files
│   ├── database.js       # Database connection configuration
│   └── socket.js         # Socket.IO configuration
├── controllers/          # Controllers for handling requests
│   ├── eventController.js # Handles REST API events
│   └── socketController.js # Handles socket events
├── routes/               # API routes
│   └── api.js            # REST API routes
├── services/             # Business logic services
│   ├── messageService.js # Message-related operations
│   └── userService.js    # User-related operations
├── server.js             # Main server file
└── package.json          # Dependencies and scripts
```

## Features

- Real-time messaging between users
- User presence tracking (online/offline status)
- Typing indicators
- Channel-based communication
- Friend request notifications
- Emoji and reaction handling
- REST API for server-to-socket communication

## Setup and Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Start the server:
   ```
   npm start
   ```

3. For development with auto-reload:
   ```
   npm run dev
   ```

4. For debugging:
   ```
   npm run debug
   ```

## API Endpoints

### Socket Events

- `authenticate`: Authenticate a user
- `join-channel`: Join a channel
- `leave-channel`: Leave a channel
- `channel-message`: Send a message to a channel
- `typing`: Send typing indicator
- `stop-typing`: Send stop typing indicator
- `update-presence`: Update user presence status
- `heartbeat`: Keep connection alive

### REST API

- `POST /api/emit`: Emit an event to connected clients
  - Body: `{ "event": "event-name", "data": { ... } }`

- `GET /api/health`: Check server health
  - Response: `{ "status": "ok", "uptime": 123, "timestamp": "..." }`

- `GET /api/stats`: Get server statistics
  - Response: `{ "status": "ok", "connections": 10, "users": 5, "timestamp": "..." }`

## Client Usage

### JavaScript Client

```javascript
// Import the socket client
import socketClient from './socket-client.js';

// Initialize the connection
socketClient.init()
  .then(() => {
    console.log('Socket connected!');
    
    // Authenticate
    return socketClient.authenticate(userId, username);
  })
  .then(() => {
    console.log('Authentication successful!');
    
    // Join a channel
    return socketClient.joinChannel('123');
  })
  .then(() => {
    console.log('Joined channel!');
    
    // Send a message
    return socketClient.sendChannelMessage('123', 'Hello, world!');
  })
  .catch(error => {
    console.error('Error:', error);
  });

// Listen for events
socketClient.on('new-channel-message', (data) => {
  console.log('New message:', data);
});
```

### PHP Client

```php
// Use the WebSocketClient class
$socketClient = new WebSocketClient('localhost', 1002);

// Emit an event
$socketClient->emit('notify-user', [
  'userId' => 123,
  'event' => 'notification',
  'data' => [
    'message' => 'Hello from PHP!'
  ]
]);
```

## Environment Variables

- `SOCKET_PORT`: Port for the socket server (default: 1002)
- `SOCKET_BASE_PATH`: Base path for Socket.IO (default: '/socket.io')
- `CORS_ALLOWED_ORIGINS`: Allowed CORS origins (default: 'http://localhost:1001')
- `DB_HOST`: Database host (default: 'localhost')
- `DB_PORT`: Database port (default: 1003)
- `DB_USER`: Database user (default: 'root')
- `DB_PASS`: Database password
- `DB_NAME`: Database name (default: 'misvord')
- `DB_CHARSET`: Database charset (default: 'utf8mb4') 