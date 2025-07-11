const roomManager = require('../services/roomManager');

class AuthHandler {
    static handle(io, client, data) {

        console.log(`📋 [AUTH-HANDLER] Auth data received:`, {
            userId: data.user_id,
            username: data.username,
            sessionId: data.session_id,
            hasUserId: !!data.user_id,
            hasUsername: !!data.username,
            hasSessionId: !!data.session_id
        });
        
        const { user_id, username, session_id, avatar_url } = data;
        
        if (!user_id) {
            console.error(`❌ [AUTH-HANDLER] Authentication failed - User ID is missing for client ${client.id}`);
            console.error(`❌ [AUTH-HANDLER] Full data received:`, JSON.stringify(data, null, 2));
            client.emit('auth-error', { message: 'User ID is required' });
            return;
        }
        
        if (!username) {
            console.warn(`⚠️ [AUTH-HANDLER] Username not provided for user ${user_id}, generating default`);
        }
        

        client.data = client.data || {};
        client.data.user_id = user_id;
        client.data.username = username || `User-${user_id}`;
        client.data.session_id = session_id; // 
        client.data.avatar_url = avatar_url || '/public/assets/common/default-profile-picture.png';
        client.data.authenticated = true;
        
        console.log(`📝 [AUTH-HANDLER] Client data set:`, {
            clientId: client.id,
            userId: client.data.user_id,
            username: client.data.username,
            sessionId: client.data.session_id,
            avatarUrl: client.data.avatar_url,
            authenticated: client.data.authenticated
        });
        

        const userRoom = roomManager.getUserRoom(user_id);

        roomManager.joinRoom(client, userRoom);
        

        roomManager.addUserSocket(user_id, client.id);
        

        const response = { 
            user_id, 
            user_id: user_id, // 
            socket_id: client.id,
            socket_id: client.id, // 
            session_id: session_id,
            message: 'Authentication successful'
        };
        

        client.emit('auth-success', response);
        

        const userService = require('../services/userService');
        userService.updatePresence(user_id, 'online', { type: 'idle' }, client.data.username);
        
        if (io && typeof io.emit === 'function') {

            io.emit('user-online', {
                user_id: user_id,
                username: client.data.username,
                status: 'online',
                activity_details: { type: 'idle' },
                timestamp: Date.now()
            });

        } else {
            console.error(`❌ [AUTH-HANDLER] IO object not available or invalid for broadcasting user online status`);
        }
        

    }
    
    static requireAuth(client) {
        const isAuthenticated = client.data?.authenticated === true;

        
        if (!isAuthenticated) {
            console.warn(`⚠️ [AUTH-HANDLER] Unauthenticated client ${client.id} attempted protected action`);
        }
        
        return isAuthenticated;
    }
}

module.exports = AuthHandler; 