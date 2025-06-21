// Minimal Socket.IO Connection Test - Docker WebSocket Only
console.log('🧪 Starting minimal Docker WebSocket test...');

function testMinimalConnection() {
    if (typeof io === 'undefined') {
        console.error('❌ Socket.IO not loaded');
        return;
    }

    const socketHost = window.location.hostname;
    const socketPort = '1002';
    const socketUrl = `http://${socketHost}:${socketPort}`;
    
    console.log('🔗 Testing Docker WebSocket connection to:', socketUrl);
    
    // Test with websocket only (Docker mode)
    const socket = io(socketUrl, {
        transports: ['websocket'],  // ONLY websocket
        path: '/socket.io',
        timeout: 15000,
        forceNew: true,
        autoConnect: true,
        upgrade: false // No upgrades
    });
    
    let connectionTimeout = setTimeout(() => {
        console.error('⏰ Docker WebSocket connection timeout after 15 seconds');
        socket.disconnect();
    }, 15000);
    
    socket.on('connect', () => {
        console.log('✅ MINIMAL TEST SUCCESS!');
        console.log('   - Socket ID:', socket.id);
        console.log('   - Transport:', socket.io.engine.transport.name);
        console.log('   - URL:', socket.io.uri);
        clearTimeout(connectionTimeout);
        
        // Test authentication
        socket.emit('authenticate', {
            userId: '1',
            username: 'test-user',
            token: 'test-token'
        });
        
        socket.on('authenticated', (data) => {
            console.log('✅ Authentication successful:', data);
            socket.disconnect();
        });
        
        socket.on('authentication-failed', (data) => {
            console.warn('⚠️ Authentication failed (expected for test):', data);
            socket.disconnect();
        });
    });
    
    socket.on('connect_error', (error) => {
        console.error('❌ MINIMAL TEST FAILED:');
        console.error('   - Error:', error.message);
        console.error('   - Type:', error.type);
        console.error('   - Description:', error.description);
        clearTimeout(connectionTimeout);
    });
    
    socket.on('disconnect', (reason) => {
        console.log('🔌 Disconnected:', reason);
        clearTimeout(connectionTimeout);
    });
}

// Run test immediately
testMinimalConnection();

// Also make it available globally
window.testMinimalConnection = testMinimalConnection;
