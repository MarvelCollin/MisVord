const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

module.exports = (io) => {
  router.post('/emit', (req, res) => eventController.handleEmitRequest(io, req, res));

  router.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      connections: io.engine.clientsCount
    });
  });

  router.get('/stats', (req, res) => {
    const userService = require('../services/userService');
    
    res.json({
      status: 'ok',
      connections: io.engine.clientsCount,
      users: userService.connectedUsers.size,
      timestamp: new Date().toISOString()
    });
  });

  return router;
}; 