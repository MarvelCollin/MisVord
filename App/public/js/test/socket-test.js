document.addEventListener('DOMContentLoaded', function() {
    console.log('🧪 [SOCKET-TEST] Starting comprehensive socket test');
    
    if (typeof io === 'undefined') {
        console.error('❌ [SOCKET-TEST] Socket.IO library not loaded');
        return;
    }
    
    console.log('✅ [SOCKET-TEST] Socket.IO library loaded');
    
    const socketUrl = 'http://localhost:1002';
    console.log('🔍 [SOCKET-TEST] Testing connection to:', socketUrl);
    
    try {
        const testSocket = io(socketUrl, {
            path: '/socket.io',
            transports: ['websocket', 'polling'],
            reconnection: false,
            timeout: 5000
        });
        
        testSocket.on('connect', () => {
            console.log('✅ [SOCKET-TEST] Socket connected successfully!', testSocket.id);
            
            const userIdMeta = document.querySelector('meta[name="user-id"]');
            const usernameMeta = document.querySelector('meta[name="username"]');
            
            if (userIdMeta && usernameMeta) {
                console.log('🔐 [SOCKET-TEST] Sending authentication...');
                testSocket.emit('authenticate', {
                    user_id: userIdMeta.content,
                    username: usernameMeta.content
                });
            } else {
                console.log('⚠️ [SOCKET-TEST] No user credentials found');
            }
            
            setTimeout(() => {
                testSocket.disconnect();
                console.log('🔌 [SOCKET-TEST] Test connection closed');
            }, 3000);
        });
        
        testSocket.on('connect_error', (error) => {
            console.error('❌ [SOCKET-TEST] Connection error:', error);
            console.error('   Error type:', error.type);
            console.error('   Error description:', error.description);
            console.error('   URL attempted:', socketUrl);
        });
        
        testSocket.on('disconnect', (reason) => {
            console.log('🔌 [SOCKET-TEST] Socket disconnected:', reason);
        });
        
        testSocket.on('auth-success', (data) => {
            console.log('✅ [SOCKET-TEST] Authentication successful:', data);
        });
        
        testSocket.on('auth-error', (data) => {
            console.error('❌ [SOCKET-TEST] Authentication failed:', data);
        });
        
    } catch (error) {
        console.error('❌ [SOCKET-TEST] Socket test failed:', error);
    }
    
    setTimeout(() => {
        if (window.globalSocketManager) {
            console.log('🔍 [SOCKET-TEST] Global Socket Manager Status:');
            console.log('   Connected:', window.globalSocketManager.connected);
            console.log('   Authenticated:', window.globalSocketManager.authenticated);
            console.log('   Socket ID:', window.globalSocketManager.io?.id);
            console.log('   User ID:', window.globalSocketManager.userId);
            console.log('   Username:', window.globalSocketManager.username);
        } else {
            console.log('❌ [SOCKET-TEST] Global Socket Manager not found');
        }
    }, 2000);
});
