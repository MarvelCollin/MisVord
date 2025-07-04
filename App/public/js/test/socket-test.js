document.addEventListener('DOMContentLoaded', function() {

    
    if (typeof io === 'undefined') {
        console.error('❌ [SOCKET-TEST] Socket.IO library not loaded');
        return;
    }
    

    
    const socketUrl = 'http://localhost:1002';

    
    try {
        const testSocket = io(socketUrl, {
            path: '/socket.io',
            transports: ['websocket', 'polling'],
            reconnection: false,
            timeout: 5000
        });
        
        testSocket.on('connect', () => {

            
            const userIdMeta = document.querySelector('meta[name="user-id"]');
            const usernameMeta = document.querySelector('meta[name="username"]');
            
            if (userIdMeta && usernameMeta) {

                testSocket.emit('authenticate', {
                    user_id: userIdMeta.content,
                    username: usernameMeta.content
                });
            } else {

            }
            
            setTimeout(() => {
                testSocket.disconnect();

            }, 3000);
        });
        
        testSocket.on('connect_error', (error) => {
            console.error('❌ [SOCKET-TEST] Connection error:', error);
            console.error('   Error type:', error.type);
            console.error('   Error description:', error.description);
            console.error('   URL attempted:', socketUrl);
        });
        
        testSocket.on('disconnect', (reason) => {

        });
        
        testSocket.on('auth-success', (data) => {

        });
        
        testSocket.on('auth-error', (data) => {
            console.error('❌ [SOCKET-TEST] Authentication failed:', data);
        });
        
    } catch (error) {
        console.error('❌ [SOCKET-TEST] Socket test failed:', error);
    }
    
    setTimeout(() => {
        if (window.globalSocketManager) {






        } else {

        }
    }, 2000);
});
