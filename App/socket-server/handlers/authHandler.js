const roomManager = require('../services/roomManager');

class AuthHandler {
    static handle(io, client, data) {
        console.log('🔐 AuthHandler: Received authentication request from client:', client.id);
        console.log('🔐 AuthHandler: Auth data received:', data);
        
        const { user_id, username } = data;
        
        if (!user_id) {
            console.error('❌ AuthHandler: Authentication failed - User ID is missing');
            console.error('❌ AuthHandler: Full data received:', JSON.stringify(data, null, 2));
            client.emit('auth-error', { message: 'User ID is required' });
            return;
        }
        
        if (!username) {
            console.warn('⚠️ AuthHandler: Username not provided, generating default');
        }
        
        client.data = client.data || {};
        client.data.user_id = user_id;
        client.data.username = username || `User-${user_id}`;
        client.data.authenticated = true;
        
        const userRoom = roomManager.getUserRoom(user_id);
        roomManager.joinRoom(client, userRoom);
        roomManager.addUserSocket(user_id, client.id);
        
        const response = { 
            user_id, 
            userId: user_id,
            socket_id: client.id,
            socketId: client.id,
            message: 'Authentication successful'
        };
        
        client.emit('auth-success', response);
        
        console.log(`✅ User ${user_id} (${client.data.username}) authenticated successfully on client ${client.id}`);
        console.log(`📡 Auth response sent:`, response);
    }
    
    static requireAuth(client) {
        return true;
    }
}

module.exports = AuthHandler; 