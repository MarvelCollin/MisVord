const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const userService = require('../services/userService');

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
    res.json({
      status: 'ok',
      connections: io.engine.clientsCount,
      users: userService.connectedUsers.size,
      timestamp: new Date().toISOString()
    });
  });

  router.get('/online-users', (req, res) => {
    try {
      const onlineUsers = userService.getAllOnlineUsers();
      res.json({
        success: true,
        users: onlineUsers,
        count: onlineUsers.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  router.get('/user-presence/:userId', (req, res) => {
    try {
      const { userId } = req.params;
      const presence = userService.getUserPresence(userId);
      res.json({
        success: true,
        userId,
        ...presence
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  router.post('/update-presence', (req, res) => {
    try {
      const { userId, status, activityDetails } = req.body;
      
      if (!userId || !status) {
        return res.status(400).json({
          success: false,
          error: 'userId and status are required'
        });
      }

      const userSockets = userService.getUserSockets(userId);
      
      if (userSockets.length > 0) {
        userSockets.forEach(socketId => {
          io.to(socketId).emit('update-presence', {
            status,
            activityDetails
          });
        });
      } else {
        userService.updateUserPresence(userId, status, null, activityDetails);
      }

      res.json({
        success: true,
        notified: userSockets.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  return router;
};