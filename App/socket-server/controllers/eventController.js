const url = require('url');
const roomManager = require('../services/roomManager');

let io = null;

const setIO = (ioInstance) => {
    io = ioInstance;
};

const handleApiRequest = (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const query = parsedUrl.query;
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
    }
    
    if (path === '/api/socket/status') {
        handleSocketStatus(req, res);
    } else if (path === '/api/socket/broadcast') {
        handleBroadcast(req, res, query);
    } else if (path === '/api/voice/meetings') {
        handleVoiceMeetings(req, res, query);
    } else {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Not Found' }));
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

module.exports = {
    setIO,
    handleApiRequest
};
