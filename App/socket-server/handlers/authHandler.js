const roomManager = require('../services/roomManager');

class AuthHandler {
    static handle(io, client, data) {
        console.log(`🔐 [AUTH-HANDLER] Processing authentication request from client ${client.id}`);
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
        
        // Set client data with all authentication info
        client.data = client.data || {};
        client.data.user_id = user_id;
        client.data.username = username || `User-${user_id}`;
        client.data.session_id = session_id; // Store session ID for PHP authentication
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
        
        // Join user room and track socket
        const userRoom = roomManager.getUserRoom(user_id);
        console.log(`🏠 [AUTH-HANDLER] Joining user room: ${userRoom}`);
        roomManager.joinRoom(client, userRoom);
        
        console.log(`📝 [AUTH-HANDLER] Adding user socket to tracking`);
        roomManager.addUserSocket(user_id, client.id);
        
        // Prepare authentication response with underscores
        const response = { 
            user_id, 
            user_id: user_id, // Keep both for compatibility
            socket_id: client.id,
            socket_id: client.id, // Keep both for compatibility 
            session_id: session_id,
            message: 'Authentication successful'
        };
        
        console.log(`📤 [AUTH-HANDLER] Sending auth success response:`, response);
        client.emit('auth-success', response);
        
        console.log(`👤 [AUTH-HANDLER] Setting user online status after authentication`);
        const userService = require('../services/userService');
        userService.updatePresence(user_id, 'idle', null);
        
        if (io && typeof io.emit === 'function') {
            console.log(`📡 [AUTH-HANDLER] Broadcasting user online status to all clients`);
            io.emit('user-online', {
                user_id: user_id,
                username: client.data.username,
                status: 'idle',
                timestamp: Date.now()
            });
            console.log(`✅ [AUTH-HANDLER] User online broadcast sent successfully`);
        } else {
            console.error(`❌ [AUTH-HANDLER] IO object not available or invalid for broadcasting user online status`);
        }
        
        console.log(`✅ [AUTH-HANDLER] User ${user_id} (${client.data.username}) authenticated successfully on client ${client.id}`);
    }
    
    static requireAuth(client) {
        const isAuthenticated = client.data?.authenticated === true;
        console.log(`🔐 [AUTH-HANDLER] Auth check for client ${client.id}: ${isAuthenticated ? 'PASSED' : 'FAILED'}`);
        
        if (!isAuthenticated) {
            console.warn(`⚠️ [AUTH-HANDLER] Unauthenticated client ${client.id} attempted protected action`);
        }
        
        return isAuthenticated;
    }
}

module.exports = AuthHandler; 