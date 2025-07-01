const url = require('url');
const roomManager = require('../services/roomManager');
const userService = require('../services/userService');

let io = null;

const setIO = (ioInstance) => {
    io = ioInstance;
};

const handleApiRequest = (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const query = parsedUrl.query;
    const method = req.method;
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (method === 'OPTIONS') {
        res.statusCode = 200;
        res.end();
        return;
    }
    
    try {
        if (path === '/api/notify' && method === 'POST') {
            handleNotify(req, res);
        } else if (path === '/api/online-users' && method === 'GET') {
            handleGetOnlineUsers(req, res);
        } else if (path === '/api/socket/status') {
            handleSocketStatus(req, res);
        } else if (path === '/api/socket/broadcast') {
            handleBroadcast(req, res, query);
        } else if (path === '/api/voice/meetings') {
            handleVoiceMeetings(req, res, query);
        } else {
            res.statusCode = 404;
            res.end(JSON.stringify({ success: false, error: 'Not found' }));
        }
    } catch (error) {
        console.error('API request error:', error);
        res.statusCode = 500;
        res.end(JSON.stringify({ success: false, error: 'Internal server error' }));
    }
};

function handleSocketStatus(req, res) {
    if (!io) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Socket.IO not initialized' }));
        return;
    }
    
    const status = {
        connected: io.engine.clientsCount,
        uptime: process.uptime(),
        voiceMeetings: roomManager.getAllVoiceMeetings().length
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(status));
}

function handleBroadcast(req, res, query) {
    if (!io) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Socket.IO not initialized' }));
        return;
    }
    
    if (req.method !== 'POST') {
        res.statusCode = 405;
        res.end(JSON.stringify({ error: 'Method Not Allowed' }));
        return;
    }
    
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    
    req.on('end', () => {
        try {
            const data = JSON.parse(body);
            const event = data.event || query.event;
            const payload = data.payload;
            const room = data.room;
            
            if (!event) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Event name is required' }));
                return;
            }
            
            if (room) {
                roomManager.broadcastToRoom(io, room, event, payload);
            } else {
                io.emit(event, payload);
                console.log(`Broadcasted event ${event} to all clients`);
            }
            
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, event, room }));
        } catch (error) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
    });
}

function handleVoiceMeetings(req, res, query) {
    if (!io) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Socket.IO not initialized' }));
        return;
    }
    
    const voiceMeetings = roomManager.getAllVoiceMeetings();
    
    const channelId = query.channelId;
    if (channelId) {
        const meetingInfo = voiceMeetings.find(m => m.channelId === channelId);
        if (meetingInfo) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(meetingInfo));
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ channelId, meetingId: null, participantCount: 0 }));
        }
        return;
    }
    
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(voiceMeetings));
}

function handleNotify(req, res) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    req.on('end', () => {
        try {
            const data = JSON.parse(body);
            const { event, data: eventData } = data;
            
            if (!event || !eventData) {
                res.statusCode = 400;
                res.end(JSON.stringify({ success: false, error: 'Event and data are required' }));
                return;
            }

            const io = req.app?.get?.('io') || global.io;
            if (io && eventData.target_user_id) {
                io.to(`user_${eventData.target_user_id}`).emit(event, eventData);
            }
            
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true }));
        } catch (error) {
            console.error('Notify error:', error);
            res.statusCode = 400;
            res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
        }
    });
}

function handleGetOnlineUsers(req, res) {
    try {
        const onlineUsers = userService.getAllPresence();
        
        res.statusCode = 200;
        res.end(JSON.stringify({
            success: true,
            users: onlineUsers,
            count: Object.keys(onlineUsers).length,
            timestamp: Date.now()
        }));
    } catch (error) {
        console.error('Get online users error:', error);
        res.statusCode = 500;
        res.end(JSON.stringify({ 
            success: false, 
            error: 'Failed to get online users',
            users: {},
            count: 0
        }));
    }
}

module.exports = {
    setIO,
    handleApiRequest
};
