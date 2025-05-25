const axios = require('axios');
const io = require('socket.io-client');

async function healthCheck() {
    console.log('🔍 Checking MiscVord Socket Server Health...\n');

    // 1. Check if socket server HTTP endpoint is responding
    try {
        console.log('1. Testing HTTP health endpoint...');
        const response = await axios.get('http://localhost:1002/health', { timeout: 5000 });
        console.log('   ✅ HTTP endpoint: OK');
        console.log('   📊 Status:', response.data.status);
        console.log('   ⏱️  Uptime:', Math.round(response.data.uptime), 'seconds');
        console.log('   👥 Video users:', response.data.videoChatUserCount);
        console.log('   🔗 Socket path:', response.data.socketPath);
    } catch (error) {
        console.log('   ❌ HTTP endpoint: FAILED');
        console.log('   🔍 Error:', error.message);
        return false;
    }

    // 2. Test Socket.IO connection
    try {
        console.log('\n2. Testing Socket.IO connection...');
        const socket = io('http://localhost:1002', {
            path: '/socket.io',
            transports: ['websocket', 'polling'],
            timeout: 5000
        });

        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Connection timeout'));
            }, 5000);

            socket.on('connect', () => {
                clearTimeout(timeout);
                console.log('   ✅ Socket.IO: Connected');
                console.log('   🆔 Socket ID:', socket.id);
                
                // Test ping
                const startTime = Date.now();
                socket.emit('ping-test', { timestamp: startTime });
                
                socket.on('ping-test-response', (data) => {
                    const roundTrip = Date.now() - data.clientTimestamp;
                    console.log('   🏓 Ping test: OK');
                    console.log('   ⚡ Round-trip:', roundTrip, 'ms');
                    socket.disconnect();
                    resolve();
                });
            });

            socket.on('connect_error', (error) => {
                clearTimeout(timeout);
                reject(error);
            });
        });

    } catch (error) {
        console.log('   ❌ Socket.IO: FAILED');
        console.log('   🔍 Error:', error.message);
        return false;
    }

    console.log('\n🎉 All tests passed! Socket server is healthy.\n');
    
    console.log('🌐 Access URLs:');
    console.log('   • Health check: http://localhost:1002/health');
    console.log('   • Test page: http://localhost:1001/socket-test.html');
    console.log('   • WebRTC page: http://localhost:1001/webrtc');
    
    return true;
}

// Run the health check
healthCheck()
    .then((success) => {
        process.exit(success ? 0 : 1);
    })
    .catch((error) => {
        console.error('\n💥 Health check crashed:', error.message);
        process.exit(1);
    });
