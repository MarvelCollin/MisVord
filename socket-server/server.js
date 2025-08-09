const path = require('path');
const fs = require('fs');

const isDocker = process.env.IS_DOCKER === 'true';
const isVPS = process.env.IS_VPS === 'true';

if (!isDocker) {
    const envPath = path.resolve(__dirname, '..', '.env');
    
    require('dotenv').config({ path: envPath });
} else {
    
}

console.log('🌍 [STARTUP] Environment configuration:', {
    IS_DOCKER: process.env.IS_DOCKER,
    IS_VPS: process.env.IS_VPS,
    SOCKET_HOST: process.env.SOCKET_HOST,
    SOCKET_PORT: process.env.SOCKET_PORT,
    SOCKET_BIND_HOST: process.env.SOCKET_BIND_HOST,
    SOCKET_SECURE: process.env.SOCKET_SECURE,
    CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS
});

const http = require('http');
const { Server } = require('socket.io');
const socketConfig = require('./config/socket');
const socketController = require('./controllers/socketController');
const eventController = require('./controllers/eventController');

const server = http.createServer((req, res) => {
    if (req.url === '/health' || req.url === '/socket-health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        
        let connectedClients = 0;
        let authenticatedUsers = 0;
        
        try {
            if (typeof io !== 'undefined' && io.engine) {
                connectedClients = io.engine.clientsCount || 0;
                authenticatedUsers = Array.from(io.sockets.sockets.values())
                    .filter(socket => socket.data?.authenticated).length;
            }
        } catch (error) {
            
        }
        
        res.end(JSON.stringify({ 
            status: 'ok', 
            uptime: process.uptime(),
            service: 'socket-server',
            port: process.env.SOCKET_PORT,
            host: process.env.SOCKET_BIND_HOST,
            connectedClients,
            authenticatedUsers,
            corsOrigins: process.env.CORS_ALLOWED_ORIGINS?.split(',') || ['*'],
            timestamp: new Date().toISOString(),
            version: require('./package.json').version || '1.0.0'
        }));
    } else if (req.url === '/socket-test') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
<!DOCTYPE html>
<html>
<head>
    <title>Socket.IO Test</title>
    <script src="/socket.io/socket.io.js"></script>
</head>
<body>
    <h1>Socket.IO Connection Test</h1>
    <div id="status">Connecting...</div>
    <div id="messages"></div>
    
    <script>
        const socket = io();
        const statusDiv = document.getElementById('status');
        const messagesDiv = document.getElementById('messages');
        
        function addMessage(message) {
            const div = document.createElement('div');
            div.textContent = new Date().toLocaleTimeString() + ': ' + message;
            messagesDiv.appendChild(div);
        }
        
        socket.on('connect', () => {
            statusDiv.textContent = 'Connected ✅';
            statusDiv.style.color = 'green';
            addMessage('Connected to socket server');
        });
        
        socket.on('disconnect', () => {
            statusDiv.textContent = 'Disconnected ❌';
            statusDiv.style.color = 'red';
            addMessage('Disconnected from socket server');
        });
        
        socket.on('connect_error', (error) => {
            statusDiv.textContent = 'Connection Error ❌';
            statusDiv.style.color = 'red';
            addMessage('Connection error: ' + error.message);
        });
    </script>
</body>
</html>
        `);
    } else if (req.url.startsWith('/api')) {
        eventController.handleApiRequest(req, res);
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not Found' }));
    }
});

const io = new Server(server, socketConfig.options);

async function initializeTitiBot() {
    try {
        
        const BotHandler = require('./handlers/botHandler');
        

        await BotHandler.registerBot('4', 'titibot');
        BotHandler.connectBot(io, '4', 'titibot');
        
        
        return true;
    } catch (error) {
        console.error('❌ Error initializing TitiBot:', error.message);
        return false;
    }
}

socketController.setup(io);

const PORT = '1002';
const HOST = process.env.SOCKET_BIND_HOST || '0.0.0.0';

console.log('🔧 [STARTUP] Server binding configuration:', {
    PORT: PORT,
    HOST: HOST,
    SOCKET_PORT_ENV: process.env.SOCKET_PORT,
    note: 'Server always binds to 1002, SOCKET_PORT is for frontend connection'
});

if (!HOST) {
    console.error('❌ [ERROR] Missing required environment variable:');
    console.error('   SOCKET_BIND_HOST:', HOST || 'UNDEFINED');
    
    if (isDocker) {
        console.error('   Running in Docker - check docker-compose.yml environment variables');
    } else {
        const envPath = path.resolve(__dirname, '..', '.env');
        console.error('   .env file path:', envPath);
        console.error('   .env file exists:', fs.existsSync(envPath));
        console.error('   Please check your .env file exists and contains SOCKET_BIND_HOST');
    }
    
    process.exit(1);
}

server.listen(PORT, HOST, async () => {
    
    
    
    setTimeout(async () => {
        const botInitialized = await initializeTitiBot();
        
        if (botInitialized) {
            
        } else {
            
        }
    }, 2000);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ [ERROR] Port ${PORT} is already in use`);
        console.error('   Please stop the existing server or use a different port');
    } else {
        console.error('❌ [ERROR] Server error:', err.message);
    }
    process.exit(1);
});

process.on('SIGTERM', () => {

    server.close(() => {

        process.exit(0);
    });
});


