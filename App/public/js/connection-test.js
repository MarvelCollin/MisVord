// Simple connection test
console.log('🔍 Testing socket connection...');

window.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 DOM loaded, testing socket connection');
    
    // Get socket configuration from meta tags
    const socketHost = document.querySelector('meta[name="socket-host"]')?.content || 'localhost';
    const socketPort = document.querySelector('meta[name="socket-port"]')?.content || '1002';
    const socketUrl = `http://${socketHost}:${socketPort}`;
    
    console.log('🔍 Socket URL:', socketUrl);
    
    // Test basic connection
    const socket = io(socketUrl, {
        transports: ['polling', 'websocket'],
        timeout: 5000,
        forceNew: true
    });
    
    socket.on('connect', () => {
        console.log('✅ Socket connected successfully!');
        console.log('📡 Transport:', socket.io.engine.transport.name);
        socket.disconnect();
    });
    
    socket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error);
    });
    
    // Test after 2 seconds
    setTimeout(() => {
        if (!socket.connected) {
            console.log('⏰ Connection timeout, socket not connected');
        }
    }, 5000);
});
