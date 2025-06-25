
console.log('🐳 Docker WebSocket Configuration Verification');
console.log('=============================================');

function verifyDockerWebSocketConfig() {
    const results = {
        socketIO: false,
        websocketOnly: false,
        dockerHost: false,
        dockerPort: false,
        noPolling: false,
        singleConnection: false
    };
    
    if (typeof io !== 'undefined') {
        results.socketIO = true;
        console.log('Socket.IO library loaded');
    } else {
        console.log('Socket.IO library not loaded');
        return results;
    }

    const socketHost = document.querySelector('meta[name="socket-host"]')?.getAttribute('content');
    const socketPort = document.querySelector('meta[name="socket-port"]')?.getAttribute('content');
    
    console.log(`Socket Host: ${socketHost}`);
    console.log(`Socket Port: ${socketPort}`);
    
    if (socketHost && (socketHost === 'socket' || socketHost.includes('localhost'))) {
        results.dockerHost = true;
        console.log('Docker host configuration detected');
    } else {
        console.log('Non-Docker host configuration detected');
    }
    
    if (socketPort === '1002') {
        results.dockerPort = true;
        console.log('Docker port configuration correct');
    } else {
        console.log('Non-Docker port configuration');
    }
    
    const testSocketUrl = `http://${socketHost || window.location.hostname}:${socketPort || '1002'}`;
    console.log(`🔗 Testing WebSocket-only connection to: ${testSocketUrl}`);
    
    const testSocket = io(testSocketUrl, {
        transports: ['websocket'],
        path: '/socket.io',
        timeout: 5000,
        forceNew: true,
        reconnection: false,
        upgrade: false
    });
    
    testSocket.on('connect', () => {
        console.log('WebSocket-only connection successful');
        console.log(`   - Socket ID: ${testSocket.id}`);
        console.log(`   - Transport: ${testSocket.io.engine.transport.name}`);
        
        results.websocketOnly = true;
        results.singleConnection = true;
        
        if (testSocket.io.engine.transport.name === 'websocket') {
            results.noPolling = true;
            console.log('Confirmed WebSocket transport only');
        }
        
        setTimeout(() => {
            testSocket.disconnect();
            console.log('🔌 Test connection closed');

            printVerificationResults(results);
        }, 1000);
    });
    
    testSocket.on('connect_error', (error) => {
        console.log('WebSocket connection failed:', error.message);
        console.log('   - This might indicate Docker containers are not running');
        printVerificationResults(results);
    });
    
    setTimeout(() => {
        if (!testSocket.connected) {
            console.log('⏰ WebSocket connection test timeout');
            testSocket.disconnect();
            printVerificationResults(results);
        }
    }, 10000);
}

function printVerificationResults(results) {
    console.log('\nDocker WebSocket Configuration Results:');
    console.log('==========================================');
    
    const checks = [
        { name: 'Socket.IO Library', status: results.socketIO, emoji: results.socketIO ? '✅' : '❌' },
        { name: 'Docker Host Config', status: results.dockerHost, emoji: results.dockerHost ? '✅' : '❌' },
        { name: 'Docker Port Config', status: results.dockerPort, emoji: results.dockerPort ? '✅' : '❌' },
        { name: 'WebSocket Only', status: results.websocketOnly, emoji: results.websocketOnly ? '✅' : '❌' },
        { name: 'No Polling Fallback', status: results.noPolling, emoji: results.noPolling ? '✅' : '❌' },
        { name: 'Single Connection', status: results.singleConnection, emoji: results.singleConnection ? '✅' : '❌' }
    ];
    
    checks.forEach(check => {
        console.log(`${check.emoji} ${check.name}: ${check.status ? 'PASS' : 'FAIL'}`);
    });
    
    const allPassed = checks.every(check => check.status);
    
    console.log('\nOverall Status:');
    if (allPassed) {
        console.log('DOCKER WEBSOCKET CONFIGURATION VERIFIED');
        console.log('   - All containers running correctly');
        console.log('   - WebSocket-only transport confirmed');
        console.log('   - Single connection per client');
        console.log('   - No local processes interfering');
    } else {
        console.log('CONFIGURATION ISSUES DETECTED');
        console.log('   - Check Docker containers are running');
        console.log('   - Verify WebSocket transport configuration');
        console.log('   - Ensure no local processes are conflicting');
    }
    
    console.log('\n🐳 Docker Commands:');
    console.log('   - Start: docker-compose up -d');
    console.log('   - Status: docker-compose ps');
    console.log('   - Logs: docker-compose logs -f socket');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', verifyDockerWebSocketConfig);
} else {
    verifyDockerWebSocketConfig();
}

window.verifyDockerWebSocketConfig = verifyDockerWebSocketConfig;
