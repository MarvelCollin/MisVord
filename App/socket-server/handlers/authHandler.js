const roomManager = require('../services/roomManager');

class AuthHandler {
    static handle(io, client, data) {
        const { userId, username } = data;
        
        if (!userId) {
            client.emit('auth-error', { message: 'User ID is required' });
            return;
        }
        
        client.data = client.data || {};
        client.data.userId = userId;
        client.data.username = username || `User-${userId}`;
        client.data.authenticated = true;
        
        const userRoom = roomManager.getUserRoom(userId);
        roomManager.joinRoom(client, userRoom);
        roomManager.addUserSocket(userId, client.id);
        
        client.emit('auth-success', { 
            userId, 
            socketId: client.id,
            message: 'Authentication successful'
        });
        
        console.log(`User ${userId} (${username}) authenticated on client ${client.id}`);
    }
    
    static requireAuth(client) {
        return client.data?.authenticated === true;
    }
}

module.exports = AuthHandler; 