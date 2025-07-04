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

                const BotHandler = require('./handlers/botHandler');
                BotHandler.registerBot(bot.id.toString(), bot.username);
                BotHandler.connectBot(io, bot.id.toString(), bot.username);

                return true;
            } else if (!result.exists) {
                console.warn('⚠️ TitiBot not found in database – creating now...');
                try {
                    const createRes = await fetch('http://app:1001/api/debug/create-titibot', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'User-Agent': 'SocketServer/1.0' }
                    });
                    if (createRes.ok) {
                        const createResult = await createRes.json();
                        if (createResult.success && createResult.bot_data) {

                            return await initializeTitiBot();
                        }
                    }
                    console.error('❌ Failed to auto-create TitiBot');
                } catch (createErr) {
                    console.error('❌ Error while auto-creating TitiBot:', createErr.message);
                }
                return false;
            } else {
                console.warn('⚠️ TitiBot exists but not a bot – bot functionality disabled');
                return false;
            }
        } else {
            console.error(`❌ Failed to check TitiBot: ${response.status} ${response.statusText}`);
            return false;
        }
    } catch (error) {
        console.error('❌ Error initializing TitiBot:', error.message);

        return false;
    }
}

socketController.setup(io);

const PORT = process.env.SOCKET_PORT || 1002;

server.listen(PORT, async () => {


    
    setTimeout(async () => {

        const botInitialized = await initializeTitiBot();
        
        if (botInitialized) {

        } else {

        }
    }, 2000);
});

process.on('SIGTERM', () => {

    server.close(() => {

        process.exit(0);
    });
});


