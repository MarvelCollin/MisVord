document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Socket Connection Test');
    
    if (typeof io === 'undefined') {
        console.error('❌ Socket.IO library not loaded');
        return;
    }
    
    console.log('✅ Socket.IO library loaded');
    
    const socketHostMeta = document.querySelector('meta[name="socket-host"]');
    const socketPortMeta = document.querySelector('meta[name="socket-port"]');
    
    const host = socketHostMeta?.content || 'localhost';
    const port = socketPortMeta?.content || '1002';
    const actualHost = window.location.hostname;
    
    console.log('🔍 Connection Details:');
    console.log('  - Meta Socket Host:', host);
    console.log('  - Meta Socket Port:', port);
    console.log('  - Window Location Host:', window.location.hostname);
    console.log('  - Will Connect To:', `${actualHost}:${port}`);
      const protocol = window.location.protocol;
    const url = `${protocol}//${actualHost}:${port}`;
    
    console.log('🚀 Attempting to connect to:', url);
    
    try {
        const testSocket = io(url, {
            path: '/socket.io',
            reconnection: false,
            timeout: 5000
        });
        
        testSocket.on('connect', () => {
            console.log('✅ Socket connected successfully!', testSocket.id);
            
            const userIdMeta = document.querySelector('meta[name="user-id"]');
            const usernameMeta = document.querySelector('meta[name="username"]');
            
            if (userIdMeta && usernameMeta) {
                testSocket.emit('authenticate', {
                    userId: userIdMeta.content,
                    username: usernameMeta.content
                });
            }
            
            setTimeout(() => {
                testSocket.disconnect();
                console.log('🔌 Test connection closed');
            }, 2000);
        });
        
        testSocket.on('connect_error', (error) => {
            console.error('❌ Socket connection error:', error);
            console.error('   Error type:', error.type);
            console.error('   Error description:', error.description);
        });
        
        testSocket.on('disconnect', (reason) => {
            console.log('🔌 Socket disconnected:', reason);
        });
        
        testSocket.on('authenticated', (data) => {
            console.log('✅ Socket authenticated:', data);
        });
        
        testSocket.on('authentication-failed', (data) => {
            console.error('❌ Socket authentication failed:', data);
        });
        
    } catch (error) {
        console.error('❌ Socket test failed:', error);
    }
});
