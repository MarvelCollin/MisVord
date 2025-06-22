let io = null;

const setIO = (ioInstance) => {
    io = ioInstance;
};

const handleApiRequest = (req, res) => {
    if (req.method === 'POST' && req.url === '/api/emit') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                
                if (!data.event || !data.data) {
                    sendResponse(res, 400, { success: false, message: 'Invalid request format' });
                    return;
                }
                
                if (data.event === 'broadcast') {
                    io.emit(data.data.event, data.data.data);
                } else if (data.event === 'notify-user' && data.data.userId) {
                    io.to(`user-${data.data.userId}`).emit(data.data.event, data.data.data);
                } else if (data.event === 'broadcast-to-room' && data.data.room) {
                    io.to(data.data.room).emit(data.data.event, data.data.data);
                } else if (data.event === 'channel-message' && data.data.channelId) {
                    const room = `channel-${data.data.channelId}`;
                    io.to(room).emit('new-channel-message', data.data);
                } else if (data.event === 'direct-message' && data.data.roomId) {
                    const room = `dm-room-${data.data.roomId}`;
                    io.to(room).emit('user-message-dm', data.data);
                } else {
                    io.emit(data.event, data.data);
                }
                
                sendResponse(res, 200, { success: true, message: 'Event emitted' });
            } catch (error) {
                sendResponse(res, 500, { success: false, message: 'Server error', error: error.message });
            }
        });
    } else if (req.method === 'GET' && req.url === '/api/health') {
        sendResponse(res, 200, { 
            status: 'ok', 
            uptime: process.uptime(),
            timestamp: new Date().toISOString() 
        });
    } else if (req.method === 'GET' && req.url === '/api/online-users') {
        if (!io) {
            sendResponse(res, 503, { success: false, message: 'Socket.io not initialized' });
            return;
        }
        
        const onlineUsers = {};
        for (const [socketId, socket] of io.of('/').sockets) {
            if (socket.data?.userId) {
                onlineUsers[socket.data.userId] = {
                    socketId,
                    username: socket.data.username,
                    status: socket.data.status || 'online'
                };
            }
        }
        
        sendResponse(res, 200, { success: true, users: onlineUsers });
    } else {
        sendResponse(res, 404, { success: false, message: 'Endpoint not found' });
    }
};

const sendResponse = (res, statusCode, data) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
};

module.exports = {
    setIO,
    handleApiRequest
};
