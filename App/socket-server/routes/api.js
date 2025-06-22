const eventController = require('../controllers/eventController');

function setupApiRoutes(server) {
    server.on('request', (req, res) => {
        if (req.url.startsWith('/api')) {
            eventController.handleApiRequest(req, res);
        }
    });
}

module.exports = {
    setupApiRoutes
};
