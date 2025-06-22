const http = require('http');
const { Server } = require('socket.io');
const socketConfig = require('./config/socket');
const socketController = require('./controllers/socketController');
const eventController = require('./controllers/eventController');

const server = http.createServer((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
    } else if (req.url.startsWith('/api')) {
        eventController.handleApiRequest(req, res);
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not Found' }));
    }
});

const io = new Server(server, socketConfig.options);

socketController.setup(io);

const PORT = process.env.SOCKET_PORT || 1002;
server.listen(PORT, () => {
    console.log(`Socket server running on port ${PORT}`);
    console.log('Socket server is ready to accept connections');
});
