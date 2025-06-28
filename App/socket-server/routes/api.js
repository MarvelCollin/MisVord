const eventController = require('../controllers/eventController');
const express = require('express');
const router = express.Router();
const socketController = require('../controllers/socketController');

function setupApiRoutes(server) {
    server.on('request', (req, res) => {
        if (req.url.startsWith('/api')) {
            eventController.handleApiRequest(req, res);
        }
    });
}

router.post('/notify', (req, res) => {
    const { event, data } = req.body;
    if (!event || !data) {
        return res.status(400).json({ error: 'Event and data are required' });
    }
    
    const io = req.app.get('io');
    io.to(`user_${data.target_user_id}`).emit(event, data);
    res.json({ success: true });
});

module.exports = {
    setupApiRoutes,
    router
};
