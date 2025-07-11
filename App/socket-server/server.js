const http = require('http');
const { Server } = require('socket.io');
const socketConfig = require('./config/socket');
const socketController = require('./controllers/socketController');
const eventController = require('./controllers/eventController');

const server = http.createServer((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'ok', 
            uptime: process.uptime(),
            service: 'socket-server'
        }));
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

const PORT = process.env.SOCKET_PORT || 1002;
const HOST = process.env.SOCKET_BIND_HOST || '0.0.0.0';

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
});

process.on('SIGTERM', () => {

    server.close(() => {

        process.exit(0);
    });
});


