const roomManager = require('../services/roomManager');

class AuthHandler {
    static handle(io, client, data) {
        const { user_id, username } = data;
        
        if (!user_id) {
            client.emit('auth-error', { message: 'User ID is required' });
            return;
        }
        
        client.data = client.data || {};
        client.data.user_id = user_id;
        client.data.username = username || `User-${user_id}`;
        client.data.authenticated = true;
        
        const userRoom = roomManager.getUserRoom(user_id);
        roomManager.joinRoom(client, userRoom);
        roomManager.addUserSocket(user_id, client.id);
        
        client.emit('auth-success', { 
            user_id, 
            userId: user_id,
            socket_id: client.id,
            socketId: client.id,
            message: 'Authentication successful'
        });
        
        console.log(`User ${user_id} (${username}) authenticated on client ${client.id}`);
    }
    
    static requireAuth(client) {
        return client.data?.authenticated === true;
    }
}

module.exports = AuthHandler; 