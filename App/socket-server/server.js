const path = require('path');
const fs = require('fs');

// Check if running in Docker
const isDocker = process.env.IS_DOCKER === 'true';

if (!isDocker) {
    // Only load .env file if not in Docker (Docker uses environment variables directly)
    const envPath = path.resolve(__dirname, '..', '.env');
    console.log('🔍 [STARTUP] Loading .env from:', envPath);
    require('dotenv').config({ path: envPath });
} else {
    console.log('🐳 [STARTUP] Running in Docker - using container environment variables');
}

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
            console.log('Health check: io not ready yet');
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
        console.log('🤖 [STARTUP] Initializing TitiBot...');
        const BotHandler = require('./handlers/botHandler');
        

        await BotHandler.registerBot('7', 'titibot');
        BotHandler.connectBot(io, '7', 'titibot');
        console.log('✅ [STARTUP] TitiBot registered and connected successfully with ID: 7');
        
        return true;
    } catch (error) {
        console.error('❌ Error initializing TitiBot:', error.message);
        return false;
    }
}

socketController.setup(io);

const PORT = process.env.SOCKET_PORT;
const HOST = process.env.SOCKET_BIND_HOST;

if (!PORT || !HOST) {
    console.error('❌ [ERROR] Missing required environment variables:');
    console.error('   SOCKET_PORT:', PORT || 'UNDEFINED');
    console.error('   SOCKET_BIND_HOST:', HOST || 'UNDEFINED');
    
    if (isDocker) {
        console.error('   Running in Docker - check docker-compose.yml environment variables');
    } else {
        const envPath = path.resolve(__dirname, '..', '.env');
        console.error('   .env file path:', envPath);
        console.error('   .env file exists:', fs.existsSync(envPath));
        console.error('   Please check your .env file exists and contains these variables');
    }
    
    process.exit(1);
}

server.listen(PORT, HOST, async () => {
    console.log(`🚀 [STARTUP] Socket server running on ${HOST}:${PORT}`);
    console.log(`🌐 [STARTUP] CORS origins: ${process.env.CORS_ALLOWED_ORIGINS || '*'}`);
    
    setTimeout(async () => {
        const botInitialized = await initializeTitiBot();
        
        if (botInitialized) {
            console.log('✅ [STARTUP] TitiBot initialization complete');
        } else {
            console.log('⚠️ [STARTUP] TitiBot initialization failed');
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


