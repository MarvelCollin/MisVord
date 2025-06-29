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
    console.log('🤖 Initializing TitiBot...');
    
    try {
        const response = await fetch('http://app:1001/api/bots/public-check/titibot', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'SocketServer/1.0'
            }
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success && result.exists && result.is_bot && result.bot) {
                const bot = result.bot;
                console.log(`✅ TitiBot found in database with ID: ${bot.id}`);
                
                const BotHandler = require('./handlers/botHandler');
                BotHandler.registerBot(bot.id.toString(), bot.username);
                BotHandler.connectBot(io, bot.id.toString(), bot.username);
                
                console.log(`🎉 TitiBot initialized successfully with ID: ${bot.id}`);
                return true;
            } else {
                console.warn('⚠️ TitiBot not found in database - bot functionality disabled');
                return false;
            }
        } else {
            console.error(`❌ Failed to check TitiBot: ${response.status} ${response.statusText}`);
            return false;
        }
    } catch (error) {
        console.error('❌ Error initializing TitiBot:', error.message);
        console.log('⚠️ TitiBot will be unavailable until manual initialization');
        return false;
    }
}

socketController.setup(io);

const PORT = process.env.SOCKET_PORT || 3001;

server.listen(PORT, async () => {
    console.log(`🚀 Socket server running on port ${PORT}`);
    console.log(`📍 Socket server URL: http://localhost:${PORT}`);
    
    setTimeout(async () => {
        console.log('🔄 Attempting TitiBot initialization...');
        const botInitialized = await initializeTitiBot();
        
        if (botInitialized) {
            console.log('✅ Socket server fully initialized with TitiBot');
        } else {
            console.log('⚠️ Socket server initialized but TitiBot is unavailable');
        }
    }, 2000);
});

process.on('SIGTERM', () => {
    console.log('📴 Socket server shutting down...');
    server.close(() => {
        console.log('✅ Socket server closed');
        process.exit(0);
    });
});

console.log('🔌 Socket server starting...');
